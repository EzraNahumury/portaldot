"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-violet-500 text-white hover:bg-violet-400 active:bg-violet-600 focus-visible:ring-violet-500/40 shadow-[0_8px_30px_rgb(124,58,237,0.25)]",
  secondary:
    "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-900 focus-visible:ring-zinc-500/40 border border-zinc-700",
  ghost:
    "bg-transparent text-zinc-300 hover:bg-zinc-800/60 active:bg-zinc-900 focus-visible:ring-zinc-500/40",
  danger:
    "bg-rose-500 text-white hover:bg-rose-400 active:bg-rose-600 focus-visible:ring-rose-500/40",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-5 text-sm rounded-xl",
  lg: "h-14 px-7 text-base rounded-2xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...rest}
      >
        {loading && (
          <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
