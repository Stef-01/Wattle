import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TEAM, TEAM_PUBLIC, monogram, given } from "@/content/team";

/**
 * ONE DIRECTOR, ONE PAGE.
 *
 * The roster on /company reveals a portrait on hover and links here. Hover is an affordance a
 * touch screen does not have and a keyboard only half has, so this page is not an enhancement
 * of that interaction — it is the version of it that always works. Everything the hover shows
 * is on this page in plain flow.
 *
 * NOTHING IS WRITTEN HERE THAT IS NOT ALREADY IN THE REGISTER. src/content/team.ts holds facts
 * supplied by their subjects and transcribed from ADHD.ME. A profile page is exactly the place
 * where a paragraph of plausible biography would get invented to fill the space, so this page
 * renders the register and stops. A person with one affiliation and no role gets a short page.
 */

export function generateStaticParams() {
  return TEAM_PUBLIC ? TEAM.map((m) => ({ slug: m.slug })) : [];
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const member = TEAM.find((m) => m.slug === slug);
  if (!member) return {};
  return {
    title: member.name,
    /* The remit is the person's own sentence about their work. Where there is none, the page
       says what it can stand behind rather than composing a description of somebody. */
    description: member.remit ?? `${member.name}, a director of Wattle Technologies.`,
    alternates: { canonical: `/company/${member.slug}` },
  };
}

export default async function DirectorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = TEAM_PUBLIC ? TEAM.find((m) => m.slug === slug) : undefined;
  if (!member) notFound();

  return (
    <section className="section is-black profile">
      <div className="padding-global">
        <p className="text-style-tag">
          <Link href="/company#team" className="profile-back">Directors</Link>
        </p>

        <div className="profile-head">
          <div className="profile-portrait">
            {member.portrait ? (
              <Image
                src={member.portrait}
                /* The name alone is the accurate alt for a portrait. A role is a
                   characterisation and sits beside it in the markup, not inside the alt. */
                alt={member.name}
                width={520}
                height={650}
                sizes="(max-width:767px) 60vw, 26vw"
                priority
              />
            ) : (
              <span className="director-monogram" aria-hidden="true">{monogram(member.name)}</span>
            )}
          </div>

          <div>
            <h1 className="profile-name">
              <span>{given(member)}</span>
              <span className="profile-family">{member.family}</span>
            </h1>
            {member.role ? <p className="profile-role">{member.role}</p> : null}
            {member.remit ? <p className="profile-remit">{member.remit}</p> : null}

            {member.affiliations.length > 0 ? (
              <>
                <p className="text-style-tag profile-sub">Affiliations</p>
                <ul className="rule-list profile-affiliations">
                  {member.affiliations.map((a) => (
                    <li key={a.name}>
                      <a href={a.href} target="_blank" rel="noreferrer" aria-label={a.label}>
                        {a.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
