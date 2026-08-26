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
