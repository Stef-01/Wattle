/**
 * THE SPECIMEN PLATE.
 *
 * A second expression of the same botany. `botany.ts` already knows what a wattle head and a
 * phyllode are; this file arranges them as a herbarium sheet rather than as a particle field, so
 * the plate and the hero are the same plant described twice rather than two drawings that happen
 * to share a palette.
 *
 * Everything is generated from the seeded PRNG at module scope, which means the plate is
 * IDENTICAL on every render — server and client, this week and next. A specimen sheet that
 * reshuffles is not a specimen sheet.
 *
 * Coordinates are SVG user units in a 640 x 900 viewBox, y down.
 */

import { mulberry32, flowerHead, phyllode, phyllodeBlade } from "./botany";

export interface PlateHead {
  cx: number;
  cy: number;
  /** Florets as [x, y, r] relative to the sheet, not to the head. */
  florets: [number, number, number][];
  /** 0 at the base of the branch, 1 at the tip — the reveal order. */
  order: number;
}

export interface PlatePhyllode {
  /** The closed blade silhouette. */
  d: string;
  /** The single prominent central vein — the species' diagnostic feature, drawn as such. */
  vein: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  order: number;
}

export interface Plate {
  stem: string;
  branches: string[];
  phyllodes: PlatePhyllode[];
  heads: PlateHead[];
  /** Total length of the main stem path, for the draw-on animation. */
  stemLength: number;
}

/** Cubic bezier point and tangent, so a branch can leave the stem rather than crossing it. */
function bezierAt(p: [number, number][], t: number): { x: number; y: number; angle: number } {
  const u = 1 - t;
  const [a, b, c, d] = p as [[number, number], [number, number], [number, number], [number, number]];
  const x = a[0] * u * u * u + b[0] * 3 * u * u * t + c[0] * 3 * u * t * t + d[0] * t * t * t;
  const y = a[1] * u * u * u + b[1] * 3 * u * u * t + c[1] * 3 * u * t * t + d[1] * t * t * t;
  const dx = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0]);
  const dy = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1]);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

function buildPlate(): Plate {
  const rand = mulberry32(19);

  // The main stem: rises from the base of the sheet and leans, the way a cut specimen is laid.
  const stemPts: [number, number][] = [
    [318, 880],
    [286, 660],
    [340, 460],
    [316, 250],
  ];
  const stem = `M${stemPts[0]![0]} ${stemPts[0]![1]} C${stemPts[1]![0]} ${stemPts[1]![1]}, ${stemPts[2]![0]} ${stemPts[2]![1]}, ${stemPts[3]![0]} ${stemPts[3]![1]}`;

  const branches: string[] = [];
  const phyllodes: PlatePhyllode[] = [];
  const heads: PlateHead[] = [];

  // Six laterals up the stem, alternating sides. Order runs base to tip, which is the reveal
  // order and the plant's own flowering order.
  const LATERALS = 6;
  for (let i = 0; i < LATERALS; i++) {
    const t = 0.14 + (i / (LATERALS - 1)) * 0.78;
    const at = bezierAt(stemPts, t);
    const side = i % 2 === 0 ? 1 : -1;
    const order = t;

    const reach = 96 + rand() * 78;
    const lift = 54 + rand() * 46;
    const tipX = at.x + side * reach;
    const tipY = at.y - lift;

    branches.push(
      `M${at.x.toFixed(1)} ${at.y.toFixed(1)} Q${(at.x + side * reach * 0.45).toFixed(1)} ${(at.y - lift * 0.15).toFixed(1)}, ${tipX.toFixed(1)} ${tipY.toFixed(1)}`,
    );

    // Two or three phyllodes hang off each lateral. Real generated falcate curves — the same
    // function the divider line art uses.
    const leafCount = 2 + Math.round(rand());
    for (let l = 0; l < leafCount; l++) {
      const along = 0.28 + (l / leafCount) * 0.6;
      const c = phyllode(rand);
      const blade = phyllodeBlade(c);
      phyllodes.push({
        d: blade.outline,
        vein: blade.midrib,
        x: at.x + side * reach * along,
        y: at.y - lift * along + 6,
        // Phyllodes hang; the sign follows the side so they splay outward from the stem.
        rotate: side * (26 + rand() * 34) + (rand() - 0.5) * 14,
        scale: 6.2 + rand() * 2.8,
        order,
      });
    }

    // Two or three heads clustered at the tip of the lateral — a raceme in miniature.
    const headCount = 2 + Math.round(rand());
    for (let h = 0; h < headCount; h++) {
      const spreadA = (h / headCount) * Math.PI * 1.4 + rand() * 0.5;
      const spreadR = 22 + rand() * 38;
      const cx = tipX + Math.cos(spreadA) * spreadR;
      const cy = tipY + Math.sin(spreadA) * spreadR * 0.7;

      // Real floret counts. 1 scene unit in botany = 1 cm; the plate draws at 46 units per cm.
      const florets = flowerHead(rand).map(
        (f) => [cx + f.offset[0] * 62, cy + f.offset[1] * 62, 2.1 + f.radial * 3.4] as [number, number, number],
      );
      heads.push({ cx, cy, florets, order });
    }
  }

  return { stem, branches, phyllodes, heads, stemLength: 700 };
}

/** Built once at module scope: the sheet is a constant, not a render-time decision. */
export const PLATE: Plate = buildPlate();

/**
 * THE LABEL.
 *
 * Real taxonomy, and only the parts that are not in dispute. Deliberately absent: a flowering
 * calendar (it varies by locality and this tree has no source for a specific range) and any
 * conservation status. The proclamation date is the one hard fact here and it is the one the
 * company's name actually rests on.
 */
export const LABEL = {
  family: "Fabaceae",
  binomial: "Acacia pycnantha",
  authority: "Benth.",
  common: "Golden wattle",
  rows: [
    { term: "Family", value: "Fabaceae" },
    { term: "Range", value: "South-eastern Australia" },
    { term: "Flower head", value: "40–80 florets, 6–10 mm" },
    { term: "Phyllode", value: "Falcate, 9–15 cm" },
    { term: "Emblem", value: "Proclaimed 1988" },
  ],
} as const;
