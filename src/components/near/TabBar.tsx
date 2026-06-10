"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

export type TabId = "map" | "feed" | "settings";

interface TabBarProps {
  tab: TabId;
  setTab: (t: TabId) => void;
}

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: "map", icon: "map", label: "Map" },
  { id: "feed", icon: "feed", label: "Saved" },
  { id: "settings", icon: "settings", label: "You" },
];

/**
 * Bottom nav with an iOS-style liquid lens: a glass pill parks on the active
 * tab; tap switches instantly, but press-and-DRAG slides the lens across the
 * tabs under your finger — release to pick. (Lens goes full liquid-glass in
 * the Glass theme; a subtle surface pill in light/dark.)
 */
export function TabBar({ tab, setTab }: TabBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; moved: boolean } | null>(null);
  const [dragX, setDragX] = useState<number | null>(null);
  const dragging = dragX !== null;

  const activeIdx = TABS.findIndex((t) => t.id === tab);
  const slotW = () => ((barRef.current?.clientWidth ?? 0) - 16) / TABS.length;
  const idxFromX = (x: number) => {
    const w = barRef.current?.clientWidth ?? 1;
    return Math.min(TABS.length - 1, Math.max(0, Math.floor((x / w) * TABS.length)));
  };
  const lensIdx = dragging ? idxFromX(dragX) : activeIdx;

  // tiny tick when the lens crosses onto another tab (Android; iOS ignores)
  const lastIdx = useRef(lensIdx);
  useEffect(() => {
    if (dragging && lastIdx.current !== lensIdx) navigator.vibrate?.(8);
    lastIdx.current = lensIdx;
  }, [lensIdx, dragging]);

  const barX = (e: React.PointerEvent) => {
    const rect = barRef.current!.getBoundingClientRect();
    return e.clientX - rect.left;
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (!barRef.current) return;
    startRef.current = { x: barX(e), moved: false };
    try { barRef.current.setPointerCapture(e.pointerId); } catch {}
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const start = startRef.current;
    if (!start || !barRef.current) return;
    const x = barX(e);
    if (!start.moved && Math.abs(x - start.x) > 6) start.moved = true;
    if (start.moved) setDragX(Math.min(barRef.current.clientWidth, Math.max(0, x)));
  };
  const endDrag = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    if (startRef.current.moved) setTab(TABS[idxFromX(barX(e))].id);
    // plain taps fall through to the button's onClick
    startRef.current = null;
    setDragX(null);
  };

  const lensStyle = dragging
    ? {
        transform: `translateX(${Math.min((TABS.length - 1) * slotW(), Math.max(0, dragX - 8 - slotW() / 2))}px) scale(1.08)`,
        transition: "none",
      }
    : { transform: `translateX(${activeIdx * 100}%)` };

  return (
    <div className="tabbar-wrap">
      <div
        className="tabbar"
        ref={barRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className={"tab-lens" + (dragging ? " drag" : "")} style={lensStyle} />
        {TABS.map((t, i) => (
          <button
            key={t.id}
            className={"tab" + (tab === t.id ? " active" : "") + (dragging && lensIdx === i ? " lensed" : "")}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} size={23} stroke={tab === t.id || (dragging && lensIdx === i) ? 2.3 : 2} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
