// Ported from adhd.me/src/matching/clarifier-relevance.test.ts on 2026-10-15.
//
// M10: the relevance gate. A clarifier about facet B is offered on a request that reached A
// only when A and B co-occur in at least MIN_COOCCURRENCE corpus entries. The derivation tests
// are verbatim; the measured-shape pins are re-measured on the psychiatry corpus and the
// fixture roster (2026-10-15).

import { describe, expect, it } from "vitest";
import { FIXTURE_ROSTER as clinicians } from "./support/fixture-roster";
import { matchQuality, needsFor } from "./rank";
import { clarifiers } from "./clarify";
import { MIN_COOCCURRENCE, cooccurrenceCounts, requestSuggests } from "./clarifier-relevance";
import { REACH_CORPUS } from "./corpus";
import { facetKey } from "./needs";

describe("M10 the co-occurrence map is derived, not authored", () => {
  it("counts an edge once per entry holding both facets, in both directions", () => {
    const counts = cooccurrenceCounts([
      { text: "a", reaches: ["care:x", "manner:y"] },
      { text: "b", reaches: ["care:x", "manner:y", "care:z"] },
      { text: "c", reaches: ["care:x"] },
    ]);
    expect(counts.get("care:x→manner:y")).toBe(2);
    expect(counts.get("manner:y→care:x")).toBe(2);
    expect(counts.get("care:x→care:z")).toBe(1);
    expect(counts.get("care:z→care:x")).toBe(1);
    expect(counts.get("care:x→care:x")).toBeUndefined();
  });

  it("a duplicated key inside one entry still counts that entry once", () => {
    const counts = cooccurrenceCounts([{ text: "a", reaches: ["care:x", "care:x", "manner:y"] }]);
    expect(counts.get("care:x→manner:y")).toBe(1);
  });

  it("the threshold is live: one authored example is a pattern's existence, not evidence of one", () => {
    const counts = cooccurrenceCounts([{ text: "a", reaches: ["care:x", "manner:y"] }]);
    expect(requestSuggests(["care:x"], "manner:y", counts)).toBe(false);
    const twice = cooccurrenceCounts([
      { text: "a", reaches: ["care:x", "manner:y"] },
      { text: "b", reaches: ["care:x", "manner:y"] },
    ]);
    expect(requestSuggests(["care:x"], "manner:y", twice)).toBe(true);
  });

  it("an empty request suggests nothing through this predicate — the carve-out lives in the caller", () => {
    expect(requestSuggests([], "care:anything")).toBe(false);
  });

  it("holds the measured shape of the real corpus", () => {
    // Measured 2026-10-15 on the psychiatry corpus: 28 multi-facet entries, 74 directed edges,
    // 10 of them at or above the threshold.
    const counts = cooccurrenceCounts();
    expect(REACH_CORPUS.filter((e) => new Set(e.reaches ?? []).size >= 2).length).toBe(28);
    expect(counts.size).toBe(74);
    expect([...counts.values()].filter((n) => n >= MIN_COOCCURRENCE).length).toBe(10);
  });

  it("names blind spot (1): corpus gold sets carry no language keys, so language suggests nothing yet", () => {
    expect(REACH_CORPUS.some((e) => e.reaches?.some((k) => k.startsWith("language:")))).toBe(false);
  });
});

describe("M10 the gate's measured effect on the tied queue (the unit's verify line)", () => {
  it("holds the pinned offer distribution over every tied corpus query", () => {
    // ADHD.ME measured this on "the GPs"; the fixture list the commonest query cannot order is
    // the three entries that all declare ADHD assessment. Measured 2026-10-15: nothing ties on
    // the whole roster, nine corpus requests tie on the trio, and every one of them earns a
    // partial offer (the gate leaves one or two questions, never zero, never the full three).
    const adhdTrio = clinicians.filter((c) => c.careAreas.includes("adhd-assessment"));
    let zero = 0;
    let partial = 0;
    let full = 0;
    const zeroed: string[] = [];
    let tiedOnTheWholeRoster = 0;
    for (const entry of REACH_CORPUS) {
      if (!entry.reaches?.length) continue;
      if (matchQuality(entry.text, clinicians) === "tied") tiedOnTheWholeRoster += 1;
      if (matchQuality(entry.text, adhdTrio) !== "tied") continue;
      const offered = clarifiers(entry.text, adhdTrio);
      if (offered.length === 0) {
        zero += 1;
        zeroed.push(entry.text);
      } else if (offered.length < 3) partial += 1;
      else full += 1;
    }
    expect(tiedOnTheWholeRoster).toBe(0);
    expect(full).toBe(0);
    expect(partial).toBe(9);
    expect(zero).toBe(0);
    expect(zeroed).toEqual([]);
  });

  it("zero questions is the designed outcome when everything the request suggests is already heard", () => {
    // Measured 2026-10-15: lgbtq-affirming co-occurs with nothing in the corpus, so a request
    // that reached only it is offered no question at all — correctly.
    const query = "a queer affirming psychiatrist";
    const reached = needsFor(query, clinicians).map((n) => facetKey(n.facet));
    expect(reached).toContain("manner:lgbtq-affirming");
    expect(clarifiers(query, clinicians)).toEqual([]);
  });

  it("the gate promotes a suggested question over a splitting one, not merely fewer questions", () => {
    // The roster splits on fifteen facets; the request suggests exactly one. Measured 2026-10-15.
    const query = "I think I might have ADHD";
    expect(clarifiers(query, clinicians).map((c) => c.facetKey)).toEqual(["pref:telehealth-first"]);
  });

  it("the commonest query in the product keeps an offer under the gate", () => {
    expect(clarifiers("I think I might have ADHD", clinicians).length).toBe(1);
  });

  it("a request that reached nothing is ungated — there is no stated interest to divert from", () => {
    expect(needsFor("help", clinicians)).toEqual([]);
    expect(clarifiers("help", clinicians).length).toBeGreaterThan(0);
  });

  it("the gate removes the interrogation-shaped offer, named", () => {
    // Facets the roster splits on that the ADHD request never hinted at.
    const query = "I think I might have ADHD";
    const before = ["care:psychosis", "care:eating-disorders", "manner:lgbtq-affirming"];
    const offeredNow = clarifiers(query, clinicians).map((c) => c.facetKey);
    for (const gated of before) expect(offeredNow).not.toContain(gated);
  });
});
