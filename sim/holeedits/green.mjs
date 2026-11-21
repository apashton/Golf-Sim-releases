// Hand edits to a hole (sim/holeedits.mjs): the green - its outline
// handles, reshaping it, the pin kept on it, tilting it.

import { blobRadius, edgeLoop } from "../course.mjs";
import { clamp } from "../mathutil.mjs";
import { GREEN_CLEAR, HANDLES, TILTS, r2 } from "./common.mjs";
import { insideDepth } from "./shapes.mjs";

// ---- The green ---------------------------------------------------------------------

// A smooth loop through the handle sizes (course.mjs edgeLoop, as a pond's
// marks are).
const loopAt = edgeLoop;

export const DEFAULT_GREEN = { h: Array(HANDLES).fill(1), f: 1 };

// Where the handles sit round a green: HANDLES spots in the hole's frame.
export function greenHandles(g0, { h, f } = DEFAULT_GREEN) {
  const out = [];
  for (let k = 0; k < HANDLES; k++) {
    const phi = (k / HANDLES) * Math.PI * 2;
    const r = blobRadius(g0, phi) * h[k] * f;
    const a = phi + (g0.rot ?? 0);
    out.push([g0.x + Math.cos(a) * r, g0.z + Math.sin(a) * r]);
  }
  return out;
}

// The size a handle needs to sit at (x, z): how far out along its own line
// that is, against the green as it was.
export function handleSize(g0, k, f, x, z) {
  const phi = (k / HANDLES) * Math.PI * 2;
  const a = phi + (g0.rot ?? 0);
  const along = (x - g0.x) * Math.cos(a) + (z - g0.z) * Math.sin(a);
  return clamp(along / (blobRadius(g0, phi) * f), 0.5, 1.7);
}

// The green reshaped: its edge pushed in or out smoothly between the
// handles, and grown or shrunk overall. Always an outline, rounded.
export function reshapeGreen(g0, { h, f }) {
  const pts = [];
  const N = 64;
  const rot = g0.rot ?? 0;
  let rx = 0;
  let rz = 0;
  for (let i = 0; i < N; i++) {
    const phi = (i / N) * Math.PI * 2;
    const r = clamp(blobRadius(g0, phi) * clamp(loopAt(h, phi), 0.5, 1.7) * f, 4, 34);
    pts.push([r2(g0.x + Math.cos(phi + rot) * r), r2(g0.z + Math.sin(phi + rot) * r)]);
    rx = Math.max(rx, Math.abs(Math.cos(phi) * r));
    rz = Math.max(rz, Math.abs(Math.sin(phi) * r));
  }
  return { x: g0.x, z: g0.z, rot, rx: r2(rx), rz: r2(rz), poly: pts };
}

// Somewhere on the green for the cup, as near a spot as it can be: at
// least `margin` metres in from the edge.
export function pinOnGreen(green, [x, z], margin = 1.5) {
  if (insideDepth(green, x, z) >= margin) return [r2(x), r2(z)];
  for (let t = 0.05; t <= 1; t += 0.05) {
    const px = x + (green.x - x) * t;
    const pz = z + (green.z - z) * t;
    if (insideDepth(green, px, pz) >= margin) return [r2(px), r2(pz)];
  }
  return [r2(green.x), r2(green.z)];
}

// A tilt as one of the green's contours: a plane falling the chosen way
// over the green and its fringe, easing back to the ground round it over a
// few metres beyond - measured from the green's own edge, so a long, thin
// green doesn't carry the tilt far past its sides, and longer the higher it
// has to come down, so the bank off it stays gentle.
// On a designed hole the plane is lifted so the green's low edge is level
// with the grass (a designed green never drops below the flat ground round
// it); on real ground it pivots about the middle, the low side sinking as
// much as the high side rises.
export function tiltContour(green, a, n, mapped = false) {
  const pct = TILTS[n]?.pct ?? 0;
  if (!pct) return null;
  const gx = (-Math.cos(a) * pct) / 100;
  const gz = (-Math.sin(a) * pct) / 100;
  // The green's edge (and fringe), as a radius every 1/EDGE of a turn.
  const EDGE = 36;
  const edge = [];
  let lo = 0;
  let hi = 0;
  for (let k = 0; k < EDGE; k++) {
    const phi = (k / EDGE) * Math.PI * 2;
    const r = blobRadius(green, phi - (green.rot ?? 0));
    edge.push(r2(r + GREEN_CLEAR));
    const along = gx * Math.cos(phi) * r + gz * Math.sin(phi) * r;
    lo = Math.min(lo, along);
    hi = Math.max(hi, along);
  }
  const lift = mapped ? 0 : -lo;
  const top = mapped ? Math.max(hi, -lo) : hi - lo;
  const fade = r2(clamp((top * 1.5) / 0.045, 6, 24));
  const t = (v) => Math.round(v * 1e5) / 1e5;
  return { x: green.x, z: green.z, tilt: [t(gx), t(gz)], edge, lift: r2(lift), fade, reach: r2(Math.max(...edge) + fade), low: mapped ? 1 : 0 };
}
