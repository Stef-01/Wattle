# 05 — Legal, regulatory, competitive and data-strategy context for an Australian provider map

Research date: 2026-10-15. Prepared for Wattle Health (Wattle Technologies). Every claim carries the URL it was checked against. Items marked **[unverified]** could not be confirmed on a live page in this pass and need a follow-up.

---

## 0. Headline findings

| # | Finding | Why it matters | Source |
|---|---|---|---|
| 1 | **Provider Connect Australia (PCA)** is ADHA's "single source" where provider organisations publish their business details once and push them to "business partners" (directories, PHNs, secure messaging vendors, payment services). Healthdirect, Health Hunter, Precedence and RxTro are already listed as directory partners. Partners sign a PCA Participation Agreement and, under clause 11, receive Ahpra register data (Ahpra number, Ahpra profession, name) as FHIR Practitioner elements. | This is the legal, provider-consented feed for exactly the data a directory needs, and it is open to private directories. Becoming a business partner is the single highest-leverage data move. | https://www.digitalhealth.gov.au/healthcare-providers/initiatives-and-programs/provider-connect-australia ; https://digitalhealth.gov.au/healthcare-providers/initiatives-and-programs/provider-connect-australia/provider-connect-australia-register/register-as-a-business-partner/ahpra-register-data |
| 2 | **HealthEngine paid $2.9m (Federal Court, Aug 2020)** for suppressing ~17,000 reviews, editing ~3,000, misrepresenting why some practices had no rating, and passing non-clinical details of 135,000+ patients to insurance brokers for $1.8m+. | The cautionary template for any Australian health directory: reviews and data-sharing are the two things the ACCC will prosecute under the ACL, not just the Privacy Act. | https://www.accc.gov.au/media-release/healthengine-to-pay-29-million-for-misleading-reviews-and-patient-referrals ; https://ia.acs.org.au/article/2020/healthengine-whacked-with--2-9-million-fine.html |
| 3 | **Ahpra's testimonial ban (National Law s.133(1)(c)) still stands**; the 2022 amendment that would have removed it was withdrawn during debate. Ahpra's guidelines say the *operator* of a booking/review site that advertises a regulated health service is responsible for the reviews function; a service directory that does not advertise is not. | Wattle must decide which side of the line it sits on. Reviews about clinical aspects are the hazard; non-clinical reviews are allowed. | https://www.ahpra.gov.au/Resources/Advertising-hub/Advertising-guidelines-and-other-guidance/Advertising-guidelines.aspx ; https://www.mondaq.com/australia/healthcare/1284664/the-health-practitioner-regulation-national-law-and-other-legislation-amendment-act-changes-to-the-national-law |
| 4 | **Ahpra's website terms forbid commercial download/copying of the register and use of data-extraction tools; copyright is asserted; Ahpra publicly shut down a scraper (doctorinspector) in 2015.** Bulk extracts are available only under a paid data agreement, and full copies only where "in the public interest". | Do not scrape the register. Get Ahpra data via PCA, a paid Ahpra extract, or provider claim. | https://ahpra.gov.au/Support/Terms.aspx ; https://www.ahpra.gov.au/News/2015-02-17-websites-using-information.aspx ; https://www.ahpra.gov.au/Registration/Employer-Services/External-data-exchange-services/National-Register-Copy-or-Extract |
| 5 | **A national directory consolidation is under way**: ADHA will take over the Healthcare Provider Directory from Services Australia (proposed Feb 2027), with a "dual directory model" where the Health Connect Australia Provider Directory (HCAPD) is the single access point and NHSD integrates after a pilot. HCAPD has a published FHIR R4 IG (v26, 2026) with read-only "Requester" access for conformant systems. | Wattle should build on the HL7 AU Provider Directory / AU Core FHIR profiles now so it can plug into HCAPD and NHSD without remodelling. | https://www.medicalrepublic.com.au/adha-set-to-take-over-national-healthcare-provider-directory/127718 ; https://build.fhir.org/ig/AuDigitalHealth/HCPD/index.html |

---

## 1. Law and regulation

### 1.1 National Law s.133 and Ahpra advertising guidelines

**What s.133 says.** A person must not advertise a regulated health service, or a business providing one, in a way that is false/misleading, offers an undisclosed inducement, *uses testimonials or purported testimonials*, creates unreasonable expectations of beneficial treatment, or encourages unnecessary use. A person is not liable "merely for publishing an advertisement for someone else as part of their business". Courts may consult National Board guidelines. Penalty on the NSW consolidation: $60,000 individual / $120,000 body corporate (older secondary sources cite $5,000/$10,000; check the current Queensland host Act before quoting). https://austlii.edu.au/au/legis/nsw/consol_act/hprnl460/s133.html ; https://www.chiropracticboard.gov.au/Codes-guidelines/Position-statements/Background-info-advertising-law.aspx

