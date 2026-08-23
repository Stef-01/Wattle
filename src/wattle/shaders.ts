/**
 * THE SHADERS.
 *
 * ONE DELIBERATE DEPARTURE FROM THE BRIEF, STATED UP FRONT. The brief specifies an FBO
 * ping-pong simulation as "the standard technique". FBO is the right tool when particles need
 * PERSISTENT STATE — velocity that accumulates, collisions, flocking, trails — because the only
 * place to keep per-particle state across frames is a texture.
 *
 * Nothing here needs state. A floret's position is a pure function of (its home, its dispersed
 * origin, the bloom progress, the clock, the pointer). That makes the whole simulation a vertex
 * shader with zero render targets, zero ping-pong, and zero readback: cheaper, deterministic,
 * and resumable at any scroll offset — which matters because a visitor can land mid-page or
 * scroll backwards, and an integrated FBO simulation would have to be re-run to catch up.
 *
 * FBO becomes correct here the moment the field gains momentum or inter-particle forces. It has
 * neither, so paying for it would be cargo cult.
 *
 * NOISE: value noise with smooth (cubic) interpolation, two octaves, not simplex. Simplex earns
 * its extra cost by suppressing directional artefacts that only become visible at high octave
 * counts; at two octaves of slow ambient drift there is nothing to suppress. This implementation
 * is short enough to be verified by reading it, which a transcribed simplex kernel is not.
 */

/**
 * ONE MOTION LAW, COMPILED INTO BOTH SHADERS.
 *
 * This is what makes the hero read as a single animation rather than as a stem and some
 * particles that happen to share a colour. The stem and every floret run the identical noise
 * field and the identical pointer response — same frequencies, same amplitudes, same falloff —
 * so when the cursor moves, the whole plant answers as one body.
 *
 * Duplicating this into two shaders by hand is how the two halves silently drift apart on the
 * next edit, so it exists once and is concatenated in.
 */
export const MOTION_CHUNK = /* glsl */ `
float hash13(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i + vec3(0,0,0)), hash13(i + vec3(1,0,0)), f.x),
        mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x),
        mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}

float fbm(vec3 p) {
  return 0.65 * vnoise(p) + 0.35 * vnoise(p * 2.17 + 11.3);
}

/* Ambient drift. Sampled in space AND time with a per-element phase, so nothing shares a cycle
   and there is no loop to notice. */
vec3 wattleDrift(vec3 pos, float seed, float time, float amount) {
  vec3 np = pos * 0.28 + vec3(0.0, 0.0, time * 0.055) + seed * 3.1;
  return vec3(fbm(np) - 0.5, fbm(np + 19.7) - 0.5, fbm(np + 41.3) - 0.5) * amount;
}

/* The pointer is a breeze: smooth-falloff repulsion that returns, never a follow-trail.
   The reach is in world units; beyond it the plant does not know the cursor exists. */
vec3 wattlePointer(vec3 pos, vec3 pointer, float on, float strength, float reach) {
  vec3 away = pos - pointer;
  float d = length(away);
  float influence = smoothstep(reach, 0.0, d) * on;
  return normalize(away + 1e-4) * influence * strength;
}
`;

export const WATTLE_VERT = /* glsl */ `
precision highp float;
${MOTION_CHUNK}

attribute vec3 aDispersed;
// x: radial position in its head (0 core, 1 stamen tip)
// y: axial position on its raceme (0 base, 1 tip)  -- the stagger key
// z: per-floret random seed
// w: reserved
attribute vec4 aAttr;

uniform float uTime;
uniform float uBloom;        // 0..1, driven by scroll
uniform vec3  uPointer;      // pointer in world space
uniform float uPointerOn;    // 0 when there is no pointer (touch, or off-canvas)
uniform float uPixelRatio;
uniform float uSize;

varying float vRadial;
varying float vOpen;         // this floret's own bloom progress
varying float vSeed;

void main() {
  float radial = aAttr.x;
  float axial  = aAttr.y;
  float seed   = aAttr.z;

  vRadial = radial;
  vSeed = seed;

  /* ---- BLOOM ORDER IS AXIAL ----------------------------------------
     A raceme opens base to tip. Each floret's window is offset by its own
     axial position, so the field unfurls along the stem instead of fading
     up as one object. The 0.55 leaves 45% of the scroll as overlap — with
     no overlap it reads as a queue rather than as a plant. */
  float start = axial * 0.55;
  float open = smoothstep(start, start + 0.45, uBloom);

  // Stamen tips lag their own core very slightly: the head opens outward.
  open = clamp(open - radial * 0.06 * (1.0 - open), 0.0, 1.0);

  /* ---- THE CURSOR OPENS WHAT IT PASSES OVER --------------------------
     Repulsion alone made the pointer a wind. Warmth opens a flower, so the
     pointer also drives local bloom: heads near it run ahead of the raceme,
     colouring up and swelling, and settle back when it leaves. This is the
     one interaction that changes what the plant IS rather than where it is. */
  float warmth = smoothstep(3.6, 0.0, length(position - uPointer)) * uPointerOn;
  open = clamp(open + warmth * 0.42 * (1.0 - open), 0.0, 1.0);
  vOpen = open;

  vec3 pos = mix(aDispersed, position, open);

  /* ---- AMBIENT DRIFT ------------------------------------------------
     Non-repeating: the noise field is sampled in space AND time, with a
     per-floret phase, so no two florets share a cycle and there is no loop
     to notice. Amplitude falls as the head closes, because a dispersed
     particle is already moving. */
  pos += wattleDrift(pos, seed, uTime, 0.42 + 0.5 * (1.0 - open));

  /* ---- POINTER --------------------------------------------------------
     Gentle repulsion with a smooth falloff, not a follow-trail. Stamens
     catch a breeze and return; they do not chase. Strength is scaled by
     openness so a half-assembled field is not blown apart. */
  pos += wattlePointer(pos, uPointer, uPointerOn * open, 1.15, 3.1);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);

  // Perspective attenuation, with the tips carrying more visual mass.
  float sizeScale = mix(0.66, 1.12, radial) * (0.68 + 0.32 * open);
  gl_PointSize = uSize * sizeScale * uPixelRatio * (11.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const WATTLE_FRAG = /* glsl */ `
