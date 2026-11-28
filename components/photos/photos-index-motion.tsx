"use client";

import Image from "next/image";
import Link from "next/link";
import { m as motion, useReducedMotion } from "framer-motion";
import { PhotosHeader } from "@/components/photos/photos-header";
import {
  GLASS_BUTTON_SHEEN_BACKGROUND,
  GLASS_BUTTON_SHEEN_CLASSES,
} from "@/components/ui/class-constants";
import { PencilNote, PhotosIntro, useIntroSound } from "@/components/photos/photos-intro";
import { photosEntranceVariants } from "@/lib/photos-motion";

export type PhotosIndexCollection = {
  slug: string;
  title: string;
  coverImage: string;
  /** Image count, duets counted as two. */
  frames: number;
  /** Contact-strip thumbnails: the album's first photos after the cover. */
  strip: string[];
};

type CollectionTileProps = {
  collection: PhotosIndexCollection;
  index: number;
  hero: boolean;
};

// Real rendered widths (measured at 390–1440), so phones stop fetching files sized for the full viewport. The grid is the
// viewport − 50px, capped at 1222px; other tiles sit two to a row from 640px (26px gap); strips are 4 (hero) or 3 across.
const COVER_SIZES = {
  hero: "(max-width: 1272px) calc(100vw - 50px), 1222px",
  tile: "(max-width: 639px) calc(100vw - 50px), (max-width: 1272px) calc(50vw - 38px), 598px",
};
const STRIP_SIZES = {
  hero: "(max-width: 1272px) calc(25vw - 17px), 300px",
  tile: "(max-width: 639px) calc(33vw - 21px), (max-width: 1272px) calc(17vw - 17px), 195px",
};

// The bordered "Show more" button (GLASS_BUTTON_CLASSES) in sentence case, standard size and full-brightness text
// (owner): not the small spaced caps the other glass buttons use.
const SKIP_BUTTON =
  "group relative inline-flex items-center justify-center rounded-none border border-border-strong bg-fg/[0.06] px-6 py-3 font-sans text-base text-fg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_10px_30px_-12px_rgba(0,0,0,0.6)] transition-[border-color,background-color,transform] duration-300 hover:-translate-y-[1px] hover:border-fg/30 hover:bg-fg/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

const DIP_IN_MS = 90;
const DIP_HOLD_MS = 80; // lets iOS paint the destination (~4500px away, never drawn yet) before the cover lifts
const DIP_OUT_MS = 200;

/**
 * "Skip to the photos" as a dip, the theme switch's pattern (theme-toggle.tsx): a cover in the page's background colour
 * fades in, the jump happens underneath, and the cover fades out. A bare jump still flickered on the owner's iPhone after
 * the note was fixed to draw lit on the first frame (probe: heading at full opacity from that frame): iOS shows a
 * never-painted region a beat before its pixels are ready. The cover sits below the sticky nav (z-50), which doesn't
 * change. Timers, not rAF (a hidden tab would strand the cover). Reduced motion: a plain jump.
 */
