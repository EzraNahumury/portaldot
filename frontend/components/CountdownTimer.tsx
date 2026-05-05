"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatTimeRemaining } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Props {
  targetTimestampMs: number;
  className?: string;
  size?: "sm" | "md";
}

export function CountdownTimer({ targetTimestampMs, className, size = "md" }: Props) {
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
  const sizeC = size === "sm" ? "text-[12px] h-7 px-2.5" : "text-[13px] h-8 px-3";

  return (
    <motion.span
      animate={urgent ? { scale: [1, 1.025, 1] } : { scale: 1 }}
      transition={
        urgent
          ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0 }
      }
      className={cn(
        "inline-flex items-center gap-2 rounded-md font-mono tabular-nums border transition-colors",
        sizeC,
        expired
          ? "bg-emerald-500/[0.06] text-emerald-300 border-emerald-500/30"
          : urgent
          ? "bg-red-500/[0.07] text-red-300 border-red-500/35"
          : "bg-amber-500/[0.06] text-amber-200 border-amber-500/30",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          expired ? "bg-emerald-400" : urgent ? "bg-red-400" : "bg-amber-400",
        )}
      />
      {expired ? "ready · 00:00" : formatTimeRemaining(remaining)}
    </motion.span>
  );
}
