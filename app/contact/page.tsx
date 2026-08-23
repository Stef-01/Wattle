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
 */
export default function ContactPage() {
  return (
    <>
      <section className="shell band-pad" style={{ paddingBottom: "var(--gap-4)" }}>
        <h1 className="display claim">Write to us.</h1>
        <p className="lead" style={{ marginTop: "var(--gap-3)" }}>
          One address, read by the people building the thing. No form — there is nowhere for one to
          post yet, and we would rather say so than collect your details into a void.
        </p>
        <p style={{ marginTop: "var(--gap-4)" }}>
          <a href={`mailto:${COMPANY.email}`} className="btn btn-primary">
            {COMPANY.email}
          </a>
        </p>
        <p style={{ marginTop: "1.25rem", fontSize: "0.9375rem", color: "var(--muted)" }}>
          Replies Monday to Friday, Australian Eastern time (AEST/AEDT). We are a small team, so
          give us a couple of days.
        </p>
      </section>

      <hr className="rule" />

      <section className="shell band-pad">
        <dl style={{ margin: 0 }}>
          {[
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
          ].map((row) => (
            <div key={row.t} className="reg lift-in" style={{ paddingBlock: "var(--gap-3)", borderTop: "1px solid var(--line)" }}>
              <dt className="reg-label" style={{ fontWeight: 600, color: "var(--ink)" }}>{row.t}</dt>
              <dd className="reg-body" style={{ margin: 0, color: "var(--muted)", lineHeight: 1.72, maxWidth: "66ch" }}>
                {row.d}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
