"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, LogOut, Wallet } from "lucide-react";
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
        <Wallet className="size-3.5" />
        Connect
      </Button>
    );
  }

  return (
    <div className="relative" data-wallet-menu>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-2 h-8 px-2.5 rounded-md text-[12.5px] border border-stone-800 bg-stone-950 hover:border-stone-700 transition-colors"
      >
        <span className="size-1.5 rounded-full bg-emerald-400" />
        <span className="font-mono text-stone-200">
          {shortAddr(account.address, 4, 4)}
        </span>
        <ChevronDown className="size-3 text-stone-500" />
      </button>
      {open && (
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
                    setOpen(false);
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
  );
}
