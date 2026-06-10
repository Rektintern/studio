"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { Location } from "@/lib/types";
import { calculateDistance } from "@/lib/geo";

const MANUAL_KEY = "nr_manualloc";

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

  // Refs keep these callbacks STABLE so the init effect runs exactly once.
  // (Previously fetchReverseGeocode depended on location.address → applyPosition
  // and refresh changed on every pin → the init effect re-ran and clobbered the
  // manual location. That was the "stuck on one spot" bug.)
  const lastGeocoded = useRef<{ lat: number; lon: number; time: number; label: string } | null>(null);
  const isManualRef = useRef(false);

  const fetchReverseGeocode = useCallback(async (lat: number, lon: number): Promise<string> => {
    // Reuse the last label if we've barely moved (keeps the free geocoder happy).
    if (lastGeocoded.current) {
      const dist = calculateDistance(lat, lon, lastGeocoded.current.lat, lastGeocoded.current.lon);
      if (dist < 60 && Date.now() - lastGeocoded.current.time < 45000) {
        return lastGeocoded.current.label;
      }
    }
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      const data = await res.json();
      if (data) {
        const parts = Array.from(
          new Set([data.locality, data.city, data.principalSubdivision, data.countryCode])
        ).filter(Boolean);
        const label = parts.slice(0, 2).join(", ") || "Near you";
        lastGeocoded.current = { lat, lon, time: Date.now(), label };
        return label;
      }
    } catch {
      // ignore — label is cosmetic
    }
    return "Near you";
  }, []);

  const applyPosition = useCallback(
    async (position: GeolocationPosition) => {
      if (isManualRef.current) return; // a deliberate manual pin wins over GPS
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

  // Ask the browser for the real GPS fix (does NOT touch manual state).
  const locateViaGps = useCallback(() => {
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

  // Manual pin: from the "Set on map" flow or the search bar. Persisted so it
  // survives reloads, and flagged so GPS won't override it.
  const setManualLocation = useCallback((loc: Location) => {
    isManualRef.current = true;
    setIsManual(true);
    setLocation(loc);
    setError(null);
    setIsLoading(false);
    try { localStorage.setItem(MANUAL_KEY, JSON.stringify(loc)); } catch { /* ignore */ }
  }, []);

  // "Use my real location" — clears the manual pin and re-fetches GPS.
  const refresh = useCallback(() => {
    isManualRef.current = false;
    setIsManual(false);
    try { localStorage.removeItem(MANUAL_KEY); } catch { /* ignore */ }
    setIsLoading(true);
    locateViaGps();
  }, [locateViaGps]);

  useEffect(() => {
    // Restore a previously pinned manual location (wins over GPS until cleared).
    let hasManual = false;
    try {
      const saved = localStorage.getItem(MANUAL_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (typeof d?.latitude === "number" && typeof d?.longitude === "number") {
          isManualRef.current = true;
          setIsManual(true);
          setLocation({ latitude: d.latitude, longitude: d.longitude, address: d.address });
          setIsLoading(false);
          hasManual = true;
        }
      }
    } catch {
      // ignore malformed value
    }

    // Register the SW that shows mobile pings (notification permission is
    // requested from a user gesture elsewhere, not here).
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
        setPermissionStatus(result.state);
        result.onchange = () => setPermissionStatus(result.state);
      });
    }

    // Only auto-locate via GPS when the user hasn't pinned a spot themselves.
    if (!hasManual) locateViaGps();

    // Keep watching GPS; applyPosition no-ops while a manual pin is active.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run ONCE — callbacks are stable, so nothing re-triggers this

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
