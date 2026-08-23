"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { spray, dust, bokeh, stamens, foliage, branchlets } from "@/wattle/layers";
import {
  WATTLE_VERT, WATTLE_FRAG,
  DUST_VERT, DUST_FRAG,
  BOKEH_VERT, BOKEH_FRAG,
  STAMEN_VERT, STAMEN_FRAG,
  FOLIAGE_VERT, FOLIAGE_FRAG,
  BRANCH_VERT, BRANCH_FRAG,
} from "@/wattle/shaders";

/**
 * THE HERO SCENE — one subject, six layers, a bud that opens.
 *
 * THE NARRATIVE IS THE POINT. The reference is not a loop, it is a shot: a tight bud on a long
 * stem, the camera pushing in as it opens, then pulling back once it is open, then holding. So
 * this plays ONCE on arrival and then hands over to scroll. A hero that loops its own reveal
 * teaches a visitor to stop watching it.
 *
 * Wattle has no single flower, it has a raceme — so the equivalent of petals unfurling in shells
 * is TWO nested sequences: heads opening base to tip, and each head's florets opening
 * core-outward at the same time. More layered than the reference, not less.
 *
 * THE SIX LAYERS, back to front:
 *   1 dust      — far, tiny, twinkling, parallax 0.09
 *   2 far spray — the same plant at depth, larger and softer: out of focus
 *   3 stamens   — filaments radiating from each head's core
 *   4 near spray— the sharp subject
 *   5 bokeh     — huge soft discs IN FRONT, parallax 1.9 (the inversion is the depth cue)
 *   6 sky       — a CSS gradient behind the canvas, not geometry
 */

export interface WattleFieldProps {
  heads: number;
  dustCount: number;
  bokehCount: number;
  stamensPerHead: number;
  maxPixelRatio: number;
}

