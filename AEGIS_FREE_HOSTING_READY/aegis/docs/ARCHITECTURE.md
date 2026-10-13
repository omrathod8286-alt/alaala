# Aegis architecture
FastAPI modular monolith: authentication, identity, credentials, policy, assets, transfer, audit and simulation domains. React/TypeScript working surface. PostgreSQL operational state, Redis security counters, S3 metadata. A separate internal Node Fabric Gateway adapter will hold per-user signing keys; APIs never accept a caller-supplied MSP, role or signer. Production workflows are disabled until that adapter is live and tested. No service-account impersonation.

## Trust and tenancy
JWT identifies a subject, not its current permissions. Load active identity and roles on every request. Organization scope is mandatory. Cross-organization transfers require recipient acceptance and approvals from both organizations. Admin is organization-scoped, never globally privileged. Roles are policy data; granting Admin requires an independent administrator. Fabric validates enrolled caller MSP, DID certificate attribute, active ledger binding and ledger roles independently. A bootstrap CA attribute is restricted to initial administrative enrollment.

## Consistency
Fabric is authoritative for trust records. Production writes must await commit, then project ledger events using transaction-ID deduplication. An outbox couples operational writes and domain notifications. Never claim atomic PostgreSQL/Fabric transactions. Failed endorsement cannot persist a chaincode denial event: backend security audit must record denial independently, with periodic hash anchoring after verification. Event consumers use resumable checkpoints.

## Deployment boundaries
Native demo services: React UI, FastAPI, and SQLite. PostgreSQL, Redis, private object storage, and a live Fabric network are future integrations, not active services in this checkpoint. The intended Fabric target includes two organizations, peers, organization CAs, TLS, mutual authentication, an application channel, and private-data/endorsement controls. Do not put personally identifying information in shared ledger records.

## Current implementation scope
The executable demo is isolated, labelled, deterministic and uses SQLite for local tests. It is not Fabric, PostgreSQL, Redis or S3. Production mode exposes health only and refuses demo sessions/business operations. Subsequent integration must replace the demo repository behind explicit adapters, never fall back on gateway errors.
