"use client";

import { useState, type CSSProperties } from "react";
import { Icon } from "./Icon";
import { useNotifyPermission } from "@/hooks/use-notify-permission";

/**
 * Notification opt-in for the map sheet.
 *  - default      → "Enable notifications" button (prompts on tap)
 *  - denied       → can't re-prompt; show how to unblock in the browser
 *  - iOS in a tab → can't prompt at all; guide them to "Add to Home Screen"
 *  - granted      → nothing to show
 */
export function NotifyCta() {
  const { ready, state, env, request } = useNotifyPermission();
  const [showHelp, setShowHelp] = useState(false);

  if (!ready) return null;
  if (state === "granted") return null;
  // A browser with no Notification support that also isn't an iPhone we can
  // guide — nothing actionable to offer.
  if (state === "unsupported" && !env.ios) return null;

  // "default" = never asked yet → one tap can still prompt.
  const canPrompt = state === "default";

  if (canPrompt) {
    return (
      <div style={wrap}>
        <div style={row}>
          <span style={badge}>
            <Icon name="bell" size={16} />
          </span>
          <div className="dim" style={{ fontSize: 13, lineHeight: 1.45 }}>
            Turn on notifications so we can ping you when you&rsquo;re near a place.
          </div>
        </div>
        <button
          className="btn btn-accent"
          style={{ height: 44, padding: "0 18px", fontSize: 15, marginTop: 11 }}
          onClick={() => request()}
        >
          <Icon name="bell" size={17} /> Enable notifications
        </button>
      </div>
    );
  }

  // Blocked / unsupported-on-iOS → tailor the steps to where they are.
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

  const title =
    env.ios && !env.standalone
      ? "Add to Home Screen to get pings"
      : "Notifications are turned off";

  return (
    <div style={wrap}>
      <button
        onClick={() => setShowHelp((v) => !v)}
        aria-expanded={showHelp}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          width: "100%",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={badge}>
          <Icon name="bell" size={16} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{title}</div>
          <div className="dim" style={{ fontSize: 12.5 }}>Tap for the steps to switch them on</div>
        </div>
        <Icon
          name="chevron"
          size={16}
          style={{
            color: "var(--text-3)",
            flexShrink: 0,
            transform: showHelp ? "rotate(90deg)" : "none",
            transition: "transform .15s ease",
          }}
        />
      </button>
      {showHelp && (
        <ol style={{ margin: "12px 0 2px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
          {steps.map((s, i) => (
            <li key={i} style={{ display: "flex", gap: 9, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>
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
  marginTop: 14,
  paddingTop: 14,
  borderTop: "1px solid var(--line)",
};

const row: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 11,
};

const badge: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: 9,
  background: "var(--brand-soft)",
  color: "var(--brand)",
  flexShrink: 0,
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
