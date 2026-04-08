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
  useMemo,
  useRef,
} from "react";

const springConfig = {
  type: "spring" as const,
  stiffness: 250,
  damping: 20,
  mass: 0.8,
};

const LAUNCH_DURATION = 0.41;
const LAUNCH_DISTANCE = 1800;
/** Peak motion blur (px) during pit launch / return */
const BLUR_MAX = 100;

type LineId = "tanish" | "misra";

type ScatterLetterProps = {
  char: string;
  tx: MotionValue<number>;
  ty: MotionValue<number>;
  ox: MotionValue<number>;
  oy: MotionValue<number>;
  blurMv: MotionValue<number>;
  lineId: LineId;
  onLetterActivate: () => void;
  className?: string;
};

const ScatterLetter = forwardRef<HTMLSpanElement, ScatterLetterProps>(
  function ScatterLetter(
    { char, tx, ty, ox, oy, blurMv, lineId, onLetterActivate, className },
    ref,
  ) {
    const sx = useSpring(tx, springConfig);
    const sy = useSpring(ty, springConfig);

    const filterBlur = useTransform(blurMv, (b) => `blur(${Number(b)}px)`);

    const onKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onLetterActivate();
      }
    };

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
          role="button"
          tabIndex={0}
          aria-label={`Letter ${char}, pit-stop animation`}
          className={`inline-block cursor-pointer select-none ${lineColorClass}`}
          style={{
            x: ox,
            y: oy,
            filter: filterBlur,
            willChange: "transform, filter",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onLetterActivate();
          }}
          onKeyDown={onKeyDown}
        >
          {char}
        </motion.span>
      </motion.span>
    );
  },
);

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

type ScatterNameProps = {
  text: string;
  lineId: LineId;
  className?: string;
};

export function ScatterName({ text, lineId, className }: ScatterNameProps) {
  const tokens = useMemo(() => buildTokens(text), [text]);
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

  const runPitStop = useCallback(
    async (letterIndex: number) => {
      const key = pitKey(letterIndex);
      if (pitStopLettersRef.current.has(key)) return;

      pitStopLettersRef.current.add(key);
      txs[letterIndex].set(0);
      tys[letterIndex].set(0);

      const ox = oxs[letterIndex];
      const oy = oys[letterIndex];
      const blurMv = blurMvs[letterIndex];

      const angle = Math.random() * Math.PI * 2;
      const targetX = Math.cos(angle) * LAUNCH_DISTANCE;
      const targetY = Math.sin(angle) * LAUNCH_DISTANCE;

      await Promise.all([
        animate(ox, targetX, {
          duration: LAUNCH_DURATION,
          ease: "easeIn",
        }),
        animate(oy, targetY, {
          duration: LAUNCH_DURATION,
          ease: "easeIn",
        }),
        animate(blurMv, BLUR_MAX, {
          duration: LAUNCH_DURATION,
          ease: "easeIn",
        }),
      ]);

      ox.set(-targetX);
      oy.set(-targetY);
      blurMv.set(BLUR_MAX * 0.55);

      await Promise.all([
        animate(ox, 0, {
          type: "spring",
          stiffness: 250,
          damping: 20,
          mass: 0.8,
        }),
        animate(oy, 0, {
          type: "spring",
          stiffness: 250,
          damping: 20,
          mass: 0.8,
        }),
        animate(blurMv, 0, {
          type: "spring",
          stiffness: 250,
          damping: 20,
          mass: 0.8,
        }),
      ]);

      pitStopLettersRef.current.delete(key);
    },
    [blurMvs, oxs, oys, pitKey, txs, tys],
  );

  return (
    <div
      role="presentation"
      className={className}
      onPointerMove={(e) => applyMagnetPull(e.clientX, e.clientY)}
      onPointerLeave={resetOffsets}
      onPointerCancel={resetOffsets}
    >
      {tokens.map((t) => {
        if (t.kind === "space") {
          return (
            <span
              key={t.key}
              className="inline-block w-[0.28em] sm:w-[0.32em]"
              aria-hidden
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
            onLetterActivate={() => {
              void runPitStop(li);
            }}
            className="font-display"
          />
        );
      })}
    </div>
  );
}
