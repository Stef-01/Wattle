// P06 Profile / P11 Partial profile (Figma 226:58 / 226:366). One route; the screen branches on
// whether the doctor has a doctor-approved or illustrative personal profile.
import { notFound } from "next/navigation";
import { getDoctor, getDoctors, mvpDiscipline } from "@/src/data/providers";
import { Profile } from "@/src/ui/screens/patient-b/Profile";

export const revalidate = 3600;

export async function generateStaticParams() {
  const doctors = await getDoctors();
  return doctors.slice(0, 40).map((d) => ({ id: d.id }));
}

function conditionLabelMap(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of mvpDiscipline().conditions) out[c.id] = c.label;
  return out;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDoctor(decodeURIComponent(id));
  return { title: d ? `${d.name.display} · Wattle` : "Doctor · Wattle" };
}

export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDoctor(decodeURIComponent(id));
  if (!d) notFound();
  return <Profile doctor={d} labels={conditionLabelMap()} />;
}
