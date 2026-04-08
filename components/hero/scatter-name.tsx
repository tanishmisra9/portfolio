"use client";

import {
  animate,
  motion,
  motionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";

const magnetSpringConfig = {
  type: "spring" as const,
  stiffness: 250,
  damping: 20,
  mass: 0.8,
};

const returnSpringConfig = {
  type: "spring" as const,
  stiffness: 400,
  damping: 24,
  mass: 0.52,
};

const LAUNCH_DURATION = 0.24;
const LAUNCH_DISTANCE = 1800;
/** Peak motion blur (px) during pit launch / return */
const BLUR_MAX = 25;
/** Wait after SFX starts before snap/spring so the clip’s impact lines up with the letter settling */
const WHEELGUN_LEAD_MS = 175;

type LineId = "tanish" | "misra";

type ScatterLetterProps = {
  char: string;
  tx: MotionValue<number>;
  ty: MotionValue<number>;
  ox: MotionValue<number>;
  oy: MotionValue<number>;
  blurMv: MotionValue<number>;
  lineId: LineId;
  className?: string;
  /** 0-based index in the line’s token list (chars + spaces) for entrance stagger */
  entranceIndex: number;
  /** ms before this line’s first token starts fading in */
  entranceBaseDelay: number;
};

const ScatterLetter = forwardRef<HTMLSpanElement, ScatterLetterProps>(
  function ScatterLetter(
    {
      char,
      tx,
      ty,
      ox,
      oy,
      blurMv,
      lineId,
      className,
      entranceIndex,
      entranceBaseDelay,
    },
    ref,
  ) {
    const sx = useSpring(tx, magnetSpringConfig);
    const sy = useSpring(ty, magnetSpringConfig);

    const filterBlur = useTransform(blurMv, (b) => `blur(${Number(b)}px)`);

    const lineColorClass =
      lineId === "tanish" ? "text-white" : "text-neutral-600";

    /* Outer = magnet spring; inner = pit-stop offset + blur. Nested
     * transforms avoid useTransform([spring, mv]) which can throw in FM 12 + RSC. */
    return (
      <motion.span
        ref={ref}
        className={`inline-block ${className ?? ""}`}
        style={{
          x: sx,
          y: sy,
          willChange: "transform",
        }}
      >
        <motion.span
          aria-hidden
          className={`inline-block select-none ${lineColorClass}`}
          style={{
            x: ox,
            y: oy,
            filter: filterBlur,
            willChange: "transform, filter",
          }}
        >
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: (entranceBaseDelay + entranceIndex * 55) / 1000,
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            {char}
          </motion.span>
        </motion.span>
      </motion.span>
    );
  },
);

function ScatterEntranceSpace({
  sequenceIndex,
  entranceBaseDelay,
  className,
}: {
  sequenceIndex: number;
  entranceBaseDelay: number;
  className?: string;
}) {
  return (
    <motion.span
      aria-hidden
      className={className}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: (entranceBaseDelay + sequenceIndex * 55) / 1000,
        duration: 0.2,
        ease: "easeOut",
      }}
    />
  );
}

const MAGNET_RADIUS = 400;
const PULL_FACTOR = 0.5;
const MAX_PULL = 100;

type Token =
  | { kind: "space"; key: string }
  | { kind: "char"; key: string; ch: string; letterIndex: number };

function buildTokens(line: string): Token[] {
  const tokens: Token[] = [];
  let letterIndex = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === " ") {
      tokens.push({ kind: "space", key: `sp-${i}` });
    } else {
      tokens.push({
        kind: "char",
        key: `c-${i}-${ch}`,
        ch,
        letterIndex: letterIndex++,
      });
    }
  }
  return tokens;
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ScatterNameProps = {
  text: string;
  lineId: LineId;
  scatterTrigger: number;
  /** One shared queue across both lines — each letter awaits this before SFX + return */
  queueGlobalReturnGap: () => Promise<void>;
  magnetPullRef?: MutableRefObject<
    ((clientX: number, clientY: number) => void) | null
  >;
  magnetResetRef?: MutableRefObject<(() => void) | null>;
  onScatterComplete?: () => void;
  className?: string;
  /** ms before first letter (or space) on this line starts fading in */
  entranceDelay?: number;
};

