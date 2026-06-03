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
  const [failed, setFailed] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const last = useRef<{ lat: number; lon: number; key: string } | null>(null);

  const catKey = Array.from(new Set(cats)).sort().join(",");
  const retry = () => {
    last.current = null;
    setRetryTick((t) => t + 1);
  };

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
    setFailed(false);
    (async () => {
      // Fetch one category at a time — Overpass rate-limits concurrent requests —
      // updating the UI progressively as each category resolves.
      let anyError = false;
      for (const c of Array.from(new Set(cats))) {
        try {
          const places = await fetchNearby(c, lat, lon);
          if (cancelled) return;
          setPlacesByCat((prev) => ({ ...prev, [c]: places }));
        } catch {
          anyError = true; // OSM unreachable for this category — keep any prior data
        }
      }
      if (cancelled) return;
      // Only mark the position done when nothing failed, so the next trigger
      // (or a manual retry) re-queries the categories that errored.
      if (!anyError) last.current = { lat, lon, key: catKey };
      setFailed(anyError);
      setScanning(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.latitude, userLocation?.longitude, catKey, retryTick]);

  return { placesByCat, scanning, failed, retry };
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

/**
 * The moment a reminder comes into range, fires:
 *  - an in-app banner (via onInAppPing) — pure UI, always works while the app is open
 *  - a system notification — needs permission (and runs in the background on native)
 */
export function useProximityPings(
  decorated: DecoratedReminder[],
  settings: Settings,
  onInAppPing?: (r: DecoratedReminder) => void,
  resetSignal?: number
) {
  const fired = useRef<Record<string, number>>({});
  const pingRef = useRef(onInAppPing);
  pingRef.current = onInAppPing;
  const COOLDOWN = 30 * 60 * 1000;

  // A deliberate location change (e.g. dropping a manual pin) clears the
  // edge-trigger so in-range reminders re-notify at the new spot.
  useEffect(() => {
    fired.current = {};
  }, [resetSignal]);

  useEffect(() => {
    const now = Date.now();
    const quiet = settings.quiet && inQuietHours();
    const canNotify =
      typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted";

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
      if (quiet) return; // quiet hours — consume the transition without alerting

      // In-app banner — pure UI, no permission needed.
      pingRef.current?.(r);

      // System notification — needs permission; the real background pings come with native.
      if (canNotify) {
        void showPing("NEAR REMIND", {
          body: `You're near ${r.nearest.name} — ${r.title}`,
          tag: r.id,
          silent: !settings.sound,
        });
        if (settings.haptic && typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.(120);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decorated, settings]);
}
