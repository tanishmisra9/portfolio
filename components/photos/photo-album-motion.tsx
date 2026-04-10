"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { photosEntranceVariants } from "@/lib/photos-motion";

const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

export type PhotoAlbumPhoto = {
  src: string;
  alt: string;
  caption?: string;
};

type Props = {
  title: string;
  description: string;
  photos: PhotoAlbumPhoto[];
};

export function PhotoAlbumMotion({ title, description, photos }: Props) {
  const reduceMotion = useReducedMotion();
  const { root, item, gridSection } = photosEntranceVariants(reduceMotion);

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
      <motion.div variants={item}>
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tighter text-white md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-lg text-neutral-400 md:text-xl">{description}</p>
      </motion.div>
      <motion.div
        variants={gridSection}
        className="mt-12 flex flex-col gap-10 md:mt-16 md:gap-10"
      >
        {photos.map((photo, index) => (
          <motion.figure key={`${photo.src}-${index}`} variants={item} className="m-0">
            <Image
              src={photo.src}
              alt={photo.alt}
              width={4032}
              height={3024}
              style={{ width: "100%", height: "auto" }}
              sizes="(max-width: 768px) 100vw, 896px"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="rounded-md border border-white/10"
              priority={index === 0}
            />
            {photo.caption ? (
              <figcaption className="mt-3 text-lg text-neutral-400 md:text-xl">
                {photo.caption}
              </figcaption>
            ) : null}
          </motion.figure>
        ))}
      </motion.div>
    </motion.div>
  );
}
