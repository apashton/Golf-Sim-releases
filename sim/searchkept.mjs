// What the course maker's search kept (sim/coursesearch.mjs, Best holes),
// made again in a moment from its record - for the ready-made courses
// (sim/starters.mjs): the search plays every hole in the head and takes a
// minute or more, so it was run once (tools/videocourse.mjs --search) and
// what it kept is written down with each course, which is then made from
// that the same on every PC. And a searched course laid on hills. Pure.

import { rebuildHole } from "./course.mjs";
import { coursePlaces } from "./imaginary.mjs";

// A course as the search left it, from the course as first made: its
// holes kept where the routing put them (as the course maker keeps them
// for the search: designer.js keepRouting), each hole it kept a new design
// of made again from that design's seed (as rebuildHole made the one it
// tried), the stroke indexes it set from how the holes play (si, if it set
// them: record.si), and its record kept with it as `search`. record: the
// search's (coursesearch.mjs best's).
export function asSearched(course, { record, si = null } = {}) {
  let c = { ...course, routing: course.routing ?? coursePlaces(course) };
  for (const h of record?.holes ?? []) {
    if (h.kept == null) continue;
    const i = h.hole - 1;
    const old = c.holes[i];
    const holes = c.holes.slice();
    holes[i] = { spec: { ...old.spec, seed: h.kept }, layout: rebuildHole(c, i, { seed: h.kept }).holes[i].layout };
    c = { ...c, holes };
  }
  if (record?.si && Array.isArray(si)) c = { ...c, holes: c.holes.map((h, i) => ({ ...h, spec: { ...h.spec, si: si[i] }, layout: { ...h.layout, si: si[i] } })) };
  return { ...c, search: record };
}

// A searched course to lay on hills (sim/imaginary.mjs withHills): without
// the routing kept for the search, so its holes are routed over the hills
// as they are - finding the land, the climbs and the falls (routing.mjs) -
// as a course made without the search is, rather than where they lay on
// the flat.
export function forHills(course) {
  const { routing, ...rest } = course;
  return rest;
}
