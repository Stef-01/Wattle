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
import { DragRail } from "./drag-rail";
import { RevealWords, CountUp } from "./story";
import { STATUS_LABEL as VSTATUS } from "@/content/ventures";

/**
 * HOME — the page architecture from the spec: gate, ticker, statement, card grid, featured
 * 50/50, CTA block, footer.
 *
 * ONE COLOUR PER SECTION, never three in a band. Black gate, gold ticker, gradient statement,
 * black grid, white featured, eucalypt CTA. The discipline is what stops ten saturated hues
 * reading as a clown suit.
 */
export default function HomePage() {
  const PRESENCE_COUNT = 2;

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
          <p className="subheading-hero max-width-medium reveal" style={{ marginTop: "var(--space-l)" }}>
            The routing layer of care — the part that decides whether anyone reaches a clinician
          </p>
        </div>
      </section>

      {/* 5. THE VENTURES, AS A RAIL YOU CAN THROW.

          Was a single featured card for the one venture that existed. There are three now, and a
          rail is the honest shape for a register that is going to keep growing — a native
          scroller with snap, so touch gets platform momentum and a keyboard can tab through it,
          with pointer-drag added on top for the one input that has no native equivalent. */}
      <section className="section is-black">
        <div className="padding-global">
          <div className="inner-section-wrapper">
            <p className="text-style-tag">What we build<span className="count">{String(VENTURES.length).padStart(2, "0")}</span></p>
            <h2 className="heading-style-h3 reveal">Three ventures. Three stages.</h2>
          </div>
        </div>
        <DragRail label="Ventures">
          {VENTURES.map((v) => (
            <article className="card" data-tilt data-venture={v.slug} key={v.slug}>
              <div className="card-body">
                <p className="text-style-tag">{VSTATUS[v.status]}</p>
                <h3 className="heading-style-h5" style={{ marginTop: ".4em" }}>{v.name}</h3>
                <p className="body-text" style={{ marginTop: "1em" }}>{v.summary}</p>
                <p style={{ marginTop: "1.4em" }}>
                  <Link href="/ventures" className="button button-small">The full entry</Link>
                </p>
              </div>
            </article>
          ))}
        </DragRail>
      </section>

      {/* 6. THE NARRATIVE. Four beats, arriving in order as they cross the fold.

          NOT PINNED. A pinned sequence takes the scroll hostage for its own length, which the
          skill lists as Pitfall 6 and which on a phone is the difference between reading a page
          and being driven through one. The order is carried by the beats arriving in order,
          which is the part a reader actually perceives.

          The copy is the four commitments already in the register — no new claims were written
          for a storytelling section, because a narrative built out of sentences invented to fill
          beats is exactly the thing this site's gates exist to prevent. */}
      <section className="section is-black has-bloom" id="how-it-works">
        {/* Two clusters, different sizes and drift phases, well off the reading column. */}
        <span className="bloom-bg" aria-hidden="true"
              style={{ width: "38vw", height: "38vw", right: "-8vw", top: "6%" }} />
        <span className="bloom-bg" aria-hidden="true"
              style={{ width: "22vw", height: "22vw", left: "-6vw", bottom: "12%" }} />
        <div className="padding-global">
          <div className="inner-section-wrapper">
            <p className="text-style-tag">How it works</p>
            <div>
              <h2 className="heading-style-h3 reveal">Four commitments.</h2>
              <RevealWords
                className="subheading-large"
                text="Each one enforced somewhere you can check it."
              />
            </div>
          </div>

          <ol className="beats">
            {PRACTICE.map((item) => (
              <li className="beat" key={item.title}>
                <div className="beat-body">
                  <h3 className="heading-style-h5">{item.title}</h3>
                  <RevealWords className="body-text" text={item.short} />
                </div>
              </li>
            ))}
          </ol>

          {/* THE NUMBERS, INCLUDING THE ZERO. Every figure is one the register can source, and
              one of them is nought — a stats band is where a company reaches for lives improved,
              and this one has no outcomes data and says so. The zero is the honest number. */}
          <div className="stats">
            <CountUp to={VENTURES.length} label="Ventures" note="One live. One in build. One a question." />
            <CountUp to={PRESENCE_COUNT} label="Areas" note="Sydney. Gold Coast." />
            <CountUp to={0} label="Clinicians on the Gold Coast" note="A focus area with nobody in it." />
          </div>
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
