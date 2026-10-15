// The Doctor → Clinician bridge, field by field. Written for the port on 2026-10-15.

import { describe, expect, it } from "vitest";
import { evidenceFor, toClinician } from "./adapter";
import { FIXTURE_DOCTORS } from "./support/fixture-doctors";
import { bookingHandoff, capacityGrade } from "./rank";

const byId = (id: string) => FIXTURE_DOCTORS.find((d) => d.id === id)!;

describe("toClinician maps every field the ranker reads", () => {
  it("conditions become care areas, with 'sometimes' kept apart", () => {
    const okafor = toClinician(byId("doc-okafor"));
    expect(okafor.careAreas).toEqual(["adhd-assessment", "anxiety", "depression"]);
    expect(okafor.careAreasSometimes).toEqual(["autism-assessment"]);
    expect(toClinician(byId("doc-nguyen")).careAreasSometimes).toBeUndefined();
  });

  it("manner, gender, languages and profession carry across; an undeclared gender stays undeclared", () => {
    const okafor = toClinician(byId("doc-okafor"));
    expect(okafor.manner).toEqual(["collaborative", "gentle"]);
    expect(okafor.gender).toBe("woman");
    expect(okafor.languages).toEqual(["English", "Arabic"]);
    expect(okafor.profession).toBe("psychiatrist");
    expect(toClinician(byId("doc-walsh")).gender).toBe("not-declared");
    expect(toClinician(byId("doc-walsh")).languages).toEqual(["English"]);
  });

  it("register languages are read when no declaration exists, and English is always present", () => {
    expect(toClinician(byId("doc-singh")).languages).toEqual(["English", "Hindi", "Punjabi"]);
  });

  it("telehealth: first-appointment and only set the first-appointment flag; only also sets telehealthOnly", () => {
    expect(toClinician(byId("doc-okafor")).telehealthFirstAppointment).toBe(true);
    expect(toClinician(byId("doc-okafor")).telehealthOnly).toBeUndefined();
    expect(toClinician(byId("doc-chen")).telehealthFirstAppointment).toBe(true);
    expect(toClinician(byId("doc-chen")).telehealthOnly).toBe(true);
    expect(toClinician(byId("doc-nguyen")).telehealthFirstAppointment).toBeUndefined();
    expect(toClinician(byId("doc-rossi")).telehealthFirstAppointment).toBeUndefined();
  });

  it("billing becomes the practical signal holdsPreference reads", () => {
    expect(toClinician(byId("doc-nguyen")).practicalSignals).toEqual(["Bulk billing"]);
    expect(toClinician(byId("doc-okafor")).practicalSignals).toEqual(["Gap fee"]);
    expect(toClinician(byId("doc-walsh")).practicalSignals).toEqual(["Private fee"]);
  });

  it("capacity: open and waitlist accept, closed does not, unknown accepts undated (grades stale)", () => {
    const today = new Date("2026-10-15T00:00:00Z");
    const okafor = toClinician(byId("doc-okafor"));
    expect(okafor.acceptingNewPatients).toBe(true);
    expect(okafor.capacityDeclaredAt).toBe("2026-09-20");
    expect(capacityGrade(okafor, today)).toBe("fresh-open");
    expect(toClinician(byId("doc-nguyen")).acceptingNewPatients).toBe(true);
    expect(toClinician(byId("doc-rossi")).acceptingNewPatients).toBe(false);
    const walsh = toClinician(byId("doc-walsh"));
    expect(walsh.acceptingNewPatients).toBe(true);
    expect(walsh.capacityDeclaredAt).toBeUndefined();
    expect(capacityGrade(walsh, today)).toBe("stale-open");
  });

  it("locations: primary suburb, alsoConsultsAt, declared coordinates, wheelchair from any location", () => {
    const singh = toClinician(byId("doc-singh"));
    expect(singh.suburb).toBe("Hornsby");
    expect(singh.alsoConsultsAt).toEqual(["Epping"]);
    expect(singh.consultingPoints?.map((p) => p.suburb)).toEqual(["Hornsby", "Epping"]);
    expect(singh.wheelchairAccessible).toBe(true);
    expect(toClinician(byId("doc-nguyen")).wheelchairAccessible).toBe(false);
    // A telehealth-only location is not a place anybody travels to.
    expect(toClinician(byId("doc-chen")).consultingPoints).toBeUndefined();
  });

  it("booking: platform, website, phone and none each become a handoff the surface can render", () => {
    expect(bookingHandoff(toClinician(byId("doc-okafor")))).toEqual({ label: "See times on Examplebook", caption: "Opens Examplebook in a new tab." });
    expect(bookingHandoff(toClinician(byId("doc-nguyen")))?.label).toBe("Open the practice page");
    expect(toClinician(byId("doc-rossi")).booking).toEqual({ via: "practice", url: "tel:07 5500 0000", note: "Booked by phone through the practice." });
    expect(bookingHandoff(toClinician(byId("doc-walsh")))).toBeNull();
  });

  it("keeps the synthetic flag and the doctor id", () => {
    const okafor = toClinician(byId("doc-okafor"));
    expect(okafor.synthetic).toBe(true);
    expect(okafor.doctorId).toBe("doc-okafor");
  });
});

describe("evidenceFor names the kind and the tier of the declaration behind a facet", () => {
  it("conditions, sometimes-conditions, manner, languages and preferences", () => {
    const okafor = byId("doc-okafor");
    expect(evidenceFor(okafor, { kind: "care", area: "anxiety" })).toEqual({ kind: "condition", tier: "declared" });
    expect(evidenceFor(okafor, { kind: "care", area: "autism-assessment" })).toEqual({ kind: "condition", tier: "declared" });
    expect(evidenceFor(okafor, { kind: "manner", trait: "gentle" })).toEqual({ kind: "manner", tier: "declared" });
    expect(evidenceFor(byId("doc-singh"), { kind: "language", language: "Hindi" })).toEqual({ kind: "constraint", tier: "register" });
    expect(evidenceFor(okafor, { kind: "preference", preference: "woman-gp" })).toEqual({ kind: "constraint", tier: "declared" });
    expect(evidenceFor(okafor, { kind: "preference", preference: "telehealth-first" })).toEqual({ kind: "constraint", tier: "declared" });
    expect(evidenceFor(okafor, { kind: "preference", preference: "bulk-billing" })).toEqual({ kind: "constraint", tier: "declared" });
  });
});
