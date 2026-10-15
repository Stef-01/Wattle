// Ported from adhd.me/src/matching/corpus.ts on 2026-10-15 (the entry shape, the reach tally
// and the floor mechanism; the sentences are new, because ADHD.ME's 500 were pinned to the ADHD
// lexicon and a corpus copied into a lexicon measures nothing).
//
// WHAT THIS IS. Sentences people type into a finder, each pinned to the facets it REACHES
// (must), the facets it must NEVER reach, and the facets it ASPIRES to (the author's intent,
// not yet heard). The suite re-reads every entry on every run, so a cue edit that unhooks a
// sentence fails the build rather than waiting for a probe.
//
// THE G7 LINE, carried from ADHD.ME: a `never` pin on a sentence that DESCRIBES the reader's
// state is intentional. The lexicon reads what somebody wants from a clinician, never what is
// wrong with them. "I cry every morning" reaches nothing; "I want help with the depression"
// reaches care:depression. Every entry below was MEASURED against the psychiatry lexicon on the
// day it was written; the `aspires` entries are what the vocabulary does not hear yet.

export type CorpusEntry = {
  text: string;
  /** Facet keys this sentence must reach. */
  reaches?: readonly string[];
  /** Facet keys this sentence must never reach. */
  never?: readonly string[];
  /** Facet keys the author wants heard and the lexicon does not reach yet. */
  aspires?: readonly string[];
  /** A G7-shaped sentence the founder has to rule on before a cue is written for it. */
  awaitingFounder?: string;
};

