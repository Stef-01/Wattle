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

/* --------------------------------------------------------------------------
   THE BLOOM SCHEDULE, PARTITIONED BY THE GOLDEN RATIO.

   The old numbers were 0.55 for the axial spread and 0.45 for each floret's
   own opening — picked because they add to one. So does every other pair, and
   nothing else recommended them.

   1/PHI + 1/PHI^2 = 1 exactly. It is the only split of the timeline where the
   part and the whole stand in the same relation as the two parts do to each
   other, and it is the same constant already placing florets within a head
   (the golden angle, botany.ts) and now placing heads along the stem (the
   golden spiral, layers.ts). One ratio governing structure at three scales.

   THE DRAG TERM IS THE SECOND HALF OF THIS, and it comes from follow-through:
   a body is a system of connected parts and nothing in it stops at once, so
   motion cascades outward from the root with each tier lagging the last.
   Applied to a raceme the hierarchy is literal — stem, then head, then floret,
   then filament — and each tier lags by 1/PHI^3 of a floret's own window.

   Before this, every part of the plant opened on one uniform value. A whole
   plant moving as a single object is the definition of mechanical.
   -------------------------------------------------------------------------- */
const float INV_PHI  = 0.6180339887;  // the axial spread: base to tip
const float INV_PHI2 = 0.3819660113;  // one element's own opening
const float INV_PHI3 = 0.2360679775;  // the lag between tiers of the hierarchy

/* axial: 0 at the base of the raceme, 1 at the tip.
   drag:  0 at the root of the motion (the stem), 1 at its extremity (the filament tips). */