function dipJump(target: HTMLElement) {
  const jump = () => {
    target.scrollIntoView({ block: "start" });
    history.pushState(null, "", "#collections");
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return jump();
  const cover = document.createElement("div");
  cover.setAttribute("aria-hidden", "true");
  cover.style.cssText = `position:fixed;inset:0;z-index:40;pointer-events:none;opacity:0;background:${getComputedStyle(document.body).backgroundColor};transition:opacity ${DIP_IN_MS}ms ease-out`;
  document.body.appendChild(cover);
  cover.getBoundingClientRect(); // commit opacity 0 so the change below transitions
  cover.style.opacity = "1";
  window.setTimeout(() => {
    jump();
    window.setTimeout(() => {
      cover.style.transition = `opacity ${DIP_OUT_MS}ms ease-in`;
      cover.style.opacity = "0";
      window.setTimeout(() => cover.remove(), DIP_OUT_MS + 30);
    }, DIP_HOLD_MS);
  }, DIP_IN_MS + 20);
}

function CollectionTile({ collection, index, hero }: CollectionTileProps) {
  return (
    <Link
      href={`/photos/${collection.slug}`}
      className="group relative block outline-none transition-transform duration-200 ease-out after:pointer-events-none after:absolute after:-inset-3 after:border after:border-fg after:opacity-0 after:shadow-[5px_5px_0_rgb(var(--fg-rgb)/0.2)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:after:opacity-100 focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5 focus-visible:after:opacity-100 motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-x-0 motion-reduce:focus-visible:translate-y-0"
    >
      <div
        data-collection-tile={index === 0 ? "" : undefined}
        className={`viewfinder viewfinder-cover relative overflow-hidden border border-border ${
          hero ? "aspect-[4/3] sm:aspect-[16/9]" : "aspect-[4/3]"
        }`}
      >
        <Image
          src={collection.coverImage}
          alt=""
          fill
          sizes={hero ? COVER_SIZES.hero : COVER_SIZES.tile}
          className="object-cover"
          quality={68}
          // No `priority`: the collections sit below the title, the 900svh intro and the note (~11 screens down), so preloading
          // the first two covers at high priority only competed with fonts, JS and hydration. The page's LCP is the title.
        />
      </div>
      {collection.strip.length > 0 && (
        <div className={`mt-1.5 grid gap-1.5 ${hero ? "grid-cols-4" : "grid-cols-3"}`}>
          {collection.strip.map((src) => (
            <div key={src} className="relative aspect-[4/3] overflow-hidden border border-border">
              <Image src={src} alt="" fill sizes={hero ? STRIP_SIZES.hero : STRIP_SIZES.tile} quality={68} className="object-cover" />
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-baseline gap-3">
        <span className="font-mono text-sm text-dim">{String(index + 1).padStart(2, "0")}</span>
        {/* Instant outline rectangle around the title on hover/focus, as on the Thoughts cards. */}
        <span className="relative -ml-2 px-2 py-1 font-display text-xl font-bold capitalize tracking-tight text-fg md:text-2xl">
          {collection.title}
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
        </span>
        <span className="ml-auto shrink-0 font-mono text-sm text-dim">
          {collection.frames} {collection.frames === 1 ? "frame" : "frames"}
        </span>
      </div>
    </Link>
  );
}

type Props = {
  collections: PhotosIndexCollection[];
};

export function PhotosIndexMotion({ collections }: Props) {
  const reduceMotion = useReducedMotion();
  const { root, item, gridSection } = photosEntranceVariants(reduceMotion);
  const sound = useIntroSound(); // one pencil sound for the intro and the note

  return (
    <motion.div
      className="mx-auto max-w-6xl"
      variants={root}
      initial="hidden"
      animate="show"
    >
      {/* First screen = the title, so the intro starts right at the fold
          (offset = header 5rem + main's top padding). */}
      <div className="relative flex min-h-[calc(100svh-8rem)] flex-col justify-center pb-[36svh] md:min-h-[calc(100svh-11rem)]">
        <motion.div variants={item}>
          <PhotosHeader />
        </motion.div>
        {/* Straight past the intro to the albums (owner). An instant anchor jump (scroll-behavior is auto): a smooth
            scroll would race through the whole scrubbed intro and fire every pencil stroke's sound on the way. */}
        {/* The site's bordered button (as "Show more"), low on the first screen (owner: "more of a button", lower), and
            it lands on "Here's my work.", where #collections now starts (owner), not the first album. Absolute, so the title stays centred where it was. */}
        <motion.div variants={item} className="absolute inset-x-0 bottom-[14svh] flex justify-center">
          <a
            href="#collections"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              const target = document.getElementById("collections");
              if (!target) return; // no JS-side target: let the plain anchor jump
              e.preventDefault();
              dipJump(target);
            }}
            className={SKIP_BUTTON}
          >
            <span aria-hidden className={GLASS_BUTTON_SHEEN_CLASSES} style={{ background: GLASS_BUTTON_SHEEN_BACKGROUND }} />
            <span className="relative">Skip to the photos</span>
          </a>
        </motion.div>
      </div>
      <PhotosIntro sound={sound} />
      <PencilNote sound={sound} />
      <motion.div
        data-collection-grid
        variants={gridSection}
        className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 md:gap-y-16"
      >
        {collections.map((collection, index) => (
          <motion.div key={collection.slug} variants={item} className={index === 0 ? "sm:col-span-2" : undefined}>
            <CollectionTile collection={collection} index={index} hero={index === 0} />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
