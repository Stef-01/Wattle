import type { Metadata } from "next";
import { VENTURES, STATUS_LABEL } from "@/content/ventures";

export const metadata: Metadata = {
  title: "Ventures",
  description: "What Wattle Technologies has built, and what is not settled yet.",
  alternates: { canonical: "/ventures" },
};

/**
 * The register, rendered as plainly as it is written.
 *
 * "Open" sits in the same size and colour as "Built" rather than shrinking into a footnote.
 * That symmetry IS the page: a company that publishes only what works is asking to be believed
 * about the rest.
 */
export default function VenturesPage() {
  return (
    <>
      <section className="section" style={{ paddingBottom: "2.5rem" }}>
        <div className="shell">
          <p className="eyebrow">Ventures</p>
          <h1 className="display prose-h1">What we build.</h1>
        </div>
      </section>

      <section className="shell" style={{ paddingBottom: "6rem" }}>
        <ul className="entries">
          {VENTURES.map((venture) => (
            <li key={venture.slug} id={venture.slug} className="entry">
              <div className="entry-head">
                <h2 className="display entry-name">{venture.name}</h2>
                <span className="entry-status">{STATUS_LABEL[venture.status]}</span>
              </div>

              <p className="entry-summary">{venture.summary}</p>
              <p className="entry-problem">{venture.problem}</p>

              <p className="entry-areas">
                <strong>{venture.areas.join(" · ")}</strong> — {venture.areasNote}
              </p>

              <div className="entry-cols">
                <div>
                  <p className="entry-label">Built</p>
                  <ul className="entry-list">
                    {venture.built.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="entry-label">Open</p>
                  <ul className="entry-list">
                    {venture.open.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