**Testimonial ban status.** The Health Practitioner Regulation National Law and Other Legislation Amendment Act 2022 (Qld, assent 21 Oct 2022) originally proposed removing the testimonial ban (clause 85); that clause was withdrawn in debate to stay consistent with the cosmetic surgery review. The ban remains. https://www.mondaq.com/australia/healthcare/1284664/the-health-practitioner-regulation-national-law-and-other-legislation-amendment-act-changes-to-the-national-law ; https://legislation.qld.gov.au/view/pdf/bill.third.exp/bill-2021-039

**What counts as a testimonial (Ahpra guideline 4.3.1).** A positive statement about *clinical aspects*: the symptom/reason for treatment, the diagnosis/treatment, or the outcome including the practitioner's skill. Comments only on customer service or communication style are not testimonials. https://www.ahpra.gov.au/Resources/Advertising-hub/Advertising-guidelines-and-other-guidance/Advertising-guidelines.aspx

**Who is the advertiser (3.2).** Whoever controls part or all of the advertising, including having a mechanism to modify or remove content. Advertising "includes all forms of verbal, printed and electronic communication" that promotes a provider and seeks to attract a person to use it. (same URL)

**Third-party sites (4.3.3, verbatim table):**

| Where the review appears | Who is responsible |
|---|---|
| Booking site or review platform that *advertises* a regulated health service; practitioner has no control over the reviews function | "The owner of the online booking site or review platform is responsible for compliance" (whoever controls the reviews function) |
| Service directory, review platform, social media or forum that *does not advertise* a regulated health service | Advertisers are not responsible for removing testimonials there |

https://www.ahpra.gov.au/Resources/Advertising-hub/Resources-for-advertisers/Testimonial-tool

**Implication for Wattle.** A neutral, non-promotional directory (no paid placement, no "book now" sponsored by the practice) sits closer to the "does not advertise" column. Once Wattle sells listings or runs booking funnels for practices, Wattle becomes the party responsible for the reviews function and must strip clinical testimonials. Design choice: allow structured non-clinical ratings only (wait time, parking, bulk-billing accuracy, phone answered) and never free-text about outcomes.

**Publishing register conditions/notations.** Ahpra publishes accepted undertakings (limited detail for health-related ones), reprimands (default 5 years, s.226(3) allows earlier removal) and conditions on the public register. https://www.ahpra.gov.au/Notifications/How-we-manage-concerns/Possible-outcomes.aspx ; https://turkslegal.com.au/publications/policy-unreasonable-unfair-and-liable-lead-positive-injustice. Republication of that data is governed by Ahpra's terms (below), not by the National Law's publication provisions; the safe path is to link to the Ahpra register entry rather than mirror notations.

### 1.2 Ahpra register: terms of use and data access

- Site terms: "limited licence to access and make personal use", no downloading beyond page caching without written consent, prohibition on "the downloading and copying of National Register information for any commercial or data storage purpose", prohibition on "the use of data-gathering or data extraction tools", copyright reserved, "You may not reproduce this information without the consent of Ahpra or the relevant Board". https://ahpra.gov.au/Support/Terms.aspx
- Precedent: Feb 2015 Ahpra stated it had not permitted "doctorinspector" to screen-scrape and republish register data; the site went offline by April 2015. https://www.ahpra.gov.au/News/2015-02-17-websites-using-information.aspx ; https://www.ahpra.gov.au/News/2015-04-17-media-statement.aspx
- Authorised route: extracts under a data agreement and fee; full profession copies only when "in the public interest"; register holds no contact details. Delivered as Excel via secure transfer. https://www.ahpra.gov.au/Registration/Employer-Services/External-data-exchange-services/National-Register-Copy-or-Extract ; https://www.ahpra.gov.au/Registration/Employer-Services/External-data-exchange-services
- Workforce statistics (not identifiable) via the Department's NHWDS tool. https://ahpra.gov.au/About-Ahpra/What-We-Do/Data-access-and-research/What-data-are-available.aspx
- Third-party scrapers exist (e.g. an Apify actor) and expressly note "AHPRA's website terms of use also apply". https://apify.com/ahpra_scraper/ahpra-practitioner-scraper

**Position:** register lookups one-at-a-time to verify a claimed profile are defensible as "personal use" by the practitioner during claim; bulk mirroring is not. Use PCA (section 4) or a paid extract.

### 1.3 Privacy Act 1988, APPs and the 2024–26 reforms

