/**
 * TICKER BAND — a full-bleed marquee framed by 2px rules, used as a divider.
 *
 * The track is duplicated ONCE and translated by exactly -50%, which is what makes the wrap
 * seamless: at the halfway point the second copy sits exactly where the first began, so the
 * reset is invisible. Any other offset produces a visible jump.
 *
 * `aria-hidden` — it is decorative repetition, and a screen reader reading the same phrase twice
 * on a loop is noise, not content.
 */
export function Ticker({ items, className = "is-wattle" }: { items: string[]; className?: string }) {
  const track = [...items, ...items];
  return (
    <div className={`section-loop ${className}`} aria-hidden="true">
      <div className="loop-track">
        {track.map((t, i) => (
          <span key={i}>
            {t}
            <span className="spinner" style={{ padding: "0 1.25vw" }}>✳</span>
          </span>
        ))}
      </div>
    </div>
  );
}
