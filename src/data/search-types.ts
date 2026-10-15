// Shapes shared by the API route and the browser. No fs here: client components import this file.
import type { MatchResult, Ranked } from "@/src/matching/types";
import type { DoctorRecord } from "./types";

/** The four sliders on the results screen, 0..1 each. */
export interface Weights {
  clinical: number;
  communication: number;
  lived: number;
  research: number;
}
export const DEFAULT_WEIGHTS: Weights = { clinical: 1, communication: 1, lived: 1, research: 1 };

export type ChipKind = "condition" | "specialty" | "must" | "preference" | "population" | "human";

export interface Chip {
  id: string;
  kind: ChipKind;
  label: string;
  /** The reader's words that reached this chip; stripped from the sentence when the chip is removed. */
  phrase?: string;
  removable: boolean;
}

export type FitBand = "strong" | "some" | "listed";

export interface Card {
  doctor: DoctorRecord;
  headline: string;
  score: number;
  distanceKm?: number;
  clinicalFit: { band: FitBand; reasons: string[] };
  humanFit: { score: number; reasons: string[]; basis: string };
  evidence: Ranked["evidence"];
  missed: Ranked["missed"];
}

export interface SearchResponse {
  order: MatchResult["order"];
  orderNote: string;
  careGuidance?: string;
  emergency?: { note: string };
  cards: Card[];
  chips: Chip[];
  unserved?: MatchResult["unserved"];
  clarifiers: MatchResult["clarifiers"];
  place: { typed: string; suburb: string | null };
  rosterSize: number;
}

export interface SearchRequest {
  sentence: string;
  suburb?: string;
  weights?: Partial<Weights>;
  removed?: string[];
}

