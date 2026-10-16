# Patient screens P01–P05 — Figma vs build

Figma file `NEbiukDE3TyWFptwaCBhwV`; screenshots at 430×932 from `node qa/figma/patient-a/shoot.mjs` against `pnpm dev` (port 3300). The "N" badge bottom-left is the Next dev indicator, not part of the screen.

| Route | Node | Screenshot | State |
|---|---|---|---|
| `/splash` | P01 225:10 | p01-splash.png | matches (gradient #2F5D3A→#0F2C1C, Lobster wordmark 44, leaf 34, tagline 20/#E8E8E8 at 390/474) |
| `/` | P02 225:17 | p02-home-empty.png, p02-home-recent.png | matches; name from `wattle.name`, avatar shows initials when a name is set (blank charcoal otherwise) |
| `/heard` | P03 225:64 | p03-heard.png | matches; pills come from the engine, not the frame's sample |
| `/match/[rank]` | P04 225:94 | p04-match-1.png, p04-match-2.png | layout matches; content differs where the data has no fee / years / photo (below) |
| `/results` | P05 226:9 | p05-results.png, p05-results-empty.png | matches; r25.5 cards per Rules frame (P05 frame draws r30) |

## Mismatches I could not close (data, not layout)

- **No photos** in the roster, so every card is the #D9D9D9 initials card. The P04 hero and the P05 first card in Figma show a photo of a fictional doctor (`photo-reilly.png`); that file was downloaded then removed, since a real doctor must never get a stock face.
- **No fees** on any record (`fees` is never populated by the provider loader). P04 shows "Fee not listed" over "—" instead of "Fee / $280". The two-line label makes long names (A/Prof …) truncate at 20 px; names of 16 characters or fewer keep the 24 px of the frame.
- **No years in specialty** (`yearsInSpecialty` is never populated), so the "14 yrs" stat is omitted. "Telehealth" shows only when the source declared telehealth; "Referral" only when `referralRequired` is true (psychiatry). Obstetrics and gynaecology matches in the examples show no stats row at all.
- **Suburb line**: the design says "{suburb}, Brisbane". The matches for the endometriosis example are on the Gold Coast (no geocoded rooms, so no distance), so the line reads "Southport, QLD"; ", Brisbane" appears only when the nearest geocoded room is within 20 km.
- **"Lists …" sentence** uses the closed condition ids of the record (`pelvic-pain` → "pelvic pain"); human-fit sentences appear only when a doctor-approved or illustrative profile exists, which none of the example matches have.
- **Must-have pills for specialties** (`specialty:*` chips) are not removable in the engine (`removable: false`), so tapping them does nothing; condition, population, must, preference and the place pill re-run the search without that item.
- **Empty state counts**: "Widen to 50 km (N doctors)" and "Include telehealth only (N)" take N from `unserved[].restoreCount`, which the engine only fills when no doctor passes Layer 1; otherwise the count is omitted rather than invented. On the live roster (876 Queensland doctors) none of the three examples produce the empty state, so p05-results-empty.png was taken with a parked empty response.
- `Adjust` / `Edit` are 14 px in the kit's `SectionTitle` vs 16 px semibold in the frame (kit signature left alone; P03 draws its header inline at 16 px).

## Changes outside my routes

- `app/layout.tsx`: the old header/footer/`max-w-5xl` wrapper removed so each screen is its own 430 frame.
- `app/globals.css`: the unlayered `a` / `button` / `textarea` colour resets moved into `@layer base`, otherwise `text-white` on a button or link (CTA, dark pills, send arrow) rendered charcoal.
- `src/ui/store.ts`: new exports only — `SAVED_KEY = "wattle.saved.v1"`, saved ids, name, splash flag, draft, recent, request-by-id in sessionStorage.
- `@fontsource/lobster` added for the wordmark.
