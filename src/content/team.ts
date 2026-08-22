/**
 * THE TEAM GATE — inherited, not re-decided.
 *
 * ADHD.ME's own team page is switched OFF by founder direction (2026-08-21: "make team hidden
 * at the moment … as we are still building and we dont know who will be on it finally"). That
 * direction is about a set of named real people, and it does not stop applying because the page
 * naming them moved to a different domain. Publishing the same five names on the parent
 * company's site would route straight around the gate.
 *
 * So the team section is BUILT and OFF. The route 404s, the header and footer doors do not
 * render, and the sitemap does not list it — all three read this one flag, so one word restores
 * all three the moment the founders say the team is settled.
 *
 * A NOTE ON WHAT GOES IN HERE WHEN IT IS FLIPPED ON: names and affiliations only, as supplied.
 * `role` and `remit` are optional because they are characterisations, and nothing in this tree
 * writes a characterisation of a named person nobody quoted.
 */
export const TEAM_PUBLIC = false;

export interface Member {
  name: string;
  /** Optional: only when the person supplied it. */
  role?: string;
  /** Optional: only when the person supplied it. */
  remit?: string;
  affiliations: readonly string[];
}

/**
 * Empty on purpose. The ADHD.ME tree holds the roster with its portraits and its sourcing
 * notes; duplicating it here would create a second copy to keep true. When TEAM_PUBLIC is
 * flipped, populate this from that register — do not retype it from memory.
 */
export const TEAM: ReadonlyArray<Member> = [];

/** "Wattle Technologies" -> "WT". Used for the monogram fallback when no portrait exists. */
export function monogram(name: string): string {
  return name
    .replace(/^Dr\.?\s+/, "")
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("");
}
