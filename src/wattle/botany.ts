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

    /* Outward-biased jitter (cube root pushes samples toward the shell). Biased harder than
       before: at 0.35 the florets filled the head evenly and neighbouring heads merged into one
       continuous rope, because nothing marked where one ball ended and the next began. A head
       is visually a SHELL — its mass is stamens at the surface — so packing them there gives
       each head a rim, and a rim is what separates it from the head beside it. */
    const t = Math.cbrt(0.62 + 0.38 * rand());
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

/**
 * THE PHYLLODE AS A BLADE, not a midrib.
 *
 * `phyllodePath` returns the CURVE — the midrib, which is the right primitive for a motion path
 * or a divider rule. Drawn as a leaf it is a hairline, because a leaf is not a line.
 *
 * This closes it into a silhouette by offsetting the midrib perpendicular by a width profile.
 * The profile peaks past the middle (`^0.75` biases it toward the tip) because a falcate
 * phyllode is widest above its midpoint, and it returns to zero at both ends so the blade comes
 * to a point rather than a stump. The asymmetric base survives because it is a property of the
 * midrib being offset, not something added afterwards.
 */
export function phyllodeBlade(c: PhyllodeCurve, samples = 26): { outline: string; midrib: string } {
  const [p0, p1, p2, p3] = c.points as [
    [number, number], [number, number], [number, number], [number, number],
  ];
  const at = (t: number): [number, number] => {
    const u = 1 - t;
    return [
      p0[0] * u * u * u + p1[0] * 3 * u * u * t + p2[0] * 3 * u * t * t + p3[0] * t * t * t,
      p0[1] * u * u * u + p1[1] * 3 * u * u * t + p2[1] * 3 * u * t * t + p3[1] * t * t * t,
    ];
  };

  // 0.16 of length. A real phyllode is a blade — at 0.085 this drew a reed.
  const maxWidth = c.length * 0.16;
  const upper: string[] = [];
  const lower: [number, number][] = [];

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const [x, y] = at(t);
    const [nx, ny] = at(Math.min(1, t + 0.01));
    const dx = nx - x, dy = ny - y;
    const len = Math.hypot(dx, dy) || 1;
    const w = maxWidth * Math.pow(Math.sin(Math.PI * t), 0.75);
    const ox = (-dy / len) * w, oy = (dx / len) * w;

    upper.push(`${(x + ox).toFixed(2)} ${(y + oy).toFixed(2)}`);
    lower.push([x - ox, y - oy]);
  }

  const back = lower.reverse().map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`);
  return {
    outline: `M${upper.join(" L")} L${back.join(" L")} Z`,
    midrib: phyllodePath(c),
  };
}

/**
 * THE PHYLLODE AS 3D GEOMETRY.
 *
 * `phyllodeBlade` closes the midrib into an SVG outline, which is what the flat plate needs.
 * The hero needs the same silhouette as triangles, so this returns the two edges as sample
 * arrays the scene can strip into a ribbon.
 *
 * This matters more than it sounds: in the reference photograph the phyllodes occupy as much of
 * the frame as the flowers do. A wattle without its foliage is a handful of yellow dots — the
 * blue-green sickle blades are half of what makes the plant recognisable.
 */
export function phyllodeRibbon(
  c: PhyllodeCurve,
  samples = 14,
  /* Width as a fraction of length. The flat plate reads at 0.16; the hero needs ~0.07, because
     a blade wide enough to read on a static illustration renders as an angular SHARD once it is
     small, in perspective and lit from one side. */
  widthRatio = 0.16,
): { upper: [number, number][]; lower: [number, number][] } {
  const [p0, p1, p2, p3] = c.points as [
    [number, number], [number, number], [number, number], [number, number],
  ];
  const at = (t: number): [number, number] => {
    const u = 1 - t;
    return [
      p0[0] * u * u * u + p1[0] * 3 * u * u * t + p2[0] * 3 * u * t * t + p3[0] * t * t * t,
      p0[1] * u * u * u + p1[1] * 3 * u * u * t + p2[1] * 3 * u * t * t + p3[1] * t * t * t,
    ];
  };

  const maxWidth = c.length * widthRatio;
  const upper: [number, number][] = [];
  const lower: [number, number][] = [];

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const [x, y] = at(t);
    const [nx, ny] = at(Math.min(1, t + 0.01));
    const dx = nx - x, dy = ny - y;
    const len = Math.hypot(dx, dy) || 1;
    const w = maxWidth * Math.pow(Math.sin(Math.PI * t), 0.75);
    upper.push([x + (-dy / len) * w, y + (dx / len) * w]);
    lower.push([x - (-dy / len) * w, y - (dx / len) * w]);
  }
  return { upper, lower };
}

/* --------------------------------------------------------------------------
   THE SPINE, AND WHY THE FIELD IS BUILT ON IT

   Until now the hero carried TWO plants: a drawn SVG spray with sixteen blossom
   circles, and a particle field of several thousand florets, overlapping and
   sharing no motion. Two flower systems in one composition is exactly why it
   did not read as one animation.

   So there is now a single master axis — the spine — and everything hangs off
   it. Lateral racemes emerge along it the way they do in a leaf axil, heads sit
   along those laterals, and the stem itself is drawn from the same curve in the
   same coordinate system. One plant, one motion law, no alignment to maintain
   between a DOM element and a canvas.
   -------------------------------------------------------------------------- */

/** The master axis as a cubic bezier in world space: a sickle sweep, base lower-left to tip
 *  upper-right, echoing the falcate language of the phyllode. */
export const SPINE: [number, number, number][] = [
  [-3.6, -3.9, 0.2],
  [-1.9, -1.2, 0.9],
  [0.4, 0.7, -0.6],
  [2.9, 3.2, 0.1],
];

function bezier3(p: [number, number, number][], t: number): [number, number, number] {
  const u = 1 - t;
  const [a, b, c, d] = p as [
    [number, number, number], [number, number, number], [number, number, number], [number, number, number],
  ];
  const w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
  return [
    a[0] * w0 + b[0] * w1 + c[0] * w2 + d[0] * w3,
    a[1] * w0 + b[1] * w1 + c[1] * w2 + d[1] * w3,
    a[2] * w0 + b[2] * w1 + c[2] * w2 + d[2] * w3,
  ];
}

/** Points along the spine, for the stem geometry and for siting the laterals. */
export function spinePoints(segments: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) out.push(bezier3(SPINE, i / segments));
  return out;
}

export interface FieldBuffers {
  count: number;
  home: Float32Array;
  dispersed: Float32Array;
  /** radial (0–1), axial (0–1), seed (0–1), reserved */
  attributes: Float32Array;
}

export interface FieldOptions {
  /** Lateral racemes along the spine. */
  racemes: number;
  headsPerRaceme: number;
  seed?: number;
}

export function buildField({ racemes: lateralCount, headsPerRaceme, seed = 7 }: FieldOptions): FieldBuffers {
  const rand = mulberry32(seed);
  const homes: number[] = [];
  const dispersed: number[] = [];
  const attrs: number[] = [];

  for (let i = 0; i < lateralCount; i++) {
    // Laterals sit between 12% and 96% along the spine — a bare base is what a branch has.
    const t = 0.12 + (i / Math.max(1, lateralCount - 1)) * 0.84;
    const at = bezier3(SPINE, t);
    const ahead = bezier3(SPINE, Math.min(1, t + 0.02));

    // Tangent, so a lateral leaves the spine rather than crossing it.
    const tan: [number, number, number] = [ahead[0] - at[0], ahead[1] - at[1], ahead[2] - at[2]];
    const tl = Math.hypot(tan[0], tan[1], tan[2]) || 1;

    // Alternate sides, as a raceme-bearing branch does.
    const side = i % 2 === 0 ? 1 : -1;
    const nx = (-tan[1] / tl) * side;
    const ny = (tan[0] / tl) * side;

    const reach = 0.5 + rand() * 1.15;

    for (let h = 0; h < headsPerRaceme; h++) {
      const along = headsPerRaceme === 1 ? 1 : h / (headsPerRaceme - 1);
      const centre: [number, number, number] = [
        at[0] + nx * reach * along + (rand() - 0.5) * 0.28,
        at[1] + ny * reach * along + (rand() - 0.5) * 0.28,
        at[2] + (rand() - 0.5) * 0.9,
      ];

      // BLOOM ORDER IS THE SPINE'S ORDER. A head's delay is where its lateral meets the main
      // axis, so the whole branch opens base to tip as one movement rather than each lateral
      // running its own independent sequence.
      const axial = t * 0.82 + along * 0.18;

      for (const f of flowerHead(rand)) {
        const hx = centre[0] + f.offset[0];
        const hy = centre[1] + f.offset[1];
        const hz = centre[2] + f.offset[2];
        homes.push(hx, hy, hz);

        const push = 2.2 + rand() * 3.0;
        dispersed.push(
          hx + f.offset[0] * push * 3.0 + nx * 1.6 + (rand() - 0.5) * 1.2,
          hy - 1.0 - rand() * 1.9,
          hz + f.offset[2] * push * 3.0 + (rand() - 0.5) * 1.2,
        );

        attrs.push(f.radial, axial, rand(), 1);
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
