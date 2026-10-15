# 01 — Cross-cutting Australian health provider registries, APIs and datasets

Research for Wattle Health (patient-first provider directory). Date: 2026-10-15. Every claim below was checked against a live page on that date; the URL follows the claim. Where a page could not be reached (403/timeout) or a figure could not be verified, it is marked **[unverified]**.

Scope: cross-cutting sources only. NDIS and My Aged Care are covered elsewhere.

---

## 0. The one-paragraph map

Australia has no single open provider dataset. Instead there are four layers that a directory must stitch together:

1. **Who is allowed to practise** — the Ahpra National Register (16 professions, continuously updated, free to look up one by one, but bulk/API access is paid and contract-gated). https://www.ahpra.gov.au/Registration/Registers-of-Practitioners/Tips-for-using-the-public-register.aspx
2. **Where services are delivered** — healthdirect's National Health Services Directory (NHSD), a FHIR R4 directory of organisations, locations, services, practitioners, roles and endpoints, free to licensed integration partners and fed increasingly by Provider Connect Australia (PCA). https://build.fhir.nhsd.healthdirect.org.au/ ; https://about.healthdirect.gov.au/what-we-do/portfolio/nhsd/integration-hub
3. **Machine identifiers** — HPI-I / HPI-O (HI Service), Medicare provider numbers, ABNs. Only ABN is public in bulk. https://www.health.gov.au/topics/health-technologies-and-digital-health/about/healthcare-identifiers?language=en ; https://data.gov.au/data/dataset/abn-bulk-extract
4. **Aggregate statistics** — NHWDS workforce tables, Medicare/MBS statistics, AIHW MyHospitals and PHN-level Medicare data, Medical Costs Finder. Useful for context and gap-finding, never for individual listings. https://hwd.health.gov.au/ ; https://www.health.gov.au/resources/collections/medicare-statistics-collection ; https://medicalcostsfinder.health.gov.au/disclaimer/

Every state and territory directory checked either embeds the NHSD outright (QLD, WA, SA) or is a thin, partial web list with no API (NSW beta, ACT). The NHSD is the gravity well; Ahpra is the truth source for registration.

---

## 1. Ahpra Register of Practitioners

| Item | Finding | Source |
|---|---|---|
| What / who | National Register of all practitioners under the National Registration and Accreditation Scheme; 15 National Boards covering 16 professions (Aboriginal and Torres Strait Islander Health Practice, Chinese Medicine, Chiropractic, Dental, Medical, Medical Radiation Practice, Nursing and Midwifery [two professions], Occupational Therapy, Optometry, Osteopathy, Paramedicine, Pharmacy, Physiotherapy, Podiatry, Psychology). Run by Ahpra. | https://www.ahpra.gov.au/Registration/Employer-Services/External-data-exchange-services/Practitioner-information-exchange |
| Fields on the public entry | Condition, Date of first registration, Division, Endorsement, Endorsement subtype, Notation, Pandemic response sub-register, Principal place of practice, Profession, Qualifications, Registration expiry date, Registration number, Registration status, Registration type, Registration subtype, Reprimand, Specialty, Specialty subtype, Spoken languages, Suspension, Undertaking. No contact details, no email, no mailing address, no history. | https://www.ahpra.gov.au/Registration/Registers-of-Practitioners/Terms-in-the-Register.aspx ; https://ahpra.gov.au/About-Ahpra/What-We-Do/Data-access-and-research/What-data-are-available.aspx |
| Update cadence | "Updated continuously"; registration appears "without any delay after being granted." Ahpra calls it "the only reliable source of information about practitioners' registration status." | https://www.ahpra.gov.au/Registration/Registers-of-Practitioners/Tips-for-using-the-public-register.aspx |
| Public web | Free one-at-a-time search by name/number/profession/state. Limited online search; some practitioners are suppressed for personal safety. | same |
| API — Practitioner Information Exchange (PIE) | SOAP/XML web service for "approved healthcare organisations" that already hold the registration numbers they want to check. Services: Find, Alert (browser only, 24-hourly email), Identity (reg number + DOB cross-check, approval-only). Fees: API install $4,000 once + $1,000/yr support + $1 per unique practitioner query per year; browser install $800 + $200/yr. Application via DocuSign, review up to two weeks, then a "standard commercial contract." Eligibility is employers, those serving employers, health-industry service providers, or bodies with a compliance obligation. | https://www.ahpra.gov.au/Registration/Employer-Services/External-data-exchange-services/Practitioner-information-exchange |
| Bulk — National Register extract or copy | Excel via SFTP. **$2,000 per Board per point in time.** "Extract" (a subset, can be limited by jurisdiction, may be shared with other organisations under the data agreement) vs "copy" (full register for a profession; only "if it is in the public interest", cannot be shared or reused). Data released only after payment. Contact/sensitive fields excluded. | https://www.ahpra.gov.au/Registration/Employer-Services/External-data-exchange-services/National-Register-Copy-or-Extract.aspx |
| Terms / scraping | Site terms: limited personal-use licence; users may not "download (except for page caching and the documents provided) any portion"; they cover "the use of data-gathering or data extraction tools" and bar "the downloading and copying of National Register information for any commercial or data storage purpose." Reproduction of names and addresses for commercial use is barred. | https://ahpra.gov.au/Support/Terms.aspx |
| Enforcement precedent | 2015: Ahpra publicly stated it "has not given permission" for doctorinspector, which "appear[ed] to have used technology known as screen scraping"; the Medical Board later announced the site was "off the air." | https://www.ahpra.gov.au/News/2015-02-17-websites-using-information.aspx ; https://www.medicalboard.gov.au/News/2015-04-17-media-statement.aspx |
| Open stats | Quarterly registration statistics tables, annual reports, profession demographic snapshots; no unit-record data. Research/discretionary requests go through a Data access and research policy with CEO sign-off. | https://www.ahpra.gov.au/About-Ahpra/What-We-Do/Data-access-and-research |

