"use client";

import { PAGE_TITLE_CLASSES } from "@/components/ui/class-constants";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Copy } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { BlogPostMeta } from "@/types/content";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function CopyLink({ slug }: { slug: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    let result = "Copied!";
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/thoughts/${slug}`,
      );
    } catch {
      result = "Couldn't copy";
    }
    setMsg(result);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 1500);
  };
  return (
    <span className="absolute right-4 top-4 z-10">
      <IconButton icon={<Copy />} label={msg ?? "Copy link"} onClick={copy} />
      <span role="status" className="sr-only">
        {msg}
      </span>
    </span>
  );
}

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
      <motion.h1 variants={titleItem} className={PAGE_TITLE_CLASSES}>
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
              <div className="group/card relative block rounded-md border border-border bg-surface p-8 backdrop-blur-md transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-fg hover:shadow-[5px_5px_0_rgb(var(--fg-rgb)/0.2)] has-[:focus-visible]:-translate-x-0.5 has-[:focus-visible]:-translate-y-0.5 has-[:focus-visible]:border-fg has-[:focus-visible]:shadow-[5px_5px_0_rgb(var(--fg-rgb)/0.2)] motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:has-[:focus-visible]:translate-x-0 motion-reduce:has-[:focus-visible]:translate-y-0">
                <CopyLink slug={post.slug} />
                {/* Flush with the title and description (one left axis), body face, tabular figures. */}
                <time dateTime={post.date} className="block text-sm tabular-nums text-dim">
                  {new Date(`${post.date}T00:00`).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                {/* The card is the hover/focus target (group): an outline rectangle appears around the title instantly, and disappears instantly. */}
                <h2 className="-ml-3 mt-1 w-fit font-display text-2xl font-bold text-fg">
                  {/* Stretched link: its ::after covers the whole card (nearest positioned ancestor), so the card is one click target but the link's accessible name is just the title. */}
                  <Link
                    href={`/thoughts/${post.slug}`}
                    className="after:absolute after:inset-0 after:z-[1] after:rounded-md focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-fg/70"
                  >
                    <span className="relative block px-3 py-1.5">
                      {post.title}
                      <svg
                        aria-hidden
                        className="pointer-events-none absolute inset-0 size-full overflow-visible"
                      >
                        <rect
                          width="100%"
                          height="100%"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          pathLength={1}
                          className="[stroke-dasharray:1] [stroke-dashoffset:1] group-hover/card:[stroke-dashoffset:0] group-has-[:focus-visible]/card:[stroke-dashoffset:0]"
                        />
                      </svg>
                    </span>
                  </Link>
                </h2>
                <p className="mt-2 text-muted transition-colors duration-200 group-hover/card:text-fg group-has-[:focus-visible]/card:text-fg">
                  {post.description}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
