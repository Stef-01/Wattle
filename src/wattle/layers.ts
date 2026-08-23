/**
 * THE LAYER STACK.
 *
 * The hero ran ONE particle population, which is why it read as texture rather than as a scene.
 * The references share a structure the single field cannot produce:
 *
 *   - a starfield sitting far behind everything (depth by parallax)
 *   - out-of-focus mass between the viewer and the subject (depth by BLUR, not just by size)
 *   - a sharp subject built from points whose DENSITY carries the form
 *   - filaments radiating out of that subject
 *   - a few large soft motes crossing in FRONT of the camera
 *
 * Depth here is built from four cues at once — parallax rate, point size, softness and opacity —
 * because any one of them alone reads as "small dots and big dots" rather than as distance.
 *
 * Every population is generated from the same botany as before. A far bloom is not a different
 * object; it is the same flower head at a different z with a different focus.
 */

import { mulberry32, flowerHead, phyllode, phyllodeRibbon } from "./botany";

export interface Population {
  count: number;
  /** xyz */
  position: Float32Array;
  /** per-point: size, seed, depth 0..1, extra */
  attr: Float32Array;
}


/* ===========================================================================
   THE BRANCH AXIS — the thing all three generators hang off.

   The reference photograph is a BRANCH running diagonally across the frame, with
   phyllodes fanning outward-downward along its length and ball clusters hanging
   below it the whole way. Earlier versions modelled a vertical spray with the
   heads crowded at the crown, which is a different plant — and no amount of
   tuning blade width or head count was ever going to fix a wrong skeleton.

   One axis, consumed by the heads, the foliage and the branchlets, so all three
   are attached to the same branch instead of three things near each other.
   =========================================================================== */

const AXIS_A: [number, number, number] = [-2.9, 2.9, -0.4];
const AXIS_B: [number, number, number] = [1.4, 0.4, 0.3];
const AXIS_C: [number, number, number] = [2.9, -2.9, 0.2];

/** Quadratic through A, B, C. Position and unit tangent at t. */
export function axisAt(t: number): { p: [number, number, number]; tan: [number, number, number] } {
  const u = 1 - t;
  const p: [number, number, number] = [
    u * u * AXIS_A[0] + 2 * u * t * AXIS_B[0] + t * t * AXIS_C[0],
    u * u * AXIS_A[1] + 2 * u * t * AXIS_B[1] + t * t * AXIS_C[1],
    u * u * AXIS_A[2] + 2 * u * t * AXIS_B[2] + t * t * AXIS_C[2],
  ];
  const d: [number, number, number] = [
    2 * u * (AXIS_B[0] - AXIS_A[0]) + 2 * t * (AXIS_C[0] - AXIS_B[0]),
    2 * u * (AXIS_B[1] - AXIS_A[1]) + 2 * t * (AXIS_C[1] - AXIS_B[1]),
    2 * u * (AXIS_B[2] - AXIS_A[2]) + 2 * t * (AXIS_C[2] - AXIS_B[2]),
  ];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  return { p, tan: [d[0] / len, d[1] / len, d[2] / len] };
}

/** Layer 1 — POLLEN DUST. Thousands of tiny motes, far back, barely moving. The starfield. */
export function dust(count: number, seed = 101): Population {
  const rand = mulberry32(seed);
  const position = new Float32Array(count * 3);
  const attr = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    position[i * 3] = (rand() - 0.5) * 34;
    position[i * 3 + 1] = (rand() - 0.5) * 20;
    // Pushed well behind the subject. Negative z is away from the camera.
    position[i * 3 + 2] = -14 - rand() * 16;
    attr[i * 4] = 0.5 + rand() * 1.5;
    attr[i * 4 + 1] = rand();
    attr[i * 4 + 2] = rand();
    attr[i * 4 + 3] = rand();
  }
  return { count, position, attr };
}