**Ingestion verdict:** Do not scrape. Two lawful paths: (a) PIE API for on-demand verification of practitioners you already list (cheap at $1/practitioner/year, but requires the registration number up front, so it validates rather than discovers); (b) National Register extracts at $2,000 per Board per snapshot (16 professions ≈ $30k+ per refresh) under a data agreement whose sharing terms are negotiated. The Register's "principal place of practice" is suburb/postcode-level only, so it cannot be a location source on its own. Third-party scrapers exist (e.g. an Apify "AHPRA Practitioner Scraper") but they contravene the terms above. https://apify.com/ahpra_scraper/ahpra-practitioner-scraper

---

## 2. healthdirect National Health Services Directory (NHSD)

**What it is.** "A comprehensive and consolidated national directory of health services and related health service providers in both the public and private sectors across all Australian jurisdictions," run by Healthdirect Australia, service types classified with SNOMED CT-AU. https://data.aurin.org.au/dataset/healthdirect_nhsd_services_directory_2023

**Data model (FHIR R4 Implementation Guide v4.0.1, 2026-09-14):** profiles for HealthcareService, Organization, Location, Practitioner, PractitionerRole, Endpoint, plus Bulk Exports. Production base `https://api.fhir.nhsd.healthdirect.org.au/v4`; API key + OAuth client-credentials bearer token; `HealthcareService.specialty` search not supported; no prev/next paging links (use `page=` parameter); "not all of the FHIR specification search behaviours have been implemented." https://build.fhir.nhsd.healthdirect.org.au/ ; https://build.fhir.nhsd.healthdirect.org.au/guidance.html

**Field richness (from the June 2026 AURIN snapshot):** service_type + service_snomed_code, professions + profession_snomed_codes, practitioner_genders, last_updated, languages, new_patient_availability, level_of_care, timezone, gnaf_id, service_offerings/codes, day-level availability. https://researchdata.edu.au/healthdirect-nhsd-services-june-2026/4136231

**Three access products:**

