"use client";

import {
  m as motion,
  motionValue,
  useSpring,
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
import type { TireMv } from "./use-pitstop";

const magnetSpringConfig = {
  type: "spring" as const,
  stiffness: 250,
  damping: 20,
  mass: 0.8,
};

/** Per-token stagger for the initial letter fade-in (ms). */
export const SCATTER_NAME_ENTRANCE_STAGGER_MS = 27;

/** Base delay (ms) before the first line’s first token fades in. */
export const SCATTER_NAME_ENTRANCE_BASE_MS = 39;

type LineId = "tanish" | "misra";

type ScatterLetterProps = {
  char: string;
  tx: MotionValue<number>;
  ty: MotionValue<number>;
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
      lineId,
      className,
      entranceIndex,
      entranceBaseDelay,
    },
    ref,
  ) {
    const sx = useSpring(tx, magnetSpringConfig);
    const sy = useSpring(ty, magnetSpringConfig);

    const lineColorClass =
      lineId === "tanish" ? "text-fg" : "text-dim";

    /* Magnet spring on the letter; the pit-stop offset lives on the tire group wrapping it (see ScatterName). */
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
        >
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay:
                (entranceBaseDelay +
                  entranceIndex * SCATTER_NAME_ENTRANCE_STAGGER_MS) /
                1000,
              duration: 0.11,
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
        delay:
          (entranceBaseDelay +
            sequenceIndex * SCATTER_NAME_ENTRANCE_STAGGER_MS) /
          1000,
        duration: 0.11,
        ease: "easeOut",
      }}
    />
  );
}

/* 250 (was 350) so the cursor can rest beside/below the left-aligned hero name without moving it. */
const MAGNET_RADIUS = 250;
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
  /** The line is two tires: chars before `splitAt` ride `left`, the rest ride `right` (see use-pitstop.ts). */
  splitAt: number;
  left: TireMv;
  right: TireMv;
  magnetPullRef?: MutableRefObject<
    ((clientX: number, clientY: number) => void) | null
  >;
  magnetResetRef?: MutableRefObject<(() => void) | null>;
  className?: string;
  /** ms before first letter (or space) on this line starts fading in */
  entranceDelay?: number;
};

export function ScatterName({
  text,
  lineId,
  splitAt,
  left,
  right,
  magnetPullRef,
  magnetResetRef,
  className,
  entranceDelay = SCATTER_NAME_ENTRANCE_BASE_MS,
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

  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const resetOffsets = useCallback(() => {
    for (let i = 0; i < letterCount; i++) {
      txs[i].set(0);
      tys[i].set(0);
    }
  }, [letterCount, txs, tys]);

  const applyMagnetPull = useCallback(
    (clientX: number, clientY: number) => {
      for (const t of tokens) {
        if (t.kind !== "char") continue;
        const li = t.letterIndex;

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
    [tokens, txs, tys],
  );

  useEffect(() => {
    if (magnetPullRef) magnetPullRef.current = applyMagnetPull;
    if (magnetResetRef) magnetResetRef.current = resetOffsets;
    return () => {
      if (magnetPullRef) magnetPullRef.current = null;
      if (magnetResetRef) magnetResetRef.current = null;
    };
  }, [applyMagnetPull, magnetPullRef, magnetResetRef, resetOffsets]);

  const rendered = tokens.map((t, sequenceIndex) => {
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
        lineId={lineId}
        className="font-display"
        entranceIndex={sequenceIndex}
        entranceBaseDelay={entranceBaseDelay}
      />
    );
  });

  return (
    <div role="presentation" className={className}>
      <motion.span className="inline-block" style={{ x: left.x, y: left.y }}>
        {rendered.slice(0, splitAt)}
      </motion.span>
      <motion.span className="inline-block" style={{ x: right.x, y: right.y }}>
        {rendered.slice(splitAt)}
      </motion.span>
      <span className="sr-only">{text}</span>
    </div>
  );
}
