# 02 — Medical disciplines in Australia: registers, directories, gaps, collation

Research for Wattle Health (patient-first provider directory). Date: 2026-10-15. Every claim links to the live page it was checked against. Items marked **[unverified]** could not be opened before the session's search budget ran out and need a second pass.

## 0. The spine every discipline hangs off

| Source | What it is | Fields | Access model | Scale |
|---|---|---|---|---|
| Ahpra Register of practitioners — https://www.ahpra.gov.au/Registration/Registers-of-Practitioners | Statutory national register; the only complete list of every doctor and their specialty | Name, profession, registration type/status, specialty + field of specialty practice, endorsements, conditions, principal place of practice (suburb/postcode only), qualifications, registration dates. **No contact details, no address, no fees** | Public one-at-a-time web search. Bulk: "copy or extract" under a Data Use Agreement, **$2,000 per board per point in time**, Excel over SFTP, ~2 weeks review + 5 business days delivery; a full copy needs a public-interest test and cannot be shared or reused for another purpose; extracts have fewer restrictions and may be shared under the agreement — https://www.ahpra.gov.au/Registration/Employer-Services/External-data-exchange-services/National-Register-Copy-or-Extract.aspx | 153,963 medical practitioners at 30 June 2026; 95,062 specialist registrations — Medical Board Registrant Data, June 2026: https://www.medicalboard.gov.au/News/Statistics |
| Healthdirect National Health Services Directory (NHSD) — https://www.healthdirect.gov.au/australian-health-services | Government-funded service/practitioner directory that healthdirect's own Service Finder runs on | Service name, type, address, phone, website, opening hours, billing (bulk/mixed/private), languages, telehealth/"online or phone only", appointment needed, practitioners attached (name, gender), online booking via partner platforms — see the Hola listing for a live example: https://www.healthdirect.gov.au/australian-health-services/healthcare-service/virtual/hola-health-gp-telehealth-consults/gp-general-practice/cc306072-f37a-4c50-b3b7-6029941e3395 | HL7 FHIR APIs (AU Provider Directory profile), FHIR bulk export, ingestion/data-acquisition hub, embeddable Service Finder widget, Provider Appointments API; "provided free of charge to integration partners" after onboarding — https://about.healthdirect.gov.au/what-we-do/portfolio/nhsd/integration-hub and https://build.fhir.nhsd.healthdirect.org.au/ingestion/dataAcquisition.html. Academic access via AURIN requires accepting NHSD terms of use (not Creative Commons) — https://researchdata.edu.au/healthdirect-nhsd-services-june-2026/4136231 | "more than 400,000 service and practitioner records" per third-party API catalogue — https://apis.io/providers/healthdirect/ |
| Provider Connect Australia (ADHA) — https://www.healthdirect.gov.au/register-with-nhsd | Practices enter details once; PCA pushes to NHSD and other partners | Same as NHSD plus practitioner roster | Free for practices; a consumer of the data goes via NHSD, not PCA | >1,900 organisations registered as of 2024 — https://www1.racgp.org.au/newsgp/gp-opinion/provider-connect-australia-why-we-should-all-get-o |

Ahpra screen-scraping precedent: in 2015 Ahpra publicly disowned "doctorinspector", a site that scraped the register, and it went offline — https://www.ahpra.gov.au/News/2015-02-17-websites-using-information.aspx. Treat the register as licence-only for bulk use.

