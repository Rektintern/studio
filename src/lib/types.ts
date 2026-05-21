
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Reminder {
  id: string;
  title: string;
  location: Location;
  radius: number; // in meters
  tags: string[];
  isActive: boolean;
  createdAt: number;
  distance?: number; // calculated runtime
}

export interface SuggestedPlace {
  name: string;
  address: string;
  distance: number;
  latitude: number;
  longitude: number;
  type?: string;
}

export interface UserPreferences {
  notificationFrequency: 'immediate' | 'summary' | 'low';
  locationAccuracy: 'high' | 'balanced' | 'power-saving';
}
