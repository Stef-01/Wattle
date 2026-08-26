# What the brief asked for that this company cannot yet truthfully say

The brief for this site specified the trust spine every large health-technology company
front-loads. **Wattle Technologies holds almost none of it.** This file is the complete list of
points where a real fact, a real certificate, or genuine community consultation must replace what
is here before launch.

Nothing on this list has been faked, stubbed, or rendered as a greyed-out badge. Where the brief
asked for a credential the company does not hold, the site publishes the *absence* at the weight
the badge would have had — `/approach` § "What we do not have", sourced from
`src/content/disclosures.ts`.

**Why this file exists rather than a placeholder:** the audience is commissioners and regulators.
A fabricated ISO 27001 mark or an invented patients-served counter aimed at that audience is not a
design placeholder awaiting real data — it is a misrepresentation, and for a health service it is
the kind that ends conversations.

---

## 1. Certifications and compliance marks — MUST NOT ship until held

| Brief asked for | Status |
| --- | --- |
| ISO 27001 badge | **Not held.** No audit undertaken. |
| SOC 2 badge | **Not held.** No audit undertaken. |
| HIPAA | Not applicable in Australia; the relevant regime is the Privacy Act and the APPs. |
| **Australian Privacy Principles compliance statement** | **Cannot be displayed.** Wattle Technologies has no corporate privacy policy. ADHD.ME's does not cover the parent. |
| TGA status | **Unresolved.** Whether any part of the product is a regulated medical device is undetermined; the product name itself awaits an Ahpra advertising review. |
| My Health Record interoperability | **Not built, not commenced.** |

A badge is a claim about an audit somebody performed. Do not render one before the certificate
exists.

## 2. Evidence and scale — MUST NOT be invented

| Brief asked for | Status |
| --- | --- |
| Network-scale counter (clinics, patients served, hospitals) | **Zero.** No patient has been matched through a live service. A counter here would read `0`, or lie. |
| Published outcomes data | **None.** |
| Case studies | **None.** No live deployment to write one about. |
| Media mentions / newsroom / press releases | **None.** |
| Client or partner logos | **None.** |
| Testimonials | **None.** |

The `Impact & Evidence` and `Newsroom/Insights` pages in the brief's architecture are **not built**,
deliberately. An empty section advertises a gap and calls it a section.

## 3. People and governance

| Brief asked for | Status |
| --- | --- |
| Named clinical / scientific advisory board | **Not constituted.** Stated as absent on `/company`. Clinicians build the product; that is not an advisory board and is not described as one. |
| Leadership team with headshots and credentials | **Partially real.** Vikram Ganeshalingam and Stefan Thottunkal, with founder-supplied portraits and affiliations transcribed from ADHD.ME. No role titles invented. |
| Careers page with open roles | **No roles, no process.** `/contact` says so plainly rather than showing an empty jobs board. |
| Investor data room / partner request flow | **Does not exist.** No form ships without a privacy notice behind it. |
| ABN/ACN, registered office, incorporation date, insurance, clinical governance, complaints route | **All outstanding.** Enumerated in `src/content/company.ts` → `UNCONFIRMED`. |

## 4. First Nations — REQUIRES CONSULTATION BEFORE LAUNCH

The site carries a **general** Acknowledgement of Country in the footer (`app/acknowledgement.tsx`).

- It is an **Acknowledgement**, which anyone may make — not a Welcome to Country, which is given by
  Traditional Owners. The wording says so.
- **It is general, and general is the correct placeholder.** A specific acknowledgement naming the
  Country the company actually works on should replace it, *written in consultation with those
  Traditional Owners rather than assumed.* **This consultation has not happened.**
- **No Indigenous iconography is used anywhere, deliberately.** Dot-work, concentric meeting-place
  circles and similar belong to Aboriginal and Torres Strait Islander artists and are not ours to
  imitate as decoration. The Australian Indigenous Design Charter asks for Indigenous-led design
  input for work representing Indigenous people or culture; **nobody has provided that here**, so
  the band carries words and nothing else.
