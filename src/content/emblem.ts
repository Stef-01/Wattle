/**
 * THE GATE'S ONLY WORDS.
 *
 * The gate is the plant and a way in. These three beats are what a visitor reads on the way
 * down, and nothing here describes the company — that is all behind the click, which is the
 * whole point of a gate.
 *
 * ON THE CULTURAL NOTE, AND WHY IT IS WORDED THE WAY IT IS.
 *
 * The obvious version of this paragraph — "to Aboriginal people the wattle symbolises X" — is
 * the one thing that must not be written. There are hundreds of distinct First Nations across
 * this continent, roughly a thousand Acacia species, and no single shared meaning between them.
 * A sentence that flattens that into one symbol is exactly the pan-Indigenous homogeneity the
 * Australian Indigenous Design Charter names as harm, and it would be a healthcare company
 * asserting cultural authority it has not been given.
 *
 * So this text does two things instead. It states practical uses that are broadly documented
 * across many groups — seed as food, gum and bark in medicine, hardwood for implements,
 * flowering as a seasonal marker — and it says plainly that meaning differs between nations and
 * that we are not the ones to give an account of it.
 *
 * NOT REVIEWED BY THE PEOPLE IT CONCERNS. Logged in docs/BRIEF-GAPS.md. It stays general and
 * sourced until an Aboriginal or Torres Strait Islander reviewer has had it, and if that review
 * says cut it, it gets cut.
 */

export interface Beat {
  /** Small caps label above the beat. */
  tag: string;
  /** The line itself. */
  body: string;
}

export const EMBLEM = {
  botanical: "Acacia pycnantha",
  common: "Golden Wattle",
  /* Proclaimed by the Governor-General in 1988, Australia's bicentenary. National Wattle Day
     is 1 September. Both are matters of public record, unlike the paragraph below. */
  emblem: "Australia's national floral emblem, proclaimed 1988",
} as const;

export const BEATS: readonly Beat[] = [
  {
    tag: "The plant",
    body:
      "One head of golden wattle is not one flower. It is forty to eighty separate florets packed "
      + "into a sphere, and what looks like petals is stamens. The heads open along the stem from "
      + "the base upward, so a single branch is budding, opening and spent all at once.",
  },
  {
    tag: "Longer than the emblem",
    body:
      "Acacias have been food, medicine, timber and calendar to Aboriginal and Torres Strait "
      + "Islander peoples for many thousands of years — seed ground for flour, gum and bark used in "
      + "healing, hardwood worked into implements, and flowering read as a marker of season and of "
      + "what else was ready. Which wattle carries that, and what it means, differs from nation to "
      + "nation. There is no single account of it and this is not the place that gives you one.",
  },
] as const;
