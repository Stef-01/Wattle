import { notFound } from "next/navigation";
import { TEAM, TEAM_PUBLIC, monogram } from "@/content/team";

export const metadata = {
  title: "Team",
  description: "The people building Wattle Technologies.",
  alternates: { canonical: "/team" },
  /* Gated pages do not advertise themselves to crawlers either. A hidden page that still asks
     to be indexed is not hidden. */
  robots: { index: false, follow: false },
};

/**
 * GATED, NOT DELETED — see the header of src/content/team.ts. Flip TEAM_PUBLIC and this route,
 * the header door, the footer door and the sitemap entry all come back together.
 */
export default function TeamPage() {
  if (!TEAM_PUBLIC) notFound();

  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow">Team</p>
        <h1 className="display prose-h1">The people building this.</h1>

        <div className="grid-2" style={{ marginTop: "3rem" }}>
          {TEAM.map((member) => (
            <article key={member.name} className="card">
              <span
                aria-hidden="true"
                className="display"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "999px",
                  background: "var(--gold-soft)",
                  color: "var(--gold)",
                  fontSize: "1.125rem",
                  marginBottom: "1.15rem",
                }}
              >
                {monogram(member.name)}
              </span>
              <h3>{member.name}</h3>
              {member.role ? (
                <p style={{ marginTop: "0.35rem", color: "var(--gold)", fontWeight: 500 }}>{member.role}</p>
              ) : null}
              {member.remit ? <p>{member.remit}</p> : null}
              {member.affiliations.length > 0 ? (
                <ul className="meta-row" style={{ marginTop: "1.15rem" }}>
                  {member.affiliations.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
