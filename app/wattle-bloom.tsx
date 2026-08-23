/**
 * THE BLOOM — the site's one enormous organic subject.
 *
 * The model is a venture firm's hero: one huge living thing on a dark ground, owning the first
 * viewport, animating continuously rather than entering once. Blackbird drives theirs with a
 * Lottie payload; this one is hand-authored SVG driven by CSS keyframes, because the brief also
 * requires the site to stay usable on a regional connection and a JSON animation runtime is a
 * dependency plus a network round trip for something a stylesheet can do.
 *
 * WHAT IS ANIMATED AND WHY. Wattle blossom is a cluster of tiny spheres on a spray, and the thing
 * it does in wind is drift while the heads open. So the spray drifts and turns on two separate
 * cycles, and a MINORITY of the heads breathe from a rest state — no head is ever at zero, so the
 * animation degrades to a fully-drawn sprig when motion is off rather than to an empty frame.
 *
 * The amplitudes are deliberately small. Ambient motion runs at a fraction of primary motion and
 * must never compete for attention; a scale pulse past a few per cent stops reading as breathing
 * and starts reading as a thing demanding to be looked at, which is not what a background organism
 * should do while somebody reads the sentence in front of it.
 *
 * The SVG is decorative: the heading beside it carries the meaning, so it is aria-hidden and has
 * no title. Nothing here is a control — the pause control lives in app/motion-toggle.tsx.
 */

/**
 * Blossom heads: [cx, cy, r, delay-ms, breathes].
 *
 * Hand-placed along the spray rather than generated — a wattle spray is not evenly spaced, and an
 * even one reads as a diagram of a plant.
 *
 * ONLY SIX OF THE SIXTEEN BREATHE. Animating all of them broke the density rule — no more than
 * about a third of elements moving at once — and, worse, made the cluster pulse as one object,
 * the exact failure the per-head delays were meant to avoid. A real spray has heads at different
 * stages, so the ten static ones are not a performance compromise: they are what makes the six
 * read as individual flowers rather than as a throbbing blob.
 */
const HEADS: ReadonlyArray<readonly [number, number, number, number, boolean]> = [
  [300, 96, 30, 0, true],
  [366, 132, 21, 380, false],
  [246, 150, 24, 720, true],
  [318, 186, 26, 200, false],
  [402, 200, 16, 940, false],
  [214, 218, 17, 540, true],
  [282, 246, 22, 1120, false],
  [354, 262, 19, 300, true],
  [178, 286, 14, 860, false],
  [246, 312, 18, 640, false],
  [318, 330, 15, 1240, true],
  [136, 350, 12, 460, false],
  [202, 372, 15, 1020, false],
  [270, 392, 12, 260, true],
  [108, 414, 10, 780, false],
  [166, 436, 12, 1160, false],
];

export function WattleBloom({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 460 560" className={className} fill="none" aria-hidden="true" focusable="false">
      <defs>
        {/* Depth across the cluster: heads read lit at one edge and cooler at the other. A flat
            fill on sixteen circles looks like a dot pattern, not a flower. */}
        <radialGradient id="bloom-head" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffe27a" />
          <stop offset="55%" stopColor="var(--blossom)" />
          <stop offset="100%" stopColor="var(--gold-mid)" />
        </radialGradient>
        <linearGradient id="bloom-stem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sage)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--sage)" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {/* TWO NESTED GROUPS ON PURPOSE. The outer drifts, the inner turns, on cycles of different
          length offset from one another. A single element cannot carry two transform animations at
          different periods, and locking rotation to the same keyframes as the rise is what made an
          earlier version read as a mechanical rocker rather than a stem in air. */}
      <g className="bloom-drift">
        <g className="bloom-spray">
          <path
            className="bloom-stem"
            d="M52 548C118 470 168 386 206 292C238 214 262 150 300 96"
            stroke="url(#bloom-stem)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Bipinnate foliage, suggested rather than drawn leaflet by leaflet. */}
          <g fill="var(--sage)">
            <path d="M96 462c44-14 76-44 96-90-46 4-80 26-96 90Z" opacity="0.34" />
            <path d="M150 384c42-13 72-42 91-86-44 4-76 25-91 86Z" opacity="0.28" />
            <path d="M196 300c40-12 68-40 86-82-42 4-72 24-86 82Z" opacity="0.22" />
            <path d="M238 220c38-11 65-38 82-78-40 3-69 23-82 78Z" opacity="0.17" />
          </g>

          {HEADS.map(([cx, cy, r, delay, breathes]) => (
            <circle
              key={`${cx}-${cy}`}
              className={breathes ? "bloom-head" : undefined}
              cx={cx}
              cy={cy}
              r={r}
              fill="url(#bloom-head)"
              style={breathes ? { animationDelay: `${delay}ms` } : undefined}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
