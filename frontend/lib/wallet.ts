"use client";

import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/api/types";

const APP_NAME = "PortalGuard";

let enabledOnce = false;

async function loadDapp() {
  if (typeof window === "undefined") {
    throw new Error("Wallet APIs are only available in the browser.");
  }
  return import("@polkadot/extension-dapp");
}

export async function enableWallet(): Promise<void> {
  const { web3Enable } = await loadDapp();
  const extensions = await web3Enable(APP_NAME);
  if (extensions.length === 0) {
    throw new Error(
      "No Substrate wallet extension found (e.g. polkadot.js, Talisman, SubWallet).",
    );
  }
  enabledOnce = true;
}

export async function listAccounts(): Promise<InjectedAccountWithMeta[]> {
  if (!enabledOnce) await enableWallet();
  const { web3Accounts } = await loadDapp();
  return web3Accounts({ ss58Format: 42 });
}

export async function getSigner(address: string): Promise<Signer> {
  if (!enabledOnce) await enableWallet();
  const { web3FromAddress } = await loadDapp();
  const injected = await web3FromAddress(address);
  if (!injected.signer) throw new Error("Signer not available from extension.");
  return injected.signer;
}