| Product | What | Terms |
|---|---|---|
| FHIR API (read) | Real-time search, individual queries, read-only | NHSD Data and API Licence Agreement Schedule + Cybersecurity Checklist, emailed to nhsd@healthdirect.org.au; test access disabled after six months' inactivity |
| FHIR Bulk Export | NDJSON full export (default every 3 months) + daily deltas for all six entities; filterable by state/status; URLs valid 8 hours; "available via a licence agreement with Healthdirect Australia" with an approved purpose | https://build.fhir.nhsd.healthdirect.org.au/bulkexports.html |
| Ingestion / Data Acquisition Hub (write) | POST FHIR Bundles (≤30 resources, gzip+base64) to `/acquisitionhub/publish`; "authorised integration partners" only; booking providers need a Data Sharing Agreement and onboarding pack | https://build.fhir.nhsd.healthdirect.org.au/ingestion/dataAcquisition.html ; https://about.healthdirect.gov.au/what-we-do/portfolio/nhsd/integration-hub/getting-started |

**Cost.** "Provided free of charge to integration partners." https://about.healthdirect.gov.au/what-we-do/portfolio/nhsd/integration-hub

**Scale.** API calls excluding Service Finder: 6.33M in Apr–Jun 2026 (5.50M prior quarter); Service Finder sessions 2.66M/quarter; healthdirect website 9.77M visits/quarter. Healthdirect Australia Quarterly Report April–June 2026, p.3: https://ukqbli.files.cmp.optimizely.com/download/assets/Healthdirect-Australia-Quarterly-Report-April-June-2026.pdf . A third-party API catalogue says "more than 400,000 service and practitioner records" **[unverified — not found on a healthdirect page]**. https://apis.io/providers/healthdirect/

**Contributor model.** Providers register directly via a form ("The information you provide will be validated prior to inclusion in the NHSD") or via Provider Connect Australia, where ticking "Publish to National Health Services Directory" auto-syncs the Service Finder. https://www.healthdirect.gov.au/register-with-nhsd . Public "Suggest an edit" button; listed services advised to review at least every 12 months. https://about.healthdirect.gov.au/manage-your-listing . Since November 2025 the Commonwealth's Bulk Billing Practice Incentive Program requires participating practices to list bulk-billing services in the NHSD, feeding the real-time bulk-billing map. https://about.healthdirect.gov.au/resources/news/national-health-service-directory-connecting-the-community-to-care

**Snapshots for research.** AURIN/data.gov.au publish 2023, 2025 and June 2026 point snapshots; "available for access to academic users once they have agreed to the NHSD terms of use; other AURIN users can apply." Licence listed as "Other"/"NHSD", © Healthdirect Australia. https://data.gov.au/data/dataset/8114fd8c-95ae-4d2a-bb64-e5e474a6ea71 ; https://researchdata.edu.au/healthdirect-nhsd-services-june-2026/4136231

**Terms of use (consumer site).** IP owned by or licensed to Healthdirect; users "must not reproduce, frame or reformat"; "must not use the Online Services or any Information to sell a product or service"; widgets are a "non-exclusive, non-transferable, non-sub-licensable, revocable licence." No clause names scraping. https://www.healthdirect.gov.au/terms-of-use

**Ingestion verdict:** Sign the NHSD Data and API Licence (free) and take the Bulk Export with daily deltas. This is the only national, location-level, SNOMED-coded, FHIR-shaped source and it is free. The licence's approved-purpose clause is the real constraint — get "consumer-facing directory" written in. Read the Cybersecurity Checklist before architecting storage.

---

## 3. Healthcare Identifiers Service, HPD, PRODA, NASH, My Health Record (provider side)

