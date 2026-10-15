import Link from "next/link";
import { notFound } from "next/navigation";
import { getDoctor, getDoctors } from "@/src/data/providers";
import { asList, sourceLabel, topicsOf, type DoctorRecord } from "@/src/data/types";
import { NotDeclared, ObservedBadge, TierBadge } from "@/src/ui/Badge";
import { ProfileActions, WhyMatches } from "@/src/ui/ProfileActions";

export const revalidate = 3600;

export async function generateStaticParams() {
  const doctors = await getDoctors();
  return doctors.slice(0, 40).map((d) => ({ id: d.id }));
}

const SPECIALTY: Record<string, string> = { psychiatry: "Psychiatrist", paediatrics: "Paediatrician", "obstetrics-gynaecology": "Obstetrician and gynaecologist" };

function Section({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group rounded-card border border-line bg-white">
      <summary className="flex min-h-12 items-center justify-between px-4 text-lg">
        <span className="display">{title}</span>
        <span aria-hidden className="text-ink-soft"><span className="group-open:hidden">+</span><span className="hidden group-open:inline">&minus;</span></span>
      </summary>
      <div className="px-4 pb-4 text-sm">{children}</div>
    </details>
  );
}

function registerCheck(d: DoctorRecord) {
  if (d.register) {
    return (
      <p>
        Ahpra {d.register.ahpraNumber.value}, {d.register.status.value}. <TierBadge tier="register" source="ahpra" date={d.register.status.observedAt} href={d.register.registerUrl} />
      </p>
    );
  }
  const src = d.sources[0];
  return (
    <p className="flex flex-wrap items-center gap-2">
      <span>Not yet verified against the Ahpra register.</span>
      {src && <TierBadge tier="found" source={src.source} date={src.observedAt.slice(0, 10)} href={src.sourceUrl ?? undefined} />}
    </p>
  );
}

