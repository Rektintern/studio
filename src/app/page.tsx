"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "@/components/location-provider";
import {
  getReminders,
  writeReminders,
  getOnboarded,
  setOnboarded as persistOnboarded,
  getSettings,
  saveSettings,
  DEFAULT_SETTINGS,
} from "@/lib/store";
import { useNearbyPlaces, useProximityPings } from "@/hooks/use-near-remind";
import { decorateReminders } from "@/lib/decorate";
import { requestNotifyPermission } from "@/lib/notify";
import { Onboarding } from "@/components/near/Onboarding";
import { MapScreen } from "@/components/near/MapScreen";
import { Feed } from "@/components/near/Feed";
import { ReminderDetail } from "@/components/near/ReminderDetail";
import { RouteView } from "@/components/near/RouteView";
import { PinLocationView } from "@/components/near/PinLocationView";
import { AddFlow } from "@/components/near/AddFlow";
import { Settings } from "@/components/near/Settings";
import { TabBar, type TabId } from "@/components/near/TabBar";
import { Toast } from "@/components/near/Toast";
import { PingBanner } from "@/components/near/PingBanner";
import { Icon } from "@/components/near/Icon";
import type { CategoryKey, DecoratedReminder, Place, Reminder, Settings as SettingsType } from "@/lib/types";

