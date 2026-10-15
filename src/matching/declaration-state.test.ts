// Ported from adhd.me/src/matching/declaration-state.test.ts on 2026-10-15.
//
// M8: express "we cannot tell" (F10). `facetStrength` returns 0 for two situations the reader
// experiences differently — a clinician who was ASKED and said no, and one nobody ever asked —
// and this module tells them apart. Facet ids are psychiatry's; the roster is the fixture.

import { describe, expect, it } from "vitest";
import { FIXTURE_ROSTER as clinicians } from "./support/fixture-roster";
import { syntheticClinician } from "./support/synthetic-clinician";
import type { NeedSignal } from "./needs";
import { REACH_CORPUS } from "./corpus";
import {
  auditSeparation,
  declarationSentence,
  declarationState,
  intervalsDisjoint,
  intervalsSeparate,
  scoreInterval,
} from "./declaration-state";

const careNeed = (area: string, weight = 24): NeedSignal => ({
  facet: { kind: "care", area },
  matched: "test",
  label: "the care area",
  weight,
});

const womanGpNeed: NeedSignal = {
  facet: { kind: "preference", preference: "woman-gp" },
  matched: "test",
  label: "a woman GP",
  weight: 20,
};

const telehealthNeed: NeedSignal = {
  facet: { kind: "preference", preference: "telehealth-first" },
  matched: "test",
  label: "telehealth first appointment",
  weight: 20,
};

describe("M8: declarationState", () => {
  it("is 'declared' for an often declaration and for a sometimes one — both are certain", () => {
    const often = syntheticClinician({ careAreas: ["depression"] });
    const sometimes = syntheticClinician({ careAreas: [], careAreasSometimes: ["depression"] });
    expect(declarationState(often, careNeed("depression").facet)).toBe("declared");
    expect(declarationState(sometimes, careNeed("depression").facet)).toBe("declared");
  });

  it("is 'undeclared', never 'declared-no', for every facet kind except gender", () => {
    const silent = syntheticClinician({ careAreas: [], careAreasSometimes: [], manner: [], languages: ["English"] });
    expect(declarationState(silent, careNeed("depression").facet)).toBe("undeclared");
    expect(declarationState(silent, { kind: "manner", trait: "gentle" })).toBe("undeclared");
    expect(declarationState(silent, { kind: "language", language: "Tamil" })).toBe("undeclared");
    expect(declarationState(silent, telehealthNeed.facet)).toBe("undeclared");
  });

  it("is 'declared-no' for woman-gp exactly when gender is real and not 'woman' — the one exempt field", () => {
    const man = syntheticClinician({ gender: "man" });
    const nonBinary = syntheticClinician({ gender: "non-binary" });
    const woman = syntheticClinician({ gender: "woman" });
    expect(declarationState(man, womanGpNeed.facet)).toBe("declared-no");
    expect(declarationState(nonBinary, womanGpNeed.facet)).toBe("declared-no");
    expect(declarationState(woman, womanGpNeed.facet)).toBe("declared");
  });

  it("is 'undeclared' for woman-gp when the gender is 'not-declared' (the adapter's value for a doctor with no gender observation)", () => {
    // A `Doctor` with no gender observation must not be told it "does not apply" to them.
    const undeclared = syntheticClinician({ gender: "not-declared" });
    expect(declarationState(undeclared, womanGpNeed.facet)).toBe("undeclared");
  });
});

describe("M8: scoreInterval", () => {
  it("is an exact point for a declared value, whichever grade it was declared at", () => {
    const often = syntheticClinician({ careAreas: ["depression"] });
    const sometimes = syntheticClinician({ careAreas: [], careAreasSometimes: ["depression"] });
    const need = careNeed("depression", 24);
    expect(scoreInterval(often, need)).toEqual({ lo: 24, hi: 24, state: "declared" });
    expect(scoreInterval(sometimes, need)).toEqual({ lo: 12, hi: 12, state: "declared" });
  });

  it("is the zero-width [0, 0] for a real declared-no", () => {
    const man = syntheticClinician({ gender: "man" });
    expect(scoreInterval(man, womanGpNeed)).toEqual({ lo: 0, hi: 0, state: "declared-no" });
  });

  it("is the full [0, weight] range for an undeclared facet — this is the whole point", () => {
    const silent = syntheticClinician({ careAreas: [], careAreasSometimes: [] });
    const need = careNeed("depression", 24);
    expect(scoreInterval(silent, need)).toEqual({ lo: 0, hi: 24, state: "undeclared" });
  });
});

