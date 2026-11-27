// A far tree's leaves by share (the owner, 21 November 2026: "Build it
// please. Enable it as an option."). On the higher settings the trees of
// the hole in play are drawn close up wherever they stand (sim/treelod.mjs
// HOLE_TOP: the owner, 15 October, of trees along the fairway that "don't
// load into a better version"), so a tree 300 m off costs what one at 20 m
// does - some 2,000 leaf cards - and from a tee the leaf cards were more
// than a quarter of the picture's triangles. The close-up tree and the
// usual one are different shapes, so there was nothing to swap to that
// wouldn't show.
//
// So one shape, drawn in part. A crown's leaf cards are put in an order any
// first part of which is spread evenly over the whole of it (leafOrder), and
// a tree is drawn with only the first `share` of them for how far it is
// from the eye - all of them near, a third far off - each of those drawn
// grown by one over the square root of that share, so the crown is as full
// (leafGrow). The cards just past its share shrink to nothing over a little
// of the list (leafKeep), so as the camera comes to a tree its leaves fill
// in a few at a time, each from nothing: no version is swapped for another,
// and nothing pops. With all of them it's the close-up tree exactly as it
// was; with a third, each some 1.7 times the size, much as the usual tree.
//
// The shrinking and growing are the leaf cards' vertex shader's (look/
// leafshare.js), from the eye and where the tree stands, every frame; how
// many of a tree's cards are sent to be drawn at all is counted again each
// time the eye has moved `step` metres (leafUnits), for where it could be by
// the next count - always at least those the shader shows. Shadows are
// drawn with every card, as they were.
//
// Pure: the sums, and the order. look/leafshare.js is the mesh's side.

// full: every card within this many metres of the eye; least: the fewest
//   from this far on; share: that fewest, of them all;
// fade: how much of the list (0 - 1) the cards past a tree's share shrink
//   away over;
// step: the eye moves this far (m) between counts, and `give` more is
//   allowed for;
// reach: the furthest a card's corner is from its own middle (m): the scale
//   its corners' places are kept at (look/leafshare.js).
export const LEAF_SHARE = { full: 60, least: 250, share: 0.3, fade: 0.06, step: 2, give: 1, reach: 4 };

const smooth01 = (t) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

// The share of its leaf cards a tree `d` metres from the eye is drawn with.
export function leafShare(d, k = LEAF_SHARE) {
  return 1 - (1 - k.share) * smooth01((d - k.full) / Math.max(1, k.least - k.full));
}

// How much bigger each card of a tree drawn with `share` of them is, each
// way: the same leaf over the crown in all. (With the cards still
// shrinking away past its share counted in: half the fade's.)
export function leafGrow(share, k = LEAF_SHARE) {
  return 1 / Math.sqrt(Math.min(1, share + k.fade / 2));
}

// How much of its own size (0 - 1) a card `rank` of the way down the list
// (0 the first, under 1 the last) is drawn at, on a tree drawn with `share`:
// whole within its share, shrinking to nothing over the fade past it.
export function leafKeep(rank, share, k = LEAF_SHARE) {
  return 1 - smooth01((rank - share) / k.fade);
}

// How many of a tree's `units` (cards, in their order) are sent to be drawn
// for an eye that was `d` metres off when counted: every one the shader
// could show before the next count (the eye `step` and `give` nearer), and
// one over.
export function leafUnits(d, units, k = LEAF_SHARE) {
  const share = leafShare(Math.max(0, d - k.step - k.give), k);
  return Math.min(units, Math.floor((share + k.fade) * units) + 2);
}

// The order a crown's cards are drawn in: `centres` their middles ([x, y, z]
// each). Any first part of it is spread evenly over the crown: the cards
// sorted along a path that keeps neighbours together (each middle's place in
// a grid, its three numbers' bits woven into one), then taken from that
// line as evenly as can be at every length - its start, its middle, its
// quarters, its eighths (each place's number with its bits turned end for
// end). Returns the cards' numbers, in order.
export function leafOrder(centres) {
  const n = centres.length;
  if (n <= 2) return Array.from({ length: n }, (_, i) => i);
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const c of centres) {
    for (let a = 0; a < 3; a++) {
      lo[a] = Math.min(lo[a], c[a]);
      hi[a] = Math.max(hi[a], c[a]);
    }
  }
  const weave = (v) => {
    // (Ten bits, two noughts between each.)
    let x = v & 1023;
    x = (x | (x << 16)) & 0x030000ff;
    x = (x | (x << 8)) & 0x0300f00f;
    x = (x | (x << 4)) & 0x030c30c3;
    x = (x | (x << 2)) & 0x09249249;
    return x;
  };
  const code = centres.map((c) => {
    const q = [0, 1, 2].map((a) => Math.min(1023, Math.floor(((c[a] - lo[a]) / (hi[a] - lo[a] || 1)) * 1024)));
    return weave(q[0]) + weave(q[1]) * 2 + weave(q[2]) * 4;
  });
  const line = Array.from({ length: n }, (_, i) => i).sort((a, b) => code[a] - code[b] || a - b);
  let bits = 0;
  while (1 << bits < n) bits++;
  const out = [];
  for (let i = 0; i < 1 << bits; i++) {
    let r = 0;
    for (let b = 0; b < bits; b++) if (i & (1 << b)) r |= 1 << (bits - 1 - b);
    if (r < n) out.push(line[r]);
  }
  return out;
}

// A shape's cards, told apart: `index` its triangles' corners (three a
// triangle), `count` how many corners it has - corners joined by a triangle
// are one card's (a card shares none with the next). Returns { units: how
// many, unitOf: each corner's card (-1 if no triangle uses it), triangles:
// each card's triangles (their place in `index`), in the order they came }.
export function leafCards(index, count) {
  const parent = new Int32Array(count);
  for (let i = 0; i < count; i++) parent[i] = i;
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const join = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };
  for (let k = 0; k + 2 < index.length; k += 3) {
    join(index[k], index[k + 1]);
    join(index[k], index[k + 2]);
  }
  const unitAt = new Int32Array(count).fill(-1);
  const triangles = [];
  for (let k = 0; k + 2 < index.length; k += 3) {
    const r = find(index[k]);
    if (unitAt[r] < 0) {
      unitAt[r] = triangles.length;
      triangles.push([]);
    }
    triangles[unitAt[r]].push(k);
  }
  const unitOf = new Int32Array(count);
  for (let i = 0; i < count; i++) unitOf[i] = unitAt[find(i)];
  return { units: triangles.length, unitOf, triangles };
}
