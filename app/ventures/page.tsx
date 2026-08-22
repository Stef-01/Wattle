import type { Metadata } from "next";
import { VENTURES, STATUS_LABEL } from "@/content/ventures";

export const metadata: Metadata = {
  title: "Ventures",
  description: "What Wattle Technologies has built, what it is still building, and what is not settled yet.",
  alternates: { canonical: "/ventures" },
};

/**
 * The venture register, rendered.
 *
 * The section that makes this page different from a product page is "Still open". It is not a
 * disclaimer bolted to the bottom — it sits in the same visual weight as everything else,
 * because a company that only publishes what works is asking to be believed about the rest.
 */
export default function VenturesPage() {
  return (
    <>
      <section className="section" style={{ paddingBottom: "2.5rem" }}>
        <div className="shell">
          <p className="eyebrow">Ventures</p>
          <h1 className="display prose-h1">What we build.</h1>
          <p className="lede" style={{ marginTop: "1.5rem", maxWidth: "50ch" }}>
            One venture, in build. Each entry says what exists today, where it operates, and what
            has not been settled — in that order, and without softening the third.
          </p>
        </div>
      </section>

      <section className="shell" style={{ paddingBottom: "5rem", display: "grid", gap: "2.5rem" }}>
        {VENTURES.map((venture) => (
          <article key={venture.slug} className="venture" id={venture.slug}>
            <div className="venture-head">
              <span className="pill">{STATUS_LABEL[venture.status]}</span>
              <h2 className="display venture-name">{venture.name}</h2>
              <p className="venture-summary">{venture.summary}</p>
              <ul className="meta-row" style={{ marginTop: "1.5rem" }}>
                <li>
                  <strong style={{ color: "var(--ink)", fontWeight: 600 }}>Areas served:</strong>{" "}
                  {venture.areas.join(" · ")}
                </li>
                {venture.href ? (
                  <li>
                    <a href={venture.href} style={{ color: "var(--gold)" }}>
                      Visit {venture.name}
                    </a>
                  </li>
                ) : (
                  /* No link is published while the product has no address of its own. A company
                     site does not send visitors to a preview deployment. */
                  <li>Not yet published at its own address.</li>
                )}
              </ul>
            </div>

            <div className="venture-body">
              <div>
                <h4>The problem</h4>
                <p style={{ margin: "0 0 2.25rem", color: "var(--muted)", lineHeight: 1.72 }}>
                  {venture.problem}
                </p>

                <h4>Still open</h4>
                <ul className="blossom-list">
                  {venture.open.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4>What exists</h4>
                <ul className="blossom-list">
                  {venture.built.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
