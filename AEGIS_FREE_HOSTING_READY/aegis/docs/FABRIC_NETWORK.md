# Fabric deployment
Production target: two organizations, two peers each; three independently operated Raft orderers; one CA plus TLS CA per organization; CouchDB per peer; mutual TLS, private application channel. Both MSPs endorse trust changes. Governance must decide channel participation before organization addition. Backup ledger/CouchDB, CA databases and MSP material; regularly test recovery. This target topology is documented, not provisioned by the current checkpoint.

## Development network
The planned development topology uses the official Hyperledger Fabric test network with two organizations and a single orderer. A live network has not been deployed or validated in this checkpoint. Use the official Fabric documentation for native prerequisites and deployment steps appropriate to the chosen release.

Register per-user enrollments with CA-controlled `aegis.did` certificate attributes. The one-time initial administrator also needs `aegis.bootstrap=true`. Do not permit clients to self-assign either attribute. Bootstrap writes a certificate digest from getIDBytes and records initialization once per MSP. Later activation requires CA enrollment, canonical certificate digest and proof of possession before calling IdentityRegistry.Create. That application orchestration is not implemented yet.

Chaincode contains six named contracts. RolePolicyRegistry exposes a matrix only; approved role grants are pending. Registry credentials are commitments, not signed VC documents. State revocation supplements CA certificate revocation; CA CRLs and channel MSP updates are separate required operations.

State uses transaction timestamps, certificate attributes, caller MSP and ledger identity binding. Failed transactions cannot emit persistent denial audits. Application security denials are an off-chain audit responsibility.

## Private data
Current chaincode places only pseudonymous commitments on the shared private channel; no PDC is configured. Before bilateral confidential workflows, add a versioned collection with both member MSPs, memberOnlyRead/write, explicit endorsement and agreed retention. Changing collection policy needs chaincode lifecycle approvals. Never treat PDC as a replacement for object encryption or secret management.
