import { notFound } from "next/navigation";
import { getDoctor } from "@/src/data/providers";
import { ClaimForm } from "@/src/ui/ClaimForm";

export const metadata = { title: "Claim your profile · Wattle Health" };
export const dynamic = "force-dynamic";

export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDoctor(decodeURIComponent(id));
  if (!d) notFound();
  return (
    <section className="rise mx-auto flex max-w-xl flex-col gap-4 pt-6">
      <h1 className="text-3xl">Claim {d.name.display}</h1>
      <ClaimForm name={d.name.display} />
    </section>
  );
}
