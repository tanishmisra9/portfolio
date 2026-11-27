"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

// Same shared LQIP placeholder used by /photos (components/photos/photo-album-motion.tsx).
const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

type Props = { src: string; alt: string; width: number; height: number; caption?: string; linked?: boolean };

/** A post image that opens on its own, with its caption, in a native modal <dialog> (Esc, focus trap and focus return
 *  come with showModal). A linked image keeps its link and gets no preview: a button can't sit inside an <a>. */
export function PostImage({ src, alt, width, height, caption, linked }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const image = (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={{ width: "100%", height: "auto" }}
      sizes="(max-width: 768px) 100vw, 768px"
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
      quality={72}
      className="rounded-lg border border-border"
    />
  );
  if (linked) return image;

  return (
    <>
      <button
        type="button"
        aria-label={caption ? `Enlarge image: ${caption}` : "Enlarge image"}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          setOpen(true);
          dialog.current?.showModal();
        }}
        className="block w-full cursor-zoom-in rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
      >
        {image}
      </button>
      <dialog
        ref={dialog}
        aria-label={caption ?? alt ?? "Image"}
        onClose={() => setOpen(false)}
        // A click anywhere closes it (the dialog fills the screen, so this covers the backdrop, the image and the X).
        onClick={() => dialog.current?.close()}
        className="post-image-dialog m-0 h-dvh max-h-none w-screen max-w-none bg-bg p-0 text-fg outline-none backdrop:bg-transparent"
      >
        {open && (
          <div className="flex h-full flex-col items-center justify-center p-4 md:p-10">
            <div className="absolute right-4 top-4 md:right-6 md:top-6">
              <IconButton icon={<X />} label="Close" />
            </div>
            <figure className="flex min-h-0 flex-col items-center">
              <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                sizes="100vw"
                quality={75}
                loading="eager"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="h-auto max-h-[80dvh] w-auto max-w-full cursor-zoom-out object-contain"
              />
              {caption && <figcaption className="mt-4 text-center text-muted">{caption}</figcaption>}
            </figure>
          </div>
        )}
      </dialog>
    </>
  );
}
