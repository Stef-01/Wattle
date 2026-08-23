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

const ROUTES = [
  {
    t: "You commission or fund services",
    d: "Ask what is actually live first — the answer is “not much, in two areas”. Everything useful follows from starting there.",
  },
  {
    t: "You run a general practice",
    d: "Tell us the care areas your clinicians take on and the languages they work in. That is all our matching uses.",
  },
  {
    t: "You are looking for assessment",
    d: "We do not provide clinical care. ADHD.ME points you to a GP; the clinical conversation is with them. In an emergency call 000. Lifeline is 13 11 14.",
  },
  {
    t: "You want to work with us",
    d: "No advertised roles, and no careers process yet. Write anyway if you build health software or assess ADHD.",
  },
  {
    t: "Something on our sites is wrong",
    d: "Especially if it is about you. Corrections about a real person jump the queue.",
  },
  {
    t: "You hit an accessibility barrier",
    d: "Tell us what stopped you. We treat it as a defect, not as feedback.",
  },
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
          <div className="inner-section-wrapper">
            <h2 className="text-style-tag">Where to start</h2>
            <dl className="rule-list" style={{ margin: 0 }}>
              {ROUTES.map((row) => (
                <div key={row.t} style={{ borderBottom: "var(--rule) solid currentColor", padding: "var(--space-s) 0" }}>
                  <dt className="heading-style-h6">{row.t}</dt>
                  <dd className="body-text text-style-muted max-width-medium" style={{ margin: "0.5rem 0 0" }}>
                    {row.d}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
