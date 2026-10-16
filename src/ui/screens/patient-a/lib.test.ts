// The closed-vocabulary sentences under P04/P05 cards: same-verb reasons merge, labels keep the
// yaml casing, and only non-acronyms lose their capital mid-sentence.
import { describe, expect, it } from "vitest";
import type { Card } from "@/src/data/search-types";
import { isAcronym, joinAnd, lineFor, midSentence, paragraphFor } from "./lib";

const LABELS = { pcos: "PCOS", "pelvic-pain": "Persistent pelvic pain", menopause: "Menopause and perimenopause", endometriosis: "Endometriosis", adhd: "ADHD" };

function card(input: { reasons: string[]; conditions: string[]; human?: string[]; basis?: string }): Card {
  return {
    doctor: { conditions: { value: input.conditions } },
    clinicalFit: { band: "strong", reasons: input.reasons },
    humanFit: { score: 0, reasons: input.human ?? [], basis: input.basis ?? "none" },
  } as unknown as Card;
}

describe("midSentence / isAcronym", () => {
  it("lowercases ordinary labels and keeps acronyms and digit-bearing ones", () => {
    expect(midSentence("Persistent pelvic pain")).toBe("persistent pelvic pain");
    expect(midSentence("PCOS")).toBe("PCOS");
    expect(midSentence("ADHD")).toBe("ADHD");
    expect(midSentence("ME/CFS")).toBe("ME/CFS");
    expect(midSentence("COVID-19 recovery")).toBe("COVID-19 recovery");
    expect(isAcronym("Long COVID")).toBe(false);
  });
});

describe("paragraphFor", () => {
  it("merges the Focuses sentences and lists the rest with yaml casing", () => {
    const c = card({
      reasons: ["Declares Persistent pelvic pain as a condition they see", "Declares Endometriosis as a condition they see"],
      conditions: ["pelvic-pain", "endometriosis", "pcos", "adhd", "menopause"],
    });
    expect(paragraphFor(c, LABELS)).toBe("Focuses on persistent pelvic pain and endometriosis. Lists PCOS, ADHD and menopause and perimenopause.");
  });

  it("keeps other closed reasons after the merged sentence and adds profile-backed human reasons", () => {
    const c = card({
      reasons: ["Declares ADHD as a condition they see", "Listed under Psychiatry"],
      conditions: ["adhd"],
      human: ["Says they take time to listen"],
      basis: "profile",
    });
    expect(paragraphFor(c, LABELS)).toBe("Focuses on ADHD. Listed under Psychiatry. Says they take time to listen.");
  });

  it("falls back to the id without a label map", () => {
    const c = card({ reasons: [], conditions: ["pelvic-pain"] });
    expect(paragraphFor(c)).toBe("Lists pelvic pain.");
  });
});

describe("lineFor", () => {
  it("gives the merged clinical sentence and a two-item list when no human reason exists", () => {
    const c = card({
      reasons: ["Declares Persistent pelvic pain as a condition they see", "Declares Endometriosis as a condition they see"],
      conditions: ["pelvic-pain", "endometriosis", "pcos", "menopause", "adhd"],
    });
    expect(lineFor(c, LABELS)).toBe("Focuses on persistent pelvic pain and endometriosis. Lists PCOS and menopause and perimenopause.");
  });
});

describe("joinAnd", () => {
  it("joins one, two and three items", () => {
    expect(joinAnd(["a"])).toBe("a");
    expect(joinAnd(["a", "b"])).toBe("a and b");
    expect(joinAnd(["a", "b", "c"])).toBe("a, b and c");
  });
});
