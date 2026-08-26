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

/* --------------------------------------------------------------------------
   THE SPINE IS A GOLDEN SPIRAL.

   IT USED TO BE A QUADRATIC BEZIER from [-2.9, 2.9] to [2.9, -2.9] — a straight
   corner-to-corner diagonal with a single bow in it. That is the reason the
   raceme rendered as one rigid streak: a curve with one bend has one direction,
   so every head hung off it at the same angle and the phyllodes combed the same
   way down its whole length. It read as a fish bone.

   A logarithmic spiral r = e^(b·theta), with b chosen so the radius multiplies
   by PHI every quarter turn, is the golden spiral. Sampled across a turn and a
   third it does four things at once, and each one was a separate defect before:

     1. IT IS AN S-CURVE, so the direction changes continuously along the stem
        and nothing combs uniformly.
     2. THE TIP CURLS. The tight end of the spiral IS the crozier — the nodding,
        hooked tip. It falls out of the maths rather than being added.
     3. SPACING TIGHTENS TOWARD THE TIP, because arc length per unit of theta
        shrinks geometrically. Heads crowd at the growing point exactly as they
        do on a real raceme.
     4. IT IS THE SAME CONSTANT ALREADY GOVERNING THE FLORETS. The golden angle
        places florets within a head (see botany.ts); the golden spiral now
        places heads along the stem. One ratio at both scales, which is the
        actual reason plants look coherent.

   The raw spiral is normalised to a fixed span at module load so the rest of the
   system — foliage, branchlets, the camera framing — keeps working against the
   dimensions it already expects.
   -------------------------------------------------------------------------- */

const PHI = (1 + Math.sqrt(5)) / 2;
/** The defining property: radius multiplies by PHI every quarter turn. */
const SPIRAL_B = Math.log(PHI) / (Math.PI / 2);
/** A turn and a third was a snail shell — the raceme doubled back on itself and the heads
 *  piled into one blob with no direction in it. Just under three quarters of a turn gives the
 *  sweeping crescent the reference has, and because a log spiral's curvature rises toward its
 *  tight end, the curl still lands where it should: only at the tip. */
const SPIRAL_TURN = 0.72 * Math.PI;
/** Where the BASE sits. t runs base -> tip, so theta runs down and the radius shrinks. */
const SPIRAL_THETA0 = 2.42 * Math.PI;
/** Rotation of the whole curve in frame. Aesthetic, not botanical: it stands the raceme up
 *  so it rises from the lower left rather than lying on its side. */
const SPIRAL_ROT = 3.64;

function spiralRaw(t: number): [number, number] {
  const th = SPIRAL_THETA0 - t * SPIRAL_TURN;
  const r = Math.exp(SPIRAL_B * th);
  const x = r * Math.cos(th);
  const y = r * Math.sin(th);
  const c = Math.cos(SPIRAL_ROT), sn = Math.sin(SPIRAL_ROT);
  /* Mirrored in x, so the stem rises from the lower LEFT and its mass leans right. The gate's
     type sits on the left; a raceme sweeping the other way put the densest part of the plant
     directly behind the words. Composition, not botany — a spiral has a handedness and either
     one is a real plant. */
  return [-(x * c - y * sn), x * sn + y * c];
}

