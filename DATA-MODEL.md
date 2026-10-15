# Wattle Health — Data Model

v0.1, 2026-10-15. Three entities, one attribute envelope, one resolution key per entity. Nothing is stored without a source.

## Design rules

1. **Every attribute is an observation.** Values are never written bare. The envelope is:
   ```
   { value, tier, source_id, source_url, observed_at, expires_at? }
   tier ∈ register | declared | found
   ```
   Three tiers, shown to the patient as three badges (PRD §7). `found` covers anything inferred from a public page we may use, and patient reports of non-clinical facts. Display picks the highest tier that has not expired. Ties go to the most recent. There is no confidence score; the badge and the date are the confidence.
2. **Registers are the spine.** A practitioner exists because a register says so. A location exists because a register, NHSD, ABR or a provider says so. We never create a practitioner from a web page alone.
3. **Declarations expire.** Capacity and fees at 90 days; hours and phone at 365 days. Expired declarations fall back to the next tier and the profile says "last declared <date>".
4. **Resolution keys are stable identifiers, not names.** Names are matched only to attach observations to an identity that already has a key.
5. **Nothing inferred about a person's clinical quality.** No ratings, no outcome scores, no "top rated".

## Entities

### Practitioner

| Field | Type | Key source | Notes |
|---|---|---|---|
| `id` | uuid | — | |
| `ahpra_number` | text, unique | Ahpra register | Primary resolution key for 16 professions. Format `ABC0001234567`. |
| `nasrhp_id` | text | Self-regulating body register (ESSA, AASW, SPA, DA, Audiology Australia, ACA/PACFA…) | For non-Ahpra disciplines; namespaced `essa:12345` |
| `name` | {given, family, display} | Register | Display name may be provider-declared (e.g. preferred first name) |
| `profession` | enum | Register | One of the 16 Ahpra professions or a NASRHP discipline |
| `specialties[]` | enum[] | Register | Ahpra-recognised specialties and fields only |
| `endorsements[]` | enum[] | Register | e.g. psychology area of practice, NP, scheduled medicines |
| `registration_status` | enum | Register | registered / suspended / cancelled / non-practising / limited / provisional |
| `registration_conditions` | boolean | Register | True/false only. Never the text. Display "conditions apply — see register". |
| `register_url` | url | Register | Deep link |
| `register_checked_at` | timestamp | pipeline | |
| `gender` | enum? | Declared | Never inferred from name or photo |
| `pronouns` | text? | Declared | |
| `languages[]` | ISO 639 | Register (where published) / declared / inferred from practice site | |
| `care_areas[]` | enum[] per discipline | Declared / inferred | Closed vocabulary in `disciplines/<discipline>.yaml` |
| `care_areas_sometimes[]` | enum[] | Declared | Half weight in ranking |
| `manner[]` | enum[] | Declared | Closed list; contributory only |
| `telehealth` | enum | Declared / inferred | none / some / first-appointment / only |
| `years_in_field` | int? | Declared | null renders "not declared" |
| `accepting_new_patients` | enum | Declared / platform / inferred | yes / waitlist / no / unknown; with `declared_at` |
| `waitlist_weeks` | int? | Declared | |
| `bio` | text? | Declared | Linted for s.133 before publish |
| `photo` | url? | Declared | Real photo supplied by the person or monogram. No generated faces. |
| `disclosures[]` | {label, since} | Wattle | Any commercial relationship with Wattle; never affects rank |
| `claimed_by` | user id? | Wattle | |
| `roles[]` | PractitionerRole[] | — | See below |

### PractitionerRole (practitioner × location)

| Field | Notes |
|---|---|
| `practitioner_id`, `location_id` | |
| `medicare_provider_number` | Only if provider-declared or published by the practice. Never scraped from claims data. Location-specific by design. |
| `hours[]` | Per-location; may differ from the location's hours |
| `fee_policy` | bulk_bills_all / bulk_bills_concession / gap / private / ndis / unknown |
| `fees[]` | {item or label, amount_cents, concession?, declared_at} |
| `booking` | {via: phone \| website \| platform, url?, phone?, platform_id?, note?} |
| `referral_required` | boolean? — specialists and some allied under care plans |
| `primary` | boolean — the location used for "nearest of their locations" when ambiguous |

### Location (a place a service is delivered)

| Field | Key source | Notes |
|---|---|---|
| `id` | — | |
| `nhsd_id` | NHSD | Resolution key where it exists |
| `hpio` | HI Service / PCA | When known (declared or via PCA) |
| `google_place_id` | Google | Enrichment and dedupe only; stored under Google's terms |
| `name` | NHSD / ABR / declared | |
| `organisation_id` | → Organisation | |
| `address` | structured | GNAF-geocoded; `gnaf_pid` where resolvable |
| `geo` | point | PostGIS |
| `sa2`, `lga`, `phn`, `mmm`, `state` | derived | ASGS 2021, PHN boundaries, MMM 2023 |
| `phone`, `fax`, `email`, `website` | | |
| `secure_messaging[]` | {vendor, endpoint id} | Referrer mode (P1) |
| `hours[]` | | |
| `after_hours` | {arrangement, phone} | GP accreditation requires one |
| `access` | {wheelchair, parking, public_transport_note, hearing_loop, interpreter_tis} | |
| `service_types[]` | NHSD taxonomy | Mapped to our discipline list |
| `location_type` | general_practice / hospital_public / hospital_private / day_hospital / accho / community_health / pharmacy / pathology_collection / imaging / headspace / mmh_centre / ucc / aged_care / ndis_provider / other | |
| `telehealth_only` | boolean | No physical attendance — excluded from distance sort |
| `status` | open / closed / unverified | Closed locations are kept with a `closed_at` |

