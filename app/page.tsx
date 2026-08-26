import Link from "next/link";
import { COMPANY, PRACTICE } from "@/content/company";
import { VENTURES, STATUS_LABEL } from "@/content/ventures";
import { PRESENCE, REACH_GAP } from "@/content/presence";
import { WattleBloom } from "./wattle-bloom";
import { HeroCanvas } from "./hero-canvas";
import { MotionToggle } from "./motion-toggle";
import { EnterGate } from "./enter-gate";
import { Ticker } from "./ticker";

/**
 * HOME — the page architecture from the spec: gate, ticker, statement, card grid, featured
 * 50/50, CTA block, footer.
 *
 * ONE COLOUR PER SECTION, never three in a band. Black gate, gold ticker, gradient statement,
 * black grid, white featured, eucalypt CTA. The discipline is what stops ten saturated hues
 * reading as a clown suit.
 */
export default function HomePage() {
  const lead = VENTURES[0];

  return (
    <>
      {/* 1. THE GATE. Full viewport, black, one subject, one pill CTA on top of it. */}
      {/* THE GATE. The animation, and one way in. Everything else waits behind the click. */}
      <section className="hero">
        <HeroCanvas />
        <div className="hero-inner">
          <WattleBloom className="hero-bloom" />
        </div>
        <EnterGate />
        <MotionToggle />
      </section>

      {/* 2. TICKER */}
      <Ticker
        className="is-wattle text-colour-black"
        items={["Health software", "Australia", "ADHD.ME in build", "Access before quality"]}
      />

      {/* 3. STATEMENT. One headline, justified uppercase subhead, two-stop vertical gradient. */}
      <section className="section grad-wattle-eucalypt text-colour-black">
        <div className="padding-global">
          <h1 className="heading-style-h1 reveal">{COMPANY.tagline}</h1>
          <p className="subheading-hero max-width-medium reveal" style={{ marginTop: "2vw" }}>
            We build the routing layer of care — the part that decides whether a person who needs a
            clinician ever reaches one
          </p>
        </div>
      </section>

      {/* 4. CARD GRID — the four commitments. Black section, so the offset shadow takes gold. */}
      <section className="section is-black">
        <div className="padding-global">
          <div className="inner-section-wrapper">
            <p className="text-style-tag">How we work</p>
            <h2 className="heading-style-h3 reveal">Four commitments, enforced in the build</h2>
          </div>
          <div className="card-grid">
            {PRACTICE.map((item, i) => (
              // The second card takes a eucalypt ground so it does not read as a repeat of the
              // first — .card sets its white background after the .is-* utilities, so the colour
              // is applied inline to win on source order. Text stays black (the gate clears
              // black-on-eucalypt) and the hover shadow stays gold on this black section.
              <article
                className="card reveal"
                key={item.title}
                style={i === 1 ? { background: "var(--eucalypt)" } : undefined}
              >
                <div className="card-body">
                  <h3 className="heading-style-h5">{item.title}</h3>
                  <p className="body-text" style={{ marginTop: "1vw" }}>{item.short}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURED 50/50 — the venture, in one bordered card. */}
      {lead ? (
        <section className="section is-black">
          <div className="padding-global">
            <article className="card card-featured reveal">
              {/* NOT .card-media — that class absolutely positions every child to fill a fixed-ratio
                  image box, which is right for a photo and wrong for type. A plain panel keeps
                  the wordmark in normal flow where it can actually be seen. */}
              <div className="is-wattle" style={{ display: "grid", placeItems: "center", padding: "2vw", containerType: "inline-size", minHeight: "18vw" }}>
                <p className="display-wordmark" style={{ color: "var(--black)" }}>
                  {lead.name}
                </p>
              </div>
              <div className="card-body" style={{ padding: "2vw" }}>
                <p className="text-style-tag">{STATUS_LABEL[lead.status]}</p>
                <h3 className="heading-style-h4" style={{ marginTop: ".5vw" }}>
                  ADHD assessment you can actually reach
                </h3>
                <p className="body-text" style={{ marginTop: "1vw" }}>{lead.problem}</p>
                <p className="text-style-mono" style={{ marginTop: "1.5vw" }}>
                  {lead.areas.join(" / ")}
                </p>
                <p style={{ marginTop: "1.5vw" }}>
                  <Link href="/ventures" className="button button-small">The full entry</Link>
                </p>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {/* 6. PRESENCE — the honest map. Rule list, not cards. */}
      <section className="section is-white">
        <div className="padding-global">
          <div className="inner-section-wrapper">
            <p className="text-style-tag">Where we operate</p>
            <div>
              <h2 className="heading-style-h3 reveal">{REACH_GAP.heading}</h2>
              <p className="subheading-large reveal" style={{ marginTop: "1.5vw", maxWidth: "48ch" }}>
                {REACH_GAP.short}
              </p>
            </div>
          </div>
          <ul className="rule-list">
            {PRESENCE.map((p) => (
              <li key={p.area} className="reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2vw" }}>
                <span className="heading-style-h5">{p.area}, {p.state}</span>
                <span className="text-style-mono">{p.status}</span>
                <span className="body-text">{p.short}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. CTA BLOCK */}
      <section className="section is-black">
        <div className="padding-global">
          <div className="cta-block is-eucalypt reveal">
            <h2 className="heading-style-h4">Talk to us about what is actually live</h2>
            <Link href="/contact" className="button button-pressed">Get in touch</Link>
          </div>
        </div>
      </section>
    </>
  );
}