- **Personal information** = information or opinion about an identified or reasonably identifiable individual (APP Guidelines B.88). There is **no business-contact or "publicly available information" exemption** in the APPs; collection from a "generally available publication" is still collection once recorded (B.26–B.30). "Collection by creation" is recognised: generating new personal information from held data (e.g. inferred attributes) is a collection (B.31). "Reasonably identifiable" is an objective test weighing cost, practicability and other available data (B.94–B.97). https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-b-key-concepts
- The employee-records exemption covers employers' own staff records only; it does not help a directory. https://legalvision.com.au/employee-records-exemption
- **Privacy and Other Legislation Amendment Act 2024** (assent 10 Dec 2024): statutory tort for serious invasions of privacy (from 10 June 2025); **automated decision-making transparency** in privacy policies from **10 December 2026**; OAIC has issued ADM guidance (Oct 2026). https://www.nortonrosefulbright.com/en/knowledge/publications/be98b0ff/australian-privacy-alert-parliament-passes-major-and-meaningful-privacy-law-reform ; https://www.oaic.gov.au/engage-with-us/consultations/consultation-on-guidance-for-transparency-in-automated-decision-making ; https://www.wottonkearney.com/new-oaic-guidance-on-automated-decision-making-transparency-obligations/
- Tranche 2 (fair-and-reasonable test, small-business exemption removal, consent) is not yet legislated **[unverified as at Oct 2026]**.

**Implications.** (a) Practitioner profiles are personal information even though sourced from public pages: Wattle needs an APP 5 collection notice pathway (the claim flow), an APP 1 policy naming sources, and a correction/removal process. (b) Ranking or "accepting new patients" inference is ADM with a legal/significant effect on practitioners; disclose it in the privacy policy before 10 Dec 2026. (c) Patient-side data (search queries, location) is sensitive-adjacent; never monetise it (HealthEngine).

### 1.4 Spam Act 2003 and outreach to providers

Consent may be inferred from a **conspicuously published** business address only if it is publicly accessible, not accompanied by a "no commercial messages" statement, and the message relates to the recipient's role; mere publication is not enough, and identify/unsubscribe rules still apply. https://www.itomic.com.au/?p=3056 ; https://pointonpartners.com.au/spam-act/ ; https://www.flyingsolo.com.au/?p=1089673. A "claim your Wattle profile; here is what we show about you" email to a practice's published address is role-relevant; a sales drip is not.

### 1.5 Australian Consumer Law and comparison sites

ACCC comparator guidance: like-for-like comparisons, disclose commercial relationships even if they do not affect results, visually separate sponsored from organic listings, do not accept fees for preferred placement while claiming impartiality, explain what a ranking means. The ACCC sued iSelect over commission-driven ranking. https://www.accc.gov.au/system/files/CSBS%20-%20Comparator%20web%20sites%20project%20-%20Industry%20Guidance%20-%20final.pdf ; https://www.bankingday.com/article/accc-sues-iselect. ACCC online-review guidance applies to any review function. https://www.accc.gov.au/business/advertising-and-promotions/online-product-and-service-reviews

### 1.6 Copyright in databases and scraping

- **IceTV v Nine (HCA 2009)** and **Telstra v Phone Directories (FCAFC 2010)**: no copyright in the White/Yellow Pages because compilations assembled by automated process lack a human author's "independent intellectual effort"; copyright in facts is thin. https://dcc.com/news-and-insights/copyright-does-not-subsist-in-the-white-and-yellow-pages-full-federal-court/ ; https://www.legal500.com/intelligence/australia/intellectual-property/copyright-in-databases-and-compilations-the-telstra-telephone-directories-case
- Australia has "no laws or jurisprudence relating specifically to web scraping"; exposure comes from contract (clickwrap terms), copyright in expressive text/photos, Privacy Act, and misuse-of-computer offences for abusive load. https://www.asiaiplaw.com/sector/it-telecoms/the-legal-landscape-of-web-scraping ; https://www.quinnemanuel.com/the-firm/publications/the-legal-landscape-of-web-scraping/

**Practical rule:** facts (name, address, hours, services, fees) are free; copy no bios, photos or practice-written prose; respect robots.txt and rate limits; do not create accounts to scrape (that creates a contract).

### 1.7 Government data: NHSD, data.gov.au, Medicare numbers

