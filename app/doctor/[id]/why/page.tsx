// P09 Why this match (Figma 226:257).
import { notFound } from "next/navigation";
import { doctorIdFromParam } from "@/src/data/doctor-slug";
import { getDoctor } from "@/src/data/providers";
import { Why } from "@/src/ui/screens/patient-b/Why";
import { doctorParams } from "../params";

export const revalidate = 3600;

export async function generateStaticParams() {
  return doctorParams();
}

export default async function WhyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDoctor(doctorIdFromParam(id));
  if (!d) notFound();
  return <Why doctor={d} />;
}
