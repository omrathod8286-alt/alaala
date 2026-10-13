# Data boundaries
| Store | Permitted data | Excluded data |
|---|---|---|
| Fabric channel | Pseudonymous DID, MSP, binding digest, credential digest/status, policy/version, asset ID/issuer/owner, metadata SHA-256, transaction time/status, provenance commitments | Names, emails, files, secrets, session tokens |
| Private Data Collection | Minimal bilateral confidential commitments if membership warrants it | Raw credentials, keys, unnecessary PII |
| PostgreSQL | Encrypted PII/profile, approvals, event projection, outbox, audit, idempotency results | Signing keys |
| Redis | Expiring rate-limit/session/replay counters | Permanent trust records |
| S3 | Validated private files, encrypted versioned metadata, short-lived downloads | Public sensitive objects |
| Secret manager | CA/gateway keys, DB/object credentials, JWT keys | Browser exposure |

DID-style identifiers use a project-specific, unregistered method, not a claim of interoperable DID compliance. Credential commitments are not W3C verifiable credentials; signed VC issuance is deferred. Binding requires proof of possession before activation. Never derive role/identity binding from untrusted request headers.
