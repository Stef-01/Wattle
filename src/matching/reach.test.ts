// Ported from adhd.me/src/matching/reach.test.ts on 2026-10-15.
//
// W221: how much of a real sentence the lexicon can hear — and the mechanism pins that keep
// each reading rule honest. ADHD.ME's suite pinned ~500 ADHD sentences against the ADHD
// lexicon; those pins measure that lexicon and cannot be carried. What IS carried is every
// block whose subject is a MECHANISM in read.ts / needs.ts, re-pinned with psychiatry
// sentences that were each run against the psychiatry lexicon before being written here.
// A pin that was not measured is a guess with a test id.

import { describe, expect, it } from "vitest";
import { eachOf } from "./support/non-vacuous";
import { FIXTURE_ROSTER } from "./support/fixture-roster";
import { REACH_CORPUS } from "./corpus";
import { carePrompts, mannerPrompts, PREF_PROMPTS } from "./clarify";
import { careAreaLabels, defaultLexicon, facetKey, lexiconCues, mannerLabels, readNeeds } from "./needs";
import { matchQuality, orderNote, rankClinicians, unservedAsks } from "./rank";

const facets = (text: string) => readNeeds(text).map((need) => facetKey(need.facet));

describe("W221 how much of a real sentence the lexicon can hear", () => {
  it("reaches every corpus sentence that expresses a need", () => {
    for (const entry of eachOf(REACH_CORPUS.filter((e) => e.reaches?.length), "the pinned corpus")) {
      const got = facets(entry.text);
      for (const key of entry.reaches!) expect(got, `"${entry.text}" lost ${key}`).toContain(key);
    }
  });

  it("never reads a symptom description into a facet (the G7 line)", () => {
    // The reader reads what somebody WANTS from a clinician, never what is wrong with them.
    for (const text of ["I cry every morning", "I have not slept in weeks", "my heart races in shops"]) {
      expect(facets(text), text).toEqual([]);
    }
    for (const entry of eachOf(REACH_CORPUS.filter((e) => e.never?.length), "the never pins")) {
      const got = facets(entry.text);
      for (const key of entry.never!) expect(got, `"${entry.text}" must not reach ${key}`).not.toContain(key);
    }
  });

  it("never presents an unearned order as a ranking", () => {
    for (const text of ["I cry every morning", "hello there", "a psychiatrist who speaks Tamil"]) {
      expect(facets(text)).toEqual([]);
      expect(matchQuality(text, FIXTURE_ROSTER)).toBe("unmatched");
      expect(orderNote(text, FIXTURE_ROSTER)).toMatch(/^Nothing you said names/);
    }
  });

  it("orders the commonest query where the roster differs on it", () => {
    expect(matchQuality("I think I might have ADHD", FIXTURE_ROSTER)).toBe("informed");
    expect(orderNote("I think I might have ADHD", FIXTURE_ROSTER)).toBe("Ordered by what you asked for: ADHD assessment.");
    expect(rankClinicians("OCD", FIXTURE_ROSTER)[0]!.id).toBe("fixture-chen");
  });

  it("names a preference and a language nobody declares instead of returning a silent list", () => {
    // Nobody on the fixture declares an unhurried manner, and nobody speaks Urdu (a yaml language).
    expect(matchQuality("a long appointment please", FIXTURE_ROSTER)).toBe("unserved");
    expect(unservedAsks("a long appointment please", FIXTURE_ROSTER)[0]).toBe(
      "A longer first appointment is not something any psychiatrist listed today declares. That is a gap in our listing, not in what you asked for.",
    );
    expect(matchQuality("a psychiatrist who speaks Urdu", FIXTURE_ROSTER)).toBe("unserved");
    expect(unservedAsks("a psychiatrist who speaks Urdu", FIXTURE_ROSTER)[0]).toContain("Urdu-speaking is not something any psychiatrist listed today declares");
  });

  it("never says it about something the roster DOES declare", () => {
    expect(unservedAsks("a psychiatrist who speaks Arabic for my OCD", FIXTURE_ROSTER)).toEqual([]);
    expect(matchQuality("a psychiatrist who speaks Arabic", FIXTURE_ROSTER)).toBe("informed");
  });

  it("stays a fact about a declaration, never a claim about ability (W193)", () => {
    for (const line of unservedAsks("a long appointment and Urdu", FIXTURE_ROSTER)) {
      expect(line).toContain("declares");
      expect(line).not.toMatch(/cannot|unable|not qualified/);
    }
  });
});

