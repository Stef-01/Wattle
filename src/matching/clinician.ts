// Ported from adhd.me/src/demo/roster.ts on 2026-10-15 (the `Clinician` type only; the roster
// entries were real people and stay in ADHD.ME).
//
// WHAT CHANGED IN THE PORT, stated once here:
//   - `careAreas` was the closed `CareArea` union; it is now a `string` keyed from the
//     discipline yaml's `conditions[].id`. The vocabulary is still closed — the lexicon only
//     reads ids the yaml declares — but it is closed by DATA (disciplines/<slug>.yaml) rather
//     than by a TypeScript union, because the vocabulary differs per specialty.
//   - `manner` was `EIQuality[]`; it is now `string[]` keyed from the yaml's `manner[].id`.
//   - Display-only fields nothing in the matching tree reads (image, pronouns, title, focus,
//     fitSignals, summary, about, experience, expertise, careProfile, mannerPending,
//     consultRecording, approach, nswAdhdTrained) are not carried; `adapter.ts` builds this
//     record from Wattle's `Doctor`, which holds them in its own shape.
//   - `booking.via` "healthengine" became "platform" with the platform named, because Wattle's
//     `Doctor.booking` is platform-agnostic; "synthetic-none" became "none" because a real
//     doctor with no booking route is also a thing the adapter has to represent.
//   - `gender` admits "not-declared": a `Doctor` may carry no gender observation, and an
//     undeclared gender must read as undeclared, never as "not a woman" (declaration-state.ts).
//   - `consultingPoints` is new: Wattle locations carry coordinates, so the distance machinery
//     reads them directly rather than resolving suburb names through the gazetteer.

import type { SuburbPoint } from "@/src/geo/suburbs";
import type { Profession } from "./support/professions";

export type Booking =
  | {
      /** Bookable on a named platform whose `url` carries the live picker. */
      via: "platform";
      platform: string;
      url: string;
    }
  | {
      /** Not synced to any online platform. The reader is sent to the practice, and told why. */
      via: "practice";
      url: string;
      note: string;
    }
  | {
      /** No booking route. A fictional example profile, or a real doctor with nothing to link to. */
      via: "none";
      note: string;
    };

export type Clinician = {
  id: string;
  name: string;
  shortName: string;
  /** Which kind of professional this is; absent reads as a GP (`rosterNoun`). */
  profession?: Profession;
  gender: "woman" | "man" | "non-binary" | "not-declared";
  /** Primary consulting suburb. Only meaningful for a practice somebody travels to. */
  suburb: string;
  /** What is true about getting there without knowing where the reader is. */
  reach: string;
  /** The practice these rooms belong to, as the practice writes it. */
  practice: string;
  booking: Booking;
  acceptingNewPatients: boolean;
  /**
   * When the books declaration was last made or reconfirmed (ISO date). Capacity is the one
   * declared fact that goes wrong by itself, so `capacityGrade` prices its age in. An undated
   * open declaration grades stale, never fresh.
   */
  capacityDeclaredAt?: string;
  /** The fallback reason line when a query reaches nothing. Closed vocabulary only. */
  matchLine: string;
  /** Practice facts as the practice states them; `holdsPreference` reads /bulk/ out of it. */
  practicalSignals: string[];
  languages: string[];
  /** Conditions declared "often", keyed by the discipline yaml's `conditions[].id`. */
  careAreas: string[];
  /** Conditions declared "sometimes": answers an ask at half weight. */
  careAreasSometimes?: string[];
  /** Consulting suburbs beside the primary `suburb`; the distance machinery reads the nearest. */
  alsoConsultsAt?: string[];
  /** Declared coordinates for every consulting location, when the record carries them. */
  consultingPoints?: SuburbPoint[];
  /** How this clinician works, declared by them, keyed by the yaml's `manner[].id`. */
  manner: string[];
  wheelchairAccessible: boolean;
  /** The first appointment can be by telehealth. */
  telehealthFirstAppointment?: boolean;
  /** Telehealth is the ONLY way this clinician consults; distance never applies. */
  telehealthOnly?: boolean;
  appointmentLength: string;
  /** A fictional example profile, labelled on every surface. */
  synthetic?: boolean;
  /** The `Doctor` record this was built from, when the adapter built it. */
  doctorId?: string;
};
