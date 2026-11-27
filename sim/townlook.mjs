// The town round a real course (tools/realcourse.mjs): what its buildings
// are made of, the ones people know in their own colours, and how high its
// far copies stand. Each step takes the course's holes, its definition and
// the tool's helpers ({ placed }: a hole's frame to the map and back) and
// gives the holes back - each changed one a copy. Pure.
//
// One building is on several holes - in play on one, beyond the ground of
// three more - each a copy of the map's outline in that hole's frame. So
// the steps work on the course's buildings once each (townBuildings: the
// same building is the one at the same place on the course, as big), and
// whatever's decided for one goes on every copy of it.

import { insidePolygon, distanceToEdge, polygonCentroid, project } from "./terrain.mjs";
import { colourOf, polygonArea, sameBuilding, sameBuildingHeights } from "./buildings.mjs";

const LISTS = [
  ["buildings", "buildingLooks"],
  ["farBuildings", "farBuildingLooks"],
];

// Every building on the course, once: [{ e, n, area, poly (on the course:
// metres east and north of its middle), copies: [{ hole, list, looks, i }]
// }], in the order first met.
export function townBuildings(holes, { placed }) {
  const town = [];
  holes.forEach((h, hole) => {
    const L = h.layout;
    if (!L?.geo) return;
    const { toCourse } = placed(L);
    for (const [list, looks] of LISTS) {
      (L[list] ?? []).forEach((p, i) => {
        if (!Array.isArray(p) || p.length < 3) return;
        const poly = p.map(toCourse);
        const [e, n] = polygonCentroid(poly);
        const here = { e, n, area: polygonArea(poly) };
        let b = town.find((t) => sameBuilding(t, here));
        if (!b) town.push((b = { ...here, poly, copies: [] }));
        b.copies.push({ hole, list, looks, i });
      });
    }
  });
  return town;
}

// The looks of every copy of each of `chosen` ([{ building, look }]) laid
// over what each had (`fill`: only where it has none of that).
// (fill: only what a building's look lacks; plain: these keys only onto a
// building the map says nothing of - no walls, roof or roof colour of its
// own before any are filled in.)
function withLooks(holes, chosen, { fill = false, plain = [] } = {}) {
  const next = holes.map((h) => ({ ...h, layout: { ...h.layout } }));
  const touched = new Set();
  for (const { building, look } of chosen) {
    for (const c of building.copies) {
      const L = next[c.hole].layout;
      const key = `${c.hole}:${c.looks}`;
      if (!touched.has(key)) {
        touched.add(key);
        L[c.looks] = (L[c.looks] ?? L[c.list].map(() => null)).slice();
      }
      const was = L[c.looks][c.i] ?? {};
      const said = was.walls != null || was.roofColour != null || was.roof != null;
      const add = fill ? Object.fromEntries(Object.entries(look).filter(([k]) => was[k] == null && !(said && plain.includes(k)))) : look;
      if (Object.keys(add).length) L[c.looks][c.i] = { ...was, ...add };
    }
  }
  return next.map((h, i) => (touched.has(`${i}:buildingLooks`) || touched.has(`${i}:farBuildingLooks`) ? h : holes[i]));
}

// A small hash of a place on the course (metres east and north).
function placeHash(e, n) {
  let h = 0x811c9dc5;
  h = Math.imul(h ^ Math.round(e), 16777619);
  h = Math.imul(h ^ Math.round(n), 16777619);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return h >>> 0;
}

// What the town is built of (the definition's `town`): { walls: [colour,
// ...], roofColour: colour | [colour, ...], roofs: "mansard", chimneys:
// true } ("#rrggbb", from photographs of the place). Every building the map says nothing of - on a hole's
// ground or beyond it, on every hole - is given walls and a roof from
// these, in place of the game's guess (sim/buildings.mjs: render, brick or
// stone walls, and slate or orange tile by turns - half the real links'
// town was roofed in tile, where every roof is slate): one building the
// same from every hole, picked by where it stands. What the map does say
// stays, and the landmarks are laid on after (landmarkLooks).
export function townLooks(holes, def, helpers) {
  const walls = [].concat(def.town?.walls ?? []).map(colourOf).filter(Boolean);
  const roofs = [].concat(def.town?.roofColour ?? []).map(colourOf).filter(Boolean);
  // How it's built, beside its colours (sim/buildings.mjs raiseBuildings):
  // roofs "mansard" - a flat-topped house's top storey a steep slate slope
  // with dormers in it; chimneys - stacks and their pots on its roofs. Only
  // onto the buildings the map says nothing of.
  const style = { ...(def.town?.roofs === "mansard" ? { mansard: true } : {}), ...(def.town?.chimneys ? { chimneys: true } : {}) };
  if (!walls.length && !roofs.length && !Object.keys(style).length) return holes;
  const chosen = townBuildings(holes, helpers).map((building) => {
    const h = placeHash(building.e, building.n);
    return {
      building,
      look: { ...(walls.length ? { walls: walls[(h >>> 7) % walls.length] } : {}), ...(roofs.length ? { roofColour: roofs[(h >>> 13) % roofs.length] } : {}), ...style },
    };
  });
  return withLooks(holes, chosen, { fill: true, plain: Object.keys(style) });
}

