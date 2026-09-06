"use client";

import { useEffect } from "react";

/**
 * HIDE THE HEADER GOING DOWN, RETURN IT COMING UP.
 *
 * READS INSIDE A rAF, NOT IN THE LISTENER. `scrollY` is a layout read; doing it in a scroll
 * handler forces the browser to resolve layout at input frequency, which is the textbook cause
 * of scroll jank and precisely what this session has spent its time removing. The listener sets
 * a flag; one animation frame does the reading and the single class write.
 *
 * NOT OVER THE GATE. The landing page hides the nav until entry anyway, and a header sliding
 * around during the opening shot would be chrome moving over artwork.
 *
 * A THRESHOLD, BECAUSE MOMENTUM OVERSHOOTS. iOS rubber-band and a trackpad's tail both produce
 * tiny direction reversals at the end of a gesture; without a floor the header would flicker
 * open and shut as a scroll settles. 6px of travel has to accumulate in one direction before
 * anything changes, and nothing hides within the first 120px so the header is always there at
 * the top of a page.
 */
export function HeaderScroll() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".nav-block");
    if (!header) return;

    let last = window.scrollY;
    let ticking = false;
    let hidden = false;

    const read = () => {
      ticking = false;
      const y = window.scrollY;
      const delta = y - last;

      if (Math.abs(delta) < 6) return;
      /* Never hidden near the top: a header that vanishes on the first flick of a short page
         reads as a bug rather than as a feature. */
      const next = y > 120 && delta > 0;
      last = y;
      if (next === hidden) return;
      hidden = next;
      header.dataset["hidden"] = String(hidden);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(read);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      delete header.dataset["hidden"];
    };
  }, []);

  return null;
}

export default HeaderScroll;
