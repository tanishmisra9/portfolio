"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { BlogPostMeta } from "@/lib/blog";

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
        className="heading-bleed-mobile select-none text-center font-display text-[clamp(2.75rem,10.5vw,6.5rem)] font-extrabold uppercase leading-none tracking-tighter sm:text-[clamp(3rem,11.5vw,7rem)] md:max-w-full md:text-[min(8.2vw,6.75rem)] heading-ghost heading-ghost-photos"
      >
        Blog
      </motion.h1>

      {posts.length === 0 ? (
        <motion.p variants={item} className="mt-8 text-neutral-500">
          No posts yet.
        </motion.p>
      ) : (
        <ul className="mt-12 space-y-5">
          {posts.map((post) => (
            <motion.li key={post.slug} variants={item}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-md border border-white/10 bg-black/40 p-8 backdrop-blur-md transition-colors duration-200 hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <time className="font-mono text-xs uppercase tracking-wide text-neutral-500">
                  {new Date(`${post.date}T00:00`).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "long", day: "numeric" },
                  )}
                </time>
                <h2 className="mt-2 font-display text-2xl font-bold text-white transition-colors group-hover:text-neutral-300">
                  {post.title}
                </h2>
                <p className="mt-2 text-neutral-400">{post.description}</p>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
