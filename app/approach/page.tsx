import type { Metadata } from "next";
import { PRACTICE } from "@/content/company";
import { SYSTEM_DEFINITION, NEGLECTED, APPROACH_LEDE } from "@/content/approach";
import { REACH_GAP } from "@/content/presence";
import { DisclosureList } from "../disclosure-list";

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
          {/* "How we work" described the company to itself. This names who the work is for, and
              it is the one sentence on the site that says what makes this company different from
              every other piece of health software: everyone else is built for the moment
              somebody arrives. */}
          <h1 className="heading-style-h1" style={{ marginTop: "1vw" }}>
            Built for the people who never arrive.
          </h1>
          <p className="subheading-large max-width-medium" style={{ marginTop: "2vw" }}>
            {APPROACH_LEDE}
          </p>
        </div>
      </section>

      {/* THE BAND STAYS. Three flat hues rather than a photograph, because there is no
          photography in this tree and a stock image would be the one dishonest thing on a page
          about honesty. */}
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

      {/* THE DEFINITION. The page turns on this, so it gets a section of its own and the widest
          type on the page after the headline. A company that builds health systems should be
          able to say what it thinks one IS, in its own words, without reaching for a diagram. */}
      <section className="section is-black">
        <div className="padding-global">
          <p className="text-style-tag">{SYSTEM_DEFINITION.tag}</p>
          <p className="definition-lead">{SYSTEM_DEFINITION.lead}</p>
          <div className="definition-body">
            {SYSTEM_DEFINITION.body.map((para) => (
              <p className="body-text" key={para.slice(0, 24)}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* THE PROBLEMS. Named plainly and without a statistic on any of them — every one could
          carry a number and every number would need a source this tree has not confirmed. The
          rule that a claim without a source fails the build does not get suspended because a
          figure would be persuasive. */}
      <section className="section is-black" style={{ paddingTop: 0 }}>
        <div className="padding-global">
          <div className="inner-section-wrapper">
            <p className="text-style-tag">
              Long-standing, and nobody&rsquo;s job
              <span className="count">{String(NEGLECTED.length).padStart(2, "0")}</span>
            </p>
            <p className="heading-style-h3" style={{ maxWidth: "26ch" }}>
              Four problems everyone in health can name and no one is paid to fix.
            </p>
          </div>
          <ul className="neglected">
            {NEGLECTED.map((n) => (
              <li key={n.title}>
                <h2 className="heading-style-h5">{n.title}</h2>
                <p className="body-text">{n.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* THE TWO LISTS, AS HEADINGS YOU CAN OPEN.

          They used to be three parallel columns of fully-expanded prose — an argument, four
          commitments and seven absences, roughly six hundred words all on screen at once, with
          the same four commitments repeated in long form further down the page. Every word was
          worth saying and none of it was getting read: a visitor scanning for "what does this
          company actually hold" met a wall.

          Same two lists, same order, same words. The headings are the page and the detail is one
          click away. The long-form repeat below is gone — it is what these now open into. */}
      <section className="section is-black">
        <div className="padding-global">
          <p className="approach-lede">
            Four commitments. Each one is enforced somewhere a person can check rather than
            promised on a page, because a commitment nobody can verify is a slogan wearing a
            commitment&rsquo;s clothes.
          </p>

          <div className="approach-list">
            <p className="text-style-tag">
              What we hold to<span className="count">{String(PRACTICE.length).padStart(2, "0")}</span>
            </p>
            <DisclosureList
              items={PRACTICE.map((p) => ({ title: p.title, body: p.short, more: p.body }))}
            />
          </div>

          <p className="body-text text-style-muted approach-rural">{REACH_GAP.rural}</p>
        </div>
      </section>

    </>
  );
}
