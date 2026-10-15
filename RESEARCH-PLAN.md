# Wattle Health — Research and Data Plan

v0.2, 2026-10-15. How the provider map gets built: which sources, how they are obtained, what they cost, in what order. Every claim here is traced to `research/raw/01` to `05`, each of which carries the URL it was checked against on 2026-10-15. Items those reports flag `[unverified]` are listed in §9 and are not relied on for decisions.

---

## 1. The shape of the problem

Australia has no open provider dataset. There are four layers, each with one authoritative source, and none of them is scrapeable or free in the way a startup would like:

| Layer | Source | Access | Cost | What it gives | What it lacks |
|---|---|---|---|---|---|
| Who may practise | Ahpra National Register (15 boards, 16 professions, ~960k registrants) | Paid extract or PIE API under contract. Web terms forbid extraction tools; Ahpra took a scraper offline in 2015 | Extract $2,000 per board per snapshot; PIE API $4,000 setup + $1,000/yr + $1 per practitioner per year | Registration number, status, specialty and field, endorsements, conditions (as flags), qualifications, **spoken languages**, principal place of practice at suburb level | Contact details, street address, fees, capacity |
| Where services are delivered | healthdirect NHSD (FHIR R4; Organization, Location, HealthcareService, Practitioner, PractitionerRole, Endpoint; SNOMED CT-AU coded; G-NAF ids) | Data and API Licence + cybersecurity checklist; Bulk Export (full NDJSON every 3 months + daily deltas) | **Free** to integration partners | Address, phone, hours, service types, languages, `new_patient_availability`, bulk-billing flag (mandatory for BBPIP practices since 1 Nov 2025), booking links, attached practitioners | Fees beyond the flag, verified capacity, anything the provider has not updated (12-month review is only advised) |
| Provider-pushed truth | Provider Connect Australia (ADHA) | Business-partner participation agreement + Information Use Statement | Not stated (none on public pages) | ABN, HPI-O, G-NAF address, hours with public-holiday exceptions, practitioner name, **Ahpra number and profession**, HPI-I where lawful, Medicare provider number where available, role | Only organisations that have adopted PCA (>1,900 in 2024; 29 PHNs, four commercial directories already partners) |
| Organisation identity | ABR bulk extract + ABN Lookup web service | Open, CC BY 3.0 AU, hourly refresh | Free | ABN, legal and trading names, status, entity type, postcode | Street address |

Everything else (college directories, hospital group directories, practice websites, Medical Costs Finder, PubMed) is enrichment on top of these four.

**Three things never to do:** scrape the Ahpra register in bulk; store Google Places content beyond `place_id`; build eight state scrapers (QLD, WA and SA embed the NHSD outright; NSW is a 7-of-15-LHD beta with no API).

## 2. Spine acquisition: the first four weeks

These run in parallel and are all founder actions. Each unblocks a column of the coverage dashboard.

| # | Action | Contact | Expected lead time | Fallback while waiting |
|---|---|---|---|---|
| A1 | **NHSD Data and API Licence** with Bulk Export. Get "consumer-facing directory" written into the approved purpose. Read the cybersecurity checklist before designing storage. | nhsd@healthdirect.org.au | 4 to 8 weeks | AURIN June 2026 snapshot is academic-only; do not use. Start with college directories and practice sites for the three MVP specialties. |
| A2 | **PCA business partnership.** Confirm eligibility for a new entrant, delivery mechanism (push vs FHIR pull vs portal), fees, and the participation agreement text. | pca@digitalhealth.gov.au | 4 to 12 weeks | None needed for MVP; PCA is the enrichment and claim channel for Phase 2 onward. |
| A3 | **Ahpra Medical Board extract**: specialist registrations with specialty, field of specialty practice, endorsements, status, languages, principal place of practice postcode. Extract, not copy, so it is shareable under the agreement. Quarterly refresh to match the Medical Board's data cadence. | Ahpra external data exchange services | 2 weeks review + 5 business days delivery after payment | For the MVP's three specialties (~12,300 doctors), individual register lookups during the claim flow are permitted "personal use". Seed the roster from RANZCP, RANZCOG, ACD and hospital-group directories and verify each against the register one at a time as profiles are claimed. |
| A4 | **Ahpra PIE API** once registration numbers are held: daily status alerts and on-demand verification at $1 per practitioner per year. For 12,300 MVP doctors that is $4,000 + $1,000 + $12,300 in year one; for all 154k doctors about $159k per year, which argues for quarterly extracts for discovery and PIE only for claimed profiles. | Ahpra | 2 weeks | Quarterly extract refresh. |
| A5 | **ABR bulk extract** loaded nightly. | data.gov.au | Immediate | — |
| A6 | **Geography**: ABS ASGS Edition 3 boundaries (CC BY 4.0), Modified Monash Model 2023 and GP Catchments (CC BY 2.5 AU), PHN boundaries. Compute SA2, LGA, PHN, MMM for every geocoded location. | data.gov.au, ABS | Immediate | — |

