import { IdentityRegistry } from "./identity";
import { CredentialRegistry } from "./credentials";
import { RolePolicyRegistry } from "./policies";
import { AssetRegistry } from "./assets";
import { OwnershipTransfer } from "./transfers";
import { AuditRegistry } from "./audit";
export const contracts = [
  IdentityRegistry,
  CredentialRegistry,
  RolePolicyRegistry,
  AssetRegistry,
  OwnershipTransfer,
  AuditRegistry,
];
