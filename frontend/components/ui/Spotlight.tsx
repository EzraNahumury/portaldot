"use client";

import { useEffect, useRef } from "react";

/**
 * Mouse-tracking radial spotlight overlay. Drop inside any relative
 * container — it follows the cursor with a soft glow.
 */
export function Spotlight({
  className,
  size = 600,
  intensity = 0.16,
  color = "52, 211, 153",
}: {
  className?: string;
  size?: number;
  intensity?: number;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const onMove = (e: MouseEvent) => {
      const r = parent.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      el.style.background = `radial-gradient(${size}px circle at ${x}px ${y}px, rgba(${color}, ${intensity}), transparent 50%)`;
    };
    const onLeave = () => {
      el.style.background = "transparent";
    };
    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);
    return () => {
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, [size, intensity, color]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 transition-[background] duration-200 ${className ?? ""}`}
    />
  );
}
