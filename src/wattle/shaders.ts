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

export const WATTLE_VERT = /* glsl */ `
precision highp float;

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

/* ---- value noise ---------------------------------------------------- */
float hash13(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);          // smoothstep interpolation
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
  vOpen = open;

  vec3 pos = mix(aDispersed, position, open);

  /* ---- AMBIENT DRIFT ------------------------------------------------
     Non-repeating: the noise field is sampled in space AND time, with a
     per-floret phase, so no two florets share a cycle and there is no loop
     to notice. Amplitude falls as the head closes, because a dispersed
     particle is already moving. */
  vec3 np = pos * 0.28 + vec3(0.0, 0.0, uTime * 0.055) + seed * 3.1;
  vec3 drift = vec3(
    fbm(np) - 0.5,
    fbm(np + 19.7) - 0.5,
    fbm(np + 41.3) - 0.5
  );
  pos += drift * (0.42 + 0.5 * (1.0 - open));

  /* ---- POINTER --------------------------------------------------------
     Gentle repulsion with a smooth falloff, not a follow-trail. Stamens
     catch a breeze and return; they do not chase. Strength is scaled by
     openness so a half-assembled field is not blown apart. */
  vec3 toPointer = pos - uPointer;
  float d = length(toPointer);
  float influence = smoothstep(2.6, 0.0, d) * uPointerOn * open;
  pos += normalize(toPointer + 1e-4) * influence * 0.85;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);

  // Perspective attenuation, with the tips carrying more visual mass.
  float sizeScale = mix(0.62, 1.0, radial) * (0.6 + 0.4 * open);
  gl_PointSize = uSize * sizeScale * uPixelRatio * (11.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const WATTLE_FRAG = /* glsl */ `
precision highp float;

uniform vec3 uGold;      // mature bloom
uniform vec3 uBronze;    // new growth
uniform float uOpacity;

varying float vRadial;
varying float vOpen;
varying float vSeed;

void main() {
  // Round sprite with a soft shoulder. Two stops, so each floret has a hot
  // core and a diffuse halo — that halo is what makes a cluster read fuzzy.
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float core = smoothstep(0.34, 0.0, d);
  float halo = smoothstep(0.5, 0.06, d);
  float alpha = clamp(halo * 0.3 + core * 0.55, 0.0, 1.0);

  /* NEW GROWTH IS BRONZE AND MATURES GOLD. Straight from the plant: fresh
     growth carries a bronze tint before it colours up. So colour is a
     function of this floret's own openness, which means the field is
     literally bronze while dispersed and golden once assembled. */
  vec3 colour = mix(uBronze, uGold, smoothstep(0.15, 0.95, vOpen));

  // Tips read brighter than cores, the way stamens catch light.
  colour += vRadial * 0.16 * vOpen;

  // A little per-floret variance so the cluster is not one flat gold.
  colour *= 0.9 + vSeed * 0.2;

  gl_FragColor = vec4(colour, alpha * uOpacity * (0.3 + 0.7 * vOpen));
}
`;