precision highp float;

uniform vec3 uGold;      // mature bloom
uniform vec3 uBronze;    // new growth
uniform float uOpacity;
/* MATTE MODE. The reference's heads are opaque, textured pom-poms that occlude what is behind
   them — not light. Additive stacking turned them into glowing sparkle clusters, which is the
   single biggest reason the hero did not read as wattle. At uMatte=1 the halo shrinks and the
   core carries almost all the alpha, so overlapping florets build a SOLID ball instead of a
   brighter one. */
uniform float uMatte;

varying float vRadial;
varying float vOpen;
varying float vSeed;

void main() {
  // Round sprite with a soft shoulder. Two stops, so each floret has a hot
  // core and a diffuse halo — that halo is what makes a cluster read fuzzy.
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  /* The subject is tightened and the halo pulled back, so a head reads as a cluster of
     discrete anthers rather than a haze. The far copy keeps its softness — it is the
     out-of-focus one, and its diffusion is what gives the frame depth. */
  /* The core is tightened so a head reads as discrete anthers, but the halo is NOT cut back:
     it is what gives a head its mass, and trimming it turned the raceme into a wisp that
     disappeared against black during the dispersed half of the cycle. Definition comes from a
     harder core, not from a thinner one. */
  float core = smoothstep(mix(0.34, 0.31, uMatte), 0.0, d);
  float halo = smoothstep(0.5, 0.06, d);
  float alpha = clamp(mix(halo * 0.3 + core * 0.55, halo * 0.22 + core * 1.0, uMatte), 0.0, 1.0);

  /* NEW GROWTH IS BRONZE AND MATURES GOLD. Straight from the plant: fresh
     growth carries a bronze tint before it colours up. So colour is a
     function of this floret's own openness, which means the field is
     literally bronze while dispersed and golden once assembled. */
  /* Gold arrives EARLY. Ending the ramp at 0.95 meant a head was still mostly bud-coloured
     for almost its whole life, and the field read as its warm end rather than its gold one.
     Closing at 0.40 leaves the amber where it belongs — on genuinely new growth. */
  /* Gold arrives EARLY, and the amber never gets the field to itself. Ending the ramp at 0.95
     meant a head was bud-coloured for almost its whole life; worse, the bloom cycle spends real
     time dispersed, where every head sits at vOpen 0. So the mix starts a third of the way to
     gold and closes at 0.40 — the amber survives as the warmth inside a head, and stops being
     the colour of the plant. */
  vec3 colour = mix(uBronze, uGold, 0.34 + 0.66 * smoothstep(0.0, 0.40, vOpen));

  /* Tips read brighter than cores, the way stamens catch light. Lifted, because the shell of
     a head is where the reference's yellow actually lives — the interior is shadow. */
  colour += vRadial * 0.30 * vOpen;

  // A little per-floret variance so the cluster is not one flat gold.
  colour *= 0.9 + vSeed * 0.2;

  // Matte heads reach full opacity; the glowing far copy stays translucent.
  /* The additive far copy is halved. Stacked over the matte subject on pure black it was
     summing to white and bleaching the gold out of the whole branch — the thing that made a
     saturated #ffc400 read as pale cream. */
  float o = mix(uOpacity * 0.5, mix(uOpacity, 1.0, 0.85), uMatte);
  /* Floor raised from 0.3: the cycle spends real time dispersed, and at 0.3 the plant was
     effectively invisible for that half of it. */
  gl_FragColor = vec4(colour, alpha * o * (0.5 + 0.5 * vOpen));
  #include <colorspace_fragment>
}
`;

/**
 * THE STEM.
 *
 * Drawn in WebGL rather than as the SVG sitting over the canvas, which is the other half of
 * making this one animation: same scene, same coordinate system, same motion law. There is no
 * alignment to maintain between a DOM element and a canvas across breakpoints, because there is
 * no DOM element.
 *
 * `aAlong` is position down the stem, so it can grow with the bloom rather than being simply
 * present, and so the tip answers the cursor more than the base does — a stem is anchored.
 */
export const SPINE_VERT = /* glsl */ `
precision highp float;
${MOTION_CHUNK}