Budget for year one data access: NHSD free; PCA probably free; Ahpra Medical Board extracts 4 × $2,000 = $8,000; PIE for claimed profiles ~$10,000; allied boards in Phase 3 at $2,000 each per snapshot (15 boards ≈ $30,000 per refresh, so refresh allied annually, not quarterly). Total under $60,000 for a national spine. Everything else is engineering time.

## 3. MVP specialties: source map

The three specialties share a pattern: Ahpra is the only complete list; the college directory is opt-in and partial; hospital-group and practice websites carry the practical facts; nobody publishes fees or capacity.

### 3.1 Psychiatry (5,343 registrations, June 2026)

| Source | Kind | Fields | Access and legal basis | Use |
|---|---|---|---|---|
| Ahpra register, specialty = psychiatry | Register | Identity, status, endorsements, languages, PPP postcode | Extract (A3); single lookups during claim | Spine |
| RANZCP Find a Psychiatrist (yourhealthinmind.org) | Opt-in directory, Fellows only, self-maintained; location, expertise, languages | Public web; opt-in by the clinician is consent to be found; republication rights to be confirmed with RANZCP (Q4). Ask for a feed first. | Found: interests, practice location, telehealth |
| Hospital-group specialist directories (Healthscope, Ramsay, St John of God, Epworth) | Accredited-specialist lists | Public web; facts not copyright; respect robots | Found: private rooms, admitting hospital |
| Private psychiatric hospital lists (state licensing registers; Declared Hospitals list) | Service lists | Public | Location entity for inpatient services |
| Practice websites | Facts: address, phone, fees, "not accepting new referrals", telehealth, interests | Facts only, no prose or photos; robots and rate limits; timestamped | Found: fees, capacity, interests |
| Medical Costs Finder | Typical fees by MBS item and postcode (aggregate now; per-practitioner late 2026 / early 2027 after the 2026 transparency Bill) | Public; build the ETL now | Fee fallback, then per-doctor fees |
| Medicare Mental Health Centres (91 planned), headspace (177), PHN-commissioned services | Service lists | Public web; small lists | Related services on the `unserved` screen |
| MJA Insight+ wait-time data; secret-shopper study (30% child practices closed) | Evidence | Cite only | Copy and expectation setting |

Vocabulary (closed, v1): ADHD assessment, autism assessment, anxiety, depression, bipolar, psychosis, eating disorders, perinatal, trauma/PTSD, OCD, personality disorders, substance use, older adult, child and adolescent, neurodevelopmental, forensic, psychotherapy-led, medication-led, combined, second opinion. Populations: child, adolescent, adult, older adult, perinatal.

### 3.2 Paediatrics (4,469 registrations; general paediatrics 2,752)

| Source | Kind | Access and legal basis | Use |
|---|---|---|---|
| Ahpra register, specialty = paediatrics and child health, all 22 fields | Register | Extract (A3) | Spine; the only comprehensive source, since RACP's directory is login-only |
| Hospital-group and children's hospital outpatient directories (SCHN, RCH, QCH, PCH, WCH) | Public lists | Facts only | Found: public clinic appointments, subspecialty |
| HealthShare "find a paediatrician" pages | Commercial, self-listed | No licence for reuse; do not ingest. Use only to discover practice websites, then take facts from the practice site | Discovery only |
| Practice websites | Facts | As above | Found: fees, capacity, interests, telehealth |
| NDIS provider register CSV (open) | Org-level registration | Public CSV | NDIS-registered flag on practices doing assessments |
| Medical Costs Finder | Aggregate then per-doctor fees | Public | Fees |

Vocabulary: developmental assessment, ADHD, autism, learning difficulties, behaviour, sleep, feeding and growth, allergy, asthma and respiratory, gastroenterology, neurology and epilepsy, endocrinology and diabetes, cardiology, nephrology, adolescent medicine, neonatal follow-up, complex care, general. Populations: infant, child, adolescent.

### 3.3 Obstetrics, gynaecology and women's health (2,470 O&G plus GP obstetricians and GPs with women's-health interests)

