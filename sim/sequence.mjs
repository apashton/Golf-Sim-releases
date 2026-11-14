// A strategic course's scorecard composed as an architect would
// (docs/COURSE-DESIGN-PLAN.md, phase 3) - not one nine's pars played
// twice, each hole's length drawn on its own:
//
//   the pars     each nine in its own order: never a par 3 first, the
//                first par 3 at the 3rd to the 5th, no three of a par in a
//                row, two par 3s or 5s together only now and then (Cypress
//                Point's 15th and 16th), the last hole never a par 3
//   the lengths  spread on purpose: the par 3s from a short iron to a long
//                one (Shoreacres' 130, 170, 190 and 215), par 4s from one
//                the long hitter can drive to a couple well over 440, a par
//                5 to go for in two and a long three-shotter
//   templates    the Raynor way: the par 3s a set of the great ones (Short,
//                Eden, Redan, Biarritz) by their lengths, a Drivable par 4,
//                a Long and a reachable par 5, and a few more of the par
//                4s (Cape, Road, Narrows, Bottle, Principal's Nose, Double
//                Plateau) where their lengths fit - never one twice
//   water        the styles' share of holes, spread over the course, as
//                often left as right; none on the 1st
//   dog-legs     as many left as right, never three the same way running
//   pacing       a gentle 1st (a par 4 of middling length, no water), a
//                hard 17th and an 18th to finish on: long, or a par 5 to go
//                for
//
// Each part from its own randomness, so changing one choice (water, say)
// changes nothing else. Pure: coursemaker.mjs makeCard calls it for a
// course whose Design is strategic.

import { seeded } from "./course.mjs";
import { TEMPLATES } from "./architect.mjs";

const shuffle = (rand, list) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
const round5 = (v) => Math.round(v / 5) * 5;

// How long each par's holes run (yards, from shortest to longest), before
// the course's Hole lengths.
export const SPREAD = { 3: [130, 230], 4: [330, 465], 5: [495, 590] };

// The pars of a course of n holes (9 or 18), each nine its own order, from
// a nine's mix (coursemaker.mjs PARS: [4, 4, 3, 5, ...]).
export function composePars(nine, n, rand) {
  const nines = n > 9 ? 2 : 1;
  const out = [];
  for (let k = 0; k < nines; k++) {
    let best = null;
    let bestScore = -Infinity;
    for (let t = 0; t < 80; t++) {
      const order = shuffle(rand, nine);
      const score = parScore(order, { last: k === nines - 1, front: k === 0 ? null : out.slice(0, 9) });
      if (score > bestScore) {
        best = order;
        bestScore = score;
      }
    }
    out.push(...best);
  }
  return out;
}

// How well a nine's pars are ordered (higher better): last, it ends the
// course; front, the front nine's order (the back shouldn't copy it).
function parScore(order, { last, front }) {
  let score = 0;
  if (order[0] === 3) score -= 10;
  if (order[0] === 5) score -= 1;
  const first3 = order.indexOf(3);
  if (first3 >= 0 && (first3 < 2 || first3 > 4)) score -= 2;
  for (let i = 1; i < order.length; i++) {
    if (order[i] === order[i - 1] && order[i] !== 4) score -= order[i] === 3 ? 3 : 2;
    if (i > 1 && order[i] === order[i - 1] && order[i] === order[i - 2]) score -= 10;
  }
  if (last) {
    if (order.at(-1) === 3) score -= 6;
    if (order.at(-1) === 5) score += 0.5;
    if (order.at(-2) === 3) score += 0.5;
  }
  if (front && front.join() === order.join()) score -= 4;
  return score;
}

