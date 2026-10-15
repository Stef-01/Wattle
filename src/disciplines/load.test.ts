import { describe, expect, it } from "vitest";
import { loadDiscipline, parseDiscipline } from "./load";

const minimal = `
slug: test
label: Test
populations:
  - id: child
    cues: [child]
conditions:
  - id: anxiety
    label: Anxiety
    cues: [anxiety]
approaches:
  - id: medication-led
    label: Medication-led
    cues: [medication]
manner:
  - id: gentle
    label: Gentle
    cues: [gentle]
constraints:
  woman: [woman]
refused_cues:
  - pattern: "no medication"
    refuses: [medication-led]
emergency_cues:
  - "suicid"
languages:
  cues:
    arabic: [arabic]
`;

describe("loadDiscipline", () => {
  it("loads psychiatry.yaml from the repo", () => {
    const d = loadDiscipline("psychiatry");
    expect(d.slug).toBe("psychiatry");
    expect(d.conditions.map((c) => c.id)).toContain("adhd-assessment");
    expect(d.populations.find((p) => p.id === "adolescent")?.age).toEqual([12, 18]);
    expect(d.constraints.bulk_bills).toContain("healthcare card");
    expect(d.refusedCues[0]?.refuses).toEqual(["medication-led"]);
    expect(d.refusedCues.find((r) => r.sets.gender === "woman")).toBeDefined();
    expect(d.emergencyCues.length).toBeGreaterThan(3);
    expect(d.languages.arabic).toContain("lebanese");
    expect(d.forbiddenPublicTerms).toContain("ADHD specialist");
  });

  it("parses a minimal document", () => {
    const d = parseDiscipline(minimal);
    expect(d.conditions[0]?.label).toBe("Anxiety");
    expect(d.languages.arabic).toEqual(["arabic"]);
  });

  it("throws on duplicate ids", () => {
    const dup = minimal.replace("id: anxiety", "id: anxiety\n    label: X\n    cues: [x]\n  - id: anxiety");
    expect(() => parseDiscipline(dup)).toThrow(/duplicate id "anxiety"/);
  });

  it("throws on empty cues", () => {
    expect(() => parseDiscipline(minimal.replace("cues: [gentle]", "cues: []"))).toThrow(/empty cues/);
  });

  it("throws on an unknown population id", () => {
    expect(() => parseDiscipline(minimal.replace("id: child", "id: toddler"))).toThrow(/unknown id/);
  });

  it("throws on a refused cue that neither refuses nor sets", () => {
    expect(() => parseDiscipline(minimal.replace("refuses: [medication-led]", "refuses: []"))).toThrow(/refuses nothing/);
  });

  it("throws when the file slug does not match", () => {
    expect(() => loadDiscipline("nope")).toThrow();
  });
});
