
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Location, Reminder } from "@/lib/types";
import { getReminders } from "@/lib/store";
import { calculateDistance } from "@/lib/geo";

interface LocationContextType {
  location: Location | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// 1 hour in milliseconds
const NOTIFICATION_COOLDOWN = 60 * 60 * 1000;

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track notified reminders with timestamps to handle the 1-hour cooldown
  const notifiedReminders = useRef<Record<string, number>>({});

  const triggerNotification = (reminder: Reminder) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "granted") {
      const locationLabel = reminder.location.address || "your destination";
      
      new Notification("NearRemind Alert!", {
        body: `You're near ${locationLabel} — don't forget: ${reminder.title}!`,
        tag: reminder.id, // Grouping by reminder ID
        requireInteraction: true,
      });
    }
  };

  const checkProximity = useCallback((currentLoc: Location) => {
    const reminders = getReminders();
    const now = Date.now();
    
    reminders.forEach(reminder => {
      if (!reminder.isActive) {
        // Clear cooldown if reminder becomes inactive
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
        // Check if it hasn't been notified yet OR if the 1-hour cooldown has passed
        if (!lastNotified || (now - lastNotified > NOTIFICATION_COOLDOWN)) {
          triggerNotification(reminder);
          notifiedReminders.current[reminder.id] = now;
        }
      }
    });
  }, []);

  const updateLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLoc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: "Current Location"
        };
        setLocation(newLoc);
        checkProximity(newLoc);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [checkProximity]);

  useEffect(() => {
    // Request notification permission on mount
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }

    // Initial fetch
    updateLocation();
    
    // Polling every 30 seconds for consistent background-like state updates
    const pollId = setInterval(updateLocation, 30000);

    // Real-time tracking with watchPosition
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLoc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: "Current Location"
        };
        setLocation(newLoc);
        checkProximity(newLoc);
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    // Permission check for UX
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        if (result.state === 'denied') {
          setError("Location access denied. Please enable it in settings.");
        }
      });
    }

    return () => {
      clearInterval(pollId);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [updateLocation, checkProximity]);

  return (
    <LocationContext.Provider value={{ location, error, isLoading, refresh: updateLocation }}>
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
