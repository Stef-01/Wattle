// Ported from adhd.me/src/matching/needs.ts on 2026-10-15.
//
// W221: one lexicon, read once, used by both the ranking and the explanation.
//
// WHAT IT IS. A phrase → facet map, owned centrally rather than per clinician. A clinician
// declares facets; a patient's words are read into facets; the score is the overlap. Adding a
// doctor is a declaration, not a code change.
//
// THE CONSTRAINT THAT SHAPES EVERY LINE OF THIS FILE: this reads a PREFERENCE ABOUT CARE, never
// a clinical fact about the person. "I drink more than I should" is not read as a substance-use
// finding; it is read as *this person wants that conversation held safely*. Where a phrase could
// be read either way, THE PREFERENCE READING IS TAKEN. Every label is the closed-vocabulary
// phrase a surface may say back (PRD §4.6), never the patient's own words.
//
// WHAT CHANGED IN THE PORT. ADHD.ME's lexicon was a hand-authored table in this file, keyed to
// the ADHD `CareArea` union and the `EI_QUALITIES` manner vocabulary. Wattle Health serves
// several specialties, so the WORD LISTS now come from `disciplines/<slug>.yaml` through
// `loadDiscipline` — `conditions[].cues` become care entries, `manner[].cues` manner entries,
// `constraints` the access preferences, `languages.cues` the language vocabulary, and
// `refused_cues` / `emergency_cues` are applied as described below. The MECHANICS are unchanged:
// first-claim ownership of a phrase, most-specific-first cue order, ordered-subsequence
// matching over stemmed tokens, the collapse-aware pair rule, the raw-run demand, hedges,
// on-behalf, bare-negator refusals, consume-once desire negation, position claiming. The four
// generic ADHD.ME entries (a woman clinician, telehealth, bulk billing, a longer appointment)
// keep their authored phrase lists, merged with whatever the yaml adds under `constraints`.

import { loadDiscipline, type Discipline } from "@/src/disciplines/load";
import {
  bareNegatorBefore,
  collapsedCueRunPresent,
  collapsedCueSatisfied,
  commaBreaksBefore,
  findCue,
  isTightNegator,
  lackingNotDeclining,
  onBehalfBefore,
  reportedRefusal,
  selfClaimedPatient,
  softenedNotJust,
  stem,
  suppressedByDesireNegation,
  tokenise,
  tokeniseKeepingStopwords,
  withinHedge,
} from "./read";

/** A way of working, keyed by the discipline yaml's `manner[].id`. */
export type MannerTrait = string;

/** A facet is either something a clinician sees or a way they work. Both are declared. */
export type Facet = { kind: "care"; area: string } | { kind: "manner"; trait: MannerTrait };

/**
 * A preference that is a hard filter or a strong lift rather than a facet — the things somebody
 * says that are about access rather than about the care itself.
 *
 * `man-gp` is new in the port: the yaml declares `constraints.man` and a refused cue that sets
 * `gender: man`, so the preference the data describes has a facet to land on.
 */
export type Preference = "woman-gp" | "man-gp" | "telehealth-first" | "bulk-billing" | "longer-appointment";

export type NeedSignal = {
  facet: Facet | { kind: "preference"; preference: Preference } | { kind: "language"; language: string };
  /** The phrase from the reader's own words that reached this facet. Used for tests and logging. */
  matched: string;
  /** Closed vocabulary. What a surface may say back. */
  label: string;
  /** Relative importance of this facet when it is asked for. */
  weight: number;
};

export type Entry = {
  facet: NeedSignal["facet"];
  label: string;
  weight: number;
  /** Phrases that reach this facet. Ordered longest-first at read time. */
  phrases: readonly string[];
};

const care = (area: string, label: string, weight: number, phrases: readonly string[]): Entry => ({
  facet: { kind: "care", area },
  label,
  weight,
  phrases,
});

const manner = (trait: MannerTrait, label: string, weight: number, phrases: readonly string[]): Entry => ({
  facet: { kind: "manner", trait },
  label,
  weight,
  phrases,
});

const pref = (preference: Preference, label: string, weight: number, phrases: readonly string[]): Entry => ({
  facet: { kind: "preference", preference },
  label,
  weight,
  phrases,
});

