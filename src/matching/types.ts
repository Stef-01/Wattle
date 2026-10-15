// Shared contract between the matcher, the UI and the pipeline.
// PRD §7 (profile tiers) and §8 (pipeline). Every field here is a declaration
// with a source tier; nothing is a verification unless tier === "register".

export type Tier = "register" | "declared" | "found";

export interface Observed<T> {
  value: T;
  tier: Tier;
  /** Source id from the `sources` registry, e.g. "ahpra", "ranzcp-find", "practice-site", "claim". */
  source: string;
  sourceUrl?: string;
  /** ISO date the fact was observed or declared. */
  observedAt: string;
  /** ISO date after which the fact falls back to the next tier. */
  expiresAt?: string;
}

export type Specialty = "psychiatry" | "paediatrics" | "obstetrics-gynaecology";

export type Population = "infant" | "child" | "adolescent" | "adult" | "older-adult" | "perinatal";

export type Telehealth = "none" | "some" | "first-appointment" | "only";

export type Billing = "bulk-bills" | "bulk-bills-concession" | "gap" | "private" | "unknown";

export type Capacity = "open" | "waitlist" | "closed" | "unknown";

export type Gender = "woman" | "man" | "non-binary";

export interface Location {
  id: string;
  name: string;
  suburb: string;
  state: "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT";
  postcode: string;
  lat: number;
  lng: number;
  phone?: Observed<string>;
  website?: Observed<string>;
  wheelchair?: Observed<boolean>;
  /** Appointments at this location are telehealth only (no physical attendance). */
  telehealthOnly?: boolean;
}

export interface Doctor {
  id: string;
  /** Example profiles are fictional and labelled on every surface. Exactly one of these is true. */
  realPerson: boolean;
  synthetic: boolean;
  name: { given: string; family: string; display: string };
  specialty: Specialty;
  /** Ahpra register fields. Absent on synthetic profiles. */
  register?: {
    ahpraNumber: Observed<string>;
    status: Observed<"registered" | "limited" | "provisional" | "suspended" | "non-practising">;
    fieldOfPractice?: Observed<string[]>;
    endorsements?: Observed<string[]>;
    /** True/false only. The text of conditions is never stored or shown. */
    conditionsApply: Observed<boolean>;
    languages?: Observed<string[]>;
    qualifications?: Observed<string[]>;
    registerUrl: string;
  };
  gender?: Observed<Gender>;
  languages?: Observed<string[]>;
  /** Closed vocabulary from disciplines/<specialty>.yaml. */
  conditions: Observed<string[]>;
  conditionsSometimes?: Observed<string[]>;
  populations: Observed<Population[]>;
  approaches?: Observed<string[]>;
  manner?: Observed<string[]>;
  telehealth: Observed<Telehealth>;
  billing: Observed<Billing>;
  fees?: Observed<{ label: string; amountCents: number }[]>;
  capacity: Observed<Capacity>;
  waitlistWeeks?: Observed<number>;
  referralRequired?: Observed<boolean>;
  yearsInSpecialty?: Observed<number>;
  locations: Location[];
  booking: { via: "phone" | "website" | "platform" | "none"; url?: string; phone?: string; note?: string };
  disclosures?: { label: string; since: string }[];
}

export interface Intent {
  specialty?: Specialty;
  conditions: string[];
  population?: Population;
  constraints: {
    language?: string;
    gender?: Gender;
    telehealth?: "only" | "preferred" | "no";
    billing?: "bulk-bills" | "gap-ok";
    maxKm?: number;
  };
  manner: string[];
  urgency: "emergency" | "soon" | "routine";
  referralInHand: boolean;
  /** Vocabulary terms the sentence explicitly refused ("not medication"). Never matched positively. */
  refused: string[];
}

export interface Place {
  suburb: string;
  state: Location["state"];
  lat: number;
  lng: number;
}

export type FilterReason =
  | "wrong-specialty"
  | "closed-books"
  | "wrong-age-group"
  | "billing-mismatch"
  | "no-telehealth"
  | "out-of-reach"
  | "registration-not-current";

export type OrderQuality = "informed" | "tied" | "unmatched" | "unserved";

export interface Evidence {
  /** Closed-vocabulary label, never the patient's words. */
  label: string;
  kind: "condition" | "population" | "constraint" | "approach" | "manner" | "capacity" | "reach";
  tier: Tier;
}

export interface Ranked {
  doctor: Doctor;
  score: number;
  /** Tier A..D breakdown for tests and the compare screen. */
  tiers: { access: number; fit: number; manner: number; coverage: number };
  evidence: Evidence[];
  missed: Evidence[];
  headline: string;
  distanceKm?: number;
}

export interface MatchResult {
  order: OrderQuality;
  /** One sentence under the heading, from a closed copy table. */
  orderNote: string;
  results: Ranked[];
  excluded: { doctor: Doctor; reason: FilterReason }[];
  /** For `unserved`: the unmet ask and how many results dropping each filter would restore. */
  unserved?: { ask: string; restoreCount: number }[];
  clarifiers: { facet: string; question: string; options: string[] }[];
}