| Component | What it is | Access for a directory |
|---|---|---|
| HPI-I | Identifier for an individual provider; issued automatically on Ahpra registration; other credentialled professions may apply | Not public. Searchable only by HI-Service-registered organisations via HPOS or conformant software. https://www.health.gov.au/topics/health-technologies-and-digital-health/about/healthcare-identifiers?language=en ; https://implementer.digitalhealth.gov.au/resources/services/healthcare-identifiers-service-hi |
| HPI-O | Identifier for a provider organisation; organisations must register | Same |
| IHI | Patient identifier | Out of scope for a provider directory |
| Healthcare Provider Directory (HPD) | Opt-in listing inside the HI Service; an Ahpra-registered practitioner's Ahpra updates flow into the HPD entry; search by HPI-I/Ahpra number or demographics (state, country, name) | "It can only be accessed by other organisations and providers listed in the HPD" — via HPOS (PRODA login) or certified software. Not a public or bulk source. https://www.servicesaustralia.gov.au/use-healthcare-identifiers-service?context=20 ; https://www.essa.org.au/Web/Web/Resources/Tools-and-templates/getting-your-healthcare-provider-identifier.aspx |
| PRODA | Services Australia identity service; needed for HPOS, HI Service, NPP, PCA | Individuals/organisations only; no data product |
| NASH | PKI certificate authenticating an organisation to My Health Record/HI Service through conformant software; requested in HPOS, downloaded within 30 days | Only relevant if Wattle becomes a conformant clinical system |
| My Health Record (provider side) | Access via conformant software or read-only National Provider Portal; only individual providers linked to an HPI-O can access | Not a provider-discovery source |

**Verdict:** The HI Service is an identity backbone, not a directory feed. The route to HPI-I/HPI-O for listings is PCA (below), which passes HPI-O and, where lawful, HPI-I. Medicare provider numbers are tied to Ahpra registration and locations ("more than one Medicare provider number if you deliver health services in different locations"), issued by Services Australia, and have no public lookup. https://www.servicesaustralia.gov.au/use-your-provider-and-prescriber-numbers

---

## 4. Provider Connect Australia (PCA) — the write-once hub

Run by the Australian Digital Health Agency. Healthcare provider organisations maintain one master record and authorise disclosure to "business partners"; partners get automatic updates. Business partners as at 13 Aug 2026 include Healthdirect Australia (NHSD), Health Hunter, Precedence Health Care, RxTro, 29 PHNs, eHealth NSW, NT Health, Telstra Health, Consultmed, Foxo, HealthPoint and others. https://www.digitalhealth.gov.au/healthcare-providers/initiatives-and-programs/provider-connect-australia

Data a partner receives: legal/business name + ABN; HPI-O; address with Australia Post and G-NAF identifiers; service name, type, location, contact details, opening hours incl. public-holiday exceptions; practitioner legal/preferred name, Ahpra profession and registration number, HPI-I (where authorised under the Healthcare Identifiers Act 2010), Medicare provider number (where available), role; plus PCA-issued unique identifiers for services, locations and practitioner roles. Partners sign a participation agreement and publish an Information Use Statement that providers accept when authorising disclosure. No fee is stated. https://www.digitalhealth.gov.au/sites/default/files/documents/pca-business-partner-fact-sheet.pdf

ADHA's own guidance: use the NHSD when "you do not have a direct business relationship with those healthcare services" and "need the widest available coverage"; become a PCA partner when services "directly register their details with you." Large players "may wish to use both." https://www.digitalhealth.gov.au/sites/default/files/documents/pca-business-partner-fact-sheet.pdf

**Verdict:** The highest-value move for a new directory: NHSD for breadth, PCA partnership so practices push verified, identifier-rich updates (ABN, HPI-O, Ahpra numbers, G-NAF) directly to Wattle. Four commercial directory/booking firms already sit in that list; Wattle would be the fifth. Contact pca@digitalhealth.gov.au.

---

## 5. Medicare, MBS and cost data

