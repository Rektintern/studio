"use client";

import { useEffect, useRef, useState } from "react";

interface SegProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  capitalize?: boolean;
}

/**
 * Segmented control with the same liquid-lens gesture as the tab bar:
 * tap an option to switch instantly, or press-and-DRAG — the selection pill
 * detaches and slides under your finger across the options, release to pick.
 * (Pointer capture starts only once it's a real drag, so taps click through.)
 */
export function Seg<T extends string>({ options, value, onChange, capitalize = true }: SegProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; moved: boolean } | null>(null);
  const [dragX, setDragX] = useState<number | null>(null);
  const dragging = dragX !== null;

  const n = options.length;
  const PAD = 4, GAP = 4;
  const activeIdx = Math.max(0, options.findIndex((o) => o.value === value));
  const slotW = () => ((ref.current?.clientWidth ?? 0) - PAD * 2 - GAP * (n - 1)) / n;
  const idxFromX = (x: number) => {
    const w = ref.current?.clientWidth ?? 1;
    return Math.min(n - 1, Math.max(0, Math.floor(((x - PAD) / (w - PAD * 2)) * n)));
  };
  const lensIdx = dragging ? idxFromX(dragX) : activeIdx;

  // tiny tick when the lens crosses onto another option (Android; iOS ignores)
  const lastIdx = useRef(lensIdx);
  useEffect(() => {
    if (dragging && lastIdx.current !== lensIdx) navigator.vibrate?.(8);
    lastIdx.current = lensIdx;
  }, [lensIdx, dragging]);

  const segX = (e: React.PointerEvent) => e.clientX - (ref.current?.getBoundingClientRect().left ?? 0);
  const down = (e: React.PointerEvent) => {
    start.current = { x: segX(e), moved: false };
  };
  const move = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || !ref.current) return;
    const x = segX(e);
    if (!s.moved && Math.abs(x - s.x) > 6) {
      s.moved = true;
      try { ref.current.setPointerCapture(e.pointerId); } catch {}
    }
    if (s.moved) setDragX(Math.min(ref.current.clientWidth, Math.max(0, x)));
  };
  const up = (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    setDragX(null);
    if (s?.moved) onChange(options[idxFromX(segX(e))].value);
    // plain taps fall through to the buttons' onClick
  };

  const lensW = `calc((100% - ${PAD * 2 + GAP * (n - 1)}px) / ${n})`;
  const lensStyle = dragging
    ? {
        width: lensW,
        transform: `translateX(${Math.min((n - 1) * (slotW() + GAP), Math.max(0, (dragX as number) - PAD - slotW() / 2))}px) scale(1.04)`,
        transition: "none" as const,
      }
    : { width: lensW, transform: `translateX(calc(${activeIdx} * (100% + ${GAP}px)))` };

  return (
    <div
      className="seg has-lens"
      ref={ref}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <span className="seg-lens" style={lensStyle} aria-hidden="true" />
      {options.map((o, i) => (
        <button
          key={o.value}
          className={(o.value === value ? "on" : "") + (dragging && lensIdx === i ? " lensed" : "")}
          onClick={() => onChange(o.value)}
          style={capitalize ? { textTransform: "capitalize" } : undefined}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
