// Illustrative (fictional) doctors from data/illustrative/doctors.json. Plan §2: "demonstrate
// voluntary enrichment using clearly labelled illustrative profiles". Every record is
// `synthetic: true`, `realPerson: false`, `personal.status: "illustrative"`, and every surface
// labels it so (CLAUDE.md). No publications: a paper is never invented. Server only (fs).
//
// Included only when WATTLE_INCLUDE_ILLUSTRATIVE is "1"/"true". Off by default since
// 2026-10-16: 29 real Queensland doctors with published personal bios (src/data/published.ts)
// replaced the fictional fallback, and a fictional card must never outrank a real one.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Discipline } from "@/src/disciplines/load";
import { withPersonalLabels } from "@/src/matching/personal-labels";
import type { Billing, Capacity, Gender, Location, Observed, Population, Specialty, Telehealth } from "@/src/matching/types";
import type { DoctorRecord, PersonalProfile, SourceRef } from "./types";

type RawIllustrative = {
  id: string;
  given: string;
  family: string;
  specialty: Specialty;
  gender: Gender;
  languages: string[];
  tags: string[];
  conditions: string[];
  conditions_sometimes?: string[];
  populations: Population[];
  telehealth: Telehealth;
  billing: Billing;
  capacity: Capacity;
  waitlist_weeks?: number;
  referral_required?: boolean;
  years_in_specialty?: number;
  location: { name: string; suburb: string; postcode: string; lat: number; lng: number; phone?: string; wheelchair?: boolean; telehealth_only?: boolean };
  personal: Record<string, unknown> & { status: "illustrative" };
};

type RawFile = { observed_at: string; doctors: RawIllustrative[] };

const SOURCE = "illustrative";

export function illustrativeEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const flag = (env.WATTLE_INCLUDE_ILLUSTRATIVE ?? "").trim().toLowerCase();
  if (flag === "1" || flag === "true" || flag === "on") return true;
  return false;
}

function declared<T>(value: T, observedAt: string): Observed<T> {
  return { value, tier: "declared", source: SOURCE, observedAt };
}

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
const list = (v: unknown): string[] | undefined => (Array.isArray(v) ? v.map(String).filter(Boolean) : str(v) ? [str(v)!] : undefined);

/** The complete Task-4 personal block, snake_case in the file, camelCase on the contract. */
function personalOf(raw: RawIllustrative["personal"]): PersonalProfile {
  const p: PersonalProfile = { status: "illustrative" };
  const philosophy = str(raw.philosophy_of_care);
  const whyMedicine = str(raw.why_medicine);
  const purpose = str(raw.professional_purpose);
  const communicationApproach = str(raw.communication_approach);
  const enjoysServing = list(raw.enjoys_serving);
  const communication = list(raw.communication);
  const livedExperience = str(raw.lived_experience);
  const hobbies = list(raw.hobbies);
  const outsideMedicine = str(raw.outside_medicine);
  if (philosophy) p.philosophyOfCare = philosophy;
  if (whyMedicine) p.whyMedicine = whyMedicine;
  if (purpose) p.professionalPurpose = purpose;
  if (communicationApproach) p.communicationApproach = communicationApproach;
  if (enjoysServing) p.enjoysServing = enjoysServing;
  if (communication) p.communication = communication;
  if (livedExperience) p.livedExperience = livedExperience;
  if (hobbies) p.hobbies = hobbies;
  if (outsideMedicine) p.outsideMedicine = outsideMedicine;
  return p;
}

function toRecord(raw: RawIllustrative, observedAt: string, discipline: Discipline): DoctorRecord {
  const loc = raw.location;
  const location: Location = { id: `${raw.id}:0`, name: loc.name, suburb: loc.suburb, state: "QLD", postcode: loc.postcode, lat: loc.lat, lng: loc.lng };
  if (loc.phone) location.phone = declared(loc.phone, observedAt);
  if (loc.wheelchair !== undefined) location.wheelchair = declared(loc.wheelchair, observedAt);
  if (loc.telehealth_only) location.telehealthOnly = true;
  const source: SourceRef = { source: SOURCE, sourceUrl: null, observedAt, legalBasis: "fictional illustrative profile; not a real person" };
  const display = `Dr ${raw.given} ${raw.family} (example)`;
  const record: DoctorRecord = {
    id: raw.id,
    realPerson: false,
    synthetic: true,
    name: { given: raw.given, family: raw.family, display },
    specialty: raw.specialty,
    gender: declared(raw.gender, observedAt),
    conditions: declared(raw.conditions, observedAt),
    populations: declared(raw.populations, observedAt),
    telehealth: declared(raw.telehealth, observedAt),
    billing: declared(raw.billing, observedAt),
    capacity: declared(raw.capacity, observedAt),
    locations: [location],
    booking: loc.phone ? { via: "phone", phone: loc.phone, note: "Illustrative example; no real practice" } : { via: "none" },
    personal: personalOf(raw.personal),
    focusTags: declared(raw.tags, observedAt),
    credential: null,
    declared: { telehealth: true, capacity: true, languages: raw.languages.length > 0 },
    waitTimeText: raw.capacity === "closed" ? "Not taking new patients" : raw.waitlist_weeks !== undefined ? `${raw.waitlist_weeks} week${raw.waitlist_weeks === 1 ? "" : "s"}` : null,
    rooms: [{ id: location.id, name: loc.name, address: null, suburb: loc.suburb, state: "QLD", postcode: loc.postcode, lat: loc.lat, lng: loc.lng, phone: loc.phone ?? null, website: null }],
    sources: [source],
    publications: [],
  };
  if (raw.languages.length > 0) record.languages = declared(raw.languages, observedAt);
  // The communication labels that are also `manner` ids in the yaml are a declared manner, so
  // the order-quality verdict (which reads `manner`) sees them as Layer 2 does.
  const mannerIds = new Set(discipline.manner.map((m) => m.id));
  const manner = (record.personal?.communication ?? []).filter((id) => mannerIds.has(id));
  if (manner.length > 0) record.manner = declared(manner, observedAt);
  if (raw.conditions_sometimes?.length) record.conditionsSometimes = declared(raw.conditions_sometimes, observedAt);
  if (raw.waitlist_weeks !== undefined) record.waitlistWeeks = declared(raw.waitlist_weeks, observedAt);
  if (raw.referral_required !== undefined) record.referralRequired = declared(raw.referral_required, observedAt);
  if (raw.years_in_specialty !== undefined) record.yearsInSpecialty = declared(raw.years_in_specialty, observedAt);
  // Layer 2 reads `personal.labels` only: derive them here, at load, like the fixtures do.
  return withPersonalLabels(record, discipline) as DoctorRecord;
}

/** Every illustrative doctor, labelled for Layer 2. Empty when the file is absent. */
export function loadIllustrative(discipline: Discipline, root = process.cwd()): DoctorRecord[] {
  const file = path.join(root, "data", "illustrative", "doctors.json");
  if (!existsSync(file)) return [];
  const parsed = JSON.parse(readFileSync(file, "utf8")) as RawFile;
  const observedAt = parsed.observed_at ?? "2026-10-15";
  return parsed.doctors.map((raw) => {
    if (raw.personal?.status !== "illustrative") throw new Error(`illustrative: ${raw.id} must carry personal.status "illustrative"`);
    return toRecord(raw, observedAt, discipline);
  });
}
