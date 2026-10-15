// Ported from adhd.me/src/matching/clarify.test.ts on 2026-10-15.
//
// Every property ADHD.ME asserted is kept; the roster is the fixture roster and the sentences
// are psychiatry ones. Where ADHD.ME narrowed to "the GPs" to find a tied list, this narrows to
// the three fixture entries that all declare ADHD assessment, which is the same shape: a list
// the commonest query cannot order.

import { describe, expect, it } from "vitest";
import { eachOf } from "./support/non-vacuous";
import { clarifiers, PREF_PROMPTS } from "./clarify";
import { FIXTURE_ROSTER as clinicians } from "./support/fixture-roster";
import { matchQuality, rankClinicians } from "./rank";
import { facetKey, readNeeds } from "./needs";

/** The list a reader asking about ADHD is shown: every entry declares it, so the words cannot order it. */
const adhdTrio = clinicians.filter((c) => c.careAreas.includes("adhd-assessment"));

describe("W225 a question only earns its place if the answer changes the order", () => {
  it.each(clarifiers("I think I might have ADHD", clinicians).map((c) => [c.prompt, c.answer]))(
    "answering %s actually reorders the roster",
    (_prompt, answer) => {
      const before = "I think I might have ADHD";
      const after = `${before}, ${answer}`;
      const order = (query: string) => rankClinicians(query, clinicians).map((c) => c.id).join(">");
      expect(order(after)).not.toBe(order(before));
      expect(matchQuality(after, clinicians)).toBe("informed");
    },
  );

  it("still breaks the tie on the list a reader asking about ADHD is shown", () => {
    const before = "I think I might have ADHD";
    expect(adhdTrio.length).toBe(3);
    expect(matchQuality(before, adhdTrio)).toBe("tied");
    const offered = clarifiers(before, adhdTrio);
    expect(offered.length).toBeGreaterThan(0);
    for (const { answer } of offered) {
      expect(matchQuality(`${before}, ${answer}`, adhdTrio)).toBe("informed");
    }
  });

  it("offers something for the commonest query in the product", () => {
    expect(clarifiers("I think I might have ADHD", clinicians).length).toBeGreaterThan(0);
  });

  it("offers something when nothing at all was understood", () => {
    expect(readNeeds("help")).toEqual([]);
    expect(clarifiers("help", clinicians).length).toBeGreaterThan(0);
  });

  it("never asks about something the reader already said", () => {
    const query = "I want a longer first appointment and help with the anxiety";
    const asked = new Set(readNeeds(query).map((need) => need.label));
    for (const clarifier of eachOf(clarifiers(query, clinicians), "the clarifiers this query earns")) {
      expect(readNeeds(clarifier.answer).every((need) => !asked.has(need.label))).toBe(true);
    }
  });

  it("never asks about a facet the whole roster shares or none of it does", () => {
    for (const clarifier of eachOf(clarifiers("help", clinicians), "the clarifiers the full roster earns")) {
      expect(clarifier.heldBy).toBeGreaterThan(0);
      expect(clarifier.heldBy).toBeLessThan(clinicians.length);
    }
  });

  it("asks nothing when there is nobody to choose between", () => {
    expect(clarifiers("help", clinicians.slice(0, 1))).toEqual([]);
    expect(clarifiers("help", [])).toEqual([]);
  });

  it("is deterministic", () => {
    expect(clarifiers("help", clinicians)).toEqual(clarifiers("help", clinicians));
  });
});

describe("W225 the answer is the reader's sentence, not a facet name", () => {
  it.each(clarifiers("help", clinicians).map((c) => [c.prompt, c.answer]))(
    "the answer to %s reads back into the vocabulary",
    (_prompt, answer) => {
      expect(readNeeds(answer).length).toBeGreaterThan(0);
    },
  );

  it("changes who is first, not merely the scores", () => {
    // "anxiety and depression" earns three questions on the fixture roster (gentle, bulk
    // billing, a woman clinician) and two of them put a different entry first — measured
    // 2026-10-15. The commonest ADHD query earns exactly one question under the relevance gate,
    // so it cannot carry a set-size assertion.
    const base = "anxiety and depression";
    const offered = clarifiers(base, clinicians);
    expect(offered.length).toBeGreaterThan(1);
    const orders = offered.map((clarifier) => rankClinicians(`${base}, ${clarifier.answer}`, clinicians)[0]!.id);
    expect(new Set(orders).size).toBeGreaterThan(1);
  });
});

describe("O5 preference clarifiers (F7)", () => {
  it("asks about a preference the roster splits on", () => {
    const keys = clarifiers("hello", clinicians, 20).map((c) => c.facetKey);
    expect(keys).toContain("pref:telehealth-first");
  });

  it("never asks about a preference nobody on the roster holds", () => {
    const noWomen = clinicians.filter((c) => c.gender !== "woman");
    expect(noWomen.length).toBeGreaterThan(1);
    expect(clarifiers("hello", noWomen, 20).map((c) => c.facetKey)).not.toContain("pref:woman-gp");
    expect(clarifiers("hello", clinicians, 20).map((c) => c.facetKey)).toContain("pref:woman-gp");
  });

  it("every preference answer re-reads to the facet its question is about", () => {
    for (const [key, copy] of Object.entries(PREF_PROMPTS)) {
      const reached = readNeeds(copy.answer).map((need) => facetKey(need.facet));
      expect(reached, `${copy.answer} does not reach ${key}`).toContain(key);
    }
  });

  it("does not ask what the reader already said", () => {
    const keys = clarifiers("I want the first appointment by phone", clinicians, 20).map((c) => c.facetKey);
    expect(keys).not.toContain("pref:telehealth-first");
  });
});
