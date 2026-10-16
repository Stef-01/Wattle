// P06 Profile / P11 Partial profile (Figma 226:58 / 226:366). One route; the screen branches on
// whether the doctor has a doctor-approved or illustrative personal profile.
import { notFound } from "next/navigation";
import { doctorIdFromParam } from "@/src/data/doctor-slug";
import { getDoctor, mvpDiscipline } from "@/src/data/providers";
import { Profile } from "@/src/ui/screens/patient-b/Profile";
import { doctorParams } from "./params";

export const revalidate = 3600;

export async function generateStaticParams() {
  return doctorParams();
}

function conditionLabelMap(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of mvpDiscipline().conditions) out[c.id] = c.label;
  return out;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDoctor(doctorIdFromParam(id));
  return { title: d ? `${d.name.display} · Wattle` : "Doctor · Wattle" };
}

export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDoctor(doctorIdFromParam(id));
  if (!d) notFound();
  return <Profile doctor={d} labels={conditionLabelMap()} />;
}
