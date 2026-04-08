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

const PURDUE_GOLD = "#CEB866";

const springConfig = {
  type: "spring" as const,
  stiffness: 250,
  damping: 20,
  mass: 0.8,
};

const LAUNCH_DURATION = 0.34;
const LAUNCH_DISTANCE = 2200;
/** Peak motion blur (px) during pit launch / return */
const BLUR_MAX = 10;

type ScatterLetterProps = {
  char: string;
  tx: MotionValue<number>;
  ty: MotionValue<number>;
  ox: MotionValue<number>;
  oy: MotionValue<number>;
  colorMv: MotionValue<string>;
  blurMv: MotionValue<number>;
  onLetterActivate: () => void;
  className?: string;
};

const ScatterLetter = forwardRef<HTMLSpanElement, ScatterLetterProps>(
  function ScatterLetter(
    { char, tx, ty, ox, oy, colorMv, blurMv, onLetterActivate, className },
    ref,
  ) {
    const sx = useSpring(tx, springConfig);
    const sy = useSpring(ty, springConfig);

    const displayX = useTransform([sx, ox], ([a, b]) => Number(a) + Number(b));
    const displayY = useTransform([sy, oy], ([a, b]) => Number(a) + Number(b));
    const filterBlur = useTransform(blurMv, (b) => `blur(${b}px)`);

    const onKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onLetterActivate();
      }
    };

    return (
      <motion.span
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label={`Letter ${char}, pit-stop animation`}
        className={`cursor-pointer select-none ${className ?? ""}`}
        style={{
          x: displayX,
          y: displayY,
          color: colorMv,
          filter: filterBlur,
          display: "inline-block",
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
    );
  },
);

const MAGNET_RADIUS = 400;
const PULL_FACTOR = 0.5;
const MAX_PULL = 90;

type LineId = "tanish" | "misra";

function baselineHexForLine(lineId: LineId): string {
  return lineId === "tanish" ? "#ffffff" : "#525252";
}

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
  const baseline = baselineHexForLine(lineId);

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
  const colorMvs = useMemo(
    () => Array.from({ length: letterCount }, () => motionValue(baseline)),
    [letterCount, baseline],
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
      const colorMv = colorMvs[letterIndex];
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
        animate(colorMv, PURDUE_GOLD, {
          duration: LAUNCH_DURATION * 0.35,
          ease: "easeOut",
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

      await animate(colorMv, baseline, {
        duration: 0.4,
        ease: "easeOut",
      });

      pitStopLettersRef.current.delete(key);
    },
    [baseline, blurMvs, colorMvs, oxs, oys, pitKey, txs, tys],
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
            colorMv={colorMvs[li]}
            blurMv={blurMvs[li]}
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
