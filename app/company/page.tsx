import type { Metadata } from "next";
import Image from "next/image";
import { COMPANY } from "@/content/company";
import { TEAM, TEAM_PUBLIC, monogram } from "@/content/team";

export const metadata: Metadata = {
  title: "Company",
  description: "Who Wattle Technologies is, what it is for, and the people building it.",
  alternates: { canonical: "/company" },
};

export default function CompanyPage() {
  return (
    <>
      <section className="shell band-pad" style={{ paddingBottom: "var(--gap-4)" }}>
        <h1 className="display claim">A company built around one question.</h1>
        <p className="lead" style={{ marginTop: "var(--gap-3)" }}>
          Whether a person who needs a clinician can actually reach one. Everything Wattle
          Technologies builds sits downstream of that.
        </p>
      </section>

      <hr className="rule" />

      <section className="shell band-pad">
        <div className="reg lift-in">
          <h2 className="reg-label">What we are</h2>
          <div className="reg-body prose">
            <p>
              Wattle Technologies is the company behind ADHD.ME. It exists as a separate company
              from the product because the two do different jobs: the product is a regulated
              health surface governed by Australian advertising law and a compliance suite that
              runs in its build, and a company page about partnerships or hiring has no business
              being routed through that gate — nor should that gate be softened to let one
              through.
            </p>
            <p>
              We build the routing layer of care. Not the consultation, not the diagnosis, not the
              prescription — the part before all of those, where a person looking for help either
              finds somebody they can reach or gives up. That layer is mostly invisible when it
              works and is the entire problem when it does not.
            </p>
            <p>
              We are small, early, and specific about it. There is one venture, in build. This site
              is written so that a commissioner, a practice or a clinician can work out in about a
              minute what is real here and what is not.
            </p>
          </div>
        </div>
      </section>

      {TEAM_PUBLIC && TEAM.length > 0 ? (
        <>
          <hr className="rule" />
          <section className="shell band-pad" id="team">
            <div className="reg">
              <h2 className="reg-label">Team</h2>
              <div className="reg-body">
                <ul className="team-plates">
                  {TEAM.map((member) => (
                    <li key={member.name} className="lift-in">
                      <div className="team-portrait">
                        {member.portrait ? (
                          <Image
                            src={member.portrait}
                            alt={member.name}
                            width={260}
                            height={347}
                            sizes="(max-width: 759px) 90vw, 300px"
                          />
                        ) : (
                          <span className="team-monogram" aria-hidden="true">
                            {monogram(member.name)}
                          </span>
                        )}
                      </div>
                      <div className="team-id">
                        <strong>{member.name}</strong>
                        {member.role ? <span className="team-role">{member.role}</span> : null}
                      </div>
                      {member.remit ? <p className="team-remit">{member.remit}</p> : null}
                      {member.affiliations.length > 0 ? (
                        <ul className="team-affiliations">
                          {member.affiliations.map((a) => (
                            <li key={a.name}>
                              <a href={a.href} target="_blank" rel="noreferrer" aria-label={a.label}>
                                {a.logo ? (
                                  <Image src={a.logo} alt={a.label} width={446} height={80} />
                                ) : (
                                  <span>{a.label}</span>
                                )}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {/* The advisory board a company like this is expected to list does not exist.
                    Saying so here, where a visitor looks for it, beats letting them conclude we
                    forgot. */}
                <p style={{ marginTop: "var(--gap-4)", fontSize: "0.9375rem", color: "var(--muted)", maxWidth: "62ch", lineHeight: 1.7 }}>
                  There is no clinical or scientific advisory board. Clinicians are involved in
                  building the product, which is not the same thing, and we will not describe it as
                  one until it is constituted.
                </p>
              </div>
            </div>
          </section>
        </>
      ) : null}

      <section className="on-leaf">
        <div className="shell band-pad">
          <div className="reg">
            <h2 className="reg-label">Contact</h2>
            <div className="reg-body">
              <p className="display claim-sm" style={{ color: "var(--on-leaf)", maxWidth: "18ch" }}>
                One address, read by the people building it.
              </p>
              <p style={{ marginTop: "1.25rem" }}>
                <a href={`mailto:${COMPANY.email}`} className="btn btn-on-leaf">
                  {COMPANY.email}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
