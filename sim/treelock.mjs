// Each hole's trees kept as they first grew (the owner, 27 October 2026:
// "ensure that the placing of a tree [and] the design of each tree is
// locked ... So that courses don't look a different on each load").
//
// A hole's trees are worked out from what its course file keeps - its
// made trees' spots and sizes, its edits - by code that changes from
// version to version: which are kept off the other holes, thinned or grown
// in stands or by water (courseplay.mjs grownTrees), each one's kind,
// shape, size, turn and lean (treehits.mjs treeForm), the bushes
// (bushes.mjs) and the backdrop behind the green (country.mjs
// backdropTrees). The first time a hole is made ready, all of that is kept
// as it came out - a lock - and from then on the hole is made from its
// lock: every tree where it stood, as it was, whatever the code would make
// of it now. (How each is drawn - its leaves, its boughs - still comes from
// this version: a tree keeps its design, not its look.)
//
// A lock: { v: TREE_LOCK_V, r, n, e, trees, bushes, backdrop }
//   r         the made trees its course file had then (treesKey): made
//             again since - its trees from LiDAR, the hole remade - and the
//             lock's let go (lockFor), the hole grown afresh
//   n, e      how many edits the hole had then, and what they were
//             (editsKey): a hole edited since is made from its lock with
//             the edits since laid on (lockedTrees)
//   trees     the hole's trees as they grew: each [x, z, size, kind, spread,
//             thickness, shape, by water, stand, design] (keptTree)
//   bushes    its bushes, the same way
//   backdrop  the trees behind its green (course/holebuild.js), or null
//             until the hole's been built
// Kept by the server beside the course (server/courses.mjs: <id>.trees.json),
// handed out in each hole's layout as treeLock. Pure, for the tests.

import { designOf, treeForm, designed } from "./treehits.mjs";

// Which way locks are kept: a lock of another is left alone, and the hole
// grows as it would without one (and is locked afresh).
export const TREE_LOCK_V = 1;

// A tree as a lock keeps it: what it was made from as JSON keeps it (null
// for nothing, its size and spread as numbers) and its design (treehits.mjs
// designOf) - hand: planted or moved by hand.
export function keptTree(t, hand = false) {
  const made = [t[0], t[1], t[2] ?? 1, t[3] ?? null, t[4] ?? 1, t[5] ?? null, t[6] ?? null, t[7] ?? null, t[8] ?? null];
  return [...made, designed(t) ? t[9] : designOf(made, treeForm(t), hand)];
}

// A tree's spot and what it was made from, as a key: the same tree, as
// two lists have it.
export const keyOf = (t) => `${t[0]},${t[1]},${t[2] ?? 1},${t[3] ?? ""},${t[4] ?? 1},${t[5] ?? ""},${t[6] ?? ""},${t[7] ?? ""},${t[8] ?? ""}`;

// A list (a hole's edits, its made trees) as a few characters: how long
// and a hash of it all.
function listKey(list = []) {
  const text = JSON.stringify(list ?? []);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return `${list?.length ?? 0}:${(h >>> 0).toString(36)}`;
}
export const editsKey = (edits = []) => listKey(edits);
// (Worked out once for each list of trees.)
const treeKeys = new WeakMap();
export function treesKey(trees = []) {
  if (!Array.isArray(trees)) return listKey([]);
  if (!treeKeys.has(trees)) treeKeys.set(trees, listKey(trees));
  return treeKeys.get(trees);
}

// A lock, if it's one this version keeps; else null.
export function validLock(lock) {
  return lock && typeof lock === "object" && lock.v === TREE_LOCK_V && typeof lock.r === "string" && Number.isInteger(lock.n) && typeof lock.e === "string" && Array.isArray(lock.trees) && Array.isArray(lock.bushes) ? lock : null;
}

// A course file's hole layout's lock, if it's still for the made trees the
// layout has (r); else null.
export function lockFor(layout) {
  const lock = validLock(layout?.treeLock);
  return lock && lock.r === treesKey(layout.trees ?? []) ? lock : null;
}

// A lock, unless the hole's been told to grow its trees afresh since it
// was made (the hole editor's Grow afresh: an edit, REGROW, among those
// after the lock's n - so Undo puts the kept trees back until the hole is
// played and kept again, and a lock kept from before it, saved over the
// new one, is let go again). edits: the hole's.
export const REGROW = "tg";
export function liveLock(lock, edits = []) {
  return lock && !(edits ?? []).slice(lock.n).some((e) => e?.k === REGROW) ? lock : null;
}

// A course file's hole layout without a lock that's no longer for it
// (lockFor) - the hole's trees then grow afresh.
export function keptLayout(layout) {
  return layout?.treeLock && !lockFor(layout) ? { ...layout, treeLock: undefined } : layout;
}

// A hole's lock, now: its trees and bushes (each already keptTree's), and
// the edits they grew with. (Its r, from the course file's layout, is
// given it once it's known which hole it is: course/holebuild.js.)
export function makeLock({ edits = [], trees = [], bushes = [], backdrop = null, made = null }) {
  return { v: TREE_LOCK_V, r: made ? treesKey(made) : "", n: edits?.length ?? 0, e: editsKey(edits), trees, bushes, backdrop };
}

// A hole's trees from its lock, with the edits it has now
// (`edits`: its layout's). grow(edits): the hole's trees as they'd grow
// with those edits by this version (courseplay.mjs grownTrees); hand(t):
// whether one of them was planted or moved by hand.
// Returns { trees, exact } - exact: the lock as it is, nothing since.
//   - The same edits: the lock's trees.
//   - Edits added since: the lock's trees, less those the new edits took
//     away and with those they brought - both as this version has them
//     (what grows with all of them, against with those the lock had).
//   - Changed some other way (one undone, say): the trees as they grow now,
//     each that grows just where one was kept, as it was made, keeping
//     that one's design.
export function lockedTrees(lock, edits = [], grow, hand = () => false) {
  const list = edits ?? [];
  if (lock.n === list.length && lock.e === editsKey(list)) return { trees: lock.trees, exact: true };
  const now = grow(list);
  if (lock.n < list.length && lock.e === editsKey(list.slice(0, lock.n))) {
    const before = counted(grow(list.slice(0, lock.n)));
    const after = counted(now);
    const gone = less(before, after);
    const came = less(after, before);
    const trees = lock.trees.filter((t) => !take(gone, keyOf(t)));
    for (const t of now) if (take(came, keyOf(t))) trees.push(keptTree(t, hand(t)));
    return { trees, exact: false };
  }
  const kept = new Map();
  for (const t of lock.trees) {
    const k = keyOf(t);
    if (kept.has(k)) kept.get(k).push(t);
    else kept.set(k, [t]);
  }
  return { trees: now.map((t) => kept.get(keyOf(t))?.shift() ?? keptTree(t, hand(t))), exact: false };
}

// How many of each tree (keyOf) a list has.
function counted(list) {
  const m = new Map();
  for (const t of list) {
    const k = keyOf(t);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

// The trees counted in a and not in b (as many as a has more of each).
function less(a, b) {
  const m = new Map();
  for (const [k, n] of a) {
    const more = n - (b.get(k) ?? 0);
    if (more > 0) m.set(k, more);
  }
  return m;
}

// One of key k taken from the counts: whether there was one.
function take(m, k) {
  const n = m.get(k) ?? 0;
  if (n <= 0) return false;
  m.set(k, n - 1);
  return true;
}

// Whether a lock's tree was planted or moved by hand.
export const handKept = (t) => t?.[9]?.[13] === 1;
