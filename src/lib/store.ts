"use client";

import type { Reminder, Settings } from "./types";

const KEY_REMINDERS = "nr_reminders";
const KEY_ONBOARDED = "nr_onboarded";
const KEY_SETTINGS = "nr_settings";

// A few example reminders so the app isn't empty on first launch.
// They are category-based — real nearby matches are computed from the user's location.
const SEED: Reminder[] = [
  { id: "seed-1", title: "Pick up dark chocolate", cat: "grocery", radius: 400, trigger: "arriving", enabled: true, createdAt: Date.now() - 86400000 },
  { id: "seed-2", title: "Refill prescription", cat: "pharmacy", radius: 600, trigger: "arriving", enabled: true, createdAt: Date.now() - 172800000 },
  { id: "seed-3", title: "Grab oat milk + eggs", cat: "grocery", radius: 500, trigger: "nearby", enabled: false, createdAt: Date.now() - 259200000 },
];

export const DEFAULT_SETTINGS: Settings = {
  name: "",
  always: true,
  precise: true,
  sound: true,
  haptic: true,
  quiet: false,
};

/* ---------------- reminders ---------------- */

export const getReminders = (): Reminder[] => {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY_REMINDERS);
  if (raw === null) {
    localStorage.setItem(KEY_REMINDERS, JSON.stringify(SEED));
    return SEED;
  }
  try {
    return JSON.parse(raw) as Reminder[];
  } catch {
    return [];
  }
};

export const writeReminders = (reminders: Reminder[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_REMINDERS, JSON.stringify(reminders));
};

/* ---------------- onboarding ---------------- */

export const getOnboarded = (): boolean =>
  typeof window !== "undefined" && localStorage.getItem(KEY_ONBOARDED) === "1";

export const setOnboarded = (done: boolean) => {
  if (typeof window === "undefined") return;
  if (done) localStorage.setItem(KEY_ONBOARDED, "1");
  else localStorage.removeItem(KEY_ONBOARDED);
};

/* ---------------- settings ---------------- */

export const getSettings = (): Settings => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (s: Settings) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
};
