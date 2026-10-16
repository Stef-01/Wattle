import { notFound } from "next/navigation";
import { DraftScreen } from "@/src/ui/screens/clinician/Draft";
import { TOTAL } from "@/src/ui/screens/clinician/session";

export const metadata = { title: "Sound right? · Wattle Health" };

export default async function DraftPage({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 1 || n > TOTAL) notFound();
  return <DraftScreen n={n} />;
}
