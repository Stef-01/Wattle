/**
 * THE VENTURE REGISTER.
 *
 * One entry today. It is written as a list rather than a page of prose because the second
 * entry is the thing that breaks a hand-written "our product" page, and because a venture
 * that is not live yet must be able to sit here with `status: "building"` and no claims
 * attached to it.
 *
 * Every sentence about ADHD.ME below is taken from the ADHD.ME repository — its README, its
 * public copy and its compliance suite. Nothing was upgraded on the way across: "indicative"
 * stayed indicative, and the open founder decisions stayed open.
 */

export type VentureStatus = "live" | "building" | "paused";

export interface Venture {
  slug: string;
  name: string;
  status: VentureStatus;
  /** One line. What it is, for whom. */
  summary: string;
  /** The problem, in the product's own framing. */
  problem: string;
  /** What has actually been built — present tense, only what exists. */
  built: readonly string[];
  /** Where it operates. Areas SERVED, not offices. */
  areas: readonly string[];
  /**
   * The public URL. `null` while the product has no domain of its own — a link to a preview
   * deployment is not a company site's job to publish.
   */
  href: string | null;
  /**
   * What is deliberately not settled. A venture page that lists only what works is marketing;
   * this field is why this one is not. Sourced from the ADHD.ME README's founder-decision list.
   */
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
      "Assessment exists and people cannot get to it. The wait is measured in months, the cost is quoted after the referral, and the search ends at whoever answers the phone. None of that is a clinical problem. It is a routing problem wearing a clinical problem's clothes.",
    built: [
      "A patient-facing finder that matches on care area, language and whether a practice is one you can physically get to.",
      "A practice-facing console for the demand-matching and shared-care side — the work that decides whether a matched patient becomes a booked one.",
      "A compliance suite that runs in the build: copy linters, a public-surface sweep, and founder gates that hold a claim until a human clears it.",
    ],
    areas: ["Beecroft, NSW", "Gold Coast, QLD"],
    href: null,
    open: [
      "The name asserts a diagnosis, and needs an Ahpra advertising review of the name itself — separately from the copy.",
      "Every figure on the public pages is indicative until it is checked against its source.",
      "The public clinician directory sits behind a founder gate and is not live.",
    ],
  },
];

export const LIVE_VENTURES = VENTURES.filter((v) => v.status === "live");

export const STATUS_LABEL: Record<VentureStatus, string> = {
  live: "Live",
  building: "In build",
  paused: "Paused",
};
