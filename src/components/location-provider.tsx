
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Location, Reminder } from "@/lib/types";
import { getReminders } from "@/lib/store";
import { calculateDistance } from "@/lib/geo";

interface LocationContextType {
  location: Location | null;
  error: string | null;
  permissionStatus: PermissionState | 'loading';
  isLoading: boolean;
  refresh: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// 1 hour in milliseconds for notification cooldown
const NOTIFICATION_COOLDOWN = 60 * 60 * 1000;

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'loading'>('loading');
  const [isLoading, setIsLoading] = useState(true);
  
  // Track notified reminders independently with timestamps
  const notifiedReminders = useRef<Record<string, number>>({});
  const lastGeocoded = useRef<{ lat: number; lon: number; time: number } | null>(null);

  const fetchReverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      // Avoid excessive geocoding if we haven't moved much (less than 50m) or geocoded in the last 45 seconds
      if (lastGeocoded.current) {
        const dist = calculateDistance(lat, lon, lastGeocoded.current.lat, lastGeocoded.current.lon);
        const timeDiff = Date.now() - lastGeocoded.current.time;
        if (dist < 50 && timeDiff < 45000) {
          return location?.address || "Current Location";
        }
      }

      // Using BigDataCloud's Free Client-Side Reverse Geocoding API
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      const data = await response.json();
      
      if (data) {
        lastGeocoded.current = { lat, lon, time: Date.now() };
        
        // Construct a full, human-readable address
        const neighborhood = data.locality;
        const city = data.city;
        const region = data.principalSubdivision;
        const country = data.countryName;
        
        // Filter out duplicates and join parts
        const parts = Array.from(new Set([neighborhood, city, region, country]))
          .filter(Boolean);
          
        return parts.join(", ") || "Current Position";
      }
    } catch (err) {
      console.warn("Reverse geocoding failed", err);
    }
    return "Current Position";
  };

  const triggerNotification = (reminder: Reminder) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "granted") {
      const locationLabel = reminder.location.address || "your destination";
      
      new Notification("NearRemind Alert!", {
        body: `You're near ${locationLabel} — don't forget: ${reminder.title}!`,
        tag: reminder.id,
        requireInteraction: true,
      });
    }
  };

  const checkProximity = useCallback((currentLoc: Location) => {
    const reminders = getReminders();
    const now = Date.now();
    
    reminders.forEach(reminder => {
      if (!reminder.isActive) {
        delete notifiedReminders.current[reminder.id];
        return;
      }

      const distance = calculateDistance(
        currentLoc.latitude, currentLoc.longitude,
        reminder.location.latitude, reminder.location.longitude
      );

      const isInside = distance <= reminder.radius;
      const lastNotified = notifiedReminders.current[reminder.id];

      if (isInside) {
        if (!lastNotified || (now - lastNotified > NOTIFICATION_COOLDOWN)) {
          triggerNotification(reminder);
          notifiedReminders.current[reminder.id] = now;
        }
      }
    });
  }, []);

  const updateLocation = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const address = await fetchReverseGeocode(position.coords.latitude, position.coords.longitude);
        const newLoc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address
        };
        setLocation(newLoc);
        checkProximity(newLoc);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        if (err.code === 1) {
          setError("Location access denied.");
          setPermissionStatus('denied');
        } else {
          setError(err.message);
        }
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [checkProximity]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        setPermissionStatus(result.state);
        result.onchange = () => setPermissionStatus(result.state);
      });
    }

    updateLocation();
    
    const pollId = setInterval(updateLocation, 30000);

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const address = await fetchReverseGeocode(position.coords.latitude, position.coords.longitude);
        const newLoc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address
        };
        setLocation(newLoc);
        checkProximity(newLoc);
        setError(null);
      },
      (err) => {
        if (err.code === 1) setPermissionStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    return () => {
      clearInterval(pollId);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [updateLocation, checkProximity]);

  return (
    <LocationContext.Provider value={{ location, error, permissionStatus, isLoading, refresh: updateLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
