"use client";

import { useEffect } from "react";

/**
 * SMOOTH SCROLL — ON A POINTER, AND ONLY ON A POINTER.
 *
 * THIS IS THE WHOLE DECISION. A JavaScript scroll library takes the scroller off the browser's
 * compositor and puts it on the main thread. On a desktop that is a straight win: a mouse wheel
 * delivers scroll in coarse discrete steps, so the page jumps in ~100px increments and inertia
 * is the thing that makes it feel like a surface rather than a slideshow.
 *
 * On iOS it is the opposite trade and it is not close. Safari scrolls on a separate thread with
 * momentum and rubber-band already tuned by people with access to the compositor; replacing that
 * with a rAF loop means every frame of every scroll now competes with React, with the WebGL
 * field, and with whatever else wants the main thread. That is the stutter, and adding a scroll
 * library to a page that already stutters would deepen the hole rather than fill it.
 *
 * So: `(hover: hover) and (pointer: fine)` — a real pointing device — gets Lenis. Touch gets the
 * scroller Apple wrote. Both are "smooth"; only one of them is smooth because of us.
 *
 * WHY THE MEDIA QUERY AND NOT A WIDTH. A 13-inch iPad Pro is 1024px wide with no mouse, and a
 * small laptop window is 900px with one. Width answers the wrong question — the question is
 * whether the input device produces discrete wheel steps or a continuous finger drag.
 *
 * REDUCED MOTION TURNS IT OFF ENTIRELY. Smooth scrolling overrides a fundamental OS interaction
 * and is a documented vestibular trigger; a stated preference is not something to smooth over.
 *
 * IT DOES NOT BREAK THE GATE. Lenis drives the real window scroll position rather than
 * transforming a wrapper, so `getBoundingClientRect()` still reports the truth and the gate's
 * scroll-driven bloom keeps working unchanged.
 */
export function SmoothScroll() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches) return;

    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let raf = 0;
    let cancelled = false;

    /* Dynamic import so the ~3kB never reaches a phone, which is the one device that must not
       pay for a feature it is deliberately excluded from. */
    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const instance = new Lenis({
        /* 0.9s to settle. Long enough to read as weight, short enough that a second wheel tick
           still feels connected to the first — past about 1.2s scrolling starts to feel like
           steering something rather than moving it. */
        duration: 0.9,
        /* easeOutExpo. Almost all of the distance is covered immediately and the tail is a long
           settle, which is what "heavy but responsive" actually is: the page answers the wheel
           at once and then comes to rest, rather than easing in from nothing. */
        easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
        /* Touch is left entirely alone even here — a hybrid laptop has both inputs, and the
           finger should still get the native scroller. */
        syncTouch: false,
        touchMultiplier: 1,
      });
      lenis = instance as unknown as typeof lenis;
      const loop = (time: number) => { instance.raf(time); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);

  return null;
}

export default SmoothScroll;