- Any future imagery, and any claim about closing the access gap for Aboriginal and Torres Strait
  Islander people, **must be Indigenous-led and community-specific.** Do not add stock imagery of
  Indigenous people under any circumstances.

## 5. CALD and language access — REQUIRES REAL TRANSLATION

- The site is **English only**. No language toggle ships, because there is nothing to toggle to.
- Machine-translating a health company's site into Mandarin, Arabic, Vietnamese, Punjabi or
  Cantonese would be **worse than leaving it in English** — an inaccurate health page in somebody's
  first language invites reliance it cannot support.
- This is a real obligation, not a nicety: the product matches people on **the language their
  clinician speaks**. An English-only company site behind it is a gap the company owns, stated on
  `/accessibility`.
- Before launch: commission human translation of at least `/` and `/contact`, and a plain-language
  version, with community review.

## 6. Accessibility — TESTED IN PART, NOT CONFORMANT

`/accessibility` states the target as WCAG 2.2 AA and **does not claim conformance to it**, because
conformance is a measured result and no audit has been done.

**Enforced mechanically:** colour contrast (build-failing gate), reduced motion, relative units to
320px, keyboard access, heading order, landmarks, alt text.

**Not verified — must happen before launch:**
- Screen-reader testing end to end with NVDA, JAWS and VoiceOver **by people who use them**.
- Usability testing **with people with disability**. None commissioned. Nothing here has been
  reviewed by the people it most affects.
- An independent WCAG 2.2 AA audit, if conformance is to be claimed at all.

## 7. Representation and imagery

The brief asks for imagery spanning age, ability, gender, and regional/urban settings, reflecting
Australia's actual demographic composition.

**No such imagery exists and none has been generated.** The only photographs on this site are two
founder-supplied portraits. Nothing in this tree generates a face for a real person, and stock
photography chosen to *represent* diversity — rather than documenting real users — is the tokenism
the brief itself warns against. Commission real photography of real users, with consent, or ship
none. Today it ships none.

## 8. Schema.org

`MedicalOrganization` was asked for "where applicable" and **is not applicable**. Wattle Technologies
writes software; it does not provide medical care. Claiming a medical schema type to a search engine
is the machine-readable version of holding yourself out as a health service. The site declares
`Organization` with ADHD.ME as a `brand`.

---

## Performance

Met, and cheaply: all routes prerender static, first-load JS ~102 kB shared, no animation runtime,
no web fonts beyond two self-hosted variable faces, scroll animation via native
`animation-timeline` rather than JS. Portraits were re-encoded from 1.8 MB of PNG to 212 kB of JPEG
for the regional-bandwidth requirement.

**Not measured:** real Core Web Vitals against the LCP < 2.5s / INP < 200ms / CLS < 0.1 targets.
That needs a deployed URL and field data, and there is no deployment.

## Cultural content on the gate — NOT REVIEWED BY THE PEOPLE IT CONCERNS

`src/content/emblem.ts` carries a paragraph on Aboriginal and Torres Strait Islander use of
acacias: seed as food, gum and bark in medicine, hardwood for implements, flowering read as a
seasonal marker. It was written to a deliberate constraint — state broadly documented practical
use, name the plurality, and decline to offer a symbolism.

**What was avoided, and why.** The obvious sentence is "to Aboriginal people the wattle
symbolises X". There are hundreds of distinct First Nations on this continent and roughly a
thousand Acacia species; there is no shared meaning to report. A single symbolic claim would be
the pan-Indigenous flattening the Australian Indigenous Design Charter names as harm, and it
would be a healthcare company asserting cultural authority nobody granted it.

**What is still outstanding.** Nothing here has been read by an Aboriginal or Torres Strait
Islander reviewer. Broadly documented is not the same as appropriate to publish, and the judgement
about whether a company that sells health software should be narrating this at all is not ours to
make alone. Before launch this needs Indigenous-led review, and if that review says cut it, it is
cut rather than softened.
