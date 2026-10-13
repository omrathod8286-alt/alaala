from datetime import UTC, datetime, timedelta

import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session as DBSession

from .config import settings
from .database import session
from .models import Record

bearer = HTTPBearer(auto_error=False)


def token(subject):
    t = datetime.now(UTC)
    return jwt.encode(
        {
            "sub": subject,
            "iss": "aegis",
            "aud": "aegis-api",
            "iat": t,
            "exp": t + timedelta(minutes=settings().token_minutes),
        },
        settings().signing_secret,
        algorithm="HS256",
    )


def principal(request: Request, credentials=Depends(bearer), db: DBSession = Depends(session)):
    if settings().mode != "demo":
        raise HTTPException(503, "Production identity adapter not configured")
    if not credentials:
        raise HTTPException(401, "Bearer token required")
    try:
        claims = jwt.decode(
            credentials.credentials,
            settings().signing_secret,
            algorithms=["HS256"],
            audience="aegis-api",
            issuer="aegis",
            options={"require": ["sub", "exp", "iat"]},
        )
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired token") from None
    user = db.get(Record, claims["sub"])
    if user and user.kind == "identity":
        request.state.audit_actor = (user.id, user.org)
        request.state.token_expiry = claims["exp"]
    if not user or user.kind != "identity" or user.body["status"] != "active":
        raise HTTPException(403, "Identity inactive or revoked")
    return user


PERMISSIONS = {
    "Admin": {
        "identity.create",
        "identity.suspend",
        "identity.revoke",
        "credential.issue",
        "credential.revoke",
        "asset.mint",
        "asset.assign",
        "asset.transfer.request",
        "asset.transfer.approve",
        "asset.archive",
        "audit.read",
        "demo.control",
    },
    "Manager": {
        "credential.issue",
        "credential.revoke",
        "asset.mint",
        "asset.assign",
        "asset.transfer.request",
        "asset.transfer.approve",
        "asset.archive",
    },
    "Auditor": {"audit.read"},
    "User": {"asset.transfer.request"},
}


def permitted(user, action):
    return any(action in PERMISSIONS.get(role, set()) for role in user.body["roles"])
