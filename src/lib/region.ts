// Where NEAR REMIND is live.
//
// Decision (Foxy, 2026-06): launch in the UK, US and Australia only. The free
// OSM/Overpass place data we rely on is richly tagged in these countries but too
// sparse across much of the world to ship a useful "what's nearby" map — so we
// gate the app by the user's detected country rather than show an empty map.
export const SUPPORTED_COUNTRIES = new Set(["GB", "US", "AU"]);

/** Human-readable list of the regions we serve, for UI copy. */
export const SUPPORTED_REGIONS_LABEL = "the UK, US, and Australia";

/**
 * Map center shown as a placeholder until a real location is known (GPS fix or
 * manual pin). A populated spot in a supported country — New York — so the
 * default view is never somewhere we don't serve. (Was the centroid of India,
 * a leftover from early dev.)
 */
export const DEFAULT_CENTER: [number, number] = [40.7128, -74.006];

/** True if an ISO 3166-1 alpha-2 country code is one we currently serve. */
export function isSupportedCountry(code: string | null | undefined): boolean {
  return !!code && SUPPORTED_COUNTRIES.has(code.toUpperCase());
}
