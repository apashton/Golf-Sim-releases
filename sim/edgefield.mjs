// How far each spot is from the edge of a shape - a bunker, a pond - worked
// out once on a small grid, so a shader can shade by it: sand darker and
// damper near the lip, water lighter in the shallows and darker out in the
// middle. Any outline works, however bent (a mapped lake, a kidney bunker),
// which a mesh's own vertices can't promise: a flat shape's triangles have
// corners only on its outline, so nothing in between would know how far in
// it is.
//
// No three.js here: plain numbers, so it can be tested.

// A generator run to its end: what it returns.
function drain(steps) {
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}

// Even-odd rule: inside a closed outline or not.
export function insideOutline(poly, x, z) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

// The field over the outline's box, `pad` metres beyond it each way:
//   dist   metres from the outline, positive inside, negative outside
//   depth  (with heightAt) how far below the rim the ground is there - how
//          deep into a dug bunker's bowl - never below 0. The rim's height
//          is a blend of the whole outline's, the nearest parts counting
//          most: measured against the single nearest point instead, it
//          jumps wherever the nearest point jumps (across the middle of the
//          bowl, say, on a slope), and the shading shows a hard step.
// cell is the grid spacing, grown if needed so neither side has more than
// maxCells points (a big lake doesn't need 10 cm detail).
export function edgeField(poly, opts = {}) {
  return drain(edgeFieldSteps(poly, opts, Infinity));
}

// A part a step (yield after every `every` of its points, whole rows at a
// time): a big dug bunker's field is 10,000 - 25,000 points, each its
// distance round the whole outline and a height - 25 - 65 ms in one, while
// the next hole is built ahead.
export const FIELD_STEP = 2000;
export function* edgeFieldSteps(poly, { cell = 0.25, pad = 1.5, maxCells = 160, heightAt = null } = {}, every = FIELD_STEP) {
  let x0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let z1 = -Infinity;
  for (const [x, z] of poly) {
    x0 = Math.min(x0, x);
    z0 = Math.min(z0, z);
    x1 = Math.max(x1, x);
    z1 = Math.max(z1, z);
  }
  x0 -= pad;
  z0 -= pad;
  x1 += pad;
  z1 += pad;
  cell = Math.max(cell, (x1 - x0) / (maxCells - 1), (z1 - z0) / (maxCells - 1));
  const nx = Math.ceil((x1 - x0) / cell) + 1;
  const nz = Math.ceil((z1 - z0) / cell) + 1;
  const dist = new Float32Array(nx * nz);
  const depth = heightAt ? new Float32Array(nx * nz) : null;
  const n = poly.length;
  const px = Float64Array.from(poly, (p) => p[0]);
  const pz = Float64Array.from(poly, (p) => p[1]);
  const rim = heightAt ? Float64Array.from(poly, (p) => heightAt(p[0], p[1])) : null;
  let work = 0;
  for (let iz = 0; iz < nz; iz++) {
    if (iz && (work += nx) >= every) {
      work = 0;
      yield;
    }
    const z = z0 + iz * cell;
    for (let ix = 0; ix < nx; ix++) {
      const x = x0 + ix * cell;
      // Nearest point on the outline, and inside or out (even-odd), in one
      // pass round it. Kept to plain arithmetic: this runs for every point
      // of every bunker whenever a hole is built.
      let best = Infinity;
      let inside = false;
      let rimSum = 0;
      let rimWeight = 0;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const ax = px[j];
        const az = pz[j];
        const dx = px[i] - ax;
        const dz = pz[i] - az;
        const len2 = dx * dx + dz * dz;
        let t = len2 > 0 ? ((x - ax) * dx + (z - az) * dz) / len2 : 0;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = ax + dx * t - x;
        const qz = az + dz * t - z;
        const d2 = qx * qx + qz * qz;
        if (d2 < best) best = d2;
        if (rim) {
          // Each piece of the outline by its length, fading with distance
          // (half a metre's grace, so it doesn't swamp everything close up).
          const w = Math.sqrt(len2) / ((d2 + 0.25) * (d2 + 0.25));
          rimSum += w * (rim[j] + (rim[i] - rim[j]) * t);
          rimWeight += w;
        }
        if (pz[i] > z !== az > z && x < (dx * (z - pz[i])) / dz + px[i]) inside = !inside;
      }
      best = Math.sqrt(best);
      const k = iz * nx + ix;
      dist[k] = inside ? best : -best;
      if (depth) depth[k] = inside && rimWeight > 0 ? Math.max(0, rimSum / rimWeight - heightAt(x, z)) : 0;
    }
  }
  return { x0, z0, cell, nx, nz, width: (nx - 1) * cell, height: (nz - 1) * cell, dist, depth };
}

