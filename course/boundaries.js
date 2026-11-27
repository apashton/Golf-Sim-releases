// A hole's boundaries in 3D: its free-standing stone walls (a ball stops
// against them: sim/solids.mjs), its white post-and-rail fences, and the
// white stakes of its out of bounds (sim/outofbounds.mjs) where no wall or
// fence marks the edge. What stands where is sim/boundaries.mjs's.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.
//
// One mesh for the lot, coloured by corner. (Not look/club.js
// makeBuildings: its boxes are built facing inwards - unseen on a closed
// building, which looks the same from outside, but a thin wall shows its
// far side and the inner ends of every stretch.)

import * as THREE from "three";
import { withSceneryHooks } from "../look/glsl/hooks.js";
import { wallRuns, fenceRuns, boundaryStakes, BOUNDARY } from "../sim/boundaries.mjs";

// One material for the whole page. (Every face is wound to face outwards -
// gather's quad - and only its front is drawn and lit.)
let material = null;
const boundaryMaterial = () => (material ??= withSceneryHooks(new THREE.MeshLambertMaterial({ vertexColors: true }), "sign"));

const WHITE = new THREE.Color(0xf1efe8);

// Triangles gathered with a colour at each corner.
function gather() {
  const pos = [];
  const col = [];
  // A four-cornered face, wound so its front faces `out` (a direction,
  // [x, y, z]) whichever way round its corners came.
  const quad = (p, q, r, s, c, out) => {
    const ux = q[0] - p[0];
    const uy = q[1] - p[1];
    const uz = q[2] - p[2];
    const vx = r[0] - p[0];
    const vy = r[1] - p[1];
    const vz = r[2] - p[2];
    const facing = (uy * vz - uz * vy) * out[0] + (uz * vx - ux * vz) * out[1] + (ux * vy - uy * vx) * out[2];
    for (const v of facing >= 0 ? [p, q, r, p, r, s] : [p, r, q, p, s, r]) {
      pos.push(...v);
      col.push(c.r, c.g, c.b);
    }
  };
  // A straight bar from a to b ([x, y, z], world), `w` wide and `d` deep.
  const bar = (a, b, w, d, c) => {
    const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    const side = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(side, dir).normalize();
    const corner = (p, i, j) => [p[0] + side.x * i * (w / 2) + up.x * j * (d / 2), p[1] + side.y * i * (w / 2) + up.y * j * (d / 2), p[2] + side.z * i * (w / 2) + up.z * j * (d / 2)];
    const ring = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    const A = ring.map(([i, j]) => corner(a, i, j));
    const B = ring.map(([i, j]) => corner(b, i, j));
    // Each side faces out from the bar's middle; its ends along it.
    for (let k = 0; k < 4; k++) {
      const [i0, j0] = ring[k];
      const [i1, j1] = ring[(k + 1) % 4];
      const i = (i0 + i1) / 2;
      const j = (j0 + j1) / 2;
      quad(A[k], A[(k + 1) % 4], B[(k + 1) % 4], B[k], c, [side.x * i + up.x * j, side.y * i + up.y * j, side.z * i + up.z * j]);
    }
    quad(A[0], A[1], A[2], A[3], c, [-dir.x, -dir.y, -dir.z]);
    quad(B[0], B[1], B[2], B[3], c, [dir.x, dir.y, dir.z]);
  };
  return { pos, col, quad, bar };
}

export class CourseBoundaries {
  // The hole's walls, fences and stakes, added to the world. L: its layout
  // as played.
  drawBoundaries(L) {
    if (!L?.walls?.length && !L?.out?.length) return;
    const onGround = (x, z) => this.heightAt(x, z);
    // Hole frame -> world: (x, z) -> (z, -x).
    const at = (x, z, y) => [z, y, -x];
    const up = (x, z, lift = 0) => at(x, z, onGround(x, z) + lift);
    const g = gather();
    // The walls: each a ribbon standing its height over the ground along
    // its line - two faces, a coping, and an end at each end.
    const stone = new THREE.Color(BOUNDARY.stone);
    const coping = new THREE.Color(BOUNDARY.coping);
    for (const { h, pts, edges } of wallRuns(L)) {
      const top = pts.map(([x, z]) => onGround(x, z) + h);
      // (Its foot well under the lowest ground beside it.)
      const foot = pts.map(([x, z], i) => Math.min(onGround(x, z), onGround(...edges[i][0]), onGround(...edges[i][1])) - 0.6);
      // (A direction in the hole's frame, in the world's: (x, z) -> (z, -x).)
      const way = (dx, dz) => [dz, 0, -dx];
      for (let i = 1; i < pts.length; i++) {
        // Each face out from the line to its own edge; the coping up.
        for (const k of [0, 1]) g.quad(at(...edges[i - 1][k], foot[i - 1]), at(...edges[i][k], foot[i]), at(...edges[i][k], top[i]), at(...edges[i - 1][k], top[i - 1]), stone, way(edges[i][k][0] - pts[i][0], edges[i][k][1] - pts[i][1]));
        g.quad(at(...edges[i - 1][0], top[i - 1]), at(...edges[i][0], top[i]), at(...edges[i][1], top[i]), at(...edges[i - 1][1], top[i - 1]), coping, [0, 1, 0]);
      }
      // Its two ends, each facing on along the line.
      const last = pts.length - 1;
      for (const [i, j] of [[0, 1], [last, last - 1]]) g.quad(at(...edges[i][0], foot[i]), at(...edges[i][1], foot[i]), at(...edges[i][1], top[i]), at(...edges[i][0], top[i]), stone, way(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
    }
    // The fences: a post at every corner and between, two rails post to post.
    for (const { posts } of fenceRuns(L)) {
      for (let i = 0; i < posts.length; i++) {
        const [x, z] = posts[i];
        g.bar(up(x, z, -0.3), up(x, z, BOUNDARY.fenceHeight), 0.1, 0.1, WHITE);
        if (!i) continue;
        const [px, pz] = posts[i - 1];
        for (const r of BOUNDARY.rails) g.bar(up(px, pz, r), up(x, z, r), 0.04, 0.09, WHITE);
      }
    }
    // And the out of bounds' white stakes.
    for (const [x, z] of boundaryStakes(L, this.hole.path)) g.bar(up(x, z, -0.3), up(x, z, BOUNDARY.stake), 0.08, 0.08, WHITE);
    if (!g.pos.length) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(g.pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(g.col, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, boundaryMaterial());
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    this.world.add(mesh);
  }
}
