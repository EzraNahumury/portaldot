"use client";

import { Badge } from "./ui/Badge";

type Status = "active" | "approved" | "executable" | "none";

const map: Record<Status, { tone: "ok" | "warn" | "danger" | "info"; label: string; pulse: boolean }> = {
  none: { tone: "ok", label: "Vault healthy", pulse: false },
  active: { tone: "warn", label: "Off-chain proposal", pulse: true },
  approved: { tone: "info", label: "Announced · time-lock", pulse: true },
  executable: { tone: "danger", label: "Ready to execute", pulse: true },
};

export function RecoveryStatus({ status }: { status: Status }) {
  const cfg = map[status];
  return (
    <Badge tone={cfg.tone} dot pulse={cfg.pulse}>
      {cfg.label}
    </Badge>
  );
}
