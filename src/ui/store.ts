// Browser-side state. The sentence and the last results live in sessionStorage (gone when the
// tab closes, never in a URL). Saved doctors and the compare pair live in localStorage.
import type { SearchResponse, Weights } from "@/src/data/search-types";
import type { DoctorRecord } from "@/src/data/types";

const ASK = "wattle.ask";
const RESULTS = "wattle.results";
const SAVED = "wattle.saved";
const COMPARE = "wattle.compare";

export interface Ask {
  sentence: string;
  suburb: string;
  removed: string[];
  weights: Weights;
}

function read<T>(storage: () => Storage, key: string): T | null {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(storage: () => Storage, key: string, value: unknown): void {
  try {
    storage().setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable; the screen still renders */
  }
}

export const getAsk = () => read<Ask>(() => sessionStorage, ASK);
export const setAsk = (ask: Ask) => write(() => sessionStorage, ASK, ask);
export const getResults = () => read<SearchResponse>(() => sessionStorage, RESULTS);
export const setResults = (r: SearchResponse) => write(() => sessionStorage, RESULTS, r);

export const getSaved = () => read<DoctorRecord[]>(() => localStorage, SAVED) ?? [];
export function toggleSaved(doctor: DoctorRecord): DoctorRecord[] {
  const current = getSaved();
  const next = current.some((d) => d.id === doctor.id) ? current.filter((d) => d.id !== doctor.id) : [...current, doctor];
  write(() => localStorage, SAVED, next);
  return next;
}

export const getCompare = () => read<DoctorRecord[]>(() => localStorage, COMPARE) ?? [];
/** Up to two. Adding a third replaces the oldest. */
export function toggleCompare(doctor: DoctorRecord): DoctorRecord[] {
  const current = getCompare();
  let next: DoctorRecord[];
  if (current.some((d) => d.id === doctor.id)) next = current.filter((d) => d.id !== doctor.id);
  else next = [...current, doctor].slice(-2);
  write(() => localStorage, COMPARE, next);
  return next;
}
export function clearCompare(): void {
  write(() => localStorage, COMPARE, []);
}
