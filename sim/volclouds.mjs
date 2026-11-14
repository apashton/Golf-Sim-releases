// Ultra's clouds in three dimensions (look/volclouds.js): in place of the
// puffs (look/clouds.js), the sky's cumulus worked out along each pixel's
// line of sight through a layer of cloud - lit through by the sun, bright
// on top and grey underneath, thinning at their edges - and lined up with
// their own shadows on the ground (look/glsl/cloudshade.js): both read the
// same drifting map of where cloud is, so a shadow is where its cloud is.
// Pure: the numbers, the noise they're shaped by, and how much of the sky
// is cloud for the day's.

export const VOL = {
  // The layer of cloud, metres above the course.
  base: 700,
  top: 1350,
  // Steps along each line of sight through it, and towards the sun from
  // each step that's in cloud (how much light reaches it).
  steps: 32,
  light: 3,
  // How far out it's worked out (metres along the line of sight), and
  // faded into the haze over the last part of that.
  reach: 9000,
  fade: 0.45,
  // The 3D noise that billows them: its size (voxels a side) and how many
  // cells across, and the scales it's read at (metres a repeat).
  noise: 32,
  cells: 4,
  big: 700,
  small: 190,
};

// Where cloud starts, on the shared map of where cloud is (0 - 1): the more
// of the sky is cloud (cover, 0 - 1), the lower. The ground's shadows use
// the same, so they go together.
// (A fair day's, 0.35 of cover: about a fifth of the sky, in separate
// clouds; an overcast's nearly all of it; a cloudless day's above all of
// the map - none.)
export function cloudThreshold(cover) {
  const c = Math.min(1, Math.max(0, Number.isFinite(cover) ? cover : 0.35));
  // (Up to a fair day's: from none at all; past it, as it always was.)
  if (c < 0.35) return 0.97 - (0.97 - 0.625) * (c / 0.35);
  return Math.max(0.25, 0.8 - 0.5 * c);
}

// A smooth noise that tiles in all three directions, 0 - 255 a voxel:
// random values on a coarse grid, smoothly blended, two octaves, so the
// clouds billow rather than look like blobs.
export function tilingNoise3D(size = VOL.noise, cells = VOL.cells, seed = 7) {
  let x = seed;
  const rand = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  const octave = (n) => {
    const grid = Float32Array.from({ length: n * n * n }, rand);
    const at = (i, j, k) => grid[(((k % n) + n) % n) * n * n + (((j % n) + n) % n) * n + (((i % n) + n) % n)];
    return at;
  };
  const a = octave(cells);
  const b = octave(cells * 2);
  const s = (t) => t * t * (3 - 2 * t);
  const sample = (at, n, u, v, w) => {
    const fx = (u / size) * n;
    const fy = (v / size) * n;
    const fz = (w / size) * n;
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const k = Math.floor(fz);
    const tx = s(fx - i);
    const ty = s(fy - j);
    const tz = s(fz - k);
    const lerp = (p, q, t) => p + (q - p) * t;
    const plane = (kk) => lerp(lerp(at(i, j, kk), at(i + 1, j, kk), tx), lerp(at(i, j + 1, kk), at(i + 1, j + 1, kk), tx), ty);
    return lerp(plane(k), plane(k + 1), tz);
  };
  const out = new Uint8Array(size * size * size);
  for (let w = 0; w < size; w++) {
    for (let v = 0; v < size; v++) {
      for (let u = 0; u < size; u++) {
        const n = 0.65 * sample(a, cells, u, v, w) + 0.35 * sample(b, cells * 2, u, v, w);
        out[w * size * size + v * size + u] = Math.round(n * 255);
      }
    }
  }
  return out;
}
