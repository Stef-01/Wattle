"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A HORIZONTAL RAIL YOU CAN DRAG, THROW, OR IGNORE.
 *
 * NATIVE SCROLLER FIRST. The element is a real `overflow-x: auto` container with CSS
 * `scroll-snap-type`, so touch momentum, snapping, keyboard tabbing and screen-reader order all
 * come from the platform and cost nothing. That is the whole reason not to reach for a carousel
 * library: every one of them reimplements those four things, usually worse, and a rail that
 * cannot be tabbed through is a rail some people simply cannot use.
 *
 * WHAT THE JS ADDS is the one gesture a mouse has no native equivalent for — press and drag —
 * and it adds it by writing `scrollLeft`, not by transforming a track. The native scroller stays
 * in charge throughout, so releasing mid-drag hands straight back to it.
 *
 * MOMENTUM IS HANDED BACK, NOT SIMULATED. On release the recent pointer velocity is decayed over
 * a few frames into `scrollLeft`; snapping is switched off during the throw and switched back on
 * when it settles, which is what lets the rail glide and then land on a card instead of fighting
 * the snap the entire way.
 *
 * A DRAG IS NOT A CLICK. Past six pixels of travel the release is suppressed, so throwing the
 * rail never opens whichever card happened to be under the cursor.
 */
export function DragRail({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* Touch already has all of this natively; adding pointer handling on top produces two
       scrollers fighting for the same gesture. */
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let down = false, startX = 0, startLeft = 0, moved = 0;
    let vx = 0, lastX = 0, lastT = 0, raf = 0;

    const glide = () => {
      vx *= 0.94;
      el.scrollLeft -= vx;
      if (Math.abs(vx) > 0.4) { raf = requestAnimationFrame(glide); return; }
      /* Snapping comes back only once the throw has died, so it lands rather than yanks. */
      el.classList.remove("is-dragging");
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      cancelAnimationFrame(raf);
      down = true; moved = 0; vx = 0;
      startX = lastX = e.clientX; startLeft = el.scrollLeft; lastT = e.timeStamp;
      el.classList.add("is-dragging");
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      el.scrollLeft = startLeft - dx;
      const dt = e.timeStamp - lastT;
      if (dt > 0) vx = (e.clientX - lastX) / dt * 16;   // px per ~frame
      lastX = e.clientX; lastT = e.timeStamp;
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      try { el.releasePointerCapture(e.pointerId); } catch { /* already released */ }
      if (Math.abs(vx) > 1) raf = requestAnimationFrame(glide);
      else el.classList.remove("is-dragging");
    };
    /* Suppress the click that ends a drag, in the capture phase so it never reaches the card. */
    const onClick = (e: MouseEvent) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClick, true);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);

  /* tabIndex + a label: a scrollable region has to be reachable and named, or a keyboard user
     meets a box of content they cannot scroll. */
  return (
    <div className="drag-rail" ref={ref} role="group" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}

export default DragRail;
