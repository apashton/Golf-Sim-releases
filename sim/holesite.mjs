// A hole as the page draws it, made again from plain data on another core
// (buildworker.js): the hole made ready to play (sim/courseplay.mjs
// prepareHole, from what it was made from: its recipe) and, by the sea, its
// ground run down to the shore - what course.js heightAt, worldHeight and
// onShore are on the page. Kept for the next task on the same hole.

import { prepareHole } from "./courseplay.mjs";
import { coastOf, coastHere, shoreHeight, duneLump, seaLevel, COAST } from "./coast.mjs";
import { coursePlaces } from "./imaginary.mjs";

// The last two holes made: the one being played (a shot's grass across the
// hole, each shot) and the next, built ahead (its tufts and sheets), so a
// task for either finds its hole ready.
const kept = [];

// A hole made ready to play (prepareHole), keeping what it was made from
// (its recipe), so another core can make it again (holeSite).
export function preparedHole(stored, opts = {}) {
  const hole = prepareHole(stored, opts);
  hole.recipe = { stored, opts };
  return hole;
}

// recipe: { stored, opts } (course.js preparedHole); course and index: for
// the coast, with shore whether there is one; horizonSeed: the dunes' lumps.
export function holeSite({ recipe, course = null, index = 0, shore = false, horizonSeed = 7 }) {
  const key = JSON.stringify([recipe, shore ? course : null, index, horizonSeed]);
  const had = kept.find((k) => k.key === key);
  if (had) return had.site;
  const hole = prepareHole(recipe.stored, recipe.opts);
  let at = null;
  let past = null;
  if (shore && course?.holes?.length) {
    const coast = coastOf(course);
    const place = coursePlaces(course)[Math.min(index, course.holes.length - 1)];
    const here = coast ? coastHere(coast, place) : null;
    if (here) {
      at = here.at;
      past = here.past;
    }
  }
  const level = seaLevel(0);
  // (Hole frame: x along the hole, z across; world: wx = z, wz = -x.)
  // (course.js shoreDown: world x and z.)
  const shoreDown = (wx, wz, g) => {
    if (!at) return g;
    const d = at(wx, wz);
    if (d >= COAST.beach + COAST.dunes) return g;
    return shoreHeight(d, g, level, duneLump(wx, wz, horizonSeed), past(wx, wz));
  };
  const heightAt = (x, z) => shoreDown(z, -x, hole.heightAt(x, z));
  const base = hole.baseHeightAt ?? hole.heightAt;
  const site = {
    hole,
    heightAt,
    worldHeight: (wx, wz) => heightAt(-wz, wx),
    // (course.js drapeHeight: without what's been dug by hand.)
    drapeHeight: (wx, wz) => shoreDown(wx, wz, base(-wz, wx)),
    onShore: (wx, wz) => !!at && at(wx, wz) < COAST.beach + 6,
  };
  kept.unshift({ key, site });
  if (kept.length > 2) kept.length = 2;
  return site;
}

// A few readings of a hole's ground and lies, to tell whether two holes are
// the same one (the page's and holeSite's).
export function holeProbe(heightAt, lieAt, L) {
  const n = L.length ?? 300;
  const pts = [[0, 0], [n * 0.3, 14], [n * 0.6, -22], [L.green?.x ?? 0, L.green?.z ?? 0], [n * 0.8, 35]];
  return pts.map(([x, z]) => [Math.round(heightAt(x, z) * 1e4) / 1e4, lieAt(x, z)]);
}