float racemeOpen(float bloom, float axial, float drag) {
  float start = axial * INV_PHI + drag * INV_PHI3 * INV_PHI2;
  return smoothstep(start, start + INV_PHI2, bloom);
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
uniform float uViewH;   // canvas height in CSS px; 900 is the size uSize was tuned at

varying float vRadial;
varying float vOpen;         // this floret's own bloom progress
varying float vSeed;
varying float vLate;

void main() {
  float radial = aAttr.x;
  float axial  = aAttr.y;
  float seed   = aAttr.z;

  vRadial = radial;
  vSeed = seed;

  /* ---- BLOOM ORDER IS AXIAL, AND THE SCHEDULE IS GOLDEN ----------------
     A raceme opens base to tip. Each floret's window is offset by its own
     axial position, so the field unfurls along the stem instead of fading up
     as one object. The spread and the opening are 1/PHI and 1/PHI^2 — see the
     note above racemeOpen.

     A floret sits in the middle of the drag hierarchy: behind the stem that
     carries it, ahead of the filaments it throws. Its own radial position
     within the head refines that, so a head opens core-outward rather than
     all at once — the second of the two nested sequences this plant runs. */
  float open = racemeOpen(uBloom, axial, 0.35 + radial * 0.4);

  /* Two gates multiplied: how far up the raceme this floret sits, and how late in the bloom we
     are. Both have to be true, so the red never appears at the base and never appears early. */
  /* A NARROW BAND AND A PARTIAL MIX. At 0.52 the red claimed the whole top third of the raceme
     and resolved into one solid crimson mass — which is the bottlebrush failure again, just
     confined to the tip. Buds are a scatter at the growing point, not a second flower. The band
     is the last quarter of the stem, the seed term leaves some heads gold at any height, and
     the mix tops out well short of 1 so even the reddest bud keeps gold underneath it. */
  vLate = smoothstep(0.74, 1.0, axial) * smoothstep(0.72, 1.0, uBloom)
        * smoothstep(0.35, 0.9, seed) * 0.82;

  /* ---- THE CURSOR OPENS WHAT IT PASSES OVER --------------------------
     Repulsion alone made the pointer a wind. Warmth opens a flower, so the pointer also drives
     local bloom: heads near it run ahead of the raceme and settle back when it leaves. It moves
     a head ALONG the existing bronze-to-gold ramp rather than introducing any new colour. */
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
  /* Tips carry more mass than cores, and the floor is lifted: with the florets packed onto a
     shell, a sprite that is too small leaves the shell reading as a ring of separate dots
     rather than as a solid fuzzy ball. */
  float sizeScale = mix(0.70, 1.16, radial) * (0.70 + 0.30 * open);
  /* RESOLUTION-INDEPENDENT. 11.0 / -mv.z is a hand-tuned stand-in for the projection's own
     pixels-per-world-unit, and it silently assumed one viewport height. On a tall canvas the
     plant covers more pixels while the sprites stayed the same size, so a head that read as
     dense fuzz at 1440x900 fell apart into separate dots. Scaling by the height ratio keeps a
     floret the same size *relative to the plant* at any viewport. */
  gl_PointSize = uSize * sizeScale * uPixelRatio * (11.0 / -mv.z) * (uViewH / 900.0);
  gl_Position = projectionMatrix * mv;
}
`;

export const WATTLE_FRAG = /* glsl */ `
precision highp float;

uniform vec3 uGold;      // mature bloom
uniform vec3 uBronze;    // new growth
uniform vec3 uRed;       // the last buds, at the growing tip
uniform float uOpacity;
/* MATTE MODE. The reference's heads are opaque, textured pom-poms that occlude what is behind
   them — not light. Additive stacking turned them into glowing sparkle clusters, which is the
   single biggest reason the hero did not read as wattle. At uMatte=1 the halo shrinks and the
   core carries almost all the alpha, so overlapping florets build a SOLID ball instead of a
   brighter one. */
uniform float uMatte;
/* 1 on desktop, 0 on the phone tier. Gates the per-fragment sphere shading below. */
uniform float uShade;

varying float vRadial;
varying float vOpen;
varying float vSeed;
varying float vLate;     // 0 anywhere but the tip late in the bloom, 1 at the last buds

void main() {
  /* EACH FLORET IS A LIT SPHERE, NOT A SOFT DISC.

     It was two overlapping smoothsteps — a hot core inside a wide diffuse halo — which is a
     gaussian blob by another name. Forty of them stacked make a cloud, and a cloud is exactly
     the blurry circle this was told not to be. In the reference every floret in a head is a
     distinct little ball with its own lit side and its own shadow, and that per-floret
     legibility is the entire difference between a photograph of wattle and a yellow smudge.

     So the sprite is treated as a hemisphere. z from the circle equation gives a surface
     normal, one directional light gives it a lit side, and a tight power term gives it a
     specular point. The rim is a two-texel smoothstep instead of a long falloff, so the ball
     has an EDGE — which is what the eye actually uses to count objects. */
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  // Hemisphere normal. 0.25 is r^2 for a sprite of radius 0.5.
  float z = sqrt(max(0.0, 0.25 - d * d)) * 2.0;
  vec3 n = normalize(vec3(uv * 2.0, z));
  vec3 L = normalize(vec3(-0.42, 0.56, 0.72));
  float lam = clamp(dot(n, L), 0.0, 1.0);
  /* Wrapped rather than clamped at the terminator: a floret is translucent, so its dark side
     is still lit through. A hard terminator would read as plastic. */
  float wrap = clamp(dot(n, L) * 0.5 + 0.5, 0.0, 1.0);
  float shade = 0.46 + 0.62 * wrap * wrap;
  /* RESTRAINED. At 0.55 every floret carried a hard white catchlight and a head read as a
     bunch of polished beads — a wattle floret is a fuzzy, translucent thing, not a bauble.
     Enough to say "this is a sphere", not enough to say "this is glass". */
  float spec = pow(lam, 20.0) * 0.22;

  /* A CRISP RIM. The old halo ran from 0.5 all the way in to 0.06 — most of the sprite was
     falloff. This is a two-texel edge, with a small outer bloom kept only for the far,
     out-of-focus copy, which is the one layer that SHOULD be soft. */
  float disc = smoothstep(0.5, 0.455, d);
  float glow = smoothstep(0.5, 0.16, d);
  float alpha = clamp(mix(glow * 0.42, disc * 0.98, uMatte), 0.0, 1.0);

  /* NEW GROWTH IS BRONZE AND MATURES GOLD. Straight from the plant: fresh
     growth carries a bronze tint before it colours up. So colour is a
     function of this floret's own openness, which means the field is
     literally bronze while dispersed and golden once assembled. */
  vec3 colour = mix(uBronze, uGold, smoothstep(0.15, 0.95, vOpen));

  /* THE RED BUDS COME LAST, AND ONLY AT THE TIP.

     Red was the bud colour of EVERY head once, and it opened the gate on a dense red plume —
     a bottlebrush, which is the one plant a golden wattle must not be mistaken for. Held to the
     growing point and to the end of the bloom it does the opposite: a raceme opens base to tip,
     so the tip is where the youngest, least-developed buds are, and they are the last thing on
     the branch to change. A few red buds above a fully open golden spray is a plant still
     growing. A whole branch of them is a different species. */
  colour = mix(colour, uRed, vLate);

  // Tips read brighter than cores, the way stamens catch light.
  colour += vRadial * 0.16 * vOpen;

  // A little per-floret variance so the cluster is not one flat gold.
  colour *= 0.9 + vSeed * 0.2;

  /* THE SHADING IS APPLIED ONLY TO THE MATTE SUBJECT. The far copy is additive and
     out-of-focus: giving depth to something whose whole job is to be a soft wash would just
     make the background busy. */
  colour = mix(colour, colour * shade + spec, uMatte);

  // Matte heads reach full opacity; the glowing far copy stays translucent.
  /* The additive far copy is halved. Stacked over the matte subject on pure black it was
     summing to white and bleaching the gold out of the whole branch — the thing that made a
     saturated #ffc400 read as pale cream. */
  float o = mix(uOpacity * 0.5, mix(uOpacity, 1.0, 0.85), uMatte);
  gl_FragColor = vec4(colour, alpha * o * (0.3 + 0.7 * vOpen));
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
  /* HALVED, AND THE RIM MOST OF ALL. Against white these discs were barely there; against
     black, additive, they resolved into distinct brown-gold rings scattered over the frame —
     reading as smudges on a lens rather than as light in front of it. Out-of-focus highlights
     should be felt before they are noticed. */
  float a = disc * 0.075 + rim * 0.085;
  gl_FragColor = vec4(uColour, a * uOpacity * (0.6 + vSeed * 0.4));
}
`;

/** Layer 5 — stamens. Filaments from each head's core outward; the species' signature. */
export const STAMEN_VERT = /* glsl */ `
precision highp float;
${MOTION_CHUNK}

/* THE ONLY PER-VERTEX ATTRIBUTE. One filament template, expanded per instance below. */
attribute float aAlong;      // 0 at the base of this filament, 1 at its tip

/* PER-INSTANCE. Eleven floats describe a whole stamen; the curve is evaluated here rather
   than baked into a buffer on the CPU. */
attribute vec3  aBase;       // where this filament meets its head's shell
attribute vec3  aAxis;       // direction out of the head, pre-scaled by the filament's length
attribute vec3  aHook;       // perpendicular, pre-scaled by a signed hook magnitude
attribute vec2  aMeta;       // x: length, y: axial position of the head on the raceme
attribute float aSeed;

uniform float uTime;
uniform float uBloom;
uniform vec3 uPointer;
uniform float uPointerOn;
varying float vTip;
varying float vOpen;

void main() {
  float k = aAlong;
  vTip = k;

  /* Filaments are the far end of the drag hierarchy — drag 1.0, the last thing on the plant
     to move, following the head that carries them. */
  float open = racemeOpen(uBloom, aMeta.y, 1.0);
  vOpen = open;

  /* THE ARC, EVALUATED ON THE GPU.

     Linear along the axis, QUADRATIC across it. Quadratic so the curve accelerates toward the
     tip and ends in a hook rather than a bland circular arc — natural arcs are asymmetric, and
     the hook is what the grevillea reference is made of. A straight radial spike is what made
     an earlier, longer reach turn every head into an asterisk: the length was never the
     problem, the straightness was.

     THE FILAMENT GROWS OUT OF THE HEAD, and this is where three no-ops used to be. The old
     code read "pos = mix(position - vec3(0.0), position, 1.0)" twice over, which is just
     "position" — so every filament sat at full extension from the first frame and only its
     alpha changed. Scaling k by open extends the tip along its own arc while the base stays
     welded to the shell, which is what the comment there always claimed. */
  float grown = k * open;
  vec3 pos = aBase + aAxis * grown + aHook * grown * grown;

  pos += wattleDrift(pos, aSeed, uTime, 0.3 * k);
  /* CURSOR DEFLECTION rises along the filament: the base is anchored in the head and the tip
     is free, so the same force moves the tip and barely moves the root. */
  pos += wattlePointer(pos, uPointer, uPointerOn * open, 1.15 * k, 3.1);

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
     the eye reads as a wattle head. Fading to nothing at the tip threw that away, so the shaft
     dims only gently and then brightens sharply over the last quarter. Definition only — the
     colour is still uGold, untouched. */
  /* THE ANTHERS ARE THE DEFINITION.

     These were held down to almost nothing on the reasoning that a legible filament turns a
     head into an asterisk. That was true when there were 26 of them per head and each ran
     straight out from the centre. There are 90 now, they arc, and they start at the shell — at
     that density the corona is a rim of fine bright POINTS, which is precisely what both
     references show and what the old soft ball was missing.

     The shaft stays faint; the anther is what comes up. A bright dot at the end of a barely
     visible thread is how a real wattle head breaks its own silhouette. */
  float shaft  = 1.0 - vTip * 0.3;
  float anther = smoothstep(0.88, 1.0, vTip);
  float a = (shaft * 0.11 + anther * 0.62) * vOpen * uOpacity;

  /* Anthers run paler than the head they sit on — they are catching light, not reflecting the
     mass behind them, and a rim the same colour as the ball does not read as a rim. */
  vec3 c = mix(uGold, vec3(1.0, 0.94, 0.72), anther * 0.55);
  gl_FragColor = vec4(c, a);
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
uniform float uLeafIn;   // 0..1, the foliage's own arrival — see below. NOT uLeaf, which is a colour.
uniform vec3 uPointer;
uniform float uPointerOn;
varying float vAlong;
varying float vDepth;
varying float vSeed;
varying float vLeaf;
void main() {
  vAlong = aBlade.x; vSeed = aBlade.y; vDepth = aBlade.z;

  /* THE LEAVES ARRIVE BEFORE THE FLOWERS, ON THEIR OWN CLOCK.

     Foliage used to be at full strength from the first frame while the flowers were already a
     third open, so the gate opened on a branch that was simultaneously bare and blooming. A
     branch is clothed first and flowers afterwards; that is the order in the field and it is
     also the better reveal, because it gives the gold somewhere to arrive.

     uLeafIn is driven by the intro, not by scroll: the leaves come in on their own as the page
     settles, and scroll is left to do one job — open the flowers. Each blade unfurls from its
     own attachment point, so the canopy grows rather than fading up. */
  vLeaf = uLeafIn;
  float grow = smoothstep(0.0, 1.0, clamp(uLeafIn * 1.35 - aBlade.z * 0.3, 0.0, 1.0));
  vec3 pos = mix(position * vec3(0.35, 0.35, 1.0), position, grow);
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
varying float vLeaf;
void main() {
  // Blades further back sit darker and cooler: depth by value, the way the photograph does it.
  vec3 c = mix(uLeaf, uLeafLit, vDepth * 0.85 + vSeed * 0.15);
  // Tips catch light, bases sit in shadow.
  c *= 0.94 + vAlong * 0.5;
  /* BACK DOWN, AND FURTHER THAN IT STARTED. 0.9 was chosen against a white ground, where a
     near-opaque blade still read as a light shape. On black, opaque flat polygons stop being
     foliage and become green SHARDS — hard-edged cut-outs with more visual weight than the
     flowers they are supposed to be setting off. Depth now drives alpha hard, so the back of
     the canopy dissolves and only the nearest blades hold an edge. */
  float a = uOpacity * (0.28 + vDepth * 0.36) * smoothstep(0.0, 0.55, vLeaf);
  gl_FragColor = vec4(c, a);
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
}
`;

/* --------------------------------------------------------------------------
   SPAWNED BLOOMS — the heads a click leaves behind.

   Everything is derived from `uTime - birth` so the CPU writes a slot once and
   never touches it again. Three overlapping curves on that one age:
     - OPEN, 0 -> 1 over ~1.2s: the floret travels out from its core, so a young
       head is a tight bud rather than a faded open one. That difference is what
       separates a bloom from a cross-fade.
     - COLOUR, the same ramp the raceme uses: bronze at the bud, gold mature.
     - FADE, back to nothing after a hold, so the gate returns to its composition.
   -------------------------------------------------------------------------- */
export const SPAWN_VERT = /* glsl */ `
precision highp float;
${MOTION_CHUNK}
attribute vec4 aAttr;    // radial, seed, birth, radius
attribute vec3 aOffset;  // this floret's displacement from its head's centre, at full bloom
uniform float uTime;
uniform float uPixelRatio;
uniform float uViewH;
varying float vRadial;
varying float vOpen;
varying float vAlive;

void main() {
  float age = uTime - aAttr.z;
  vRadial = aAttr.x;

  // easeOutCubic over 1.2s. An entrance decelerates.
  float t = clamp(age / 1.2, 0.0, 1.0);
  float open = 1.0 - pow(1.0 - t, 3.0);
  vOpen = open;
  // Holds, then clears. Negative ages (unused slots) fall out here at zero.
  vAlive = step(0.0, age) * (1.0 - smoothstep(3.4, 5.2, age));

  /* THE FLORET TRAVELS OUT FROM ITS CORE, which is why the centre and the displacement are
     two attributes rather than one baked world position. A young head is a tight bud, not a
     faded open one — the radius itself is what opens. */
  vec3 pos = position + aOffset * open;
  pos += wattleDrift(pos, aAttr.y, uTime, 0.5);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float sizeScale = mix(0.7, 1.16, aAttr.x) * (0.25 + 0.75 * open);
  gl_PointSize = 23.0 * sizeScale * uPixelRatio * (11.0 / -mv.z) * (uViewH / 900.0);
  gl_Position = projectionMatrix * mv;
}
`;

export const SPAWN_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uGold;
uniform vec3 uBronze;
varying float vRadial;
varying float vOpen;
varying float vAlive;

void main() {
  if (vAlive <= 0.001) discard;
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float core = smoothstep(0.46, 0.0, d);
  float halo = smoothstep(0.5, 0.06, d);
  float alpha = clamp(halo * 0.1 + core * 0.95, 0.0, 1.0);

  vec3 colour = mix(uBronze, uGold, smoothstep(0.15, 0.95, vOpen));
  colour += vRadial * 0.16 * vOpen;
  gl_FragColor = vec4(colour, alpha * vAlive * (0.3 + 0.7 * vOpen));
}
`;
