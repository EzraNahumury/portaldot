"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

type DivProps = HTMLMotionProps<"div"> & { hoverable?: boolean };

export function Card({ className, hoverable, ...props }: DivProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      whileHover={hoverable ? { y: -2 } : undefined}
      className={cn(
        "rounded-lg border border-stone-900/80 bg-stone-950/60",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]",
        "transition-colors",
        className,
      )}
      {...props}
    />
  );
}

export function CardSection({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("p-6 border-b border-stone-900/80 last:border-b-0", className)}
      {...props}
    />
  );
}

export function CardEyebrow({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "text-[11px] tracking-[0.12em] uppercase text-stone-500 mb-3 font-medium",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-[17px] font-medium text-stone-100 tracking-tight leading-tight",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-stone-400 mt-1.5 leading-relaxed", className)}
      {...props}
    />
  );
}
