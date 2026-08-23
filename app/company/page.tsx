import type { Metadata } from "next";
import Image from "next/image";
import { COMPANY } from "@/content/company";
import { TEAM, TEAM_PUBLIC, monogram } from "@/content/team";
import { SpecimenPlate } from "../specimen-plate";

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
      <section className="section is-black" style={{ paddingTop: "11vw", paddingBottom: "3vw" }}>
        <div className="padding-global">
          <p className="text-style-tag">Company</p>
          <h1 className="heading-style-h1" style={{ marginTop: "1vw" }}>
            A company built around one question.
          </h1>
          <p className="subheading-large max-width-medium" style={{ marginTop: "2vw" }}>
            Whether a person who needs a clinician can actually reach one. Everything Wattle
            Technologies builds sits downstream of that.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="padding-global">
          <div className="inner-section-wrapper">
            <h2 className="text-style-tag">What we are</h2>
            <div>
              <p className="heading-style-h3" style={{ maxWidth: "24ch" }}>
                We build the part of care that happens before care.
              </p>
              <p className="body-text max-width-medium" style={{ marginTop: "1.5rem" }}>
                Not the consultation, the diagnosis or the prescription — the step before all of
                them, where a person looking for help either finds somebody they can reach or gives
                up.
              </p>
              <p className="body-text max-width-medium" style={{ marginTop: "1rem" }}>
                Wattle Technologies is the company behind ADHD.ME, kept separate from it so a page
                about partnerships never routes through the product&rsquo;s regulatory gate, and
                that gate is never softened to let one through.
              </p>
              <p className="body-text max-width-medium" style={{ marginTop: "1rem" }}>
                One venture, in build. We are specific about being early.
              </p>
            </div>
          </div>
        </div>
      </section>

      {TEAM_PUBLIC && TEAM.length > 0 ? (
        <section className="section" id="team" style={{ paddingTop: 0 }}>
          <div className="padding-global">
            <div className="inner-section-wrapper">
              <h2 className="text-style-tag">Team</h2>
              <div>
                <ul className="card-grid two-up" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {TEAM.map((member) => (
                    <li key={member.name} className="card">
                      {member.portrait ? (
                        <Image
                          src={member.portrait}
                          alt={member.name}
                          width={260}
                          height={347}
                          sizes="(max-width: 767px) 90vw, 300px"
                          style={{ width: "100%", height: "auto", display: "block" }}
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          style={{
                            display: "grid",
                            placeItems: "center",
                            aspectRatio: "260 / 347",
                            fontSize: "3rem",
                          }}
                        >
                          {monogram(member.name)}
                        </span>
                      )}
                      <div className="card-body">
                        <div>
                          <h3 className="heading-style-h5">{member.name}</h3>
                          {member.role ? (
                            <p className="text-style-mono" style={{ marginTop: "0.4rem" }}>
                              {member.role}
                            </p>
                          ) : null}
                          {member.remit ? (
                            <p className="body-text" style={{ marginTop: "0.75rem" }}>
                              {member.remit}
                            </p>
                          ) : null}
                        </div>
                        {member.affiliations.length > 0 ? (
                          <ul
                            style={{
                              listStyle: "none",
                              margin: "1rem 0 0",
                              padding: 0,
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "center",
                              gap: "1rem",
                            }}
                          >
                            {member.affiliations.map((a) => (
                              <li key={a.name}>
                                <a
                                  href={a.href}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={a.label}
                                >
                                  {a.logo ? (
                                    <Image
                                      src={a.logo}
                                      alt={a.label}
                                      width={446}
                                      height={80}
                                      style={{ width: "auto", height: "1.75rem", display: "block" }}
                                    />
                                  ) : (
                                    <span className="text-style-mono">{a.label}</span>
                                  )}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>

                {/* The advisory board a company like this is expected to list does not exist.
                    Saying so here, where a visitor looks for it, beats letting them conclude we
                    forgot. */}
                <p
                  className="body-text text-style-muted max-width-medium"
                  style={{ marginTop: "2rem" }}
                >
                  There is no clinical or scientific advisory board. Clinicians are involved in
                  building the product, which is not the same thing, and we will not describe it as
                  one until it is constituted.
                </p>
              </div>
            </div>
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
