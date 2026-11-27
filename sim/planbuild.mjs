// What the course plan says beyond the map, laid on a course once the
// import has built its holes from the plan (server/mapimport.mjs build):
// each hole's White and Red tee boxes as the player coloured them (its
// layout.teeAt, as tools/realcourse.mjs sets a real course's: sim/tees.mjs
// plays them where they are), and its burns - each the real links'
// stone-walled channel through the turf (sim/burn.mjs burnChannel), with
// bridges where the player put them and wherever a path crosses (sim/
// burn.mjs handBridges, sim/planextras.mjs bridgesOf).
//
// (The card's pars and stroke indexes go in with the holes:
// courseplan.mjs surveyFromPlan.)
//
// Pure.

import { project, unproject, holeFrame } from "./terrain.mjs";
import { burnChannel, handBridges } from "./burn.mjs";
import { bridgesOf, BRIDGE, SET_REACH } from "./planextras.mjs";

const r2 = (v) => Math.round(v * 100) / 100;

// A hole's own frame from the map and back (as tools/realcourse.mjs
// placed(L) has it).
export function placed(L) {
  const { origin, tee, heading } = L.geo;
  const frame = holeFrame(tee, heading);
  return {
    geoOf: (x, z) => unproject(origin, ...frame.toLocal([x, z])),
    toHole: (lat, lon) => frame.toHole(project(origin, lat, lon)),
    toCourse: (p) => frame.toLocal(p),
    fromCourse: (p) => frame.toHole(p),
  };
}

// The plan's metres to [lat, lon].
const geoOf = (plan) => (p) => {
  const g = unproject(plan.origin, p[0], p[1]);
  return [g.lat, g.lon];
};

// course: as the import built it (its holes numbered as the plan's);
// plan: the plan it was built from (cleanPlan); paths: the map's paths in
// the plan's metres (courseplan.mjs localShapes), for bridges where they
// cross a burn. Returns { course, report: { teeSets, setsLeftOut, burns,
// bridges } }.
export function applyPlan(course, plan, { paths = [] } = {}) {
  const geo = geoOf(plan);
  const report = { teeSets: 0, setsLeftOut: 0, burns: 0, bridges: 0 };
  // Tee sets.
  let holes = course.holes.map((h) => {
    const mine = plan.holes[h.spec.number - 1]?.sets;
    if (!mine || !h.layout?.geo) return h;
    const { toHole } = placed(h.layout);
    const teeAt = {};
    for (const c of ["white", "red"]) {
      if (!mine[c]) continue;
      const [x, z] = toHole(...geo(mine[c])).map(r2);
      // Where the game takes a named box: the White behind the Yellow, the
      // Red in front, near the line (sim/tees.mjs).
      if (Math.abs(x) <= SET_REACH.along && Math.abs(z) <= SET_REACH.side && (c === "white" ? x < 0 : x > 0)) teeAt[c] = [x, z];
      else report.setsLeftOut++;
    }
    if (!Object.keys(teeAt).length) return h;
    report.teeSets++;
    return { ...h, layout: { ...h.layout, teeAt } };
  });
  // Burns and their bridges (every burn's at once: a hole keeps one list).
  const helpers = { placed };
  const bridges = [];
  for (const b of plan.burns ?? []) {
    const before = holes;
    holes = burnChannel(holes, { burn: { line: b.line.map(geo), width: b.width, walls: "stone", marks: false } }, helpers);
    if (holes.some((h, i) => h !== before[i])) report.burns++;
    for (const x of bridgesOf(b, paths)) bridges.push({ from: geo(x.from), to: geo(x.to), width: BRIDGE.width, look: "arch" });
  }
  if (bridges.length) {
    holes = handBridges(holes, { bridges }, helpers);
    report.bridges = bridges.length;
  }
  return { course: { ...course, holes }, report };
}
