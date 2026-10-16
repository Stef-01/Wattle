// Browser-side matching for the static build (GitHub Pages): the same search, rerank and lookup
// the route handlers run, over src/generated/roster.json and the generated vocabulary. Nothing
// here touches the network; the sentence stays in the page.
import { loadDiscipline, type Discipline } from "@/src/disciplines/load";
import roster from "@/src/generated/roster.json";
import { rerankWith, type RerankBody, type RerankOut } from "./rerank-core";
import { searchWith } from "./search-core";
import type { SearchRequest, SearchResponse } from "./search-types";
import type { DoctorRecord } from "./types";

const DOCTORS = roster as unknown as DoctorRecord[];

let discipline: Discipline | null = null;
function mvp(): Discipline {
  if (!discipline) {
    try {
      discipline = loadDiscipline("mvp");
    } catch {
      discipline = loadDiscipline("psychiatry");
    }
  }
  return discipline;
}

export function rosterClient(): DoctorRecord[] {
  return DOCTORS;
}

export function runSearchClient(req: SearchRequest): SearchResponse {
  return searchWith(DOCTORS, mvp(), { ...req, sentence: req.sentence.trim() });
}

export function rerankClient(body: RerankBody): RerankOut {
  return rerankWith(DOCTORS, mvp(), body);
}

export function lookupClient(ids: readonly string[]): DoctorRecord[] {
  const byId = new Map(DOCTORS.map((d) => [d.id, d]));
  return ids.map((id) => byId.get(id)).filter((d): d is DoctorRecord => d !== undefined);
}
