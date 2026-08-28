import { mulberry32, phyllode, phyllodeBlade } from "@/wattle/botany";

/**
 * THE FIELD BEHIND THE ACKNOWLEDGEMENT — AND WHY IT IS LEAVES, NOT DOTS.
 *
 * WHAT WAS ASKED FOR. An underlay behind the Acknowledgement's words, referenced to an Aboriginal
 * dot painting: concentric meeting-place circles, dot infill, radiating motifs. That vocabulary
 * was not reproduced and nothing was generated in its style. It belongs to particular nations and
 * often to particular families who hold the right to paint it under customary law, the reference
 * image is somebody's copyrighted work, and inauthentic "Aboriginal-style" art is a named harm
 * with a Productivity Commission report and a standing national campaign behind it. A fabricated
 * version of it sitting under an Acknowledgement of Country would undo the Acknowledgement.
 *
 * AND ONE SHAPE IS AVOIDED ON PURPOSE. The obvious botanical answer here is a wattle HEAD — a
 * disc of florets in phyllotactic rings — and it is exactly wrong in this position. A large
 * dotted concentric circle behind an Acknowledgement of Country reads as a meeting-place symbol
 * whatever the honest intent behind it was, and intent is not what a reader sees. So the circular
 * and dotted vocabulary is left alone entirely.
 *
 * WHAT IT IS INSTEAD. Phyllodes — the falcate blades from botany.ts, the same curve the section
 * dividers draw, scattered large and very faint. Sickles, not discs. Unmistakably a plant and
 * unmistakably this site's own device, with no circle and no dot anywhere in it.
 *
 * UNDER THE WORDS, NEVER OVER THEM. Sits at 5% and behind the text in the stacking order, which
 * keeps the acknowledgement's contrast exactly where the gate measured it — the words are the
 * content and nothing decorative is allowed to cost them legibility.
 *
 * IF ARTWORK IS COMMISSIONED, THIS IS THE SLOT IT DROPS INTO. The honest version of the request
 * is an Aboriginal or Torres Strait Islander artist engaged, paid, credited by name and licensing
 * the work. The treatment is built and waiting; only the artwork is missing. See
 * docs/BRIEF-GAPS.md.
 */
export function AcknowledgementUnderlay() {
  const rand = mulberry32(6021);

  /* Scattered on a coarse grid with per-cell jitter, so the field reads as strewn rather than
     tiled — a regular lattice announces itself as wallpaper immediately. */
  const blades = Array.from({ length: 26 }, (_, i) => {
    const col = i % 7;
    const row = Math.floor(i / 7);
    const c = phyllode(rand);
    return {
      d: phyllodeBlade(c).outline,
      x: col * 30 + (rand() - 0.5) * 20 + 6,
      y: row * 26 + (rand() - 0.5) * 16 + 10,
      rot: -70 + rand() * 140,
      scale: 1.5 + rand() * 1.4,
      flip: rand() < 0.5,
    };
  });

  return (
    <svg
      className="ack-underlay"
      viewBox="0 0 210 110"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      {blades.map((b, i) => (
        <path
          key={i}
          d={b.d}
          fill="var(--eucalypt)"
          transform={`translate(${b.x.toFixed(2)} ${b.y.toFixed(2)}) rotate(${b.rot.toFixed(1)}) scale(${b.scale.toFixed(2)} ${(b.flip ? -b.scale : b.scale).toFixed(2)})`}
        />
      ))}
    </svg>
  );
}
