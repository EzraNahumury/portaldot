"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getApi } from "@/lib/portaldot";
import { formatPOT } from "@/lib/format";
import { usePortalStore } from "@/lib/store";

/**
 * Live free-balance pill for the connected account. Subscribes to
 * `system.account` so it updates as the chain produces new blocks.
 * Designed to sit next to the wallet pill in the header.
 */
export function AccountBalance() {
  const account = usePortalStore((s) => s.account);
  const [free, setFree] = useState<bigint | null>(null);
  const [reserved, setReserved] = useState<bigint>(0n);

  useEffect(() => {
    if (!account?.address) {
      setFree(null);
      return;
    }
    let unsub: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      try {
        const api = await getApi();
        const u = await api.query.system.account(
          account.address,
          (info: unknown) => {
            const data = (info as { data?: { free?: { toBigInt?: () => bigint }; reserved?: { toBigInt?: () => bigint } } }).data;
            if (!data) return;
            const f = data.free?.toBigInt?.() ?? 0n;
            const r = data.reserved?.toBigInt?.() ?? 0n;
            if (!cancelled) {
              setFree(f);
              setReserved(r);
            }
          },
        );
        unsub = u as unknown as () => void;
      } catch {
        // node not reachable yet — silent
      }
    })();
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [account?.address]);

  if (!account || free == null) return null;

  const formatted = formatPOT(free);
  return (
    <div
      className="hidden sm:inline-flex items-center gap-2 h-8 px-2.5 rounded-md border border-stone-800 bg-stone-950/60"
      title={`free ${formatted} POT · reserved ${formatPOT(reserved)} POT`}
    >
      <span className="text-[10px] tracking-[0.12em] uppercase text-stone-500 font-medium">
        bal
      </span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={formatted}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }}
          className="font-mono text-[12px] tabular-nums text-stone-100"
        >
          {formatted}
        </motion.span>
      </AnimatePresence>
      <span className="text-[10.5px] text-stone-500 font-mono">POT</span>
    </div>
  );
}
