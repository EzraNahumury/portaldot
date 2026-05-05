"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

/**
 * Vault config persists per-owner so guardians can reload the dashboard
 * without re-entering data. The actual on-chain truth lives in the Proxy
 * pallet — this is a UX cache.
 */
export type VaultConfig = {
  ownerAddress: string;
  guardians: string[];
  threshold: number;
  timelockBlocks: number;
  guardianMultisig: string;
  /** Optional: store the inner recovery call (hex) so guardians can replay it. */
  pendingRecoveryCallHex?: string;
  pendingRecoveryNewOwner?: string;
};

type State = {
  account: InjectedAccountWithMeta | null;
  vault: VaultConfig | null;
  setAccount: (a: InjectedAccountWithMeta | null) => void;
  setVault: (v: VaultConfig | null) => void;
  resetVault: () => void;
};

export const usePortalStore = create<State>()(
  persist(
    (set) => ({
      account: null,
      vault: null,
      setAccount: (account) => set({ account }),
      setVault: (vault) => set({ vault }),
      resetVault: () => set({ vault: null }),
    }),
    {
      name: "portalguard-state-v2",
      partialize: (s) => ({ vault: s.vault }),
    },
  ),
);
