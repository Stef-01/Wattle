// Fictional `Doctor` records for the two-layer MVP tests (mvp.test.ts, layer2.properties.test.ts),
// keyed to disciplines/mvp.yaml. Written on 2026-10-15. Every profile is `synthetic: true` and
// nothing here may reach a screen. Specialties are the three the data layer keys on today
// (psychiatry, obstetrics-gynaecology, paediatrics); the yaml's wider specialty fields have no
// doctors in this fixture, which is itself one of the things the tests check.
//
// Layer-2 data is spread on purpose: doctor-approved profiles (Aoki, Eze, Faure, Hart), one
// illustrative profile (Costa), one draft that must read as no profile (Gill), one profile that
// aligns with nothing (Jensen, hobbies only), and doctors with no profile at all.

import { loadDiscipline } from "@/src/disciplines/load";
import { withPersonalLabels } from "../personal-labels";
import type { Doctor, Location } from "../types";
import { obs } from "./fixture-doctors";

export const MVP = loadDiscipline("mvp");

function location(id: string, name: string, suburb: string, postcode: string, lat: number, lng: number, extra: Partial<Location> = {}): Location {
  return { id, name, suburb, state: "QLD", postcode, lat, lng, ...extra };
}

function doctor(partial: Omit<Doctor, "realPerson" | "synthetic" | "populations"> & Partial<Pick<Doctor, "populations">>): Doctor {
  return withPersonalLabels({ realPerson: false, synthetic: true, populations: obs(["adult"]), ...partial }, MVP);
}

