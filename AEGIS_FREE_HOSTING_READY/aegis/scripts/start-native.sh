#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/setup.py
if [[ ! -x .venv/bin/python ]]; then
  python3 -m venv .venv
fi
.venv/bin/python -m pip install -r backend/requirements.lock
npm --prefix frontend ci
npm --prefix chaincode ci
echo
echo "Native setup complete."
echo "Start the API in terminal 1: cd backend && ../.venv/bin/uvicorn app.main:app --env-file ../.env --host 127.0.0.1 --port 8000"
echo "Start the UI in terminal 2: cd frontend && npm run dev"
