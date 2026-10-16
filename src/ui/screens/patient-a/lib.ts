// Shared logic for the Figma patient screens P01–P05 (file NEbiukDE3TyWFptwaCBhwV).
// Everything shown comes from the match response: closed-vocabulary reasons, declared facts,
// and the chips the sentence reached. Nothing here invents a fee, a year count or a photo.
import type { Card, Chip, SearchRequest, SearchResponse } from "@/src/data/search-types";
import type { DoctorRecord } from "@/src/data/types";
import { getRequest, newRequestId, pushRecent, setRequest, type StoredRequest } from "@/src/ui/store";

export const DEFAULT_SUBURB = "Brisbane";
export const REACH_KM = 20;

/** The three "Try" examples on P02. Each one returns three documented matches on the roster. */
export const EXAMPLES = ["Endometriosis, someone who listens", "A psychiatrist for my anxious teenager", "Pelvic pain, telehealth"];

export async function runMatch(input: { sentence: string; suburb?: string; removed?: string[]; anywhere?: boolean; id?: string }): Promise<StoredRequest> {
  const suburb = input.anywhere ? "" : (input.suburb ?? DEFAULT_SUBURB);
  const body: SearchRequest = { sentence: input.sentence, suburb, removed: input.removed ?? [] };
  const res = await fetch("/api/match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`match ${res.status}`);
  const response = (await res.json()) as SearchResponse;
  const req: StoredRequest = {
    id: input.id ?? newRequestId(),
    sentence: input.sentence,
    suburb: input.suburb ?? DEFAULT_SUBURB,
    removed: input.removed ?? [],
    response,
    at: new Date().toISOString(),
  };
  if (input.anywhere) req.anywhere = true;
  setRequest(req);
  pushRecent({ id: req.id, label: recentLabel(req), matches: response.cards.length, at: req.at });
  return req;
}

/** "Endometriosis, Brisbane": the first condition chip (else the sentence) plus the place. */
export function recentLabel(req: Pick<StoredRequest, "sentence" | "suburb" | "response">): string {
  const condition = req.response.chips.find((c) => c.kind === "condition")?.label;
  const head = condition ?? req.sentence.trim().replace(/\s+/g, " ").slice(0, 32);
  return `${head}, ${req.response.place.suburb?.replace(/ City$/, "") ?? req.suburb}`;
}

export const requestById = (id: string) => getRequest(id);

/* -------------------------------------------------------------- pills (P03) */

export interface HeardPill {
  id: string;
  label: string;
  /** Dark pill: a must-have the engine filters on. Light: a preference it ranks on. */
  must: boolean;
  /** Toggling it off re-runs the search without it. */
  removable: boolean;
}

const PLACE_PILL = "place";

/** Must-haves are what Layer 1 filters on: conditions, specialties, populations, mandatory constraints. */
export function heardPills(req: StoredRequest): HeardPill[] {
  const out: HeardPill[] = [];
  const chips: Chip[] = req.response.chips;
  const must = (c: Chip) => c.kind === "condition" || c.kind === "specialty" || c.kind === "must" || c.kind === "population";
  for (const c of chips.filter(must)) out.push({ id: c.id, label: c.kind === "population" ? titleCase(c.label) : c.label, must: true, removable: c.removable });
  for (const c of chips.filter((c) => !must(c))) out.push({ id: c.id, label: titleCase(c.label), must: false, removable: c.removable });
  const place = req.response.place.suburb;
  if (place && !req.anywhere) out.push({ id: PLACE_PILL, label: `${place.replace(/ City$/, "")}, ${REACH_KM} km`, must: false, removable: true });
  return out;
}

/** Re-run the same sentence without one pill. */
export async function withoutPill(req: StoredRequest, pillId: string): Promise<StoredRequest> {
  if (pillId === PLACE_PILL) return runMatch({ sentence: req.sentence, suburb: req.suburb, removed: req.removed, anywhere: true, id: req.id });
  return runMatch({ sentence: req.sentence, suburb: req.suburb, removed: [...req.removed, pillId], anywhere: req.anywhere, id: req.id });
}

/* ------------------------------------------------------------- facts (P04/P05) */

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const idLabel = (id: string) => id.replace(/-/g, " ");

/** The nearest room's suburb (geocoded first), else the first room. */
export function suburbOf(card: Card): string | null {
  const d = card.doctor;
  return d.locations[0]?.suburb ?? d.rooms[0]?.suburb ?? null;
}

/** "{suburb}, Brisbane" inside the reach; the state otherwise, since the roster is Queensland-wide. */
export function placeLine(card: Card): string | null {
  const suburb = suburbOf(card);
  if (!suburb) return null;
  const inBrisbane = card.distanceKm !== undefined && card.distanceKm <= REACH_KM;
  return `${suburb}, ${inBrisbane ? "Brisbane" : (card.doctor.rooms[0]?.state ?? "QLD")}`;
}

/** Declared or found fee, never invented. */
export function feeOf(d: DoctorRecord): string | null {
  const fee = d.fees?.value?.[0];
  if (!fee) return null;
  return `$${Math.round(fee.amountCents / 100)}`;
}

export const yearsOf = (d: DoctorRecord): number | null => d.yearsInSpecialty?.value ?? null;
export const hasTelehealth = (d: DoctorRecord): boolean => d.telehealth.value !== "none";
export const needsReferral = (d: DoctorRecord): boolean => d.referralRequired?.value === true;

/** "Declares X as a condition they see" → "Focuses on X." Other reasons keep their closed wording. */
function clinicalSentences(card: Card): string[] {
  return card.clinicalFit.reasons.map((r) => {
    const m = /^Declares (.+) as a condition they see$/.exec(r);
    if (m) return `Focuses on ${m[1]!.toLowerCase()}.`;
    return r.endsWith(".") ? r : `${r}.`;
  });
}

/** Human-fit reasons only when a profile backs them; "no profile yet" is neutral, not a sentence. */
function humanSentences(card: Card): string[] {
  if (card.humanFit.basis === "none") return [];
  return card.humanFit.reasons.map((r) => (r.endsWith(".") ? r : `${r}.`));
}

/** "Lists pelvic pain and adolescent gynaecology." from the doctor's other declared conditions. */
function listsSentence(card: Card, max = 3): string | null {
  const focused = new Set(card.clinicalFit.reasons.map((r) => /^Declares (.+) as a condition they see$/.exec(r)?.[1]?.toLowerCase()).filter(Boolean));
  const others = card.doctor.conditions.value.map(idLabel).filter((l) => !focused.has(l)).slice(0, max);
  if (others.length === 0) return null;
  const joined = others.length === 1 ? others[0]! : `${others.slice(0, -1).join(", ")} and ${others[others.length - 1]}`;
  return `Lists ${joined}.`;
}

/** P04 paragraph: clinical reasons, the other listed conditions, then any profile-backed human-fit reasons. */
export function paragraphFor(card: Card): string {
  const parts = [...clinicalSentences(card)];
  const lists = listsSentence(card);
  if (lists) parts.push(lists);
  parts.push(...humanSentences(card));
  return parts.join(" ");
}

/** P05 one line under each card: the first clinical reason and the first human reason. */
export function lineFor(card: Card): string {
  const parts = [clinicalSentences(card)[0], humanSentences(card)[0] ?? listsSentence(card, 2)].filter((p): p is string => Boolean(p));
  return parts.join(" ");
}

export function familyOf(d: DoctorRecord): string {
  return d.name.family || d.name.display;
}

/** Counts for the P05 empty state, from what the engine said each dropped filter would restore. */
export function restoreCounts(res: SearchResponse): { widen: number | null; telehealth: number | null } {
  const find = (re: RegExp) => res.unserved?.find((u) => re.test(u.ask))?.restoreCount ?? null;
  return { widen: find(/\bkm\b/i), telehealth: find(/telehealth/i) };
}
