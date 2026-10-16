-- Wattle Health schema v0.4: clinician onboarding (Figma C01–C08, writing-block Task 4).
-- The join flow (app/join, src/server/clinician.ts) writes provider_claims, locations/practitioner_roles,
-- provider_services, observations + field_evidence (fee), and personal_profiles (status 'draft').
-- Everything it declares carries source 'claim' and tier 'declared'. Approval stays a Wattle-side step.

-- The declared-by-the-doctor source. load_providers.py seeds scraped sources; the claim flow needs this one.
insert into sources (id, name, kind, legal_basis, cadence)
values ('claim', 'Declared by the doctor (claim flow)', 'declared',
        'Provided by the practitioner in the Wattle onboarding flow with consent recorded in personal_profiles.consent_at', 'on claim')
on conflict (id) do nothing;

-- Interview question 1 ("What are your clinical interests?") is free text until it is mapped to conditions.
alter table personal_profiles add column if not exists clinical_interests text;

-- Practitioners created by a claim before the register check: ahpra_number is set, registration_status stays null
-- until Wattle checks the register, so published_practitioners (0003) keeps them out of every public view.
-- The claim's email domain is the only contact fact stored (provider_claims.claimant_email_domain).
