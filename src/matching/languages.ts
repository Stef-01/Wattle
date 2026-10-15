// Ported from adhd.me/src/matching/languages.ts on 2026-10-15.
//
// ADHD.ME held a fixed list of ten languages the onboarding interview could declare. Wattle's
// language vocabulary is the discipline yaml's `languages.cues` keys, so the list is derived
// from the lexicon rather than authored here; the roster's own declarations are unioned in by
// `needsFor`, exactly as before.

import { defaultLexicon, type Lexicon } from "./needs";

function titleCase(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

/** The languages the discipline can hear a reader ask for, title-cased as a roster declares them. */
export function matchableLanguages(lexicon: Lexicon = defaultLexicon()): readonly string[] {
  return [...lexicon.languageCues.keys()].map(titleCase).sort();
}
