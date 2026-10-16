import { CompareTable } from "@/src/ui/CompareTable";

// Reads localStorage in the browser (CompareTable is a client component); nothing here is per request.
export const metadata = { title: "Compare · Wattle Health" };

export default function ComparePage() {
  return <CompareTable />;
}
