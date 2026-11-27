// A big crown's shell and shade (the owner, 26 November 2026, on taking the
// great oak's lesson to the other trees: "the biggest the tree the more we
// just move the more visable clusters to the outside. And we could use cheap
// planes inside the tree to help feel depth but without using tons of
// resource that isn't ever seen").
//
// A great tree's crown is many lumps of leaves of its kind's own size, and
// most of a big crown's lumps are inside it: a lump hemmed in by the others
// is never seen, but drawn as any other it costs its leaf cards, its shoot
// ends, its close-up leaves and its solid crown. So a shape built as a shell
// (its `shell`: sim/treeshapes.mjs) is drawn (look/trees.js) as:
//   - its seen lumps - those with enough of their surface looking out of the
//     crown - as any lump is, but for their leaf cards that sit inside a
//     neighbour, which no one would see (cardBuried);
//   - its heart - the rest - as a few cheap planes each (SHELL.planes): big
//     crossed cards of its leaves, darkened, so through a gap between the
//     masses the eye meets leaves deep in shade, never sky, and from under
//     the crown it reads as a canopy, not a hollow.
// A ball meets every lump as it always did (sim/treehits.mjs): what's drawn
// as shade is leaves still.
//
// Model units, as the shapes'. Pure, for the tests.

// samples: points looked out from on each lump; cover: a neighbour hides
// what's within this of its radius (its solid crown is 0.82 of it, its leaf
// cards from 0.85 out: look/trees.js TUCK, cardsOn); seen: a lump with less
// than this share of its surface looking out of the crown is its heart's;
// planes: how many crossed cards a heart lump wears, each `size` of its
// radius across (a seen lump's are about 1.35) in `tiles` by `tiles`
// cards (more, so none is over `tile` metres across), and `shade` as
// light;
// buried: a seen lump's card goes when its middle is within this of a
// neighbour's radius.
export const SHELL = { samples: 64, cover: 0.85, seen: 0.12, planes: 3, size: 2.1, tiles: 2, tile: 3, shade: 0.55, buried: 0.8 };

// Even points on a sphere (Fibonacci), as unit vectors.
const dirs = new Map();
function directions(n) {
  if (!dirs.has(n)) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const y = 1 - (2 * (i + 0.5)) / n;
      const r = Math.sqrt(1 - y * y);
      const a = i * 2.399963229728653;
      out.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
    dirs.set(n, out);
  }
  return dirs.get(n);
}

// Whether the ray from p along d meets lump s (within `cover` of its radius).
function meets(p, d, s, cover) {
  const R = s[3] * cover;
  const ox = p[0] - s[0];
  const oy = p[1] - s[1];
  const oz = p[2] - s[2];
  const b = ox * d[0] + oy * d[1] + oz * d[2];
  const c = ox * ox + oy * oy + oz * oz - R * R;
  if (c <= 0) return true;
  return b < 0 && b * b - c > 0;
}

// How much of each lump looks out of the crown: of the points on its
// surface, the share from which a line straight out meets no other lump.
export function seenShares(spheres, S = SHELL) {
  const D = directions(S.samples);
  return spheres.map((l, i) => {
    let seen = 0;
    for (const d of D) {
      const p = [l[0] + d[0] * l[3], l[1] + d[1] * l[3], l[2] + d[2] * l[3]];
      let hid = false;
      for (let j = 0; j < spheres.length && !hid; j++) if (j !== i && meets(p, d, spheres[j], S.cover)) hid = true;
      if (!hid) seen++;
    }
    return seen / D.length;
  });
}

// A shell's lumps split: { seen, heart } - each a list of the lumps'
// indices, in order.
export function crownShell(spheres, S = SHELL) {
  const shares = seenShares(spheres, S);
  const seen = [];
  const heart = [];
  shares.forEach((v, i) => (v >= S.seen ? seen : heart).push(i));
  return { seen, heart, shares };
}

// Whether a point (a leaf card's middle) is inside a lump other than its own
// (`own`, an index), deep enough that its leaves hide it.
export function cardBuried(spheres, own, x, y, z, S = SHELL) {
  for (let j = 0; j < spheres.length; j++) {
    if (j === own) continue;
    const s = spheres[j];
    const R = s[3] * S.buried;
    const dx = x - s[0];
    const dy = y - s[1];
    const dz = z - s[2];
    if (dx * dx + dy * dy + dz * dz < R * R) return true;
  }
  return false;
}
