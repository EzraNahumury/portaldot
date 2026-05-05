"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "ok" | "warn" | "danger" | "info";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
}

const toneStyles: Record<Tone, { bg: string; text: string; ring: string; dot: string }> = {
  neutral: {
    bg: "bg-stone-900/60",
    text: "text-stone-300",
    ring: "ring-stone-800",
    dot: "bg-stone-400",
  },
  ok: {
    bg: "bg-emerald-500/8",
    text: "text-emerald-300",
    ring: "ring-emerald-500/25",
    dot: "bg-emerald-400",
  },
  warn: {
    bg: "bg-amber-500/10",
    text: "text-amber-200",
    ring: "ring-amber-500/30",
    dot: "bg-amber-400",
  },
  danger: {
    bg: "bg-red-500/10",
    text: "text-red-300",
    ring: "ring-red-500/30",
    dot: "bg-red-400",
  },
  info: {
    bg: "bg-stone-100/5",
    text: "text-stone-200",
    ring: "ring-stone-700",
    dot: "bg-stone-300",
  },
};

export function Badge({
  className,
  tone = "neutral",
  dot,
  pulse,
  children,
  ...rest
}: BadgeProps) {
  const t = toneStyles[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1",
        t.bg,
        t.text,
        t.ring,
        className,
      )}
      {...rest}
    >
      {dot && (
        <motion.span
          aria-hidden
          className={cn("size-1.5 rounded-full", t.dot)}
          animate={pulse ? { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {children}
    </span>
  );
}
