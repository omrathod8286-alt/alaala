# Aegis project status

## Completed
- Empty repository inspected; architecture, role matrix, data boundaries written first.
- P0 configuration validation, modular API/repository boundaries, strict schemas, bearer expiry, tenant authorization, audit events, idempotency, correlation IDs, security headers, demo rate limit, health/metrics.
- Isolated demo identity, credential commitments, unique assets, independent transfer approval, archive, verification and provenance workflows.
- React working surface, role-specific demo entry, registries, timeline, verification, audit and ten jury scenario definitions through shared command APIs. Browser execution is unvalidated.
- TypeScript chaincode identity, credential, assets, transfer and audit modules; read-only policy matrix. Unit tests use a mock stub, not a live Fabric ledger.

## Current
P0 code checkpoint validated; live Fabric integration is the next blocking milestone. Application is a labelled demo, not production-ready.

## Next
1. Using native Fabric tooling: deploy Fabric test-network, enroll per-user CA identities, test chaincode metadata/deployment and gateway signer binding.
2. Implement gateway submit/commit/event projection, production OIDC/CA proof of possession, PostgreSQL migrations/outbox, Redis limits and S3 secure uploads.
3. Approved/versioned role policy mutation, temporary grants, recovery/rotation, signed verifiable credentials and bilateral cross-org transfer.
4. Organization management, notifications, interactive relationship graph, websocket support, HA deployment, asset revocation, dynamic role/ABAC policies and production security hardening.

## Blockers
- Live Fabric runtime and production integrations have not been validated in the current checkpoint.
- Taste documentation reviewed; GitHub skill source retrieval unavailable. Design uses published guidance, not copied skill code.

## Tests
- `cd backend && ../.venv/bin/ruff check app tests`: passed.
- `cd backend && ../.venv/bin/ruff format --check app tests`: 13 files formatted.
- `cd backend && ../.venv/bin/pytest -q`: 12 passed, one upstream Starlette/httpx deprecation warning.
- `cd frontend && npm run build`: TypeScript and Vite build passed.
- `cd chaincode && npm run build && npm test`: TypeScript passed; 5 unit tests passed against a mock Fabric context. Runner uses `node --import tsx` to avoid restricted IPC sockets.
- `python scripts/demo.py golden`: passed against a locally started HTTP API; unauthorized mint returned 403; final verification valid.
- `npm audit --audit-level=high` in frontend and chaincode: zero reported vulnerabilities.
- `.venv/bin/pip-audit -r backend/requirements.lock`: zero reported vulnerabilities across 39 locked dependencies.
- `cd frontend && npm run test:e2e`: both tests could not launch; Chromium executable unavailable. Browser download failed with truncated ZIP. UI interaction/responsiveness remains unvalidated.
- PostgreSQL migration and live Fabric deployment: not run; these integrations remain unvalidated.

## Architecture decisions
- Local implementation uses the explicitly requested React/FastAPI/Fabric stack, rather than substituting hosted Worker backend.
- Production defaults fail closed. Demo sessions/reset are disabled in production.
- Demo repository is SQLite and explicitly not a blockchain.
- Fixed seeded demo roles; no direct administrative grant bypass.
- Sensitive role changes and cross-org transfers disabled rather than simulated as completed integrations.
- SSE authenticated event stream plus polling UI; WebSocket support deferred.

## Module coverage at this checkpoint
| Requested module | Implemented now | Still needed |
|---|---|---|
| Authentication | Demo personas, JWT expiry, active-identity checks | OIDC/CA enrollment, session/recovery controls |
| Identity wallet/profile | Demo directory and DID-style records | Proof of possession, wallet binding/rotation |
| Identity administration | Demo onboarding/suspend/revoke; chaincode validation | CA CRL orchestration, approved admin recovery |
| Role & policy management | Fixed role matrix, server/chaincode permission checks | Data-driven roles, approved changes, ABAC, temporary grants |
| Digital asset registry | Demo registry and native chaincode uniqueness | Live ledger projection, pagination/search |
| Mint/allocation | Demo and chaincode | Live gateway and metadata upload integration |
| Ownership transfer | Owner request and distinct approver | Recipient acceptance, bilateral transfer, policy versioning |
| Verification | Hash/state/owner checks | Live Fabric attestation |
| Provenance explorer | Demo timeline; chaincode history query | Live provenance projection and relationship graph |
| Audit/security | Demo denial audit, contract domain events, SSE | Append-only storage, external anchors, durable outbox |
| Organization management | Two fixture organizations and isolation | Governance/onboarding administration |
| Notifications | Event pipeline interface/SSE | User notification store and delivery |
| System health | Liveness, fail-closed readiness, counters | Actual dependency probes and tracing exporters |
| Jury demo | Ten scenario definitions, reset/pause/speed/step | Browser validation; full requested org/role Golden Journey |

## Delivery decisions
- Source checkpoint includes lockfiles, native setup/reset/demo/check scripts, CI, initial SQL migration and runbooks.
- Generated .env, credentials, local DBs, dependency folders and build outputs are excluded.
- No hosting or production deployment performed. The requested stack is preserved.
