// A golf course as mapped in OpenStreetMap, from an Overpass API answer
// (`[out:json] ... out geom;`), into plain lists of shapes in latitude and
// longitude. What OSM's golf tagging gives (wiki: Key:golf):
//   golf=hole        a line from the tee to the green, with ref (the number),
//                    par and handicap
//   golf=tee / green / fairway / bunker / rough / water_hazard /
//        lateral_water_hazard / pin   the parts of each hole
//   natural=water, natural=sand, natural=wood, landuse=forest, natural=scrub,
//   natural=tree (a point), natural=tree_row (a line)
//   building=*       the clubhouse, sheds and houses by the boundary: kept
//                    so trees found in LiDAR aren't put on their roofs
//   golf=cartpath, golf=path, and paths, tracks and service roads inside
//                    the course (highway=path/track/service/footway/
//                    cycleway/bridleway): its cart paths, as lines, with
//                    their width and surface where mapped
//   barrier=retaining_wall, barrier=wall   walls, as lines, with what
//                    they're built of and how high where mapped: one along
//                    a pond's bank (or a bunker's edge) becomes its wall
//                    (sim/walls.mjs) - seldom mapped, but kept when it is
//
// Mapping varies a lot from course to course, so everything here is
// optional and nothing throws on odd data: a course with holes but no
// bunkers comes out with no bunkers, and the designer says what was found.

// One ring: [[lat, lon], ...], not closed.
function ring(geometry) {
  const pts = (geometry ?? []).filter((g) => g && Number.isFinite(g.lat) && Number.isFinite(g.lon)).map((g) => [g.lat, g.lon]);
  if (pts.length > 1) {
    const [a, b] = [pts[0], pts[pts.length - 1]];
    if (a[0] === b[0] && a[1] === b[1]) pts.pop();
  }
  return pts;
}

const closed = (geometry) => {
  const g = geometry ?? [];
  return g.length > 3 && g[0].lat === g[g.length - 1].lat && g[0].lon === g[g.length - 1].lon;
};

// A multipolygon relation's outer rings, joining ways that meet end to end.
function outerRings(rel) {
  const parts = (rel.members ?? []).filter((m) => m.type === "way" && (m.role === "outer" || m.role === "") && m.geometry?.length);
  const rings = [];
  const open = [];
  for (const m of parts) (closed(m.geometry) ? rings.push(ring(m.geometry)) : open.push(m.geometry.map((g) => [g.lat, g.lon])));
  // Stitch the open pieces.
  const same = (a, b) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
  while (open.length) {
    let line = open.shift();
    let grew = true;
    while (grew && !same(line[0], line[line.length - 1])) {
      grew = false;
      for (let i = 0; i < open.length; i++) {
        const o = open[i];
        const end = line[line.length - 1];
        if (same(end, o[0])) line = line.concat(o.slice(1));
        else if (same(end, o[o.length - 1])) line = line.concat([...o].reverse().slice(1));
        else continue;
        open.splice(i, 1);
        grew = true;
        break;
      }
    }
    if (line.length > 3) {
      if (same(line[0], line[line.length - 1])) line.pop();
      rings.push(line);
    }
  }
  return rings.filter((r) => r.length >= 3);
}

// Which list a tagged shape belongs in, or null.
function kindOf(tags = {}) {
  const golf = tags.golf;
  if (golf === "green") return "greens";
  if (golf === "tee") return "tees";
  if (golf === "fairway") return "fairways";
  if (golf === "bunker") return "bunkers";
  if (golf === "water_hazard" || golf === "lateral_water_hazard") return "water";
  if (tags.natural === "water" || tags.water || tags.landuse === "reservoir" || tags.landuse === "basin") return "water";
  if (tags.natural === "sand") return "bunkers";
  if (tags.natural === "wood" || tags.landuse === "forest" || tags.natural === "scrub") return "woods";
  if (tags.building && tags.building !== "no") return "buildings";
  return null;
}

