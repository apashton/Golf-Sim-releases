// A flat shape as a mesh filled with a grid (sim/gridfill.mjs): its squares
// two triangles each, and the strip left between them and its outline
// joined across and split until no side is longer than `most` - for a
// fairway laid over rolling ground, in place of its whole shape cut from
// its outline and split (look/dugground.js refine), which made slivers of
// it.
//
// The mesh is as course/holebuild.js's `flat` shape comes out once turned
// flat on the ground: a point [x, y] of the shape at world (x, 0, -y), its
// picture corners (x, y), every face up, its corners shared (so what's
// split or trimmed after is split the same on both sides of a side).

import * as THREE from "three";
import { gridFill, zipStrip, closeSpaced, signedArea } from "../sim/gridfill.mjs";
import { refine, setIndexOf } from "./dugground.js";

// How far the mesh's own area may be from the shape's before it's not
// trusted (the caller lays the shape the old way instead).
export const FILL_TRUST = 0.005;
// A square's side against the longest side allowed: a hair under one over
// root two, so its corner-to-corner is within it.
export const FILL_STEP = 0.7;
// The longest join across the strip between the squares and the outline,
// in squares: the strip's between three quarters of one and two and a
// half wide.
export const FILL_SPAN = 4;

// The area of a mesh's triangles, flat (x and z).
export function flatArea(geo) {
  const pos = geo.attributes.position;
  const index = geo.index;
  const n = index ? index.count : pos.count;
  let area = 0;
  for (let k = 0; k < n; k += 3) {
    const a = index ? index.getX(k) : k;
    const b = index ? index.getX(k + 1) : k + 1;
    const c = index ? index.getX(k + 2) : k + 2;
    area += Math.abs((pos.getX(b) - pos.getX(a)) * (pos.getZ(c) - pos.getZ(a)) - (pos.getX(c) - pos.getX(a)) * (pos.getZ(b) - pos.getZ(a))) / 2;
  }
  return area;
}

// Points [x, y] and triangles (corners' numbers) as a mesh flat on the
// ground: position, normal (up), uv (the points themselves); indexed.
function flatMesh(points, index) {
  const position = new Float32Array(points.length * 3);
  const normal = new Float32Array(points.length * 3);
  const uv = new Float32Array(points.length * 2);
  points.forEach(([x, y], k) => {
    position[k * 3] = x;
    position[k * 3 + 2] = -y;
    normal[k * 3 + 1] = 1;
    uv[k * 2] = x;
    uv[k * 2 + 1] = y;
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  setIndexOf(geo, index);
  return geo;
}

// The shape (its outline: a closed line of [x, y], either way round)
// filled, flat on the ground at height 0, no side of any triangle longer
// than `most` (its squares that across corner to corner: `step`): a
// BufferGeometry (position, normal, uv; indexed) - or null where it can't
// be filled so (no square of the grid fits; its squares in more than one
// patch - a fairway pinched to nothing; the strip round them not joined
// cleanly; the mesh not the shape's own area): the old way then.
export function filledShape(outline, most, step = most * FILL_STEP) {
  // (Anticlockwise, none of its points twice running - an outline's last
  // its first again - and no two over `most` apart: as it'd be split to
  // anyway, and as closely set as the squares' own line.)
  const once = outline.filter((p, k) => Math.hypot(p[0] - outline[(k + 1) % outline.length][0], p[1] - outline[(k + 1) % outline.length][1]) > 1e-6);
  const line = closeSpaced(signedArea(once) < 0 ? [...once].reverse() : once, most);
  const fill = gridFill(line, [], step);
  if (!fill || fill.outer.length !== 1 || fill.inner.length) return null;
  const round = fill.outer[0];
  // The strip round the squares, joined across, then split (its sides
  // along the squares are a step long: never split, so they stay the
  // squares' own).
  const zip = zipStrip(line, round, FILL_SPAN * step);
  if (!zip) return null;
  const flat = flatMesh([...line, ...round], zip);
  const strip = refine(flat, most);
  // One mesh of the two: the squares' corners each once, then the strip's
  // own points (the outline's, and those made splitting it) - its points on
  // the squares' line the squares' own corners, so the two share them.
  const at = new Map();
  const points = [];
  const corner = (i, j) => {
    const k = i * 100003 + j;
    let n = at.get(k);
    if (n === undefined) {
      n = points.length;
      at.set(k, n);
      points.push([i * step, j * step]);
    }
    return n;
  };
  const index = [];
  for (const [i, j] of fill.cells) {
    const a = corner(i, j);
    const b = corner(i + 1, j);
    const c = corner(i + 1, j + 1);
    const d = corner(i, j + 1);
    // (Faces up: anticlockwise in the shape's frame.)
    index.push(a, b, c, a, c, d);
  }
  const sp = strip.attributes.position;
  const own = new Int32Array(sp.count);
  for (let k = 0; k < sp.count; k++) {
    if (k >= line.length && k < line.length + round.length) {
      const [x, y] = round[k - line.length];
      own[k] = corner(Math.round(x / step), Math.round(y / step));
    } else {
      own[k] = points.length;
      points.push([sp.getX(k), -sp.getZ(k)]);
    }
  }
  const si = strip.index;
  for (let k = 0; k < si.count; k++) index.push(own[si.getX(k)]);
  if (strip !== flat) flat.dispose();
  strip.dispose();
  const all = flatMesh(points, index);
  const want = Math.abs(signedArea(line));
  if (!(Math.abs(flatArea(all) - want) <= FILL_TRUST * want)) {
    all.dispose();
    return null;
  }
  return all;
}
