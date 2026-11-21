// Drawing a designed hole round bunkers dug by hand (sim/holeedits.mjs):
// the flat shapes laid over its ground - the fairway, bands of rough, the
// fringe - would lie across a dug hollow and hide it, so they have it cut
// out of them, and the fine ground drawn under them shows there instead.

import * as THREE from "three";
import { blobOutline, fairwayHalfWidth, nearest, pointAt, insideBlob } from "../sim/course.mjs";
import { shapeGrid } from "../sim/shapegrid.mjs";
import { insidePolygon } from "../sim/terrain.mjs";

// `where(wx, wz)` (world) for being within `grow` metres of any of
// `shapes` (hole frame), found through a grid of them (sim/shapegrid.mjs)
// rather than trying every shape at every spot; with near(ax, az, bx, bz)
// for whether a stretch of ground can be anywhere near one at all, so
// refine needn't look along it (most of a hole is nowhere near a bunker).
export function nearShapes(shapes, grow) {
  const grid = shapeGrid(shapes, Math.max(0, grow));
  const where = (wx, wz) => {
    const list = grid.at(-wz, wx);
    for (const s of list) if (insideBlob(s, -wz, wx, grow)) return true;
    return false;
  };
  where.near = (ax, az, bx, bz) => grid.any(-az, ax, -bz, bx);
  return where;
}

// Whether (wx, wz) is near any of `nears` (nearShapes), as one.
export function nearAny(nears) {
  const where = (wx, wz) => nears.some((n) => n(wx, wz));
  where.near = (ax, az, bx, bz) => nears.some((n) => n.near(ax, az, bx, bz));
  return where;
}

// A dug bunker's outline where it lies on the fairway, to cut out of it (a
// flat shape over a hollow would hide it): its points pulled in to just
// inside the fairway where it runs off the edge. Null if it's off the
// fairway altogether. `grow`: how far out from its edge to cut (the
// course's dug bunkers' a few centimetres outside it, under the collar;
// a lowered pond's, right at it).
// None for a fingered bunker (sim/fingers.mjs): its outline pulled in to
// the fairway's edge cut straight across the tongues of grass between
// fingers running off the fairway, and the ground showed through there in
// dark slivers. The fairway round its rim is cut to its outline itself
// (refineNear, trimOut), and over its dug sand (holebuild's hollow).
export function fairwayPit(b, path, f, grow = -0.1) {
  if (b.fingered) return null;
  let inside = false;
  const pts = blobOutline(b, 48, grow).map(([x, z]) => {
    const n = nearest(path, x, z);
    const s = Math.min(f.to - 1.5, Math.max(f.from + 1.5, n.s));
    const half = fairwayHalfWidth(f, s, n.d < 0 ? -1 : 1) - 0.4;
    if (half <= 0) return null;
    if (s === n.s && Math.abs(n.d) < half) inside = true;
    const d = Math.sign(n.d) * Math.min(Math.abs(n.d), half);
    const at = pointAt(path, s);
    return [at.p[0] - at.dir[1] * d, at.p[1] + at.dir[0] * d];
  });
  return inside && pts.every(Boolean) ? pts : null;
}