### Organisation

| Field | Key source |
|---|---|
| `id` | |
| `abn` | ABR — resolution key |
| `legal_name`, `trading_names[]` | ABR |
| `org_type` | practice / hospital_operator / accho / ngo / pharmacy_chain / corporate_gp / government / sole_trader |
| `ownership_disclosures[]` | Declared / public (e.g. ASX corporate operators) |
| `accreditation[]` | {scheme: RACGP / NSQHS / NDIS / aged_care / NATA, status, expires} |

## Source registry (`sources` table)

Each adapter registers itself:

```
id, name, url, kind (register | open_data | api | licensed | scrape | declared | platform),
legal_basis (licence text or case for use), cadence, last_run_at, record_count,
terms_url, robots_ok, contact
```

The legal basis is a required field. An adapter without one does not run.

## Resolution

Order of operations per incoming record:

1. Exact key match (`ahpra_number`, `nhsd_id`, `abn`, `hpio`, `google_place_id`).
2. Deterministic composite: normalised family name + profession + state + postcode (practitioner); normalised name + GNAF pid (location).
3. Probabilistic (Splink or Dedupe-style) with a human-review queue above 0.8 and below 0.95. Never auto-merge two Ahpra numbers.
4. Unresolved records go to `staging` and count on the coverage dashboard as "on register, no location".

## Discipline configuration

`disciplines/<slug>.yaml`:

```yaml
slug: physiotherapy
register: ahpra            # or nasrhp:<body>
ahpra_profession: Physiotherapist
care_areas: [musculoskeletal, sports, neurological, paediatric, womens_health, pelvic_floor, cardiorespiratory, hand, vestibular, aged_care, occupational, hydrotherapy]
facets: [bulk_billing_care_plan, ndis, dva, workers_comp, telehealth, home_visits, open_books, gender, language, wheelchair]
fee_model: mbs_care_plan_gap
capacity_semantics: open_books
referral_required: false
directories:
  - name: APA Find a Physio
    url: https://choose.physio/find-a-physio
    kind: scrape
    legal_basis: "facts not copyright; robots permits; terms reviewed 2026-10-15"
```

The matcher, filters, profile sections and linter all read this file. Adding a discipline is a YAML change plus an adapter.

## Coverage metrics (materialised nightly)

```
coverage(discipline, state, mmm):
  on_register, resolved_to_location, with_phone, with_hours,
  with_fee_tier, with_capacity_fresh_90d, claimed
```

This table is the product's honesty report and is public.

## MVP additions (2026-10-15)

Migration `supabase/migrations/0002_mvp_tables.sql`. Same rules as above: every row carries a source and a tier or evidence status; anon reads `published_*` views only; `practitioners` and `practitioner_roles` are the "provider" and "provider role" entities named in the writing-block plan.

| Table | Key | Purpose | Enums |
|---|---|---|---|
| `specialties` | slug, `parent_id` | Ahpra specialties and fields as a tree; college areas flagged `ahpra_recognised=false` | — |
| `conditions` | `slug` | Patient-need vocabulary with `synonyms[]` for the lexical matcher | category: womens-health / mental-health / chronic-overlooked / other |
| `provider_clinical_focus` | practitioner × condition | Documented clinical interest with tier and source | strength: primary / secondary / sometimes |
| `provider_services` | practitioner_role | Telehealth, bulk billing, referral, languages, age groups, wait-time text, accepting new patients + `declared_at` | telehealth: none / some / first-appointment / only; accepting: yes / waitlist / no / unknown |
| `publications` | `doi` unique | Title, year, venue, OpenAlex and PubMed ids, topics, source URL | authorship_verified: unverified / identifier-matched / doctor-confirmed |
| `personal_profiles` | practitioner | Philosophy, purpose, lived experience (opt-in), hobbies, book, film, podcast, intro video; consent and approval timestamps | status: draft / doctor-approved / illustrative (draft never published) |
| `field_evidence` | entity × field | Source, source URL, verification and freshness timestamps for any field | evidence_status: verified / documented / inferred / illustrative |
| `provider_claims` | practitioner | Ownership claim by email domain (address never stored) or posted code | method: ahpra+domain-email / posted-code; status: pending / verified / rejected / revoked |
| `match_evaluations` | — | SHA-256 of the query (text never stored), extracted intent, results, rater, top-3 relevance (0–3), unsupported claims, hard-filter failures | category as `conditions` |
| `provider_embeddings` | practitioner × kind × model | pgvector `vector(384)`, HNSW cosine index, built offline and never in the request path | kind: clinical / personal |

`evidence_status` maps onto the three badges: verified → register, documented → declared, inferred → found; illustrative rows belong only to `synthetic` practitioners. `provider_claims` sits beside the v0.1 `claims` table (methods practice_email / posted_code / pca); the MVP flow writes `provider_claims`, and the two will be merged once the PCA method ships.
