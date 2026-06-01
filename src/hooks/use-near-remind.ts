"use client";

import { useEffect, useRef, useState } from "react";
import { fetchNearby } from "@/lib/places";
import { calculateDistance } from "@/lib/geo";
import type { CategoryKey, DecoratedReminder, Location, Place, Settings } from "@/lib/types";

type PlacesByCat = Partial<Record<CategoryKey, Place[]>>;

const MOVE_THRESHOLD = 150; // meters before we re-query OSM

/** Fetches nearby OSM places for the given categories, refreshing as the user moves. */
export function useNearbyPlaces(userLocation: Location | null, cats: CategoryKey[]) {
  const [placesByCat, setPlacesByCat] = useState<PlacesByCat>({});
  const [scanning, setScanning] = useState(false);
  const last = useRef<{ lat: number; lon: number; key: string } | null>(null);

  const catKey = Array.from(new Set(cats)).sort().join(",");

  useEffect(() => {
    if (!userLocation || cats.length === 0) return;
    const { latitude: lat, longitude: lon } = userLocation;

    const moved =
      !last.current ||
      last.current.key !== catKey ||
      calculateDistance(lat, lon, last.current.lat, last.current.lon) > MOVE_THRESHOLD;
    if (!moved) return;

    let cancelled = false;
    setScanning(true);
    (async () => {
      // Fetch one category at a time — Overpass rate-limits concurrent requests —
      // updating the UI progressively as each category resolves.
      for (const c of Array.from(new Set(cats))) {
        const places = await fetchNearby(c, lat, lon);
        if (cancelled) return;
        setPlacesByCat((prev) => ({ ...prev, [c]: places }));
      }
      // Record the fetched position only after success, so a cancelled
      // (e.g. Strict Mode) run doesn't block the real fetch from retrying.
      last.current = { lat, lon, key: catKey };
      setScanning(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.latitude, userLocation?.longitude, catKey]);

  return { placesByCat, scanning };
}

function inQuietHours(): boolean {
  const h = new Date().getHours();
  return h >= 22 || h < 7;
}

/** Show a notification via the service worker (required on mobile), with a desktop fallback. */
async function showPing(title: string, options: NotificationOptions) {
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg) {
        await reg.showNotification(title, options);
        return;
      }
    }
  } catch {
    // fall through to the legacy constructor
  }
  try {
    new Notification(title, options);
  } catch {
    // notifications unavailable in this context
  }
}

/** Fires a local notification the moment a reminder comes into range. */
export function useProximityPings(decorated: DecoratedReminder[], settings: Settings) {
  const fired = useRef<Record<string, number>>({});
  const COOLDOWN = 30 * 60 * 1000;

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (settings.quiet && inQuietHours()) return;

    const now = Date.now();
    decorated.forEach((r) => {
      if (!r.inRange || !r.nearest) {
        // reset the edge trigger once we leave range so re-entry can fire again
        if (r.trigger === "arriving") delete fired.current[r.id];
        return;
      }
      const last = fired.current[r.id];
      const shouldFire =
        r.trigger === "arriving" ? last === undefined : last === undefined || now - last > COOLDOWN;
      if (!shouldFire) return;

      fired.current[r.id] = now;
      void showPing("NEAR REMIND", {
        body: `You're near ${r.nearest.name} — ${r.title}`,
        tag: r.id,
        silent: !settings.sound,
      });
      if (settings.haptic && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(120);
      }
    });
  }, [decorated, settings]);
}
