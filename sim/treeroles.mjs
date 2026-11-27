// Each tree's kind by where it stands, as a hole the course maker's second
// round made grows (sim/maker.mjs) - what Saltpine Links and Watling Pines
// taught (docs/REAL-COURSES.md: "give trees their kinds by where they
// stand"): a lone tree out in the rough is a specimen - an oak, a beech, a
// horse chestnut, a cedar, a Scots pine - not a birch or a dead one; a
// share of a wood's front edge is of the kinds that grow at a wood's edge
// (a parkland's hawthorns, hollies and birches, a heath's birches -
// Saltpine's edge birches); among a big wood's smaller trees, holly grows
// under the others (Watling's yews under its oaks); no dead tree stands at
// the wood's front, only back in it; and a copse (layout.copses:
// sim/madewoods.mjs) is all one kind.
//
// Laid on as a hole's trees grow (courseplay.mjs grownTrees), after their
// kinds from the hole's palette (sim/treepalette.mjs palettedTrees) - the
// ninth number, the kind a tree grows as, changed; a tree with a kind of
// its own (its fourth: LiDAR, planted by hand, a signature tree) never is.
// Only for a hole the second round made (stands: standsFor gives its
// character then). Pure; the hole's frame.

import { KIND } from "./treeshapes.mjs";
import { makePath, nearest } from "./course.mjs";
import { kindAt } from "./treepalette.mjs";
import { toCourse } from "./imaginary.mjs";
import { valueNoise, hash2 } from "./country.mjs";
import { madeSince } from "./maker.mjs";
import { TREE_KINDS } from "./lidartrees.mjs";

// Where a tree stands, by how far past the hole's tree line (metres; in
// play below 0): the wood's front to `front`; of the front, where a noise
// over the course (`edgeSize` metres a patch) is below `edge`, the edge
// kinds; back in the wood, a tree below `under.below` in size as likely
// as `under.share` an understorey one.
export const ROLE = { front: 18, edge: 0.4, edgeSize: 24, under: { share: 0.3, below: 1.15 } };

// The kinds at a wood's edge, by the hole's character (sim/country.mjs).
export const EDGE_MIX = {
  parkland: { hawthorn: 1, birch: 0.8, holly: 0.6 },
  woodland: { holly: 1, birch: 0.9 },
  heath: { birch: 1 },
  lakeside: { birch: 1, hawthorn: 0.7 },
  links: { hawthorn: 1 },
  linksgreen: { hawthorn: 1 },
};
// The understorey, by character (none on a heath or by a lake).
export const UNDER = { parkland: "holly", woodland: "holly" };
// The kinds a lone tree in play may be (those of its hole's palette), and
// the one it is if its palette has none of them.
export const SPECIMEN = ["oak", "beech", "chestnut", "cedar", "scots"];
const SPECIMEN_ELSE = "oak";

const named = (mix) => Object.entries(mix ?? {}).map(([name, weight]) => ({ kind: KIND[name], weight })).filter((k) => Number.isInteger(k.kind));

// A hole's roles, from its stands (sim/treepalette.mjs standsFor): { edge:
// [{ kind, weight }], under: a kind or null, specimen: [{ kind, weight }],
// kinds: every kind they may give } - or null, for stands that grow none.
export function holeRoles(stands) {
  if (!stands?.character || !Array.isArray(stands.kinds) || !stands.kinds.length) return null;
  const edge = named(EDGE_MIX[stands.character] ?? EDGE_MIX.parkland);
  const under = UNDER[stands.character] != null ? KIND[UNDER[stands.character]] : null;
  let specimen = stands.kinds.filter((k) => SPECIMEN.some((name) => KIND[name] === k.kind));
  if (!specimen.length) {
    const led = Object.keys(stands.lead?.kinds ?? {}).find((name) => SPECIMEN.includes(name));
    specimen = [{ kind: KIND[led ?? SPECIMEN_ELSE], weight: 1 }];
  }
  const kinds = [...new Set([...edge.map((k) => k.kind), ...(under != null ? [under] : []), ...specimen.map((k) => k.kind)])];
  return { edge, under, specimen, kinds };
}

