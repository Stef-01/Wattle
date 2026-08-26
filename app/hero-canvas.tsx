"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * THE GATE.
 *
 * This is the load-bearing piece of the whole generative layer, and it is deliberately the
 * boring one. Everything WebGL — three.js, the shaders, the field geometry — sits behind a
 * dynamic import that only resolves once this component has decided the device should have it.
 *
 * SO THE BASELINE NEVER PAYS FOR IT. A visitor on a regional connection, an old phone, Data
 * Saver, or with reduced motion configured downloads the same ~102 kB the site shipped before
 * any of this existed, and sees the static SVG bloom that is already on screen. The generative
 * field is enhancement in the strict sense: nothing is missing without it, and nothing waits for
 * it. There is no intro animation gating the navigation and no loading state, because the page
 * is complete before the decision is even made.
 *
 * THE CHECKS, AND WHY EACH ONE IS HERE
 *  - prefers-reduced-motion: a stated preference. It is not overridden by capability.
 *  - Data Saver / 2g / 3g: the reader has told the browser their connection is expensive. A
 *    decorative megabyte is exactly what that setting exists to prevent.
 *  - WebGL2: no context, no field. Checked by actually acquiring one, not by sniffing.
 *  - hardwareConcurrency and deviceMemory: a coarse but honest proxy for whether a device will
 *    hold 60fps. Absent values are treated as low, not high — an unknown device is assumed
 *    modest, because the failure mode of guessing high is a hot phone.
 *  - viewport width: below the tablet breakpoint the hero is a stacked layout where the field
 *    would be a 12rem strip. Not worth a WebGL context.
 *
 * The tiers scale particle count rather than switching the effect off, so a mid device gets the
 * same design language at a lower density.
 */

const WattleField = dynamic(() => import("./wattle-field").then((m) => m.WattleField), {
  ssr: false,
});

/* TIER 1. Also dynamic, because it is still a canvas and still no use to a server, but it is
   two orders of magnitude smaller than the WebGL tier and carries no dependency at all. */
const WattleCanvas = dynamic(() => import("./wattle-canvas").then((m) => m.WattleCanvas), {
  ssr: false,
});

interface Tier {
  heads: number;
  dustCount: number;
  bokehCount: number;
  stamensPerHead: number;
  maxPixelRatio: number;
}

/* Layer counts, not one number. The dust is cheap per point and the bokeh is expensive per
   pixel — a single "particle count" would have scaled the wrong things together. */
/* STAMEN COUNTS ROSE SHARPLY WHEN THE FILAMENTS WERE INSTANCED. They were capped at 26 per
   head because every one of them was baked into a flat vertex buffer, so the count was paid
   for in upload size and memory. One template drawn N times costs eleven floats an instance,
   and the ceiling moved: high tier now carries 34 x 90 = 3,060 filaments where it carried 884.

   The heads read as fuzz rather than as spokes at that density, which is the whole visual
   difference between a wattle and a dandelion clock. */
const TIERS: Record<"high" | "mid" | "low", Tier> = {
  high: { heads: 34, dustCount: 1100, bokehCount: 18, stamensPerHead: 90, maxPixelRatio: 2 },
  // Fewer heads and much less bokeh: overdraw from big soft discs is what actually costs on a
  // mid device, more than the point count does.
  mid: { heads: 18, dustCount: 500, bokehCount: 6, stamensPerHead: 46, maxPixelRatio: 1.5 },
  /* PHONES. Bokeh drops to two and the pixel ratio is capped at 1.25 — a 3x phone screen
     rendering full-resolution soft discs is the single most reliable way to make a handset
     hot. The heads are what the plant IS, so they are cut least. */
  low: { heads: 12, dustCount: 260, bokehCount: 2, stamensPerHead: 26, maxPixelRatio: 1.25 },
};

function chooseTier(): Tier | null {
  if (typeof window === "undefined") return null;

  /* QA OVERRIDE: `?field=force`.
     Skips the HEURISTIC checks only — the connection estimate and the hardware proxy — because
     both are noisy and neither can be reproduced on demand for a design review. It does NOT skip
     reduced motion or the WebGL2 probe: a stated preference and a missing context are facts, not
     estimates, and no query string overrides a fact.

     This exists because the heuristics really do fire in normal use. `effectiveType` is a rolling
     estimate that drifts between 4g and 3g on the same machine minute to minute, which is correct
     behaviour for protecting a regional visitor and impossible to demo around. */
  const forced = new URLSearchParams(window.location.search).get("field") === "force";

  /* REDUCED MOTION DROPS TO TIER 1, IT DOES NOT DROP TO NOTHING. Tier 1 honours the same
     preference by drawing one frozen, fully-open frame with no loop running — which is what
     the preference actually asks for. Returning null here used to mean a stated preference and
     a missing GPU took the same path, and they are not the same request. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  /* THE 768px FLOOR IS GONE, because the layout that justified it is gone. It was there
     because the hero used to stack on small screens and the field would have been a 12rem
     strip — not worth a WebGL context. The gate is now a full-viewport sticky stage at every
     width, so on a phone the plant is the whole screen, which is the one place it is most
     worth having. Phones get the `low` tier instead of nothing.

     320px stays excluded: below that the stage is too small to resolve a raceme at all. */
  if (window.innerWidth < 360) return null;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };

  if (!forced) {
    if (nav.connection?.saveData) return null;
    const effective = nav.connection?.effectiveType;
    if (effective === "slow-2g" || effective === "2g" || effective === "3g") return null;
  }

  // Acquire a real context rather than trusting a feature string.
  const probe = document.createElement("canvas");
  const gl = probe.getContext("webgl2");
  if (!gl) return null;
  gl.getExtension("WEBGL_lose_context")?.loseContext();

  const cores = nav.hardwareConcurrency ?? 2;
  const memory = nav.deviceMemory ?? 2;

  const phone = window.innerWidth < 768;

  if (!phone && cores >= 8 && memory >= 8) return TIERS.high;
  if (!phone && cores >= 4) return TIERS.mid;
  /* A phone never gets more than `low` however many cores it reports — a modern handset can
     claim eight and still throttle inside a minute. Sustained frame rate on a thermally
     limited device is not predicted by core count. */
  if (phone && cores >= 4) return TIERS.low;
  return forced ? TIERS.low : null;
}

export function HeroCanvas() {
  const [tier, setTier] = useState<Tier | null>(null);
  const [decided, setDecided] = useState(false);

  useEffect(() => {
    // Deferred past first paint so the decision itself never competes with rendering the page.
    const id = window.setTimeout(() => { setTier(chooseTier()); setDecided(true); }, 0);
    return () => window.clearTimeout(id);
  }, []);

  /* PROGRESSIVE ENHANCEMENT, IN THAT ORDER.

     Tier 1 mounts first and unconditionally: it is a 2D context and a few hundred arcs, so it
     is on screen while the WebGL bundle is still being fetched, and it is the whole experience
     on any device that never gets tier 2. Tier 2 mounts ON TOP when the gate passes, and tier
     1 steps back to `hidden` rather than unmounting — a remount on every resize or capability
     re-check would restart its blooms, and the two tiers drawing at once is the one thing that
     would make the gate look doubled.

     The order matters for the reason it always does: the thing that works everywhere renders
     first, and the thing that needs a GPU arrives late and improves it. */
  return (
    <>
      <WattleCanvas />
      {decided && tier ? <WattleField {...tier} /> : null}
    </>
  );
}