export function WattleField({ heads, dustCount, bokehCount, stamensPerHead, maxPixelRatio }: WattleFieldProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
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
    const token = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
    const dpr = Math.min(window.devicePixelRatio, maxPixelRatio);

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(dpr);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);

    /* ---- shared uniforms: one clock, one pointer, one bloom for every layer ---- */
    const uTime = { value: 0 };
    const uBloom = { value: 0 };
    const uPointer = { value: new THREE.Vector3(999, 999, 999) };
    const uPointerOn = { value: 0 };
    const uOpacity = { value: 0 };
    const uPixelRatio = { value: dpr };

    /* REMAPPED ONTO THE TEN-HUE SYSTEM. The old palette's --blossom/--bronze/--sage are gone;
       --blossom now means soft PINK, which would have quietly turned the wattle into a
       cherry blossom. Gold is the signature hue, new growth takes the warm neutral, and the
       foliage takes the green. Nothing outside the ten. */
    const GOLD = new THREE.Color(token("--wattle", "#ffc400"));
    /* --waratah, not --ochre. Ochre is the palette's warm NEUTRAL — a pale grey-beige — and
       using it as the new-growth end of the floret gradient bleached the whole branch to cream.
       Waratah red-orange is both saturated and botanically right for a bud before it colours up. */
    const BRONZE = new THREE.Color(token("--waratah", "#ff2e17"));
    const SAGE = new THREE.Color(token("--eucalypt", "#00a878"));

    const plant = new THREE.Group();
    /* COMPOSITION. The spray is authored around the origin because that is where a plant's
       geometry belongs; where it sits in frame is a layout decision, and it belongs in the half
       of the hero with nothing to read in it. Text contrast has to be a constant, not something
       that varies with a drifting particle behind a sentence. */
    plant.position.set(0, -0.25, 0);
    scene.add(plant);
    const disposables: { dispose(): void }[] = [];

    const pointsLayer = (
      pos: Float32Array, attr: Float32Array, itemSize: number,
      vert: string, frag: string, extra: Record<string, { value: unknown }>,
    ) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aAttr", new THREE.BufferAttribute(attr, itemSize));
      const mat = new THREE.ShaderMaterial({
        vertexShader: vert, fragmentShader: frag,
        uniforms: { uTime, uBloom, uPointer, uPointerOn, uOpacity, uPixelRatio, ...extra },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      disposables.push(geo, mat);
      return { geo, mat };
    };

    /* ---- 1. dust ---- */
    const d = dust(dustCount);
    const dustL = pointsLayer(d.position, d.attr, 4, DUST_VERT, DUST_FRAG, { uColour: { value: SAGE } });
    plant.add(new THREE.Points(dustL.geo, dustL.mat));

    /* ---- 2. far spray: same plant, deeper, bigger, softer ---- */
    const far = spray({ heads: Math.max(3, Math.round(heads * 0.5)), height: 5.6, lean: 0.5, scale: 1.5, seed: 31 });
    const farL = pointsLayer(far.home, far.attr, 4, WATTLE_VERT, WATTLE_FRAG, {
      uGold: { value: GOLD }, uBronze: { value: BRONZE }, uSize: { value: 30 },
      uMatte: { value: 0 },
    });
    farL.geo.setAttribute("aDispersed", new THREE.BufferAttribute(far.dispersed, 3));
    const farPoints = new THREE.Points(farL.geo, farL.mat);
    /* The far copy sits BEHIND and slightly right, not left. At -1.4 it landed at world x 2.7
       and — being deeper, so covering more world width per pixel — spilled across the headline
       while the near spray sat safely clear. The layer that overlapped the text was never the
       one that looked like it was. */
    farPoints.position.set(0.9, 0.4, -7.5);
    plant.add(farPoints);

    /* ---- 3 + 4. the subject, and its filaments ---- */
    const near = spray({ heads, height: 6.4, lean: 0.9, scale: 1, seed: 7 });
    const nearL = pointsLayer(near.home, near.attr, 4, WATTLE_VERT, WATTLE_FRAG, {
      uGold: { value: GOLD }, uBronze: { value: BRONZE }, uSize: { value: 17 },
      // The subject is matte; only the far, out-of-focus copy glows.
      uMatte: { value: 1 },
    });
    nearL.geo.setAttribute("aDispersed", new THREE.BufferAttribute(near.dispersed, 3));

    /* STAMENS ARE SHORT. At 0.62 they rendered as starbursts — fireworks, not wattle. A real head
       is a dense fuzzy BALL whose stamens give it its fuzz; they are barely longer than the head
       itself. 0.26 puts them just past the floret shell, which is where they actually sit. */
    const st = stamens(near.centres, stamensPerHead, 0.13, 303, 0.32);
    const stGeo = new THREE.BufferGeometry();
    stGeo.setAttribute("position", new THREE.BufferAttribute(st.position, 3));
    stGeo.setAttribute("aAttr", new THREE.BufferAttribute(st.attr, 3));
    const stMat = new THREE.ShaderMaterial({
      vertexShader: STAMEN_VERT, fragmentShader: STAMEN_FRAG,
      uniforms: { uTime, uBloom, uPointer, uPointerOn, uOpacity, uGold: { value: GOLD } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    disposables.push(stGeo, stMat);

    nearL.mat.blending = THREE.NormalBlending;

    /* ---- FOLIAGE. Half the picture in the reference, and absent here until now. ---- */
    const fol = foliage({ count: Math.round(heads * 1.6), height: 6.4, lean: 0.9, seed: 61 });
    const folGeo = new THREE.BufferGeometry();
    folGeo.setAttribute("position", new THREE.BufferAttribute(fol.position, 3));
    folGeo.setAttribute("aBlade", new THREE.BufferAttribute(fol.attr, 3));
    const folMat = new THREE.ShaderMaterial({
      vertexShader: FOLIAGE_VERT, fragmentShader: FOLIAGE_FRAG,
      uniforms: {
        uTime, uBloom, uPointer, uPointerOn, uOpacity,
        uLeaf: { value: new THREE.Color("#075f47") },
        uLeafLit: { value: new THREE.Color(token("--eucalypt", "#00a878")) },
      },
      transparent: true, side: THREE.DoubleSide,
      /* NO DEPTH WRITE. Writing depth made the blades punch holes through the flowers in front
         of them — the gold is the subject and the foliage is its setting, so the canopy sits
         behind and the heads stay unbroken. Occlusion was the more literal reading of the
         photograph and the wrong one for a composition whose point is the blossom. */
      depthWrite: false, blending: THREE.NormalBlending,
    });
    disposables.push(folGeo, folMat);

    /* ---- BRANCHLETS. Without them the heads float instead of hanging. ---- */
    const br = branchlets(near.centres, 0.9, 6.4);
    const brGeo = new THREE.BufferGeometry();
    brGeo.setAttribute("position", new THREE.BufferAttribute(br.position, 3));
    brGeo.setAttribute("aAttr", new THREE.BufferAttribute(br.attr, 4));
    const brMat = new THREE.ShaderMaterial({
      vertexShader: BRANCH_VERT, fragmentShader: BRANCH_FRAG,
      uniforms: { uTime, uBloom, uPointer, uPointerOn, uOpacity, uStem: { value: new THREE.Color("#0a7a5c") } },
      transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    });
    disposables.push(brGeo, brMat);

    const subject = new THREE.Group();
    const folMesh = new THREE.Mesh(folGeo, folMat);
    folMesh.renderOrder = -1;
    subject.add(folMesh);
    subject.add(new THREE.LineSegments(brGeo, brMat));
    subject.add(new THREE.LineSegments(stGeo, stMat));
    subject.add(new THREE.Points(nearL.geo, nearL.mat));
    plant.add(subject);

    /* ---- 5. bokeh, in front ---- */
    const b = bokeh(bokehCount);
    const bokehL = pointsLayer(b.position, b.attr, 4, BOKEH_VERT, BOKEH_FRAG, { uColour: { value: GOLD } });
    plant.add(new THREE.Points(bokehL.geo, bokehL.mat));

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

    /* ---- pointer ---- */
    const pointerTarget = new THREE.Vector3(999, 999, 999);
    let pointerOnTarget = 0;
    const tiltTarget = { x: 0, y: 0 };
    const tiltVel = { x: 0, y: 0 };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = host.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
      const v = new THREE.Vector3(nx, ny, 0.5).unproject(camera);
      const dir = v.sub(camera.position).normalize();
      pointerTarget.copy(camera.position).add(dir.multiplyScalar(-camera.position.z / dir.z));
      pointerOnTarget = 1;
      tiltTarget.y = nx * 0.17;
      tiltTarget.x = -ny * 0.11;
    };
    const onPointerLeave = () => { pointerOnTarget = 0; tiltTarget.x = 0; tiltTarget.y = 0; };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("pointerleave", onPointerLeave);

    let onScreen = true;
    const io = new IntersectionObserver(([e]) => { onScreen = e?.isIntersecting ?? true; }, { threshold: 0 });
    io.observe(host);

    /* ---- the shot ---- */
    const REST = 0.86;
    const INTRO_MS = 3200;
    const started = performance.now();
    let elapsedAtPause = 0;
    let pausedSince: number | null = null;
    let raf = 0;
    let bloom = 0;
    let lastFrame = performance.now();

    /* QA OVERRIDE: `?bloom=0..1` pins the shot at one point in its cycle.
       Sibling to `?field=force`, and for the same reason: the bloom is time- and scroll-driven,
       so two screenshots of the same build land at different phases and cannot be compared.
       Pinning it makes a visual diff mean something. Review-only — it changes nothing about
       what a visitor sees, because without the parameter `pinned` is null. */
    const bloomParam = new URLSearchParams(window.location.search).get("bloom");
    const pinned = bloomParam === null ? null : Math.max(0, Math.min(1, Number(bloomParam)));

    // easeOutCubic: fast open, gentle landing. An entrance decelerates.
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const paused = document.documentElement.dataset["motion"] === "paused";
      if (!onScreen || document.hidden) return;

      const now = performance.now();
      if (paused) { if (pausedSince === null) pausedSince = now; }
      else {
        if (pausedSince !== null) { elapsedAtPause += now - pausedSince; pausedSince = null; }
        uTime.value = (now - started - elapsedAtPause) / 1000;
      }

      /* EVERY EASING BELOW IS PER-SECOND, NOT PER-FRAME.
         `x += (target - x) * k` advances by k of the remaining distance each FRAME, so the
         whole shot ran at whatever rate the display and the GPU happened to agree on: twice as
         fast on 120Hz as on 60Hz, and crawling on a software rasteriser. The exponential form
         below covers the same ground in the same wall-clock time on any of them. dt is clamped
         so a dropped frame or a backgrounded tab cannot jump the animation. */
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      const approach = (rate: number) => 1 - Math.exp(-rate * dt);

      const clock = now - started - elapsedAtPause;
      const intro = Math.min(1, clock / INTRO_MS);

      // Scroll takes over once the shot has played.
      const r = host.getBoundingClientRect();
      const travelled = 1 - Math.min(1, Math.max(0, (r.bottom - r.height * 0.15) / (r.height * 0.85)));
      const target = pinned ?? (intro < 1 ? easeOut(intro) * REST : REST + travelled * (1 - REST));
      bloom = pinned ?? bloom + (target - bloom) * approach(intro < 1 ? 12 : 3);
      uBloom.value = bloom;

      /* THE DOLLY. Wide on the bud, push in through the opening, pull back once open — the
         reference's camera move, which is what turns a state change into a shot. */
      const push = Math.sin(Math.min(1, bloom / REST) * Math.PI);
      camera.position.z = 10.2 - push * 3.4;
      camera.position.y = 0.3 + push * 0.35;
      camera.lookAt(0, 0.1, 0);

      /* BREATH. The drift noise moves florets against each other but never moves the plant as a
         whole. A scale pulse well under a percent and a half gives the raceme a body; two
         periods that do not divide, so it never lands on the same pose twice. */
      plant.scale.setScalar(1 + Math.sin(uTime.value * 0.42) * 0.009 + Math.sin(uTime.value * 0.27) * 0.005);

      /* 0.95, not 0.62. The cap was set when the subject sat behind a headline on a dark-green
         ground and had to stay out of the type's way. On a pure-black gate with nothing behind
         it but a pill, holding it at 0.62 just made the poster's subject look underexposed. */
      uOpacity.value = Math.min(0.95, uOpacity.value + 0.6 * dt);
      uPointer.value.lerp(pointerTarget, approach(5));
      uPointerOn.value += (pointerOnTarget - uPointerOn.value) * approach(3.6);

      tiltVel.x += (tiltTarget.x - plant.rotation.x) * approach(1.0);
      tiltVel.y += (tiltTarget.y - plant.rotation.y) * approach(1.0);
      const damp = Math.exp(-9.7 * dt);
      tiltVel.x *= damp; tiltVel.y *= damp;
      plant.rotation.x += tiltVel.x;
      plant.rotation.y += tiltVel.y;

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      disposables.forEach((x) => x.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [heads, dustCount, bokehCount, stamensPerHead, maxPixelRatio]);

  if (failed) return null;
  return <div ref={hostRef} className="wattle-field" aria-hidden="true" />;
}

export default WattleField;
