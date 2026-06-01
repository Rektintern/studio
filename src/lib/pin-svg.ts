// Raw inline-SVG strings for Leaflet divIcons (React can't render inside Leaflet html).

const PIN_SVG: Record<string, string> = {
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M2 3h2.2l2 12.5a1.5 1.5 0 0 0 1.5 1.2h9.4a1.5 1.5 0 0 0 1.5-1.2L20 7H5.2"/>',
  pill: '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(45 12 12)"/><path d="M8.5 8.5 15.5 15.5"/>',
  cup: '<path d="M5 8h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8Z"/><path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16"/>',
  wrench: '<path d="M14.5 6.5a3.8 3.8 0 0 1-4.9 4.9L5 16l3 3 4.6-4.6a3.8 3.8 0 0 0 4.9-4.9l-2.2 2.2-2.3-.6-.6-2.3 2.1-2.1Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/>',
  dumbbell: '<path d="M6.5 6.5 17.5 17.5M3 7l2-2 3 3-2 2-3-3ZM16 18l2-2 3 3-2 2-3-3ZM5 9l2 2M17 13l2 2"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
};

export function pinSvg(name: string, size = 15): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${PIN_SVG[name] || PIN_SVG.pin}</svg>`;
}
