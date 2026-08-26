/**
 * TIER 1 — CANVAS2D. The tier that always runs.
 *
 * WHAT THIS REPLACES. The capability gate in hero-canvas.tsx turns WebGL down for a stated
 * reduced-motion preference, a metered connection, a missing WebGL2 context, or a modest
 * device — and everything that fell through it got a static SVG. That is a correct floor and a
 * poor one: the plant simply did not move for anybody on an older phone.
 *
 * NO p5.js. The brief names it, and it would be the wrong call here for one measurable reason:
 * p5 is roughly 900kB minified against a site whose entire first load is 102kB. The whole point
 * of this tier is that it reaches the devices and connections the WebGL tier cannot, and none
 * of them are helped by a megabyte of library to draw ellipses and lines. The class structure
 * the brief asks for — WattleFlower with drawStem / drawRaceme / drawStamenCluster /
 * drawPhyllode, driven by a CONFIG object — is exactly what is below, on the raw 2D context.
 *
 * THE BOTANY IS SHARED, NOT REIMPLEMENTED. Golden angle, floret counts and the falcate
 * phyllode curve come from phyllotaxis.ts and botany.ts, the same modules the WebGL tier uses.
 * Two tiers drawing two different plants would be the real failure here.
 */

import { mulberry32, phyllode, FLORETS_MIN, FLORETS_MAX } from "./botany";
import { GOLDEN_ANGLE, PHI } from "./phyllotaxis";

export const CONFIG = {
  /** Florets per head. The real range for the species; not a number chosen for the renderer. */
  stamens: { min: FLORETS_MIN, max: FLORETS_MAX },
  /** Heads on one raceme. */
  headsPerRaceme: { min: 6, max: 11 },
  /** Seconds for one head to go bud -> open. */
  bloomDuration: 1.4,
  /** Seconds of stagger between the base of a raceme and its tip. */
  axialStagger: 0.85,
  /** Concurrent racemes. Canvas2D draws every floret as its own arc, so this is the ceiling
   *  that keeps a mid device inside a 16ms frame — measured, not guessed at. */
  maxRacemes: 34,
  colour: {
    /** Bud: eucalypt darkened and pulled toward gold. Inside the ten-hue palette. */
    bud: [58, 84, 55] as [number, number, number],
    /** Mature bloom: --wattle. */
    gold: [255, 196, 0] as [number, number, number],
    stem: [40, 84, 68] as [number, number, number],
    leaf: [46, 92, 76] as [number, number, number],
  },
  /** Radius of one head in px at scale 1. Larger than it looks: at 13 the heads read as beads
   *  on a chain, because a head has to be big enough to hold forty distinguishable florets. */
  headRadius: 21,
  /** The stem's own length in px at scale 1. */
  racemeLength: 190,
} as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** easeOutCubic. An entrance decelerates. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const PHYLLODE_FILL = `rgb(${CONFIG.colour.leaf[0]} ${CONFIG.colour.leaf[1]} ${CONFIG.colour.leaf[2]} / 0.55)`;

interface Head {
  /** 0 at the base of the raceme, 1 at the tip. Both the stagger key and the size key. */
  axial: number;
  /** Unit offsets for this head's florets, and each one's radial position 0..1. */
  florets: { dx: number; dy: number; radial: number }[];
}

export class WattleFlower {
  readonly x: number;
  readonly y: number;
  private readonly rand: () => number;
  private readonly heads: Head[] = [];
  private readonly lean: number;
  private readonly bow: number;
  private readonly scale: number;
  private readonly leaves: { t: number; ang: number; len: number; curve: number }[] = [];
  /** Seconds since this raceme was spawned. */
  private age = 0;