/**
 * Weights are coarse on purpose — 30 / 28 / 24 / 20 rather than a tuned continuum. A tuned
 * weight is a number somebody would have to defend; these express "this is the thing they
 * asked for" versus "this is context they mentioned", not a calibrated belief. ADHD.ME graded
 * care areas 12–28 by hand; the yaml carries no weights, so every condition and every manner
 * trait reads at the same 24 and the tiering in rank.ts (constraint, then care, then manner)
 * does the ordering work the per-facet grades used to share.
 */
export const CARE_WEIGHT = 24;
export const MANNER_WEIGHT = 24;

/**
 * THE GENERIC ACCESS ENTRIES, kept from ADHD.ME with their measured phrase lists. The yaml's
 * `constraints` lists are merged in after these (first-claim keeps the authored owner), so a
 * specialty can add register without re-deciding what ADHD.ME already measured.
 */
const GENERIC_PREFERENCES: readonly Entry[] = [
  pref("woman-gp", "A woman clinician", 30, [
    "female practitioner",
    "woman gp", "female gp", "woman doctor", "female doctor", "prefer a woman",
    "lady doctor", "lady gp", "safer with a woman", "women doctors",
    /* "woman psychiatrist" / "female psychiatrist" were written and REFUSED on measurement: at
       two tokens with MAX_GAP they straddle "female CHILD psychiatrist" and claim the
       `psychiatrist` token that care:child-adolescent's "child psychiatrist" needs — span
       theft, the third ADHD.ME unit to meet it. The yaml's bare "woman"/"female" already
       hears the ask. Recorded in refused-cues.ts. */
  ]),
  pref("man-gp", "A man clinician", 30, [
    "male practitioner", "man gp", "male gp", "man doctor", "male doctor", "prefer a man",
  ]),
  pref("telehealth-first", "By phone or telehealth", 28, [
    "immunosuppressed", "immunocompromised", "phone calls easier", "telehealth", "by phone",
    "over the phone", "remote", "online",
    "video appointment", "video call", "phone first",
    "by video", "over video", "video only", "video reviews", "phone appointments",
  ]),
  pref("bulk-billing", "Bulk billing", 24, [
    "bulk bill", "bulk billed", "bulk billing", "cannot afford", "cheap",
    "out of pocket", "gap fee", "gap fees", "medicare only", "cost anything",
    "how much does it cost", "no out of pocket",
  ]),
  pref("longer-appointment", "A longer first appointment", 20, [
    "double slot", "forty minutes", "longer first appointment",
    "long appointment", "long consult", "double appointment", "double session", "extended appointment",
  ]),
];

/** Which yaml `constraints` facet feeds which preference. Facets not named here are not read. */
const CONSTRAINT_PREFERENCE: Readonly<Record<string, Preference>> = {
  woman: "woman-gp",
  man: "man-gp",
  telehealth_only: "telehealth-first",
  telehealth_preferred: "telehealth-first",
  bulk_bills: "bulk-billing",
};

/**
 * Phrases a PREFERENCE facet owns even though a manner quality also lists them (O116). The
 * yaml has no "unhurried" manner today; kept so the rule survives the day it does.
 */
const PREFERENCE_OWNED_PHRASES: ReadonlySet<string> = new Set(["longer appointment", "longer first"]);

/**
 * Phrases that make an access preference a HARD filter rather than a strong lift (PRD §8.1.2:
 * "no telehealth when 'telehealth only'", "billing mismatch when the patient said
 * 'bulk-billing only'"). Read separately from the lexicon because the lexicon folds them into
 * the same preference facet; the word lists for telehealth come from the yaml's
 * `telehealth_only`, and bulk billing's "only" register is authored here because the yaml has
 * no separate facet for it.
 */
const BULK_BILLING_ONLY_PHRASES: readonly string[] = [
  "bulk billing only", "bulk billed only", "bulk bill only", "only bulk billing", "only bulk billed",
  "must be bulk billed", "has to be bulk billed", "needs to be bulk billed",
];

/**
 * One authored phrase, ready to match: both tokenisations the matcher uses, whether it
 * collapsed, and the facet it speaks for.
 */
