"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Instagram } from "lucide-react";
import { useCallback, type PointerEvent } from "react";
import { PhotosHeader } from "@/components/photos/photos-header";
import { IconButton } from "@/components/ui/icon-button";
import { photosEntranceVariants } from "@/lib/photos-motion";

export type PhotosIndexCollection = {
  slug: string;
  title: string;
  coverImage: string;
};

type CollectionTileProps = {
  collection: PhotosIndexCollection;
  index: number;
};

function CollectionTile({ collection, index }: CollectionTileProps) {
  const updateSpotlight = useCallback(
    (target: HTMLAnchorElement, clientX: number, clientY: number) => {
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--hover-x", `${clientX - rect.left}px`);
      target.style.setProperty("--hover-y", `${clientY - rect.top}px`);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLAnchorElement>) => {
      updateSpotlight(event.currentTarget, event.clientX, event.clientY);
      event.currentTarget.dataset.spotlight = "on";
    },
    [updateSpotlight],
  );

  const handlePointerEnter = useCallback(
    (event: PointerEvent<HTMLAnchorElement>) => {
      updateSpotlight(event.currentTarget, event.clientX, event.clientY);
      event.currentTarget.dataset.spotlight = "on";
    },
    [updateSpotlight],
  );

  const handlePointerLeave = useCallback(
    (event: PointerEvent<HTMLAnchorElement>) => {
      event.currentTarget.dataset.spotlight = "off";
    },
    [],
  );

  return (
    <Link
      href={`/photos/${collection.slug}`}
      className="collection-tile group relative block min-h-[280px] overflow-hidden rounded-md border border-border transition-colors duration-200 hover:border-border-strong"
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      data-spotlight="off"
    >
      <Image
        src={collection.coverImage}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 600px"
        className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-[1.04]"
        quality={68}
        priority={index < 2}
      />
      <span className="collection-tile-spotlight" aria-hidden />
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-6 text-center backdrop-blur-sm transition-colors duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:bg-black/50">
        <span className="select-none text-center font-display text-[clamp(2.1rem,7vw,3.1rem)] font-bold uppercase leading-none tracking-tight text-[#e8e8e7]">
          {collection.title}
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
      <motion.div
        variants={item}
        className="mt-6 flex flex-wrap items-center justify-center gap-4 md:mt-8"
      >
        <IconButton href="https://www.instagram.com/tanishtakespics/" icon={<Instagram />} label="Instagram" />
        <p className="select-none text-[1.375rem] leading-snug text-muted">
          #ShotOniPhone17Pro
        </p>
      </motion.div>
      <motion.div
        variants={gridSection}
        className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 md:mt-16 md:gap-6"
      >
        {collections.map((collection, index) => (
          <motion.div key={collection.slug} variants={item}>
            <CollectionTile collection={collection} index={index} />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