| Source | Kind | Access and legal basis | Use |
|---|---|---|---|
| Ahpra register, specialty = O&G with subspecialty fields (gynae-oncology, MFM, REI, urogynaecology, ultrasound) | Register | Extract (A3) | Spine |
| RANZCOG "Find a Women's Health Doctor" | Opt-in; Fellows, Associates (procedural GPs) and certificants mixed | Public web; ask RANZCOG for a feed; record credential tier per entry | Found: tier, location, interests |
| Ahpra register, GP with endorsement/field in obstetrics; RANZCOG DRANZCOG holders | Register | Extract | GP obstetricians |
| Public maternity services (no national register exists: build from state hospital lists + NHSD HealthcareService types) | Service lists | Public | Birthing unit, MGP availability |
| Family Planning Alliance members (8 orgs), 1800 My Options (Vic, consented subset), Children by Choice (Qld) | Service lists | Public, consent-gated for abortion providers; publish only provider-consented listings | Sexual and reproductive health services |
| Endometriosis and pelvic pain clinics (Commonwealth-funded, 22 then 33 clinics), menopause services | Government lists | Public | Services on the `unserved` screen |
| Practice websites, Medical Costs Finder | As above | | Fees (obstetric packages are the single most opaque fee in Australian medicine), capacity by due date |

Vocabulary: endometriosis, pelvic pain, PCOS, menopause and perimenopause, fertility, contraception and IUD insertion, abortion care, pregnancy care (public, private, shared), high-risk pregnancy, VBAC, miscarriage and recurrent loss, prolapse and incontinence, fibroids and heavy bleeding, adolescent gynaecology, gynaecological cancer, perinatal mental health, lactation. Populations: adolescent, adult, perinatal, postmenopausal.

### 3.4 What the MVP cannot get from any source, and how it gets it

| Fact | Status | Method |
|---|---|---|
| Accepting new referrals / waitlist weeks | No national source for specialists | (1) Practice-site statements, timestamped. (2) Claim flow declarations, 90-day expiry. (3) A phone panel for the launch cities: two part-time callers confirming capacity for the top 500 doctors per specialty every 60 days, the method Cleanbill proved for GPs (6,977 clinics phoned annually). (4) "Did you get seen?" after handoff. |
| Fees | Aggregate only until Medical Costs Finder publishes per-practitioner fees | Practice-site fees timestamped; claim declarations; MCF typical fee by postcode as a labelled fallback; the phone panel asks the initial-consult fee. |
| Clinical interests | Opt-in directories and practice sites | Found tier from both; promoted to Declared on claim. |
| Published work | PubMed/ORCID by name + affiliation | Shown only after the doctor confirms in the claim flow. |
| Languages | Ahpra publishes spoken languages | Register tier; the one place Ahpra beats every directory. |

## 4. Phase 2: all doctors, in order

Ordered by (a) patient demand, (b) how bad existing discovery is, (c) how much the register alone gives us.

| Order | Specialty group | Registrations | Best non-register source | Why this position |
|---|---|---|---|---|
| 1 | **General practice** (37,718 + ~2,100 registrars) | NHSD is the register of record for practices; BBPIP bulk-billing flag mandatory; `new_patient_availability` field; Cleanbill survey as a licensed cross-check; Medicare UCCs (137) from the health.gov.au finder | The spine for everything else and the referral gateway. Capacity and billing, not matching, so it is a data problem solved mostly by the NHSD licence. |
| 2 | **Dermatology** (715) | ACD Find a Derm: the richest college directory, ~100 interest tags incl. teledermatology, Mohs list | Long waits, small count, best directory: cheap and high value. |
| 3 | **Surgery** (6,745 across 9) | RACS Find a Surgeon lists ~100; AOA ~1,800 orthopaedic members with opt-in contact; hospital-group directories; Medical Costs Finder is strongest here (procedure fees) | Fee gap is the patient question; MCF per-practitioner fees arrive first for procedures. |
| 4 | **Physician specialties** (14,829 across 17 RACP fields) + **rehabilitation, palliative, sexual health, addiction** | Ahpra + field is the only comprehensive source; hospital-group directories for private rooms | Volume and zero existing discovery; the register extract does most of the work. |
| 5 | **Ophthalmology** (1,130) | No RANZCO directory; Optometry Australia and NHSD for referral pathways | Register-only, small, fast. |
| 6 | **Anaesthesia and pain** (6,453 + 455) | ANZCA verify-only directory; pain clinics via NHSD service type | Patients rarely choose an anaesthetist; model the fee line, not the person. Pain clinics as services. |
| 7 | **Radiology, pathology, emergency** | LSPN register (imaging sites, DIAS accreditation, 5-day refresh); Medicare Approved Collection Centres (downloadable PDF, 10-day refresh); NATA labs; AIHW MyHospitals ED waits | Patients choose a site, not a doctor: these are Location entities with accreditation flags. |
| 8 | **Sport and exercise medicine, occupational, public health** | ACSEP directory | Small; register plus directory. |
| 9 | **Hospitals** (703 public; ~636 private incl. day hospitals) | AIHW MyHospitals; Declared Hospitals list (PHI circulars lead it by weeks); state licensing registers | Locations with specialist admitting rights from hospital-group directories. |
| 10 | **Telehealth-only services** (InstantScripts, Doctors on Demand, Hola, 13SICK) | NHSD "virtual" class; each provider's price page, timestamped | A separate `telehealth_only` class excluded from distance sort. |

