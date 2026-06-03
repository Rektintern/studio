// Server-side proxy for the OpenStreetMap Overpass "nearby places" lookup.
//
// We do NOT call Overpass from the browser anymore: many networks/regions get
// 503'd by the free mirrors, and those 503 responses carry no CORS headers, so
// the browser reports "Failed to fetch" and the app sees nothing. Running the
// request here (from the server's datacenter IP) sidesteps that, lets us set a
// proper User-Agent, race the mirrors for speed, and edge-cache the result.

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cat = searchParams.get("cat") as CategoryKey | null;
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const radius = Math.min(5000, Math.max(200, Number(searchParams.get("radius")) || 3000));

  if (!cat || !CATEGORY_KEYS.includes(cat) || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  }

  const parts = CATEGORIES[cat].osm
    .map((s) => `node[${s}](around:${radius},${lat},${lon});way[${s}](around:${radius},${lat},${lon});`)
    .join("");
  const body = "data=" + encodeURIComponent(`[out:json][timeout:20];(${parts});out center 40;`);

  // Race every mirror; take the first that answers (a hung/503 mirror no longer
  // blocks the others). Promise.any rejects only if ALL fail.
  let data: { elements?: unknown[] };
  try {
    data = (await Promise.any(ENDPOINTS.map((url) => postOverpass(url, body)))) as { elements?: unknown[] };
  } catch {
    return NextResponse.json({ error: "all upstream mirrors unavailable" }, { status: 502 });
  }

  const places: Place[] = (data.elements || [])
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
    .filter((p): p is Place => p !== null)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 24);

  return NextResponse.json(
    { places },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }
  );
}
