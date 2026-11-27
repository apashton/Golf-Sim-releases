// Bushes on a hole: low, rounded shrubs where they'd grow on a course -
// along the edge of the woods, in front of the trees, and in clumps out in
// the deep rough - never near the fairway, a green, a tee, sand, water or a
// path. Worked out from the hole (not kept in the course file), the same
// every time; courseplay.mjs prepareHole adds them to the hole's trees, so
// they're drawn (look/trees.js, kind 5), a ball in the air meets them
// (treehits.mjs), and a ball that finishes in one plays from the trees.
//
// Hole frame (sim/course.mjs): the tee at (0, 0), x down the hole, z to the
// right, metres. lieAt(x, z): the hole's surface. Pure, for the tests.

import { seeded } from "./course.mjs";
import { KIND } from "./treeshapes.mjs";

// Where a bush may stand, and what it's kept clear of (metres).
export const BUSHY = new Set(["rough", "deep", "trees"]);
const CLEAR = { fairway: 5, semi: 3, green: 9, fringe: 8, tee: 6, bunker: 3, greenside: 3, waste: 2, water: 2.5, path: 2 };
export const MAX_BUSHES = 40;
// How far out a bush's leaves reach, a unit of its scale (treeshapes.mjs
// bushShape: about 1.8 m).
export const BUSH_REACH = 1.8;

// (The rings looked round, nearest first: each clearance once.)
const RINGS = [...new Set(Object.values(CLEAR))].sort((a, b) => a - b);

function clearOf(lieAt, x, z, pad) {
  if (!BUSHY.has(lieAt(x, z))) return false;
  for (const base of RINGS) {
    const r = base + pad;
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const lie = lieAt(x + Math.cos(a) * r, z + Math.sin(a) * r);
      if (CLEAR[lie] != null && CLEAR[lie] + pad >= r) return false;
    }
  }
  return true;
}

// Whether a bush of scale s may stand at (x, z), as bushesFor places one:
// on ground a bush grows on, clear of what it's kept clear of, and not
// right by one of the trees. (A bush kept from before, sim/treelock.mjs,
// is kept only where it still may.)
export function bushFits(lieAt, trees, x, z, s) {
  return !trees.some((t) => Math.abs(t[0] - x) < 2.5 && Math.abs(t[1] - z) < 2.5 && Math.hypot(t[0] - x, t[1] - z) < 2) && clearOf(lieAt, x, z, s * BUSH_REACH);
}

// A hole's bushes: [x, z, scale, 5 (a bush), 1] each, as a layout keeps a
// tree, at most MAX_BUSHES.
export function bushesFor(layout, lieAt, seed = 1) {
  const rand = seeded((seed ^ 0xb054b) >>> 0 || 1);
  const g = layout.green;
  const len = Math.max(80, (g?.x ?? 150) + 40);
  const out = [];
  const trees = layout.trees ?? [];
  const room = (x, z, s) =>
    x > -20 &&
    x < len &&
    Math.abs(z) < 70 &&
    !out.some((b) => Math.hypot(b[0] - x, b[1] - z) < (b[2] + s) * BUSH_REACH * 0.8) &&
    bushFits(lieAt, trees, x, z, s);
  const add = (x, z) => {
    const s = 0.7 + rand() * 0.6;
    if (out.length < MAX_BUSHES && room(x, z, s)) out.push([r2(x), r2(z), r2(s), KIND.bush, 1]);
  };
  // In front of the woods: now and then a bush a few metres out from a
  // tree, towards the middle of the hole.
  const edge = trees.filter((t) => t[0] > -20 && t[0] < len && Math.abs(t[1]) < 70);
  for (const t of edge) {
    if (rand() > 0.16) continue;
    const toward = -Math.sign(t[1] || 1);
    const d = 2.5 + rand() * 3;
    add(t[0] + (rand() - 0.5) * 4, t[1] + toward * d);
  }
  // Clumps out in the rough: a few bushes together.
  for (let c = 0; c < 8 && out.length < MAX_BUSHES; c++) {
    const x = -10 + rand() * (len + 10);
    const z = (rand() < 0.5 ? -1 : 1) * (18 + rand() * 45);
    if (!BUSHY.has(lieAt(x, z))) continue;
    const n = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const d = i === 0 ? 0 : 2 + rand() * 2.5;
      add(x + Math.cos(a) * d, z + Math.sin(a) * d);
    }
  }
  return out;
}

const r2 = (v) => Math.round(v * 100) / 100;
