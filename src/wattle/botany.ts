/**
 * ACACIA PYCNANTHA, ENCODED AS GEOMETRY.
 *
 * This file is the botany. It contains no WebGL and no rendering — only the plant's structure
 * expressed as numbers, so the design language can be reasoned about, unit-tested and changed
 * without touching a shader. Everything downstream (src/wattle/shaders.ts, app/wattle-field.tsx)
 * consumes what this produces.
 *
 * The rule the whole system obeys: NOTHING HERE IS AN ILLUSTRATION OF A FLOWER. Each constant is
 * a real measured property of the species, converted to scene units, and the visual result is
 * whatever falls out of that. Where a number is an aesthetic decision rather than a botanical
 * fact, it says so.
 */

/** Deterministic PRNG. The field must look identical on every load — a generative system that
 *  reshuffles on refresh is a system nobody can art-direct or screenshot for review. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* --------------------------------------------------------------------------
   THE FLOWER HEAD

   In the field a golden wattle head is a globular cluster of 40–80 individual
   florets, each throwing fine radiating stamens, reading as a fuzzy sphere
   about 6–10 mm across. Three properties matter and all three are reproduced:

   1. FLORET COUNT IS THE PARTICLE COUNT. One point per floret, 40–80 per head,
      drawn per-head from the real range. It is not a round number chosen for
      the GPU.
   2. THE DISTRIBUTION IS EVEN, THE RADIUS IS NOT. Florets pack evenly over the
      surface — a Fibonacci sphere, which is the closest cheap analogue to
      phyllotaxis — while each sits at a jittered radius. Even angles with an
      uneven radius is precisely what makes a wattle head read fuzzy rather
      than like a rendered ball.
   3. STAMENS ARE THE OUTER SHELL. Radial jitter is biased outward, because the
      visual mass of a head is its stamens, not its centre.
   -------------------------------------------------------------------------- */

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export const FLORETS_MIN = 40;
export const FLORETS_MAX = 80;

/** Head diameter, 6–10 mm in nature, carried through at 1 scene unit = 1 cm. */
export const HEAD_RADIUS_MIN = 0.3;
export const HEAD_RADIUS_MAX = 0.5;

export interface Floret {
  /** Position relative to the head's centre. */
  offset: [number, number, number];
  /** 0 at the core, 1 at the stamen tips. Drives size and brightness downstream. */
  radial: number;
}

export function flowerHead(rand: () => number): Floret[] {
  const count = Math.round(FLORETS_MIN + rand() * (FLORETS_MAX - FLORETS_MIN));
  const radius = HEAD_RADIUS_MIN + rand() * (HEAD_RADIUS_MAX - HEAD_RADIUS_MIN);
  const florets: Floret[] = [];

  for (let i = 0; i < count; i++) {
    // Fibonacci sphere: even angular coverage without clumping at the poles.
    const y = 1 - (i / (count - 1)) * 2;
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * i;

    // Outward-biased jitter (cube root pushes samples toward the shell).
    const t = Math.cbrt(0.35 + 0.65 * rand());
    const r = radius * t;

    florets.push({
      offset: [Math.cos(theta) * ringRadius * r, y * r, Math.sin(theta) * ringRadius * r],
      radial: t,
    });
  }
  return florets;
}

/* --------------------------------------------------------------------------
   THE RACEME

   Heads are borne along a central axis, and new growth carries a bronze tint
   before maturing green. That single fact is the entire choreography of this
   site: bloom order is AXIAL, not random and not simultaneous. A head's
   position along its raceme is stored per-particle and becomes its delay, so
   the field opens base-to-tip the way the plant does.
   -------------------------------------------------------------------------- */

export interface Head {
  centre: [number, number, number];
  florets: Floret[];
  /** 0 at the base of the raceme, 1 at the tip. The stagger key. */
  axial: number;
}

export interface Raceme {
  heads: Head[];
}

export function raceme(rand: () => number, origin: [number, number, number], length: number, headCount: number): Raceme {
  const heads: Head[] = [];
  // The axis bows rather than running straight — a loaded stem is never a line.
  const bow = (rand() - 0.5) * 0.9;
  const lean = (rand() - 0.5) * 0.5;

  for (let i = 0; i < headCount; i++) {
    const axial = headCount === 1 ? 1 : i / (headCount - 1);
    const along = axial * length;
    heads.push({
      centre: [
        origin[0] + lean * along + bow * Math.sin(axial * Math.PI) * 0.9,
        origin[1] + along,
        origin[2] + (rand() - 0.5) * 0.55,
      ],
      florets: flowerHead(rand),
      axial,
    });
  }
  return { heads };
}

