// Twenty-five psychiatry sentences through `match()` end to end (PRD §8.1), on the fictional
// Doctor roster in support/fixture-doctors.ts. Written for the port on 2026-10-15.
//
// What each block holds: the specialty cues read into the closed vocabulary, access constraints
// sorting before clinical fit, the four order-note states, the hard filters with their named
// reasons, distance reordering only within a fit tie, and emergency routing.

import { describe, expect, it } from "vitest";
import { loadDiscipline } from "@/src/disciplines/load";
import { EMERGENCY_NOTE, match } from "./index";
import { FIXTURE_DOCTORS, obs } from "./support/fixture-doctors";
import type { MatchResult, Place } from "./types";

const psychiatry = loadDiscipline("psychiatry");
const TODAY = new Date("2026-10-15T00:00:00Z");
const PARRAMATTA: Place = { suburb: "Parramatta", state: "NSW", lat: -33.815, lng: 151.001 };
const SOUTHPORT: Place = { suburb: "Southport", state: "QLD", lat: -27.9688, lng: 153.4067 };

const run = (sentence: string, place: Place | null = null): MatchResult => match(sentence, place, FIXTURE_DOCTORS, psychiatry, TODAY);
const ids = (result: MatchResult) => result.results.map((r) => r.doctor.id);
const labels = (result: MatchResult, index = 0) => result.results[index]!.evidence.map((e) => e.label);
const excludedAs = (result: MatchResult, reason: string) => result.excluded.filter((e) => e.reason === reason).map((e) => e.doctor.id);

describe("specialty cues are read into the closed vocabulary", () => {
  it("1. an ADHD ask reaches the three who declare it, and names the concept in common", () => {
    const result = run("I need an ADHD assessment");
    expect(result.order).toBe("informed");
    expect(ids(result).sort()).toEqual(["doc-nguyen", "doc-okafor", "doc-singh"]);
    for (let i = 0; i < 3; i += 1) expect(labels(result, i)).toContain("ADHD assessment");
    expect(result.results[0]!.headline).toBe("In common: ADHD assessment");
  });

  it("2. panic attacks read as anxiety, not as the reader's state", () => {
    const result = run("panic attacks every week and my GP says see a psychiatrist");
    expect(labels(result)).toContain("Anxiety");
    expect(result.results[0]!.evidence.find((e) => e.label === "Anxiety")!.kind).toBe("condition");
  });

  it("3. a medicine name reaches the condition it is prescribed for, never the brand on a surface", () => {
    const result = run("I have been on sertraline for a year and I am still flat");
    expect(labels(result)).toContain("Depression");
    for (const card of result.results) for (const e of card.evidence) expect(e.label.toLowerCase()).not.toContain("sertraline");
  });

  it("4. dementia routes to older-adult mental health", () => {
    expect(ids(run("my mum has dementia and is agitated at night"))[0]).toBe("doc-walsh");
  });

  it("5. trauma reaches the one who declares it, and a 'sometimes' declarer scores half", () => {
    const result = run("PTSD from my time as a first responder");
    expect(ids(result)[0]).toBe("doc-chen");
    expect(result.results[0]!.tiers.fit).toBeGreaterThan(0);
  });

  it("6. autism: an 'often' declaration outranks a 'sometimes' one, and the evidence carries the sometimes tier", () => {
    const result = run("I am autistic and need a psychiatrist who gets that");
    expect(ids(result)[0]).toBe("doc-singh");
    const okafor = result.results.find((r) => r.doctor.id === "doc-okafor")!;
    expect(okafor.evidence.find((e) => e.label === "Autism assessment")!.tier).toBe("declared");
    expect(okafor.score).toBeLessThan(result.results[0]!.score);
  });

  it("7. a child psychiatrist ask reaches the child and adolescent declaration", () => {
    expect(ids(run("my teenager has anxiety and we want a child psychiatrist"))[0]).toBe("doc-singh");
  });

  it("8. a second opinion is its own concept", () => {
    expect(ids(run("a second opinion on my diagnosis"))[0]).toBe("doc-walsh");
  });

  it("9. a condition word inside a refusal is not an ask", () => {
    const result = run("not depression, the GP already ruled that out, it is the OCD");
    expect(labels(result)).toContain("OCD");
    for (const card of result.results) expect(card.evidence.map((e) => e.label)).not.toContain("Depression");
  });
});

