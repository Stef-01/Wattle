// P09 Why this match (Figma 226:257).
import { notFound } from "next/navigation";
import { getDoctor } from "@/src/data/providers";
import { Why } from "@/src/ui/screens/patient-b/Why";

export const revalidate = 3600;

export default async function WhyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDoctor(decodeURIComponent(id));
  if (!d) notFound();
  return <Why doctor={d} />;
}
