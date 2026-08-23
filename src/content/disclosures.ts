/**
 * WHAT A HEALTH-TECHNOLOGY COMPANY IS EXPECTED TO SHOW, AND WHAT THIS ONE ACTUALLY HAS.
 *
 * The brief for this site asked for the trust spine every large health-tech company front-loads:
 * ISO 27001 and SOC 2 badges, a named clinical and scientific advisory board, published outcomes
 * data, network-scale counters, a newsroom, an investor data room, TGA status, My Health Record
 * interoperability, and a CALD language toggle.
 *
 * WATTLE TECHNOLOGIES HOLDS NONE OF THEM. Every item below is a real expectation and a real
 * absence. Rendering any of them as a badge or a counter would be a false statement to exactly
 * the audience — commissioners and regulators — that this site exists to satisfy, and a
 * fabricated certification mark is not a design placeholder, it is a misrepresentation.
 *
 * So the site publishes the absence instead, at the same weight it would have published the
 * badge. `PENDING` is rendered on /approach; nothing here is dressed up as a credential.
 *
 * Each entry is written so that the day it becomes true, it is deleted from this list and moved
 * into the site as a fact with its source attached.
 */

export interface Disclosure {
  item: string;
  state: string;
}

export const PENDING: ReadonlyArray<Disclosure> = [
  {
    item: "Information-security certification",
    state:
      "No ISO 27001 or SOC 2 audit has been undertaken. We hold no certificate and display no badge.",
  },
  {
    item: "Clinical and scientific advisory board",
    state:
      "Not constituted. Clinicians are involved in building the product, which is not the same thing as an advisory board, and we will not describe it as one.",
  },
  {
    item: "Published outcomes data",
    state:
      "None. No patient has been matched through a live service, so there is no outcome to report and no case study to write.",
  },
  {
    item: "Therapeutic Goods Administration status",
    state:
      "Unresolved. Whether any part of what we build is a regulated medical device has not been determined, and the product's own name is awaiting an Ahpra advertising review.",
  },
  {
    item: "My Health Record interoperability",
    state: "Not built and not commenced.",
  },
  {
    item: "Translated content",
    state:
      "The site is English only. Our matching runs on the language a clinician speaks, so translating this site is a real obligation rather than a nicety — it is not done, and a machine-translated health page would be worse than an untranslated one.",
  },
  {
    item: "Company legal and governance record",
    state:
      "ABN, registered office, corporate privacy policy and terms, insurance, clinical governance and a complaints route are all outstanding. See src/content/company.ts.",
  },
];

/** The one commitment the company can make about the list above, and does. */
export const PENDING_PROMISE =
  "Each of these is a thing you are entitled to ask a health-technology company for, and each one we do not have. When one becomes true it will appear on this site with its source attached, and it will leave this list. Until then this page is the honest answer.";
