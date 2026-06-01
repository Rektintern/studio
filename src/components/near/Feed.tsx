"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { ReminderRow } from "./ReminderRow";
import { CATEGORIES } from "@/lib/categories";
import type { DecoratedReminder } from "@/lib/types";

interface FeedProps {
  reminders: DecoratedReminder[];
  onOpen: (r: DecoratedReminder) => void;
  onAdd: () => void;
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card" style={{ padding: "44px 24px", textAlign: "center", display: "grid", placeItems: "center", gap: 18, marginTop: 18 }}>
      <div style={{ width: 60, height: 60, borderRadius: 18, display: "grid", placeItems: "center", background: "var(--brand-soft)", color: "var(--brand)" }}>
        <Icon name="pin" size={28} />
      </div>
      <div>
        <div className="h2" style={{ fontSize: 19 }}>No reminders yet</div>
        <div className="dim" style={{ marginTop: 6, fontSize: 14 }}>Add a place-based reminder and we&apos;ll ping you when you&apos;re close.</div>
      </div>
      <button className="btn btn-accent" style={{ height: 48, padding: "0 22px" }} onClick={onAdd}>
        <Icon name="plus" size={20} /> New reminder
      </button>
    </div>
  );
}

export function Feed({ reminders, onOpen, onAdd }: FeedProps) {
  const [q, setQ] = useState("");

  const filtered = reminders.filter(
    (r) =>
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      CATEGORIES[r.cat].label.toLowerCase().includes(q.toLowerCase())
  );
  const sorted = [...filtered].sort(
    (a, b) => Number(b.inRange) - Number(a.inRange) || (a.dist ?? Infinity) - (b.dist ?? Infinity)
  );
  const live = sorted.filter((r) => r.inRange);
  const rest = sorted.filter((r) => !r.inRange);
  const liveCount = reminders.filter((r) => r.inRange).length;

  return (
    <div className="view route">
      <div className="view-pad">
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 10 }}>
          <div>
            <div className="h1">Reminders</div>
            <div className="dim" style={{ marginTop: 8, fontSize: 14.5 }}>
              {liveCount > 0 ? (
                <>
                  <span style={{ color: "var(--brand)", fontWeight: 700 }}>{liveCount} nearby</span> right now
                </>
              ) : (
                "Nothing in range — you're all clear"
              )}
            </div>
          </div>
          <div className="iconbtn round" style={{ position: "relative" }}>
            <Icon name="bell" size={20} />
            <span className="notif-dot" />
          </div>
        </div>

        {/* search */}
        <div className="search" style={{ marginTop: 18 }}>
          <Icon name="search" size={19} style={{ color: "var(--text-3)" }} />
          <input placeholder="Search reminders" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {reminders.length === 0 ? (
          <EmptyState onAdd={onAdd} />
        ) : sorted.length === 0 ? (
          <div className="dim" style={{ textAlign: "center", marginTop: 40, fontSize: 14 }}>
            No reminders match “{q}”.
          </div>
        ) : (
          <>
            {live.length > 0 && (
              <>
                <div className="section-label" style={{ display: "flex", alignItems: "center", gap: 8, margin: "26px 2px 12px" }}>
                  <span className="livedot" /> Nearby now
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {live.map((r) => (
                    <ReminderRow key={r.id} r={r} onOpen={onOpen} />
                  ))}
                </div>
              </>
            )}
            {rest.length > 0 && (
              <>
                <div className="section-label" style={{ margin: "26px 2px 12px", color: "var(--text-3)" }}>All reminders</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {rest.map((r) => (
                    <ReminderRow key={r.id} r={r} onOpen={onOpen} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
