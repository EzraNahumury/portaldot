"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "link";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-stone-100 text-stone-950 hover:bg-white active:bg-stone-200 disabled:bg-stone-700 disabled:text-stone-400",
  secondary:
    "bg-stone-900 text-stone-100 hover:bg-stone-800 active:bg-stone-950 border border-stone-800",
  ghost:
    "bg-transparent text-stone-300 hover:text-stone-100 hover:bg-stone-900/60",
  danger:
    "bg-red-500/15 text-red-300 hover:bg-red-500/25 active:bg-red-500/30 border border-red-500/30",
  link:
    "bg-transparent text-stone-300 hover:text-stone-100 underline underline-offset-4 decoration-stone-700 hover:decoration-stone-400",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-md",
  md: "h-10 px-4 text-sm rounded-md",
  lg: "h-12 px-6 text-[15px] rounded-md",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      fullWidth,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950",
          "disabled:cursor-not-allowed disabled:opacity-60",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        {...rest}
      >
        {loading && (
          <span
            aria-hidden
            className="absolute left-3 size-3.5 rounded-full border-[1.5px] border-current/30 border-t-current animate-spin"
          />
        )}
        <span className={cn("inline-flex items-center gap-1.5", loading && "pl-5")}>
          {children}
        </span>
      </button>
    );
  },
);
Button.displayName = "Button";
