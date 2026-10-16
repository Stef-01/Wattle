import { redirect } from "next/navigation";

// The claim flow lives at /join (Figma C01–C08); the doctor id prefills C02.
export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/join?doctor=${encodeURIComponent(decodeURIComponent(id))}`);
}
