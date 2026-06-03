// Nearby places for a reminder category.
//
// The browser no longer talks to Overpass directly — it calls our own
// /api/nearby route (which proxies Overpass server-side). This avoids the
// browser getting CORS-blocked 503s from the free Overpass mirrors on networks
// they rate-limit. We keep a short client cache so panning doesn't re-hit it.

import type { CategoryKey, Place } from "./types";

const TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { t: number; places: Place[] }>();

/** Returns nearby places matching a category, nearest-first. Throws if the lookup fails. */
export async function fetchNearby(
  cat: CategoryKey,
  lat: number,
  lon: number,
  radius = 3000
): Promise<Place[]> {
  const qLat = lat.toFixed(3);
  const qLon = lon.toFixed(3);
  const key = `${cat}:${qLat},${qLon}:${radius}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return hit.places;

  const res = await fetch(`/api/nearby?cat=${cat}&lat=${qLat}&lon=${qLon}&radius=${radius}`);
  if (!res.ok) throw new Error(`nearby ${res.status}`);
  const data = await res.json();
  const places: Place[] = Array.isArray(data.places) ? data.places : [];
  cache.set(key, { t: Date.now(), places });
  return places;
}
