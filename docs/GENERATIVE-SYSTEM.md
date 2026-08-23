# The Wattle generative system

A code-driven visual identity derived from *Acacia pycnantha*. Not an illustration of a flower:
every primitive below is a measured property of the species converted to scene units, and the
visual result is what falls out of that.

---

## 1. Design system

### Palette — wattle-derived only

| Role | Token | Value | Botanical source |
| --- | --- | --- | --- |
| Primary accent | `--blossom` | `#f2c230` | Mature flower head. Warm gold, not lemon or mustard |
| Text-safe gold | `--gold` | `#7c5e0b` | The same hue at AA. **The only gold that carries words** |
| New growth | `--bronze` | `#5a5228` | The bronze flush before phyllodes mature. Particles only |
| Secondary | `--leaf` | `#2e3d24` | Mature phyllode green |
| Grounding neutral | `--leaf-deep` / `--ink` | `#232f1b` / `#1b2416` | Bark, brown-grey-green |
| Canvas | `--paper` | `#fcfaf4` | Warm off-white |

Nothing outside this set exists in the stylesheet. The one gradient in the system —
`#ffe27a → --blossom → --gold-mid` inside a floret sprite — is three stops of the same gold.

### Primitives

**The spine** (`SPINE`, `spinePoints`). A single master axis as a cubic bezier in world space —
a sickle sweep echoing the falcate language of the phyllode. **Everything hangs off it:** lateral
racemes emerge along it as they do in a leaf axil, heads sit along those laterals, and the stem
itself is drawn from the same curve in the same scene.

Until this existed the hero carried **two plants** — a drawn SVG spray with sixteen blossom
circles and a particle field of several thousand florets, overlapping and sharing no motion. Two
flower systems in one composition is precisely why it did not read as one animation.

**The flower head** (`src/wattle/botany.ts` → `flowerHead`). A globular cluster of **40–80
florets**, drawn per head from the real range — one point per floret, not a round number chosen
for the GPU. Distribution is a Fibonacci sphere (the cheap analogue of phyllotaxis) at an
**uneven radius**: even angles with jittered radius is exactly what makes a head read *fuzzy*
rather than like a rendered ball. Jitter is biased outward, because a head's visual mass is its
stamens. Diameter 6–10 mm, carried through at 1 unit = 1 cm.

**The raceme** (`raceme`). Heads borne along a bowed central axis. Each head stores its **axial
position 0→1**, which is the stagger key for everything downstream.

**The phyllode** (`phyllode`, `phyllodePath`). A falcate cubic bezier — elongated, sickle-bent
one way only, 9–15 cm, with an **asymmetric base**. That asymmetry is the diagnostic feature and
is what stops a generated curve reading as a generic arc. Emitted as SVG `d` for divider line art
and lightweight reveals where WebGL would be overkill.

**Determinism.** A seeded PRNG (`mulberry32`), not `Math.random`. A generative system that
reshuffles every load cannot be art-directed, reviewed, or screenshotted for comparison.

### Motion principles

1. **Bloom order is axial, never random and never simultaneous.** A raceme opens base to tip, so
   the field unfurls along the stem. Windows overlap by 45% — with no overlap it reads as a queue
   rather than a plant.
2. **New growth is bronze and matures gold.** Floret colour is a function of its *own* openness,
   so a dispersed field is literally bronze and an assembled one is gold. Straight from the plant.
3. **Dispersal is growth, not confetti.** The dispersed state is each point pushed outward along
   its own radius and sunk — so assembly reads as growth toward light, not as particles homing.
4. **The pointer is a breeze, not a leash.** Gentle repulsion with a smooth falloff. Stamens catch
   air and return; they do not chase. Coarse pointers get nothing — a finger is not a breeze.
5. **Atmosphere, never information.** If a visitor notices the field before they read the
   sentence, it is turned up too far.

---

## 2. Technical architecture

| Concern | Choice | Why |
| --- | --- | --- |
| WebGL | **three.js 0.185**, vanilla | One scene, one object, no React state inside the canvas. R3F's reconciler would manage nothing |
| Simulation | **Vertex shader, stateless** | See below |
| Noise | **Value noise + 2-octave fbm, shader-native** | See below |
| Scroll choreography | **`getBoundingClientRect` in the existing rAF loop** | See below |
| DOM reveals | **Native `animation-timeline: view()`** | Zero JS, zero bundle |
| Divider line art | **Static SVG from `phyllodePath`** | No runtime cost |

### Three deliberate departures from the brief

**No FBO ping-pong.** FBO is correct when particles need *persistent state* — accumulating
velocity, collisions, flocking, trails — because a texture is the only place to keep per-particle
state across frames. Nothing here needs state: a floret's position is a pure function of
`(home, dispersed, bloom, time, pointer)`. That makes the whole simulation a vertex shader with
zero render targets and zero readback — cheaper, deterministic, and **resumable at any scroll
offset**, which matters because a visitor can land mid-page or scroll backwards and an integrated
simulation would have to catch up. FBO becomes correct the moment the field gains momentum or
inter-particle forces. It has neither.

**No GSAP / ScrollTrigger.** The whole of what the scene needs from scroll is one 0–1 number, read
once per frame inside a loop already running. The DOM-side reveals are native scroll-driven CSS.
Adding a scroll library would ship ~70 kB to compute a division.

**Value noise, not simplex.** Simplex earns its cost by suppressing directional artefacts that
appear at high octave counts. At two octaves of slow ambient drift there is nothing to suppress,
and this implementation is short enough to be verified by reading it — which a transcribed simplex
kernel is not.

### One motion law

