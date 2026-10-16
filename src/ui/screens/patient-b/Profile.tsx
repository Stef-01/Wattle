// P06 Profile (226:58) and P11 Partial profile (226:366), one component branching on
// `personal.status`. Server component: the record is read once, the client bits are small.
// Hero 374x460 r25.5 at y=28, caption 331x104 r15, content at y=528, CTA 373x66 at y=810.
import type { DoctorRecord } from "@/src/data/types";
import { asList } from "@/src/data/types";
import { Body, Circle, Divider, Fade, FigmaIcon, HeadingTabs, Hint, Row, Stat, initialsOf } from "@/src/ui/kit";
import { HeroScreen, Space } from "./bits";
import { conditionLabels, drName, drShort, feeOf, joinLabels, papersLine, personalStatusLabel, placeOf, pronouns } from "./facts";
import { BookmarkCircle, ContactCta } from "./ProfileClient";

function Hero({ d, photo }: { d: DoctorRecord; photo: string | null }) {
  const fee = feeOf(d);
  const name = drName(d);
  return (
    <div className="relative h-[460px] w-full overflow-hidden rounded-card shadow-photo" style={{ background: photo ? undefined : "#d9d9d9" }}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-inter text-[24px] font-semibold text-grey">{initialsOf(name)}</span>
      )}
      <div className="absolute left-[21px] top-[18px]">
        <Circle over href="/results" label="Back"><FigmaIcon name="arrow-left-22" size={22} /></Circle>
      </div>
      <div className="absolute right-[21px] top-[18px]">
        <BookmarkCircle id={d.id} />
      </div>
      <div className={`absolute inset-x-[21px] top-[327px] flex h-[104px] items-center gap-2.5 rounded-[15px] px-4 py-[18px] text-white shadow-[0_5px_4.5px_rgba(0,0,0,0.1)] ${photo ? "bg-caption backdrop-blur-[20px]" : "bg-[#1d1d1d]"}`}>
        <span className="flex min-w-0 flex-1 flex-col gap-2.5">
          <span className={`truncate font-inter font-semibold leading-normal ${name.length > 17 ? "text-[20px]" : "text-[24px]"}`}>{name}</span>
          <span className="inline-flex items-center gap-1.5 text-[18px] leading-normal text-caption-text">
            <FigmaIcon name="map-pin-18" size={18} />
            <span className="truncate">{placeOf(d)}</span>
          </span>
        </span>
        {fee ? (
          <span className="flex shrink-0 flex-col items-end gap-1.5 leading-normal">
            <span className="text-[16px] text-caption-text">Fee</span>
            <span className="text-[24px] font-medium">{fee}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Stats({ d }: { d: DoctorRecord }) {
  const years = d.yearsInSpecialty?.value;
  const tele = d.declared.telehealth ? (d.telehealth.value === "none" ? "In person" : "Telehealth") : null;
  const referral = d.referralRequired?.value === true ? "Referral" : null;
  const items: { icon: string; label: string }[] = [];
  if (typeof years === "number") items.push({ icon: "clock", label: `${years} yrs` });
  if (tele) items.push({ icon: "video", label: tele });
  if (referral) items.push({ icon: "file", label: referral });
  if (items.length === 0) return <Stat icon={<FigmaIcon name="file" size={17} />}>Not declared</Stat>;
  return (
    <div className={`flex items-start ${items.length === 3 ? "justify-between" : "gap-10"}`}>
      {items.map((s) => (
        <Stat key={s.label} icon={<FigmaIcon name={s.icon} size={17} />}>{s.label}</Stat>
      ))}
    </div>
  );
}

export function Profile({ doctor: d, labels, photo = null }: { doctor: DoctorRecord; labels: Record<string, string>; photo?: string | null }) {
  const personal = d.personal && d.personal.status !== "draft" ? d.personal : null;
  const id = encodeURIComponent(d.id);
  const conditions = conditionLabels(d, labels);
  const papers = papersLine(d);
  const pr = pronouns(d);

  if (!personal) {
    // P11: no personal profile yet. Grey hero, two heading tabs, stats, one honest line, CTA.
    const lists = conditions.length > 0 ? `Lists ${joinLabels(conditions, 2, true)}.` : "No clinical focus listed yet.";
    return (
      <HeroScreen>
        <Hero d={d} photo={photo} />
        <Space h={40} />
        <HeadingTabs items={[{ label: "Why you’ll connect", active: true }, { label: "Profile", href: `/doctor/${id}/expertise` }]} />
        <Space h={32} />
        <Stats d={d} />
        <Space h={34} />
        <Body>
          {lists} {pr.hasnt} shared how {pr.subject} {pr.practises} yet.
        </Body>
        <ContactCta doctor={d} label={`Get to know ${drShort(d)}`} />
      </HeroScreen>
    );
  }

  // P06: a personal profile the doctor approved, or an illustrative example, labelled as such.
  const quote = personal.philosophy ?? personal.philosophyOfCare ?? personal.communicationApproach ?? personal.whyMedicine ?? personal.purpose ?? null;
  const practises = personal.communication?.length ? joinLabels(personal.communication.map((c) => c.replace(/-/g, " ")), 2) : "In their words";
  const outside = asList(personal.hobbies)[0] ?? personal.outsideMedicine ?? null;
  const expertise = [conditions.length ? joinLabels(conditions, 2) : "No clinical focus listed yet", papers].filter(Boolean).join(", ");
  return (
    <HeroScreen>
      <Hero d={d} photo={photo} />
      <Space h={40} />
      <HeadingTabs items={[{ label: "Overview", active: true }, { label: "Expertise", href: `/doctor/${id}/expertise` }, { label: "Care", href: `/doctor/${id}/why` }]} />
      <Space h={26} />
      <Stats d={d} />
      <Space h={26} />
      {quote ? (
        <>
          <Body>“{quote.length > 110 ? `${quote.slice(0, 107).trimEnd()}…` : quote}”</Body>
          <Space h={6} />
          <Hint>{personalStatusLabel(d)}</Hint>
        </>
      ) : null}
      <Space h={18} />
      <Row title="Clinical expertise" sub={expertise} href={`/doctor/${id}/expertise`} />
      <Divider />
      <Row title={`How ${pr.subject} ${pr.practises}`} sub={practises} href={`/doctor/${id}/why`} />
      <Divider />
      {outside ? (
        <>
          <Row title="Outside medicine" sub={outside.length > 48 ? `${outside.slice(0, 45).trimEnd()}…` : outside} chevron={false} />
          <Divider />
        </>
      ) : null}
      <Fade />
      <ContactCta doctor={d} label="Contact practice" />
    </HeroScreen>
  );
}