describe("access constraints sort before clinical fit (PRD §4.2)", () => {
  it("10. a woman who bulk bills: the woman wins the constraint tier whatever else is declared", () => {
    const result = run("a woman psychiatrist who bulk bills for my anxiety");
    expect(ids(result)[0]).toBe("doc-okafor");
    expect(labels(result)).toContain("A woman clinician");
    expect(result.results[0]!.tiers.access).toBeGreaterThan(0);
    expect(result.results[0]!.missed.map((e) => e.label)).toContain("Bulk billing");
  });

  it("11. a language ask puts the speaker first, as a constraint with the declaration's tier", () => {
    const result = run("a psychiatrist who speaks Arabic");
    expect(ids(result)[0]).toBe("doc-okafor");
    const arabic = result.results[0]!.evidence.find((e) => e.label === "Arabic-speaking")!;
    expect(arabic.kind).toBe("constraint");
    expect(arabic.tier).toBe("declared");
  });

  it("12. a language read from the register carries the register tier", () => {
    const result = run("I speak Punjabi at home");
    expect(ids(result)[0]).toBe("doc-singh");
    expect(result.results[0]!.evidence.find((e) => e.label === "Punjabi-speaking")!.tier).toBe("register");
  });

  it("13. refusing a woman sets the man preference, and bulk billing still counts", () => {
    const result = run("I don't want a woman doctor, bulk billing matters more");
    expect(ids(result)[0]).toBe("doc-nguyen");
    expect(labels(result)).toEqual(expect.arrayContaining(["Bulk billing", "A man clinician"]));
  });

  it("14. three manner traits never outrank one condition match (PRD §4.3)", () => {
    const result = run("bipolar, and someone direct, collaborative and gentle");
    expect(ids(result)[0]).toBe("doc-nguyen");
  });
});

describe("the order note says what the order means (PRD §4.5)", () => {
  it("15. unmatched: nothing read, and the note says so without blaming the reader", () => {
    const result = run("hello I would like some help please");
    expect(result.order).toBe("unmatched");
    expect(result.orderNote).toMatch(/^Nothing you said names something this listing can compare on/);
    expect(result.results).toHaveLength(3);
  });

  it("16. unserved: a language the discipline hears and nobody declares names the gap", () => {
    const result = run("I need someone who speaks Greek");
    expect(result.order).toBe("unserved");
    expect(result.orderNote).toMatch(/^No listed psychiatrist declares Greek-speaking/);
    expect(result.unserved).toEqual([{ ask: "Greek-speaking", restoreCount: 0 }]);
  });

  it("17. informed: the note names the asks the order was built from", () => {
    const result = run("I need an ADHD assessment and I am anxious");
    expect(result.order).toBe("informed");
    // Strongest first: anxiety is declared by two of five, ADHD by three, so the rarity discount
    // leaves anxiety the heavier ask and it is named first.
    expect(result.orderNote).toBe("Ordered by what you asked for: Anxiety and ADHD assessment.");
  });

  it("18. tied: two bulk billers answer a cost ask equally, and the note says to read it as a list", () => {
    const only = FIXTURE_DOCTORS.filter((d) => d.id === "doc-nguyen" || d.id === "doc-chen");
    const result = match("cheap", null, only, psychiatry, TODAY);
    expect(result.order).toBe("tied");
    expect(result.orderNote).toMatch(/too similarly to rank, read this as a list, not an order\.$/);
  });

  it("19. each card's headline differs, using the second-best concept where it must (PRD §8.1.5)", () => {
    const result = run("anxiety, depression and OCD");
    const headlines = result.results.map((r) => r.headline);
    expect(new Set(headlines).size).toBe(headlines.length);
    // The first card holds Anxiety AND Depression; a later card holding only Anxiety pushes it
    // to its second-best rather than printing the same headline twice.
    expect(headlines).toContain("In common: Anxiety");
    expect(headlines).toContain("In common: OCD");
  });
});