| Source | Public? | Access | Notes |
|---|---|---|---|
| Medicare provider numbers | No public lookup | HPOS/PRODA for the holder only | https://www.servicesaustralia.gov.au/use-your-provider-and-prescriber-numbers |
| MBS Online downloads | Yes | XML releases roughly quarterly (Jan/Mar/Jul/Nov pattern), TXT item map/descriptors, "© Commonwealth of Australia", "not legal documents" | http://www.mbsonline.gov.au/internet/mbsonline/publishing.nsf/Content/downloads |
| Medicare Benefits Schedule Statistics (data.gov.au) | Yes | Excel quarterly/annual summaries; licence "Other (Open)"; update frequency quarterly; unit-record data for research under separate conditions | https://data.gov.au/data/dataset/526e3bdf-57b2-4b3d-931c-843baaeb9381 |
| Medicare Statistics (Services Australia) | Yes | Interactive MBS item reports, downloadable to spreadsheet, by age/sex; excludes public-hospital and some DVA services | https://www.servicesaustralia.gov.au/medicare-statistics ; https://medicarestatistics.humanservices.gov.au/VEA0032/SAS.Web/statistics/mth_qtr_std_report.html |
| Bulk-billing rates by PHN | Yes (PDF dashboards) | Year-to-date dashboards; e.g. 2025–26 GP non-referred attendances: Western Sydney 94.8%, Northern Sydney 73.1%, Perth North 67.8%, Brisbane North 70.3% | https://www.health.gov.au/sites/default/files/2026-08/medicare-statistics-year-to-date-dashboard-july-to-june-2025-26.pdf |
| Medical Costs Finder | Yes (aggregates) | Median out-of-pocket costs by postcode/PHN/state from Hospital Casemix Protocol (insurers) and Medicare claims; suppressed where too few providers; specialists may publish indicative fees via the MCF Portal and "are responsible for data they publish" | https://medicalcostsfinder.health.gov.au/disclaimer/ |
| AIHW Medicare-subsidised GP/allied/specialist care by local area | Yes | Downloadable by PHN, SA3, state, financial years from 2013; latest 26 Mar 2026 | https://catalogue.data.infrastructure.gov.au/dataset/rdh-medicare-subsidised-gp-allied-health-and-specialist-health-care-across-local-areas |

**Verdict:** Nothing here identifies an individual provider's billing. The NHSD bulk-billing flag (now mandatory for BBPIP practices) is the only provider-level billing signal. MBS XML is the right vocabulary source for service/fee descriptors. Medical Costs Finder's specialist-published fees are the one place a specialist's own fee claim is government-hosted, but there is no API and uptake numbers could not be verified **[unverified]**.

---

## 6. Workforce and hospital statistics (AIHW, NHWDS, data.gov.au)

- **NHWDS** (Department of Health, Disability and Ageing): Ahpra registration data + voluntary workforce survey at renewal (94.1% response in 2024), 16 professions, released annually by profession cycle (nurses/midwives Apr–May, medical Aug–Sep, allied Oct–Nov), geocoded with Australia Post and G-NAF, served through the public Health Workforce Data Tool (SuperWEB2 tables; registered users can save tables). © Commonwealth; no unit records. https://hwd.health.gov.au/resources/information/nhwds.html ; https://hwd.health.gov.au/datatool/
- **AIHW MyHospitals**: hospital and Local Hospital Network downloads (admitted patient care, ED, elective surgery waits, workforce) by financial year, latest 2024–25, last updated 23/09/2026; Creative Commons footer. https://www.aihw.gov.au/reports-data/myhospitals/content/about-the-data
- **PHN Healthmap**: healthdirect's free, no-login map blending NHSD services with ABS/AIHW layers. https://about.healthdirect.gov.au/healthdirect-health-map

**Verdict:** Use NHWDS for "how many psychologists per 100k in this SA3" style supply context and for spotting NHSD coverage gaps by profession and region. MyHospitals is the authoritative public-hospital entity list and performance layer.

---

## 7. ABN Lookup / ABR

- **ABN Bulk Extract** (data.gov.au, Australian Business Register): XML in two ZIP parts; ABN, status and date, entity type, legal/business/trading names, state and postcode of main business location, ACN/ARBN, GST status, DGR status. **Licence CC BY 3.0 AU.** Updated 14/10/2026. https://data.gov.au/data/dataset/abn-bulk-extract
- **ABN Lookup web services**: SOAP, free, registration key (GUID), hourly refresh from the ABR; also CC BY 3.0 AU on data.gov.au. https://data.gov.au/data/dataset/abn-lookup-web-services/resource/65d52653-203f-45d7-80c7-62aa905aaee2 ; https://abr.business.gov.au/Tools/AbnLookup
- Government agencies with an ABR Partnership Agreement get ABR Explorer bulk access (not available to Wattle). https://abr.gov.au/government-agencies/accessing-abr-data/abr-data-products-and-services

**Verdict:** The only fully open entity registry. Use it to canonicalise organisations (NHSD and PCA both carry ABN), detect deregistered practices, and resolve trading-name vs legal-name confusion. Postcode-only location, so not a geocoding source.

