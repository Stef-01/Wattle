import { notFound } from "next/navigation";
import { QuestionScreen } from "@/src/ui/screens/clinician/Question";
import { TOTAL } from "@/src/ui/screens/clinician/session";

export const metadata = { title: "Interview · Wattle Health" };

export default async function QuestionPage({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 1 || n > TOTAL) notFound();
  return <QuestionScreen n={n} />;
}
