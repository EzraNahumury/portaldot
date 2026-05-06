"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type StageState = "done" | "active" | "pending";

export interface Stage {
  id: string;
  label: string;
  description?: string;
  state: StageState;
  hint?: React.ReactNode;
}

export function RecoveryTimeline({
  stages,
  className,
}: {
  stages: Stage[];
  className?: string;
}) {
  return (
    <ol className={cn("relative space-y-6", className)}>
      {stages.map((s, i) => {
        const isLast = i === stages.length - 1;
        const isActive = s.state === "active";
        const isDone = s.state === "done";
        return (
          <li key={s.id} className="relative pl-10">
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[14px] top-7 bottom-[-1.5rem] w-px",
                  isDone ? "bg-emerald-500/40" : "bg-stone-800",
                )}
              />
            )}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 }}
              className={cn(
                "absolute left-0 top-0 size-7 rounded-full border flex items-center justify-center text-[10.5px] font-medium",
                isDone && "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
                isActive &&
                  "border-stone-100/50 bg-stone-100/[0.05] text-stone-100",
                s.state === "pending" && "border-stone-800 bg-stone-950/60 text-stone-500",
              )}
            >
              {isDone ? (
                <Check className="size-3.5" />
              ) : isActive ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                String(i + 1).padStart(2, "0")
              )}
              {isActive && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-stone-100/30"
                  animate={{ scale: [1, 1.6, 1.6], opacity: [0.6, 0, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
              )}
            </motion.div>

            <div className="min-w-0">
              <p
                className={cn(
                  "text-[13.5px] font-medium tracking-tight",
                  isActive ? "text-stone-100" : isDone ? "text-stone-300" : "text-stone-500",
                )}
              >
                {s.label}
              </p>
              {s.description && (
                <p className="mt-1 text-[12px] text-stone-500 leading-relaxed">
                  {s.description}
                </p>
              )}
              {s.hint && <div className="mt-3">{s.hint}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
