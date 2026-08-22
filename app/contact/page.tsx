import type { Metadata } from "next";
import { COMPANY } from "@/content/company";

export const metadata: Metadata = {
  title: "Contact",
  description: `How to reach ${COMPANY.name}.`,
  alternates: { canonical: "/contact" },
};

/**
 * NO FORM. A contact form needs somewhere to post; there is no backend here and no mail
 * transport configured. A form that silently drops what somebody typed is worse than an
 * address, so this page publishes the address and says what happens next.
 *
 * When a backend exists, the form belongs here — and it will need a privacy notice for the
 * corporate entity, which does not exist yet either (src/content/company.ts, UNCONFIRMED).
 */
export default function ContactPage() {
  return (
    <>
      <section className="section" style={{ paddingBottom: "3rem" }}>
        <div className="shell">
          <p className="eyebrow">Contact</p>
          <h1 className="display prose-h1">Write to us.</h1>
          <p className="lede" style={{ marginTop: "1.5rem", maxWidth: "48ch" }}>
            One address, read by the people building the thing. No form, because there is nowhere
            for a form to go yet and we would rather say so.
          </p>

          <p style={{ marginTop: "2.5rem" }}>
            <a href={`mailto:${COMPANY.email}`} className="btn btn-primary">
              {COMPANY.email}
            </a>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="shell prose">
          <div className="grid-2">
            <article className="card">
              <h3>If you run a practice</h3>
              <p>
                Tell us the care areas your clinicians actually take on and the languages they
                work in. That is the whole of what our matching uses, and it is the fastest way
                for us to say whether we would be useful to you yet.
              </p>
            </article>
            <article className="card">
              <h3>If you are looking for assessment</h3>
              <p>
                We do not provide clinical care and cannot advise on your situation. ADHD.ME is a
                finder for GPs who do ADHD assessment — it points you to a clinician, and the
                clinical conversation is with them.
              </p>
            </article>
            <article className="card">
              <h3>If you are a journalist or a commissioner</h3>
              <p>
                Ask us for the source behind any figure you have seen from us. If we cannot
                produce one, we will tell you that instead, and the figure will come down.
              </p>
            </article>
            <article className="card">
              <h3>If something on our sites is wrong</h3>
              <p>
                Especially if it is about you — a listing, a name, an affiliation. Corrections
                about a real person are the one thing we act on before anything else in the
                queue.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
