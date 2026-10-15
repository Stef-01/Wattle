// Ported from adhd.me/src/matching/refused-cues.ts on 2026-10-15 (the register's shape and the
// aspiration classifier; the entries are the refusals that survive the port — those on the
// generic access entries needs.ts keeps from ADHD.ME, plus the one made during the port).
//
// O139: THE REFUSED-CUE REGISTER. A cue somebody wrote, measured, and took out again, with the
// sentence that refused it. The next author meets the refusal BEFORE writing the cue rather
// than after. `leavesStanding` names the corpus aspirations the refusal leaves unheard, which
// is how `classifyAspirations` tells "measured and resistant" from "nobody has tried".

export type RefusedCue = {
  phrase: string;
  facet: string;
  /** The sentence it fired on. */
  refusedBy: string;
  because: string;
  unit: string;
  /** Corpus aspirations this refusal leaves standing. */
  leavesStanding?: readonly string[];
  /** When the phrase was refused because another facet owns it under first-claim. */
  ownedBy?: string;
  /** The facet the refusal protects from span theft. */
  protects?: string;
};

export const REFUSED_CUES: readonly RefusedCue[] = [
  {
    phrase: "female psychiatrist",
    facet: "pref:woman-gp",
    refusedBy: "my teenager has anxiety and we want a female child psychiatrist",
    because:
      "at two tokens with MAX_GAP it straddles 'female CHILD psychiatrist' and claims the `psychiatrist` token that care:child-adolescent's 'child psychiatrist' needs — span theft. The yaml's bare 'female' already hears the ask",
    unit: "W1",
    protects: "care:child-adolescent",
    leavesStanding: [],
  },
  {
    phrase: "woman psychiatrist",
    facet: "pref:woman-gp",
    refusedBy: "my teenager has anxiety and we want a woman child psychiatrist",
    because: "the same span theft as 'female psychiatrist'; bare 'woman' hears it",
    unit: "W1",
    protects: "care:child-adolescent",
    leavesStanding: [],
  },
  {
    phrase: "not a man",
    facet: "pref:woman-gp",
    refusedBy: "my GP is not a man of many words",
    because: "a real English idiom about somebody being terse. The yaml's refused cue (`sets: gender: woman`) hears 'not a man' as a word-bounded pattern instead",
    unit: "O114",
    leavesStanding: [],
  },
  {
    phrase: "cannot pay",
    facet: "pref:bulk-billing",
    refusedBy: "I cannot pay attention for long",
    because: "an ADHD symptom sentence; reading it as a request about billing would be wrong and exactly the kind of wrong the G7 line exists to prevent",
    unit: "O109",
    leavesStanding: [],
  },
  {
    phrase: "free",
    facet: "pref:bulk-billing",
    refusedBy: "free up my afternoons",
    because: "a bare word that means something else more often than it means a fee. The psychiatry yaml cues it anyway; the cost is registered in known-fps.ts",
    unit: "O109",
    leavesStanding: [],
  },
  {
    phrase: "more than fifteen minutes",
    facet: "pref:longer-appointment",
    refusedBy: "fifteen minutes from the station",
    because: "it strips to [fifteen, minute], which is also how distance talk reads",
    unit: "O65",
    leavesStanding: [],
  },
  {
    phrase: "clinic visits",
    facet: "pref:telehealth-first",
    refusedBy: "I would prefer clinic visits to telehealth",
    because: "a cue read off the AVOIDED thing cannot tell the ask from its mirror image",
    unit: "O108",
    leavesStanding: [],
  },
  {
    phrase: "waiting rooms",
    facet: "pref:telehealth-first",
    refusedBy: "the waiting room makes my anxiety worse",
    because: "an anxiety sentence, and the [wait, room] collision ADHD.ME already paid for",
    unit: "O108",
    leavesStanding: [],
  },
];

export type AspirationKind = "founder-gated" | "measured-and-resistant" | "open";

/**
 * Every corpus aspiration, classified: gated on a founder question, measured into a refusal
 * that leaves it standing, or genuinely open work.
 */
export function classifyAspirations(
  corpus: ReadonlyArray<{ text: string; aspires?: readonly string[]; awaitingFounder?: string }>,
  refusals: readonly RefusedCue[] = REFUSED_CUES,
): Array<{ text: string; aspires: readonly string[]; kind: AspirationKind }> {
  const accountedFor = new Set(refusals.flatMap((r) => r.leavesStanding ?? []));
  return corpus
    .filter((e): e is typeof e & { aspires: readonly string[] } => !!e.aspires?.length)
    .map((e) => ({
      text: e.text,
      aspires: e.aspires,
      kind: e.awaitingFounder
        ? ("founder-gated" as const)
        : accountedFor.has(e.text)
          ? ("measured-and-resistant" as const)
          : ("open" as const),
    }));
}

export function openAspirations(
  corpus: ReadonlyArray<{ text: string; aspires?: readonly string[]; awaitingFounder?: string }>,
  refusals: readonly RefusedCue[] = REFUSED_CUES,
): Array<{ text: string; aspires: readonly string[] }> {
  return classifyAspirations(corpus, refusals)
    .filter((e) => e.kind === "open")
    .map((e) => ({ text: e.text, aspires: e.aspires }));
}
