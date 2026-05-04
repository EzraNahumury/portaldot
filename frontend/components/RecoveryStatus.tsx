"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

type Status = "active" | "approved" | "executable" | "none";

interface Props {
  status: Status;
  className?: string;
}

const statusConfig: Record<
  Status,
  { label: string; color: string; icon: React.ReactNode }
> = {
  none: {
    label: "Vault healthy",
    color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    icon: <ShieldCheck className="size-4" />,
  },
  active: {
    label: "Recovery requested",
    color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    icon: <AlertTriangle className="size-4" />,
  },
  approved: {
    label: "Approved — time-lock active",
    color: "bg-violet-500/10 text-violet-300 border-violet-500/30",
    icon: <AlertTriangle className="size-4" />,
  },
  executable: {
    label: "Ready to execute",
    color: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    icon: <AlertTriangle className="size-4" />,
  },
};

export function RecoveryStatus({ status, className }: Props) {
  const cfg = statusConfig[status];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium border",
        cfg.color,
        className,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </div>
  );
}