describe("O7 every clarifier answer keeps reaching its facet (F10)", () => {
  it("re-reads every prompt table answer to the facet its question is about", () => {
    const tables = { ...carePrompts(), ...mannerPrompts(), ...PREF_PROMPTS };
    for (const [key, copy] of eachOf(Object.entries(tables), "the prompt tables")) {
      expect(facets(copy.answer), `answer "${copy.answer}" does not reach ${key}`).toContain(key);
    }
  });
});

describe("O7 the lexicon reaches itself (F10)", () => {
  /**
   * Every authored phrase must read back to its own facet, or a cue is dead and nobody knows.
   * THE EXCEPTIONS ARE PINNED EXACTLY: the psychiatry yaml cues "she" and "he" under
   * `constraints.woman`/`constraints.man`, and both are STOPWORDS in read.ts, so they tokenise
   * to nothing and can never fire. They are structurally dead, which is a yaml finding for
   * the founder rather than a matcher defect — and a third dead cue must fail here, not wait
   * for a probe.
   */
  const STRUCTURALLY_DEAD = new Set(["she", "he"]);

  it("reads every lexicon phrase back to its own facet", () => {
    const dead: string[] = [];
    for (const cue of eachOf(lexiconCues(), "the lexicon")) {
      const got = facets(cue.phrase);
      if (!got.includes(cue.key)) dead.push(cue.phrase);
    }
    expect(dead.sort()).toEqual([...STRUCTURALLY_DEAD].sort());
  });

  it("the dead cues are dead for the stated reason: every word is a stopword", () => {
    for (const phrase of STRUCTURALLY_DEAD) expect(readNeeds(phrase)).toEqual([]);
    expect(defaultLexicon().cues.some((cue) => STRUCTURALLY_DEAD.has(cue.phrase))).toBe(false);
  });
});

describe("O7 a cue cannot cross a full stop (F10)", () => {
  it("refuses the two-token bridge across a sentence boundary", () => {
    expect(facets("an eating disorder")).toContain("care:eating-disorders");
    expect(facets("I stopped eating. disorder at home")).toEqual([]);
  });
});

describe("O13/O17 every facet is reachable by its plain name or its first cue", () => {
  /**
   * Two care labels are multi-word descriptions rather than the words anybody types ("Older
   * adult mental health", "Child and adolescent psychiatry"), so those two are pinned on their
   * first authored cue instead. Every other label reads straight back to its facet.
   */
  const LABEL_UNREACHABLE = new Set(["older-adult-mh", "child-adolescent"]);

  it("every care area, by label", () => {
    for (const area of eachOf(careAreaLabels(), "the care areas")) {
      if (LABEL_UNREACHABLE.has(area.id)) {
        expect(facets(area.label)).not.toContain(`care:${area.id}`);
        continue;
      }
      expect(facets(area.label), area.label).toContain(`care:${area.id}`);
    }
    expect(facets("a geriatric psychiatrist")).toContain("care:older-adult-mh");
    expect(facets("child psychiatrist")).toContain("care:child-adolescent");
  });

  it("every manner quality, by label", () => {
    for (const trait of eachOf(mannerLabels(), "the manner traits")) {
      expect(facets(trait.label), trait.label).toContain(`manner:${trait.id}`);
    }
  });
});

