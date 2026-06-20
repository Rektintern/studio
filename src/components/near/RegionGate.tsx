"use client";

import { Icon } from "./Icon";
import { SUPPORTED_REGIONS_LABEL } from "@/lib/region";

interface RegionGateProps {
  countryName?: string | null;
  onChooseLocation: () => void;
  onRetry?: () => void;
}

/**
 * Shown when the user's detected location is outside the regions we serve
 * (UK / US / AUS). We can't offer a useful "what's nearby" map elsewhere yet
 * (sparse free map data), so we gate instead of showing an empty map. A manual
 * pin to a supported area is the way in — also how we test from elsewhere.
 */
export function RegionGate({ countryName, onChooseLocation, onRetry }: RegionGateProps) {
  return (
    <div className="view route" style={{ inset: 0, background: "var(--app-bg)" }}>
      <div
        style={{
          position: "relative", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "center",
          padding: "calc(env(safe-area-inset-top, 0px) + 12px) 28px calc(env(safe-area-inset-bottom, 0px) + 30px)",
        }}
      >
        <div style={{ display: "grid", placeItems: "center", marginBottom: 22 }}>
          <span
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 72, height: 72, borderRadius: 22,
              background: "var(--brand-soft)", color: "var(--brand)",
            }}
          >
            <Icon name="location" size={34} />
          </span>
        </div>

        <div className="eyebrow" style={{ textAlign: "center" }}>NEAR REMIND</div>
        <div className="h1" style={{ fontSize: 30, marginTop: 10, textAlign: "center", letterSpacing: "-0.02em" }}>
          Not in your area yet
        </div>
        <div
          className="dim"
          style={{ marginTop: 14, fontSize: 15, lineHeight: 1.55, textAlign: "center", textWrap: "balance" } as React.CSSProperties}
        >
          {countryName ? `It looks like you're in ${countryName}. ` : ""}
          We&apos;re live in {SUPPORTED_REGIONS_LABEL} for now — that&apos;s where the free
          map data is rich enough to reliably find what&apos;s near you. More places soon.
        </div>

        <button className="btn btn-accent btn-block" style={{ marginTop: 26 }} onClick={onChooseLocation}>
          <Icon name="pin" size={19} /> Set a location in a supported area
        </button>
        {onRetry && (
          <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={onRetry}>
            <Icon name="location" size={18} /> Use my real location
          </button>
        )}
      </div>
    </div>
  );
}