// A mesh with the triangles over a dug hollow taken out (`over(wx, wz)`
// says where): the fine ground under it shows there instead. By each
// triangle's middle and corners (`corners` true), its middle only (false),
// or only those wholly over it ("all": every corner).
export function cutOver(geo, over, corners = true) {
  const steps = cutOverSteps(geo, over, corners, Infinity);
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}
// The same, stopping (yield) after every `every` triangles looked at: the
// fairway cut where it's over dug ground, a few hundred thousand
// triangles on a links hole, while the next hole is built ahead.
export const CUT_STEP = 60000;
export function* cutOverSteps(geo, over, corners = true, every = CUT_STEP) {
  const pos = geo.attributes.position;
  const index = geo.index.array;
  // (Those kept, in a list of their own size: setIndexOf.)
  const keep = new Int32Array(index.length);
  let n = 0;
  // (Each corner asked once, not once for every triangle it's a corner of.)
  const seen = new Uint8Array(pos.count);
  const at = (v) => (seen[v] ||= over(pos.getX(v), pos.getZ(v)) ? 2 : 1) === 2;
  let work = 0;
  for (let i = 0; i < index.length; i += 3) {
    if (++work >= every) {
      work = 0;
      yield;
    }
    const a = index[i];
    const b = index[i + 1];
    const c = index[i + 2];
    if (corners === "all") {
      if (at(a) && at(b) && at(c)) continue;
    } else {
      const mx = (pos.getX(a) + pos.getX(b) + pos.getX(c)) / 3;
      const mz = (pos.getZ(a) + pos.getZ(b) + pos.getZ(c)) / 3;
      if (over(mx, mz) || (corners && (at(a) || at(b) || at(c)))) continue;
    }
    keep[n++] = a;
    keep[n++] = b;
    keep[n++] = c;
  }
  setIndexOf(geo, keep.subarray(0, n));
  return geo;
}

// A bunker's sand where deeper ones overlap it (with no wall between):
// let down SINK_UNDER under theirs, out of sight, and the triangles well
// inside them left out - so its sand runs on under their edges, never
// stopping short of them nor leaving a gap where it comes out beyond one.
// Its shading as it was (the normals kept), so no line shows at the edge.
export const SINK_UNDER = { by: 0.06, wellIn: 0.3 };
// deeper: the bunkers (hole frame, as sim/course.mjs insideBlob takes
// them); geo's points in the world (x = the hole's z, z = -x).
export function sinkUnder(geo, deeper) {
  const inside = (grow) => (wx, wz) => deeper.some((o) => insideBlob(o, -wz, wx, grow));
  cutOver(geo, inside(-SINK_UNDER.wellIn), "all");
  const pos = geo.attributes.position;
  const under = inside(0);
  for (let i = 0; i < pos.count; i++) if (under(pos.getX(i), pos.getZ(i))) pos.setY(i, pos.getY(i) - SINK_UNDER.by);
  pos.needsUpdate = true;
  geo.computeBoundingSphere?.();
  return geo;
}

// A mesh's triangles set from a list of their corners' numbers, as
// three.js's setIndex makes of a plain list (16-bit numbers unless one is
// 65535 or more) - without the plain list, a hole's ground long.
export function setIndexOf(geo, list) {
  let top = 0;
  for (let i = 0; i < list.length; i++) if (list[i] > top) top = list[i];
  geo.setIndex(top >= 65535 ? new THREE.Uint32BufferAttribute(list, 1) : new THREE.Uint16BufferAttribute(list, 1));
  return geo;
}

// A shape's outline points (blobOutline, `points` of them) as angles round
// its middle in the world, ascending - its sand's spokes (greenscene.js
// ringMesh angles: course/holebuild.js rimPoints), so the sand's edge runs
// through the very points trimOut cuts the ground round it to. Null for one
// drawn from a map's outline (its own points).
export function rimAngles(b, points) {
  if (b.poly) return null;
  // (Hole (x, z) to the world's (z, -x).)
  return blobOutline(b, points)
    .map(([x, z]) => {
      const a = Math.atan2(b.x - x, z - b.z);
      return a < 0 ? a + Math.PI * 2 : a;
    })
    .sort((p, q) => p - q);
}

