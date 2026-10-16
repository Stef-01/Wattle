// P07 Clinical expertise (Figma 226:132).
import { notFound } from "next/navigation";
import { doctorIdFromParam } from "@/src/data/doctor-slug";
import { getDoctor, mvpDiscipline } from "@/src/data/providers";
import { Expertise } from "@/src/ui/screens/patient-b/Expertise";
import { doctorParams } from "../params";

export const revalidate = 3600;

export async function generateStaticParams() {
  return doctorParams();
}

export default async function ExpertisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDoctor(doctorIdFromParam(id));
  if (!d) notFound();
  const labels: Record<string, string> = {};
  for (const c of mvpDiscipline().conditions) labels[c.id] = c.label;
  return <Expertise doctor={d} labels={labels} />;
}