export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDoctor(decodeURIComponent(id));
  if (!d) notFound();
  const qld = d.rooms.filter((r) => r.state === "QLD");
  const rooms = qld.length ? qld : d.rooms;
  const personal = d.personal;
  const showPersonal = personal && (personal.status === "doctor-approved" || personal.status === "illustrative");

  return (
    <article className="rise mx-auto flex max-w-2xl flex-col gap-4 pt-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl">{d.name.display}</h1>
        <p className="text-ink-soft">
          {SPECIALTY[d.specialty] ?? d.specialty.replace(/-/g, " ")}
          {d.credential ? ` · ${d.credential}` : ""}
          {rooms[0] ? ` · ${rooms[0].suburb}` : ""}
        </p>
        <ProfileActions doctor={d} />
      </header>

      <Section title="Register check" open>
        {registerCheck(d)}
      </Section>

      <Section title="Clinical focus" open>
        {d.focusTags.value.length === 0 ? (
          <NotDeclared />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {d.focusTags.value.map((tag) => (
              <li key={tag} className="inline-flex items-center gap-2 rounded-full border border-line bg-mist px-3 py-1">
                {tag}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2">
          <ObservedBadge o={d.focusTags} />
        </p>
      </Section>

      <Section title="Why this doctor matches" open>
        <WhyMatches doctorId={d.id} />
      </Section>

      <Section title="Published research">
        {d.publications.length === 0 ? (
          <p>
            No verified publications yet.{topicsOf(d).length ? ` Research topics inferred: ${topicsOf(d).join(", ")}.` : ""}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {d.publications.map((p) => (
              <li key={p.title}>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">{p.title}</a>
                ) : (
                  p.title
                )}
                <span className="text-ink-soft">
                  {p.year ? ` · ${p.year}` : ""}
                  {p.venue ? ` · ${p.venue}` : ""}
                </span>{" "}
                <TierBadge tier={p.verification === "doctor-confirmed" ? "declared" : "found"} source="openalex" date={d.sources[0]?.observedAt.slice(0, 10) ?? ""} />
                <span className="ml-1 text-xs text-ink-soft">{p.verification}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Philosophy and purpose">
        {showPersonal ? (
          <div className="flex flex-col gap-2">
            {personal.status === "illustrative" && <span className="inline-flex w-fit rounded-full bg-blossom px-2 py-0.5 text-[11px] text-bark">Illustrative example</span>}
            {(personal.philosophy ?? personal.philosophyOfCare) && <p>{personal.philosophy ?? personal.philosophyOfCare}</p>}
            {personal.whyMedicine && <p>{personal.whyMedicine}</p>}
            {(personal.purpose ?? personal.professionalPurpose) && <p>{personal.purpose ?? personal.professionalPurpose}</p>}
            {personal.communicationApproach && <p>{personal.communicationApproach}</p>}
            {personal.communication && personal.communication.length > 0 && <p>Communication: {personal.communication.join(", ")}</p>}
            {personal.enjoysServing && <p>Enjoys serving: {personal.enjoysServing.join(", ")}</p>}
            {personal.status === "doctor-approved" && <TierBadge tier="declared" source="claim" date={personal.approvedAt?.slice(0, 10) ?? d.sources[0]?.observedAt.slice(0, 10) ?? ""} />}
          </div>
        ) : (
          <p>
            This doctor hasn&rsquo;t added a personal profile yet.{" "}
            <Link href={`/claim/${encodeURIComponent(d.id)}`} className="text-foliage underline underline-offset-4">
              Are you {d.name.display}? Claim this profile
            </Link>
          </p>
        )}
      </Section>

      <Section title="Personal">
        {showPersonal ? (
          <div className="flex flex-col gap-2">
            {personal.status === "illustrative" && <span className="inline-flex w-fit rounded-full bg-blossom px-2 py-0.5 text-[11px] text-bark">Illustrative example</span>}
            {asList(personal.livedExperience).length > 0 && <p>Lived experience: {asList(personal.livedExperience).join(", ")}</p>}
            {asList(personal.hobbies).length > 0 && <p>Outside medicine: {asList(personal.hobbies).join(", ")}</p>}
            {personal.outsideMedicine && <p>{personal.outsideMedicine}</p>}
            {asList(personal.livedExperience).length === 0 && asList(personal.hobbies).length === 0 && !personal.outsideMedicine && <NotDeclared />}
          </div>
        ) : (
          <p>This doctor hasn&rsquo;t added a personal profile yet.</p>
        )}
      </Section>

      <Section title="Locations" open>
        <ul className="flex flex-col gap-3">
          {rooms.map((r) => (
            <li key={r.id} className="flex flex-col gap-0.5">
              <span className="font-medium">{r.name ?? "Consulting rooms"}</span>
              <span className="text-ink-soft">
                {[r.address, r.suburb, r.state, r.postcode].filter(Boolean).join(", ")}
              </span>
              {r.phone && <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="min-h-11 py-2 text-foliage underline underline-offset-4">{r.phone}</a>}
              {r.website && <a href={r.website} target="_blank" rel="noreferrer" className="text-foliage underline underline-offset-4">Practice site</a>}
            </li>
          ))}
          {rooms.length === 0 && <li><NotDeclared /></li>}
        </ul>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt className="text-ink-soft">Wait</dt>
          <dd className="m-0">{d.declared.capacity ? (d.capacity.value === "closed" ? "Not taking new patients" : d.waitTimeText ?? "Taking new patients") : <NotDeclared />}</dd>
          <dt className="text-ink-soft">Telehealth</dt>
          <dd className="m-0">{d.declared.telehealth ? (d.telehealth.value === "none" ? "No" : "Yes") : <NotDeclared />}</dd>
          <dt className="text-ink-soft">Referral</dt>
          <dd className="m-0">{d.referralRequired ? "GP referral needed for the Medicare rebate" : <NotDeclared />}</dd>
          <dt className="text-ink-soft">Languages</dt>
          <dd className="m-0">{d.languages ? d.languages.value.join(", ") : <NotDeclared />}</dd>
        </dl>
        <p className="mt-2"><ObservedBadge o={d.capacity} /></p>
      </Section>

      <Section title="Sources">
        <ul className="flex flex-col gap-1">
          {d.sources.map((s, i) => (
            <li key={`${s.source}-${i}`}>
              {s.sourceUrl ? (
                <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">{sourceLabel(s.source)}</a>
              ) : (
                sourceLabel(s.source)
              )}
              <span className="text-ink-soft"> · {s.observedAt.slice(0, 10)}</span>
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}
