/**
 * THE APPROACH PAGE'S OWN WORDS.
 *
 * WHAT CHANGED AND WHY. The page used to describe a build process: commit gates, copy linters,
 * sourced figures. All true, all worth keeping, and all written from the inside of the
 * engineering — a reader met four statements about how software is made when what they came to
 * find out was what this company thinks a person is owed.
 *
 * The facts underneath are unchanged. Every commitment below is the same commitment, enforced in
 * the same place. What moved is the vantage point: each one now starts from the person on the
 * other end of it, because that is who it was for.
 *
 * ON BEING INTERESTING WITHOUT OVERCLAIMING. The brief asked for something that entices, and the
 * cheap way to do that in health is atmosphere — "reimagining care", "the future of medicine" —
 * which is both vapour and, in Australia, a regulatory problem. So the pull here comes from the
 * opposite move: name the problem precisely, state the principle plainly, and stop before the
 * mechanism. A specific unanswered question is far harder to walk away from than an evocative
 * one, and it has the advantage of being true. Nothing on this page claims an outcome, and the
 * things this company does not have are still listed further down it.
 */

/** The sentence the page turns on. Deliberately a definition and not a slogan. */
export const SYSTEM_DEFINITION = {
  tag: "What we mean by a health system",
  lead: "A health system is not a building, a platform or a database. It is a small number of people trying to hold one person's care between them.",
  body: [
    "Everything that helps them do that is the system. Everything else is what they work around — and most software written for health in the last thirty years has been written to record care rather than to help anyone deliver it. The record got better. The holding did not.",
    "So we design for the parts that are load-bearing and human: a clinician's judgement, a person's own account of themselves, the handover between two people who will never meet. Those cannot be automated away and should not be. What can go is the accumulated clutter around them — the forms that exist because a form existed, the steps nobody chose, the friction that quietly decides who gets seen.",
    "Remove enough of that and a team works the way a team is supposed to. That is the whole of it, and it is harder than it sounds.",
  ],
} as const;

/**
 * The neglected problems. Each is decades old, widely known, and structurally nobody's job.
 *
 * NO FIGURES HERE, DELIBERATELY. Every one of these could carry a statistic and every statistic
 * would need a source this tree has not confirmed. The site's own rule is that a claim without a
 * source fails the build, and that rule does not get suspended because a number would be
 * persuasive. Stated as conditions, which is what they are.
 */
export const NEGLECTED: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: "The people who never arrive",
    body: "Health services measure the people who reach them. The person who called four practices, got four waiting lists, and stopped calling is not in anybody's data — and their absence reads, in every dashboard, as a need that does not exist.",
  },
  {
    title: "Referral as a dead end",
    body: "A referral is treated as the end of an episode. For the person holding it, it is the beginning of one: finding somebody who takes it, is accepting patients, speaks their language, and is close enough to actually attend. Nobody owns that gap, so it is where people are lost.",
  },
  {
    title: "The distance nobody costs",
    body: "Specialist care concentrates where specialists concentrate, which is not where a large share of Australians live. A referral that requires a day of driving is a referral many people will not use, and it is recorded as a referral made.",
  },
  {
    title: "Coordination as unpaid work",
    body: "The work of keeping a person's care coherent across several clinicians is real, skilled and largely unfunded. It falls to whoever will do it — usually the patient, or someone who loves them.",
  },
];

/** The lede beneath the headline. */
export const APPROACH_LEDE =
  "Most health software is built for the moment a person arrives. We build for everything before that — the part that quietly decides whether they arrive at all.";
