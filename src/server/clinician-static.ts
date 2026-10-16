// Static-build twin of ./clinician: the same function names, run in the browser over the
// in-memory store and src/generated/roster.json. next.config.mjs swaps every import of
// "src/server/clinician" for this module when NEXT_PUBLIC_STATIC=1, because a static export
// has no server to host actions. The screens keep showing the "Local mode" banner.
import { rosterClient } from "@/src/data/client-match";
import {
  createClaimLocal,
  lookupIn,
  memoryRowLocal,
  publishProfileLocal,
  savePracticeLocal,
  type Backend,
  type ClaimInput,
  type ClaimResult,
  type Lookup,
  type PracticeInput,
  type ProfileText,
} from "./clinician-local";

export type { ClaimResult, Lookup, PracticeInput, ProfileText };

export async function lookupDoctor(input: { ahpra: string; name: string; doctorId?: string | null }): Promise<Lookup> {
  return lookupIn(rosterClient(), input, "memory");
}

export async function createClaim(input: ClaimInput): Promise<ClaimResult> {
  return createClaimLocal(input);
}

export async function savePractice(input: PracticeInput): Promise<{ roleId: string; backend: Backend }> {
  return savePracticeLocal(input);
}

export async function publishProfile(input: { practitionerId: string; profile: ProfileText }): Promise<{ status: "draft"; backend: Backend }> {
  return publishProfileLocal(input);
}

export async function backendMode(): Promise<Backend> {
  return "memory";
}

export async function memoryRow(table: string, key: string, value: unknown): Promise<Record<string, unknown> | undefined> {
  return memoryRowLocal(table, key, value);
}
