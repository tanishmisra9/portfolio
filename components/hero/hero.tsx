"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useHomeIntroMarkDone } from "@/components/home-intro-gate";
import {
  HERO_TAGLINE_ENTER_DELAY_S,
  HERO_TAGLINE_ENTER_DURATION_S,
} from "@/lib/site-motion";
import {
  ScatterName,
  SCATTER_NAME_ENTRANCE_BASE_MS,
  SCATTER_NAME_ENTRANCE_STAGGER_MS,
} from "./scatter-name";
import { HeroNameMotion } from "./hero-name-motion";

type HeroProps = {
  subtitle: string;
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function Hero({ subtitle }: HeroProps) {
  const markHomeIntroDone = useHomeIntroMarkDone();
  const reduceHeroMotion = useReducedMotion();
  const [topLine = "", bottomLine = ""] = subtitle.split("\n");
  const [scatterTrigger, setScatterTrigger] = useState(0);
  const scatterBusyRef = useRef(false);
  const scatterDoneRef = useRef(0);
  /** Serializes return starts across both name lines so two letters never fire together */
  const returnGapChainRef = useRef(Promise.resolve());
  const isDesktopRef = useRef(false);

  const tanishMagnetRef = useRef<
    ((clientX: number, clientY: number) => void) | null
  >(null);
  const tanishResetRef = useRef<(() => void) | null>(null);
  const misraMagnetRef = useRef<
    ((clientX: number, clientY: number) => void) | null
  >(null);
  const misraResetRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (reduceHeroMotion) {
      markHomeIntroDone();
    }
  }, [reduceHeroMotion, markHomeIntroDone]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    isDesktopRef.current = mq.matches;
    const onChange = () => {
      isDesktopRef.current = mq.matches;
      if (!mq.matches) {
        tanishResetRef.current?.();
        misraResetRef.current?.();
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const queueGlobalReturnGap = useCallback(() => {
    const gapMs = 38 + Math.random() * 92;
    const next = returnGapChainRef.current.then(() => sleep(gapMs));
    returnGapChainRef.current = next.catch(() => {});
    return next;
  }, []);

  const onLineScatterComplete = useCallback(() => {
    scatterDoneRef.current += 1;
    if (scatterDoneRef.current >= 2) {
      scatterDoneRef.current = 0;
      scatterBusyRef.current = false;
    }
  }, []);

  const onNameClick = () => {
    if (scatterBusyRef.current) return;
    scatterBusyRef.current = true;
    scatterDoneRef.current = 0;
    returnGapChainRef.current = Promise.resolve();
    setScatterTrigger((t) => t + 1);
  };

  const onNamePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDesktopRef.current) return;
    tanishMagnetRef.current?.(e.clientX, e.clientY);
    misraMagnetRef.current?.(e.clientX, e.clientY);
  };

  const onNamePointerLeaveOrCancel = () => {
    if (!isDesktopRef.current) return;
    tanishResetRef.current?.();
    misraResetRef.current?.();
  };

  return (
    <section className="relative z-0 isolate flex min-h-0 items-start overflow-hidden px-6 pb-8 pt-16 md:min-h-[82vh] md:items-center md:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-col items-center md:mb-32">
          <HeroNameMotion>
            <>
              <h1 className="sr-only">TANISH MISRA</h1>
              <div
                role="button"
                tabIndex={0}
                aria-label="Play name pit-stop animation"
                className="heading-bleed-mobile flex flex-col items-center cursor-pointer select-none font-display text-[clamp(4rem,17.5vw,16rem)] font-extrabold uppercase leading-none tracking-tighter outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:text-[clamp(2.256rem,9.026vw,8.726rem)]"
                onPointerMove={onNamePointerMove}
                onPointerLeave={onNamePointerLeaveOrCancel}
                onPointerCancel={onNamePointerLeaveOrCancel}
                onClick={onNameClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onNameClick();
                  }
                }}
              >
                <div className="text-white">
                  <ScatterName
                    text="TANISH"
                    lineId="tanish"
                    entranceDelay={SCATTER_NAME_ENTRANCE_BASE_MS}
                    scatterTrigger={scatterTrigger}
                    queueGlobalReturnGap={queueGlobalReturnGap}
                    magnetPullRef={tanishMagnetRef}
                    magnetResetRef={tanishResetRef}
                    onScatterComplete={onLineScatterComplete}
                  />
                </div>
                <div className="-mt-3 translate-x-[0.14em] text-neutral-500 md:-mt-5">
                  <ScatterName
                    text="MISRA"
                    lineId="misra"
                    entranceDelay={
                      SCATTER_NAME_ENTRANCE_BASE_MS +
                      6 * SCATTER_NAME_ENTRANCE_STAGGER_MS
                    }
                    scatterTrigger={scatterTrigger}
                    queueGlobalReturnGap={queueGlobalReturnGap}
                    magnetPullRef={misraMagnetRef}
                    magnetResetRef={misraResetRef}
                    onScatterComplete={onLineScatterComplete}
                  />
                </div>
              </div>
            </>
          </HeroNameMotion>
          <motion.div
            className="mt-7 flex max-w-4xl flex-col items-center gap-3 text-center font-sans text-xl leading-relaxed md:mt-14 md:text-2xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: HERO_TAGLINE_ENTER_DELAY_S,
              duration: HERO_TAGLINE_ENTER_DURATION_S,
              ease: [0.16, 1, 0.3, 1],
            }}
            onAnimationComplete={markHomeIntroDone}
          >
            <span className="block text-white">{topLine}</span>
            <span className="block text-neutral-400">{bottomLine}</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
