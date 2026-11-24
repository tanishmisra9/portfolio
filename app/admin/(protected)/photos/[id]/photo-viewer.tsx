"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import type { InferSelectModel } from "drizzle-orm";
import type { photos } from "@/db/schema";

// Only what the dialog shows, so a collection cover (no photo row) can use it too.
export type ViewerPhoto = Pick<InferSelectModel<typeof photos>, "blobUrl" | "alt" | "caption">;

/** A photo dialog for the admin: dark glass look, plus caption and alt text, none of the extras. */
export function PhotoViewer({ photo, onClose }: { photo: ViewerPhoto | null; onClose: () => void }) {
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/80 p-5 backdrop-blur-sm md:p-8"
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
        className="relative w-full max-w-5xl overflow-hidden border border-border-strong bg-bg"
      >
        <div className="absolute right-4 top-4 z-20 bg-bg">
          <IconButton ref={closeRef} icon={<X />} label="Close photo preview" onClick={onClose} />
        </div>
        <div className="grid md:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="relative aspect-[3/2] max-h-[min(80vh,44rem)] overflow-hidden bg-bg">
            <Image
              src={photo.blobUrl}
              alt={photo.alt}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-contain"
              quality={72}
            />
          </div>
          <div className="flex min-w-0 flex-col justify-center gap-6 border-t border-border p-6 md:border-l md:border-t-0 md:p-7">
            <div>
              <p className="text-base text-dim">Caption</p>
              <p className="mt-2 break-words text-sm leading-relaxed text-fg">{photo.caption || "No caption"}</p>
            </div>
            <div>
              <p className="text-base text-dim">Alt text</p>
              <p className="mt-2 break-words text-sm leading-relaxed text-fg">{photo.alt || "No alt text"}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
