import { createHash } from "node:crypto";
import { Context, Contract } from "fabric-contract-api";
export type Identity = {
  id: string;
  org: string;
  binding: string;
  status: "active" | "suspended" | "revoked";
  roles: string[];
};
export type Asset = {
  id: string;
  org: string;
  issuer: string;
  owner: string | null;
  metadataHash: string;
  created: string;
  updated: string;
  status: "minted" | "active" | "archived";
  pending?: { recipient: string; requester: string; expires: number };
};
export const permissions: Record<string, string[]> = {
  Admin: [
    "asset.request",
    "identity.manage",
    "credential.manage",
    "asset.mint",
    "asset.assign",
    "asset.approve",
    "asset.archive",
    "audit.read",
  ],
  Manager: [
    "asset.request",
    "credential.manage",
    "asset.mint",
    "asset.assign",
    "asset.approve",
    "asset.archive",
  ],
  Auditor: ["audit.read"],
  User: ["asset.request"],
};
export function id(value: string) {
  if (!/^[a-zA-Z0-9:._-]{1,120}$/.test(value)) throw new Error("Invalid ID");
  return value;
}
export function hash(value: string) {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error("Invalid SHA-256");
  return value;
}
export function msp(ctx: Context) {
  const org = ctx.clientIdentity.getMSPID();
  if (!["Org1MSP", "Org2MSP"].includes(org))
    throw new Error("Untrusted organization");
  return org;
}
export function binding(ctx: Context) {
  return createHash("sha256")
    .update(ctx.clientIdentity.getIDBytes())
    .digest("hex");
}
export function seconds(ctx: Context) {
  return Number(ctx.stub.getTxTimestamp().seconds.toString());
}
export function timestamp(ctx: Context) {
  return new Date(seconds(ctx) * 1000).toISOString();
}
export async function read<T>(
  ctx: Context,
  kind: string,
  key: string,
): Promise<T> {
  const bytes = await ctx.stub.getState(`${kind}:${id(key)}`);
  if (!bytes.length) throw new Error("Record not found");
  return JSON.parse(bytes.toString()) as T;
}
export async function unique(ctx: Context, kind: string, key: string) {
  if ((await ctx.stub.getState(`${kind}:${id(key)}`)).length)
    throw new Error("Record already exists");
}
export async function write(
  ctx: Context,
  kind: string,
  key: string,
  value: unknown,
) {
  await ctx.stub.putState(
    `${kind}:${id(key)}`,
    Buffer.from(JSON.stringify(value)),
  );
}
export async function caller(
  ctx: Context,
  permission?: string,
): Promise<Identity> {
  const did = ctx.clientIdentity.getAttributeValue("aegis.did");
  if (!did) throw new Error("DID certificate attribute required");
  const who = await read<Identity>(ctx, "identity", did);
  if (
    who.org !== msp(ctx) ||
    who.binding !== binding(ctx) ||
    who.status !== "active"
  )
    throw new Error("Identity binding inactive or invalid");
  if (
    permission &&
    !who.roles.some((r) => permissions[r]?.includes(permission))
  )
    throw new Error("Permission denied");
  return who;
}
export async function owner(ctx: Context, key: string, org: string) {
  const who = await read<Identity>(ctx, "identity", key);
  if (who.status !== "active" || who.org !== org)
    throw new Error("Recipient inactive or foreign organization");
  return who;
}
export async function asset(ctx: Context, key: string, who: Identity) {
  const value = await read<Asset>(ctx, "asset", key);
  if (value.org !== who.org) throw new Error("Organization boundary");
  return value;
}
export async function emit(
  ctx: Context,
  who: Identity,
  action: string,
  subject: string,
) {
  const event = {
    org: who.org,
    actor: who.id,
    action,
    subject,
    tx: ctx.stub.getTxID(),
    time: timestamp(ctx),
  };
  await ctx.stub.putState(
    ctx.stub.createCompositeKey("audit", [who.org, ctx.stub.getTxID()]),
    Buffer.from(JSON.stringify(event)),
  );
  ctx.stub.setEvent("aegis.domain", Buffer.from(JSON.stringify(event)));
}
export class TrustContract extends Contract {
  constructor(name: string) {
    super(name);
  }
}
