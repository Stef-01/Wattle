"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildField, spinePoints } from "@/wattle/botany";
import { WATTLE_VERT, WATTLE_FRAG, SPINE_VERT, SPINE_FRAG } from "@/wattle/shaders";

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
  /* If the context fails after mount, this component must UNRENDER its host — the SVG spray is
     hidden by `:has(.wattle-field)`, so leaving an empty div behind would hide the fallback and
     show nothing at all. A gate can be told a context is available and still be wrong. */
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    } catch {
      setFailed(true);
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

    const field = buildField({ racemes, headsPerRaceme, seed: 7 });

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

    /* THE STEM, IN THE SAME SCENE.
       Previously the drawn SVG spray sat over the canvas and the two shared no motion — two
       plants in one composition, which is exactly why it did not read as one animation. The stem
       is now geometry in this scene, compiled with the same motion chunk as the florets, so a
       cursor move perturbs the whole plant at once and there is no DOM-to-canvas alignment to
       maintain across breakpoints. */
    const curve = new THREE.CatmullRomCurve3(
      spinePoints(48).map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    );
    const stemGeo = new THREE.TubeGeometry(curve, 96, 0.035, 6, false);
    // TubeGeometry's u runs along the path, which is exactly "how far down the stem am I".
    const uvAttr = stemGeo.getAttribute("uv");
    const along = new Float32Array(uvAttr.count);
    for (let i = 0; i < uvAttr.count; i++) along[i] = uvAttr.getX(i);
    stemGeo.setAttribute("aAlong", new THREE.BufferAttribute(along, 1));

    const stemMat = new THREE.ShaderMaterial({
      vertexShader: SPINE_VERT,
      fragmentShader: SPINE_FRAG,
      // Shares the very same uniform objects as the florets — not copies. One clock, one pointer,
      // one bloom value; they cannot drift out of step because there is nothing to keep in sync.
      uniforms: {
        uTime: uniforms.uTime,
        uBloom: uniforms.uBloom,
        uPointer: uniforms.uPointer,
        uPointerOn: uniforms.uPointerOn,
        uStem: { value: new THREE.Color(token("--sage", "#a8b394")) },
        uOpacity: uniforms.uOpacity,
      },
      transparent: true,
      depthWrite: false,
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);

    /* ONE GROUP. The parallax tilt is applied to the plant as a body, so the stem and its
       florets can never shear apart from one another. */
    const plant = new THREE.Group();
    plant.add(stem);
    plant.add(points);
    /* COMPOSITION LIVES HERE, NOT IN THE BOTANY.
       The spine is authored around the origin because that is where a plant's geometry belongs;
       where it sits in the frame is a layout decision. Pushed right so the mass falls in the half
       of the hero with nothing to read in it — the headline must never have moving gold behind
       it, because text contrast has to be a constant rather than something that varies with a
       drifting particle. */
    plant.position.set(2.5, -0.3, 0);
    scene.add(plant);

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
    const tiltTarget = { x: 0, y: 0 };
    const tiltVel = { x: 0, y: 0 };

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

      // Whole-plant lean. Small on purpose: past a few degrees a parallax tilt stops reading as
      // depth and starts reading as the page being dragged around.
      tiltTarget.y = nx * 0.17;
      tiltTarget.x = -ny * 0.11;
    };
    const onPointerLeave = () => {
      pointerOnTarget = 0;
      // The plant returns to rest rather than holding its last lean.
      tiltTarget.x = 0;
      tiltTarget.y = 0;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("pointerleave", onPointerLeave);

    /* ---- run only when it can be seen ---- */
    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => { onScreen = entry?.isIntersecting ?? true; }, { threshold: 0 });
    io.observe(host);

    /* ---- the loop ---- */
    // performance.now() rather than THREE.Clock, which is deprecated as of r185 — and the clock
    // was only ever wrapping this. Held separately from wall time so the Pause control can stop
    // it without the geometry going stale.
    const started = performance.now();
    let elapsedAtPause = 0;
    let pausedSince: number | null = null;
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

      /* PARALLAX TILT, ON A SPRING RATHER THAN A LERP.
         A lerp toward a target arrives and stops dead. A spring overshoots slightly and settles,
         which is what a mass on a stem actually does — and it is the whole difference between
         the plant TRACKING the cursor and the plant RESPONDING to it. Tuned just under critical
         damping: enough overshoot to read as physical, not enough to wobble. */
      const stiffness = 0.016;
      const damping = 0.85;
      tiltVel.x += (tiltTarget.x - plant.rotation.x) * stiffness;
      tiltVel.y += (tiltTarget.y - plant.rotation.y) * stiffness;
      tiltVel.x *= damping;
      tiltVel.y *= damping;
      plant.rotation.x += tiltVel.x;
      plant.rotation.y += tiltVel.y;

      /* THE CLOCK IS WHAT STOPS, NOT THE RENDER.
         Geometry, colour and scroll response keep updating while paused, so a paused field stays
         CORRECT for the current scroll position instead of frozen mid-drift and wrong. Elapsed
         time is banked on pause and resumed from, so releasing pause continues the drift rather
         than jumping it forward by however long the reader was paused. */
      if (paused) {
        if (pausedSince === null) pausedSince = performance.now();
      } else {
        if (pausedSince !== null) {
          elapsedAtPause += performance.now() - pausedSince;
          pausedSince = null;
        }
        uniforms.uTime.value = (performance.now() - started - elapsedAtPause) / 1000;
      }

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
      stemGeo.dispose();
      stemMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [racemes, headsPerRaceme, maxPixelRatio]);

  if (failed) return null;
  return <div ref={hostRef} className="wattle-field" aria-hidden="true" />;
}

export default WattleField;
