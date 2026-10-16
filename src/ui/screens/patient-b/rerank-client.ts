// Browser side of the rerank. The sentence travels in the body, never a URL. The transport is
// src/data/api (POST /adjust/rerank in server mode, in-page over the generated roster in the
// static build).
import { rerank } from "@/src/data/api";
import type { RerankBody, RerankOut } from "@/src/data/rerank-core";

export type { RerankBody, RerankEdits, RerankOut } from "@/src/data/rerank-core";

export async function fetchRerank(body: RerankBody): Promise<RerankOut> {
  return rerank(body);
}
