"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Icon } from "./Icon";
import { tileUrl } from "@/lib/tiles";
import { useIsDark } from "@/hooks/use-is-dark";
import { searchPlaces, reverseGeocode, type GeoResult } from "@/lib/geocode";
import type { Location } from "@/lib/types";
import { DEFAULT_CENTER } from "@/lib/region";

const FALLBACK = DEFAULT_CENTER;

interface PinLocationViewProps {
  userLocation: Location | null;
  onConfirm: (loc: Location) => void;
  onClose: () => void;
}

export function PinLocationView({ userLocation, onConfirm, onClose }: PinLocationViewProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const centerRef = useRef<[number, number]>(
    userLocation ? [userLocation.latitude, userLocation.longitude] : FALLBACK
  );
  const dark = useIsDark();
  const [address, setAddress] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSearchChange = (v: string) => {
    setQuery(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (v.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setResults(await searchPlaces(v));
    }, 350);
  };

  const pickResult = (r: GeoResult) => {
    setQuery(r.label);
    setResults([]);
    setAddress(r.label);
    centerRef.current = [r.lat, r.lon];
    mapRef.current?.flyTo([r.lat, r.lon], 16, { duration: 0.8 });
  };

  const resolveAddress = async () => {
    const [lat, lon] = centerRef.current;
    const { label } = await reverseGeocode(lat, lon);
    setAddress(label === "Near you" ? "Pinned location" : label);
  };

  useEffect(() => {
    let cancelled = false;
    if (!elRef.current || mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;

      const map = L.map(elRef.current, { zoomControl: false, attributionControl: false }).setView(
        centerRef.current,
        userLocation ? 15 : 5
      );
      mapRef.current = map;
      tileRef.current = L.tileLayer(tileUrl(document.documentElement.classList.contains("dark")), {
        maxZoom: 20, subdomains: "abcd", attribution: "© OpenStreetMap · © CARTO",
      }).addTo(map);
      L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

      map.on("move", () => {
        const c = map.getCenter();
        centerRef.current = [c.lat, c.lng];
      });
      map.on("moveend", resolveAddress);
      resolveAddress();
      setTimeout(() => mapRef.current && map.invalidateSize(), 60);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        tileRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tileRef.current) tileRef.current.setUrl(tileUrl(dark));
  }, [dark]);

  const confirm = () => {
    const [lat, lon] = centerRef.current;
    onConfirm({ latitude: lat, longitude: lon, address: address || "Pinned location" });
  };

  return (
    <div className="view route" style={{ overflow: "hidden", inset: 0, background: "#e8eaed" }}>
      <div ref={elRef} className="leaflet-host" />

      {/* fixed center pin the user drags the map under */}
      <div className="pin-crosshair">
        <Icon name="pin" size={42} />
      </div>

      {/* top bar */}
      <div
        style={{
          position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 14px)",
          left: 16, right: 16, display: "flex", alignItems: "center", gap: 10, zIndex: 500,
        }}
      >
        <button className="map-fab" onClick={onClose} aria-label="Back">
          <Icon name="back" size={22} />
        </button>
        <div className="search elevated" style={{ flex: 1, height: 50 }}>
          <Icon name="search" size={18} style={{ color: "var(--text-3)" }} />
          <input
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search a place or address"
            autoComplete="off"
          />
        </div>
      </div>

      {results.length > 0 && (
        <div
          style={{
            position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 72px)",
            left: 16, right: 16, zIndex: 510,
            background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16,
            boxShadow: "var(--shadow-pop)", overflow: "hidden", maxHeight: "46%", overflowY: "auto",
          }}
        >
          {results.map((r, i) => (
            <button key={i} className="row" onClick={() => pickResult(r)} style={{ width: "100%" }}>
              <div className="row-ico"><Icon name="pin" size={16} /></div>
              <div className="row-main">
                <div className="row-title" style={{ fontSize: 14, whiteSpace: "normal", lineHeight: 1.3 }}>{r.label}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* bottom confirm card */}
      <div className="map-sheet" style={{ zIndex: 500, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 22px)" }}>
        <div className="sheet-grab" />
        <div style={{ padding: "6px 20px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div className="rem-ico" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
              <Icon name="pin" size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {address || "Finding address…"}
              </div>
              <div className="dim" style={{ fontSize: 13 }}>Drag so the pin sits on your location</div>
            </div>
          </div>
          <button className="btn btn-accent btn-block" style={{ height: 52 }} onClick={confirm}>
            <Icon name="check" size={18} /> Use this location
          </button>
        </div>
      </div>
    </div>
  );
}