- **NHSD** (healthdirect) exposes an HL7 FHIR R4 API and bulk export under a licence agreement, OAuth2 client-credentials + API key, with published inbound/outbound data models and a developer guide. https://media.healthdirect.org.au/publications/NHSD_Developer-Guide.pdf ; https://media.healthdirect.org.au/publications/NHSD_FHIR-R4-data-model_outbound.pdf ; https://about.healthdirect.gov.au/what-we-do/portfolio/nhsd/integration-hub
- The "Healthdirect - NHSD - Services Directory 2025" dataset is listed on data.gov.au and AURIN, but AURIN marks it **academic access by agreement** under NHSD terms, not CC-BY. https://data.gov.au/data/dataset/8114fd8c-95ae-4d2a-bb64-e5e474a6ea71 ; https://data.aurin.org.au/dataset/8114fd8c-95ae-4d2a-bb64-e5e474a6ea71
- data.gov.au site-wide licence is CC BY 4.0 but each dataset carries its own licence field (some CC BY 2.5 AU, some "Not specified"). Useful CC datasets for the map: GP catchments by SA1–SA4, Modified Monash Model. https://data.gov.au/data/dataset/activity/asgs-sa3-2021-by-gp-catchments-2023
- Healthdirect's constitution limits it to serving its government shareholders; commercial NHSD licences are negotiated case by case. https://media.healthdirect.org.au/publications/Healthdirect-Australia-Annual-Report-FY25.pdf
- **Medicare provider numbers** are issued per practitioner per location by Services Australia via the Provider Directory System and are a claiming credential; PCA models them as a FHIR identifier. No public lookup exists. Treat as confidential; never display. https://www.servicesaustralia.gov.au/provider-and-prescriber-numbers ; https://implementer.digitalhealth.gov.au/fhir/provider-connect-australia/2.4.3/StructureDefinition-pca-medicareprovidernumber.html

### 1.8 Other regimes

| Regime | Status / relevance | Source |
|---|---|---|
| Consumer Data Right (health) | Not designated. Current expansion is non-bank lending (2026); health only appeared in a 2021 consultation. | https://www.mallesons.com/au/en/insights/latest-thinking/loan-behold-non-bank-lenders-to-join-the-consumer-data-right.html |
| Is a directory a "health service"? | Victorian Health Records Act defines a health service as assessing/diagnosing/treating; a routing directory is not a provider, but HPPs still bind any organisation *holding* health information (e.g. "I need an ADHD assessment" searches tied to an account). | https://health.vic.gov.au/legislation/health-records-act |
| My Health Record Act 2012 | Only relevant if Wattle connects to MHR; that requires registration as a portal operator under the PORA and ADHA FHIR Gateway consent guidelines. Not needed for a directory. | https://www.legislation.gov.au/C2012A00063 ; https://developer.digitalhealth.gov.au/resources/download/component/7226/c42e68dd-c758-4a58-b1cc-886e950de372 |
| TGA advertising | Prescription medicines may not be advertised to the public; June 2026 TGA guidance treats condition-specific landing pages, booking systems and third-party links as potential advertising. A directory should describe services ("ADHD assessment"), never medications or brand names. | https://www.millsoakley.com.au/insights/tga-prescription-medicine-advertising-guidance-helpful-clarity-but-murky-boundaries/ ; https://www.tga.gov.au/resources/legislation/therapeutic-goods-therapeutic-goods-advertising-code-instrument-2021 |
| Health complaints entities | Complaints about practitioners go to Ahpra/HCCC-type bodies; a directory that surfaces complaint outcomes should link to the register entry rather than restate. | https://www.ahpra.gov.au/Notifications/How-we-manage-concerns/Possible-outcomes.aspx |

---

## 2. Competitive landscape

