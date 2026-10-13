import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { Context } from "fabric-contract-api";
import { IdentityRegistry } from "../src/identity";
import { AssetRegistry } from "../src/assets";
import { OwnershipTransfer } from "../src/transfers";
import { CredentialRegistry } from "../src/credentials";
import { caller } from "../src/trust";
function network() {
  const state = new Map<string, Buffer>();
  let n = 0;
  let clock = 1000;
  const ctx = (did: string, org = "Org1MSP", bootstrap = false): Context =>
    ({
      clientIdentity: {
        getMSPID: () => org,
        getIDBytes: () => Buffer.from(did),
        getAttributeValue: (key: string) =>
          key === "aegis.did"
            ? did
            : key === "aegis.bootstrap" && bootstrap
              ? "true"
              : null,
      },
      stub: {
        getState: async (key: string) => state.get(key) || Buffer.alloc(0),
        putState: async (key: string, value: Buffer) => {
          state.set(key, value);
        },
        getTxTimestamp: () => ({ seconds: clock }),
        getTxID: () => `tx-${++n}`,
        createCompositeKey: (key: string, parts: string[]) =>
          [key, ...parts].join(":"),
        setEvent: () => {},
      },
    }) as unknown as Context;
  return {
    state,
    ctx,
    advance: () => {
      clock += 901;
    },
  };
}
async function fixture() {
  const net = network();
  const identities = new IdentityRegistry();
  const admin = net.ctx("did:aegis:admin", "Org1MSP", true);
  await identities.Bootstrap(admin, "did:aegis:admin");
  for (const who of ["owner", "recipient"])
    await identities.Create(
      admin,
      `did:aegis:${who}`,
      createHash("sha256").update(`did:aegis:${who}`).digest("hex"),
    );
  return {
    ...net,
    identities,
    admin,
    owner: net.ctx("did:aegis:owner"),
    assets: new AssetRegistry(),
    transfers: new OwnershipTransfer(),
  };
}
test("unique mint, assignment and independent approved transfer", async () => {
  const f = await fixture();
  await f.assets.Mint(f.admin, "asset-1", "a".repeat(64));
  await assert.rejects(
    () => f.assets.Mint(f.admin, "asset-1", "a".repeat(64)),
    /exists/,
  );
  await f.assets.Assign(f.admin, "asset-1", "did:aegis:owner");
  await f.transfers.Request(f.owner, "asset-1", "did:aegis:recipient");
  await f.transfers.Approve(f.admin, "asset-1");
  assert.equal(
    JSON.parse(await f.assets.Get(f.admin, "asset-1")).owner,
    "did:aegis:recipient",
  );
  assert.equal(
    JSON.parse(await f.assets.Verify(f.admin, "asset-1", "a".repeat(64))).valid,
    true,
  );
});
test("user cannot mint or approve; binding cannot be forged", async () => {
  const f = await fixture();
  await assert.rejects(
    () => f.assets.Mint(f.owner, "forbidden", "a".repeat(64)),
    /Permission denied/,
  );
  const context = f.ctx("did:aegis:owner");
  context.clientIdentity.getIDBytes = () => Buffer.from("attacker-certificate");
  await assert.rejects(() => caller(context), /binding/);
});
test("revocation and certificate MSP boundary enforced", async () => {
  const f = await fixture();
  await f.identities.SetStatus(f.admin, "did:aegis:owner", "revoked");
  await assert.rejects(() => caller(f.owner), /inactive/);
  await assert.rejects(
    () => caller(f.ctx("did:aegis:admin", "Org2MSP")),
    /binding/,
  );
  await assert.rejects(
    () => f.identities.SetStatus(f.admin, "did:aegis:owner", "suspended"),
    /transition/,
  );
});
test("no foreign allocation and no second bootstrap", async () => {
  const f = await fixture();
  await f.assets.Mint(f.admin, "asset-1", "a".repeat(64));
  const other = f.ctx("did:aegis:other", "Org2MSP", true);
  await f.identities.Bootstrap(other, "did:aegis:other");
  await assert.rejects(
    () => f.assets.Assign(f.admin, "asset-1", "did:aegis:other"),
    /foreign/,
  );
  await assert.rejects(
    () => f.identities.Bootstrap(f.admin, "did:aegis:admin"),
    /exists/,
  );
});
test("transfer expiry and credential revocation", async () => {
  const f = await fixture();
  await f.assets.Mint(f.admin, "asset-1", "a".repeat(64));
  await f.assets.Assign(f.admin, "asset-1", "did:aegis:owner");
  await f.transfers.Request(f.owner, "asset-1", "did:aegis:recipient");
  f.advance();
  await assert.rejects(
    () => f.transfers.Approve(f.admin, "asset-1"),
    /unexpired/,
  );
  const c = new CredentialRegistry();
  await c.Issue(f.admin, "cred-1", "did:aegis:owner", "b".repeat(64));
  assert.equal(
    JSON.parse(await c.Verify(f.owner, "cred-1", "b".repeat(64))).valid,
    true,
  );
  await c.Revoke(f.admin, "cred-1");
  assert.equal(
    JSON.parse(await c.Verify(f.owner, "cred-1", "b".repeat(64))).valid,
    false,
  );
});