// How far apart two outlines are at their nearest (0 where they touch or
// one runs into the other).
function apart(a, b) {
  let d = Infinity;
  for (const [x, z] of a) d = Math.min(d, insidePolygon(b, x, z) ? 0 : distanceToEdge(b, x, z));
  for (const [x, z] of b) d = Math.min(d, insidePolygon(a, x, z) ? 0 : distanceToEdge(a, x, z));
  return d;
}

// Its landmarks' own colours (the definition's `landmarks`: [{ what, at:
// [lat, lon], walls, roofColour, roof, windows, mansard, chimneys, within
// }]): given to the
// building standing at `at` on every hole that has it - on the hole's
// ground or beyond it - in place of the town's. With `within` (metres),
// to every building joined to it, outline to outline, no further apart
// than that, and to those joined to them, that look as it does (walls,
// roof and its colour): one point for a building the map has as its
// masses, all alike (the real links' hotel by the 17th: ten of them,
// prep.py) - not a house or an annex built against it. A later landmark
// is laid over an earlier one (its sheds, in their own black, without
// windows). windows: false - none in its walls. dormers: true - a dormer
// every few metres along each pitched roof that has a storey in it
// (look/club.js DORMERS). (A landmark's `masses` - its roofs set by hand,
// each where and as high as it stands - are another step's:
// tools/realsteps/handmasses.mjs.)
export function landmarkLooks(holes, def, helpers) {
  if (!def.landmarks?.length) return holes;
  const town = townBuildings(holes, helpers);
  const first = holes.find((h) => h.layout?.geo);
  if (!first) return holes;
  const { toHole, toCourse } = helpers.placed(first.layout);
  let out = holes;
  for (const m of def.landmarks) {
    const p = toCourse(toHole(m.at[0], m.at[1]));
    const set = town.filter((b) => insidePolygon(b.poly, p[0], p[1]));
    if (m.within != null && set.length) {
      // (How each looks now, on its first copy.)
      const lookOf = (b) => {
        const c = b.copies[0];
        const l = out[c.hole].layout[c.looks]?.[c.i] ?? {};
        return `${l.walls ?? ""}|${l.roofColour ?? ""}|${l.roof ?? ""}`;
      };
      const alike = lookOf(set[0]);
      for (let k = 0; k < set.length; k++) {
        for (const b of town) if (!set.includes(b) && lookOf(b) === alike && apart(b.poly, set[k].poly) <= m.within) set.push(b);
      }
    }
    const look = {
      ...(m.roof ? { roof: m.roof } : {}),
      ...(colourOf(m.walls) ? { walls: colourOf(m.walls) } : {}),
      ...(colourOf(m.roofColour) ? { roofColour: colourOf(m.roofColour) } : {}),
      ...(m.windows === false ? { windows: false } : {}),
      ...(typeof m.mansard === "boolean" ? { mansard: m.mansard } : {}),
      ...(typeof m.chimneys === "boolean" ? { chimneys: m.chimneys } : {}),
      ...(m.hall === true ? { hall: true } : {}),
      ...(m.dormers === true ? { dormers: true } : {}),
    };
    out = withLooks(out, set.map((building) => ({ building, look })));
  }
  return out;
}

// The heights the map gives its buildings (height=, metres), where it
// does: [{ e, n, area, height }] on the course (the map's outline, as the
// import lays it: about the course's middle, `origin`).
export function taggedHeights(map, origin) {
  const out = [];
  for (const el of map?.elements ?? []) {
    if (el.type !== "way" || !el.tags?.building || el.tags.building === "no" || !Array.isArray(el.geometry)) continue;
    const height = parseFloat(String(el.tags.height ?? "").replace(",", "."));
    if (!Number.isFinite(height) || height <= 0) continue;
    const poly = el.geometry.map((g) => project(origin, g.lat, g.lon));
    if (poly.length < 3) continue;
    const [e, n] = polygonCentroid(poly);
    out.push({ e, n, area: polygonArea(poly), height });
  }
  return out;
}

// Far copies of buildings as high as they stand (sim/buildings.mjs
// sameBuildingHeights): measured from another hole, else the map's height
// tag (`map`: the course's map, as the import read it). Far lists only.
export function farHeights(holes, def, { map }) {
  const first = holes.find((h) => h.layout?.geo);
  if (!first) return holes;
  return sameBuildingHeights(holes, { tagged: taggedHeights(map, first.layout.geo.origin) });
}