---

## 8. State and territory directories

| Jurisdiction | What exists | Own data? | Source |
|---|---|---|---|
| NSW | "NSW Health Service Directory" — **beta**, 7 of 15 LHDs (Far West, Hunter New England, Murrumbidgee, Nepean Blue Mountains, Southern NSW, Western NSW, Western Sydney), 306 providers, keyword/distance/category filters, no API or download. Separately, eHealth NSW runs internal "NSW Health Providers and Services Directories (NHPSD)" and eHealth NSW is a PCA business partner. | Partial | https://www.nsw.gov.au/nsw-health/service-directory ; https://www.ehealth.nsw.gov.au/solutions/clinical-care/information-exchanges/nhpsd |
| VIC | Better Health Channel lists services/support and an A–Z, with no stated data source on the landing page; a third-party library guide says the public face of the NHSD is linked to Better Health Channel **[unverified]**. No Victorian open dataset or API found. | Unclear | https://www.betterhealth.vic.gov.au/servicesandsupport ; https://www.gh.org.au/for-health-professionals/national-health-services-directory/ |
| QLD | "Find a health service": "this search is provided by Healthdirect Australia and is not restricted to Queensland Health services." Open data has HHS boundaries (CC BY 4.0) but no facility dataset. | No (NHSD) | https://www.health.qld.gov.au/system-governance/contact-us/find-service ; https://www.data.qld.gov.au/dataset/hospital-and-health-service-boundaries-json |
| WA | "Find your nearest health service using the National Health Services Directory (NHSD)"; queries go to nhsd@healthdirect.org.au. | No (NHSD) | https://www.wa.gov.au/service/health-care/public-health-services/find-health-service |
| SA | sa.gov.au hosts a "National Health Services Directory" page with a Find a Service section; SA Health pages point to the NHSD for public, private and community services. | No (NHSD) | https://www.sa.gov.au/directories/national-health-services-directory |
| TAS | Primary Health Tasmania "Find a service" covers only PHN-commissioned services; a professionals-only Tasmanian Health Directory; Service Tasmania defers to the Department of Health. Dept page returned 403 on fetch. | Partial | https://services.primaryhealthtas.com.au/help ; https://www.service.tas.gov.au/services/health/hospitals-and-ambulance-services/find-a-hospital-or-health-service |
| ACT | Canberra Health Services "Services and Clinics": 23 categories, keyword search, filters by region/facility, no data source stated, no downloads. | Own web list | https://www.canberrahealthservices.act.gov.au/services-and-clinics |
| NT | nt.gov.au hospitals and health centres page (403 on fetch) **[unverified]**; NT Health is a PCA business partner, so its services flow into PCA/NHSD. | Via PCA | https://www.digitalhealth.gov.au/healthcare-providers/initiatives-and-programs/provider-connect-australia |

**Verdict:** No state exposes a bulk or API feed. Three states openly embed the NHSD; NSW and ACT run thin web lists. Ingest state content through the NHSD rather than eight bespoke scrapers.

---

## 9. Google Places / Maps data terms

- "You must not pre-fetch, cache, or store Places API content beyond the allowed exceptions"; the place ID "is exempt from the caching restrictions" and may be stored indefinitely. https://developers.google.com/maps/documentation/places/web-service/policies
- Service Specific Terms (31 Mar 2025 archive): Places lat/lng may be cached for at most 30 consecutive calendar days; place_id cacheable per the Places policies. https://cloud.google.com/archive/maps-platform/terms/maps-service-terms-20250331
- Without a Google map, the Google logo (16–19dp) or "Google Maps" text is mandatory; reviews/photos need their attributions. https://developers.google.com/maps/documentation/places/web-service/policies

**Verdict:** Google Places can decorate a listing at request time (hours, photos, reviews) and supply a place_id join key, but cannot be the stored record of truth. Store place_id + your own NHSD/PCA/G-NAF data; fetch the rest live.

---

## 10. Booking and practice-management platforms

