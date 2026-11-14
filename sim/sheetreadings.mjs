// The heights of a hole's ground sheets (greenscene.js groundPatch,
// groundRect: the fine ground round the green, over a links hole's dunes,
// round each dug bunker and lowered pond) at every corner, and the light
// on each as the ground was before any digging (look/dugground.js
// levelNormals) - five readings of the ground a corner, most of the work of
// laying them. Read on another core from the hole made again there (sim/
// holesite.mjs), at exactly the corners the page has (greenscene.js
// sheetXZ), so the sheets are the same.

import { holeSite, holeProbe } from "./holesite.mjs";

// (look/dugground.js levelNormals's step either side.)
const E = 0.25;

// The light at (x, z) on ground heightAt: [x, y, z] of its normal.
export function levelNormal(heightAt, x, z) {
  const gx = (heightAt(x + E, z) - heightAt(x - E, z)) / (2 * E);
  const gz = (heightAt(x, z + E) - heightAt(x, z - E)) / (2 * E);
  const l = Math.hypot(gx, 1, gz);
  return [-gx / l, 1 / l, -gz / l];
}

// a: { site (holeSite's), probe (holeProbe's, of the page's hole), sheets:
// [{ key, xs, zs, normals }] }. Returns { [key]: { heights (Float64Array),
// normals (Float64Array, three a corner) or null } }.
export function sheetReadings(a) {
  const site = holeSite(a.site);
  const probe = holeProbe(site.heightAt, (x, z) => site.hole.lieAt(x, z), site.hole.layout);
  if (JSON.stringify(probe) !== JSON.stringify(a.probe)) throw new Error("not the page's hole");
  const out = {};
  for (const { key, xs, zs, normals } of a.sheets) {
    const n = xs.length;
    const heights = new Float64Array(n);
    for (let i = 0; i < n; i++) heights[i] = site.worldHeight(xs[i], zs[i]);
    let nor = null;
    if (normals) {
      nor = new Float64Array(n * 3);
      for (let i = 0; i < n; i++) nor.set(levelNormal(site.drapeHeight, xs[i], zs[i]), i * 3);
    }
    out[key] = { heights, normals: nor };
  }
  return out;
}
