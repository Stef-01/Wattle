import { describe, expect, it } from "vitest";
import { draftFor, thirdPerson, tidy } from "./tidy";

describe("tidy", () => {
  it("drops fillers, sentence-cases and splits the run-on where a new clause starts", () => {
    expect(tidy("um so i ask people, like, to tell me the whole story  before we talk about options\nmost have been rushed before")).toBe(
      "I ask people to tell me the whole story before we talk about options. Most have been rushed before.",
    );
  });
  it("splits a comma splice into two sentences", () => {
    expect(tidy("I ask people to tell me the whole story before we talk about options, most have been rushed before")).toBe(
      "I ask people to tell me the whole story before we talk about options. Most have been rushed before.",
    );
  });
  it("keeps a comma inside a conditional sentence", () => {
    expect(tidy("if someone needs more time, I give it")).toBe("If someone needs more time, I give it.");
  });
  it("keeps a short list joined by a line break", () => {
    expect(tidy("trail running\nceramics")).toBe("Trail running, ceramics.");
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
      "Dr Reilly asks people to tell them the whole story before they talk about options. They never rush.",
    );
  });
  it("turns the C06 example into third person with the doctor's name", () => {
    expect(draftFor("I ask people to tell me the whole story before we talk about options, most have been rushed before", "Dr Reilly", "says")).toBe(
      "Dr Reilly asks people to tell them the whole story before they talk about options. Most have been rushed before.",
    );
  });
  it("maps we, us and our to they, them and their", () => {
    expect(thirdPerson("We see families together. Our rooms suit us. Call us any time.", "Dr Chen")).toBe(
      "They see families together. Their rooms suit them. Call them any time.",
    );
  });
  it("handles contractions and possessives on the naming mention", () => {
    expect(thirdPerson("I'm interested in menopause care. My clinic is small.", "Dr Reilly")).toBe("Dr Reilly is interested in menopause care. Their clinic is small.");
  });
  it("contracts to they're and they've after the doctor has been named", () => {
    expect(thirdPerson("I'm patient. I've done this for years. We've got time.", "Dr Reilly")).toBe("Dr Reilly is patient. They've done this for years. They've got time.");
    expect(thirdPerson("I listen. I'm never in a hurry.", "Dr Reilly")).toBe("Dr Reilly listens. They're never in a hurry.");
  });
  it("skips adverbs before the verb", () => {
    expect(thirdPerson("I really enjoy complex cases.", "Dr Chen")).toBe("Dr Chen really enjoys complex cases.");
  });
  it("leaves modals alone", () => {
    expect(thirdPerson("I will always call back.", "Dr Chen")).toBe("Dr Chen will always call back.");
  });
  it("falls back to 'The doctor' when no name is known", () => {
    expect(thirdPerson("I ask people to tell me the whole story.", "The doctor")).toBe("The doctor asks people to tell them the whole story.");
  });
});

describe("draftFor", () => {
  it("uses the lead-in when the answer has no first person", () => {
    expect(draftFor("trail running, ceramics", "Dr Reilly", "enjoys")).toBe("Dr Reilly enjoys trail running, ceramics.");
  });
  it("goes third person without a lead-in when the answer only says we or my", () => {
    expect(draftFor("we book longer first visits", "Dr Reilly", "says")).toBe("They book longer first visits.");
  });
  it("is deterministic", () => {
    const a = draftFor("um I like listening first, you know", "Dr Reilly", "starts with");
    expect(a).toBe(draftFor("um I like listening first, you know", "Dr Reilly", "starts with"));
    expect(a).toBe("Dr Reilly likes listening first.");
  });
});
