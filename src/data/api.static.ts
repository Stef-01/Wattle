// Static-build twin of ./api (see there). Same signatures, no network: the match runs in the page.
import { lookupClient, rerankClient, runSearchClient } from "./client-match";
import type { RerankBody, RerankOut } from "./rerank-core";
import type { SearchRequest, SearchResponse } from "./search-types";
import type { DoctorRecord } from "./types";

export type { RerankBody, RerankEdits, RerankOut } from "./rerank-core";

export async function search(req: SearchRequest): Promise<SearchResponse> {
  if (!req.sentence.trim()) throw new Error("match 400");
  return runSearchClient(req);
}

export async function rerank(body: RerankBody): Promise<RerankOut> {
  return rerankClient(body);
}

export async function lookup(ids: readonly string[]): Promise<DoctorRecord[]> {
  return lookupClient(ids);
}
