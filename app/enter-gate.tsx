"use client";

import { useEffect, useState } from "react";

/**
 * THE GATE'S ONE CONTROL.
 *
 * The intro holds the animation and this button. Nothing else: no headline, no nav, no marks.
 * Everything the site has to say is behind the click.
 *
 * NO ANIMATION LIBRARY. The exit needs presence tracking — React unmounts immediately — and the
 * options are AnimatePresence, Radix's built-in handling, or a manual delayed unmount. This is
 * the third: `entering` holds the gate for the length of its own transition, then `entered`
 * removes it. Motion would be ~30 kB and a second animation runtime alongside the Radix already
 * here, for one transition that fires once per visit.
 *
 * The class goes on <body> so the reveal is pure CSS from there — no context, no prop drilling
 * to every section that needs to know.
 */
export function EnterGate() {
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    if (!entering) return;
    document.body.classList.add("entering");

    /* BACK TO THE TOP, AND NOT OPTIONALLY.
       The gate is four viewports of scroll, so by the time this button is reachable the
       visitor is roughly 300vh down the document. Entry deletes that track, the document
       collapses to a fraction of its former height, and the browser clamps the scroll offset
       to whatever still exists — which lands somewhere arbitrary in the middle of the page.
       The site would open on its third section with no explanation.

       `instant`, not `smooth`: this happens under the gate's own fade, so a visible 300vh
       glide would be a second, competing piece of motion during a transition whose whole job
       is to be one. Reduced-motion users get the same jump, which is the outcome that query
       asks for anyway. */
    window.scrollTo({ top: 0, behavior: "instant" });
    // Matches --dur-slow. The gate is still on screen for this whole window; `entered` is what
    // finally releases the page.
    const t = window.setTimeout(() => {
      document.body.classList.add("entered");
      document.body.classList.remove("entering");
    }, 800);
    return () => window.clearTimeout(t);
  }, [entering]);

  return (
    <button type="button" className="gate-enter" onClick={() => setEntering(true)}>
      Enter Wattle
    </button>
  );
}
