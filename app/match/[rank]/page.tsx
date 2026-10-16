import { notFound } from "next/navigation";
import { Match } from "@/src/ui/screens/patient-a/Match";

export const metadata = { title: "Your match · Wattle" };

/** The three shown matches (RESULTS_SHOWN); the static build writes one page per rank. */
export async function generateStaticParams() {
  return [{ rank: "1" }, { rank: "2" }, { rank: "3" }];
}

export default async function MatchPage({ params }: { params: Promise<{ rank: string }> }) {
  const { rank } = await params;
  const n = Number(rank);
  if (!Number.isInteger(n) || n < 1 || n > 3) notFound();
  return <Match rank={n} />;
}
