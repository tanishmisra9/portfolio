"use client";

import { PAGE_TITLE_CLASSES } from "@/components/ui/class-constants";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { copyText } from "@/lib/copy-text";
import { SOFT_BRIGHTEN, SOFT_FILL_GROUP, SoftFill } from "@/components/ui/soft-fill";
import { m as motion, useReducedMotion, type Variants } from "framer-motion";
import type { BlogPostMeta } from "@/types/content";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const ICON_SWAP = "transition-[opacity,filter,transform] duration-200 ease-out motion-reduce:transition-none";
const ICON_OUT = "scale-75 opacity-0 blur-[3px]";

function CopyLink({ slug }: { slug: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    const ok = await copyText(`${window.location.origin}/thoughts/${slug}`);
    setMsg(ok ? "Copied!" : "Couldn't copy");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 1500);
  };
  return (
    <span className="absolute right-4 top-4 z-10">
      {/* A tick for the 1.5s after a successful copy, then back to the copy icon. Both icons share one grid cell and
          blur-fade into each other (CSS, 200ms); reduced motion swaps instantly. */}
      <IconButton
        icon={
          <span className="grid [&>*]:col-start-1 [&>*]:row-start-1">
            <Copy className={`${ICON_SWAP} ${msg === "Copied!" ? ICON_OUT : ""}`} />
            <Check className={`${ICON_SWAP} ${msg === "Copied!" ? "" : ICON_OUT}`} />
          </span>
        }
        label={msg ?? "Copy link"}
        onClick={copy}
      />
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
              {/* The site's content hover (components/ui/soft-fill.tsx): a soft grey fill rises; the description brightens. */}
              <div className={`${SOFT_FILL_GROUP} block rounded-md border border-border bg-surface p-8`}>
                <SoftFill />
                <CopyLink slug={post.slug} />
                {/* Flush with the title and description (one left axis), body face, tabular figures. */}
                <time dateTime={post.date} className="block text-sm tabular-nums text-dim">
                  {new Date(`${post.date}T00:00`).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <h2 className="mt-2.5 font-display text-2xl font-bold text-fg">
                  {/* Stretched link: its ::after covers the whole card (nearest positioned ancestor), so the card is one click target but the link's accessible name is just the title. */}
                  <Link
                    href={`/thoughts/${post.slug}`}
                    className="after:absolute after:inset-0 after:z-[1] after:rounded-md focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-fg/70"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className={`mt-3.5 text-muted ${SOFT_BRIGHTEN}`}>
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
