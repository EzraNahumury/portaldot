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
          "h-10 w-full rounded-md border border-stone-800 bg-stone-950 px-3 text-[13.5px] text-stone-100",
          "placeholder:text-stone-600",
          "transition-colors duration-150",
          "hover:border-stone-700",
          "focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/15",
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
          "min-h-[88px] w-full rounded-md border border-stone-800 bg-stone-950 px-3 py-2.5 text-[13.5px] text-stone-100",
          "placeholder:text-stone-600",
          "transition-colors duration-150",
          "hover:border-stone-700",
          "focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/15",
          "resize-y font-mono",
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
        "block text-[11px] tracking-[0.12em] uppercase text-stone-500 mb-2 font-medium",
        className,
      )}
      {...props}
    />
  );
}

export function FieldHint({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-2 text-xs text-stone-500", className)} {...props} />
  );
}
