import { Suspense } from "react";
import { Heard } from "@/src/ui/screens/patient-a/Heard";

export const metadata = { title: "What we heard · Wattle" };

export default function HeardPage() {
  return (
    <Suspense fallback={null}>
      <Heard />
    </Suspense>
  );
}
