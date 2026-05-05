"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Timer, CheckCircle2 } from "lucide-react";
import { formatTimeRemaining } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Props {
  targetTimestampMs: number;
  className?: string;
}

export function CountdownTimer({ targetTimestampMs, className }: Props) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, targetTimestampMs - Date.now()),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, targetTimestampMs - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [targetTimestampMs]);

  const expired = remaining <= 0;
  const urgent = !expired && remaining < 15_000;

  return (
    <motion.div
      animate={
        urgent
          ? { scale: [1, 1.04, 1] }
          : expired
          ? { scale: 1 }
          : { scale: 1 }
      }
      transition={
        urgent
          ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0 }
      }
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-mono transition-colors",
        expired
          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
          : urgent
          ? "bg-rose-500/10 text-rose-300 border border-rose-500/40"
          : "bg-amber-500/10 text-amber-300 border border-amber-500/30",
        className,
      )}
    >
      {expired ? <CheckCircle2 className="size-4" /> : <Timer className="size-4" />}
      <span className="tabular-nums">
        {expired ? "Ready to execute" : formatTimeRemaining(remaining)}
      </span>
    </motion.div>
  );
}