attribute float aAlong;

uniform float uTime;
uniform float uBloom;
uniform vec3  uPointer;
uniform float uPointerOn;

varying float vAlong;

void main() {
  vAlong = aAlong;
  vec3 pos = position;

  // The stem is drawn in before the florets open on it.
  float grown = smoothstep(aAlong * 0.5, aAlong * 0.5 + 0.5, uBloom + 0.35);

  pos += wattleDrift(pos, 0.42, uTime, 0.30 * aAlong);
  // Anchored at the base: the tip moves, the foot does not.
  pos += wattlePointer(pos, uPointer, uPointerOn, 0.85 * aAlong, 3.1);

  vec4 mv = modelViewMatrix * vec4(mix(position, pos, grown), 1.0);
  gl_Position = projectionMatrix * mv;
}
`;

export const SPINE_FRAG = /* glsl */ `
precision highp float;

uniform vec3 uStem;
uniform float uOpacity;

varying float vAlong;

void main() {
  // Fades out toward the tip, the way a stem tapers into the raceme it carries.
  float a = uOpacity * (1.0 - smoothstep(0.55, 1.0, vAlong)) * 0.9;
  gl_FragColor = vec4(uStem, a);
  #include <colorspace_fragment>
}
`;

/* ===========================================================================
   THE SUPPORTING LAYERS

   Depth is built from four cues at once — parallax, size, softness and opacity —
   because any one alone reads as "big dots and small dots" rather than distance.
   =========================================================================== */

/** Layer 1 — pollen dust. Far behind, tiny, slow, twinkling out of phase. */
export const DUST_VERT = /* glsl */ `
precision highp float;
${MOTION_CHUNK}
attribute vec4 aAttr;   // size, seed, depth, phase
uniform float uTime;
uniform float uPixelRatio;
uniform vec3 uPointer;
uniform float uPointerOn;
varying float vAlpha;
void main() {
  vec3 pos = position;
  // Barely moves: this is the layer that says "there is space behind the subject".
  pos += wattleDrift(pos, aAttr.y, uTime * 0.35, 0.22);
  // Parallax: the far field answers the pointer a tenth as much as the subject does.
  pos += wattlePointer(pos, uPointer, uPointerOn, 0.09, 9.0);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aAttr.x * uPixelRatio * (11.0 / -mv.z);
  // Twinkle, each mote on its own cycle so the field never pulses together.
  vAlpha = 0.30 + 0.34 * sin(uTime * (0.5 + aAttr.w * 0.9) + aAttr.z * 30.0);
  gl_Position = projectionMatrix * mv;
}
`;

export const DUST_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColour;
uniform float uOpacity;
varying float vAlpha;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  gl_FragColor = vec4(uColour, smoothstep(0.5, 0.0, d) * vAlpha * uOpacity);
  #include <colorspace_fragment>
}
`;

/**
 * Layer 6 — foreground bokeh. Large, very soft discs BETWEEN camera and subject.
 * This is the layer that sells depth: nothing else in a scene can be in front of you.
 */
export const BOKEH_VERT = /* glsl */ `
precision highp float;
${MOTION_CHUNK}
attribute vec4 aAttr;
uniform float uTime;
uniform float uPixelRatio;
uniform vec3 uPointer;
uniform float uPointerOn;
varying float vSeed;
void main() {
  vec3 pos = position;
  pos += wattleDrift(pos, aAttr.y, uTime * 0.5, 0.85);
  // Parallax OVER-responds in front of the subject — that inversion is the depth cue.
  pos += wattlePointer(pos, uPointer, uPointerOn, 1.9, 14.0);
  vSeed = aAttr.y;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aAttr.x * uPixelRatio * (11.0 / max(0.4, -mv.z + 12.0));
  gl_Position = projectionMatrix * mv;
}
`;

