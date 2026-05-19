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
  
  // Track notified reminders independently with timestamps to handle the 1-hour cooldown
  const notifiedReminders = useRef<Record<string, number>>({});

  const triggerNotification = (reminder: Reminder) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "granted") {
      const locationLabel = reminder.location.address || "your destination";
      
      new Notification("NearRemind Alert!", {
        body: `You're near ${locationLabel} — don't forget: ${reminder.title}!`,
        tag: reminder.id, // Grouping by reminder ID ensures they don't overwrite each other if multiple fire
        requireInteraction: true,
      });
    }
  };

  const checkProximity = useCallback((currentLoc: Location) => {
    const reminders = getReminders();
    const now = Date.now();
    
    // Each reminder is checked independently
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
        // Cooldown check allows multiple distinct reminders to fire even if their circles overlap
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
        // Handle specific error codes for better UX
        if (err.code === 1) { // PERMISSION_DENIED
          setError("Location access was denied. We need this to trigger your reminders nearby.");
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
    // Request notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }

    // Check permission state for geolocation
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        setPermissionStatus(result.state);
        result.onchange = () => setPermissionStatus(result.state);
      });
    }

    updateLocation();
    
    // Background-like behavior: even if tab is in background, interval and watchPosition continue
    const pollId = setInterval(updateLocation, 30000);

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