/**
 * Layer 6 — FOREGROUND BOKEH. A handful of very large, very soft discs between camera and
 * subject. This is the layer that sells depth: nothing else in the scene can be in front of you.
 */
export function bokeh(count: number, seed = 202): Population {
  const rand = mulberry32(seed);
  const position = new Float32Array(count * 3);
  const attr = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    position[i * 3] = (rand() - 0.5) * 16;
    position[i * 3 + 1] = (rand() - 0.5) * 11;
    position[i * 3 + 2] = 3.5 + rand() * 3.5;
    attr[i * 4] = 26 + rand() * 58;
    attr[i * 4 + 1] = rand();
    attr[i * 4 + 2] = 1;
    attr[i * 4 + 3] = rand();
  }
  return { count, position, attr };
}

export interface BloomLayer {
  count: number;
  home: Float32Array;
  dispersed: Float32Array;
  /** radial, axial, seed, headIndex */
  attr: Float32Array;
  /** Head centres, so the stamen layer can radiate from exactly the same points. */
  centres: [number, number, number][];
}

/**
 * THE SPRAY — the composition from the reference, in wattle.
 *
 * The reference holds ONE subject: a tight bud on a long slender stem, low in frame, that opens.
 * Wattle does not have one flower, it has a raceme — so the equivalent of a dahlia's petals
 * unfurling in shells is a spray of heads opening base to tip, each head's own florets opening
 * core-outward at the same time. Two nested sequences instead of one, which is more layered than
 * the reference rather than less.
 *
 * Heads mass toward the top of the stem, as they do on a real spray, with a few stragglers lower.
 */
export function spray(opts: { heads: number; height: number; lean: number; scale: number; seed: number }): BloomLayer {
  const { heads, scale, seed } = opts;
  const rand = mulberry32(seed);
  const home: number[] = [];
  const dispersed: number[] = [];
  const attr: number[] = [];
  const centres: [number, number, number][] = [];

  for (let h = 0; h < heads; h++) {
    // Spread evenly ALONG the branch, not crowded at one end.
    const t = 0.06 + (h / Math.max(1, heads - 1)) * 0.9 + (rand() - 0.5) * 0.03;
    const { p, tan } = axisAt(Math.min(1, Math.max(0, t)));

    // Perpendicular in the view plane, biased downward: clusters HANG off the branch.
    const nx = tan[1], ny = -tan[0];
    const drop = 0.12 + rand() * 0.72;
    const side = rand() < 0.62 ? 1 : -1;

    const centre: [number, number, number] = [
      p[0] + nx * drop * side + (rand() - 0.5) * 0.3,
      p[1] + ny * drop * side - rand() * 0.34,
      p[2] + (rand() - 0.5) * 0.75,
    ];
    centres.push(centre);

    for (const f of flowerHead(rand)) {
      const x = centre[0] + f.offset[0] * scale;
      const yy = centre[1] + f.offset[1] * scale;
      const z = centre[2] + f.offset[2] * scale;
      home.push(x, yy, z);

      // Closed state is a tight bud tucked against the branch, not a scatter.
      dispersed.push(
        p[0] + f.offset[0] * scale * 0.18,
        p[1] + f.offset[1] * scale * 0.18 - 0.1,
        p[2] + f.offset[2] * scale * 0.18,
      );

      attr.push(f.radial, t, rand(), h);
    }
  }

  return {
    count: home.length / 3,
    home: new Float32Array(home),
    dispersed: new Float32Array(dispersed),
    attr: new Float32Array(attr),
    centres,
  };
}

/**
 * Layers 3 and 4 — THE BLOOMS.
 *
 * `depth` shifts the whole population in z and is used by the caller to set focus: the far copy
 * is bigger, softer and dimmer, the near copy is sharp. Same generator, different plane — which
 * is what makes them read as one plant at two distances instead of two different plants.
 */
