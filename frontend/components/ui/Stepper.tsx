"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Step {
  id: string;
  label: string;
}

interface Props {
  steps: Step[];
  current: number; // 0-indexed
  className?: string;
}

export function Stepper({ steps, current, className }: Props) {
  return (
    <ol className={cn("flex items-center gap-2 w-full", className)}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.id} className="flex items-center gap-2 flex-1 last:flex-none min-w-0">
            <div
              className={cn(
                "flex items-center gap-2 min-w-0",
                !active && !done && "opacity-50",
              )}
            >
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: done
                    ? "rgba(52, 211, 153, 0.15)"
                    : active
                    ? "rgba(245, 245, 244, 0.05)"
                    : "rgba(28, 25, 23, 0.6)",
                  borderColor: done
                    ? "rgba(52, 211, 153, 0.5)"
                    : active
                    ? "rgba(245, 245, 244, 0.4)"
                    : "rgba(41, 37, 36, 1)",
                }}
                className="size-7 shrink-0 rounded-full border flex items-center justify-center text-[11px] font-medium tabular-nums"
              >
                {done ? (
                  <Check className="size-3.5 text-emerald-300" />
                ) : (
                  <span className={active ? "text-stone-100" : "text-stone-500"}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
              </motion.div>
              <span
                className={cn(
                  "text-[11.5px] tracking-[0.04em] uppercase font-medium truncate",
                  active ? "text-stone-100" : done ? "text-stone-300" : "text-stone-500",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="relative flex-1 h-px bg-stone-900 overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-emerald-400/60"
                  initial={false}
                  animate={{ width: done ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
