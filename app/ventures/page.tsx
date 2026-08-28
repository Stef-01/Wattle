import type { Metadata } from "next";
import Link from "next/link";
import { VENTURES, STATUS_LABEL } from "@/content/ventures";
import { Ticker } from "../ticker";

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
          <p className="subheading-hero max-width-medium" style={{ marginTop: "2vw" }}>
            Each entry says what exists today, where it operates, and what has not been settled —
            in that order, and without softening the third
          </p>
        </div>
      </section>

      <Ticker
        className="is-white"
        items={["Two ventures", "One in build, one in scoping", "Neither at its own address", "Sydney and the Gold Coast"]}
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
          {/* The dominant visual: the venture's name at plate scale on a flat hue. */}
          <section
            className="grad-wattle-eucalypt"
            style={{ display: "grid", placeItems: "center", padding: "7vw var(--gutter)", containerType: "inline-size" }}
          >
            <p className="display-wordmark" style={{ fontSize: "min(12vw, 15cqw)" }}>{venture.name}</p>
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
                  <p className="text-style-mono" style={{ marginTop: "2vw" }}>
                    {venture.areas.join("  /  ")}
                  </p>
                  <p className="body-text text-style-muted" style={{ marginTop: ".75vw", maxWidth: "52ch" }}>
                    {venture.areasNote}
                  </p>
                </div>
              </div>

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
                  <a className="button" href={venture.href}>Visit {venture.name}</a>
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
