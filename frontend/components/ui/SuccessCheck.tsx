"use client";

import { motion } from "framer-motion";

export function SuccessCheck({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="Success"
    >
      <motion.circle
        cx={32}
        cy={32}
        r={28}
        stroke="#34d399"
        strokeWidth={2}
        fill="rgba(52,211,153,0.08)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.path
        d="M22 33 L29 40 L42 24"
        stroke="#34d399"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut", delay: 0.4 }}
      />
    </svg>
  );
}
