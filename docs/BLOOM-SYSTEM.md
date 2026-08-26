# The two-tier wattle bloom

Skill attribution, the maths, and what is deliberately not here.

---

## 1. Provenance — what actually produced what

**Read this section before the table.** Two of the sources named in the brief are not on this
machine, and nothing here was ported from them.

### What was available

`~/.claude/plugins/known_marketplaces.json` registers exactly one marketplace,
`anthropics/claude-plugins-official`. None of `korrio/claude-code-101`,
`gmpsankalpa/Flower-animation`, `iart-ai/web-animation-skills` or `iart-ai/webgl-animation-skills`
is installed as a plugin.

The **skills** are all present, as project skills under `.claude/skills/`:
`threejs-animation`, `shader-glsl`, `particle-system`, `gsap-web`, `60fps-animation`,
`micro-interaction`, `svg-animation`, `accessible-animation`, `page-transition-animation`,
plus the animation-principles set (`naturalistic-motion`, `follow-through-overlapping`,
`arc-mastery`, `slow-in-out-mastery`, `staging-mastery`).

### What was not

`korrio/claude-code-101` and `gmpsankalpa/Flower-animation` are **not on this machine** — not as
plugins, not as checkouts, not anywhere under `$HOME`. Their `Flower` class, `CONFIG` object and
CSS easing values were therefore **not ported**, because there was nothing to port from. The
brief describes both structures completely enough to build to, and that is what happened. The
table below says "built to the structure specified in the brief" where that is the truth. It
does not credit a repository that was never read.

### The table

| File | Produced by | What the skill actually contributed |
|---|---|---|
| `app/wattle-field.tsx` | **threejs-animation** | Scene/camera/renderer scaffolding; `setAnimationLoop` over raw rAF (it stops being called on a backgrounded tab); `Math.min(devicePixelRatio, 2)` cap; explicit disposal of every geometry and material on unmount |
| `app/wattle-field.tsx` (stamen layer) | **threejs-animation** | The many-objects pattern — `InstancedBufferGeometry`, one template drawn N times |
| `src/wattle/shaders.ts` | **shader-glsl** | GLSL structure, `smoothstep`/`mix` as the workhorses, hash-based value noise for drift |
| `src/wattle/spawn.ts` | **particle-system** | Pre-allocated ring buffer; per-particle state advanced from one clock; clamped `dt` so a stalled tab cannot jump the simulation |
| `src/wattle/tier1.ts` | brief's structure + **60fps-animation** | `WattleFlower` with `drawStem`/`drawRaceme`/`drawStamenCluster`/`drawPhyllode` and a `CONFIG` object, built to the structure specified in the brief; frame budget audited against the compositor-only rule |
| `app/wattle-canvas.tsx` | **accessible-animation**, **60fps-animation** | Tiered reduced-motion (frozen frame, no loop) rather than an all-or-nothing kill switch; clamped `dt`; DPR cap |
| `app/hero-canvas.tsx` | **accessible-animation** | Tier selection; reduced motion drops to tier 1 rather than to nothing |
| `app/phyllode-divider.tsx` | **svg-animation** | `stroke-dashoffset` draw-on, using the skill's `pathLength="1"` no-measurement trick |
| `src/wattle/phyllotaxis.ts` | — | Plain maths, shared by both tiers. See section 3 |
| `src/wattle/layers.ts` (spiral spine) | **arc-mastery**, **naturalistic-motion** | "Nature abhors straight lines"; the golden spiral replaced a one-bend Bézier |
| `src/wattle/shaders.ts` (`racemeOpen`) | **follow-through-overlapping** | The drag hierarchy: stem → head → floret → filament, each lagging the last |
| Cursor deflection (`wattlePointer`) | **micro-interaction** | Proximity response scaled along the filament — anchored base, free tip |

### Not used, and why

