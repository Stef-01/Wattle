// Ported from adhd.me/src/matching/tie-quality.test.ts on 2026-10-15.
//
// W234: the tie-quality KPI over the corpus run — how many reached requests the roster can
// order at all. ADHD.ME's baseline carried its real roster's history; this one is the first
// measurement on the six-entry fixture roster and the psychiatry corpus (2026-10-15). Read the
// three columns, not the rate: `unseparated` is the column that measures failure.

import { describe, expect, it } from "vitest";
import { FIXTURE_ROSTER as clinicians } from "./support/fixture-roster";
import { corpusRun, tieOutcome, tieQualityReport } from "./tie-quality";

const PINNED = { total: 107, separated: 59, partialTie: 46, unseparated: 2 };

describe("W234 the tie-quality KPI over the corpus run", () => {
  const report = tieQualityReport(corpusRun(), clinicians);

  it("holds the measured baseline exactly, in both directions", () => {
    expect(report).toEqual({
      ...PINNED,
      separationRate: Math.round((PINNED.separated / PINNED.total) * 1000) / 1000,
    });
  });

  it("partitions the run: every measured sentence lands in exactly one outcome", () => {
    expect(report.separated + report.partialTie + report.unseparated).toBe(report.total);
    expect(report.total).toBe(corpusRun().length);
    expect(report.total).toBeGreaterThan(100);
  });

  it("classifies the boundary cases the definition promises", () => {
    expect(tieOutcome("a queer affirming psychiatrist", clinicians)).toBe("separated");
    expect(tieOutcome("I need an ADHD assessment", clinicians)).toBe("partialTie");
    expect(tieOutcome("zzz qqq", clinicians)).toBe("unseparated");
    expect(clinicians.length).toBe(6);
  });

  it("survives roster growth without redefinition: outcomes are relative to roster size", () => {
    const doubled = [
      ...clinicians,
      ...clinicians.map((c) => ({ ...c, id: `${c.id}-b` })),
    ];
    expect(tieOutcome("zzz qqq", doubled)).toBe("unseparated");
    expect(["separated", "partialTie"]).toContain(tieOutcome("a queer affirming psychiatrist", doubled));
  });
});
