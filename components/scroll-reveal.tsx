"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** "fade" for headers, "slide" for content items */
  variant?: "fade" | "slide";
};

export function ScrollReveal({
  children,
  className,
  variant = "slide",
}: Props) {
  return (
    <motion.div
      className={className}
      initial={
        variant === "fade"
          ? { opacity: 0 }
          : { opacity: 0, x: -40 }
      }
      whileInView={
        variant === "fade"
          ? { opacity: 1 }
          : { opacity: 1, x: 0 }
      }
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