| Player | What it is | Does well | Does badly | Business model | Source |
|---|---|---|---|---|---|
| **healthdirect / NHSD** | Government-owned (all jurisdictions equal shareholders); NHSD feeds Service Finder (1.2m users/month after April 2023 rebuild; 50 km cap removed; 15 languages; bulk-billing/telehealth filters). PCA business partner. | Authority, coverage, FHIR API, symptom checker, 1800 line. | Constitution limits it to shareholders; no 2025–26 redesign found; stale listings depend on providers; no fee/availability data. | Government funded. | https://about.healthdirect.gov.au/resources/news/vaccine-clinic-finder-transitioned-to-healthdirect-service-finder ; https://media.healthdirect.org.au/publications/Healthdirect-Australia-Annual-Report-FY25.pdf |
| **HotDoc** | Dominant GP booking; claims 9m+ patients. Pricing: ~A$81/doctor/month GP, A$35/practitioner allied, A$125/site + A$35/specialist, A$29.50 per new-patient booking for Cliniko/coreplus/Nookal practices; 1.75% + 30c payments. | Real availability, deep PMS integration. | Directory only covers paying practices; patient data is the product for practices. | Practice SaaS + per-booking + payments. | https://us.fitgap.com/products/hotdoc ; https://www.capterra.co.uk/software/213272/hotdoc |
| **HealthEngine** | Booking marketplace (Perth, 2006). | Scale, telehealth. | 2020: $2.9m penalty, 17,000 reviews suppressed, 3,000 edited, 135k patients' data sold to brokers; judge called $2.9m "a very respectable cost of doing business". | Practice subscriptions + referral fees. | https://www.accc.gov.au/media-release/healthengine-to-pay-29-million-for-misleading-reviews-and-patient-referrals ; https://ia.acs.org.au/article/2020/healthengine-whacked-with--2-9-million-fine.html |
| **Healthshare** | Specialist referral directory embedded in Bp Premier (free to subscribers; 71% of GPs use it), MedicalDirector (since 2014, in-referral workflow since 2020), Zedmed; HICAPS partnership. Monthly verification of listings. "Premium Referrals" lets specialists pay to be promoted inside the GP address book and on consumer site/insurer finders. | GP-side distribution moat. | Pay-to-promote inside a clinical workflow is exactly the ACCC comparator concern; consumer side weak. | Specialist advertising + insurer/PMS partnerships. | https://www.medicaldirector.com/press/medicaldirector-to-deliver-deeper-integration-of-healthshare-practitioner-referrals-directory-in-medicaldirector-clinical ; https://bpsoftware.net/?p=133398 ; https://healthdispatch.com.au/news/hicaps-and-healthshare-announce-new-partnership |
| **Cliniko / Halaxy** | Allied-health practice management (Melbourne; Cliniko 2010, Halaxy 2012, Halaxy freemium). | Hold the allied calendar and fee data. | Not consumer directories; Halaxy's finder is thin. | SaaS. | https://www.cbinsights.com/company/cliniko/financials ; https://www.cbinsights.com/company/halaxy/financials |
| **Whitecoat** | Launched 2013 by nib; 300k+ practitioners, ratings; bought by CBA May 2021 (~A$30m est.), folded into Business Bank; 2023 NIB loan dispute. Current consumer status **[unverified]**: no 2025–26 activity found. | Showed insurers want a directory. | Ratings model conflicted with Ahpra; bank ownership diluted it. | Insurer/bank payments funnel. | https://pulseitmagazine.com.au/allied-health/6038-commonwealth-bank-buys-online-directory-and-booking-service-whitecoat/ ; https://en.wikipedia.org/wiki/Whitecoat_Health_Service_Directory |
| **Medical Costs Finder** | DoHDA site; by end-2025 only ~88 doctors uploaded fees; 2025 pledge of $7m to publish every non-GP specialist's average fee from Medicare/insurer data; Health Legislation Amendment (Improving Choice and Transparency for Private Health Consumers) Bill 2026 authorises default publication. GP fees excluded. | Will become the authoritative specialist fee source. | Voluntary model failed. | Government. | https://www.ausdoc.com.au/news/we-will-publish-what-individual-specialists-are-charging-mark-butlers-election-pledge ; https://www.medicalrepublic.com.au/?p=123291 ; https://medicalcostsfinder.health.gov.au/disclaimer/ |
| **Doctify** | UK review platform, subscription for providers; Australian team ~10 in Melbourne. | Verified-review tech. | Clinical reviews collide with s.133; subscription means coverage = paying providers. | Provider subscription. | https://www.doctify.com/au/about/mission ; https://doctify.teamtailor.com/ |
| **Mable** | NDIS/aged-care support-worker marketplace; 7.95% client fee + 10% worker fee, $42/hr floor; insured, verified workers. | Take-rate marketplace that works. | Not clinical. | Transaction fees. | https://mable.com.au/pricing/ |
| **Clickability** | NDIS provider review directory **[unverified: page returned no content]**. | | | | https://clickability.com.au/about/ |
| **Psychology Today AU / Good Therapy** | Listing-fee directories; Good Therapy AU charges $154/yr (reduced $110). | Cheap for therapists. | Pay-to-list = incomplete. | Listing fees. | https://goodtherapy.com.au/flex/reduced-rate-profile-subscription/929/1 |
| **Google Business Profile** | Providers can claim, add telehealth, services, booking links; no structured "accepting new patients" field (handled via Q&A). | Ubiquity, hours, phone, reviews. | Reviews are clinical and uncontrolled; no Ahpra linkage. | Ads. | https://support.google.com/business/answer/9798848?hl=en-AU |
| **Doctoralia / DocPlanner** | No Australian launch found **[unverified]**. | | | | |
| **Zocdoc / Healthgrades (US)** | Dec 2025 partnership: Zocdoc real-time booking inside Healthgrades; 16.5m bookable hours at launch. Healthgrades (RVO Health/Optum) criticised for review authenticity and ad-driven model. | Availability + reviews combined. | Pay-per-booking; sponsored placement. | Per-booking fees, ads. | https://medcitynews.com/2025/12/zocdoc-healthgrades-partnership/ ; https://www.consumeraffairs.com/online/healthgrades.html?page=3 |
| **NHS (UK)** | ODS = organisation reference (FHIR R4 API, nightly CSV); DoS = real-time service directory behind NHS 111/Pathways; NHS Profile Manager lets pharmacies update, syncing to DoS in ~10 min; NHS.uk patient finder and professional Service Finder draw on these. | Single national IDs, self-service profile manager, near-real-time sync. | Multiple overlapping registers. | Government. | https://digital.nhs.uk/developer/guides-and-documentation/building-healthcare-software/organisations-and-services ; https://cpe.org.uk/digital-and-technology/databases-of-pharmacies-and-services/directory-of-services-dos/ |
| **Healthpoint NZ** (closest analogue) | Private company founded 2004 by Kate Rhind; 11–12k services, "most health services in Aotearoa"; 1m+ visitors/month (3m peak in COVID); several hundred providers update their own pages daily; public API; Ask Healthpoint AI navigator (2026) limited to its verified database; on NZ Zero Data; partners include Health NZ, Ministry of Health, Whakarongorau. Funding mix (public contracts vs provider fees) **[unverified]**. | Complete national GP/pharmacy/mental-health coverage via provider self-maintenance; government trusts it enough to route Book My Vaccine to it. | | Private; partners pay. | https://www.hinz.org.nz/news/685643/Healthpoint-celebrates-a-double-decade-of-helping-Kiwis-make-more-informed-health-choices.htm ; https://healthpointltd.health/healthpoint-directory/ask-healthpoint/ ; https://www.healthpoint.co.nz/ ; https://tdhb.org.nz/news/documents/media_release_2021_09_17.shtml |

