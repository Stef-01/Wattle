// Layer 2: human compatibility (writing-block.md Task 6). Written on 2026-10-15.
//
// RE-RANKS ONLY THE LAYER-1 SURVIVORS, AND ONLY INSIDE A CLINICAL BAND. A band is the tier
// vector rank.ts actually sorts on (constraint coverage and score, care score, manner score,
// coverage, capacity grade); two doctors in different bands keep their Layer-1 order whatever
// their human fit says. `rerank` is the one entry point, and it is pure in the results, the
// intent and the weights, so a surface can let a patient move the sliders without re-searching.
//
// MISSING DATA IS NEUTRAL. A doctor with no personal profile scores 0 with the reason "No
// personal profile yet"; a doctor WITH a profile that aligns with nothing also scores 0. Inside
// a band, equal scores fall back to the Layer-1 position, so a missing profile never ranks
// below a present one unless the present one actually matches (property-tested).
//
// EVERY REASON NAMES ITS FIELD. The explanation is lexical overlap between the patient's
// closed human-fit labels and the doctor's closed labels (declared communication, labels
// derived from their philosophy at build time, declared manner), plus the PRESENCE of lived
// experience, research topics, clinical interests and enjoyed populations. Nothing is inferred
// from a portrait, a name or a free-text sentence at request time.

import type { Discipline } from "@/src/disciplines/load";
import { humanFitLabel } from "./human-fit";
import { lexiconForSlug } from "./needs";
import type { Doctor, HumanFit, Intent, Observed, PersonalProfile, Population, Ranked, Reason } from "./types";

/** What matters most, as the patient sets it. Each is a multiplier on that signal's reasons. */
export interface HumanFitWeights {
  /** Alignment between the patient's preference labels and the doctor's communication/philosophy labels. */
  philosophy: number;
  /** The doctor volunteered lived experience and the patient asked for it. */
  livedExperience: number;
  /** Research topics on the asked conditions, or research activity when asked for. */
  research: number;
  /** Documented clinical interests on the asked conditions. */
  clinicalInterests: number;
  /** The doctor says they enjoy serving the asked population or condition. */
  populations: number;
}

export const DEFAULT_WEIGHTS: Readonly<HumanFitWeights> = Object.freeze({
  philosophy: 1,
  livedExperience: 1,
  research: 1,
  clinicalInterests: 1,
  populations: 1,
});

/** Every weight zero: Layer 2 then reproduces the Layer-1 order exactly. */
export const ZERO_WEIGHTS: Readonly<HumanFitWeights> = Object.freeze({
  philosophy: 0,
  livedExperience: 0,
  research: 0,
  clinicalInterests: 0,
  populations: 0,
});

export const NO_PROFILE_REASON = "No personal profile yet";

/**
 * Weights as a surface may send them: any subset of the keys above, plus the data layer's
 * shorter names (`communication` -> philosophy, `lived` -> livedExperience). `clinical` has no
 * Layer-2 meaning (clinical fit is Layer 1's band, which this layer never crosses) and is
 * ignored. Missing or non-numeric values read as the default.
 */
export type WeightsInput = Partial<HumanFitWeights> & { communication?: number; lived?: number; clinical?: number };

export function normaliseWeights(input: Readonly<WeightsInput> | undefined): HumanFitWeights {
  const pick = (...values: (number | undefined)[]): number | undefined =>
    values.find((value) => typeof value === "number" && Number.isFinite(value));
  const w = input ?? {};
  return {
    philosophy: pick(w.philosophy, w.communication) ?? DEFAULT_WEIGHTS.philosophy,
    livedExperience: pick(w.livedExperience, w.lived) ?? DEFAULT_WEIGHTS.livedExperience,
    research: pick(w.research) ?? DEFAULT_WEIGHTS.research,
    clinicalInterests: pick(w.clinicalInterests) ?? DEFAULT_WEIGHTS.clinicalInterests,
    populations: pick(w.populations) ?? DEFAULT_WEIGHTS.populations,
  };
}

/** A list field that may arrive bare or Observed-wrapped. */
function listOf(field: Observed<string[]> | string[] | undefined): { values: string[]; tier?: Observed<string[]>["tier"] } {
  if (!field) return { values: [] };
  if (Array.isArray(field)) return { values: field };
  return { values: field.value, tier: field.tier };
}

function present(value: string | string[] | undefined): boolean {
  if (value === undefined) return false;
  return Array.isArray(value) ? value.length > 0 : value.trim().length > 0;
}

/** The profile Layer 2 may read: a draft has no consent yet and reads as no profile. */
function published(doctor: Doctor): PersonalProfile | undefined {
  const personal = doctor.personal;
  return personal && personal.status !== "draft" ? personal : undefined;
}

const POPULATION_WORDS: Readonly<Record<Population, string>> = {
  infant: "infants",
  child: "children",
  adolescent: "adolescents",
  adult: "adults",
  "older-adult": "older adults",
  perinatal: "new and expecting parents",
};