  constructor(x: number, y: number, seed: number, scale = 1) {
    this.x = x; this.y = y; this.scale = scale;
    const rand = (this.rand = mulberry32(seed));

    this.lean = (rand() - 0.5) * 0.55;
    this.bow = (rand() - 0.5) * 0.9;

    const n = Math.round(lerp(CONFIG.headsPerRaceme.min, CONFIG.headsPerRaceme.max, rand()));
    for (let i = 0; i < n; i++) {
      const axial = n === 1 ? 1 : i / (n - 1);
      const count = Math.round(lerp(CONFIG.stamens.min, CONFIG.stamens.max, rand()));
      const florets: Head["florets"] = [];
      for (let f = 0; f < count; f++) {
        /* VOGEL'S MODEL: golden angle for the ANGLE, sqrt for the RADIUS.

           The radius was `cbrt(0.62 + 0.38 * rand())`, which lands every floret between 0.85
           and 1.0 — so the whole head sat on its own rim and drew as a RING. Rings are what a
           head looks like when the packing is wrong; the fuzz is what it looks like when the
           disc is actually filled.

           sqrt(f / count) is the fill: equal area per floret means radius grows as the square
           root of the index, which is the same reason a sunflower's seeds are evenly dense
           from centre to edge rather than starved in the middle. A light outward bias on top
           of it keeps the visual mass at the surface, where a wattle's stamens are. */
        const theta = GOLDEN_ANGLE * f;
        const radial = Math.pow(f / Math.max(1, count - 1), 0.42) * (0.9 + rand() * 0.14);
        florets.push({ dx: Math.cos(theta) * radial, dy: Math.sin(theta) * radial, radial });
      }
      this.heads.push({ axial, florets });
    }

    for (let i = 0; i < n * 2; i++) {
      const c = phyllode(rand);
      this.leaves.push({
        t: 0.08 + rand() * 0.86,
        ang: (rand() < 0.5 ? 1 : -1) * (0.5 + rand() * 0.8),
        len: c.length * 3.1 * scale,
        curve: c.curvature,
      });
    }
  }

  /** True once every head on this raceme has finished opening. */
  get settled(): boolean {
    return this.age > CONFIG.bloomDuration + CONFIG.axialStagger + 0.3;
  }

  advance(dt: number) { this.age += dt; }
  /** Jump straight to the final frame — the reduced-motion path. */
  freeze() { this.age = CONFIG.bloomDuration + CONFIG.axialStagger + 1; }

  /** A point on the stem. Quadratic bow, so a loaded stem is never a straight line. */
  private axisAt(t: number): [number, number] {
    const len = CONFIG.racemeLength * this.scale;
    return [
      this.x + this.lean * t * len + this.bow * Math.sin(t * Math.PI) * len * 0.28,
      this.y - t * len,
    ];
  }

  /** This head's own 0..1 progress: staggered by axial position, then eased. */
  private openness(axial: number): number {
    const start = axial * CONFIG.axialStagger;
    return easeOut(Math.max(0, Math.min(1, (this.age - start) / CONFIG.bloomDuration)));
  }

  draw(ctx: CanvasRenderingContext2D, time: number) {
    this.drawStem(ctx);
    this.drawPhyllodes(ctx, time);
    this.drawRaceme(ctx, time);
  }

