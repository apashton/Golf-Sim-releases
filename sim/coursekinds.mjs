// Every kind of tree a course grows (the owner, 12 November 2026: "pickup
// the trees saving plan and execute"): the kinds look/trees.js puts on its
// shelves of shapes as the course loads (wantTreeKinds), so a kind no hole
// of the course grows takes no memory - a links course none of the
// beeches, cedars and hollies a parkland grows. Worked out from the course
// as it's stored, before any hole's trees grow: each hole's palette
// (sim/treepalette.mjs), the trees with a kind of their own (from LiDAR,
// planted or changed by hand), the trees a hole keeps as they first grew
// (sim/treelock.mjs), its signature tree (sim/signaturetree.mjs) - and the
// kinds any course may grow whatever its palettes (ANY_COURSE). A tree of a
// kind it misses is still drawn: look/trees.js puts it on the shelves then.
// Pure, for the tests.

import { KIND, KINDS } from "./treeshapes.mjs";
import { treeForm } from "./treehits.mjs";
import { coursePalettes } from "./treepalette.mjs";
import { signatureTree } from "./signaturetree.mjs";
import { validLock } from "./treelock.mjs";

// The kinds any course may grow whatever its palettes: a tree no stand
// reaches (the backdrop behind a green: sim/treehits.mjs treeForm - a pine,
// a broadleaf, a birch or a poplar, a willow by the water), a dead tree, a
// bush.
export const ANY_COURSE = Object.freeze([KIND.pine, KIND.leaf, KIND.birch, KIND.poplar, KIND.willow, KIND.snag, KIND.bush]);

// Kept for the course as it is (a course's holes are replaced when they
// change, never changed where they are).
const known = new WeakMap();

// The course's kinds, KINDS' indexes in order.
export function courseTreeKinds(course) {
  if (!course?.holes?.length) return [...ANY_COURSE].sort((a, b) => a - b);
  const kept = known.get(course);
  if (kept && kept.holes === course.holes) return kept.list;
  const out = new Set(ANY_COURSE);
  const add = (k) => Number.isInteger(k) && KINDS[k] != null && out.add(k);
  const palettes = coursePalettes(course);
  course.holes.forEach((h, i) => {
    const L = h?.layout;
    if (!L) return;
    // (A links hole grows none: its palette's kinds only where it has
    // trees.)
    if (!L.links || L.trees?.length) for (const { kind } of palettes[i] ?? []) add(kind);
    for (const t of L.trees ?? []) if (Array.isArray(t)) add(t[3]);
    for (const e of L.edits ?? []) if (e?.k === "t+" || e?.k === "tk") add(e.kind);
    const lock = validLock(L.treeLock);
    for (const t of [...(lock?.trees ?? []), ...(lock?.bushes ?? []), ...(lock?.backdrop ?? [])]) if (Array.isArray(t)) add(treeForm(t).kind);
    const sig = signatureTree(L);
    if (sig) add(sig[3]);
  });
  const list = [...out].sort((a, b) => a - b);
  known.set(course, { holes: course.holes, list });
  return list;
}
