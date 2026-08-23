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
          One address, read by the people building the thing. No form, because there is nowhere for
          a form to go yet and we would rather say so than collect your details into a void.
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
              t: "If you commission or fund services",
              d: "Ask us what is actually live before anything else — the answer is currently “not much, in two areas”, and everything useful follows from starting there. We will send you the same figures we publish, with their sources, or tell you we do not have one.",
            },
            {
              t: "If you run a general practice",
              d: "Tell us the care areas your clinicians genuinely take on and the languages they work in. That is the whole of what our matching uses, and it is the fastest way for us to say whether we would be useful to you yet.",
            },
            {
              t: "If you are looking for assessment",
              d: "We do not provide clinical care and cannot advise on your situation. ADHD.ME is a finder for GPs who do ADHD assessment — it points you to a clinician, and the clinical conversation is with them. In an emergency call 000; for 24-hour crisis support, Lifeline is 13 11 14.",
            },
            {
              t: "If you want to work with us",
              d: "There are no advertised roles. That is not a coy way of saying there are; there is no careers process yet. If you build health software or assess ADHD and think we should know each other, write anyway.",
            },
            {
              t: "If something on our sites is wrong",
              d: "Especially if it is about you — a listing, a name, an affiliation. Corrections about a real person are the one thing we act on before anything else in the queue.",
            },
            {
              t: "If you hit an accessibility barrier",
              d: "Tell us what you were trying to do and what stopped you, and we will treat it as a defect rather than as feedback. Our accessibility statement sets out what we test and what we know is unfinished.",
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
