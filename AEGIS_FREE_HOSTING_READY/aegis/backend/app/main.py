import asyncio
import json
import logging
import time
import uuid
from collections import defaultdict, deque
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session as DBSession

from .config import settings
from .database import Session, initialize_demo, session
from .events import event_dict
from .models import Event, Idempotency, Record
from .schemas import Command, Login, Verify
from .security import permitted, principal, token
from .seed import PERSONAS, seed
from .service import DomainService

config = settings()
logger = logging.getLogger("aegis")
logging.basicConfig(level=logging.INFO)
limits: dict[str, deque] = defaultdict(deque)
counters = {"requests": 0, "denials": 0}


@asynccontextmanager
async def lifespan(app):
    if config.mode == "demo":
        initialize_demo()
        with Session() as db:
            seed(db)
    yield


app = FastAPI(title="Aegis Identity & Asset API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
    expose_headers=["X-Correlation-ID"],
    allow_credentials=False,
)


@app.middleware("http")
async def secure(request: Request, call_next):
    correlation = str(uuid.uuid4())
    request.state.correlation = correlation
    address = request.client.host if request.client else "unknown"
    timestamp = time.monotonic()
    queue = limits[address]
    while queue and queue[0] < timestamp - 60:
        queue.popleft()
    if len(queue) >= 180:
        return Response(status_code=429, headers={"Retry-After": "60", "X-Correlation-ID": correlation})
    queue.append(timestamp)
    counters["requests"] += 1
    response = await call_next(request)
    if response.status_code in {401, 403}:
        counters["denials"] += 1
        actor = getattr(request.state, "audit_actor", None)
        if actor:
            with Session() as audit_db:
                audit_db.add(
                    Event(
                        org=actor[1],
                        actor=actor[0],
                        action="http.authorization.denied",
                        subject="api",
                        outcome="denied",
                        correlation=correlation,
                    )
                )
                audit_db.commit()
    response.headers.update(
        {
            "X-Correlation-ID": correlation,
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "no-referrer",
            "Cache-Control": "no-store",
        }
    )
    logger.info(
        json.dumps(
            {
                "correlation": correlation,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "mode": config.mode,
            }
        )
    )
    return response


@app.get("/health/live")
def live():
    return {"status": "up", "mode": config.mode, "fabric": "not-connected"}


@app.get("/health/ready")
def ready():
    if config.mode == "production":
        raise HTTPException(503, "Fabric, identity and storage adapters require integration")
    with Session() as db:
        db.execute(select(Record.id).limit(1))
    return {"ready": True, "mode": "demo", "ledger": "simulated"}


@app.get("/metrics")
def metrics(user=Depends(principal)):
    if not permitted(user, "audit.read"):
        raise HTTPException(403, "Audit permission required")
    return Response(
        "\n".join(f"aegis_{key}_total {value}" for key, value in counters.items()) + "\n",
        media_type="text/plain",
    )


@app.post("/api/demo/session")
def login(payload: Login, request: Request, db: DBSession = Depends(session)):
    if config.mode != "demo":
        raise HTTPException(404, "Demo disabled")
    did = f"did:aegis:{payload.persona}"
    user = db.get(Record, did)
    if user:
        request.state.audit_actor = (user.id, user.org)
    if not user or user.body["status"] != "active":
        raise HTTPException(403, "Demo identity inactive")
    return {
        "access_token": token(did),
        "token_type": "bearer",
        "expires_in": config.token_minutes * 60,
        "source": "simulation",
    }


@app.get("/api/me")
def me(user=Depends(principal)):
    return {"id": user.id, "org": user.org, "roles": user.body["roles"], "mode": config.mode}


@app.get("/api/records/{kind}")
def records(kind: str, user=Depends(principal), db: DBSession = Depends(session)):
    if kind not in {"identity", "credential", "asset"}:
        raise HTTPException(404, "Unknown record type")
    query = select(Record).where(Record.org == user.org, Record.kind == kind).order_by(Record.id).limit(200)
    if kind in {"identity", "credential"} and user.body["roles"] == ["User"]:
        query = (
            query.where(Record.id == user.id)
            if kind == "identity"
            else query.where(Record.body["owner"].as_string() == user.id)
        )
    return [
        {"id": r.id, "org": r.org, "body": r.body, "version": r.version, "source": "simulation"}
        for r in db.scalars(query)
    ]


@app.post("/api/commands")
def command(
    payload: Command,
    request: Request,
    idempotency_key: str = Header(..., min_length=8, max_length=80),
    user=Depends(principal),
    db: DBSession = Depends(session),
):
    try:
        return DomainService(db).execute(user, payload, idempotency_key, request.state.correlation)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Concurrent operation conflict; retry with same idempotency key") from None


@app.post("/api/assets/{asset_id}/verify")
def verify(asset_id: str, payload: Verify, user=Depends(principal), db: DBSession = Depends(session)):
    item = db.get(Record, asset_id)
    if not item or item.kind != "asset" or item.org != user.org:
        raise HTTPException(404, "Asset not found")
    owner = db.get(Record, item.body.get("owner")) if item.body.get("owner") else None
    matches = item.body["metadata_hash"] == payload.metadata_hash
    valid = matches and item.body["status"] == "active" and bool(owner and owner.body["status"] == "active")
    return {
        "matches": matches,
        "valid": valid,
        "status": item.body["status"],
        "source": "simulation",
        "proof": "demo hash comparison; not a Fabric proof",
    }


@app.get("/api/audit")
def audits(after: int = 0, user=Depends(principal), db: DBSession = Depends(session)):
    if not permitted(user, "audit.read"):
        raise HTTPException(403, "Audit permission required")
    return [
        event_dict(e)
        for e in db.scalars(
            select(Event)
            .where(Event.org == user.org, Event.sequence > after)
            .order_by(Event.sequence)
            .limit(200)
        )
    ]


@app.get("/api/events")
def events(request: Request, after: int = 0, user=Depends(principal)):
    if not permitted(user, "audit.read"):
        raise HTTPException(403, "Audit permission required")

    async def stream():
        cursor = after
        # Streams are bounded, requiring fresh authentication each minute.
        for _ in range(60):
            if time.time() >= request.state.token_expiry or await request.is_disconnected():
                break
            with Session() as db:
                current = db.get(Record, user.id)
                if not current or current.body["status"] != "active" or not permitted(current, "audit.read"):
                    break
                batch = list(
                    db.scalars(
                        select(Event)
                        .where(Event.org == user.org, Event.sequence > cursor)
                        .order_by(Event.sequence)
                        .limit(100)
                    )
                )
                for event in batch:
                    cursor = event.sequence
                    yield f"id: {cursor}\ndata: {json.dumps(event_dict(event))}\n\n"
            yield ": heartbeat\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(stream(), media_type="text/event-stream")


@app.post("/api/demo/reset")
def reset(user=Depends(principal), db: DBSession = Depends(session)):
    if config.mode != "demo" or not permitted(user, "demo.control"):
        raise HTTPException(403, "Demo administrator required")
    db.execute(delete(Idempotency))
    db.execute(delete(Event))
    db.execute(delete(Record))
    db.commit()
    seed(db)
    return {"reset": True, "source": "simulation", "personas": list(PERSONAS)}
