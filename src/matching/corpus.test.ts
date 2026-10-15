// Ported from adhd.me/src/matching/corpus.test.ts on 2026-10-15.
//
// The corpus is re-read on every run: every `reaches` holds, every `never` holds, every facet
// meets its measured floor, and an aspiration that is now heard demands promotion. The facet
// vocabulary comes from the discipline lexicon rather than ADHD.ME's onboarding tables.

import { describe, expect, it } from "vitest";
import { eachOf } from "./support/non-vacuous";
import { corpusReachByFacet, REACH_CORPUS, REACH_FLOORS } from "./corpus";
import { careAreaLabels, facetKey, mannerTraits, readNeeds } from "./needs";
import { matchableLanguages } from "./languages";

// The lexicon alone, as ADHD.ME read it and as extractor-quality.ts grades it. Languages are
// read against the roster (`languageNeeds`) and are a corpus aspiration until the corpus
// learns them (clarifier-relevance blind spot 1).
const read = (text: string) => readNeeds(text).map((n) => facetKey(n.facet));

describe("the corpus is well-formed", () => {
  const VALID_KEYS = new Set<string>([
    ...careAreaLabels().map((a) => `care:${a.id}`),
    ...mannerTraits().map((t) => `manner:${t}`),
    ...matchableLanguages().map((l) => `language:${l.toLowerCase()}`),
    "pref:woman-gp", "pref:man-gp", "pref:telehealth-first", "pref:longer-appointment", "pref:bulk-billing",
  ]);

  it("every key names a real facet", () => {
    // ADHD.ME also required every entry to pin something. Wattle's corpus carries entries that
    // deliberately pin NOTHING: the sentences registered in known-fps.ts, where a `never` pin
    // would be false today. Those are held to the register instead (known-fps.test.ts).
    for (const entry of eachOf(REACH_CORPUS, "the reach corpus")) {
      const keys = [...(entry.reaches ?? []), ...(entry.never ?? []), ...(entry.aspires ?? [])];
      for (const key of keys) expect(VALID_KEYS.has(key), `"${entry.text}" names unknown facet ${key}`).toBe(true);
    }
  });

  it("no text appears twice, because a duplicate averages away a regression", () => {
    const texts = REACH_CORPUS.map((entry) => entry.text);
    expect(new Set(texts).size).toBe(texts.length);
  });
});

describe("hard pins: every `reaches` holds, every `never` holds", () => {
  it.each(REACH_CORPUS.filter((entry) => entry.reaches?.length).map((entry) => [entry.text, entry] as const))(
    "reaches: %s",
    (_text, entry) => {
      const got = read(entry.text);
      for (const facet of entry.reaches!) expect(got, entry.text).toContain(facet);
    },
  );

  it.each(REACH_CORPUS.filter((entry) => entry.never?.length).map((entry) => [entry.text, entry] as const))(
    "never reaches: %s",
    (_text, entry) => {
      const got = read(entry.text);
      for (const facet of entry.never!) expect(got, entry.text).not.toContain(facet);
    },
  );
});

describe("the per-facet gate (the year plan's CI ratchet)", () => {
  const tally = new Map(corpusReachByFacet(read).map((row) => [row.facet, row]));

  it("every facet's heard count meets its measured floor — any drop fails the build", () => {
    for (const [facet, floor] of Object.entries(REACH_FLOORS)) {
      const row = tally.get(facet);
      expect(row, `${facet} has a floor but no corpus entries`).toBeDefined();
      expect(row!.heard, `${facet}: heard ${row!.heard} of ${row!.asked}, floor ${floor}`).toBeGreaterThanOrEqual(floor);
    }
  });

  it("every measured facet has a floor, so a new facet cannot ship ungated", () => {
    for (const [facet] of tally) {
      expect(REACH_FLOORS[facet], `${facet} is in the corpus but has no floor`).toBeDefined();
    }
  });

  it("an aspiration that is now heard demands promotion, not silence", () => {
    const met: string[] = [];
    for (const entry of REACH_CORPUS) {
      const got = new Set(read(entry.text));
      for (const facet of entry.aspires ?? []) {
        if (got.has(facet)) met.push(`"${entry.text}" now reaches ${facet} — promote it to \`reaches\` and raise the floor`);
      }
    }
    expect(met).toEqual([]);
  });
});

describe("O123 the founder question knows its own size", () => {
  const awaiting = REACH_CORPUS.filter((entry) => entry.awaitingFounder);

  it("is exactly the sentences that disclose a state the yaml reads as an ask", () => {
    // ADHD.ME's eleven were sentences the lexicon left UNHEARD pending the founder. Wattle's
    // one is the inverse case: the psychiatry yaml hears it today, and the founder has to say
    // whether a disclosure made in a finder is an ask for care. Measured 2026-10-15.
    expect(awaiting.map((e) => e.text).sort()).toEqual(["I drink a bottle of wine most nights"]);
    for (const entry of awaiting) expect(entry.awaitingFounder!.length).toBeGreaterThan(20);
  });

  it("never marks an entry that pins nothing, which would be a decision taken quietly", () => {
    for (const entry of awaiting) {
      const pinned = [...(entry.reaches ?? []), ...(entry.aspires ?? [])];
      expect(pinned, `${entry.text} is marked awaiting but pins nothing`).not.toHaveLength(0);
    }
  });
});
