// Free nearby-place lookup via OpenStreetMap's Overpass API.
// No API key, no signup — just be polite with caching + rate limits.

import { calculateDistance } from "./geo";
import { CATEGORIES } from "./categories";
import type { CategoryKey, Place } from "./types";

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { t: number; places: Place[] }>();

function buildQuery(cat: CategoryKey, lat: number, lon: number, radius: number): string {
  const parts = CATEGORIES[cat].osm
    .map(
      (sel) =>
        `node[${sel}](around:${radius},${lat},${lon});way[${sel}](around:${radius},${lat},${lon});`
    )
    .join("");
  return `[out:json][timeout:20];(${parts});out center 40;`;
}

/**
 * Returns nearby places matching a category, nearest-first.
 * Results are cached per category + coarse location; failures resolve to [].
 */
export async function fetchNearby(
  cat: CategoryKey,
  lat: number,
  lon: number,
  radius = 3000
): Promise<Place[]> {
  const key = `${cat}:${lat.toFixed(3)},${lon.toFixed(3)}:${radius}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return hit.places;

  const query = buildQuery(cat, lat, lon, radius);

  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const places: Place[] = (data.elements || [])
        .map((el: any): Place | null => {
          const plat = el.lat ?? el.center?.lat;
          const plon = el.lon ?? el.center?.lon;
          if (plat == null || plon == null) return null;
          return {
            id: `${el.type}/${el.id}`,
            name: el.tags?.name || el.tags?.brand || CATEGORIES[cat].label,
            lat: plat,
            lon: plon,
            dist: calculateDistance(lat, lon, plat, plon),
          };
        })
        .filter((p: Place | null): p is Place => p !== null)
        .sort((a: Place, b: Place) => a.dist - b.dist)
        .slice(0, 24);

      cache.set(key, { t: Date.now(), places });
      return places;
    } catch {
      // try the next mirror
    }
  }
  return [];
}
