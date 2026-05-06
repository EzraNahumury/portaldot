"use client";

import { motion } from "framer-motion";

/**
 * Decorative SVG showing 5 guardian nodes around a central vault, with
 * pulsing rings + connecting lines that draw on mount. Pure visual — no
 * data binding.
 */
export function GuardianNetwork({ className }: { className?: string }) {
  // 5 guardian positions around a 320×320 viewBox centered at (160, 160)
  const nodes = [
    { x: 160, y: 28, label: "G1" },
    { x: 296, y: 110, label: "G2" },
    { x: 244, y: 268, label: "G3" },
    { x: 76, y: 268, label: "G4" },
    { x: 24, y: 110, label: "G5" },
  ];
  const center = { x: 160, y: 160 };

  return (
    <svg
      viewBox="0 0 320 320"
      className={className}
      role="img"
      aria-label="Guardian network"
    >
      <defs>
        <radialGradient id="vault-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
          <stop offset="60%" stopColor="#34d399" stopOpacity={0.05} />
          <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#52525b" stopOpacity={0.6} />
          <stop offset="50%" stopColor="#34d399" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#52525b" stopOpacity={0.6} />
        </linearGradient>
      </defs>

      {/* Center glow */}
      <circle cx={center.x} cy={center.y} r={120} fill="url(#vault-glow)" />

      {/* Connecting lines */}
      {nodes.map((n, i) => (
        <motion.line
          key={`line-${i}`}
          x1={center.x}
          y1={center.y}
          x2={n.x}
          y2={n.y}
          stroke="url(#line-grad)"
          strokeWidth={1.2}
          strokeDasharray="4 6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 1.4,
            delay: 0.2 + i * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}

      {/* Outer pulsing rings */}
      {nodes.map((n, i) => (
        <g key={`ring-${i}`}>
          <motion.circle
            cx={n.x}
            cy={n.y}
            r={14}
            fill="none"
            stroke="#34d399"
            strokeWidth={1}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [1, 1.6, 1.6], opacity: [0.5, 0, 0] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeOut",
            }}
            style={{ transformOrigin: `${n.x}px ${n.y}px` }}
          />
        </g>
      ))}

      {/* Nodes */}
      {nodes.map((n, i) => (
        <motion.g
          key={`node-${i}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 240,
            damping: 22,
            delay: 0.4 + i * 0.08,
          }}
          style={{ transformOrigin: `${n.x}px ${n.y}px` }}
        >
          <circle cx={n.x} cy={n.y} r={11} fill="#0c0a09" stroke="#34d399" strokeWidth={1.4} />
          <circle cx={n.x} cy={n.y} r={4.5} fill="#34d399" />
        </motion.g>
      ))}

      {/* Center vault */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.1 }}
        style={{ transformOrigin: `${center.x}px ${center.y}px` }}
      >
        <circle
          cx={center.x}
          cy={center.y}
          r={26}
          fill="#0c0a09"
          stroke="#34d399"
          strokeWidth={1.5}
        />
        <motion.circle
          cx={center.x}
          cy={center.y}
          r={26}
          fill="none"
          stroke="#34d399"
          strokeWidth={1.5}
          animate={{ scale: [1, 1.3, 1.3], opacity: [0.6, 0, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          style={{ transformOrigin: `${center.x}px ${center.y}px` }}
        />
        <text
          x={center.x}
          y={center.y + 5}
          textAnchor="middle"
          fontSize={13}
          fontFamily="var(--font-jb-mono), monospace"
          fontWeight={600}
          fill="#fafaf9"
        >
          ◆
        </text>
      </motion.g>
    </svg>
  );
}
