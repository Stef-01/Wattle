/**
 * THE MARK — a wattle sprig.
 *
 * Acacia pycnantha, the golden wattle: small gold spheres clustered along a stem over
 * grey-green foliage. It is drawn rather than photographed for the reason the ADHD.ME tree
 * gives about portraits — a mark this company will actually use should be a file somebody
 * owns, and until a designer supplies one, a geometric sprig is honest about being a
 * placeholder that still holds the brand's shape.
 *
 * Decorative everywhere it is used: the accessible name comes from the wordmark's text, so
 * every instance is aria-hidden and the SVG carries no <title>.
 */
export function WattleMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* The stem. */}
      <path
        className="mark-stem"
        d="M4.5 20.5C8 17 10.5 13 12.5 8"
        stroke="var(--leaf)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Two leaves. */}
      <path
        className="mark-leaf"
        d="M7.2 16.4c1.9-.5 3.3-1.7 4.1-3.6-2 .1-3.4.9-4.1 3.6ZM10.6 11.2c1.9-.5 3.2-1.8 4-3.7-2 .1-3.3 1-4 3.7Z"
        fill="var(--leaf)"
        opacity="0.42"
      />
      {/* The blossom cluster. */}
      <circle cx="17.4" cy="5.1" r="2.5" fill="var(--gold-mid)" />
      <circle cx="12.9" cy="6.4" r="1.9" fill="var(--gold)" />
      <circle cx="16.6" cy="10.1" r="2.1" fill="var(--gold)" />
      <circle cx="20.6" cy="9.4" r="1.5" fill="var(--gold-mid)" />
      <circle cx="13.4" cy="11.3" r="1.2" fill="var(--gold-mid)" opacity="0.8" />
    </svg>
  );
}

/**
 * The oversized decorative sprig behind the hero type. Same drawing, opened up and thinned
 * out so it reads as texture at 320px rather than as a logo somebody left too large.
 */
export function WattleSprig({ className }: { className?: string }) {
  return (
    <svg width="360" height="360" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" className={className}>
      <path d="M2 22C7 18 11 13 14 5" stroke="var(--leaf)" strokeWidth="0.5" strokeLinecap="round" opacity="0.25" />
      <path
        d="M6.4 16.9c2.2-.6 3.8-2 4.7-4.2-2.3.1-3.9 1.1-4.7 4.2ZM10.2 10.9c2.2-.6 3.7-2.1 4.6-4.3-2.3.1-3.8 1.1-4.6 4.3Z"
        fill="var(--leaf)"
        opacity="0.12"
      />
      <circle cx="17.9" cy="4.4" r="2.9" fill="var(--gold-mid)" opacity="0.22" />
      <circle cx="12.8" cy="6.1" r="2.2" fill="var(--gold-mid)" opacity="0.18" />
      <circle cx="16.8" cy="10.2" r="2.4" fill="var(--gold-mid)" opacity="0.2" />
      <circle cx="21.2" cy="9" r="1.7" fill="var(--gold-mid)" opacity="0.16" />
      <circle cx="13.2" cy="11.6" r="1.4" fill="var(--gold-mid)" opacity="0.14" />
      <circle cx="19.4" cy="14" r="1.1" fill="var(--gold-mid)" opacity="0.12" />
    </svg>
  );
}
