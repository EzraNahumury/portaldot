"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, LogOut, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { WalletModal } from "@/components/WalletModal";
import { usePortalStore } from "@/lib/store";
import { shortAddr } from "@/lib/format";
import { listAccounts } from "@/lib/wallet";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

export function ConnectWallet() {
  const account = usePortalStore((s) => s.account);
  const setAccount = usePortalStore((s) => s.setAccount);

  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);

  const refreshAccounts = useCallback(async () => {
    try {
      const list = await listAccounts();
      setAccounts(list);
    } catch {
      // wallet not enabled yet — ignore
    }
  }, []);

  useEffect(() => {
    if (account) void refreshAccounts();
  }, [account, refreshAccounts]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-wallet-menu]")) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, [menuOpen]);

  function handleDisconnect() {
    setAccount(null);
    setAccounts([]);
    setMenuOpen(false);
    toast.success("Disconnected.");
  }

  if (!account) {
    return (
      <>
        <Button onClick={() => setModalOpen(true)} size="sm">
          <Wallet className="size-3.5" />
          Connect
        </Button>
        <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="relative" data-wallet-menu>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="inline-flex items-center gap-2 h-8 px-2.5 rounded-md text-[12.5px] border border-stone-800 bg-stone-950 hover:border-stone-700 transition-colors"
        >
          <span className="size-1.5 rounded-full bg-emerald-400" />
          <span className="font-mono text-stone-200">
            {shortAddr(account.address, 4, 4)}
          </span>
          <ChevronDown className="size-3 text-stone-500" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 rounded-md border border-stone-800 bg-stone-950 shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-stone-900">
              <p className="text-[10.5px] tracking-[0.12em] uppercase text-stone-500 font-medium mb-2">
                Switch account
              </p>
              <div className="space-y-0.5 max-h-60 overflow-y-auto">
                {accounts.map((a) => (
                  <button
                    key={a.address}
                    onClick={() => {
                      setAccount(a);
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-md text-sm hover:bg-stone-900 transition-colors ${
                      a.address === account.address ? "bg-stone-900" : ""
                    }`}
                  >
                    <div className="font-medium text-stone-200 truncate">
                      {a.meta.name || "Account"}
                    </div>
                    <div className="font-mono text-[11px] text-stone-500 truncate">
                      {a.address}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setModalOpen(true);
                }}
                className="mt-2 w-full px-2.5 py-2 rounded-md text-[13px] text-stone-300 hover:bg-stone-900 hover:text-stone-100 transition-colors text-left"
              >
                Switch wallet…
              </button>
            </div>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-stone-900 transition-colors"
            >
              <LogOut className="size-3.5" />
              Disconnect
            </button>
          </div>
        )}
      </div>
      <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
