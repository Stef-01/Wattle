// Fictional `Doctor` records for the end-to-end tests (psychiatry.test.ts, adapter.test.ts).
// Written for the port on 2026-10-15. Every profile is `synthetic: true`; nothing here may
// reach a screen. The six psychiatrists mirror FIXTURE_ROSTER's declarations in the `Doctor`
// shape so the adapter can be checked against a hand-written `Clinician`; the seventh and
// eighth exist to be excluded (a paediatrician, and a suspended registration).

import type { Doctor, Location, Observed, Tier } from "../types";

export function obs<T>(value: T, tier: Tier = "declared", observedAt = "2026-10-01"): Observed<T> {
  return { value, tier, source: tier === "register" ? "ahpra" : "claim", observedAt };
}

function location(id: string, name: string, suburb: string, state: Location["state"], postcode: string, lat: number, lng: number, extra: Partial<Location> = {}): Location {
  return { id, name, suburb, state, postcode, lat, lng, ...extra };
}

function doctor(partial: Omit<Doctor, "realPerson" | "synthetic" | "populations"> & Partial<Pick<Doctor, "populations">>): Doctor {
  return { realPerson: false, synthetic: true, populations: obs(["adult"]), ...partial };
}

export const FIXTURE_DOCTORS: readonly Doctor[] = [
  doctor({
    id: "doc-okafor",
    name: { given: "Amara", family: "Okafor", display: "Dr Amara Okafor (example)" },
    specialty: "psychiatry",
    gender: obs("woman"),
    languages: obs(["English", "Arabic"]),
    conditions: obs(["adhd-assessment", "anxiety", "depression"]),
    conditionsSometimes: obs(["autism-assessment"]),
    manner: obs(["collaborative", "gentle"]),
    telehealth: obs("first-appointment"),
    billing: obs("gap"),
    capacity: obs("open", "declared", "2026-09-20"),
    locations: [location("loc-okafor", "Example Psychiatry, Parramatta", "Parramatta", "NSW", "2150", -33.815, 151.001, { wheelchair: obs(true) })],
    booking: { via: "platform", url: "https://examplebook.invalid/okafor" },
  }),
  doctor({
    id: "doc-nguyen",
    name: { given: "Minh", family: "Nguyen", display: "Dr Minh Nguyen (example)" },
    specialty: "psychiatry",
    gender: obs("man"),
    languages: obs(["English", "Vietnamese"]),
    conditions: obs(["adhd-assessment", "bipolar", "psychosis", "substance-use"]),
    manner: obs(["direct"]),
    telehealth: obs("none"),
    billing: obs("bulk-bills"),
    capacity: obs("waitlist", "declared", "2026-08-01"),
    waitlistWeeks: obs(8),
    locations: [location("loc-nguyen", "Example Clinic, Double Bay", "Double Bay", "NSW", "2028", -33.8775, 151.2437)],
    booking: { via: "website", url: "https://example.invalid/nguyen" },
  }),
  doctor({
    id: "doc-rossi",
    name: { given: "Giulia", family: "Rossi", display: "Dr Giulia Rossi (example)" },
    specialty: "psychiatry",
    gender: obs("woman"),
    languages: obs(["English", "Italian"]),
    conditions: obs(["perinatal-mh", "depression", "anxiety", "eating-disorders"]),
    conditionsSometimes: obs(["trauma"]),
    populations: obs(["adult", "perinatal"]),
    manner: obs(["gentle", "culturally-safe"]),
    telehealth: obs("some"),
    billing: obs("gap"),
    capacity: obs("closed", "declared", "2026-09-01"),
    locations: [location("loc-rossi", "Example Perinatal Clinic, Southport", "Southport", "QLD", "4215", -27.9688, 153.4067, { wheelchair: obs(true) })],
    booking: { via: "phone", phone: "07 5500 0000" },
  }),
  doctor({
    id: "doc-singh",
    name: { given: "Harpreet", family: "Singh", display: "Dr Harpreet Singh (example)" },
    specialty: "psychiatry",
    register: {
      ahpraNumber: obs("MED0000000001", "register"),
      status: obs("registered", "register"),
      conditionsApply: obs(false, "register"),
      languages: obs(["English", "Hindi", "Punjabi"], "register"),
      registerUrl: "https://example.invalid/register/singh",
    },
    gender: obs("man"),
    conditions: obs(["child-adolescent", "adhd-assessment", "autism-assessment", "anxiety"]),
    populations: obs(["child", "adolescent"]),
    manner: obs(["collaborative", "neurodiversity-affirming"]),
    telehealth: obs("first-appointment"),
    billing: obs("gap"),
    capacity: obs("open", "declared", "2026-10-01"),
    locations: [
      location("loc-singh-1", "Example Child and Family Clinic, Hornsby", "Hornsby", "NSW", "2077", -33.7045, 151.0993, { wheelchair: obs(true) }),
      location("loc-singh-2", "Example Rooms, Epping", "Epping", "NSW", "2121", -33.7726, 151.0817),
    ],
    booking: { via: "platform", url: "https://examplebook.invalid/singh" },
  }),
  doctor({
    id: "doc-chen",
    name: { given: "Wei", family: "Chen", display: "Dr Wei Chen (example)" },
    specialty: "psychiatry",
    gender: obs("non-binary"),
    languages: obs(["English", "Mandarin"]),
    conditions: obs(["trauma", "ocd", "personality"]),
    manner: obs(["lgbtq-affirming", "gentle"]),
    telehealth: obs("only"),
    billing: obs("bulk-bills"),
    capacity: obs("open", "declared", "2026-10-05"),
    locations: [location("loc-chen", "Example Trauma Service (telehealth)", "Fortitude Valley", "QLD", "4006", -27.457, 153.034, { telehealthOnly: true })],
    booking: { via: "website", url: "https://example.invalid/chen" },
  }),
  doctor({
    id: "doc-walsh",
    name: { given: "Declan", family: "Walsh", display: "Dr Declan Walsh (example)" },
    specialty: "psychiatry",
    conditions: obs(["older-adult-mh", "depression", "grief", "sleep", "second-opinion", "forensic"]),
    populations: obs(["adult", "older-adult"]),
    manner: obs(["direct"]),
    telehealth: obs("none"),
    billing: obs("private"),
    capacity: obs("unknown"),
    locations: [location("loc-walsh", "Example Older Persons Clinic, Beecroft", "Beecroft", "NSW", "2119", -33.7503, 151.0586)],
    booking: { via: "none" },
  }),
  doctor({
    id: "doc-paed",
    name: { given: "Priya", family: "Raman", display: "Dr Priya Raman (example)" },
    specialty: "paediatrics",
    gender: obs("woman"),
    conditions: obs(["adhd-assessment"]),
    populations: obs(["child"]),
    telehealth: obs("some"),
    billing: obs("gap"),
    capacity: obs("open", "declared", "2026-10-01"),
    locations: [location("loc-paed", "Example Paediatrics, Parramatta", "Parramatta", "NSW", "2150", -33.815, 151.001)],
    booking: { via: "website", url: "https://example.invalid/raman" },
  }),
  doctor({
    id: "doc-suspended",
    name: { given: "Tom", family: "Hale", display: "Dr Tom Hale (example)" },
    specialty: "psychiatry",
    register: {
      ahpraNumber: obs("MED0000000002", "register"),
      status: obs("suspended", "register"),
      conditionsApply: obs(true, "register"),
      registerUrl: "https://example.invalid/register/hale",
    },
    conditions: obs(["adhd-assessment", "anxiety"]),
    telehealth: obs("some"),
    billing: obs("bulk-bills"),
    capacity: obs("open", "declared", "2026-10-01"),
    locations: [location("loc-hale", "Example Rooms, Parramatta", "Parramatta", "NSW", "2150", -33.815, 151.001)],
    booking: { via: "website", url: "https://example.invalid/hale" },
  }),
];
