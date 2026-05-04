"use client";

import { useState, useEffect, useCallback } from "react";
import { Wallet, ChevronDown, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { listAccounts } from "@/lib/wallet";
import { usePortalStore } from "@/lib/store";
import { shortAddr } from "@/lib/format";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

export function ConnectWallet() {
  const account = usePortalStore((s) => s.account);
  const setAccount = usePortalStore((s) => s.setAccount);

  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConnect = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listAccounts();
      if (list.length === 0) {
        toast.error("No accounts found in your wallet extension.");
        return;
      }
      setAccounts(list);
      setAccount(list[0]);
      setOpen(true);
      toast.success(`Connected ${list.length} account(s).`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [setAccount]);

  const handleDisconnect = useCallback(() => {
    setAccount(null);
    setAccounts([]);
    setOpen(false);
    toast.success("Disconnected.");
  }, [setAccount]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-wallet-menu]")) setOpen(false);
    }
    if (open) document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, [open]);

  if (!account) {
    return (
      <Button onClick={handleConnect} loading={loading} size="sm">
        <Wallet className="size-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="relative" data-wallet-menu>
      <Button
        variant="secondary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <span className="size-2 rounded-full bg-emerald-400" />
        <span className="font-mono text-xs">{shortAddr(account.address)}</span>
        <ChevronDown className="size-3.5 opacity-60" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-zinc-900">
            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
              Switch account
            </p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {accounts.map((a) => (
                <button
                  key={a.address}
                  onClick={() => {
                    setAccount(a);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-sm hover:bg-zinc-900 transition-colors ${
                    a.address === account.address ? "bg-zinc-900" : ""
                  }`}
                >
                  <div className="font-medium text-zinc-200 truncate">
                    {a.meta.name || "Account"}
                  </div>
                  <div className="font-mono text-xs text-zinc-500 truncate">
                    {a.address}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-rose-400 hover:bg-zinc-900 transition-colors"
          >
            <LogOut className="size-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
