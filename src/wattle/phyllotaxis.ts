/**
 * PHYLLOTAXIS — the one constant, in one place.
 *
 * The golden angle was already doing two jobs in this codebase and was written out twice:
 * `botany.ts` used it to pack florets over a head (a Fibonacci sphere) and `layers.ts` used
 * the golden RATIO to lay heads along a spiral stem. This module is the shared source, so a
 * change to how the plant is arranged happens once.
 *
 * WHY 137.508 DEGREES. Divide a turn in the golden ratio and the smaller part is
 * 360 / PHI^2 = 137.508deg. It is the most irrational angle available: every rational angle
 * eventually repeats and leaves radial gaps, and the closer a ratio is to rational the sooner
 * that happens. Placing each successive element one golden angle round from the last is the
 * arrangement that never lines up, which is why it packs seed heads, florets and leaves.
 *
 * TWO ARRANGEMENTS, NOT ONE. They are different problems and the difference matters:
 *   - DISC (getPhyllotacticPosition) — r = scale * sqrt(i). The sunflower head. sqrt because
 *     equal area per element means radius grows as the square root of the count; without it
 *     the centre is starved and the rim is crowded.
 *   - SPHERE (fibonacciSphere) — the same angle, but stepping evenly through height rather
 *     than radius, which is what a globular acacia head actually is.
 */

/** PHI. Exported because layers.ts builds the stem's spiral from the same number. */
export const PHI = (1 + Math.sqrt(5)) / 2;

/** 137.50776...deg in radians. Equivalent to PI * (3 - sqrt(5)). */
export const GOLDEN_ANGLE = (2 * Math.PI) / (PHI * PHI);

/** The same value in degrees, for anyone reading this who expects to see 137.5. */
export const GOLDEN_ANGLE_DEG = (GOLDEN_ANGLE * 180) / Math.PI;

/**
 * Vogel's model: the position of the i-th element in a phyllotactic disc.
 * Used to scatter racemes across the field so no two sit on a visible ray.
 */
export function getPhyllotacticPosition(index: number, scale: number): { x: number; y: number; theta: number; radius: number } {
  const theta = index * GOLDEN_ANGLE;
  const radius = scale * Math.sqrt(index);
  return { x: Math.cos(theta) * radius, y: Math.sin(theta) * radius, theta, radius };
}

/**
 * The i-th of `count` points spread evenly over a unit sphere.
 *
 * `y` steps linearly from 1 to -1 and the ring radius is sqrt(1 - y^2), which is what keeps
 * the spacing even instead of bunching at the poles — the mistake a naive lat/long loop makes.
 */
export function fibonacciSphere(index: number, count: number): [number, number, number] {
  const y = count === 1 ? 0 : 1 - (index / (count - 1)) * 2;
  const ring = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = GOLDEN_ANGLE * index;
  return [Math.cos(theta) * ring, y, Math.sin(theta) * ring];
}