export const REACH_CORPUS: readonly CorpusEntry[] = [
  // ── ADHD assessment ────────────────────────────────────────────────────────────────────────
  { text: "I need an ADHD assessment", reaches: ["care:adhd-assessment"] },
  { text: "I think I have ADHD and want a psychiatrist who does the assessment", reaches: ["care:adhd-assessment"] },
  { text: "my GP thinks it is attention deficit and wants a formal diagnosis", reaches: ["care:adhd-assessment"] },
  { text: "I am already on vyvanse and need someone to take over the prescribing", reaches: ["care:adhd-assessment"] },
  { text: "looking for a psychiatrist who can prescribe stimulants after an assessment", reaches: ["care:adhd-assessment"] },
  { text: "I can't focus at work and I want it looked at properly", reaches: ["care:adhd-assessment"] },
  { text: "ritalin stopped working and the dose needs review", reaches: ["care:adhd-assessment"] },

  // ── Autism ─────────────────────────────────────────────────────────────────────────────────
  { text: "I want an autism assessment as an adult", reaches: ["care:autism-assessment"] },
  { text: "I am autistic and need a psychiatrist who gets that", reaches: ["care:autism-assessment"] },
  { text: "my daughter is on the spectrum and her anxiety is getting worse", reaches: ["care:autism-assessment", "care:anxiety"] },
  { text: "a neurodivergent friendly psychiatrist please", reaches: ["care:autism-assessment"] },

  // ── Anxiety ────────────────────────────────────────────────────────────────────────────────
  { text: "panic attacks every week and my GP says see a psychiatrist", reaches: ["care:anxiety"] },
  { text: "I have had anxiety for years and nothing has worked", reaches: ["care:anxiety"] },
  { text: "social anxiety is stopping me from working", reaches: ["care:anxiety"] },
  { text: "I am so anxious I cannot leave the house", reaches: ["care:anxiety"] },
  { text: "constant worrying about everything, I want help with it", reaches: ["care:anxiety"] },

  // ── Depression ─────────────────────────────────────────────────────────────────────────────
  { text: "depression that the GP cannot manage any more", reaches: ["care:depression"] },
  { text: "I have been on sertraline for a year and I am still flat", reaches: ["care:depression"] },
  { text: "low mood for months, I need a psychiatrist", reaches: ["care:depression"] },
  { text: "the antidepressant is not working and I want a review", reaches: ["care:depression"] },
  { text: "I feel hopeless most days and my GP wants a psychiatrist to look at it", reaches: ["care:depression"] },

  // ── Bipolar ────────────────────────────────────────────────────────────────────────────────
  { text: "I was diagnosed bipolar and need someone to manage my lithium", reaches: ["care:bipolar"] },
  { text: "manic episode last year, I need ongoing care", reaches: ["care:bipolar"] },
  { text: "a psychiatrist who understands bipolar and the medication", reaches: ["care:bipolar"] },

  // ── Psychosis ──────────────────────────────────────────────────────────────────────────────
  { text: "my son is hearing voices and we need a psychiatrist urgently", reaches: ["care:psychosis"] },
  { text: "schizophrenia, I need a new psychiatrist after moving to Sydney", reaches: ["care:psychosis"] },
  { text: "I am on clozapine and need a psychiatrist who can monitor it", reaches: ["care:psychosis"] },

  // ── Eating disorders ───────────────────────────────────────────────────────────────────────
  { text: "my teenager has an eating disorder and the GP wants a psychiatrist involved", reaches: ["care:eating-disorders"] },
  { text: "binge eating that I cannot stop on my own", reaches: ["care:eating-disorders"] },
  { text: "anorexia recovery, I need a psychiatrist who works with eating disorders", reaches: ["care:eating-disorders"] },

  // ── Perinatal ──────────────────────────────────────────────────────────────────────────────
  { text: "postnatal depression, my baby is four months old", reaches: ["care:perinatal-mh"] },
  // "pregnant" is a POPULATION cue in the yaml, not a condition cue; the population read is the next vocabulary pass.
  { text: "I am pregnant and worried about going back on medication", aspires: ["care:perinatal-mh"] },
  { text: "since the birth I have not felt like myself", reaches: ["care:perinatal-mh"] },

  // ── Trauma ─────────────────────────────────────────────────────────────────────────────────
  { text: "PTSD from my time as a first responder", reaches: ["care:trauma"] },
  { text: "complex trauma from childhood, I want someone who takes time", reaches: ["care:trauma", "manner:gentle"] },
  { text: "I am a veteran and the flashbacks are getting worse", reaches: ["care:trauma"] },

  // ── OCD ────────────────────────────────────────────────────────────────────────────────────
  { text: "OCD that has taken over my mornings", reaches: ["care:ocd"] },
  { text: "intrusive thoughts I cannot switch off", reaches: ["care:ocd"] },
  { text: "checking the stove twenty times before I leave", reaches: ["care:ocd"] },

  // ── Personality ────────────────────────────────────────────────────────────────────────────
  { text: "I have BPD and need a psychiatrist who does not give up on me", reaches: ["care:personality"] },
  { text: "borderline personality disorder, looking for someone who works with DBT", reaches: ["care:personality"] },

  // ── Substance use ──────────────────────────────────────────────────────────────────────────
  { text: "my drinking is out of control and I want help", reaches: ["care:substance-use"] },
  { text: "cannabis every day and I cannot stop", reaches: ["care:substance-use"] },
  { text: "gambling has cost me my marriage", reaches: ["care:substance-use"] },
  { text: "I need a detox and a psychiatrist who handles addiction", reaches: ["care:substance-use"] },

  // ── Older adults ───────────────────────────────────────────────────────────────────────────
  { text: "my mum has dementia and is very agitated at night", reaches: ["care:older-adult-mh"] },
  { text: "my father is in aged care and depressed", reaches: ["care:older-adult-mh", "care:depression"] },
  { text: "a geriatric psychiatrist for my elderly dad", reaches: ["care:older-adult-mh"] },

  // ── Child and adolescent ───────────────────────────────────────────────────────────────────
  { text: "a child psychiatrist for my eight year old", reaches: ["care:child-adolescent"] },
  { text: "school refusal, my daughter has not been in for a month", reaches: ["care:child-adolescent"] },
  { text: "CAMHS discharged us and we need a private adolescent psychiatrist", reaches: ["care:child-adolescent"] },

  // ── Forensic, second opinion, sleep, grief ─────────────────────────────────────────────────
  { text: "I need a medico-legal report for court", reaches: ["care:forensic"] },
  { text: "a second opinion on my diagnosis", reaches: ["care:second-opinion"] },
  { text: "I want someone to review my medication, I have been on it ten years", reaches: ["care:second-opinion"] },
  { text: "insomnia for two years and nothing helps", reaches: ["care:sleep"] },
  { text: "nightmares every night since the accident", reaches: ["care:sleep"] },
  { text: "my wife passed away in March and I am not coping", reaches: ["care:grief"] },
  { text: "redundancy has knocked me flat", reaches: ["care:grief", "care:depression"] },

  // ── Manner ─────────────────────────────────────────────────────────────────────────────────
  { text: "someone direct who will tell it like it is", reaches: ["manner:direct"] },
  { text: "a gentle psychiatrist who takes time", reaches: ["manner:gentle"] },
  { text: "I want a psychiatrist who listens and explains things", reaches: ["manner:collaborative"] },
  { text: "a queer affirming psychiatrist", reaches: ["manner:lgbtq-affirming"] },
  { text: "I am trans and need someone affirming", reaches: ["manner:lgbtq-affirming"] },
  { text: "an Aboriginal psychiatrist or someone culturally safe", reaches: ["manner:culturally-safe"] },
  { text: "someone who understands my background as a migrant", reaches: ["manner:culturally-safe"] },
  { text: "neurodiversity affirming and strengths based", reaches: ["manner:neurodiversity-affirming"] },
  { text: "no nonsense, straight talking", reaches: ["manner:direct"] },
  { text: "calm and softly spoken please", reaches: ["manner:gentle"] },

  // ── Access ─────────────────────────────────────────────────────────────────────────────────
  { text: "a woman psychiatrist please", reaches: ["pref:woman-gp"] },
  { text: "I would prefer a female doctor", reaches: ["pref:woman-gp"] },
  // Heard through the yaml's refused cue (`sets: gender: woman`), not through a lexicon phrase:
  // ADHD.ME measured "not a man" firing on "not a man of many words" and refused it as a cue.
  { text: "please, not a man", reaches: ["pref:woman-gp"], never: ["pref:man-gp"] },
  { text: "my GP is not a man of many words", never: ["pref:woman-gp"] },
  { text: "a male psychiatrist", reaches: ["pref:man-gp"] },
  { text: "telehealth only, I cannot travel", reaches: ["pref:telehealth-first"] },
  { text: "I would like to do it by video", reaches: ["pref:telehealth-first"] },
  { text: "online appointments from home", reaches: ["pref:telehealth-first"] },
  { text: "bulk billed, I am on a pension", reaches: ["pref:bulk-billing"] },
  { text: "I have a healthcare card and cannot afford a gap", reaches: ["pref:bulk-billing"] },
  { text: "no gap fees please", reaches: ["pref:bulk-billing"] },
  { text: "happy to pay for a longer appointment", reaches: ["pref:longer-appointment"] },
  { text: "a double appointment for the first session", reaches: ["pref:longer-appointment"] },

  // ── Languages ──────────────────────────────────────────────────────────────────────────────
  { text: "a psychiatrist who speaks Arabic for my mother", aspires: ["language:arabic"] },

  // ── Compound asks ──────────────────────────────────────────────────────────────────────────
  { text: "a woman psychiatrist who bulk bills for my anxiety", reaches: ["pref:woman-gp", "pref:bulk-billing", "care:anxiety"] },
  { text: "ADHD assessment by telehealth, I live rurally", reaches: ["care:adhd-assessment", "pref:telehealth-first"] },
  { text: "depression and OCD, I want someone gentle", reaches: ["care:depression", "care:ocd", "manner:gentle"] },
  { text: "bipolar, telehealth, and a direct manner", reaches: ["care:bipolar", "pref:telehealth-first", "manner:direct"] },
  { text: "my teenager has anxiety and we want a female child psychiatrist", reaches: ["care:anxiety", "care:child-adolescent", "pref:woman-gp"] },

  // ── Negation and refusal ───────────────────────────────────────────────────────────────────
  { text: "not telehealth, I want to see someone in person", never: ["pref:telehealth-first"] },
  { text: "I don't want bulk billing, I am happy to pay", never: ["pref:bulk-billing"] },
  // The yaml's refused cue reads "don't want a woman" as `sets: gender: man`; ADHD.ME only refused the woman ask.
  { text: "I don't want a woman doctor, bulk billing matters more", reaches: ["pref:bulk-billing", "pref:man-gp"], never: ["pref:woman-gp"] },
  { text: "no medication, I want therapy", never: ["care:depression"] },
  { text: "they said no to a referral but I need an ADHD assessment", reaches: ["care:adhd-assessment"] },
  { text: "I don't need an autism assessment, this is about the anxiety", reaches: ["care:anxiety"], never: ["care:autism-assessment"] },

  // ── G7: descriptions of the reader's state, deliberately unread ────────────────────────────
  { text: "I cry every morning before work", never: ["care:depression"] },
  { text: "my heart races when I walk into a shop", never: ["care:anxiety"] },
  { text: "I have not slept more than four hours a night", never: ["care:sleep"] },
  /* THE YAML READS THIS, AND THE FOUNDER HAS TO SAY WHETHER IT SHOULD. ADHD.ME took the
     preference reading ("I drink more than I should" asks for the conversation to be held
     safely); the psychiatry yaml's `drinking` cue hears it the same way. Pinned as measured. */
  { text: "I drink a bottle of wine most nights", reaches: ["care:substance-use"], awaitingFounder: "disclosure made in order to ask for care, or a description of the reader's own state" },

  // ── Nothing to compare on ──────────────────────────────────────────────────────────────────
  // Reaches manner:gentle through the yaml's bare "patient" cue — a registered false positive (known-fps.ts).
  { text: "somewhere near Parramatta that takes new patients" },
  { text: "hello I would like some help please" },
  { text: "how much does an appointment cost", reaches: ["pref:bulk-billing"] },
  { text: "my GP gave me a referral last week" },

  // ── Known false positives, registered in known-fps.ts ──────────────────────────────────────
  // Each reaches a facet through a bare single word in the yaml ("ice", "flat", "checking",
  // "court", "memory", "free") that ADHD.ME measured and refused for exactly these sentences.
  // The yaml is the founder's vocabulary; the register is where the cost is recorded until the
  // cue is narrowed. No `never` pin here, because the pin would be false today.
  { text: "the ice packs helped the headaches" },
  { text: "my flat is near the station" },
  { text: "I have been checking the website for appointments" },
  { text: "the court house is next to the practice" },
  { text: "I lost my memory stick" },
  { text: "the kids are at school, I am free mornings", never: ["care:child-adolescent"] },
  // And the precision the mechanics DO hold: a condition word inside a refusal is not an ask.
  { text: "not depression, the GP already ruled that out", never: ["care:depression"] },
];

