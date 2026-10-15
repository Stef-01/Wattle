# Wattle Health — Product Requirements

**Status:** v0.1 draft, 2026-10-15. Founder review pending.
**Owner:** Wattle Technologies (parent of ADHD.ME). Wattle Health is a sibling venture, not a feature of ADHD.ME.
**Companion documents:** `RESEARCH-PLAN.md` (how the provider map gets built, discipline by discipline), `research/` (source-by-source findings), `DATA-MODEL.md` (the entity schema).

---

## 1. One paragraph

Wattle Health is a patient-first map of the Australian healthcare system. A person says what they need, in their own words, and gets the three nearest providers who can actually see them — with the register they are checked against, what the visit will cost, whether they are taking new patients, and how to book — for every discipline, not one condition. It is the second-generation healthdirect: the same public mandate (every service, every suburb), rebuilt around the patient's question instead of the provider's listing. ADHD.ME proved the search feels right for one condition. Wattle Health generalises the feel; it does not reuse the code.

## 2. Problem

healthdirect's National Health Services Directory is the only comprehensive map of Australian health services, and it is built for the people who contribute to it, not the people who search it. The patient experience is a taxonomy browse: pick a service type, type a suburb, read a list. It does not understand a sentence, does not know whether a GP's books are open, does not show fees, and ranks by distance alone. Specialty directories (college "find a" pages, APS, APA, RANZCP) are each complete for their own members and useless across disciplines. Booking platforms (HotDoc, HealthEngine) cover only paying practices. The result: a person with a new need — "my daughter stutters", "I need a psychiatrist who bulk-bills", "which pharmacy near me gives the flu shot tonight" — does five searches across five sites and still guesses.

The cost of not solving it is measured in the gap between a need and a first appointment. The 2023 Senate ADHD inquiry recorded waits of months to years for assessment; the same shape repeats in paediatrics, psychiatry, allied health and rural general practice. Access is prior to quality: a service you cannot find has no quality to measure.

## 3. Who it is for

| Persona | Arrives with | Needs from us |
|---|---|---|
| **The searcher** (primary) — any adult in Australia, often on a phone, often anxious, often for someone else | A sentence, a suburb, sometimes a referral letter | Three providers who fit, why, what it costs, how to book. Under a minute. |
| **The carer / parent** | A child or elder's need, constraints on travel and time | Age-group fit, languages, access, carer-friendly hours |
| **The referrer** (GP, practice nurse, social worker, school counsellor) | A patient in front of them and a referral to write | Current capacity, referral requirements, fee tier, fax/secure-messaging endpoint |
| **The provider** (practitioner or practice manager) | A listing they did not write | A way to claim it, correct it, declare capacity and fees, and nothing that breaches s.133 |
| **The commissioner** (PHN, state health, Healthdirect Australia) | A coverage question | Where the gaps are, by discipline and MMM region |

## 4. What ADHD.ME taught us (carried over as behaviour, not code)

These are the rules the ADHD.ME finder arrived at over ten weeks of QA. Each one is restated here as a requirement because each one was learned by getting it wrong first.

1. **One sentence, not a form.** Care area, manner, language, gender preference, telehealth, billing and appointment length are read from free text. Clarifying questions come *after* results and only for facets the roster actually splits on. Never a wizard.
2. **Access constraints sort first.** Language, gender, telehealth, billing. A provider who fails a constraint can never outrank one who meets it by stacking soft matches.
3. **Care before manner.** A specialty match outranks three bedside-manner traits.
4. **Capacity at equal fit.** Fresh-open (declared ≤90 days) before stale-open before closed. Closed books stay visible with the reason.
5. **Say what the order means.** One sentence under the heading: informed / tied / unmatched / unserved. Never claim a ranking the scores do not support. When nobody fits, name the gap, never blame the reader.
6. **"Why matched" uses closed vocabulary.** Never echo the patient's own words. Never show a score on compare.
7. **No fabricated availability.** Booking is a handoff to the practice or its platform; we hold no slots unless a platform gives us real ones.
8. **Declarations are not verifications.** Every field is tagged: register-checked, provider-declared, inferred from public source, or unknown. "Not declared" is a valid display value.
9. **Text budget: 20–60 words per whole screen, 40 target.** Measured on every route including footer chrome. Delete words, never hide them.
10. **Seven screens, 390 px first, 44 px targets.**
11. **No testimonials, no ratings, no superlatives, no "specialist" unless it is an Ahpra specialty.** s.133 applies to us as the advertiser.
12. **Disclosure beside the listing, never affecting rank.** Any commercial relationship with a provider is shown; a disclosure tax on ranking was tried and removed.
13. **Telehealth-first providers are not sorted by distance.**
14. **Distance uses the nearest of a provider's locations.** Practitioners at multiple sites are one person, many places.

