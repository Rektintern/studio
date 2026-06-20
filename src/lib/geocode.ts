import { isSupportedCountry } from "./region";

export interface GeoResult {
  label: string;
  lat: number;
  lon: number;
}

/**
 * Forward geocoding / place search via Photon (Komoot) — free, no API key,
 * CORS-enabled, built for search-as-you-type.
 *
 * Results are restricted to the countries we currently serve (UK / US / AUS) —
 * see region.ts. We over-fetch then filter so a full page of supported results
 * still comes back.
 */
export async function searchPlaces(query: string): Promise<GeoResult[]> {
  if (query.trim().length < 2) return [];
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=15`);
    if (!res.ok) return [];
    const data = await res.json();
    const seen = new Set<string>();
    return (data.features || [])
      .filter((f: any) => isSupportedCountry(f.properties?.countrycode))
      .map((f: any): GeoResult | null => {
        const c = f.geometry?.coordinates;
        const p = f.properties || {};
        if (!Array.isArray(c)) return null;
        const street = p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street;
        const main = p.name || street || p.city || "Place";
        const ctx = Array.from(new Set([p.city, p.state, p.country])).filter(Boolean).join(", ");
        return { label: ctx && ctx !== main ? `${main} · ${ctx}` : main, lat: c[1], lon: c[0] };
      })
      .filter((r: GeoResult | null): r is GeoResult => {
        if (!r || seen.has(r.label)) return false;
        seen.add(r.label);
        return true;
      })
      .slice(0, 6);
  } catch {
    return [];
  }
}

export interface ReverseGeo {
  label: string;
  countryCode: string | null;
  countryName: string | null;
}

const reverseCache = new Map<string, ReverseGeo>();

/**
 * Reverse geocoding via BigDataCloud — free, no API key, CORS-enabled. Returns a
 * short display label plus the ISO country code/name (used to decide whether the
 * user is in a region we serve). Cached per ~110 m cell so the label lookup and
 * the region-gate lookup share a single network call.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeo> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = reverseCache.get(key);
  if (cached) return cached;
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    const data = await res.json();
    const parts = Array.from(
      new Set([data.locality, data.city, data.principalSubdivision, data.countryCode])
    ).filter(Boolean);
    const out: ReverseGeo = {
      label: parts.slice(0, 2).join(", ") || "Near you",
      countryCode: data.countryCode || null,
      countryName: data.countryName || null,
    };
    reverseCache.set(key, out);
    return out;
  } catch {
    return { label: "Near you", countryCode: null, countryName: null };
  }
}
