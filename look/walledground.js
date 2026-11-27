// The ground round the walled bunkers and ponds of a hole from a map
// (course.js buildMappedGround). Each wall needs the ground meshes cut
// clear of its low side (look/walls.js cutAlongWall: a triangle across it
// would be a ramp in front of it), and each walled bunker brings pieces of
// its own - the ground round it laid finely, the grass along its wall's
// top, its face, its sand. A links hole on its survey has up to forty
// walled bunkers (revetted faces: sim/walls.mjs revetWall): cut a wall at a
// time, the hole's whole ground was walked once for each, and drawn a piece
// at a time they were some two hundred draws more. Here every wall is cut
// in one walk of a mesh, and the pieces are merged into a mesh for each
// material.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { cutOver, setIndexOf } from "./dugground.js";
import { wallOf, wallLine, wallDistance, edgeOf, nearestOnEdge, inSpan, insideEdge, footSpot } from "../sim/walls.mjs";

// cutAlongWall for every one of `shapes` with a wall, in one walk of the
// mesh (world frame): a triangle goes if its middle or a corner is on any
// wall's low side within `reach` metres of its line (insideOf(s)(x, z),
// hole frame: inside that shape) - just as cutting along each in turn.
export function cutAlongWalls(geo, shapes, reach, insideOf) {
  const walls = shapes
    .filter((s) => wallOf(s))
    .map((s) => {
      const b = wallLine(s).box;
      return { s, o: edgeOf(s), a: wallOf(s).a, inside: insideOf(s), box: { x0: b.x0 - reach, z0: b.z0 - reach, x1: b.x1 + reach, z1: b.z1 + reach } };
    });
  if (!walls.length) return geo;
  return cutOver(geo, (wx, wz) => {
    const x = -wz;
    const z = wx;
    for (const w of walls) {
      const b = w.box;
      if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) continue;
      if (wallDistance(w.s, x, z, reach) <= reach && w.inside(x, z) && inSpan(nearestOnEdge(w.o, x, z).t, w.a)) return true;
    }
    return false;
  });
}

// A shape's outline (hole frame): a mapped one's own points, or a designed
// one's as its wall is measured round (sim/walls.mjs edgeOf).
export const outlineOf = (s) => edgeOf(s).pts;

// A mesh (world frame) with every triangle wholly inside one of `shapes`
// taken out (cutOver's "all", for each shape in turn) in one walk: a
// triangle with its corners in two neighbours' sand, across the grass
// between, stays.
export function cutInsideEach(geo, shapes) {
  const outlines = shapes.map((s) => edgeOf(s));
  const pos = geo.attributes.position;
  // (Each corner's shapes, asked once: null for none, most of them.)
  const seen = new Array(pos.count);
  const within = (v) => {
    let list = seen[v];
    if (list === undefined) {
      const x = -pos.getZ(v);
      const z = pos.getX(v);
      list = null;
      outlines.forEach((o, k) => {
        if (insideEdge(o, x, z)) (list ??= []).push(k);
      });
      seen[v] = list;
    }
    return list;
  };
  const index = geo.index.array;
  const keep = new Int32Array(index.length);
  let n = 0;
  for (let i = 0; i < index.length; i += 3) {
    const a = within(index[i]);
    const b = a && within(index[i + 1]);
    const c = b && within(index[i + 2]);
    if (c && a.some((k) => b.includes(k) && c.includes(k))) continue;
    keep[n++] = index[i];
    keep[n++] = index[i + 1];
    keep[n++] = index[i + 2];
  }
  return setIndexOf(geo, keep.subarray(0, n));
}

// look/walls.js besideWall for several shapes at once, in the world's frame:
// the ground (heightAt, hole frame) as it is, but by any one's wall the
// height at its foot, so sand drawn there never climbs the face - the
// ground asked once a spot, and again only by a wall.
export function besideWalls(shapes, heightAt) {
  const walled = shapes.filter((s) => wallOf(s));
  return (wx, wz) => {
    const x = -wz;
    const z = wx;
    let y = heightAt(x, z);
    for (const s of walled) {
      const q = footSpot(s, x, z);
      if (q) y = Math.min(y, heightAt(q[0], q[1]));
    }
    return y;
  };
}

// Meshes laid in the world's own frame merged into one for each material
// (and way of casting and taking shadows, and set of corner data): a group
// of them, the rest as they were. Each mesh's shape is freed once merged;
// its material is the merged mesh's.
export function mergeInPlace(meshes, name = "merged") {
  const buckets = new Map();
  const group = new THREE.Group();
  group.name = name;
  for (const m of meshes) {
    if (!m?.isMesh || !m.geometry?.index || Array.isArray(m.material)) {
      if (m) group.add(m);
      continue;
    }
    m.updateMatrixWorld(true);
    if (!m.matrixWorld.equals(IDENTITY)) m.geometry.applyMatrix4(m.matrixWorld);
    const attrs = Object.keys(m.geometry.attributes).sort().join(",");
    const key = `${m.material.uuid}|${m.castShadow ? 1 : 0}${m.receiveShadow ? 1 : 0}|${m.renderOrder}|${attrs}`;
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = []));
    b.push(m);
  }
  for (const parts of buckets.values()) {
    const geo = parts.length > 1 ? mergeGeometries(parts.map((p) => p.geometry)) : null;
    if (!geo) {
      for (const p of parts) {
        p.removeFromParent();
        p.position.set(0, 0, 0);
        p.rotation.set(0, 0, 0);
        p.scale.set(1, 1, 1);
        p.updateMatrix();
        group.add(p);
      }
      continue;
    }
    for (const p of parts) p.geometry.dispose();
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, parts[0].material);
    mesh.castShadow = parts[0].castShadow;
    mesh.receiveShadow = parts[0].receiveShadow;
    mesh.renderOrder = parts[0].renderOrder;
    group.add(mesh);
  }
  return group;
}
const IDENTITY = new THREE.Matrix4();