// The lengths for a card's pars: each par's holes spread from short to long
// (SPREAD, times k, the course's Hole lengths), a little either side, in a
// mixed order - the 1st of middling length, the 18th long.
export function composeYards(pars, k, rand, spread = SPREAD) {
  const yards = [];
  for (const par of [3, 4, 5]) {
    const at = pars.map((p, i) => (p === par ? i : -1)).filter((i) => i >= 0);
    if (!at.length) continue;
    const [lo, hi] = (spread ?? SPREAD)[par] ?? SPREAD[par];
    const m = at.length;
    const list = Array.from({ length: m }, (_, i) => (m === 1 ? (lo + hi) / 2 : lo + ((hi - lo) * i) / (m - 1)) + (rand() - 0.5) * 12);
    const order = shuffle(rand, list);
    at.forEach((h, i) => (yards[h] = order[i]));
    // The 1st, if this par, a middling one; the last, if a par 4, a long one.
    const sorted = [...list].sort((a, b) => a - b);
    const swap = (h, want) => {
      const j = at.findIndex((q) => yards[q] === want);
      if (j < 0 || at[j] === h) return;
      [yards[h], yards[at[j]]] = [yards[at[j]], yards[h]];
    };
    if (pars[0] === par && m >= 3) swap(0, sorted[Math.floor(m * 0.4)]);
    if (pars.at(-1) === par && par === 4 && m >= 3) swap(pars.length - 1, sorted[m - 1 - Math.floor(rand() * 2)]);
  }
  return yards.map((y) => round5(y * k));
}

// Which holes are which template: the par 3s by length (the shortest a
// Short, the longest a Biarritz, an Eden and a Redan between), the shortest
// par 4 a Drivable (made its length), the longest par 5 a Long and the
// shortest a reachable one, and a few par 4s more where their lengths fit.
// Returns [template or null] by hole, with any length changed (yards).
export function composeTemplates(pars, yards, k, rand) {
  const out = pars.map(() => null);
  const used = new Set();
  const fits = (name, y) => {
    const t = TEMPLATES[name];
    return y >= t.yards[0] * k - 5 && y <= t.yards[1] * k + 5;
  };
  const byLength = (par) =>
    pars
      .map((p, i) => [p, i])
      .filter(([p]) => p === par)
      .map(([, i]) => i)
      .sort((a, b) => yards[a] - yards[b]);
  // The par 3s.
  const threes = byLength(3);
  const want3 = ["short", "eden", "redan", "biarritz"];
  for (const h of threes) {
    const name = want3.find((t) => !used.has(t) && fits(t, yards[h]));
    if (name) {
      out[h] = name;
      used.add(name);
    }
  }
  // The shortest par 4 drivable (by the long hitter): its length made so.
  const fours = byLength(4);
  if (fours.length >= 4) {
    const h = fours[0];
    const [lo, hi] = TEMPLATES.drivable.yards;
    yards[h] = round5((lo + rand() * (hi - lo)) * k);
    out[h] = "drivable";
    used.add("drivable");
  }
  // The par 5s: the longest a Long, the shortest one to go for.
  const fives = byLength(5);
  if (fives.length >= 2) {
    if (fits("long", yards[fives.at(-1)])) out[fives.at(-1)] = "long";
    if (fits("reachable", yards[fives[0]])) out[fives[0]] = "reachable";
  }
  // A few par 4s more: two or three on 18 holes, one or two on 9 (never
  // the 1st: a gentle start).
  const more = pars.length > 9 ? 2 + Math.floor(rand() * 2) : 1 + Math.floor(rand() * 2);
  let added = 0;
  for (const name of shuffle(rand, ["road", "narrows", "bottle", "principal", "plateau", "cape"])) {
    if (added >= more) break;
    const free = shuffle(rand, fours.filter((h) => h > 0 && !out[h] && fits(name, yards[h])));
    if (!free.length) continue;
    out[free[0]] = name;
    added++;
  }
  return { templates: out, yards };
}