| Platform | Public API? | Provider directory exposed? | Source |
|---|---|---|---|
| HotDoc | No public developer portal; consumes PMS APIs; partner OAuth/OIDC only; acquired by Potentia Feb 2026 per third-party listing **[unverified]** | No | https://providers.apievangelist.com/providers/hotdoc/ |
| HealthEngine | No public API; partner-only integrations (Bp, MedicalDirector) | No | https://providers.apievangelist.com/providers/healthengine/ ; https://www.medicaldirector.com/press/medicaldirector-and-healthengine-launch-official-integration |
| Cliniko | Yes, per-clinic user API keys (Basic auth), 200 req/min, no cross-clinic directory endpoint | No | https://docs.api.cliniko.com/ |
| Halaxy | Yes, developers.halaxy.com, FHIR-style resources (Patient, Practitioner, Appointment, Slot, HealthcareService), API key → token, webhooks; per-practice scope | No | https://developers.halaxy.com/ |
| Best Practice (Bp Premier) | Bp Partner Network: vetted application via Partners@Bpsoftware.net, developer portal with schemas/APIs after approval; transition to Halo Connect | No | https://kb.bpsoftware.net/bppremier/saffron/Management/PartnerNetwork.htm |
| MedicalDirector / Helix (Telstra Health) | Gated via Telstra Health Smart API+ (FHIR gateway) under partner agreement; no self-serve portal | No | https://apis.io/providers/medical-director/ ; https://www.medicaldirector.com/products/helix |
| Coviu | REST at api.coviu.com, OAuth2, sessions/participants/webhooks; video layer only | No | https://providers.apievangelist.com/providers/coviu/ ; https://careright.knowledgeowl.com/help/telehealth-with-coviu |

**Verdict:** None exposes a cross-practice directory; all are per-practice and consent-based. The useful integration is the reverse: once a practice is on Wattle, a per-practice Cliniko/Halaxy key or a Bp/Helix partner slot gives live availability. Note the NHSD itself has a "booking provider" ingestion path with a Data Sharing Agreement, which is how HotDoc/HealthEngine-class availability reaches Service Finder. https://about.healthdirect.gov.au/what-we-do/portfolio/nhsd/integration-hub/getting-started

---

## 11. Services Australia "Find a Health Service"

Services Australia does not run a provider finder; its consumer-facing pages route to healthdirect's Service Finder, as do WA, QLD and SA government pages (see §8). The HI Service's HPD is provider-to-provider only (§3). No separate dataset exists to ingest.

---

## 12. healthdirect — product, weaknesses, funding and governance

**What it does.** Website (9.77M visits/quarter), Symptom Checker (700k landing, 421k started, 65% completed triage per quarter), Service Finder (2.66M sessions/quarter), helpline/1800MEDICARE (364k calls/quarter, 89.2% answered <20s, CSAT 90% vs 95% target), Video Call (502k consults/quarter, 8M since 2019 across 13,000 virtual clinics), Virtual GP (26k referrals/quarter), Pregnancy Birth and Baby, My Aged Care contact centre (627k calls/quarter). Healthdirect Australia Quarterly Report Apr–Jun 2026, pp.3, 15: https://ukqbli.files.cmp.optimizely.com/download/assets/Healthdirect-Australia-Quarterly-Report-April-June-2026.pdf . The app bundles symptom checker, service directory, medicines info and My Health Record access. https://apple.co/3t1a1jv

**Governance and funding.** Established 2006; "a public company limited by shares"; shareholders are delegated representatives of the Health Ministers of the Commonwealth, ACT, NSW, NT, QLD, SA, TAS, VIC and WA; a Shareholder Committee appoints directors, approves the Strategic Plan and reviews performance; jurisdictions are "shareholders and as customers." https://about.healthdirect.gov.au/who-we-are/shareholders . Annual and quarterly reports are published, and the quarterly KPIs are "the primary service measures specified in the funding contract." https://about.healthdirect.gov.au/resources/reports-and-plans/corporate-reports . A Commonwealth "Healthdirect Umbrella Funding Agreement" of $6,000,000 runs to 30 June 2026 per grants.gov.au; total revenue could not be extracted (FY25 annual report PDF exceeded fetch limits) **[unverified]**. https://grants.gov.au/Ga/Show/172d5d62-4b58-4fd9-96c8-64ce74fb581e ; https://media.healthdirect.org.au/publications/Healthdirect-Australia-Annual-Report-FY25.pdf

