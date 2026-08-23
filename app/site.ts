/**
 * The one place this site's address and its door list are decided. Header, footer and sitemap
 * all read from here, so they cannot disagree about what this site contains.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3200");

export interface Door {
  label: string;
  href: string;
}

/**
 * FOUR DOORS, ONE PER JOB SOMEBODY ARRIVES WITH.
 *
 * Borrowed from the quadrant model large health-technology companies use, collapsed to the four
 * that this company can actually fill: what we build (Ventures), what we believe and what we
 * have not resolved (Approach), who we are (Company), and how to reach us (Contact).
 *
 * The quadrants a bigger company fills with a newsroom, an investor data room, careers listings
 * and an evidence library are deliberately absent rather than stubbed. An empty "Insights" tab
 * on a company with nothing published is worse than no tab: it advertises a gap and calls it a
 * section. See src/content/disclosures.ts.
 */
export const DOORS: ReadonlyArray<Door> = [
  { label: "Ventures", href: "/ventures" },
  { label: "Approach", href: "/approach" },
  { label: "Company", href: "/company" },
  { label: "Contact", href: "/contact" },
];

/** Doors that belong in the footer only — obligations rather than destinations. */
export const FOOTER_DOORS: ReadonlyArray<Door> = [
  { label: "Accessibility", href: "/accessibility" },
];
