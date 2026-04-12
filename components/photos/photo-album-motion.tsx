"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { photosEntranceVariants } from "@/lib/photos-motion";
import type { Photo } from "@/data/photos";

const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

type Props = {
  title: string;
  description: string;
  photos: Photo[];
};

const DEFAULT_IMG_W = 4032;
const DEFAULT_IMG_H = 3024;

export function PhotoAlbumMotion({ title, description, photos }: Props) {
  const reduceMotion = useReducedMotion();
  const { root, item, albumGridSlot } = photosEntranceVariants(reduceMotion);
  const [headingsComplete, setHeadingsComplete] = useState(!!reduceMotion);
  const headingsGateRef = useRef(false);
  const onTitleBlockAnimationComplete = useCallback(() => {
    if (headingsGateRef.current) return;
    headingsGateRef.current = true;
    setHeadingsComplete(true);
  }, []);
  /** Bypass `/_next/image` cache — stale WebP for same public URL showed wrong duet/thumbs after replacing files. */
  const superMaxAlbum = title === "Super Max";
  /** Safari: `placeholder="blur"` can leave Next’s blur layer stuck until `img.decode()` settles; empty avoids a black box while pixels already loaded. */
  const superMaxPlaceholder = superMaxAlbum ? "empty" : "blur";
  const superMaxBlurData = superMaxAlbum ? {} : { blurDataURL: BLUR_DATA_URL };

  return (
    <motion.div
      className="mx-auto max-w-4xl"
      variants={root}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <Link
          href="/photos"
          className="mb-10 inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 md:mb-12"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to photos
        </Link>
      </motion.div>
      <motion.div
        variants={item}
        onAnimationComplete={onTitleBlockAnimationComplete}
      >
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tighter text-white md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-lg text-neutral-400 md:text-xl">{description}</p>
      </motion.div>
      <motion.div
        variants={albumGridSlot}
        initial="hidden"
        animate="show"
        className="mt-12 flex flex-col gap-10 md:mt-16 md:gap-10"
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
                  width={DEFAULT_IMG_W}
                  height={DEFAULT_IMG_H}
                  style={{ width: "100%", height: "auto" }}
                  sizes="(max-width: 768px) 50vw, 448px"
                  placeholder={superMaxPlaceholder}
                  {...superMaxBlurData}
                  className="rounded-md border border-white/10"
                  priority={index === 0}
                  unoptimized={superMaxAlbum}
                />
              </figure>
              <figure className="m-0">
                <Image
                  key={photo.duetWith.src}
                  src={photo.duetWith.src}
                  alt={photo.duetWith.alt}
                  width={DEFAULT_IMG_W}
                  height={DEFAULT_IMG_H}
                  style={{ width: "100%", height: "auto" }}
                  sizes="(max-width: 768px) 50vw, 448px"
                  placeholder={superMaxPlaceholder}
                  {...superMaxBlurData}
                  className="rounded-md border border-white/10"
                  priority={index === 0}
                  unoptimized={superMaxAlbum}
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
                  width={DEFAULT_IMG_W}
                  height={DEFAULT_IMG_H}
                  style={{ width: "100%", height: "auto" }}
                  sizes="(max-width: 768px) 100vw, 896px"
                  placeholder={superMaxPlaceholder}
                  {...superMaxBlurData}
                  className="rounded-md border border-white/10"
                  priority={index === 0}
                  unoptimized={superMaxAlbum}
                />
                {photo.caption ? (
                  <figcaption className="mt-3 text-lg text-neutral-400 md:text-xl">
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
