"use client";
// P05 Your matches (226:9): the ranked cards, 405 tall, heart bookmark top-right, a small caption
// (name, suburb), one line from the reasons under each, the order-honesty note, then the tab bar.
// Empty: the P10 "No strong match yet" section inline with the counts the engine reported.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SearchResponse } from "@/src/data/search-types";
import { Body, Circle, Cta, Divider, Gap, Heart, MapPin, PhotoCard, Row, Screen, SectionTitle, TabBar } from "@/src/ui/kit";
import { getCurrentRequest, getSavedIds, toggleSavedId, type StoredRequest } from "@/src/ui/store";
import { Dock } from "./Dock";
import { lineFor, REACH_KM, restoreCounts, runMatch, suburbOf } from "./lib";

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

  const res: SearchResponse | null = req?.response ?? null;
  const cards = res?.cards ?? [];
  const place = (res?.place.suburb ?? req?.suburb ?? "Brisbane").replace(/ City$/, "");

  return (
    <Screen padBottom="pb-[110px]">
      <SectionTitle right="Adjust" rightHref="/adjust">
        Your matches
      </SectionTitle>
      <Gap h={24} />
      {missing ? <Body>No search yet.</Body> : null}
      {res && cards.length === 0 ? (
        <Empty res={res} place={place} busy={busy} onWiden={() => void rerun({ anywhere: true })} onTelehealth={() => void rerun({ sentence: `${req!.sentence}, telehealth only` })} onChange={() => router.push("/heard")} onClosest={() => void rerun({ anywhere: true })} />
      ) : null}
      {cards.map((card, i) => {
        const d = card.doctor;
        const isSaved = saved.includes(d.id);
        const suburb = suburbOf(card);
        return (
          <div key={d.id}>
            {i > 0 ? <div style={{ height: 28 }} aria-hidden="true" /> : null}
            <PhotoCard
              name={d.name.display}
              photo={null}
              height={405}
              caption={false}
              href={`/match/${i + 1}`}
              topRight={
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSaved(toggleSavedId(d.id));
                  }}
                >
                  <Circle over label={isSaved ? "Remove from saved" : "Save"}>
                    <Heart size={22} fill={isSaved ? "currentColor" : "none"} />
                  </Circle>
                </span>
              }
            >
              <div className="absolute left-5 top-[310px] flex h-[75px] w-[224px] items-center rounded-[15px] bg-caption px-4 py-3 text-white shadow-[0_5px_4.5px_rgba(0,0,0,0.1)] backdrop-blur-[20px]">
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="truncate text-[16px] font-medium leading-normal">{d.name.display}</span>
                  {suburb ? (
                    <span className="inline-flex items-center gap-1.5 text-[14px] leading-normal text-caption-text">
                      <MapPin size={16} />
                      <span className="truncate">{suburb}</span>
                    </span>
                  ) : null}
                </span>
              </div>
            </PhotoCard>
            <Gap h={16} />
            <Body className="text-[16px]">{lineFor(card)}</Body>
          </div>
        );
      })}
      {res && cards.length > 0 ? (
        <>
          <div style={{ height: 28 }} aria-hidden="true" />
          <p className="text-[14px] leading-normal text-grey">{res.orderNote}</p>
        </>
      ) : null}
      <div className="pointer-events-none fixed inset-x-0 bottom-[88px] z-[9] mx-auto h-[50px] w-full max-w-[430px] bg-gradient-to-b from-white/0 to-white sm:absolute" aria-hidden="true" />
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
      <Row title={`Widen to 50 km${count(n.widen, " doctors")}`} onClick={onWiden} />
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