- **`gsap-web`** — not installed as a dependency and not added. The scroll work here is native
  `animation-timeline: view()` (0 JS, off the main thread) and `IntersectionObserver`. GSAP
  ScrollTrigger is ~25kB and earns that on pinned, scrubbed, multi-element choreography; this
  needed a draw-on and a fire-once observer. The `scroll-reveal-libraries` skill's own escalation
  ladder says not to reach for it to fade things in.
- **`page-transition-animation`** — the bloom does not span routes. The gate is on `/` only.
- **p5.js** — ~900kB against a 102kB first load, and tier 1 exists precisely to serve the devices
  and connections least able to pay for it. Same class structure, raw `CanvasRenderingContext2D`.
- **Feedback-buffer ping-pong** — see section 4.

---

## 2. The two tiers

**Tier 1** (`app/wattle-canvas.tsx` → `src/wattle/tier1.ts`) is Canvas2D, no dependencies, no
WebGL. It mounts unconditionally and is the whole experience wherever tier 2 never arrives.

**Tier 2** (`app/hero-canvas.tsx` → `app/wattle-field.tsx`) mounts on top when the gate passes:
WebGL2 context acquired for real (not sniffed), not reduced-motion, not Data Saver or 2g/3g,
`hardwareConcurrency`/`deviceMemory` above a floor, viewport ≥360px.

Tier 1 stays **mounted and `visibility:hidden`** under tier 2 rather than unmounting — a remount
on any capability re-check would restart its blooms, and two tiers drawing at once is the one
failure that would make the gate look doubled.

Reduced motion drops to **tier 1 frozen**, not to nothing: the plant drawn once, fully open, with
no loop running. Verified by hashing the canvas twice 2.2s apart and getting the same value with
a non-blank frame.

| Tier | high | mid | low (phone) |
|---|---|---|---|
| Heads | 34 | 18 | 12 |
| Stamens/head | 90 | 46 | 26 |
| **Filament instances** | **3,060** | 828 | 312 |
| Max DPR | 2 | 1.5 | 1.25 |

---

## 3. The maths, for whoever maintains this

### Golden angle — `src/wattle/phyllotaxis.ts`

```
GOLDEN_ANGLE = 2π / φ²  ≈  137.508°
```

Divide a turn in the golden ratio and the smaller part is 137.508°. It is the *most irrational*
angle available: every rational angle eventually repeats and leaves radial gaps, and the closer a
ratio sits to rational the sooner that happens. Successive elements one golden angle apart never
line up — which is why it packs seed heads, florets and leaves.

**Two arrangements, and they are different problems.**

- **Disc** (`getPhyllotacticPosition`) — Vogel's model, `r = scale·√i`. The `√` is not decoration:
  equal *area* per element means radius grows as the square root of the index. Without it the
  centre is starved and the rim is crowded. Tier 1 got this wrong first — floret radius was
  `cbrt(0.62 + 0.38·rand())`, which lands everything between 0.85 and 1.0, so every head drew as
  a **ring**.
- **Sphere** (`fibonacciSphere`) — same angle, but stepping `y` linearly from 1 to −1 with ring
  radius `√(1−y²)`. That is what keeps spacing even instead of bunching at the poles, which is
  the mistake a naive lat/long loop makes. A globular acacia head is this one.

### Golden spiral — the raceme's spine, `src/wattle/layers.ts`

```
r(θ) = e^(bθ),   b = ln(φ) / (π/2)      ← radius ×φ every quarter turn
```

Sampled across 0.72π, base at the wide end. It replaced a quadratic Bézier, and it fixes four
things at once because they were all the same defect — a curve with one bend has one direction:

1. It is an S-curve, so nothing combs uniformly along it.
2. **The tip curls for free.** The tight end of the spiral *is* the crozier.
3. Spacing tightens toward the tip, because arc length per unit θ shrinks geometrically — heads
   crowd at the growing point exactly as they do on a real raceme.
4. Head size tapers by `φ^(−t)`. Note this is **large at the base**: on a real raceme the basal
   flowers are oldest and largest and the tip carries young buds. The brief said the opposite;
   the plant does not.

### The bloom schedule — `racemeOpen`, `src/wattle/shaders.ts`

