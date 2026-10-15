// Ported from adhd.me/src/demo/synthetic-clinician.ts on 2026-10-15.
//
// A fixture builder for engine tests: a complete `Clinician` with every field filled by a
// value that claims nothing about anybody, overridable per test. The care area defaults to
// the psychiatry yaml's first condition id.

import type { Clinician } from "../clinician";

export function syntheticClinician(overrides: Partial<Clinician> = {}): Clinician {
  return {
    id: "synthetic-psychiatrist",
    name: "Dr Synthetic Example",
    shortName: "Dr Example",
    profession: "psychiatrist",
    gender: "man",
    suburb: "Beecroft",
    reach: "Practice appointments",
    practice: "Synthetic Test Practice",
    booking: { via: "practice", url: "https://example.invalid/book", note: "Synthetic fixture." },
    acceptingNewPatients: true,
    capacityDeclaredAt: "2026-08-01",
    matchLine: "Synthetic fixture.",
    practicalSignals: [],
    languages: ["English"],
    careAreas: ["adhd-assessment"],
    manner: [],
    wheelchairAccessible: true,
    appointmentLength: "Synthetic fixture",
    synthetic: true,
    ...overrides,
  };
}
