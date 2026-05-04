"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

type State = {
  account: InjectedAccountWithMeta | null;
  vaultAddress: string;
  setAccount: (a: InjectedAccountWithMeta | null) => void;
  setVaultAddress: (addr: string) => void;
  reset: () => void;
};

export const usePortalStore = create<State>()(
  persist(
    (set) => ({
      account: null,
      vaultAddress: "",
      setAccount: (account) => set({ account }),
      setVaultAddress: (vaultAddress) => set({ vaultAddress }),
      reset: () => set({ account: null, vaultAddress: "" }),
    }),
    {
      name: "portalguard-state",
      partialize: (s) => ({ vaultAddress: s.vaultAddress }),
    },
  ),
);
