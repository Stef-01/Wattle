// Static-build twin of ./load. next.config.mjs swaps every import of "disciplines/load" for this
// module when NEXT_PUBLIC_STATIC=1, so the browser bundle carries the parsed vocabularies from
// src/generated/disciplines.json (written by `pnpm static:data`) and never node:fs or yaml.
import generated from "@/src/generated/disciplines.json";
import type { Discipline } from "./load";

export type { ConditionGroup, CueGroup, Discipline, PopulationCues, RefusedCue } from "./load";

const DISCIPLINES = generated as unknown as Record<string, Discipline>;

export function loadDiscipline(slug: string, _root?: string): Discipline {
  const discipline = DISCIPLINES[slug];
  if (!discipline) throw new Error(`disciplines.json: no discipline "${slug}"; run pnpm static:data`);
  return discipline;
}

export function parseDiscipline(): never {
  throw new Error("parseDiscipline is not available in the static build");
}
