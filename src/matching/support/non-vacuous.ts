// Ported from adhd.me/src/quality/non-vacuous.ts on 2026-10-15 (the two helpers the matching
// suite uses; ADHD.ME's LEGITIMATELY_EMPTY register of accepted empty loops is not carried,
// because it indexes that tree's files).

/** Refuse to iterate an empty list in a test: assertions over nothing prove nothing. */
export function eachOf<T>(items: readonly T[], what: string): readonly T[] {
  if (items.length === 0) {
    throw new Error(
      `non-vacuity: ${what} is empty, so the assertions below ran over nothing and this test proved nothing.`,
    );
  }
  return items;
}

export interface Tally {
  readonly count: () => number;
  readonly saw: () => void;
}

export function tally(): Tally {
  let n = 0;
  return { count: () => n, saw: () => void (n += 1) };
}
