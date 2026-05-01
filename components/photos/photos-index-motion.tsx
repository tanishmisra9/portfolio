"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Instagram, ArrowRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PhotosHeader } from "@/components/photos/photos-header";
import {
  GLASS_BUTTON_CLASSES,
  GLASS_BUTTON_SHEEN_BACKGROUND,
  GLASS_BUTTON_SHEEN_CLASSES,
} from "@/components/ui/class-constants";
import { photosEntranceVariants } from "@/lib/photos-motion";
import type { RandomPhotoCandidate } from "@/data/photos";

const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

const OVERLAY_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const SHUTTER_SFX_SRC = "/sfx/camera.mp3";
const SURPRISE_BOKEH_ORBS = [
  {
    className:
      "-left-10 top-[9%] h-40 w-40 md:-left-16 md:top-[10%] md:h-56 md:w-56",
    background:
      "radial-gradient(circle, rgba(255, 216, 168, 0.18) 0%, rgba(255, 216, 168, 0.1) 26%, rgba(255, 216, 168, 0.05) 42%, transparent 72%)",
  },
  {
    className:
      "right-[-2.25rem] top-[16%] h-44 w-44 md:right-[6%] md:top-[13%] md:h-64 md:w-64",
    background:
      "radial-gradient(circle, rgba(176, 220, 255, 0.16) 0%, rgba(176, 220, 255, 0.09) 28%, rgba(176, 220, 255, 0.04) 44%, transparent 74%)",
  },
  {
    className:
      "left-[14%] top-[58%] h-32 w-32 md:left-[16%] md:top-[68%] md:h-48 md:w-48",
    background:
      "radial-gradient(circle, rgba(255, 178, 200, 0.11) 0%, rgba(255, 178, 200, 0.06) 28%, rgba(255, 178, 200, 0.03) 42%, transparent 74%)",
  },
  {
    className:
      "right-[8%] top-[70%] h-36 w-36 md:right-[12%] md:top-[74%] md:h-52 md:w-52",
    background:
      "radial-gradient(circle, rgba(255, 246, 197, 0.12) 0%, rgba(255, 246, 197, 0.07) 28%, rgba(255, 246, 197, 0.03) 42%, transparent 74%)",
  },
  {
    className:
      "left-1/2 top-[33%] hidden h-24 w-24 -translate-x-1/2 md:block md:h-32 md:w-32",
    background:
      "radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 30%, rgba(255, 255, 255, 0.02) 42%, transparent 70%)",
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = new Audio(SHUTTER_SFX_SRC);
    el.preload = "auto";
    audioRef.current = el;

    return () => {
      audioRef.current = null;
    };
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

  const playShutterSound = useCallback(() => {
    if (!audioRef.current) return;

    const sfx = audioRef.current.cloneNode() as HTMLAudioElement;
    sfx.volume = 0.6;
    void sfx.play().catch(() => {});
  }, []);

  const handleSurpriseMe = useCallback(() => {
    if (randomPhotos.length === 0) return;

    const nextPhoto =
      randomPhotos[Math.floor(Math.random() * randomPhotos.length)];
    setSelectedPhoto(nextPhoto);
    playShutterSound();
  }, [playShutterSound, randomPhotos]);

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
                  className="fixed inset-0 z-[10002] flex items-center justify-center p-5 md:p-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={overlayTransition}
                >
                  <motion.button
                    type="button"
                    onClick={closeOverlay}
                    className="absolute inset-0 bg-black/62 backdrop-blur-md md:backdrop-blur-xl"
                    aria-label="Close surprise photo"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={overlayTransition}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                  >
                    {SURPRISE_BOKEH_ORBS.map((orb, index) => (
                      <div
                        key={index}
                        className={`absolute rounded-full opacity-90 md:opacity-100 ${orb.className}`}
                        style={{ background: orb.background }}
                      />
                    ))}
                  </div>
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="surprise-photo-title"
                    className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 bg-black/45 shadow-[0_24px_90px_-28px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.16)] backdrop-blur-lg md:backdrop-blur-2xl"
                    initial={
                      reduceMotion
                        ? { opacity: 1 }
                        : { opacity: 0, y: 24, scale: 0.985 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 18, scale: 0.985 }
                    }
                    transition={overlayTransition}
                  >
                    <button
                      ref={closeButtonRef}
                      type="button"
                      onClick={closeOverlay}
                      className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/45 text-neutral-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14)] backdrop-blur-md md:backdrop-blur-xl transition-[border-color,background-color,transform] duration-300 hover:-translate-y-[1px] hover:border-white/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      aria-label="Close surprise photo"
                    >
                      <X className="h-4 w-4" strokeWidth={1.9} aria-hidden />
                    </button>

                    <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_18rem]">
                      <div className="relative min-h-[18rem] bg-black/30 md:min-h-[34rem]">
                        <Image
                          src={selectedPhoto.src}
                          alt={selectedPhoto.alt}
                          fill
                          sizes="(max-width: 768px) 100vw, 75vw"
                          className="object-contain"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                          quality={72}
                        />
                      </div>

                      <div className="flex flex-col justify-between gap-6 border-t border-white/10 p-6 md:border-l md:border-t-0 md:p-7">
                        <div>
                          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-neutral-500">
                            Surprise Pick
                          </p>
                          <h2
                            id="surprise-photo-title"
                            className="mt-3 font-display text-[clamp(2rem,5vw,3rem)] font-bold uppercase leading-none tracking-tighter text-white"
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
                          <span className="relative inline-flex items-center gap-2">
                            Go to {selectedPhoto.collectionTitle}
                            <ArrowRight
                              className="h-4 w-4 shrink-0"
                              strokeWidth={1.8}
                              aria-hidden
                            />
                          </span>
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
