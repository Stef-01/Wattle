/**
 * THE GATE'S ONLY WORDS.
 *
 * ON THE CULTURAL BEAT, AND WHY IT IS WRITTEN THIS WAY.
 *
 * The first draft was a list — food, medicine, timber, calendar — followed by a disclaimer. It
 * was accurate and it was inert. It also did the thing generic writing about First Nations
 * knowledge usually does: it described a category of use rather than saying anything, and it
 * asked the reader to take the significance on trust.
 *
 * The sentence that replaced it is a single documented reading, attributed to ONE named nation,
 * and it carries more than the list did precisely because it is specific. The Botanic Gardens of
 * Sydney records that Wiradjuri read the blooming of the Gold-Dust Wattle as the time to collect
 * emu eggs — and the FALLING of the blossom, when the westerlies come in late winter, as the end
 * of it, because by then the chick has formed inside the egg.
 *
 * That is a flower that tells you when to take and when to stop taking, and the reason to stop
 * is another creature's life. It is a harvesting practice built around a breeding cycle. Nothing
 * has to be claimed on its behalf; it only has to be reported accurately.
 *
 * WHAT IS STILL REFUSED. "To Aboriginal people the wattle symbolises X" remains the one sentence
 * that must not be written. There are hundreds of distinct First Nations and close to a thousand
 * Acacia species, and no shared meaning to report — asserting one is the pan-Indigenous
 * flattening the Australian Indigenous Design Charter names as harm. Naming Wiradjuri, and then
 * saying plainly that accounts differ, is the opposite move: it credits a specific people with a
 * specific knowledge instead of averaging everyone into a symbol.
 *
 * SOURCES. Wiradjuri emu-egg reading and the Gadigal sea-mullet reading: Botanic Gardens of
 * Sydney, Aboriginal seasons teaching resource. National emblem, national colours and the sprig
 * worn on days of mourning: Department of the Prime Minister and Cabinet, and the National
 * Museum of Australia. Fire regeneration: CSIRO. Every factual clause below traces to one of
 * those; nothing is inferred from them.
 *
 * STILL NOT REVIEWED BY THE PEOPLE IT CONCERNS. Logged in docs/BRIEF-GAPS.md. Sourced to a
 * reputable institution is not the same as cleared to publish, and the question of whether a
 * health-software company should be narrating this at all is not ours to settle alone.
 */

export interface Beat {
  /** Small caps label above the beat. */
  tag: string;
  /** The line that carries it. Set large — this is the sentence a reader stops on. */
  lead: string;
  /** What grounds the lead. Set smaller, beneath it. */
  body: string;
}

export const EMBLEM = {
  botanical: "Acacia pycnantha",
  common: "Golden Wattle",
  /* Proclaimed by the Governor-General in 1988, Australia's bicentenary. Green and gold were
     declared the national colours in 1984. National Wattle Day is 1 September. */
  emblem: "Australia's national floral emblem, proclaimed 1988",
} as const;

/* ORDER IS DELIBERATE: the long history first, the botany second, the name last. It reads as a
   narrowing — tens of thousands of years, then what the plant is, then what it is called — and
   it puts the least expected sentence on the first screen, which is the one everybody sees. */
export const BEATS: readonly Beat[] = [
  {
    tag: "Longer than the emblem",
    lead: "A flower that tells you when to take, and when to leave a thing alone.",
    body:
      "In Wiradjuri country the Gold-Dust Wattle in bloom means the emu eggs are ready. When the "
      + "westerlies come and the blossom falls, it means stop — the chick has formed inside. "
      + "Gadigal read the Sydney Golden Wattle for the mullet run. Close to a thousand acacias and "
      + "hundreds of nations reading them differently: there is no single account of it, and this "
      + "is not the place that would give you one. Australians since wear a sprig of it on days of "
      + "mourning. It flowers at the end of winter, and after fire it is the first thing back.",
  },
  {
    tag: "The plant",
    lead: "One head of golden wattle is not one flower.",
    body:
      "It is forty to eighty separate florets packed into a sphere, and what looks like petals is "
      + "stamens. The heads open along the stem from the base upward, so a single branch is "
      + "budding, opening and spent all at once.",
  },
] as const;
