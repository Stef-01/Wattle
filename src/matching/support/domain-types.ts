// Ported from adhd.me/src/domain/types.ts on 2026-10-15 (the slice `explain.ts` reads).
//
// Only the `Patient` record and its branded ids, because `candidateFrom` in explain.ts is a
// deliberately LOSSY projection of a patient record and the test asserts the loss by value.
// Nothing else from ADHD.ME's domain model is needed here.

export type PracticeId = string & { readonly __brand: "PracticeId" };
export type ClinicianId = string & { readonly __brand: "ClinicianId" };
export type PatientId = string & { readonly __brand: "PatientId" };

export interface Patient {
  id: PatientId;
  practiceId: PracticeId;
  usualClinicianId: ClinicianId | null;
  smsConsent: boolean;
  optedOut: boolean;
  lastAttendedAt: string | null;
  futureBookingAt: string | null;
  activeRecall: boolean;
  chronicCare: boolean;
  holdout: boolean;
}