Refresh cadence for the Medical Board extract: quarterly. Rural generalism becomes an Ahpra field in 2026; pick it up on the next extract.

## 5. Phase 3: allied health and the service system

### 5.1 Ahpra allied professions (extract at $2,000 each, annual refresh)

| Profession | Registrants (June 2025) | Association directory | Patient facets that matter |
|---|---|---|---|
| Psychology | 50,409 | APS (members, premium tiers), AAPi | Endorsement (clinical etc. is on the register), Better Access rebate tier, telehealth, NDIS, waitlist |
| Physiotherapy | 47,761 | APA choose.physio (members) | Care area, CDM rebate, NDIS, DVA, workers comp, home visits |
| Pharmacy | 40,913 practitioners; ~5,800 to 6,000 premises | Guild Find a Pharmacy; state pharmacy authorities for premises | Hours, vaccination, UTI/OCP prescribing (jurisdiction rules table), languages, delivery |
| Occupational therapy | 34,423 | OTA (members) | NDIS, paediatric vs adult, home visits, driver assessment |
| Dental (5 divisions) | 28,406 | ADA (members); public dental via state PDFs | Public vs private, waits (200 to 1,300 days public), CDBS, emergency |
| Optometry | 7,340 | Optometry Australia; note only ~2,181 of >5,000 were in NHSD | Scheduled-medicines endorsement on register |
| Chiropractic, osteopathy, podiatry, Chinese medicine | 6,770 / 3,646 / 6,210 / 4,898 | ACA, OA, APodA, AACMA | CDM, NDIS, DVA |
| Nurse practitioners (3,194), endorsed midwives (1,506) | NMBA | midwivesaustralia.com.au; ACNP | Private-practice midwifery, NP clinics |
| Paramedicine, medical radiation, ATSIHP | 26,603 / 20,626 / 1,028 | — | Collate at service level (ambulance, imaging site, ACCHO), not practitioner |

### 5.2 NASRHP self-regulated (association partnership, not scraping; all directories are opt-in and "not verified")

Speech pathology (SPA, ~14,000 members; the best-structured directory: funding and language filters), dietetics (DA, APD register), exercise physiology (ESSA), social work (AASW, >18,400; AMHSW for Better Access), counselling (ARCAP: PACFA >6,000 registrants, ACA), audiology (Audiology Australia; Hearing Services Program locator, 380 providers at 3,000 sites), orthotics/prosthetics (AOPA), genetic counselling (HGSA), music and arts therapy, lactation (LCANZ/IBCLC), diabetes education (ADEA). Credential verification links to each body's own check tool. Naturopathy and other unregulated modalities: excluded; no checkable credential.

### 5.3 Service system (open bulk where it exists)

