"use client";

import { Icon } from "./Icon";

export type TabId = "map" | "feed" | "settings";

interface TabBarProps {
  tab: TabId;
  setTab: (t: TabId) => void;
}

export function TabBar({ tab, setTab }: TabBarProps) {
  return (
    <div className="tabbar-wrap">
      <div className="tabbar">
        <button className={"tab" + (tab === "map" ? " active" : "")} onClick={() => setTab("map")}>
          <Icon name="map" size={23} stroke={tab === "map" ? 2.3 : 2} />
          <span>Map</span>
        </button>
        <button className={"tab" + (tab === "feed" ? " active" : "")} onClick={() => setTab("feed")}>
          <Icon name="feed" size={23} stroke={tab === "feed" ? 2.3 : 2} />
          <span>Saved</span>
        </button>
        <button className={"tab" + (tab === "settings" ? " active" : "")} onClick={() => setTab("settings")}>
          <Icon name="settings" size={23} stroke={tab === "settings" ? 2.3 : 2} />
          <span>You</span>
        </button>
      </div>
    </div>
  );
}
