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

type Phase = "idle" | "collapse" | "hold";

type Props = {
  baseClasses: string;
};

const LETTERS = ["N", "E", "W", "\u00A0", "Y", "O", "R", "K"];
const COLLAPSE_INDICES = new Set([1, 2, 3, 5, 6, 7]);
const NYC_HOLD_MS = 700;
const NYC_BURST_MS = 1100;
const NYC_EXPLOSION_COOLDOWN_MS = 1000;
const TYPEWRITER_STAGGER_MS = 60;

export function NYCTitle({ baseClasses }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [explosionActive, setExplosionActive] = useState(false);
  const [explosionRunId, setExplosionRunId] = useState(0);
  const heartRef = useRef<HTMLImageElement>(null);
  const prefixRef = useRef<HTMLSpanElement>(null);
  const heartPosRef = useRef({ x: 0, y: 0 });
  const assetsWarmedRef = useRef(false);
  const titlePrimedRef = useRef(false);
  const warmAndPrimePromiseRef = useRef<Promise<void> | null>(null);
  const unmountedRef = useRef(false);
  const clickFrameRef = useRef<number | null>(null);
  const primeFrameRef = useRef<number | null>(null);
  const hasTriggeredExplosionRef = useRef(false);
  const nextExplosionAtRef = useRef(0);
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

  const primeTitleLayout = useCallback(() => {
    if (
      unmountedRef.current ||
      titlePrimedRef.current ||
      phaseRef.current !== "idle" ||
      clickFrameRef.current !== null ||
      phaseTimeoutsRef.current.length > 0
    ) {
      return false;
    }

    const prefixEl = prefixRef.current;
    const innerEl = prefixEl?.querySelector<HTMLElement>(".nyc-prefix-inner");
    const letters = letterRefs.current;

    if (
      !prefixEl ||
      letters.length !== LETTERS.length ||
      letters.some((el) => el === null)
    ) {
      return false;
    }

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

    titlePrimedRef.current = true;
    if (primeFrameRef.current !== null) {
      cancelAnimationFrame(primeFrameRef.current);
    }
    primeFrameRef.current = requestAnimationFrame(() => {
      primeFrameRef.current = null;
      if (unmountedRef.current) return;

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

    return true;
  }, []);

  const ensureWarmAndPrime = useCallback(() => {
    if (titlePrimedRef.current || unmountedRef.current) {
      return Promise.resolve();
    }

    if (assetsWarmedRef.current) {
      primeTitleLayout();
      return Promise.resolve();
    }

    if (warmAndPrimePromiseRef.current) {
      return warmAndPrimePromiseRef.current;
    }

    const warmAndPrimePromise = warmNycAssets()
      .then(() => {
        assetsWarmedRef.current = true;
        primeTitleLayout();
      })
      .finally(() => {
        warmAndPrimePromiseRef.current = null;
      });

    warmAndPrimePromiseRef.current = warmAndPrimePromise;
    return warmAndPrimePromise;
  }, [primeTitleLayout]);

  useLayoutEffect(() => {
    unmountedRef.current = false;
    void ensureWarmAndPrime();

    return () => {
      unmountedRef.current = true;
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
    };
  }, [clearPhaseTimeouts, clearTypewriterTimeouts, ensureWarmAndPrime]);

  const isCollapsing = phase === "collapse" || phase === "hold";

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
      el.dataset.typewriter = phase === "hold" ? "true" : "false";
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

  const triggerExplosion = useCallback(() => {
    // Capture heart position right before launching the explosion.
    if (heartRef.current) {
      const rect = heartRef.current.getBoundingClientRect();
      heartPosRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    hasTriggeredExplosionRef.current = true;
    nextExplosionAtRef.current = Date.now() + NYC_EXPLOSION_COOLDOWN_MS;
    setExplosionRunId((runId) => runId + 1);
    setExplosionActive(true);
  }, []);

  const handlePointerDown = useCallback(() => {
    void ensureWarmAndPrime();
  }, [ensureWarmAndPrime]);

  const handleClick = useCallback(() => {
    if (clickFrameRef.current !== null) {
      return;
    }

    if (phase === "hold" && hasTriggeredExplosionRef.current) {
      if (Date.now() < nextExplosionAtRef.current) {
        return;
      }
      triggerExplosion();
      return;
    }

    if (explosionActive) {
      return;
    }

    if (phase !== "idle") {
      return;
    }

    if (assetsWarmedRef.current && !titlePrimedRef.current) {
      primeTitleLayout();
    }

    clearPhaseTimeouts();
    clearTypewriterTimeouts();
    clickFrameRef.current = requestAnimationFrame(() => {
      clickFrameRef.current = null;
      setPhase("collapse");
      schedPhase(() => setPhase("hold"), NYC_HOLD_MS);
      schedPhase(triggerExplosion, NYC_BURST_MS);
    });
  }, [
    explosionActive,
    clearPhaseTimeouts,
    clearTypewriterTimeouts,
    phase,
    primeTitleLayout,
    schedPhase,
    triggerExplosion,
  ]);

  return (
    <>
      <h1
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        className={`${baseClasses} nyc-title-head inline-flex flex-nowrap items-center justify-center py-2 cursor-pointer text-white whitespace-nowrap`}
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
              draggable={false}
              fetchPriority="high"
            />
          </span>
        </span>

        {/* Each letter of "NEW YORK" — 1fr→0fr grid collapse (smooth, GPU-friendly) */}
        {letterElements}
      </h1>

      {explosionActive && (
        <NYCExplosion
          key={explosionRunId}
          active={explosionActive}
          onComplete={() => {
            setExplosionActive(false);
          }}
          heartX={heartPosRef.current.x}
          heartY={heartPosRef.current.y}
        />
      )}
    </>
  );
}
