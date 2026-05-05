"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  hint?: string;
  mono?: boolean;
}

export function Stat({ label, value, hint, mono, className, ...rest }: StatProps) {
  return (
    <div className={cn("min-w-0", className)} {...rest}>
      <p className="text-[10.5px] tracking-[0.12em] uppercase text-stone-500 font-medium mb-1.5">
        {label}
      </p>
      <p
        className={cn(
          "text-[19px] text-stone-100 leading-none tabular-nums",
          mono && "font-mono text-[14px]",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

export function StatRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5", className)}
      {...props}
    />
  );
}
