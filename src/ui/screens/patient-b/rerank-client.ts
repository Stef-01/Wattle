// Browser side of POST /adjust/rerank. The sentence travels in the body, never a URL.
import type { SearchResponse } from "@/src/data/search-types";
import type { HumanFitWeights } from "@/src/matching/layer2";
import type { Intent, Ranked } from "@/src/matching/types";

export interface RerankEdits {
  /** Drop survivors further than this with no telehealth. */
  maxKm?: number;
  telehealthOnly?: boolean;
  anyGender?: boolean;
  /** Closed human-fit labels to add to the intent (yaml `human_fit` ids). */
  humanFit?: string[];
}

export interface RerankBody {
  ask?: { sentence: string; suburb: string; removed: string[] };
  survivors?: Ranked[];
  intent?: Intent;
  weights?: Partial<HumanFitWeights>;
  edits?: RerankEdits;
  chips?: SearchResponse["chips"];
}

export interface RerankOut {
  response: SearchResponse;
  survivors: Ranked[];
  intent: Intent;
}

export async function fetchRerank(body: RerankBody): Promise<RerankOut> {
  const res = await fetch("/adjust/rerank", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`rerank ${res.status}`);
  return (await res.json()) as RerankOut;
}
