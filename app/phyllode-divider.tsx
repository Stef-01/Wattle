import { mulberry32, phyllode, phyllodeBlade } from "@/wattle/botany";

/**
 * A SECTION RULE MADE OF PHYLLODES.
 *
 * The falcate curve in botany.ts was written for the SVG line art and the hero's WebGL field to
 * share — one description of the leaf, two renderings. Only the field was using it. This is the
 * line art half: a row of sickle midribs, drawn on as the divider enters the viewport.
 *
 * STROKE-DASHOFFSET, WITH pathLength="1" AND NO MEASUREMENT.
 *
 * The usual draw-on reads `getTotalLength()` in JavaScript and writes it into a custom property,
 * which means the animation cannot start until script has run and measured — and until then the
 * path is either fully drawn or fully hidden, whichever the CSS guessed. `pathLength="1"`
 * normalises any path to a length of exactly 1, so `stroke-dasharray:1; stroke-dashoffset:1`
 * hides it and animating the offset to 0 draws it, at any size, with no measurement anywhere.
 * The whole divider is a server component: there is no client JavaScript in this file at all.
 *
 * THE ANIMATION IS SCROLL-DRIVEN NATIVELY. `animation-timeline: view()` ties progress to the
 * element's own passage through the viewport, off the main thread, with no observer. Firefox
 * has not shipped it, so the RESTING STATE IS THE DRAWN ONE and the animation only ever takes
 * it away and gives it back — a browser without support shows a finished divider rather than an
 * invisible one, which is the rule for anything built on a timeline that may not exist.
 */
export function PhyllodeDivider({ count = 7, seed = 91 }: { count?: number; seed?: number }) {
  const rand = mulberry32(seed);
  const leaves = Array.from({ length: count }, () => {
    const c = phyllode(rand);
    /* THE SILHOUETTE, NOT THE MIDRIB. `phyllodePath` returns the curve — the right primitive
       for a motion path and, stroked at this size, a dash. `phyllodeBlade` closes it into an
       outline by offsetting that curve by a width profile, so what gets traced is the leaf's
       actual edge: widest past the midpoint, pointed at both ends, asymmetric at the base.
       That asymmetry is the diagnostic feature of a phyllode and the only thing separating a
       drawn acacia leaf from a generic almond shape. */
    return { d: phyllodeBlade(c).outline, flip: rand() < 0.5, tilt: (rand() - 0.5) * 30 };
  });

  return (
    <div className="phyllode-divider" aria-hidden="true">
      <svg viewBox="0 0 320 34" role="presentation" focusable="false">
        {leaves.map((leaf, i) => {
          // Spread along the rule, alternating which way the sickle bends.
          const x = 6 + (i * 300) / count;
          /* UNIFORM SCALE. Scaling y harder than x seemed like the way to fatten a hairline,
             but the blade is not a straight ribbon — its midrib already arcs about half its own
             length, so stretching that axis turned a sickle into a claw standing on end. The
             shape carries its own proportions; it only needed to be bigger and laid along the
             rule rather than across it. */
          return (
            <path
              key={i}
              d={leaf.d}
              pathLength={1}
              transform={`translate(${x} 17) rotate(${leaf.tilt}) scale(1.75 ${leaf.flip ? -1.75 : 1.75})`}
              style={{ ["--i" as string]: String(i) }}
            />
          );
        })}
      </svg>
    </div>
  );
}
