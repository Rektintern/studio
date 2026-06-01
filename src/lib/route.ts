import { calculateDistance } from "./geo";
import type { Location } from "./types";

export interface RouteResult {
  coords: [number, number][]; // [lat, lon] points for the polyline
  distance: number;           // meters
  duration: number;           // seconds (walking)
  straight: boolean;          // true if we fell back to a straight line
}

const WALK_SPEED = 1.35; // m/s ≈ 4.9 km/h

function crow(from: Location, to: { lat: number; lon: number }) {
  return calculateDistance(from.latitude, from.longitude, to.lat, to.lon);
}

/**
 * Free walking route via OSRM (router.project-osrm.org, no API key, CORS-enabled).
 * The public demo runs the driving profile; over the short distances this app deals
 * with the path is fine, and we derive the walk time from the route distance.
 * Falls back to a straight line if routing is unavailable.
 */
export async function fetchWalkingRoute(
  from: Location,
  to: { lat: number; lon: number }
): Promise<RouteResult> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.lon},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const route = data?.routes?.[0];
      const line = route?.geometry?.coordinates;
      if (Array.isArray(line) && line.length > 1) {
        const coords = line.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
        const distance = typeof route.distance === "number" ? route.distance : crow(from, to);
        return { coords, distance, duration: distance / WALK_SPEED, straight: false };
      }
    }
  } catch {
    // fall through to a straight line
  }
  const distance = crow(from, to);
  return {
    coords: [[from.latitude, from.longitude], [to.lat, to.lon]],
    distance,
    duration: distance / WALK_SPEED,
    straight: true,
  };
}

export function fmtWalkTime(seconds: number): string {
  const min = Math.max(1, Math.round(seconds / 60));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
