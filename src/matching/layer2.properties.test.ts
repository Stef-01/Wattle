// Layer 2's invariants, for all inputs (CLAUDE.md: ranking rules are properties, not examples).
// Written on 2026-10-15. Sentences are composed from the mvp lexicon's own words plus fillers,
// weights are drawn at random, and the roster's personal data is randomly stripped, so every run
// walks the seams the plan names: never promote across a clinical band, missing data is neutral,
// zero weights reproduce Layer 1.

import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { lexiconFor, lexiconCues } from "./needs";
import { humanFitLexicon } from "./human-fit";
import { ZERO_WEIGHTS, match, rerank, type HumanFitWeights } from "./index";
import { MVP, MVP_DOCTORS } from "./support/fixture-mvp-doctors";
import type { Doctor, Ranked } from "./types";

const SEED = 20261015;
const TODAY = new Date("2026-10-15T00:00:00Z");

const CUE_WORDS = [
  ...new Set([...lexiconCues(lexiconFor(MVP)), ...lexiconCues(humanFitLexicon(MVP))].flatMap((cue) => cue.phrase.split(/\s+/))),
].filter((word) => !/^(suicid|overdos)/.test(word));

const FILLERS = ["please", "really", "someone", "a", "the", "my", "for", "and", "i", "want", "need", "don't", "not", "no", "just", "but", ".", ",", "doctor", "who"];

const sentence = fc.array(fc.constantFrom(...CUE_WORDS, ...FILLERS), { minLength: 1, maxLength: 16 }).map((words) => words.join(" "));

const weight = fc.oneof(fc.constant(0), fc.integer({ min: 0, max: 5 }), fc.double({ min: 0, max: 3, noNaN: true }));
const weights: fc.Arbitrary<HumanFitWeights> = fc.record({ philosophy: weight, livedExperience: weight, research: weight, clinicalInterests: weight, populations: weight });

/** The roster with each doctor's Layer-2 data kept or stripped at random. */
const roster: fc.Arbitrary<Doctor[]> = fc
  .array(fc.boolean(), { minLength: MVP_DOCTORS.length, maxLength: MVP_DOCTORS.length })
  .map((keep) =>
    MVP_DOCTORS.map((doctor, index) => {
      if (keep[index]) return doctor;
      const { personal: _p, researchTopics: _r, clinicalInterests: _c, ...stripped } = doctor;
      return stripped;
    }),
  );

const byPosition = (results: readonly Ranked[]) => [...results].sort((a, b) => a.layer1.position - b.layer1.position);
const bandSequence = (results: readonly Ranked[]) => results.map((r) => r.layer1.band);

describe("Layer 2 invariants, for all inputs", () => {
  it("never reorders across a clinical band: the band sequence is Layer 1's, whatever the weights", () => {
    fc.assert(
      fc.property(sentence, weights, roster, (text, w, doctors) => {
        const result = match(text, null, doctors, { discipline: MVP, weights: w, today: TODAY });
        if (result.emergency) return;
        expect(bandSequence(result.survivors)).toEqual(bandSequence(byPosition(result.survivors)));
        // Bands are contiguous: once a band ends, it never reappears.
        const seen = new Set<string>();
        let current: string | null = null;
        for (const band of bandSequence(result.survivors)) {
          if (band !== current) {
            expect(seen.has(band)).toBe(false);
            seen.add(band);
            current = band;
          }
        }
      }),
      { seed: SEED, numRuns: 200 },
    );
  });

  it("zero weights reproduce the Layer-1 order exactly, with every human-fit score at zero", () => {
    fc.assert(
      fc.property(sentence, roster, (text, doctors) => {
        const result = match(text, null, doctors, { discipline: MVP, weights: ZERO_WEIGHTS, today: TODAY });
        if (result.emergency) return;
        expect(result.survivors.map((r) => r.doctor.id)).toEqual(byPosition(result.survivors).map((r) => r.doctor.id));
        for (const card of result.survivors) expect(card.humanFit.score).toBe(0);
        const again = rerank(result.survivors, result.intent!, ZERO_WEIGHTS, MVP);
        expect(again.map((r) => r.doctor.id)).toEqual(result.survivors.map((r) => r.doctor.id));
      }),
      { seed: SEED, numRuns: 200 },
    );
  });

  it("missing personal data never ranks below present data inside a band unless the present data matches", () => {
    fc.assert(
      fc.property(sentence, weights, roster, (text, w, doctors) => {
        const result = match(text, null, doctors, { discipline: MVP, weights: w, today: TODAY });
        if (result.emergency) return;
        const list = result.survivors;
        for (let i = 0; i < list.length; i += 1) {
          for (let j = i + 1; j < list.length; j += 1) {
            const above = list[i]!;
            const below = list[j]!;
            if (above.layer1.band !== below.layer1.band) continue;
            if (below.humanFit.basis === "none" && above.humanFit.basis !== "none" && above.layer1.position > below.layer1.position) {
              // A profile was MOVED above a missing one only because it actually aligned.
              expect(above.humanFit.score).toBeGreaterThan(0);
              expect(above.humanFit.reasons.length).toBeGreaterThan(0);
            }
            if (above.humanFit.score === below.humanFit.score) {
              // Equal human fit falls back to the Layer-1 position, never to who has data.
              expect(above.layer1.position).toBeLessThan(below.layer1.position);
            } else {
              expect(above.humanFit.score).toBeGreaterThan(below.humanFit.score);
            }
          }
        }
      }),
      { seed: SEED, numRuns: 200 },
    );
  });

  it("rerank is idempotent and pure: the same list, intent and weights give the same order twice", () => {
    fc.assert(
      fc.property(sentence, weights, (text, w) => {
        const result = match(text, null, MVP_DOCTORS, { discipline: MVP, today: TODAY });
        if (result.emergency) return;
        const once = rerank(result.survivors, result.intent!, w, MVP);
        const twice = rerank(once, result.intent!, w, MVP);
        expect(twice.map((r) => r.doctor.id)).toEqual(once.map((r) => r.doctor.id));
        expect(once.map((r) => r.humanFit.score)).toEqual(twice.map((r) => r.humanFit.score));
      }),
      { seed: SEED, numRuns: 150 },
    );
  });

  it("a human-fit score is the weighted count of its own reasons", () => {
    fc.assert(
      fc.property(sentence, weights, (text, w) => {
        const result = match(text, null, MVP_DOCTORS, { discipline: MVP, weights: w, today: TODAY });
        if (result.emergency) return;
        for (const card of result.survivors) {
          const weightOf = (field: string): number => {
            if (field === "personal.livedExperience") return w.livedExperience;
            if (field === "researchTopics") return w.research;
            if (field === "clinicalInterests") return w.clinicalInterests;
            if (field === "personal.enjoysServing" || field === "populations") return w.populations;
            if (field === "personal") return 0;
            return w.philosophy;
          };
          const sum = card.humanFit.reasons.reduce((total, reason) => total + weightOf(reason.field), 0);
          expect(card.humanFit.score).toBeCloseTo(sum, 3);
        }
      }),
      { seed: SEED, numRuns: 150 },
    );
  });
});
