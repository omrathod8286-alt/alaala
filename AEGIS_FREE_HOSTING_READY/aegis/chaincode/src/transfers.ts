import { Context } from "fabric-contract-api";
import {
  TrustContract,
  caller,
  owner,
  write,
  emit,
  timestamp,
  seconds,
  asset,
} from "./trust";
export class OwnershipTransfer extends TrustContract {
  constructor() {
    super("OwnershipTransfer");
  }
  async Request(ctx: Context, key: string, recipient: string) {
    const who = await caller(ctx, "asset.request");
    const value = await asset(ctx, key, who);
    if (value.owner !== who.id || value.status !== "active" || value.pending)
      throw new Error("Only active owner may request one pending transfer");
    await owner(ctx, recipient, who.org);
    if (recipient === who.id) throw new Error("Recipient already owns asset");
    value.pending = {
      recipient,
      requester: who.id,
      expires: seconds(ctx) + 900,
    };
    value.updated = timestamp(ctx);
    await write(ctx, "asset", key, value);
    await emit(ctx, who, "asset.transfer.request", key);
  }
  async Approve(ctx: Context, key: string) {
    const who = await caller(ctx, "asset.approve");
    const value = await asset(ctx, key, who);
    if (
      value.status !== "active" ||
      !value.pending ||
      value.pending.requester === who.id ||
      value.pending.expires <= seconds(ctx)
    )
      throw new Error("Independent unexpired approval required");
    await owner(ctx, value.pending.recipient, who.org);
    await owner(ctx, value.owner!, who.org);
    value.owner = value.pending.recipient;
    delete value.pending;
    value.updated = timestamp(ctx);
    await write(ctx, "asset", key, value);
    await emit(ctx, who, "asset.transfer.approve", key);
  }
  async Cancel(ctx: Context, key: string) {
    const who = await caller(ctx, "asset.request");
    const value = await asset(ctx, key, who);
    if (value.owner !== who.id || !value.pending)
      throw new Error("Only owner may cancel pending transfer");
    delete value.pending;
    await write(ctx, "asset", key, value);
    await emit(ctx, who, "asset.transfer.cancel", key);
  }
}
