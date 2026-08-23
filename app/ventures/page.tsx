import type { Metadata } from "next";
import { VENTURES, STATUS_LABEL } from "@/content/ventures";

export const metadata: Metadata = {
  title: "Ventures",
  description: "The companies and products Wattle Technologies builds, what exists in each, and what is not settled yet.",
  alternates: { canonical: "/ventures" },
};

export default function VenturesPage() {
  return (
    <>
      <section className="shell band-pad" style={{ paddingBottom: "var(--gap-4)" }}>
        <h1 className="display claim">What we build.</h1>
        <p className="lead" style={{ marginTop: "var(--gap-3)" }}>
          Each entry says what exists today, where it operates, and what has not been settled — in
          that order, and without softening the third.
        </p>
      </section>

      <section className="shell" style={{ paddingBottom: "var(--gap-6)" }}>
        <ul className="entries">
          {VENTURES.map((venture) => (
            <li key={venture.slug} id={venture.slug} className="lift-in">
              <div className="reg">
                <div className="reg-label" style={{ paddingTop: "0.6rem" }}>
                  {STATUS_LABEL[venture.status]}
                </div>
                <div className="reg-body">
                  <h2 className="display claim-sm">{venture.name}</h2>
                  <p style={{ margin: "1rem 0 0", maxWidth: "58ch", fontSize: "1.0625rem", lineHeight: 1.6 }}>
                    {venture.summary}
                  </p>
                  <p style={{ margin: "0.85rem 0 0", maxWidth: "62ch", color: "var(--muted)", lineHeight: 1.72 }}>
                    {venture.problem}
                  </p>

                  <p style={{ margin: "1.5rem 0 0", fontSize: "0.9375rem", color: "var(--muted)" }}>
                    <strong style={{ color: "var(--ink)", fontWeight: 600 }}>
                      {venture.areas.join(" · ")}
                    </strong>{" "}
                    — {venture.areasNote}
                  </p>

                  <div className="split">
                    <div>
                      <h3 className="reg-label" style={{ paddingTop: 0, marginBottom: "0.9rem" }}>
                        What exists
                      </h3>
                      <ul className="stack">
                        {venture.built.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="reg-label" style={{ paddingTop: 0, marginBottom: "0.9rem" }}>
                        Still open
                      </h3>
                      <ul className="stack">
                        {venture.open.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <p style={{ marginTop: "var(--gap-3)", fontSize: "0.9375rem", color: "var(--muted)", maxWidth: "62ch" }}>
          One venture. A parent company with a portfolio of one says so, rather than padding the
          page with a roadmap and calling it a portfolio.
        </p>
      </section>
    </>
  );
}