/* --------------------------------------------------------------------------
   THE PHYLLODE

   Not a leaf: a flattened petiole. Falcate (sickle-shaped), elongated, one
   prominent central vein, and an ASYMMETRIC BASE — the asymmetry is the
   diagnostic feature and is what stops a generated curve looking like a
   generic arc.
   -------------------------------------------------------------------------- */

export interface PhyllodeCurve {
  /** Cubic bezier: start, control 1, control 2, end. Scene units. */
  points: [number, number][];
  length: number;
  curvature: number;
}

/**
 * A falcate curve, procedurally varied inside realistic bounds. Used for the SVG divider line
 * art and as the motion path for lightweight reveals — anywhere full WebGL would be overkill.
 */
export function phyllode(rand: () => number): PhyllodeCurve {
  // Real phyllodes run roughly 9–15 cm, and the sickle bends one way only.
  const length = 9 + rand() * 6;
  const curvature = 0.18 + rand() * 0.22;

  // The base is offset across the axis; the tip returns to it. That single asymmetry is
  // the difference between a sickle and a crescent.
  const baseSkew = (0.12 + rand() * 0.16) * (rand() < 0.5 ? -1 : 1);

  return {
    points: [
      [0, 0],
      [length * 0.18, curvature * length * 0.55 + baseSkew * length],
      [length * 0.68, curvature * length],
      [length, curvature * length * 0.22],
    ],
    length,
    curvature,
  };
}

/** The bezier as an SVG `d`, for the divider line art. */
export function phyllodePath(c: PhyllodeCurve): string {
  const [p0, p1, p2, p3] = c.points as [
    [number, number], [number, number], [number, number], [number, number],
  ];
  return `M${p0[0].toFixed(2)} ${p0[1].toFixed(2)} C${p1[0].toFixed(2)} ${p1[1].toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}, ${p3[0].toFixed(2)} ${p3[1].toFixed(2)}`;
}

/* --------------------------------------------------------------------------
   THE FIELD

   Racemes arranged across the hero. Two buffers per particle: where it belongs
   (assembled) and where it starts (dispersed). The dispersed state is not
   random scatter — it is the same point pushed outward along its own axis and
   sunk, so the assembly reads as growth toward the light rather than as
   confetti converging.
   -------------------------------------------------------------------------- */

export interface FieldBuffers {
  count: number;
  home: Float32Array;
  dispersed: Float32Array;
  /** radial (0–1), axial (0–1), seed (0–1), headSize */
  attributes: Float32Array;
}

export interface FieldOptions {
  racemes: number;
  headsPerRaceme: number;
  spread: number;
  seed?: number;
}

export function buildField({ racemes: racemeCount, headsPerRaceme, spread, seed = 7 }: FieldOptions): FieldBuffers {
  const rand = mulberry32(seed);
  const homes: number[] = [];
  const dispersed: number[] = [];
  const attrs: number[] = [];

  for (let r = 0; r < racemeCount; r++) {
    const origin: [number, number, number] = [
      (rand() - 0.5) * spread,
      -2.4 + rand() * 1.1,
      (rand() - 0.5) * spread * 0.5,
    ];
    const stem = raceme(rand, origin, 2.2 + rand() * 2.4, headsPerRaceme);

    for (const head of stem.heads) {
      for (const f of head.florets) {
        const hx = head.centre[0] + f.offset[0];
        const hy = head.centre[1] + f.offset[1];
        const hz = head.centre[2] + f.offset[2];
        homes.push(hx, hy, hz);

        // Dispersed: pushed out along its own radius and dropped. Growth, not confetti.
        const push = 2.6 + rand() * 3.4;
        dispersed.push(
          hx + f.offset[0] * push * 3.2 + (rand() - 0.5) * 1.4,
          hy - 1.2 - rand() * 2.2,
          hz + f.offset[2] * push * 3.2 + (rand() - 0.5) * 1.4,
        );

        attrs.push(f.radial, head.axial, rand(), 1);
      }
    }
  }

  return {
    count: homes.length / 3,
    home: new Float32Array(homes),
    dispersed: new Float32Array(dispersed),
    attributes: new Float32Array(attrs),
  };
}
