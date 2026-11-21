// Finding a course among many (the owner, 3 November 2026: "If the user
// builds a lot of courses, it'll be a mess. Can we make it more of pick
// existing course, into a course picker with filters etc to hone down or
// word search options"): what kind of course each one is, worked out once
// from the course itself and kept in its line of the course list
// (server/courses.mjs, sim/pocketserver.mjs courseSummary) - then the list
// searched by words, narrowed by filters and sorted (coursefinder.js draws
// it: the course panel's picker and the designer's list). Pure.

import { seaShape } from "./coast.mjs";

// How a course looks, from its holes' trees: links (no trees: dunes or
// long grass), parkland, woodland or open - or mixed, when no one look
// holds most of its holes.
export const LOOKS = ["links", "parkland", "woodland", "open", "mixed"];
export const LOOK_NAMES = { links: "Links", parkland: "Parkland", woodland: "Woodland", open: "Open", mixed: "Mixed" };
// Its ground: flat, made-up hills (sim/imaginary.mjs HILLS), or a real
// course's own (from the map).
export const GROUNDS = ["flat", "gentle", "rolling", "hilly", "mountain", "real"];
export const GROUND_NAMES = { flat: "Flat", gentle: "Gentle hills", rolling: "Rolling hills", hilly: "Hilly", mountain: "Mountain", real: "Real ground" };
// Where it came from: one that comes with the game, one designed here, or
// a real course from the map.
export const ORIGINS = ["game", "made", "real"];
export const ORIGIN_NAMES = { game: "Comes with the game", made: "Designed", real: "Real courses", friend: "Friends' courses" };

// The share of a course's holes one look needs to be its look.
export const LOOK_SHARE = 0.67;

function holeLook(h) {
  const trees = h?.spec?.options?.trees;
  if (h?.layout?.links || trees === "dunes" || trees === "greenlinks") return "links";
  if (trees === "heavy") return "woodland";
  if (trees === "light") return "open";
  return "parkland";
}

