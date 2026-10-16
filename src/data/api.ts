// The browser's one door to matching. Server mode (this file): POST /api/match,
// POST /adjust/rerank, GET /doctor/lookup. Static mode: next.config.mjs swaps this module for
// ./api.static, which runs the same functions in the page over the generated roster. Every
// screen imports from here, never fetch() directly, so the two builds share one call site.
import type { RerankBody, RerankOut } from "./rerank-core";
import type { SearchRequest, SearchResponse } from "./search-types";
import type { DoctorRecord } from "./types";

export type { RerankBody, RerankEdits, RerankOut } from "./rerank-core";

export async function search(req: SearchRequest): Promise<SearchResponse> {
  const res = await fetch("/api/match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(req) });
  if (!res.ok) throw new Error(`match ${res.status}`);
  return (await res.json()) as SearchResponse;
}

export async function rerank(body: RerankBody): Promise<RerankOut> {
  const res = await fetch("/adjust/rerank", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`rerank ${res.status}`);
  return (await res.json()) as RerankOut;
}

export async function lookup(ids: readonly string[]): Promise<DoctorRecord[]> {
  if (ids.length === 0) return [];
  const res = await fetch(`/doctor/lookup?ids=${encodeURIComponent(ids.join(","))}`);
  if (!res.ok) return [];
  return (await res.json()) as DoctorRecord[];
}