function conditionLabel(id: string, discipline: Discipline): string {
  return discipline.conditions.find((condition) => condition.id === id)?.label ?? id;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** The human-fit verdict for one doctor against one intent, under the given weights. */
export function humanFitFor(doctor: Doctor, intent: Intent, weightsInput: Readonly<WeightsInput>, discipline: Discipline): HumanFit {
  const weights = normaliseWeights(weightsInput);
  const personal = published(doctor);
  const research = listOf(doctor.researchTopics);
  const clinical = listOf(doctor.clinicalInterests);
  const reasons: Reason[] = [];
  let score = 0;
  const add = (reason: Reason, weight: number) => {
    if (weight <= 0) return;
    reasons.push(reason);
    score += weight;
  };

  // 1. Label overlap: the patient's labels against the doctor's declared and derived labels.
  const communication = new Set(personal?.communication ?? []);
  const derived = new Set(personal?.labels ?? []);
  const manner = new Set(doctor.manner?.value ?? []);
  for (const id of intent.humanFit ?? []) {
    const label = humanFitLabel(id, discipline);
    if (id === "lived-experience") {
      if (personal && present(personal.livedExperience)) {
        add({ text: "Shares lived experience they chose to disclose", field: "personal.livedExperience" }, weights.livedExperience);
      }
      continue;
    }
    if (id === "research-active") {
      if (research.values.length > 0) {
        add({ text: "Has published research", field: "researchTopics", ...(research.tier ? { tier: research.tier } : {}) }, weights.research);
      }
      continue;
    }
    if (communication.has(id)) {
      add({ text: `Describes their approach as ${label.toLowerCase()}`, field: "personal.communication", label: id }, weights.philosophy);
    } else if (derived.has(id)) {
      add({ text: `Their philosophy of care reads as ${label.toLowerCase()}`, field: "personal.labels", label: id }, weights.philosophy);
    } else if (manner.has(id)) {
      add({ text: `Declares a ${label.toLowerCase()} manner`, field: "manner", label: id, tier: doctor.manner!.tier }, weights.philosophy);
    }
  }

  // 2. Research alignment on the asked conditions (never read as better outcomes).
  for (const id of intent.conditions) {
    if (research.values.includes(id)) {
      add({ text: `Has published on ${conditionLabel(id, discipline).toLowerCase()}`, field: "researchTopics", label: id, ...(research.tier ? { tier: research.tier } : {}) }, weights.research);
    }
  }

  // 3. Documented clinical interests on the asked conditions.
  for (const id of intent.conditions) {
    if (clinical.values.includes(id)) {
      add({ text: `Lists ${conditionLabel(id, discipline).toLowerCase()} among their clinical interests`, field: "clinicalInterests", label: id, ...(clinical.tier ? { tier: clinical.tier } : {}) }, weights.clinicalInterests);
    }
  }

  // 4. Populations and concerns the doctor reports enjoying serving.
  const enjoys = personal?.enjoysServing ?? [];
  if (intent.population && enjoys.includes(intent.population)) {
    add({ text: `Says they particularly enjoy working with ${POPULATION_WORDS[intent.population]}`, field: "personal.enjoysServing", label: intent.population }, weights.populations);
  }
  for (const id of intent.conditions) {
    if (enjoys.includes(id)) {
      add({ text: `Says they particularly enjoy helping with ${conditionLabel(id, discipline).toLowerCase()}`, field: "personal.enjoysServing", label: id }, weights.populations);
    }
  }

  const basis: HumanFit["basis"] = personal && personal.status !== "draft" ? personal.status : "none";
  if (!personal && reasons.length === 0) reasons.push({ text: NO_PROFILE_REASON, field: "personal" });
  return { score: round(score), reasons, basis };
}

/**
 * The Layer-2 order: within each Layer-1 band, higher human fit first, ties by Layer-1
 * position. Bands are read from `layer1.band` on each result and never crossed. Headlines are
 * not touched; `shown()` in index.ts re-derives them for the slice a screen displays.
 */
export function rerank(results: readonly Ranked[], intent: Intent, weights: Readonly<WeightsInput> = DEFAULT_WEIGHTS, discipline?: Discipline): Ranked[] {
  const vocabulary = discipline ?? lexiconForSlug(intent.discipline ?? "mvp").discipline;
  const scored = results.map((result) => ({ ...result, humanFit: humanFitFor(result.doctor, intent, weights, vocabulary) }));
  const groups = new Map<string, Ranked[]>();
  const order: string[] = [];
  for (const result of scored) {
    const key = result.layer1.band;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(result);
  }
  return order.flatMap((key) =>
    [...groups.get(key)!].sort((a, b) => b.humanFit.score - a.humanFit.score || a.layer1.position - b.layer1.position),
  );
}
