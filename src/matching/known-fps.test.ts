// Ported from adhd.me/src/matching/known-fps.test.ts on 2026-10-15.
//
// W231 (O131): the false-positive register, checked in both directions, and the O84 bar.

import { describe, expect, it } from "vitest";
import { eachOf } from "./support/non-vacuous";
import { facetKey, readNeeds } from "./needs";
import { REACH_CORPUS } from "./corpus";
import {
  acceptedFalsePositives,
  familiesAtTheBar,
  openFalsePositives,
  KNOWN_FALSE_POSITIVES,
  type KnownFalsePositive,
} from "./known-fps";

const facets = (text: string) => readNeeds(text).map((need) => facetKey(need.facet));

describe("O131 the false-positive register knows what is still true", () => {
  it("every OPEN or ACCEPTED entry still exhibits its false positive", () => {
    for (const fp of eachOf([...openFalsePositives(), ...acceptedFalsePositives()], "the open and accepted false positives")) {
      expect(facets(fp.text), `${fp.pinnedBy}: "${fp.text}" no longer reaches ${fp.facet}`)
        .toContain(fp.facet);
    }
  });

  it("every FIXED entry no longer exhibits it, so a fix cannot silently regress", () => {
    for (const fp of KNOWN_FALSE_POSITIVES.filter((e) => e.fixedBy)) {
      expect(facets(fp.text), `${fp.fixedBy} fixed "${fp.text}" and it is reaching ${fp.facet} again`)
        .not.toContain(fp.facet);
    }
  });

  it("names a real corpus sentence, so the register cannot drift from the thing it describes", () => {
    const corpus = new Set(REACH_CORPUS.map((e) => e.text));
    for (const fp of eachOf(KNOWN_FALSE_POSITIVES, "the known-false-positive register")) {
      expect(corpus.has(fp.text), `"${fp.text}" is registered but is not in the corpus`).toBe(true);
    }
  });

  it("carries a family and a pinning unit on every entry", () => {
    for (const fp of eachOf(KNOWN_FALSE_POSITIVES, "the known-false-positive register")) {
      expect(fp.family.length, `${fp.text} has no family`).toBeGreaterThan(0);
      expect(fp.pinnedBy).toMatch(/^[OW]\d+$/);
    }
  });

  it("gives every acceptance a reason, because one without is indistinguishable from not looking", () => {
    for (const fp of acceptedFalsePositives()) {
      expect(fp.accepted!.length, `${fp.text} is accepted with no rationale`).toBeGreaterThan(60);
    }
  });
});

describe("O131 the two-case bar", () => {
  it("fails the build when a NEW family has earned its mechanism", () => {
    // The bare-word family is at the bar by design: its mechanism is narrowing seven single-word
    // cues in disciplines/psychiatry.yaml, which is the founder's vocabulary and not a matcher
    // rule. It is named here so it stays visible; any OTHER family reaching two open cases
    // still fails the build.
    const earned = familiesAtTheBar();
    expect(earned.map((f) => f.family)).toEqual(["bare-word-in-yaml"]);
    expect(earned[0]!.members.length).toBe(7);
  });

  it("would fire on a second case: the bar is not vacuous", () => {
    const seeded: KnownFalsePositive[] = [
      { text: "one", facet: "care:anxiety", family: "negated-saying-of-a-state", pinnedBy: "O128" },
      { text: "two", facet: "care:anxiety", family: "negated-saying-of-a-state", pinnedBy: "O999" },
    ];
    expect(familiesAtTheBar(seeded).map((f) => f.family)).toEqual(["negated-saying-of-a-state"]);
  });

  it("does not count a family whose cases are fixed", () => {
    const seeded: KnownFalsePositive[] = [
      { text: "one", facet: "care:anxiety", family: "f", pinnedBy: "O1", fixedBy: "O2" },
      { text: "two", facet: "care:anxiety", family: "f", pinnedBy: "O1", fixedBy: "O2" },
    ];
    expect(familiesAtTheBar(seeded)).toEqual([]);
  });
});
