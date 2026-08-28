/**
 * THE VENTURE REGISTER.
 *
 * One entry today. A list rather than a hand-written "our product" page because the second
 * entry is what breaks a hand-written one, and because a venture that is not live yet must be
 * able to sit here with `status: "building"` and no claims attached to it.
 *
 * EVERY LINE IS TRANSCRIBED FROM THE ADHD.ME TREE — its public copy, its coverage map and its
 * compliance suite — and re-checked against that tree on 2026-08-23. Nothing was upgraded on
 * the way across: "indicative" stayed indicative and the open decisions stayed open. When the
 * product moves, this file is what goes stale, so check it against the source rather than
 * against memory.
 */

/* "scoping" is earlier than "building" and the distinction is load-bearing: a venture in build
   has something running, and one in scoping has a question and no answer yet. Collapsing the two
   would let the second entry borrow the first one's credibility. */
export type VentureStatus = "live" | "building" | "scoping" | "paused";

export interface Venture {
  slug: string;
  name: string;
  status: VentureStatus;
  /** One line: what it is, for whom. */
  summary: string;
  /** The problem, in the product's own framing. Two sentences at most. */
  problem: string;
  /** What exists today. Present tense, short lines, only what is built. */
  built: readonly string[];
  /** The focus areas the product's own coverage map names. Areas served, not offices. */
  areas: readonly string[];
  /**
   * THE QUALIFIER THAT KEEPS `areas` HONEST. Naming two focus areas implies a clinician in
   * each, and today there is not one: ADHD.ME's own flow tells a Gold Coast reader, in as many
   * words, that every listed GP is in Beecroft. A company site that printed the two area names
   * and stopped would be making the claim the product itself refuses to make.
   */
  areasNote: string;
  /** The public URL, or null while the product has no address of its own. */
  href: string | null;
  /** What is deliberately not settled. A page listing only what works is marketing. */
  open: readonly string[];
}

export const VENTURES: ReadonlyArray<Venture> = [
  {
    slug: "adhd-me",
    name: "ADHD.ME",
    status: "building",
    summary:
      "ADHD assessment you can actually reach — a finder that matches people to GPs who do ADHD assessment, and a console for the practices doing it.",
    problem:
      "Assessment exists and people cannot get to it. That is a routing problem wearing a clinical problem's clothes.",
    built: [
      "A finder that matches on care area, language and the access details you asked for.",
      "A console for the demand-matching and shared-care side.",
      "A compliance suite that runs in the build rather than before launch.",
    ],
    /* 2026-08-23: was "Beecroft, NSW". The product now names Sydney as the area and Beecroft as
       the suburb its listed GPs are in — its Organization JSON-LD says Sydney, its coverage map
       says "Sydney, NSW & the Gold Coast, QLD". */
    areas: ["Sydney, NSW", "Gold Coast, QLD"],
    areasNote: "Every GP listed today is in Beecroft, northern Sydney.",
    href: null,
    open: [
      "The name asserts a diagnosis, and needs an Ahpra review of the name itself.",
      "Every public figure is indicative until it is checked against its source.",
      "The public clinician directory is gated and not live.",
    ],
  },
  {
    slug: "reach",
    name: "Reach",
    status: "scoping",
    summary:
      "Early work on service engagement in Aboriginal and Torres Strait Islander health — why people entitled to a service do not use it, and what the service would have to change to be worth using.",
    problem:
      "Engagement is almost always measured as a property of the patient: did they attend, did they follow up, did they comply. We think it is mostly a property of the service, and that very little health software is built to test that idea.",
    built: [
      "Nothing. This is a question we are working on, not a product we are building.",
    ],
    areas: [],
    areasNote:
      "No areas are named because none have been agreed with anybody. Naming one would imply a relationship that does not exist.",
    href: null,
    open: [
      /* THE FIRST LINE OF THE FIRST ENTRY A READER WILL CHECK. A non-Indigenous company listing
         an Aboriginal and Torres Strait Islander health venture with no partnership named is the
         thing that should be questioned, so it is stated before anybody has to ask. */
      "This is not Indigenous-led, and nothing here is done in partnership yet. No community organisation, governance arrangement or advisory relationship is in place. None will be claimed before it exists, and the work does not proceed past scoping without one.",
      "Whether the right output is software at all. It may be that the useful contribution is research, or funding somebody already doing this.",
      "The name. Reach is what we call it internally; it is not a brand and may not survive.",
    ],
  },
];

export const STATUS_LABEL: Record<VentureStatus, string> = {
  live: "Live",
  building: "In build",
  scoping: "Scoping",
  paused: "Paused",
};
