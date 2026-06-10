"use client";

import { type CSSProperties } from "react";
import { Icon } from "./Icon";
import { isAndroid, isIOS, isStandalone } from "@/lib/platform";

/**
 * Shown when location permission is denied. A web app CANNOT open the OS
 * Settings (no API for it), so instead of a button that silently fails we show
 * the exact steps to switch location on, tailored to the platform, plus a
 * retry for once they've done it.
 */
export function LocationBlockedHelp({ onRetry }: { onRetry?: () => void }) {
  const ios = isIOS();
  const android = isAndroid();
  const standalone = isStandalone();

  const steps = ios
    ? [
        "Open the iPhone Settings app",
        "Go to Privacy & Security → Location Services, and make sure it's on",
        standalone
          ? "Scroll down to NEAR REMIND and choose 'While Using the App'"
          : "Find Safari → Location → 'While Using the App', then reload this page",
        "Still nothing? Remove this app from your Home Screen, add it again, and tap Allow when it asks",
      ]
    : android
      ? standalone
        ? [
            "Press and hold the NEAR REMIND icon on your home screen",
            "Tap App info (ⓘ) → Permissions → Location",
            "Choose 'Allow only while using the app', then reopen NEAR REMIND",
          ]
        : [
            "Tap the lock / tune icon to the left of the web address",
            "Tap Permissions → Location → Allow",
            "Reload the page (and check Location is on in Quick Settings)",
          ]
      : [
          "Tap the lock / ⓘ icon next to the web address",
          "Open Site settings → Location",
          "Set it to Allow, then reload the page",
        ];

  return (
    <div style={{ padding: "2px 0 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={badge}><Icon name="location" size={16} /></span>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>Location is turned off</div>
      </div>
      <div className="dim" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
        {ios || android
          ? "An app can't open your phone's Settings for you, so you'll need to switch it on yourself:"
          : "Your browser is blocking location for this site — here's how to allow it:"}
      </div>
      <ol style={list}>
        {steps.map((s, i) => (
          <li key={i} style={item}>
            <span style={num}>{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      {onRetry && (
        <button className="btn btn-accent" style={{ height: 44, padding: "0 18px", marginTop: 14 }} onClick={onRetry}>
          <Icon name="location" size={17} /> I&apos;ve enabled it — retry
        </button>
      )}
    </div>
  );
}

const badge: CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 30, height: 30, borderRadius: 9, background: "var(--brand-soft)", color: "var(--brand)", flexShrink: 0,
};
const list: CSSProperties = { margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 };
const item: CSSProperties = { display: "flex", gap: 9, fontSize: 13, color: "var(--text-2)", lineHeight: 1.45 };
const num: CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 19, height: 19, borderRadius: 6, background: "var(--surface-2)", color: "var(--text-2)",
  fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
};
