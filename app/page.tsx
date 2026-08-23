import Link from "next/link";
import { COMPANY, PRACTICE } from "@/content/company";
import { VENTURES, STATUS_LABEL } from "@/content/ventures";
import { PRESENCE, REACH_GAP } from "@/content/presence";
import { WattleBloom } from "./wattle-bloom";
import { MotionToggle } from "./motion-toggle";
import { ArrowRight } from "./icons";

/**
 * THE HOME PAGE SHOWS, THE INNER PAGES ARGUE.
 *
 * Everything below the hero was three to four sentences per block and read as a document rather
 * than a front page. A visitor scrolling here is deciding whether to keep reading; the case is
 * made on /approach and /ventures, where somebody who wants it has gone looking. So each block
 * now carries one statement at display size and at most one line under it, and the long form
 * lives one click away. No claim was softened to make it shorter — the short forms are
 * compressions of the same sentences, held in the same content registers.
 */
export default function HomePage() {
  const lead = VENTURES[0];

  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div>
            <h1 className="display claim resolve">{COMPANY.tagline}</h1>
            <p className="lead resolve resolve-2">
              We build the routing layer of care — the part that decides whether a person who needs
              a clinician ever reaches one.
            </p>
            <div className="hero-actions resolve resolve-3">
              <Link href="/ventures" className="btn btn-on-leaf">
                What we build
              </Link>
              <Link
                href="/approach"
                className="btn btn-quiet"
                style={{ borderColor: "var(--sage)", color: "var(--on-leaf)" }}
              >
                How we work
              </Link>
            </div>
          </div>
          <WattleBloom className="hero-bloom" />
        </div>
        <MotionToggle />
      </section>

      {lead ? (
        <section className="shell band-pad lift-in">
          <div className="reg">
            <h2 className="reg-label">Ventures</h2>
            <div className="reg-body">
              <div className="entry-head">
                <h3 className="display claim-sm">{lead.name}</h3>
                <span className="entry-status">{STATUS_LABEL[lead.status]}</span>
              </div>
              <p className="say">ADHD assessment you can actually reach.</p>
              <p className="under">
                A finder that matches people to GPs who do ADHD assessment, and a console for the
                practices doing it.
              </p>
              <p style={{ marginTop: "var(--gap-3)" }}>
                <Link href="/ventures" className="go">
                  The full entry <ArrowRight />
                </Link>
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <hr className="rule" />

      <section className="shell band-pad lift-in">
        <div className="reg">
          <h2 className="reg-label">Where we operate</h2>
          <div className="reg-body">
            <p className="say" style={{ maxWidth: "20ch" }}>
              {REACH_GAP.heading}
            </p>
            <p className="under">{REACH_GAP.short}</p>

            <div className="presence" style={{ marginTop: "var(--gap-4)" }}>
              {PRESENCE.map((place) => (
                <div key={place.area} className="place">
                  <h3>
                    {place.area}, {place.state}
                  </h3>
                  <p className="place-status">{place.status}</p>
                  <p>{place.short}</p>
                </div>
              ))}
            </div>

            <p style={{ marginTop: "var(--gap-3)" }}>
              <Link href="/approach" className="go">
                Why that gap is the work <ArrowRight />
              </Link>
            </p>
          </div>
        </div>
      </section>

      <hr className="rule" />

      <section className="shell band-pad lift-in">
        <div className="reg">
          <h2 className="reg-label">How we work</h2>
          <dl className="reg-body tenets">
            {PRACTICE.map((item) => (
              <div key={item.title}>
                <dt className="display">{item.title}</dt>
                <dd>{item.short}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="on-leaf">
        <div className="shell band-pad">
          <div className="reg">
            <h2 className="reg-label">Talk to us</h2>
            <div className="reg-body">
              <p className="say" style={{ color: "var(--on-leaf)", maxWidth: "18ch" }}>
                A practice, a service, or a question about the work.
              </p>
              <div className="hero-actions">
                <Link href="/contact" className="btn btn-on-leaf">
                  Get in touch
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
