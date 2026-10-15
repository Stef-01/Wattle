// Ported from adhd.me/src/matching/clarify.ts on 2026-10-15.
//
// W225: the one question worth asking when the words did not separate anybody.
//
// A question earns its place only if the answer CHANGES THE ORDER. So the candidates are exactly
// the facets on which the current roster DISAGREES: some clinicians declare them, some do not.
// A facet everybody holds cannot separate anybody; a facet nobody holds cannot either.
//
// IT ASKS, IT DOES NOT INFER. The answer is appended to what the reader said, in their own words,
// and the whole thing is re-read by the same `readNeeds`. Nothing here writes a facet directly.
//
// WHAT CHANGED IN THE PORT. ADHD.ME hand-wrote a prompt and an answer per facet. The discipline
// yaml carries labels and cues but no prompts, so care and manner prompts are COMPOSED from the
// label and the answer is the facet's first authored cue — which is what guarantees the
// re-read reaches the facet the question was about (the O7 self-reach pin). The three access
// prompts keep ADHD.ME's wording.

import type { Clinician } from "./clinician";
import { requestSuggests } from "./clarifier-relevance";
import { defaultLexicon, facetKey, holdsPreference, readNeeds, type Facet, type Lexicon, type Preference } from "./needs";

/**
 * A question, and the words that answering it adds to the request.
 *
 * `answer` is phrased as the READER would say it, because it is appended to their sentence and
 * then re-read.
 */
export type Clarifier = {
  facetKey: string;
  /** Asked in the second person, because the reader is the one answering. */
  prompt: string;
  /** Appended verbatim to the request when the reader says yes. */
  answer: string;
  /** How many of the roster declare it. Shown in the console, never to a patient. */
  heldBy: number;
};

export type PromptCopy = { prompt: string; answer: string };

function lowerLabel(label: string): string {
  const firstWord = label.split(/[\s-]/)[0] ?? "";
  if (firstWord.length > 1 && firstWord === firstWord.toUpperCase()) return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
}

/** Care facets asked as a question a patient can answer without knowing the vocabulary. */
export function carePrompts(lexicon: Lexicon = defaultLexicon()): Record<string, PromptCopy> {
  const out: Record<string, PromptCopy> = {};
  for (const group of lexicon.discipline.conditions) {
    const cue = group.cues[0]!;
    out[`care:${group.id}`] = {
      prompt: `Is ${lowerLabel(group.label)} part of this?`,
      answer: `I want help with ${cue}`,
    };
  }
  return out;
}

/** Manner facets, asked the same way. The label is the clinician's claim; this is the reader's ask. */
export function mannerPrompts(lexicon: Lexicon = defaultLexicon()): Record<string, PromptCopy> {
  const out: Record<string, PromptCopy> = {};
  for (const group of lexicon.discipline.manner) {
    const cue = group.cues[0]!;
    out[`manner:${group.id}`] = {
      prompt: `Would a ${lowerLabel(group.label)} manner matter most?`,
      answer: `I want someone ${cue}`,
    };
  }
  return out;
}

/**
 * Access preferences, asked the same way (O5/F7). `pref:longer-appointment` is deliberately not
 * here: an "unhurried" manner would ask that question in its own words.
 */
export const PREF_PROMPTS: Record<string, PromptCopy> = {
  "pref:woman-gp": {
    prompt: "Would you rather see a woman clinician?",
    answer: "I would prefer a woman doctor",
  },
  "pref:telehealth-first": {
    prompt: "Would you rather the first appointment was by phone or video?",
    answer: "I want the first appointment by phone",
  },
  "pref:bulk-billing": {
    prompt: "Does the appointment need to be bulk billed?",
    answer: "it needs to be bulk billed",
  },
};

/** The preferences a clarifier may ask about. Derived from the prompt table, never wider. */
const ASKABLE_PREFERENCES: readonly Preference[] = ["woman-gp", "telehealth-first", "bulk-billing"];

/** Every prompt table, keyed by facet, for the lexicon in use. */
export function promptTables(lexicon: Lexicon = defaultLexicon()): Record<string, PromptCopy> {
  return { ...carePrompts(lexicon), ...mannerPrompts(lexicon), ...PREF_PROMPTS };
}

