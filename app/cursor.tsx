"use client";

import { useEffect } from "react";

/**
 * THE CURSOR LAYER — follower, magnetic pull, and card tilt.
 *
 * PATTERNS FROM modern-web-design; IMPLEMENTATION IS OURS. The skill supplies the maths for all
 * three (§5 Cursor UX, §1.3 Magnetic Button, §5.2 Tilt Effect) and writes its examples against
 * GSAP. GSAP is ~25kB for what amounts to two lerps and a matrix, on a site whose entire first
 * load is 102kB and which is explicitly built for regional connections. The formulas below are
 * the skill's, unchanged — magnetic offset is `(pointer − centre) × strength`, tilt is
 * `(offset − centre) / divisor` — driven by one rAF instead of a tween engine.
 *
 * ONE LOOP FOR EVERYTHING. A follower, N magnetic elements and M tilting cards could each own a
 * listener and a rAF; that is N+M+1 loops competing every frame. There is one loop here, it only
 * runs while something is actually moving, and it stops itself when everything has settled.
 *
 * POINTER DEVICES ONLY. `(hover: hover) and (pointer: fine)` — the same gate the smooth scroll
 * uses, and for the same reason: a phantom cursor on a touch screen is the single most common
 * failure of this effect, and width breakpoints get it wrong on an iPad with a keyboard.
 *
 * AND NOT OVER THE GATE. The landing animation is a composed shot with one control on it. A dot
 * chasing the pointer across it is chrome on top of artwork, so the whole layer is suppressed
 * until the site is entered.
 *
 * DECORATIVE THROUGHOUT: aria-hidden, no focus behaviour, nothing here is the only way to
 * perceive any state. Keyboard users get the site's existing 3px focus ring, untouched.
 */
export function Cursor() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches) return;

    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    dot.setAttribute("aria-hidden", "true");
    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    ring.setAttribute("aria-hidden", "true");
    document.body.append(ring, dot);
    document.documentElement.classList.add("has-cursor");

    let mx = -100, my = -100;          // true pointer
    let rx = -100, ry = -100;          // ring, trailing
    let raf = 0;
    let running = false;

    /* The magnetic element currently under the pointer, and the card currently tilting. Only
       ever one of each — the pointer cannot be in two places. */
    let magnet: HTMLElement | null = null;
    let tilt: HTMLElement | null = null;

    const MAGNET_SEL = "[data-magnetic], .button, .nav-cta > .button";
    const TILT_SEL = "[data-tilt]";
    const HOVER_SEL = "a, button, [role='button'], [data-tilt]";

    const tick = () => {
      /* Ring trails the dot. 0.18 per frame is the skill's easing idea (§5 "delayed with
         easing"); the dot itself is pinned to the pointer so precision is never lost. */
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;

      const settled = Math.abs(mx - rx) < 0.15 && Math.abs(my - ry) < 0.15;
      if (settled) { running = false; return; }
      raf = requestAnimationFrame(tick);
    };
    const wake = () => { if (!running) { running = true; raf = requestAnimationFrame(tick); } };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY;
      wake();

      const t = e.target as HTMLElement | null;
      const overInteractive = !!t?.closest(HOVER_SEL);
      document.documentElement.classList.toggle("cursor-over", overInteractive);

      /* ---- MAGNETIC (skill §1.3) — offset = (pointer − centre) × strength ---- */
      const nextMagnet = t?.closest<HTMLElement>(MAGNET_SEL) ?? null;
      if (nextMagnet !== magnet) {
        if (magnet) magnet.style.transform = "";
        magnet = nextMagnet;
      }
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        const strength = Number(magnet.dataset["magnetic"] || 0.28);
        const dx = (e.clientX - (r.left + r.width / 2)) * strength;
        const dy = (e.clientY - (r.top + r.height / 2)) * strength;
        magnet.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
      }

      /* ---- TILT (skill §5.2) — rotate = (offset − centre) / divisor ---- */
      const nextTilt = t?.closest<HTMLElement>(TILT_SEL) ?? null;
      if (nextTilt !== tilt) {
        if (tilt) tilt.style.transform = "";
        tilt = nextTilt;
      }
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        /* Divisor 22, not the skill's 10. At 10 a card swings ~±25deg, which on a page this
           restrained reads as a toy. 22 gives ~±10deg — enough to register as depth, not enough
           to announce itself. */
        const rotX = ((e.clientY - r.top) - r.height / 2) / 22;
        const rotY = (r.width / 2 - (e.clientX - r.left)) / 22;
        tilt.style.transform =
          `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      }
    };

    /* Release. The elastic return is CSS — the element carries a transition that only applies
       while it is NOT being driven, so the follow is instant and the release springs back. */
    const onOut = () => {
      if (magnet) { magnet.style.transform = ""; magnet = null; }
      if (tilt) { tilt.style.transform = ""; tilt = null; }
      document.documentElement.classList.remove("cursor-over");
    };
    const onLeave = () => { mx = -100; my = -100; onOut(); wake(); };
    const onDown = () => document.documentElement.classList.add("cursor-down");
    const onUp = () => document.documentElement.classList.remove("cursor-down");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    /* A click that navigates leaves the old element mid-transform if it is not released. */
    window.addEventListener("blur", onOut);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onOut);
      document.documentElement.classList.remove("has-cursor", "cursor-over", "cursor-down");
      dot.remove(); ring.remove();
    };
  }, []);

  return null;
}

export default Cursor;
