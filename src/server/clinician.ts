"use server";
// Server actions for the clinician onboarding flow (Figma C01–C08, app/join/**).
// Writes go to Supabase through the REST API with the service role key, or to the in-memory
// store when the key is absent (src/server/store.ts). Every action returns `backend` so the
// screens can show the local-mode banner. No model calls, no emails: the register check and
// approval are Wattle-side steps that happen after submission.
import { getDoctors } from "@/src/data/providers";
import { backend, insert, memFind, memInsert, memUpsert, select, upsert, type Backend } from "./store";

const AHPRA = /^[A-Z]{3}[0-9]{10}$/;
const DOMAIN = /^[a-z0-9.-]+\.[a-z]{2,}$/;

const SPECIALTY_LABEL: Record<string, string> = {
  psychiatry: "psychiatry",
  paediatrics: "paediatrics and child health",
  "obstetrics-gynaecology": "obstetrics and gynaecology",
};

function normaliseAhpra(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

function normaliseName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^(dr|a\/prof|prof|associate professor|professor)\.?\s+/, "")
    .replace(/[^a-z\s'-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function displayName(raw: string): string {
  const n = raw.trim().replace(/\s+/g, " ");
  return /^dr\b/i.test(n) ? n.replace(/^dr\.?\s*/i, "Dr ") : `Dr ${n}`;
}

export interface Lookup {
  /** True when the number or name matched one of our own records. */
  found: boolean;
  /** Our record id (src/data/providers.ts) when found; carried as practitioners.source_key. */
  doctorId: string | null;
  name: string;
  specialtyLine: string;
  /** We hold register-tier data for this person (Ahpra number, status and conditions flag). */
  registerChecked: boolean;
  registered: boolean;
  conditions: boolean;
  backend: Backend;
}

/** C02: look the number up in our own data first, then fall back to the typed name. */
export async function lookupDoctor(input: { ahpra: string; name: string; doctorId?: string | null }): Promise<Lookup> {
  const ahpra = normaliseAhpra(input.ahpra);
  const name = normaliseName(input.name);
  const doctors = await getDoctors();

  const byId = input.doctorId ? doctors.find((d) => d.id === input.doctorId) : undefined;
  const byNumber = byId ?? (AHPRA.test(ahpra) ? doctors.find((d) => d.register?.ahpraNumber.value === ahpra) : undefined);
  const byName =
    byNumber ??
    (name
      ? doctors.find((d) => normaliseName(d.name.display) === name || normaliseName(`${d.name.given} ${d.name.family}`) === name)
      : undefined);
  const d = byNumber ?? byName;

  if (!d) {
    return {
      found: false,
      doctorId: null,
      name: displayName(input.name),
      specialtyLine: "Not in our directory yet",
      registerChecked: false,
      registered: false,
      conditions: false,
      backend: backend(),
    };
  }
  const label = SPECIALTY_LABEL[d.specialty] ?? d.specialty;
  const registerChecked = Boolean(d.register) && d.register?.ahpraNumber.tier === "register";
  const registered = d.register?.status.value === "registered";
  return {
    found: true,
    doctorId: d.id,
    name: d.name.display,
    // "Specialist" only once the Ahpra specialty is register-tier (CLAUDE.md copy rule).
    specialtyLine: registerChecked ? `Specialist, ${label}` : `Listed under ${label}`,
    registerChecked,
    registered,
    conditions: d.register?.conditionsApply.value ?? false,
    backend: backend(),
  };
}

export interface ClaimResult {
  claimId: string;
  practitionerId: string;
  backend: Backend;
}

/** C02 "That's me": a provider_claims row (method ahpra+domain-email, status pending). Only the email domain is stored. */
export async function createClaim(input: { ahpra: string; name: string; email: string; doctorId: string | null }): Promise<ClaimResult> {
  const ahpra = normaliseAhpra(input.ahpra);
  if (!AHPRA.test(ahpra)) throw new Error("AHPRA number must be three letters and ten digits, e.g. MED0001234567");
  const domain = input.email.trim().toLowerCase().split("@")[1] ?? "";
  if (!DOMAIN.test(domain)) throw new Error("Enter your practice email so we can match its domain");
  const name = displayName(input.name);
  const parts = name.replace(/^Dr\s+/, "").split(" ");
  const given = parts.slice(0, -1).join(" ") || null;
  const family = parts.at(-1) ?? null;

  if (backend() === "memory") {
    const p = memUpsert<{ id: string }>("practitioners", { ahpra_number: ahpra, display_name: name, given_name: given, family_name: family, profession: "medical", source_key: input.doctorId }, ["ahpra_number"]);
    const c = memInsert<{ id: string }>("provider_claims", { practitioner_id: p.id, claimant_email_domain: domain, method: "ahpra+domain-email", status: "pending" });
    return { claimId: c.id, practitionerId: p.id, backend: "memory" };
  }

  let practitioner = (await select<{ id: string }>("practitioners", `select=id&ahpra_number=eq.${ahpra}&limit=1`))[0];
  if (!practitioner && input.doctorId) {
    practitioner = (await select<{ id: string }>("practitioners", `select=id&source_key=eq.${encodeURIComponent(input.doctorId)}&limit=1`))[0];
  }
  if (!practitioner) {
    practitioner = await insert<{ id: string }>("practitioners", {
      ahpra_number: ahpra,
      display_name: name,
      given_name: given,
      family_name: family,
      profession: "medical",
      source_key: input.doctorId,
    });
  }
  const claim = await insert<{ id: string }>("provider_claims", {
    practitioner_id: practitioner.id,
    claimant_email_domain: domain,
    method: "ahpra+domain-email",
    status: "pending",
  });
  return { claimId: claim.id, practitionerId: practitioner.id, backend: "supabase" };
}

export interface PracticeInput {
  practitionerId: string;
  practice: string;
  feeDollars: number | null;
  telehealth: boolean;
  referral: boolean;
  bulkBilling: boolean;
}

/** C03 Continue: location + primary practitioner_role, provider_services (declared), fee as observation + field_evidence. */
export async function savePractice(input: PracticeInput): Promise<{ roleId: string; backend: Backend }> {
  const practice = input.practice.trim();
  if (!practice) throw new Error("Enter where you practise");
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 90 * 86400_000).toISOString();
  const services = {
    telehealth: input.telehealth ? "some" : "none",
    bulk_billing: input.bulkBilling ? "all" : "none",
    referral_required: input.referral,
    tier: "declared",
    source_id: "claim",
    declared_at: now,
    updated_at: now,
  };
  const fee = input.feeDollars !== null && Number.isFinite(input.feeDollars) ? Math.round(input.feeDollars * 100) : null;

  if (backend() === "memory") {
    const loc = memUpsert<{ id: string }>("locations", { name: practice, status: "unverified" }, ["name"]);
    const role = memUpsert<{ id: string }>("practitioner_roles", { practitioner_id: input.practitionerId, location_id: loc.id, primary: true, referral_required: input.referral, fee_policy: input.bulkBilling ? "bulk_bills_all" : "private" }, ["practitioner_id", "location_id"]);
    memUpsert("provider_services", { practitioner_role_id: role.id, ...services }, ["practitioner_role_id"]);
    if (fee !== null) {
      memInsert("observations", { entity_type: "practitioner_role", entity_id: role.id, field: "fees", value: { label: "Initial consult", amountCents: fee }, tier: "declared", source_id: "claim", observed_at: now, expires_at: expires });
      memInsert("field_evidence", { entity_type: "practitioner_role", entity_id: role.id, field: "fees", source_id: "claim", evidence_status: "documented", freshness_at: now });
    }
    return { roleId: role.id, backend: "memory" };
  }

  let location = (await select<{ id: string }>("locations", `select=id&name=eq.${encodeURIComponent(practice)}&limit=1`))[0];
  if (!location) location = await insert<{ id: string }>("locations", { name: practice, status: "unverified" });
  const role = await upsert<{ id: string }>(
    "practitioner_roles",
    { practitioner_id: input.practitionerId, location_id: location.id, primary: true, referral_required: input.referral, fee_policy: input.bulkBilling ? "bulk_bills_all" : "private" },
    "practitioner_id,location_id",
  );
  await upsert("provider_services", { practitioner_role_id: role.id, ...services }, "practitioner_role_id");
  if (fee !== null) {
    await insert("observations", { entity_type: "practitioner_role", entity_id: role.id, field: "fees", value: { label: "Initial consult", amountCents: fee }, tier: "declared", source_id: "claim", observed_at: now, expires_at: expires });
    await insert("field_evidence", { entity_type: "practitioner_role", entity_id: role.id, field: "fees", source_id: "claim", evidence_status: "documented", freshness_at: now });
  }
  return { roleId: role.id, backend: "supabase" };
}

