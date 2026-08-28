import { AcknowledgementSprig } from "./acknowledgement-sprig";

/**
 * An Acknowledgement of Country, rendered once and shared by every page so the wording is
 * identical everywhere — a statement that reads differently on two pages of the same site reads
 * as boilerplate rather than as respect. This is an Acknowledgement (which anyone may make), not
 * a Welcome to Country (which is given by Traditional Owners), and it is worded to say so.
 *
 * NO INDIGENOUS ICONOGRAPHY, DELIBERATELY. Dot-work, concentric meeting-place circles and the
 * like belong to Aboriginal and Torres Strait Islander artists and are not ours to imitate as
 * decoration. The Australian Indigenous Design Charter asks for Indigenous-led design input for
 * work that represents Indigenous people or culture; nobody has provided that here.
 *
 * THE MARK ABOVE THE WORDS IS A WATTLE SPRIG AND NOTHING ELSE. It was asked for as an Indigenous
 * symbol and is deliberately not one — see app/acknowledgement-sprig.tsx for the reasoning. It
 * is Acacia pycnantha drawn from this site's own botany modules, which is a claim about the
 * company's subject rather than about anybody's culture. The honest version of what was asked
 * for is a commissioned work by an Aboriginal or Torres Strait Islander artist, paid, credited
 * and licensed; that is recorded in docs/BRIEF-GAPS.md as outstanding.
 *
 * BEFORE LAUNCH: this wording is general, and general is the correct placeholder — but a
 * specific acknowledgement naming the Country the company actually works on should replace it,
 * written in consultation with those Traditional Owners rather than assumed. Recorded in
 * docs/BRIEF-GAPS.md.
 */
export function Acknowledgement() {
  return (
    <section className="acknowledgement padding-global" aria-label="Acknowledgement of Country">
      <div>
        <AcknowledgementSprig />
        <p>
          Wattle Technologies acknowledges the Traditional Owners of Country throughout Australia,
          and the many First Nations whose lands and waters we live and work among. We pay our
          respects to Aboriginal and Torres Strait Islander peoples and cultures, and to their
          Elders past, present and emerging.
        </p>
      </div>
    </section>
  );
}
