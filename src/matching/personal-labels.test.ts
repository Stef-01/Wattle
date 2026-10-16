// The build-time labeller (plan Task 6): free text → closed human_fit labels, and nothing at
// request time. Written on 2026-10-15.

import { describe, expect, it } from "vitest";
import { loadDiscipline } from "@/src/disciplines/load";
import { DOCTOR_PHRASES, labelPersonal, withPersonalLabels } from "./personal-labels";
import { readHumanFit } from "./human-fit";
import { MVP_DOCTORS } from "./support/fixture-mvp-doctors";

const mvp = loadDiscipline("mvp");

describe("labelPersonal", () => {
  it("maps a philosophy to the closed labels, in yaml order", () => {
    expect(
      labelPersonal({ status: "doctor-approved", philosophy: "I listen carefully. Decisions are shared, and care follows the best available evidence." }, mvp),
    ).toEqual(["collaborative", "listens", "evidence-based"]);
  });

  it("reads either spelling of the free-text fields, and the communication approach", () => {
    expect(labelPersonal({ status: "illustrative", philosophyOfCare: "the whole person, in partnership with you" }, mvp)).toEqual(["collaborative", "holistic"]);
    expect(labelPersonal({ status: "illustrative", communicationApproach: "plain language and straight answers" }, mvp)).toEqual(["direct"]);
  });

  it("validates declared communication labels and includes them", () => {
    expect(labelPersonal({ status: "doctor-approved", communication: ["trauma-informed"] }, mvp)).toEqual(["trauma-informed"]);
    expect(() => labelPersonal({ status: "doctor-approved", communication: ["charming"] }, mvp)).toThrow(/not a human_fit id/);
  });

  it("never reads lived experience or hobbies as labels", () => {
    expect(labelPersonal({ status: "doctor-approved", livedExperience: ["I live with endometriosis and I listen"], hobbies: ["collaborative board games"] }, mvp)).toEqual([]);
  });

  it("no text, no labels", () => {
    expect(labelPersonal({ status: "doctor-approved" }, mvp)).toEqual([]);
  });

  it("every doctor-side phrase lands on a label the yaml declares", () => {
    const known = new Set(mvp.humanFit.map((group) => group.id));
    for (const label of Object.keys(DOCTOR_PHRASES)) expect(known.has(label)).toBe(true);
  });

  it("withPersonalLabels fills labels and is the identity without a profile", () => {
    const aoki = MVP_DOCTORS.find((d) => d.id === "mvp-aoki")!;
    // "take time to listen" reaches gentle too, through the yaml's own "takes time" cue.
    expect(aoki.personal?.labels).toEqual(["collaborative", "listens", "gentle"]);
    const brandt = MVP_DOCTORS.find((d) => d.id === "mvp-brandt")!;
    expect(withPersonalLabels(brandt, mvp)).toBe(brandt);
  });
});

describe("readHumanFit", () => {
  it("hears the patient's words through the ported reader, negation rules included", () => {
    expect(readHumanFit("someone who won't just dismiss how I'm feeling", mvp)).toEqual(["listens"]);
    expect(readHumanFit("I want a collaborative approach and ideally lived experience", mvp)).toEqual(["collaborative", "lived-experience"]);
    expect(readHumanFit("nothing about the doctor here", mvp)).toEqual([]);
  });

  it("is empty for a discipline without a human_fit section", () => {
    expect(readHumanFit("collaborative and listens", loadDiscipline("psychiatry"))).toEqual([]);
  });
});
