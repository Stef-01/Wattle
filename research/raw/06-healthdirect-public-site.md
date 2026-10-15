# 06 — healthdirect public Service Finder: what it exposes, and whether we can collect it without the NHSD licence

Date: 2026-10-15. Method: curl with a self-identifying User-Agent, at most 1 request/second, ~45 requests total (terms, robots, 6 sitemap files, 7 JS chunks, 3 service pages, 33 search pages). No bulk collection was performed. Raw captures are in the session scratchpad, not in this repo.

Scope: psychiatry, paediatrics ("Children's medical service" in NHSD's SNOMED taxonomy), obstetrics and gynaecology, NSW and VIC.

---

## 1. Terms of use and robots.txt

### 1.1 robots.txt — https://www.healthdirect.gov.au/robots.txt

Full file, verbatim:

```
User-agent: *

Disallow: /search-results/
Disallow: /*?sort=
Disallow: /*?filter=
Disallow: /*?*query=

Sitemap: https://www.healthdirect.gov.au/siteassets/medicine/sitemap-medicines.xml
Sitemap: https://www.healthdirect.gov.au/sitemap.xml
Sitemap: https://www.healthdirect.gov.au/australian-health-services/sitemaps/sitemap-index-health-services.xml
```

What this means for us:

- `/australian-health-services/search/...` and `/australian-health-services/healthcare-service/...` are NOT disallowed. The only disallowed paths are the site-wide `/search-results/` page and URLs with `?sort=`, `?filter=` or `query=` parameters. The Service Finder's own `?offset=` paging parameter is not listed.
- healthdirect explicitly publishes a sitemap index for health services (section 2.3). Publishing a sitemap is an invitation to crawlers to index those URLs. It is not a licence to reuse the content, but it does undercut any claim that fetching those pages is unauthorised access.

### 1.2 Terms of use — https://www.healthdirect.gov.au/terms-of-use (page says "Last reviewed: August 2026")

There is no clause that mentions robots, scraping, crawling, automated access, data mining, harvesting or bulk download. The word "automated" does not appear. The clauses that bear on collection and reuse, quoted exactly:

Definition of what is covered (section "About these Terms of Use (Online Services)"):

> any interactive facilities or services used or accessed through the websites or Healthdirect Widgets, (e.g., video call, Service Finder, Symptom Checker, Australian Health Thesaurus (AHT), National Health Services Directory, Contraception Options Finder (COF), etc);

Purpose restriction (same section):

> The Online Services are designed only for people who are located within Australia, and are not intended to be used for commercial purposes such as for promoting, advertising, or generating revenue, directly or indirectly including through sponsorship, referrals, media publications, paid links, or the promotion of private services or businesses.

Third-party access and AI interfaces are expressly contemplated (section "Acceptance of these terms of use"):

> Where you access Healthdirect content, tools or services through a third-party platform, interface or service, your access and use of that content, tool or service will also constitute access to and use of the Online Services for the purposes of these Terms of Use.

And in the liability disclaimer:

> information made available through the Online Services is summarised, reformulated, presented or generated through a third-party platform, interface or services in a way that is inaccurate, incomplete, misleading, unavailable, delayed or in appropriate to your circumstances;
> [...]
> you rely on information accessed through a third-party artificial intelligence-enabled or conversational interface;

Intellectual property (section "Intellectual property rights"):

> All intellectual property rights in the Online Services and Information, including (without limitation) text, graphics, architecture and coding (including any copyright subsisting in them), is owned by Healthdirect or licensed to us.

> You may access and download the Information on or from the Online Services where available to the extent permitted and in accordance with these Terms of Use and any relevant Additional Terms, but you may not, unless otherwise permitted by law, modify, publish, transmit, distribute, participate in the transfer or sale, create derivative works, or in any way exploit, any of the Information in whole or in part without the prior written permission of the owner or exclusive licensor of the material.

Linking and framing (section "Links to other websites"):

> You may link to the Online Services, provided you do not alter any of the Information or Online Services. In linking to another website from the Online Services you must not reproduce, frame or reformat the files, pages, images, information and materials from the Online Services on any other website unless Healthdirect provides its express prior written permission.

> You must not use the Online Services or any Information to sell a product or service, or to increase traffic to your website for commercial reasons, such as advertising sales, or to facilitate these activities. Healthdirect may prevent linking to any website at any time.

Governing law: New South Wales. Acceptance is by browsing ("By accessing, using or viewing the Online Services (including Information), you agree to these Terms of Use").

Additional terms: the terms refer to "Additional Terms" for parts of the site. The NHSD registration terms page linked from the terms (`/nhsd/privacy-and-security/registration-terms-of-use`) returns 404. No Service-Finder-specific additional terms were found on the finder landing page; its only terms link is to the general terms above.

### 1.3 Reading of the terms

Three things cut against us and one cuts for us.

Against:
1. "not intended to be used for commercial purposes ... the promotion of private services or businesses" — Wattle Health is a commercial product and it surfaces private specialists. This is a purpose statement, not an outright prohibition ("not intended"), but it is the clause healthdirect would cite.
2. "you may not ... publish, transmit, distribute ... create derivative works, or in any way exploit, any of the Information" — a directory built from the pages is a derivative work by any plain reading, unless "otherwise permitted by law" applies (see below).
3. "You must not use the Online Services or any Information to sell a product or service" — flat prohibition, and it covers "any Information".

For:
4. "unless otherwise permitted by law" is the escape hatch for the facts-not-copyright argument. Under Australian law after *IceTV v Nine* (2009) and *Telstra v Phone Directories* (2010), a compilation of names, addresses, phone numbers and opening hours attracts copyright only where there is identifiable human authorship of the selection or arrangement; the bare facts themselves are not protected. The NHSD is populated by providers self-registering and by healthdirect's data team, so the arrangement is machine-generated and the facts are the providers' own facts. Copyright in the *pages* (layout, prose descriptions written by healthdirect, graphics) is real; copyright in "Dr X, Suite 5, 180 Ocean St, 02 9650 4290, open Mon-Fri 9-5, fees apply" is very doubtful.

The contract claim is the real exposure, not copyright. Browse-wrap terms are enforceable in Australia only if the user had reasonable notice; a footer link has been held insufficient in some cases, but a business that has read the terms (we have, and this file is evidence of it) cannot plead ignorance. If healthdirect ever objected, the remedy would most likely be a cease-and-desist and IP blocking rather than damages, because the loss is nil, but it would poison the licence negotiation.

Also note the free-text `description` field on each service (e.g. "The Bankstown Mental Health Assertive Outreach Team provides intensive, community-based ...") is prose written by the provider or healthdirect and IS copyright-protected. We must not store or republish descriptions; structured fields only.

---

## 2. How the Service Finder loads results

### 2.1 Architecture

- The finder at `/australian-health-services` is a Next.js 13 app (pages router, build id `2XUUcD2Fnt_qxIaAgxjyq` on 2026-10-15) mounted under that path prefix.
- Search and detail pages are server-side rendered. The full result set / service record is embedded in the page as JSON inside `<script id="__NEXT_DATA__">`. No client-side XHR is needed to read it; a plain GET returns everything.
- The Next.js data route also works and returns the same JSON without the HTML: `https://www.healthdirect.gov.au/australian-health-services/_next/data/<buildId>/search/sydney-2000-nsw/psychiatry/310116007.json` returned HTTP 200, `application/json`, 222 KB. The build id changes on every deploy, so this is fragile; parsing `__NEXT_DATA__` from the HTML is the stable path.
- The only public JSON API referenced by the client bundle is a suburb autocomplete: base URL `https://www.healthdirect.gov.au/australian-health-services/api`, call `GET location?q=<text>` (found in `_app-e71252f4f536af6f.js`: `BE.create({baseURL:"https://www.healthdirect.gov.au/australian-health-services/api", ...}).get(\`location?q=${e}\`)`). No FHIR endpoint is exposed to the browser; the server calls NHSD internally. Service search and detail are not fetched from the browser at all.
- Internal identifiers are NHSD's: service type refs are `nhsd:/reference/taxonomies/snomed-servicetype/<SNOMED-CT-AU concept id>`, states are `nhsd:/reference/geo/AUS.states/NSW`, billing and facilities use `nhsd:/reference/common/...`. The uuids in the URLs are NHSD HealthcareService ids, so anything we collect now will key directly onto the licensed FHIR feed later.

### 2.2 URL patterns (all stable, all server-rendered)

Search (suburb x service type):

```
/australian-health-services/search/<suburb>-<postcode>-<state>/<service-type-slug>/<snomed-concept-id>[?offset=10|20]
```

e.g. https://www.healthdirect.gov.au/australian-health-services/search/sydney-2000-nsw/psychiatry/310116007

Service detail:

```
/australian-health-services/healthcare-service/<suburb>-<postcode>-<state>/<organisation-slug>/<service-type-slug>/<nhsd-uuid>
```

e.g. https://www.healthdirect.gov.au/australian-health-services/healthcare-service/edgecliff-2027-nsw/dr-rahul-sen/obstetrics-and-gynaecology/6e9f96c7-3f17-726c-8058-bc8c7ab7ff5a

Service type directory (all 260 types, with SNOMED ids): https://www.healthdirect.gov.au/australian-health-services/sitemaps/sitemap-index-health-services-all-services.xml

SNOMED ids for our three disciplines (from the sitemaps):

| Discipline | Slug | SNOMED concept |
|---|---|---|
| Psychiatry | `psychiatry` | 310116007 |
| Paediatrics | `children-s-medical-service` | 1223241000168106 |
| Obstetrics and gynaecology | `obstetrics-and-gynaecology` | 310060005 |
| Obstetrics | `obstetrics` | 310063007 |
| Gynaecology | `gynaecology` | 310061009 |
| Urogynaecology | `urogynaecology` | 1248771000168103 |
| Gynaecological oncology | `gynaecological-oncology` | 1238971000168100 |
| Child and adolescent mental health | `child-and-adolescent-mental-health` | 1239001000168104 |
| Perinatal mental health | `perinatal-mental-health` | 1239071000168109 |

Searching the parent concept returns child concepts too: the Sydney "obstetrics-and-gynaecology" search returned services typed Gynaecology, Obstetrics, Urogynaecology and (Melbourne) Pregnancy ultrasound.

### 2.3 Search behaviour and limits (measured)

- Every search returns the **30 nearest** services, 10 per page, pages via `?offset=10` and `?offset=20`; `?offset=30` returns an empty page. `count` is always 30 when 30 or more exist. The radius is reported back (`resultsRadiusMeters`, `resultsRadiusDisplay` like "30 results within 5km"), i.e. the radius auto-expands until 30 are found. `?radius=` and `?pageNumber=` in the query string are ignored.
- Consequence: there is no "give me everything in NSW" query. A full collection would be a suburb tiling: one search per (suburb, type) and dedupe by uuid, stopping when a tile's 30-radius exceeds the tile spacing. For Sydney+Melbourne x 3 types that is on the order of 300 to 600 search requests plus one detail request per unique service (section 4), i.e. a few thousand requests at 1/s, roughly an hour.
- Search result items carry the same field set as the detail page (section 3), including geocode and contacts, so a detail fetch is only needed for fields that are empty in results (none observed) or to confirm the canonical URL.

### 2.4 Sitemaps

`sitemap-index-health-services.xml` lists 14 child sitemaps: NSW, NSW-2, VIC, VIC-2, QLD, QLD-2, SA, WA, ACT, TAS, NT, HOME-VISIT, VIRTUAL, all-services. All carry `lastmod 2023-04-04`.

- `-NSW.xml` / `-VIC.xml` (10.9 MB / 10.8 MB) are 40,000 suburb x service-type *search* URLs each, capped at 40,000 (truncated).
- `-NSW-2.xml` (20,619 URLs) and `-VIC-2.xml` (28,997 URLs) are individual `healthcare-service` detail pages. Counts of our types inside them: NSW psychiatry 53, O&G 73, gynaecology 22, obstetrics 13, children's medical service appears only in the search sitemap (98 suburb pages); VIC psychiatry 126, O&G 172, gynaecology 63, obstetrics 25. These are a 2023 partial snapshot, not a census: the first psychiatry sample page from the NSW-2 sitemap (Dr James Heiner, Wollongong) returned 404, and the live Sydney CBD search alone finds 30 psychiatry services within 5 km. Use the sitemap only as a seed list of uuids and suburbs, never as the universe.

---

## 3. Fields on a service page (one sample per discipline)

Samples fetched 2026-10-15:

- Psychiatry: https://www.healthdirect.gov.au/australian-health-services/healthcare-service/bankstown-2200-nsw/bankstown-mental-health-consultation-liaison-psychiatry-service/psychiatry/560a0ba3-5e65-56d4-6da6-dfa9e80c9770 (now typed "Mental health services" 708168004; the URL slug is stale, the uuid resolves)
- Paediatrics: https://www.healthdirect.gov.au/australian-health-services/healthcare-service/wollongong-2500-nsw/teammed-medical-and-dental-clinic/children-s-medical-service/1c9be721-955e-66ab-95de-58344c7f889c
- O&G: https://www.healthdirect.gov.au/australian-health-services/healthcare-service/edgecliff-2027-nsw/dr-rahul-sen/obstetrics-and-gynaecology/6e9f96c7-3f17-726c-8058-bc8c7ab7ff5a

`props.pageProps.healthcareService` has exactly these 24 keys on all three pages (the schema is fixed; empty values are `[]`, `""`, `0`, `null` or `"unknown"`):

| Field | Type / example | Present on samples |
|---|---|---|
| `id` | NHSD HealthcareService uuid | all 3 |
| `organisation.name`, `organisation.id` | "Dr Rahul Sen", uuid | all 3 |
| `serviceType[]` | `{idRef: nhsd:/reference/taxonomies/snomed-servicetype/310060005, label: "Obstetrics and gynaecology"}` | all 3 (one entry each) |
| `description` | free text, provider-written | 2 of 3 (empty on Dr Sen). COPYRIGHT: do not store |
| `location.id`, `location.deliveryMethod` | uuid, `PHYSICAL` (other values exist: HOME-VISIT and VIRTUAL sitemaps) | all 3 |
| `location.physicalLocation` | `addressLine1..3`, `postcode`, `suburb.label`, `state.label`, `country`, `geocode.{latitude,longitude}` | all 3, geocoded |
| `location.facilities[]` | `{valueType.idRef: nhsd:/reference/common/facility/wheelchairAccess, label, value: "yes"}` — parking, toilets, wheelchair, baby change, accessible phones | paed sample: 7 entries; others empty |
| `location.allServiceTypes[]` | other services at same location | empty on all 3 |
| `contacts[]` | `{valueType.label: Phone|Email|Website, value, purpose.label: work, priority}` | phone on all 3; email + website on paed sample |
| `afterHoursContacts[]` | same shape | empty on all 3 |
| `calendar.weekdays[]` | `{day: MONDAY, timings: [{openFromRaw: "08:30:00", openToRaw: "20:30:00", alwaysOpen}]}` plus `holidays[]`, `todayHours`, `timezone` | all 3 |
| `weeklyCalendar.days[]` | next 7 dated days with `isOpenToday`, `isOpen24hrs`, `isSpecialHours`, `timings` | all 3 |
| `operationalStatus` | `currentStatus: OPEN|CLOSED`, `displayMessage: "Closes 5:00pm today"` (computed at render) | all 3 |
| `billingOptions[]` | `{valueType.idRef: nhsd:/reference/common/feeAndBillingOption/feesApply, label: "Fees apply for this service", value: "yes"}` (bulk billing etc. use sibling idRefs) | all 3 |
| `appointmentRequired` | bool | all 3 |
| `acceptsNewPatients` | `"unknown"` on all 3 (yes/no when set) | all 3 |
| `languages[]`, `practitionerLanguages[]` | empty on all 3 | schema present |
| `practitioners[]` | empty on all 3 (NHSD does attach practitioners to some services; none of our samples) | schema present |
| `appointment` | `{appointmentSlots: [], bookingProviders: [], vendorConnectionTimeouts, earliestAppointmentsInDays}` — online booking integration (HotDoc/HealthEngine style) when set | empty on all 3 |
| `bookingProviders[]` | empty | schema present |
| `characteristics[]`, `offerings[]`, `programs[]`, `appointments[]` | empty on all 3 | schema present |
| `priority`, `geoDistanceInMeters` | 0 / null on detail; distance populated in search results | - |

Also on the page: `sfSchema` — a schema.org `MedicalOrganization` JSON-LD graph with `PostalAddress`, `medicalSpecialty`, `additionalProperty` (facilities, billing) and `ContactPoint`. healthdirect publishes this expressly for machine consumption by search engines.

Not present anywhere on the page or in the JSON: a last-updated / last-verified date, provider number, AHPRA registration, Medicare item coverage, fees, telehealth flag as a field (telehealth is represented as `deliveryMethod: VIRTUAL` services in the VIRTUAL sitemap, not as an attribute of a physical service), wait times, referral requirements. The search also shows no "booking link" unless `appointment.bookingProviders` is populated.

Fields that matter for Wattle and are reliably populated: name, type (SNOMED), full address with geocode, phone, weekly hours, billing option, appointment-required flag, NHSD uuid. Fields that are sparsely populated on the public site: languages, practitioners, new-patient status, email/website, booking. The licensed NHSD feed is the only way to get those at scale.

---

## 4. Size estimates for Sydney and Melbourne

Because each search returns the nearest 30, the radius at which 30 is reached is a density measurement. Tiles run on 2026-10-15 (radius to reach 30 services, km):

| Tile | Psychiatry | Paediatrics | O&G (incl. children concepts) |
|---|---|---|---|
| Sydney 2000 | 4.3 | 5.5 | 3.5 |
| Bondi Junction 2022 | 7.3 | 6.3 | 3.3 |
| Chatswood 2067 | 6.9 | 9.8 | 3.0 |
| Parramatta 2150 | 13.9 | 9.4 | 11.4 |
| Liverpool 2170 | 21.3 | 16.3 | 15.0 |
| Melbourne 3000 | 3.5 | 5.5 | 2.5 |
| Richmond 3121 | 2.4 | 5.4 | 2.8 |
| Footscray 3011 | 7.0 | 8.2 | 7.3 |
| Box Hill 3128 | 8.8 | 8.0 | 9.2 |
| Dandenong 3175 | 18.8 | 14.1 | 17.2 |

Density = 30 / (pi r^2) per tile; estimate = median tile density x urbanised area (low) to mean tile density x urbanised area (high), with Sydney urbanised area taken as 1,700 to 4,000 km2 and Melbourne 2,000 to 2,900 km2. Inner tiles overlap each other heavily (the Sydney, Bondi Junction and Chatswood 30-sets will share services), so these are order-of-magnitude figures, not counts:

| | Sydney | Melbourne |
|---|---|---|
| Psychiatry services | ~300 to ~800 | ~400 to ~1,600 |
| Paediatric medical services | ~200 to ~650 | ~300 to ~550 |
| O&G family (O&G + obstetrics + gynaecology + urogyn + gyn-onc + pregnancy ultrasound) | ~1,300 to ~2,300 | ~350 to ~1,800 |

Cross-checks: the 2023 VIC-2 sitemap lists 126 psychiatry + 172 O&G + 63 gynaecology + 25 obstetrics detail pages for all of Victoria, and NSW-2 lists 53 psychiatry + 73 O&G + 22 gynaecology + 13 obstetrics. Those files are truncated and three years old, so they are a floor, and a low one. A proper count needs the tiling collection described in 2.3 (the Melbourne O&G range is wide because Richmond and the CBD overlap almost completely; Dandenong pulls the mean down). Note also that "services" are not "practitioners": a hospital O&G department, a private rooms address and a sonography clinic are each one service, and one specialist with two rooms is two services.

---

## 5. Recommendation

**Do not bulk-collect from the public site for the product. Collect a small, attributed seed set now for development, and wait for the NHSD licence for the production dataset.**

Reasoning:

1. The facts-not-copyright argument is sound for name/address/phone/hours/billing (IceTV, Telstra v Phone Directories), and robots.txt plus the published sitemaps and JSON-LD mean the pages are meant to be read by machines. Copyright is not the blocker.
2. The contract is the blocker. Three clauses are directly on point and we have read them: no commercial use, no derivative works, "You must not use the Online Services or any Information to sell a product or service". "Unless otherwise permitted by law" rescues the copyright position but does not rescue a breach of contract claim. The realistic downside is not damages, it is that healthdirect is the same organisation that grants the NHSD licence we want, and a scrape discovered during that negotiation ends it.
3. The public site is also the wrong source on quality: no last-updated date, languages/practitioners/new-patient status mostly empty, and `description` is copyright prose we would have to discard. The licensed FHIR feed (file 01) has all of these plus change tracking. Everything on the public site keys on NHSD uuids and SNOMED service-type ids, so nothing built against a seed set is wasted.

What to do now:

- Build the ingest against the `__NEXT_DATA__.props.pageProps.healthcareService` schema documented in section 3. It is the NHSD record shape, so the FHIR mapping later is field-for-field.
- For development and demos, fetch a seed of at most ~200 services (the 30-nearest sets for the 10 tiles above, deduped by uuid), store structured fields only (never `description`), keep the source URL and a "Source: healthdirect Service Finder, retrieved YYYY-MM-DD" attribution on every record, 1 request/second, self-identifying User-Agent. Treat it as disposable.
- In the licence application, disclose this evaluation (this file) and the seed. It shows good faith and that we understand their data model.
- If the licence is refused or stalls past the point where the product needs data, revisit: the fallback is a written request to healthdirect for permission under the "prior written permission" wording in the IP clause, citing non-alteration, attribution, and that we link every record back to its healthdirect page (the linking clause permits links that do not alter the Information). Only after a refusal of that request should a "facts not copyright" collection be considered, with legal advice, because at that point we would be relying on the contract being unenforceable against a party that has demonstrably read it.

---

## Sources

- https://www.healthdirect.gov.au/robots.txt (fetched 2026-10-15)
- https://www.healthdirect.gov.au/terms-of-use ("Last reviewed: August 2026")
- https://www.healthdirect.gov.au/australian-health-services (finder, Next.js build 2XUUcD2Fnt_qxIaAgxjyq)
- https://www.healthdirect.gov.au/australian-health-services/_next/static/chunks/pages/_app-e71252f4f536af6f.js (api base URL, `location?q=`)
- https://www.healthdirect.gov.au/australian-health-services/_next/static/chunks/pages/search/%5B...params%5D-3474d25b102b2ad2.js (`query.offset` paging)
- https://www.healthdirect.gov.au/australian-health-services/sitemaps/sitemap-index-health-services.xml and the NSW, NSW-2, VIC, VIC-2, all-services children
- Sample pages and searches listed in sections 3 and 4
- IceTV Pty Ltd v Nine Network Australia Pty Ltd [2009] HCA 14; Telstra Corporation Ltd v Phone Directories Company Pty Ltd [2010] FCAFC 149 (facts and machine-generated compilations)
