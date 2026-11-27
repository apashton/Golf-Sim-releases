// Decor placed by hand in the hole editor (the owner: "it should be a user
// choice"): heather, gorse, rocks, wildflowers and bushes, the things
// sim/dressing.mjs and sim/bushes.mjs scatter by themselves. Kept with the
// hole's edits ("d+" plants, "d-" takes away, "dm" moves: sim/holeedits),
// so a hole's decor is its own (one owner) and comes with its layout;
// withEdits gives it as layout.decor: [[x, z, kind, size], ...] in the
// hole's frame. Placed where a tree planted by hand may stand (its own
// fairway too, not within TREE_LINE of its line, not on a green, a tee,
// sand or water) and never on another hole's fairway, green or tee
// (sim/treeclear.mjs). Pure.

import { KIND } from "./treeshapes.mjs";

export const DECOR_KINDS = ["heather", "gorse", "rock", "flowers", "bush"];
export const DECOR_WORDS = ["Heather", "Gorse", "Rock", "Wildflowers", "Bush"];
export const DECOR = { minSize: 0.4, maxSize: 3, near: 1.2 };

export const decorKind = (k) => Number.isInteger(k) && k >= 0 && k < DECOR_KINDS.length;

// A small seeded spread from a spot, so a dab looks the same every time.
const jitter = (x, z, k) => {
  const s = Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 43758.5453;
  return s - Math.floor(s);
};

// The dressing lists (look/dressing.js makeDressing) for placed decor:
// a heather or wildflower dab is a little patch of them, gorse and a rock
// one each. Bushes aren't here: they're trees (decorTrees).
export function decorDressing(items = []) {
  const out = { heather: [], gorse: [], rocks: [], flowers: [] };
  for (const it of items) {
    const [x, z, kind, size = 1] = it;
    const name = DECOR_KINDS[kind];
    if (name === "heather" || name === "flowers") {
      const n = name === "heather" ? 9 : 7;
      for (let i = 0; i < n; i++) {
        const a = jitter(x, z, i) * Math.PI * 2;
        const r = Math.sqrt(jitter(z, x, i + 3)) * 1.4 * size;
        const px = x + Math.cos(a) * r;
        const pz = z + Math.sin(a) * r;
        if (name === "heather") out.heather.push([px, pz, 0.35 + 0.35 * jitter(px, pz, 1), a]);
        else out.flowers.push([px, pz, 0.6 + 0.6 * jitter(px, pz, 2), a, [0.72, 0.46, 0.88]]);
      }
    } else if (name === "gorse") out.gorse.push([x, z, 0.8 * size, jitter(x, z, 5) * Math.PI * 2]);
    else if (name === "rock") out.rocks.push([x, z, 0.6 * size, jitter(x, z, 6) * Math.PI * 2]);
  }
  return out;
}

// Placed bushes as the hole's trees (sim/bushes.mjs's form: a bush), so
// they're drawn and played as its bushes are.
export const decorTrees = (items = []) => items.filter((it) => DECOR_KINDS[it[2]] === "bush").map(([x, z, , size = 1]) => [x, z, size, KIND.bush, 1]);

// Two dressings laid together.
export function withDecor(dressing, extra) {
  const out = { ...dressing };
  for (const k of Object.keys(extra)) out[k] = [...(dressing?.[k] ?? []), ...extra[k]];
  return out;
}
