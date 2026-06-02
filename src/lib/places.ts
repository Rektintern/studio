// Free nearby-place lookup via OpenStreetMap's Overpass API.
// No API key, no signup. Overpass mirrors are flaky, so we try several in a
// random order with a per-request timeout and fall through on any failure.

import { calculateDistance } from "./geo";
import { CATEGORIES } from "./categories";
import type { CategoryKey, Place } from "./types";

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const TTL = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT = 9000; // ms — abandon a slow/hung mirror quickly
const cache = new Map<string, { t: number; places: Place[] }>();

function buildQuery(cat: CategoryKey, lat: number, lon: number, radius: number): string {
  const parts = CATEGORIES[cat].osm
    .map(
      (sel) =>
        `node[${sel}](around:${radius},${lat},${lon});way[${sel}](around:${radius},${lat},${lon});`
    )
    .join("");
  return `[out:json][timeout:15];(${parts});out center 40;`;
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function postWithTimeout(url: string, body: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function parseElements(elements: unknown[], cat: CategoryKey, lat: number, lon: number): Place[] {
  return (elements || [])
    .map((raw): Place | null => {
      const el = raw as {
        type?: string; id?: number; lat?: number; lon?: number;
        center?: { lat: number; lon: number }; tags?: Record<string, string>;
      };
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
    .filter((p): p is Place => p !== null)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 24);
}

/**
 * Returns nearby places matching a category, nearest-first.
 * Results are cached per category + coarse location. Throws if every mirror
 * fails, so callers can tell "no matches" apart from "couldn't reach OSM".
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

  const body = "data=" + encodeURIComponent(buildQuery(cat, lat, lon, radius));

  let lastError: unknown = null;
  for (const url of shuffled(ENDPOINTS)) {
    try {
      const res = await postWithTimeout(url, body);
      if (!res.ok) {
        lastError = new Error(`${res.status}`);
        continue;
      }
      const data = await res.json();
      const places = parseElements(data.elements, cat, lat, lon);
      cache.set(key, { t: Date.now(), places });
      return places;
    } catch (err) {
      lastError = err; // timeout / network — try the next mirror
    }
  }
  throw lastError ?? new Error("All Overpass mirrors failed");
}
