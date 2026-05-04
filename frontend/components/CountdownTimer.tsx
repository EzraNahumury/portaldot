"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
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

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-mono",
        expired
          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
          : "bg-amber-500/10 text-amber-300 border border-amber-500/30",
        className,
      )}
    >
      <Timer className="size-4" />
      {expired ? "Ready to execute" : formatTimeRemaining(remaining)}
    </div>
  );
}
