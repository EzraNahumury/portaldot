"use client";

import { motion } from "framer-motion";
import * as React from "react";

interface Props {
  children: React.ReactNode;
  speed?: number;
  reverse?: boolean;
  className?: string;
}

/**
 * Infinite horizontal scroll. Wrap children in a Marquee — they'll repeat
 * seamlessly. Pass an array of nodes; we duplicate them internally.
 */
export function Marquee({
  children,
  speed = 28,
  reverse = false,
  className,
}: Props) {
  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{
        maskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <motion.div
        className="flex shrink-0 gap-12 pr-12 will-change-transform"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: speed, ease: "linear", repeat: Infinity }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}
