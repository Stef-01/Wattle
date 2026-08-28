import { mulberry32, flowerHead, phyllode, phyllodeBlade } from "@/wattle/botany";
import { PHI, svgNum } from "@/wattle/phyllotaxis";

/**
 * A WATTLE SPRIG ABOVE THE ACKNOWLEDGEMENT — AND EXPLICITLY NOT AN INDIGENOUS SYMBOL.
 *
 * WHAT WAS ASKED FOR AND WHY IT IS NOT THIS. The request was for an Indigenous symbol carrying
 * meaning for Aboriginal and Torres Strait Islander peoples. Those motifs — dot work, rarrk
 * cross-hatching, concentric meeting-place circles, U-shapes — are not a shared public
 * vocabulary. They belong to particular nations and often to particular families who hold the
 * right to paint them under customary law, and a non-Indigenous company generating one is the
 * harm the Australian Indigenous Design Charter and the Indigenous Art Code exist to name. A
 * fabricated symbol sitting above an Acknowledgement of Country would undercut the one thing
 * the Acknowledgement is there to do.
 *
 * SO THIS IS THE PLANT, AND ONLY THE PLANT. Acacia pycnantha, drawn from the same botany
 * modules that generate the gate's field: real floret counts, the golden angle placing them
 * within each head, the PHI taper along the raceme, and the falcate phyllode with its
 * asymmetric base. It makes no cultural claim. It is the company's own subject, set as a mark
 * of care above the words, in the site's own visual language.
 *
 * The honest version of what was asked for is a commissioned work: an Aboriginal or Torres
 * Strait Islander artist paid, credited and licensed, which is how Australian organisations
 * source artwork for a Reconciliation Action Plan. Recorded in docs/BRIEF-GAPS.md.
 *
 * Decorative: the Acknowledgement's own text is the content, so this is aria-hidden and carries
 * no title.
 */
export function AcknowledgementSprig() {
  const rand = mulberry32(1901);

  /* ONE CURVE, SHARED. The first version placed the stem, the heads and the leaves from three
     separate sets of numbers and they did not agree — the heads floated beside a stem they were
     supposed to be growing from. Everything is sampled from this quadratic now, so the sprig is
     one plant by construction rather than by tuning. */
  const A: [number, number] = [10, 62];
  const B: [number, number] = [42, 52];
  const C: [number, number] = [86, 14];
  const at = (t: number): [number, number] => {
    const u = 1 - t;
    return [
      u * u * A[0] + 2 * u * t * B[0] + t * t * C[0],
      u * u * A[1] + 2 * u * t * B[1] + t * t * C[1],
    ];
  };

  /* Four heads, base to tip, tapering by PHI — the same law the gate's raceme uses, so the mark
     and the animation are the same plant described at two scales. */
  const heads = [0, 1, 2, 3].map((i) => {
    const t = 0.16 + (i / 3) * 0.82;
    const [x, y] = at(t);
    return { x, y, r: 8.6 * Math.pow(PHI, -t * 0.9), florets: flowerHead(rand) };
  });

  const leaves = [0, 1, 2].map((i) => {
    const t = 0.1 + i * 0.26;
    const [x, y] = at(t);
    const c = phyllode(rand);
    return { d: phyllodeBlade(c).outline, x, y, flip: i % 2 === 0, rot: -18 - i * 16 };
  });

  return (
    <svg
      className="ack-sprig"
      viewBox="0 0 100 76"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={`M${A[0]} ${A[1]} Q${B[0]} ${B[1]} ${C[0]} ${C[1]}`}
        fill="none"
        stroke="var(--eucalypt)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity=".62"
      />

      {leaves.map((l, i) => (
        <path
          key={`leaf-${i}`}
          d={l.d}
          fill="var(--eucalypt)"
          opacity=".45"
          transform={`translate(${svgNum(l.x)} ${svgNum(l.y)}) rotate(${l.rot}) scale(1.5 ${l.flip ? -1.5 : 1.5})`}
        />
      ))}

      {heads.map((h, hi) => (
        <g key={`head-${hi}`}>
          {/* One circle per floret, at its real phyllotactic offset. The head is drawn rather
              than approximated with a filled disc for the same reason the field is: a wattle
              head IS its florets, and a disc is the thing it must not look like. The offsets
              come back in scene units where a head's radius is 0.3-0.5, so they are scaled up
              to the radius wanted here. */}
          {h.florets.map((f, fi) => (
            <circle
              key={fi}
              cx={svgNum(h.x + (f.offset[0] / 0.4) * h.r)}
              cy={svgNum(h.y - (f.offset[1] / 0.4) * h.r)}
              r={svgNum(h.r * 0.2)}
              fill="var(--wattle)"
              opacity={(0.5 + f.radial * 0.45).toFixed(2)}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
