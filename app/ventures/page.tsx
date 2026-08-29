import type { Metadata } from "next";
import Link from "next/link";
import { VENTURES, STATUS_LABEL } from "@/content/ventures";
import { Ticker } from "../ticker";
import { PRESENCE, REACH_GAP } from "@/content/presence";

export const metadata: Metadata = {
  title: "Ventures",
  description: "What Wattle Technologies has built, where it operates, and what is not settled yet.",
  alternates: { canonical: "/ventures" },
};

/**
 * VENTURES — the Parable format, in this site's own scheme.
 *
 * What was borrowed is the STRUCTURE, not the look: a micro uppercase letterspaced label, a
 * large headline set upper-left rather than centred, and one dominant full-bleed visual holding
 * the viewport. Parable does that in serif over a calm blue illustration; this does it in the
 * display face over a flat brand hue, because the spec allows one colour per section and a
 * borrowed palette would put twelve hues on a ten-hue site.
 *
 * A SHORT LIST MEANS THE PAGE CAN BE GENEROUS. Two entries do not need a grid — they need
 * a plate. Each venture gets a full band of its own, so a second entry extends the page rather
 * than shrinking the first into a third of a row.
 *
 * "Still open" keeps the same weight as "What exists". That symmetry is the argument of the whole
 * site, and it is the one thing about this page that is not a style decision.
 */
export default function VenturesPage() {
  return (
    <>
      {/* Upper-left headline over a full-bleed ground — the Parable move. */}
      <section className="section is-black" style={{ paddingTop: "12vw", paddingBottom: "8vw" }}>
        <div className="padding-global">
          <p className="text-style-tag">Ventures — {String(VENTURES.length).padStart(2, "0")}</p>
          <h1 className="heading-style-h1" style={{ marginTop: "1.5vw" }}>What we build.</h1>
          {/* THE FORMAT NO LONGER EXPLAINS ITSELF. This was a 25-word uppercase line describing
              the shape of the entries below it — "each entry says what exists today, where it
              operates, and what has not been settled, in that order". A page that has to
              announce its own structure before showing it is a page that does not trust the
              structure. The entries say it by being it. */}
        </div>
      </section>

      <Ticker
        className="is-white"
        items={["Three ventures", "One live", "One in build", "One still a question"]}
      />

      {VENTURES.map((venture) => {
        /* The summary is one sentence with a natural break at the em-dash: a claim, then the
           mechanism. Set whole in an ultra-heavy display face it ran to seven lines and stopped
           being a headline. The claim becomes the heading and the mechanism becomes body — no
           copy is rewritten, it is split where the sentence already splits. */
        const [claim, ...rest] = venture.summary.split(" — ");
        const mechanism = rest.join(" — ");
        return (
        <div key={venture.slug} id={venture.slug}>
          {/* THE PLATE IS BLACK NOW.

              It was a full-bleed gold-to-green gradient with the name in heavy black display
              type. That was tolerable when there was one venture. At three it is the same loud
              band three times down one page, and the register is supposed to read as a list of
              facts rather than as three product launches. The name is still the dominant thing
              on its plate; it just no longer arrives on a colour field. */}
          <section className="venture-plate">
            <p className="display-wordmark">{venture.name}</p>
          </section>

          <section className="section is-black">
            <div className="padding-global">
              <div className="inner-section-wrapper">
                <p className="text-style-tag">{STATUS_LABEL[venture.status]}</p>
                <div>
                  <h2 className="heading-style-h3">{claim}</h2>
                  {mechanism ? (
                    <p className="subheading-large max-width-medium" style={{ marginTop: "1.5vw" }}>
                      {mechanism.charAt(0).toUpperCase() + mechanism.slice(1)}
                    </p>
                  ) : null}
                  <p className="body-text max-width-medium" style={{ marginTop: "2vw" }}>{venture.problem}</p>
                  {venture.areas.length > 0 ? (
                    <p className="text-style-mono" style={{ marginTop: "2vw" }}>
                      {venture.areas.join("  /  ")}
                    </p>
                  ) : null}
                  <p className="body-text text-style-muted" style={{ marginTop: ".75vw", maxWidth: "52ch" }}>
                    {venture.areasNote}
                  </p>
                </div>
              </div>

              {/* THE COVERAGE, AREA BY AREA — MOVED HERE FROM THE HOME PAGE.

                  It used to be a full section on the front page: a headline about most of
                  Australia being unreached, and a three-column list of the two areas with one of
                  them marked as having nobody in it. That is a fact about ADHDME's matching, not
                  about Wattle Technologies, and on the company's front page it read as the
                  company's own footprint. Here it sits under the product it is true of, at the
                  size a qualifier should be.

                  Only rendered for a venture that actually claims areas — the second entry claims
                  none, and an empty table under it would imply it had a map. */}
              {venture.areas.length > 0 ? (
                <div className="venture-coverage">
                  <p className="text-style-tag">Where the matching reaches</p>
                  <ul className="rule-list">
                    {PRESENCE.map((place) => (
                      <li key={place.area}>
                        <span className="heading-style-h5">{place.area}, {place.state}</span>
                        <span className="text-style-mono">{place.status}</span>
                        <span className="body-text">{place.short}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="body-text text-style-muted venture-coverage-note">{REACH_GAP.short}</p>
                </div>
              ) : null}

              {/* Equal weight, deliberately. */}
              <div className="card-grid two-up" style={{ marginTop: "2vw" }}>
                <div>
                  <p className="text-style-tag">What exists</p>
                  <ul className="rule-list" style={{ marginTop: "1vw" }}>
                    {venture.built.map((line) => (
                      <li key={line} className="body-text">{line}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-style-tag">Still open</p>
                  <ul className="rule-list" style={{ marginTop: "1vw" }}>
                    {venture.open.map((line) => (
                      <li key={line} className="body-text">{line}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {venture.href ? (
                <p style={{ marginTop: "3vw" }}>
                  {/* New tab with rel, matching how every other outbound link on this site
                      behaves — a visitor following a venture to its own site has not finished
                      with the register they were reading. */}
                  <a
                    className="button"
                    href={venture.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Visit {venture.name}
                  </a>
                </p>
              ) : (
                /* No link while the product has no address of its own. A company site does not
                   send visitors to a preview deployment. */
                <p className="text-style-mono" style={{ marginTop: "3vw", opacity: 0.65 }}>
                  Not yet published at its own address
                </p>
              )}
            </div>
          </section>
        </div>
        );
      })}

      <section className="section is-black">
        <div className="padding-global">
          <div className="cta-block is-eucalypt">
            <h2 className="heading-style-h4">
              A list this short says so, rather than padding the page with a roadmap
            </h2>
            <Link href="/contact" className="button button-pressed">Ask what is live</Link>
          </div>
        </div>
      </section>
    </>
  );
}
