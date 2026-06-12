// Server-side "nearby places" lookup.
//
// Primary source is Google Places (New) when GOOGLE_PLACES_API_KEY is set — it
// returns far more places than OSM, especially in residential areas. The free
// OpenStreetMap Overpass API (proxied here so the browser never gets
// CORS-blocked 503s from the public mirrors) is the fallback: it tops up the
// results when Google comes back thin, and is the sole source when no key is
// configured (so the app still works key-free for contributors). The key is
// read server-side only.

import { NextResponse } from "next/server";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/categories";
import { calculateDistance } from "@/lib/geo";
import type { CategoryKey, Place } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const REQUEST_TIMEOUT = 11000;
// Below this many hits from the primary source we consider the area "thin" and
// fill the rest in from the fallback source.
const THIN_RESULTS = 10;

async function postOverpass(url: string, body: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // Overpass identifies/rate-limits by UA; a real one gets better treatment.
        "User-Agent": "NEAR-REMIND/1.0 (location reminder app; +https://github.com/Rektintern/studio)",
      },
      body,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** OpenStreetMap / Overpass lookup. Throws if every mirror fails. */
async function fetchOSM(cat: CategoryKey, lat: number, lon: number, radius: number): Promise<Place[]> {
  const parts = CATEGORIES[cat].osm
    .map((s) => `node[${s}](around:${radius},${lat},${lon});way[${s}](around:${radius},${lat},${lon});`)
    .join("");
  const body = "data=" + encodeURIComponent(`[out:json][timeout:20];(${parts});out center 40;`);
  // Race every mirror; take the first that answers (a hung/503 one no longer blocks).
  const data = (await Promise.any(ENDPOINTS.map((url) => postOverpass(url, body)))) as { elements?: unknown[] };
  return (data.elements || [])
    .map((raw) => {
      const el = raw as { type?: string; id?: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
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
    .filter((p): p is Place => p !== null);
}

/** Google Places (New) lookup. Returns [] if no key; throws on HTTP error. */
async function fetchGoogle(cat: CategoryKey, lat: number, lon: number, radius: number): Promise<Place[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return [];
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      // Field mask keeps us on the cheapest SKU — only what we render.
      "X-Goog-FieldMask": "places.id,places.displayName,places.location",
    },
    body: JSON.stringify({
      includedTypes: CATEGORIES[cat].google,
      maxResultCount: 20,
      locationRestriction: { circle: { center: { latitude: lat, longitude: lon }, radius } },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`google -> ${res.status}`);
  const data = (await res.json()) as { places?: { id?: string; displayName?: { text?: string }; location?: { latitude?: number; longitude?: number } }[] };
  return (data.places || [])
    .map((p) => {
      const plat = p.location?.latitude;
      const plon = p.location?.longitude;
      if (plat == null || plon == null) return null;
      return {
        id: `g/${p.id}`,
        name: p.displayName?.text || CATEGORIES[cat].label,
        lat: plat,
        lon: plon,
        dist: calculateDistance(lat, lon, plat, plon),
      };
    })
    .filter((p): p is Place => p !== null);
}

/** Merge two sources, dropping the same shop seen twice (same name within ~110m). */
function mergeDedupe(primary: Place[], extra: Place[]): Place[] {
  const seen = new Set(primary.map((p) => `${p.name.toLowerCase().trim()}@${p.lat.toFixed(3)},${p.lon.toFixed(3)}`));
  const out = [...primary];
  for (const p of extra) {
    const key = `${p.name.toLowerCase().trim()}@${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cat = searchParams.get("cat") as CategoryKey | null;
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const radius = Math.min(5000, Math.max(200, Number(searchParams.get("radius")) || 3000));

  if (!cat || !CATEGORY_KEYS.includes(cat) || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  }

  // Google Places (New) is the primary source when a key is configured; free
  // OSM fills gaps when Google is thin and is the sole source when no key is set.
  const hasKey = !!process.env.GOOGLE_PLACES_API_KEY;
  let places: Place[];

  if (hasKey) {
    let google: Place[] = [];
    let googleFailed = false;
    try {
      google = await fetchGoogle(cat, lat, lon, radius);
    } catch {
      googleFailed = true;
    }
    // Top up with free OSM only when Google is thin or down — keeps the happy
    // path to a single fast call and fills gaps when Google has little.
    if (google.length < THIN_RESULTS) {
      try {
        places = mergeDedupe(google, await fetchOSM(cat, lat, lon, radius));
      } catch {
        places = google; // OSM hiccup — keep whatever Google gave us.
      }
    } else {
      places = google;
    }
    // Genuinely nothing and Google itself errored → both sources are down.
    if (places.length === 0 && googleFailed) {
      return NextResponse.json({ error: "all upstream sources unavailable" }, { status: 502 });
    }
  } else {
    // No key — free OSM only (original behavior).
    try {
      places = await fetchOSM(cat, lat, lon, radius);
    } catch {
      return NextResponse.json({ error: "all upstream sources unavailable" }, { status: 502 });
    }
  }

  places = places.sort((a, b) => a.dist - b.dist).slice(0, 24);

  return NextResponse.json(
    { places },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }
  );
}
