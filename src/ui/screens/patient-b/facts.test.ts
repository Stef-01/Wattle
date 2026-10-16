import { describe, expect, it } from "vitest";
import { humanReason, sourceNote } from "./facts";

describe("humanReason", () => {
  it("rewrites a declared condition to the closed Lists phrasing with a lower-cased label", () => {
    expect(humanReason("Declares Endometriosis as a condition they see")).toBe("Lists endometriosis as a condition they see");
    expect(humanReason("Declares Polycystic ovary syndrome as a condition they see")).toBe("Lists polycystic ovary syndrome as a condition they see");
  });
  it("keeps acronyms in the label", () => {
    expect(humanReason("Declares ADHD as a condition they see")).toBe("Lists ADHD as a condition they see");
    expect(humanReason("Declares IVF support as a primary interest")).toBe("Lists IVF support as a primary interest");
  });
  it("rewrites a declared primary interest", () => {
    expect(humanReason("Declares Menopause as a primary interest")).toBe("Lists menopause as a primary interest");
  });
  it("sentence-cases every other reason without changing its words", () => {
    expect(humanReason("sees adults")).toBe("Sees adults");
    expect(humanReason("Has published on endometriosis")).toBe("Has published on endometriosis");
    expect(humanReason("Declares a calm manner")).toBe("Declares a calm manner");
  });
});

describe("sourceNote", () => {
  it("reads '{source}, found {date}'", () => {
    expect(sourceNote("ranzcog_find", "found", "2026-10-15T00:00:00Z").text).toBe("RANZCOG, found 2026-10-15");
  });
});