`MOTION_CHUNK` in `src/wattle/shaders.ts` holds the noise field and the pointer response, and is
concatenated into **both** the floret shader and the stem shader. Same frequencies, same
amplitudes, same falloff — so when the cursor moves, the whole plant answers as one body. The two
materials also share the *same uniform objects*, not copies: one clock, one pointer, one bloom
value, with nothing to keep in sync because there is only one of each.

The stem is WebGL geometry rather than the SVG sitting over the canvas. That removes any
DOM-to-canvas alignment to maintain across breakpoints, and it is the other half of making this
one animation rather than a drawing with particles near it.

**Pointer response, on a spring.** A lerp toward a target arrives and stops dead. The whole-plant
parallax tilt runs a spring (stiffness 0.016, damping 0.85) so it overshoots slightly and settles
— which is what a mass on a stem does, and is the difference between the plant *tracking* the
cursor and *responding* to it. The lean is capped at a few degrees: past that a parallax tilt
stops reading as depth and starts reading as the page being dragged. On pointer-leave the plant
returns to rest rather than holding its last lean.

The stem is anchored at its base — pointer influence scales with distance along it, so the tip
moves and the foot does not.

### Shader approach

*Vertex* (`WATTLE_VERT`): per-floret axial bloom window → `mix(dispersed, home, open)` → fbm drift
sampled in space *and* time with a per-floret phase (no two florets share a cycle, so there is no
loop to notice) → smooth-falloff pointer repulsion scaled by openness → perspective-attenuated
`gl_PointSize` with tips carrying more mass.

*Fragment* (`WATTLE_FRAG`): round sprite, two stops — hot core plus diffuse halo, and that halo is
what makes a cluster read fuzzy. Colour `mix(bronze, gold, open)`. Additive blending, so
overlapping florets build luminance the way a backlit head does.

---

## 3. Accessibility fallback

**The generative layer is never required to understand anything.** The `aria-hidden` canvas carries
no information; every headline, figure and control is DOM text at full contrast, independent of it.

The gate (`app/hero-canvas.tsx`) returns `null` — and the dynamic import **never resolves** — when:

- `prefers-reduced-motion: reduce` (checked first; capability cannot override a stated preference)
- Data Saver is on, or `effectiveType` is `slow-2g` / `2g` / `3g`
- No WebGL2 context (acquired for real, not sniffed)
- `hardwareConcurrency < 4`, or `< 8` with `deviceMemory < 8` (absent values treated as **low** —
  guessing high produces a hot phone)
- Viewport `< 768px`

**The fallback is not a degraded state.** It is the hand-authored SVG wattle spray that is already
on screen before the gate runs, with its own CSS ambient motion, its own reduced-motion stillness,
and the same gold/bronze/green language. When the field *does* load, the SVG steps back to a faint
structural spine rather than vanishing.

There is **no intro animation**, no loading state and nothing gating navigation. The page is
complete before the gate is even consulted.

`prefers-reduced-motion` is not treated as sufficient on its own: the hero also carries a visible
**Pause motion** control (WCAG 2.2.2), and it stops the WebGL clock as well as the CSS animations.
One control, all motion.

---

## 4. Performance test plan

### Budget

| Metric | Target |
| --- | --- |
| First-load JS, all routes | **≤ 110 kB** (currently 108 kB — three.js is *not* in it) |
| WebGL chunk | Lazy, ~340 kB, capable devices only |
| Particle count | High tier ~4,200 · mid tier ~1,700 |
| Frame rate | 60fps desktop; field absent below tablet |
| LCP / INP / CLS | < 2.5s / < 200ms / < 0.1 |

### The gate fires in normal use — a note

`effectiveType` is a **rolling estimate** and drifts between `4g` and `3g` on the same machine
minute to minute. During development the field stopped loading on a fast local connection because
the browser had downgraded its own estimate to `3g`. That is the gate working correctly — it is
protecting exactly the visitor the brief prioritises — but it means the field cannot be reliably
demonstrated on demand.

`?field=force` skips the **heuristic** checks only: the connection estimate and the hardware
proxy. It does **not** skip reduced motion or the WebGL2 probe, because a stated preference and a
missing context are facts rather than estimates, and no query string overrides a fact.

### Verified

- [x] Home first-load JS **108 kB**; three.js resolves to a separate lazy chunk
- [x] Narrow viewport (375px): field not mounted, **zero WebGL chunks fetched**, SVG fallback at
      full opacity
- [x] Reduced motion short-circuits before any capability check *(predicate verified in isolation)*
- [x] Pause control stops the WebGL clock and the CSS animations together
- [x] Canvas is `pointer-events: none` and cannot intercept a control
- [x] Field masked clear of the text column, so text contrast stays a constant
- [x] Loop halts entirely when off-screen or when the tab is hidden
- [x] Pause banks elapsed time and resumes from it, so releasing pause continues the drift rather
      than jumping it forward by the length of the pause
- [x] A failed WebGL context unrenders the field element, which restores the SVG fallback via
      `:has()` rather than leaving an empty hero
- [x] Full teardown on unmount (geometry, material, renderer, observers, listeners)

### Not yet run — needs a deployed URL and real devices

- [ ] Field Core Web Vitals. No deployment exists, so no field data exists
- [ ] Real low-end Android (4-core / 4 GB) — the mid tier is reasoned, not measured
- [ ] Sustained-load thermal behaviour over 5+ minutes
- [ ] Regional connection profile (throttled 3G on real hardware, not devtools)
- [ ] Screen-reader pass confirming the canvas is genuinely inert to AT

The gate's thresholds are **conservative guesses until that testing happens.** They are written to
fail toward the fallback, which is the safe direction, but "conservative" is not "measured" and
this file should not be read as though it were.