**Strategic read.** Every Australian competitor is either (a) government and constrained by constitution (healthdirect), (b) a booking SaaS whose directory equals its customer list (HotDoc, HealthEngine), or (c) a pay-to-list/pay-to-promote directory (Healthshare Premium, Doctify, Psychology Today). None is a complete, neutral, patient-first map with availability and fee signals. Healthpoint NZ shows that a private operator can become the de facto national directory by making self-maintenance easier than any alternative and by being the data source government itself routes to.

---

## 3. Data-strategy patterns

### 3.1 Bootstrapping tiers

| Tier | Source | Legal basis | Coverage | Freshness |
|---|---|---|---|---|
| 0 Seed | NHSD bulk export (licence) and/or PCA business-partner feed | Licence / participation agreement | High for organisations | NHSD contributor-maintained; PCA provider-pushed |
| 1 Identity | Ahpra data via PCA clause-11 Register Data (number, profession, name) or a paid Ahpra extract | Agreement | All registered practitioners (extract) | Register status is live only on Ahpra; link to it |
| 2 Enrichment | Practice websites (facts only), Google Business Profile hours, PHN HealthPathways directories, Medicare Mental Health / UCC lists | Facts not copyrightable; ToS-respecting crawl | Variable | Re-crawl on change signals |
| 3 Claimed | Practitioner/practice claims profile; verifies via Ahpra lookup + practice email/phone | APP 5 notice; consent | Grows with outreach | Self-maintained; nudge on staleness |
| 4 Crowd-verified | Patients confirm "still bulk-bills", "phone answered", "accepting new patients" (non-clinical only) | ACL honesty; no clinical testimonials | Hot spots first | Days |

### 3.2 Entity resolution

Key: `Ahpra number` (person) × `practice organisation` (ABN / HPI-O / PCA org ID / NHSD service ID) × `location` (Google Place ID, geocoded address). Model it as FHIR `Practitioner` → `PractitionerRole` (one per practitioner-at-organisation-at-location) → `HealthcareService` → `Location`, the exact shape of the HL7 AU Provider Directory IG and HCPD, so the same record can be exported or reconciled with NHSD/HCAPD later. https://build.fhir.org/ig/hl7au/au-fhir-pd ; https://build.fhir.org/ig/AuDigitalHealth/HCPD/index.html. Multi-location practitioners are simply multiple `PractitionerRole` rows; Medicare issues a provider number per location for the same reason. https://operational.servicesaustralia.gov.au/public/Pages/health-professionals/012-42010010-04.html

### 3.3 The "accepting new patients" and fee problems

- Nobody holds this structurally; Google lacks a field; HotDoc knows it only for its customers. Approach: tri-state signal (claimed / crowd-confirmed within 30 days / unknown) with a timestamp, never a bare boolean.
- Fees: specialist averages will arrive via Medical Costs Finder once the 2026 Bill operates; GP fees will not. Use practice-published fees (facts) with a "last seen" date, plus crowd confirmation of bulk-billing; display BBPIP/bulk-billing status as the 1 Nov 2025 scheme defines it (practice must bulk-bill every consult to receive the 12.5% payment). https://www.racgp.org.au/cpd/cpd-resources/member-resources/your-cpd-solutions/bulk-billing-incentives

### 3.4 Verification UX lessons

- Healthpoint: providers log in and edit; hundreds of edits a day sustain national coverage. https://healthify.nz/hauora-wellbeing/h/healthpoint
- NHS Profile Manager: one self-service tool syncing to the live DoS in ~10 minutes. https://cpe.org.uk/digital-and-technology/databases-of-pharmacies-and-services/directory-of-services-dos/
- Healthshare: monthly verification sweep of specialist listings. https://www.medicaldirector.com/news/?p=3853
- PCA: the provider's "single master copy"; if Wattle is a business partner, the claim is done once in PCA and flows automatically, which is a far stronger pitch to practices than "another portal".

