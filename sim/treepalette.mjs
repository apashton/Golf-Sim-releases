// Which kinds of tree a course grows, hole by hole, and where on a hole
// each grows (the owner, 10 November 2026: "tree types would tend to grow
// in patches, and not necessarily have 1 of every tree type next to each
// other ... some tree types carry over each hole and introduce certain ones
// on next holes ... guide/restrict the user if too many different types are
// tried to be put down or interlaid between each other").
//
// Before, a designed hole's trees took their kind one by one: as likely as
// not a pine or a broadleaf, now and then a birch or a poplar, side by side
// - with stands of the newer kinds laid over them (treehits.mjs
// treeStands). Now, on a course:
//   - A hole's kinds (holeKinds): each kind's weight on the course drifts
//     slowly from hole to hole (a value noise along the round, PALETTE.drift
//     holes a wave), times how much the holes round it - their characters
//     (sim/country.mjs: parkland, woodland, heath, lakeside, links), each
//     rolled for its own hole, blended over PALETTE.blend holes either side
//     - favour it (KIND_MIX). The hole takes its strongest, at most
//     PALETTE.most and those within PALETTE.floor of the strongest, at
//     least PALETTE.least: most of one hole's kinds carry on to the next,
//     and now and then one fades out and another comes in.
//   - Where each grows on the hole (palettedTrees): every kind of the hole's
//     a smooth noise over the course's own ground (the course's metres, so
//     a stand runs on across into the next hole where it has that kind too),
//     its stands about STAND_SIZE across; each tree takes the kind whose
//     noise, times its weight, is highest there - in patches, a stand of
//     beeches beside a stand of oaks, not one of each side by side. A tree
//     by the water that grows as a willow stays one, and now and then one
//     has died (STAND.snags, as before).
// Only a tree with no kind of its own (from LiDAR, planted by hand: its
// own), only on a course (the Challenges' holes grow as they did), and a
// hole's trees once kept (sim/treelock.mjs) stay as they first grew.
// Pure, for the tests.

import { KIND, KINDS } from "./treeshapes.mjs";
import { treeForm, treeStands, hashNumbers, STAND } from "./treehits.mjs";
import { characterFor, courseHoleSeed, nameSeed, valueNoise, hash2, CHARACTERS } from "./country.mjs";
import { seedName } from "./course.mjs";
import { coursePlaces, toCourse } from "./imaginary.mjs";

// most: the most kinds a hole grows; least: the fewest; floor: a kind
// within this share of the hole's strongest grows there; drift: holes a
// wave of a kind's weight along the round; blend: holes either side whose
// characters count (falling away), so a run of holes shares its kinds
// however each hole's own character was rolled.
export const PALETTE = { most: 4, least: 2, floor: 0.4, drift: 4.5, blend: 1.5 };

// How much each kind grows round a hole of each character (the trees near
// play: a parkland's oaks, broadleaves and beeches, a heath's Scots pines
// and birches, a lakeside's poplars and broadleaves - its willows by the
// water come anyway). Kinds not in the game yet are passed over.
export const KIND_MIX = {
  parkland: { oak: 3, leaf: 3, beech: 1.9, chestnut: 1.6, birch: 1, pine: 1, scots: 0.9, poplar: 0.6, spruce: 0.5, hawthorn: 0.9, holly: 0.8, cedar: 0.5, column: 0.35 },
  woodland: { leaf: 3, beech: 2.0, oak: 2.4, pine: 2, birch: 1.6, spruce: 1.5, scots: 1, holly: 1.2, hawthorn: 0.6, chestnut: 0.7 },
  heath: { scots: 3.5, birch: 3, pine: 2, oak: 1, holly: 0.8, hawthorn: 0.9, spruce: 0.8, leaf: 0.5 },
  lakeside: { leaf: 2.6, oak: 1.5, poplar: 1.6, birch: 1.5, beech: 0.6, chestnut: 1, hawthorn: 0.9, pine: 0.8 },
  links: { scots: 3, hawthorn: 2.4, birch: 1.2, pine: 1 },
};
KIND_MIX.linksgreen = KIND_MIX.links;

// How big each kind's stands are (metres across a patch, roughly): a
// birch, a hawthorn or a holly in smaller groups, the big trees in broad
// woods.
export const STAND_SIZE = { leaf: 52, oak: 46, beech: 56, chestnut: 40, birch: 30, pine: 56, scots: 46, spruce: 40, poplar: 30, hawthorn: 24, holly: 24, cedar: 60, column: 26 };

// The kinds a palette can hold (the game's, by name, in KIND_MIX's order).
const known = (name) => Number.isInteger(KIND[name]);

// A course's seed for its trees: from its name (sim/country.mjs nameSeed,
// as its country's), so the same course grows the same kinds every time.
const courseSeed = (course) => nameSeed(`trees:${seedName(course)}`);

// Each hole's character, as its country has it (sim/country.mjs).
function holeCharacters(course) {
  return (course?.holes ?? []).map((h, i) => {
    const L = h?.layout;
    const number = h?.spec?.number ?? L?.number ?? i + 1;
    return characterFor(L, courseHoleSeed(course, number));
  });
}

// A smooth noise (0 - 1) along a line, from a seed.
function lineNoise(t, seed) {
  const i = Math.floor(t);
  const f = t - i;
  const s = f * f * (3 - 2 * f);
  const a = hash2(i, 7, seed);
  const b = hash2(i + 1, 7, seed);
  return a + (b - a) * s;
}

