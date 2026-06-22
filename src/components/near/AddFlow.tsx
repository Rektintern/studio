"use client";

import { useRef, useState } from "react";
import { Icon } from "./Icon";
import { MiniMap } from "./MiniMap";
import { Seg } from "./Seg";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/categories";
import { fmtDist } from "@/lib/geo";
import type { CategoryKey, Location, Reminder, TriggerMode } from "@/lib/types";
import { DEFAULT_CENTER } from "@/lib/region";

const QUICK_ITEMS = ["Dark chocolate", "Oat milk", "AA batteries", "Stamps", "Prescription", "Cash", "Coffee beans", "Light bulbs"];
const FALLBACK = DEFAULT_CENTER;

interface AddFlowProps {
  userLocation: Location | null;
  onClose: () => void;
  onCreate: (r: Reminder) => void;
}

export function AddFlow({ userLocation, onClose, onCreate }: AddFlowProps) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<CategoryKey | null>(null);
  const [radius, setRadius] = useState(500);
  const [trigger, setTrigger] = useState<TriggerMode>("arriving");

  const canNext = step === 0 ? title.trim().length > 0 : step === 1 ? !!cat : true;
  const center: [number, number] = userLocation ? [userLocation.latitude, userLocation.longitude] : FALLBACK;

  const finish = () => {
    if (!cat) return;
    onCreate({
      id: "r" + Date.now(),
      title: title.trim(),
      cat,
      radius,
      trigger,
      enabled: true,
      createdAt: Date.now(),
    });
  };

  const next = () => (step < 2 ? setStep(step + 1) : finish());
  const back = () => (step > 0 ? setStep(step - 1) : onClose());

  // drag the grab handle down to dismiss the sheet (capture starts on real drag
  // so it never fights the buttons; release past ~120px closes, else snaps back)
  const dragStart = useRef<{ y: number; moved: boolean } | null>(null);
  const [dragY, setDragY] = useState<number | null>(null);
  const onGrabDown = (e: React.PointerEvent) => { dragStart.current = { y: e.clientY, moved: false }; };
  const onGrabMove = (e: React.PointerEvent) => {
    const s = dragStart.current;
    if (!s) return;
    const dy = e.clientY - s.y;
    if (!s.moved && dy > 6) { s.moved = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} }
    if (s.moved) setDragY(Math.max(0, dy));
  };
  const onGrabUp = () => {
    const s = dragStart.current;
    const dy = dragY ?? 0;
    dragStart.current = null;
    setDragY(null);
    if (s?.moved && dy > 120) onClose();
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div
        className="sheet"
        style={{ maxHeight: "92%", display: "flex", flexDirection: "column", ...(dragY !== null ? { transform: `translateY(${dragY}px)`, transition: "none" } : {}) }}
      >
        <div
          className="grab-zone"
          onPointerDown={onGrabDown}
          onPointerMove={onGrabMove}
          onPointerUp={onGrabUp}
          onPointerCancel={onGrabUp}
          aria-label="Drag down to close"
        >
          <span className="sheet-grab" />
        </div>
        <div style={{ padding: "8px 24px 16px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {/* header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <button className="iconbtn" onClick={back} aria-label={step === 0 ? "Close" : "Back"}>
              <Icon name={step === 0 ? "close" : "back"} size={20} />
            </button>
            <div className="steps">
              {[0, 1, 2].map((i) => (
                <i key={i} className={i === step ? "on" : i < step ? "done" : ""} />
              ))}
            </div>
            <div style={{ width: 44 }} />
          </div>

          <div style={{ minHeight: 372 }}>
            {step === 0 && (
              <div className="fadeswap">
                <div className="eyebrow">STEP 01</div>
                <div className="h2" style={{ marginTop: 10, fontSize: 24 }}>
                  What should we<br />remind you about?
                </div>
                <input
                  className="bigfield"
                  autoFocus
                  placeholder="e.g. Buy dark chocolate"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canNext && next()}
                />
                <div className="section-label" style={{ margin: "22px 0 12px" }}>QUICK ADD</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                  {QUICK_ITEMS.map((it) => (
                    <button key={it} className={"chip" + (title === it ? " on" : "")} onClick={() => setTitle(it)}>
                      {it}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="fadeswap">
                <div className="eyebrow">STEP 02</div>
                <div className="h2" style={{ marginTop: 10, fontSize: 24 }}>
                  Where should we<br />nudge you?
                </div>
                <div className="dim" style={{ marginTop: 8, fontSize: 14 }}>We&apos;ll watch for these places as you move.</div>
                <div className="catgrid" style={{ marginTop: 18 }}>
                  {CATEGORY_KEYS.map((key) => {
                    const c = CATEGORIES[key];
                    return (
                      <button key={key} className={"cat" + (cat === key ? " on" : "")} onClick={() => setCat(key)}>
                        <div className="cat-ico"><Icon name={c.icon} size={22} /></div>
                        <div>
                          <div className="cat-name">{c.label}</div>
                          <div className="cat-sub">{c.hint}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="fadeswap">
                <div className="eyebrow">STEP 03</div>
                <div className="h2" style={{ marginTop: 10, fontSize: 24 }}>
                  How close is<br />close enough?
                </div>

                <div style={{ marginTop: 16 }}>
                  <MiniMap center={center} radius={radius} height={190} cat={cat || "grocery"} live />
                </div>

                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, margin: "16px 0 8px" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--text)" }}>{fmtDist(radius)}</span>
                  <span className="dim" style={{ fontSize: 14 }}>radius</span>
                </div>
                <input className="slider" type="range" min={100} max={2000} step={50} value={radius} onChange={(e) => setRadius(+e.target.value)} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>100m</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>2km</span>
                </div>

                <div className="section-label" style={{ margin: "22px 0 10px" }}>PING ME WHEN</div>
                <Seg
                  options={[
                    { value: "arriving" as TriggerMode, label: "Arriving" },
                    { value: "nearby" as TriggerMode, label: "Anytime nearby" },
                  ]}
                  value={trigger}
                  onChange={setTrigger}
                  capitalize={false}
                />
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "12px 24px calc(env(safe-area-inset-bottom, 0px) + 16px)", borderTop: "1px solid var(--hairline)", background: "var(--app-bg)" }}>
          <button
            className="btn btn-accent btn-block"
            style={{ opacity: canNext ? 1 : 0.4 }}
            disabled={!canNext}
            onClick={next}
          >
            {step < 2 ? "Continue" : (<><Icon name="check" size={20} /> Set reminder</>)}
          </button>
        </div>
      </div>
    </>
  );
}
