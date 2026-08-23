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

interface Tier {
  racemes: number;
  headsPerRaceme: number;
  maxPixelRatio: number;
}

const TIERS: Record<"high" | "mid", Tier> = {
  // ~14 racemes x 5 heads x 40-80 florets ≈ 4,200 points.
  high: { racemes: 14, headsPerRaceme: 5, maxPixelRatio: 2 },
  // ~7 x 4 ≈ 1,700 points, and a capped DPR, which is the bigger saving of the two.
  mid: { racemes: 7, headsPerRaceme: 4, maxPixelRatio: 1.5 },
};

function chooseTier(): Tier | null {
  if (typeof window === "undefined") return null;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  if (window.innerWidth < 768) return null;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };

  if (nav.connection?.saveData) return null;
  const effective = nav.connection?.effectiveType;
  if (effective === "slow-2g" || effective === "2g" || effective === "3g") return null;

  // Acquire a real context rather than trusting a feature string.
  const probe = document.createElement("canvas");
  const gl = probe.getContext("webgl2");
  if (!gl) return null;
  gl.getExtension("WEBGL_lose_context")?.loseContext();

  const cores = nav.hardwareConcurrency ?? 2;
  const memory = nav.deviceMemory ?? 2;

  if (cores >= 8 && memory >= 8) return TIERS.high;
  if (cores >= 4) return TIERS.mid;
  return null;
}

export function HeroCanvas() {
  const [tier, setTier] = useState<Tier | null>(null);

  useEffect(() => {
    // Deferred past first paint so the decision itself never competes with rendering the page.
    const id = window.setTimeout(() => setTier(chooseTier()), 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!tier) return null;
  return <WattleField {...tier} />;
}
