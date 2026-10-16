import { notFound } from "next/navigation";
import { DraftScreen } from "@/src/ui/screens/clinician/Draft";
import { TOTAL } from "@/src/ui/screens/clinician/questions";

export const metadata = { title: "Sound right? · Wattle Health" };

/** One page per interview question; the static build writes them all. */
export async function generateStaticParams() {
  return Array.from({ length: TOTAL }, (_, i) => ({ n: String(i + 1) }));
}

export default async function DraftPage({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 1 || n > TOTAL) notFound();
  return <DraftScreen n={n} />;
}
