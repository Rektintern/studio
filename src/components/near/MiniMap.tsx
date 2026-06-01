"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { CATEGORIES } from "@/lib/categories";
import { pinSvg } from "@/lib/pin-svg";
import type { CategoryKey } from "@/lib/types";

const VOYAGER = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

interface MiniMapProps {
  center: [number, number];
  radius?: number;
  height?: number;
  zoom?: number;
  cat?: CategoryKey;
  live?: boolean;
}

/** A compact, non-interactive map preview: a point + a coverage radius. */
export function MiniMap({ center, radius = 400, height = 200, zoom = 15, cat = "grocery", live = true }: MiniMapProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const Lref = useRef<any>(null);

  // init once
  useEffect(() => {
    let cancelled = false;
    if (!elRef.current || mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;
      Lref.current = L;

      const accent =
        getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "#1b8f5a";

      const map = L.map(elRef.current, {
        zoomControl: false, attributionControl: false, dragging: false,
        scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false,
        boxZoom: false, keyboard: false,
      }).setView(center, zoom);
      mapRef.current = map;

      L.tileLayer(VOYAGER, { maxZoom: 20, subdomains: "abcd" }).addTo(map);

      circleRef.current = L.circle(center, {
        radius, color: accent, weight: 1.5, opacity: 0.6, fillColor: accent, fillOpacity: 0.12,
      }).addTo(map);

      const icon = L.divIcon({
        className: "mini-pin-wrap", iconSize: [34, 34], iconAnchor: [17, 34],
        html: `<span class="mappin${live ? " live" : ""}">${pinSvg(CATEGORIES[cat]?.icon || "pin")}</span>`,
      });
      markerRef.current = L.marker(center, { icon, interactive: false }).addTo(map);

      setTimeout(() => {
        if (cancelled || !mapRef.current) return;
        map.invalidateSize();
        if (circleRef.current) map.fitBounds(circleRef.current.getBounds(), { padding: [26, 26], animate: false });
      }, 60);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        circleRef.current = null;
        markerRef.current = null;
        Lref.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // react to radius / center changes (e.g. add-flow slider)
  useEffect(() => {
    const map = mapRef.current;
    const circle = circleRef.current;
    if (!map || !circle) return;
    circle.setLatLng(center);
    circle.setRadius(radius);
    if (markerRef.current) markerRef.current.setLatLng(center);
    map.fitBounds(circle.getBounds(), { padding: [26, 26], animate: false });
  }, [radius, center]);

  // react to live / category changes (pin colour + icon)
  useEffect(() => {
    const L = Lref.current;
    const marker = markerRef.current;
    if (!L || !marker) return;
    marker.setIcon(
      L.divIcon({
        className: "mini-pin-wrap", iconSize: [34, 34], iconAnchor: [17, 34],
        html: `<span class="mappin${live ? " live" : ""}">${pinSvg(CATEGORIES[cat]?.icon || "pin")}</span>`,
      })
    );
  }, [live, cat]);

  return <div ref={elRef} className="minimap" style={{ height }} />;
}
