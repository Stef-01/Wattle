import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { TEAM, TEAM_PUBLIC, monogram } from "@/content/team";

export const metadata: Metadata = {
  title: "Team",
  description: "The people building Wattle Technologies.",
  alternates: { canonical: "/team" },
  /* The noindex that sat here while the page was gated is GONE, not commented out. A page that
     is public and still asks crawlers to skip it is a page in two states at once. robots.ts
     reads the same flag, so the two cannot disagree. */
};

/**
 * The plates.
 *
 * `role` and `remit` render only when supplied, so a person can be added the day their name
 * arrives and gain a line when they supply one. An entry with nothing but a name is the honest
 * intermediate state — a plate with an invented title is not.
 */
export default function TeamPage() {
  if (!TEAM_PUBLIC) notFound();

  return (
    <>
      <section className="section" style={{ paddingBottom: "2rem" }}>
        <div className="shell">
          <p className="eyebrow">Team</p>
          <h1 className="display prose-h1">The people building this.</h1>
          <p className="lede" style={{ marginTop: "1.5rem", maxWidth: "50ch" }}>
            A small team, named here because you should know who is behind software that decides
            where a person looking for care gets sent.
          </p>
        </div>
      </section>

      <section className="shell" style={{ paddingBottom: "5.5rem" }}>
        <ul className="team-plates">
          {TEAM.map((member) => (
            <li key={member.name} className="team-plate">
              <div className="team-portrait">
                {member.portrait ? (
                  <Image
                    src={member.portrait}
                    /* The name alone is the accurate alt for a portrait. The role, where there
                       is one, sits beside it in the markup rather than inside the alt. */
                    alt={member.name}
                    width={260}
                    height={347}
                    sizes="(max-width: 759px) 100vw, 320px"
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
      </section>
    </>
  );
}
