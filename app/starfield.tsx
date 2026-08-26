"use client";

import { useEffect, useRef } from "react";
import { drawSky } from "@/wattle/sky";

/**
 * THE SKY BEHIND THE GATE.
 *
 * Painted once to a canvas on mount, and again after a resize settles. There is no animation
 * loop here at all — this is a still image that happens to be computed rather than downloaded,
 * so once it is on the canvas it costs exactly what any other bitmap costs, which is nothing.
 *
 * DEFERRED PAST FIRST PAINT. Around eighteen thousand fill operations is a few tens of
 * milliseconds; run synchronously on mount that lands squarely in the middle of the browser's
 * first render of the page. A double rAF puts it after the frame the reader actually waits for.
 * The stage carries a plain dark ground underneath, so nothing flashes.
 *
 * RESIZE IS DEBOUNCED, and deliberately hard. A dragged window edge fires continuously, and
 * repainting a sky on every one of those is the kind of thing that makes a laptop fan spin.
 * Nobody is studying the star positions while dragging.
 */
export function Starfield() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // QA: `?sky=off` leaves the canvas unpainted so the gate can be bisected on a real device.
    if (new URLSearchParams(window.location.search).get("sky") === "off") return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf1 = 0, raf2 = 0, timer = 0;
    let lastW = 0, lastH = 0;

    const paint = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      /* CAPPED AT 1.5, NOT 2. This is noise: there is no edge in it whose sharpness a reader
         could miss, and the cost scales with area. Retina buys nothing here and costs 78% more
         pixels than 1.5 does. */
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      lastW = w; lastH = h;
      drawSky(ctx, { width: w, height: h, dpr });
    };

    raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(paint); });

    const ro = new ResizeObserver(() => {
      const { clientWidth: w, clientHeight: h } = canvas;
      /* A PHONE'S ADDRESS BAR COLLAPSING IS NOT A RESIZE. It changes the viewport height by
         ~60px on every scroll direction change, and repainting the sky each time would make
         scrolling stutter on exactly the devices least able to afford it. Height alone has to
         move a long way before it counts; width is honest. */
      if (w === lastW && Math.abs(h - lastH) < 120) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(paint, 220);
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf1); cancelAnimationFrame(raf2);
      window.clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}

export default Starfield;