export type Cue = {
  phrase: string;
  tokens: string[];
  raw: string[];
  collapsed: boolean;
  entry: Entry;
};

/** Everything the reader of one discipline needs, built once per discipline. */
export type Lexicon = {
  discipline: Discipline;
  entries: readonly Entry[];
  /** The cue table, most specific first. */
  cues: readonly Cue[];
  /** Language id → the cue phrases that name it (yaml `languages.cues`). */
  languageCues: ReadonlyMap<string, readonly string[]>;
  /** Hard-filter phrase tables, tokenised. */
  telehealthOnlyCues: readonly Cue[];
  bulkBillingOnlyCues: readonly Cue[];
  /** Yaml `refused_cues`, compiled. */
  refusedCues: ReadonlyArray<{ pattern: RegExp; refuses: readonly string[]; sets: Readonly<Record<string, string>> }>;
  emergencyCues: readonly RegExp[];
  /** Every label a surface may say back, for the test that pins the vocabulary closed. */
  labels: readonly string[];
  /** Every phrase with the facet it belongs to, for the self-reachability pin. */
  lexiconCues: ReadonlyArray<{ phrase: string; key: string }>;
};

/** Two collapsed cues demand their FULL raw run rather than any pair (O94). */
const RUN_DEMANDED = new Set(["over the phone", "in the room with me"]);

