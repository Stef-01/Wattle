// Ported from adhd.me/src/finder/filters.ts on 2026-10-15.
//
// O234: the person's own filters — held on the device, applied before ranking.
//
// WHAT A FILTER IS HERE, AND WHAT IT IS NOT. The finder orders the roster around a sentence, and
// `src/matching/needs.ts` reads preferences OUT of that sentence ("a woman GP", "bulk billed") as
// soft signals the ranking weighs. A filter is the other thing: a fact about the person that does
// not change from search to search — they need a ramp, they need Tamil, they will not travel past
// Hornsby — and that NARROWS the roster rather than reordering it. The query is per search, the
// filters live on the profile.
//
// WHERE IT LIVES. `localStorage`, under a versioned key: a filter set is a preference, not a
// sentence, so it survives the tab, and it never reaches a URL, a history entry, a log line or an
// analytics event.
//
// EVERY FIELD IS A DECLARED CLINICIAN FACT. `holdsPreference` is the same function the ranking
// uses, so "woman GP" on the profile and "a woman GP" in a sentence agree on who qualifies; the
// language list is the discipline's own; wheelchair access and open books are roster fields. No
// filter is inferred from anything a person wrote.
//
// WHAT CHANGED IN THE PORT. ADHD.ME's care-needs, clinician-identity, country, AI-scribe and
// approach filters read fields the ported `Clinician` does not carry (they belong to ADHD.ME's
// allied-health roster), so they are not here. The key is `wattle.filters.v1`.

import { isProfession, profession, type Profession } from "@/src/matching/support/professions";
import { holdsPreference } from "@/src/matching/needs";
import { matchableLanguages } from "@/src/matching/languages";
import type { SuburbPoint } from "@/src/geo/suburbs";

export const FILTERS_VERSION = 1;
/** The localStorage key. Versioned in the name too, so two shapes never share one slot. */
export const FILTERS_KEY = `wattle.filters.v${FILTERS_VERSION}`;

/** The distance ceilings a person can choose; `null` is no ceiling. Straight-line, as everywhere. */
export const DISTANCE_CHOICES = [5, 10, 20] as const;
export type DistanceKm = (typeof DISTANCE_CHOICES)[number] | null;

export interface Filters {
  v: typeof FILTERS_VERSION;
  /** Suburb or postcode the person said they are in. Not a device location — typed. */
  place: string;
  womanGp: boolean;
  telehealth: boolean;
  bulkBilling: boolean;
  longerAppointments: boolean;
  wheelchair: boolean;
  /** Only clinicians whose books are declared open. */
  openBooks: boolean;
  /** Languages beside English the clinician must declare. A subset of `matchableLanguages()`. */
  languages: string[];
  /** Furthest consulting location to include, in km from `place`. Ignored until `place` resolves. */
  withinKm: DistanceKm;
  /** The kinds of professional to show. Empty means every kind. */
  professions: Profession[];
}

/** The structural slice of a clinician a filter reads — the same shape `holdsPreference` takes, plus the roster facts. */
export interface Filterable {
  gender: string;
  profession?: Profession;
  telehealthFirstAppointment?: boolean;
  manner: readonly string[];
  practicalSignals: readonly string[];
  languages: readonly string[];
  wheelchairAccessible: boolean;
  acceptingNewPatients: boolean;
}

export function emptyFilters(): Filters {
  return {
    v: FILTERS_VERSION,
    place: "",
    womanGp: false,
    telehealth: false,
    bulkBilling: false,
    longerAppointments: false,
    wheelchair: false,
    openBooks: false,
    languages: [],
    withinKm: null,
    professions: [],
  };
}

export const BOOLEAN_FILTER_KEYS = ["womanGp", "telehealth", "bulkBilling", "longerAppointments", "wheelchair", "openBooks"] as const;
export type BooleanFilterKey = (typeof BOOLEAN_FILTER_KEYS)[number];

/** The words each yes/no filter is shown as — on the profile, on the results chips, in the strip's labels. */
export const BOOLEAN_FILTER_LABELS: Readonly<Record<BooleanFilterKey, string>> = {
  womanGp: "Woman clinician",
  telehealth: "Telehealth",
  bulkBilling: "Bulk billing",
  longerAppointments: "Longer appointments",
  wheelchair: "Wheelchair access",
  openBooks: "New patients",
};

function isDistance(value: unknown): value is DistanceKm {
  return value === null || (DISTANCE_CHOICES as readonly number[]).includes(value as number);
}

