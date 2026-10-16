import { describe, expect, it } from "vitest";
import { draftFor, thirdPerson, tidy } from "./tidy";

describe("tidy", () => {
  it("drops fillers, joins fragments and sentence-cases", () => {
    expect(tidy("um so i ask people, like, to tell me the whole story  before we talk about options\nmost have been rushed before")).toBe(
      "I ask people to tell me the whole story before we talk about options most have been rushed before.",
    );
  });
  it("keeps existing punctuation and capitalises each sentence", () => {
    expect(tidy("first point. second point! third?")).toBe("First point. Second point! Third?");
  });
  it("returns empty for empty input", () => {
    expect(tidy("   ")).toBe("");
  });
});

describe("thirdPerson", () => {
  it("names the doctor once, then uses they, and conjugates the first verb", () => {
    expect(thirdPerson("I ask people to tell me the whole story before we talk about options. I never rush.", "Dr Reilly")).toBe(
      "Dr Reilly asks people to tell them the whole story before we talk about options. They never rush.",
    );
  });
  it("handles contractions and possessives", () => {
    expect(thirdPerson("I'm interested in menopause care. My clinic is small.", "Dr Reilly")).toBe("Dr Reilly is interested in menopause care. Their clinic is small.");
  });
  it("skips adverbs before the verb", () => {
    expect(thirdPerson("I really enjoy complex cases.", "Dr Chen")).toBe("Dr Chen really enjoys complex cases.");
  });
  it("leaves modals alone", () => {
    expect(thirdPerson("I will always call back.", "Dr Chen")).toBe("Dr Chen will always call back.");
  });
});

describe("draftFor", () => {
  it("uses the lead-in when the answer has no first person", () => {
    expect(draftFor("trail running, ceramics", "Dr Reilly", "enjoys")).toBe("Dr Reilly enjoys trail running, ceramics.");
  });
  it("is deterministic", () => {
    const a = draftFor("um I like listening first, you know", "Dr Reilly", "starts with");
    expect(a).toBe(draftFor("um I like listening first, you know", "Dr Reilly", "starts with"));
    expect(a).toBe("Dr Reilly likes listening first.");
  });
});
