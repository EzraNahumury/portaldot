"use client";

import { motion } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/cn";

export interface Activity {
  id: string;
  icon?: React.ReactNode;
  title: string;
  meta?: string;
  tone?: "ok" | "warn" | "info" | "muted";
}

const toneRing: Record<NonNullable<Activity["tone"]>, string> = {
  ok: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  warn: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  info: "bg-stone-100/[0.05] text-stone-200 ring-stone-700",
  muted: "bg-stone-900 text-stone-500 ring-stone-800",
};

export function ActivityFeed({
  items,
  className,
}: {
  items: Activity[];
  className?: string;
}) {
  if (items.length === 0) {
    return (
      <p className={cn("text-[12.5px] text-stone-500 italic", className)}>
        No recent activity.
      </p>
    );
  }
  return (
    <ol className={cn("space-y-3", className)}>
      {items.map((it, i) => (
        <motion.li
          key={it.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04, type: "spring", stiffness: 240, damping: 26 }}
          className="flex items-start gap-3"
        >
          <span
            className={cn(
              "size-7 shrink-0 rounded-md flex items-center justify-center ring-1 mt-0.5",
              toneRing[it.tone ?? "info"],
            )}
          >
            {it.icon}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-stone-200 truncate">{it.title}</p>
            {it.meta && (
              <p className="mt-0.5 text-[11px] text-stone-500 font-mono truncate">
                {it.meta}
              </p>
            )}
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