// A mesh trimmed back to the edge of some shapes (in the hole's own x/z,
// each grown by `grow` metres) along the edge itself, rather than losing
// whole triangles, which left a row of steps: the triangles wholly inside
// go, and each corner inside of those left is moved out onto the edge and
// laid on the ground there again (`heightAt(wx, wz) + lift`, as it was
// made). inset(x, z): how far back in from the edge point (hole frame) it
// goes instead, never further in than it was (a bunker's sand reaching a
// little under a deeper one's: holebuild.js).
export function trimOut(geo, shapes, heightAt, lift = 0, grow = 0.02, inset = null, points = 96) {
  const steps = trimOutSteps(geo, shapes, heightAt, lift, grow, inset, points, Infinity);
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}
// The same, stopping (yield) after every `every` corners looked at, and
// every thirtieth of that many moved out onto an edge (each its nearest
// point on the outline found and a height worked out: some 25 times a
// look, on a hole's ground) - for
// the ground round a green's bunkers, the rolling ground and the fairway
// round them, built a step at a time while the next hole is built ahead
// (each was a step of 0.1 - 0.3 s). Each corner's asked once which shape
// it's under, not once to cut and again to move it.
export const TRIM_STEP = 10000;
export function* trimOutSteps(geo, shapes, heightAt, lift = 0, grow = 0.02, inset = null, points = 96, every = TRIM_STEP) {
  if (!shapes.length) return geo;
  // (points: how many outline points each shape's edge is cut to - a number,
  // or one for each shape: holebuild.js rimPoints, so the ground meets a dug
  // bunker's sand along the very same points.)
  const loops = shapes.map((s) => ({ s, pts: blobOutline(s, typeof points === "function" ? points(s) : points, grow) }));
  // (Only the shapes that could be there tried: sim/shapegrid.mjs.)
  const loopOf = new Map(loops.map((l, k) => [l.s, k]));
  const grid = shapeGrid(shapes, Math.max(0, grow));
  // (Inside its outline as cut, the points above - not its smooth shape,
  // which at a long one's tight end bulges past the straight run between
  // two points: a triangle there, all its corners inside the smooth shape,
  // went, and left a slit to the sky between the ground and the sand drawn
  // to those points - Golf Sim Links 13 and 14.)
  const under = (wx, wz) => {
    for (const s of grid.at(-wz, wx)) if (insideBlob(s, -wz, wx, grow + 0.3)) {
      const k = loopOf.get(s);
      if (insidePolygon(loops[k].pts, -wz, wx)) return k;
    }
    return -1;
  };
  const pos = geo.attributes.position;
  let index = geo.index.array;
  // Which shape each corner in use is under (its loop's number), or -1.
  const of = new Int32Array(pos.count).fill(-1);
  const used = new Uint8Array(pos.count);
  for (let t = 0; t < index.length; t++) used[index[t]] = 1;
  let work = 0;
  for (let i = 0; i < pos.count; i++) {
    if (!used[i]) continue;
    if (++work >= every) {
      work = 0;
      yield;
    }
    of[i] = under(pos.getX(i), pos.getZ(i));
  }
  yield;
  // The triangles wholly inside go (cutOver's "all").
  const keep = new Int32Array(index.length);
  let n = 0;
  for (let t = 0; t < index.length; t += 3) {
    const a = index[t];
    const b = index[t + 1];
    const c = index[t + 2];
    if (of[a] >= 0 && of[b] >= 0 && of[c] >= 0) continue;
    keep[n++] = a;
    keep[n++] = b;
    keep[n++] = c;
  }
  setIndexOf(geo, keep.subarray(0, n));
  index = geo.index.array;
  // (Each corner still in use once: in turn, as each is moved by itself.)
  used.fill(0);
  for (let t = 0; t < index.length; t++) used[index[t]] = 1;
  const lay = Math.max(1, Math.round(every / 30));
  work = 0;
  for (let i = 0; i < pos.count; i++) {
    if (!used[i] || of[i] < 0) continue;
    if (++work >= lay) {
      work = 0;
      yield;
    }
    const pts = loops[of[i]].pts;
    const wx = pos.getX(i);
    const wz = pos.getZ(i);
    // The nearest point on that shape's edge.
    const [x, z] = [-wz, wx];
    let best = Infinity;
    let at = null;
    for (let k = 0; k < pts.length; k++) {
      const [ax, az] = pts[k];
      const [bx, bz] = pts[(k + 1) % pts.length];
      const dx = bx - ax;
      const dz = bz - az;
      const len2 = dx * dx + dz * dz || 1;
      const u = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2));
      const qx = ax + dx * u;
      const qz = az + dz * u;
      const d = (qx - x) ** 2 + (qz - z) ** 2;
      if (d < best) {
        best = d;
        at = [qx, qz];
      }
    }
    if (inset) {
      const d = Math.sqrt(best);
      const k = d > 1e-9 ? Math.min(inset(at[0], at[1]), d) / d : 0;
      at = [at[0] + (x - at[0]) * k, at[1] + (z - at[1]) * k];
    }
    const [nx, nz] = [at[1], -at[0]];
    pos.setXYZ(i, nx, heightAt(nx, nz) + lift, nz);
  }
  pos.needsUpdate = true;
  geo.computeBoundingSphere();
  return geo;
}

