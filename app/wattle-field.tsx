"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildField } from "@/wattle/botany";
import { WATTLE_VERT, WATTLE_FRAG } from "@/wattle/shaders";

/**
 * THE GENERATIVE FIELD.
 *
 * Vanilla three.js rather than React Three Fiber: there is exactly one scene with one object in
 * it and no React state driving anything inside the canvas, so a reconciler between React and
 * the scene graph would add a dependency and a render path to manage nothing.
 *
 * NO GSAP / ScrollTrigger EITHER. The brief names it for choreographing the bloom against scroll,
 * and the whole of what this scene needs from scroll is a single 0–1 number read once per frame
 * inside a rAF loop that is already running. The DOM-side reveals are native scroll-driven CSS
 * (`animation-timeline: view()`), which cost nothing at all. Adding a scroll library here would
 * ship ~70 kB to compute a division.
 *
 * WHAT PAUSES IT. Three things, and it obeys all of them:
 *   1. `prefers-reduced-motion` — handled upstream, this component is never loaded.
 *   2. The site's own "Pause motion" control (`data-motion="paused"` on <html>), which must stop
 *      the field too. Two pause buttons for one page would be a bug.
 *   3. Off-screen or backgrounded — the loop stops entirely rather than rendering to nobody.
 */

export interface WattleFieldProps {
  /** Particle budget for this device, decided by the gate upstream. */
  racemes: number;
  headsPerRaceme: number;
  maxPixelRatio: number;
}

export function WattleField({ racemes, headsPerRaceme, maxPixelRatio }: WattleFieldProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    } catch {
      // A gate can be told a context is available and still be wrong. Fail silent: the static
      // SVG bloom underneath is already on screen.
      return;
    }

    const css = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.2, 11);

    const field = buildField({ racemes, headsPerRaceme, spread: 7.4, seed: 7 });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(field.home, 3));
    geometry.setAttribute("aDispersed", new THREE.BufferAttribute(field.dispersed, 3));
    geometry.setAttribute("aAttr", new THREE.BufferAttribute(field.attributes, 4));

    const uniforms = {
      uTime: { value: 0 },
      uBloom: { value: 0 },
      uPointer: { value: new THREE.Vector3(999, 999, 999) },
      uPointerOn: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, maxPixelRatio) },
      uSize: { value: 15 },
      uGold: { value: new THREE.Color(token("--blossom", "#f2c230")) },
      uBronze: { value: new THREE.Color(token("--bronze", "#5a5228")) },
      uOpacity: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: WATTLE_VERT,
      fragmentShader: WATTLE_FRAG,
      uniforms,
      transparent: true,
      depthWrite: false,
      // Additive so overlapping florets build luminance the way a backlit head does.
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    /* ---- sizing ---- */
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* ---- pointer: gentle, and only when there is a real one ---- */
    const pointerTarget = new THREE.Vector3(999, 999, 999);
    let pointerOnTarget = 0;

    const onPointerMove = (e: PointerEvent) => {
      // Coarse pointers (touch) get no perturbation: a finger is not a breeze, and following it
      // turns an ambient field into a toy.
      if (e.pointerType !== "mouse") return;
      const r = host.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
      // Unproject onto the plane the field occupies.
      const v = new THREE.Vector3(nx, ny, 0.5).unproject(camera);
      const dir = v.sub(camera.position).normalize();
      const dist = -camera.position.z / dir.z;
      pointerTarget.copy(camera.position).add(dir.multiplyScalar(dist));
      pointerOnTarget = 1;
    };
    const onPointerLeave = () => { pointerOnTarget = 0; };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("pointerleave", onPointerLeave);

    /* ---- run only when it can be seen ---- */
    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => { onScreen = entry?.isIntersecting ?? true; }, { threshold: 0 });
    io.observe(host);

    /* ---- the loop ---- */
    const clock = new THREE.Clock();
    let raf = 0;
    let bloom = 0.62;

    const frame = () => {
      raf = requestAnimationFrame(frame);

      const paused = document.documentElement.dataset["motion"] === "paused";
      if (!onScreen || document.hidden) return;

      // Bloom is driven by how far the hero has travelled up the viewport. Reading it every
      // frame (rather than integrating) is what makes it correct on a mid-page load and on a
      // backward scroll.
      const r = host.getBoundingClientRect();
      const travelled = 1 - Math.min(1, Math.max(0, (r.bottom - r.height * 0.15) / (r.height * 0.85)));
      /* THE HERO RESTS ASSEMBLED, IT DOES NOT REST EMPTY.
         An earlier version started at 0.18, which is botanically tidy — bud before bloom — and
         a design failure: at rest the hero showed dispersed bronze specks reading as dust on a
         lens rather than as wattle. The plant's bud stage is not the company's front door. So
         the field opens at 0.72, already clustered and gold, and the remaining 0.28 of travel
         is what the scroll spends: heads finishing, tips reaching. The dispersal logic still
         drives everything, it just starts most of the way through. */
      const target = 0.72 + travelled * 0.28;
      bloom += (target - bloom) * 0.05;

      uniforms.uBloom.value = bloom;
            /* CAPPED AT 0.5, NOT 1.
         At full opacity with additive blending the field bloomed across the whole hero and the
         headline had to compete with it — which is precisely the failure the restraint rule
         exists to prevent. The generative layer is atmosphere. If a visitor notices it before
         they read the sentence, it is turned up too far. */
      uniforms.uOpacity.value = Math.min(0.5, uniforms.uOpacity.value + 0.012);
      uniforms.uPointer.value.lerp(pointerTarget, 0.08);
      uniforms.uPointerOn.value += (pointerOnTarget - uniforms.uPointerOn.value) * 0.06;

      // The clock is what stops; geometry and colour keep updating so a paused field is still
      // correct for the current scroll position rather than frozen mid-drift and wrong.
      if (!paused) uniforms.uTime.value = clock.getElapsedTime();

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [racemes, headsPerRaceme, maxPixelRatio]);

  return <div ref={hostRef} className="wattle-field" aria-hidden="true" />;
}

export default WattleField;
