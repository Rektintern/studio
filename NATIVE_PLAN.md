# NEAR REMIND — Maps, Location & "Ping Me When I'm Close"

This doc captures **how the proximity engine works today** (free, in-browser) and **the plan to make it ping you when the app is closed** (the true "catch it as you walk past" behaviour). Nothing here is required for the current web app to work — it already runs — this is the deliberate **next phase**.

---

## TL;DR

| Capability | Status | Cost |
|---|---|---|
| Live interactive map (you + pins) | ✅ Built — Leaflet + OpenStreetMap/CARTO tiles | **Free**, no API key |
| Share location | ✅ Built — browser Geolocation API | **Free** |
| Find nearby groceries / pharmacies / etc. | ✅ Built — OpenStreetMap **Overpass API** | **Free**, no key |
| Ping while app is **open** | ✅ Built — Geolocation watch + Web Notifications | **Free** |
| Ping while app is **closed** (phone in pocket) | ⛔ Not possible on the web — needs a native shell | **Free tech**, only app-store fees to publish |

**Bottom line:** maps + location + nearby-search are all free and already wired. The "app-open" experience works in any browser now. The "app-closed" experience needs a thin **Capacitor** wrapper around this exact codebase.

---

## How it works today (web, free)

1. **Map** — `Leaflet` renders [CARTO Voyager](https://github.com/CartoDB/basemap-styles) raster tiles built on OpenStreetMap. No key, no signup. (`src/components/near/MapScreen.tsx`, `MiniMap.tsx`.)
2. **Location** — `navigator.geolocation.watchPosition()` streams the user's position. (`src/components/location-provider.tsx`.) Requires HTTPS + the user's permission.
3. **Nearby places** — for each active reminder's category we query the **Overpass API** (e.g. `node["shop"="supermarket"](around:3000,lat,lon)`), cache per category + coarse location, and refresh only when the user moves >150 m. (`src/lib/places.ts`, `src/lib/categories.ts`.)
4. **Proximity + ping** — we compute the distance from the user to the nearest matching place; when it's within the reminder's radius we fire a `Notification`. "Arriving" fires once on entry; "Anytime nearby" re-fires after a cooldown. Quiet hours / sound / haptics are respected. (`src/hooks/use-near-remind.ts`, `src/lib/decorate.ts`.)

### The hard limit
A browser tab that's **backgrounded or closed stops getting location updates.** The old web **Geofencing API was removed** from browsers, and **Periodic Background Sync** has a ~12-hour minimum — useless for "you just walked past a shop." So a pure website can only ping while it's **open in the foreground.** Good for demos and "check before I leave" use; not the pocket experience.

---

## Next phase: true background pings

### Recommended path — **Capacitor** (reuse this codebase)
[Capacitor](https://capacitorjs.com/) wraps this exact Next.js/React app as a native iOS/Android app with ~no rewrite. Add a background-geolocation plugin and the OS does the geofencing — even when the app is closed.

```bash
npm i @capacitor/core @capacitor/cli
npx cap init "NEAR REMIND" app.nearremind
# static export of the Next app, then:
npx cap add ios && npx cap add android
```

Geofencing plugin options:
- **`@capacitor/geolocation`** — foreground/background position (good for "anytime nearby").
- **`@transistorsoft/capacitor-background-geolocation`** — best-in-class background tracking + geofences; free in debug, paid licence for production release.
- Community **`@capacitor-community/background-geolocation`** — free/OSS alternative.

### Alternative — **Expo / React Native**
`expo-location`'s [`startGeofencingAsync`](https://docs.expo.dev/versions/latest/sdk/location/#locationstartgeofencingasynctaskname-regions) gives a clean, free geofencing API backed by native region monitoring. Downside: the UI would need porting from this web codebase.

### Native geofencing itself is free
It's an OS feature (iOS Region Monitoring / Android `GeofencingClient`) — **no cloud bill**. The only costs to *publish*: Apple Developer **$99/yr** + Google Play **$25 once**.

### The "any grocery store" challenge (important design note)
Phones cap monitored regions (**iOS ~20**, **Android ~100**). You can't pre-register a geofence for every shop on Earth. The pattern:

1. Track **coarse** background location (significant-location-change on iOS is battery-cheap).
2. When the user enters a new area, query **Overpass** for the nearest places matching their active reminder categories.
3. Register the **closest ~20** as native geofences; replace them as the user moves.
4. On a geofence-enter event, fire the local notification.

This keeps battery low and stays under the region cap while still feeling like "it just knew."

### Notifications
For proximity pings you **don't need a push server** (FCM/APNs) — the trigger is the device's own location, so a **local notification** is enough on both web (foreground) and native (background). FCM/APNs only matter if a *server* needs to push something.

---

## Map upgrade options (all still free)
- **Current:** Leaflet + CARTO raster tiles — simplest, matches the design.
- **Upgrade:** [MapLibre GL](https://maplibre.org/) + [OpenFreeMap](https://openfreemap.org/) — vector tiles, smoother zoom, 3D, still no API key.
- **Heavier place data:** Foursquare Places (free tier) or Google Places (paid) if OSM coverage is thin in your area.

---

## File map (proximity engine)
- `src/lib/categories.ts` — category → OSM tag selectors.
- `src/lib/places.ts` — free Overpass nearby-by-category lookup (with caching + mirror fallback).
- `src/lib/decorate.ts` — turns reminders + places into live distance / in-range data.
- `src/hooks/use-near-remind.ts` — `useNearbyPlaces` (fetch on move) + `useProximityPings` (fire notifications).
- `src/components/location-provider.tsx` — GPS watch, reverse-geocode, permission. Supports a `localStorage` `nr_devloc` override as a "fake GPS" for testing.
