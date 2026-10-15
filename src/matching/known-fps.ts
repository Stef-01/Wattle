// Ported from adhd.me/src/matching/known-fps.ts on 2026-10-15 (the register's shape and its
// three readers; the entries are Wattle's own, measured against the psychiatry lexicon).
//
// W231 (O131): THE FALSE-POSITIVE REGISTER. A sentence the lexicon reads into a facet it should
// not. Each entry is checked in both directions by known-fps.test.ts: an OPEN entry must still
// exhibit the reading (a pin that quietly stopped being true sends the next author to build a
// mechanism for a defect that no longer exists), and a FIXED entry must not.
//
// THE O84 BAR: one case does not earn a mechanism; two do. `familiesAtTheBar` lists the
// families with two or more open members — the ones that have earned a rule.
//
// THE BARE-WORD FAMILY, which is the whole of the register today. The psychiatry yaml cues
// several conditions on a single ordinary English word — "ice", "flat", "checking", "court",
// "memory", "free", "patient" — each of which ADHD.ME measured and refused for precisely the
// sentence pinned here. The yaml is the founder's vocabulary (CLAUDE.md), so the cost is
// recorded here rather than the word deleted in passing. Narrowing them to a pair ("ice pipe",
// "feel flat", "checking rituals", "family court", "memory loss", "free appointment") would
// close every member; `pinnedBy: "W1"` is the port unit.

export type KnownFalsePositive = {
  /** The corpus sentence. Must appear in REACH_CORPUS, so the register cannot drift from the thing it describes. */
  text: string;
  /** The facet it wrongly reaches. */
  facet: string;
  /** Which family of defect it belongs to; two open members of one family earn a mechanism. */
  family: string;
  /** The unit that pinned it. */
  pinnedBy: string;
  /** The unit that fixed it, if any. A fixed entry is checked to stay fixed. */
  fixedBy?: string;
  /** The rationale when somebody decided to live with it rather than fix it. */
  accepted?: string;
};

export const KNOWN_FALSE_POSITIVES: readonly KnownFalsePositive[] = [
  {
    text: "the ice packs helped the headaches",
    facet: "care:substance-use",
    family: "bare-word-in-yaml",
    pinnedBy: "W1",
  },
  {
    text: "my flat is near the station",
    facet: "care:depression",
    family: "bare-word-in-yaml",
    pinnedBy: "W1",
  },
  {
    text: "I have been checking the website for appointments",
    facet: "care:ocd",
    family: "bare-word-in-yaml",
    pinnedBy: "W1",
  },
  {
    text: "the court house is next to the practice",
    facet: "care:forensic",
    family: "bare-word-in-yaml",
    pinnedBy: "W1",
  },
  {
    text: "I lost my memory stick",
    facet: "care:older-adult-mh",
    family: "bare-word-in-yaml",
    pinnedBy: "W1",
  },
  {
    text: "the kids are at school, I am free mornings",
    facet: "pref:bulk-billing",
    family: "bare-word-in-yaml",
    pinnedBy: "W1",
  },
  {
    text: "somewhere near Parramatta that takes new patients",
    facet: "manner:gentle",
    family: "bare-word-in-yaml",
    pinnedBy: "W1",
  },
  /* THE REFUSED-CUE IDIOM. The yaml's `(not|don't want|no) (a )?(man|male)` sets `gender: woman`
     on a real English idiom about somebody being terse — the sentence ADHD.ME measured when it
     refused "not a man" as a cue (O114). One member, so under the O84 bar; recorded so the next
     author narrows the pattern (e.g. requiring "doctor|psychiatrist|gp" after it) rather than
     re-measuring. */
  {
    text: "my GP is not a man of many words",
    facet: "pref:woman-gp",
    family: "yaml-refused-cue-idiom",
    pinnedBy: "W1",
  },
];

export function openFalsePositives(
  entries: readonly KnownFalsePositive[] = KNOWN_FALSE_POSITIVES,
): KnownFalsePositive[] {
  return entries.filter((e) => !e.fixedBy && !e.accepted);
}

export function acceptedFalsePositives(
  entries: readonly KnownFalsePositive[] = KNOWN_FALSE_POSITIVES,
): KnownFalsePositive[] {
  return entries.filter((e) => e.accepted && !e.fixedBy);
}

/** The families with two or more open members: the ones that have earned a mechanism. */
export function familiesAtTheBar(
  entries: readonly KnownFalsePositive[] = KNOWN_FALSE_POSITIVES,
): Array<{ family: string; members: string[] }> {
  const byFamily = new Map<string, string[]>();
  for (const entry of openFalsePositives(entries)) {
    byFamily.set(entry.family, [...(byFamily.get(entry.family) ?? []), entry.text]);
  }
  return [...byFamily.entries()]
    .filter(([, members]) => members.length >= 2)
    .map(([family, members]) => ({ family, members }));
}
