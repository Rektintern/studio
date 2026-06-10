"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Icon } from "./Icon";
import { ReminderRow } from "./ReminderRow";
import { NotifyCta } from "./NotifyCta";
import { LocationBlockedHelp } from "./LocationBlockedHelp";
import { CATEGORIES } from "@/lib/categories";
import { pinSvg } from "@/lib/pin-svg";
import { tileUrl } from "@/lib/tiles";
import { useIsDark } from "@/hooks/use-is-dark";
import type { CategoryKey, DecoratedReminder, Location } from "@/lib/types";

const FALLBACK: [number, number] = [20.5937, 78.9629]; // India centroid, used until GPS arrives

interface NearbyStore { id: string; lat: number; lon: number; name: string; cat: CategoryKey; }

interface MapScreenProps {
  userLocation: Location | null;
  reminders: DecoratedReminder[];
  nearbyStores?: NearbyStore[];
  onOpen: (r: DecoratedReminder) => void;
  locating?: boolean;
  locationError?: string | null;
  onEnableLocation?: () => void;
  onPinLocation?: () => void;
  locationDenied?: boolean;
}

export function MapScreen({ userLocation, reminders, nearbyStores = [], onOpen, locating, locationError, onEnableLocation, onPinLocation, locationDenied }: MapScreenProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const Lref = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const didCenter = useRef(false);
  const dark = useIsDark();

  const userPos: [number, number] | null = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : null;
  const live = reminders.filter((r) => r.inRange);

  // init map once
  useEffect(() => {
    let cancelled = false;
    if (!elRef.current || mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;
      Lref.current = L;

      const map = L.map(elRef.current, { zoomControl: false, attributionControl: false }).setView(
        userPos || FALLBACK,
        userPos ? 15 : 5
      );
      mapRef.current = map;
      if (userPos) didCenter.current = true;

      tileRef.current = L.tileLayer(tileUrl(document.documentElement.classList.contains("dark")), {
        maxZoom: 20, subdomains: "abcd", attribution: "© OpenStreetMap · © CARTO",
      }).addTo(map);
      L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);
      overlayRef.current = L.layerGroup().addTo(map);

      draw();
      setTimeout(() => mapRef.current && map.invalidateSize(), 60);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        overlayRef.current = null;
        tileRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // redraw user marker + rings + pins when data changes
  function draw() {
    const L = Lref.current;
    const map = mapRef.current;
    const overlay = overlayRef.current;
    if (!L || !map || !overlay) return;
    overlay.clearLayers();

    if (userPos) {
      const userIcon = L.divIcon({
        className: "user-marker", iconSize: [120, 120], iconAnchor: [60, 60],
        html: `<span class="um-ring"></span><span class="um-ring" style="animation-delay:1.6s"></span><span class="um-dot"></span>`,
      });
      L.marker(userPos, { icon: userIcon, interactive: false, zIndexOffset: -100 }).addTo(overlay);
      if (!didCenter.current) {
        map.setView(userPos, 15);
        didCenter.current = true;
      }
    }

    const acc = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "#1b8f5a";

    // coverage rings for every in-range reminder — thin outline only (no fill)
    // so the map stays readable even when several overlap
    reminders.forEach((r) => {
      if (!r.inRange || !r.nearest) return;
      L.circle([r.nearest.lat, r.nearest.lon], {
        radius: r.radius, color: acc, weight: 1.5, opacity: 0.5, fill: false,
      }).addTo(overlay);
    });

    // mark every nearby matching store with a small dot so you can see what's
    // around your spot (skip ones a reminder already pins, to avoid doubling up)
    const matchIds = new Set<string>();
    reminders.forEach((r) => { if (r.nearest) matchIds.add(r.nearest.id); });
    nearbyStores.forEach((s) => {
      if (matchIds.has(s.id)) return;
      const dot = L.divIcon({ className: "store-dot-wrap", iconSize: [14, 14], iconAnchor: [7, 7], html: `<span class="storedot"></span>` });
      L.marker([s.lat, s.lon], { icon: dot }).addTo(overlay).bindPopup(s.name);
    });

    // one pin per place (live wins when reminders share a nearest spot)
    const byPlace = new Map<string, { pos: [number, number]; cat: typeof reminders[number]["cat"]; live: boolean; r: DecoratedReminder }>();
    reminders.forEach((r) => {
      if (!r.nearest) return;
      const existing = byPlace.get(r.nearest.id);
      if (!existing) {
        byPlace.set(r.nearest.id, { pos: [r.nearest.lat, r.nearest.lon], cat: r.cat, live: r.inRange, r });
      } else if (r.inRange && !existing.live) {
        existing.live = true;
        existing.r = r;
        existing.cat = r.cat;
      }
    });
    byPlace.forEach((p) => {
      const icon = L.divIcon({
        className: "rem-marker", iconSize: [34, 34], iconAnchor: [17, 34],
        html: `<span class="mappin${p.live ? " live" : ""}">${pinSvg(CATEGORIES[p.cat].icon)}</span>`,
      });
      L.marker(p.pos, { icon }).addTo(overlay).on("click", () => onOpen(p.r));
    });
  }

  // collapse the redraw inputs into ONE stable string — a deps array must never
  // contain raw, variable-length arrays (React: "deps changed size between renders")
  const drawKey =
    reminders.map((r) => `${r.id}:${r.inRange ? 1 : 0}:${r.nearest?.id ?? ""}`).join("|") +
    "#" +
    nearbyStores.map((s) => s.id).join(",") +
    "#" +
    (userPos ? `${userPos[0].toFixed(5)},${userPos[1].toFixed(5)}` : "none");

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawKey]);

  // swap basemap tiles when the theme changes
  useEffect(() => {
    if (tileRef.current) tileRef.current.setUrl(tileUrl(dark));
  }, [dark]);

  const recenter = () => {
    if (mapRef.current && userPos) mapRef.current.flyTo(userPos, 15, { duration: 0.8 });
  };

  // --- draggable bottom sheet: expanded <-> peek ---
  // pointer-capture starts only once the gesture is a real vertical drag, so
  // taps on buttons inside the sheet keep working (same trick as the tab lens)
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetStart = useRef<{ y: number; base: number; moved: boolean } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [sheetY, setSheetY] = useState<number | null>(null); // live px while dragging

  const sheetMaxShift = () => {
    const el = sheetRef.current;
    if (!el) return 0;
    const padBottom = parseFloat(getComputedStyle(el).paddingBottom) || 92; // safe-area + 92
    return Math.max(0, el.offsetHeight - 58 - padBottom); // peek: 58px above the tab bar
  };
  const onSheetDown = (e: React.PointerEvent) => {
    sheetStart.current = { y: e.clientY, base: collapsed ? sheetMaxShift() : 0, moved: false };
  };
  const onSheetMove = (e: React.PointerEvent) => {
    const s = sheetStart.current;
    if (!s || !sheetRef.current) return;
    const dy = e.clientY - s.y;
    if (!s.moved && Math.abs(dy) > 8) {
      s.moved = true;
      try { sheetRef.current.setPointerCapture(e.pointerId); } catch {}
    }
    if (s.moved) setSheetY(Math.min(sheetMaxShift(), Math.max(0, s.base + dy)));
  };
  const endSheetDrag = (e: React.PointerEvent) => {
    const s = sheetStart.current;
    sheetStart.current = null;
    setSheetY(null);
    if (!s?.moved) return;
    const pos = Math.min(sheetMaxShift(), Math.max(0, s.base + (e.clientY - s.y)));
    setCollapsed(pos > sheetMaxShift() / 2); // snap to the nearer state
  };

  return (
    <div className="view route" style={{ overflow: "hidden", inset: 0, background: "#e8eaed" }}>
      <div ref={elRef} className="leaflet-host" />

      {/* top search bar */}
      <div
        style={{
          position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 14px)",
          left: 16, right: 16, display: "flex", gap: 10, zIndex: 500,
        }}
      >
        <div className="search elevated" style={{ flex: 1, height: 50 }}>
          <Icon name="search" size={19} style={{ color: "var(--text-3)" }} />
          <input placeholder="Search places & reminders" />
        </div>
        <button className="map-fab" style={{ width: 50, height: 50, borderRadius: 16 }} onClick={onPinLocation} aria-label="Set location on map">
          <Icon name="pin" size={20} />
        </button>
      </div>

      <button
        className="map-fab"
        style={{ position: "absolute", right: 16, top: "calc(env(safe-area-inset-top, 0px) + 76px)", zIndex: 500 }}
        onClick={recenter}
        aria-label="Recenter"
      >
        <Icon name="recenter" size={20} style={{ color: "#2a73e8" }} />
      </button>

      {!userLocation && locating && (
        <div className="locating-pill">
          <span className="spinner" />
          Finding your location…
        </div>
      )}

      {/* peeking bottom sheet — drag the handle (or anywhere) down to collapse */}
      <div
        ref={sheetRef}
        className={"map-sheet" + (collapsed ? " collapsed" : "")}
        style={{ zIndex: 500, ...(sheetY !== null ? { transform: `translateY(${sheetY}px)`, transition: "none" } : {}) }}
        onPointerDown={onSheetDown}
        onPointerMove={onSheetMove}
        onPointerUp={endSheetDrag}
        onPointerCancel={endSheetDrag}
      >
        <button
          className="grab-zone"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sheet" : "Collapse sheet"}
        >
          <span className="sheet-grab" />
        </button>
        <div style={{ padding: "6px 20px 24px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
            <div className="h2" style={{ fontSize: 19 }}>In range now</div>
            <span className="dim" style={{ fontSize: 13, fontWeight: 600 }}>
              {live.length} of {reminders.length}
            </span>
          </div>
          <div className="dim" style={{ fontSize: 13, marginBottom: 14 }}>
            {userLocation
              ? `${userLocation.address || "Near you"} · updated just now`
              : locating
                ? "Locating…"
                : "Location is off"}
            {onPinLocation && (
              <button className="link-pin" onClick={onPinLocation}>· Set on map</button>
            )}
          </div>
          {!userLocation && !locating ? (
            locationDenied ? (
              <LocationBlockedHelp onRetry={onEnableLocation} />
            ) : (
              <div style={{ padding: "2px 0 8px" }}>
                <div className="dim" style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 12 }}>
                  {locationError || "Turn on location so we can ping you near your reminders."}
                </div>
                <button className="btn btn-accent" style={{ height: 46, padding: "0 18px" }} onClick={onEnableLocation}>
                  <Icon name="location" size={18} /> Enable location
                </button>
              </div>
            )
          ) : live.length === 0 ? (
            <div className="dim" style={{ fontSize: 14, padding: "8px 0" }}>
              {userLocation ? "Nothing nearby — you're all clear." : "Locating…"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {live.map((r) => (
                <ReminderRow key={r.id} r={r} onOpen={onOpen} />
              ))}
            </div>
          )}

          <NotifyCta />
        </div>
      </div>
    </div>
  );
}
