// A course's character, chosen in the designer (the owner, 23 November
// 2026: "make the course designer able to utilise these features"). What
// the real links was given from its photographs, one definition line at a
// time in tools/realcourse.mjs, here as three choices for any course:
//   - its look: its turf, long grass, sand and air (sim/courselook.mjs,
//     sim/turf.mjs) - a links' fine pale turf, a parkland's lush stripes,
//     a heath's tawny rough;
//   - what its town is built of, where the map doesn't say (sim/
//     townlook.mjs): stone and slate, brick and tile, white render... - one
//     building the same from every hole it's seen from;
//   - its bunkers' faces: stacked turf where the survey shows a face
//     (sim/revetfaces.mjs) - on a course from the map with LiDAR under it.
// Each is kept on the course (course.character) and can be changed back:
// a town style lays its colours over the map's own looks, kept aside the
// first time (layout.mapLooks); faces come off as they went on.
//
// Pure.

import { holeFrame, project, unproject } from "./terrain.mjs";
import { cleanTurf, cleanGrass } from "./courselook.mjs";
import { townLooks } from "./townlook.mjs";
import { revetBunkers, revetSummary } from "./revetfaces.mjs";
import { prepareHole } from "./courseplay.mjs";

// A hole from a map's frame: to the map and back (as tools/realcourse.mjs
// has it for its steps).
export function placedOn(L) {
  const { origin, tee, heading } = L.geo;
  const frame = holeFrame(tee, heading);
  return {
    geoOf: (x, z) => unproject(origin, ...frame.toLocal([x, z])),
    toHole: (lat, lon) => frame.toHole(project(origin, lat, lon)),
    toCourse: (p) => frame.toLocal(p),
    fromCourse: (p) => frame.toHole(p),
  };
}

// Its look. The links' from the real links' photographs (tools/realcourses/
// auld-grey-links.json says how each number was read); the others set the
// same way by eye against the game's own.
export const LOOKS = {
  game: { name: "As the game has it", blurb: "The game's own turf, sand and air for each hole's style" },
  links: {
    name: "Old links: fine, pale and dry",
    blurb: "Pale olive fairways with faint mowing, plain tees, knee-high pale gold long grass with no flowers, grey-buff sand, a clear sea air",
    turf: { tint: [1.34, 0.955, 1.03], stripes: 0.4, tees: 0, rough: [2.8, 1.05, 3.15] },
    grass: { flowers: 0, fescue: 0, marram: 0, long: 0.5 },
    sand: "buff",
    haze: 0.45,
  },
  parkland: {
    name: "Parkland: lush and striped",
    blurb: "Deep green turf with bold mowing stripes, rich rough, white sand, a soft inland haze",
    turf: { tint: [0.9, 1.04, 0.92], stripes: 1, tees: 1, rough: [0.9, 1.02, 0.9] },
    grass: { flowers: 0.3 },
    sand: "white",
    haze: 1.1,
  },
  heath: {
    name: "Heathland: tawny and open",
    blurb: "Firm olive turf, tawny rough among the heather, coarse brown sand, a clear sky",
    turf: { tint: [1.15, 0.97, 0.95], stripes: 0.6, tees: 0.6, rough: [1.6, 1.0, 1.5] },
    grass: { flowers: 0.15, marram: 0 },
    sand: "heath",
    haze: 0.8,
  },
  dry: {
    name: "Dry summer: firm and golden",
    blurb: "Fairways browning at the edges, straw-coloured rough, golden sand, a summer haze",
    turf: { tint: [1.45, 1.0, 0.95], stripes: 0.5, tees: 0.5, rough: [2.2, 1.15, 1.9] },
    grass: { flowers: 0.1, long: 0.7 },
    sand: "golden",
    haze: 1.3,
  },
};

// What the town is built of (each a wall colour by turns, a roof colour by
// turns, and how it's built). The stone and slate from the real links'
// photographs; the others set by eye.
export const TOWNS = {
  map: { name: "As the map says", blurb: "What the map says of each building, the rest the game's guess" },
  stone: {
    name: "Grey stone and slate",
    blurb: "Grey and honey sandstone, pale harled render, slate roofs - a steep slate top storey on the flat-topped houses, chimney pots on every roof (a Scottish town)",
    town: { walls: ["#9b9893", "#8f8a84", "#9e8f71", "#b3aa9c"], roofColour: ["#575a5b", "#4f5356"], roofs: "mansard", chimneys: true },
  },
  brick: {
    name: "Red brick and clay tile",
    blurb: "Red and brown brick under orange-brown clay tile, chimneys on every roof (an English village)",
    town: { walls: ["#8f4a35", "#9c5a42", "#7d4030", "#a8664a"], roofColour: ["#8a4a32", "#9a5a3c", "#7a4430"], chimneys: true },
  },
  render: {
    name: "White render and slate",
    blurb: "White and cream render under dark slate (a coastal village)",
    town: { walls: ["#e8e4da", "#efe9dc", "#dcd6c8"], roofColour: ["#4a4f55", "#3d4248"], chimneys: true },
  },
  sandstone: {
    name: "Honey stone",
    blurb: "Warm honey-coloured stone under grey stone slates (a Cotswold town)",
    town: { walls: ["#c9a874", "#bf9c66", "#d1b384"], roofColour: ["#7d766a", "#6e685e"], chimneys: true },
  },
  timber: {
    name: "Painted timber and shingle",
    blurb: "White, grey and pale blue clapboard under grey shingle (a New England shore)",
    town: { walls: ["#f0eee6", "#c9cdd0", "#b7c7d3"], roofColour: ["#5b5d5c", "#6a6b68"] },
  },
};