/** Columns of personal_profiles the interview fills (0002 + clinical_interests from 0004). */
export interface ProfileText {
  clinical_interests?: string | null;
  communication_approach?: string | null;
  enjoys_serving?: string | null;
  why_medicine?: string | null;
  professional_purpose?: string | null;
  lived_experience?: string | null;
  outside_medicine?: string | null;
  favourite_book?: string | null;
}

/** C08 Publish: personal_profiles row, status 'draft', consent_at now. 'doctor-approved' is set by Wattle after the register check. */
export async function publishProfile(input: { practitionerId: string; profile: ProfileText }): Promise<{ status: "draft"; backend: Backend }> {
  const now = new Date().toISOString();
  const clean = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);
  const lived = clean(input.profile.lived_experience);
  const row = {
    practitioner_id: input.practitionerId,
    clinical_interests: clean(input.profile.clinical_interests),
    communication_approach: clean(input.profile.communication_approach),
    enjoys_serving: clean(input.profile.enjoys_serving),
    why_medicine: clean(input.profile.why_medicine),
    professional_purpose: clean(input.profile.professional_purpose),
    lived_experience: lived,
    lived_experience_opt_in: lived !== null,
    outside_medicine: clean(input.profile.outside_medicine),
    favourite_book: clean(input.profile.favourite_book),
    status: "draft",
    consent_at: now,
    updated_at: now,
  };
  if (backend() === "memory") {
    memUpsert("personal_profiles", row, ["practitioner_id"]);
    return { status: "draft", backend: "memory" };
  }
  await upsert("personal_profiles", row, "practitioner_id");
  return { status: "draft", backend: "supabase" };
}

/** Which backend the actions will write to; the screens show a banner in memory mode. */
export async function backendMode(): Promise<Backend> {
  return backend();
}

// Test seam for the in-memory path (vitest): find a stored row by predicate.
export async function memoryRow(table: string, key: string, value: unknown): Promise<Record<string, unknown> | undefined> {
  return memFind(table, (r) => r[key] === value);
}