  drawStem(ctx: CanvasRenderingContext2D) {
    const [sx, sy] = this.axisAt(0);
    const [mx, my] = this.axisAt(0.5);
    const [ex, ey] = this.axisAt(1);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    // Quadratic through the measured midpoint, so the drawn curve matches axisAt exactly.
    ctx.quadraticCurveTo(mx * 2 - (sx + ex) / 2, my * 2 - (sy + ey) / 2, ex, ey);
    const [r, g, b] = CONFIG.colour.stem;
    ctx.strokeStyle = `rgb(${r} ${g} ${b})`;
    ctx.lineWidth = 2.4 * this.scale;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  drawPhyllode(ctx: CanvasRenderingContext2D, px: number, py: number, ang: number, len: number, curve: number, open: number) {
    /* FALCATE, AND ASYMMETRIC. A sickle, not a crescent: the blade is widest past its own
       midpoint and the base is offset across the axis. `^0.75` is what biases the widest point
       toward the tip. */
    const L = len * open;
    if (L < 0.5) return;
    const ca = Math.cos(ang), sa = Math.sin(ang);

    /* THE ARITHMETIC IS INLINE BECAUSE THIS IS THE TIER THAT RUNS EVERYWHERE.
       This used to build an `at(u, w)` closure per call and return a fresh `[x, y]` from it 26
       times — so a raceme of twenty phyllodes shed some five hundred arrays and twenty function
       objects EVERY FRAME, multiplied again by each raceme the reader spawns. Nothing here is
       kept, so it all lands on the collector, and the pauses arrive as a stutter in the one
       path the weakest machines are on: Canvas2D is the fallback for hardware with no WebGL.
       Same curve, same output, no garbage. */
    ctx.beginPath();
    const SEG = 12;
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG;
      const w = Math.sin(Math.pow(u, 0.75) * Math.PI) * L * 0.085;
      const bx = u * L;
      const by = curve * L * Math.sin(u * Math.PI) + w;
      const x = px + bx * ca - by * sa;
      const y = py + bx * sa + by * ca;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    for (let i = SEG; i >= 0; i--) {
      const u = i / SEG;
      const w = -Math.sin(Math.pow(u, 0.75) * Math.PI) * L * 0.085;
      const bx = u * L;
      const by = curve * L * Math.sin(u * Math.PI) + w;
      ctx.lineTo(px + bx * ca - by * sa, py + bx * sa + by * ca);
    }
    ctx.closePath();
    // Constant, so it is built once at module load rather than re-serialised and re-parsed by
    // the canvas on every phyllode of every frame.
    ctx.fillStyle = PHYLLODE_FILL;
    ctx.fill();
  }

  private drawPhyllodes(ctx: CanvasRenderingContext2D, time: number) {
    for (const l of this.leaves) {
      const [px, py] = this.axisAt(l.t);
      // Leaves lead the flowers: a branch is clothed before it blooms.
      const open = Math.max(0, Math.min(1, this.age / (CONFIG.bloomDuration * 0.7)));
      const sway = Math.sin(time * 0.6 + l.t * 6) * 0.045;
      this.drawPhyllode(ctx, px, py, l.ang + sway - Math.PI / 2, l.len, l.curve, easeOut(open));
    }
  }

  drawRaceme(ctx: CanvasRenderingContext2D, time: number) {
    for (const head of this.heads) {
      const [hx, hy] = this.axisAt(head.axial);
      /* HEADS TAPER TOWARD THE TIP, BY PHI. On a real raceme the basal heads are the oldest
         and largest and the growing point carries small young buds. */
      const size = CONFIG.headRadius * this.scale * Math.pow(PHI, -head.axial);
      this.drawStamenCluster(ctx, hx, hy, size, this.openness(head.axial), head, time);
    }
  }

  drawStamenCluster(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, radius: number, open: number,
    head: Head, time: number,
  ) {
    if (open <= 0) return;
    const { bud, gold } = CONFIG.colour;
    /* NEW GROWTH IS DULL OLIVE AND MATURES GOLD, driven by the same value as the geometry —
       one growth term for shape and colour, which is what makes it read as one event. */
    const r = Math.round(lerp(bud[0], gold[0], Math.min(1, open * 1.15)));
    const g = Math.round(lerp(bud[1], gold[1], Math.min(1, open * 1.15)));
    const b = Math.round(lerp(bud[2], gold[2], Math.min(1, open * 1.15)));

    for (const f of head.florets) {
      /* THE FLORET TRAVELS OUT FROM THE CORE. A closed head is a tight bud, not a faded open
         one — the radius itself is what opens, which is the difference between a bloom and a
         cross-fade. */
      const spread = radius * (0.18 + 0.82 * open);
      const sway = Math.sin(time * 0.9 + f.radial * 7 + cx * 0.01) * radius * 0.03 * open;
      const x = cx + f.dx * spread + sway;
      const y = cy + f.dy * spread;
      /* SMALL DOTS, MANY OF THEM. Each floret is a fraction of the head, not a bead on it —
         at 0.16 of the radius forty florets read as forty circles rather than as one ball. */
      const dot = radius * (0.085 + f.radial * 0.055);
      ctx.beginPath();
      ctx.arc(x, y, dot, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${r} ${g} ${b} / ${(0.45 + 0.5 * f.radial * open).toFixed(3)})`;
      ctx.fill();
    }
  }
}
