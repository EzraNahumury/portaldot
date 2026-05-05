"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check } from "lucide-react";
import { shortAddr } from "@/lib/format";
import { cn } from "@/lib/cn";
import { listItem, stagger } from "@/lib/motion";

interface Props {
  guardians: string[];
  approvals?: string[];
  threshold?: number;
}

export function GuardianList({ guardians, approvals = [], threshold }: Props) {
  return (
    <motion.div
      variants={stagger(0.02, 0.05)}
      initial="hidden"
      animate="show"
      className="space-y-2"
    >
      {threshold !== undefined && (
        <motion.div
          variants={listItem}
          className="flex items-center justify-between text-xs uppercase tracking-wider text-zinc-500 mb-3"
        >
          <span>Guardians</span>
          <span>
            {approvals.length}/{threshold} approvals
          </span>
        </motion.div>
      )}
      <AnimatePresence>
        {guardians.map((g) => {
          const approved = approvals.includes(g);
          return (
            <motion.div
              key={g}
              variants={listItem}
              initial="hidden"
              animate="show"
              exit="exit"
              layout
              whileHover={{ x: 2, transition: { type: "spring", stiffness: 380 } }}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3 transition-colors",
                approved
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-zinc-800 bg-zinc-900/40",
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <motion.div
                  animate={
                    approved
                      ? { scale: [1, 1.18, 1], rotate: [0, 8, 0] }
                      : { scale: 1, rotate: 0 }
                  }
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className={cn(
                    "size-9 rounded-lg flex items-center justify-center shrink-0",
                    approved
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-zinc-800 text-zinc-400",
                  )}
                >
                  {approved ? <Check className="size-4" /> : <Shield className="size-4" />}
                </motion.div>
                <div className="min-w-0">
                  <div className="font-mono text-sm text-zinc-200 truncate">
                    {shortAddr(g, 8, 6)}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {approved ? "Approved" : "Pending"}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
