"use client";
// Tab pages: /recent (localStorage recent searches), /saved (wattle.saved.v1 ids → cards),
// /me (name, join as a doctor, about). Each sits under the TabBar with its own dot.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DoctorRecord } from "@/src/data/types";
import { Body, Divider, FieldBox, FigmaIcon, PhotoCard, Row, Screen, SectionTitle, TabBar } from "@/src/ui/kit";
import { getName, getRecent, getRequest, getSavedIds, setName, setRequest, toggleSavedId, type RecentSearch } from "@/src/ui/store";
import { Space } from "./bits";
import { drName, placeOf, feeOf } from "./facts";

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
    fetch(`/doctor/lookup?ids=${encodeURIComponent(saved.join(","))}`)
      .then((r) => (r.ok ? (r.json() as Promise<DoctorRecord[]>) : Promise.resolve([])))
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
      {doctors.map((d, i) => (
        <div key={d.id}>
          {i > 0 ? <Space h={28} /> : null}
          <PhotoCard
            name={drName(d)}
            place={placeOf(d)}
            fee={feeOf(d) ?? undefined}
            photo={null}
            height={240}
            href={`/doctor/${encodeURIComponent(d.id)}`}
            topRight={
              <button type="button" aria-label="Remove bookmark" onClick={(e) => { e.preventDefault(); remove(d.id); }} className="inline-flex size-11 items-center justify-center rounded-full bg-caption text-white backdrop-blur-[20px]">
                <FigmaIcon name="bookmark" size={22} />
              </button>
            }
          />
        </div>
      ))}
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
