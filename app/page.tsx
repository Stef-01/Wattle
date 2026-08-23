import Link from "next/link";
import { COMPANY, PRACTICE } from "@/content/company";
import { VENTURES, STATUS_LABEL } from "@/content/ventures";
import { PRESENCE, REACH_GAP } from "@/content/presence";
import { WattleBloom } from "./wattle-bloom";
import { ArrowRight } from "./icons";

export default function HomePage() {
  const lead = VENTURES[0];

  return (
    <>
      {/* The front door. One living subject, one claim, on the dark. */}
      <section className="hero">
        <div className="shell hero-grid">
          <div>
            <h1 className="display claim resolve">{COMPANY.tagline}</h1>
            <p className="lead resolve resolve-2">
              Wattle Technologies builds the routing layer of care — the part that decides whether
              a person who needs a clinician ever reaches one. We start where the system runs out.
            </p>
            <div className="hero-actions resolve resolve-3">
              <Link href="/ventures" className="btn btn-on-leaf">
                What we build
              </Link>
              <Link href="/approach" className="btn btn-quiet" style={{ borderColor: "var(--sage)", color: "var(--on-leaf)" }}>
                How we work
              </Link>
            </div>
          </div>
          <WattleBloom className="hero-bloom" />
        </div>
      </section>

      {/* The portfolio, first thing on paper. A parent company's front page answers
          "what do you own" before it answers anything else. */}
      {lead ? (
        <section className="shell band-pad lift-in">
          <div className="reg">
            <h2 className="reg-label">Ventures</h2>
            <div className="reg-body">
              <ul className="entries">
                <li>
                  <div className="entry-head">
                    <h3 className="display claim-sm">{lead.name}</h3>
                    <span className="entry-status">{STATUS_LABEL[lead.status]}</span>
                  </div>
                  <p style={{ margin: "1rem 0 0", maxWidth: "58ch", fontSize: "1.0625rem", lineHeight: 1.6 }}>
                    {lead.summary}
                  </p>
                  <p style={{ margin: "0.85rem 0 0", maxWidth: "62ch", color: "var(--muted)", lineHeight: 1.7 }}>
                    {lead.problem}
                  </p>
                  <p style={{ marginTop: "1.75rem" }}>
                    <Link href="/ventures" className="go">
                      The full entry, including what is still open <ArrowRight />
                    </Link>
                  </p>
                </li>
              </ul>
              <p style={{ marginTop: "1.5rem", fontSize: "0.9375rem", color: "var(--muted)" }}>
                One venture. When there is a second it will be listed here on the same terms.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Presence. The brief asked for a national map; this is the honest one. */}
      <hr className="rule" />
      <section className="shell band-pad lift-in">
        <div className="reg">
          <h2 className="reg-label">Where we operate</h2>
          <div className="reg-body">
            <div className="presence">
              {PRESENCE.map((place) => (
                <div key={place.area} className="place">
                  <h3>
                    {place.area}, {place.state}
                  </h3>
                  <p>
                    <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{place.status}.</strong>{" "}
                    {place.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="notice" style={{ marginTop: "2.5rem" }}>
              <h3 className="display" style={{ fontSize: "1.375rem", margin: 0 }}>
                {REACH_GAP.heading}
              </h3>
              <p style={{ marginTop: "0.85rem" }}>{REACH_GAP.body}</p>
            </div>

            <p className="prose" style={{ marginTop: "1.75rem" }}>
              <span style={{ color: "var(--muted)", lineHeight: 1.72 }}>{REACH_GAP.rural}</span>
            </p>
          </div>
        </div>
      </section>

      {/* How we work. A definition list, not four identical cards. */}
      <hr className="rule" />
      <section className="shell band-pad lift-in">
        <div className="reg">
          <h2 className="reg-label">How we work</h2>
          <dl className="reg-body" style={{ margin: 0 }}>
            {PRACTICE.map((item, i) => (
              <div
                key={item.title}
                style={{
                  paddingBlock: "1.75rem",
                  borderTop: i === 0 ? "none" : "1px solid var(--line)",
                }}
              >
                <dt className="display" style={{ fontSize: "1.5rem", letterSpacing: "-0.025em" }}>
                  {item.title}
                </dt>
                <dd style={{ margin: "0.75rem 0 0", color: "var(--muted)", lineHeight: 1.72, maxWidth: "66ch" }}>
                  {item.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* The company's own voice. */}
      <section className="on-leaf">
        <div className="shell band-pad">
          <div className="reg">
            <h2 className="reg-label">Talk to us</h2>
            <div className="reg-body">
              <p className="display claim-sm" style={{ color: "var(--on-leaf)", maxWidth: "20ch" }}>
                A practice, a service, or a question about the work.
              </p>
              <p style={{ marginTop: "1.35rem", maxWidth: "52ch", lineHeight: 1.7 }}>
                We are a small team, building in the open about what is finished and what is not.
                If you commission services, run a general practice, or want to know how the
                matching actually works, write to us.
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