**What it does badly (evidence found).**
1. *Stale listings are the provider's problem, not the product's.* NSW Health: "service providers are responsible for keeping their details accurate and up to date on Service Finder." Healthdirect's own guidance asks listed services to review "at least every 12 months." The ADA warns out-of-date hours and contacts "may delay or misdirect referrals." https://www.health.nsw.gov.au/pharmaceutical/Pages/faq-healthdirect-service-finder.aspx ; https://about.healthdirect.gov.au/manage-your-listing ; https://ada.org.au/keep-your-service-information-up-to-date-in-the-national-health-services-directory-nhsd
2. *Search fragility.* A PHN how-to notes a service "may not appear by name, it is worth doubling checking for misspelling." https://murrayphn.org.au/wp-content/uploads/2024/06/NHSD-How-to.pdf
3. *Listing-first, not patient-first.* The data model carries no patient ratings, wait times, fee transparency beyond a bulk-billing flag, or verified new-patient capacity beyond a self-declared field. https://researchdata.edu.au/healthdirect-nhsd-services-june-2026/4136231
4. *No independent evaluation of the Service Finder, website or app.* Healthdirect's evaluations page lists seven external reviews (2015–2025); all concern nurse triage, helplines, COVID programs or Pregnancy Birth and Baby. None covers the directory. https://about.healthdirect.gov.au/evaluations
5. *App reception.* A third-party tracker shows the iOS app at 79 reviews, 3.5 stars, last updated Sep 2021 **[unverified; dated snapshot]**. Live App Store/Google Play pages returned 404 on fetch. https://apps.appfollow.io/ios/healthdirect/1021494621?country=au
6. *Consumer research signal.* The Apr–Jun 2026 quarterly report's own consumer insight is titled "Australians want a smarter front door to health" (p.8) — healthdirect's framing of a gap it has not closed.
7. *Audit/parliament.* No ANAO performance audit or Senate estimates finding specific to healthdirect in 2024–26 was located; the only estimates reference found is a 2016 answer on Pregnancy, Birth and Baby funding ($13.5M over three years). https://www.aph.gov.au/~/media/Committees/clac_ctte/estimates/add_1516/Health/Answers/SQ16-000298.pdf ; https://www.anao.gov.au/work-program/portfolio/health-disability-and-ageing

---

## 13. Ingestion architecture for Wattle (synthesis)

| Layer | Source | Mode | Cadence | Cost | Blocker |
|---|---|---|---|---|---|
| Services, locations, hours, SNOMED types, bulk-billing flag, G-NAF | NHSD Bulk Export | NDJSON full + daily delta | Daily | Free | Licence approved-purpose + cybersecurity checklist |
| Provider-pushed updates with ABN/HPI-O/Ahpra no./Medicare no. | PCA business partnership | Push | Real-time | Not stated | Participation agreement + Information Use Statement |
| Registration status, conditions, endorsements | Ahpra PIE API | Pull by reg no. | Daily alerts (browser) / on demand (API) | $4k + $1k/yr + $1/practitioner/yr | Must hold reg numbers; approval |
| Profession-wide snapshots | Ahpra Register extract | Excel/SFTP | Per purchase | $2k per Board per snapshot | Data agreement; sharing terms |
| Organisation canonicalisation | ABN Bulk Extract + web service | XML / SOAP | Hourly (web) | Free, CC BY 3.0 AU | None |
| Supply context, gap analysis | NHWDS data tool, AIHW, MBS statistics | Tables | Annual/quarterly | Free | Aggregate only |
| Enrichment at display time | Google Places | Live API | Request-time | Metered | 30-day lat/lng cache; store only place_id |
| Live availability | Cliniko/Halaxy per-practice keys; Bp/Helix partner slots; NHSD booking-provider path | Pull/push | Real-time | Partner-dependent | Practice consent |

Three things to avoid: scraping Ahpra (terms + precedent), storing Google Places content (terms), and building eight state scrapers (they mostly wrap the NHSD anyway).
