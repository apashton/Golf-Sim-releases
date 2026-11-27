// The far ground of one hole (docs/COURSE-LOD-PLAN.md, stage 3): a finer
// sheet over the crop, a coarse sheet out to the haze, both on the course
// height field. On the hole being played the far sheet stays what it is
// today (under the hole's own sheets). Past that it eases onto the shared
// field, so the next hole's ground is the same ground seen from here.
// Pure: the meshes are laid by course/holebuild.js and course.js.

import { clamp, smoothstep } from "./mathutil.mjs";
import { TIERS } from "./coursetiers.mjs";

export const GROUND = {
  // The crop's grid, metres, by preset (sim/coursetiers.mjs).
  crop: TIERS.grid,
  // Out past the crop, towards the haze.
  outer: TIERS.outer,
  // By the sea the far ground is already on a fine grid (holebuild.js).
  shoreCrop: 8,
  shoreOuter: 10,
};

// Grid steps for the two far sheets.
export function sheetSteps(preset = "high", shore = false) {
  return {
    crop: shore ? GROUND.shoreCrop : (GROUND.crop[preset] ?? GROUND.crop.high),
    outer: shore ? GROUND.shoreOuter : GROUND.outer,
  };
}

// A hole-frame box as groundRect's arguments. World x is the hole's z,
// world z is minus the hole's x (scenery.js toWorld).
export function worldRect(box, step) {
  return {
    w: box.z1 - box.z0,
    d: box.x1 - box.x0,
    step,
    cx: (box.z0 + box.z1) / 2,
    cz: -(box.x0 + box.x1) / 2,
  };
}

// How close to a line of play the crop's ground stays on the fine grid.
export const FINE_NEAR = 150;

const distToPath = (line, x, z) => {
  if (!line?.length) return Infinity;
  let best2 = Infinity;
  for (let i = 1; i < line.length; i++) {
    const p1 = line[i - 1];
    const p2 = line[i];
    const dx = p2[0] - p1[0];
    const dz = p2[1] - p1[1];
    const l2 = dx * dx + dz * dz || 1;
    let t = ((x - p1[0]) * dx + (z - p1[1]) * dz) / l2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const qx = x - (p1[0] + dx * t);
    const qz = z - (p1[1] + dz * t);
    const d2 = qx * qx + qz * qz;
    if (d2 < best2) best2 = d2;
  }
  if (line.length === 1) {
    const dx = x - line[0][0];
    const dz = z - line[0][1];
    return Math.sqrt(dx * dx + dz * dz);
  }
  return Math.sqrt(best2);
};

export function nearPlay(lines, x, z, near = FINE_NEAR) {
  for (const line of lines ?? []) if (distToPath(line, x, z) <= near) return true;
  return false;
}

// Rectangles covering `box` once. `fine` step where a line is within
// `near`, `coarse` everywhere else, merged so a hole is a few sheets
// rather than a sheet per cell. One rectangle when there is nothing to
// refine, or the box is too big to grid.
export function cropGrid(box, lines, { coarse = 16, fine = 8, near = FINE_NEAR } = {}) {
  if (!box) return [];
  if (!(fine < coarse) || !lines?.length) return [{ ...box, step: coarse }];
  const cols = Math.ceil((box.x1 - box.x0) / coarse);
  const rows = Math.ceil((box.z1 - box.z0) / coarse);
  if (cols < 1 || rows < 1 || cols * rows > 20000) return [{ ...box, step: coarse }];
  const mask = Array.from({ length: rows }, () => Array(cols).fill(false));
  let any = false;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = Math.min(box.x0 + (c + 0.5) * coarse, box.x1);
      const z = Math.min(box.z0 + (r + 0.5) * coarse, box.z1);
      if (nearPlay(lines, x, z, near + coarse * 0.5)) {
        mask[r][c] = true;
        any = true;
      }
    }
  }
  if (!any) return [{ ...box, step: coarse }];
  const take = (want, step) => {
    const used = Array.from({ length: rows }, () => Array(cols).fill(false));
    const out = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (used[r][c] || mask[r][c] !== want) continue;
        let w = 1;
        while (c + w < cols && mask[r][c + w] === want && !used[r][c + w]) w++;
        let h = 1;
        for (;;) {
          if (r + h >= rows) break;
          let row = true;
          for (let k = 0; k < w; k++) if (mask[r + h][c + k] !== want || used[r + h][c + k]) row = false;
          if (!row) break;
          h++;
        }
        for (let rr = 0; rr < h; rr++) for (let cc = 0; cc < w; cc++) used[r + rr][c + cc] = true;
        out.push({
          x0: box.x0 + c * coarse,
          x1: Math.min(box.x0 + (c + w) * coarse, box.x1),
          z0: box.z0 + r * coarse,
          z1: Math.min(box.z0 + (r + h) * coarse, box.z1),
          step,
        });
      }
    }
    return out;
  };
  return [...take(false, coarse), ...take(true, fine)];
}

// Whether world (wx, wz) is inside the hole-frame box, `inset` metres in
// from its edge. The outer sheet is cut away there so the crop sheet shows.
export function insideCrop(wx, wz, box, inset = 0) {
  const x = -wz;
  const z = wx;
  return x > box.x0 + inset && x < box.x1 - inset && z > box.z0 + inset && z < box.z1 - inset;
}

// The far sheet's height in the hole's frame. weight is this hole's own
// ground (1 on it, 0 clear of it, as ownArea). On it, `sunk` is kept - the
// sheet drawn today, under the hole's own ground. Clear of it, the course
// field.
export function blendOutside(weight, sunk, field) {
  if (weight >= 1) return sunk;
  if (weight <= 0) return field;
  return weight * sunk + (1 - weight) * field;
}

// A mapped hole's skirt (country.mjs skirtHeight) easing to the course
// field instead of one flat level. Inside the box, the hole's own height.
// fieldAt(x, z) is the field in the same frame.
export function skirtToward(h, r, fieldAt, x, z, ease = 75) {
  const ex = clamp(x, r.x0, r.x1);
  const ez = clamp(z, r.z0, r.z1);
  const d = Math.hypot(x - ex, z - ez);
  if (d <= 0) return h(x, z);
  const t = smoothstep(0, ease, d);
  return h(ex, ez) * (1 - t) + fieldAt(x, z) * t;
}
