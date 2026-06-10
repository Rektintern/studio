"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { tileUrl } from "@/lib/tiles";
import type { Location } from "@/lib/types";

const FALLBACK: [number, number] = [20.5937, 78.9629]; // India centroid until GPS arrives

/**
 * Glass theme backdrop: the live map — dimmed, non-interactive, following the
 * user's position — sits behind every screen so the frosted panes always have
 * real content to refract. (The `.glass .leaflet-tile` inversion makes it dark.)
 */
export function GlassBackdrop({ location }: { location: Location | null }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    if (!elRef.current || mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;
      const map = L.map(elRef.current, {
        zoomControl: false, attributionControl: false, dragging: false,
        scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false,
        boxZoom: false, keyboard: false, fadeAnimation: false,
      }).setView(
        location ? [location.latitude, location.longitude] : FALLBACK,
        location ? 15 : 5
      );
      mapRef.current = map;
      L.tileLayer(tileUrl(false), { maxZoom: 20, subdomains: "abcd" }).addTo(map);
      setTimeout(() => mapRef.current && map.invalidateSize(), 60);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // follow the user's position (no animation — it's scenery, not UI)
  useEffect(() => {
    if (mapRef.current && location) {
      mapRef.current.setView([location.latitude, location.longitude], 15, { animate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.latitude, location?.longitude]);

  return (
    <div className="glass-backdrop" aria-hidden="true">
      <div ref={elRef} className="glass-backdrop-map" />
    </div>
  );
}