export default function Home() {
  const { location, permissionStatus, error: locationError, isLoading: locating, refresh: refreshLocation, setManualLocation } = useLocation();

  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState<TabId>("map");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [settings, setSettingsState] = useState<SettingsType>(DEFAULT_SETTINGS);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [routePlace, setRoutePlace] = useState<{ place: Place; cat: CategoryKey } | null>(null);
  const [pinning, setPinning] = useState(false);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [ping, setPing] = useState<DecoratedReminder | null>(null);
  const [pingReset, setPingReset] = useState(0);

  // hydrate from localStorage (client only) to avoid SSR mismatch
  useEffect(() => {
    setReminders(getReminders());
    setOnboarded(getOnboarded());
    setSettingsState(getSettings());
    setHydrated(true);
  }, []);

  // Once real location permission is granted, drop the demo seed reminders so
  // real users start with a clean slate (runs once; never touches user reminders).
  useEffect(() => {
    if (permissionStatus !== "granted") return;
    if (typeof window === "undefined" || localStorage.getItem("nr_seeds_cleared") === "1") return;
    localStorage.setItem("nr_seeds_cleared", "1");
    setReminders((prev) => {
      const next = prev.filter((r) => !r.id.startsWith("seed-"));
      writeReminders(next);
      return next;
    });
  }, [permissionStatus]);

  // Apply the chosen theme; follow the OS when set to "system".
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const isDark = settings.theme === "dark" || (settings.theme === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", isDark);
    };
    apply();
    if (settings.theme === "system") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [settings.theme]);

  // Liquid glass: toggle the class and feed the intensity to CSS as --liquid (0..1).
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("glass", settings.glass);
    el.style.setProperty("--liquid", String((settings.liquid ?? 55) / 100));
  }, [settings.glass, settings.liquid]);

  const activeCats = useMemo<CategoryKey[]>(
    () => Array.from(new Set(reminders.filter((r) => r.enabled).map((r) => r.cat))),
    [reminders]
  );
  const { placesByCat, scanning, failed: placesFailed, retry: retryPlaces } = useNearbyPlaces(location, activeCats);
  const decorated = useMemo(
    () => decorateReminders(reminders, location, placesByCat),
    [reminders, location, placesByCat]
  );
  // every nearby matching store (for active reminder categories) to mark on the map
  const nearbyStores = useMemo(() => {
    const out: { id: string; lat: number; lon: number; name: string; cat: CategoryKey }[] = [];
    const seen = new Set<string>();
    for (const cat of activeCats) {
      for (const p of placesByCat[cat] || []) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        out.push({ id: p.id, lat: p.lat, lon: p.lon, name: p.name, cat });
      }
    }
    return out.slice(0, 60);
  }, [activeCats, placesByCat]);
  useProximityPings(decorated, settings, setPing, pingReset);

  // auto-dismiss the in-app proximity banner
  useEffect(() => {
    if (!ping) return;
    const t = setTimeout(() => setPing(null), 8000);
    return () => clearTimeout(t);
  }, [ping]);

  const detail = detailId ? decorated.find((r) => r.id === detailId) ?? null : null;

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((window as unknown as { __tt?: number }).__tt);
    (window as unknown as { __tt?: number }).__tt = window.setTimeout(() => setToast(null), 2600);
  };

  const persist = (rs: Reminder[]) => {
    setReminders(rs);
    writeReminders(rs);
  };

  const createReminder = (r: Reminder) => {
    requestNotifyPermission(); // user gesture — ensure pings can fire for this reminder
    persist([r, ...reminders]);
    setAdding(false);
    setTab("feed");
    showToast("Reminder set — we'll watch nearby");
  };
  const toggleReminder = (r: DecoratedReminder) => {
    persist(reminders.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)));
  };
  const deleteReminder = (r: DecoratedReminder) => {
    persist(reminders.filter((x) => x.id !== r.id));
    setDetailId(null);
    showToast("Reminder removed");
  };
  const updateSettings = (s: SettingsType) => {
    setSettingsState(s);
    saveSettings(s);
  };
  const finishOnboarding = () => {
    requestNotifyPermission(); // user gesture — ask to send pings (works on mobile + PC)
    refreshLocation();
    persistOnboarded(true);
    setOnboarded(true);
  };
  const replayOnboarding = () => {
    persistOnboarded(false);
    setOnboarded(false);
  };

  if (!hydrated) return <div className="screen" />;

  return (
    <div className="screen">
      {!onboarded ? (
        <Onboarding userLocation={location} onDone={finishOnboarding} />
      ) : pinning ? (
        <PinLocationView
          userLocation={location}
          onConfirm={(loc) => { setManualLocation(loc); setPinning(false); setPingReset((n) => n + 1); }}
          onClose={() => setPinning(false)}
        />
      ) : routePlace ? (
        <RouteView
          userLocation={location}
          place={routePlace.place}
          cat={routePlace.cat}
          onClose={() => setRoutePlace(null)}
        />
      ) : detail ? (
        <ReminderDetail
          r={detail}
          userLocation={location}
          scanning={scanning}
          placesFailed={placesFailed}
          onRetryPlaces={retryPlaces}
          onClose={() => setDetailId(null)}
          onToggle={toggleReminder}
          onDelete={deleteReminder}
          onNavigate={(place) => setRoutePlace({ place, cat: detail.cat })}
        />
      ) : (
        <>
          {tab === "map" && (
            <MapScreen
              userLocation={location}
              reminders={decorated}
              nearbyStores={nearbyStores}
              onOpen={(r) => setDetailId(r.id)}
              locating={locating}
              locationError={locationError}
              onEnableLocation={() => { requestNotifyPermission(); refreshLocation(); }}
              onPinLocation={() => setPinning(true)}
            />
          )}
          {tab === "feed" && (
            <Feed reminders={decorated} onOpen={(r) => setDetailId(r.id)} onAdd={() => setAdding(true)} />
          )}
          {tab === "settings" && (
            <Settings settings={settings} setSettings={updateSettings} onReplayOnboarding={replayOnboarding} />
          )}
        </>
      )}

      {onboarded && !detail && !routePlace && !pinning && (
        <>
          <TabBar tab={tab} setTab={setTab} />
          <button className="add-fab" onClick={() => setAdding(true)} aria-label="New reminder">
            <Icon name="plus" size={26} stroke={2.6} />
          </button>
        </>
      )}
      {adding && <AddFlow userLocation={location} onClose={() => setAdding(false)} onCreate={createReminder} />}
      {ping && (
        <PingBanner
          r={ping}
          onOpen={() => { setDetailId(ping.id); setPing(null); }}
          onClose={() => setPing(null)}
        />
      )}
      {toast && <Toast message={toast} />}
    </div>
  );
}
