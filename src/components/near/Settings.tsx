"use client";

import { Icon } from "./Icon";
import type { Settings as SettingsType } from "@/lib/types";

interface SettingsProps {
  settings: SettingsType;
  setSettings: (s: SettingsType) => void;
  onReplayOnboarding: () => void;
}

type ToggleKey = "always" | "precise" | "sound" | "haptic" | "quiet";

export function Settings({ settings, setSettings, onReplayOnboarding }: SettingsProps) {
  const toggle = (k: ToggleKey) => setSettings({ ...settings, [k]: !settings[k] });

  const Sw = ({ k }: { k: ToggleKey }) => (
    <button className={"switch" + (settings[k] ? " on" : "")} onClick={() => toggle(k)} aria-label={k}>
      <i />
    </button>
  );

  const initials = (() => {
    const parts = settings.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "ME";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  })();

  return (
    <div className="view route">
      <div className="view-pad" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)" }}>
        <div className="eyebrow muted">Account</div>
        <div className="h1" style={{ fontSize: 30, marginTop: 10 }}>Settings</div>

        {/* profile */}
        <div className="card" style={{ marginTop: 20, padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--brand)", display: "grid", placeItems: "center", color: "var(--brand-ink)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              placeholder="Add your name"
              aria-label="Your name"
              maxLength={40}
              style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontWeight: 600, fontSize: 17, fontFamily: "var(--font-ui)", color: "var(--text)" }}
            />
            <div className="dim" style={{ fontSize: 13 }}>Saved on this device</div>
          </div>
          <span className="badge">PRO</span>
        </div>

        <div className="section-label" style={{ margin: "26px 2px 12px" }}>Appearance</div>
        <div className="seg">
          {(["system", "light", "dark", "glass"] as const).map((t) => (
            <button
              key={t}
              className={settings.theme === t ? "on" : ""}
              onClick={() => setSettings({ ...settings, theme: t })}
              style={{ textTransform: "capitalize" }}
            >
              {t}
            </button>
          ))}
        </div>

        {settings.theme === "glass" && (
          <div className="group" style={{ marginTop: 12 }}>
            <div className="row" style={{ cursor: "default", display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                <span className="row-title">Liquidness</span>
                <span className="dim" style={{ fontSize: 13, fontWeight: 700 }}>{settings.liquid}%</span>
              </div>
              <input
                type="range"
                className="slider"
                min={0}
                max={100}
                value={settings.liquid}
                onChange={(e) => setSettings({ ...settings, liquid: Number(e.target.value) })}
                aria-label="Liquidness"
              />
            </div>
          </div>
        )}

        <div className="section-label" style={{ margin: "26px 2px 12px" }}>Location</div>
        <div className="group">
          <div className="row">
            <div className="row-ico" style={{ color: "var(--brand)" }}><Icon name="location" size={18} /></div>
            <div className="row-main"><div className="row-title">Always allow location</div><div className="row-sub">Needed for proximity pings</div></div>
            <Sw k="always" />
          </div>
          <div className="row">
            <div className="row-ico"><Icon name="target" size={18} /></div>
            <div className="row-main"><div className="row-title">Precise location</div><div className="row-sub">Tighter, more accurate triggers</div></div>
            <Sw k="precise" />
          </div>
        </div>

        <div className="section-label" style={{ margin: "26px 2px 12px" }}>Notifications</div>
        <div className="group">
          <div className="row">
            <div className="row-ico"><Icon name="bell" size={18} /></div>
            <div className="row-main"><div className="row-title">Ping sound</div><div className="row-sub">Chime when a reminder fires</div></div>
            <Sw k="sound" />
          </div>
          <div className="row">
            <div className="row-ico"><Icon name="bolt" size={18} /></div>
            <div className="row-main"><div className="row-title">Haptics</div><div className="row-sub">Buzz on arrival</div></div>
            <Sw k="haptic" />
          </div>
          <div className="row">
            <div className="row-ico"><Icon name="moon" size={18} /></div>
            <div className="row-main"><div className="row-title">Quiet hours</div><div className="row-sub">Mute 10pm – 7am</div></div>
            <Sw k="quiet" />
          </div>
        </div>

        <div className="section-label" style={{ margin: "26px 2px 12px" }}>General</div>
        <div className="group">
          <button className="row" onClick={onReplayOnboarding}>
            <div className="row-ico"><Icon name="sparkle" size={18} /></div>
            <div className="row-main"><div className="row-title">Replay intro</div></div>
            <Icon name="chevron" size={18} style={{ color: "var(--text-3)" }} />
          </button>
          <div className="row">
            <div className="row-ico"><Icon name="shield" size={18} /></div>
            <div className="row-main"><div className="row-title">Privacy</div><div className="row-sub">Location stays on-device</div></div>
            <Icon name="chevron" size={18} style={{ color: "var(--text-3)" }} />
          </div>
          <div className="row">
            <div className="row-ico"><Icon name="info" size={18} /></div>
            <div className="row-main"><div className="row-title">About NEAR REMIND</div><div className="row-sub">Version 2.0</div></div>
            <Icon name="chevron" size={18} style={{ color: "var(--text-3)" }} />
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>NEAR REMIND · Version 2.0</span>
        </div>
      </div>
    </div>
  );
}
