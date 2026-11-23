"use client";

import { PAGE_TITLE_CLASSES } from "@/components/ui/class-constants";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { BlogPostMeta } from "@/types/content";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function BlogIndexMotion({ posts }: { posts: BlogPostMeta[] }) {
  const reduceMotion = useReducedMotion();

  const root: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } },
  };
  const item: Variants = reduceMotion
    ? {
        hidden: { opacity: 1, x: 0, filter: "blur(0px)" },
        show: { opacity: 1, x: 0, filter: "blur(0px)" },
      }
    : {
        hidden: { opacity: 0, x: -32, filter: "blur(10px)" },
        show: {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
          transition: { duration: 0.5, ease: EASE },
        },
      };

  return (
    <motion.div
      className="mx-auto max-w-3xl"
      variants={root}
      initial="hidden"
      animate="show"
    >
      <motion.h1
        variants={item}
        className={PAGE_TITLE_CLASSES}
      >
        Blog
      </motion.h1>

      {posts.length === 0 ? (
        <motion.p variants={item} className="mt-8 text-dim">
          No posts yet.
        </motion.p>
      ) : (
        <ul className="mt-12 space-y-5">
          {posts.map((post) => (
            <motion.li key={post.slug} variants={item}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-md border border-border bg-surface p-8 backdrop-blur-md transition-colors duration-200 hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
              >
                <time className="font-mono text-xs uppercase tracking-wide text-dim">
                  {new Date(`${post.date}T00:00`).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "long", day: "numeric" },
                  )}
                </time>
                <h2 className="mt-2 font-display text-2xl font-bold text-fg transition-colors group-hover:text-fg">
                  {post.title}
                </h2>
                <p className="mt-2 text-muted">{post.description}</p>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
