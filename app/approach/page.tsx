import type { Metadata } from "next";
import { PRACTICE } from "@/content/company";
import { PENDING, PENDING_PROMISE } from "@/content/disclosures";
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
          <h1 className="heading-style-h1" style={{ marginTop: "1vw" }}>How we work.</h1>
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
            Four commitments, each enforced somewhere in a build pipeline rather than promised on
            a page — which is the only version of a commitment worth publishing.
          </p>

          <div className="approach-list">
            <p className="text-style-tag">
              What we hold to<span className="count">{String(PRACTICE.length).padStart(2, "0")}</span>
            </p>
            <DisclosureList
              items={PRACTICE.map((p) => ({ title: p.title, body: p.short, more: p.body }))}
            />
          </div>

          {/* THE TRUST SPINE, INVERTED. A large health-technology company front-loads its
              certifications here. This one holds none of them, so it front-loads the absence at
              the weight the badges would have had. */}
          <div className="approach-list">
            <p className="text-style-tag">
              What we do not have<span className="count">{String(PENDING.length).padStart(2, "0")}</span>
            </p>
            <DisclosureList
              tone="absent"
              items={PENDING.map((d) => ({ title: d.item, body: d.state }))}
            />
            {/* ONE LINE, NOT A SECTION. This used to be a full-bleed pale band of its own
                headed "Why we publish that", two blocks below the list it explains, with a red
                marquee of the same absences in between and a closing panel restating the
                position a third time. The page said the same thing three times in three
                treatments.

                A list of things a company does not have, with no sentence saying why it is
                published, reads as a confession rather than a position — so the sentence stays.
                It just sits under the list it belongs to, at body weight, and takes one line
                instead of a screen. */}
            <p className="body-text text-style-muted approach-promise">{PENDING_PROMISE}</p>
          </div>

          <p className="body-text text-style-muted approach-rural">{REACH_GAP.rural}</p>
        </div>
      </section>

    </>
  );
}
