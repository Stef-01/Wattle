# MVP patient journey — QA notes, 2026-10-15

Shot with `node qa/mvp/shoot.mjs` against `pnpm start` (port 3300), 390x844 and 1280x800, full page.
Sentence used: the §5 pitch (chronic pelvic pain, endometriosis, collaborative, lived experience), suburb Brisbane.

## Data rendered
- 858 real Queensland doctors from data/providers/*.jsonl (psychiatry 298, paediatrics 61, O&G 499), every fact tier "found" with source and date.
- 0 verified publications: all 150 rows in data/enriched/publications are `authorship_verified: unverified` (dry run), so profiles say "No verified publications yet".
- 0 personal profiles (no data/enriched/personal yet), so Philosophy and Personal sections show the claim prompt.
- Supabase branch is dormant: no .env / NEXT_PUBLIC_SUPABASE_URL present; JSONL fallback used.

## Pitch result
Order "informed"; chips: Persistent pelvic pain, Endometriosis (condition), Collaborative, Listens, Lived experience (human fit), O&G / Pain medicine / General practice (specialties considered). Top three are O&G doctors with documented endometriosis + pelvic pain focus (Ramsay, Mater).

## What I saw and fixed
- results-390: tier badge beside the name forced "Dr / Matthew / McKnoulty" onto three lines and the suburb word-per-line. Moved the badge above the name.
- Fit band pill stretched full width (flex-col stretch). Now `items-start`.
- Compare showed raw source ids ("ramsay"); now the source label.
- Profile details "+" rotated into "×" when open, which reads as close. Now + / −.
- Saved: "Remove" overflowed the card at 390. `shrink-0` + `min-w-0`.
- `next build` failed with "a[d] is not a function" only while `pnpm dev` was running on the same `.next`. Build with dev stopped.

## Text budget (whole screen, body innerText words)
ask 38 · emergency 39 · claim 32 · saved 25 · about 62 · compare 97 · doctor 153 (lower sections collapsed in <details>) · results 226.
Results and profile are over 60 by design of the brief (three cards with two explanations each, chips, four sliders). The matcher's reason copy ("Declares X as a condition they see") is the largest single cost; a terser closed label from the matcher would cut ~40 words.

## Still open
- Dev "N" overlay in dev screenshots is Next's indicator, not the UI.
- `pnpm gate:text` / `gate:copy` scripts referenced in package.json do not exist in the repo yet, so the gates were not run.
- disciplines/*.yaml are read at request time with fs; on Vercel they need `outputFileTracingIncludes` in next.config (not owned by this task).
