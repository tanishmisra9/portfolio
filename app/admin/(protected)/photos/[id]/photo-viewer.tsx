"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import type { photos } from "@/db/schema";

type Photo = InferSelectModel<typeof photos>;

/** The public "Surprise!" photo dialog, cut down for the admin: same look, plus caption and alt text, none of the extras. */
export function PhotoViewer({ photo, onClose }: { photo: Photo | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!photo) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // The close button is the only focusable thing in the dialog, so Tab just stays on it.
      if (e.key === "Tab") {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [photo, onClose]);

  if (!photo) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm md:p-8"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Photo preview"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 bg-neutral-950/95 shadow-[0_24px_90px_-28px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.16)]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close photo preview"
          className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/45 text-neutral-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14)] transition-[border-color,background-color] duration-300 hover:border-white/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <X className="h-4 w-4" strokeWidth={1.9} aria-hidden />
        </button>
        <div className="grid md:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="relative aspect-[3/2] max-h-[min(80vh,44rem)] overflow-hidden bg-neutral-950">
            <Image
              src={photo.blobUrl}
              alt={photo.alt}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-contain"
              quality={72}
            />
          </div>
          <div className="flex min-w-0 flex-col justify-center gap-6 border-t border-white/10 p-6 md:border-l md:border-t-0 md:p-7">
            <div>
              <p className="text-base text-neutral-400">Caption</p>
              <p className="mt-2 break-words text-sm leading-relaxed text-neutral-300">{photo.caption || "No caption"}</p>
            </div>
            <div>
              <p className="text-base text-neutral-400">Alt text</p>
              <p className="mt-2 break-words text-sm leading-relaxed text-neutral-300">{photo.alt || "No alt text"}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
