"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, active, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-md border border-stone-900 bg-stone-950/60",
        className,
      )}
    >
      {items.map((it) => {
        const isActive = it.id === active;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={cn(
              "relative px-3 h-8 rounded-[5px] text-[13px] font-medium transition-colors",
              isActive
                ? "text-stone-100"
                : "text-stone-500 hover:text-stone-300",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="active-tab"
                className="absolute inset-0 rounded-[5px] bg-stone-100/[0.06] border border-stone-700/50"
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
              />
            )}
            <span className="relative inline-flex items-center gap-2">
              {it.label}
              {typeof it.count === "number" && (
                <span
                  className={cn(
                    "tabular-nums text-[11px] px-1.5 rounded-full",
                    isActive
                      ? "bg-stone-100/10 text-stone-200"
                      : "bg-stone-900 text-stone-500",
                  )}
                >
                  {it.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
