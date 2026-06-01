import { calculateDistance } from "./geo";
import type { CategoryKey, DecoratedReminder, Location, Place, Reminder } from "./types";

type PlacesByCat = Partial<Record<CategoryKey, Place[]>>;

/** Decorates reminders with live distance/match data from the user's current position. */
export function decorateReminders(
  reminders: Reminder[],
  userLocation: Location | null,
  placesByCat: PlacesByCat
): DecoratedReminder[] {
  return reminders.map((r) => {
    let places = placesByCat[r.cat] || [];
    // Recompute distances from the *current* position for accuracy between OSM refreshes.
    if (userLocation && places.length) {
      places = places
        .map((p) => ({
          ...p,
          dist: calculateDistance(userLocation.latitude, userLocation.longitude, p.lat, p.lon),
        }))
        .sort((a, b) => a.dist - b.dist);
    }
    const nearest = places[0] || null;
    const dist = nearest ? nearest.dist : null;
    const inRange = r.enabled && dist != null && dist <= r.radius;
    return {
      ...r,
      nearest,
      dist,
      places: places.length,
      matches: places.slice(0, 3),
      inRange,
    };
  });
}
