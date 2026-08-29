/**
 * THE TEAM REGISTER.
 *
 * ON, by Vikram's direction (2026-08-22): a Team tab carrying him and Stefan.
 *
 * WHAT THAT DIRECTION DID AND DID NOT DO. It named two people for THIS site. It did not reopen
 * ADHDME's own `/about`, which stays gated under the 2026-08-21 direction ("we are still
 * building and we dont know who will be on it finally") — that page publishes five people
 * including two who have not confirmed their entries, and a narrower instruction here is not a
 * wider one there. The two gates are separate flags in separate trees on purpose.
 *
 * EVERY FACT BELOW IS COPIED, NOT COMPOSED. Both entries are transcribed from ADHDME's
 * `app/about/team.ts`, where they were supplied by their subjects. Nothing was rewritten to
 * suit a company page, and nothing was added to fill a plate out — which is why `role` and
 * `remit` stay optional and why neither entry has invented a title. The one thing this file
 * says that ADHDME's does not is the section heading above the plates, and that is a sentence
 * about the company rather than about a person.
 *
 * PORTRAITS ARE SUPPLIED, NEVER GENERATED. `public/vikram.jpg` and `public/stefan.jpg` are the
 * founder-supplied photographs from the ADHDME tree, copied across at the same 3:4 framing and
 * re-encoded to 960px JPEG — they were 1MB PNGs rendering into a 300px plate, which is a real
 * cost on the regional connections this site is meant to work on. The ADHDME originals are
 * untouched.
 * Nothing here generates a face for a real person; `portrait: null` renders a monogram at the
 * same size, because the next person added will not have handed one over on the day they are
 * added.
 *
 * LOGOS SHIP ONLY WHERE LICENSED. `logo` points at a file in `public/` when there is one we may
 * use, and is null otherwise — the entry then falls back to the institution's name set as a
 * wordmark. A university mark is trademarked and is not ours to copy off a website, which is
 * why Bond renders as text and NOURISH and the Health Systems Innovation Lab render as marks.
 */
export const TEAM_PUBLIC = true;

export interface Affiliation {
  name: string;
  /** A file in public/, or null to fall back to a wordmark. See the header. */
  logo: string | null;
  href: string;
  /** Alt text, and the accessible name of the link. */
  label: string;
}

export interface Member {
  name: string;
  /** URL segment for this person's own page, under /company. Stable: it is a public address. */
  slug: string;
  /** Family name alone. The roster sets given and family name on separate lines, and splitting
   *  on a space would break on anyone whose name does not have exactly two parts. */
  family: string;
  /** Optional: rendered only when the person supplied it. */
  role?: string;
  /** Optional: rendered only when the person supplied it. */
  remit?: string;
  portrait: string | null;
  affiliations: readonly Affiliation[];
}

/** Given name(s): the whole name less the family name. Derived rather than stored, so the two
 *  halves of a roster entry can never drift apart from the name itself. */
export function given(m: Member): string {
  return m.name.slice(0, m.name.length - m.family.length).trim();
}

export const TEAM: ReadonlyArray<Member> = [
  {
    name: "Vikram Ganeshalingam",
    slug: "vikram-ganeshalingam",
    family: "Ganeshalingam",
    remit: "What a person meets when they first look for help.",
    portrait: "/vikram.jpg",
    affiliations: [
      {
        name: "Bond University",
        logo: null,
        href: "https://bond.edu.au/",
        label: "Final-year MD candidate, Bond University",
      },
    ],
  },
  {
    name: "Stefan Thottunkal",
    slug: "stefan-thottunkal",
    family: "Thottunkal",
    remit: "Physician-in-training and health-systems researcher, Stanford Medicine.",
    portrait: "/stefan.jpg",
    affiliations: [
      {
        name: "NOURISH, Stanford Medicine",
        logo: "/nourish-logo.png",
        href: "https://med.stanford.edu/nourish-project.html",
        label: "NOURISH, Stanford Medicine",
      },
      {
        name: "Harvard T.H. Chan",
        logo: "/hsil-logo.png",
        href: "https://hsph.harvard.edu/research/health-systems-innovation-lab/team/#scholars",
        label: "Health Systems Innovation Lab, Harvard T.H. Chan School of Public Health",
      },
    ],
  },
];

/** "Dr Anubhav Saxena" -> "AS". The honorific is not an initial. */
export function monogram(name: string): string {
  return name
    .replace(/^Dr\.?\s+/, "")
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("");
}
