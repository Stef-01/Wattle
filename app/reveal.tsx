"use client";

import { useEffect } from "react";

/**
 * SCROLL REVEALS — IntersectionObserver, threshold .15, fire once, 80ms stagger.
 *
 * FIRE ONCE IS THE POINT. An element that re-hides when it leaves the viewport and re-animates
 * on the way back turns a reveal into a flicker for anybody scrolling up. Unobserved on entry.
 *
 * The default state in CSS is hidden, so this must run — which is why the reduced-motion branch
 * in the stylesheet resets `.reveal` to visible rather than relying on this file.
 */
export function Reveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const siblings = Array.from(el.parentElement?.children ?? []);
          el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 6) * 80}ms`;
          el.classList.add("in");
          io.unobserve(el);
        });
      },
      { threshold: 0.15 },
    );

    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