// The tee shot's corridor (Watling Pines' lesson: tools/realsteps/
// corridors.mjs): from `behind` metres behind the line's start (the back
// tee) along the hole's line for `reach`, every crown `clear` of it.
export const CORRIDOR = { reach: 150, behind: 20, clear: 2.5, spread: 1.15 };
function teeCorridor(pts) {
  if (!(pts?.length >= 2)) return null;
  const [ax, az] = pts[0];
  const d = Math.hypot(pts[1][0] - ax, pts[1][1] - az) || 1;
  const out = [[ax - ((pts[1][0] - ax) / d) * CORRIDOR.behind, az - ((pts[1][1] - az) / d) * CORRIDOR.behind], pts[0]];
  let left = CORRIDOR.reach;
  for (let i = 1; i < pts.length && left > 0; i++) {
    const len = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (len <= left) out.push(pts[i]);
    else out.push([pts[i - 1][0] + ((pts[i][0] - pts[i - 1][0]) * left) / len, pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * left) / len]);
    left -= len;
  }
  return out;
}
function lineGap(pts, x, z) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1];
    const ex = pts[i][0] - ax;
    const ez = pts[i][1] - az;
    const f = Math.min(1, Math.max(0, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez || 1)));
    best = Math.min(best, Math.hypot(x - ax - ex * f, z - az - ez * f));
  }
  return best;
}

// A hole's grown trees (palettedTrees') with their kinds by where they
// stand. layout: the hole's (its line, tree line - or on hills the flat
// hole's, woodLine - and copses).
export function rolledTrees(trees, stands, layout) {
  const roles = madeSince(layout) && layout?.path?.length >= 2 ? holeRoles(stands) : null;
  if (!roles) return trees;
  const path = makePath(layout.path);
  const line = layout.woodLine ?? layout.treeLine ?? 40;
  const s = (stands.course ?? stands.seed ?? 1) >>> 0;
  const place = stands.place;
  const at = place ? (p) => toCourse(place, p) : (p) => p;
  // Each copse one kind: the hole's that grows at its middle.
  const copses = (layout.copses ?? []).filter((c) => Array.isArray(c) && c.length >= 3).map(([x, z, r]) => ({ x, z, r, kind: kindAt(stands.kinds, at([x, z]), (s ^ 0xc095e) >>> 0) }));
  const corridor = teeCorridor(layout.path);
  return trees.map((t) => {
    if (!Array.isArray(t) || t[3] != null || !Number.isInteger(t[8])) return t;
    const [x, z, scale = 1] = t;
    let grow = t[8];
    const copse = copses.find((c) => Math.hypot(x - c.x, z - c.z) <= c.r);
    if (copse) grow = copse.kind;
    else {
      const u = Math.abs(nearest(path, x, z).d) - line;
      const p = at([x, z]);
      if (u < 0) grow = kindAt(roles.specimen, p, (s ^ 0x5bec1) >>> 0);
      else if (u < ROLE.front) {
        if (roles.edge.length && valueNoise(p[0], p[1], ROLE.edgeSize, (s ^ 0xed6e) >>> 0) < ROLE.edge) grow = kindAt(roles.edge, p, (s ^ 0xed6f) >>> 0);
        else if (grow === KIND.snag) grow = kindAt(stands.kinds, p, s);
      } else if (roles.under != null && scale < ROLE.under.below && hash2(Math.round(p[0] * 10), Math.round(p[1] * 10), (s ^ 0x0de5) >>> 0) < ROLE.under.share) grow = roles.under;
    }
    // And none whose kind's crown reaches into a tee shot's corridor: a
    // narrow one there instead (the hole was made clear for a crown of
    // its size - sim/teelane.mjs crownReach - and a broad oak or beech
    // reaches further).
    if (corridor && grow !== KIND.birch) {
      const crown = (TREE_KINDS[grow]?.radius ?? 4) * scale * (t[4] ?? 1) * CORRIDOR.spread;
      if (lineGap(corridor, x, z) - crown < CORRIDOR.clear) grow = KIND.birch;
    }
    if (grow === t[8]) return t;
    const out = [...t];
    out[8] = grow;
    return out;
  });
}