// Every kind's weight at each hole of a course: [hole][kind name] -> weight.
export function kindWeights(course) {
  const chars = holeCharacters(course);
  const n = chars.length;
  const seed = courseSeed(course);
  const names = [...new Set(Object.values(KIND_MIX).flatMap((m) => Object.keys(m)))].filter(known);
  return chars.map((_, i) => {
    const out = {};
    for (const name of names) {
      // The holes round it, their characters blended (a bell, PALETTE.blend
      // holes either side).
      let mix = 0;
      let all = 0;
      for (let j = Math.max(0, i - 3); j <= Math.min(n - 1, i + 3); j++) {
        const w = Math.exp(-(((j - i) / PALETTE.blend) ** 2));
        mix += w * (KIND_MIX[chars[j]]?.[name] ?? 0);
        all += w;
      }
      mix /= all || 1;
      if (!(mix > 0)) continue;
      // Its drift along the round: from a fifth of its mix to nearly twice.
      const drift = lineNoise(i / PALETTE.drift + hash2(KIND[name], 3, seed) * 10, seed ^ Math.imul(KIND[name] + 1, 0x9e3779b1));
      out[name] = mix * (0.2 + 1.7 * drift);
    }
    return out;
  });
}

// A hole's kinds, from its weights ({ name: weight }): the strongest, at
// most PALETTE.most, those within PALETTE.floor of the strongest, at least
// PALETTE.least. Returns [{ kind, weight }] strongest first (weights summing
// to 1).
export function paletteOf(weights) {
  const sorted = Object.entries(weights)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1] || KIND[a[0]] - KIND[b[0]]);
  if (!sorted.length) return [];
  const top = sorted[0][1];
  const kept = sorted.filter(([, w], i) => i < PALETTE.least || (i < PALETTE.most && w >= top * PALETTE.floor));
  const sum = kept.reduce((a, [, w]) => a + w, 0);
  return kept.map(([name, w]) => ({ kind: KIND[name], weight: w / sum }));
}

// Every hole's kinds (paletteOf of kindWeights), kept for the course as it
// is (a course's holes are replaced when they change, never changed where
// they are).
const palettes = new WeakMap();
export function coursePalettes(course) {
  if (!course?.holes?.length) return [];
  const kept = palettes.get(course);
  if (kept && kept.holes === course.holes) return kept.list;
  const list = kindWeights(course).map(paletteOf);
  palettes.set(course, { holes: course.holes, list });
  return list;
}
export const holeKinds = (course, i) => coursePalettes(course)[i] ?? [];

// What a course's hole is grown with (courseplay.mjs grownTrees' stands):
// its seed (as before), its kinds, and where it lies on the course - or
// just the seed, with no course (the old stands: treehits.mjs treeStands).
export function standsFor(course, i) {
  const h = course?.holes?.[i];
  const seed = h?.spec?.seed ?? i + 1;
  const kinds = holeKinds(course, i);
  if (!kinds.length) return seed;
  return { seed, kinds, place: coursePlaces(course)?.[i] ?? null, course: courseSeed(course) };
}

// A stands' seed, whichever it is (the hole's: rolls, grain).
export const standsSeed = (stands) => (Number.isFinite(stands) ? stands : Number.isFinite(stands?.seed) ? stands.seed : 1);

// A hole's trees with their kinds (a ninth number, the kind each grows as:
// treehits.mjs treeForm) - in stands of the hole's kinds where `stands`
// carries them (standsFor), else the old stands of the newer kinds
// (treeStands, a seed).
export function palettedTrees(trees, stands) {
  if (stands == null) return trees;
  if (!Array.isArray(stands.kinds) || !stands.kinds.length) return treeStands(trees, standsSeed(stands));
  const { kinds, place } = stands;
  const s = (stands.course ?? stands.seed ?? 1) >>> 0;
  const at = place ? (p) => toCourse(place, p) : (p) => p;
  return trees.map((t) => {
    const [x, z, scale = 1, kind, width = 1, thick, shapeSet, byWater] = t;
    if (kind != null) return t;
    // By the water, a willow stays one.
    if (byWater === 1 && treeForm(t).kind === KIND.willow) return t;
    const own = hashNumbers([x, z, (stands.seed ?? 1) % 100003]) / 4294967296;
    const grow = own < STAND.snags ? KIND.snag : kindAt(kinds, at([x, z]), s);
    return [x, z, scale, kind, width, thick, shapeSet, byWater, grow];
  });
}

// Which of a hole's kinds grows at a spot on the course ([x, z], the
// course's metres): the one whose stands' noise, times its weight, is
// highest there (sharpened, so stands have edges).
export function kindAt(kinds, [x, z], seed = 1) {
  let best = kinds[0]?.kind ?? KIND.leaf;
  let bestScore = -1;
  for (const { kind, weight } of kinds) {
    const size = STAND_SIZE[KINDS[kind]] ?? 45;
    const n = valueNoise(x, z, size, (seed ^ Math.imul(kind + 1, 0x85ebca6b)) >>> 0);
    const score = weight * (0.15 + n) ** 4;
    if (score > bestScore) {
      bestScore = score;
      best = kind;
    }
  }
  return best;
}

// (The characters a palette's mix knows, for the tests.)
export const PALETTE_CHARACTERS = [...CHARACTERS, "links", "linksgreen"];