/** Fit the raw spiral into the span the old bezier occupied, once, at module load. */
const SPIRAL_FIT = (() => {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i <= 96; i++) {
    const [x, y] = spiralRaw(i / 96);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  return { k: 5.9 / span, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
})();

export function axisAt(t: number): { p: [number, number, number]; tan: [number, number, number] } {
  const at = (u: number): [number, number, number] => {
    const [rx, ry] = spiralRaw(u);
    return [
      (rx - SPIRAL_FIT.cx) * SPIRAL_FIT.k,
      (ry - SPIRAL_FIT.cy) * SPIRAL_FIT.k,
      // A shallow arc out of plane, so the stem is not a flat cut-out under the camera tilt.
      Math.sin(u * Math.PI) * 0.55 - 0.2,
    ];
  };

  const p = at(t);
  // Finite difference rather than an analytic derivative: the curve is cheap to sample and
  // this stays correct if the parametrisation above is ever retuned.
  const h = 0.004;
  const a = at(Math.max(0, t - h));
  const b = at(Math.min(1, t + h));
  const d: [number, number, number] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
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

    /* HEADS TAPER TOWARD THE TIP, BY PHI.

       On a real raceme the basal heads are the oldest and largest and the growing point
       carries small young buds — which is also what the reference plume does, and what stops
       a stem reading as a repeated stamp. PHI^-t takes a head at the tip to 1/1.618 of one at
       the base, the same ratio the spiral uses per quarter turn.

       The per-head jitter on top of it is there because nothing in a plant is uniform: with a
       clean exponential every head sat exactly where its neighbours predicted, which is the
       botanical equivalent of twinning. */
    const taper = Math.pow(PHI, -t) * (0.88 + rand() * 0.24);

    for (const f of flowerHead(rand)) {
      const x = centre[0] + f.offset[0] * scale * taper;
      const yy = centre[1] + f.offset[1] * scale * taper;
      const z = centre[2] + f.offset[2] * scale * taper;
      home.push(x, yy, z);

      // Closed state is a tight bud tucked against the branch, not a scatter.
      dispersed.push(
        p[0] + f.offset[0] * scale * taper * 0.18,
        p[1] + f.offset[1] * scale * taper * 0.18 - 0.1,
        p[2] + f.offset[2] * scale * taper * 0.18,
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
  /* INSTANCED. One filament of geometry, drawn thousands of times.

     WHAT THIS REPLACES. Every filament used to be baked into one enormous flat buffer: four
     segments x two vertices x three floats, repeated for every stamen on every head, with the
     curve of each one precomputed on the CPU at build time. At 34 heads and 26 stamens that
     was already ~21k floats of position and as much again of anchor and attribute, all of it
     uploaded once and none of it shareable.

     An InstancedBufferGeometry inverts that. ONE filament is described — a strip of points
     from 0 to 1 along its own length — and every instance supplies only what makes it
     different: where its base sits, which way it points, which way and how hard it hooks, and
     which head it belongs to. Per-instance cost falls from ~24 vertices to 11 floats, so the
     count stops being the constraint and the tier can carry thousands of filaments instead of
     hundreds.

     THE CURVE MOVED TO THE GPU. It was a CPU loop writing four line segments per filament; it
     is now evaluated in the vertex shader from `aAxis` and `aHook` at whatever resolution
     SEGS gives. Same quadratic, same hook, computed per vertex in parallel.

     Returned as plain typed arrays rather than a THREE object so this file stays free of
     three.js — the whole point of keeping botany and layers separate from the renderer. */
  const SEGS = 5;
  const rand = mulberry32(seed);

  /* The template: SEGS+1 points along one filament, as a line strip expanded to segment pairs.
     `aAlong` is the only per-vertex attribute there is. */
  const along: number[] = [];
  for (let g = 0; g < SEGS; g++) {
    along.push(g / SEGS, (g + 1) / SEGS);
  }

  const count = centres.length * perHead;
  const iBase = new Float32Array(count * 3);   // where the filament meets the head's shell
  const iAxis = new Float32Array(count * 3);   // unit direction out of the head
  const iHook = new Float32Array(count * 3);   // perpendicular * signed hook magnitude
  const iMeta = new Float32Array(count * 2);   // length, and this head's axial position
  const iSeed = new Float32Array(count);

  let n = 0;
  for (let ci = 0; ci < centres.length; ci++) {
    const c = centres[ci]!;
    const cluster = ci / Math.max(1, centres.length - 1);

    for (let s = 0; s < perHead; s++) {
      // Even angular spread with jitter, on a random 3D axis.
      const theta = (s / perHead) * Math.PI * 2 + rand() * 0.5;
      const phi = Math.acos(2 * rand() - 1);

      /* A STAMEN LIVES ON THE SHELL, NOT AT THE CORE. Drawing each filament from the head's
         centre meant every one of them crossed the whole head and was legible straight through
         it — which is what made a head read as an asterisk rather than as a ball of fuzz. */
      const ux = Math.sin(phi) * Math.cos(theta);
      const uy = Math.cos(phi);
      const uz = Math.sin(phi) * Math.sin(theta);
      const inner = shell * (0.82 + rand() * 0.26);
      const len = reach * (0.45 + rand() * 0.55);

      /* A stable perpendicular: cross with whichever axis is least parallel, so there is no
         degenerate case when the filament happens to point along one. */
      const ax: [number, number, number] = Math.abs(uy) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      let bx = uy * ax[2] - uz * ax[1];
      let by = uz * ax[0] - ux * ax[2];
      let bz = ux * ax[1] - uy * ax[0];
      const bl = Math.hypot(bx, by, bz) || 1;
      // Asymmetric: sign and magnitude both vary, so no two filaments hook alike.
      const hook = (len * (0.55 + rand() * 0.75) * (rand() < 0.5 ? 1 : -1)) / bl;

      iBase[n * 3] = c[0] + ux * inner;
      iBase[n * 3 + 1] = c[1] + uy * inner;
      iBase[n * 3 + 2] = c[2] + uz * inner;
      iAxis[n * 3] = ux * len; iAxis[n * 3 + 1] = uy * len; iAxis[n * 3 + 2] = uz * len;
      iHook[n * 3] = bx * hook; iHook[n * 3 + 1] = by * hook; iHook[n * 3 + 2] = bz * hook;
      iMeta[n * 2] = len; iMeta[n * 2 + 1] = cluster;
      iSeed[n] = rand();
      n++;
    }
  }

  return {
    count,
    verticesPerInstance: SEGS * 2,
    along: new Float32Array(along),
    iBase, iAxis, iHook, iMeta, iSeed,
  };
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
    /* SMALLER BLADES, AND MANY MORE OF THEM (the count is raised at the call site). At 0.13 to
       0.215 each phyllode rendered as a broad flat leaf several hundred pixels across — closer
       to a banana palm than to an acacia, and opaque enough to hide the flowers behind it.
       Acacia pycnantha's phyllodes are narrow sickle blades, and what makes a branch read as
       wattle is their DENSITY, not their size. */
    const k = 0.075 + rand() * 0.05;
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
