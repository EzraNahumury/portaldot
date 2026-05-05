"use client";

import { ApiPromise } from "@polkadot/api";
import type { Signer } from "@polkadot/api/types";
import type { SubmittableExtrinsic } from "@polkadot/api/types";

/**
 * PortalGuard guardian/recovery primitives — backed by Portaldot's native
 * `pallet_proxy`. Each guardian gets a delayed proxy on the owner's account;
 * recovery is a `proxy.announce` followed (after the time-lock) by
 * `proxy.proxy_announced`.
 *
 * M-of-N coordination is enforced in the UX layer, not on chain: the
 * frontend collects approvals from `threshold` guardians before any guardian
 * actually submits the on-chain announce. The time-lock window gives the
 * owner a chance to reject a hostile or premature announcement.
 */

export const PORTALDOT_SS58 = 42;
export const BLOCK_TIME_MS = 6_000;
export const SECONDS_PER_BLOCK = 6;

export function secondsToBlocks(seconds: number): number {
  return Math.max(1, Math.ceil(seconds / SECONDS_PER_BLOCK));
}

export function blocksToSeconds(blocks: number): number {
  return blocks * SECONDS_PER_BLOCK;
}

/* ------------------------------------------------------------------ */
/*                       Setup (owner side)                            */
/* ------------------------------------------------------------------ */

/**
 * Owner adds a single guardian as a delayed proxy. Repeat for each guardian.
 */
export function buildAddGuardianProxyTx(
  api: ApiPromise,
  guardian: string,
  delayBlocks: number,
): SubmittableExtrinsic<"promise"> {
  return api.tx.proxy.addProxy(guardian, "Any", delayBlocks);
}

export function buildRemoveGuardianProxyTx(
  api: ApiPromise,
  guardian: string,
  delayBlocks: number,
): SubmittableExtrinsic<"promise"> {
  return api.tx.proxy.removeProxy(guardian, "Any", delayBlocks);
}

/**
 * Convenience: batch up multiple add_proxy calls so the owner pays one fee
 * and signs one tx for the whole guardian roster.
 */
export function buildBatchAddGuardiansTx(
  api: ApiPromise,
  guardians: string[],
  delayBlocks: number,
): SubmittableExtrinsic<"promise"> {
  const calls = guardians.map((g) => api.tx.proxy.addProxy(g, "Any", delayBlocks));
  return api.tx.utility.batchAll(calls);
}

/* ------------------------------------------------------------------ */
/*                     Recovery flow (guardian side)                   */
/* ------------------------------------------------------------------ */

/**
 * The inner call the guardian collective wants to dispatch on behalf of the
 * vault owner: move all balance to the new owner.
 */
export function buildRecoveryInnerCall(
  api: ApiPromise,
  newOwner: string,
): SubmittableExtrinsic<"promise"> {
  return api.tx.balances.transferAll(newOwner, false);
}

export function callHashOf(call: SubmittableExtrinsic<"promise">): string {
  return call.method.hash.toHex();
}

/**
 * Guardian announces a proxy call against the vault owner. Off-chain, the
 * frontend has already collected M-of-N approvals from the other guardians;
 * this on-chain extrinsic is what actually starts the time-lock countdown.
 */
export function buildAnnounceTx(
  api: ApiPromise,
  vaultOwner: string,
  innerCall: SubmittableExtrinsic<"promise">,
): SubmittableExtrinsic<"promise"> {
  return api.tx.proxy.announce(vaultOwner, innerCall.method.hash.toHex());
}

/**
 * Owner rejects a pending announcement before the time-lock elapses.
 */
export function buildRejectAnnouncementTx(
  api: ApiPromise,
  guardian: string,
  callHash: string,
): SubmittableExtrinsic<"promise"> {
  return api.tx.proxy.rejectAnnouncement(guardian, callHash);
}

/**
 * After the delay elapses, anyone can submit this to actually execute the
 * recovery call as the vault owner.
 */
export function buildProxyAnnouncedTx(
  api: ApiPromise,
  guardian: string,
  vaultOwner: string,
  innerCall: SubmittableExtrinsic<"promise">,
): SubmittableExtrinsic<"promise"> {
  return api.tx.proxy.proxyAnnounced(
    guardian,
    vaultOwner,
    null,
    innerCall.method.toHex(),
  );
}

