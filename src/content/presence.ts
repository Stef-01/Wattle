/**
 * WHERE THE COMPANY ACTUALLY OPERATES.
 *
 * The brief asks for a state-by-state map of national presence. The honest version of that map
 * has two pins and a large empty middle, and it is published that way on purpose: a company
 * whose entire thesis is that people cannot reach care does not get to imply national coverage
 * it does not have. The empty middle IS the argument.
 *
 * Sourced from ADHDME's coverage map and Organization JSON-LD, re-checked 2026-08-23.
 */

export interface Place {
  state: string;
  area: string;
  status: string;
  /** The home page's version: one clause, no sentence. */
  short: string;
  detail: string;
}

export const PRESENCE: ReadonlyArray<Place> = [
  {
    state: "NSW",
    area: "Sydney",
    status: "Clinicians listed",
    short: "Every listed GP practises in Beecroft.",
    detail:
      "Every GP listed today practises in Beecroft, in northern Sydney. It is the only place in Australia where our matching currently ends in a named clinician.",
  },
  {
    state: "QLD",
    area: "Gold Coast",
    status: "No clinician listed yet",
    short: "A declared focus area with nobody in it.",
    detail:
      "A declared focus area with nobody listed in it yet. Somebody searching from here is told that, and told how far away the nearest listed GP is, rather than shown an empty result.",
  },
];

/**
 * The rest of the country. This is not a coverage disclaimer bolted to the bottom of a map —
 * it is the company's actual position, and it is why the company exists.
 */
export const REACH_GAP = {
  heading: "Most of Australia is the part we have not reached.",
  /** The home page carries this and stops. The argument is on /approach. */
  short:
    "Two areas, one of them still without a clinician. Everywhere else our software says so.",
  body:
    "Two areas, one of them still without a listed clinician. Outside them our software's only honest answer is that we do not cover you yet, and that is the answer it gives. The distance between where assessment exists and where people live is the problem we are working on, and overstating our own coverage would be a strange way to start.",
  rural:
    "The gap is worst outside the capital cities. Assessment concentrates where specialists concentrate, which is not where a large share of Australians live, and a referral that requires a day of driving is a referral many people will not use. Any claim we make about closing that gap will name the postcodes it closed.",
} as const;
