"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { PhotosHeader } from "@/components/photos/photos-header";
import { photosEntranceVariants } from "@/lib/photos-motion";

export type PhotosIndexCollection = {
  slug: string;
  title: string;
  coverImage: string;
};

type Props = {
  collections: PhotosIndexCollection[];
};

export function PhotosIndexMotion({ collections }: Props) {
  const reduceMotion = useReducedMotion();
  const { root, item, gridSection } = photosEntranceVariants(reduceMotion);

  return (
    <motion.div
      className="mx-auto max-w-6xl"
      variants={root}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <PhotosHeader />
      </motion.div>
      <motion.div variants={item} className="mt-6 flex flex-wrap items-center gap-4 md:mt-8">
        <p className="select-none text-[1.375rem] leading-snug text-neutral-400">
          #ShotOniPhone17Pro
        </p>
        <a
          href="https://www.instagram.com/tanishtakespics/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-white/10 p-[0.6875rem] text-neutral-400 transition-colors hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          aria-label="Instagram"
        >
          <Instagram
            className="h-[1.375rem] w-[1.375rem]"
            strokeWidth={1.75}
            aria-hidden
          />
        </a>
      </motion.div>
      <motion.div
        variants={gridSection}
        className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 md:mt-16 md:gap-6"
      >
        {collections.map((collection, index) => (
          <motion.div key={collection.slug} variants={item}>
            <Link
              href={`/photos/${collection.slug}`}
              className="group relative block min-h-[280px] overflow-hidden rounded-md border border-white/10 transition-colors duration-200 hover:border-neutral-400"
            >
              <Image
                src={collection.coverImage}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 600px"
                className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-[1.04]"
                priority={index < 2}
                unoptimized={collection.slug === "super-max"}
              />
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-6 text-center backdrop-blur-sm transition-colors duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:bg-black/50">
                <span className="select-none text-center font-display text-[clamp(1.4rem,5.8vw,3.1rem)] font-bold uppercase leading-none tracking-tighter text-[#e8e8e7]">
                  {collection.title}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
