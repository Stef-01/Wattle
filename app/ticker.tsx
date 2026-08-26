import { Floret } from "./icons";

/**
 * TICKER BAND — a full-bleed marquee framed by 2px rules, used as a divider.
 *
 * The track is duplicated ONCE and translated by exactly -50%, which is what makes the wrap
 * seamless: at the halfway point the second copy sits exactly where the first began, so the
 * reset is invisible. Any other offset produces a visible jump.
 *
 * WHY IT READS AS A BRAND DEVICE RATHER THAN A BANNER.
 *
 * Caps take POSITIVE tracking. The band inherited -.04em from the display rules, and negative
 * tracking is correct for large mixed-case type — it closes the gaps between round letterforms —
 * but on capitals it jams the letters together and shuts the counters. Every all-caps wordmark
 * in the world is letterspaced open for this reason; that one value was most of why the band
 * looked amateur.
 *
 * The separator is a DRAWN floret, not a `✳`. A unicode asterisk is whatever glyph the reader's
 * font carries at that codepoint — not ours, different on every platform, and reading as a
 * flourish. It also no longer spins: a rotating glyph between every phrase is a second animation
 * competing with the marquee for the same attention.
 *
 * `aria-hidden` — decorative repetition. A screen reader announcing the same four phrases twice
 * on a loop is noise, not content.
 */
export function Ticker({ items, className = "is-wattle" }: { items: string[]; className?: string }) {
  const track = [...items, ...items];
  return (
    <div className={`section-loop ${className}`} aria-hidden="true">
      <div className="loop-track">
        {track.map((t, i) => (
          <span className="loop-item" key={i}>
            <Floret />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
