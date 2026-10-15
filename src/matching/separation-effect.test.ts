// Ported from adhd.me/src/matching/separation-effect.test.ts on 2026-10-15.
//
// M5: the separation EFFECT size — the raw separation rate netted against a permuted null at
// the same roster size — so roster growth cannot masquerade as the matcher getting better or
// worse. Every number here was measured 2026-10-15 on the psychiatry corpus (107 reaching
// sentences), the six-entry fixture roster, and synthetic rosters drawn from its rates.

import { describe, expect, it } from "vitest";
import { FIXTURE_ROSTER as clinicians } from "./support/fixture-roster";
import { corpusRun, tieQualityReport } from "./tie-quality";
import { syntheticRoster } from "./scale-fixture";
import {
  isMonotonicNonDecreasing,
  realRosterSeparationEffect,
  separationEffect,
  type SeparationEffectReport,
} from "./separation-effect";

const SIZES = [2, 3, 5, 10, 25] as const;
const K = 50;

function separationEffectCurve(sizes: readonly number[], sentences: readonly string[], k: number): SeparationEffectReport[] {
  return sizes.map((size) => separationEffect(sentences, syntheticRoster(size, clinicians), k));
}

const PINNED_CURVE: SeparationEffectReport[] = [
  { rosterSize: 2, k: K, total: 107, observedSeparationRate: 0.467, nullMeanSeparationRate: 0.467, nullStdSeparationRate: 0, effect: 0 },
  { rosterSize: 3, k: K, total: 107, observedSeparationRate: 0.336, nullMeanSeparationRate: 0.343, nullStdSeparationRate: 0.004, effect: -0.007 },
  { rosterSize: 5, k: K, total: 107, observedSeparationRate: 0.439, nullMeanSeparationRate: 0.437, nullStdSeparationRate: 0.012, effect: 0.002 },
  { rosterSize: 10, k: K, total: 107, observedSeparationRate: 0.336, nullMeanSeparationRate: 0.317, nullStdSeparationRate: 0.019, effect: 0.019 },
  { rosterSize: 25, k: K, total: 107, observedSeparationRate: 0.065, nullMeanSeparationRate: 0.067, nullStdSeparationRate: 0.013, effect: -0.002 },
];

const PINNED_REAL: SeparationEffectReport = {
  rosterSize: 6,
  k: K,
  total: 107,
  observedSeparationRate: 0.551,
  nullMeanSeparationRate: 0.58,
  nullStdSeparationRate: 0.02,
  effect: -0.029,
};

describe("M5 the separation effect size, over synthetic rosters", () => {
  const curve = separationEffectCurve(SIZES, corpusRun(), K);

  it("holds the measured curve exactly, in both directions", () => {
    expect(curve).toEqual(PINNED_CURVE);
  });

  it(
    "REPRODUCES THE DEFECT ON THE RAW SCALAR, using nothing but the fixture already in the tree: " +
      "shrinking the synthetic roster 40 -> 25 (zero real declaration change — `syntheticRoster` " +
      "draws every facet independently, no correlation is planted) moves the naive " +
      "separationRate 0.047 -> 0.065, and 3 -> 2 moves it 0.336 -> 0.467: a size artefact, not a matcher change",
    () => {
      const naive = (size: number) => tieQualityReport(corpusRun(), syntheticRoster(size, clinicians)).separationRate;
      expect(naive(40)).toBe(0.047);
      expect(naive(25)).toBe(0.065);
      expect(naive(25)).toBeGreaterThan(naive(40));
      expect(naive(3)).toBe(0.336);
      expect(naive(2)).toBe(0.467);
      expect(naive(2)).toBeGreaterThan(naive(3));
    },
  );

  it(
    "AND THE EFFECT SIZE DOES NOT: netted against a permuted null computed at the SAME size, " +
      "every point on the curve sits within 0.02 of zero while the raw scalar it is computed " +
      "from swings between 0.047 and 0.467 across the same sizes — N=2's null is exactly " +
      "degenerate (effect exactly 0)",
    () => {
      const size2 = curve.find((point) => point.rosterSize === 2)!;
      expect(size2.effect).toBe(0);
      for (const point of curve) expect(Math.abs(point.effect)).toBeLessThan(0.02);
    },
  );

  it("is monotonic non-decreasing in roster size within the null's own noise floor", () => {
    expect(isMonotonicNonDecreasing(curve)).toBe(true);
  });

  it(
    "NON-VACUOUS, FIRST WAY: the tolerance is doing real work, not passing by construction. " +
      "This exact measured curve dips from N=2 to N=3 and from N=10 to N=25 (a single synthetic " +
      "roster's own sampling noise, not a defect) — a ZERO-tolerance check on this SAME curve " +
      "fails, so the default's `true` above is the tolerance correctly absorbing named noise",
    () => {
      const size10 = curve.find((point) => point.rosterSize === 10)!;
      const size25 = curve.find((point) => point.rosterSize === 25)!;
      expect(size25.effect).toBeLessThan(size10.effect);
      expect(isMonotonicNonDecreasing(curve, 0)).toBe(false);
    },
  );

  it(
    "NON-VACUOUS, SECOND WAY: a real disqualifying regression — a drop far larger than any " +
      "measured null std — still fails at the default tolerance",
    () => {
      const mutated = curve.map((point, index) => (index === 3 ? { ...point, effect: point.effect - 0.208 } : point));
      expect(isMonotonicNonDecreasing(mutated)).toBe(false);
    },
  );

  it("reports the named weakness rather than hiding it: the null is degenerate at N=2, and thin at N=3", () => {
    const size2 = curve.find((point) => point.rosterSize === 2)!;
    const size3 = curve.find((point) => point.rosterSize === 3)!;
    expect(size2.nullStdSeparationRate).toBe(0);
    expect(size3.nullStdSeparationRate).toBe(0.004);
  });
});

describe("M5 the fixture roster's own effect (six entries)", () => {
  it("holds the measured baseline exactly", () => {
    expect(realRosterSeparationEffect(clinicians, K)).toEqual(PINNED_REAL);
  });

  it(
    "reads as: the metric is not degenerate at six. The shuffles genuinely disagree (std 0.02), " +
      "and the fixture's real arrangement sits 0.029 BELOW their mean — about one and a half " +
      "standard deviations. That is a fact about this fixture, whose declarations were chosen " +
      "to be readable rather than to maximise separation, and it is pinned so a change in " +
      "either direction is faced deliberately",
    () => {
      const report = realRosterSeparationEffect(clinicians, K);
      expect(report.effect).toBe(-0.029);
      expect(report.nullStdSeparationRate).toBeGreaterThan(0);
      expect(report.observedSeparationRate).toBeLessThan(report.nullMeanSeparationRate);
    },
  );

  it("is deterministic: two independent calls at the same k and seed agree exactly", () => {
    expect(realRosterSeparationEffect(clinicians, K)).toEqual(separationEffect(corpusRun(), clinicians, K, "M5-real"));
  });
});