function titleCase(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

function tokeniseEntryPhrase(phrase: string, entry: Entry): Cue {
  return {
    phrase,
    tokens: tokenise(phrase),
    raw: tokeniseKeepingStopwords(phrase),
    /* O45: an authored multi-word phrase that ships as at most one content token is matched
       under the collapse-aware rule. Computed once, from the same two tokenisations the matcher
       uses, so the rule's membership can never drift from what actually collapses. */
    collapsed: phrase.trim().split(/\s+/).length >= 2 && tokenise(phrase).length <= 1,
    entry,
  };
}

/**
 * THE CUE TABLE IS BUILT IN FOUR NAMED STAGES (O101), from the lexicon entries:
 *   1. a phrase belongs to one facet, and the first entry to list it wins (O7/F10);
 *   2. pre-tokenise, both ways, once;
 *   3. drop cues that tokenise to nothing at all;
 *   4. most specific first — token count, then phrase length.
 */
function buildCues(entries: readonly Entry[]): { cues: Cue[]; firstClaim: Map<string, { phrase: string; entry: Entry }> } {
  const firstClaim = new Map<string, { phrase: string; entry: Entry }>();
  for (const entry of entries) {
    for (const phrase of entry.phrases) {
      const normalised = phrase.trim().toLowerCase();
      if (!normalised) continue;
      if (!firstClaim.has(normalised)) firstClaim.set(normalised, { phrase: normalised, entry });
    }
  }
  const tokenised = [...firstClaim.values()].map(({ phrase, entry }) => tokeniseEntryPhrase(phrase, entry));
  const matchable = tokenised.filter((cue) => cue.tokens.length > 0);
  const cues = [...matchable].sort(
    (a, b) => b.tokens.length - a.tokens.length || b.phrase.length - a.phrase.length,
  );
  return { cues, firstClaim };
}

/**
 * Build the lexicon for one discipline. Pure: the same yaml yields the same lexicon.
 *
 * Care entries come from `conditions`, manner from `manner`, preferences from the generic
 * ADHD.ME entries merged with the yaml's `constraints` (the yaml's phrases are APPENDED, so an
 * ADHD.ME-measured owner keeps its phrase under first-claim). Languages are read separately,
 * against the roster, in `languageNeeds`.
 */
export function buildLexicon(discipline: Discipline): Lexicon {
  const careEntries = discipline.conditions.map((group) => care(group.id, group.label, CARE_WEIGHT, group.cues));
  const mannerEntries = discipline.manner.map((group) =>
    manner(
      group.id,
      group.label,
      MANNER_WEIGHT,
      group.cues.filter((phrase) => !PREFERENCE_OWNED_PHRASES.has(phrase.toLowerCase())),
    ),
  );
  const preferenceEntries = GENERIC_PREFERENCES.map((entry) => {
    const preference = (entry.facet as { preference: Preference }).preference;
    const extra = Object.entries(discipline.constraints)
      .filter(([facet]) => CONSTRAINT_PREFERENCE[facet] === preference)
      .flatMap(([, cues]) => cues);
    return { ...entry, phrases: [...entry.phrases, ...extra] };
  });
  const entries: Entry[] = [...careEntries, ...mannerEntries, ...preferenceEntries];
  const { cues, firstClaim } = buildCues(entries);

  const hardCues = (phrases: readonly string[], label: string): Cue[] =>
    buildCues([pref("telehealth-first", label, 0, phrases)]).cues;

  return {
    discipline,
    entries,
    cues,
    languageCues: new Map(Object.entries(discipline.languages).map(([id, phrases]) => [id, phrases])),
    telehealthOnlyCues: hardCues(discipline.constraints.telehealth_only ?? [], "telehealth only"),
    bulkBillingOnlyCues: hardCues(BULK_BILLING_ONLY_PHRASES, "bulk billing only"),
    refusedCues: discipline.refusedCues.map((cue) => ({
      // Word-bounded: "can(not man)age" must not read as "not man". The yaml author writes
      // the words; the boundary is the mechanism's to add.
      pattern: new RegExp(`\\b(?:${cue.pattern})\\b`, "i"),
      refuses: cue.refuses,
      sets: cue.sets,
    })),
    emergencyCues: discipline.emergencyCues.map((cue) => new RegExp(cue, "i")),
    labels: entries.map((entry) => entry.label),
    lexiconCues: [...firstClaim.values()].map(({ phrase, entry }) => ({ phrase, key: facetKey(entry.facet) })),
  };
}

const LEXICONS = new WeakMap<Discipline, Lexicon>();

/** The lexicon for a loaded discipline, built once per discipline object. */
export function lexiconFor(discipline: Discipline): Lexicon {
  let lexicon = LEXICONS.get(discipline);
  if (!lexicon) {
    lexicon = buildLexicon(discipline);
    LEXICONS.set(discipline, lexicon);
  }
  return lexicon;
}

const LOADED = new Map<string, Lexicon>();

/** The lexicon for a discipline slug, loaded from `disciplines/<slug>.yaml` once. */
export function lexiconForSlug(slug: string): Lexicon {
  let lexicon = LOADED.get(slug);
  if (!lexicon) {
    lexicon = lexiconFor(loadDiscipline(slug));
    LOADED.set(slug, lexicon);
  }
  return lexicon;
}

/**
 * The default discipline every arity-one caller reads with. Psychiatry is the first specialty
 * (PRD §5); `match()` in index.ts always names its discipline explicitly, and so should any new
 * production caller — the default exists so the ported suite and the console can call
 * `readNeeds(text)` the way ADHD.ME did.
 */
export const DEFAULT_DISCIPLINE = "psychiatry";

export function defaultLexicon(): Lexicon {
  return lexiconForSlug(DEFAULT_DISCIPLINE);
}

/** The sentence, lowercased with apostrophes removed, for the yaml's regex patterns. */
function normaliseForPatterns(text: string): string {
  return text.toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, " ");
}

/**
 * Whether the sentence carries an emergency cue (yaml `emergency_cues`). The caller routes
 * to emergency services copy and does not rank: a list of psychiatrists is the wrong answer
 * to "I have taken all the pills".
 */
export function isEmergency(text: string, lexicon: Lexicon = defaultLexicon()): boolean {
  const normalised = normaliseForPatterns(text);
  return lexicon.emergencyCues.some((pattern) => pattern.test(normalised));
}

/**
 * The hard-filter asks (PRD §8.1.2), read as presence predicates over the same token streams
 * the lexicon uses so "telehealth only" is heard through the same insertion and inflection
 * tolerance as everything else.
 */
export function hardAsks(text: string, lexicon: Lexicon = defaultLexicon()): { telehealthOnly: boolean; bulkBillingOnly: boolean } {
  const sentence = tokenise(text);
  const rawSentence = tokeniseKeepingStopwords(text);
  const present = (cues: readonly Cue[]) =>
    cues.some((cue) => {
      if (cue.collapsed && !collapsedCueSatisfied(rawSentence, cue.raw)) return false;
      const at = findCue(sentence, cue.tokens);
      return at !== null && !bareNegatorBefore(sentence, at.from);
    });
  return {
    telehealthOnly: present(lexicon.telehealthOnlyCues),
    bulkBillingOnly: present(lexicon.bulkBillingOnlyCues),
  };
}

