# Clinician onboarding C01–C08 — Figma vs build

Figma file `NEbiukDE3TyWFptwaCBhwV`; screenshots at 430×932 (2× DPR) from the production build, seeded with the fictional example doctor from the Figma frames. `shoot.mjs` reproduces them and runs the whole flow in memory mode (`node qa/figma/clinician/shoot.mjs http://localhost:3300`).

| Figma | Route | PNG | Words |
|---|---|---|---|
| C01 Join as a doctor `227:9` | `/join` | C01-join.png | 44 |
| C02 Verify registration `227:68` | `/join/verify` | C02-verify.png, C02-verify-empty.png | 48 / 31 |
| C03 Practice details `227:102` | `/join/practice` | C03-practice.png | 29 |
| C04 Interview intro `227:138` | `/join/interview` | C04-interview.png | 43 |
| C05 Interview question `227:184` | `/join/interview/[1..8]` | C05-question.png | 29 |
| C06 Draft answer `227:214` | `/join/draft/[1..8]` | C06-draft.png | 48 |
| C07 What to share `227:248` | `/join/share` | C07-share.png | 56 |
| C08 Review and publish `227:296` | `/join/review` | C08-review.png | 40 |
| (confirmation, same system) | `/join/review` after Publish | C09-submitted.png | 53 |

All screens sit inside the 20–60 word budget. `/claim/[id]` redirects to `/join?doctor=<id>`, which prefills C02 from our record.

## Matches

Header (44 circle, Roboto Medium 16 right text), Roboto Medium 30 titles, Inter Medium 20 subtitles, 34 r6 icon boxes with the Figma SVGs, 58 r20 fields with the 2×32 divider and 24 icon, 54 r20 pills (dark = on, with the 0 9 9.5 shadow), 44 r14 small pills, 4 px progress bar, 66×66 mic beside a 291 CTA (C05), 374×240 photo card with the 224×75 caption and white edit circle (C08), 373×66 CTA.

## Mismatches I chose or could not close

- **CTA bottom offset**: the kit `Cta` pins the button 26 px from the frame bottom; Figma puts it at y=810 (56 px). Shared primitive, left as is so every screen in the app agrees.
- **C02 has three fields, Figma has one**: the spec adds "Your name as registered" (our data has no AHPRA numbers yet, so the lookup matches by name) and "Practice email" (only the domain is stored). The result card wording follows the data we hold: "Registered, no conditions" only with register-tier data, otherwise "Not yet checked against the register. We verify before publishing."
- **C07 step counter**: Figma shows "7 of 8" with a partial bar; in the flow the share screen comes after question 8, so it shows "8 of 8" with a full bar.
- **C08 photo**: Figma uses a stock photo of the fictional Dr Reilly. A real clinician has no photo until they add one, and the Rules frame says missing photo = #D9D9D9 with initials, so the card renders initials until the edit circle picks a local image (stays in sessionStorage, never uploaded). The 4 MB stock JPEG was not committed.
- **Row meta size**: kit `Row` renders meta at 12 px; the C screens wrap it to 14 px as in Figma.
- **"Tidied, not rewritten"** is a hint line under the draft card; Figma has no label there, the spec asks for one.
- **Local-mode banner** (11 px, top of frame) appears only when `SUPABASE_SERVICE_ROLE_KEY` is unset.
- The 8 question titles are Roboto Medium 26 as C05; Figma's example "How do you approach a first appointment?" is question 2.

## What writes where

| Step | Action (`src/server/clinician.ts`) | Supabase (service role, REST) |
|---|---|---|
| C02 That's me | `createClaim` | `practitioners` (find by `ahpra_number`, else by `source_key`, else insert with `registration_status` null → never published), `provider_claims` {method `ahpra+domain-email`, status `pending`, `claimant_email_domain`} |
| C03 Continue | `savePractice` | `locations` (by name, status `unverified`), `practitioner_roles` (primary, upsert on practitioner+location), `provider_services` (telehealth some/none, bulk_billing all/none, referral_required, tier `declared`, source `claim`), fee → `observations` {field `fees`, value {amountCents}, tier `declared`, 90 d expiry} + `field_evidence` {field `fees`, evidence_status `documented`} |
| C08 Publish | `publishProfile` | `personal_profiles` upsert: status `draft`, `consent_at` now, `lived_experience_opt_in` only when lived experience is shared; `approved_at` untouched (doctor-approved is a Wattle-side step after the register check) |

Interview answers (raw + tidied draft + show flag) and share toggles stay in `sessionStorage["wattle.join"]` until Publish. Migration `0004_clinician_onboarding.sql` adds the `claim` source and `personal_profiles.clinical_interests` (question 1). Question 8 (book/film/podcast) lands in `favourite_book`.

Without the key every action writes to an in-memory map with the same return shape (`src/server/store.ts`); `src/server/clinician.test.ts` covers that path, `tidy.test.ts` the deterministic cleanup.