// How far each point of a field's grid is from the nearest of some other
// outlines (in the same frame): positive outside them all, negative inside
// one. For where two things meet - a bunker running into a pond - so the
// sand can darken to wet sand for its last metre before the water, and the
// water show a pale shelf of sand under its shallows. Only outlines whose
// box comes within `reach` metres of the field are looked at; with none,
// null.
export function nearField(field, polys, reach = 4) {
  const { x0, z0, cell, nx, nz } = field;
  const x1 = x0 + (nx - 1) * cell;
  const z1 = z0 + (nz - 1) * cell;
  const near = polys.filter((p) => {
    const xs = p.map((q) => q[0]);
    const zs = p.map((q) => q[1]);
    return Math.min(...xs) < x1 + reach && Math.max(...xs) > x0 - reach && Math.min(...zs) < z1 + reach && Math.max(...zs) > z0 - reach;
  });
  if (!near.length) return null;
  const out = new Float32Array(nx * nz).fill(Infinity);
  for (const poly of near) {
    const n = poly.length;
    for (let iz = 0; iz < nz; iz++) {
      const z = z0 + iz * cell;
      for (let ix = 0; ix < nx; ix++) {
        const x = x0 + ix * cell;
        let best = Infinity;
        let inside = false;
        for (let i = 0, j = n - 1; i < n; j = i++) {
          const [ax, az] = poly[j];
          const dx = poly[i][0] - ax;
          const dz = poly[i][1] - az;
          const len2 = dx * dx + dz * dz;
          let t = len2 > 0 ? ((x - ax) * dx + (z - az) * dz) / len2 : 0;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const qx = ax + dx * t - x;
          const qz = az + dz * t - z;
          best = Math.min(best, qx * qx + qz * qz);
          if (poly[i][1] > z !== az > z && x < (dx * (z - poly[i][1])) / dz + poly[i][0]) inside = !inside;
        }
        const d = inside ? -Math.sqrt(best) : Math.sqrt(best);
        const k = iz * nx + ix;
        if (d < out[k]) out[k] = d;
      }
    }
  }
  return out;
}

// Bunkers laid over each other as one bunker (the owner, 29 October 2026:
// "Should bunker that overlapp just not be treated as a bunker? So we not
// have a line in it, more the outside line of the bunkers is the total
// bunker"): one field for the whole patch, over the box round all of them -
// how far in from the patch's own outside line each spot is (the pieces of
// each outline lying outside every other), and how deep below that rim.
// Every bunker of the patch reads the same field, so nothing changes where
// one's outline crosses another's sand. A field each, even joined
// (joinField), measured the depth below its own rim - an outline running
// through the other's sand - and the two met in a line.
// loops: the patch's outlines (closed, [[x, z], ...] each), the same frame.
export function patchField(loops, opts = {}) {
  return drain(patchFieldSteps(loops, opts, Infinity));
}
export function* patchFieldSteps(loops, { cell = 0.25, pad = 1.5, maxCells = 160, heightAt = null } = {}, every = FIELD_STEP) {
  let x0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let z1 = -Infinity;
  for (const poly of loops) {
    for (const [x, z] of poly) {
      x0 = Math.min(x0, x);
      z0 = Math.min(z0, z);
      x1 = Math.max(x1, x);
      z1 = Math.max(z1, z);
    }
  }
  x0 -= pad;
  z0 -= pad;
  x1 += pad;
  z1 += pad;
  cell = Math.max(cell, (x1 - x0) / (maxCells - 1), (z1 - z0) / (maxCells - 1));
  const nx = Math.ceil((x1 - x0) / cell) + 1;
  const nz = Math.ceil((z1 - z0) / cell) + 1;
  // The outside line: each outline's pieces whose middle lies in no other.
  const seg = [];
  loops.forEach((poly, li) => {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const mx = (poly[i][0] + poly[j][0]) / 2;
      const mz = (poly[i][1] + poly[j][1]) / 2;
      if (loops.some((o, oi) => oi !== li && insideOutline(o, mx, mz))) continue;
      seg.push([poly[j][0], poly[j][1], poly[i][0], poly[i][1], heightAt ? heightAt(poly[j][0], poly[j][1]) : 0, heightAt ? heightAt(poly[i][0], poly[i][1]) : 0]);
    }
  });
  const dist = new Float32Array(nx * nz);
  const depth = heightAt ? new Float32Array(nx * nz) : null;
  let work = 0;
  for (let iz = 0; iz < nz; iz++) {
    if (iz && (work += nx) >= every) {
      work = 0;
      yield;
    }
    const z = z0 + iz * cell;
    for (let ix = 0; ix < nx; ix++) {
      const x = x0 + ix * cell;
      let best = Infinity;
      let rimSum = 0;
      let rimWeight = 0;
      for (const [ax, az, bx, bz, ha, hb] of seg) {
        const dx = bx - ax;
        const dz = bz - az;
        const len2 = dx * dx + dz * dz;
        let t = len2 > 0 ? ((x - ax) * dx + (z - az) * dz) / len2 : 0;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = ax + dx * t - x;
        const qz = az + dz * t - z;
        const d2 = qx * qx + qz * qz;
        if (d2 < best) best = d2;
        if (depth) {
          // (Weighted as edgeField's rim.)
          const w = Math.sqrt(len2) / ((d2 + 0.25) * (d2 + 0.25));
          rimSum += w * (ha + (hb - ha) * t);
          rimWeight += w;
        }
      }
      const inside = loops.some((poly) => insideOutline(poly, x, z));
      best = Math.sqrt(best);
      const k = iz * nx + ix;
      dist[k] = inside ? best : -best;
      if (depth) depth[k] = inside && rimWeight > 0 ? Math.max(0, rimSum / rimWeight - heightAt(x, z)) : 0;
    }
  }
  return { x0, z0, cell, nx, nz, width: (nx - 1) * cell, height: (nz - 1) * cell, dist, depth };
}

