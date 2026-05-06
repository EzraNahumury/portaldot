"use client";

import { motion, type Variants } from "framer-motion";
import * as React from "react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 220, damping: 26 },
  },
};

const stagger = (delay = 0, gap = 0.06): Variants => ({
  hidden: {},
  show: { transition: { delayChildren: delay, staggerChildren: gap } },
});

export function Reveal({
  children,
  className,
  as = "div",
  amount = 0.05,
  delay = 0,
  gap = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "ul" | "ol" | "header";
  amount?: number;
  delay?: number;
  gap?: number;
}) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      variants={stagger(delay, gap)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      className={className}
    >
      {children}
    </Comp>
  );
}

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "h1" | "h2" | "h3" | "p" | "span";
}) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp variants={fadeUp} className={className}>
      {children}
    </Comp>
  );
}
