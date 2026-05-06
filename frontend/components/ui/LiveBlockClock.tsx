"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Decorative ticking block clock for the marketing surface. Increments by
 * 1 every 6 seconds (Portaldot's ~6s block time). Starts at a sensible
 * non-zero number so the first impression isn't "#0".
 */
export function LiveBlockClock({
  start = 1_482_193,
  className,
}: {
  start?: number;
  className?: string;
}) {
  const [n, setN] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setN((v) => v + 1), 6_000);
    return () => clearInterval(id);
  }, []);
  const str = n.toLocaleString();
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono tabular-nums ${className ?? ""}`}
    >
      <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)] animate-pulse" />
      <span className="text-[11px] text-stone-500 mr-1">block</span>
      <span className="text-stone-200">
        #
        <AnimatePresence mode="popLayout" initial={false}>
          {str.split("").map((c, i) => (
            <motion.span
              key={`${i}-${c}-${n}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="inline-block"
            >
              {c}
            </motion.span>
          ))}
        </AnimatePresence>
      </span>
    </span>
  );
}
