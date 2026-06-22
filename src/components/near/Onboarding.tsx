"use client";

import { Icon } from "./Icon";
import { MiniMap } from "./MiniMap";
import type { Location } from "@/lib/types";
import { DEFAULT_CENTER } from "@/lib/region";

const FALLBACK = DEFAULT_CENTER;

interface OnboardingProps {
  userLocation: Location | null;
  onDone: () => void;
}

const STEPS: [string, string][] = [
  ["edit", "Note it"],
  ["pin", "Pick a place"],
  ["bell", "Get pinged"],
];

export function Onboarding({ userLocation, onDone }: OnboardingProps) {
  const center: [number, number] = userLocation ? [userLocation.latitude, userLocation.longitude] : FALLBACK;

  return (
    <div className="view route" style={{ inset: 0, background: "var(--app-bg)" }}>
      <div
        style={{
          position: "relative", height: "100%", display: "flex", flexDirection: "column",
          padding: "calc(env(safe-area-inset-top, 0px) + 12px) 24px calc(env(safe-area-inset-bottom, 0px) + 30px)",
        }}
      >
        {/* clean map hero */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", minHeight: 0 }}>
          <div style={{ width: "100%" }}>
            <MiniMap center={center} radius={500} height={300} cat="grocery" live />
          </div>
        </div>

        <div>
          <div className="eyebrow">Welcome to NEAR REMIND</div>
          <div className="h1" style={{ fontSize: 34, marginTop: 10, letterSpacing: "-0.025em" }}>
            Reminders that<br />know where you are
          </div>
          <div className="dim" style={{ marginTop: 12, fontSize: 15.5, lineHeight: 1.5, textWrap: "balance" } as React.CSSProperties}>
            Save it once — we&apos;ll nudge you the moment you&apos;re close to the right place.
          </div>

          {/* mini how-it-works */}
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            {STEPS.map(([ic, t], i) => (
              <div key={i} className="card" style={{ flex: 1, padding: "14px 8px", textAlign: "center", display: "grid", placeItems: "center", gap: 8 }}>
                <div style={{ color: "var(--brand)" }}><Icon name={ic} size={21} /></div>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>{t}</div>
              </div>
            ))}
          </div>

          <button className="btn btn-accent btn-block" style={{ marginTop: 22 }} onClick={onDone}>
            <Icon name="location" size={20} /> Enable location &amp; start
          </button>
          <div className="dim" style={{ textAlign: "center", marginTop: 12, fontSize: 12.5 }}>
            Your location never leaves your device.
          </div>
        </div>
      </div>
    </div>
  );
}