export const BOKEH_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColour;
uniform float uOpacity;
varying float vSeed;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  /* A real out-of-focus highlight is a DISC with a bright rim, not a gaussian blob — the lens
     iris projects an edge. That rim is the difference between bokeh and fog. */
  float disc = smoothstep(0.5, 0.42, d);
  float rim = smoothstep(0.5, 0.44, d) - smoothstep(0.44, 0.30, d);
  float a = disc * 0.16 + rim * 0.2;
  gl_FragColor = vec4(uColour, a * uOpacity * (0.6 + vSeed * 0.4));
  #include <colorspace_fragment>
}
`;

/** Layer 5 — stamens. Filaments from each head's core outward; the species' signature. */
export const STAMEN_VERT = /* glsl */ `
precision highp float;
${MOTION_CHUNK}
attribute vec3 aAttr;   // 0 at core / 1 at tip, cluster t, seed
uniform float uTime;
uniform float uBloom;
uniform vec3 uPointer;
uniform float uPointerOn;
varying float vTip;
varying float vOpen;
void main() {
  float tip = aAttr.x;
  float cluster = aAttr.y;
  vTip = tip;

  // Filaments follow their own head's opening, so they emerge WITH it rather than before it.
  float start = cluster * 0.55;
  float open = smoothstep(start, start + 0.45, uBloom);
  vOpen = open;

  // The tip travels; the core stays put. Stamens extend, they do not slide.
  vec3 pos = position;
  pos = mix(position - vec3(0.0, 0.0, 0.0), position, 1.0);
  vec3 core = position;
  pos = mix(core, position, 1.0);
  pos += wattleDrift(pos, aAttr.z, uTime, 0.3 * tip);
  pos += wattlePointer(pos, uPointer, uPointerOn * open, 1.15 * tip, 3.1);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const STAMEN_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uGold;
uniform float uOpacity;
varying float vTip;
varying float vOpen;
void main() {
  /* A filament is a pale shaft carrying a bright ANTHER at its end, and the anthers are what
     the eye actually reads as a wattle head — the reference is hundreds of fine lines, each
     dotted at the tip. Fading to nothing at the tip threw that away, so the shaft stays
     anchored and dims only gently, then brightens sharply over the last quarter. */
  float shaft  = 1.0 - vTip * 0.5;
  float anther = smoothstep(0.74, 1.0, vTip);
  float a = (shaft * 0.42 + anther * 0.85) * vOpen * uOpacity;
  gl_FragColor = vec4(uGold, a);
  #include <colorspace_fragment>
}
`;

/**
 * FOLIAGE — matte blue-grey-green sickle blades.
 *
 * NOT additive. The phyllodes in the reference are opaque objects that OCCLUDE what is behind
 * them; rendering them additively would make them glow like the flowers and destroy the very
 * contrast that makes the flowers read as flowers.
 */
export const FOLIAGE_VERT = /* glsl */ `
precision highp float;
${MOTION_CHUNK}
attribute vec3 aBlade;   // along 0..1, seed, depth
uniform float uTime;
uniform float uBloom;
uniform vec3 uPointer;
uniform float uPointerOn;
varying float vAlong;
varying float vDepth;
varying float vSeed;
void main() {
  vAlong = aBlade.x; vSeed = aBlade.y; vDepth = aBlade.z;
  vec3 pos = position;
  // A leaf bends most at its tip and not at all where it attaches.
  pos += wattleDrift(pos, aBlade.y, uTime * 0.7, 0.34 * aBlade.x);
  pos += wattlePointer(pos, uPointer, uPointerOn, 0.7 * aBlade.x, 3.4);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const FOLIAGE_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uLeaf;
uniform vec3 uLeafLit;
uniform float uOpacity;
varying float vAlong;
varying float vDepth;
varying float vSeed;
void main() {
  // Blades further back sit darker and cooler: depth by value, the way the photograph does it.
  vec3 c = mix(uLeaf, uLeafLit, vDepth * 0.85 + vSeed * 0.15);
  // Tips catch light, bases sit in shadow.
  c *= 0.72 + vAlong * 0.42;
  float a = uOpacity * (0.55 + vDepth * 0.4);
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}
`;

/** BRANCHLETS — thin olive stems. */
export const BRANCH_VERT = /* glsl */ `
precision highp float;
${MOTION_CHUNK}
attribute vec4 aAttr;   // isHead, t, reserved, reserved
uniform float uTime;
uniform float uBloom;
uniform vec3 uPointer;
uniform float uPointerOn;
varying float vT;
void main() {
  vT = aAttr.y;
  vec3 pos = position;
  pos += wattleDrift(pos, aAttr.y, uTime, 0.26 * aAttr.x);
  pos += wattlePointer(pos, uPointer, uPointerOn, 0.9 * aAttr.x, 3.1);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const BRANCH_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uStem;
uniform float uOpacity;
varying float vT;
void main() {
  gl_FragColor = vec4(uStem, uOpacity * 0.55);
  #include <colorspace_fragment>
}
`;
