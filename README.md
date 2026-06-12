# NEAR REMIND

Reminders that know where you are. Save an errand once ("buy dark chocolate", "refill
prescription") tied to a **type of place** — and the app pings you the moment you're near a
place that matches, like catching it as you walk past.

Built with **Next.js 15 + React 19 + Tailwind**, a live **Leaflet + OpenStreetMap** map, and
**Google Places** for finding nearby places, with **OpenStreetMap Overpass** as a free,
key-free fallback.

## Run it

```bash
npm install
npm run dev          # http://localhost:9002
```

Allow location when prompted (needs HTTPS or localhost). The app finds real shops around you
and shows distances + in-range pings live.

### Better place coverage (Google Places key)
Nearby search uses **Google Places (New)** as its primary source — it returns many more
places than OSM, especially in residential areas. It's optional: with no key the app falls
back to free OpenStreetMap (works, but coverage is thinner).

To enable it, create a `.env.local` with a [Google Places API](https://developers.google.com/maps/documentation/places/web-service/op-overview)
key (enable the **Places API (New)** on your Google Cloud project):

```bash
GOOGLE_PLACES_API_KEY=your-key-here
```

The key is read **server-side only** (never shipped to the browser) by `/api/nearby`. For
production on Firebase App Hosting, store it as a [secret](https://firebase.google.com/docs/app-hosting/configure#secret-parameters)
rather than committing it. Restrict the key to the Places API in Google Cloud to cap spend.

### Testing without moving (fake GPS)
Headless browsers / desktops have no GPS. Drop a pin manually from the console:

```js
localStorage.setItem('nr_devloc', JSON.stringify({ latitude: 51.5118, longitude: -0.1226, address: 'London, GB' }));
localStorage.setItem('nr_onboarded', '1');
location.reload();
```

Remove the `nr_devloc` key to go back to real GPS. (Normal users never set it.)

## How it works

| Piece | Tech | Cost |
|---|---|---|
| Map (you + pins) | Leaflet + OpenStreetMap/CARTO tiles | Free |
| Location | Browser Geolocation API | Free |
| Nearby places by category | OpenStreetMap Overpass API | Free |
| Pings while app is open | Web Notifications | Free |

> **Pinging while the app is _closed_** (the full Pokémon-style background experience) isn't
> possible on the web — it needs a thin native wrapper. The plan for that is in
> [`NATIVE_PLAN.md`](./NATIVE_PLAN.md).

## Screens

Single-page app shell (`src/app/page.tsx`) with: **Onboarding**, a full-bleed interactive
**Map** + peeking "in range now" sheet, a **Saved** feed, a 3-step **Add reminder** sheet, a
**Reminder detail** view, and **Settings** (editable name + **System / Light / Dark** theme).

Mobile-first (designed for 360–430px phones, safe-area aware). Dark mode swaps the basemap to
CARTO Dark Matter tiles and follows the OS by default.

## Project layout

```
src/
  app/page.tsx                 # app shell (state machine: onboarded/tab/detail/adding/toast)
  components/near/             # all UI: MapScreen, MiniMap, Feed, ReminderDetail, AddFlow, Settings, Onboarding, TabBar, Icon
  components/location-provider # GPS watch + permission + reverse geocode
  hooks/use-near-remind.ts     # useNearbyPlaces (fetch on move) + useProximityPings
  lib/places.ts                # free Overpass nearby-by-category lookup
  lib/decorate.ts              # reminders + places -> live distance / in-range
  lib/categories.ts            # category metadata + OSM tag selectors
  lib/store.ts                 # localStorage persistence + seed
```

Design tokens + every component style live in `src/app/globals.css` (ported from the
NEAR REMIND design system — clean green, Manrope + Space Grotesk + JetBrains Mono).
