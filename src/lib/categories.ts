import type { CategoryKey } from "./types";

export interface CategoryMeta {
  label: string;
  icon: string; // matches an Icon name
  hint: string;
  /** Overpass tag selectors (the `[...]` part) that match this category. */
  osm: string[];
  /** Google Places (New) `includedTypes` — used only when a key is configured. */
  google: string[];
}

// Category metadata used across every screen + the nearby-place lookup.
export const CATEGORIES: Record<CategoryKey, CategoryMeta> = {
  grocery: {
    label: "Grocery store",
    icon: "cart",
    hint: "Supermarkets & marts",
    osm: ['"shop"~"^(supermarket|convenience|grocery|greengrocer)$"'],
    google: ["supermarket", "grocery_store", "convenience_store"],
  },
  pharmacy: {
    label: "Pharmacy",
    icon: "pill",
    hint: "Chemists & drugstores",
    osm: ['"amenity"="pharmacy"', '"shop"="chemist"'],
    google: ["pharmacy", "drugstore"],
  },
  cafe: {
    label: "Café",
    icon: "cup",
    hint: "Coffee & tea",
    osm: ['"amenity"="cafe"', '"shop"="coffee"'],
    google: ["cafe", "coffee_shop"],
  },
  hardware: {
    label: "Hardware",
    icon: "wrench",
    hint: "DIY & tools",
    osm: ['"shop"~"^(hardware|doityourself|trade|paint)$"'],
    google: ["hardware_store"],
  },
  post: {
    label: "Post office",
    icon: "mail",
    hint: "Mail & shipping",
    osm: ['"amenity"="post_office"'],
    google: ["post_office"],
  },
  atm: {
    label: "ATM / Bank",
    icon: "card",
    hint: "Cash & banking",
    osm: ['"amenity"~"^(atm|bank)$"'],
    google: ["atm", "bank"],
  },
  gym: {
    label: "Gym",
    icon: "dumbbell",
    hint: "Fitness & sport",
    osm: ['"leisure"="fitness_centre"', '"amenity"="gym"'],
    google: ["gym", "fitness_center"],
  },
  library: {
    label: "Library",
    icon: "book",
    hint: "Books & study",
    osm: ['"amenity"="library"'],
    google: ["library"],
  },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

// Nicely pluralised labels for section headings ("Pharmacies nearby").
export const CATEGORY_PLURAL: Record<CategoryKey, string> = {
  grocery: "Grocery stores",
  pharmacy: "Pharmacies",
  cafe: "Cafés",
  hardware: "Hardware stores",
  post: "Post offices",
  atm: "ATMs & banks",
  gym: "Gyms",
  library: "Libraries",
};