### 3.5 Monetisation that survives the law

Allowed: practice SaaS (availability sync, claim tools), insurer/PHN/government data licences, anonymised demand analytics, clearly labelled sponsored slots separated from organic results (ACCC). Not allowed or ruinous: selling patient data to third parties (HealthEngine), undisclosed paid ranking (iSelect), clinical reviews (s.133), medication-specific landing pages (TGA).

---

## 4. Policy environment 2023–2026 and national directory initiatives

### 4.1 Provider Connect Australia (PCA)

- **What:** ADHA initiative; provider organisations "update their business information in a single source" and push to chosen business partners; "Over time, business partners will include funders, public service directories, secure messaging providers and more". Portal at pca.digitalhealth.gov.au; registration via PRODA. https://www.digitalhealth.gov.au/healthcare-providers/initiatives-and-programs/provider-connect-australia
- **Who consumes (as at 13 Aug 2026):** directories/booking: Healthdirect, Health Hunter, Precedence Health Care, RxTro; 29 PHNs; professional bodies (Optometry Australia, APodA, AMT, Continence Health Australia, etc.); eHealth NSW, NT Health; secure messaging (Telstra Health, Foxo, Consultmed, reCare); Harmonie Health; HealthPoint Claims, quickclaim. (same URL)
- **Ahpra data for partners:** Under the PCA Participation Agreement for Subscriber Organisations, clause 11 "Register Data" = `practitioner.identifier:ahpraregistrationnumber`, `practitioner.ahpraRegistration-details.ahpraProfession`, `practitioner.name` (updated 2 Sep 2025). https://digitalhealth.gov.au/healthcare-providers/initiatives-and-programs/provider-connect-australia/provider-connect-australia-register/register-as-a-business-partner/ahpra-register-data
- **Technical:** PCA publishes a FHIR R4 implementation guide (v2.4.x) with profiles such as `pca-medicareprovidernumber`; release history notes partners can "enable the display of FHIR IDs". https://implementer.digitalhealth.gov.au/fhir/provider-connect-australia/2.4.3/StructureDefinition-pca-medicareprovidernumber.html ; https://www.digitalhealth.gov.au/healthcare-providers/initiatives-and-programs/provider-connect-australia/provider-connect-australia-register/provider-connect-australia-release-history
- **Onboarding steps for partners:** prior-to-registration checklist, register organisation details, set up partner services, receive information from provider organisations, register users; contact pca@digitalhealth.gov.au. https://www.digitalhealth.gov.au/healthcare-providers/initiatives-and-programs/provider-connect-australia/provider-connect-australia-register
- **Gaps to confirm with ADHA [unverified]:** whether a start-up directory with no existing provider clients is eligible; whether delivery is push (notifications), pull (FHIR API) or portal download; fees (none mentioned on public pages); and the full text of the Participation Agreement.

### 4.2 Health Connect Australia Provider Directory (HCAPD) and the HPD transfer

- ADHA's 2025–26 Interoperability Plan progress report: Healthcare Provider Directory transfers from Services Australia to ADHA, proposed **February 2027**; feasibility study on integrating HPD with NHSD done; joint roadmap for NHSD, HCAPD and PCA; "principles for a dual directory model were endorsed, positioning HCAPD as a single access point providing a comprehensive, near real-time view of provider information"; HCAPD initially draws on HPD, NHSD integration after pilot. 35 of 44 interoperability actions complete. https://www.medicalrepublic.com.au/adha-set-to-take-over-national-healthcare-provider-directory/127718 ; https://www.digitalhealth.gov.au/sites/default/files/documents/annual-2025-6-interoperability-plan-and-hi-roadmap-july-25-june-26.pdf
- **HCPD FHIR IG v26.0.0** (2026): Requester (read-only client) / Responder; resources Practitioner, PractitionerRole, Organization, Location, HealthcareService, Endpoint; builds on AU Base, AU Core and AU Provider Directory IG; conformance required before API access; CC BY 4.0. https://build.fhir.org/ig/AuDigitalHealth/HCPD/index.html

### 4.3 Standards: Sparked, AU Core, AU Provider Directory

- AU Core (CSIRO Sparked / HL7 AU) sets minimum FHIR expectations for Australian systems. https://build.fhir.org/ig/hl7au/au-fhir-core/ ; https://sparked.csiro.au/index.php/products-resources/au-core-fhir-ig-r1/
- AU Provider Directory IG (PD2 published; 2.1.0 CI build): PractitionerRole and HealthcareService are the searchable resources; SNOMED CT service types/specialties; designed for secure-messaging endpoint discovery. https://hl7.org.au/fhir/pd/pd2/index.html ; https://build.fhir.org/ig/hl7au/au-fhir-pd/StructureDefinition-au-pd-practitionerrole.html
- NHSD already speaks FHIR R4 with published inbound/outbound models. https://media.healthdirect.org.au/publications/NHSD_FHIR-R4-data-model_inbound.pdf

