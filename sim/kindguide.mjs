// The hole editor's guide to the kinds of tree planted by hand (the owner,
// 10 November 2026: "guide/restrict the user if too many different types
// are tried to be put down or interlaid between each other"). Trees grow
// in groups of a kind, a hole a few kinds (sim/treepalette.mjs), and a tree
// planted, moved or changed to a kind of its own is held to the same:
//   - A hole grows at most KIND_GUIDE.most kinds: a kind that would be one
//     more isn't planted (plant one of those it has, or as they grow).
//   - Where two kinds already mix (KIND_GUIDE.near metres round the spot),
//     a third in among them isn't planted there - the rest of a brushful
//     are.
//   - In a stand of one other kind (KIND_GUIDE.stand of it or more round
//     it) it's planted, with a word that a stand tends to be one kind.
// A tree as it grows (no kind of its own) takes the kind of the stand it's
// in, so it's always fine; a dead tree's doesn't count.
// Pure, for the tests.

import { KIND, KINDS, KIND_NAMES } from "./treeshapes.mjs";

// most: the most kinds a hole may grow (one more than a hole grows by
// itself: treepalette.mjs PALETTE.most); near: how far round a spot its
// neighbours count (metres); mixed: how many other kinds there make a mix;
// stand: how many of one other kind there make a stand.
export const KIND_GUIDE = { most: 5, near: 12, mixed: 2, stand: 4 };

const counts = (k) => Number.isInteger(k) && k !== KIND.snag && KINDS[k] != null;
const nameOf = (k) => KIND_NAMES[KINDS[k]].toLowerCase();
const plural = (k) => {
  const n = nameOf(k);
  return /(ch|sh|s)$/.test(n) ? `${n}es` : n.endsWith("y") ? `${n.slice(0, -1)}ies` : `${n}s`;
};
const listed = (names) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);

// The kinds a hole grows (kinds: what each of its trees grows as, as
// courseplay.mjs grownKinds; skip: indexes not to count), commonest first.
export function holeKindList(kinds, skip = null) {
  const n = new Map();
  kinds.forEach((k, i) => {
    if (!skip?.has(i) && counts(k)) n.set(k, (n.get(k) ?? 0) + 1);
  });
  return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([k]) => k);
}

// Whether trees of `kind` may go at `spots` ([[x, z], ...]) on a hole whose
// trees are `trees` and grow as `kinds` (skip: indexes of trees being
// moved or changed, which don't count). kind null: as they grow - fine.
// Returns { keep: [bool per spot], why: why some aren't (or null), note: a
// word on the ones that are (or null) }.
export function kindAdvice(trees, kinds, spots, kind, skip = null) {
  const all = { keep: spots.map(() => true), why: null, note: null };
  if (!counts(kind)) return all;
  const has = holeKindList(kinds, skip);
  if (!has.includes(kind) && has.length >= KIND_GUIDE.most) {
    return {
      keep: spots.map(() => false),
      why: `This hole grows ${has.length} kinds of tree already (${listed(has.map(nameOf))}) - as many as a hole takes. Plant one of those, or as they grow here.`,
      note: null,
    };
  }
  const keep = [];
  let why = null;
  let stand = null;
  for (const [x, z] of spots) {
    const near = new Map();
    trees.forEach((t, i) => {
      if (skip?.has(i) || !counts(kinds[i])) return;
      if (Math.hypot(t[0] - x, t[1] - z) <= KIND_GUIDE.near) near.set(kinds[i], (near.get(kinds[i]) ?? 0) + 1);
    });
    if (near.has(kind)) {
      keep.push(true);
      continue;
    }
    const round = [...near.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    if (round.length >= KIND_GUIDE.mixed) {
      keep.push(false);
      why ??= `The ${plural(round[0][0])} and ${plural(round[1][0])} there grow mixed already: a ${nameOf(kind)} in among them as well doesn't grow that way. Plant a ${nameOf(round[0][0])} there, or the ${nameOf(kind)} where it can make a group of its own.`;
      continue;
    }
    keep.push(true);
    if (round.length === 1 && round[0][1] >= KIND_GUIDE.stand) stand ??= round[0][0];
  }
  const note = stand != null && keep.some(Boolean) ? `In among a stand of ${plural(stand)}: trees mostly grow in groups of a kind - plant ${plural(stand)} there to keep it one.` : null;
  return { keep, why, note };
}
