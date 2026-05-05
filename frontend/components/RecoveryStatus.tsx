"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

type Status = "active" | "approved" | "executable" | "none";

interface Props {
  status: Status;
  className?: string;
}

const statusConfig: Record<
  Status,
  { label: string; color: string; icon: React.ReactNode; pulse: boolean }
> = {
  none: {
    label: "Vault healthy",
    color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    icon: <ShieldCheck className="size-4" />,
    pulse: false,
  },
  active: {
    label: "Recovery proposal",
    color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    icon: <AlertTriangle className="size-4" />,
    pulse: true,
  },
  approved: {
    label: "Announced — time-lock",
    color: "bg-violet-500/10 text-violet-300 border-violet-500/30",
    icon: <AlertTriangle className="size-4" />,
    pulse: true,
  },
  executable: {
    label: "Ready to execute",
    color: "bg-rose-500/10 text-rose-300 border-rose-500/40",
    icon: <AlertTriangle className="size-4" />,
    pulse: true,
  },
};

export function RecoveryStatus({ status, className }: Props) {
  const cfg = statusConfig[status];
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -6, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium border",
          cfg.color,
          className,
        )}
      >
        <motion.span
          animate={
            cfg.pulse
              ? { scale: [1, 1.15, 1], opacity: [0.85, 1, 0.85] }
              : { scale: 1, opacity: 1 }
          }
          transition={
            cfg.pulse
              ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0 }
          }
          className="flex"
        >
          {cfg.icon}
        </motion.span>
        {cfg.label}
      </motion.div>
    </AnimatePresence>
  );
}
