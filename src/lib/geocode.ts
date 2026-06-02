export interface GeoResult {
  label: string;
  lat: number;
  lon: number;
}

/**
 * Forward geocoding / place search via Photon (Komoot) — free, no API key,
 * CORS-enabled, built for search-as-you-type.
 */
export async function searchPlaces(query: string): Promise<GeoResult[]> {
  if (query.trim().length < 2) return [];
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`);
    if (!res.ok) return [];
    const data = await res.json();
    const seen = new Set<string>();
    return (data.features || [])
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
