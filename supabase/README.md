# supabase/

Migrations for the Wattle Health Postgres schema. Applied in filename order.

## Apply

```bash
# local stack (Docker)
supabase start
supabase db reset            # drops, re-applies every migration in supabase/migrations, runs seed if any

# linked remote project
supabase link --project-ref <ref>
supabase db push             # applies pending migrations only
supabase migration list      # shows local vs remote state
```

New migration: `supabase migration new <name>` creates `supabase/migrations/<timestamp>_<name>.sql`. Our first two use plain numeric prefixes (`0001_`, `0002_`); keep that ordering style or switch wholesale, never mix.

Extensions used: `postgis`, `pgcrypto` (0001), `vector` (0002). All three are available on Supabase and in the local stack.

## Access model

Base tables have RLS enabled and no policies, so only the service role (pipeline, admin) reaches them. `anon` and `authenticated` read the `published_*` views only. Anything with a practitioner is filtered through `published_practitioners` (registered or synthetic). Draft personal profiles are never visible to anon; 0002 asserts this at apply time.

## Tables

### 0001_schema.sql

| Table | What it holds |
|---|---|
| `sources` | Adapter registry; every row needs a `legal_basis` |
| `organisations` | Keyed by ABN |
| `locations` | A place a service is delivered; PostGIS point, MMM, PHN |
| `practitioners` | Exists because a register says so (Ahpra or NASRHP) |
| `practitioner_roles` | Practitioner × location: fee policy, booking, referral |
| `observations` | Attribute envelope `{value, tier, source, observed_at, expires_at}`; `observations_current` picks the display value |
| `claims` | Provider-side profile claims (practice_email / posted_code / pca) |
| `coverage` | Materialised honesty report per specialty × state × MMM |

### 0002_mvp_tables.sql

| Table | What it holds |
|---|---|
| `specialties` | Ahpra specialties and fields as a tree (`parent_id`); `ahpra_recognised=false` marks college areas that may never be called "specialist" |
| `conditions` | Patient-need vocabulary with synonyms, four categories (womens-health, mental-health, chronic-overlooked, other) |
| `provider_clinical_focus` | Practitioner × condition with strength (primary / secondary / sometimes), tier and source |
| `provider_services` | Per practitioner_role service facts: telehealth, bulk billing, referral, languages, age groups, wait-time text, accepting-new-patients with `declared_at` (90-day expiry in the view) |
| `publications` | Papers with DOI, OpenAlex and PubMed ids, topics, authorship verification level |
| `personal_profiles` | Doctor-owned human-fit text; status draft / doctor-approved / illustrative; lived experience is opt-in |
| `field_evidence` | Per-field provenance: source, evidence status (verified / documented / inferred / illustrative), verified and freshness timestamps |
| `provider_claims` | MVP claim flow: email domain only (never the address), method ahpra+domain-email or posted-code |
| `match_evaluations` | Query hash (never the text), extracted intent, results, rater scores for top-3 relevance, unsupported claims, hard-filter failures |
| `provider_embeddings` | pgvector 384-dim embeddings per practitioner × kind (clinical / personal) × model; HNSW cosine index; built offline |

Seeds in 0002: 23 Ahpra specialties, their recognised fields, a set of non-Ahpra college areas, and 17 MVP conditions with synonyms.
