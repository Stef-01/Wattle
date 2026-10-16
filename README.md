# Wattle Health

A patient-first map of the Australian healthcare system. Sibling venture of ADHD.ME under Wattle Technologies.

**Status (2026-10-16):** Queensland MVP running on real data. 4,736 doctors nationally (psychiatry, obstetrics-gynaecology, paediatrics) from 12 public sources; 876 in Queensland; 195 Queensland doctors linked to 1,077 verified publications. Patient journey and clinician onboarding implemented to the Figma design (file `NEbiukDE3TyWFptwaCBhwV`), 19 screens, two-layer matching ported from ADHD.ME (600 tests). Supabase project `wattle-health` (ap-southeast-2) holds the same data behind `published_*` views.

## Run

```
pnpm install
pnpm dev            # http://localhost:3300
pnpm typecheck && pnpm test && pnpm build
node qa/figma/walk.mjs   # full-journey screenshots against `pnpm start`
```

Copy `.env.example` to `.env.local`. The publishable key is safe; `SUPABASE_SERVICE_ROLE_KEY` is needed only for clinician onboarding writes (without it the join flow runs in local mode).

## Documents

- `PRD.md` — product requirements (v0.2)
- `RESEARCH-PLAN.md` — how the provider map is built, discipline by discipline
- `DATA-MODEL.md` — entity schema (FHIR AU Provider Directory shape) and MVP additions
- `data/README.md` — every source collected, with legal basis, and the merged totals
- `research/raw/01..06` — registry, legal and competitive research with URLs
- `pipeline/` — adapters (`pipeline/adapters`), merge (`pipeline/merge.py`), enrichment (`pipeline/enrich`), Supabase load (`pipeline/load`)
- `supabase/migrations` — schema 0001–0004
- `qa/figma` — Figma renders and the screenshot walk

## Rules that do not bend

No scraping of the Ahpra register. No Google Places content stored. No reviews, ratings or testimonials. No model calls in the request path and no API keys. Every fact carries a source tier (register / declared / found) and a date; "Not declared" is rendered, never invented.