function promptFor(key: string, lexicon: Lexicon): PromptCopy | null {
  return promptTables(lexicon)[key] ?? null;
}

/**
 * Every facet a clinician declares or verifiably holds, as keys. A "sometimes" declaration
 * answers an ask at half weight (O2), so a question about it can still reorder the roster.
 * Held preferences count as declarations, and a preference nobody holds is never asked about.
 */
export function declaredKeys(clinician: Clinician): Set<string> {
  return new Set<string>([
    ...clinician.careAreas.map((area) => facetKey({ kind: "care", area } as Facet)),
    ...(clinician.careAreasSometimes ?? []).map((area) => facetKey({ kind: "care", area } as Facet)),
    ...clinician.manner.map((trait) => facetKey({ kind: "manner", trait } as Facet)),
    ...ASKABLE_PREFERENCES.filter((preference) => holdsPreference(clinician, preference)).map(
      (preference) => `pref:${preference}`,
    ),
  ]);
}

/**
 * Up to `limit` questions whose answers would actually reorder this roster.
 *
 * Ordered by how evenly the roster splits on them, then selected greedily on the holder
 * signature so the offered set spans the roster rather than three words for one reordering
 * (O33). The relevance gate (M10): a candidate must co-occur in the corpus with something the
 * reader actually said, unless the request reached nothing at all.
 */
export function clarifiers(query: string, roster: readonly Clinician[], limit = 3, lexicon: Lexicon = defaultLexicon()): Clarifier[] {
  // THE ROSTER ARGUMENT MUST BE THE LIST THE READER IS LOOKING AT (O7/F10).
  if (roster.length < 2) return [];

  const alreadyAsked = new Set(readNeeds(query, lexicon).map((need) => facetKey(need.facet)));
  const declared = roster.map(declaredKeys);
  const keys = new Set(declared.flatMap((set) => [...set]));
  const reachedKeys = [...alreadyAsked];

  const ranked = [...keys]
    .filter((key) => !alreadyAsked.has(key))
    .filter((key) => reachedKeys.length === 0 || requestSuggests(reachedKeys, key))
    .map((key) => ({ key, heldBy: declared.filter((set) => set.has(key)).length }))
    // Splits the roster: somebody has it, somebody does not. Anything else cannot reorder.
    .filter((entry) => entry.heldBy > 0 && entry.heldBy < roster.length)
    .map((entry) => {
      const copy = promptFor(entry.key, lexicon);
      return copy ? { facetKey: entry.key, heldBy: entry.heldBy, ...copy } : null;
    })
    .filter((entry): entry is Clarifier => entry !== null)
    /* M10: a candidate whose ANSWER re-reads to any facet the reader already stated is a
       repeat wearing different words. */
    .filter((entry) => readNeeds(entry.answer, lexicon).every((need) => !alreadyAsked.has(facetKey(need.facet))))
    .sort((a, b) => {
      const evenness = (n: number) => Math.abs(n / roster.length - 0.5);
      return evenness(a.heldBy) - evenness(b.heldBy) || a.facetKey.localeCompare(b.facetKey);
    });

  const signatureOf = (entry: Clarifier) =>
    declared.map((set) => (set.has(entry.facetKey) ? "1" : "0")).join("");
  const picked: Clarifier[] = [];
  const usedSignatures = new Set<string>();
  for (const entry of ranked) {
    if (picked.length >= limit) break;
    if (!usedSignatures.has(signatureOf(entry))) {
      picked.push(entry);
      usedSignatures.add(signatureOf(entry));
    }
  }
  for (const entry of ranked) {
    if (picked.length >= limit) break;
    if (!picked.includes(entry)) picked.push(entry);
  }
  return picked;
}

/** Human-readable labels, so the console can show which facet a question is about. */
export function facetLabel(key: string, lexicon: Lexicon = defaultLexicon()): string {
  const entry = lexicon.entries.find((e) => facetKey(e.facet) === key);
  return entry ? entry.label : key;
}
