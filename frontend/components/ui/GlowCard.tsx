"use client";

import * as React from "react";
import { motion, useMotionValue } from "framer-motion";
import { cn } from "@/lib/cn";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: string;
  hoverable?: boolean;
}

/**
 * Card with a soft conic-gradient halo that follows the mouse on hover.
 * Tasteful, not flashy. Drop in replacement for plain Card sections that
 * need to feel premium without screaming.
 */
export function GlowCard({
  className,
  children,
  glowColor = "52, 211, 153",
  hoverable = true,
  ...rest
}: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!hoverable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  }

  return (
    <div
      onMouseMove={handleMove}
      className={cn(
        "group relative rounded-xl border border-stone-900 bg-stone-950/60 overflow-hidden transition-colors",
        hoverable && "hover:border-stone-800",
        className,
      )}
      {...rest}
    >
      {hoverable && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(360px circle at var(--mx) var(--my), rgba(${glowColor}, 0.18), transparent 40%)`,
            // CSS vars driven by motion values
          }}
          ref={(node) => {
            if (!node) return;
            const update = () =>
              node.style.setProperty("--mx", `${x.get()}px`);
            const update2 = () =>
              node.style.setProperty("--my", `${y.get()}px`);
            x.on("change", update);
            y.on("change", update2);
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
