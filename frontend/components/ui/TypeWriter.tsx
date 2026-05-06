"use client";

import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

interface Props {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  cursor?: boolean;
  onDone?: () => void;
}

export function TypeWriter({
  text,
  speed = 22,
  delay = 0,
  className,
  cursor = true,
  onDone,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    let raf: number;
    let lastTick = 0;
    const start = performance.now() + delay;

    const tick = (t: number) => {
      if (t < start) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (t - lastTick > speed) {
        i += 1;
        setOut(text.slice(0, i));
        lastTick = t;
      }
      if (i < text.length) {
        raf = requestAnimationFrame(tick);
      } else {
        setDone(true);
        onDone?.();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, text, speed, delay, onDone]);

  return (
    <span ref={ref} className={className}>
      {out}
      {cursor && !done && (
        <span className="inline-block w-[6px] h-[1em] -mb-[2px] bg-current align-middle ml-0.5 animate-pulse" />
      )}
    </span>
  );
}