/**
 * Read what somebody said into the closed vocabulary.
 *
 * Deterministic and total: the same text always yields the same signals, and text that reaches
 * nothing yields an empty list rather than a guess. An empty list is a supported outcome — the
 * finder says so (`matchQuality`) rather than presenting an arbitrary order as a ranking.
 *
 * MATCHING IS ORDERED-SUBSEQUENCE OVER STEMMED TOKENS — see `read.ts` for why. A cue that
 * matched some words takes them, so one clause produces one facet.
 */
export function readNeeds(text: string, lexicon: Lexicon = defaultLexicon()): NeedSignal[] {
  const sentence = tokenise(text);
  // The same words with the function words kept, for the collapse-aware rule only (O45).
  const rawSentence = tokeniseKeepingStopwords(text);
  const signals: NeedSignal[] = [];
  const seen = new Set<string>();
  /* O106: the token positions already spoken for. Positions, not ranges — a cue claims the
     words it MATCHED, never the words it straddled. */
  const claimed = new Set<number>();

  /* PHASE 1 (O78 shape, O81 arrangement): collect every occurrence of every cue that
     survives the occurrence-local rules. findCue retries past a refused span; the
     sentence-global collapse check skips the cue outright. Desire negation is deliberately
     NOT decided here — it needs to see all spans at once (O81). */
  type Candidate = { cue: Cue; from: number; to: number; at: number[] };
  const candidates: Candidate[] = [];
  for (const cue of lexicon.cues) {
    /* O45: a cue that collapsed to one content token fires only when the sentence also carries
       an adjacent pair of the cue's AUTHORED words. O94: two collapsed cues demand their FULL
       raw run rather than any pair. */
    if (
      cue.collapsed &&
      !(RUN_DEMANDED.has(cue.phrase)
        ? collapsedCueRunPresent(rawSentence, cue.raw)
        : collapsedCueSatisfied(rawSentence, cue.raw))
    ) {
      continue;
    }
    let searchFrom = 0;
    while (true) {
      const at = findCue(sentence, cue.tokens, searchFrom);
      if (!at) break;
      searchFrom = at.from + 1;
      /* O76: a cue sitting wholly inside a conversational hedge is filler, not an ask. */
      if (withinHedge(sentence, rawSentence, at.from, at.to)) continue;
      /* O77: "for my mum" / "on behalf of my mum" names the PATIENT, not a relative joining the
         appointment, so the culturally-attuned reading stands down. ONLY that facet. The
         psychiatry yaml names it `culturally-safe`; ADHD.ME's key is kept for the day a
         discipline declares it under the old name. */
      if (
        (facetKey(cue.entry.facet) === "manner:culturally_attuned" || facetKey(cue.entry.facet) === "manner:culturally-safe") &&
        onBehalfBefore(sentence, rawSentence, at.from, at.to)
      ) {
        continue;
      }
      /* O120: the counter-signal the child facet needs precisely BECAUSE O77 exempts it: "my
         own assessment" is an adult asking for themselves. */
      if (
        (facetKey(cue.entry.facet) === "care:child-adolescent-adhd" || facetKey(cue.entry.facet) === "care:child-adolescent") &&
        selfClaimedPatient(rawSentence)
      ) {
        continue;
      }
      /* O72: a bare "no"/"not" immediately before a care/pref cue span is a refusal, UNLESS the
         raw stream shows the additive "not just" idiom pointing at this cue. O83: a reporting
         verb directly before the negator marks the refusal as somebody ELSE's. Manner exempt. */
      if (
        (cue.entry.facet.kind === "care" || cue.entry.facet.kind === "preference") &&
        bareNegatorBefore(sentence, at.from) &&
        !softenedNotJust(rawSentence, cue.tokens[0]!) &&
        !reportedRefusal(sentence, rawSentence, at.from)
      ) {
        continue;
      }
      /* O92: a cue that carries its OWN negator means DECLINING the thing, unless the raw
         determiner says the reader is LACKING it. */
      if (
        (cue.entry.facet.kind === "care" || cue.entry.facet.kind === "preference") &&
        isTightNegator(cue.tokens[0]!) &&
        lackingNotDeclining(sentence, rawSentence, at.from, at.to)
      ) {
        continue;
      }
      candidates.push({ cue, from: at.from, to: at.to, at: at.at });
    }
  }

  /* PHASE 2 (O81): a desire negation spends itself on the NEAREST following span, and only
     that one. Manner stays exempt but SPENDS the trigger. O105: a comma ends the scope. */
  const negated = suppressedByDesireNegation(
    sentence,
    candidates.map((candidate) => ({
      from: candidate.from,
      negatable:
        candidate.cue.entry.facet.kind === "care" || candidate.cue.entry.facet.kind === "preference",
    })),
    commaBreaksBefore(text),
  );

  /* PHASE 3: claiming, in the same specificity order as always. A suppressed occurrence claims
     nothing; words another facet claimed are occupied, not poisoned. */
  candidates.forEach((candidate, index) => {
    if (negated.has(index)) return;
    const { cue } = candidate;
    /* O106: A CUE CLAIMS THE WORDS IT MATCHED, NOT THE WORDS IT STRADDLED. */
    if (candidate.at.some((position) => claimed.has(position))) return;

    const key = facetKey(cue.entry.facet);
    if (seen.has(key)) return;

    for (const position of candidate.at) claimed.add(position);
    seen.add(key);
    signals.push({
      facet: cue.entry.facet,
      matched: cue.phrase,
      label: cue.entry.label,
      weight: cue.entry.weight,
    });
  });

  return applyRefusedCues(text, signals, lexicon);
}

