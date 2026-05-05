"use client";

import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/api/types";
import type { WalletId } from "./wallets";

const APP_NAME = "PortalGuard";
const SS58_PREFIX = 42;

let enabled = false;

async function loadDapp() {
  if (typeof window === "undefined") {
    throw new Error("Wallet APIs are only available in the browser.");
  }
  return import("@polkadot/extension-dapp");
}

async function ensureEnabled(): Promise<void> {
  if (enabled) return;
  const { web3Enable } = await loadDapp();
  const exts = await web3Enable(APP_NAME);
  if (exts.length === 0) {
    throw new Error(
      "No Substrate wallet extension authorized. Approve PortalGuard in your wallet.",
    );
  }
  enabled = true;
}

/**
 * Connect to a specific wallet by id and return its accounts. The picker
 * modal calls this with the user's chosen wallet, so accounts shown match
 * what the user actually selected.
 */
export async function connectWallet(
  id: WalletId,
): Promise<InjectedAccountWithMeta[]> {
  const { web3Enable, web3Accounts } = await loadDapp();
  const exts = await web3Enable(APP_NAME);
  const matched = exts.find((e) => e.name === id);
  if (!matched) {
    throw new Error(
      "Wallet not authorized. Open the extension and approve PortalGuard.",
    );
  }
  enabled = true;
  return web3Accounts({ ss58Format: SS58_PREFIX, extensions: [id] });
}

/** Used by smoke flows / fallback flows that don't go through the picker. */
export async function listAccounts(): Promise<InjectedAccountWithMeta[]> {
  await ensureEnabled();
  const { web3Accounts } = await loadDapp();
  return web3Accounts({ ss58Format: SS58_PREFIX });
}

export async function getSigner(address: string): Promise<Signer> {
  await ensureEnabled();
  const { web3FromAddress } = await loadDapp();
  const injected = await web3FromAddress(address);
  if (!injected.signer) throw new Error("Signer not available from extension.");
  return injected.signer;
}
