# 04 — Service-system directories in Australia (sector by sector)

**For:** Wattle Health (patient-first provider directory) · **Researched:** 2026-10-15 · **Status:** raw research, every claim carries a URL that was fetched or returned by search on the day. Claims marked **[unverified]** could not be loaded live (403/404/timeout or search budget exhausted) and must be re-checked before build.

## 0. Executive read

1. **There is no single open register of Australian health *services*.** The closest thing, the healthdirect National Health Services Directory (NHSD), is licensed, not open: FHIR R4 API by licence agreement, token auth, monthly quotas ([NHSD Developer Guide](https://media.healthdirect.org.au/publications/NHSD_Developer-Guide.pdf); [about NHSD](https://about.healthdirect.gov.au/what-we-do/portfolio/nhsd)). The data.gov.au/AURIN "NHSD Services Directory 2025" snapshot is academic-only, "Licence Not Specified", derived from the NHSD API as at June 2025 ([data.gov.au](https://data.gov.au/data/dataset/8114fd8c-95ae-4d2a-bb64-e5e474a6ea71)).
2. **Two sectors are genuinely bulk-downloadable:** NDIS (full provider register CSV + SIL/platform CSVs, [NDIS Commission](https://www.ndiscommission.gov.au/provider-registration/find-registered-provider)) and aged care (annual Aged Care Service List XLSX per state, quarterly Star Ratings extract, GEN CURFs; [GEN](https://www.gen-agedcaredata.gov.au/resources/access-data/2024/september/aged-care-service-list-30-june-2024)).
3. **Mental health services run on two different backbones:** the Commonwealth's Medicare Mental Health site (GovCMS, centre list + "search tool" that itself points to healthdirect for GPs) and Infoxchange's 450,000-listing directory that powers Lifeline's finder and Ask Izzy ([Infoxchange](https://www.infoxchange.org/products-and-services/service-directory); [Lifeline](https://www.lifeline.org.au/get-help/services/find-another-service)). Infoxchange has an API and widget aimed at NFPs; terms not published.
4. **Geography is open and solid:** ABS ASGS Edition 3 boundaries (CC BY 4.0, GeoPackage/Shapefile, Edition 4 rolling out from 2026) and Department of Health GP Catchment/MMM 2023 tables (CC BY 2.5 AU, XLSX) ([ABS](https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/access-and-downloads/digital-boundary-files); [data.gov.au MMM](https://data.gov.au/data/dataset/37d5bb75-8b21-4c6c-9107-10cef7f6249a)).
5. **Everything else is a long tail of small, hand-maintained lists** (headspace 177 centres, Carer Gateway 11 providers, Vic community health 84 orgs, QLife 42 orgs, Canrefer MDT-verified specialists) that are scrape-and-steward jobs, not integrations.

Ingestion tiers used below: **T1** open bulk file · **T2** licensed API/feed · **T3** public web search, scrapeable · **T4** curated list, hand-stewarded · **T5** closed / login / no list.

---

## 1. Cross-cutting backbone: NHSD and Infoxchange

| Register | Owner | Fields exposed | Access model | Cadence | Scale | Tier |
|---|---|---|---|---|---|---|
| National Health Services Directory (NHSD) | Healthdirect Australia | FHIR R4: Organization, HealthcareService, Location, Practitioner, PractitionerRole, Endpoint ([outbound model PDF](https://media.healthdirect.org.au/publications/NHSD_FHIR-R4-data-model_outbound.pdf)) | Licence agreement; Authorisation API issues tokens; "default basic monthly quota" per credential ([Developer Guide v1.1, 25/06/2025](https://media.healthdirect.org.au/publications/NHSD_Developer-Guide.pdf)); developer hub geo-blocked from outside AU on fetch ([hub](https://about.healthdirect.gov.au/nhsd/developer-and-integration-hub)) | Live | Not published on the pages fetched | T2 |
| NHSD snapshot on AURIN / data.gov.au | Healthdirect via AURIN | Point dataset of service/location/organisation profiles | Academic users after accepting NHSD terms; others apply; "Licence Not Specified"; remote last updated 05/12/2025 ([data.gov.au](https://data.gov.au/data/dataset/8114fd8c-95ae-4d2a-bb64-e5e474a6ea71)) | Annual snapshot (2023, 2025 editions exist: [2023](https://data.aurin.org.au/dataset/6ed775fd-78e6-4fa5-809a-39a1ede9c40a)) | — | T2 (research only) |
| Infoxchange Service Directory (powers Ask Izzy, Lifeline finder, Foodbank, Child & Family eHub) | Infoxchange | Service name, category, location, contact, eligibility (per Ask Izzy) | API + Service Seeker widget; "custom-made for government and community use", free listings for community services; pricing not published ([Infoxchange](https://www.infoxchange.org/products-and-services/service-directory)) | Dedicated updater team; no schedule published | "over 450,000" listings (older page said 430,000) | T2 |

**Why it matters:** DVA, Lifeline and Medicare Mental Health all defer to one of these two. DVA's own guidance is "use healthdirect Find a health service" and call ahead to confirm Veteran Card acceptance ([DVA](https://www.dva.gov.au/what-we-help-with/health-support/finding-a-health-provider)). Lifeline's finder "search[es] more than 120,000 services" and a NSW parliamentary answer confirms it "is based on the Infoxchange Ask Izzy database" ([Lifeline](https://www.lifeline.org.au/get-help/services/find-another-service); [NSW Parliament AQON](https://www.parliament.nsw.gov.au/lcdocs/other/19358/AQON%20-%20Lifeline%20-%20received%2014%20March%202024.pdf)).

**Ingestion approach:** negotiate an NHSD licence (FHIR, pull by HealthcareService type + Location geo) as the clinical spine; negotiate Infoxchange API for welfare/community/mental-health long tail; de-duplicate on ABN + geocoded address + phone.

---

## 2. Mental health

| Register | What it is | Fields | Access | Cadence / scale | Tier |
|---|---|---|---|---|---|
| Medicare Mental Health Centres (ex Head to Health) | Commonwealth walk-in centres, delivered with states and PHNs | Centre name, address, hours; map search; "View list of all centres" page; Victoria shows Head to Health Clinics separately ([centres page](https://www.medicarementalhealth.gov.au/medicare-mental-health-centres)) | Public web, GovCMS/Drupal 11; no API found. Site's own "search tool" for other services is a node search ([node/14687](https://www.medicarementalhealth.gov.au/node/14687)) and it refers GP search to healthdirect | 31 open at Dec 2024 ([minister](https://www.health.gov.au/ministers/the-hon-emma-mcbride-mp/media/more-than-30-medicare-mental-health-centres-now-open-to-provide-free-mental-health-care)); target 61 by June 2026, later fact sheet cites 91 by mid-2029 [unverified count today] | T3 |
| Medicare Mental Health "service" listings (e.g. Path2Help, TIS) | Directory entries with /service/ and /provider/ URLs | Name, description, contact ([example](https://www.medicarementalhealth.gov.au/service/path2help-alcohol-and-drug-resources-and-support-16506)) | Public web; URL pattern /service/<slug>-<id> is enumerable | — | T3 |
| headspace centres | National youth MH network | Name, street address, "More details" link; PDF map only, no export ([headspace](https://headspace.org.au/headspace-centres/)) | Public web | 177 listed (NSW 54, VIC 43, QLD 33, WA 22, SA 14, TAS 5, ACT 2, NT 4; counted on fetch) | T3 |
| PHN-commissioned services | 31 PHNs each run their own commissioned-service directory (e.g. [CESPHN](https://servicedirectory.cesphn.org.au/service_category/dental-services-aboriginal-and-torres-strait-islander), [NWMPHN headspace](https://nwmphn.org.au/commissioned_act/headspace/)) | Varies per PHN | 31 separate scrapes; no national feed found [PHN contact list page 403 on fetch] | — | T3/T4 |
| Lifeline Service Finder | Infoxchange-backed | As Infoxchange; plus 44 curated national services with cost and "helps with" tags | Public web | 120,000+ | via Infoxchange |
| Beyond Blue | Helpline 1300 22 4636; no separate directory found | — | — | — | — |
| Mental Health Online, Better Access, community MH, private psychiatric hospitals | Not verified live this session (search budget exhausted; PHA page DNS fail). Better Access is a Medicare item set, not a register; practitioner search belongs in the clinician report | — | — | — | [unverified] |
| Eating disorders | Butterfly "Referral Database of health professionals screened for their knowledge of eating disorders" ([infoqore listing](https://infoqore.com.au/directory/health-and-wellbeing/butterfly-foundation)); InsideOut treatment services pages ([InsideOut](https://insideoutinstitute.org.au/treatment-services/online-recovery-support-group)); Butterfly URL 404 on fetch | — | Helpline-mediated | — | T4 [unverified] |
| Perinatal | PANDA helpline (pregnancy to 12 months) ([Lifeline listing](https://lla-drupal-app-prod.lifeline.org.au/get-help/national-services/panda)); COPE e-COPE directory 403 on fetch | — | — | — | T4 [unverified] |
| ADHD assessment | No national register found; only clinic pages surfaced | — | — | — | gap |

**Ingestion:** scrape MMH centre list (177-row headspace list is trivial); enumerate /service/ IDs on medicarementalhealth.gov.au; treat PHN directories as 31 adapters with a shared schema; request Infoxchange API for the rest.

---

## 3. NDIS

| Register | Fields | Access | Cadence / scale | Tier |
|---|---|---|---|---|
| NDIS Provider Register (Commission) | Business name, legal name, ABN, registration status (Approved/Revoked); **"Download all provider register data (CSV)"** ([Commission](https://www.ndiscommission.gov.au/provider-registration/find-registered-provider)) | Public web + CSV; page notes outage during portal transition | "updated on the date displayed below the search results"; a 2022 FOI thread shows 30 results/page web only, so the CSV is new ([Right to Know](https://www.righttoknow.org.au/request/ndis_registered_service_provider)) | T1 |
| Part 3: unregistered SIL + digital platform applicants | CSV columns documented on page: ABN, submission date, application progress (Ongoing/Approved/Refused), change date, registration group (0115/0138), group status, removed date ([sil_providers.csv](https://cdn.ndiscommission.gov.au/nqsc_website/sil_providers.csv), [platform_providers.csv](https://cdn.ndiscommission.gov.au/nqsc_website/platform_providers.csv)) | Public CSV | Transitional regime for applications before 1 Oct 2026 | T1 |
| Part 2 / Compliance actions | Banning orders, enforcement; dated CSVs on data.gov.au ([06.02.2026](https://data.gov.au/data/dataset/5391ae26-2bdc-48d3-a33b-a9bb2398804c), [09.03.2026](https://data.gov.au/data/dataset/f9d3a3cf-a6a5-4480-bd76-a36c6d0ce247)); "Licence Not Specified" | Public CSV; contact providerregister@ndiscommission.gov.au | Roughly fortnightly snapshots | T1 (licence unclear) |
| NDIA Provider Finder | Lives under ndis.gov.au "Finding providers": Provider finder + Continence provider list ([NDIS](https://www.ndis.gov.au/participants/working-providers/finding-providers)); finder page itself not fetched | Participant portal (myplace) historically; public access [unverified] | page current 3 May 2026 | T5/T3 |
| Mable | "23K+ independent support workers"; "Find support workers by location" pages ([Mable](https://mable.com.au/)) | Public landing pages; search login status [unverified] | — | T3/T5 |
| Hireup, Clickability | Pages returned no content on fetch; Clickability had ~1,000 listings years ago ([SmartCompany](https://www.smartcompany.com.au/startupsmart/victorian-startup-clickability-expands-interstate-with-tripadvisor-inspired-platform-for-disability-services/)) | — | — | [unverified] |
| Plan-managed / unregistered providers | No register exists by design; only the SIL/platform transitional CSVs above | — | — | gap |

**Ingestion:** nightly pull of the full-register CSV + both Part 3 CSVs + latest compliance CSV; join on ABN to ABR for trading names and addresses (register lacks address/service-location fields on the search page); flag revoked/banned.

---

## 4. Aged care

| Register | Fields | Access | Cadence / scale | Tier |
|---|---|---|---|---|
| Aged Care Service List (GEN) | Service name, provider, address, program type (residential, HCP, transition, MPS, STRC, NATSIFACP), ACPR, places, and (since 19/12/2024) service-level funding; XLSX + PDF per state and national ([30 June 2024 list](https://www.gen-agedcaredata.gov.au/resources/access-data/2024/september/aged-care-service-list-30-june-2024)) | Open download; data.gov.au record says CC BY 4.0, annual ([data.gov.au](https://www.data.gov.au/data/dataset/aged-care-service-list)) | Annual at 30 June; 2024 is the latest edition surfaced | T1 |
| Star Ratings quarterly data extract | Overall + component ratings for every government-funded aged care home; Excel ~2 MB ([Aug 2026](https://www.health.gov.au/resources/publications/star-ratings-quarterly-data-extract-august-2026), [May 2026](https://www.gen-agedcaredata.gov.au/resources/access-data/2026/may/star-ratings-quarterly-data-extract-may-2026)) | Open download | Quarterly (Feb/May/Aug/Nov) | T1 |
| GEN "Providers, services and places" CURF | Program type, organisation type, size, operational places; zipped CSV at 30 June ([GEN](https://gen-agedcaredata.gov.au/Resources/Access-data/2024/April/GEN-data-Providers,-services-and-places-in-aged-care)) | Open | Annual, lags ~10 months | T1 |
| GEN dashboard supplementary tables | ACPR/PHN region dashboards, CHSP services, First Nations ([Aug 2026 tables](https://www.gen-agedcaredata.gov.au/resources/access-data/2026/august/gen-data-dashboard-supplementary-data-tables)) | Open XLSX | Annual (August) | T1 |
| My Aged Care Find a provider | Next.js app; filters incl. Star Rating, specialised care, Support at Home service types; profiles show services, costs, availability; shortlist up to 16, compare 3 ([My Aged Care](https://www.myagedcare.gov.au/find-a-provider)) | Public web; no API published | Live | T3 |
| Home Care Package providers | Covered in the Service List (HCP program rows) and Find a provider; note Support at Home replaced HCP from 1 Nov 2025 per the My Aged Care filters | — | — | T1 |

**Ingestion:** Service List XLSX (annual) as the base, Star Ratings extract (quarterly) joined on service ID, My Aged Care profile scrape for cost/availability deltas between annual drops.

---

## 5. Disability and carers: Carer Gateway

Carer Gateway is a regional-monopoly model: one provider per state, four in NSW, mapped to 16 DSS service areas aligned to PHN regions ([DSS map PDF](https://dss.gov.au/system/files/resources/carer-gateway-service-areas.pdf)). Verified list on 2026-10-15 ([Carer Gateway](https://www.carergateway.gov.au/about-us/local-service-provider)): ACT Carers ACT; NSW1 Benevolent Society; NSW2 Wellways; NSW3 Live Better; NSW4 Carers NSW; NT Carers NT; QLD Wellways; SA Carers SA; TAS Care2Serve; VIC Holstep Health (formerly Merri Health); WA Carers WA. **Tier T4** — 11 rows, hand-stewarded, map by PHN boundary.

---

## 6. Aboriginal and Torres Strait Islander health

| Register | Fields | Access | Scale | Tier |
|---|---|---|---|---|
| NACCHO members | NACCHO's own members page 404 on fetch; PC submission says "over 140 Member Organisations… over 300 fixed, outreach and mobile sites" ([PC sub227](https://assets.pc.gov.au/__data/assets/pdf_file/0007/204964/sub227-human-services-identifying-reform.pdf)) | Public web [current page unverified] | ~140+ orgs | T4 |
| HealthInfoNet map of Aboriginal health/medical services | Services that are members of state/territory peak bodies or NACCHO; search by state; no download ([HealthInfoNet](https://healthinfonet.ecu.edu.au/key-resources/health-professionals/health-workers/map-of-aboriginal-and-islander-healthmedical-services/?pagenum=1)) | Public web | — | T3 |
| State affiliates (AH&MRC, VACCHO, QAIHC, AHCWA, AHCSA, AMSANT, TAC, Winnunga) | Each publishes a member list; Cracks in the Ice compiles from these plus NACCHO and warns "accuracy of the location cannot be guaranteed" ([Cracks in the Ice](https://cracksintheice.org.au/aboriginal-and-torres-strait-islander-peoples/support-services)) | Public web | — | T4 [affiliate pages unverified] |
| Our Mob and Cancer "Health services for our mob" | Map + full list by state ([ourmobandcancer](https://www.ourmobandcancer.gov.au/treating-cancer/health-services)) | Public web | — | T3 |
| AIDA | Professional body, not a service directory | — | — | n/a |
| NATSIFACP aged care | Included in GEN Service List and My Aged Care ([My Aged Care](https://www.myagedcare.gov.au/find-a-provider)) | Open | — | T1 |

**Ingestion:** HealthInfoNet map as seed; reconcile against each affiliate's member page; mark `community_controlled = true` as a first-class attribute.

---

## 7. Drug and alcohol

| Register | Owner | Access / notes | Tier |
|---|---|---|---|
| Path2Help | Alcohol and Drug Foundation | Question-led matcher (up to 11 questions); "more than 7,000 services" (ADF-linked page says 10,000+); no API; data source not stated ([MMH listing](https://headtohealth.gov.au/service/path2help-alcohol-and-drug-resources-and-support-16506); [ADF](https://adf.org.au/path2help/)) | T3 |
| Your Room (NSW Health) | NSW | "directory of free or low cost AOD services in NSW" ([NADA listing](https://infoqore.com.au/directory/health-and-wellbeing/network-of-alcohol-and-other-drugs-agencies-inc)); find-a-service page 404 on fetch | T3 [unverified] |
| NADA (NSW/ACT peak) | ~80 member orgs, 100+ locations; refers, no directory ([NADA overview](https://nada.org.au/wp-content/uploads/2025/04/NADA-overview.pdf)) | T4 |
| DASSA / Know Your Options (SA) | DASSA points to Know Your Options directory ([SA Health](https://www.sahealth.sa.gov.au/dassa)); ADIS SA 1300 13 1340 | T3 |
| Turning Point / DirectLine / Counselling Online (Vic) | Turning Point lists DirectLine (1800 888 236) and Counselling Online as 24/7 services; no directory on its site ([Turning Point](https://www.turningpoint.org.au/)) | T4 |
| State ADIS lines | NSW 1800 250 015; SA 1300 13 1340; each state runs one; lines, not registers | T4 |

**Interstate variation:** every state has an ADIS phone line but only NSW (Your Room), SA (Know Your Options) and the national ADF tool expose a searchable directory. Path2Help is the only national one.

---

## 8. Sexual and reproductive health

| Register | Scope | Access | Tier |
|---|---|---|---|
| 1800 My Options (Women's Health Victoria) | Contraception, abortion, STI testing, counselling; "database of more than 600" providers but "website shows only a subset" ([WHV](https://whv.org.au/our-focus/1800-my-options); [healthdirect partner page](https://www.healthdirect.gov.au/partners/1800-my-options)); public geomap at pubgeomapping.1800myoptions.org.au ([site](https://www.1800myoptions.org.au/)) | Partial public, rest phone-only | T3 (subset) |
| Children by Choice "Find a Health Service" (QLD) | Abortion clinics, contraception, GPs, ultrasound, telehealth; providers self-register free ([Children by Choice](https://www.childrenbychoice.org.au/)) | Public web | T3 |
| MSI Australia clinics | /clinics/ 404; homepage 403 on fetch | — | [unverified] |
| Family Planning Alliance Australia members | SHQ (WA), Sexual Health Victoria, True (QLD), SHFPACT, SHINE SA, Family Planning NSW, FPWNT, Family Planning Tasmania (2022 list) ([FPAA submission](https://www.fpnsw.org.au/sites/default/files/assets/Submission_FPAA_Senate-Inquiry-2022_Universal-SRH-Access.pdf); [FPAA](https://familyplanningallianceaustralia.org.au/)) | 8 orgs, each with own clinic list | T4 |

**Interstate variation:** Victoria and Queensland have funded pro-choice directories; other states rely on FPAA members and MSI. Abortion access data is the most politically sensitive dataset in this report; publish only provider-consented listings.

---

## 9. LGBTIQ+ affirming

| Register | Scope | Access | Tier |
|---|---|---|---|
| DocDir | National map-based directory of LGBTIQ+ affirmative providers, community-sourced since 2019 ([LInc](https://lincgrants.org.au/linc-recipient-spotlight-docdir/); [TGV](https://www.tgv.org.au/spark-projects/docdir)); site unreachable on fetch (ECONNREFUSED) | [status unverified] | T3? |
| TransHub (ACON, NSW) | "Find a health professional" at /doctor with filters: specialty (GP, endocrinologist, paediatrician, sexual health), treatments (hormone initiation, implants, telehealth), bulk billing, accepting new patients, radius 5–100 km ([TransHub](https://www.transhub.org.au/clinicians)) | Public web; count not shown | T3 |
| QLife directory | 42 orgs (11 national + by state), name + description only, no address/phone ([QLife](https://qlife.org.au/resources/directory)) | Public web | T4 |
| NSW Health Gender Affirming Doctor List (ACON) | Referenced by NSW Health ([SHIL](https://www.shil.nsw.gov.au/health-professionals/gender-affirming-care)) | — | T4 |

---

## 10. Multicultural and interpreters

- **TIS National**: 131 450, 100+ languages, 24/7, free for most non-English speakers; Medicare Mental Health Centres use it ([MMH listing](https://www.medicarementalhealth.gov.au/provider/embrace-15752); [MMH centres](https://www.medicarementalhealth.gov.au/medicare-mental-health-centres)). A capability flag, not a directory.
- **Embrace Multicultural Mental Health** (Mental Health Australia): Knowledge Hub database + "Mental Health Services" nav; no verified provider directory ([Embrace](https://embracementalhealth.org.au/)). T4.
- **Transcultural Mental Health Centre (NSW)**: bilingual clinicians, referral-only via NSW Health MH teams ([SBS](https://www.sbs.com.au/language/english/en/article/mental-health-services-in-australia-in-your-language/e5lw3d56x)). T5.
- **Language-matched clinicians**: no register; NHSD HealthcareService carries language attributes in FHIR (communication) [field-level unverified].

---

## 11. Rural and remote, geography

| Dataset | Fields | Licence / access | Cadence | Tier |
|---|---|---|---|---|
| ABS ASGS Edition 3 digital boundaries | Mesh Block → SA1-4, GCCSA, Remoteness Areas, Indigenous structure, LGA, POA, SAL; GeoPackage + Shapefile, GDA2020/GDA94 ([ABS](https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/access-and-downloads/digital-boundary-files)) | CC BY 4.0 | Edition 4 from 2026 | T1 |
| GP Catchment 2023 + MMM 2023 + ERP | XLSX concordance of GPC, MMM 1–7, population; custom aggregation of SA1/SA2/SA3/UCL ([data.gov.au](https://data.gov.au/data/dataset/37d5bb75-8b21-4c6c-9107-10cef7f6249a)) | CC BY 2.5 AU | After each Census; DPA/MMM applied to health programs 13 Apr 2025, aged care 1 Oct 2025 ([Health Workforce Locator](https://www.health.gov.au/resources/apps-and-tools/health-workforce-locator)) | T1 |
| Standalone MMM 2023 | "MMM 2023.zip" ([data.gov.au](https://www.data.gov.au/data/dataset/modified-monash-model-mmm-2023)) | CC BY | Updated 10 Mar 2025 | T1 |
| Health Workforce Locator | Per-address MMM, DPA, DWS, incentives ([app](https://www.health.gov.au/resources/apps-and-tools/health-workforce-locator/app)); DPA definition ([DPA](https://www.health.gov.au/topics/rural-health-workforce/classifications/dpa)) | Public app; no API; DPA polygons not surfaced as download | Annual DPA update | T3 |
| Rural Workforce Agencies | One per state + NT; coordinated via rwanetwork.com.au; NSW = Rural Doctors Network ([Health](https://www.health.gov.au/contacts/rural-workforce-agencies-network); [RDN](https://www.ruraldoctors.org/site/rdn)) | Workforce bodies, not service directories | — | T4 |
| RFDS | Fly-in GP/nurse/dental clinics in "hundreds of communities"; "Our Bases" page; SE section publishes a service map PDF ([RFDS](https://www.flyingdoctor.org.au/what-we-do/); [RFDSSE map](https://flyingdoctor.org.au/download-document/se/rfdsse-service-map)); clinic schedules appear on LHD facility pages (e.g. Menindee Mon/Tue/Fri) ([NSW](https://nsw.gov.au/departments-and-agencies/fwlhd/facilities/menindee-health-service)) | Public web, per-section | — | T4 |

**Ingestion:** load ASGS + MMM once per edition; compute MMM/RA for every geocoded service; this is the cheapest high-value enrichment in the whole report.

---

## 12. Community health centres (state lists)

- **Victoria**: Department of Health Community Health Directory, by LGA, Metro/Regional; fields LGA, organisation, address(es), phone; ~84 unique organisations on fetch; no download ([Vic DoH](https://www.health.vic.gov.au/community-health/community-health-directory)). Better Health Channel says 79 services: 24 registered independent centres + 55 health-service-run ([BHC](https://betterhealth.vic.gov.au/health/serviceprofiles/community-health-centres-service)). T3.
- **NSW**: no statewide list; each LHD publishes its own (e.g. [ISLHD](https://www.islhd.health.nsw.gov.au/services-clinics/community-health-services); NSW service directory nodes per facility, e.g. [Wilcannia MPS](https://www.nsw.gov.au/departments-and-agencies/fwlhd/service-directory/wilcannia-multi-purpose-service)). T3, 15 LHD adapters.
- **QLD, WA, SA, TAS, ACT, NT**: not verified this session [unverified].

**Interstate variation:** Victoria is the only state with an integrated, independent community-health sector and a single directory; NSW folds community health into LHDs; nsw.gov.au has a structured "service-directory" URL pattern worth crawling.

---

## 13. Cancer

| Register | Scope | Verification / cadence | Tier |
|---|---|---|---|
| Canrefer (Cancer Institute NSW) | NSW + ACT specialists who are active MDT members (≥75% meeting attendance, chair-confirmed), MDTs, hospitals, chemo/radiotherapy/haematology units, youth cancer (15–24), genetic services; excludes radiologists/pathologists/nuclear medicine ([about](https://www.canrefer.org.au/pages/about-us)); team pages e.g. [Western NSW Thoracic MDT](https://www.canrefer.org.au/teams/western-nsw-thoracic-cancer-mdt) | MDT membership validated every 6 months, practice locations every 12; "last updated" in each profile footer | T3 (gold-standard verification model) |
| Cancer Council Cancer Connect | National service finder built under the Australian Cancer Nursing and Navigation Program ([Cancer Connect](https://connect.cancer.org.au/search-cancer-support/services/); [CNSA](https://www.cnsa.org.au/resource/cancer-connect-now-available-nationally.html)) | — | T3 |
| Cancer Council ACT directory | PDF, updated March 2026 ([CCACT](https://www.actcancer.org/assets/Information/Living-with-Cancer/CCACT_Directory_2022_Updated-March-2026.pdf)) | Periodic PDF | T4 |
| Optimal care pathways | Clinical pathways, not a register; page 403 on fetch | — | n/a |

---

## 14. Chronic disease and rehab, maternity, child and family health

- **Cardiac / pulmonary rehab directories** (Heart Foundation, Lung Foundation): not reached [unverified].
- **Maternity**: no official hospital-level birthing-unit register surfaced. AIHW *Australia's mothers and babies* draws on the National Perinatal Data Collection and Maternity Models of Care data set but the about page gives no hospital count ([AIHW](https://www.aihw.gov.au/reports/mothers-babies/australias-mothers-babies/contents/about)). A 2014 study counted 278 maternity units via health department and hospital lists ([ACU](https://acuresearchbank.acu.edu.au/item/8v1z5/identifying-maternity-services-in-public-hospitals-in-rural-and-remote-australia)); commercial lists exist ([pregnancy.com.au](https://www.pregnancy.com.au/birth/list-of-maternity-hospitals/)). MGP directories: none found. **Gap: build from state hospital lists + NHSD HealthcareService type.**
- **Child and family health nurses / MCH**: Victoria MCH is council-run (page 403 on fetch) [unverified]; NSW CFHN sits inside LHD community health. T3 per state.

---

## 15. Palliative care

National Palliative Care Service Directory (Palliative Care Australia): specialist, paediatric, general (GP/allied) and community support providers; fields are name, service type, location, contact, description, after-hours availability; moving to self-service updates and may deactivate unverifiable records; **terms forbid commercial or public reuse of extracts** ([PCA](https://palliativecare.org.au/?p=25679)); health.gov.au points to it ([Health](https://www.health.gov.au/topics/palliative-care/planning-your-palliative-care/find-a-palliative-care-service-provider)). T3 with licence risk: request a data-sharing agreement rather than scrape.

---

## 16. Immunisation, pharmacy, oral health

- **Vaccination providers**: health.gov.au "Where can I get immunised" (page 404 on direct fetch; search snippet confirms a "Finding a provider near you" section and that not all providers give free NIP vaccines) ([Health](https://www.health.gov.au/topics/immunisation/about-immunisation/where-can-i-get-immunised)); Services Australia lists which provider types can register on AIR ([Services Australia](https://www.servicesaustralia.gov.au/organisations/health-professionals/services/medicare/australian-immunisation-register-health-professionals/register/register-vaccination-provider)); booking platforms (HealthEngine) hold the practical pharmacy flu list ([HealthEngine](https://healthengine.com.au/flu-vaccine/book-online)). No open provider register. T3/T5.
- **Pharmacy scope (UTI etc.)**: Medical Republic reports pharmacist UTI prescribing now exists in every state and territory after the NT scheme ([Medical Republic](https://www.medicalrepublic.com.au/?p=112002)); WA from Aug 2023 ([Australian Pharmacist](https://www.australianpharmacist.com.au/?p=23129)); Vic pilot Oct 2023 ([AJP](https://ajp.com.au/news/another-state-likely-to-launch-uti-trial/)). PSA page gives no state table ([PSA](https://www.psa.org.au/pharmacist-prescribing/)). **No register of which pharmacies participate** — scope is a jurisdiction-level attribute to attach to every pharmacy row, with a per-state rules table.
- **Public oral health**: NSW has no single clinic list on the oral health landing page (1800 679 336 booking line) ([NSW Health](https://www.health.nsw.gov.au/oralhealth/Pages/default.aspx)); CPSA publishes LHD clinic locations and waitlists as PDF ([CPSA](https://cpsa.org.au/publication/public-dental-clinic-locations-treatment-and-assessment-waitlists/)); DHSV find-a-clinic 403 on fetch [unverified]. T4.

---

## 17. Hearing, vision, veterans, workers comp

| Sector | Register | Access | Tier |
|---|---|---|---|
| Hearing | Hearing Services Program provider locator: search by town/postcode/name, shows up to 20 nearest, flags visiting sites; "more than 380 providers across over 3,000 locations"; no download ([Health](https://www.health.gov.au/our-work/hearing-services-program/accessing/find-provider); [portal](https://hearingservices.gov.au/wps/portal/hso/site/locateprovider/)) | Public web, geo-paginated (scrape by postcode grid) | T3 |
| Vision | Vision Australia: service categories and Vision Stores, 1300 847 466; locations page 404 on fetch ([Vision Australia](https://www.visionaustralia.org/services)) | T4 [unverified] |
| Veterans | DVA has no provider list; defers to healthdirect; providers may add "accepts DVA" to profile; no gap fee if accepted ([DVA](https://www.dva.gov.au/what-we-help-with/health-support/finding-a-health-provider)) | Attribute on NHSD rows | T2 via NHSD |
| NSW workers comp | SIRA approves allied health (physio, chiro, osteo, psych, AEP, counsellors/social workers); icare runs panels for case managers and attendant care with searchable directories ([icare](https://www.icare.nsw.gov.au/practitioners-and-providers/healthcare-and-service-providers/working-with-us); [icare PDF](https://www.icare.nsw.gov.au/-/media/icare/unique-media/practitioners-and-providers/healthcare-and-service-providers/planning-with-an-injured-person/my-plan-2022/mpi018_selecting-service-providers_wc_workers.pdf)); SIRA site 403 on fetch | T3/T5 |
| Victoria | WorkSafe Service Providers Directory (occupational rehab approvals) ([list](https://www1.worksafe.vic.gov.au/vwa/serviceproviderdirec.nsf/List)); personal/household support search is payment-registration only, "not endorsed", incomplete, by registered business address ([WorkSafe](https://www.worksafe.vic.gov.au/injury-support-provider-search)) | T3 |
| Queensland | WorkCover: providers must be approved and registered (board-registered + listed non-board professions); Provider Connect portal; no public directory found ([WorkSafe QLD](https://www.worksafe.qld.gov.au/service-providers/allied-health-and-return-to-work-providers)) | T5 |

**Interstate variation:** NSW splits regulator (SIRA approval) from insurer (icare panels); Victoria publishes an approval directory for occ-rehab only; Queensland has approval without a public list. Model as per-scheme `approved_for` attributes rather than separate directories.

---

## 18. Interstate variation summary

| Dimension | Strongest | Weakest | Implication |
|---|---|---|---|
| Community health directory | VIC (single DoH list) | NSW (15 LHD pages), others unverified | Per-state adapters |
| AOD directory | NSW Your Room, SA Know Your Options, national Path2Help | VIC/QLD/WA/TAS phone lines only | Path2Help + state overlays |
| Abortion/contraception | VIC 1800 My Options, QLD Children by Choice | All others via FPAA members | Consent-gated publishing |
| Mental health walk-in | National MMH Centres + VIC Head to Health Clinics retained as a separate brand | — | Two labels, one schema |
| Workers comp | NSW (SIRA approval + icare panels), VIC (occ-rehab list) | QLD (no public list) | Attribute, not directory |
| Carer support | Uniform national (one provider per region) | — | 11-row table |
| Aged care, NDIS | Uniform national open data | — | Only true T1 sectors |

---

## 19. Ingestion plan (priority order)

1. **T1 bulk loads (week 1):** NDIS register CSV + Part 3 CSVs + compliance CSV; GEN Service List XLSX + Star Ratings XLSX; ABS ASGS + MMM/GPC. Join keys: ABN (NDIS), service ID (aged care), geocode → SA1 → MMM.
2. **T2 licences (start now, 1–3 months lead):** NHSD FHIR licence (clinical spine, DVA/bulk-billing/language attributes); Infoxchange API (welfare + MH long tail, source of Lifeline/Ask Izzy); Palliative Care Australia data agreement (terms bar reuse).
3. **T3 scrapers (week 2–4):** MMH centre list + /service/ enumeration; headspace (177); hearing locator by postcode grid; TransHub /doctor; Canrefer teams/specialists; Vic community health; 1800 My Options geomap subset; Children by Choice; HealthInfoNet ACCHO map; nsw.gov.au service-directory nodes.
4. **T4 stewarded tables:** Carer Gateway (11), FPAA (8), RWAs (7), QLife (42), NACCHO affiliates, state ADIS lines, pharmacy scope rules by state.
5. **Gaps to build ourselves:** maternity/birthing units, MGP, ADHD assessment, cardiac/pulmonary rehab, participating-pharmacy scope, QLD/WA/SA/TAS community health.

## 20. Unverified items to re-check before build

Medicare Mental Health centre count and search-tool internals; NDIS Provider Finder public access; NACCHO current member page; MSI clinic list; DocDir liveness; Vision Australia locations; DHSV clinic finder; SIRA provider search; COPE e-COPE; Butterfly referral database; PHN contact list; Heart/Lung Foundation rehab directories; AIHW hospital-level maternity data; state community health lists outside VIC/NSW; Hireup/Clickability scale.
