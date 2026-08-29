import type { Metadata } from "next";
import { COMPANY } from "@/content/company";

export const metadata: Metadata = {
  title: "Contact",
  description: `How to reach ${COMPANY.name}, including the channel for accessibility feedback.`,
  alternates: { canonical: "/contact" },
};

/**
 * NO FORM. A contact form needs somewhere to post; there is no backend here and no mail
 * transport. A form that silently drops what somebody typed is worse than an address. It also
 * cannot be built honestly before the company has a privacy notice of its own — collecting
 * personal information under the Australian Privacy Principles requires telling people what
 * happens to it, and there is nothing to point at yet.
 *
 * Migrated to the poster vocabulary: every class this page carried — shell, band-pad, display,
 * claim, lead, rule, reg, reg-label, reg-body — went with the old system, so the whole body
 * rendered unstyled. The six routing rows are `rule-list`, which is what that hairline-separated
 * treatment is called here now, and the label rail is `inner-section-wrapper`.
 */

/**
 * WHERE TO START — six audiences, one line each.
 *
 * These were paragraphs. Six of them stacked in a single column, each explaining itself in two
 * or three sentences, which is a page nobody reads to the end of — and a reader arriving at a
 * contact page is not reading, they are looking for the row that is about them. So each row is
 * now a label you can scan and one line that tells you what to do.
 *
 * THE CRISIS LINE CAME OUT OF ROW THREE. "In an emergency call 000. Lifeline is 13 11 14" was
 * the tail of a paragraph inside one of six collapsed rows — findable only by someone already
 * reading carefully, which is the opposite of who needs it. Shortening this section was the
 * moment to promote it, not to lose it. It is its own block now, above the list, in the one
 * treatment on the page that is impossible to skim past.
 */
const ROUTES = [
  { t: "You fund or commission services", d: "Ask what is actually live. The answer is: not much, in two areas." },
  { t: "You run a general practice", d: "Send the care areas and languages your clinicians work in. That is all we match on." },
  { t: "You are looking for assessment", d: "We are not clinicians. ADHDME points you to a GP — the conversation is with them." },
  { t: "You want to work with us", d: "No roles listed, no process yet. Write anyway." },
  { t: "Something on our sites is wrong", d: "Tell us. If it is about a real person, it jumps the queue." },
  { t: "You hit an accessibility barrier", d: "Tell us what stopped you. We log it as a defect, not as feedback." },
];

export default function ContactPage() {
  return (
    <>
      <section className="section is-black" style={{ paddingTop: "11vw", paddingBottom: "3vw" }}>
        <div className="padding-global">
          <p className="text-style-tag">Contact</p>
          <h1 className="heading-style-h1" style={{ marginTop: "1vw" }}>Write to us.</h1>
          <p className="subheading-large max-width-medium" style={{ marginTop: "2vw" }}>
            One address, read by the people building the thing. No form — there is nowhere for one
            to post yet, and we would rather say so than collect your details into a void.
          </p>
          <p style={{ marginTop: "2.5vw" }}>
            <a href={`mailto:${COMPANY.email}`} className="button button-pressed">
              {COMPANY.email}
            </a>
          </p>
          <p className="text-style-mono text-style-muted" style={{ marginTop: "1.25rem" }}>
            Replies Mon–Fri · Australian Eastern time (AEST/AEDT)
          </p>
        </div>
      </section>

      <section className="section">
        <div className="padding-global">
          {/* NO inner-section-wrapper HERE. That is a 0.5fr/1fr rail, and `.start` is already a
              two-column layout — nesting them put the whole section inside the rail's right-hand
              track and then split THAT in two, so six rows of one-line answers were squeezed into
              a column about a third of the page wide and wrapped to five lines each. One column
              system per layout. */}
          <div className="start">
              <div className="start-head">
                <h2 className="text-style-tag">Where to start</h2>
                <p className="start-heading">Find the line that is about you.</p>
              </div>

              <div>
                {/* NOT MUTED, NOT SMALL, NOT INSIDE A ROW. The only element on this page that
                    somebody might need in a hurry. */}
                <p className="urgent">
                  <span>In an emergency call <b>000</b>.</span>
                  <span>Lifeline <b>13 11 14</b>.</span>
                </p>

                <dl className="start-rows">
                  {ROUTES.map((row) => (
                    <div className="start-row" key={row.t}>
                      <dt>{row.t}</dt>
                      <dd>{row.d}</dd>
                    </div>
                  ))}
                </dl>
              </div>
          </div>
        </div>
      </section>
    </>
  );
}