Head counts below are Ahpra specialist registrations at 30 June 2026 (Medical Board Registrant Data, Table 2.1, PDF linked from https://www.medicalboard.gov.au/News/Statistics). A doctor can hold more than one specialty.

## 1. General practice

| Item | Detail |
|---|---|
| Count | 37,718 specialist GP registrations (June 2026 table). Plus ~2,100 registrars starting 2026 (up 14% on 1,840 in 2025) — https://www.health.gov.au/our-work/agpt-program and https://www.ausdoc.com.au/news/gp-training-revival-government-funds-306-extra-registrar-positions-to-meet-high-demand |
| RACGP | No public find-a-GP directory. RACGP's only "find" product is a members-only practice-matching trial — https://ausdoc.com.au/news/racgp-launches-practice-matchmaking-gps. The RACGP page I attempted (running-a-practice/find-a-practice) 404s. |
| ACRRM | No public directory found. Rural generalism became a recognised field of general practice in Sept 2025; ACRRM/RACGP rural fellows will add it to their Ahpra registration — https://medicalrepublic.com.au/medical-board-okays-rural-generalist-training-programs/128085. Once that lands, Ahpra becomes the only comprehensive rural generalist list. |
| healthdirect guided GP search | https://www.healthdirect.gov.au/australian-health-services/guided-search/general-practice — NHSD data, filters for open now, bulk billing, online booking. |
| PHN directories | PHNs do not run national directories; they point patients to healthdirect/NHSD (e.g. WNSW PHN https://wnswphn.org.au/find-a-service/24-7-support/, Primary Health Tasmania https://www.primaryhealthtas.com.au/news/after-hours-care, EMPHN https://emphn.org.au/for-community-members/seeking-health-care/finding-an-after-hours-service/). HealthPathways is clinician-only. |
| Medicare Urgent Care Clinics | 137 clinics, all bulk billed, walk-in — finder https://www.health.gov.au/find-a-medicare-ucc?language=en; count from Minister's 17 June 2026 press conference https://www.health.gov.au/ministers/the-hon-mark-butler-mp/media/press-conference-with-minister-butler-brisbane-17-june-2026. Finder is a map; no published CSV found. Victorian PPCCs and state GP urgent care clinics are separate lists held by PHNs/state health. |
| Bulk-billing clinics | Bulk Billing Practice Incentive Program practices **must** register as "bulk billing only" on the NHSD — https://www.health.gov.au/resources/publications/bulk-billing-practice-incentive-program-register-or-update-details-on-the-healthdirect-national-health-services-directory?language=en. This makes NHSD the authoritative bulk-billing flag from Nov 2025. Independent check: Cleanbill phones every clinic; 40.2% fully bulk-bill new non-concession adults at Jan 2026 (up from 20.7%), 6,977 clinics surveyed — https://www.medicalrepublic.com.au/?p=122506 and https://www1.racgp.org.au/newsgp/professional/bulk-billing-uptake-rises-fastest-outside-of-citie. Cleanbill's number is "clinics accepting new patients", so it doubles as the only national "accepting new patients" dataset. |
| After-hours / home visits | 13SICK National Home Doctor: bulk billed for Medicare/DVA Gold holders, weeknights from 6pm, Sat from 12pm, all Sun/public holidays — https://13sick.com.au/bulk-billing-doctors-after-hours/ |
| Booking platforms | HotDoc (third-party estimate 21,000+ doctors, unverified — https://bitscale.ai/directory/hotdoc), HealthEngine (https://healthengine.com.au/search/general-practice). Neither publishes a public developer API; both feed availability into NHSD's Provider Appointments API. |
| Patient gaps | Fees for non-bulk-billed consults (not in NHSD, only Cleanbill averages), wait to next appointment (only inside HotDoc/HealthEngine), accepting new patients (Cleanbill only), languages (NHSD, patchy), telehealth (NHSD flag), registrar vs fellow status (Ahpra registration type only). |

## 2. Psychiatry

| Item | Detail |
|---|---|
| Count | 5,343 (June 2026) |
| RANZCP Find a Psychiatrist | https://www.ranzcp.org/Mental-health-advice/find-a-psychiatrist.aspx, served at https://www.yourhealthinmind.org/find-a-psychiatrist. Opt-in, Fellows only, self-maintained via MyRANZCP; "not every psychiatrist is included"; the search form is a JS component (fields not confirmable headlessly; search results page says searchable by location, expertise, languages). Private practice focus per the Victorian branch page https://ranzcp.org/college-committees/offices-and-branches/victorian-branch/find-a-psychiatrist |
| Access | Public web only; no API, no bulk. |
| Gaps | Fees, wait times, accepting new referrals. Evidence of why it matters: national MBS-derived mean wait rose from 51 days (2011) to 77 days (2022) — https://insightplus.mja.com.au/2025/14/psychiatric-specialist-services-in-australia-alarming-increase-in-wait-times-and-regional-disparities; 29.8% of private child practices closed to new referrals in a 2019 secret-shopper study — https://digital.library.adelaide.edu.au/items/8288d620-a15b-436e-b648-b7ecd25ff73f |

## 3. Paediatrics and all RACP physician specialties

| Item | Detail |
|---|---|
| Count | Paediatrics and child health 4,469 (general paediatrics 2,752); Physician 14,829 (cardiology 1,864; general medicine 2,398; geriatrics 1,411; gastro 1,267; endocrinology 1,029; resp/sleep 1,046; medical oncology 1,069; neurology 983; haematology 873; nephrology 805; ID 715; rheumatology 529; nuclear medicine 279; immunology/allergy 214; clinical genetics 93; clinical pharmacology 72); Rehabilitation medicine 667; Palliative medicine 573; Sexual health medicine 133; Addiction medicine 210; Public health 462; Occupational 277 (June 2026) |
| RACP | **No public find-a-physician directory.** The "All Member Directory" and "Special Interest Directory" sit inside the login-only RACP Online Community — https://racpquarterly.racp.edu.au/theracponlinecommunityrocturnsone; membership page https://www.racp.edu.au/about/membership. Same applies to AFRM (rehabilitation), AChPM (palliative), AChSHM (sexual health), AChAM (addiction). |
| Commercial fill-ins | HealthShare runs per-subspecialty "find a" pages (e.g. https://www.healthshare.com.au/directory/find-a-paediatric-rehabilitation-physician/) — self-listed, commercial, no licence for reuse. Hospital group directories (Healthscope https://specialists.healthscope.com.au/, St John of God https://sjog.org.au/find-a-specialist/, Epworth) cover accredited specialists only. |
| Verdict | **Ahpra + "field of specialty practice" is the only comprehensive source for every RACP specialty, paediatric subspecialty, rehabilitation, palliative, sexual health, addiction, occupational and public health medicine.** |

## 4. Surgery

| Item | Detail |
|---|---|
| Count | 6,745 across 9 specialties: general 2,310; orthopaedic 1,644; ENT 575; plastic 545; urology 540; neurosurgery 314; vascular 269; cardiothoracic 218; OMFS 203; paediatric 112 (June 2026) |
| RACS Find a Surgeon | https://www.surgeons.org/find-a-surgeon/ — opt-in, Fellows with current CPD certificate only, practice card edited in RACS Portfolio; about page https://www.surgeons.org/Patient-information-and-resources/trust-fracs/About-Find-a-Surgeon. A cached count showed 106 listings — a tiny fraction of 6,745. |
| AOA Find an Orthopaedic Surgeon | https://aoa.org.au/for-patients — members who elected to show contact details; opt in/out via Member Profile. ~1,800 AOA members per https://www.healthcarelink.com.au/cpd/provider-profile/794/australian-orthopaedic-association |
| Other societies | ANZSVS, USANZ, ASPS, NSA, ASOHNS each run opt-in member lists **[unverified this pass]**. |
| Gaps | Fees (Medical Costs Finder only, see §18), hospital admitting rights, wait to first consult, public vs private. |

## 5. Obstetrics and gynaecology

| Item | Detail |
|---|---|
| Count | 2,470 (gynae-oncology 61, MFM 52, REI 41, urogynae 45, O&G ultrasound 55) |
| RANZCOG "Find a Women's Health Doctor" | Linked from https://www.ranzcog.edu.au/ and https://ranzcog.edu.au/womens-health/your-og-doctor/; includes Fellows **and** Associates (Procedural, i.e. GP obstetricians) and certificants, so credential tier must be read from each record. Search fields **[unverified]** (JS app). |
| Gaps | Private obstetric package fees, delivering hospital, accepting bookings by due date, telehealth. |

## 6. Anaesthesia and pain medicine

| Item | Detail |
|---|---|
| Count | Anaesthesia 6,453; Pain medicine 455 (June 2026). ANZCA says ">6000 specialist anaesthetists and 460 specialist pain medicine physicians" — https://anzca.edu.au/Fellowship |
| ANZCA Fellowship Directory | https://members.anzca.edu.au/ANZCA/ANZCA/Fellowship_Directory/Fellowship_Directory.aspx — public verification tool: name, fellowship type (FANZCA / FFPMANZCA), state. No practice address, no contact. |
| FPM | No separate find-a-pain-specialist; use the ANZCA directory filtered by FFPMANZCA — https://www.anzca.edu.au/Patient-information/About-pain-medicine |
| Gaps | Patients rarely choose an anaesthetist; the gap is **gap fees** — the Medical Costs Finder's "patient journey" shows anaesthesia as a separate line. Pain clinics (multidisciplinary) are better found via NHSD service type than via the register. |

## 7. Dermatology

| Item | Detail |
|---|---|
| Count | 715 (June 2026); ACD cites 645–660 Fellows and 110–130 trainees — https://www.healthdirect.gov.au/partners/australasian-college-of-dermatologists |
| ACD Find a Dermatologist | https://www.dermcoll.edu.au/find-a-derm/ — search by location, by name, or Mohs specialists; ~100 "area of interest" tags including **Telehealth/Teledermatology**, Rural Outreach Clinics, Home Visits, Paediatric dermatology. Mohs list is a static page of ~80 names with links to each doctor's own site or HealthShare/HealthEngine profile. |
| Gaps | Fees, wait (dermatology has some of the longest private waits — anecdotal only), bulk-billing, accepting new patients. |

## 8. Ophthalmology

| Item | Detail |
|---|---|
| Count | 1,130 (June 2026); RANZCO covers ~95% of ophthalmologists — https://limenetwork.net.au/students/pathways-into-specialisation/the-royal-australian-and-new-zealand-college-of-ophthalmologists-ranzco/ |
| RANZCO | **No patient directory.** Patient page says "seek referral through a general practitioner or optometrist" and "RANZCO staff members are unable to recommend individual ophthalmologists" — https://ranzco.edu/home/patients/what-is-an-opthalmologist/ |
| Verdict | Ahpra + specialty field is the only comprehensive list. Hospital-group directories and HealthShare fill in private rooms. |

## 9. Radiology / diagnostic imaging

| Item | Detail |
|---|---|
| Count | Radiology 3,342 (diagnostic radiology 3,103, nuclear medicine 233); Radiation oncology 521 (June 2026) |
| RANZCR | No patient-facing find-a-radiologist; only an Expert Witness Directory — https://www.ranzcr.com/advocacy-standards/expert-witness-request/. Patients choose a **practice**, not a radiologist. |
| LSPN register (Services Australia) | Every Medicare-eligible imaging/radiation-oncology site has a Location Specific Practice Number; the public register shows practice name, business details, location and DIAS accreditation status, updated within 5 working days — https://www.servicesaustralia.gov.au/diagnostic-imaging-and-radiation-oncology?context=20 and https://operational.servicesaustralia.gov.au/public/Pages/health-professionals/012-41040000-01.html. Unaccredited practices cannot bill Medicare. Accreditors: HDAA, NATA, QIP — https://nata.com.au/accreditation/dias/. A commercial nightly-refreshed map exists (Trucell LSPN Map https://trucell.com.au/lspn-map/), proving the register is machine-readable. |
| ADIA | Member list **[unverified]**. |
| Gaps | Bulk-billing by modality (most MRI is not bulk billed; GP-referred MRI only for listed indications), machine type (1.5T vs 3T, PET), wait times, whether the practice is a DIAS site for the specific modality. None of these are in LSPN or NHSD. |

## 10. Pathology

| Item | Detail |
|---|---|
| Count | Pathology 2,545 (anatomical 1,049; haematology 740; microbiology 289; immunology 136; chemical 102; forensic 71; general 66; genetic 30) (June 2026) |
| Approved Collection Centres (Medicare) | Public search by ACC/APA number, name or suburb, plus a full downloadable PDF list; updated within 10 working days — https://www2.medicareaustralia.gov.au/pdsPortal/pub/approvedCollectionCentreSearch.faces and https://www.servicesaustralia.gov.au/pathology-services-for-health-professionals. Approvals run 2 years. This is the collation anchor: **every Medicare-billable collection centre in Australia is here**. |
| NATA/RCPA accredited labs | NATA website lists all accredited medical testing labs; "over 700 laboratories" — https://nata.com.au/news/celebrating-40-years-since-the-first-nata-rcpa-pathology-accreditation/ and https://www1.health.gov.au/internet/publications/publishing.nsf/Content/qupp-benefits-and-risks-for-consumers-of-pathology-testing~qupp-where |
| Australian Pathology (private peak body) | Member locators sit on each company's site (e.g. Clinical Labs: 50 labs, 1,288 collection centres — https://clinicallabs.com.au/company-profile). |
| Gaps | Opening hours, walk-in vs appointment, fasting-collection cut-off, out-of-pocket for non-rebatable tests, which lab a centre feeds. Only the companies' own locators have hours. |

## 11. Emergency medicine

| Item | Detail |
|---|---|
| Count | 4,178 (June 2026); ACEM had 3,475 active Fellows at 30 June 2022 — https://acem.org.au/getmedia/e6839e8e-dbc9-4945-9678-f0af5b7c9b93/ACEM-2022-Annual-Report-(3) |
| Directory | None public; FACEMs work in hospital EDs. Patient-relevant unit is the **ED**, listed in NHSD and AIHW MyHospitals (ED wait times by hospital) — https://www.aihw.gov.au/reports-data/myhospitals |
| Verdict | Ahpra only for individuals; hospital lists for services. |

## 12. Sport and exercise medicine

| Item | Detail |
|---|---|
| Count | 181 (June 2026); ACSEP ~260 Fellows and registrars (2020) — https://en.wikipedia.org/wiki/Australasian_College_of_Sport_and_Exercise_Physicians |
| ACSEP | Homepage advertises "Find a sport & exercise physician" — https://acsep.org.au; the referrer page https://www.acsep.org.au/page/about/SEM/referrers/ links only to accredited training sites. Directory fields **[unverified]**. |
| Gaps | Fees (SEM consults are rarely bulk billed), no-referral access, sport-specific expertise. |

## 13. Palliative care

| Item | Detail |
|---|---|
| Count | Palliative medicine 573 (+9 paediatric) (June 2026) |
| National Palliative Care Services Directory (PCA) | https://palliativecare.org.au/directory/ — specialist, paediatric, generalist and community services; record fields: name, type, location, contact, description, after-hours availability. Self-maintained, "may not provide a complete list". Government pointer: https://www.health.gov.au/topics/palliative-care/planning-your-palliative-care/find-a-palliative-care-service-provider. State tools exist (Victoria online directory tool — https://health.vic.gov.au/patient-care/accessing-palliative-care). |
| Gaps | Service-level, not clinician-level; no capacity/wait; no cost (mostly public). |

## 14. Sexual health

| Item | Detail |
|---|---|
| Count | Sexual health medicine 133 (June 2026) |
| ASHM prescriber maps | HIV s100, PrEP, HBV, HCV prescribers; filters for location, language, bulk billing; consent-based so "not a comprehensive list"; Victoria managed separately by VHHITAL — https://ashm.org.au/HIV/HIV-prescribers/ and https://ashm.org.au/frequently-asked-questions/what-are-ashms-prescriber-maps. WA Health publishes its own s100 list — https://health.wa.gov.au/Articles/F_I/Information-for-pharmacists-HIV-s100-community-prescribers |
| ASHA | Workforce alliance, no clinic directory — https://www.unsw.edu.au/news/2014/11/csrh-joins-asha. Clinics: NHSD "sexual health clinic" service type; ASHM Sexual Health Check accredits online STI services — https://sexualhealthcheck.ashm.org.au/ |
| Gaps | Walk-in vs appointment, free vs Medicare, LGBTQ+ competence flags, anonymity options. |

## 15. Rehabilitation medicine

Count 667 (+20 paediatric). No public AFRM directory (RACP login only, §3). Last workforce factsheet 451 specialists in 2016, 37.7% private — https://hwd.health.gov.au/resources/publications/factsheet-mdcl-rehabilitation-2016.pdf. **Ahpra only**; services via NHSD/hospital lists.

## 16. Hospitals

| Item | Detail |
|---|---|
| Public hospitals | 703 in 2024–25 — https://www.aihw.gov.au/reports/australias-hospitals-at-a-glance. AIHW MyHospitals interactive platform: profiles, ED and elective surgery waits, workforce — https://www.aihw.gov.au/reports-data/myhospitals. data.gov.au public hospital CSV is stale (2016–17) — https://data.gov.au/data/dataset/australian-hospital-statistics-public-hospitals |
| Private hospitals (incl. day hospitals) | Department's List of Declared Hospitals under PHI Act s121-5(6); 636 private hospitals incl. day hospitals at Feb 2026 per a consumer guide citing the list — https://www.healthslips.com.au/explore/guides/private-hospitals/how-many-in-australia; landing page https://www.health.gov.au/topics/hospital-care/our-role/hospital-declarations. Declarations/revocations announced via PHI circulars (e.g. https://www.health.gov.au/news/phi-circulars/phi-7126-private-hospital-declaration-ramsay-private-hospital-national-capital) and the list "will soon be amended", so circulars lead the list by weeks. health.gov.au blocks the scraper used here; download manually. |
| Day hospitals | Day Hospitals Australia (peak body) publishes no public count; ABS last counted 319 private day facilities in 2012–13 — https://www.abs.gov.au/ausstats/abs@.nsf/Lookup/D6F1572F04BE16CFCA257BB8007FDE5F. State licensing registers (each state licenses private facilities) are the authoritative lists. |
| Gaps | Which specialists admit where (hospital-group directories only), private gap arrangements per insurer, real-time ED wait (some states publish live). |

## 17. Telehealth-only medical services

| Service | Model and price | Source |
|---|---|---|
| InstantScripts (Wesfarmers/Priceline) | No bulk billing; scripts from $19, med certificate $19, consult from $49 | https://idp.priceline.com.au/online-scripts |
| Doctors on Demand | $60 business hours / $90 after hours + $2.95 booking fee; private fee unless Medicare indicated | https://doctorsondemand.com.au/faqs/appointments/how-much-will-it-cost-and-how-do-i-pay |
| Hola Health | Mixed billing: bulk billed weeknights 6pm–7:30am, Sat from 12pm, all Sun/holidays; otherwise ~$39 standard; listed in NHSD as "online or phone services only" with a named practitioner | https://www.healthdirect.gov.au/australian-health-services/healthcare-service/virtual/hola-health-gp-telehealth-consults/gp-general-practice/cc306072-f37a-4c50-b3b7-6029941e3395 and https://www.treatcompare.com/au/private-gp/providers/hola-health |
| 13SICK | Bulk billed home visits + phone/video, after hours only | https://13sick.com.au/bulk-billing-doctors-after-hours/ |

NHSD's "virtual" service class is the only neutral register of these; fees must be scraped from each provider's own price page and date-stamped.

## 18. Specialist fee transparency

Medical Costs Finder — https://medicalcostsfinder.health.gov.au/how-it-works/: search by MBS item or specialty, typical fees by postcode, "indicative fees for participating specialists" for select services only; "a guide only, not a quote". Participation was voluntary and tiny ("literally only a few dozen" specialists — Butler, via https://thenightly.com.au/politics/federal-election-2025/labor-to-spend-7-million-upgrading-medical-costs-finder-website-if-re-elected-c-18056487). Only 3 of 29 insurers display gap data — https://www.health.gov.au/ministers/the-hon-mark-butler-mp/media/strengthening-medicare-more-transparency-on-patient-medical-fees. The Health Legislation Amendment (Improving Choice and Transparency for Private Health Consumers) Bill 2026 has passed and allows publication of individual practitioners' fees; the rebuilt site using Medicare claims data is due "end 2026/early 2027" — https://www.medicalrepublic.com.au/?p=129196. **This will be the first per-doctor fee dataset in Australia and the single most important upstream feed for Wattle.**

## 19. Where Ahpra + specialty field is the only comprehensive source

Physician (all 17 RACP fields), paediatrics (all 22 fields), ophthalmology, emergency medicine, rehabilitation medicine, palliative medicine, sexual health medicine, addiction, occupational, public health, radiology/radiation oncology (individuals), pathology (individuals), intensive care, medical administration, rural generalism (once the field goes live). College directories exist but are opt-in and partial for psychiatry (RANZCP), surgery (RACS ~100 of 6,745), orthopaedics (AOA), O&G (RANZCOG), dermatology (ACD — the most complete), anaesthesia/pain (ANZCA verify-only), SEM (ACSEP). General practice has no college directory at all; NHSD is the register of record for practices.

## 20. How to collate comprehensively and lawfully

1. **Buy Ahpra extracts, not copies.** Extracts ($2,000/board/point-in-time) can be shared and reused under the data agreement; copies cannot. Request the Medical Board extract with specialty + field of specialty practice + PPP postcode + registration status; refresh quarterly to match the Medical Board's data cadence. Never scrape the register (2015 precedent). Use the Practitioner Information Exchange only if Wattle becomes an approved healthcare organisation.
2. **Onboard as an NHSD integration partner** (FHIR API + bulk export, free after onboarding). This supplies the practice/service layer: address, hours, billing, languages, telehealth, booking links, and the BBPIP "bulk billing only" flag. Negotiate the display-and-attribution terms up front; the AURIN agreement shows Healthdirect licences, it does not open-license.
3. **Join Ahpra individuals to NHSD services** on name + specialty + postcode; NHSD practitioner records carry Ahpra numbers in the AU-PD profile where providers supply them.
4. **Layer the statutory service registers** that are already public and machine-readable: Medicare ACC list (pathology, PDF download), LSPN register (imaging), Declared Hospitals list (private hospitals/day hospitals), AIHW MyHospitals (public hospitals + waits), Medicare UCC finder (137 sites), PCA directory (palliative), ASHM maps (s100/PrEP). Each has a stated refresh lag (5–10 working days; circulars lead the hospitals list).
5. **Treat college directories as enrichment, not spine.** Pull RACS, AOA, RANZCP, RANZCOG, ACD, ANZCA, ACSEP listings for practice contact details and sub-interest tags; respect each site's terms (all are opt-in by the clinician, so presence itself is consent to be found, but republication rights vary — ask each college for a feed; ACD and RANZCP are the most likely to say yes).
6. **Fees:** ingest Medical Costs Finder today (typical fees by item/postcode), build the ETL now for the per-practitioner release in late 2026/early 2027, and scrape telehealth providers' own price pages with timestamps. Ask practices to self-declare consult fees through a Wattle claim-your-listing flow — the same mechanism Cleanbill proved works by phone.
7. **Accepting new patients and wait times:** no national source exists. Options: licence Cleanbill's survey (6,977 clinics, phone-verified, annual), surface next-available slot via NHSD Provider Appointments API where a practice uses HotDoc/HealthEngine, and run a Wattle phone/secret-shopper panel for the top specialties where waits matter (psychiatry, paediatrics, dermatology, ENT).
8. **Privacy and defamation hygiene:** only publish what the register or the clinician has published; store conditions/undertakings text verbatim from Ahpra with its date; never infer "bulk bills" from Cleanbill for an individual doctor — it is a practice-level fact.

## Open items for a second pass (search budget exhausted)

RANZCOG, ACSEP and RANZCP live search fields; ADIA member list; surgical society lists (USANZ, ASPS, ANZSVS, NSA, ASOHNS); Day Hospitals Australia member count; exact field list of the Declared Hospitals spreadsheet; NHSD integration partner terms document.