/** Reach by facet: how many sentences wanted it, how many the reader heard. */
export function corpusReachByFacet(
  read: (text: string) => readonly string[],
): Array<{ facet: string; asked: number; heard: number }> {
  const tally = new Map<string, { asked: number; heard: number }>();
  for (const entry of REACH_CORPUS) {
    const wanted = [...(entry.reaches ?? []), ...(entry.aspires ?? [])];
    if (wanted.length === 0) continue;
    const got = new Set(read(entry.text));
    for (const facet of wanted) {
      const row = tally.get(facet) ?? { asked: 0, heard: 0 };
      row.asked++;
      if (got.has(facet)) row.heard++;
      tally.set(facet, row);
    }
  }
  return [...tally.entries()]
    .map(([facet, row]) => ({ facet, ...row }))
    .sort((a, b) => a.facet.localeCompare(b.facet));
}

/**
 * The reach ratchet: the smallest number of corpus sentences each facet must be heard in. A
 * cue edit that drops a facet under its floor fails the suite; raising a floor is how a gain is
 * banked. Measured on the day the corpus was written; see corpus.test.ts.
 */
export const REACH_FLOORS: Readonly<Record<string, number>> = {
  "care:anxiety": 9,
  "care:autism-assessment": 4,
  "care:bipolar": 4,
  "care:child-adolescent": 4,
  "care:depression": 8,
  "care:eating-disorders": 3,
  "care:forensic": 1,
  "care:grief": 2,
  "care:ocd": 4,
  "care:older-adult-mh": 3,
  "care:perinatal-mh": 2,
  "care:personality": 2,
  "care:psychosis": 3,
  "care:second-opinion": 2,
  "care:sleep": 2,
  "care:substance-use": 5,
  "care:trauma": 3,
  "language:arabic": 1,
  "manner:collaborative": 1,
  "manner:culturally-safe": 2,
  "manner:direct": 3,
  "manner:gentle": 4,
  "manner:lgbtq-affirming": 2,
  "manner:neurodiversity-affirming": 1,
  "pref:bulk-billing": 6,
  "pref:longer-appointment": 2,
  "pref:man-gp": 2,
  "pref:telehealth-first": 5,
  "pref:woman-gp": 5,
};
