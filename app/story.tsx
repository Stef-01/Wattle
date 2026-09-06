"use client";

import { useEffect, useRef } from "react";

/**
 * PROGRESSIVE TEXT REVEAL, TIED TO SCROLL POSITION.
 *
 * WORD BY WORD, NOT CHARACTER BY CHARACTER. Per-character reveal on a sentence this length is
 * hundreds of animated spans for an effect nobody can resolve at reading speed, and it wrecks
 * text selection and copy-paste. Words carry the same sense of the line assembling at a fraction
 * of the node count.
 *
 * DRIVEN BY A VIEW TIMELINE, NOT A SCROLL HANDLER. `animation-timeline: view()` runs on the
 * compositor: the words brighten as the block crosses the viewport with nothing on the main
 * thread. A scroll listener measuring each word's position would be dozens of layout reads per
 * frame, which is the jank this whole build has been removing.
 *
 * THE RESTING STATE IS READABLE. Words sit at full opacity and the timeline only takes that away
 * and gives it back, so a browser without scroll-driven animation support (Firefox, early 2026)
 * shows finished text rather than an invisible paragraph. Content never depends on the effect.
 *
 * SPLITTING HAPPENS IN THE DOM, ONCE, AFTER MOUNT — the server sends a plain sentence, so the
 * markup a crawler and a screen reader receive is a sentence, not a pile of spans.
 */
export function RevealWords({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset["split"]) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const words = text.split(" ");
    el.textContent = "";
    words.forEach((w, i) => {
      const span = document.createElement("span");
      span.className = "reveal-word";
      span.textContent = w;
      span.style.setProperty("--i", String(i));
      span.style.setProperty("--n", String(words.length));
      el.append(span, document.createTextNode(" "));
    });
    el.dataset["split"] = "1";
  }, [text]);

  return <p className={`reveal-words ${className}`} ref={ref}>{text}</p>;
}

/**
 * COUNTERS THAT COUNT UP ONCE, WHEN THEY ARRIVE.
 *
 * EVERY NUMBER HERE IS ONE THIS SITE CAN SOURCE, and one of them is deliberately zero. A stats
 * band is where a company reaches for impressions served and lives improved; this one has no
 * outcomes data and says so on another page, so inventing a figure here would contradict the
 * site's own gate. What is left is the register: how many ventures, how many areas, and how many
 * clinicians are listed in the second of those areas. The zero is the most honest thing on the
 * page and it is not hidden in a footnote.
 *
 * Fires once via IntersectionObserver and unobserves — a counter that re-runs every time it
 * scrolls back into view is a fidget, not a reveal. Reduced motion skips straight to the value.
 */
export function CountUp({ to, label, note }: { to: number; label: string; note?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = String(to);
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const dur = 900;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        /* easeOutCubic — arrives fast and settles, so the final value is legible for most of
           the animation rather than blurring past at the end. */
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return (
    <div className="stat">
      {/* The live value is decorative motion over a number the markup already states, so the
          accessible name is the final figure and never the intermediate count. */}
      <span className="stat-num" ref={ref} aria-hidden="true">0</span>
      <span className="sr-only">{to}</span>
      <span className="stat-label">{label}</span>
      {note ? <span className="stat-note">{note}</span> : null}
    </div>
  );
}
