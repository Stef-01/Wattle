import { AcknowledgementUnderlay } from "./acknowledgement-underlay";

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
 * THE FIELD BEHIND THE WORDS IS LEAVES, AND DELIBERATELY NOT DOTS — the reasoning is in
 * app/acknowledgement-underlay.tsx. No sprig sits above them any more either.
 *
 * A wattle sprig sat above these words for a while. It was never an
 * Indigenous symbol and was never going to be — that request was declined and the reasoning is in
 * docs/BRIEF-GAPS.md — but by direction the company's mark belongs beside the letters of the
 * wordmark, top and bottom, not floating above a paragraph it has no relationship to. So this
 * band is back to carrying words and nothing else, which is where it started and is the safer
 * place for it to be.
 *
 * The honest version of what was asked for remains a commissioned work by an Aboriginal or
 * Torres Strait Islander artist, paid, credited and licensed. Recorded as outstanding.
 *
 * BEFORE LAUNCH: this wording is general, and general is the correct placeholder — but a
 * specific acknowledgement naming the Country the company actually works on should replace it,
 * written in consultation with those Traditional Owners rather than assumed. Recorded in
 * docs/BRIEF-GAPS.md.
 */
export function Acknowledgement() {
  return (
    <section className="acknowledgement padding-global" aria-label="Acknowledgement of Country">
      <AcknowledgementUnderlay />
      <div>
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
