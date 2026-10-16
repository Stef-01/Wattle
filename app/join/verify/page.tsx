import { Suspense } from "react";
import { VerifyScreen } from "@/src/ui/screens/clinician/Verify";

export const metadata = { title: "Verify registration · Wattle Health" };

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyScreen />
    </Suspense>
  );
}