export function bloomLayer(opts: {
  clusters: number;
  depth: number;
  spread: number;
  scale: number;
  seed: number;
}): BloomLayer {
  const { clusters, depth, spread, scale, seed } = opts;
  const rand = mulberry32(seed);
  const home: number[] = [];
  const dispersed: number[] = [];
  const attr: number[] = [];
  const centres: [number, number, number][] = [];

  for (let c = 0; c < clusters; c++) {
    // Clusters sit on a rising arc rather than a scatter — a spray, not a cloud.
    const t = c / Math.max(1, clusters - 1);
    const centre: [number, number, number] = [
      (t - 0.42) * spread + (rand() - 0.5) * 1.5,
      (t - 0.5) * spread * 0.72 + (rand() - 0.5) * 1.3,
      depth + (rand() - 0.5) * 2.4,
    ];
    centres.push(centre);

    for (const f of flowerHead(rand)) {
      const x = centre[0] + f.offset[0] * scale;
      const y = centre[1] + f.offset[1] * scale;
      const z = centre[2] + f.offset[2] * scale;
      home.push(x, y, z);

      const push = 2.4 + rand() * 3.6;
      dispersed.push(
        x + f.offset[0] * push * scale * 2.2 + (rand() - 0.5) * 1.5,
        y - 1.1 - rand() * 2.4,
        z + f.offset[2] * push * scale * 2.2 + (rand() - 0.5) * 1.5,
      );

      attr.push(f.radial, t, rand(), c);
    }
  }

  return {
    count: home.length / 3,
    home: new Float32Array(home),
    dispersed: new Float32Array(dispersed),
    attr: new Float32Array(attr),
    centres,
  };
}

/**
 * Layer 5 — STAMENS.
 *
 * The single most identifying thing about a wattle head, and the feature the reference flower is
 * built out of: fine filaments radiating from the centre. Drawn as line segments from each head's
 * core outward, which is also literally what a floret is.
 *
 * Returned as pairs of vertices for LineSegments, with the same 0-at-core / 1-at-tip attribute
 * the point shader uses, so the filaments fade and move in step with the florets around them.
 */
export function stamens(
  centres: [number, number, number][],
  perHead: number,
  reach: number,
  seed = 303,
  shell = 0.30,
) {
  const rand = mulberry32(seed);
  const position = new Float32Array(centres.length * perHead * 2 * 3);
  const attr = new Float32Array(centres.length * perHead * 2 * 3);
  let p = 0;
  let a = 0;

  for (let ci = 0; ci < centres.length; ci++) {
    const c = centres[ci]!;
    for (let s = 0; s < perHead; s++) {
      // Even angular spread with jitter, on a random 3D axis.
      const theta = (s / perHead) * Math.PI * 2 + rand() * 0.5;
      const phi = Math.acos(2 * rand() - 1);

      /* A STAMEN LIVES ON THE SHELL, NOT AT THE CORE. Drawing each filament from the head's
         centre meant every one of them crossed the whole head and was legible straight through
         it — which is what made a head read as an asterisk rather than as a ball of fuzz. Real
         stamens occupy a thin band at the surface. So the inner vertex starts out at the shell,
         jittered, and the filament extends only a short way past it. */
      const ux = Math.sin(phi) * Math.cos(theta);
      const uy = Math.cos(phi);
      const uz = Math.sin(phi) * Math.sin(theta);
      const inner = shell * (0.82 + rand() * 0.26);
      const outer = inner + reach * (0.45 + rand() * 0.55);

      position[p++] = c[0] + ux * inner; position[p++] = c[1] + uy * inner; position[p++] = c[2] + uz * inner;
      position[p++] = c[0] + ux * outer; position[p++] = c[1] + uy * outer; position[p++] = c[2] + uz * outer;

      const cluster = ci / Math.max(1, centres.length - 1);
      const seedV = rand();
      attr[a++] = 0; attr[a++] = cluster; attr[a++] = seedV;
      attr[a++] = 1; attr[a++] = cluster; attr[a++] = seedV;
    }
  }
  return { count: centres.length * perHead * 2, position, attr };
}


