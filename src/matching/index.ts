// The matching pipeline (PRD §8.1): sentence → intent → hard filters → tiered rank → order
// honesty → rationale. Written for the port on 2026-10-15 on top of the functions ported from
// adhd.me/src/matching and adhd.me/src/demo/clinicians.ts; the pipeline shape itself is PRD §8.
//
// Every number here is explainable from a declaration: the ranker holds no per-doctor
// coefficient, the evidence rows carry the tier of the declaration they rest on, and the order
// note says whether the order was earned.

import type { Clinician } from "./clinician";
import { evidenceFor, toClinician } from "./adapter";
import { clarifiers } from "./clarify";
import { hardAsks, isEmergency, lexiconFor, type Lexicon } from "./needs";
import {
  closedBooksNote,
  matchEvidence,
  matchQuality,
  missedAsks,
  nearestKm,
  orderNote,
  rankCliniciansNear,
  rankingProfile,
  needsFor,
  unservedNeeds,
} from "./rank";
import type { Discipline } from "@/src/disciplines/load";
import type { SuburbPoint } from "@/src/geo/suburbs";
import type { Doctor, Evidence, FilterReason, MatchResult, Place, Ranked } from "./types";

/** In-person reach: beyond this a doctor is out of reach unless they consult by telehealth. */
export const REACH_KM = 30;

/** How many results the screen shows. */
export const RESULTS_SHOWN = 3;

/**
 * What the screen shows instead of a list when the sentence carries an emergency cue. One
 * sentence, no ranking: a list of psychiatrists is the wrong answer to it.
 */
export const EMERGENCY_NOTE =
  "If you or someone else is in danger right now, call 000. Lifeline is on 13 11 14, any time.";

/** Patient-facing names for the hard-filter reasons, used in the unserved breakdown. */
export const FILTER_REASON_COPY: Record<FilterReason, string> = {
  "wrong-specialty": "a different specialty",
  "closed-books": "books that are closed",
  "wrong-age-group": "a different age group",
  "billing-mismatch": "bulk billing only",
  "no-telehealth": "telehealth only",
  "out-of-reach": `within ${REACH_KM} km`,
  "registration-not-current": "a current registration",
};

function originOf(place: Place | null | undefined): SuburbPoint | null {
  if (!place) return null;
  return { suburb: place.suburb, postcode: "", lat: place.lat, lon: place.lng };
}

/**
 * Hard filters, each with a named reason the UI can show (PRD §8.1.2). Population is not
 * filtered yet: the lexicon reads conditions, manner, constraints and languages, and a
 * population read lands with the next vocabulary pass.
 */
export function filterReason(
  doctor: Doctor,
  clinician: Clinician,
  discipline: Discipline,
  asks: { telehealthOnly: boolean; bulkBillingOnly: boolean },
  origin: SuburbPoint | null,
): FilterReason | null {
  if (doctor.specialty !== discipline.slug) return "wrong-specialty";
  if (doctor.register && doctor.register.status.value !== "registered") return "registration-not-current";
  if (doctor.capacity.value === "closed") return "closed-books";
  if (asks.bulkBillingOnly && doctor.billing.value !== "bulk-bills" && doctor.billing.value !== "bulk-bills-concession") return "billing-mismatch";
  if (asks.telehealthOnly && doctor.telehealth.value === "none") return "no-telehealth";
  if (origin && doctor.telehealth.value === "none") {
    const km = nearestKm(clinician, origin);
    if (km !== null && km > REACH_KM) return "out-of-reach";
  }
  return null;
}

/**
 * The card headline: "In common: <top shared concept>", and each card's headline must differ
 * from the others' or the next-best concept is used (PRD §8.1.5).
 */
function headlines(cards: ReadonlyArray<{ evidence: Evidence[] }>): string[] {
  const used = new Set<string>();
  return cards.map((card) => {
    const pick = card.evidence.find((item) => !used.has(item.label)) ?? card.evidence[0];
    if (!pick) return "Listed for this specialty";
    used.add(pick.label);
    return `In common: ${pick.label}`;
  });
}

