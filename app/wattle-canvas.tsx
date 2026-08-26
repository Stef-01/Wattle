"use client";

import { useEffect, useRef } from "react";
import { WattleFlower, CONFIG } from "@/wattle/tier1";

/**
 * TIER 1'S MOUNT. Canvas2D, no dependencies, no WebGL context.
 *
 * WHEN THIS RUNS. Whenever hero-canvas.tsx declines to load the WebGL tier — a modest device,
 * no WebGL2, Data Saver, a slow connection — which previously meant a still SVG and nothing
 * else. It is not a degraded copy of tier 2: it is a different drawing of the same plant, from
 * the same botany modules, at a density Canvas2D can actually hold.
 *
 * REDUCED MOTION IS NOT THE SAME AS A WEAK DEVICE, and the two used to share one branch. A
 * stated preference gets the FROZEN final frame — the plant fully open, drawn once, no loop
 * running at all — rather than no plant. A weak device gets the animation at a lower count.
 * Serving a blank space to somebody who asked for less motion is answering a different
 * question than the one they asked.
 */
export function WattleCanvas({ racemes = 5 }: { racemes?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* DPR CAPPED AT 2 on this tier too. Canvas2D fills every pixel on the CPU, so a 3x phone
       screen is nine times the fill of a 1x one for a picture nobody can tell apart. */
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const flowers: WattleFlower[] = [];
    let seedN = 11;

    const spawn = (x: number, y: number, scale = 1) => {
      /* RING BUFFER. Every floret is its own arc call, so an uncapped spawn list is a frame
         budget with no ceiling. The oldest raceme is dropped rather than refusing the click —
         a control that stops responding reads as broken, where a plant that fades at the back
         reads as depth. */
      if (flowers.length >= CONFIG.maxRacemes) flowers.shift();
      flowers.push(new WattleFlower(x, y, (seedN = (seedN * 1664525 + 1013904223) >>> 0), scale));
    };

    const layout = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    layout();

    /* The opening arrangement: racemes across the lower frame on a phyllotactic scatter, so no
       two sit on a visible ray. Placed proportionally, so a resize does not strand them. */
    const seedField = () => {
      flowers.length = 0;
      const { clientWidth: w, clientHeight: h } = canvas;
      for (let i = 0; i < racemes; i++) {
        const t = racemes === 1 ? 0.5 : i / (racemes - 1);
        spawn(w * (0.16 + t * 0.68), h * (0.94 - (i % 2) * 0.06), 0.75 + (i % 3) * 0.2);
      }
      if (reduced) flowers.forEach((f) => f.freeze());
    };
    seedField();

    const ro = new ResizeObserver(() => { layout(); seedField(); if (reduced) drawOnce(); });
    ro.observe(canvas);

    const paint = (time: number) => {
      const { clientWidth: w, clientHeight: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      for (const f of flowers) f.draw(ctx, time);
    };

    const drawOnce = () => paint(0);

    if (reduced) {
      /* A STILL FRAME, AND NO LOOP AT ALL. Not a loop that renders the same thing repeatedly —
         the request was for less motion, and a rAF running forever to redraw an identical
         picture is pure cost with nothing to show for it. */
      drawOnce();
      return () => ro.disconnect();
    }

    let onScreen = true;
    const io = new IntersectionObserver(([e]) => { onScreen = e?.isIntersecting ?? true; }, { threshold: 0 });
    io.observe(canvas);

    let raf = 0;
    let last = performance.now();
    let clock = 0;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!onScreen || document.hidden) { last = performance.now(); return; }
      if (document.documentElement.dataset["motion"] === "paused") { last = performance.now(); return; }

      const now = performance.now();
      /* CLAMPED. A backgrounded tab or a dropped frame hands back a huge delta, and an
         unclamped one would jump every bloom to its end state in a single step. */
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      for (const f of flowers) f.advance(dt);
      paint(clock);
    };
    raf = requestAnimationFrame(frame);

    /* CLICK SPAWNS A RACEME where the pointer is. The canvas is otherwise pointer-transparent
       so it never steals a click from the gate's own control; this listener is on the host. */
    const onPointerDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      spawn(e.clientX - r.left, e.clientY - r.top, 0.8 + Math.random() * 0.45);
    };
    canvas.addEventListener("pointerdown", onPointerDown);

    const onDpr = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); layout(); };
    window.addEventListener("resize", onDpr);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onDpr);
    };
  }, [racemes]);

  return <canvas ref={ref} className="wattle-canvas" aria-hidden="true" />;
}

export default WattleCanvas;