// Its bunkers' faces.
export const FACES = {
  ground: { name: "As the ground has them", blurb: "Each bunker's banks as its ground shapes them" },
  revetted: { name: "Revetted: stacked turf", blurb: "A face of stacked turf, nearly upright, where the LiDAR shows a bunker's ground dropping half a metre or more - as an old links' are" },
};

// What's chosen on a course now.
export function characterOf(course) {
  const c = course?.character ?? {};
  return { look: LOOKS[c.look] ? c.look : "game", town: TOWNS[c.town] ? c.town : "map", faces: FACES[c.faces] ? c.faces : "ground" };
}

const mapped = (course) => course.holes.some((h) => h.layout?.geo);
// Whether each choice can be made on a course: a town needs buildings;
// faces a course from the map with LiDAR under its holes.
export function characterChoices(course) {
  const hasBuildings = course.holes.some((h) => h.layout?.buildings?.length || h.layout?.farBuildings?.length);
  const surveyed = course.holes.some((h) => h.layout?.geo?.ground === "lidar" || h.layout?.geo?.lidarCover > 0);
  return { look: true, town: hasBuildings && mapped(course), faces: surveyed && mapped(course) };
}

const setCharacter = (course, key, value, plain) => {
  const character = { ...(course.character ?? {}), [key]: value };
  if (value === plain) delete character[key];
  const out = { ...course, character };
  if (!Object.keys(character).length) delete out.character;
  return out;
};

// The course in a look: every hole's turf and long grass, the course's
// sand and haze (or the game's own back).
export function withLook(course, key) {
  const look = LOOKS[key] ?? LOOKS.game;
  const turf = cleanTurf(look.turf ?? null);
  const grass = cleanGrass(look.grass ?? null);
  const holes = course.holes.map((h) => {
    const layout = { ...h.layout };
    delete layout.turf;
    delete layout.grass;
    if (turf) layout.turf = turf;
    if (grass) layout.grass = grass;
    return { ...h, layout };
  });
  const out = { ...course, holes };
  delete out.sand;
  delete out.haze;
  if (look.sand) out.sand = look.sand;
  if (look.haze != null) out.haze = look.haze;
  return setCharacter(out, "look", LOOKS[key] ? key : "game", "game");
}

// The course's town in a style: the map's own looks for its buildings put
// back (kept aside the first time a style is chosen), then the style laid
// on wherever the map says nothing.
export function withTown(course, key) {
  const style = TOWNS[key] ?? TOWNS.map;
  // The map's own, back.
  let holes = course.holes.map((h) => {
    const L = h.layout;
    if (!L?.mapLooks) return h;
    const layout = { ...L };
    for (const k of ["buildingLooks", "farBuildingLooks"]) {
      if (L.mapLooks[k]) layout[k] = L.mapLooks[k];
      else delete layout[k];
    }
    delete layout.mapLooks;
    return { ...h, layout };
  });
  if (style.town && mapped(course)) {
    const before = holes;
    const made = townLooks(holes, { town: style.town }, { placed: placedOn });
    // Each hole the style changed keeps the map's own aside.
    holes = made.map((h, i) => {
      if (h === before[i]) return h;
      const was = before[i].layout;
      const mapLooks = {};
      if (was.buildingLooks) mapLooks.buildingLooks = was.buildingLooks;
      if (was.farBuildingLooks) mapLooks.farBuildingLooks = was.farBuildingLooks;
      return { ...h, layout: { ...h.layout, mapLooks } };
    });
  }
  return setCharacter({ ...course, holes }, "town", TOWNS[key] && style.town ? key : "map", "map");
}

// Its bunkers' faces: stacked turf where the survey shows a face, or none
// (the ones the survey gave taken off; a wall a bunker has from the map, or
// from the hole editor, stays).
export function withFaces(course, key) {
  let holes = course.holes.map((h) => {
    if (!h.layout?.bunkers?.some((b) => b.surveyed)) return h;
    const bunkers = h.layout.bunkers.map((b) => {
      if (!b.surveyed) return b;
      const { wall: _w, surveyed: _s, ...rest } = b;
      return rest;
    });
    return { ...h, layout: { ...h.layout, bunkers } };
  });
  if (key === "revetted" && mapped(course)) holes = revetBunkers(holes, { bunkers: { faces: "revetted" } }, { placed: placedOn, prepareHole });
  return setCharacter({ ...course, holes }, "faces", key === "revetted" ? "revetted" : "ground", "ground");
}

// How many of its bunkers have a face from the survey: { bunkers, faced }
// (each counted once, however many holes it's seen from).
export function facesSummary(course) {
  if (!mapped(course)) return { bunkers: 0, faced: 0 };
  const { bunkers, faced } = revetSummary(course.holes.filter((h) => h.layout?.geo), placedOn);
  return { bunkers, faced };
}
