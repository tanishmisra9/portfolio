"use client";

import Image from "next/image";
import { m as motion, useReducedMotion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { AlbumTitle } from "@/components/photos/album-title";
import { ScrollReveal } from "@/components/scroll-reveal";
import { CONTENT_SUBTITLE_CLASSES } from "@/components/ui/class-constants";
import { BackButton } from "@/components/ui/back-button";
import { photosEntranceVariants } from "@/lib/photos-motion";
import type { Photo } from "@/types/content";

const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

type Props = {
  title: string;
  slug: string;
  description: string;
  photos: Photo[];
};

const DEFAULT_IMG_W = 4032;
const DEFAULT_IMG_H = 3024;
// The column's real width (measured: viewport − ~70px, capped at ~1067px from a ~1135px viewport up), so the browser picks
// the right file. "100vw" on phones fetched the 1280px file for a 322px image (1080 covers 3×); "896px" undersized desktop.
const SINGLE_SIZES = "(max-width: 1140px) calc(100vw - 72px), 1068px";
const DUET_SIZES = "(max-width: 1140px) calc(50vw - 44px), 526px"; // two per row, 16px gap

export function PhotoAlbumMotion({ title, slug, description, photos }: Props) {
  const reduceMotion = useReducedMotion();
  const { root, item, albumGridSlot } = photosEntranceVariants(reduceMotion);
  const [headingsComplete, setHeadingsComplete] = useState(!!reduceMotion);
  const headingsGateRef = useRef(false);
  const onTitleBlockAnimationComplete = useCallback(() => {
    if (headingsGateRef.current) return;
    headingsGateRef.current = true;
    setHeadingsComplete(true);
  }, []);

  return (
    <motion.div
      // Same container as the header and the blog post page: back button, title and photos share the "TM" logo's left edge.
      className="relative left-1/2 w-screen max-w-6xl -translate-x-1/2 px-6"
      variants={root}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        {/* Back to the collections, not the top of /photos (which would replay the whole scroll intro). */}
        <BackButton href="/photos#collections" label="Back to photos" />
      </motion.div>
      <motion.div
        variants={item}
        onAnimationComplete={onTitleBlockAnimationComplete}
        className="max-w-5xl pl-5"
      >
        <AlbumTitle title={title} slug={slug} />
        <p className={CONTENT_SUBTITLE_CLASSES}>
          {description}
        </p>
      </motion.div>
      <motion.div
        variants={albumGridSlot}
        initial="hidden"
        animate="show"
        className="mt-12 flex max-w-5xl flex-col gap-10 pl-5 md:mt-16 md:gap-10"
      >
        {photos.map((photo, index) =>
          photo.duetWith ? (
            <ScrollReveal
              key={`${photo.src}-${index}`}
              variant="slide"
              photoAlbumStaggerIndex={index}
              photoAlbumIntroComplete={headingsComplete}
              reducedMotion={!!reduceMotion}
              className="grid grid-cols-2 gap-4"
            >
              <figure className="m-0">
                <Image
                  key={photo.src}
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width ?? DEFAULT_IMG_W}
                  height={photo.height ?? DEFAULT_IMG_H}
                  style={{ width: "100%", height: "auto" }}
                  sizes={DUET_SIZES}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  quality={72}
                  className="rounded-md border border-border"
                  priority={index === 0}
                  fetchPriority={index === 0 ? "high" : undefined}
                />
              </figure>
              <figure className="m-0">
                <Image
                  key={photo.duetWith.src}
                  src={photo.duetWith.src}
                  alt={photo.duetWith.alt}
                  width={photo.duetWith.width ?? DEFAULT_IMG_W}
                  height={photo.duetWith.height ?? DEFAULT_IMG_H}
                  style={{ width: "100%", height: "auto" }}
                  sizes={DUET_SIZES}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  quality={72}
                  className="rounded-md border border-border"
                />
              </figure>
            </ScrollReveal>
          ) : (
            <ScrollReveal
              key={`${photo.src}-${index}`}
              variant="slide"
              photoAlbumStaggerIndex={index}
              photoAlbumIntroComplete={headingsComplete}
              reducedMotion={!!reduceMotion}
              className="m-0"
            >
              <figure className="m-0">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width ?? DEFAULT_IMG_W}
                  height={photo.height ?? DEFAULT_IMG_H}
                  style={{ width: "100%", height: "auto" }}
                  sizes={SINGLE_SIZES}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  quality={72}
                  className="rounded-md border border-border"
                  priority={index === 0}
                  fetchPriority={index === 0 ? "high" : undefined}
                />
                {photo.caption ? (
                  <figcaption className="mt-3 text-lg text-muted md:text-xl">
                    {photo.caption}
                  </figcaption>
                ) : null}
              </figure>
            </ScrollReveal>
          ),
        )}
      </motion.div>
    </motion.div>
  );
}