/**
 * The yaml's `refused_cues`, applied after the read (new in the port; the mechanism the yaml
 * was written for). A pattern that hits drops every signal whose facet id is in `refuses`,
 * and a `sets: { gender: woman|man }` adds the matching access preference as if the reader
 * had asked for it in the lexicon's own words — "not a man" is a woman-clinician ask, which
 * ADHD.ME could not hear through a cue because the idiom "not a man of many words" exists.
 * The pattern is anchored by the yaml author, which is the right place for that judgement.
 */
function applyRefusedCues(text: string, signals: NeedSignal[], lexicon: Lexicon): NeedSignal[] {
  if (lexicon.refusedCues.length === 0) return signals;
  const normalised = normaliseForPatterns(text);
  let out = signals;
  for (const cue of lexicon.refusedCues) {
    const hit = cue.pattern.exec(normalised);
    if (!hit) continue;
    if (cue.refuses.length > 0) {
      const refused = new Set(cue.refuses);
      out = out.filter((signal) => !refused.has(facetId(signal.facet)));
    }
    const gender = cue.sets.gender;
    const preference: Preference | null = gender === "woman" ? "woman-gp" : gender === "man" ? "man-gp" : null;
    if (preference && !out.some((signal) => facetKey(signal.facet) === `pref:${preference}`)) {
      const entry = lexicon.entries.find((e) => e.facet.kind === "preference" && e.facet.preference === preference);
      if (entry) out = [...out, { facet: entry.facet, matched: hit[0], label: entry.label, weight: entry.weight }];
    }
    // The opposite preference cannot stand beside the one the refusal set.
    const opposite: Preference | null = preference === "woman-gp" ? "man-gp" : preference === "man-gp" ? "woman-gp" : null;
    if (opposite) out = out.filter((signal) => facetKey(signal.facet) !== `pref:${opposite}`);
  }
  return out;
}

/** The yaml-side id of a facet (the bare `conditions[].id` / `manner[].id` / preference). */
function facetId(facet: NeedSignal["facet"]): string {
  if (facet.kind === "care") return facet.area;
  if (facet.kind === "manner") return facet.trait;
  if (facet.kind === "language") return facet.language.toLowerCase();
  return facet.preference === "telehealth-first" ? "telehealth" : facet.preference;
}

