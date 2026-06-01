"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { Location } from "@/lib/types";
import { calculateDistance } from "@/lib/geo";

interface LocationContextType {
  location: Location | null;
  error: string | null;
  permissionStatus: PermissionState | "loading";
  isLoading: boolean;
  refresh: () => void;
  setManualLocation: (loc: Location) => void;
  isManual: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [isManual, setIsManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | "loading">("loading");
  const [isLoading, setIsLoading] = useState(true);

  const lastGeocoded = useRef<{ lat: number; lon: number; time: number } | null>(null);
  const isManualRef = useRef(false);

  const setManualLocation = (loc: Location) => {
    isManualRef.current = true;
    setIsManual(true);
    setLocation(loc);
    setIsLoading(false);
  };

  const fetchReverseGeocode = useCallback(async (lat: number, lon: number): Promise<string> => {
    // Reuse the last label if we've barely moved (keeps the free geocoder happy).
    if (lastGeocoded.current) {
      const dist = calculateDistance(lat, lon, lastGeocoded.current.lat, lastGeocoded.current.lon);
      if (dist < 60 && Date.now() - lastGeocoded.current.time < 45000) {
        return location?.address || "Near you";
      }
    }
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      const data = await res.json();
      if (data) {
        lastGeocoded.current = { lat, lon, time: Date.now() };
        const parts = Array.from(
          new Set([data.locality, data.city, data.principalSubdivision, data.countryCode])
        ).filter(Boolean);
        return parts.slice(0, 2).join(", ") || "Near you";
      }
    } catch {
      // ignore — label is cosmetic
    }
    return "Near you";
  }, [location?.address]);

  const applyPosition = useCallback(
    async (position: GeolocationPosition) => {
      if (isManualRef.current) return;
      const address = await fetchReverseGeocode(position.coords.latitude, position.coords.longitude);
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address,
      });
      setError(null);
      setIsLoading(false);
    },
    [fetchReverseGeocode]
  );

  const refresh = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      applyPosition,
      (err) => {
        if (err.code === 1) {
          setError("Location access denied.");
          setPermissionStatus("denied");
        } else {
          setError(err.message);
        }
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [applyPosition]);

  useEffect(() => {
    // Optional manual-location override (handy as a "fake GPS" for demos/testing).
    // Set localStorage "nr_devloc" to {latitude, longitude, address}. Real GPS still
    // takes over when available; normal users never set this key.
    try {
      const dev = localStorage.getItem("nr_devloc");
      if (dev) {
        const d = JSON.parse(dev);
        if (typeof d?.latitude === "number" && typeof d?.longitude === "number") {
          setLocation({ latitude: d.latitude, longitude: d.longitude, address: d.address });
          setIsLoading(false);
        }
      }
    } catch {
      // ignore malformed override
    }

    // Ask for notification permission up front so pings can fire.
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }

    // Register the service worker so notifications can show on mobile browsers
    // (which reject the `new Notification()` constructor).
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
        setPermissionStatus(result.state);
        result.onchange = () => {
          setPermissionStatus(result.state);
          if (result.state === "granted") {
            isManualRef.current = false;
            setIsManual(false);
          }
        };
      });
    }

    refresh();
    const watchId = navigator.geolocation?.watchPosition(
      applyPosition,
      (err) => {
        if (err.code === 1) setPermissionStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, [refresh, applyPosition]);

  return (
    <LocationContext.Provider
      value={{ location, error, permissionStatus, isLoading, refresh, setManualLocation, isManual }}
    >
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
