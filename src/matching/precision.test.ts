// Ported from adhd.me/src/matching/precision.test.ts on 2026-10-15.
// O119: the precision counterpart to the reach ratchet.
//
// The corpus has always gated RECALL — per-facet heard counts with floors, so hearing less
// fails the build. Precision was gated only by `never` pins, and a `never` pin exists exactly
// where an author thought of the collision. This asserts the other direction: no corpus entry
// may hear a facet it declares in NO direction. When a new cue starts firing on a sentence
// nobody considered, this is what says so.
//
// Found on its first run: 32 of 508 entries were hearing an undeclared facet, and three cues
// were manufacturing reach — "properly" on structured (it fired on every sentence containing
// the adverb), bare "panic" on anxiety (it read "a doctor who won't panic about my drinking"),
// bare "overwhelmed" on emotional-regulation (it read a person describing their own state).
// All three are gone. The rest are now declared, five of them as known false positives.

import { describe, expect, it } from "vitest";
import { REACH_CORPUS } from "./corpus";
import { facetKey, readNeeds } from "./needs";
import { KNOWN_FALSE_POSITIVES, openFalsePositives } from "./known-fps";

type Entry = {
  text: string;
  reaches?: readonly string[];
  aspires?: readonly string[];
  never?: readonly string[];
};

function undeclaredReaches(): Array<{ text: string; extra: string[] }> {
  const out: Array<{ text: string; extra: string[] }> = [];
  for (const entry of REACH_CORPUS as ReadonlyArray<Entry>) {
    // A registered false positive is a declaration too: the register names the facet and the
    // sentence, so the reach is accounted for until the cue is narrowed (known-fps.ts).
    const registered = KNOWN_FALSE_POSITIVES.filter((fp) => fp.text === entry.text && !fp.fixedBy).map((fp) => fp.facet);
    const declared = new Set([...(entry.reaches ?? []), ...(entry.aspires ?? []), ...(entry.never ?? []), ...registered]);
    const heard = new Set(readNeeds(entry.text).map((need) => facetKey(need.facet)));
    const extra = [...heard].filter((key) => !declared.has(key));
    if (extra.length > 0) out.push({ text: entry.text, extra });
  }
  return out;
}

describe("O119 the corpus declares everything it hears", () => {
  /**
   * THE GATE. A cue that starts firing somewhere nobody looked now fails the build, and the
   * failure names the sentence — which is the whole difference between this and reading the
   * diff. Resolving one means deciding what the reach IS: a real reach gets declared, a false
   * one gets the cue fixed or pinned as today's truth with a retag demand.
   */
  it("no entry hears a facet it declares in no direction", () => {
    const undeclared = undeclaredReaches();
    expect(
      undeclared.map((row) => `"${row.text}" also hears ${row.extra.join(", ")}`),
    ).toEqual([]);
  });

  /**
   * Non-vacuity: the probe must actually be able to see an undeclared reach. A sentence that
   * plainly reaches a facet, checked against an empty declaration, has to be caught — otherwise
   * a green result above would mean nothing.
   */
  it("would catch one: the check is not vacuous", () => {
    const heard = readNeeds("I need an ADHD assessment").map((need) => facetKey(need.facet));
    expect(heard.length).toBeGreaterThan(0);
    const declared = new Set<string>();
    expect(heard.filter((key) => !declared.has(key)).length).toBeGreaterThan(0);
  });

  /**
   * THE CLASS THE PORT NAMED, and the reason it is one finding rather than seven.
   *
   * The psychiatry yaml cues several facets on a bare ordinary word — "ice", "flat", "checking",
   * "court", "memory", "free", "patient" — and each fires on a sentence that means something
   * else. They are pinned as today's truth in known-fps.ts; the fix is narrowing the yaml cue
   * to a pair, which is the founder's vocabulary and not this unit's to edit in passing.
   */
  it("the bare-word false positives are still exactly the ones the register holds", () => {
    const open = openFalsePositives().filter((fp) => fp.family === "bare-word-in-yaml");
    expect(open).toHaveLength(7);
    for (const fp of open) {
      expect(readNeeds(fp.text).map((need) => facetKey(need.facet)), fp.text).toContain(fp.facet);
    }
  });

  /**
   * THE FIFTH IS FIXED (O120), and the pin is kept with its expectation reversed because an
   * expectation flipping is the record of the fix.
   *
   * It was the only one of the five with real consequences: the child facet fired on "my son"
   * while the sentence asks for "my OWN assessment", so an adult would have been ranked against
   * paediatric GPs. The other four leak between manner facets and cost a shade of emphasis.
   */
  it("an adult asking for their own assessment is not sent to paediatric GPs", () => {
    const heard = readNeeds("after my son saw a child psychiatrist I recognised myself and now I want my own ADHD assessment")
      .map((need) => facetKey(need.facet));
    expect(heard).toContain("care:adhd-assessment");
    expect(heard).not.toContain("care:child-adolescent");
    // The counter-check: without "my own", the same words are a parent's ask and the child facet stands.
    expect(readNeeds("my son needs a child psychiatrist for an ADHD assessment").map((need) => facetKey(need.facet)))
      .toContain("care:child-adolescent");
  });
});