| Sector | Source | Access | Tier |
|---|---|---|---|
| NDIS | Commission provider register CSV (full), SIL and platform CSVs, compliance CSVs | Open | T1 bulk, nightly |
| Aged care | GEN Aged Care Service List XLSX (annual), Star Ratings extract (quarterly), CURFs | Open, CC BY | T1 bulk |
| Mental health services | Medicare Mental Health centres (list page), headspace (177), 31 PHN directories, Infoxchange (450k listings; powers Ask Izzy and Lifeline; API by agreement) | Scrape small lists; negotiate Infoxchange | T2/T3 |
| ACCHOs | HealthInfoNet map + NACCHO affiliates (~140 orgs, 300+ sites) | Public web, hand-stewarded | T3/T4; `community_controlled` flag |
| Drug and alcohol | Path2Help (national), Your Room (NSW), Know Your Options (SA) | Public web | T3 |
| Sexual and reproductive | FPAA members, 1800 My Options, Children by Choice | Consent-gated for abortion providers | T3/T4 |
| LGBTIQ+ affirming | TransHub (/doctor with bulk-billing and new-patient filters), DocDir, QLife | Public web | T3 |
| Palliative | PCA National Directory: terms bar commercial reuse; request a data agreement | Agreement | T2 |
| Cancer | Canrefer (NSW/ACT; MDT-verified every 6 months: the gold standard for verification cadence), Cancer Connect | Public web | T3 |
| Hearing | HSP provider locator by postcode grid | Public web | T3 |
| Workers comp / CTP | SIRA approvals, icare panels, WorkSafe Vic directory; Qld has no public list | Per-scheme `approved_for` attribute | T3/T5 |
| Carer Gateway | 11 providers, one per region | Hand-stewarded | T4 |
| Imaging, pathology | LSPN register; Medicare ACC list | Public | T1/T3 |
| Hospitals | AIHW MyHospitals; Declared Hospitals list | Public | T1/T3 |
| Maternity units, MGP, ADHD assessment services, cardiac/pulmonary rehab, state community health outside Vic and NSW | **No register exists** | Build from state hospital lists, NHSD service types, and claims | Gap |

## 6. Entity resolution

Model as FHIR AU Provider Directory resources from day one: `Practitioner` → `PractitionerRole` (one per practitioner-at-organisation-at-location) → `HealthcareService` → `Location`, with `Organization` keyed by ABN. This is the shape of NHSD, PCA and ADHA's 2027 HCAPD, so ingest and export are serialisers, not migrations.

Keys, in order of trust: Ahpra number (person); NHSD id, PCA service id, HPI-O (service/org); ABN (org); G-NAF pid (address); Google `place_id` (join only, never stored content). Deterministic composite fallback: normalised family name + profession + state + postcode. Probabilistic matching (Splink) with a human queue between 0.8 and 0.95. Never auto-merge two Ahpra numbers.

## 7. Legal basis per adapter

Every adapter declares one of these before it runs:

| Basis | Applies to |
|---|---|
| Licence or agreement | NHSD, PCA, Ahpra extract and PIE, Infoxchange, PCA directory, Cleanbill, college feeds |
| Open licence (CC BY) | ABR, ASGS, MMM, GEN aged care, AIHW, MBS statistics |
| Public statutory list | NDIS register CSV, LSPN, Medicare ACC, Declared Hospitals, Medicare UCC finder |
| Facts from public pages | Practice sites, hospital-group directories, college opt-in directories pending a feed, state service lists. Facts only (Telstra v Phone Directories); no prose, no photos; robots and rate limits; no accounts |
| Provider declaration | Claim flow (APP 5 notice at collection) |
| Patient report | "Did you get seen?", "this was wrong" (non-clinical facts only) |

Adapters that would need to scrape the Ahpra register, store Google Places content, or copy practice prose do not get written.

## 8. Evaluation data

The golden query set (PRD §8.3) is research work too:

1. **Harvest** 300 public, de-identified requests per specialty from Australian forums and ADHD.ME's consented intake. Rewrite to remove identifiers; keep the shape (two conditions, a constraint, a location).
2. **Write** 50 edge cases per specialty with a clinician: emergencies, wrong specialty, under-18 in adult wording, non-English, rural, telehealth-only, referral already in hand.
3. **Recruit** two raters per specialty (one GP, one specialist). Rate 1 to 4. Measure kappa.
4. **Baseline** healthdirect Service Finder, Google, and the college directory on the same set before Wattle's first run, so "substantially better" is a number.
5. **Fold in** 100 live queries a month.

## 9. Unverified items to close before build

From the raw reports' open lists: PCA eligibility, delivery mechanism and fees; NHSD licence terms text and quota; RANZCOG, RANZCP and ACSEP live search fields; Medicare Mental Health centre count today; NACCHO's current member page; MSI clinic list; DocDir liveness; Whitecoat's status; passage date and commencement of the 2026 fee-transparency Bill; Day Hospitals Australia member count; Declared Hospitals spreadsheet fields; state community health lists outside Vic and NSW; ACA, DA, AASW, ACAud, ACNP counts; Healthpoint NZ revenue mix.

## 10. What this plan deliberately leaves out

- A symptom checker or triage layer (healthdirect's).
- Reviews (s.133; HealthEngine's $2.9m).
- Scraping the Ahpra register, Google content, or practice prose.
- Eight state scrapers.
- Unregulated modalities.
- Any adapter without a legal basis.
