"use client";
// QA mount for P10 No match (Figma 226:308). The live empty state is rendered by the results
// owner from src/ui/screens/patient-b/NoMatch with the engine's counts.
import { useRouter } from "next/navigation";
import { NoMatch } from "@/src/ui/screens/patient-b/NoMatch";

export default function NoMatchPage() {
  const router = useRouter();
  return <NoMatch radiusKm={20} widenCount={3} telehealthCount={5} place="Brisbane" onWiden={() => router.push("/results")} onTelehealth={() => router.push("/results")} onClosest={() => router.push("/results")} backHref="/results" />;
}