describe("M8: intervalsDisjoint / intervalsSeparate — the ambiguity, proven rather than described", () => {
  it("does NOT separate a declared clinician from an undeclared one — the exact defect F10 names", () => {
    const often = syntheticClinician({ id: "often", careAreas: ["depression"] });
    const silent = syntheticClinician({ id: "silent", careAreas: [], careAreasSometimes: [] });
    const need = careNeed("depression", 24);
    expect(intervalsDisjoint(scoreInterval(often, need), scoreInterval(silent, need))).toBe(false);
    expect(intervalsSeparate(need, [often, silent])).toBe(false);
  });

  it("separates a declared-no clinician from a declared-yes one — the one real case in this schema", () => {
    const man = syntheticClinician({ id: "man", gender: "man" });
    const woman = syntheticClinician({ id: "woman", gender: "woman" });
    expect(intervalsDisjoint(scoreInterval(man, womanGpNeed), scoreInterval(woman, womanGpNeed))).toBe(true);
    expect(intervalsSeparate(womanGpNeed, [man, woman])).toBe(true);
  });

  it("separates two DECLARED clinicians at different grades — certainty needs no third state", () => {
    const often = syntheticClinician({ id: "often", careAreas: ["depression"] });
    const sometimes = syntheticClinician({ id: "sometimes", careAreas: [], careAreasSometimes: ["depression"] });
    const need = careNeed("depression", 24);
    expect(intervalsSeparate(need, [often, sometimes])).toBe(true);
  });

  it("does not separate two undeclared clinicians from each other", () => {
    const a = syntheticClinician({ id: "a", careAreas: [], careAreasSometimes: [] });
    const b = syntheticClinician({ id: "b", careAreas: [], careAreasSometimes: [] });
    expect(intervalsSeparate(careNeed("depression", 24), [a, b])).toBe(false);
  });
});

describe("M8: declarationSentence — three states, three sentences, never the same words", () => {
  const sentences = (["declared", "declared-no", "undeclared"] as const).map((state) =>
    declarationSentence(womanGpNeed, state),
  );

  it("gives every state its own wording", () => {
    expect(new Set(sentences).size).toBe(3);
  });

  it("says 'no' when the state is 'no', and never claims certainty when it is not stated", () => {
    expect(declarationSentence(womanGpNeed, "declared-no")).toMatch(/does not apply/);
    expect(declarationSentence(womanGpNeed, "undeclared")).toMatch(/cannot say/);
    expect(declarationSentence(womanGpNeed, "undeclared")).not.toMatch(/does not apply/);
  });
});

describe("M8: auditSeparation — the module header's claim, pinned against the fixture roster and corpus", () => {
  it("measures the real gap between 'differs' and 'is provably different', not assumed", () => {
    // Measured 2026-10-15: of 149 (sentence, facet) pairs where the roster's values differ,
    // only 20 are provably different; the three separating facets are the two care areas a
    // fixture entry declares "sometimes" against another's "often", and gender.
    const result = auditSeparation(
      REACH_CORPUS.map((entry) => entry.text),
      clinicians,
    );
    expect(result.valueDiffers).toBe(149);
    // 22 after man-gp joined the declared-no set alongside woman-gp (re-measured 2026-10-15).
    expect(result.intervalSeparates).toBe(22);
    expect(result.ambiguous).toBe(127);
    expect(result.separatingFacetKeys).toEqual([
      "care:autism-assessment",
      "care:trauma",
      "pref:man-gp",
      "pref:woman-gp",
    ]);
  });

  it("is non-vacuous: a roster with no real negative anywhere separates on nothing", () => {
    const a = syntheticClinician({ id: "a", gender: "man", careAreas: ["depression"] });
    const b = syntheticClinician({ id: "b", gender: "man", careAreas: [], careAreasSometimes: [] });
    const result = auditSeparation(["I want help with depression"], [a, b]);
    expect(result.valueDiffers).toBeGreaterThan(0);
    expect(result.intervalSeparates).toBe(0);
    expect(result.separatingFacetKeys).toEqual([]);
  });

  it("is non-vacuous the other way: a synthetic gender split is counted as separating", () => {
    const man = syntheticClinician({ id: "man", gender: "man" });
    const woman = syntheticClinician({ id: "woman", gender: "woman" });
    const result = auditSeparation(["I'd like to see a woman GP"], [man, woman]);
    expect(result.intervalSeparates).toBeGreaterThan(0);
    expect(result.separatingFacetKeys).toEqual(["pref:woman-gp"]);
  });
});
