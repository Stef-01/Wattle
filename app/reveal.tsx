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
 *
 * THE STAGGER COUNTS THE BATCH, NOT THE DOM.
 *
 * Indexing against `parentElement.children` counted every sibling, including the ones that never
 * reveal. A heading above four cards pushed the first card to index 1, so the group opened on an
 * 80ms delay that nothing motivated; interleave anything else and the delays stop describing the
 * order the reader sees at all.
 *
 * Worse at the tail: a static index means an element that scrolls into view ALONE still waits its
 * turn. The sixth card, entering by itself a screen later, sat at 400ms — a stagger with nothing
 * to stagger against, which reads as lag rather than cascade.
 *
 * So the delay is assigned per callback batch, grouped by parent: elements that genuinely cross
 * the threshold together cascade, and an element arriving on its own opens immediately.
 */
export function Reveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        // Group this batch by parent so two separate groups entering at once don't share a ramp.
        const byParent = new Map<Element | null, HTMLElement[]>();
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const group = byParent.get(el.parentElement) ?? [];
          group.push(el);
          byParent.set(el.parentElement, group);
        }

        for (const group of byParent.values()) {
          // Document order, not observer order — the observer does not promise the reading order.
          group.sort((a, b) =>
            a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
          );
          group.forEach((el, i) => {
            el.style.transitionDelay = `${Math.min(i, 6) * 80}ms`;
            el.classList.add("in");
            io.unobserve(el);
          });
        }
      },
      { threshold: 0.15 },
    );

    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