// Two bunkers laid over each other are one patch of sand (the owner, of
// two drawn one over the other: "Clashing bunkers" - one's lip ran right
// through the other's sand). Every spot inside another's outline is as far
// in from the edge as it is in whichever it's deeper in - this one's own
// sand there, and just outside its outline too, so the distance runs on
// smoothly across its edge where that lies in the other's sand (a jump
// there showed as a ring in the bowl's shading). The lip, the damp band
// and the bowl's slope show only round the outside of the two together.
// (Not exactly the distance in from the two as one outline, but never more
// than it, and the same at its edge.) The field, changed in place.
export function joinField(field, polys) {
  const others = polys?.length ? nearField(field, polys, 0) : null;
  if (!others) return field;
  const { dist } = field;
  for (let k = 0; k < dist.length; k++) if (others[k] < 0 && -others[k] > dist[k]) dist[k] = -others[k];
  return field;
}

// How far each point of a field's grid is from an open line (a pond's
// wall, sim/walls.mjs), metres: so the water can lose its muddy margin
// along the wall and darken where it laps against it.
export function lineField(field, line) {
  const { x0, z0, cell, nx, nz } = field;
  const out = new Float32Array(nx * nz);
  for (let iz = 0; iz < nz; iz++) {
    const z = z0 + iz * cell;
    for (let ix = 0; ix < nx; ix++) {
      const x = x0 + ix * cell;
      let best = Infinity;
      for (let i = 1; i < line.length; i++) {
        const [ax, az] = line[i - 1];
        const dx = line[i][0] - ax;
        const dz = line[i][1] - az;
        const len2 = dx * dx + dz * dz;
        let t = len2 > 0 ? ((x - ax) * dx + (z - az) * dz) / len2 : 0;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = ax + dx * t - x;
        const qz = az + dz * t - z;
        best = Math.min(best, qx * qx + qz * qz);
      }
      out[iz * nx + ix] = Math.sqrt(best);
    }
  }
  return out;
}

// Water giving way to a green and its fringe (sim/greenfirst.mjs):
// `past(x, z)`, how far each point is past them (negative on them). Where
// any of the water's on them, its edge is taken to run along the fringe's
// there too (the field, changed in place) - its shore's drawn along it -
// and how far past each point is is kept, for the water to stop at; else
// null, and the field's left as it was.
export function cutField(field, past) {
  const { x0, z0, cell, nx, nz, dist } = field;
  const cut = new Float32Array(nx * nz);
  let wet = false;
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const i = iz * nx + ix;
      cut[i] = past(x0 + ix * cell, z0 + iz * cell);
      if (cut[i] < 0 && dist[i] > 0) wet = true;
    }
  }
  if (!wet) return null;
  for (let i = 0; i < dist.length; i++) dist[i] = Math.min(dist[i], cut[i]);
  return cut;
}

// The field packed into bytes for a texture: red is the distance from
// range[0] to range[1] metres, green the depth from 0 to maxDepth metres -
// or (with `cut`, from cutField, for water, which has no depth) how far
// past a green's fringe from -CUT_RANGE to CUT_RANGE metres - blue (with
// `near`, from nearField) the distance to the other outlines from
// NEAR_RANGE[0] to NEAR_RANGE[1] metres (all the way up with none), and
// alpha (with `wall`, from lineField) the distance to a wall from 0 to
// WALL_RANGE metres (all the way up with none).
export const NEAR_RANGE = [-2, 4];
export const WALL_RANGE = 4;
export const CUT_RANGE = 4;
export function packField(field, range = [-2, 6], maxDepth = 2, near = null, wall = null, cut = null) {
  const { dist, depth } = field;
  const data = new Uint8Array(dist.length * 4);
  const span = range[1] - range[0];
  const nearSpan = NEAR_RANGE[1] - NEAR_RANGE[0];
  for (let i = 0; i < dist.length; i++) {
    data[i * 4] = Math.round(255 * Math.max(0, Math.min(1, (dist[i] - range[0]) / span)));
    if (cut) data[i * 4 + 1] = Math.round(255 * Math.max(0, Math.min(1, (cut[i] + CUT_RANGE) / (2 * CUT_RANGE))));
    else data[i * 4 + 1] = depth ? Math.round(255 * Math.max(0, Math.min(1, depth[i] / maxDepth))) : 0;
    data[i * 4 + 2] = near ? Math.round(255 * Math.max(0, Math.min(1, (near[i] - NEAR_RANGE[0]) / nearSpan))) : 255;
    data[i * 4 + 3] = wall ? Math.round(255 * Math.max(0, Math.min(1, wall[i] / WALL_RANGE))) : 255;
  }
  return data;
}
