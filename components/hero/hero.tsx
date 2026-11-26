"use client";

import { useEffect, useRef, useState } from "react";
import { m as motion, useReducedMotion } from "framer-motion";
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
import { usePitstop } from "./use-pitstop";

type HeroProps = {
  subtitle: string;
};

export function Hero({ subtitle }: HeroProps) {
  const markHomeIntroDone = useHomeIntroMarkDone();
  const reduceHeroMotion = useReducedMotion();
  const [topLine = "", bottomLine = ""] = subtitle.split("\n");
  /** The pit stop (4 tires, one sound, drive off). Its effect has stable deps: a re-run mid-stop would strand the phase. */
  const { mv, run, isIdle } = usePitstop(reduceHeroMotion);
  const isDesktopRef = useRef(false);

  const tanishMagnetRef = useRef<
    ((clientX: number, clientY: number) => void) | null
  >(null);
  const tanishResetRef = useRef<(() => void) | null>(null);
  const misraMagnetRef = useRef<
    ((clientX: number, clientY: number) => void) | null
  >(null);
  const misraResetRef = useRef<(() => void) | null>(null);

  /* Reduced motion: there is no pit stop, so the name is plain text (not a dead "Play" button). Set from an effect, not
   * read during render, so the first client render matches the server's markup (no hydration mismatch). */
  const [plainName, setPlainName] = useState(false);
  useEffect(() => {
    setPlainName(!!reduceHeroMotion);
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

  const onNameClick = () => {
    void run(() => {
      tanishResetRef.current?.();
      misraResetRef.current?.();
    });
  };

  /* Window-level so the pull starts as the cursor approaches, not only once it is over the name box.
   * One pass per frame (each pass reads every letter's rect), and none while the pit stop runs. */
  useEffect(() => {
    let frame = 0;
    let lastX = 0;
    let lastY = 0;
    const move = (e: globalThis.PointerEvent) => {
      if (!isDesktopRef.current) return;
      lastX = e.clientX;
      lastY = e.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!isIdle()) return;
        tanishMagnetRef.current?.(lastX, lastY);
        misraMagnetRef.current?.(lastX, lastY);
      });
    };
    const reset = () => {
      tanishResetRef.current?.();
      misraResetRef.current?.();
    };
    // Reduced motion: the magnet drives MotionValues directly (MotionConfig doesn't gate those), so don't pull at all.
    if (reduceHeroMotion) {
      reset();
      return;
    }
    window.addEventListener("pointermove", move);
    document.documentElement.addEventListener("pointerleave", reset);
    window.addEventListener("pointercancel", reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", reset);
      window.removeEventListener("pointercancel", reset);
    };
  }, [isIdle, reduceHeroMotion]);

  return (
    <section className="relative z-0 isolate flex min-h-0 items-start overflow-hidden px-6 pb-8 pt-16 md:min-h-[85vh] md:items-center md:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-col items-start md:mb-0">
          <HeroNameMotion>
            <>
              <h1 className="sr-only">TANISH MISRA</h1>
              {/* Drive-off wrapper: slides off right, then re-enters from the left. */}
              <motion.div style={{ x: mv.driveX, y: mv.driveY }}>
              <div
                {...(plainName
                  ? {}
                  : {
                      role: "button",
                      tabIndex: 0,
                      "aria-label": "Play name pit-stop animation",
                      onClick: onNameClick,
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onNameClick();
                        }
                      },
                    })}
                className={`flex flex-col items-start ${plainName ? "" : "cursor-pointer "}select-none font-display text-[clamp(4rem,17.5vw,16rem)] font-extrabold uppercase leading-none tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-fg/70 md:items-start md:text-[clamp(2.256rem,12vw,11.6rem)] md:leading-[0.85]`}
              >
                <div className="text-fg">
                  <ScatterName
                    text="TANISH"
                    lineId="tanish"
                    entranceDelay={SCATTER_NAME_ENTRANCE_BASE_MS}
                    splitAt={3}
                    left={mv.tires.tl}
                    right={mv.tires.tr}
                    magnetPullRef={tanishMagnetRef}
                    magnetResetRef={tanishResetRef}
                  />
                </div>
                <div className="-mt-3 text-dim md:mt-4">
                  <ScatterName
                    text="MISRA"
                    lineId="misra"
                    entranceDelay={
                      SCATTER_NAME_ENTRANCE_BASE_MS +
                      6 * SCATTER_NAME_ENTRANCE_STAGGER_MS
                    }
                    splitAt={3}
                    left={mv.tires.bl}
                    right={mv.tires.br}
                    magnetPullRef={misraMagnetRef}
                    magnetResetRef={misraResetRef}
                  />
                </div>
              </div>
              </motion.div>
            </>
          </HeroNameMotion>
          <motion.div
            className="mt-7 flex max-w-4xl flex-col items-start gap-3 text-left font-sans text-xl leading-relaxed md:mt-16 md:gap-2 md:text-2xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: HERO_TAGLINE_ENTER_DELAY_S,
              duration: HERO_TAGLINE_ENTER_DURATION_S,
              ease: [0.16, 1, 0.3, 1],
            }}
            onAnimationComplete={markHomeIntroDone}
          >
            <span className="block text-fg">{topLine}</span>
            <span className="block text-muted">{bottomLine}</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
