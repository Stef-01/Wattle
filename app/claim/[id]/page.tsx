import { redirect } from "next/navigation";
import { doctorIdFromParam, doctorSlug } from "@/src/data/doctor-slug";
import { getDoctors } from "@/src/data/providers";

// The claim flow lives at /join (Figma C01–C08); the doctor id prefills C02.

/** Static build only: one redirect page per roster id. A server renders any id on request. */
export async function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_STATIC !== "1") return [];
  return (await getDoctors()).map((d) => ({ id: doctorSlug(d.id) }));
}

export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/join?doctor=${encodeURIComponent(doctorIdFromParam(id))}`);
}