// A line mapped as a path inside the course that plays as a cart path: its
// width (metres) and surface (sim/paths.mjs: 0 asphalt, 1 concrete, 2
// gravel) - or null if it isn't one. Car parks, drives, tunnels, grass
// tracks (a mown track is grass) and paths closed to all aren't.
const PATH_HIGHWAYS = new Set(["path", "track", "service", "footway", "cycleway", "bridleway"]);
const SURFACE = {
  asphalt: 0, paved: 0, chipseal: 0, tarmac: 0,
  concrete: 1, "concrete:plates": 1, "concrete:lanes": 1, paving_stones: 1, sett: 1,
  gravel: 2, fine_gravel: 2, compacted: 2, dirt: 2, ground: 2, unpaved: 2, pebblestone: 2, earth: 2, woodchips: 2,
};
export function cartPathOf(tags = {}) {
  const golf = tags.golf === "cartpath" || tags.golf === "path";
  if (!golf && !PATH_HIGHWAYS.has(tags.highway)) return null;
  if (["parking_aisle", "driveway", "drive-through"].includes(tags.service)) return null;
  if (tags.area === "yes" || (tags.tunnel && tags.tunnel !== "no") || tags.covered === "yes" || tags.access === "no") return null;
  if (tags.surface === "grass") return null;
  const cart = tags.golf === "cartpath" || ["designated", "yes", "permissive"].includes(tags.golf_cart);
  const tagged = parseFloat(String(tags.width ?? "").replace(",", "."));
  const width = Number.isFinite(tagged) && tagged > 0 ? tagged : cart ? 2.4 : ["service", "track"].includes(tags.highway) ? 3 : 1.5;
  const surface = SURFACE[tags.surface] ?? (tags.highway === "track" ? 2 : 0);
  return { width, surface };
}