describe("O25/O45 a collapsed cue must look like its authored phrase", () => {
  // "out of pocket" strips to the single token [pocket]; the O45 pair rule demands an adjacent
  // authored pair in the raw stream, so "my pocket is empty" cannot fire bulk billing.
  it("the pair rule: the authored phrase reaches, a bare content word does not", () => {
    expect(facets("out of pocket costs are fine")).toContain("pref:bulk-billing");
    expect(facets("no out of pocket costs please")).toContain("pref:bulk-billing");
    expect(facets("my pocket is empty")).toEqual([]);
  });

  it("a cue that carries its own negator is the ask, not a refusal (O104/O109)", () => {
    expect(facets("no gap fees")).toContain("pref:bulk-billing");
  });
});

describe("O94 the raw-run demand: 'over the phone' must look exactly like itself", () => {
  it("the phone-menu leak is dead and the genuine phone ask lives", () => {
    expect(facets("the phone menu hung up on me twice")).toEqual([]);
    expect(facets("I want to do it over the phone")).toContain("pref:telehealth-first");
    expect(facets("I need the first appointment by phone")).toContain("pref:telehealth-first");
  });
});

describe("O40 desire negation", () => {
  it("a negated desire verb refuses the ask it governs", () => {
    expect(facets("I don't want telehealth")).toEqual([]);
    expect(facets("I do not need an ADHD assessment")).toEqual([]);
    expect(facets("panic attacks and I rather not have telehealth")).toEqual(["care:anxiety"]);
  });

  it("a bare 'not' directly before a care or access cue is a refusal (O72)", () => {
    expect(facets("not bulk billing, I am happy to pay")).toEqual([]);
    expect(facets("anxiety, not depression")).toEqual(["care:anxiety"]);
  });

  it("the 'not just' idiom is addition, not refusal (O72)", () => {
    const got = facets("assess me for ADHD, not just the anxiety");
    expect(got).toContain("care:anxiety");
    expect(got).toContain("care:adhd-assessment");
    expect(facets("not just medication for depression")).toContain("care:depression");
  });
});

describe("§O81 a desire negation spends itself on the nearest ask — consume-once scope", () => {
  it("the refused ask is suppressed and the following ask survives, in one clause", () => {
    expect(facets("I don't need bulk billing, I need telehealth")).toEqual(["pref:telehealth-first"]);
    // The yaml's refused cue reads "don't want a woman" as `sets: gender: man`; the bulk
    // billing ask behind the comma survives exactly as the O78 audit demanded.
    const got = facets("I don't want a woman doctor, bulk billing matters more");
    expect(got).toContain("pref:bulk-billing");
    expect(got).not.toContain("pref:woman-gp");
  });

  it("a comma ends the scope, so a trigger with no cue object cannot float across it (O105)", () => {
    expect(facets("I don't want a big clinic, a woman psychiatrist please")).toEqual(["pref:woman-gp"]);
  });

  it("a full stop ends the scope in both directions", () => {
    expect(facets("I need an ADHD assessment. I don't want bulk billing")).toEqual(["care:adhd-assessment"]);
    expect(facets("I don't want bulk billing. I need an ADHD assessment")).toEqual(["care:adhd-assessment"]);
  });
});

describe("§O76 a cue inside a conversational hedge is filler, not an ask", () => {
  // No psychiatry cue word sits inside the one hedge idiom ("if that makes sense"), so the
  // suppression half has nothing to fire on; the span-precise half is what is pinned.
  it("is span-precise: the real ask beside a trailing hedge keeps reaching", () => {
    expect(facets("telehealth please, if that makes sense")).toEqual(["pref:telehealth-first"]);
    expect(facets("help me make sense of the anxiety, if that makes sense")).toEqual(["care:anxiety"]);
  });
});

