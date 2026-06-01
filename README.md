# NEAR REMIND

Reminders that know where you are. Save an errand once ("buy dark chocolate", "refill
prescription") tied to a **type of place** — and the app pings you the moment you're near a
place that matches, like catching it as you walk past.

Built with **Next.js 15 + React 19 + Tailwind**, a live **Leaflet + OpenStreetMap** map, and
**OpenStreetMap Overpass** for finding nearby places — **all free, no API keys**.

## Run it

```bash
npm install
npm run dev          # http://localhost:9002
```

Allow location when prompted (needs HTTPS or localhost). The app finds real shops around you
and shows distances + in-range pings live.

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
**Reminder detail** view, and **Settings**.

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