### 4.4 Medicare and workforce policy

| Item | Status | Source |
|---|---|---|
| Bulk-billing incentive tripling extended to all Medicare-eligible patients from 1 Nov 2025; new Bulk Billing Practice Incentive Program (12.5% of MBS benefits, practice must bulk-bill every consult, MyMedicare-registered) | In force | https://mbsonline.gov.au/internet/mbsonline/publishing.nsf/650f3eec0dfb990fca25692100069854/ed5d4e612e52e052ca258cf8007a8f94/$FILE/PDF%20Version%20-%20Factsheet%20BBI%20changes%201%20Nov%2025.pdf ; https://www.racgp.org.au/cpd/cpd-resources/member-resources/your-cpd-solutions/bulk-billing-incentives |
| Medicare Urgent Care Clinics: 50 more to reach 137 (2025–26 Budget) | Rolling out | https://www.racgp.org.au/getmedia/42095e6d-e07c-47e0-bc84-0a0aad16fc17/RACGP-2025-26-Budget-Response-Detailed-Analysis-Response.pdf.aspx |
| Medicare Mental Health Centres: $267.3m for 32 new/upgraded, network of 92 by mid-2030 (Aug 2026) | Expanding | https://www.health.gov.au/ministers/the-hon-emma-mcbride-mp/media/central-queensland-medicare-mental-health-centres-supports-thousands-of-people-as-expansion-underway |
| Scope of Practice Review (Cormack): final report 30 Oct 2024, 18 recommendations across 4 themes; National Competition Policy schedule now includes full-scope reform | Government response pending **[unverified]** | https://health.gov.au/our-work/scope-of-practice-review ; https://www.podiatry.org.au/news/unleashing-the-potential-of-our-health-workforce-final-report-released |
| National Digital Health Strategy 2023–2028: four outcomes (digitally enabled, person-centred, inclusive, data-driven); roadmap of 12 priority areas | Active | https://MyHealthRecord.gov.au/national-digital-health-strategy/priorities-and-initiatives |
| Senate ADHD inquiry (Nov 2023): 700 submissions, 15 recommendations incl. national framework, Medicare/bulk-billing for assessment, GP/NP roles, telehealth and rural access | Reported | https://www.aph.gov.au/Parliamentary_Business/Committees/Senate/Community_Affairs/ADHD/Report/Executive_Summary ; https://www.adhdaustralia.org.au/senate-inquiry-into-adhd/ |
| Senate inquiry into GP/primary services in outer-metro, rural and regional Australia: interim report 14 Nov 2024; committee unable to deliver a comprehensive final report | Partial | https://aph.gov.au/Parliamentary_Business/Committees/Senate/Community_Affairs/PrimaryHealthServices/Final_Report |
| Specialist fee transparency Bill 2026 (default publication on Medical Costs Finder) | Before Parliament **[passage unverified]** | https://www.medicalrepublic.com.au/?p=123291 |

**Why these matter for a map:** each creates a new structured attribute patients want to filter on (BBPIP practice, UCC, MMHC, telehealth ADHD assessment, nurse-practitioner clinics) that no incumbent directory exposes cleanly.

---

## 5. Recommended legal/data posture (summary)

1. Apply to ADHA to become a **PCA business partner** (pca@digitalhealth.gov.au) and negotiate an **NHSD licence** with healthdirect; both are consented, standards-based feeds and position Wattle for HCAPD in 2027.
2. Model everything as **FHIR AU PD / AU Core** resources from day one.
3. **Never scrape the Ahpra register in bulk**; verify individual claims against it and link out for notations.
4. **No clinical reviews.** Structured non-clinical signals only, labelled and time-stamped; clear ACCC-compliant separation of any sponsored content; no paid ranking.
5. Treat practitioner profiles as personal information: collection notice, correction/removal, ADM disclosure before 10 Dec 2026, and absolutely no patient-data sharing.
6. Outreach to practices only on role-relevant, published addresses with identify/unsubscribe.
7. Describe services, never medicines.

---

## 6. Open items requiring direct confirmation

- PCA Participation Agreement text, partner eligibility for a new entrant, delivery mechanism and fees (ADHA).
- NHSD commercial licence terms and price (healthdirect).
- Healthpoint NZ revenue mix (public contracts vs provider fees).
- Whitecoat's current consumer-facing status.
- Passage of the 2026 specialist fee transparency Bill and the government response to the Scope of Practice review.
- Clickability and Doctoralia Australia details.
