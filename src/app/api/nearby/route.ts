// Server-side "nearby places" lookup.
//
// Default source is the free OpenStreetMap Overpass API (proxied here so the
// browser never gets CORS-blocked 503s from the public mirrors). OSM coverage
// is rich in mapped hubs but thin in many residential areas — so when a
// GOOGLE_PLACES_API_KEY is configured AND OSM comes back thin, we top up the
// results with Google Places (New). That keeps dense areas free (OSM only) and
// spends Google calls only where they're actually needed. Without a key, this
// behaves exactly as before (OSM only). The key is read server-side only.

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
// Below this many OSM hits we consider the area "thin" and top up with Google.
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

  let osm: Place[] = [];
  let osmFailed = false;
  try {
    osm = await fetchOSM(cat, lat, lon, radius);
  } catch {
    osmFailed = true;
  }

  // Top up with Google when OSM is thin or down — but only if a key is set.
  let places = osm;
  const hasKey = !!process.env.GOOGLE_PLACES_API_KEY;
  if (hasKey && osm.length < THIN_RESULTS) {
    try {
      places = mergeDedupe(osm, await fetchGoogle(cat, lat, lon, radius));
    } catch {
      // Google hiccup — keep whatever OSM gave us.
    }
  }

  // Only error out when we have genuinely nothing AND OSM failed AND no key saved us.
  if (places.length === 0 && osmFailed && !hasKey) {
    return NextResponse.json({ error: "all upstream sources unavailable" }, { status: 502 });
  }

  places = places.sort((a, b) => a.dist - b.dist).slice(0, 24);

  return NextResponse.json(
    { places },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }
  );
}
