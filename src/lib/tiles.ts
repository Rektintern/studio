// Free CARTO Voyager raster tiles (OpenStreetMap-based, no API key).
// Dark mode reuses these light tiles and inverts them in CSS (`.dark .leaflet-tile`)
// so the street labels stay crisp — far more legible than the muddy gray labels
// baked into dedicated dark tilesets.
export const TILE_LIGHT = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

export const tileUrl = (_dark = false) => TILE_LIGHT;
