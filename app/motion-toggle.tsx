"use client";

import { useEffect, useState } from "react";

/**
 * PAUSE FOR THE AMBIENT MOTION.
 *
 * WCAG 2.2.2 asks for a mechanism to stop moving content that starts on its own, runs beyond five
 * seconds and sits alongside other content. The bloom does all three. `prefers-reduced-motion`
 * does not discharge that obligation — it serves the reader who configured a preference in
 * advance, and says nothing to the one who did not and is simply finding it hard to read the
 * sentence next to a moving object.
 *
 * NO TOOLTIP HERE, DELIBERATELY. One was built and measured at roughly 12 kB of Radix for a
 * hover-only hint that touch users never see, on a site whose stated priority is regional
 * connections. The work a tooltip would have done is done for free by the two things below: the
 * visible label states the action, and the live region states the resulting state to assistive
 * technology, which cannot see a tooltip anyway.
 */
export function MotionToggle() {
  const [mounted, setMounted] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset["motion"] = paused ? "paused" : "running";
  }, [mounted, paused]);

  // A pause button in static HTML that does nothing until hydration is a control that lies for
  // its first few hundred milliseconds.
  if (!mounted) return null;

  return (
    <>
      <button
        type="button"
        className="motion-toggle"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          {paused ? (
            <path d="M3 1.5 10 6l-7 4.5Z" fill="currentColor" />
          ) : (
            <>
              <rect x="2.5" y="1.5" width="2.5" height="9" fill="currentColor" />
              <rect x="7" y="1.5" width="2.5" height="9" fill="currentColor" />
            </>
          )}
        </svg>
        {paused ? "Play motion" : "Pause motion"}
      </button>

      {/* NIELSEN — VISIBILITY OF SYSTEM STATUS, for readers who cannot see the label change.
          Polite: this is a preference being confirmed, not an alert. */}
      <span aria-live="polite" className="sr-only">
        {paused ? "Motion paused" : "Motion playing"}
      </span>
    </>
  );
}
