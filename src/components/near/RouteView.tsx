"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Icon } from "./Icon";
import { CATEGORIES } from "@/lib/categories";
import { pinSvg } from "@/lib/pin-svg";
import { tileUrl } from "@/lib/tiles";
import { useIsDark } from "@/hooks/use-is-dark";
import { fetchWalkingRoute, fmtWalkTime, type RouteResult } from "@/lib/route";
import { fmtDist } from "@/lib/geo";
import type { CategoryKey, Location, Place } from "@/lib/types";

interface RouteViewProps {
  userLocation: Location | null;
  place: Place;
  cat: CategoryKey;
  onClose: () => void;
}

export function RouteView({ userLocation, place, cat, onClose }: RouteViewProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const dark = useIsDark();
  const [route, setRoute] = useState<RouteResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!elRef.current || mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;

      const map = L.map(elRef.current, { zoomControl: false, attributionControl: false });
      mapRef.current = map;
      tileRef.current = L.tileLayer(tileUrl(document.documentElement.classList.contains("dark")), {
        maxZoom: 20, subdomains: "abcd", attribution: "© OpenStreetMap · © CARTO",
      }).addTo(map);
      L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

      const dest: [number, number] = [place.lat, place.lon];
      L.marker(dest, {
        icon: L.divIcon({
          className: "rem-marker", iconSize: [34, 34], iconAnchor: [17, 34],
          html: `<span class="mappin live">${pinSvg(CATEGORIES[cat].icon)}</span>`,
        }),
      }).addTo(map);

      if (userLocation) {
        const from: [number, number] = [userLocation.latitude, userLocation.longitude];
        L.marker(from, {
          icon: L.divIcon({ className: "user-marker", iconSize: [30, 30], iconAnchor: [15, 15], html: `<span class="um-dot"></span>` }),
          interactive: false,
        }).addTo(map);
        map.fitBounds(L.latLngBounds([from, dest]).pad(0.3), { animate: false });

        const r = await fetchWalkingRoute(userLocation, { lat: place.lat, lon: place.lon });
        if (cancelled || !mapRef.current) return;
        setRoute(r);
        const acc = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "#1b8f5a";
        const poly = L.polyline(r.coords, { color: acc, weight: 5, opacity: 0.85, lineJoin: "round", lineCap: "round" }).addTo(map);
        map.fitBounds(poly.getBounds().pad(0.25), { animate: false });
      } else {
        map.setView(dest, 15);
      }

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

  const openInMaps = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}&travelmode=walking`,
      "_blank"
    );
  };

  return (
    <div className="view route" style={{ overflow: "hidden", inset: 0, background: "#e8eaed" }}>
      <div ref={elRef} className="leaflet-host" />

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
          <Icon name={CATEGORIES[cat].icon} size={18} style={{ color: "var(--brand)" }} />
          <span style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {place.name}
          </span>
        </div>
      </div>

      {/* bottom route card */}
      <div className="map-sheet" style={{ zIndex: 500, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 22px)" }}>
        <div className="sheet-grab" />
        <div style={{ padding: "6px 20px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="rem-ico" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
              <Icon name="nav" size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>
                {route ? `${fmtWalkTime(route.duration)} walk` : "Finding route…"}
              </div>
              <div className="dim" style={{ fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {route
                  ? `${fmtDist(route.distance)}${route.straight ? " · direct" : ""} to ${place.name}`
                  : userLocation
                    ? "Drawing your route"
                    : "Turn on location to route from here"}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-block" style={{ height: 50, marginTop: 16 }} onClick={openInMaps}>
            <Icon name="nav" size={18} /> Open in Maps
          </button>
        </div>
      </div>
    </div>
  );
}
