# Permission matrix
| Capability | Admin | Manager | Auditor | User |
|---|---|---|---|---|
| Organization identity onboarding/lifecycle | Yes | No | Read | Own read |
| Issue/revoke credential | Yes | Yes | Read | Own read |
| Grant role/change policy | Approval required | No | Read | No |
| Mint/assign asset | Yes | Yes | Read | No |
| Request own asset transfer | Yes | Yes | No | Yes |
| Approve transfer | Yes, independent | Yes, independent | No | No |
| Verify/provenance | Organization | Organization | Organization | Organization |
| Audit investigation | Yes | No | Yes | No |
| Demo controls | Yes in demo | No | No | No |

All actions require active identities and matching organization. Owner checks apply to user transfers. A requester cannot approve their own request. Pending transfers expire. Sensitive role elevation and cross-org workflows remain disabled until approval integration is complete. Demo fixtures are not enrollment credentials.
