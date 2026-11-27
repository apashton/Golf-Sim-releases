// A terrace beside a building (sim/terraces.mjs): its paving on a level -
// flags with their joints, a wall of the same stone down to the ground
// round it - a rail along its open sides, and tables and chairs, some
// under a parasol. One mesh for everything on a hole.

import * as THREE from "three";
import { Kit } from "./club.js";
import { PALETTE } from "./palette.js";
import { TERRACE, terraceLevel, terracesOf } from "../sim/terraces.mjs";

const P = PALETTE;
// Its pieces' sizes (metres) and colours.
export const TERRACE_LOOK = {
  // The joints between its flags: this far apart, this wide.
  flag: 1.25,
  joint: 0.05,
  jointColour: "#8d8676",
  // How far its wall goes down past the lowest ground at its foot.
  sunk: 0.8,
  // The rail: posts this high and about this far apart, two rails.
  post: 1.0,
  posts: 1.6,
  railColour: "#33342f",
  // A table: its top across and how high; a chair's seat.
  table: 0.55,
  tableHigh: 0.74,
  chairs: 4,
  furniture: "#5d4a37",
  cushion: "#cfc8b6",
  // A parasol: its pole's height, its canopy's reach and depth.
  pole: 2.5,
  canopy: 1.55,
  canopyDeep: 0.55,
};

// The spans of a line across the outline: where y = `at` (or x = `at`,
// `across`) runs inside `ring` ([[a, b], ...] in the other coordinate).
function spans(ring, at, across) {
  const cuts = [];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [p, q] = across ? [ring[i], ring[j]] : [[ring[i][1], ring[i][0]], [ring[j][1], ring[j][0]]];
    // (p, q as [along, other] with the line at other = at.)
    if (p[1] > at !== q[1] > at) cuts.push(p[0] + ((at - p[1]) * (q[0] - p[0])) / (q[1] - p[1]));
  }
  cuts.sort((a, b) => a - b);
  const out = [];
  for (let k = 0; k + 1 < cuts.length; k += 2) out.push([cuts[k], cuts[k + 1]]);
  return out;
}

// A hole's terraces: groundAt(x, z) the ground's height (hole frame). A
// mesh, or null for none.
export function makeTerraces(L, groundAt) {
  const terraces = terracesOf(L);
  if (!terraces.length) return null;
  const T = TERRACE_LOOK;
  const k = new Kit();
  k.place(0, 0, 0, 0);
  for (const t of terraces) {
    const level = terraceLevel(t.poly, groundAt);
    if (level == null) continue;
    // Hole frame -> world: (x, z) -> (z, -x).
    const ring = t.poly.map(([x, z]) => [z, -x]);
    const foot = Math.min(...t.poly.map(([x, z]) => groundAt(x, z))) - T.sunk;
    // Its paving, and the wall round it down to the ground.
    const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
    const slab = new THREE.ExtrudeGeometry(shape, { depth: level - foot, bevelEnabled: false });
    // (Extruded along +z from the shape's plane: laid down, its top at the level.)
    slab.rotateX(-Math.PI / 2);
    slab.translate(0, foot, 0);
    k.add(slab, P.flagstone);
    // The joints between its flags, both ways.
    const xs = ring.map((p) => p[0]);
    const zs = ring.map((p) => p[1]);
    const y = level + 0.004;
    for (let z = Math.ceil(Math.min(...zs) / T.flag) * T.flag; z < Math.max(...zs); z += T.flag) {
      for (const [a, b] of spans(ring, z, true)) if (b - a > 0.3) k.box(b - a, 0.008, T.joint, T.jointColour, { at: [(a + b) / 2, y, z] });
    }
    for (let x = Math.ceil(Math.min(...xs) / T.flag) * T.flag; x < Math.max(...xs); x += T.flag) {
      for (const [a, b] of spans(ring, x, false)) if (b - a > 0.3) k.box(T.joint, 0.008, b - a, T.jointColour, { at: [x, y, (a + b) / 2] });
    }
    // Its rail along each open run: posts, a top rail and one halfway.
    for (const run of t.rails ?? []) {
      for (let i = 1; i < run.length; i++) {
        const [ax, az] = [run[i - 1][1], -run[i - 1][0]];
        const [bx, bz] = [run[i][1], -run[i][0]];
        const len = Math.hypot(bx - ax, bz - az);
        if (len < 0.2) continue;
        const turn = Math.atan2(-(bz - az), bx - ax);
        const mid = [(ax + bx) / 2, 0, (az + bz) / 2];
        for (const h of [T.post, T.post * 0.52]) k.box(len, 0.06, 0.05, T.railColour, { at: [mid[0], level + h, mid[2]], turn });
        const posts = Math.max(1, Math.round(len / T.posts));
        for (let q = 0; q <= posts; q++) {
          if (q === 0 && i > 1) continue;
          k.box(0.07, T.post + 0.04, 0.07, T.railColour, { at: [ax + ((bx - ax) * q) / posts, level + T.post / 2, az + ((bz - az) * q) / posts], turn });
        }
      }
    }
    // Its tables: a round top on a foot, chairs set round it, some under
    // a parasol.
    const parasol = /^#[0-9a-f]{6}$/i.test(t.parasol ?? "") ? t.parasol : TERRACE.parasol;
    for (const [x, z, turn, shade] of t.tables ?? []) {
      k.place(z, level, -x, turn);
      k.cyl(T.table, T.table, 0.04, 14, T.furniture, { at: [0, T.tableHigh, 0] });
      k.cyl(0.05, 0.05, T.tableHigh, 6, T.furniture, { at: [0, T.tableHigh / 2, 0] });
      k.cyl(0.28, 0.3, 0.04, 8, T.furniture, { at: [0, 0.02, 0] });
      for (let c = 0; c < T.chairs; c++) {
        const a = (c / T.chairs) * Math.PI * 2 + 0.4;
        const [cx, cz] = [Math.sin(a) * (T.table + 0.42), Math.cos(a) * (T.table + 0.42)];
        // (Facing the table: its back on the far side.)
        // (A seat, its back, and a frame down each side - open under it.)
        k.box(0.44, 0.05, 0.44, T.cushion, { at: [cx, 0.45, cz], turn: a });
        k.box(0.44, 0.42, 0.04, T.furniture, { at: [cx + Math.sin(a) * 0.21, 0.68, cz + Math.cos(a) * 0.21], turn: a });
        for (const e of [1, -1]) k.box(0.04, 0.43, 0.44, T.furniture, { at: [cx + Math.cos(a) * 0.21 * e, 0.215, cz - Math.sin(a) * 0.21 * e], turn: a });
      }
      if (shade) {
        k.cyl(0.025, 0.025, T.pole, 6, P.paint, { at: [0, T.pole / 2, 0] });
        k.cyl(0.06, T.canopy, T.canopyDeep, 8, parasol, { at: [0, T.pole - T.canopyDeep / 2 + 0.05, 0] });
      }
    }
    k.place(0, 0, 0, 0);
  }
  const mesh = k.mesh();
  if (!mesh) return null;
  mesh.name = "terraces";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
