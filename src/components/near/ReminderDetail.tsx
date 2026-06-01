"use client";

import { Icon } from "./Icon";
import { MiniMap } from "./MiniMap";
import { CATEGORIES, CATEGORY_PLURAL } from "@/lib/categories";
import { fmtDist } from "@/lib/geo";
import type { DecoratedReminder, Location } from "@/lib/types";

const FALLBACK: [number, number] = [20.5937, 78.9629];

interface ReminderDetailProps {
  r: DecoratedReminder;
  userLocation: Location | null;
  onClose: () => void;
  onToggle: (r: DecoratedReminder) => void;
  onDelete: (r: DecoratedReminder) => void;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: "14px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 15, marginTop: 5 }}>{value}</div>
    </div>
  );
}

export function ReminderDetail({ r, userLocation, onClose, onToggle, onDelete }: ReminderDetailProps) {
  const cat = CATEGORIES[r.cat];
  const center: [number, number] = r.nearest
    ? [r.nearest.lat, r.nearest.lon]
    : userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : FALLBACK;

  const navigate = () => {
    const dest = r.nearest
      ? `${r.nearest.lat},${r.nearest.lon}`
      : encodeURIComponent(cat.label);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, "_blank");
  };

  return (
    <div className="view route" style={{ background: "var(--page)" }}>
      <div className="view-pad" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <button className="iconbtn round" onClick={onClose} aria-label="Back">
            <Icon name="back" size={22} />
          </button>
          <div className="section-label" style={{ color: "var(--text-3)" }}>Reminder</div>
          <button className="iconbtn round" onClick={() => onDelete(r)} aria-label="Delete">
            <Icon name="trash" size={19} style={{ color: "var(--text-2)" }} />
          </button>
        </div>

        <MiniMap center={center} radius={r.radius} height={208} cat={r.cat} live={r.inRange} />

        <div style={{ marginTop: 20 }}>
          {r.inRange ? (
            <span className="badge">
              <span style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 6 }}>
                <span className="livedot" />
              </span>
              {fmtDist(r.dist)} away
            </span>
          ) : (
            <span className="badge neutral">{r.dist != null ? `Nearest ${fmtDist(r.dist)}` : "No match nearby yet"}</span>
          )}
          <div className="h1" style={{ fontSize: 27, marginTop: 12 }}>{r.title}</div>
          <div className="dim" style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14.5 }}>
            <Icon name={cat.icon} size={16} /> {cat.label}
          </div>
        </div>

        {/* stat tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 22 }}>
          <StatTile label="Radius" value={fmtDist(r.radius)} />
          <StatTile label="Trigger" value={r.trigger === "arriving" ? "Arriving" : "Nearby"} />
          <StatTile label="Matches" value={`${r.places} spots`} />
        </div>

        {/* matching places */}
        <div className="section-label" style={{ margin: "26px 2px 12px" }}>{CATEGORY_PLURAL[r.cat]} nearby</div>
        <div className="group">
          {r.matches.length === 0 ? (
            <div className="row" style={{ cursor: "default" }}>
              <div className="row-ico"><Icon name="search" size={18} /></div>
              <div className="row-main">
                <div className="row-title">Scanning nearby…</div>
                <div className="row-sub">We&apos;ll show matching {CATEGORY_PLURAL[r.cat].toLowerCase()} here.</div>
              </div>
            </div>
          ) : (
            r.matches.slice(0, 3).map((place, i) => (
              <div className="row" key={place.id} style={{ cursor: "default" }}>
                <div className="row-ico" style={i === 0 && r.inRange ? { background: "var(--brand-soft)", color: "var(--brand)" } : undefined}>
                  <Icon name="pin" size={18} />
                </div>
                <div className="row-main">
                  <div className="row-title">{place.name}</div>
                  <div className="row-sub">{i === 0 ? "Closest match" : "Match nearby"}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: i === 0 && r.inRange ? "var(--brand)" : "var(--text-2)" }}>
                  {fmtDist(place.dist)}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
          <button className="btn btn-ghost" style={{ flex: 1, height: 52 }} onClick={() => onToggle(r)}>
            {r.enabled ? "Pause" : "Activate"}
          </button>
          <button className="btn btn-accent" style={{ flex: 1, height: 52 }} onClick={navigate}>
            <Icon name="nav" size={18} /> Navigate
          </button>
        </div>
      </div>
    </div>
  );
}
