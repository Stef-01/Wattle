"use client";
// Results (2026-10-16, v3): what we heard as a pill strip you can edit in place, two inline
// toggles (telehealth only, all of Queensland), then the ranked cards. Empty: the "No strong
// match yet" options with the counts the engine reported. Flow is Home → here → profile.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SearchResponse } from "@/src/data/search-types";
import { Body, Cta, Divider, Gap, Pill, Row, Screen, TabBar, TogglePill } from "@/src/ui/kit";
import { getCurrentRequest, getSavedIds, setDraft, toggleSavedId, type StoredRequest } from "@/src/ui/store";
import { Dock } from "./Dock";
import { DoctorCard } from "./DoctorCard";
import { heardPills, REACH_KM, restoreCounts, runMatch, withoutPill } from "./lib";

const TELE = /,?\s*telehealth only\s*$/i;

export function Matches() {
  const router = useRouter();
  const [req, setReq] = useState<StoredRequest | null>(null);
  const [missing, setMissing] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const found = getCurrentRequest();
    if (!found) setMissing(true);
    else setReq(found);
    setSaved(getSavedIds());
  }, []);

  async function rerun(input: { anywhere?: boolean; sentence?: string }) {
    if (!req || busy) return;
    setBusy(true);
    try {
      setReq(await runMatch({ sentence: input.sentence ?? req.sentence, suburb: req.suburb, removed: req.removed, anywhere: input.anywhere ?? req.anywhere, id: req.id }));
    } finally {
      setBusy(false);
    }
  }

  async function drop(pillId: string) {
    if (!req || busy) return;
    setBusy(true);
    try {
      setReq(await withoutPill(req, pillId));
    } finally {
      setBusy(false);
    }
  }

  const res: SearchResponse | null = req?.response ?? null;
  const cards = res?.cards ?? [];
  const labels = res?.conditionLabels ?? {};
  const place = (res?.place.suburb ?? req?.suburb ?? "Brisbane").replace(/ City$/, "");
  const pills = req ? heardPills(req) : [];
  const teleOnly = req ? TELE.test(req.sentence) : false;
  const anywhere = req?.anywhere === true;

  return (
    <Screen padBottom="pb-[110px]">
      <div className="flex items-center justify-between">
        <h1 className="display text-[24px] text-ink">{cards.length > 0 ? `${cards.length} ${cards.length === 1 ? "doctor" : "doctors"} for you` : "Your matches"}</h1>
        <Link href="/adjust" className="press-dim text-[14px] font-medium text-accent">Adjust</Link>
      </div>
      {req ? (
        <>
          <Gap h={12} />
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" aria-label="What we heard">
            {pills.map((p) => (
              <Pill key={p.id} small on={p.must} onClick={p.removable ? () => void drop(p.id) : undefined}>
                {p.label}{p.removable ? " ×" : ""}
              </Pill>
            ))}
            <Link href="/" onClick={() => setDraft(req.sentence)} className="press inline-flex h-11 shrink-0 items-center rounded-pill px-4 text-[14px] font-medium text-accent">
              Edit
            </Link>
          </div>
          <Gap h={12} />
          <div className="flex gap-2">
            <TogglePill on={teleOnly} onChange={(v) => void rerun({ sentence: v ? `${req.sentence.replace(TELE, "")}, telehealth only` : req.sentence.replace(TELE, "") })}>
              Telehealth only
            </TogglePill>
            <TogglePill on={anywhere} onChange={(v) => void rerun({ anywhere: v })}>
              {anywhere ? "All of Queensland" : `${REACH_KM} km of ${place}`}
            </TogglePill>
          </div>
          {res?.emergency ? (
            <>
              <Gap h={16} />
              <Body className="text-[16px]">{res.emergency.note}</Body>
            </>
          ) : null}
        </>
      ) : null}
      <Gap h={24} />
      {missing ? <Body>No search yet.</Body> : null}
      {res && cards.length === 0 ? (
        <Empty res={res} place={place} busy={busy} onWiden={() => void rerun({ anywhere: true })} onTelehealth={() => void rerun({ sentence: `${req!.sentence}, telehealth only` })} onChange={() => router.push("/")} onClosest={() => void rerun({ anywhere: true })} />
      ) : null}
      <div className="flex flex-col gap-4" style={busy ? { opacity: 0.5, transition: "opacity 150ms ease" } : { transition: "opacity 150ms ease" }}>
        {cards.map((card, i) => (
          <DoctorCard key={card.doctor.id} card={card} labels={labels} index={i} saved={saved.includes(card.doctor.id)} onSave={() => setSaved(toggleSavedId(card.doctor.id))} />
        ))}
      </div>
      {res && cards.length > 0 ? (
        <>
          <Gap h={16} />
          <p className="caption text-[13px] leading-normal text-grey">{res.orderNote}</p>
          {res.careGuidance ? <p className="pt-3 text-[14px] leading-normal text-grey">{res.careGuidance}</p> : null}
        </>
      ) : null}
      <div className="frame-fixed pointer-events-none bottom-[88px] z-[9] h-[40px] bg-gradient-to-b from-white/0 to-white" aria-hidden="true" />
      <TabBar active="/" />
    </Screen>
  );
}

function Empty({ res, place, busy, onWiden, onTelehealth, onChange, onClosest }: { res: SearchResponse; place: string; busy: boolean; onWiden: () => void; onTelehealth: () => void; onChange: () => void; onClosest: () => void }) {
  const n = restoreCounts(res);
  const count = (v: number | null, unit: string) => (v !== null ? ` (${v}${unit})` : "");
  return (
    <div style={busy ? { opacity: 0.5 } : undefined}>
      <h2 className="display text-[20px] text-charcoal">No strong match yet</h2>
      <p className="pt-2 text-[14px] text-grey">
        Within {REACH_KM} km of {place}
      </p>
      <Gap h={24} />
      <Row title={`Widen to all of Queensland${count(n.widen, " doctors")}`} onClick={onWiden} />
      <Divider />
      <Row title={`Include telehealth only${count(n.telehealth, "")}`} onClick={onTelehealth} />
      <Divider />
      <Row title="Change what you need" onClick={onChange} />
      <Divider />
      <Dock bottom={94}>
        <Cta fixed={false} onClick={onClosest} disabled={busy}>
          Show closest fits
        </Cta>
      </Dock>
    </div>
  );
}
