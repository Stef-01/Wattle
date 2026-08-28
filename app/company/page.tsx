import type { Metadata } from "next";
import Image from "next/image";
import { COMPANY } from "@/content/company";
import Link from "next/link";
import { TEAM, TEAM_PUBLIC, monogram, given } from "@/content/team";
import { SpecimenPlate } from "../specimen-plate";
import { PhyllodeDivider } from "../phyllode-divider";

export const metadata: Metadata = {
  title: "Company",
  description: "Who Wattle Technologies is, what it is for, and the people building it.",
  alternates: { canonical: "/company" },
};

/**
 * Migrated to the poster vocabulary. This page shipped to production asking for
 * twenty-one classes that the rewrite deleted — shell, band-pad, reg, reg-label,
 * reg-body, display, claim, lead, say, team-plates, team-portrait and the rest —
 * so it rendered as unstyled markup: default bullet markers, portraits at
 * intrinsic size, affiliation logos at full width.
 *
 * Nothing new is invented here. The register rail the old `reg` gave is exactly
 * `inner-section-wrapper` (.5fr / 1fr), and the team plates are the existing
 * card primitives. Reusing them is the point: the reason the page broke is that
 * it had a private vocabulary in the first place.
 *
 * `SpecimenPlate` is still on the old names and is left as it stands rather than
 * redesigned in passing — it is tracked in the class gate's baseline.
 */
export default function CompanyPage() {
  return (
    <>
      {/* ONE AXIS FOR THE WHOLE PAGE.

          The page had two. The intro sat in `inner-section-wrapper`, a 0.5fr/1fr rail that
          pushes its content to the right and leaves the left third of the screen empty; the
          roster beneath it is centred. Neither is wrong on its own and together they read as
          two pages stacked, which is most of what "disorganised" was pointing at — the eye
          resets its expectation of where a line starts, twice, on the way down.

          Centred, because the section this page exists for is a symmetry of two. The rest of
          the site keeps its left axis; this is the one page whose subject is a pair. */}
      <section className="section is-black" style={{ paddingTop: "11vw", paddingBottom: "3vw" }}>
        <div className="padding-global centre-axis">
          <p className="text-style-tag">Company</p>
          <h1 className="heading-style-h1" style={{ marginTop: "1vw" }}>
            A company built around one question.
          </h1>
          <p className="subheading-large" style={{ marginTop: "2vw" }}>
            Whether a person who needs a clinician can actually reach one. Everything Wattle
            Technologies builds sits downstream of that.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="padding-global centre-axis">
          <PhyllodeDivider seed={91} />
          <div style={{ marginTop: "var(--space-xl)" }}>
            <h2 className="text-style-tag">What we are</h2>
            <div>
              <p className="heading-style-h3" style={{ maxWidth: "24ch", margin: "0.6em auto 0" }}>
                We build the part of care that happens before care.
              </p>
              <p className="body-text" style={{ marginTop: "1.5rem" }}>
                Not the consultation, the diagnosis or the prescription — the step before all of
                them, where a person looking for help either finds somebody they can reach or gives
                up.
              </p>
              <p className="body-text" style={{ marginTop: "1rem" }}>
                Wattle Technologies is the company behind ADHD.ME, kept separate from it so a page
                about partnerships never routes through the product&rsquo;s regulatory gate, and
                that gate is never softened to let one through.
              </p>
              <p className="body-text" style={{ marginTop: "1rem" }}>
                Two ventures: one in build, one still being scoped. We are specific about being
                early, because the alternative is letting you assume otherwise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {TEAM_PUBLIC && TEAM.length > 0 ? (
        <section className="section is-black" id="team">
          <div className="padding-global">
            {/* CENTRED, BECAUSE THERE ARE TWO OF THEM.

                The old plate was `auto-fit` over `1fr`, which is a grid built for a roster that
                grows. With two entries it stretched each one across half the page — two enormous
                cards, a wall of affiliation links and a headline pushed off to one side. A layout
                that is waiting to be filled in reads as a company that has not filled it in.

                Two is not an incomplete row, it is a SYMMETRY, so the structure is a diptych:
                one centre line, one name either side of it, mirrored. The names are the graphic
                — set large in tracked caps and given nothing to compete with — which is the
                whole device of the reference poster. Everything else waits for the pointer. */}
            <PhyllodeDivider seed={44} count={9} />
            <div className="roster-head" style={{ marginTop: "var(--space-2xl)" }}>
              <p className="text-style-tag">
                Directors<span className="count">{String(TEAM.length).padStart(2, "0")}</span>
              </p>
              <h2 className="heading-style-h3">The people behind it.</h2>
              <p className="body-text roster-note">
                Named here because you should know who is behind software that decides where a
                person looking for care gets sent.
              </p>
            </div>

            <ul className="roster">
              {TEAM.map((member) => (
                <li key={member.name}>
                  {/* THE WHOLE TILE IS THE LINK, not the name inside it. A hover target that is
                      smaller than the thing that visibly responds to hover is the commonest way
                      an interaction like this ends up feeling broken. */}
                  <Link href={`/company/${member.slug}`} className="roster-entry">
                    {/* THE FRAME IS ALWAYS THERE; WHAT FILLS IT CHANGES. At rest it carries the
                        monogram, so the resting composition is two framed panels and two names
                        rather than two names over a reserved void. The photograph fades in on
                        top of the monogram — which is also why the frame reserves its space
                        rather than collapsing: a portrait that appears on hover and pushes the
                        name down is a layout animation firing every time a pointer crosses it. */}
                    <span className="roster-portrait" aria-hidden="true">
                      <span className="director-monogram">{monogram(member.name)}</span>
                      {member.portrait ? (
                        <Image
                          src={member.portrait}
                          alt=""
                          width={520}
                          height={650}
                          sizes="(max-width:767px) 60vw, 22vw"
                        />
                      ) : null}
                    </span>

                    <span className="roster-name">
                      <span>{given(member)}</span>
                      <span className="roster-family">{member.family}</span>
                    </span>

                    {member.remit ? <span className="roster-remit">{member.remit}</span> : null}
                    <span className="roster-more" aria-hidden="true">Profile</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* The advisory board a company like this is expected to list does not exist.
                Saying so where a visitor looks for it beats letting them conclude we forgot. */}
            <p className="body-text text-style-muted roster-caveat">
              There is no clinical or scientific advisory board. Clinicians are involved in
              building the product, which is not the same thing, and we will not describe it as one
              until it is constituted.
            </p>
          </div>
        </section>
      ) : null}

      <SpecimenPlate />

      <section className="section is-black">
        <div className="padding-global">
          <div className="cta-block is-eucalypt">
            <h2 className="heading-style-h4">One address, read by the people building it</h2>
            <a href={`mailto:${COMPANY.email}`} className="button button-pressed">
              {COMPANY.email}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
