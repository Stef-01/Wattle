"use client";

import { useEffect, useState } from "react";

/**
 * AN ON-DEVICE READOUT, BEHIND `?perf=1`.
 *
 * WHY THIS EXISTS. The gate stutters on an iPhone and every attempt to fix it has been reasoned
 * rather than measured, because the harness available here is headless Chrome on SwiftShader —
 * a software rasteriser with no address bar, no async scroller and no mobile GPU. It reports
 * ~53fps for a page that judders on real hardware, so it has been actively misleading.
 *
 * This is the cheapest way to close that loop: load the gate on the actual phone with `?perf=1`
 * and read the numbers off the screen. It renders nothing unless the parameter is present, so
 * it costs a URLSearchParams lookup on every other visit.
 *
 * WHAT THE NUMBERS MEAN
 *   fps      — frames the main thread actually delivered over the last second.
 *   worst    — longest single frame in that second. A smooth 60 is ~17ms; anything over 33 is a
 *              visibly dropped frame, and this is the number that matters for judder. A good
 *              average with a bad worst is exactly what stutter looks like.
 *   scroll   — whether this device is scroll-driving the bloom. Should read "off" on a phone.
 *   tier/dpr — which capability tier resolved, and the pixel ratio being rendered at.
 *
 * THE BISECT PARAMS, for narrowing it down without a rebuild:
 *   ?field=off  — no WebGL plant. If this is smooth, the plant is the cost.
 *   ?sky=off    — no starfield canvas. If this is smooth, the composited layer is the cost.
 *   both off    — if it STILL stutters, nothing here is the cause and it is the page itself.
 */
export function PerfProbe() {
  const [on, setOn] = useState(false);
  const [line, setLine] = useState("measuring…");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("perf") !== "1") return;
    setOn(true);

    let frames = 0;
    let worst = 0;
    let last = performance.now();
    let windowStart = last;
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = now - last;
      last = now;
      frames++;
      if (dt > worst) worst = dt;

      if (now - windowStart >= 1000) {
        const fps = Math.round((frames * 1000) / (now - windowStart));
        const canvas = document.querySelector<HTMLCanvasElement>(".wattle-field canvas");
        const sky = document.querySelector<HTMLCanvasElement>(".starfield");
        const dpr = canvas ? (canvas.width / canvas.clientWidth).toFixed(2) : "—";
        setLine(
          `${fps} fps · worst ${Math.round(worst)}ms · ` +
            `field ${canvas ? "on" : "off"} · sky ${sky ? "on" : "off"} · ` +
            `dpr ${dpr} · scroll ${window.innerWidth < 768 ? "off" : "on"} · ` +
            `${window.innerWidth}x${window.innerHeight}`,
        );
        frames = 0; worst = 0; windowStart = now;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!on) return null;
  return <output className="perf-probe">{line}</output>;
}
