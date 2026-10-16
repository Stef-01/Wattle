// The human-fit lexicon: the discipline yaml's `human_fit` groups read through the SAME ported
// ADHD.ME reader as every other cue (needs.ts), so "won't just dismiss how I'm feeling" is heard
// with the same negation, hedge and collapse rules as a condition. Written on 2026-10-15 for
// plan Task 6 (subjective preferences extracted from the sentence).
//
// WHY A SECOND LEXICON RATHER THAN MORE MANNER ENTRIES. Layer 1's manner tier moves a doctor
// across clinical bands (rank.ts sorts on it). A human-fit label must never do that — Layer 2
// only reorders inside a band — so the two vocabularies are read separately and the human-fit
// read is never handed to the ranker. The yaml may list the same id in both (`collaborative`),
// and then the declared manner is one of the evidence sources Layer 2 reads.

import type { Discipline } from "@/src/disciplines/load";
import { buildLexicon, readNeeds, type Lexicon } from "./needs";
import { collapsedCueSatisfied, findCue, tokenise, tokeniseKeepingStopwords } from "./read";

const HUMAN_FIT_LEXICONS = new WeakMap<Discipline, Lexicon>();

/**
 * A lexicon whose only facets are the yaml's `human_fit` groups, built once per discipline.
 * The generic access entries (a woman clinician, telehealth, ...) are still present in it, so
 * they claim their own words; `readHumanFit` keeps the manner-kind signals only.
 */
export function humanFitLexicon(discipline: Discipline): Lexicon {
  let lexicon = HUMAN_FIT_LEXICONS.get(discipline);
  if (!lexicon) {
    lexicon = buildLexicon({
      ...discipline,
      conditions: [],
      manner: discipline.humanFit,
      constraints: {},
      refusedCues: [],
      languages: {},
    });
    HUMAN_FIT_LEXICONS.set(discipline, lexicon);
  }
  return lexicon;
}

/** The human-fit label ids the text reaches, in the order the yaml declares them. */
export function readHumanFit(text: string, discipline: Discipline): string[] {
  if (discipline.humanFit.length === 0) return [];
  const reached = new Set<string>();
  for (const signal of readNeeds(text, humanFitLexicon(discipline))) {
    if (signal.facet.kind === "manner") reached.add(signal.facet.trait);
  }
  return discipline.humanFit.map((group) => group.id).filter((id) => reached.has(id));
}

/**
 * Whether one authored phrase is present in a text, through the lexicon's tokeniser and under
 * the reader's collapse rule (O45): a multi-word phrase that ships as one content token ("this
 * week" as [week], "live with" as [live]) fires only when the raw stream carries an adjacent
 * authored pair, so "every week" and "their own lives" do not read as it. Used wherever a yaml
 * or authored list is read outside the lexicon's own claiming pass.
 */
export function phrasePresent(text: string, phrase: string): boolean {
  const tokens = tokenise(phrase);
  if (tokens.length === 0) return false;
  const collapsed = phrase.trim().split(/\s+/).length >= 2 && tokens.length <= 1;
  if (collapsed && !collapsedCueSatisfied(tokeniseKeepingStopwords(text), tokeniseKeepingStopwords(phrase))) return false;
  return findCue(tokenise(text), tokens) !== null;
}

/** The closed label for a human-fit id, or the id itself when the yaml does not declare it. */
export function humanFitLabel(id: string, discipline: Discipline): string {
  return discipline.humanFit.find((group) => group.id === id)?.label ?? id;
}
