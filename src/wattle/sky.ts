/**
 * A NIGHT SKY, GENERATED RATHER THAN PHOTOGRAPHED.
 *
 * WHY NOT A PHOTOGRAPH. A real Milky Way exposure was the brief and it was the right instinct —
 * the CSS field it replaces looked synthetic and did. It was not taken because the only images
 * good enough are somebody's copyrighted work: the licensed route (ESO release their Paranal and
 * all-sky panoramas under CC BY 4.0) obliges a visible "ESO/S. Brunier" credit alongside the
 * image, which is a permanent design constraint on the gate, and it puts 150-200kB on a first
 * load of 102kB that is explicitly built for regional connections. Generating it costs nothing,
 * needs no credit, and is identical on every tier — including the devices that never get a
 * WebGL context, where a background image would be the only thing still loading.
 *
 * WHY THE OLD ONE LOOKED FAKE, which is the useful part. Three tiled layers of CSS gradients
 * gave stars that were all roughly the same size and the same brightness, spread at roughly the
 * same density everywhere. A real sky is none of those things, and the eye knows it immediately
 * without being able to say why. What it is reading:
 *
 *   1. A POWER LAW. Star counts rise steeply as brightness falls — for every star you notice
 *      there are dozens you half-see and hundreds you do not resolve at all. A field of evenly
 *      bright dots reads as confetti.
 *   2. COLOUR. Stars are not white. They run from orange (~3,000K) through white to blue-white
 *      (~10,000K), and a long exposure records that. Uniform white is the second giveaway.
 *   3. STRUCTURE. The Milky Way is not a smooth luminous band. It is a mottled belt of
 *      unresolved stars with the Great Rift — a dark lane of interstellar dust — cutting along
 *      it. That dark lane is the single most recognisable feature of the real thing, and no
 *      amount of blue glow substitutes for it.
 *
 * So: the band is drawn as tens of thousands of individually unresolved points whose density
 * follows a noise-modulated profile with the rift subtracted from it, and the resolved stars are
 * drawn on top from a power-law magnitude distribution with a colour temperature each.
 *
 * DRAWN ONCE. This is a still image that happens to be computed. There is no animation loop and
 * no per-frame cost — it is painted to a canvas on mount and after a resize, and from then on it
 * is a bitmap the compositor moves around like any other.
 */

import { mulberry32 } from "./botany";

/** Hash-based value noise. Enough for a dust lane; not worth a gradient-noise implementation. */
function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function noise2(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy;
}

/** Fractal noise. Four octaves is plenty for cloud structure at this scale. */
function fbm(x: number, y: number): number {
  let v = 0, a = 0.5, fx = x, fy = y;
  for (let i = 0; i < 4; i++) { v += a * noise2(fx, fy); fx *= 2.03; fy *= 2.01; a *= 0.5; }
  return v;
}

/**
 * Blackbody-ish colour for a star, from a 0..1 temperature parameter.
 * 0 is a cool orange dwarf, 1 a hot blue-white. Not physically calibrated — calibrated to look
 * like a camera's rendering of a sky, which is what is actually being imitated.
 */
function starColour(t: number): [number, number, number] {
  if (t < 0.5) {
    const k = t / 0.5;                       // orange -> white
    return [255, Math.round(186 + 69 * k), Math.round(130 + 125 * k)];
  }
  const k = (t - 0.5) / 0.5;                 // white -> blue-white
  return [Math.round(255 - 44 * k), Math.round(255 - 18 * k), 255];
}

export interface SkyOptions {
  width: number;
  height: number;
  /** Device pixel ratio the canvas is being drawn at. Counts scale with area, not pixels. */
  dpr: number;
  seed?: number;
}

