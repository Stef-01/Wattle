/**
 * THE BLOOM — the site's one enormous organic subject.
 *
 * The model is a venture firm's hero: one huge living thing on a dark ground, owning the first
 * viewport, animating continuously rather than entering once. Blackbird drives theirs with a
 * Lottie payload; this one is hand-authored SVG driven by CSS keyframes, because the brief also
 * requires the site to stay usable on a regional connection and a JSON animation runtime is a
 * dependency plus a network round trip for something a stylesheet can do.
 *
 * WHAT IS ANIMATED AND WHY. Wattle blossom is a cluster of tiny spheres on a spray, and the
 * thing it does in wind is drift while the heads open. So the spray rocks on a long, slow,
 * offset cycle and the heads scale from a rest state — no head is ever at zero, so the
 * animation degrades to a fully-drawn sprig when motion is off rather than to an empty frame.
 * Every blossom carries its own delay, which is what stops the cluster pulsing as one blob.
 *
 * The SVG is decorative: the heading beside it carries the meaning, so it is aria-hidden and
 * carries no title. Nothing here is a control.
 */

/** Blossom heads: [cx, cy, r, delay-ms]. Hand-placed along the spray rather than generated — a
 *  wattle spray is not evenly spaced, and an even one reads as a diagram of a plant. */
const HEADS: ReadonlyArray<readonly [number, number, number, number]> = [
  [300, 96, 30, 0], [366, 132, 21, 380], [246, 150, 24, 720], [318, 186, 26, 200],
  [402, 200, 16, 940], [214, 218, 17, 540], [282, 246, 22, 1120], [354, 262, 19, 300],
  [178, 286, 14, 860], [246, 312, 18, 640], [318, 330, 15, 1240], [136, 350, 12, 460],
  [202, 372, 15, 1020], [270, 392, 12, 260], [108, 414, 10, 780], [166, 436, 12, 1160],
];

export function WattleBloom({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 460 560"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Depth across the cluster: heads at the top read lit, heads trailing off read cooler.
            A flat fill on sixteen circles looks like a dot pattern, not a flower. */}
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

      {/* The spray rocks as one body. Origin at the base so it pivots where a stem would. */}
      <g className="bloom-spray">
        <path
          className="bloom-stem"
          d="M52 548C118 470 168 386 206 292C238 214 262 150 300 96"
          stroke="url(#bloom-stem)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Bipinnate foliage, suggested rather than drawn leaflet by leaflet. */}
        <g className="bloom-leaves" fill="var(--sage)">
          <path d="M96 462c44-14 76-44 96-90-46 4-80 26-96 90Z" opacity="0.34" />
          <path d="M150 384c42-13 72-42 91-86-44 4-76 25-91 86Z" opacity="0.28" />
          <path d="M196 300c40-12 68-40 86-82-42 4-72 24-86 82Z" opacity="0.22" />
          <path d="M238 220c38-11 65-38 82-78-40 3-69 23-82 78Z" opacity="0.17" />
        </g>

        {HEADS.map(([cx, cy, r, delay]) => (
          <circle
            key={`${cx}-${cy}`}
            className="bloom-head"
            cx={cx}
            cy={cy}
            r={r}
            fill="url(#bloom-head)"
            style={{ animationDelay: `${delay}ms`, transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
      </g>
    </svg>
  );
}
