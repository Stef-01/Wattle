// One search, server side: the roster from src/data/providers.ts (fs or Supabase) and the MVP
// vocabulary, handed to the pure search in search-core.ts. The sentence never goes into a URL
// or a log.
import { getDoctors, mvpDiscipline } from "./providers";
import { searchWith } from "./search-core";
import type { SearchRequest, SearchResponse } from "./search-types";

export * from "./search-types";

export async function runSearch(req: SearchRequest): Promise<SearchResponse> {
  return searchWith(await getDoctors(), mvpDiscipline(), req);
}
