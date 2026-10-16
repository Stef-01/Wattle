// In-memory path (no SUPABASE_SERVICE_ROLE_KEY): the actions return the same shapes the UI uses.
import { beforeAll, describe, expect, it } from "vitest";
import { backendMode, createClaim, lookupDoctor, memoryRow, publishProfile, savePractice } from "./clinician";

beforeAll(() => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe("clinician actions (memory backend)", () => {
  it("reports memory mode", async () => {
    expect(await backendMode()).toBe("memory");
  });

  it("looks a name up in our own data and never claims a register check it has not done", async () => {
    const r = await lookupDoctor({ ahpra: "MED0000000000", name: "Nobody At All" });
    expect(r.found).toBe(false);
    expect(r.registerChecked).toBe(false);
    expect(r.name).toBe("Dr Nobody At All");
  });

  it("writes claim, practice and profile rows with declared provenance", async () => {
    const claim = await createClaim({ ahpra: "med 0001234567", name: "Nathan Reilly", email: "nathan@springhill.com.au", doctorId: null });
    expect(claim.backend).toBe("memory");
    const row = await memoryRow("provider_claims", "id", claim.claimId);
    expect(row).toMatchObject({ method: "ahpra+domain-email", status: "pending", claimant_email_domain: "springhill.com.au" });
    expect(JSON.stringify(row)).not.toContain("nathan@");

    const practice = await savePractice({ practitionerId: claim.practitionerId, practice: "Spring Hill Specialist Centre", feeDollars: 280, telehealth: true, referral: true, bulkBilling: false });
    const services = await memoryRow("provider_services", "practitioner_role_id", practice.roleId);
    expect(services).toMatchObject({ telehealth: "some", referral_required: true, bulk_billing: "none", tier: "declared", source_id: "claim" });
    const fee = await memoryRow("observations", "entity_id", practice.roleId);
    expect(fee).toMatchObject({ field: "fees", tier: "declared", value: { amountCents: 28000 } });

    const pub = await publishProfile({ practitionerId: claim.practitionerId, profile: { communication_approach: "Dr Reilly listens first.", lived_experience: "" } });
    expect(pub.status).toBe("draft");
    const profile = await memoryRow("personal_profiles", "practitioner_id", claim.practitionerId);
    expect(profile).toMatchObject({ status: "draft", lived_experience: null, lived_experience_opt_in: false });
    expect(profile?.consent_at).toBeTruthy();
    expect(profile?.approved_at).toBeUndefined();
  });

  it("rejects a malformed AHPRA number and a missing practice email", async () => {
    await expect(createClaim({ ahpra: "123", name: "A B", email: "a@b.com", doctorId: null })).rejects.toThrow(/AHPRA/);
    await expect(createClaim({ ahpra: "MED0001234567", name: "A B", email: "nope", doctorId: null })).rejects.toThrow(/email/);
  });
});