// Which holes have water, and where: the styles' share of holes (share by
// hole) spread over the course, the 1st kept dry, par 4s and 5s as often
// left as right, par 3s in front or to either side by turns; a Cape's and a
// reachable par 5's in front.
export function composeWater(pars, shares, templates, rand) {
  const n = pars.length;
  const expectedCount = shares.reduce((a, s) => a + s, 0);
  let count = Math.round(expectedCount + (rand() - 0.5));
  count = Math.max(0, Math.min(n - 1, count));
  // Weighted picks without replacement: a Cape or a par 5 to go for first
  // (water's their carry), the 1st last of all.
  const weights = shares.map((s, i) => (i === 0 ? s * 0.05 : templates[i] === "cape" || templates[i] === "reachable" ? s * 4 : s) + 1e-6);
  const wet = new Set();
  for (let c = 0; c < count; c++) {
    const total = weights.reduce((a, w, i) => a + (wet.has(i) ? 0 : w), 0);
    let r = rand() * total;
    for (let i = 0; i < n; i++) {
      if (wet.has(i)) continue;
      r -= weights[i];
      if (r <= 0) {
        wet.add(i);
        break;
      }
    }
  }
  // As many left as right, of the par 4s and 5s that want a side.
  const sided = pars.filter((p, i) => wet.has(i) && p > 3 && templates[i] !== "cape" && templates[i] !== "reachable").length;
  const first = rand() < 0.5 ? 0 : 1;
  const sides = shuffle(rand, Array.from({ length: sided }, (_, i) => ((i + first) % 2 ? "left" : "right")));
  const threes = shuffle(rand, ["front", "left", "front", "right"]);
  let s = 0;
  let t = 0;
  return pars.map((par, i) => {
    if (!wet.has(i)) return "none";
    if (templates[i] === "cape" || templates[i] === "reachable") return "front";
    if (par === 3) return threes[t++ % threes.length];
    return sides[s++];
  });
}

// Dog-legs: about a third of the par 4s and 5s, as many left as right,
// never three the same way running; the rest as their kind comes.
export function composeDoglegs(pars, templates, rand) {
  const free = pars.map((p, i) => (p > 3 && !templates[i] ? i : -1)).filter((i) => i >= 0);
  const count = Math.round(free.length * (0.3 + rand() * 0.1));
  const chosen = new Set(shuffle(rand, free).slice(0, count));
  const ways = shuffle(rand, Array.from({ length: count }, (_, i) => (i % 2 ? "left" : "right")));
  const out = pars.map(() => "auto");
  let w = 0;
  for (let i = 0; i < pars.length; i++) if (chosen.has(i)) out[i] = ways[w++];
  // Never three bending the same way in a row (of those that bend).
  const bent = out.map((d, i) => (d === "left" || d === "right" ? i : -1)).filter((i) => i >= 0);
  for (let j = 2; j < bent.length; j++) {
    const [a, b, c] = [bent[j - 2], bent[j - 1], bent[j]];
    if (out[a] === out[b] && out[b] === out[c]) out[c] = out[c] === "left" ? "right" : "left";
  }
  return out;
}

// The whole composition: { pars, yards, templates, water, doglegs } by
// hole, for n holes from a nine's mix, the course's Hole lengths k, each
// hole's water share (its style's, or the course's) and the seed; spread,
// other lengths by par (a course of par 3s').
export function composeCard({ nine, n, k = 1, shares, seed = 1, spread = null }) {
  const pars = composePars(nine, n, seeded((seed ^ 0x5e9a) >>> 0 || 1));
  const raw = composeYards(pars, k, seeded((seed ^ 0x1a6d) >>> 0 || 1), spread ?? SPREAD);
  const { templates, yards } = composeTemplates(pars, raw, k, seeded((seed ^ 0x7e3) >>> 0 || 1));
  const water = composeWater(pars, shares, templates, seeded((seed ^ 0x3a7e) >>> 0 || 1));
  const doglegs = composeDoglegs(pars, templates, seeded((seed ^ 0xd06) >>> 0 || 1));
  return { pars, yards, templates, water, doglegs };
}
