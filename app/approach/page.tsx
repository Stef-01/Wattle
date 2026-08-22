import type { Metadata } from "next";
import Link from "next/link";
import { PRACTICE } from "@/content/company";

export const metadata: Metadata = {
  title: "Approach",
  description: "How Wattle Technologies builds: access first, matching keyed to clinicians, compliance in the build, figures that stay indicative until sourced.",
  alternates: { canonical: "/approach" },
};

export default function ApproachPage() {
  return (
    <>
      <section className="section" style={{ paddingBottom: "3rem" }}>
        <div className="shell">
          <p className="eyebrow">Approach</p>
          <h1 className="display prose-h1">How we work.</h1>
          <p className="lede" style={{ marginTop: "1.5rem", maxWidth: "52ch" }}>
            Four commitments. Each one is enforced somewhere in a build pipeline rather than
            promised on a page, which is the only version of a commitment worth publishing.
          </p>
        </div>
      </section>

      <div className="shell prose" style={{ paddingBottom: "1rem" }}>
        {PRACTICE.map((item, index) => (
          <section key={item.title} style={{ paddingBlock: "2.75rem", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "minmax(0,1fr)" }}>
              <span className="card-index" style={{ margin: 0 }}>{String(index + 1).padStart(2, "0")}</span>
              <h2 className="display prose-h2" style={{ margin: 0, maxWidth: "24ch" }}>
                {item.title}
              </h2>
              <p style={{ margin: 0 }}>{item.body}</p>
            </div>
          </section>
        ))}
      </div>

      <section className="band">
        <div className="shell band-inner">
          <p className="eyebrow eyebrow-on-leaf">The short version</p>
          <h2 className="display">If we cannot show you where a claim came from, we do not make it.</h2>
          <p>
            That rule is why our public figures are ranges, why our clinician directory is gated
            until the people in it confirm their own entries, and why this site does not tell you
            how many customers we have.
          </p>
          <div className="hero-actions">
            <Link href="/ventures" className="btn btn-on-leaf">
              See what that looks like
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
