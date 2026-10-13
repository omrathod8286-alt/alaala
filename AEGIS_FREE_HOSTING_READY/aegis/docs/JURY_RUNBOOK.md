# Jury runbook
1. Start the explicitly labelled demo using README instructions.
2. Choose Org 1 Administrator on login.
3. Open Jury Demo, Reset, select Golden Journey, Run journey.
4. Pause/Step works between API operations; speed controls spacing, not network transaction speed.
5. Inspect Assets and Provenance; select demo-asset. Owner should be recipient; history includes mint/assign/request/approve.
6. Inspect Audit; unauthorized mint is denied. Sign out and choose Auditor to repeat investigation without write privileges.
7. Reset before selecting another scenario. Scenario 9 demonstrates tenant isolation, not a completed bilateral transfer.
8. Explain truthfully: demo roles/organizations are fixtures, credentials are hash commitments, local ledger is simulated. Live Fabric proof, role approvals and signed VC issuance are not validated.

Script equivalent: `python3 scripts/demo.py golden`. Reset: `python3 scripts/demo.py reset`. Scripts call the same API/domain authorization used by manual demo operations. Fixed scenario IDs ensure reproducible state; timestamps/correlation IDs are real runtime values. Do not claim bit-for-bit deterministic signed transactions.