export const MVP_DOCTORS: readonly Doctor[] = [
  doctor({
    id: "mvp-aoki",
    name: { given: "Hana", family: "Aoki", display: "Dr Hana Aoki (example)" },
    specialty: "psychiatry",
    gender: obs("woman"),
    conditions: obs(["perinatal-mh", "depression", "anxiety"]),
    populations: obs(["adult", "perinatal"]),
    manner: obs(["gentle", "collaborative"]),
    telehealth: obs("some"),
    billing: obs("gap"),
    capacity: obs("open", "declared", "2026-10-01"),
    locations: [location("loc-aoki", "Example Perinatal Psychiatry, Spring Hill", "Spring Hill", "4000", -27.4615, 153.0245)],
    booking: { via: "website", url: "https://example.invalid/aoki" },
    personal: {
      status: "doctor-approved",
      philosophy: "I take time to listen and I believe what patients tell me about their own lives. Decisions are shared.",
      whyMedicine: "A family member was dismissed for years before anyone took her seriously.",
      enjoysServing: ["perinatal"],
      livedExperience: ["Postnatal depression after my first child"],
      hobbies: ["trail running"],
    },
  }),
  doctor({
    id: "mvp-brandt",
    name: { given: "Lukas", family: "Brandt", display: "Dr Lukas Brandt (example)" },
    specialty: "psychiatry",
    gender: obs("man"),
    conditions: obs(["perinatal-mh", "bipolar", "psychosis"]),
    populations: obs(["adult", "perinatal"]),
    manner: obs(["direct"]),
    telehealth: obs("some"),
    billing: obs("gap"),
    capacity: obs("open", "declared", "2026-10-01"),
    locations: [location("loc-brandt", "Example Rooms, South Brisbane", "South Brisbane", "4101", -27.4809, 153.0176)],
    booking: { via: "website", url: "https://example.invalid/brandt" },
  }),
  doctor({
    id: "mvp-costa",
    name: { given: "Inês", family: "Costa", display: "Dr Inês Costa (example)" },
    specialty: "obstetrics-gynaecology",
    gender: obs("woman"),
    conditions: obs(["endometriosis", "pelvic-pain", "menopause"]),
    conditionsSometimes: obs(["perinatal-mh"]),
    manner: obs(["collaborative"]),
    telehealth: obs("first-appointment"),
    billing: obs("gap"),
    capacity: obs("open", "declared", "2026-10-01"),
    locations: [location("loc-costa", "Example Pelvic Pain Clinic, Greenslopes", "Greenslopes", "4120", -27.5081, 153.0497)],
    booking: { via: "platform", url: "https://examplebook.invalid/costa" },
    personal: {
      status: "illustrative",
      philosophyOfCare: "I treat the whole person, in partnership with you, and we decide together what matters most.",
      livedExperience: "I live with endometriosis myself.",
      hobbies: "pottery",
    },
    researchTopics: obs(["endometriosis"], "found"),
    clinicalInterests: obs(["endometriosis", "pelvic-pain"], "found"),
  }),
  doctor({
    id: "mvp-dunne",
    name: { given: "Siobhan", family: "Dunne", display: "Dr Siobhan Dunne (example)" },
    specialty: "obstetrics-gynaecology",
    gender: obs("woman"),
    conditions: obs(["endometriosis", "pcos", "menopause"]),
    telehealth: obs("none"),
    billing: obs("private"),
    capacity: obs("open", "declared", "2026-10-01"),
    locations: [location("loc-dunne", "Example Women's Health, Toowong", "Toowong", "4066", -27.4847, 152.9859)],
    booking: { via: "phone", phone: "07 3000 0000" },
    researchTopics: obs(["pcos"], "found"),
  }),
  doctor({
    id: "mvp-eze",
    name: { given: "Chidi", family: "Eze", display: "Dr Chidi Eze (example)" },
    specialty: "obstetrics-gynaecology",
    gender: obs("man"),
    conditions: obs(["pelvic-pain", "endometriosis"]),
    telehealth: obs("none"),
    billing: obs("gap"),
    capacity: obs("open", "declared", "2026-10-01"),
    locations: [location("loc-eze", "Example Gynaecology, Chermside", "Chermside", "4032", -27.3858, 153.0317)],
    booking: { via: "website", url: "https://example.invalid/eze" },
    personal: {
      status: "doctor-approved",
      philosophy: "Care should follow the best available evidence, explained in plain language with straight answers.",
      communication: ["direct", "evidence-based"],
    },
  }),
  doctor({
    id: "mvp-faure",
    name: { given: "Camille", family: "Faure", display: "Dr Camille Faure (example)" },
    specialty: "psychiatry",
    gender: obs("woman"),
    conditions: obs(["adhd", "autism", "anxiety", "depression"]),
    manner: obs(["neurodiversity-affirming"]),
    telehealth: obs("first-appointment"),
    billing: obs("gap"),
    capacity: obs("open", "declared", "2026-10-01"),
    locations: [location("loc-faure", "Example Adult ADHD Clinic, Fortitude Valley", "Fortitude Valley", "4006", -27.457, 153.034)],
    booking: { via: "platform", url: "https://examplebook.invalid/faure" },
    personal: {
      status: "doctor-approved",
      purpose: "Neurodivergent adults deserve care that is strengths based and not a deficit model.",
      communication: ["neurodiversity-affirming", "collaborative"],
      livedExperience: ["Diagnosed with ADHD at 38"],
    },
    researchTopics: obs(["adhd"], "found"),
  }),
  doctor({
    id: "mvp-gill",
    name: { given: "Jasdeep", family: "Gill", display: "Dr Jasdeep Gill (example)" },
    specialty: "paediatrics",
    gender: obs("man"),
    languages: obs(["English", "Punjabi"]),
    conditions: obs(["adhd", "autism", "eating-disorders"]),
    populations: obs(["child", "adolescent"]),
    manner: obs(["gentle"]),
    telehealth: obs("some"),
    billing: obs("gap"),
    capacity: obs("open", "declared", "2026-10-01"),
    locations: [location("loc-gill", "Example Child Development, Herston", "Herston", "4006", -27.4475, 153.0272)],
    booking: { via: "website", url: "https://example.invalid/gill" },
    personal: {
      status: "draft",
      philosophy: "I listen to children first and to their parents second; shared decisions with the family.",
      livedExperience: ["Parent of an autistic child"],
    },
  }),
  doctor({
    id: "mvp-hart",
    name: { given: "Morgan", family: "Hart", display: "Dr Morgan Hart (example)" },
    specialty: "psychiatry",
    conditions: obs(["chronic-pain", "trauma", "fnd", "personality"]),
    manner: obs(["gentle"]),
    telehealth: obs("only"),
    billing: obs("bulk-bills"),
    capacity: obs("open", "declared", "2026-10-05"),
    locations: [location("loc-hart", "Example Pain and Trauma Service (telehealth)", "Brisbane City", "4000", -27.4698, 153.0251, { telehealthOnly: true })],
    booking: { via: "website", url: "https://example.invalid/hart" },
    personal: {
      status: "doctor-approved",
      philosophy: "Your pain is real and you are not imagining it. We go at your pace, and I ask before anything.",
      communication: ["trauma-informed", "gentle"],
    },
    clinicalInterests: obs(["chronic-pain", "fnd"], "declared"),
  }),
  doctor({
    id: "mvp-ivers",
    name: { given: "Tariq", family: "Ivers", display: "Dr Tariq Ivers (example)" },
    specialty: "psychiatry",
    gender: obs("man"),
    languages: obs(["English", "Arabic"]),
    conditions: obs(["substance-use", "bipolar", "ocd", "sleep"]),
    telehealth: obs("none"),
    billing: obs("bulk-bills"),
    capacity: obs("open", "declared", "2026-10-01"),
    locations: [location("loc-ivers", "Example Community Psychiatry, Woolloongabba", "Woolloongabba", "4102", -27.4886, 153.0355)],
    booking: { via: "website", url: "https://example.invalid/ivers" },
  }),
  doctor({
    id: "mvp-jensen",
    name: { given: "Freja", family: "Jensen", display: "Dr Freja Jensen (example)" },
    specialty: "psychiatry",
    gender: obs("woman"),
    languages: obs(["English", "Mandarin"]),
    conditions: obs(["depression", "anxiety", "trauma", "eating-disorders"]),
    populations: obs(["adult", "older-adult"]),
    manner: obs(["direct"]),
    telehealth: obs("none"),
    billing: obs("gap"),
    capacity: obs("open", "declared", "2026-10-01"),
    locations: [location("loc-jensen", "Example Rooms, Toowoomba", "Toowoomba", "4350", -27.5598, 151.9507)],
    booking: { via: "website", url: "https://example.invalid/jensen" },
    personal: { status: "illustrative", hobbies: ["choir", "sourdough"] },
  }),
  doctor({
    id: "mvp-closed",
    name: { given: "Rhea", family: "Nair", display: "Dr Rhea Nair (example)" },
    specialty: "obstetrics-gynaecology",
    gender: obs("woman"),
    conditions: obs(["endometriosis", "pelvic-pain"]),
    telehealth: obs("some"),
    billing: obs("gap"),
    capacity: obs("closed", "declared", "2026-09-01"),
    locations: [location("loc-nair", "Example Endometriosis Centre, Auchenflower", "Auchenflower", "4066", -27.4762, 153.0014)],
    booking: { via: "phone", phone: "07 3000 0001" },
  }),
];

export const BRISBANE = { suburb: "Brisbane City", state: "QLD" as const, lat: -27.4698, lng: 153.0251 };
