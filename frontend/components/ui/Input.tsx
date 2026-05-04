"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm text-zinc-100",
          "placeholder:text-zinc-500",
          "focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60",
          "transition-colors",
          className,
        )}
        {...rest}
      />
    );
  },
);
Input.displayName = "Input";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...rest }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[88px] w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100",
          "placeholder:text-zinc-500",
          "focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60",
          "transition-colors resize-y",
          className,
        )}
        {...rest}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-xs font-medium uppercase tracking-wide text-zinc-400 mb-2",
        className,
      )}
      {...props}
    />
  );
}
