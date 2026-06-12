import type { CSSProperties, ReactNode } from "react";

export type IconName =
  | "feed" | "map" | "plus" | "settings" | "search" | "filter" | "bell"
  | "pin" | "target" | "chevron" | "back" | "close" | "check" | "clock"
  | "edit" | "trash" | "nav" | "layers" | "recenter" | "cart" | "pill"
  | "cup" | "wrench" | "mail" | "card" | "dumbbell" | "book" | "bolt"
  | "location" | "moon" | "shield" | "info" | "sparkle" | "waypoints";

interface IconProps {
  name: IconName | string;
  size?: number;
  stroke?: number;
  style?: CSSProperties;
  className?: string;
}

const PATHS: Record<string, ReactNode> = {
  feed: (<><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" /></>),
  map: (<><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z" /><path d="M9 4v14M15 6v14" /></>),
  plus: (<><path d="M12 5v14M5 12h14" /></>),
  // A clean 6-tooth gear drawn natively, centred on (12,12) and sized to ~16px
  // to match the sibling glyphs — no transform/scale hack, so the stroke weight
  // and alignment stay identical to the other tabs.
  settings: (<><path d="M9.94 3.75L14.06 3.75L14.15 6.08L16.05 7.17L18.11 6.1L20.17 9.66L18.2 10.91L18.2 13.09L20.17 14.34L18.11 17.9L16.05 16.83L14.15 17.92L14.06 20.25L9.94 20.25L9.85 17.92L7.95 16.83L5.89 17.9L3.83 14.34L5.8 13.09L5.8 10.91L3.83 9.66L5.89 6.1L7.95 7.17L9.85 6.08Z" /><circle cx="12" cy="12" r="3" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>),
  filter: (<><path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" /></>),
  bell: (<><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>),
  pin: (<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>),
  target: (<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>),
  chevron: (<><path d="m9 6 6 6-6 6" /></>),
  back: (<><path d="m15 6-6 6 6 6" /></>),
  close: (<><path d="M18 6 6 18M6 6l12 12" /></>),
  check: (<><path d="m20 6-11 11-5-5" /></>),
  clock: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  edit: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></>),
  trash: (<><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></>),
  nav: (<><path d="M3 11 21 3l-8 18-2-7-8-3Z" /></>),
  layers: (<><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>),
  recenter: (<><circle cx="12" cy="12" r="3.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>),
  cart: (<><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /><path d="M2 3h2.2l2 12.5a1.5 1.5 0 0 0 1.5 1.2h9.4a1.5 1.5 0 0 0 1.5-1.2L20 7H5.2" /></>),
  pill: (<><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(45 12 12)" /><path d="M8.5 8.5 15.5 15.5" /></>),
  cup: (<><path d="M5 8h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8Z" /><path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16" /><path d="M7 3v1.5M10 3v1.5M13 3v1.5" /></>),
  wrench: (<><path d="M14.5 6.5a3.8 3.8 0 0 1-4.9 4.9L5 16l3 3 4.6-4.6a3.8 3.8 0 0 0 4.9-4.9l-2.2 2.2-2.3-.6-.6-2.3 2.1-2.1Z" /></>),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>),
  card: (<><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" /></>),
  dumbbell: (<><path d="M6.5 6.5 17.5 17.5M3 7l2-2 3 3-2 2-3-3ZM16 18l2-2 3 3-2 2-3-3ZM5 9l2 2M17 13l2 2" /></>),
  book: (<><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></>),
  bolt: (<><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></>),
  location: (<><circle cx="12" cy="12" r="9" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" /></>),
  moon: (<><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z" /></>),
  shield: (<><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>),
  sparkle: (<><path d="M12 4l1.8 5.2L19 11l-5.2 1.8L12 18l-1.8-5.2L5 11l5.2-1.8L12 4Z" /></>),
  waypoints: (<><circle cx="5" cy="6" r="2.5" /><circle cx="19" cy="18" r="2.5" /><path d="M7 7l4.5 4a3 3 0 0 0 4 0l1.5-1.3" /></>),
};

export function Icon({ name, size = 24, stroke = 2, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
    >
      {PATHS[name] ?? null}
    </svg>
  );
}
