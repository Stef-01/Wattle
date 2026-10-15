// Ported from adhd.me/src/matching/extractor-quality.test.ts on 2026-10-15.
//
// M6: the parser's own report, apart from any ranking outcome. The baseline is re-measured on
// the psychiatry corpus and the fixture roster (2026-10-15); the non-vacuity block is verbatim
// with psychiatry facet ids.

import { describe, expect, it } from "vitest";
import type { CorpusEntry } from "./corpus";
import { FIXTURE_ROSTER as clinicians } from "./support/fixture-roster";
import {
  correctlyParsedTexts,
  extractorReport,
  gradedEntries,
  gradeExtraction,
  rankingLadderAll,
  rankingLadderCorrectlyParsed,
} from "./extractor-quality";

describe("M6 the parser's own report, apart from any ranking outcome", () => {
  it("holds the measured baseline exactly, in both directions", () => {
    // Measured 2026-10-15: 107 graded sentences, 142 gold facets, every one hit, nothing extra.
    expect(extractorReport()).toEqual({
      sampleSize: 107,
      goldFacetCount: 142,
      hitCount: 142,
      recall: 1,
      extractedCount: 142,
      extraCount: 0,
      precision: 1,
      correctlyParsedCount: 107,
      correctlyParsedRate: 1,
    });
  });

  it("is graded over exactly the same reaching population the tie-quality KPI already pins", () => {
    expect(gradedEntries().length).toBe(107);
  });

  it("the ranking ladder split is IDENTICAL today, and that identity is itself the finding", () => {
    // Measured 2026-10-15 on the six-entry fixture roster: 105 informed, 2 unserved (the two
    // longer-appointment asks, which no fixture entry declares), nothing tied or unmatched.
    const all = rankingLadderAll(clinicians);
    const parsed = rankingLadderCorrectlyParsed(clinicians);
    expect(all).toEqual({ total: 107, informed: 105, tied: 0, unmatched: 0, unserved: 2 });
    expect(parsed).toEqual(all);
    expect(parsed.informed).toBe(105);
    expect(parsed.tied + parsed.unmatched + parsed.unserved).toBe(2);
  });
});

describe("M6 non-vacuity: the split can fail, and the report says so when it does", () => {
  const REAL_TEXT = "I need an ADHD assessment";
  const REAL_FACET = "care:adhd-assessment";

  it("a wrong gold set registers as a miss, not a silent pass", () => {
    const badEntry: CorpusEntry = { text: REAL_TEXT, reaches: ["care:psychosis"] };
    const result = gradeExtraction(badEntry);
    expect(result.misses).toEqual(["care:psychosis"]);
    expect(result.extras).toEqual([REAL_FACET]);
    expect(result.correctlyParsed).toBe(false);
  });

  it("an empty gold set on a reaching sentence registers the reach as an extra", () => {
    const emptyGold: CorpusEntry = { text: REAL_TEXT, reaches: [] };
    const result = gradeExtraction(emptyGold);
    expect(result.hits).toEqual([]);
    expect(result.extras).toEqual([REAL_FACET]);
    expect(result.correctlyParsed).toBe(false);
  });

  it("a correct gold set still registers as fully hit, so the checker is not one-directional", () => {
    const goodEntry: CorpusEntry = { text: REAL_TEXT, reaches: [REAL_FACET] };
    const result = gradeExtraction(goodEntry);
    expect(result.hits).toEqual([REAL_FACET]);
    expect(result.misses).toEqual([]);
    expect(result.extras).toEqual([]);
    expect(result.correctlyParsed).toBe(true);
  });

  it("extractorReport's recall and precision both fall on a mixed synthetic sample", () => {
    const mixed: CorpusEntry[] = [
      { text: REAL_TEXT, reaches: [REAL_FACET] },
      { text: REAL_TEXT, reaches: ["care:psychosis"] },
    ];
    const report = extractorReport(mixed);
    expect(report.sampleSize).toBe(2);
    expect(report.goldFacetCount).toBe(2);
    expect(report.hitCount).toBe(1);
    expect(report.recall).toBeCloseTo(0.5);
    expect(report.extractedCount).toBe(2);
    expect(report.precision).toBeCloseTo(0.5);
    expect(report.correctlyParsedCount).toBe(1);
    expect(report.correctlyParsedRate).toBe(0.5);
  });

  it("a parser miss is excluded from the correctly-parsed population by construction", () => {
    const mixed: CorpusEntry[] = [
      { text: REAL_TEXT, reaches: [REAL_FACET] },
      { text: REAL_TEXT, reaches: ["care:psychosis"] },
    ];
    expect(correctlyParsedTexts(mixed)).toEqual([REAL_TEXT]);
    const all = rankingLadderAll(clinicians, mixed);
    const parsed = rankingLadderCorrectlyParsed(clinicians, mixed);
    expect(all.total).toBe(2);
    expect(parsed.total).toBe(1);
  });

  it("an entry with no `reaches` pin is excluded from grading entirely, not counted as a miss", () => {
    const aspiresOnly: CorpusEntry = { text: "I am pregnant and worried about going back on medication", aspires: ["care:perinatal-mh"] };
    expect(extractorReport([aspiresOnly]).sampleSize).toBe(0);
  });
});
