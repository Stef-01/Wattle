// Ported from adhd.me/src/matching/provenance.ts on 2026-10-15.
//
// O101 (year plan "Explaining the fit", Q1): the console's provenance panel — every sentence a
// patient can be shown about a clinician, and the DECLARED field it came from. The point is the
// `from` column: a surface that cannot name the declaration behind a sentence is a surface
// making a claim of its own, which W193 forbids.
//
// WHAT CHANGED IN THE PORT: the care and manner labels come from the discipline lexicon rather
// than ADHD.ME's onboarding tables, and the title/pronouns/summary/NSW-training lines read
// fields the ported `Clinician` does not carry, so they are not here.

import type { Clinician } from "./clinician";
import { closedBooksNote, distanceTo, getPersonalizedMatch, locationLabel, missedAskCopy, rosterNoun, unservedCopy } from "./rank";
import { careAreaLabels, defaultLexicon, facetKey, holdsPreference, mannerLabels, type Lexicon, type MannerTrait, type Preference } from "./needs";

export type ToldLine = {
  /** What the patient sees. */
  said: string;
  /** The declared field it came from. */
  from: string;
  /** The facet key, for lines that are facets. */
  key?: string;
};

const PREFERENCE_LABELS: Readonly<Record<Preference, string>> = {
  "woman-gp": "A woman clinician",
  "man-gp": "A man clinician",
  "telehealth-first": "By phone or telehealth",
  "bulk-billing": "Bulk billing",
  "longer-appointment": "A longer first appointment",
};

const PREFERENCE_SOURCE: Readonly<Record<Preference, string>> = {
  "woman-gp": "gender",
  "man-gp": "gender",
  "telehealth-first": "telehealthFirstAppointment",
  "bulk-billing": "practicalSignals",
  "longer-appointment": "manner (unhurried)",
};

/** Every facet this clinician can be matched on, each with the field it was declared in. */
export function reasonsPatientsCanSee(clinician: Clinician, lexicon: Lexicon = defaultLexicon()): ToldLine[] {
  const careLabel = new Map(careAreaLabels(lexicon).map((entry) => [entry.id, entry.label]));
  const mannerLabel = new Map(mannerLabels(lexicon).map((entry) => [entry.id, entry.label]));
  const lines: ToldLine[] = [];
  for (const area of clinician.careAreas) {
    lines.push({ said: careLabel.get(area) ?? area, from: "careAreas", key: `care:${area}` });
  }
  for (const area of clinician.careAreasSometimes ?? []) {
    if (clinician.careAreas.includes(area)) continue;
    lines.push({
      said: careLabel.get(area) ?? area,
      from: "careAreasSometimes (answers at half weight)",
      key: `care:${area}`,
    });
  }
  for (const trait of clinician.manner) {
    lines.push({
      said: mannerLabel.get(trait) ?? trait,
      from: "manner",
      key: facetKey({ kind: "manner", trait: trait as MannerTrait }),
    });
  }
  for (const language of clinician.languages) {
    if (language.toLowerCase() === "english") continue;
    lines.push({ said: `${language}-speaking`, from: "languages", key: `language:${language.toLowerCase()}` });
  }
  for (const preference of Object.keys(PREFERENCE_LABELS) as Preference[]) {
    if (!holdsPreference(clinician, preference)) continue;
    lines.push({ said: PREFERENCE_LABELS[preference], from: PREFERENCE_SOURCE[preference], key: `pref:${preference}` });
  }
  return lines;
}

/** The composed sentences a patient reads on the row and the profile, with their sources. */
export function sentencesPatientsSee(clinician: Clinician, roster: readonly Clinician[] = [clinician], lexicon: Lexicon = defaultLexicon()): ToldLine[] {
  const lines: ToldLine[] = [];
  const declared = reasonsPatientsCanSee(clinician, lexicon);

  const example = declared.length > 0 ? declared[0]!.said.toLowerCase() : "";
  lines.push({
    said: getPersonalizedMatch(clinician, example, roster, lexicon).reason,
    from: "the reason line, from getPersonalizedMatch — closed vocabulary only (W213)",
  });

  lines.push({
    said: `${clinician.practice} · ${locationLabel(clinician)}`,
    from: "practice, suburb and alsoConsultsAt",
  });

  const distance = distanceTo(clinician, null);
  lines.push({ said: distance ?? clinician.reach, from: "reach (the distance line reads from the suburb a patient gives)" });

  const closed = closedBooksNote(clinician, example, roster, lexicon);
  if (closed) lines.push({ said: closed, from: "acceptingNewPatients + capacityDeclaredAt" });

  return lines;
}

/** The two "not declared" sentences, framed on a facet this clinician has not declared. */
export function notDeclaredFrames(clinician: Clinician, roster: readonly Clinician[] = [clinician], lexicon: Lexicon = defaultLexicon()): ToldLine[] {
  const held = new Set(reasonsPatientsCanSee(clinician, lexicon).map((line) => line.key));
  const areas = careAreaLabels(lexicon);
  const missing = areas.find((entry) => !held.has(`care:${entry.id}`));
  const label = missing ? missing.label : "an area you have not declared";
  return [
    {
      said: missedAskCopy({
        facet: { kind: "care", area: missing ? missing.id : areas[0]?.id ?? "" },
        matched: "",
        label,
        weight: 0,
      }),
      from: "the profile's missed-asks line (O51), shown for any facet this clinician has not declared",
    },
    {
      said: unservedCopy(label, rosterNoun(roster).one),
      from: "the results line (O110), shown only when NOBODY listed declares it",
    },
  ];
}