const num = (v) => {
  const n = parseInt(String(v ?? "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

// The Overpass answer -> { name, holes, greens, tees, fairways, bunkers,
// water, woods, buildings, trees, treeRows, pins, paths, walls, bounds }.
// Shapes are rings of [lat, lon]; holes are { ref, par, handicap, line };
// paths are { line, width, surface }; walls { line, material, height }
// (material and height null if not mapped).
// Shapes mapped as a single point, drawn round it: which list, how big
// (metres), how many sides.
const POINT_SHAPES = { tee: { list: "tees", r: 5, n: 4 }, green: { list: "greens", r: 14, n: 20 }, bunker: { list: "bunkers", r: 4, n: 12 } };
export function ringAround(lat, lon, r, n) {
  const dlat = r / 111320;
  const dlon = r / (111320 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: n }, (_, k) => {
    const a = (k / n) * 2 * Math.PI + (n === 4 ? Math.PI / 4 : 0);
    return [lat + Math.sin(a) * dlat, lon + Math.cos(a) * dlon];
  });
}

export function parseOverpass(json, { name = null } = {}) {
  const out = { name, holes: [], greens: [], tees: [], fairways: [], bunkers: [], water: [], woods: [], buildings: [], trees: [], treeRows: [], pins: [], paths: [], walls: [] };
  let bounds = null;
  const grow = ([lat, lon]) => {
    bounds ??= { north: lat, south: lat, east: lon, west: lon };
    bounds.north = Math.max(bounds.north, lat);
    bounds.south = Math.min(bounds.south, lat);
    bounds.east = Math.max(bounds.east, lon);
    bounds.west = Math.min(bounds.west, lon);
  };
  for (const el of json?.elements ?? []) {
    const tags = el.tags ?? {};
    if (tags.leisure === "golf_course" && tags.name && !out.name) out.name = tags.name;
    if (el.type === "node") {
      if (!Number.isFinite(el.lat) || !Number.isFinite(el.lon)) continue;
      if (tags.natural === "tree") out.trees.push([el.lat, el.lon]);
      if (tags.golf === "pin") out.pins.push([el.lat, el.lon]);
      // A tee, green or bunker mapped only as a point: an outline of a
      // usual size round it (a tee 10 x 8 m, a green 14 m across a little
      // each way, a bunker 4 m), so the hole still has it.
      const ring = POINT_SHAPES[tags.golf];
      if (ring) out[ring.list].push(ringAround(el.lat, el.lon, ring.r, ring.n));
      continue;
    }
    if (el.type === "way" && tags.golf === "hole") {
      const line = (el.geometry ?? []).filter((g) => Number.isFinite(g?.lat)).map((g) => [g.lat, g.lon]);
      if (line.length < 2) continue;
      line.forEach(grow);
      out.holes.push({ ref: num(tags.ref), par: num(tags.par), handicap: num(tags.handicap), name: tags.name ?? null, line });
      continue;
    }
    if (el.type === "way" && tags.natural === "tree_row") {
      const line = (el.geometry ?? []).filter((g) => Number.isFinite(g?.lat)).map((g) => [g.lat, g.lon]);
      if (line.length >= 2) out.treeRows.push(line);
      continue;
    }
    if (el.type === "way" && (tags.barrier === "retaining_wall" || tags.barrier === "wall")) {
      const line = (el.geometry ?? []).filter((g) => Number.isFinite(g?.lat) && Number.isFinite(g?.lon)).map((g) => [g.lat, g.lon]);
      const height = parseFloat(String(tags.height ?? "").replace(",", "."));
      if (line.length >= 2) out.walls.push({ line, material: tags.material ?? null, height: Number.isFinite(height) && height > 0 ? height : null });
      continue;
    }
    const cart = el.type === "way" ? cartPathOf(tags) : null;
    if (cart) {
      const line = (el.geometry ?? []).filter((g) => Number.isFinite(g?.lat) && Number.isFinite(g?.lon)).map((g) => [g.lat, g.lon]);
      if (line.length >= 2) out.paths.push({ line, ...cart });
      continue;
    }
    const kind = kindOf(tags);
    if (!kind) continue;
    const rings = el.type === "relation" ? outerRings(el) : closed(el.geometry) ? [ring(el.geometry)] : [];
    for (const r of rings) if (r.length >= 3) out[kind].push(r);
  }
  out.holes.sort((a, b) => (a.ref ?? 999) - (b.ref ?? 999));
  out.bounds = bounds;
  return out;
}

// The Overpass query for everything inside a golf course's outline, given
// its OSM way or relation id; the leisure=golf_course shape itself comes
// back too, for its name. Wood and water just outside the fence matter to
// the look of the holes by the boundary, so the search reaches a little
// beyond it; so do buildings, which LiDAR trees are kept off. Paths and
// tracks only inside it: they're its cart paths.
export function overpassQuery({ type, id }) {
  return `[out:json][timeout:90];
${type}(${Number(id)})->.course;
.course map_to_area->.a;
(
  .course;
  nwr(area.a)["golf"];
  nwr(area.a)["natural"~"^(water|wood|scrub|sand|tree|tree_row)$"];
  nwr(area.a)["landuse"~"^(forest|reservoir|basin)$"];
  nwr(area.a)["water"];
  way(area.a)["highway"~"^(path|track|service|footway|cycleway|bridleway)$"];
  way(area.a)["barrier"~"^(retaining_wall|wall)$"];
  nwr(around.course:80)["natural"~"^(water|wood|tree)$"];
  nwr(around.course:80)["landuse"="forest"];
  wr(area.a)["building"];
  wr(around.course:80)["building"];
);
out geom;`;
}

// The same, by the box round the course instead of inside its outline: for
// when the outline finds nothing. Overpass looks "inside" up in an index of
// areas it builds from the map, which runs hours or days behind the latest
// edits and leaves some outlines out altogether - so a course mapped last
// week can come back with no holes. The box takes in a little of the
// neighbours; holes are what matter, and the importer keeps the right ones.
export function overpassBoxQuery(box) {
  const b = [box.south, box.west, box.north, box.east].map((v) => Number(v).toFixed(6)).join(",");
  return `[out:json][timeout:90][bbox:${b}];
(
  nwr["leisure"="golf_course"];
  nwr["golf"];
  nwr["natural"~"^(water|wood|scrub|sand|tree|tree_row)$"];
  nwr["landuse"~"^(forest|reservoir|basin)$"];
  nwr["water"];
  way["highway"~"^(path|track|service|footway|cycleway|bridleway)$"];
  way["barrier"~"^(retaining_wall|wall)$"];
  wr["building"];
);
out geom;`;
}

// The box round the course's own outline in an Overpass answer (out geom
// gives each way and relation its bounds), a little bigger, or null.
export function courseBox(json, { type, id }, pad = 0.0008) {
  const el = (json?.elements ?? []).find((e) => e.type === type && String(e.id) === String(id));
  const b = el?.bounds;
  if (!b || ![b.minlat, b.minlon, b.maxlat, b.maxlon].every(Number.isFinite)) return null;
  return { south: b.minlat - pad, west: b.minlon - pad, north: b.maxlat + pad, east: b.maxlon + pad };
}

// What's wrong with an Overpass answer that came back "OK": a busy server
// that ran out of time or memory says so in a remark, with nothing (or only
// part) of the course. Null when it's fine.
export function overpassTrouble(json) {
  if (!json || !Array.isArray(json.elements)) return "an answer that wasn't map data";
  const remark = typeof json.remark === "string" ? json.remark : "";
  if (/error|timed out|out of memory|too busy|rate_limited/i.test(remark)) return remark.replace(/\s+/g, " ").trim().slice(0, 160);
  return null;
}

// Whether an answer has holes to build a course from.
export const hasHoles = (json) => (json?.elements ?? []).some((e) => e.type === "way" && e.tags?.golf === "hole");