export function drawSky(ctx: CanvasRenderingContext2D, o: SkyOptions): void {
  const { width: W, height: H, dpr } = o;
  const rand = mulberry32(o.seed ?? 20260901);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  /* THE BAND'S GEOMETRY. A line across the frame; every point's distance from it drives how
     dense the sky is there. Running lower-left to upper-right keeps the brightest part of the
     sky away from the gate's type, which sits upper-left. */
  const ang = -0.62;                                   // radians from horizontal
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const cx = W * 0.63, cy = H * 0.52;
  const halfWidth = Math.hypot(W, H) * 0.19;           // 1 sigma of the band, in px

  /** Perpendicular distance from the band's axis, normalised to its width. */
  const bandAt = (x: number, y: number): number => {
    const dx = x - cx, dy = y - cy;
    return Math.abs(-sa * dx + ca * dy) / halfWidth;
  };
  /** Position ALONG the band, for modulating the rift. */
  const alongAt = (x: number, y: number): number => ((x - cx) * ca + (y - cy) * sa) / halfWidth;

  /**
   * How much sky there is at this point: a gaussian across the band, mottled by noise, with the
   * Great Rift cut out of it. The rift wanders — a straight dark line would look like a scratch.
   */
  const density = (x: number, y: number): number => {
    const b = bandAt(x, y);
    const along = alongAt(x, y);
    /* SHARPER ACROSS THE BAND. At 0.85 the falloff was so gentle that the "band" covered the
       whole frame and there was nothing to see; the Milky Way has edges, and the contrast
       between belt and empty sky is most of what makes it recognisable. */
    const core = Math.exp(-b * b * 1.9);
    const mottle = 0.5 + 1.05 * fbm(x * 0.0042 + 11, y * 0.0042 + 7);
    // The rift: a narrow band offset from the axis, wandering with its own noise.
    const wander = (fbm(along * 0.55 + 31, 3.5) - 0.5) * 1.15;
    const rift = Math.exp(-Math.pow((b - 0.34 + wander) * 3.0, 2));
    return Math.max(0, core * mottle * (1 - rift * 0.88));
  };

  /* ---- 1. UNRESOLVED STARS ------------------------------------------------------------
     The band is not a glow, it is stars too faint and too close together to separate. Drawing
     it as a blurred gradient is the shortcut that makes every synthetic sky look like a
     synthetic sky. These are single sub-pixel points at very low alpha, rejection-sampled
     against the density field, so the mottling and the dust lane come out of the sampling
     rather than being painted on afterwards. */
  const area = (W * H) / (1440 * 900);
  /* FORTY-FIVE THOUSAND, not sixteen. At sixteen the band was a suggestion — the count is what
     MAKES the Milky Way, because the band is literally the sum of stars too faint to separate.
     Too few and it reads as haze; enough and it reads as depth. fillRect of a single pixel is
     the cheapest operation available here and the crispest: an arc() at this size is an
     antialiased smudge, and a sky of smudges is the bokeh look this is trying to avoid. */
  const unresolved = Math.round(45000 * Math.min(2.2, area));
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < unresolved; i++) {
    const x = rand() * W, y = rand() * H;
    const d = density(x, y);
    if (rand() > d) continue;                          // rejection sampling
    const t = 0.32 + rand() * 0.5;
    const [r, g, b] = starColour(t);
    ctx.fillStyle = `rgba(${r},${g},${b},${(0.045 + rand() * 0.16).toFixed(3)})`;
    ctx.fillRect(x | 0, y | 0, 1, 1);
  }

  /* ---- 2. RESOLVED STARS --------------------------------------------------------------
     Magnitude from a power law. `rand()^3.1` piles samples near zero, which after inversion is
     a lot of faint stars and very few bright ones — the actual shape of a star count. A linear
     random would give a uniform spread of brightness, which is the confetti field. */
  const resolved = Math.round(9000 * Math.min(2.2, area));
  for (let i = 0; i < resolved; i++) {
    const x = rand() * W, y = rand() * H;
    /* Stars exist everywhere, not only in the band — but there are more of them in it. The
       floor is what keeps the dark corners from being empty. */
    const d = 0.26 + 0.74 * density(x, y);
    if (rand() > d) continue;

    const mag = Math.pow(rand(), 3.4);                 // 0 faint .. 1 bright
    const [r, g, b] = starColour(rand());

    /* THREE CLASSES, BECAUSE A SKY IS MOSTLY PINPOINTS.

       The previous version drew every star as an arc with a radius scaled by brightness, which
       made even the faintest of them a soft antialiased disc — and a field of soft discs is
       exactly the bokeh look this is meant to avoid. In a real exposure the overwhelming
       majority of what you see is a single lit pixel, a smaller number are two or three across,
       and a handful are bright enough to bloom. Splitting them lets the faint ones stay CRISP. */
    if (mag < 0.62) {
      // A pixel. Snapped to the grid so it does not antialias itself into a grey smear.
      ctx.fillStyle = `rgba(${r},${g},${b},${(0.2 + mag * 0.95).toFixed(3)})`;
      ctx.fillRect(x | 0, y | 0, 1, 1);
      continue;
    }

    const radius = 0.55 + (mag - 0.62) * 1.5;
    ctx.fillStyle = `rgba(${r},${g},${b},${(0.72 + mag * 0.28).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    /* THE BRIGHTEST FEW GET A HALO — a tight one. A camera's point spread function spreads a
       bright star over a few pixels, not a few dozen. At radius x7 and alpha 0.3 these read as
       out-of-focus highlights sitting in front of the sky rather than stars in it. */
    if (mag > 0.9) {
      const rr = radius * 3.2;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, rr);
      glow.addColorStop(0, `rgba(${r},${g},${b},${((mag - 0.9) * 1.3).toFixed(3)})`);
      glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalCompositeOperation = "source-over";
}