/* ------------------------------------------------------------------ */
/*                          State read helpers                         */
/* ------------------------------------------------------------------ */

export type GuardianProxy = {
  delegate: string;
  proxyType: string;
  delay: number;
};

export type AnnouncementInfo = {
  guardian: string;
  realOwner: string;
  callHash: string;
  height: number;
  executableAt: number;
  remainingBlocks: number;
};

export async function readOwnerProxies(
  api: ApiPromise,
  owner: string,
): Promise<GuardianProxy[]> {
  const result = (await api.query.proxy.proxies(owner)) as unknown as [
    Array<{
      delegate: { toString(): string };
      proxyType: { toString(): string };
      delay: { toNumber(): number };
    }>,
    unknown,
  ];
  const list = result[0] ?? [];
  return list.map((p) => ({
    delegate: p.delegate.toString(),
    proxyType: p.proxyType.toString(),
    delay: p.delay.toNumber(),
  }));
}

export async function readGuardianAnnouncements(
  api: ApiPromise,
  guardian: string,
  vaultOwner: string,
  guardianDelay: number,
  currentBlock: number,
): Promise<AnnouncementInfo[]> {
  const result = (await api.query.proxy.announcements(guardian)) as unknown as [
    Array<{
      real: { toString(): string };
      callHash: { toHex(): string };
      height: { toNumber(): number };
    }>,
    unknown,
  ];
  const list = result[0] ?? [];
  return list
    .filter((a) => a.real.toString() === vaultOwner)
    .map((a) => {
      const height = a.height.toNumber();
      const executableAt = height + guardianDelay;
      return {
        guardian,
        realOwner: a.real.toString(),
        callHash: a.callHash.toHex(),
        height,
        executableAt,
        remainingBlocks: Math.max(0, executableAt - currentBlock),
      };
    });
}

export async function getCurrentBlock(api: ApiPromise): Promise<number> {
  const head = await api.rpc.chain.getHeader();
  return head.number.toNumber();
}

/* ------------------------------------------------------------------ */
/*                  Off-chain M-of-N coordination state               */
/* ------------------------------------------------------------------ */

/**
 * A pending recovery proposal lives client-side until M of N guardians have
 * signed off (off-chain). At that point one guardian submits the on-chain
 * announce transaction and the proposal becomes redundant.
 */
export type RecoveryProposal = {
  vaultOwner: string;
  newOwner: string;
  proposedBy: string;
  proposedAt: number; // Date.now()
  approvals: string[]; // guardian SS58 addresses
};

const PROPOSAL_KEY_PREFIX = "portalguard:recovery-proposal:";

export function loadRecoveryProposal(vaultOwner: string): RecoveryProposal | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROPOSAL_KEY_PREFIX + vaultOwner);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RecoveryProposal;
  } catch {
    return null;
  }
}

export function saveRecoveryProposal(p: RecoveryProposal): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    PROPOSAL_KEY_PREFIX + p.vaultOwner,
    JSON.stringify(p),
  );
}

export function clearRecoveryProposal(vaultOwner: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROPOSAL_KEY_PREFIX + vaultOwner);
}

/* ------------------------------------------------------------------ */
/*                         Sign-and-send wrapper                       */
/* ------------------------------------------------------------------ */

export type TxStatusCb = (status: string) => void;

export async function signAndSend(
  tx: SubmittableExtrinsic<"promise">,
  signerAddr: string,
  signer: Signer,
  onStatus?: TxStatusCb,
): Promise<{ blockHash: string; events: unknown[] }> {
  return new Promise((resolve, reject) => {
    tx.signAndSend(signerAddr, { signer }, (result) => {
      if (result.dispatchError) {
        reject(new Error(result.dispatchError.toString()));
        return;
      }
      if (result.status.isInBlock) {
        onStatus?.(`In block: ${result.status.asInBlock.toString().slice(0, 10)}…`);
      } else if (result.status.isFinalized) {
        onStatus?.("Finalized");
        resolve({
          blockHash: result.status.asFinalized.toString(),
          events: result.events as unknown[],
        });
      }
    }).catch(reject);
  });
}
