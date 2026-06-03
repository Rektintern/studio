"use client";

import { Icon } from "./Icon";
import { fmtDist } from "@/lib/geo";
import type { DecoratedReminder } from "@/lib/types";

interface PingBannerProps {
  r: DecoratedReminder;
  onOpen: () => void;
  onClose: () => void;
}

/** In-app "you're near a spot" alert — shows while the app is open, no OS permission needed. */
export function PingBanner({ r, onOpen, onClose }: PingBannerProps) {
  return (
    <div className="ping-banner" onClick={onOpen} role="alert">
      <div className="pb-ico"><Icon name="bell" size={20} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="pb-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          You&apos;re near {r.nearest?.name || "a spot"}
        </div>
        <div className="pb-sub" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {r.title}{r.dist != null ? ` · ${fmtDist(r.dist)} away` : ""}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Dismiss"
        style={{
          background: "rgba(255,255,255,0.2)", border: "none", color: "var(--brand-ink)",
          width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center",
          flexShrink: 0, cursor: "pointer",
        }}
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
