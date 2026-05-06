"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/cn";

interface Props {
  /** 0..1 */
  value: number;
  label?: string;
  size?: number;
  className?: string;
}

export function SecurityScore({
  value,
  label = "Readiness",
  size = 96,
  className,
}: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <svg ref={ref} width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(41,37,36,0.7)"
          strokeWidth={6}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#34d399"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={inView ? { strokeDashoffset: offset } : {}}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="relative -mt-[60%] mb-[16%] text-center">
        <div className="font-display text-[20px] text-stone-100 tabular-nums leading-none">
          {Math.round(value * 100)}
          <span className="text-stone-500 text-[12px]">%</span>
        </div>
        <div className="mt-1 text-[10.5px] tracking-[0.12em] uppercase text-stone-500 font-medium">
          {label}
        </div>
      </div>
    </div>
  );
}