## 5. Goals

| # | Goal | Measure | Target (12 months post-launch) |
|---|---|---|---|
| G1 | Comprehensive | Share of Ahpra-registered practitioners with a practising address resolved to a Wattle Health location | ≥ 90% across all 16 professions; ≥ 97% for GP, psychology, physio, dental, pharmacy |
| G2 | Comprehensive (services) | Share of NHSD service records matched or superseded | 100% of NHSD service types present; every ACCHO, Medicare UCC, public hospital, headspace, Medicare Mental Health centre, community pharmacy |
| G3 | Answers the sentence | Searches reaching a result set with `informed` order | ≥ 70% |
| G4 | Honest about capacity | Listings with a capacity declaration ≤ 90 days old | ≥ 40% of GP and allied listings (healthdirect: ~0%) |
| G5 | Fees visible | Listings with a fee tier (bulk-bills / gap / private) from a public or declared source | ≥ 60% GP, ≥ 50% allied, ≥ 30% specialist |
| G6 | Fast | Sentence → three results, P75 | ≤ 45 s on a phone |
| G7 | Providers trust it | Claimed profiles | 5,000 in year one; correction requests resolved in ≤ 5 business days |
| G8 | Nothing invented | Fields shown without a source tag | 0 |

## 6. Non-goals (v1)

- **Booking slots.** We hand off. Holding availability means integrating every PMS; that is a v3 problem and HotDoc's business.
- **Symptom checking / triage.** healthdirect's symptom checker and 1800 022 222 nurse line stay theirs. We route to a provider; we never tell someone what is wrong with them. Emergency intent gets a single screen: 000, nearest ED, nothing else.
- **Reviews and ratings.** Banned by s.133 for practitioners; HealthEngine was fined $2.9m in 2020 for manipulating them. We show facts and declarations only.
- **Clinical records / My Health Record integration.** Out of scope; no IHI handling in v1.
- **Unregulated modalities** (naturopathy, homeopathy, reiki). Not in v1. Include only disciplines with a register or a NASRHP-recognised self-regulator. Revisit with a clear "not regulated" label if demand shows.
- **Provider-paid placement.** Ranking is never for sale. Revenue, if any, comes from commissioners and claimed-profile tooling, not from position.
- **Replacing college directories.** We link to the authoritative source on every profile.

## 7. The product

### 7.1 Patient flow (seven screens)

1. **Ask.** One box. "What do you need?" Voice or type. One line of disclosure: "Don't include urgent or identifying details." If the text reads as an emergency, screen 1 becomes the 000 screen.
2. **Where.** Suburb or "use my location". Required. Telehealth-first intents skip distance sorting but still ask, for Medicare and state eligibility.
3. **Results.** Three cards. One sentence stating what the order means. Quick-filter pills derived from the sentence (Bulk-billing, Telehealth, Woman clinician, Language, Open books, Wheelchair). "One answer would narrow it" — up to three clarifiers. Map behind a toggle.
4. **Profile.** Best for / Register check / What it costs / Access and hours / How to book / Why matched / Source of each fact.
5. **Compare.** Two side by side, one row per ask, yes/no/not declared. No score.
6. **Book.** Handoff to practice phone, practice site, or booking platform deep link. Referral requirements stated. "Tell us if this was wrong" link.
7. **Afterwards.** Optional: "Did you get seen?" One tap. Feeds capacity freshness, never a rating.

### 7.2 Discipline model

The matcher is discipline-agnostic. Each discipline is a configuration, not a code path:

- **Register source** (Ahpra board, NASRHP member body, government list) and the checkable fields.
- **Care-area vocabulary** (closed list; e.g. physiotherapy: musculoskeletal, neuro, paediatric, women's health, cardiorespiratory, sports, hand, vestibular, pelvic floor).
- **Access facets** that apply (bulk-billing applies to GP and some allied via care plans; NDIS-registered applies to allied; "referral required" applies to specialists; "after-hours" applies to GP/pharmacy/urgent care).
- **Fee model** (MBS item set, typical gap, NDIS price guide cap, private).
- **Capacity semantics** ("accepting new patients" for GP; "waitlist weeks" for specialists and allied; "on call tonight" for pharmacy).

### 7.3 Provider entity model (summary — full schema in `DATA-MODEL.md`)

Three entities, resolved across sources:

- **Practitioner** — Ahpra registration number (primary key where it exists), name, profession, specialty/endorsements, registration status and conditions (public register fields only), languages, gender (declared), telehealth, care areas, manner (declared), years in field (declared), one-or-many locations.
- **Location / Service** — NHSD id where it exists, HPI-O where known, name, address (geocoded, ASGS SA2 + MMM), phone, website, hours, wheelchair, parking, public transport note, booking channel, after-hours arrangement, fee policy, PHN, state.
- **Organisation** — ABN, legal name, trading names, type (practice, hospital, ACCHO, NGO, pharmacy chain), ownership disclosures.

Every attribute carries `{value, source, source_url, observed_at, confidence, tier}` where tier ∈ {register, provider-declared, public-inferred, crowd, unknown}.

### 7.4 Provider side

- **Claim** a profile with Ahpra number + email at the practice domain or a code posted to the practice address.
- **Declare** capacity (slider and "declared on" date), fees by item, care areas, languages, access facets. Declarations expire at 90 days and the profile says so.
- **Correct** anything we inferred. Correction log is public on the profile ("last corrected by the practice, 2026-11-02").
- **Nothing to pay.** No premium tier affects search.

## 8. Requirements

### P0 — must ship

| ID | Requirement | Acceptance |
|---|---|---|
| R1 | Every Ahpra profession searchable with register-checked status | Given a registered practitioner, when I search their name, then the profile shows registration number, status, profession, specialty/endorsements, and the Ahpra page link; conditions shown only as "conditions apply, see register" |
| R2 | Free-text intent → discipline + facets | Given "physio for my knee who takes new patients in Marrickville", then discipline=physiotherapy, care area=musculoskeletal, facet=open books, suburb=Marrickville, no clarifier needed |
| R3 | Tiered ranking per §4 rules 2–5 | Property tests: constraint-failing provider never above constraint-meeting one; care match beats any number of manner traits |
| R4 | Order-honesty sentence on every result set | Four states rendered with the correct copy; `unserved` names the unmet ask |
| R5 | Source tag on every displayed fact | No fact renders without a tier; "not declared" is rendered, never blank |
| R6 | Emergency intercept | Chest pain / overdose / suicide language → 000 screen, no results |
| R7 | Handoff booking | Phone, website, or platform deep link; never a fabricated time |
| R8 | Claim + correct | Practitioner can claim via Ahpra number + domain email; corrections live within 24 h |
| R9 | Text budget gate | CI fails any route over 60 words whole-screen |
| R10 | s.133 copy linter | CI fails testimonials, superlatives, "specialist" outside Ahpra specialties, comparative claims |
| R11 | Coverage dashboard | Per discipline × state × MMM: practitioners on register vs resolved to a location vs with fee data vs with capacity ≤ 90 d |
| R12 | Compare without score | Two profiles, row per ask, yes / no / not declared |

### P1 — fast follow

- Referrer mode: secure-messaging endpoints, referral template, "fax still required" flag.
- Language-matched search using Ahpra "languages" where published, otherwise declared.
- Interpreter availability (TIS National eligible) as a facet.
- NDIS-registered and My Aged Care provider flags from the Commission's open data.
- "Did you get seen" feedback loop feeding capacity freshness.
- PHN and state commissioner view with gap export.

### P2 — design for, do not build

- Real availability from platforms that publish it (HotDoc/HealthEngine partner APIs) — the entity model must accept slot data without a schema change.
- Provider Connect Australia (ADHA) as a push source for practice updates — ingestion pipeline must accept a FHIR `PractitionerRole` / `Location` / `Organization` bundle.
- Bidirectional matching (ADR 0007 in ADHD.ME): provider-declared caseload preferences and deferred acceptance — the ranker interface takes a provider-side score function from day one, even if it returns a constant.
- Multilingual UI.

## 9. Success metrics

**Leading (weeks):** searches/day; share reaching `informed`; clarifier use rate; handoff click-through; claim requests/week; correction requests/week; share of sessions that were emergency-intercepted.

**Lagging (quarters):** coverage % per discipline (G1/G2); fee-visible % (G5); capacity-fresh % (G4); "got seen" yes-rate; commissioner data requests; inbound links from PHN/state sites.

Measurement: PostHog or Plausible (no PII in events; the sentence is never logged verbatim), the coverage dashboard (R11), and a weekly register reconciliation job.

## 10. Architecture (from ADHD.ME, generalised)

- Next.js 15 / React 19 / TypeScript strict / Tailwind 4 — same house as ADHD.ME and wattletech.au; serif display (Newsreader) over Inter; wattle palette.
- Supabase Postgres + PostGIS for entities and geo; `pgvector` for the lexical/concept embedding (ADHD.ME's 259-d closed-concept + hashed-stem design, extended per discipline; dense model swappable behind the same interface).
- Ingestion is a Python pipeline (`pipeline/`) of per-source adapters → staging → entity resolution → publish. Every adapter is idempotent and records `observed_at`. Scheduled via the existing fleet pattern (claude CLI / Task Scheduler, no API keys — Stefan's standing rule).
- Compliance linters in CI, as on ADHD.ME: copy linter (s.133), public-surface sweep, contrast gate, text-budget gate.
- Static where possible; profile pages ISR with 24 h revalidate; search is an edge function.

## 11. Legal and regulatory posture

- **We are the advertiser** for every profile under National Law s.133. No testimonials, no comparative or superlative claims, no protected titles outside the register.
- **Register data** is republished as fact with attribution and a link; conditions and undertakings are summarised as "see register", never paraphrased.
- **Privacy:** practitioner business-contact details are handled under APP business-contact norms; patient sentences are never stored with identifiers; the request id is session-only and deletable (ADHD.ME pattern).
- **Scraping:** only sources whose terms permit, or where facts are not copyright (Telstra v Phone Directories); respect robots; prefer bulk/open-data/licensed channels; log the legal basis per source in `research/SOURCES.md`.
- **No HealthEngine repeat:** no sharing of patient data with providers for marketing; no review manipulation; no undisclosed commercial listings.

## 12. Open questions

| # | Question | Owner | Blocking? |
|---|---|---|---|
| Q1 | Does Wattle Health become an NHSD data partner (contributor + consumer) or compete? Both are possible; partnering gives the service layer for free. | Founder + Healthdirect Australia | Yes, for data strategy |
| Q2 | Can we obtain Ahpra register data in bulk under licence, or must we reconcile practitioner-by-practitioner? | Founder → Ahpra | Yes, for G1 timeline |
| Q3 | Provider Connect Australia: can a non-PMS directory consume it? What is the onboarding path? | Engineering → ADHA | No (P2) |
| Q4 | Which unregulated/self-regulated disciplines are in v1? Recommendation: NASRHP members in, everything else out. | Founder | No |
| Q5 | Name and brand: "Wattle Health" is a sibling of "Wattle Technologies"; needs the same ABN/entity decisions still open on wattletech.au. | Founder + legal | No |
| Q6 | Revenue: commissioner licensing vs none in year one. | Founder | No |
| Q7 | Does the ADHD.ME finder become a discipline view of Wattle Health, or stay separate? | Founder | No |

## 13. Phasing

- **Phase 0 (weeks 1–4):** repo, entity model, Ahpra reconciliation for one profession (physiotherapy — mid-size, all-Ahpra, strong association directory), NHSD ingest for one state (NSW), seven-screen finder on that slice. Coverage dashboard from day one.
- **Phase 1 (weeks 5–12):** all 16 Ahpra professions, national NHSD, GP fee and bulk-billing signals, pharmacy, public hospitals, ACCHOs, Medicare UCCs, Medicare Mental Health centres, headspace. Claim and correct live.
- **Phase 2 (weeks 13–24):** NASRHP self-regulated disciplines, NDIS and My Aged Care flags, referrer mode, commissioner gap view, state-specific services.
- **Phase 3:** platform availability partnerships, PCA ingestion, bidirectional matching.

The order and the per-discipline source map are in `RESEARCH-PLAN.md`.