/**
 * FOLIAGE — the half of the plant that was missing.
 *
 * In the reference the phyllodes are long, broad, blue-grey-green sickles that occupy as much of
 * the frame as the flowers. Without them the hero was a handful of yellow dots; they are what
 * makes the thing read as *wattle* rather than as generic golden particles.
 *
 * Built as one merged triangle ribbon per blade so the whole canopy is a single draw call. Each
 * blade carries `aBlade`: along-length 0..1, a per-blade seed, and a depth cue for shading.
 */
export function foliage(opts: { count: number; height: number; lean: number; seed: number }) {
  const { count, seed } = opts;
  const rand = mulberry32(seed);
  const pos: number[] = [];
  const attr: number[] = [];

  for (let i = 0; i < count; i++) {
    const t = 0.04 + rand() * 0.94;
    const { p, tan } = axisAt(t);

    // The blade leaves the branch roughly perpendicular, then droops. Both sides, so the branch
    // is clothed rather than combed one way.
    const side = rand() < 0.5 ? 1 : -1;
    const perp = Math.atan2(-tan[0], tan[1]);
    const ang = perp + side * (0.15 + rand() * 0.75) - 0.55;

    const ca = Math.cos(ang), sa = Math.sin(ang);
    const c = phyllode(rand);
    const { upper, lower } = phyllodeRibbon(c, 12, 0.07);
    const k = 0.13 + rand() * 0.085;
    const seedV = rand();
    const depth = rand();
    const oz = p[2] + (rand() - 0.5) * 1.1;

    const place = (pt: [number, number]): [number, number, number] => [
      p[0] + (pt[0] * ca - pt[1] * sa) * k,
      p[1] + (pt[0] * sa + pt[1] * ca) * k,
      oz + pt[0] * k * 0.1,
    ];

    for (let sIdx = 0; sIdx < upper.length - 1; sIdx++) {
      const a = place(upper[sIdx]!), b = place(upper[sIdx + 1]!);
      const cc = place(lower[sIdx]!), d = place(lower[sIdx + 1]!);
      const a0 = sIdx / (upper.length - 1);
      const a1 = (sIdx + 1) / (upper.length - 1);
      pos.push(...a, ...cc, ...b);
      attr.push(a0, seedV, depth, a0, seedV, depth, a1, seedV, depth);
      pos.push(...b, ...cc, ...d);
      attr.push(a1, seedV, depth, a0, seedV, depth, a1, seedV, depth);
    }
  }

  return { count: pos.length / 3, position: new Float32Array(pos), attr: new Float32Array(attr) };
}

/** BRANCHLETS — the axis itself, plus the short stalk each cluster hangs from. */
export function branchlets(centres: [number, number, number][], _lean: number, _height: number) {
  const pos: number[] = [];
  const attr: number[] = [];

  // The branch, as a run of segments.
  const SEG = 26;
  for (let i = 0; i < SEG; i++) {
    const a = axisAt(i / SEG).p;
    const b = axisAt((i + 1) / SEG).p;
    pos.push(...a, ...b);
    attr.push(0, i / SEG, 1, 0, 0, (i + 1) / SEG, 1, 0);
  }

  // A stalk from the nearest point on the branch to each cluster, so nothing floats.
  for (const c of centres) {
    let bestT = 0, bestD = Infinity;
    for (let i = 0; i <= 24; i++) {
      const q = axisAt(i / 24).p;
      const d = (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2;
      if (d < bestD) { bestD = d; bestT = i / 24; }
    }
    const anchor = axisAt(bestT).p;
    pos.push(...anchor, ...c);
    attr.push(0, bestT, 0, 0, 1, bestT, 0, 0);
  }

  return { count: pos.length / 3, position: new Float32Array(pos), attr: new Float32Array(attr) };
}