// What kind of course it is: { look, ground, sea, origin } - from the
// course itself (its holes, its source, its coast). It came with the game
// if it's built in, or a ready-made one each player is given (stamped
// starter on the PC: server/starter.mjs; game, for the phone app's, which
// are all the game's: tools/androidweb.mjs); a friend's if it was fetched
// by its code.
export function courseFacts(course, { game = false } = {}) {
  const holes = Array.isArray(course?.holes) ? course.holes : [];
  const counts = {};
  for (const h of holes) {
    const l = holeLook(h);
    counts[l] = (counts[l] ?? 0) + 1;
  }
  const [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ["parkland", 0];
  const look = holes.length && n / holes.length >= LOOK_SHARE ? top : holes.length ? "mixed" : "parkland";
  const kind = course?.source?.kind;
  const ground = kind === "osm" ? "real" : kind === "imaginary" ? (GROUNDS.includes(course.source.hills) ? course.source.hills : "rolling") : "flat";
  let sea = false;
  try {
    sea = !!seaShape(course);
  } catch {
    sea = false;
  }
  // A friend's, fetched by its code (sim/sharedcourse.mjs): theirs, whatever it is.
  const origin = course?.shared?.code ? "friend" : kind === "osm" ? "real" : game || course?.builtIn || course?.starter ? "game" : "made";
  return { look, ground, sea, origin };
}

// The filters, each a set of values a course has one of (the values
// named): only those the list has more than one of are offered.
export const FILTERS = [
  { id: "holes", name: "Holes", values: { 9: "9 holes", 18: "18 holes", other: "Other" }, of: (c) => (c.holes === 9 || c.holes === 18 ? String(c.holes) : "other") },
  { id: "look", name: "Look", values: LOOK_NAMES, of: (c) => c.look ?? null },
  { id: "ground", name: "Ground", values: GROUND_NAMES, of: (c) => c.ground ?? null },
  { id: "sea", name: "Sea", values: { sea: "By the sea", inland: "Inland" }, of: (c) => (c.sea == null ? null : c.sea ? "sea" : "inland") },
  { id: "origin", name: "From", values: ORIGIN_NAMES, of: (c) => c.origin ?? (c.builtIn ? "game" : null) },
  { id: "played", name: "Played", values: { played: "Played", new: "Not played yet" }, of: (c) => (c.rounds > 0 || c.played ? "played" : "new") },
];
const FILTER = Object.fromEntries(FILTERS.map((f) => [f.id, f]));

// The orders a list can be in.
export const SORTS = { name: "A to Z", played: "Played lately", newest: "Newest", longest: "Longest", shortest: "Shortest" };

// The filters worth offering for a list: each with its values the list
// has (in the filter's own order) and how many courses have each - only a
// filter with two or more values.
export function filterChoices(list) {
  const out = [];
  for (const f of FILTERS) {
    const counts = new Map();
    for (const c of Array.isArray(list) ? list : []) {
      const v = f.of(c);
      if (v != null && v in f.values) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    if (counts.size < 2) continue;
    out.push({ id: f.id, name: f.name, values: Object.keys(f.values).filter((v) => counts.has(v)).map((v) => ({ value: v, name: f.values[v], count: counts.get(v) })) });
  }
  return out;
}

// How many courses each filter's values would leave, with the words typed
// and the other filters chosen as they are (a filter's own choice set
// aside): { filterId: { value: count } } - so a chip says what pressing it
// gives, and one that would give nothing can say so.
export function facetCounts(list, { words = "", filters = {} } = {}) {
  const chosen = cleanFilters(filters);
  const out = {};
  for (const f of FILTERS) {
    const others = { ...chosen };
    delete others[f.id];
    const counts = {};
    for (const c of findCourses(list, { words, filters: others })) {
      const v = f.of(c);
      if (v != null) counts[v] = (counts[v] ?? 0) + 1;
    }
    out[f.id] = counts;
  }
  return out;
}

// The words a course is found by: its name, what kind it is, its holes
// and par.
export function courseWords(c) {
  const kinds = [LOOK_NAMES[c.look], GROUND_NAMES[c.ground], c.sea ? "by the sea seaside coast" : c.sea === false ? "inland" : null, ORIGIN_NAMES[c.origin ?? (c.builtIn ? "game" : "")], c.origin === "real" ? "real map" : null];
  return [c.name, ...kinds, Number.isFinite(c.holes) ? `${c.holes} holes` : null, Number.isFinite(c.par) ? `par ${c.par}` : null].filter(Boolean).join(" ").toLowerCase();
}

const time = (v) => {
  const t = Date.parse(v ?? "");
  return Number.isFinite(t) ? t : -Infinity;
};
const byName = (a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "en", { sensitivity: "base" });
const ORDER = {
  name: byName,
  played: (a, b) => time(b.played) - time(a.played) || byName(a, b),
  newest: (a, b) => time(b.updated) - time(a.updated) || byName(a, b),
  longest: (a, b) => (b.yards ?? 0) - (a.yards ?? 0) || byName(a, b),
  shortest: (a, b) => (a.yards ?? 0) - (b.yards ?? 0) || byName(a, b),
};

// The courses that match: every word typed found in the course's words
// (in any order, any part of a word), every filter chosen ({ id: value })
// held, in the order asked for.
export function findCourses(list, { words = "", filters = {}, sort = "name" } = {}) {
  const parts = String(words ?? "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const chosen = Object.entries(filters ?? {}).filter(([id, v]) => FILTER[id] && v != null && v !== "");
  return (Array.isArray(list) ? list : [])
    .filter((c) => c && chosen.every(([id, v]) => FILTER[id].of(c) === v))
    .filter((c) => {
      if (!parts.length) return true;
      const hay = courseWords(c);
      return parts.every((p) => hay.includes(p));
    })
    .sort(ORDER[sort] ?? ORDER.name);
}

// A course's line under its name: holes, par, length, what kind it is and
// its best round.
export function courseLine(c) {
  const n = (v) => (Number.isFinite(v) ? Math.round(v).toLocaleString("en-GB") : null);
  return [
    Number.isFinite(c.holes) ? `${c.holes} ${c.holes === 1 ? "hole" : "holes"}` : null,
    Number.isFinite(c.par) ? `par ${c.par}` : null,
    n(c.yards) ? `${n(c.yards)} yds` : null,
    c.look && c.look !== "mixed" ? LOOK_NAMES[c.look] : null,
    c.ground && c.ground !== "flat" ? GROUND_NAMES[c.ground] : null,
    c.sea ? "by the sea" : null,
    Number.isFinite(c.best) ? `best ${c.best}${c.bestBy ? ` (${c.bestBy})` : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

// The filters chosen, kept clean: only filters there are and values they
// have.
export function cleanFilters(filters) {
  const out = {};
  for (const [id, v] of Object.entries(filters && typeof filters === "object" ? filters : {})) if (FILTER[id] && typeof v === "string" && v in FILTER[id].values) out[id] = v;
  return out;
}