/**
 * Whether a clinician's declared record answers an access preference.
 *
 * ONE PLACE (O5/F7): the ranker, the clarifier and the filters all ask this. The parameter is
 * structural on purpose: the five fields named here are the whole of what a preference reads.
 */
export function holdsPreference(
  clinician: {
    gender: string;
    telehealthFirstAppointment?: boolean;
    manner: readonly string[];
    practicalSignals: readonly string[];
  },
  preference: Preference,
): boolean {
  switch (preference) {
    case "woman-gp":
      return clinician.gender === "woman";
    case "man-gp":
      return clinician.gender === "man";
    case "telehealth-first":
      return clinician.telehealthFirstAppointment === true;
    case "longer-appointment":
      return clinician.manner.includes("unhurried");
    case "bulk-billing":
      return clinician.practicalSignals.some((signal) => /bulk/i.test(signal));
  }
}

/** Stable identity for a facet, so a reader asking twice for one thing counts once. */
export function facetKey(facet: NeedSignal["facet"]): string {
  if (facet.kind === "care") return `care:${facet.area}`;
  if (facet.kind === "manner") return `manner:${facet.trait}`;
  if (facet.kind === "language") return `language:${facet.language.toLowerCase()}`;
  return `pref:${facet.preference}`;
}

/**
 * Same tier as the lexicon's strongest facets: an asked-for language is a hard requirement of
 * the appointment, not a nice-to-have.
 */
const LANGUAGE_WEIGHT = 30;

/**
 * A language the reader asked for, read against the languages the roster actually declares.
 *
 * Languages are per-clinician DATA, so they are read against the roster's own declarations
 * rather than a static table; the yaml's `languages.cues` adds the demonyms and alternate
 * names a reader uses ("lebanese" for Arabic, "filipino" for Tagalog) through the same
 * tokenise-and-stem pipeline as every cue. English is excluded: "speaks English" is not a
 * match reason in Australia. A language the reader never mentioned is never a signal.
 */
export function languageNeeds(text: string, spoken: readonly string[], lexicon: Lexicon = defaultLexicon()): NeedSignal[] {
  const sentence = tokenise(text);
  const tokens = new Set(sentence);
  const signals: NeedSignal[] = [];
  const seen = new Set<string>();
  for (const language of spoken) {
    const lower = language.toLowerCase();
    if (lower === "english") continue;
    const key = facetKey({ kind: "language", language });
    if (seen.has(key)) continue;
    const phrases = lexicon.languageCues.get(lower) ?? [];
    const heard =
      tokens.has(stem(lower)) ||
      phrases.some((phrase) => {
        const cueTokens = tokenise(phrase);
        return cueTokens.length > 0 && findCue(sentence, cueTokens) !== null;
      });
    if (!heard) continue;
    seen.add(key);
    signals.push({
      facet: { kind: "language", language },
      matched: lower,
      label: `${titleCase(language)}-speaking`,
      weight: LANGUAGE_WEIGHT,
    });
  }
  return signals;
}

/** Every label a surface may say back, for the test that pins the vocabulary closed. */
export function needLabels(lexicon: Lexicon = defaultLexicon()): readonly string[] {
  return lexicon.labels;
}

/** Every phrase in the lexicon with the facet it belongs to, for the self-reachability pin. */
export function lexiconCues(lexicon: Lexicon = defaultLexicon()): ReadonlyArray<{ phrase: string; key: string }> {
  return lexicon.lexiconCues;
}

/** The manner trait ids the discipline declares. */
export function mannerTraits(lexicon: Lexicon = defaultLexicon()): readonly MannerTrait[] {
  return lexicon.discipline.manner.map((group) => group.id);
}

/** The care area ids the discipline declares, with their labels. */
export function careAreaLabels(lexicon: Lexicon = defaultLexicon()): ReadonlyArray<{ id: string; label: string }> {
  return lexicon.discipline.conditions.map((group) => ({ id: group.id, label: group.label }));
}

/** The manner trait ids with their labels. */
export function mannerLabels(lexicon: Lexicon = defaultLexicon()): ReadonlyArray<{ id: string; label: string }> {
  return lexicon.discipline.manner.map((group) => ({ id: group.id, label: group.label }));
}
