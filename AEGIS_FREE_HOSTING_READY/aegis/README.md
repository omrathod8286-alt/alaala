# AEGIS: Identity, Access and Digital Ownership

**Native local demo and validated foundation checkpoint. Not a completed production deployment.**

AEGIS demonstrates organization-scoped identity and access rules, credential commitments, digital-asset lifecycle operations, transfer approval, verification, provenance, and audit-oriented views. The runnable demo uses a React/TypeScript frontend, a FastAPI backend, and a local SQLite database. The Hyperledger Fabric chaincode is a separate package with unit tests against a mock context; it is not connected to the demo API.

Production identity enrollment, live Fabric gateway submission, committed-ledger event projection, PostgreSQL/Redis/object-storage adapters, signed verifiable credentials, approved dynamic policy changes, and cross-organization transfer governance remain incomplete. The application must not be presented as a production identity platform.

## Free hosted demonstration\n\nSee [`DEPLOY_FREE_HOSTING.md`](DEPLOY_FREE_HOSTING.md) for GitHub + Render + Vercel deployment steps. The hosted version remains a simulation and does not connect to a live Fabric ledger.\n\n## Requirements

- Python 3.12 or newer
- Node.js 22 or newer
- npm

## 1. Prepare local configuration

Run these commands from the `aegis` project directory:

```bash
python3 scripts/setup.py
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.lock
npm --prefix frontend ci
npm --prefix chaincode ci
```

On Windows PowerShell, create and activate the virtual environment with:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.lock
npm --prefix frontend ci
npm --prefix chaincode ci
python scripts/setup.py
```

If PowerShell blocks activation, you can avoid activation and call `.venv\Scripts\python.exe -m pip install -r backend\requirements.lock` instead. Do not run PowerShell commands in Command Prompt, or Command Prompt commands in PowerShell.

## 2. Start the backend

Open a terminal in the `aegis` directory.

Linux/macOS/WSL:

```bash
cd backend
../.venv/bin/uvicorn app.main:app --env-file ../.env --host 127.0.0.1 --port 8000
```

Windows PowerShell:

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --env-file ..\.env --host 127.0.0.1 --port 8000
```

Keep this terminal running.

## 3. Start the frontend

Open a second terminal in the `aegis` directory.

```bash
cd frontend
npm run dev
```

Open `http://127.0.0.1:5173`. Select a seeded demo identity, open **Jury Demo**, reset the scenario, and run the journey. API documentation is at `http://127.0.0.1:8000/docs`; health endpoints are `/health/live` and `/health/ready`.

The demo login is intentionally permissive and must never be used for real accounts or sensitive data.

## 4. Run validation

From the project root:

```bash
bash scripts/check.sh
```

The full browser tests require Playwright Chromium. If it is installed and available, run:

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

The previously recorded checkpoint passed 12 API/security tests, five chaincode mock-context tests, backend lint/format checks, frontend build, chaincode build, and the scripted demo. Browser automation was not validated because the browser runtime could not be installed in the earlier environment. Re-run checks on your machine before relying on these results.

## Repository guide

- `backend/app/` — configuration, repository, authorization, command service, event stream, seed fixtures, and adapter interfaces.
- `backend/tests/` — API/security and workflow tests.
- `chaincode/src/` — identity, credential, policy, asset, transfer, and audit contracts.
- `frontend/src/` — React workspace, accessible forms, registries, ownership timeline, and demo controller.
- `scripts/` — setup, checks, API demo/reset, and Fabric development deployment.
- `docs/` — architecture, data boundaries, role matrix, network plan, threat model, design, jury runbook, troubleshooting, and validation notes.

## Important boundaries

- The local SQLite records are simulation data, not immutable ledger evidence.
- Chaincode tests use a mock Fabric context, not a deployed network.
- The current demo does not implement production CA enrollment or proof-of-possession identity binding.
- The application intentionally fails closed when production dependencies are missing.
- No production deployment or live-ledger integration has been validated.
