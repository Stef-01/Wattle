import { notFound } from "next/navigation";
import { Match } from "@/src/ui/screens/patient-a/Match";

export const metadata = { title: "Your match · Wattle" };

export default async function MatchPage({ params }: { params: Promise<{ rank: string }> }) {
  const { rank } = await params;
  const n = Number(rank);
  if (!Number.isInteger(n) || n < 1 || n > 3) notFound();
  return <Match rank={n} />;
}
