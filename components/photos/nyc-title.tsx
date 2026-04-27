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

type LetterSegment = {
  key: string;
  text: string;
  collapses: boolean;
  typewriter: boolean;
  staggerIndex: number;
};

const LETTER_SEGMENTS: LetterSegment[] = [
  { key: "n", text: "N", collapses: false, typewriter: true, staggerIndex: 0 },
  { key: "ew-space", text: "EW\u00A0", collapses: true, typewriter: false, staggerIndex: 1 },
  { key: "y", text: "Y", collapses: false, typewriter: true, staggerIndex: 4 },
  { key: "ork", text: "ORK", collapses: true, typewriter: false, staggerIndex: 5 },
];

const NYC_HOLD_MS = 700;
const NYC_BURST_MS = 1100;
const NYC_ENTRY_TRANSITION_MS = 1000;
const NYC_EXPLOSION_COOLDOWN_MS = 1000;
const TYPEWRITER_STAGGER_MS = 60;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export function NYCTitle({ baseClasses }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [explosionActive, setExplosionActive] = useState(false);
  const [explosionRunId, setExplosionRunId] = useState(0);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const heartRef = useRef<HTMLImageElement>(null);
  const prefixRef = useRef<HTMLSpanElement>(null);
  const heartPosRef = useRef({ x: 0, y: 0 });
  const titleBoxRef = useRef<{ width: number; height: number } | null>(null);
  const titleBoxLockedRef = useRef(false);
  const titlePrimedRef = useRef(false);
  const pendingInitialClickRef = useRef(false);
  const warmAndPrimePromiseRef = useRef<Promise<void> | null>(null);
  const unmountedRef = useRef(false);
  const clickFrameRef = useRef<number | null>(null);
  const primeFrameRef = useRef<number | null>(null);
  const motionHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTriggeredExplosionRef = useRef(false);
  const nextExplosionAtRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const explosionActiveRef = useRef(false);
  const segmentRefs = useRef<(HTMLSpanElement | null)[]>([]);
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

  const clearMotionHintTimer = useCallback(() => {
    if (motionHintTimerRef.current !== null) {
      clearTimeout(motionHintTimerRef.current);
      motionHintTimerRef.current = null;
    }
  }, []);

  const schedPhase = useCallback((fn: () => void, ms: number) => {
    phaseTimeoutsRef.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    explosionActiveRef.current = explosionActive;
  }, [explosionActive]);

  const captureTitleBox = useCallback(() => {
    const titleEl = titleRef.current;
    if (!titleEl) return;

    const rect = titleEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    titleBoxRef.current = {
      width: rect.width,
      height: rect.height,
    };
  }, []);

  const setMotionHints = useCallback((enabled: boolean) => {
    const prefixEl = prefixRef.current;
    const innerEl = prefixEl?.querySelector<HTMLElement>(".nyc-prefix-inner");

    if (prefixEl) {
      prefixEl.style.willChange = enabled ? "max-width, margin-inline-end" : "";
    }

    if (innerEl) {
      innerEl.style.willChange = enabled ? "transform, opacity" : "";
    }

    segmentRefs.current.forEach((el, i) => {
      if (!el) return;
      if (LETTER_SEGMENTS[i]?.collapses) {
        el.style.willChange = enabled ? "grid-template-columns, opacity" : "";
      } else {
        el.style.willChange = "";
      }
    });
  }, []);

  const scheduleMotionHintClear = useCallback(
    (ms: number) => {
      clearMotionHintTimer();
      motionHintTimerRef.current = setTimeout(() => {
        motionHintTimerRef.current = null;
        setMotionHints(false);
      }, ms);
    },
    [clearMotionHintTimer, setMotionHints],
  );

  const primeTitleLayout = useCallback(async () => {
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
    const segments = segmentRefs.current;

    if (
      !prefixEl ||
      segments.length !== LETTER_SEGMENTS.length ||
      segments.some((el) => el === null)
    ) {
      return false;
    }

    setMotionHints(true);
    prefixEl.style.transition = "none";
    if (innerEl) {
      innerEl.style.transition = "none";
    }
    segments.forEach((el) => {
      if (el) {
        el.style.transition = "none";
      }
    });

    prefixEl.dataset.phase = "collapse";
    segments.forEach((el, i) => {
      if (!el) return;
      const segment = LETTER_SEGMENTS[i];
      el.dataset.collapse = segment.collapses ? "true" : "false";
      el.dataset.typewriter = segment.typewriter ? "true" : "false";
    });
    void prefixEl.offsetHeight;

    prefixEl.dataset.phase = "idle";
    segments.forEach((el) => {
      if (!el) return;
      el.dataset.collapse = "false";
      el.dataset.typewriter = "false";
    });
    void prefixEl.offsetHeight;

    await new Promise<void>((resolve) => {
      primeFrameRef.current = requestAnimationFrame(() => {
        primeFrameRef.current = null;
        if (!unmountedRef.current) {
          prefixEl.style.transition = "";
          if (innerEl) {
            innerEl.style.transition = "";
          }
          segments.forEach((el) => {
            if (el) {
              el.style.transition = "";
            }
          });
          captureTitleBox();
          setMotionHints(false);
        }
        resolve();
      });
    });

    titlePrimedRef.current = true;
    return true;
  }, [captureTitleBox, setMotionHints]);

  const ensureWarmAndPrime = useCallback(() => {
    if (titlePrimedRef.current || unmountedRef.current) {
      return Promise.resolve();
    }

    if (warmAndPrimePromiseRef.current) {
      return warmAndPrimePromiseRef.current;
    }

    const warmAndPrimePromise = (async () => {
      await warmNycAssets();

      if ("fonts" in document) {
        try {
          await document.fonts.ready;
        } catch {
          // Best-effort font readiness is enough here.
        }
      }

      for (let attempt = 0; attempt < 4; attempt += 1) {
        if (unmountedRef.current) {
          return;
        }

        if (attempt > 0) {
          await nextFrame();
        }

        if (await primeTitleLayout()) {
          return;
        }
      }
    })().finally(() => {
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
      pendingInitialClickRef.current = false;
      if (clickFrameRef.current !== null) {
        cancelAnimationFrame(clickFrameRef.current);
        clickFrameRef.current = null;
      }
      if (primeFrameRef.current !== null) {
        cancelAnimationFrame(primeFrameRef.current);
        primeFrameRef.current = null;
      }
      clearMotionHintTimer();
      setMotionHints(false);
      clearPhaseTimeouts();
      clearTypewriterTimeouts();
    };
  }, [
    clearMotionHintTimer,
    clearPhaseTimeouts,
    clearTypewriterTimeouts,
    ensureWarmAndPrime,
    setMotionHints,
  ]);

  useLayoutEffect(() => {
    const titleEl = titleRef.current;
    if (!titleEl || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (phaseRef.current === "idle" && !titleBoxLockedRef.current) {
        captureTitleBox();
      }
    });
    observer.observe(titleEl);

    return () => observer.disconnect();
  }, [captureTitleBox]);

  const isCollapsing = phase === "collapse" || phase === "hold";

  useEffect(() => {
    segmentRefs.current.forEach((el, i) => {
      if (!el) return;
      const segment = LETTER_SEGMENTS[i];
      el.dataset.collapse =
        isCollapsing && segment.collapses ? "true" : "false";
    });

    if (phase === "collapse") {
      clearTypewriterTimeouts();
      segmentRefs.current.forEach((el, i) => {
        if (!el) return;
        const segment = LETTER_SEGMENTS[i];
        el.dataset.typewriter = "false";
        if (!segment.typewriter) {
          return;
        }
        const timeoutId = setTimeout(() => {
          const letter = segmentRefs.current[i];
          if (letter) {
            letter.dataset.typewriter = "true";
          }
        }, segment.staggerIndex * TYPEWRITER_STAGGER_MS);
        typewriterTimeoutsRef.current.push(timeoutId);
      });
      return;
    }

    clearTypewriterTimeouts();
    segmentRefs.current.forEach((el, i) => {
      if (!el) return;
      el.dataset.typewriter =
        phase === "hold" && LETTER_SEGMENTS[i].typewriter ? "true" : "false";
    });
  }, [clearTypewriterTimeouts, isCollapsing, phase]);

  const segmentElements = useMemo(
    () =>
      LETTER_SEGMENTS.map((segment, i) => (
        <span
          key={segment.key}
          ref={(el) => {
            segmentRefs.current[i] = el;
          }}
          className="nyc-letter"
          data-collapse="false"
          data-typewriter="false"
          style={{ "--letter-index": segment.staggerIndex } as CSSProperties}
        >
          <span className="nyc-letter-inner">{segment.text}</span>
        </span>
      )),
    [],
  );

  const triggerExplosion = useCallback(() => {
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

  const startInitialSequence = useCallback(() => {
    if (
      unmountedRef.current ||
      clickFrameRef.current !== null ||
      phaseRef.current !== "idle"
    ) {
      return;
    }

    pendingInitialClickRef.current = false;
    clearPhaseTimeouts();
    clearTypewriterTimeouts();
    clearMotionHintTimer();
    setMotionHints(true);

    const titleEl = titleRef.current;
    const titleBox = titleBoxRef.current;
    if (titleEl && titleBox && !titleBoxLockedRef.current) {
      titleEl.style.width = `${titleBox.width}px`;
      titleEl.style.height = `${titleBox.height}px`;
      titleBoxLockedRef.current = true;
    }

    clickFrameRef.current = requestAnimationFrame(() => {
      if (unmountedRef.current) {
        clickFrameRef.current = null;
        return;
      }

      clickFrameRef.current = requestAnimationFrame(() => {
        clickFrameRef.current = null;
        if (unmountedRef.current) return;

        setPhase("collapse");
        scheduleMotionHintClear(NYC_ENTRY_TRANSITION_MS + 180);
        schedPhase(() => setPhase("hold"), NYC_HOLD_MS);
        schedPhase(triggerExplosion, NYC_BURST_MS);
      });
    });
  }, [
    clearMotionHintTimer,
    clearPhaseTimeouts,
    clearTypewriterTimeouts,
    schedPhase,
    scheduleMotionHintClear,
    setMotionHints,
    triggerExplosion,
  ]);

  const handlePointerDown = useCallback(() => {
    if (phaseRef.current === "idle") {
      clearMotionHintTimer();
      setMotionHints(true);
      scheduleMotionHintClear(500);
      void ensureWarmAndPrime();
    }
  }, [
    clearMotionHintTimer,
    ensureWarmAndPrime,
    scheduleMotionHintClear,
    setMotionHints,
  ]);

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

    if (explosionActive || phase !== "idle") {
      return;
    }

    if (!titlePrimedRef.current) {
      pendingInitialClickRef.current = true;
      void ensureWarmAndPrime().then(() => {
        if (
          !pendingInitialClickRef.current ||
          unmountedRef.current ||
          phaseRef.current !== "idle" ||
          explosionActiveRef.current ||
          clickFrameRef.current !== null ||
          !titlePrimedRef.current
        ) {
          return;
        }

        startInitialSequence();
      });
      return;
    }

    startInitialSequence();
  }, [
    ensureWarmAndPrime,
    explosionActive,
    phase,
    startInitialSequence,
    triggerExplosion,
  ]);

  return (
    <>
      <h1
        ref={titleRef}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        className={`${baseClasses} nyc-title-head inline-flex flex-nowrap items-center justify-center py-2 cursor-pointer text-white whitespace-nowrap`}
      >
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

        {segmentElements}
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
