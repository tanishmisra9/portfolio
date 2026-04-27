"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { warmNycAssets } from "@/components/photos/nyc-assets-warmup";
import { NYCExplosion } from "@/components/photos/nyc-explosion";

type Phase = "idle" | "collapse" | "hold" | "burst" | "rewind";

type Props = {
  baseClasses: string;
};

const LETTERS = ["N", "E", "W", "\u00A0", "Y", "O", "R", "K"];
const COLLAPSE_INDICES = new Set([1, 2, 3, 5, 6, 7]);
const NYC_HOLD_MS = 700;
const NYC_BURST_MS = 1100;
const TYPEWRITER_STAGGER_MS = 60;

/** Prefix clip + letter grid — must match CSS transition duration for rewind → idle. */
const NYC_REWIND_MS = 850;

export function NYCTitle({ baseClasses }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [typewriterLocked, setTypewriterLocked] = useState(false);
  const heartRef = useRef<HTMLImageElement>(null);
  const prefixRef = useRef<HTMLSpanElement>(null);
  const heartPosRef = useRef({ x: 0, y: 0 });
  const clickFrameRef = useRef<number | null>(null);
  const primeFrameRef = useRef<number | null>(null);
  const pendingTypewriterLockRef = useRef(false);
  const phaseRef = useRef<Phase>("idle");
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const phaseTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const typewriterTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearPhaseTimeouts = useCallback(() => {
    phaseTimeoutsRef.current.forEach(clearTimeout);
    phaseTimeoutsRef.current = [];
  }, []);

  const clearTypewriterTimeouts = useCallback(() => {
    typewriterTimeoutsRef.current.forEach(clearTimeout);
    typewriterTimeoutsRef.current = [];
  }, []);

  const schedPhase = useCallback((fn: () => void, ms: number) => {
    phaseTimeoutsRef.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useLayoutEffect(() => {
    let cancelled = false;

    const primeTitleLayout = () => {
      if (
        cancelled ||
        phaseRef.current !== "idle" ||
        clickFrameRef.current !== null ||
        phaseTimeoutsRef.current.length > 0
      ) {
        return;
      }

      const prefixEl = prefixRef.current;
      const innerEl = prefixEl?.querySelector<HTMLElement>(".nyc-prefix-inner");
      const letters = letterRefs.current;

      if (!prefixEl || letters.length === 0) return;

      prefixEl.style.transition = "none";
      if (innerEl) {
        innerEl.style.transition = "none";
      }
      letters.forEach((el) => {
        if (el) {
          el.style.transition = "none";
        }
      });

      prefixEl.dataset.phase = "collapse";
      letters.forEach((el, i) => {
        if (!el) return;
        el.dataset.collapse = COLLAPSE_INDICES.has(i) ? "true" : "false";
        el.dataset.typewriter = "true";
      });
      void prefixEl.offsetHeight;

      prefixEl.dataset.phase = "idle";
      letters.forEach((el) => {
        if (!el) return;
        el.dataset.collapse = "false";
        el.dataset.typewriter = "false";
      });
      void prefixEl.offsetHeight;

      primeFrameRef.current = requestAnimationFrame(() => {
        primeFrameRef.current = null;
        if (cancelled) return;

        prefixEl.style.transition = "";
        if (innerEl) {
          innerEl.style.transition = "";
        }
        letters.forEach((el) => {
          if (el) {
            el.style.transition = "";
          }
        });
      });
    };

    void warmNycAssets().then(() => {
      if (!cancelled) {
        primeTitleLayout();
      }
    });

    return () => {
      cancelled = true;
      if (clickFrameRef.current !== null) {
        cancelAnimationFrame(clickFrameRef.current);
        clickFrameRef.current = null;
      }
      if (primeFrameRef.current !== null) {
        cancelAnimationFrame(primeFrameRef.current);
        primeFrameRef.current = null;
      }
      clearPhaseTimeouts();
      clearTypewriterTimeouts();
      pendingTypewriterLockRef.current = false;
    };
  }, [clearPhaseTimeouts, clearTypewriterTimeouts]);

  const isCollapsing =
    phase === "collapse" || phase === "hold" || phase === "burst";

  useEffect(() => {
    letterRefs.current.forEach((el, i) => {
      if (!el) return;
      el.dataset.collapse =
        isCollapsing && COLLAPSE_INDICES.has(i) ? "true" : "false";
    });

    if (phase === "collapse") {
      clearTypewriterTimeouts();
      letterRefs.current.forEach((el, i) => {
        if (!el) return;
        el.dataset.typewriter = "false";
        const timeoutId = setTimeout(() => {
          const letter = letterRefs.current[i];
          if (letter) {
            letter.dataset.typewriter = "true";
          }
        }, i * TYPEWRITER_STAGGER_MS);
        typewriterTimeoutsRef.current.push(timeoutId);
      });
      return;
    }

    clearTypewriterTimeouts();
    letterRefs.current.forEach((el) => {
      if (!el) return;
      el.dataset.typewriter =
        phase === "hold" || phase === "burst" ? "true" : "false";
    });
  }, [clearTypewriterTimeouts, isCollapsing, phase]);

  const letterElements = useMemo(
    () =>
      LETTERS.map((ch, i) => (
        <span
          key={i}
          ref={(el) => {
            letterRefs.current[i] = el;
          }}
          className="nyc-letter"
          data-collapse="false"
          data-typewriter="false"
          style={{ "--letter-index": i } as CSSProperties}
        >
          <span className="nyc-letter-inner">{ch}</span>
        </span>
      )),
    [],
  );

  /** After explosion: reverse arrival — prefix closes + letters expand together (CSS). */
  const beginRewind = useCallback(() => {
    clearPhaseTimeouts();
    if (pendingTypewriterLockRef.current) {
      setTypewriterLocked(true);
      pendingTypewriterLockRef.current = false;
    }
    setPhase("rewind");
    schedPhase(() => setPhase("idle"), NYC_REWIND_MS);
  }, [clearPhaseTimeouts, schedPhase]);

  const handleClick = useCallback(() => {
    if (phase !== "idle" || clickFrameRef.current !== null) return;

    clearPhaseTimeouts();
    clearTypewriterTimeouts();
    if (!typewriterLocked) {
      pendingTypewriterLockRef.current = true;
    }
    clickFrameRef.current = requestAnimationFrame(() => {
      clickFrameRef.current = null;
      setPhase("collapse");
      schedPhase(() => setPhase("hold"), NYC_HOLD_MS);
      schedPhase(() => {
        // Capture heart position before it unmounts when burst phase removes it
        if (heartRef.current) {
          const rect = heartRef.current.getBoundingClientRect();
          heartPosRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
        }
        setPhase("burst");
      }, NYC_BURST_MS);
    });
  }, [clearPhaseTimeouts, clearTypewriterTimeouts, phase, schedPhase, typewriterLocked]);

  return (
    <>
      <h1
        onClick={handleClick}
        className={`${baseClasses} nyc-title-head inline-flex flex-nowrap items-center justify-center py-2 cursor-pointer text-white whitespace-nowrap ${typewriterLocked ? "nyc-title-head--typewriter" : ""}`}
      >
        {/* "I ♥" prefix — expands from zero width and fades in via CSS transitions */}
        <span ref={prefixRef} className="nyc-prefix" data-phase={phase}>
          <span className="nyc-prefix-inner">
            <span className="nyc-prefix-i" aria-hidden="true">
              I
            </span>
            <img
              ref={heartRef}
              src="/heart.png"
              alt=""
              aria-hidden
              className="nyc-prefix-heart"
              decoding="async"
              fetchPriority="high"
            />
          </span>
        </span>

        {/* Each letter of "NEW YORK" — 1fr→0fr grid collapse (smooth, GPU-friendly) */}
        {letterElements}
      </h1>

      {phase === "burst" && (
        <NYCExplosion
          active={true}
          onComplete={beginRewind}
          heartX={heartPosRef.current.x}
          heartY={heartPosRef.current.y}
        />
      )}
    </>
  );
}
