"use client";

import { useState, type CSSProperties } from "react";
import { Icon } from "./Icon";
import { useNotifyPermission } from "@/hooks/use-notify-permission";

/**
 * Notification opt-in for the map sheet — a green "Enable notifications" button
 * styled like the "Enable location" one right above it.
 *  - default      → tap fires the native permission prompt
 *  - denied       → can't re-prompt; tap reveals how to unblock in the browser
 *  - iOS in a tab → can't prompt at all; tap reveals "Add to Home Screen" steps
 *  - granted      → hidden (like the location button once it's on)
 */
export function NotifyCta() {
  const { ready, state, env, request } = useNotifyPermission();
  const [showHelp, setShowHelp] = useState(false);

  if (!ready) return null;
  if (state === "granted") return null;
  // A browser with no Notification support that also isn't an iPhone we can
  // guide — nothing actionable to offer.
  if (state === "unsupported" && !env.ios) return null;

  // "default" = never asked yet → one tap can still bring up the prompt.
  const canPrompt = state === "default";

  // Steps for when we *can't* prompt (denied, or iOS in a plain Safari tab).
  const steps =
    env.ios && !env.standalone
      ? [
          "Tap the Share icon in Safari (the box with an arrow)",
          'Choose "Add to Home Screen"',
          "Open NEAR REMIND from the new icon, then allow notifications",
        ]
      : env.ios
        ? [
            "Open the iPhone Settings app",
            "Scroll down and tap NEAR REMIND",
            "Tap Notifications → Allow Notifications",
          ]
        : [
            'Tap the lock / "Aa" / ⓘ icon next to the web address',
            "Open Site settings → Notifications",
            "Switch it to Allow, then reload this page",
          ];

  const helper = canPrompt
    ? "Get a ping the moment you're near one of your places."
    : env.ios && !env.standalone
      ? "On iPhone, add NEAR REMIND to your Home Screen to get pings."
      : "Notifications are blocked in your browser — tap for the steps to fix it.";

  const onTap = () => {
    if (canPrompt) request();
    else setShowHelp((v) => !v);
  };

  return (
    <div style={wrap}>
      <div className="dim" style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 12 }}>
        {helper}
      </div>
      <button
        className="btn btn-accent"
        style={{ height: 46, padding: "0 18px" }}
        onClick={onTap}
        aria-expanded={canPrompt ? undefined : showHelp}
      >
        <Icon name="bell" size={18} /> Enable notifications
      </button>
      {!canPrompt && showHelp && (
        <ol style={stepsList}>
          {steps.map((s, i) => (
            <li key={i} style={stepItem}>
              <span style={stepNum}>{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const wrap: CSSProperties = {
  marginTop: 16,
  paddingTop: 16,
  borderTop: "1px solid var(--line)",
};

const stepsList: CSSProperties = {
  margin: "14px 0 2px",
  padding: 0,
  listStyle: "none",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const stepItem: CSSProperties = {
  display: "flex",
  gap: 9,
  fontSize: 12.5,
  color: "var(--text-2)",
  lineHeight: 1.45,
};

const stepNum: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 19,
  height: 19,
  borderRadius: 6,
  background: "var(--surface-2)",
  color: "var(--text-2)",
  fontSize: 11,
  fontWeight: 700,
  flexShrink: 0,
};
