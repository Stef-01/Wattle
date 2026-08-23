import Link from "next/link";
import { COMPANY, PRACTICE } from "@/content/company";
import { VENTURES, STATUS_LABEL } from "@/content/ventures";
import { WattleSprig } from "./wattle-mark";

/**
 * The home page holds three ideas and stops: what this company is for, what it has built, and
 * how it works. There is no logo wall, no metrics strip and no testimonial row — each of those
 * would need a fact this repository does not have.
 */
export default function HomePage() {
  const lead = VENTURES[0];

  return (
    <>
      <section className="hero">
        <WattleSprig className="hero-sprig" />
        <div className="shell" style={{ position: "relative" }}>
          <p className="eyebrow rise">{COMPANY.country} · Health software</p>
          <h1 className="display rise" style={{ animationDelay: "60ms" }}>
            {COMPANY.tagline}
          </h1>
          <p className="lede rise" style={{ animationDelay: "120ms" }}>
            Wattle Technologies builds the routing layer of care — the part that decides whether a
            person who needs a clinician ever reaches one. We start where the system runs out.
          </p>
          <div className="hero-actions rise" style={{ animationDelay: "180ms" }}>
            <Link href="/ventures" className="btn btn-primary">
              What we build
            </Link>
            <Link href="/approach" className="btn btn-secondary">
              How we work
            </Link>
          </div>
        </div>
      </section>

      {lead ? (
        <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
          <div className="shell">
            <p className="eyebrow">The work</p>

            {/* The same entry treatment /ventures uses, minus the two lists. One shape for a
                venture across the site, so the home page cannot drift into being a second,
                prettier description of the same thing. */}
            <ul className="entries" style={{ marginTop: "2rem" }}>
              <li className="entry">
                <div className="entry-head">
                  <h2 className="display entry-name">{lead.name}</h2>
                  <span className="entry-status">{STATUS_LABEL[lead.status]}</span>
                </div>
                <p className="entry-summary">{lead.summary}</p>
                <p className="entry-problem">{lead.problem}</p>
                <p className="entry-areas">
                  <strong>{lead.areas.join(" · ")}</strong> — {lead.areasNote}
                </p>
              </li>
            </ul>

            <p style={{ marginTop: "2rem" }}>
              <Link href="/ventures" style={{ color: "var(--gold)", fontWeight: 500 }}>
                The full entry, including what is still open →
              </Link>
            </p>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="shell">
          <p className="eyebrow">How we work</p>
          <h2 className="display prose-h2" style={{ marginTop: "1rem", maxWidth: "24ch" }}>
            Four commitments that show up in the build, not the brochure.
          </h2>

          <div className="grid-2" style={{ marginTop: "2.5rem" }}>
            {PRACTICE.map((item, index) => (
              <article key={item.title} className="card">
                <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="shell band-inner">
          <p className="eyebrow eyebrow-on-leaf">Talk to us</p>
          <h2 className="display">A practice, a service, or a question about the work.</h2>
          <p>
            We are a small team building in the open about what is finished and what is not. If you
            run a general practice, commission services, or want to know how the matching actually
            works, write to us.
          </p>
          <div className="hero-actions">
            <Link href="/contact" className="btn btn-on-leaf">
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
