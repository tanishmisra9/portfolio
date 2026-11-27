"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { X, ZoomOut } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

// Same shared LQIP placeholder used by /photos (components/photos/photo-album-motion.tsx).
const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

const MAX_ZOOM = 4;
const TAP_ZOOM = 2.5;
const DOUBLE_TAP_MS = 300; // a second tap this soon is ignored, so an iOS double-tap zooms in rather than in-and-out
const DRAG_PX = 6; // a press that moved further is a drag, not a tap
const FILL_MS = 220; // HoverFill's 200ms rise: a touch on the X closes once the fill is up

type Props = { src: string; alt: string; width: number; height: number; caption?: string; linked?: boolean };

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A post image that opens on its own, with its caption, in a native modal <dialog> (Esc, focus trap and focus return
 *  come with showModal). A linked image keeps its link and gets no preview: a button can't sit inside an <a>. */
export function PostImage({ src, alt, width, height, caption, linked }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pointerType = useRef("mouse");
  const closing = useRef(false);
  const resetZoom = useRef<() => void>(undefined); // set by Zoomable
  // Remounting the reset button drops the tooltip a tap opens on it, which would otherwise float for 1.5s over a button
  // that has just hidden itself.
  const [resetKey, setResetKey] = useState(0);
  const close = () => dialog.current?.close();

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
          closing.current = false;
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
        // The image zooms on click; anywhere else (backdrop, caption) closes. The X handles its own click.
        onClick={(e) => {
          if (!(e.target as Element).closest("[data-zoom], button")) close();
        }}
        // group/preview: Zoomable sets data-zoomed on the dialog past 1x (named, so HoverFill's own `group` is unaffected).
        className="post-image-dialog group/preview m-0 h-dvh max-h-none w-screen max-w-none touch-none bg-bg p-0 text-fg outline-none backdrop:bg-transparent"
      >
        {open && (
          <div className="flex h-full flex-col items-center justify-center overflow-hidden p-4 md:p-10">
            <figure className="flex min-h-0 max-w-full flex-col items-center">
              <Zoomable resetRef={resetZoom}>
                <Image
                  src={src}
                  alt={alt}
                  width={width}
                  height={height}
                  sizes="200vw"
                  quality={75}
                  loading="eager"
                  draggable={false}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="h-auto max-h-[80dvh] w-auto max-w-full select-none object-contain"
                />
              </Zoomable>
              {caption && (
                <figcaption className="relative mt-4 text-center text-muted transition-opacity duration-200 group-data-[zoomed]/preview:pointer-events-none group-data-[zoomed]/preview:opacity-0 motion-reduce:transition-none">
                  {caption}
                </figcaption>
              )}
            </figure>
            {/* After the figure so the zoomed image (a transformed, later-painted layer otherwise) never covers it. */}
            <div className="absolute right-4 top-4 z-10 flex gap-2 md:right-6 md:top-6" onPointerDown={(e) => (pointerType.current = e.pointerType)}>
              {/* Only while zoomed; `invisible` also takes it out of the Tab order at 1x. */}
              <div className="invisible opacity-0 transition-[opacity,visibility] duration-200 group-data-[zoomed]/preview:visible group-data-[zoomed]/preview:opacity-100 motion-reduce:transition-none">
                <IconButton
                  key={resetKey}
                  icon={<ZoomOut />}
                  label="Reset zoom"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetZoom.current?.();
                    setResetKey((k) => k + 1);
                  }}
                />
              </div>
              <IconButton
                icon={<X />}
                label="Close"
                onClick={(e) => {
                  e.stopPropagation();
                  if (closing.current) return;
                  // A tap closes in ~80ms, before HoverFill's 200ms rise shows (TapFill sets it on pointerdown): wait
                  // for the fill. Mouse (already filled by hover), keyboard (detail 0) and reduced motion close at once.
                  if (pointerType.current === "mouse" || e.detail === 0 || reduced()) return close();
                  closing.current = true;
                  setTimeout(close, FILL_MS);
                }}
              />
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

/** Pinch, drag-to-pan, tap/click to toggle zoom, and trackpad pinch (Chrome/Firefox ctrl+wheel, Safari gesture
 *  events). State lives in closure variables and is written straight to style.transform, so no React render per move.
 *  Mounted only while the dialog is open, so every open starts at 1x. */
function Zoomable({ children, resetRef }: { children: ReactNode; resetRef: React.RefObject<(() => void) | undefined> }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current!;
    const dlg = node.closest("dialog")!;
    let s = 1, x = 0, y = 0;

    const apply = (animate: boolean) => {
      s = Math.min(MAX_ZOOM, Math.max(1, s));
      // Edges can't pass the fitted box: at 1x the image is centred and can't move.
      const mx = (node.offsetWidth * (s - 1)) / 2;
      const my = (node.offsetHeight * (s - 1)) / 2;
      x = Math.min(mx, Math.max(-mx, x));
      y = Math.min(my, Math.max(-my, y));
      node.style.transition = animate && !reduced() ? "transform 200ms ease-out" : "none";
      node.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
      node.style.cursor = s > 1 ? "grab" : "zoom-in";
      dlg.toggleAttribute("data-zoomed", s > 1); // fades the caption out and the reset button in
    };
    // The untransformed centre in viewport coordinates (offset* ignore transforms; the offsetParent is the fixed dialog).
    const centre = () => {
      const p = (node.offsetParent ?? dlg).getBoundingClientRect();
      return [p.left + node.offsetLeft + node.offsetWidth / 2, p.top + node.offsetTop + node.offsetHeight / 2];
    };
    // Zoom to `ns`, keeping the image point under (px, py) — as seen at the baseline (bs, bx, by) — under (qx, qy).
    const zoomTo = (ns: number, px: number, py: number, base = { s, x, y }, qx = px, qy = py, animate = false) => {
      const [cx, cy] = centre();
      ns = Math.min(MAX_ZOOM, Math.max(1, ns));
      x = qx - cx - ((px - cx - base.x) * ns) / base.s;
      y = qy - cy - ((py - cy - base.y) * ns) / base.s;
      s = ns;
      apply(animate);
    };

    const pts = new Map<number, { x: number; y: number }>();
    let pinch: { d: number; mx: number; my: number; s: number; x: number; y: number } | null = null;
    let down = { x: 0, y: 0 };
    let moved = false;
    let lastTap = -Infinity;
    const mid = () => {
      const [a, b] = [...pts.values()];
      return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    };

    const onDown = (e: PointerEvent) => {
      node.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) {
        down = { x: e.clientX, y: e.clientY };
        moved = false;
        if (s > 1) node.style.cursor = "grabbing";
      } else if (pts.size === 2) {
        moved = true; // a pinch is never a tap
        pinch = { ...mid(), s, x, y };
      }
    };
    const onMove = (e: PointerEvent) => {
      const prev = pts.get(e.pointerId);
      if (!prev) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_PX) moved = true;
      if (pinch && pts.size === 2) {
        const m = mid();
        zoomTo((pinch.s * m.d) / pinch.d, pinch.mx, pinch.my, pinch, m.mx, m.my);
      } else if (pts.size === 1 && s > 1) {
        x += e.clientX - prev.x;
        y += e.clientY - prev.y;
        apply(false);
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!pts.delete(e.pointerId)) return;
      if (pts.size < 2) pinch = null;
      if (pts.size > 0) return;
      apply(false); // restores the grab cursor
      if (e.type !== "pointerup" || moved) return;
      const now = performance.now();
      if (now - lastTap < DOUBLE_TAP_MS) return;
      lastTap = now;
      zoomTo(s > 1 ? 1 : TAP_ZOOM, e.clientX, e.clientY, { s, x, y }, e.clientX, e.clientY, true);
    };

    // Trackpad pinch arrives as ctrl+wheel in Chrome/Firefox; a plain wheel pans while zoomed. Non-passive, so the page
    // itself doesn't zoom or scroll.
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        zoomTo(s * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
      } else if (s > 1) {
        e.preventDefault();
        x -= e.deltaX;
        y -= e.deltaY;
        apply(false);
      }
    };
    // Safari (macOS trackpad and iOS) sends gesture events. On iOS the pointer handlers already pinch, so only stop
    // the page zoom there; on a Mac trackpad (no pointers down) the gesture drives the zoom.
    let gestureBase = 1;
    type Gesture = Event & { scale: number; clientX: number; clientY: number };
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      gestureBase = s;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const g = e as Gesture;
      if (pts.size === 0) zoomTo(gestureBase * g.scale, g.clientX, g.clientY);
    };

    apply(false);
    resetRef.current = () => {
      s = 1;
      apply(true);
    };
    node.addEventListener("pointerdown", onDown);
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerup", onUp);
    node.addEventListener("pointercancel", onUp);
    dlg.addEventListener("wheel", onWheel, { passive: false });
    dlg.addEventListener("gesturestart", onGestureStart);
    dlg.addEventListener("gesturechange", onGestureChange);
    return () => {
      node.removeEventListener("pointerdown", onDown);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerup", onUp);
      node.removeEventListener("pointercancel", onUp);
      dlg.removeEventListener("wheel", onWheel);
      dlg.removeEventListener("gesturestart", onGestureStart);
      dlg.removeEventListener("gesturechange", onGestureChange);
    };
  }, [resetRef]);

  return (
    <div ref={ref} data-zoom className="flex min-h-0 max-w-full justify-center">
      {children}
    </div>
  );
}
