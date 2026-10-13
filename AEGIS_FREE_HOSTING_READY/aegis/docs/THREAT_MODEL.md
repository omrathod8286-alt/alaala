# Threat model
Assets: identity binding, role/policy authority, ownership/provenance, private metadata and audit integrity. Adversaries: compromised user/session, malicious organization member/admin, exposed gateway key, external caller, dependency compromise.

| Threat | Current mitigation | Remaining work |
|---|---|---|
| UI role/header spoof | API loads roles server-side; chaincode loads certificate-bound ledger identity | OIDC mapping and per-user gateway signing |
| Tenant IDOR | Organization checks on reads/writes, foreign recipient rejection | Bilateral governance/approval |
| Replay/duplicate mint | Actor/key/body idempotency, unique IDs | Distributed request serialization, nonce retention |
| Revoked token | Active identity rechecked every API request | CA CRL refresh, signed VC revocation lists |
| Transfer abuse | Owner request, distinct approver, expiry, recipient/owner activity | Recipient acceptance, cross-org approval, policy versions |
| Secrets/data disclosure | No secrets shipped; channel commitments only; bearer kept in browser memory | Vault/HSM, TLS, field encryption, secure uploads |
| Audit forgery | Domain events/API audit records | Append-only privileges, external hash anchoring and retention |
| DoS | Demo in-process limiter, bounded results, bounded SSE | Redis limiter, stream quotas, request size cap, pagination |
| Supply-chain attack | Lockfiles, CI scans | Scan remediation and pinned images/digests |

Demo login deliberately permits selecting a seeded persona. Restrict demo to loopback or isolated jury LAN; never expose it to enterprise users. SQLite simulation does not provide immutable blockchain auditing or strong multi-worker concurrency. Production mode refuses business traffic until adapters are available. Browser Authorization headers avoid cookie CSRF; if authentication moves to cookies, implement SameSite, origin checks and anti-CSRF tokens. TLS/security headers must be enforced at ingress. Raw uploaded files are not accepted in this checkpoint.
