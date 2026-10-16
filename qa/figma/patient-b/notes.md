# Patient screens P06–P11 — QA notes

Figma file `NEbiukDE3TyWFptwaCBhwV`. Screenshots at 430×932 (2x) from `next start` on real
Queensland data, taken with `node qa/figma/patient-b/shoot.mjs http://localhost:3310`.
The script seeds one search ("Pelvic pain and endometriosis, someone who listens", Brisbane)
into sessionStorage the way the results screens store it, so every route renders live data.

| Frame | Route | Shot | Words |
|---|---|---|---|
| P06 Profile 226:58 | `/doctor/[id]` (doctor with a personal profile) | p06-profile.png, p06-contact-sheet.png | 58 |
| P07 Expertise 226:132 | `/doctor/[id]/expertise` | p07-expertise.png, p07-research.png, p07-training.png | 56 |
| P08 What matters most 226:209 | `/adjust` | p08-adjust.png | 25 |
| P09 Why this match 226:257 | `/doctor/[id]/why` | p09-why.png | 42 |
| P10 No match 226:308 | `/results/none` (QA mount of `NoMatch`) | p10-no-match.png | 30 |
| P11 Partial profile 226:366 | `/doctor/[id]` (no personal profile) | p11-partial.png | 34 |
| Tabs | `/recent`, `/saved`, `/me` | recent.png, saved.png, me.png | 8 / 15 / 38 |

All screens sit inside the 20–60 word budget.

## Matches the frame

- Hero 374×460 r25.5 at y=28 with #D9D9D9 initials when there is no photo; blurred 44 px
  circles at (21,18); caption 331×104 r15 at y=327 (solid #1D1D1D over a grey hero, 40% blur
  over a photo); content at y=528; CTA 373×66 r20 at y=810 with the 70 px white fade above it.
- Heading tabs 22/16 Inter semibold; stats 34 r6 boxes + 18 px Roboto medium; rows 16/14 with
  14 px padding and #EDEDED dividers; pills 54 r20 (#2F2F2F on, #FBFBFB off); Poppins 20 titles.
- Every icon is the downloaded Figma SVG from `public/figma/b/` (arrow-left 20/22, bookmark,
  map-pin 17/18, clock, video, file, chevron-right, arrow-right, check, book, external, sliders).

## Mismatches not closed

- **P06 photo.** No doctor in the roster has a photo, so the hero is always the initials
  fallback. The Figma stock portrait (`public/figma/b/photo.png`) is downloaded but never
  rendered: it is not a real doctor.
- **P06 quote line** needs a doctor-approved or illustrative personal profile. None exist in
  `data/enriched/personal/` today, so on real data every doctor takes the P11 branch. The P06
  screenshot was taken with a temporary illustrative profile for Dr Mowat (removed after the
  shot); the status label "Illustrative example, not this doctor’s words" shows under the quote.
- **Fee** is never declared in the provider files (`fees` absent on every record), so the
  caption shows "Fee / Not listed" instead of a dollar figure. Never estimated.
- **Stats** "14 yrs" needs `yearsInSpecialty` (absent everywhere). Telehealth / referral are
  shown only when declared; otherwise one "Not declared" stat. Ramsay/Healthscope/RANZCOG
  pages do not declare telehealth; `referralRequired` is set only for psychiatry.
- **On-pill drop shadow** (0 9 9.5 rgba(0,0,0,.15)) is not in the shared `Pill` primitive;
  the kit is shared with two other agents and only new exports were added.
- **Caption bottom** sits at 21 px in the shared `PhotoCard` (used on /saved); the profile
  hero uses its own caption at the frame's 327 px top.
- **P06 "Care" tab** has no frame of its own; it links to `/doctor/[id]/why`.
- **P09 reason text** comes from the engine verbatim ("Declares Persistent pelvic pain as a
  condition they see"): the capitalised label mid-sentence is the matcher's wording, not
  changed here.

## Behaviour notes

- `/adjust` reranks server-side via `POST /adjust/rerank` (the discipline yaml is read with
  `fs`, so `rerank()` cannot run in the browser). The route reranks the stored survivors when
  the client has them (`wattle.match.<requestId>` in sessionStorage) and otherwise matches
  first and returns the survivors, so the next adjustment is a pure rerank. Choices persist in
  `wattle.adjust.<requestId>`.
- Pill mapping: Experience/Procedures → `clinicalInterests`, Research → `research`,
  Feels heard → `philosophy` + intent label `listens`, Shared experience → `livedExperience`
  + label `lived-experience`, Philosophy → `philosophy`; 20 km → `maxKm` 20 (drops survivors
  further away with no telehealth), Telehealth → telehealth-only filter, Any gender → clears
  the gender constraint (a no-op on today’s data: no record carries `gender`).
- Telehealth-only on the seeded search leaves zero survivors: no gynaecologist near Brisbane
  declares telehealth in the current files. The route then returns `order: "unserved"` with
  "Nobody left after those choices. Loosen one to see doctors again."
- `/saved` reads ids from `wattle.saved.v1` and resolves records via `GET /doctor/lookup?ids=`.
- `/recent` rows reopen the stored request (`wattle.req.<id>`) and go to `/results`; a request
  whose session storage is gone falls back to `/`.
- `NoMatch` props: `{ radiusKm, widenCount, telehealthCount, onWiden, onTelehealth }` plus
  optional `place`, `widenToKm`, `onChange | changeHref`, `onClosest`, `editHref`, `backHref`,
  `busy`. Counts of `null` hide the "N doctors" sub-line rather than inventing a number.
