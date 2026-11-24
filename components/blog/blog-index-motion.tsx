"use client";

import { PAGE_TITLE_CLASSES } from "@/components/ui/class-constants";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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

  // The title is heavy Poppins: a 10px blur turns it into a solid-looking block before it sharpens, so it gets a light one.
  const titleItem: Variants = reduceMotion
    ? item
    : {
        hidden: { opacity: 0, x: -32, filter: "blur(3px)" },
        show: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: EASE } },
      };

  return (
    <motion.div
      className="mx-auto max-w-3xl"
      variants={root}
      initial="hidden"
      animate="show"
    >
      <motion.h1
        variants={titleItem}
        className={PAGE_TITLE_CLASSES}
      >
        Thoughts
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
                className="group relative block rounded-md border border-border bg-surface p-8 backdrop-blur-md transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-fg hover:shadow-[5px_5px_0_rgb(var(--fg-rgb)/0.2)] focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5 focus-visible:border-fg focus-visible:shadow-[5px_5px_0_rgb(var(--fg-rgb)/0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-x-0 motion-reduce:focus-visible:translate-y-0"
              >
                <ChevronRight
                  aria-hidden
                  className="absolute right-6 top-6 size-6 -translate-x-1 text-fg opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
                  strokeWidth={1.75}
                />
                {/* Dateline: a hairline rule then the date in the body face (the post page's date voice), tabular figures so stacked cards line up. */}
                <div className="flex items-center gap-3 text-sm text-dim">
                  <span aria-hidden className="h-px w-5 bg-border-strong" />
                  <time dateTime={post.date} className="tabular-nums">
                    {new Date(`${post.date}T00:00`).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>
                {/* The card is the hover/focus target (group): an outline rectangle appears around the title instantly, and disappears instantly. */}
                <h2 className="relative -ml-3 mt-1 w-fit px-3 py-1.5 font-display text-2xl font-bold text-fg">
                  {post.title}
                  <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
                    <rect
                      width="100%"
                      height="100%"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      pathLength={1}
                      className="[stroke-dasharray:1] [stroke-dashoffset:1] group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0]"
                    />
                  </svg>
                </h2>
                <p className="mt-2 text-muted transition-colors duration-200 group-hover:text-fg group-focus-visible:text-fg">{post.description}</p>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
