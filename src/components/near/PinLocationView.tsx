"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Icon } from "./Icon";
import { tileUrl } from "@/lib/tiles";
import { useIsDark } from "@/hooks/use-is-dark";
import type { Location } from "@/lib/types";

const FALLBACK: [number, number] = [20.5937, 78.9629];

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

  const reverseGeocode = async () => {
    const [lat, lon] = centerRef.current;
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      const d = await res.json();
      const parts = Array.from(new Set([d.locality, d.city, d.principalSubdivision, d.countryCode])).filter(Boolean);
      setAddress(parts.slice(0, 2).join(", ") || "Pinned location");
    } catch {
      setAddress("Pinned location");
    }
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
      map.on("moveend", reverseGeocode);
      reverseGeocode();
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
          <Icon name="pin" size={18} style={{ color: "var(--brand)" }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Move the map to pin your spot</span>
        </div>
      </div>

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