describe("§O77 the on-behalf governor stands the culturally-safe reading down", () => {
  /**
   * The ported rule exempts exactly one facet: `manner:culturally-safe` (ADHD.ME's
   * `culturally_attuned`). A governor "for" straight before the cue's span suppresses it;
   * the same words without a governor, or after a full stop, keep reaching. Note the
   * suppression fires on "for my culture" as written — the rule reads the governor, not the
   * sense, and that is the trade the port carries over.
   */
  it("suppresses the governed phrase and keeps the ungoverned one", () => {
    expect(facets("booking this for my culture")).toEqual([]);
    expect(facets("my family and my culture matter to me")).toContain("manner:culturally-safe");
    expect(facets("this is for my mum. my culture matters")).toContain("manner:culturally-safe");
  });

  it("a cue that does not start with the possessive is untouched by the governor", () => {
    expect(facets("booking for my mum, she needs someone culturally safe")).toContain("manner:culturally-safe");
  });
});

describe("§O83 somebody else's 'no' is a complaint, not the reader's refusal", () => {
  it("a reported refusal reaches — the ask survives being quoted", () => {
    expect(facets("they said no to telehealth and I want it anyway")).toContain("pref:telehealth-first");
    expect(facets("they told me no to bulk billing")).toContain("pref:bulk-billing");
    expect(facets("my GP told me no to a bulk billed psychiatrist but I need one")).toContain("pref:bulk-billing");
  });

  it("the reader's OWN reported no keeps refusing", () => {
    expect(facets("I said no to telehealth")).toEqual([]);
  });
});

describe("§O91 'without X' is going without X — with the double negative flipping it back", () => {
  it("a need-marker before 'without' in the same clause keeps the want", () => {
    expect(facets("I can't do this without bulk billing")).toContain("pref:bulk-billing");
    expect(facets("I can't manage without a gap fee waiver")).toContain("pref:bulk-billing");
  });

  it("without the marker, 'without' refuses", () => {
    expect(facets("without bulk billing I cannot come")).toEqual([]);
    expect(facets("without a gap fee I can manage")).toEqual([]);
  });
});

describe("the yaml's refused cues, applied after the read (new in the port)", () => {
  it("'not a man' sets the woman preference through the word-bounded pattern", () => {
    expect(facets("I don't want a man, bulk billing please")).toEqual(["pref:bulk-billing", "pref:woman-gp"]);
    expect(facets("please, not a man")).toEqual(["pref:woman-gp"]);
  });

  it("the boundary holds: 'can(not man)age' is not 'not man'", () => {
    expect(facets("depression that the GP cannot manage any more")).toEqual(["care:depression"]);
  });

  it("the idiom ADHD.ME refused the cue for is read by the yaml pattern — measured, for the founder", () => {
    // "not a man of many words" is about somebody being terse. ADHD.ME refused "not a man" as a
    // CUE for exactly this sentence; the yaml's `refused_cues` pattern "(not|...) (a )?(man|male)"
    // has no such guard and sets the woman preference here. The pattern is the founder's
    // vocabulary, so this pins the cost rather than editing it in passing. The day the pattern
    // is narrowed, this expectation flips to [] and the pin says so.
    expect(facets("my GP is not a man of many words")).toEqual(["pref:woman-gp"]);
  });

  it("'not a woman' sets the man preference and clears the woman one", () => {
    const got = facets("my son needs a child psychiatrist, not a woman though");
    expect(got).toContain("pref:man-gp");
    expect(got).not.toContain("pref:woman-gp");
    expect(got).toContain("care:child-adolescent");
  });
});

describe("compound asks read every half", () => {
  it.each([
    ["someone gentle for my OCD", ["manner:gentle", "care:ocd"]],
    ["I want a direct psychiatrist for bipolar", ["care:bipolar", "manner:direct"]],
    ["straight talking about my drinking", ["manner:direct", "care:substance-use"]],
    ["someone warm for the grief", ["care:grief", "manner:gentle"]],
    ["a woman psychiatrist for my son who hears voices", ["care:psychosis", "pref:woman-gp"]],
    ["I'd rather not do telehealth, in person for the OCD", ["care:ocd"]],
  ] as const)("%s", (text, expected) => {
    expect(facets(text).sort()).toEqual([...expected].sort());
  });
});
