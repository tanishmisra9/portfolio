"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Props = { children: ReactNode };

export function HeroNameMotion({ children }: Props) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <div>{children}</div>;

  return (
    <motion.div
      animate={{
        x: [0, 2.2, -1.4, 0],
        y: [0, -1.8, 1, 0],
        skewX: [0, 0.35, 0, -0.28, 0],
      }}
      transition={{
        duration: 18,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}
