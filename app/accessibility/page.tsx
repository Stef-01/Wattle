import type { Metadata } from "next";
import { COMPANY } from "@/content/company";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "Wattle Technologies' accessibility statement: the standard we build to, what is enforced mechanically, what is untested, and how to report a barrier.",
  alternates: { canonical: "/accessibility" },
};

/**
 * AN ACCESSIBILITY STATEMENT THAT DOES NOT CLAIM CONFORMANCE IT HAS NOT MEASURED.
 *
 * The Australian Government Style Manual and the Digital Inclusion Standard both expect a
 * conformance level and a feedback channel. They do not expect a company to assert a level it
 * has not tested, and asserting WCAG 2.2 AA conformance on the strength of a colour-contrast
 * script would be the same category of claim as an uncertified ISO badge.
 *
 * So this page states the target, names what is genuinely enforced, and names what has not been
 * verified — including the screen-reader testing the brief asks for, which has not been done.
 */
export default function AccessibilityPage() {
  return (
    <>
      <section className="section is-black" style={{ paddingTop: "11vw", paddingBottom: "3vw" }}>
        <div className="padding-global">
          <p className="text-style-tag">Accessibility</p>
          <h1 className="heading-style-h1" style={{ marginTop: "1vw" }}>Accessibility.</h1>
          <p className="subheading-large max-width-medium" style={{ marginTop: "2vw" }}>
            What we build to, what is checked automatically on every commit, and what has not been
            verified yet.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="padding-global">
        <div className="inner-section-wrapper">
          <h2 className="text-style-tag">Target</h2>
          <div className="body-text max-width-medium">
            <p>
              We build this site to <strong>WCAG 2.2 Level AA</strong>. We are not claiming
              conformance to it. Conformance is a measured result, and no independent audit of
              this site has been carried out — so the honest statement is the target plus the
              evidence below.
            </p>
          </div>
        </div>

        <div className="inner-section-wrapper">
          <h2 className="text-style-tag">Enforced in the build</h2>
          <div>
            <ul className="stack body-text">
              <li>
                <strong>Colour contrast.</strong> Every text
                pairing in the stylesheet is recomputed against a 4.5:1 floor on every build and in
                CI. The build fails below it. This is a gate, not a review.
              </li>
              <li>
                <strong>Reduced motion.</strong> The animated
                elements on the home page hold still under{" "}
                <code style={{ fontSize: "0.9em" }}>prefers-reduced-motion: reduce</code>, and are
                drawn in their finished state rather than disappearing.
              </li>
              <li>
                <strong>The animated field is optional.</strong> The
                generative wattle field on the home page is decorative and carries no information.
                It never loads at all under reduced motion, on Data Saver or a slow connection, on
                a small screen, or on a lower-powered device — a hand-drawn version is already on
                screen before that decision is made, and nothing waits for it.
              </li>
              <li>
                <strong>Motion you can stop.</strong> The home page
                carries a <em>Pause motion</em> control. The wattle spray moves on its own and keeps
                moving past five seconds, which under WCAG 2.2.2 needs a way to stop it — and a
                system-level motion preference does not discharge that, because it only serves
                readers who set one in advance.
              </li>
              <li>
                <strong>Text resizing and zoom.</strong> Layouts use
                relative units throughout and are checked down to a 320&nbsp;pixel viewport without
                horizontal scrolling.
              </li>
              <li>
                <strong>Keyboard access.</strong> Every control is a
                real button or link, there is a skip link to the main content, and one focus style
                is used site-wide.
              </li>
              <li>
                <strong>Structure.</strong> One{" "}
                <code style={{ fontSize: "0.9em" }}>h1</code> per page, headings in order, named
                landmarks, and alternative text on every image that carries meaning. Decorative
                graphics — the wattle sprig and the mark — are hidden from assistive technology
                rather than described.
              </li>
            </ul>
          </div>
        </div>

        <div className="inner-section-wrapper">
          <h2 className="text-style-tag">Not verified</h2>
          <div>
            <ul className="stack body-text">
              <li>
                <strong>Screen-reader testing.</strong> This site has
                not been tested end to end with NVDA, JAWS or VoiceOver by a person who uses one.
                Automated checks are not a substitute and we are not going to present them as one.
              </li>
              <li>
                <strong>Testing with people with disability.</strong>{" "}
                None has been commissioned. Nothing on this site has been reviewed by the people it
                most affects.
              </li>
              <li>
                <strong>Translated and plain-language versions.</strong>{" "}
                The site is English only, at roughly a secondary-school reading level. Given that
                our product matches people on the language their clinician speaks, an English-only
                company site is a gap we own rather than an oversight.
              </li>
              <li>
                <strong>Captions and transcripts.</strong> Not
                applicable today — there is no audio or video anywhere on this site. Any that is
                added ships with captions and a transcript or it does not ship.
              </li>
            </ul>
          </div>
        </div>

        <div className="inner-section-wrapper">
          <h2 className="text-style-tag">Report a barrier</h2>
          <div className="body-text max-width-medium">
            <p>
              Write to <a href={`mailto:${COMPANY.email}`} className="text-style-mono">{COMPANY.email}</a> with
              what you were trying to do and what stopped you. We treat an access barrier as a
              defect, not as feedback, and we will tell you what we are doing about it and when.
            </p>
            <p>
              If you would rather raise it elsewhere, the Australian Human Rights Commission takes
              complaints about disability discrimination, including about websites.
            </p>
          </div>
        </div>
        </div>
      </section>
    </>
  );
}