describe("hard filters, each with a named reason (PRD §8.1.2)", () => {
  it("20. telehealth only excludes the rooms-only doctors and keeps the rest", () => {
    const result = run("telehealth only, I cannot travel");
    expect(excludedAs(result, "no-telehealth").sort()).toEqual(["doc-nguyen", "doc-walsh"]);
    expect(ids(result)).not.toContain("doc-nguyen");
    expect(labels(result)).toContain("By phone or telehealth");
  });

  it("21. bulk billing only excludes the gap and private doctors", () => {
    const result = run("it has to be bulk billed only");
    expect(excludedAs(result, "billing-mismatch").sort()).toEqual(["doc-okafor", "doc-singh", "doc-walsh"]);
    expect(ids(result).sort()).toEqual(["doc-chen", "doc-nguyen"]);
  });

  it("22. closed books, wrong specialty and a non-current registration are always named", () => {
    const result = run("I need an ADHD assessment");
    expect(excludedAs(result, "closed-books")).toEqual(["doc-rossi"]);
    expect(excludedAs(result, "wrong-specialty")).toEqual(["doc-paed"]);
    expect(excludedAs(result, "registration-not-current")).toEqual(["doc-suspended"]);
  });

  it("23. out of reach: beyond 30 km in person is excluded, telehealth passes, and the unserved breakdown counts the filter", () => {
    const result = run("I need an ADHD assessment", SOUTHPORT);
    expect(excludedAs(result, "out-of-reach").sort()).toEqual(["doc-nguyen", "doc-walsh"]);
    // Three survive the filters (the two ADHD declarers by telehealth, and the telehealth-only
    // trauma service, which scores nothing and sits last); the screen shows its top three.
    expect(ids(result).slice(0, 2).sort()).toEqual(["doc-okafor", "doc-singh"]);
    expect(result.results[2]!.doctor.id).toBe("doc-chen");
    expect(result.results[2]!.score).toBe(0);
    const everyoneOut = match("bipolar in person", SOUTHPORT, FIXTURE_DOCTORS.filter((d) => d.id === "doc-nguyen"), psychiatry, TODAY);
    expect(everyoneOut.order).toBe("unserved");
    expect(everyoneOut.unserved).toEqual([{ ask: "within 30 km", restoreCount: 1 }]);
  });

  it("24. distance reorders only inside a fit tie, never a telehealth-first doctor, and a telehealth-only doctor carries no distance", () => {
    // Two rooms-only doctors, both fresh-open, nothing read: an exact tie, so distance decides.
    const nguyen = FIXTURE_DOCTORS.find((d) => d.id === "doc-nguyen")!;
    const walsh = { ...FIXTURE_DOCTORS.find((d) => d.id === "doc-walsh")!, capacity: obs("open" as const, "declared", "2026-10-01") };
    const nearBeecroft = match("hello", PARRAMATTA, [nguyen, walsh], psychiatry, TODAY);
    expect(ids(nearBeecroft)).toEqual(["doc-walsh", "doc-nguyen"]);
    expect(nearBeecroft.orderNote).toMatch(/nearest first\.$/);
    const DOUBLE_BAY: Place = { suburb: "Double Bay", state: "NSW", lat: -33.8775, lng: 151.2437 };
    expect(ids(match("hello", DOUBLE_BAY, [nguyen, walsh], psychiatry, TODAY))).toEqual(["doc-nguyen", "doc-walsh"]);
    // Fit still outranks distance: Walsh declares depression, Nguyen is nearer, Walsh leads.
    expect(ids(match("depression", DOUBLE_BAY, [nguyen, walsh], psychiatry, TODAY))).toEqual(["doc-walsh", "doc-nguyen"]);
    // A telehealth-first doctor keeps their fit position (PRD §4.12) but still shows the figure.
    const result = run("I need an ADHD assessment", PARRAMATTA);
    const okafor = result.results.find((r) => r.doctor.id === "doc-okafor")!;
    expect(okafor.distanceKm).toBe(0);
    expect(result.orderNote).toMatch(/nearer comes first\.$/);
    const trauma = run("PTSD from my time as a first responder", PARRAMATTA);
    expect(trauma.results[0]!.doctor.id).toBe("doc-chen");
    expect(trauma.results[0]!.distanceKm).toBeUndefined();
  });
});

describe("emergency routing (disciplines/psychiatry.yaml emergency_cues)", () => {
  it("25. a sentence carrying an emergency cue gets the emergency note and no ranking", () => {
    for (const sentence of ["I want to die tonight", "I have taken too many tablets", "my partner is not breathing"]) {
      const result = run(sentence);
      expect(result.emergency).toEqual({ note: EMERGENCY_NOTE });
      expect(result.results).toEqual([]);
      expect(result.orderNote).toBe(EMERGENCY_NOTE);
      expect(result.clarifiers).toEqual([]);
    }
    expect(run("I need an ADHD assessment").emergency).toBeUndefined();
  });

  it("clarifiers are offered when nothing was read, and each option is a sentence the reader can append", () => {
    const result = run("hello I would like some help please");
    expect(result.clarifiers.length).toBeGreaterThan(0);
    expect(result.clarifiers.length).toBeLessThanOrEqual(3);
    for (const clarifier of result.clarifiers) {
      expect(clarifier.options).toHaveLength(1);
      expect(match(`hello, ${clarifier.options[0]}`, null, FIXTURE_DOCTORS, psychiatry, TODAY).order).not.toBe("unmatched");
    }
  });

  it("a closed-books doctor is excluded with the reason, and the ask nobody else declares is named", () => {
    // Capacity is a hard filter in match() (PRD §8.1.2), so the only perinatal declarer is in
    // `excluded` with the named reason. "postnatal depression" is one cue, so the sentence does
    // not fall back to Depression: the gap is perinatal mental health, and the note says so.
    const result = run("postnatal depression since the baby");
    expect(excludedAs(result, "closed-books")).toEqual(["doc-rossi"]);
    expect(result.order).toBe("unserved");
    expect(result.unserved).toEqual([{ ask: "Perinatal mental health", restoreCount: 0 }]);
  });
});
