import { getPhyllotacticPosition, PHI, svgNum } from "@/wattle/phyllotaxis";

/**
 * THE WORDMARK'S GLYPH — the gate's animation, stopped on its last frame.
 *
 * WHAT IT IS FOR. A visitor watches a raceme open from green bud to gold with red buds at the
 * growing tip, clicks through, and the plant is gone. This puts its final state beside the
 * wordmark on every page after entry, so the mark they arrive at is the thing they just watched
 * rather than a lettermark with no relation to it.
 *
 * IT IS THE LAST FRAME, NOT A FLOWER ICON, and the red is what makes that true. The bloom runs
 * green, then gold, then a scatter of red buds at the tip in its final quarter — so a glyph
 * that is gold all over is the animation at about seventy per cent, and the one detail that
 * says "this is where it ended" is the red at the top.
 *
 * DRAWN, NOT CAPTURED. A still frame of the WebGL would be a raster asset on a first load that
 * is 102kB and built for regional connections, at one resolution, that could drift out of sync
 * with the animation the next time the field is tuned. This is generated from the same modules
 * the field uses — Vogel's disc for the florets, the PHI taper along the raceme — so it is the
 * same plant by construction and costs nothing.
 *
 * FEWER, LARGER FLORETS THAN THE FIELD. A real head is 40-80 florets, which the gate renders in
 * full because a head there is a couple of hundred pixels across. This one is around 20px on a
 * phone: at 60 florets it is a smudge. Thirteen keeps the phyllotaxis legible at the size the
 * thing is actually seen, which is the botany serving the drawing rather than the reverse.
 *
 * Decorative: the wordmark's own text is the accessible name, so this is aria-hidden.
 */

const FLORETS = 13;

export function WattleGlyph({ className }: { className?: string }) {
  /* Three heads up a leaning axis, base to tip, tapering by PHI — the raceme's own law.

     SPACED WIDER THAN THE RADII SUM TO. At the first spacing the gap between head centres was
     12.5 units against a combined radius of 14.6, so at the size this is actually seen the
     three heads fused into one continuous mass and the raceme read as a smear. Separation is
     the whole point of drawing three: a raceme is distinct heads along a stem, and if they
     touch it is a catkin. Stronger taper too, which shrinks the tip and keeps the red an accent
     rather than a third of the mark. */
  const heads = [0, 1, 2].map((i) => {
    const t = i / 2;
    return {
      x: 12 + t * 16,
      y: 36 - t * 26,
      r: 7 * Math.pow(PHI, -t * 1.1),
      /* The tip carries the last buds, and they are the ones that came in red. */
      red: t > 0.9,
    };
  });

  return (
    <svg
      className={className}
      /* Cropped to the drawing. The first viewBox left the bottom third empty, which at a fixed
         em width made the plant smaller than it needed to be for no reason. */
      viewBox="3 4 32 42"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 44 C10 39 14 33 18 26 C22 19 26 14 29 9"
        fill="none"
        stroke="var(--eucalypt)"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity=".75"
      />
      {/* One phyllode, low on the stem, so the glyph reads as a branch and not as berries. */}
      <path
        d="M13 35 C8 33 5 30 3 25 C8 26 11 29 13 35 Z"
        fill="var(--eucalypt)"
        opacity=".62"
      />

      {heads.map((h, hi) =>
        Array.from({ length: FLORETS }, (_, fi) => {
          /* Vogel's model: golden angle for the angle, sqrt for the radius — the same
             arrangement the field packs its heads with, at a count that survives being small. */
          const p = getPhyllotacticPosition(fi, h.r / Math.sqrt(FLORETS));
          return (
            <circle
              key={`${hi}-${fi}`}
              cx={svgNum(h.x + p.x)}
              cy={svgNum(h.y - p.y)}
              r={svgNum(h.r * 0.29)}
              fill={h.red ? "var(--waratah)" : "var(--wattle)"}
              opacity={h.red ? 0.92 : 0.96}
            />
          );
        }),
      )}
    </svg>
  );
}
