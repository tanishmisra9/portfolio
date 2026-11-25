"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { PhotosHeader } from "@/components/photos/photos-header";
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
          sizes={hero ? "(max-width: 640px) 100vw, 1152px" : "(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 600px"}
          className="object-cover"
          quality={68}
          priority={index < 2}
        />
      </div>
      {collection.strip.length > 0 && (
        <div className={`mt-1.5 grid gap-1.5 ${hero ? "grid-cols-4" : "grid-cols-3"}`}>
          {collection.strip.map((src) => (
            <div key={src} className="relative aspect-[4/3] overflow-hidden border border-border">
              <Image src={src} alt="" fill sizes="(max-width: 640px) 33vw, 290px" quality={68} className="object-cover" />
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
      <div className="flex min-h-[calc(100svh-8rem)] flex-col justify-center pb-[36svh] md:min-h-[calc(100svh-11rem)]">
        <motion.div variants={item}>
          <PhotosHeader />
        </motion.div>
        <a
          href="#collections"
          className="sr-only focus:not-sr-only focus:font-mono focus:text-sm focus:text-fg"
        >
          Skip to collections
        </a>
      </div>
      <PhotosIntro sound={sound} />
      <PencilNote sound={sound} />
      <motion.div
        id="collections"
        variants={gridSection}
        className="grid scroll-mt-32 grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 md:gap-y-16"
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
