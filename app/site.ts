/**
 * The one place this site's absolute URL and its door list are decided.
 *
 * Same shape as ADHD.ME's app/site.ts on purpose: canonical URLs, OG tags, robots and the
 * sitemap all read from here, so they cannot disagree about where the site lives.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3200");

import { TEAM_PUBLIC } from "@/content/team";

export interface Door {
  label: string;
  href: string;
}

const BASE_DOORS: ReadonlyArray<Door> = [
  { label: "Ventures", href: "/ventures" },
  { label: "Approach", href: "/approach" },
  { label: "Contact", href: "/contact" },
];

/**
 * The Team door is added from the gate rather than hand-written into two lists, so the door,
 * the route and the sitemap can never disagree about whether the team is public.
 * See the header of src/content/team.ts for why it is off.
 */
export const DOORS: ReadonlyArray<Door> = TEAM_PUBLIC
  ? [BASE_DOORS[0]!, BASE_DOORS[1]!, { label: "Team", href: "/team" }, BASE_DOORS[2]!]
  : BASE_DOORS;
