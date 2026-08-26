/**
 * BLOOM TRIGGER — the buffers behind click-to-spawn on the WebGL tier.
 *
 * A RING BUFFER, PRE-ALLOCATED, NEVER REALLOCATED. Every spawn writes into a slot that already
 * exists and the geometry is uploaded once. The obvious implementation — push a new head, build
 * a new BufferGeometry, upload it — allocates and uploads on a user gesture, which is the exact
 * moment a frame must not be dropped, and it leaks GPU buffers unless every discarded geometry
 * is disposed by hand. Fixed slots make the cost of the fiftieth click identical to the first.
 *
 * WHAT A SLOT HOLDS. One flower head: FLORETS_PER points arranged on a Fibonacci sphere, with a
 * birth time written into every one of them. The shader derives everything else — how far a
 * floret has travelled from its core, its colour along the bronze-to-gold ramp, and its fade —
 * from `uTime - birth`, so the CPU writes each spawn exactly once and then never touches it.
 *
 * THEY FADE. The gate's composition is one raceme with a great deal of black around it, and
 * that is the whole design. Blooms that accumulate for as long as somebody keeps clicking would
 * dismantle it. Each one opens, holds, and clears, so the gate returns to its composed state on
 * its own.
 */

import { fibonacciSphere } from "./phyllotaxis";
import { mulberry32 } from "./botany";

/** Concurrent spawned heads. The brief's ~50; also the point where the ring starts reusing. */
export const MAX_SPAWNS = 50;
/** Florets in a spawned head. The low end of the real 40-80 range: these are extra, not the subject. */
export const FLORETS_PER = 44;

export interface SpawnBuffers {
  /** The HEAD'S CENTRE, repeated for every floret in it. See writeSpawn. */
  position: Float32Array;
  /** This floret's displacement from that centre, at full bloom. */
  offset: Float32Array;
  /** x: radial 0..1, y: per-floret seed, z: birth time in seconds, w: unused. */
  attr: Float32Array;
  count: number;
}

export function createSpawnBuffers(): SpawnBuffers {
  const count = MAX_SPAWNS * FLORETS_PER;
  return {
    position: new Float32Array(count * 3),
    offset: new Float32Array(count * 3),
    /* BIRTH TIME STARTS FAR IN THE PAST, not at zero. At zero every unused slot would read as
       a head born at the start of the session — fully open, fully faded in, sitting at the
       origin. The whole buffer would draw as one dense blob on the first frame. */
    attr: new Float32Array(count * 4).fill(-1e4),
    count,
  };
}

const rand = mulberry32(4242);

/**
 * Write one head into the ring at `slot`. Returns the vertex range touched so the caller can
 * update only that slice of the attribute rather than re-uploading the whole buffer.
 */
export function writeSpawn(
  buffers: SpawnBuffers,
  slot: number,
  x: number, y: number, z: number,
  birth: number,
  radius: number,
): { offset: number; count: number } {
  /* CENTRE AND OFFSET ARE STORED SEPARATELY, and that is the whole reason a spawned head can
     open at all. With only the final world position, the shader has nowhere to grow FROM — the
     best it could do is fade a fully-formed head in, which is a cross-fade, not a bloom. Given
     both, `centre + offset * open` starts every floret at the core and pushes it out to the
     shell as the head opens. */
  const base = (slot % MAX_SPAWNS) * FLORETS_PER;
  for (let i = 0; i < FLORETS_PER; i++) {
    const v = base + i;
    const [ux, uy, uz] = fibonacciSphere(i, FLORETS_PER);
    /* Outward-biased radius: a head's visual mass is its stamens at the surface, and the cube
       root is what pushes samples toward the shell instead of filling the volume evenly. */
    const t = Math.cbrt(0.62 + 0.38 * rand());
    buffers.position[v * 3] = x;
    buffers.position[v * 3 + 1] = y;
    buffers.position[v * 3 + 2] = z;
    buffers.offset[v * 3] = ux * radius * t;
    buffers.offset[v * 3 + 1] = uy * radius * t;
    buffers.offset[v * 3 + 2] = uz * radius * t;
    buffers.attr[v * 4] = t;
    buffers.attr[v * 4 + 1] = rand();
    buffers.attr[v * 4 + 2] = birth;
    buffers.attr[v * 4 + 3] = radius;
  }
  return { offset: base, count: FLORETS_PER };
}
