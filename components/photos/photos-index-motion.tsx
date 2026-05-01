"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Instagram, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PhotosHeader } from "@/components/photos/photos-header";
import {
  GLASS_BUTTON_CLASSES,
  GLASS_BUTTON_SHEEN_BACKGROUND,
  GLASS_BUTTON_SHEEN_CLASSES,
} from "@/components/ui/class-constants";
import { photosEntranceVariants } from "@/lib/photos-motion";
import type { RandomPhotoCandidate } from "@/data/photos";

const OVERLAY_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const SURPRISE_BOKEH_ORBS = [
  {
    className:
      "-left-10 top-[9%] h-40 w-40 md:-left-16 md:top-[10%] md:h-56 md:w-56",
    background:
      "radial-gradient(circle, rgba(255, 216, 168, 0.12) 0%, rgba(255, 216, 168, 0.06) 30%, transparent 72%)",
  },
  {
    className:
      "right-[-2.25rem] top-[16%] h-44 w-44 md:right-[6%] md:top-[13%] md:h-64 md:w-64",
    background:
      "radial-gradient(circle, rgba(176, 220, 255, 0.11) 0%, rgba(176, 220, 255, 0.05) 30%, transparent 74%)",
  },
  {
    className:
      "left-[14%] top-[58%] h-32 w-32 md:left-[16%] md:top-[68%] md:h-48 md:w-48",
    background:
      "radial-gradient(circle, rgba(255, 178, 200, 0.08) 0%, rgba(255, 178, 200, 0.04) 28%, transparent 74%)",
  },
  {
    className:
      "right-[8%] top-[70%] h-36 w-36 md:right-[12%] md:top-[74%] md:h-52 md:w-52",
    background:
      "radial-gradient(circle, rgba(255, 246, 197, 0.08) 0%, rgba(255, 246, 197, 0.04) 28%, transparent 74%)",
  },
  {
    className:
      "left-1/2 top-[33%] hidden h-24 w-24 -translate-x-1/2 md:block md:h-32 md:w-32",
    background:
      "radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.025) 30%, transparent 70%)",
  },
];

export type PhotosIndexCollection = {
  slug: string;
  title: string;
  coverImage: string;
};

type Props = {
  collections: PhotosIndexCollection[];
  randomPhotos: RandomPhotoCandidate[];
};

export function PhotosIndexMotion({ collections, randomPhotos }: Props) {
  const reduceMotion = useReducedMotion();
  const { root, item, gridSection } = photosEntranceVariants(reduceMotion);
  const [selectedPhoto, setSelectedPhoto] = useState<RandomPhotoCandidate | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedPhoto) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedPhoto]);

  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedPhoto(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhoto]);

  const handleSurpriseMe = useCallback(() => {
    if (randomPhotos.length === 0) return;

    const nextPhoto =
      randomPhotos[Math.floor(Math.random() * randomPhotos.length)];
    setSelectedPhoto(nextPhoto);
  }, [randomPhotos]);

  const closeOverlay = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  const overlayTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: OVERLAY_EASE };

  return (
    <>
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
        <motion.div variants={item} className="mt-5 flex justify-center md:mt-6">
          <button
            type="button"
            onClick={handleSurpriseMe}
            className={GLASS_BUTTON_CLASSES}
          >
            <span
              aria-hidden
              className={GLASS_BUTTON_SHEEN_CLASSES}
              style={{ background: GLASS_BUTTON_SHEEN_BACKGROUND }}
            />
            <span className="relative">Surprise me!</span>
          </button>
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
                  quality={68}
                  priority={index < 2}
                />
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-6 text-center backdrop-blur-sm transition-colors duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:bg-black/50">
                  <span className="select-none text-center font-display text-[clamp(2.1rem,7vw,3.1rem)] font-bold uppercase leading-none tracking-tighter text-[#e8e8e7]">
                    {collection.title}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {selectedPhoto ? (
                <motion.div
                  key={selectedPhoto.src}
                  className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm md:p-8"
                  onClick={closeOverlay}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={overlayTransition}
                >
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={overlayTransition}
                  >
                    {SURPRISE_BOKEH_ORBS.map((orb, index) => (
                      <div
                        key={index}
                        className={`absolute rounded-full opacity-70 md:opacity-80 ${orb.className}`}
                        style={{ background: orb.background }}
                      />
                    ))}
                  </motion.div>
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="surprise-photo-title"
                    onClick={(event) => event.stopPropagation()}
                    className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 bg-neutral-950/95 shadow-[0_24px_90px_-28px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.16)]"
                    initial={
                      reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }
                    }
                    transition={overlayTransition}
                  >
                    <button
                      ref={closeButtonRef}
                      type="button"
                      onClick={closeOverlay}
                      className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/45 text-neutral-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14)] transition-[border-color,background-color,transform] duration-300 hover:-translate-y-[1px] hover:border-white/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      aria-label="Close surprise photo"
                    >
                      <X className="h-4 w-4" strokeWidth={1.9} aria-hidden />
                    </button>

                    <div
                      className="grid gap-0 md:grid-cols-[minmax(0,1fr)_22rem]"
                    >
                      <div className="relative aspect-[3/2] max-h-[min(80vh,44rem)] overflow-hidden bg-neutral-950 md:max-h-[min(80vh,44rem)]">
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 select-none font-mono text-[0.6rem] uppercase tracking-[0.32em] text-neutral-700"
                        >
                          Developing…
                        </span>
                        <div className="relative z-10 h-full w-full">
                          <Image
                            src={selectedPhoto.src}
                            alt={selectedPhoto.alt}
                            fill
                            className="object-contain"
                            quality={72}
                          />
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-col justify-center gap-8 border-t border-white/10 p-6 md:border-l md:border-t-0 md:p-7">
                        <div className="min-w-0">
                          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-neutral-500">
                            Surprise Pick
                          </p>
                          <h2
                            id="surprise-photo-title"
                            className="mt-3 font-display text-[clamp(1.6rem,4.4vw,2.6rem)] font-bold uppercase leading-[0.95] tracking-tighter text-white break-words [overflow-wrap:anywhere] [hyphens:auto]"
                          >
                            {selectedPhoto.collectionTitle}
                          </h2>
                          <p className="mt-4 text-sm leading-relaxed text-neutral-300 md:text-[0.98rem]">
                            {selectedPhoto.caption ?? selectedPhoto.alt}
                          </p>
                        </div>

                        <Link
                          href={`/photos/${selectedPhoto.collectionSlug}`}
                          className={GLASS_BUTTON_CLASSES}
                        >
                          <span
                            aria-hidden
                            className={GLASS_BUTTON_SHEEN_CLASSES}
                            style={{ background: GLASS_BUTTON_SHEEN_BACKGROUND }}
                          />
                          <span className="relative">{selectedPhoto.collectionTitle}</span>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
