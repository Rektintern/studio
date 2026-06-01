// Core data model for NEAR REMIND.

export type CategoryKey =
  | "grocery"
  | "pharmacy"
  | "cafe"
  | "hardware"
  | "post"
  | "atm"
  | "gym"
  | "library";

export type TriggerMode = "arriving" | "nearby";

/** A user's live GPS / manually-set position. */
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * A reminder is tied to a *category of place*, not a fixed address.
 * As the user moves, we look up nearby matching places and ping them.
 */
export interface Reminder {
  id: string;
  title: string;
  cat: CategoryKey;
  radius: number;        // meters, 100..2000
  trigger: TriggerMode;
  enabled: boolean;      // user pause/activate — persisted
  createdAt: number;
}

/** A real-world place returned from OpenStreetMap, with distance to the user. */
export interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
  dist: number;          // meters from the user (runtime)
}

/** A reminder decorated at runtime with live proximity data. */
export interface DecoratedReminder extends Reminder {
  dist: number | null;   // meters to nearest matching place
  places: number;        // count of matching nearby spots
  nearest: Place | null; // nearest matching place
  matches: Place[];      // up to a few closest matches
  inRange: boolean;      // enabled && nearest within radius
}

export interface Settings {
  name: string;
  always: boolean;
  precise: boolean;
  sound: boolean;
  haptic: boolean;
  quiet: boolean;
}
