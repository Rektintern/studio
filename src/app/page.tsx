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
import { Onboarding } from "@/components/near/Onboarding";
import { MapScreen } from "@/components/near/MapScreen";
import { Feed } from "@/components/near/Feed";
import { ReminderDetail } from "@/components/near/ReminderDetail";
import { AddFlow } from "@/components/near/AddFlow";
import { Settings } from "@/components/near/Settings";
import { TabBar, type TabId } from "@/components/near/TabBar";
import { Toast } from "@/components/near/Toast";
import type { CategoryKey, DecoratedReminder, Reminder, Settings as SettingsType } from "@/lib/types";

export default function Home() {
  const { location, permissionStatus } = useLocation();

  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState<TabId>("map");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [settings, setSettingsState] = useState<SettingsType>(DEFAULT_SETTINGS);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const activeCats = useMemo<CategoryKey[]>(
    () => Array.from(new Set(reminders.filter((r) => r.enabled).map((r) => r.cat))),
    [reminders]
  );
  const { placesByCat } = useNearbyPlaces(location, activeCats);
  const decorated = useMemo(
    () => decorateReminders(reminders, location, placesByCat),
    [reminders, location, placesByCat]
  );
  useProximityPings(decorated, settings);

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
      ) : detail ? (
        <ReminderDetail
          r={detail}
          userLocation={location}
          onClose={() => setDetailId(null)}
          onToggle={toggleReminder}
          onDelete={deleteReminder}
        />
      ) : (
        <>
          {tab === "map" && (
            <MapScreen userLocation={location} reminders={decorated} onOpen={(r) => setDetailId(r.id)} />
          )}
          {tab === "feed" && (
            <Feed reminders={decorated} onOpen={(r) => setDetailId(r.id)} onAdd={() => setAdding(true)} />
          )}
          {tab === "settings" && (
            <Settings settings={settings} setSettings={updateSettings} onReplayOnboarding={replayOnboarding} />
          )}
        </>
      )}

      {onboarded && !detail && <TabBar tab={tab} setTab={setTab} onAdd={() => setAdding(true)} />}
      {adding && <AddFlow userLocation={location} onClose={() => setAdding(false)} onCreate={createReminder} />}
      {toast && <Toast message={toast} />}
    </div>
  );
}