// Lights a mesh laid over dug ground as the ground was before the digging
// (normals from heightAt, world x/z): a triangle reaching from the grass
// down under a bunker's sand otherwise shaded the grass round the rim
// dark, as if it tipped into the hole.
// preset: { xs, zs, normals } worked out already for the corners where
// they were (sim/sheetreadings.mjs) - any since moved worked out here.
export function levelNormals(geo, heightAt, preset = null) {
  const steps = levelNormalsSteps(geo, heightAt, preset, Infinity);
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}
// The same, stopping (yield) after every `every` corners whose light is
// worked out here (four heights each; one read already, preset, is only
// copied) - the rolling ground round its bunkers, and a band laid over the
// rolling ground, while the next hole is built ahead.
export const LEVEL_STEP = 8000;
export function* levelNormalsSteps(geo, heightAt, preset = null, every = LEVEL_STEP) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const e = 0.25;
  let work = 0;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    if (preset && i < preset.xs.length && preset.xs[i] === x && preset.zs[i] === z) {
      nor.setXYZ(i, preset.normals[i * 3], preset.normals[i * 3 + 1], preset.normals[i * 3 + 2]);
      continue;
    }
    if (++work >= every) {
      work = 0;
      yield;
    }
    const gx = (heightAt(x + e, z) - heightAt(x - e, z)) / (2 * e);
    const gz = (heightAt(x, z + e) - heightAt(x, z - e)) / (2 * e);
    const l = Math.hypot(gx, 1, gz);
    nor.setXYZ(i, -gx / l, 1 / l, -gz / l);
  }
  nor.needsUpdate = true;
  return geo;
}

