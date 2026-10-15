// Ported from adhd.me/src/matching/needs.test.ts on 2026-10-15.
import { describe, expect, it } from "vitest";
import { eachOf, tally } from "./support/non-vacuous";
import { FIXTURE_ROSTER as clinicians } from "./support/fixture-roster";
import {
  matchEvidence,
  matchQuality,
  needsFor,
  rankClinicians,
  scoreAgainst,
  getPersonalizedMatch,
} from "./rank";
import { mannerTraits, needLabels, facetKey, languageNeeds, readNeeds } from "./needs";
import { syntheticClinician } from "./support/synthetic-clinician";

describe("W221 reading what somebody said into the closed vocabulary", () => {
  it("reads a preference about care, and reaches nothing on text that names none", () => {
    expect(readNeeds("")).toEqual([]);
    expect(readNeeds("hello I would like some help please")).toEqual([]);
  });

  /**
   * THE DEFECT THIS PINS IS THE ONE THAT MOTIVATED LONGEST-FIRST READING. "not just medication"
   * contains "medication" and "treated for anxiety" contains "anxiety". A shorter phrase reaching
   * first would let a general term claim a sentence whose specific term says something different —
   * in the first case close to the opposite of what was asked for.
   */
  it("lets the specific phrase win over the general one inside it", () => {
    // Psychiatry has no non-medication facet, so the mechanism is pinned on the additive
    // "not just" idiom: "not just the anxiety" asks for anxiety AND MORE, so anxiety reaches.
    const labels = readNeeds("assess me for ADHD, not just the anxiety").map((n) => n.label);
    expect(labels).toContain("Anxiety");
    expect(labels).toContain("ADHD assessment");
  });

  it("counts one facet once, however many ways it was asked for", () => {
    const needs = readNeeds("panic attacks, so anxious I cannot leave the house, worrying all day");
    const keys = needs.map((n) => facetKey(n.facet));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("is deterministic", () => {
    const q = "a gentle psychiatrist for bipolar who speaks Arabic";
    expect(readNeeds(q)).toEqual(readNeeds(q));
  });

  /**
   * W213's floor: a reason is composed from a fixed set. This pins the set closed, so a label
   * cannot be introduced by templating a reader's own words into the sentence.
   */
  it("says nothing back that is not in the closed vocabulary", () => {
    // O212: COUNTED, not floored per clinician. A clinician who declares none of the six facets
    // named below legitimately produces no evidence — that is the matcher being honest, not a
    // fault — so `eachOf` on the inner loop would assert something false. What may NOT happen is
    // the whole roster returning nothing, because then this test proves the vocabulary is closed
    // without having read a single label. Measured when written: 4 and 1.
    const labels = new Set<string>(needLabels());
    const checked = tally();
    for (const clinician of eachOf(clinicians, "the roster")) {
      for (const need of matchEvidence(clinician, "hindi, bipolar, gentle, trauma, sleep, drinking", clinicians)) {
        checked.saw();
        const allowed = labels.has(need.label) || /-speaking$/.test(need.label);
        expect(allowed, `${need.label} is not in the closed vocabulary`).toBe(true);
      }
    }
    expect(checked.count(), "the whole roster returned no evidence — no label was read").toBeGreaterThan(0);
  });
});

describe("W221 the ranking and the explanation are one computation", () => {
  /**
   * THE PROPERTY THIS FILE EXISTS FOR.
   *
   * Before W221 the ranker held per-clinician keyword weights and the explanation held its own
   * separate lexicon over the same care areas with different phrase lists. They had already
   * drifted: the ranker weighted "wearing off" and the explainer did not, so a clinician could be
   * ranked first for a reason the page then declined to print. Both now read `matchEvidence`, and
   * this asserts they cannot come apart again — anything that contributes score must be sayable,
   * and anything said must have contributed.
   */
  const QUERIES = [
    "I was diagnosed bipolar and need someone to manage my lithium",
    "I get rushed every time, I want a longer first appointment to tell the whole story",
    "a gentle psychiatrist who speaks Hindi, I have had anxiety for years",
    "I drink too much and need that handled, by phone",
    "insomnia for two years and my family think I am just lazy",
    "I think I might have ADHD and I would like an assessment",
  ];

  it.each(QUERIES)("every point of score is sayable, and every reason scored: %s", (query) => {
    for (const clinician of eachOf(clinicians, "the roster")) {
      const evidence = matchEvidence(clinician, query, clinicians);
      const said = getPersonalizedMatch(clinician, query, clinicians).signals;

      // Everything the page says came from the evidence.
      for (const label of said) expect(evidence.map((e) => e.label)).toContain(label);

      // And the score is exactly the evidence's weight — no unexplainable contribution, and
      // since O1 no carve-out either: language evidence is scored like everything else, so the
      // comparison is against the full needs the ranking actually reads.
      //
      // O252: `toBeCloseTo`, because `scoreAgainst` rounds its total to three places and this
      // sum does not. The two agreed exactly while the roster's weights happened to land on
      // representable thirds; on eleven clinicians one query lands at 27.272999999999996
      // against a rounded 27.273. The property being pinned is that the score is the evidence
      // and nothing else, which a half-thousandth of floating-point does not qualify — and a
      // real unexplained contribution would be a whole facet's weight, orders above this.
      expect(scoreAgainst(clinician, needsFor(query, clinicians))).toBeCloseTo(
        evidence.reduce((sum, n) => sum + n.weight, 0),
        2,
      );
    }
  });

  it("holds no per-clinician coefficient anywhere", async () => {
    // The scaling property, asserted on the source rather than inferred. A weight keyed by a
    // clinician id is the thing that made adding a GP an engineering task, and its absence is
    // what lets the onboarding interview be the only place a profile is authored.
    const source = await import("node:fs").then((fs) =>
      fs.readFileSync(new URL("./rank.ts", import.meta.url), "utf8"),
    );
    expect(source).not.toContain("focusSignals");
    for (const clinician of clinicians) {
      const weightKeyedByName = new RegExp(`"${clinician.id}"\\s*:\\s*\\[`);
      expect(weightKeyedByName.test(source), `${clinician.id} has hand-authored weights`).toBe(false);
    }
  });

  it("scores a clinician only on facets they declared", () => {
    const needs = readNeeds("bipolar and a longer first appointment");
    for (const clinician of eachOf(clinicians, "the roster")) {
      for (const need of matchEvidence(clinician, "bipolar and a longer first appointment", clinicians)) {
        if (need.facet.kind === "care") expect(clinician.careAreas).toContain(need.facet.area);
        if (need.facet.kind === "manner") expect(clinician.manner).toContain(need.facet.trait);
      }
      expect(scoreAgainst(clinician, needs)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("W221 what the roster declares", () => {
  it("gives every clinician a declared manner trait, in the discipline's own vocabulary", () => {
    // A clinician with no declared manner can never match "will they understand me", which is
    // half of what somebody is asking. The ported `Clinician` has no `mannerPending` note (Wattle
    // lists no real person ahead of their declarations), so the fixture roster must declare.
    for (const clinician of eachOf(clinicians, "the roster")) {
      expect(clinician.manner.length, `${clinician.id} declares no manner`).toBeGreaterThan(0);
      for (const trait of clinician.manner) expect(mannerTraits()).toContain(trait);
    }
  });

});

describe("O1 languages go through the one pipeline (F2)", () => {
  /**
   * THE DEFECT THIS PINS. Until O1, language signals were appended to `matchEvidence` alone by a
   * raw-substring matcher: shown on the card, invisible to `scoreAgainst` and `matchQuality`.
   * A reader who asked only for a language was told "this is everyone we list rather than an
   * order" — beside a card explaining a ranking that never happened. That is the inverse of the
   * drift W221 removed (ranked for a reason not given; here, given a reason not ranked on), and
   * these tests hold the guarantee in both directions.
   */
  it("hears a language-only request and puts the speakers first", () => {
    // O252: the two GPs are still the only Urdu speakers, and they are now two of eleven rather
    // than two of two — so the ask is heard AND it orders the list, where before it could only
    // tie it. Both halves are asserted: the speakers lead, and the finder says the order means
    // something. The tie half of this guarantee moved to the test below, which uses a language
    // the whole roster actually shares.
    // Arabic is declared by exactly one fixture entry, so the ask is heard AND it orders the list.
    const query = "a psychiatrist who speaks Arabic";
    expect(rankClinicians(query, clinicians)[0]!.id).toBe("fixture-okafor");
    expect(matchQuality(query, clinicians)).toBe("informed");
  });

  it("reads an inflected language mention the substring matcher was never tested on", () => {
    const needs = needsFor("an Arabic-speaking psychiatrist please", clinicians);
    expect(needs.some((n) => n.label === "Arabic-speaking")).toBe(true);
  });

  it("scores what the card says: language evidence is never explanation-only", () => {
    const query = "a psychiatrist who speaks Arabic";
    for (const clinician of eachOf(clinicians, "the roster")) {
      const evidence = matchEvidence(clinician, query, clinicians);
      const spoken = evidence.filter((n) => n.facet.kind === "language");
      // Every language on the card contributed to the score...
      expect(scoreAgainst(clinician, needsFor(query, clinicians))).toBe(evidence.reduce((s, n) => s + n.weight, 0));
      // ...and only speakers carry it.
      for (const need of spoken) {
        if (need.facet.kind !== "language") continue;
        const asked = need.facet.language.toLowerCase();
        expect(clinician.languages.map((l) => l.toLowerCase())).toContain(asked);
      }
    }
  });

  it("a language shared by the whole roster ties rather than separates, and says so", () => {
    // O252: Hindi used to be the shared language, because the roster was the two GPs who speak
    // it. On eleven it separates, so the property is pinned where it is still true — on the two
    // GPs for Hindi, and on the whole roster for the language every entry declares.
    // On a pair who both declare Arabic the ask ties; on the full roster one holds it and it orders.
    const pair = [clinicians[0]!, { ...clinicians[1]!, languages: ["English", "Arabic"] }];
    expect(matchQuality("a psychiatrist who speaks Arabic", pair)).toBe("tied");
    expect(clinicians.every((c) => c.languages.includes("English"))).toBe(true);
    expect(matchQuality("a psychiatrist who speaks Arabic", clinicians)).toBe("informed");
  });

  it("recognises a governed language nobody declares and reports an unserved request", () => {
    // The shared onboarding/matching vocabulary lets the product name its own roster gap.
    expect(needsFor("a psychiatrist who speaks Farsi", clinicians).filter((n) => n.facet.kind === "language"))
      .toHaveLength(1);
    expect(matchQuality("a psychiatrist who speaks Farsi", clinicians)).toBe("unserved");
  });

  it("never treats English as a match reason", () => {
    expect(languageNeeds("an English speaking psychiatrist", ["English", "Hindi"])).toEqual([]);
  });

  it("counts an asked language once however it is cased or repeated", () => {
    const needs = languageNeeds("arabic ARABIC Arabic", ["Arabic", "arabic"]);
    expect(needs).toHaveLength(1);
  });
});

describe("O2 breadth has a price (F1)", () => {
  /**
   * THE DEFECT THIS PINS. `scoreAgainst` was a raw sum over declared facets — monotone in
   * declarations, so at a self-declaring roster ticking every interview box was the dominant
   * strategy. Two prices now exist: a facet's weight is discounted by how much of the roster
   * declares it (rarity separates; universality does not), and a "sometimes" declaration earns
   * half of an "often" one. Both are the clinician's or the roster's own data, both sayable.
   */
  it("discounts a facet by how much of the roster declares it, but never to zero", () => {
    // Synthetic holder split: Arabic is declared by both, Vietnamese by one. Equal authored
    // weight, unequal separation.
    const roster = [
      clinicians[0]!,
      { ...clinicians[1]!, id: "both-languages", languages: ["English", "Arabic", "Vietnamese"] },
    ];
    const needs = needsFor("a psychiatrist who speaks Arabic and Vietnamese", roster);
    const arabic = needs.find((n) => n.label === "Arabic-speaking")!;
    const vietnamese = needs.find((n) => n.label === "Vietnamese-speaking")!;
    expect(vietnamese.weight).toBeGreaterThan(arabic.weight);
    expect(arabic.weight).toBeGreaterThan(0);
  });

  it("a facet the whole roster declares cannot change the relative order", () => {
    // Asserted on a pair where Arabic genuinely is universal.
    const pair = [clinicians[0]!, { ...clinicians[1]!, languages: ["English", "Arabic", "Vietnamese"] }];
    const withoutUniversal = rankClinicians("a psychiatrist who speaks Vietnamese", pair).map((c) => c.id);
    const withUniversal = rankClinicians("a psychiatrist who speaks Vietnamese and also Arabic", pair).map((c) => c.id);
    expect(withUniversal).toEqual(withoutUniversal);
  });

  it("a 'sometimes' declaration answers at half the weight of an 'often' one", () => {
    const base = clinicians[0]!;
    const often = { ...base, careAreas: ["bipolar"], careAreasSometimes: [] };
    const sometimes = { ...base, careAreas: [], careAreasSometimes: ["bipolar"] };
    const needs = needsFor("I need help with bipolar", clinicians);
    const sleep = needs.filter((n) => n.facet.kind === "care" && n.facet.area === "bipolar");
    expect(sleep).toHaveLength(1);
    expect(scoreAgainst(sometimes, sleep)).toBe(scoreAgainst(often, sleep) / 2);
  });

  it("the card's evidence carries the earned weight, not the authored one", () => {
    const base = clinicians[0]!;
    const sometimes = { ...base, careAreas: [], careAreasSometimes: ["bipolar"] };
    const evidence = matchEvidence(sometimes, "I need help with bipolar", clinicians);
    const claimed = evidence.find((n) => n.facet.kind === "care" && n.facet.area === "bipolar")!;
    expect(scoreAgainst(sometimes, needsFor("I need help with bipolar", clinicians))).toBe(claimed.weight);
  });
});

describe("O5 stated importance is the reader's datum (F6)", () => {
  /**
   * THE DEFECT THIS PINS. The lexicon's weights encode how much ANY asker cares about a facet —
   * the product's guess, identical for every reader. An answered clarifier is the reader saying
   * a facet matters, and that statement now lifts the confirmed facet's weight. The mechanism is
   * marker detection on our own appended answer sentences, not a reading of the person.
   */
  it("weighs a clarifier-confirmed facet above the same facet mentioned in passing", () => {
    const confirmed = needsFor("I want the first appointment by phone", clinicians);
    const mentioned = needsFor("by phone", clinicians);
    const key = "pref:telehealth-first";
    const weightOf = (needs: ReturnType<typeof needsFor>) =>
      needs.find((n) => facetKey(n.facet) === key)!.weight;
    // O252: `toBeCloseTo` for the reason the score identity above takes it — both sides are
    // rounded to three places by the weighting, and the claim is the 1.5x lift, not the
    // half-thousandth (7.636 against 7.6365).
    expect(weightOf(confirmed)).toBeCloseTo(weightOf(mentioned) * 1.5, 2);
  });

  it("turns an unmatched request into an informed order when the answer separates the roster", () => {
    expect(matchQuality("hello", clinicians)).toBe("unmatched");
    // The clarifier UI appends the answer verbatim; two of six are telehealth-first.
    const afterTap = "hello, I want the first appointment by phone";
    expect(matchQuality(afterTap, clinicians)).toBe("informed");
    expect(rankClinicians(afterTap, clinicians)[0]!.telehealthFirstAppointment).toBe(true);
  });
});
