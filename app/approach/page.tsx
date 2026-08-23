import type { Metadata } from "next";
import Link from "next/link";
import { PRACTICE } from "@/content/company";
import { PENDING, PENDING_PROMISE } from "@/content/disclosures";
import { REACH_GAP } from "@/content/presence";
import { Ticker } from "../ticker";

export const metadata: Metadata = {
  title: "Approach",
  description:
    "How Wattle Technologies builds: access before quality, matching keyed to clinicians, compliance enforced in the build — and a published list of what we do not yet hold.",
  alternates: { canonical: "/approach" },
};

/**
 * APPROACH — the reference's slide structure: full-width title, a dominant three-panel band,
 * then three columns beneath it — one short statement and two labelled row-lists ruled off
 * from each other.
 *
 * IT FITS THIS PAGE ALMOST EXACTLY, which is why it was worth borrowing. The page already
 * carries two lists that belong side by side: four commitments the company keeps, and seven
 * credentials it does not hold. Setting them in the same treatment, at the same width, in the
 * same column rhythm, is the argument — a visitor reads them as one table rather than as a
 * claim followed by a disclaimer.
 *
 * The band is three flat hues rather than a photograph, because there is no photography in this
 * tree and a stock image would be the one dishonest thing on a page about honesty.
 */
export default function ApproachPage() {
  const bands = [
    { hue: "is-wattle", label: PRACTICE[0]?.title },
    { hue: "is-eucalypt", label: PRACTICE[1]?.title },
    { hue: "is-lorikeet", label: PRACTICE[2]?.title },
  ];

  return (
    <>
      <section className="section is-black" style={{ paddingTop: "11vw", paddingBottom: "3vw" }}>
        <div className="padding-global">
          <p className="text-style-tag">Approach</p>
          <h1 className="heading-style-h1" style={{ marginTop: "1vw" }}>How we work.</h1>
        </div>
      </section>

      {/* The band. Three panels, one hue each — the slide's image strip, in flat colour. */}
      <div className="cols-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
        {bands.map((b) => (
          <div
            key={b.label}
            className={b.hue}
            style={{ minHeight: "17vw", padding: "1.5vw", display: "flex", alignItems: "flex-end" }}
          >
            <p className="heading-style-h5">{b.label}</p>
          </div>
        ))}
      </div>

      {/* Three columns: statement, then the two ruled lists. */}
      <section className="section is-black">
        <div className="padding-global cols-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "3vw" }}>
          <div>
            <p className="heading-style-h6">
              Four commitments, each enforced somewhere in a build pipeline rather than promised on
              a page — which is the only version of a commitment worth publishing.
            </p>
            <p className="body-text text-style-muted" style={{ marginTop: "2vw" }}>
              {REACH_GAP.rural}
            </p>
          </div>

          <div>
            <p className="text-style-tag">What we hold to</p>
            <ul className="rule-list" style={{ marginTop: "1vw" }}>
              {PRACTICE.map((p) => (
                <li key={p.title}>
                  <p className="heading-style-h6">{p.title}</p>
                  <p className="body-text text-style-muted" style={{ marginTop: ".4vw" }}>{p.short}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            {/* THE TRUST SPINE, INVERTED. A large health-technology company front-loads its
                certifications here. This one holds none of them, so it front-loads the absence
                at the weight the badges would have had. */}
            <p className="text-style-tag">What we do not have</p>
            <ul className="rule-list" style={{ marginTop: "1vw" }}>
              {PENDING.map((d) => (
                <li key={d.item}>
                  <p className="heading-style-h6">{d.item}</p>
                  <p className="body-text text-style-muted" style={{ marginTop: ".4vw" }}>{d.state}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Ticker
        className="is-waratah text-colour-black"
        items={["No ISO 27001", "No SOC 2", "No advisory board", "No outcomes data", "No TGA determination"]}
      />

      {/* The promise that makes the absence a position rather than an apology. */}
      <section className="section is-bloom">
        <div className="padding-global">
          <div className="inner-section-wrapper" style={{ marginBottom: 0 }}>
            <p className="text-style-tag">Why we publish that</p>
            <p className="subheading-large max-width-medium">{PENDING_PROMISE}</p>
          </div>
        </div>
      </section>

      {/* The commitments argued out, for anybody who wants the long form. */}
      <section className="section is-black">
        <div className="padding-global">
          <ul className="rule-list">
            {PRACTICE.map((item) => (
              <li key={item.title} className="inner-section-wrapper" style={{ marginBottom: 0 }}>
                <p className="heading-style-h5">{item.title}</p>
                <p className="body-text max-width-medium">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section is-black" style={{ paddingTop: 0 }}>
        <div className="padding-global">
          <div className="cta-block is-eucalypt">
            <h2 className="heading-style-h4">
              If we cannot show you where a claim came from, we do not make it
            </h2>
            <Link href="/ventures" className="button button-pressed">See what that looks like</Link>
          </div>
        </div>
      </section>
    </>
  );
}
