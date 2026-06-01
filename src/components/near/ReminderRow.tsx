"use client";

import { Icon } from "./Icon";
import { CATEGORIES } from "@/lib/categories";
import { fmtDist } from "@/lib/geo";
import type { DecoratedReminder } from "@/lib/types";

interface ReminderRowProps {
  r: DecoratedReminder;
  onOpen: (r: DecoratedReminder) => void;
}

export function ReminderRow({ r, onOpen }: ReminderRowProps) {
  const cat = CATEGORIES[r.cat];
  return (
    <button className={"rem" + (r.inRange ? " live" : "")} onClick={() => onOpen(r)}>
      <div className="rem-ico">
        <Icon name={cat.icon} size={21} />
      </div>
      <div className="rem-body">
        <div className="rem-title">{r.title}</div>
        <div className="rem-meta">
          <span>{cat.label}</span>
          <span className="dotsep" />
          <span>{r.places} nearby</span>
        </div>
      </div>
      <div className="rem-dist">
        {r.inRange && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end", marginBottom: 2 }}>
            <span className="livedot" />
          </div>
        )}
        {fmtDist(r.dist)}
      </div>
    </button>
  );
}