export function match(
  sentence: string,
  place: Place | null | undefined,
  doctors: readonly Doctor[],
  discipline: Discipline,
  today: Date = new Date(),
): MatchResult {
  const lexicon: Lexicon = lexiconFor(discipline);

  if (isEmergency(sentence, lexicon)) {
    return {
      order: "unmatched",
      orderNote: EMERGENCY_NOTE,
      results: [],
      excluded: [],
      clarifiers: [],
      emergency: { note: EMERGENCY_NOTE },
    };
  }

  const origin = originOf(place);
  const asks = hardAsks(sentence, lexicon);
  const byId = new Map<string, Doctor>();
  const roster: Clinician[] = [];
  const excluded: MatchResult["excluded"] = [];
  for (const doctor of doctors) {
    const clinician = toClinician(doctor);
    const reason = filterReason(doctor, clinician, discipline, asks, origin);
    if (reason) {
      excluded.push({ doctor, reason });
      continue;
    }
    byId.set(clinician.id, doctor);
    roster.push(clinician);
  }

  if (roster.length === 0) {
    const counts = new Map<FilterReason, number>();
    for (const { reason } of excluded) counts.set(reason, (counts.get(reason) ?? 0) + 1);
    return {
      order: "unserved",
      orderNote: "Nobody listed today answers every part of what you asked for. That is a gap in our listing, not in what you asked for.",
      results: [],
      excluded,
      unserved: [...counts.entries()].map(([reason, restoreCount]) => ({ ask: FILTER_REASON_COPY[reason], restoreCount })),
      clarifiers: [],
    };
  }

  const order = matchQuality(sentence, roster, lexicon);
  const needs = needsFor(sentence, roster, lexicon);
  const ranked = rankCliniciansNear(sentence, origin, roster, today, lexicon);
  const top = ranked.slice(0, RESULTS_SHOWN);

  const cards = top.map((clinician) => {
    const doctor = byId.get(clinician.id)!;
    const profile = rankingProfile(clinician, needs);
    const evidence: Evidence[] = matchEvidence(clinician, sentence, roster, lexicon).map((need) => ({
      label: need.label,
      ...evidenceFor(doctor, need.facet),
    }));
    const missed: Evidence[] = missedAsks(clinician, sentence, roster, lexicon).map((need) => ({
      label: need.label,
      ...evidenceFor(doctor, need.facet),
    }));
    const closed = closedBooksNote(clinician, sentence, roster, lexicon);
    if (closed) evidence.push({ label: closed, kind: "capacity", tier: doctor.capacity.tier });
    const card: Omit<Ranked, "headline"> = {
      doctor,
      score: profile.weightedScore,
      tiers: { access: profile.constraintScore, fit: profile.careScore, manner: profile.mannerScore, coverage: profile.coverage },
      evidence,
      missed,
    };
    const km = origin && !clinician.telehealthFirstAppointment ? nearestKm(clinician, origin) : null;
    if (km !== null) card.distanceKm = Math.round(km * 10) / 10;
    return card;
  });
  const titles = headlines(cards.map((card) => ({ evidence: card.evidence.filter((item) => item.kind !== "capacity") })));
  const results: Ranked[] = cards.map((card, index) => ({ ...card, headline: titles[index]! }));

  const result: MatchResult = {
    order,
    orderNote: orderNote(sentence, roster, { nearest: origin !== null, lexicon }),
    results,
    excluded,
    clarifiers: clarifiers(sentence, roster, 3, lexicon).map((clarifier) => ({
      facet: clarifier.facetKey,
      question: clarifier.prompt,
      options: [clarifier.answer],
    })),
  };
  if (order === "unserved") {
    result.unserved = unservedNeeds(sentence, roster, lexicon).map((need) => ({ ask: need.label, restoreCount: 0 }));
  }
  return result;
}
