"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

export function BentoGrid({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[minmax(140px,auto)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

type CellProps = HTMLMotionProps<"div"> & {
  colSpan?: number;
  rowSpan?: number;
  delay?: number;
};

export function BentoCell({
  className,
  colSpan = 2,
  rowSpan = 1,
  delay = 0,
  children,
  style,
  ...rest
}: CellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ delay, type: "spring", stiffness: 220, damping: 26 }}
      className={cn(
        "relative rounded-xl border border-stone-900 bg-stone-950/70 p-5 overflow-hidden",
        "hover:border-stone-800 transition-colors",
        className,
      )}
      style={{
        gridColumn: `span ${colSpan} / span ${colSpan}`,
        gridRow: `span ${rowSpan} / span ${rowSpan}`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
