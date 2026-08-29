import Link from "next/link";
import { COMPANY, PRACTICE } from "@/content/company";
import { VENTURES, STATUS_LABEL } from "@/content/ventures";
import { WattleBloom } from "./wattle-bloom";
import { HeroCanvas } from "./hero-canvas";
import { EnterGate } from "./enter-gate";
import { Starfield } from "./starfield";
import { PerfProbe } from "./perf-probe";
import { BEATS, EMBLEM } from "@/content/emblem";
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
      {/* 1. THE GATE — a scrollable shot, not a single screen.

          THE FIRST SCREEN IS STILL BARE: the plant, and a cue to keep going. Everything else
          arrives on the way down. That keeps the minimalism that was asked for while giving the
          animation somewhere to happen, because the previous gate had a contradiction in it —
          the bloom ran 0 -> 0.86 on a timer and 0.86 -> 1.0 on SCROLL, while the same stylesheet
          locked scroll until entry. The last stage of the animation could never run.

          The stage is sticky and the beats scroll past it, so the plant is pinned in frame and
          opening while the words move. That is the reference's structure: the art is not a
          backdrop the text sits on, it is the thing being watched, and the text is what passes. */}
      <section className="hero">
        <div className="gate-stage">
          <Starfield />
          <HeroCanvas />
          <PerfProbe />
          <div className="hero-inner">
            <WattleBloom className="hero-bloom" />
          </div>
        </div>

        {/* Pulled up under the sticky stage so the two occupy the same screens. The hero's total
            height is this track's height — three viewports of scroll to open one flower.

            THE FIRST SCREEN CARRIES THE FIRST HEADING, and the empty beat that used to hold the
            plant alone is gone. It bought a bare opening shot at the cost of a screen with
            nothing on it and a scroll cue floating in the corner with nothing to explain — a
            visitor had to scroll a whole viewport before the gate told them anything at all.
            Heading at the top, cue directly beneath it: the cue now sits under something that
            gives it a reason. */}
        <div className="gate-track">
          {BEATS.map((beat, i) => (
            <div className={`gate-beat${i === 0 ? " gate-beat-open" : ""}`} key={beat.tag}>
              <div className="gate-copy">
                <p className="gate-tag">{beat.tag}</p>
                <p className="gate-lead">{beat.lead}</p>
                <p className="gate-line">{beat.body}</p>
                {/* The cue belongs to the first beat only — after that the reader has already
                    demonstrated they know how to get to the next one. */}
                {i === 0 ? <p className="gate-cue" aria-hidden="true">Scroll</p> : null}
              </div>
            </div>
          ))}

          <div className="gate-beat gate-beat-last">
            <div className="gate-copy">
              <p className="gate-binomial">{EMBLEM.botanical}</p>
              <p className="gate-common">{EMBLEM.common}</p>
              <p className="gate-emblem">{EMBLEM.emblem}</p>
              <EnterGate />
            </div>
          </div>
        </div>
      </section>

      {/* 2. TICKER */}
      <Ticker
        className="is-wattle text-colour-black"
        items={["Health software", "Australia", "ADHDME in build", "Access before quality"]}
      />

      {/* 3. STATEMENT.

          THE TAGLINE IS NOT SET IN THE POSTER FACE ANY MORE. It was heading-style-h1 — Bowlby
          One, ultra-heavy, at 8em — on the brightest band on the site, which is the loudest
          treatment this design system can produce. Shouting a sentence about people who cannot
          reach care is a tonal mismatch: the display face is right for a NAME and wrong for a
          claim about somebody's difficulty getting seen.

          Still an <h1>, because it is still the page's heading. Only its clothes changed. */}
      <section className="section grad-wattle-eucalypt text-colour-black">
        <div className="padding-global">
          <h1 className="statement-lead reveal">{COMPANY.tagline}</h1>
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