export function ScatterName({
  text,
  lineId,
  scatterTrigger,
  queueGlobalReturnGap,
  magnetPullRef,
  magnetResetRef,
  onScatterComplete,
  className,
  entranceDelay = 0,
}: ScatterNameProps) {
  const tokens = useMemo(() => buildTokens(text), [text]);
  const entranceBaseDelay = entranceDelay;
  const letterCount = tokens.filter((t) => t.kind === "char").length;

  const txs = useMemo(
    () => Array.from({ length: letterCount }, () => motionValue(0)),
    [letterCount],
  );
  const tys = useMemo(
    () => Array.from({ length: letterCount }, () => motionValue(0)),
    [letterCount],
  );
  const oxs = useMemo(
    () => Array.from({ length: letterCount }, () => motionValue(0)),
    [letterCount],
  );
  const oys = useMemo(
    () => Array.from({ length: letterCount }, () => motionValue(0)),
    [letterCount],
  );
  const blurMvs = useMemo(
    () => Array.from({ length: letterCount }, () => motionValue(0)),
    [letterCount],
  );

  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pitStopLettersRef = useRef<Set<string>>(new Set());
  const audioBufferRef = useRef<HTMLAudioElement | null>(null);
  const sequenceGenerationRef = useRef(0);

  useEffect(() => {
    const el = new Audio("/pitstop.mp3");
    el.preload = "auto";
    audioBufferRef.current = el;
    return () => {
      audioBufferRef.current = null;
    };
  }, []);

  const playWheelGun = useCallback(() => {
    const src = audioBufferRef.current;
    if (!src) return;
    const sfx = src.cloneNode() as HTMLAudioElement;
    sfx.volume = 0.5;
    void sfx.play().catch(() => {});
  }, []);

  const pitKey = useCallback(
    (letterIndex: number) => `${lineId}-${letterIndex}`,
    [lineId],
  );

  const resetOffsets = useCallback(() => {
    for (let i = 0; i < letterCount; i++) {
      if (pitStopLettersRef.current.has(pitKey(i))) continue;
      txs[i].set(0);
      tys[i].set(0);
    }
  }, [letterCount, pitKey, txs, tys]);

  const applyMagnetPull = useCallback(
    (clientX: number, clientY: number) => {
      for (const t of tokens) {
        if (t.kind !== "char") continue;
        const li = t.letterIndex;
        if (pitStopLettersRef.current.has(pitKey(li))) continue;

        const el = letterRefs.current[li];
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cx - clientX;
        const dy = cy - clientY;
        const dist = Math.hypot(dx, dy);

        if (dist >= MAGNET_RADIUS || dist < 1e-6) {
          txs[li].set(0);
          tys[li].set(0);
        } else {
          const influence = 1 - dist / MAGNET_RADIUS;
          const pull = Math.min(dist * PULL_FACTOR * influence, MAX_PULL);
          txs[li].set((-dx / dist) * pull);
          tys[li].set((-dy / dist) * pull);
        }
      }
    },
    [pitKey, tokens, txs, tys],
  );

  useEffect(() => {
    if (magnetPullRef) magnetPullRef.current = applyMagnetPull;
    if (magnetResetRef) magnetResetRef.current = resetOffsets;
    return () => {
      if (magnetPullRef) magnetPullRef.current = null;
      if (magnetResetRef) magnetResetRef.current = null;
    };
  }, [applyMagnetPull, magnetPullRef, magnetResetRef, resetOffsets]);

  useEffect(() => {
    if (scatterTrigger === 0 || letterCount === 0) return;

    const gen = ++sequenceGenerationRef.current;
    const pitLetters = pitStopLettersRef.current;
    let cancelled = false;

    const returnSingleLetter = async (
      letterIndex: number,
      target: { x: number; y: number },
    ) => {
      if (cancelled) return;
      await queueGlobalReturnGap();
      if (cancelled) return;
      playWheelGun();
      await sleep(WHEELGUN_LEAD_MS);
      if (cancelled) return;
      const ox = oxs[letterIndex];
      const oy = oys[letterIndex];
      const blurMv = blurMvs[letterIndex];
      ox.set(-target.x);
      oy.set(-target.y);
      blurMv.set(BLUR_MAX * 0.55);
      await Promise.all([
        animate(ox, 0, returnSpringConfig),
        animate(oy, 0, returnSpringConfig),
        animate(blurMv, 0, returnSpringConfig),
      ]);
      if (!cancelled) {
        pitStopLettersRef.current.delete(pitKey(letterIndex));
      }
    };

    void (async () => {
      const targets: { x: number; y: number }[] = [];

      for (let i = 0; i < letterCount; i++) {
        pitStopLettersRef.current.add(pitKey(i));
        txs[i].set(0);
        tys[i].set(0);
        const angle = Math.random() * Math.PI * 2;
        const targetX = Math.cos(angle) * LAUNCH_DISTANCE;
        const targetY = Math.sin(angle) * LAUNCH_DISTANCE;
        targets[i] = { x: targetX, y: targetY };
      }

      const launchAnims: Promise<unknown>[] = [];
      for (let i = 0; i < letterCount; i++) {
        launchAnims.push(
          animate(oxs[i], targets[i].x, {
            duration: LAUNCH_DURATION,
            ease: "easeIn",
          }) as unknown as Promise<unknown>,
          animate(oys[i], targets[i].y, {
            duration: LAUNCH_DURATION,
            ease: "easeIn",
          }) as unknown as Promise<unknown>,
          animate(blurMvs[i], BLUR_MAX, {
            duration: LAUNCH_DURATION,
            ease: "easeIn",
          }) as unknown as Promise<unknown>,
        );
      }
      await Promise.all(launchAnims);
      if (cancelled) return;

      const order = Array.from({ length: letterCount }, (_, i) => i);
      shuffleInPlace(order);

      for (const li of order) {
        if (cancelled) return;
        await returnSingleLetter(li, targets[li]);
      }

      if (!cancelled && gen === sequenceGenerationRef.current) {
        onScatterComplete?.();
      }
    })();

    return () => {
      cancelled = true;
      for (let i = 0; i < letterCount; i++) {
        pitLetters.delete(pitKey(i));
        oxs[i].set(0);
        oys[i].set(0);
        blurMvs[i].set(0);
      }
    };
  }, [
    scatterTrigger,
    letterCount,
    blurMvs,
    oxs,
    oys,
    txs,
    tys,
    pitKey,
    playWheelGun,
    queueGlobalReturnGap,
    onScatterComplete,
  ]);

  return (
    <div role="presentation" className={className}>
      {tokens.map((t, sequenceIndex) => {
        if (t.kind === "space") {
          return (
            <ScatterEntranceSpace
              key={t.key}
              sequenceIndex={sequenceIndex}
              entranceBaseDelay={entranceBaseDelay}
              className="inline-block w-[0.28em] sm:w-[0.32em]"
            />
          );
        }
        const li = t.letterIndex;
        return (
          <ScatterLetter
            key={t.key}
            ref={(el) => {
              letterRefs.current[li] = el;
            }}
            char={t.ch}
            tx={txs[li]}
            ty={tys[li]}
            ox={oxs[li]}
            oy={oys[li]}
            blurMv={blurMvs[li]}
            lineId={lineId}
            className="font-display"
            entranceIndex={sequenceIndex}
            entranceBaseDelay={entranceBaseDelay}
          />
        );
      })}
    </div>
  );
}
