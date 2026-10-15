# 03 — Allied health disciplines in Australia: registers, directories, counts, gaps

Research for Wattle Health (patient-first provider directory). Date: 2026-10-15. Every count and access claim below was checked against a live page in this session; items marked **(unverified)** could not be fetched (timeouts or search budget) and need a second pass.

## 1. The regulatory split in one table

Australia has two regimes. Sixteen professions are registered under the National Registration and Accreditation Scheme (Ahpra + 15 National Boards). Everything else is self-regulated through professional associations, with the National Alliance of Self Regulating Health Professions (NASRHP) as the quality-standard umbrella for the larger ones.

| Regime | Professions | Public register | Bulk / API |
|---|---|---|---|
| Ahpra (statutory) | Psychology, OT, physio, podiatry, chiro, osteo, optometry, pharmacy, dental (5 divisions), nursing & midwifery, Chinese medicine, paramedicine, ATSIHP, medical radiation, medical, (plus dental/medical specialties) | One national Register of Practitioners, free web lookup | Contracted only: PIE API (lookup by reg. number, approved orgs, 24h refresh) or Data Use Agreement extract at **$2,000 per board per point in time**, Excel over SFTP; screen scraping explicitly not permitted ([Ahpra external data exchange](https://ahpra.gov.au/Registration/Employer-Services/External-data-exchange-services.aspx); [Register extract/copy](https://www.ahpra.gov.au/Registration/Employer-Services/External-data-exchange-services/National-Register-Copy-or-Extract.aspx); [Ahpra on scraping](https://medicalboard.gov.au/News/2015-02-17-websites-using-information.aspx)) |
| NASRHP self-regulated | Audiology, dietetics, exercise physiology, social work, speech pathology, orthotics/prosthetics, genetic counselling, music therapy, arts therapy, perfusion, rehabilitation counselling, sonography; counselling (PACFA progressing to full membership, April 2024) | Association "find a" directories; opt-in, self-maintained, unverified | None public; terms vary |
| Unregulated | Naturopathy, western herbal medicine, massage, etc. | Voluntary association lists (e.g. ARONAH for naturopaths) | None |

Sources: [ACT Government allied health list of NASRHP professions](https://www.act.gov.au/health/types-of-health-care-roles/allied-health/about-allied-health); [ESSA on NASRHP founding members](https://essa.org.au/Public/News_Room/Media_Releases1/2023/To_be_or_not_to_be_self_regulated.aspx); [PACFA NASRHP membership](https://pacfa.org.au/Portal/News-and-Advocacy/news/2024/PACFA-progresses-towards-full-membership-with-NASRHP.aspx).

**Ahpra totals:** 959,858 registrants at 30 June 2025, +4.3% ([Ahpra annual report news, 14 Nov 2025](https://www.ahpra.gov.au/News/2025-11-14-Annual-report-highlights-workforce-growth.aspx)). Ahpra register fields (per [Terms in the register](https://www.ahpra.gov.au/Registration/Registers-of-Practitioners/Terms-in-the-register.aspx)): profession, division, registration number/status/type/subtype, expiry, first-registration date, principal place of practice, qualifications, endorsement (+subtype), specialty, **spoken languages**, conditions, notations, reprimands, suspensions, undertakings. The register "does not include contact or sensitive information (such as mailing addresses or email addresses)" ([Ahpra extract page](https://www.ahpra.gov.au/Registration/Employer-Services/External-data-exchange-services/National-Register-Copy-or-Extract.aspx)). Principal place of practice is suburb/postcode level, not a street address, so Ahpra alone cannot place a practitioner at a clinic.

## 2. Discipline-by-discipline

Counts are Board 2024/25 annual summaries (30 June 2025) unless stated. Association directory sizes are stated only where a page showed a number.

### 2.1 Psychology
- **Regulation:** Psychology Board of Australia (Ahpra). **50,409 psychologists** 2024/25; 3,740 first-time registrants ([Board annual report page](https://www.psychologyboard.gov.au/About/Annual-report.aspx)). Area-of-practice endorsements (clinical, counselling, etc.) are on the public register entry but endorsement totals are only in the Board's data tables ([statistics page](https://www.psychologyboard.gov.au/About/Statistics.aspx), latest quarter June 2026 posted 12 Oct 2026).
- **Directories:** APS Find a Psychologist (members of APS only; standard listings searchable by name/location, premium by issue/therapy; refine by language; profiles show telehealth and Medicare provider status; PsychEngage booking) ([APS about](https://psychology.org.au/find-a-psychologist/about); [2018 APS note on listing tiers](https://psychology.org.au/for-members/publications/inpsych/2018/feb/increase-in-online-find-a-psychologist-service-sea)). AAPi has its own public Find a Psychologist ([aapi.org.au directory](https://aapi.org.au/Shared_Content/Smart-Suite/Smart-Maps/Public/Find-a-Psychologist.aspx)). The APS directory T&Cs page carries disclaimers but no explicit anti-scraping clause; the site-wide terms were not fetched ([APS T&Cs](https://psychology.org.au/find-a-psychologist/terms-and-conditions)).
- **Money:** Better Access rebate from 1 July 2025: $145.25 clinical psychologist, $98.97 general psychologist, $87.24 accredited social worker; cap 10 sessions/yr; APS suggested fee $318 for 46–60 min ([Talked rebate summary](https://www.talked.com.au/blog/medicare-rebate-for-psychology-sessions); [APS what it costs](https://psychology.org.au/psychology/about-psychology/what-it-costs); [APS on the 10-session cap](https://psychology.org.au/Insights/It%E2%80%99s-time-to-increase-the-cap-of-10-Medicare-rebat)). Gap ~$170/session at the suggested fee.
- **Patient gaps:** fees, bulk-billing, waitlist, NDIS registration, and endorsement are not in any one place. Ahpra gives endorsement + languages; APS/AAPi give telehealth + Medicare flag; nobody publishes fees or wait times.

### 2.2 Occupational therapy
- OT Board: **34,423**, +7.4% ([OT Board annual summary](https://www.occupationaltherapyboard.gov.au/News/Annual-report.aspx)). Fastest-growing Ahpra allied profession (NDIS demand).
- Directory: OTA Find an OT (members only) ([otaus.com.au/find-an-ot](https://www.otaus.com.au/find-an-ot)). OTs are Better Access and CDM eligible.
- Gaps: NDIS registration status, paediatric vs adult, home-visit, driver assessment.

### 2.3 Physiotherapy
- Physiotherapy Board: **47,761**, +6.4% ([Physio Board annual summary](https://www.physiotherapyboard.gov.au/News/Annual-report.aspx)).
- Directory: APA "Find a physio" via choose.physio, members only ([healthdirect partner page for APA](https://healthdirect.gov.au/partners/australian-physiotherapy-association); [australian.physio](https://australian.physio/)).
- Fees: a regional study found $258–$302 out of pocket for an assessment plus three follow-ups, no bulk billing in any practice ([ANU repository study](https://openresearch-repository.anu.edu.au/items/cd462dd7-d6cc-4797-90e9-13823081be8a)). WorkCover/Comcare publish scheduled rates ([WorkCover Qld fees Aug 2025](https://www.workcoverqld.com.au/news-and-events/news/2025/updated-allied-health-fees-effective-1-august-2025); [Comcare rates](https://www.comcare.gov.au/service-providers/medical-allied-health/treatment-rates)).

### 2.4 Speech pathology
- Self-regulated; SPA Certified Practising Speech Pathologist (CPSP). SPA ~14,000 members, ~70% of the profession ([SPA 2024 advertising kit](https://www.SpeechPathologyAustralia.org.au/common/Uploaded%20files/Publications/SPA%20Publications%20Advertising%20kit%20-%202024.pdf)).
- Directory: SPA find-a-speech-pathologist / telepractice listing: **2,329 items** on the telepractice list, filters for client age, area of practice, practice type, **funding (Medicare, NDIS registered/non-registered, DVA, PHI, WorkCover)** and **languages (incl. Auslan)**; name + partial address shown, no phone/email; "not verified by SPA" ([SPA telepractice listing](https://www.speechpathologyaustralia.org.au/Public/Shared_Content/TelePractice/Telepractice-Listing.aspx)). Best-structured allied directory found, but opt-in only.

### 2.5 Dietetics
- Self-regulated; APD credential is the only one recognised for Medicare/DVA ([healthdirect dietitians](https://www.healthdirect.gov.au/dietitians)).
- Directory: DA Find a Dietitian (location + telehealth filters; "does not review or verify information in this directory"); separate APD register for status checks ([DA find a dietitian](https://dietitiansaustralia.org.au/find-dietitian)). Member/APD counts **(unverified)**.

### 2.6 Podiatry
- Podiatry Board: **6,210**, +1.2% ([Podiatry Board annual summary](https://www.podiatryboard.gov.au/News/Annual-report.aspx)).
- Directory: APodA Find a Podiatrist by postcode, filter by special interest; members share email ([podiatry.org.au/find-a-podiatrist](https://podiatry.org.au/find-a-podiatrist)).

### 2.7 Chiropractic
- Chiropractic Board: **6,770**, +3.7% ([Chiro Board annual report](https://www.chiropracticboard.gov.au/About-the-Board/Annual-report)).
- Directory: ACA Find a Chiropractor, "Australia's largest chiropractor database" of ACA members (ACA >3,000 members) ([chiro.org.au/find-a-chiropractor](https://www.chiro.org.au/find-a-chiropractor/); [ACA about](https://www.chiropractors.org.au/about-us)).

### 2.8 Osteopathy
- Osteopathy Board: **3,646**, +3.4% ([Osteo Board annual summary](https://www.osteopathyboard.gov.au/News/Annual-report.aspx)).
- Directory: Osteopathy Australia Find an Osteo (members) ([osteopathy.org.au/find-an-osteo](https://www.osteopathy.org.au/find-an-osteo)).

### 2.9 Exercise physiology
- Self-regulated; ESSA ~11,000 members incl. students, four accreditation types; AEPs are CDM and DVA eligible ([ESSA about](https://www.essa.org.au/Public/ABOUT_ESSA/Who_we_are.aspx)).
- Directory: ESSA map/name search covers AEP, AES, ASpS; separate accreditation-check tool ([essa.org.au/Maps](https://essa.org.au/Maps); [SearchByName](https://essa.org.au/SearchByName)). AEP-only count not published.

### 2.10 Social work
- Self-regulated; AASW **>18,400 members** ([aasw.asn.au](https://www.aasw.asn.au/)). Accredited Mental Health Social Workers (AMHSW) are Medicare Better Access providers.
- Directory: Find a Social Worker, opt-in, searchable by name/location/service with **funding filters** (MBS FPS, MBS eating disorders, MBS CDM, NDIS, DVA, Open Arms, Bupa, workers comp, EAP, self-funded) ([AASW find a social worker](https://www.aasw.asn.au/find-a-social-worker/by-name/search/)). No AMHSW, telehealth, language or fee filter on the search page.

### 2.11 Counselling and psychotherapy
- Self-regulated; ARCAP is the joint PACFA/ACA national register (Division A PACFA: Clinical/Provisional/Mental Health Practitioner; Division B ACA: Levels 1–4); search is by state only ([arcapregister.com.au](https://www.arcapregister.com.au/); [PACFA on ARCAP](https://pacfa.org.au/Portal/About/PACFA%20Partners/ARCAP.aspx)). PACFA: >6,000 registrants and 11,000 members at 30 June 2025 ([PACFA annual report 2024-25](https://www.pacfa.org.au/common/Uploaded%20files/PCFA/Documents/Documents%20and%20Forms/PACFA%20Annual%20Report%20202425.pdf)). ACA Find a Counsellor ([theaca.net.au/find-a-counsellor](https://theaca.net.au/find-a-counsellor)); ACA member count **(unverified)**.
- Counsellors have no Medicare item; government has issued National Standards and engaged Nous on regulatory models ([PACFA presentation, Mar 2026](https://pcfa.imiscloud.com/common/Uploaded%20files/PCFA/PACFA%20PRESENTATION%20National%20Standards%20Regulatory%20Options%20-%20FINAL.pdf)). Patient gap: "will this cost me the full fee" is the key fact and no directory states it.

### 2.12 Audiology and hearing
- Self-regulated; Audiology Australia 3,400+ community; Find an Audiologist directory ([audiology.asn.au/find-an-audiologist](https://audiology.asn.au/find-an-audiologist/)). ACAud is the second body **(unverified this session)**.
- Government: Hearing Services Program locator, search by suburb/postcode/provider, 20 results, "more than 380 providers in over 3,000 locations" (2026 client booklet) ([HSP find a provider](https://www.health.gov.au/our-work/hearing-services-program/accessing/find-provider); [client booklet 2026](https://www.health.gov.au/sites/default/files/2026-05/hearing-services-program-client-information-booklet.docx)). HSP accreditation is the patient-relevant flag (free/subsidised devices); not all clinics are HSP-contracted.

### 2.13 Optometry and orthoptics
- Optometry Board: **7,340**, +4.1% ([Optometry Board annual summary](https://www.optometryboard.gov.au/News/Annual-report.aspx)); scheduled-medicines endorsement is a register field. Optometry Australia Find an Optometrist (members, with specialist-society fellows noted) ([optometry.org.au/find-an-optometrist](https://www.optometry.org.au/find-an-optometrist/)); OA once noted only ~2,181 optometrists listed in NHSD vs >5,000 registered ([OA on NHSD](https://www.optometry.org.au/workplace/registering-on-directory-could-boost-referrals/)).
- Orthoptics: not Ahpra; Australian Orthoptic Board keeps the register, Better Health directs patients to it ([Better Health orthoptist](https://betterhealth.vic.gov.au/health/serviceprofiles/orthoptist-service)); workforce ~600–814 ([Orthoptics Australia, 2016 census figure](https://www.orthoptics.org.au/about-orthoptics/career-in-orthoptics)). No consumer directory found; the board site did not resolve (**unverified**).

### 2.14 Prosthetics and orthotics
- Self-regulated (AOPA, NASRHP founding member). AOPA findapractitioner directory and a Find an O&P Provider page ([aopa.org.au/findapractitioner](https://www.aopa.org.au/findapractitioner)). Count not stated.

### 2.15 Music and arts therapy
- AMTA directory lists "most (but not all) of the 900 registered music therapists" ([AMTA find an RMT](https://www.austmta.org.au/find-an-rmt/directory)). ANZACATA Find a Therapist, professional members only ([anzacata.org/Find-a-Therapist](https://anzacata.org/Find-a-Therapist)). Both are NDIS-relevant; neither shows NDIS registration or fees.

### 2.16 Genetic counselling
- HGSA Register of Genetic Counsellors; directory searchable by name, state and supervision availability; results show status (FHGSA/MHGSA/Registered Non-Member/Lapsed…) ([HGSA RGC directory](https://www.hgsa.org.au/Web/Register-of-Genetic-Counsellors/RGC-Directory.aspx)); plus a clinical genetics services directory by state ([HGSA CGS directory](https://hgsa.org.au/Web/Consumer-resources/Directory-CGS.aspx)). Built for professionals, not patients; no location/contact detail.

### 2.17 Pharmacy
- Pharmacy Board: **40,913 pharmacists**, +6.0% ([Pharmacy Board annual report](https://www.pharmacyboard.gov.au/About/Annual-report)).
- Premises: Pharmacy Guild Find a Pharmacy, "over 5,800 community pharmacies" ([findapharmacy.com.au about](https://findapharmacy.com.au/about-guild)); Westpac/Guild 2026 report says >6,000 ([Westpac insights](https://www.westpac.com.au/content/dam/public/wbc/documents/pdf/bb/Industries/wbc_community_pharmacy_insights.pdf)). Patient gaps: opening hours, vaccination, scope-of-practice prescribing (UTI/OCP), languages, home delivery. Pharmacy premises are also state-registered (pharmacy authorities), a cleaner premises source than the Guild list.

### 2.18 Dental
- Dental Board: **28,406** dental practitioners, +3.0%; divisions dentist 74.4%, oral health therapist 12.5%, hygienist 7.0%, prosthetist 4.6%, therapist 3.7% (multi-division overlap) ([Dental Board annual summary](https://www.dentalboard.gov.au/News/Annual-report.aspx)).
- ADA Find a Dentist (members only, "purely a directory service") ([ada.org.au](https://ada.org.au/); [teeth.org.au terms](https://teeth.org.au/terms-and-conditions)); ADA pushes members to keep NHSD listings current, ~130,000 dental searches on healthdirect in 2025 ([ADA on NHSD](https://ada.org.au/keep-your-service-information-up-to-date-in-the-national-health-services-directory-nhsd)).
- Public dental: state eligibility is concession-card based; median general waits (2022-23/2023-24) ~305 d NSW, 302 Vic, 517 Qld, 206 SA, 1,366 Tas, 230 WA, 912 NT ([iSelect summary of AIHW](https://www.iselect.com.au/?p=58095); [Vic non-urgent wait list policy Aug 2025](https://app.pr-399.health-vic-gov-au.sdp4.sdp.vic.gov.au/sites/default/files/2025-08/non-urgent-wait-list-policy-august-2025.docx)). Wait times by clinic are a high-value, unserved patient field.

### 2.19 Nursing and midwifery
- NMBA 2024/25: **498,273 nurses** (416,605 RN, 69,687 EN, 11,981 dual), 523,845 incl. dual midwives; **3,194 nurse practitioners**; **1,506 midwives with scheduled-medicines endorsement** (the Medicare-eligible private-practice cohort) ([NMBA annual summary](https://www.nursingmidwiferyboard.gov.au/News/Annual-report)). Designated RN prescriber endorsement live from 30 Sept 2025 ([NMBA endorsements](https://www.nursingmidwiferyboard.gov.au/registration-and-endorsement/endorsements-notations)).
- No ACM consumer directory found on midwives.org.au ([ACM home](https://www.midwives.org.au/)); midwivesaustralia.com.au runs a separate Find a Midwife (state/practice-type filters) ([midwivesaustralia find a midwife](https://www.midwivesaustralia.com.au/?p=416)). ACNP NP directory **(unverified)**. Practice nurses are invisible in every register (employed, not listed).

### 2.20 Chinese medicine and acupuncture
- CMBA: **4,898**, +0.9%; acupuncturist 98.3%, herbal medicine 64.6%, herbal dispenser 27.3% (overlapping) ([CMBA annual summary](https://www.chinesemedicineboard.gov.au/News/Annual-report.aspx)). AACMA Find a Practitioner, >2,000 members ([acupuncture.org.au/find-a-practitioner](https://www.acupuncture.org.au/find-a-practitioner)).

### 2.21 Paramedicine
- **26,603**, +5.0% (843 non-practising) ([Paramedicine Board annual summary](https://www.paramedicineboard.gov.au/News/Annual-report.aspx); [PC RoGS 2026](https://www.pc.gov.au/ongoing/report-on-government-services/2025/health/ambulance-services)). Mostly employed by state ambulance services; low directory value except community/urgent-care paramedics.

### 2.22 Aboriginal and Torres Strait Islander Health Practitioners
- **1,028**, +5.8% ([ATSIHP Board annual summary](https://www.atsihealthpracticeboard.gov.au/News/Annual-report.aspx)). Almost all work inside ACCHOs; the directory unit should be the ACCHO service, not the practitioner.

### 2.23 Medical radiation practice
- **20,626**, +3.9%; diagnostic radiographer 79.1%, radiation therapist 14.4%, nuclear medicine 6.6% ([MRPBA annual summary](https://www.medicalradiationpracticeboard.gov.au/News/Annual-report.aspx)). Patients choose imaging sites, not practitioners; collate at premises level (bulk-billing imaging is the patient question).

### 2.24 Lactation consultants, diabetes educators, sleep
- LCANZ Find a Lactation Consultant (IBCLC members, by postcode); IBLCE verifies certification ([LCANZ via SWSPHN](https://healthchat.swsphn.com.au/ansc/news_feed/accessing-lactation-consultant-support-for-your-patients)).
- ADEA Find a CDE: only CDEs who opted to share contact details; "ADEA does not verify"; asterisk = under investigation ([adea.com.au](https://adea.com.au)). CDEs are CDM item 10951 providers.
- Sleep: no consumer finder; NATA/ASA accreditation (73 services as of 2020, 4-year cycle) is searchable per organisation on NATA ([ASA accreditation](https://sleep.org.au/Public/Resource-Centre/ASA-NATA.aspx); [NATA example](https://nata.com.au/accredited-organisation/sleep-service-21204-25520/)).

### 2.25 Naturopathy and other unregulated modalities (decision)
- No statutory or NASRHP regulation; ARONAH is a voluntary register ([Better Health naturopath](https://betterhealth.vic.gov.au/health/serviceprofiles/naturopath-service)). From 1 July 2025 insurers may again cover naturopathy, western herbal medicine, yoga, Pilates, tai chi, shiatsu, Alexander technique ([SCU on rebates restored](https://www.scu.edu.au/news/2025/private-health-insurance-rebates-restored-for-natural-therapies/); [Natural Therapies Review](https://www.health.gov.au/topics/private-health-insurance/reforms/natural-therapies-review)).
- **Recommendation:** exclude from launch. There is no verifiable credential to display, and listing them beside Ahpra professions dilutes the "verified" promise. Revisit if a patient-facing credential (ARONAH) becomes checkable.

## 3. Count summary (30 June 2025 unless noted)

| Discipline | Count | Source |
|---|---|---|
| Nurses (by division) | 498,273 | NMBA |
| Psychologists | 50,409 | PsyBA |
| Physiotherapists | 47,761 | PhysioBA |
| Pharmacists | 40,913 | PharmBA |
| Occupational therapists | 34,423 | OTBA |
| Dental practitioners | 28,406 | DBA |
| Paramedics | 26,603 | ParaBA |
| Medical radiation | 20,626 | MRPBA |
| Optometrists | 7,340 | OBA |
| Chiropractors | 6,770 | CBA |
| Podiatrists | 6,210 | PodBA |
| Chinese medicine | 4,898 | CMBA |
| Osteopaths | 3,646 | OsteoBA |
| Nurse practitioners | 3,194 | NMBA |
| Endorsed midwives | 1,506 | NMBA |
| ATSIHP | 1,028 | ATSIHPBA |
| Speech pathologists (SPA members) | ~14,000 | SPA |
| Social workers (AASW members) | >18,400 | AASW |
| PACFA registrants | >6,000 | PACFA |
| ESSA members (all types) | ~11,000 | ESSA |
| Music therapists | ~900 | AMTA |
| Community pharmacies | 5,800–6,000+ | Guild/Westpac |
| NDIS registered providers | 21,387 (Dec 2024) | [NDIS Commission Q2 2024-25](https://www.ndiscommission.gov.au/sites/default/files/2025-04/ndisqsc-quarterly-performance-report-q2-2024-25.pdf) |

## 4. Cross-cutting patient data gaps

| Field | Who publishes it | Verdict |
|---|---|---|
| Registration, endorsement, conditions, languages | Ahpra register (statutory professions only) | Only trustworthy source; contracted access |
| Practice address/phone | Association directories (opt-in), NHSD, booking platforms | Fragmented; NHSD is licensed, not open ([NHSD](https://about.healthdirect.gov.au/what-we-do/portfolio/nhsd); [data.gov.au 2025 snapshot, licence "Not Specified", academic access only](https://data.gov.au/data/dataset/8114fd8c-95ae-4d2a-bb64-e5e474a6ea71)). June 2026 release adds practitioner profiles ([RDA record](https://researchdata.edu.au/healthdirect-nhsd-services-june-2026/4136231)) |
| Fees / bulk billing | Nobody | Biggest gap; only suggested-fee schedules exist |
| Medicare eligibility (CDM 10950–10970, 5/yr; Better Access 10/yr) | Program rules, not provider-level | Derivable: Ahpra profession + credential (APD/AEP/AMHSW/CDE) ([CDM items](https://www.health.gov.au/resources/publications/chronic-disease-individual-allied-health-services-mbs-items-10950-10970)) |
| NDIS registration | NDIS Commission register (search only; CSV only for SIL/platform applicants) ([NDIS register](https://www.ndiscommission.gov.au/provider-registration/find-registered-provider)) | Registration is at provider-org level, not practitioner; 46k-row commercial lists circulate but are unverified |
| Telehealth | APS, DA, SPA directories | Opt-in flags only |
| Waitlists | Nobody (public dental aggregate only) | Must be crowdsourced or practice-supplied |
| Specialisations | SPA, APS premium, APodA, HGSA | Patchy; Ahpra endorsements are the only verified layer |

## 5. How to collate comprehensively and lawfully

1. **Spine = Ahpra Data Use Agreement extracts.** Budget ~$2,000 per board per snapshot (15 boards ≈ $30k per refresh; extracts can be narrowed by jurisdiction and are shareable subject to the agreement; full "copies" are public-interest only and non-shareable). This yields registration number, status, endorsements, principal place of practice (suburb), languages. Do not scrape; Ahpra has shut down scrapers ([2015 media statement](https://www.ahpra.gov.au/News/2015-04-17-media-statement.aspx)). Use PIE API for ongoing status monitoring once you hold registration numbers (24h refresh).
2. **Premises and contact = provider-supplied via Provider Connect Australia** (free ADHA service; practices publish to chosen business partners; delimited-file download; Participation Agreement + Information Use Statement) ([PCA business partner guide](https://www.digitalhealth.gov.au/healthcare-providers/initiatives-and-programs/provider-connect-australia/provider-connect-australia-register/register-as-a-business-partner/receive-information-from-healthcare-provider-organisations/view-published-information)). Register Wattle as a PCA business partner; this is the lawful, consented channel Ahpra and ADHA built for exactly this.
3. **NHSD licence** for the long tail of services (public dental clinics, ACCHOs, imaging, hospitals). Licence agreement with Healthdirect; FHIR R4 API ([developer guide](https://media.healthdirect.org.au/publications/NHSD_Developer-Guide.pdf)).
4. **Self-regulated professions = association partnerships, not scraping.** Every directory found (APS, SPA, DA, AASW, ADEA, AMTA) is opt-in and carries "not verified" disclaimers; several forbid unsolicited contact. Negotiate data-sharing or claim-your-profile flows; for credential verification point at the association's check tool (ESSA accreditation check, DA APD register, IBLCE, HGSA status).
5. **NDIS**: query the Commission register per provider ABN for status and registration groups; do not buy compiled lists.
6. **Patient fields nobody has (fees, waits, bulk-billing, availability)** must come from practitioners claiming profiles plus patient reports. Build the claim flow first; the registers give you the frame, not the picture.
7. **Privacy**: Ahpra and association data are practitioner professional data, still "personal information" under the Privacy Act; collect only from the contracted channels above, honour the Data Use Agreement purpose limits, and give practitioners a correction/removal path.

## 6. Open items (not verified this session)
Services Australia CDM provider-eligibility page, HSP locator page, NDIS register field list, PCA Ahpra-register-data appendix, Dietitians Australia/AASW/ACA/ACAud/ACNP counts, Australian Orthoptic Board register, endorsement totals for psychology and optometry (in Board data tables). Search budget was exhausted; these are single fetches each.
