"use client";

import type { Variants, Transition } from "framer-motion";

const baseSpring: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 28,
  mass: 0.6,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: baseSpring },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0, transition: baseSpring },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 320, damping: 24 },
  },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: baseSpring },
};

export const stagger = (delayChildren = 0.05, staggerChildren = 0.07): Variants => ({
  hidden: {},
  show: {
    transition: { delayChildren, staggerChildren },
  },
});

export const pulse: Variants = {
  hidden: { scale: 1 },
  show: {
    scale: [1, 1.03, 1],
    transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
  },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 26 },
  },
  exit: {
    opacity: 0,
    x: -12,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};