/** The device's filters, or the empty set when none, another version, or malformed. Never throws. */
export function readFilters(storage: Pick<Storage, "getItem">): Filters {
  let raw: string | null;
  try {
    raw = storage.getItem(FILTERS_KEY);
  } catch {
    return emptyFilters();
  }
  if (!raw) return emptyFilters();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyFilters();
    const r = parsed as Partial<Filters>;
    if (r.v !== FILTERS_VERSION) return emptyFilters();
    if (typeof r.place !== "string") return emptyFilters();
    if (!BOOLEAN_FILTER_KEYS.every((key) => typeof r[key] === "boolean")) return emptyFilters();
    const known = matchableLanguages();
    if (!Array.isArray(r.languages) || !r.languages.every((l) => known.includes(l))) return emptyFilters();
    if (!isDistance(r.withinKm)) return emptyFilters();
    const professions = Array.isArray(r.professions) ? r.professions.filter(isProfession) : [];
    return {
      v: FILTERS_VERSION,
      place: r.place.trim().slice(0, 80),
      womanGp: r.womanGp === true,
      telehealth: r.telehealth === true,
      bulkBilling: r.bulkBilling === true,
      longerAppointments: r.longerAppointments === true,
      wheelchair: r.wheelchair === true,
      openBooks: r.openBooks === true,
      languages: [...r.languages],
      withinKm: r.withinKm ?? null,
      professions,
    };
  } catch {
    return emptyFilters();
  }
}

/** Write the set; an empty set removes the key so a device holds nothing it does not need. */
export function writeFilters(storage: Pick<Storage, "setItem" | "removeItem">, filters: Filters): void {
  try {
    if (activeFilterCount(filters) === 0 && !filters.place.trim()) storage.removeItem(FILTERS_KEY);
    else storage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // Storage refused (private mode, quota): the filters still apply for this render; they just do not persist.
  }
}

export function clearFilters(storage: Pick<Storage, "removeItem">): void {
  try {
    storage.removeItem(FILTERS_KEY);
  } catch {
    // Nothing to clear, or storage refused; either way the device holds nothing.
  }
}

/** How many filters narrow the roster. The place is not a filter — it orders, it does not exclude — but a distance ceiling is. */
export function activeFilterCount(filters: Filters): number {
  let n = BOOLEAN_FILTER_KEYS.filter((key) => filters[key]).length;
  n += filters.languages.length;
  if (filters.withinKm !== null) n += 1;
  if (filters.professions.length > 0) n += 1;
  return n;
}

/** One filter that is on, and the set with exactly that filter off — the way out of a list it emptied. */
export interface Relaxation {
  label: string;
  filters: Filters;
}

/**
 * Every filter that is on, in a fixed order, each paired with the set that drops only it. This is
 * the one reading of "what is narrowing the list": `describeFilters` is its labels, and the empty
 * screen's ways out are its sets, so the chips and the ways out can never name different filters.
 */
export function relaxations(filters: Filters): Relaxation[] {
  const out: Relaxation[] = [];
  for (const key of BOOLEAN_FILTER_KEYS) if (filters[key]) out.push({ label: BOOLEAN_FILTER_LABELS[key], filters: { ...filters, [key]: false } });
  for (const language of filters.languages) out.push({ label: `Speaks ${language}`, filters: { ...filters, languages: filters.languages.filter((l) => l !== language) } });
  if (filters.withinKm !== null) out.push({ label: `Within ${filters.withinKm} km`, filters: { ...filters, withinKm: null } });
  if (filters.professions.length > 0) {
    const label = filters.professions.map((p) => profession(p).plural).join(" or ").replace(/^\w/, (c) => c.toUpperCase());
    out.push({ label, filters: { ...filters, professions: [] } });
  }
  return out;
}

/** The labels of the filters that are on, in a fixed order, for the results screen's chips. */
export function describeFilters(filters: Filters): string[] {
  return relaxations(filters).map((r) => r.label);
}

/**
 * Narrow a roster to the clinicians who answer every filter that is on.
 *
 * @param nearestKm How far the clinician's nearest consulting location is from `origin`, or
 *   null when the clinician cannot be placed. Passed in rather than computed so this module
 *   reads no roster geometry of its own — one distance function, the ranking's.
 *
 * Two deliberate readings:
 *   - A distance ceiling applies only once the place resolves; a ceiling with no origin would
 *     exclude everybody, which is a filter deciding something the person has not said.
 *   - A telehealth-first clinician passes the distance ceiling. One who cannot be placed does
 *     NOT pass: an unknown distance is not a short one.
 */
export function applyFilters<T extends Filterable>(
  roster: readonly T[],
  filters: Filters,
  origin: SuburbPoint | null,
  nearestKm: (clinician: T) => number | null,
): T[] {
  return roster.filter((clinician) => {
    if (filters.womanGp && !holdsPreference(clinician, "woman-gp")) return false;
    if (filters.telehealth && !holdsPreference(clinician, "telehealth-first")) return false;
    if (filters.bulkBilling && !holdsPreference(clinician, "bulk-billing")) return false;
    if (filters.longerAppointments && !holdsPreference(clinician, "longer-appointment")) return false;
    if (filters.wheelchair && !clinician.wheelchairAccessible) return false;
    if (filters.openBooks && !clinician.acceptingNewPatients) return false;
    if (filters.languages.some((language) => !clinician.languages.includes(language))) return false;
    if (filters.professions.length > 0 && !filters.professions.includes(clinician.profession ?? "gp")) return false;
    if (filters.withinKm !== null && origin) {
      if (clinician.telehealthFirstAppointment === true) return true;
      const km = nearestKm(clinician);
      if (km === null || km > filters.withinKm) return false;
    }
    return true;
  });
}