```glsl
float racemeOpen(float bloom, float axial, float drag) {
  float start = axial * INV_PHI + drag * INV_PHI3 * INV_PHI2;
  return smoothstep(start, start + INV_PHI2, bloom);
}
```

`1/φ + 1/φ² = 1` **exactly**. It is the only split of the timeline where the part stands to the
whole as the two parts stand to each other. The previous numbers were 0.55 and 0.45 — they add to
one, and so does every other pair.

`drag` is the follow-through hierarchy: **stem 0 → head 0.35 → floret 0.35+radial·0.4 →
filament 1.0**, each tier lagging by `1/φ³`. Before this, every part of the plant opened on one
uniform value, which is the definition of mechanical.

### Instanced filaments

Per-vertex: `aAlong` (0→1). Per-instance: `aBase`, `aAxis`, `aHook`, `aMeta`, `aSeed` — 11 floats.

```glsl
float grown = aAlong * open;
vec3 pos = aBase + aAxis * grown + aHook * grown * grown;
```

Linear along the axis, **quadratic across it**, so the curve accelerates and ends in a hook rather
than a bland circular arc. Scaling by `open` grows the filament out of the head's shell.

> **This is where a real bug lived.** The old shader read
> `pos = mix(position - vec3(0.0), position, 1.0)` twice over. `mix(a, a, 1.0)` is `a`, so all of
> it resolved to `pos = position`: every filament sat at full extension from the first frame and
> only its alpha ever changed. The stamens — the entire visual mass of a wattle head — were
> outside the bloom completely, under a comment claiming they extended.

### Colour

`mix(uBronze, uGold, smoothstep(0.15, 0.95, vOpen))` — the **same** growth term that drives the
geometry, which is what makes it read as one event rather than a tint crossfading over a shape.

`uGold` is `--wattle` `#ffc400`. `uBronze` is **derived**: `eucalypt × 0.62`, lerped 30% to gold.
The brief specified `#6B7048`; the palette is capped at ten hues and `scripts/contrast-gate.mjs`
enforces it. The derived colour is the same intent inside the constraint.

An unopened acacia head is pale olive-gold. It was `--waratah` `#ff2e17` — a red-orange — which
made the gate open on a dense red plume. That is a **bottlebrush**: *Callistemon*, the one plant a
golden wattle must not be mistaken for.

---

## 4. The feedback buffer, and why it is not here

The brief specifies `src/shaders/feedbackBuffer.frag.glsl` with two `WebGLRenderTarget`s,
ping-pong persistence and a decay term. It is not implemented, and this is a recommendation
rather than an omission.

At the high tier's DPR-2 cap on a 1440×900 stage, two float render targets are ~41MB of GPU
memory plus a full-screen pass every frame — on a scene that is *already* additive-blended
emissive gold on black, where trails would smear the composition the gate was explicitly rebuilt
to keep uncluttered.

It is worth building if the design moves toward long light trails on the camera dolly. It should
be gated to `high` only, and it should not ship to the phone tier at all.

---

## 5. Verification

Real Chrome over CDP, not the in-app browser — that one reports `document.hidden: true` and
`innerWidth: 0`, so the render loop never draws a frame and every screenshot is frame zero.

- Tier 1 standalone with `getContext('webgl2')` stubbed to `null`: canvas mounts, WebGL absent,
  pixels painted, click spawns a raceme, no console errors.
- Tier 2: 3,060 instances, no GL errors, click spawns heads at the correct depth.
- Reduced motion: tier 1 only, frame hash identical across 2.2s, non-blank.
- Zero horizontal overflow on every route at 320/375/390/430/768/834/1024/1280/1440/1920.
- Palette 10, contrast 13/13, class and var gates pass, first load 102kB.

**Frame rate is not measured here.** The headless harness runs SwiftShader, a software
rasteriser; it reported ~31fps at 1440×900, which is a floor and says nothing useful about real
hardware. Anyone claiming 60fps should measure it on a real GPU first.
