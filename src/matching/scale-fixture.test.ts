// Ported from adhd.me/src/matching/scale-fixture.test.ts on 2026-10-15.
//
// O142: what the clarifier selector has to work with as the roster grows, measured on synthetic
// rosters drawn from the fixture roster's rates. Every number was measured 2026-10-15.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { eachOf } from "./support/non-vacuous";
import { FIXTURE_ROSTER as clinicians } from "./support/fixture-roster";
import { clarifierScaleReport, syntheticRoster } from "./scale-fixture";

const ROOT = path.resolve(__dirname, "..", "..");
const ASK = "I need an ADHD assessment";
/** A request that reached nothing is ungated (M10), so every splitting facet is a candidate. */
const UNGATED = "help";

describe("the fixture never reaches a patient", () => {
  it("is imported by no non-test module under app/ or src/", () => {
    const IMPORTS_IT = /(?:from\s*["'][^"']*scale-fixture["']|import\s*\(\s*["'][^"']*scale-fixture["'])/;
    const offenders: string[] = [];
    const walk = (dir: string) => {
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) continue;
        if (IMPORTS_IT.test(readFileSync(full, "utf8"))) offenders.push(path.relative(ROOT, full));
      }
    };
    walk(path.join(ROOT, "app"));
    walk(path.join(ROOT, "src"));
    expect(offenders, `these would carry fabricated clinicians to a patient:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("carries no entry that could be mistaken for a real clinician", () => {
    for (const entry of eachOf(syntheticRoster(20, clinicians), "the synthetic roster")) {
      expect(entry.synthetic).toBe(true);
      expect(entry.booking.via).toBe("practice");
      expect(entry.id).toMatch(/^synthetic-/);
      expect(entry.name).toContain("Synthetic fixture");
    }
  });

  it("is deterministic, so the measurements below are pins and not flakes", () => {
    expect(syntheticRoster(20, clinicians)).toEqual(syntheticRoster(20, clinicians));
  });

  it("inherits the real roster's marginal rates rather than invented ones", () => {
    expect(clinicians.every((c) => c.languages.includes("English"))).toBe(true);
    const womenInReal = clinicians.filter((c) => c.gender === "woman").length;
    const womenInSynthetic = syntheticRoster(40, clinicians).filter((c) => c.gender === "woman").length;
    if (womenInReal === 0) expect(womenInSynthetic).toBe(0);
    else expect(womenInSynthetic).toBeGreaterThan(0);
    expect(womenInSynthetic).toBe(18);
  });
});

describe("Q3 item 10's premise", () => {
  it("is inert on the fixture roster: one evenness value across every question", () => {
    // Under the relevance gate the ADHD ask suggests exactly one facet (telehealth), so the
    // evenness sort has one value to work with — nothing to decide.
    const report = clarifierScaleReport(ASK, clinicians);
    expect(report.rosterSize).toBe(6);
    expect(report.distinctEvenness).toBe(1);
  });

  it("acquires real choices as the roster grows — on an ungated request", () => {
    // The gated ASK stays at one candidate at every size ([0, 1, 1, 1] measured): roster growth
    // cannot manufacture questions the reader never hinted at, which is M10's whole point. The
    // selector's own curve shows on an ungated request: 1 -> 4 -> 9 -> 15 distinct evenness.
    expect([3, 8, 20, 40].map((size) => clarifierScaleReport(ASK, syntheticRoster(size, clinicians)).distinctEvenness)).toEqual([0, 1, 1, 1]);
    const measured = [3, 8, 20, 40].map((size) => clarifierScaleReport(UNGATED, syntheticRoster(size, clinicians)));
    expect(measured.map((r) => r.distinctEvenness)).toEqual([1, 4, 9, 15]);
    const evenness = measured.map((r) => r.distinctEvenness);
    expect([...evenness].sort((a, b) => a - b)).toEqual(evenness);
  });

  it("turns duplicate questions into distinct ones", () => {
    const real = clarifierScaleReport(ASK, clinicians);
    expect([real.candidates, real.distinctSignatures]).toEqual([1, 1]);
    const atTwenty = clarifierScaleReport(UNGATED, syntheticRoster(20, clinicians));
    expect([atTwenty.candidates, atTwenty.distinctSignatures]).toEqual([27, 26]);
  });

  it("offers something the alphabetical tie-break alone would not", () => {
    const atTwenty = clarifierScaleReport(UNGATED, syntheticRoster(20, clinicians));
    expect(atTwenty.offered).not.toEqual(atTwenty.offeredIfAlphabetical);
    expect(atTwenty.offered).toEqual(["manner:direct", "pref:bulk-billing", "care:depression"]);
  });
});