// Lights the corners marked in `which` (a byte a corner) by the faces round
// them - each face as big as it is, facing up - and leaves the rest as they
// were: a band laid down a brook's bank (course/holebuild.js), lit as it's
// laid without reading the ground again. Stops (yield) every `every`
// triangles.
export function* faceLight(geo, which, every = 40000) {
  const pos = geo.attributes.position.array;
  const nor = geo.attributes.normal;
  const index = geo.index.array;
  const sum = new Float32Array(which.length * 3);
  for (let t = 0; t < index.length; t += 3) {
    if (t && t % (every * 3) === 0) yield;
    const a = index[t];
    const b = index[t + 1];
    const c = index[t + 2];
    if (!which[a] && !which[b] && !which[c]) continue;
    const ux = pos[b * 3] - pos[a * 3];
    const uy = pos[b * 3 + 1] - pos[a * 3 + 1];
    const uz = pos[b * 3 + 2] - pos[a * 3 + 2];
    const vx = pos[c * 3] - pos[a * 3];
    const vy = pos[c * 3 + 1] - pos[a * 3 + 1];
    const vz = pos[c * 3 + 2] - pos[a * 3 + 2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    // (Whichever way it's wound.)
    if (ny < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    for (const v of [a, b, c]) {
      sum[v * 3] += nx;
      sum[v * 3 + 1] += ny;
      sum[v * 3 + 2] += nz;
    }
  }
  for (let i = 0; i < which.length; i++) {
    if (!which[i]) continue;
    const l = Math.hypot(sum[i * 3], sum[i * 3 + 1], sum[i * 3 + 2]);
    if (l > 0) nor.setXYZ(i, sum[i * 3] / l, sum[i * 3 + 1] / l, sum[i * 3 + 2] / l);
  }
  nor.needsUpdate = true;
  return geo;
}

// Whether refine splits the edge from (ax, az) to (bx, bz): longer than
// `most`, and (with `where`) somewhere along it where it holds - tried all
// along it, `most` metres apart, as a long side can pass right over the
// place with both its ends and its middle well clear.
function splits(ax, az, bx, bz, most, where) {
  const len = Math.hypot(bx - ax, bz - az);
  if (len <= most) return false;
  if (!where) return true;
  if (where.near && !where.near(ax, az, bx, bz)) return false;
  const n = Math.ceil(len / most);
  for (let k = 1; k < n; k++) if (where(ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n)) return true;
  return false;
}

// Whether a triangle (its corners a, b, c) lies wholly where `where` can't
// hold (its near: nowhere near any of its shapes), so no side of it is
// split - asked once of it, rather than of each side; never, with no
// `where.near`.
function quiet(where, px, pz) {
  if (!where?.near) return () => false;
  return (a, b, c) => {
    const xa = px(a);
    const xb = px(b);
    const xc = px(c);
    const za = pz(a);
    const zb = pz(b);
    const zc = pz(c);
    return !where.near(Math.min(xa, xb, xc), Math.min(za, zb, zc), Math.max(xa, xb, xc), Math.max(za, zb, zc));
  };
}

// A flat shape's triangles split until no edge is longer than `most`
// metres (in x and z), so laid over rolling ground (sim/rolls.mjs) its
// middle follows the ground too - a fairway drawn from its outline alone
// was a fan of long triangles, level across a swale the ball rolled down.
// Each long edge is split at its middle once, shared by both triangles on
// it, so no crack opens between them; every attribute is carried along.
// `where(x, z)` (optional): only edges it holds for somewhere along are
// split. known: what's already been found of its sides (refineNear).
export function refine(geo, most, where = null, known = null) {
  const steps = refineSteps(geo, most, where, Infinity, known);
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}
// The same, stopping (yield) after every `every` triangles looked at, for
// a shape built a step at a time (a links fairway over its rolling ground:
// a few hundred thousand triangles, a third of a second of the page).
export const REFINE_STEP = 40000;
// What's been found of each side of a mesh being split (refineSteps), by
// its two corners' numbers either way round: not split (WHOLE), to be
// split (LONG), or the number of the corner made at its middle. A table of
// its own in plain arrays, open addressing - a Map keyed by the pair
// (as a number past what fits in a small integer) spent more of the time
// on its keys, and tidying them up after, than finding the answers saved.
const WHOLE = -1;
const LONG = -2;
const NONE = -3;
export class SideTable {
  constructor(size = 1 << 14) {
    this.mask = (1 << Math.ceil(Math.log2(Math.max(16, size * 2)))) - 1;
    this.a = new Int32Array(this.mask + 1).fill(-1);
    this.b = new Int32Array(this.mask + 1);
    this.v = new Int32Array(this.mask + 1);
    this.n = 0;
  }
  slot(a, b) {
    const lo = a < b ? a : b;
    const hi = a < b ? b : a;
    let i = (Math.imul(lo, 0x9e3779b1) ^ Math.imul(hi, 0x85ebca77)) & this.mask;
    while (this.a[i] !== -1 && (this.a[i] !== lo || this.b[i] !== hi)) i = (i + 1) & this.mask;
    return i;
  }
  get(a, b) {
    const i = this.slot(a, b);
    return this.a[i] === -1 ? NONE : this.v[i];
  }
  set(a, b, value) {
    let i = this.slot(a, b);
    if (this.a[i] === -1) {
      if (++this.n * 2 > this.mask) {
        this.grow();
        i = this.slot(a, b);
      }
      this.a[i] = a < b ? a : b;
      this.b[i] = a < b ? b : a;
    }
    this.v[i] = value;
  }
  grow() {
    const { a, b, v } = this;
    this.mask = this.mask * 2 + 1;
    this.a = new Int32Array(this.mask + 1).fill(-1);
    this.b = new Int32Array(this.mask + 1);
    this.v = new Int32Array(this.mask + 1);
    for (let k = 0; k < a.length; k++) {
      if (a[k] === -1) continue;
      const i = this.slot(a[k], b[k]);
      this.a[i] = a[k];
      this.b[i] = b[k];
      this.v[i] = v[k];
    }
  }
}
export function* refineSteps(geo, most, where = null, every = REFINE_STEP, known = null) {
  if (!geo.index) return geo;
  let work = 0;
  const names = Object.keys(geo.attributes);
  // (The corners there were read from the mesh as they are; those made
  // here kept beside them - not every corner copied out first and back, a
  // whole hole's ground at a time: a tenth of a second and as much again
  // tidying up after, on a links hole's rolling ground.)
  const n0 = geo.attributes.position.count;
  const data = names.map((n) => ({ n, size: geo.attributes[n].itemSize, v: geo.attributes[n].array, more: [] }));
  const pos = data[names.indexOf("position")];
  const px = (a) => (a < n0 ? pos.v[a * 3] : pos.more[(a - n0) * 3]);
  const pz = (a) => (a < n0 ? pos.v[a * 3 + 2] : pos.more[(a - n0) * 3 + 2]);
  let made = 0;
  // The triangles, as their corners' numbers (`size` of them in use), in a
  // list that grows as they're split.
  let index = Int32Array.from(geo.index.array);
  let size = index.length;
  const add = (...v) => {
    if (size + v.length > index.length) {
      const bigger = new Int32Array(Math.max(index.length * 2, size + v.length));
      bigger.set(index.subarray(0, size));
      index = bigger;
    }
    for (const x of v) index[size++] = x;
  };
  // Each side found once (sides): a side is looked at from both its
  // triangles, and one left whole is the same side on every pass (its
  // corners never move) - each tried all along it again from every
  // triangle, on every pass, was most of the time a patch round a green's
  // bunkers took. One split is gone after its pass (both triangles on it
  // are split), so its middle is found there by the same table.
  const sides = known ?? new SideTable(geo.index.count);
  const clear = quiet(where, px, pz);
  // Triangles none of whose sides was split last time round aren't looked
  // at again: a side once left whole always is (it's the same side), and
  // the only new sides are inside triangles just split - across a whole
  // hole's ground, most of it nowhere near a bunker, looking at every side
  // again on every pass held the page for a second.
  let settled = 0;
  for (let pass = 0; pass < 16; pass++) {
    const before = made;
    const mid = (a, b) => {
      let m = sides.get(a, b);
      if (m >= 0 || m === WHOLE) return m;
      if (m === NONE && !splits(px(a), pz(a), px(b), pz(b), most, where)) {
        sides.set(a, b, WHOLE);
        return WHOLE;
      }
      m = n0 + made++;
      for (const d of data) for (let k = 0; k < d.size; k++) d.more.push(((a < n0 ? d.v[a * d.size + k] : d.more[(a - n0) * d.size + k]) + (b < n0 ? d.v[b * d.size + k] : d.more[(b - n0) * d.size + k])) / 2);
      sides.set(a, b, m);
      return m;
    };
    // (Those left whole go first in the list, ahead of those just made:
    // the list kept as far as it's settled, the rest looked at again -
    // those left whole moved up in their order, those split added after.)
    const end = size;
    size = settled;
    const out = [];
    for (let i = settled; i < end; i += 3) {
      if (++work >= every) {
        work = 0;
        yield;
      }
      let a = index[i];
      let b = index[i + 1];
      let c = index[i + 2];
      if (clear(a, b, c)) {
        index[size++] = a;
        index[size++] = b;
        index[size++] = c;
        continue;
      }
      let ab = mid(a, b);
      let bc = mid(b, c);
      let ca = mid(c, a);
      const n = (ab >= 0) + (bc >= 0) + (ca >= 0);
      if (n === 0) {
        index[size++] = a;
        index[size++] = b;
        index[size++] = c;
      } else if (n === 3) out.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
      else {
        // Turned so the split edges come first: ab (and bc).
        while (ab < 0 || (n === 2 && bc < 0)) {
          [a, b, c] = [b, c, a];
          [ab, bc, ca] = [bc, ca, ab];
        }
        if (n === 1) out.push(a, ab, c, ab, b, c);
        else out.push(ab, b, bc, a, ab, bc, a, bc, c);
      }
    }
    settled = size;
    for (let k = 0; k < out.length; k += 3000) add(...out.slice(k, k + 3000));
    if (made === before) break;
  }
  const g = new THREE.BufferGeometry();
  for (const d of data) {
    const v = new Float32Array((n0 + made) * d.size);
    v.set(d.v);
    v.set(d.more, n0 * d.size);
    g.setAttribute(d.n, new THREE.BufferAttribute(v, d.size));
  }
  return setIndexOf(g, index.subarray(0, size));
}

// A mesh laid over the ground split finer (refine) only where `where(x,
// z)` holds (world) - round a dug bunker, before it's trimmed to the
// bunker's edge (trimOut), which otherwise brought a coarse grid's corners
// from well inside onto the rim far apart, and the straight side between
// them cut across the curve of the edge: a flat sheet of grass lying over
// the sand inside the rim. Each new corner is laid as far over the ground
// (heightAt, world) as the corners it's made between.
export function refineNear(geo, most, where, heightAt) {
  const steps = refineNearSteps(geo, most, where, heightAt, Infinity);
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}
// The same, stopping (yield) now and then - after every `every` triangles
// looked at, and every eighth of that many new corners laid on the ground
// (each a height worked out, the dearest part) - for a patch of ground
// round a green's bunkers, or the fairway round them, built a step at a
// time while the next hole is built ahead (each was a step of 0.1 - 0.25 s).
export function* refineNearSteps(geo, most, where, heightAt, every = REFINE_STEP) {
  if (!geo.index) return geo;
  const pos = geo.attributes.position;
  const count = pos.count;
  // How far over the ground each corner of a side to be split lies.
  const over = new Float32Array(count);
  const seen = new Uint8Array(count);
  const index = geo.index.array;
  const mark = (i) => {
    if (seen[i]) return;
    seen[i] = 1;
    over[i] = pos.getY(i) - heightAt(pos.getX(i), pos.getZ(i));
  };
  // (What's found of each side kept for refine, which asks again.)
  const known = new SideTable(index.length);
  const side = (a, b) => {
    if (seen[a] && seen[b]) return;
    let v = known.get(a, b);
    if (v === NONE) {
      v = splits(pos.getX(a), pos.getZ(a), pos.getX(b), pos.getZ(b), most, where) ? LONG : WHOLE;
      known.set(a, b, v);
    }
    if (v === WHOLE) return;
    mark(a);
    mark(b);
  };
  const clear = quiet(where, (i) => pos.getX(i), (i) => pos.getZ(i));
  let work = 0;
  for (let t = 0; t < index.length; t += 3) {
    if (++work >= every) {
      work = 0;
      yield;
    }
    if (clear(index[t], index[t + 1], index[t + 2])) continue;
    side(index[t], index[t + 1]);
    side(index[t + 1], index[t + 2]);
    side(index[t + 2], index[t]);
  }
  geo.setAttribute("rOver", new THREE.BufferAttribute(over, 1));
  const out = yield* refineSteps(geo, most, where, every, known);
  geo.deleteAttribute("rOver");
  if (out === geo || out.attributes.position.count === count) {
    if (out !== geo) out.deleteAttribute("rOver");
    return out;
  }
  const p = out.attributes.position;
  const o = out.attributes.rOver;
  const lay = every / 8;
  work = 0;
  for (let i = count; i < p.count; i++) {
    if (++work >= lay) {
      work = 0;
      yield;
    }
    p.setY(i, heightAt(p.getX(i), p.getZ(i)) + o.getX(i));
  }
  out.deleteAttribute("rOver");
  return out;
}
