/**
 * THE COMPANY REGISTER — the one place a fact about Wattle Technologies is written down.
 *
 * The law of this file is the law the ADHD.ME tree runs on, carried over deliberately: a
 * sentence about a real company or a real person ships only if somebody actually said it.
 * Nothing here was inferred, rounded up, or written to fill a gap in a layout.
 *
 * Everything in CONFIRMED is derivable from the ADHD.ME repository itself (its README, its
 * Organization JSON-LD, its compliance suite). Everything a corporate site would normally
 * carry and this one does NOT — ABN, incorporation date, registered office, headcount,
 * investors, clients, revenue, awards — is listed in UNCONFIRMED below rather than invented,
 * and no page reads from that list. Fill one in and it appears; leave it and the layout
 * closes over the gap instead of printing a plausible number.
 */

export const COMPANY = {
  name: "Wattle Technologies",
  /** Used in the wordmark. Kept separate so the mark can be shortened without renaming the company. */
  shortName: "Wattle",
  /**
   * The positioning line. It says what the company is and stops — no market-size claim, no
   * superlative, nothing an Ahpra advertising review would have to unpick.
   */
  tagline: "We build health software for the parts of the system people cannot reach.",
  /**
   * Country of operation. Stated because ADHD.ME's own structured data names Australian places
   * served; NOT elaborated into a head-office address, which nobody has supplied.
   */
  country: "Australia",
  /**
   * Contact. Today this is the address ADHD.ME already publishes in its Organization JSON-LD,
   * so putting it here discloses nothing new. REPLACE with a company address (hello@…) the day
   * the domain exists — this constant is the only place it appears.
   */
  email: "stefan.thottunkal@gmail.com",
} as const;

/**
 * NOT KNOWN TO THIS REPOSITORY. Each of these is a fact a visitor, a partner or a regulator may
 * reasonably expect on a company site, and each is absent because no source in this tree states
 * it. They are written down here — rather than silently omitted — so the gap is a decision on a
 * list somebody can close, instead of something nobody notices until it is asked for in public.
 */
export const UNCONFIRMED: ReadonlyArray<{ item: string; why: string }> = [
  { item: "ABN / ACN and registered entity name", why: "Required on Australian commercial pages and invoices. No company register entry has been supplied to this tree." },
  { item: "Date of incorporation", why: "Every 'founded in ____' on a company site is either a fact or a fabrication. This one is not yet a fact." },
  { item: "Registered office / principal place of business", why: "ADHD.ME names Beecroft NSW and the Gold Coast QLD as areas SERVED. An area served is not an address." },
  { item: "Headcount and roles", why: "The ADHD.ME team page is gated by founder direction while the team is still forming — see src/content/team.ts." },
  { item: "Ownership, funding and cap table", why: "No investor, grant or ownership document has been shown to this tree." },
  { item: "Privacy policy and terms for the corporate entity", why: "ADHD.ME has its own at /privacy and /terms. Wattle Technologies as a company has not published either, and one product's policy does not cover the parent." },
  { item: "Insurance, clinical governance and complaints route", why: "A company selling into general practice is asked for all three. None is recorded here." },
];

/**
 * What the company does, in the terms the product itself uses. Each line is traceable to the
 * ADHD.ME tree rather than to a positioning exercise.
 */
export const PRACTICE: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: "Access before anything else",
    body:
      "The first question our software asks is not what is wrong with you. It is whether there is anybody you can actually get to — in your language, in your care area, at a practice you can physically reach. A service you cannot reach has no clinical quality to measure.",
  },
  {
    title: "Matching keyed to clinicians, never to symptoms",
    body:
      "Our matching runs on attributes clinicians declare about themselves — the work they do, the languages they speak, where they practise. It does not profile a patient's symptoms to target them. That boundary is a line in the product's compliance suite, not a preference.",
  },
  {
    title: "Regulated from the first commit",
    body:
      "Australian health advertising law is not a launch checklist here. Copy linters, a public-surface sweep and a set of founder gates run in the build, so a page that claims an outcome, publishes a rating or advertises a regulated service the wrong way fails the build rather than the review.",
  },
  {
    title: "Figures stay indicative until they are sourced",
    body:
      "Numbers on our public pages are written as ranges precisely while nobody in the tree has confirmed them against a source. Ranges are how uncertainty looks when it is being honest about itself.",
  },
];
