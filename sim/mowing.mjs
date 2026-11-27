// How a hole is mown (the owner: a neighbour's fairway should look as it
// does when that hole is played; and "a mowing choice per hole"). Pure.
//
// mowingFor(seed) picks from the hole's seed (the same hole, the same
// pattern): its fairway straight across, diagonally, checked, or along the
// hole; its green straight, crosshatched or diagonally. Each as
// { name, kind, dir }: kind 0 stripes one way, 1 checked (two ways across
// each other; look/glsl/ground.js gMowing), and dir the way the stripes
// change, in the hole's frame (x down the hole, z to its right), unit
// length. A hole's own choice (layout.mow: { fairway, green }, each a
// pattern's name; missing or "auto" keeps the seeded pick) wins.

export const FAIRWAY_MOWS = ["across", "diagonal", "checked", "along"];
export const GREEN_MOWS = ["straight", "crosshatch", "diagonal"];
// Stripe widths in metres, as the played hole draws them (course/holebuild.js).
export const MOW_WIDTH = { fairway: 10, green: 1.4 };
const D = Math.SQRT1_2;
const MOWS = {
  across: { kind: 0, dir: [1, 0] },
  diagonal: { kind: 0, dir: [D, D] },
  checked: { kind: 1, dir: [1, 0] },
  along: { kind: 0, dir: [0, 1] },
  straight: { kind: 0, dir: [1, 0] },
  crosshatch: { kind: 1, dir: [D, D] },
};
// A green's diagonal runs the other way from the fairway's.
const greenMow = (name) => (name === "diagonal" ? { kind: 0, dir: [D, -D] } : MOWS[name]);

export function mowingFor(seed = 1, choice = null) {
  let h = Math.imul((seed | 0) ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  const fairway = FAIRWAY_MOWS.includes(choice?.fairway) ? choice.fairway : FAIRWAY_MOWS[h % FAIRWAY_MOWS.length];
  const green = GREEN_MOWS.includes(choice?.green) ? choice.green : GREEN_MOWS[Math.floor(h / 7) % GREEN_MOWS.length];
  return { fairway: { name: fairway, ...MOWS[fairway] }, green: { name: green, ...greenMow(green) } };
}

// The seed a hole's mowing is worked out from: the same hole, the same
// pattern every time.
export const mowSeed = (L) => (L.number ?? 1) * 7919 + (L.yards ?? 0);

// A hole's mowing: its choice, or the seeded pick.
export const holeMowing = (L) => mowingFor(mowSeed(L ?? {}), L?.mow);

// A choice as saved: only real patterns, Auto left out (null for none).
export function mowChoice(choice) {
  const out = {};
  if (FAIRWAY_MOWS.includes(choice?.fairway)) out.fairway = choice.fairway;
  if (GREEN_MOWS.includes(choice?.green)) out.green = choice.green;
  return Object.keys(out).length ? out : null;
}

// A pattern turned into another frame: dir rotated by `turn` (a function
// taking a direction in the hole's frame to the other frame's).
export const turnedMow = (pattern, turn) => ({ ...pattern, dir: turn(pattern.dir) });
