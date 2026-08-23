import type { Metadata } from "next";
import { PRACTICE } from "@/content/company";
import { PENDING, PENDING_PROMISE } from "@/content/disclosures";
import { REACH_GAP } from "@/content/presence";

export const metadata: Metadata = {
  title: "Approach",
  description:
    "How Wattle Technologies builds: access before quality, matching keyed to clinicians, compliance enforced in the build — and a published list of what we do not yet hold.",
  alternates: { canonical: "/approach" },
};

export default function ApproachPage() {
  return (
    <>
      <section className="shell band-pad" style={{ paddingBottom: "var(--gap-4)" }}>
        <h1 className="display claim">How we work.</h1>
        <p className="lead" style={{ marginTop: "var(--gap-3)" }}>
          Four commitments. Each is enforced somewhere in a build pipeline rather than promised on
          a page, which is the only version of a commitment worth publishing.
        </p>
      </section>

      <section className="shell" style={{ paddingBottom: "var(--gap-5)" }}>
        {/* The title is the heading, not a label repeated beside itself. The register grid is
            for columns that hold DIFFERENT things; a principle is one thing. */}
        <dl style={{ margin: 0 }}>
          {PRACTICE.map((item) => (
            <div key={item.title} className="lift-in" style={{ paddingBlock: "var(--gap-4)", borderTop: "1px solid var(--line)" }}>
              <dt className="display" style={{ fontSize: "clamp(1.375rem, 2.6vw, 1.875rem)", letterSpacing: "-0.028em", maxWidth: "24ch" }}>
                {item.title}
              </dt>
              <dd style={{ margin: "0.9rem 0 0", color: "var(--muted)", lineHeight: 1.72, maxWidth: "66ch" }}>
                {item.body}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* The access gap: the company's actual position, stated where a competitor would put a
          market-size slide. */}
      <section className="on-leaf">
        <div className="shell band-pad">
          <div className="reg">
            <h2 className="reg-label">The gap</h2>
            <div className="reg-body">
              <p className="display claim-sm" style={{ color: "var(--on-leaf)", maxWidth: "18ch" }}>
                {REACH_GAP.heading}
              </p>
              <p style={{ marginTop: "1.35rem", maxWidth: "58ch", lineHeight: 1.72 }}>{REACH_GAP.body}</p>
              <p style={{ marginTop: "1.1rem", maxWidth: "58ch", lineHeight: 1.72 }}>{REACH_GAP.rural}</p>
            </div>
          </div>
        </div>
      </section>

      {/* THE TRUST SPINE, INVERTED.
          A large health-technology company front-loads certifications, an advisory board and
          outcomes data. This company holds none of them, so it front-loads the absence instead —
          at the weight the badges would have had. A fabricated certification mark aimed at
          commissioners and regulators is not a placeholder, it is a misrepresentation. */}
      <section className="shell band-pad">
        <div className="reg">
          <h2 className="reg-label">What we do not have</h2>
          <div className="reg-body">
            <p className="display claim-sm" style={{ maxWidth: "22ch" }}>
              The credentials a company like this is expected to display.
            </p>
            <p className="prose" style={{ marginTop: "1.35rem" }}>{PENDING_PROMISE}</p>

            <dl style={{ margin: "var(--gap-4) 0 0" }}>
              {PENDING.map((d) => (
                <div key={d.item} style={{ paddingBlock: "1.35rem", borderTop: "1px solid var(--line)" }}>
                  <dt style={{ fontWeight: 600, fontSize: "1rem" }}>{d.item}</dt>
                  <dd style={{ margin: "0.45rem 0 0", color: "var(--muted)", lineHeight: 1.7, maxWidth: "68ch" }}>
                    {d.state}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
