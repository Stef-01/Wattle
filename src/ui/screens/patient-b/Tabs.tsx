"use client";
// Tab pages: /recent (localStorage recent searches), /saved (wattle.saved.v1 ids → cards),
// /me (name, join as a doctor, about). Each sits under the TabBar with its own dot.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { lookup } from "@/src/data/api";
import { doctorHref } from "@/src/data/doctor-slug";
import type { DoctorRecord } from "@/src/data/types";
import { Avatar, Body, Chip, Chips, Divider, FieldBox, FigmaIcon, Heart, Row, Screen, SectionTitle, TabBar } from "@/src/ui/kit";
import Link from "next/link";
import { getName, getRecent, getRequest, getSavedIds, setName, setRequest, toggleSavedId, type RecentSearch } from "@/src/ui/store";
import { Space } from "./bits";
import { drName, placeOf, practicalChips, quoteOf, specialtyTitle } from "./facts";

const day = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
};

export function Recent() {
  const router = useRouter();
  const [rows, setRows] = useState<RecentSearch[] | null>(null);
  useEffect(() => setRows(getRecent()), []);
  const open = (r: RecentSearch) => {
    const req = getRequest(r.id);
    if (req) {
      setRequest(req);
      router.push("/results");
    } else router.push("/");
  };
  return (
    <Screen padBottom="pb-[110px]">
      <SectionTitle>Recent</SectionTitle>
      <Space h={24} />
      {rows && rows.length === 0 ? <Body>No searches yet.</Body> : null}
      {rows?.map((r) => (
        <div key={r.id}>
          <Row icon={<FigmaIcon name="clock" size={17} />} title={r.label} sub={`${r.matches} ${r.matches === 1 ? "match" : "matches"}${day(r.at) ? `, ${day(r.at)}` : ""}`} onClick={() => open(r)} />
          <Divider />
        </div>
      ))}
      <TabBar active="/recent" />
    </Screen>
  );
}

export function Saved() {
  const [ids, setIds] = useState<string[] | null>(null);
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  useEffect(() => {
    const saved = getSavedIds();
    setIds(saved);
    if (saved.length === 0) return;
    lookup(saved)
      .then(setDoctors)
      .catch(() => setDoctors([]));
  }, []);
  const remove = (id: string) => {
    const next = toggleSavedId(id);
    setIds(next);
    setDoctors((ds) => ds.filter((d) => next.includes(d.id)));
  };
  return (
    <Screen padBottom="pb-[110px]">
      <SectionTitle>Saved</SectionTitle>
      <Space h={24} />
      {ids && ids.length === 0 ? <Body>Nothing saved yet.</Body> : null}
      <div className="flex flex-col gap-4">
        {doctors.map((d, i) => (
          <SavedCard key={d.id} doctor={d} index={i} onRemove={() => remove(d.id)} />
        ))}
      </div>
      <TabBar active="/saved" />
    </Screen>
  );
}

export function Me() {
  const [name, setNameState] = useState("");
  useEffect(() => setNameState(getName() ?? ""), []);
  return (
    <Screen padBottom="pb-[110px]">
      <SectionTitle>Profile</SectionTitle>
      <Space h={24} />
      <label className="flex flex-col gap-2">
        <span className="text-[14px] text-grey">Your name</span>
        <FieldBox>
          <input
            value={name}
            onChange={(e) => {
              setNameState(e.target.value);
              setName(e.target.value);
            }}
            placeholder="Name"
            autoComplete="given-name"
            className="h-[54px] w-full bg-transparent px-5 text-[16px] font-medium text-charcoal outline-none placeholder:text-grey"
          />
        </FieldBox>
      </label>
      <Space h={30} />
      <Row icon={<FigmaIcon name="file" size={17} />} title="Join as a doctor" sub="Claim or add your profile" href="/join" />
      <Divider />
      <Space h={30} />
      <h2 className="display text-[20px] text-charcoal">About Wattle</h2>
      <Space h={8} />
      <p className="text-[14px] leading-[1.5] text-grey">One sentence finds Queensland doctors who list what you need. Every fact names its source and date. Nothing is rated or ranked by opinion.</p>
      <TabBar active="/me" />
    </Screen>
  );
}

function SavedCard({ doctor: d, index, onRemove }: { doctor: DoctorRecord; index: number; onRemove: () => void }) {
  const name = drName(d);
  const quote = quoteOf(d);
  const practical = practicalChips(d);
  return (
    <article className="rise relative rounded-[20px] border border-hairline bg-white p-5" style={{ "--i": index } as React.CSSProperties}>
      <button type="button" aria-label="Remove from saved" onClick={onRemove} className="press absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Heart size={20} fill="currentColor" />
      </button>
      <Link href={doctorHref(d.id)} className="press press-soft block">
        <div className="flex items-center gap-4 pr-12">
          <Avatar name={name} size={56} />
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="display truncate text-[19px] leading-tight text-ink">{name}</h3>
            <p className="truncate text-[14px] text-grey">{[specialtyTitle(d.specialty), placeOf(d)].join(" · ")}</p>
          </div>
        </div>
        {quote ? <p className="mt-4 text-[16px] leading-[1.5] text-charcoal">“{quote.text}”</p> : null}
        {practical.length > 0 ? (
          <Chips className="mt-3">
            {practical.map((f) => (
              <Chip key={f} tone="line">{f}</Chip>
            ))}
          </Chips>
        ) : null}
      </Link>
    </article>
  );
}
