"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { shortAddr } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Props {
  guardians: string[];
  approvals?: string[];
  threshold?: number;
}

const item = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 28 },
  },
  exit: { opacity: 0, x: -8, transition: { duration: 0.18 } },
};

function avatarFor(addr: string): { initials: string; hue: number } {
  const initials = addr.slice(2, 4).toUpperCase();
  let h = 0;
  for (let i = 0; i < addr.length; i++) h = (h * 31 + addr.charCodeAt(i)) % 360;
  return { initials, hue: h };
}

export function GuardianList({ guardians, approvals = [], threshold }: Props) {
  return (
    <div className="space-y-1">
      {threshold !== undefined && (
        <div className="flex items-center justify-between mb-3 text-[11px] tracking-[0.12em] uppercase text-stone-500 font-medium">
          <span>Roster</span>
          <span className="tabular-nums text-stone-400">
            {approvals.length}/{threshold} signed
          </span>
        </div>
      )}
      <AnimatePresence initial={false}>
        {guardians.map((g) => {
          const approved = approvals.includes(g);
          const { initials, hue } = avatarFor(g);
          return (
            <motion.div
              key={g}
              variants={item}
              initial="hidden"
              animate="show"
              exit="exit"
              layout
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 border transition-colors",
                approved
                  ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                  : "border-stone-900 bg-stone-950/40 hover:border-stone-800",
              )}
            >
              <div
                className="size-8 rounded-md flex items-center justify-center shrink-0 text-[11px] font-medium text-stone-100 ring-1 ring-stone-800"
                style={{
                  background: approved
                    ? "rgba(52, 211, 153, 0.15)"
                    : `hsl(${hue}deg 18% 14%)`,
                  color: approved ? "#6ee7b7" : "#e7e5e4",
                }}
              >
                {approved ? <Check className="size-3.5" /> : initials}
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <span className="font-mono text-[13px] text-stone-200 truncate">
                  {shortAddr(g, 8, 6)}
                </span>
              </div>
              <span
                className={cn(
                  "text-[11px] tracking-[0.04em]",
                  approved ? "text-emerald-300" : "text-stone-500",
                )}
              >
                {approved ? "approved" : "pending"}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
