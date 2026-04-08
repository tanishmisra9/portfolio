"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { motion } from "framer-motion";
import { ScatterName } from "./scatter-name";
import { HeroNameMotion } from "./hero-name-motion";

type HeroProps = {
  subtitle: string;
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function Hero({ subtitle }: HeroProps) {
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
    <section
      id="top"
      className="relative z-0 isolate flex min-h-[82vh] items-center overflow-hidden px-6 pb-12 pt-24 md:py-24"
    >
      <div className="mx-auto w-full max-w-6xl text-left">
        <div className="mb-10 ml-[11vw] md:mb-32 md:ml-[9vw]">
          <HeroNameMotion>
            <div
              role="button"
              tabIndex={0}
              aria-label="Play name pit-stop animation"
              className="cursor-pointer select-none font-display text-[clamp(3.45rem,13.8vw,13.34rem)] font-extrabold uppercase leading-none tracking-tighter outline-none focus-visible:ring-2 focus-visible:ring-white/30"
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
              <div className="text-white translate-x-8 md:translate-x-10">
                <ScatterName
                  text="TANISH"
                  lineId="tanish"
                  entranceDelay={100}
                  scatterTrigger={scatterTrigger}
                  queueGlobalReturnGap={queueGlobalReturnGap}
                  magnetPullRef={tanishMagnetRef}
                  magnetResetRef={tanishResetRef}
                  onScatterComplete={onLineScatterComplete}
                />
              </div>
              <div className="-mt-3 -translate-x-2 text-neutral-600 md:-mt-5 md:-translate-x-3">
                <ScatterName
                  text="MISRA"
                  lineId="misra"
                  entranceDelay={100 + 6 * 55}
                  scatterTrigger={scatterTrigger}
                  queueGlobalReturnGap={queueGlobalReturnGap}
                  magnetPullRef={misraMagnetRef}
                  magnetResetRef={misraResetRef}
                  onScatterComplete={onLineScatterComplete}
                />
              </div>
            </div>
          </HeroNameMotion>
          <motion.div
            className="-translate-x-2 mt-12 flex max-w-4xl flex-col gap-3 text-left font-sans text-xl leading-relaxed md:-translate-x-3 md:mt-14 md:text-2xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 1.1,
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <span className="block text-white">{topLine}</span>
            <span className="block text-neutral-400">{bottomLine}</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
