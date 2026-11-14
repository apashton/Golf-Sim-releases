// Playing a hole: where each shot goes, what it lands on, penalties, putts.
//
// Works in the hole's frame (see course.mjs). The launch monitor's numbers
// are for a shot along the player's aim; `aim` is that line's direction in
// the hole frame (radians, 0 = straight down x, positive to the right).
// Pure functions, shared by the play mode and the tests.

import { holeBearing, gustFor, flightWind, groundPush, roundGround, dryFor } from "./weather.mjs";
import { simulateFlight, bounce, touchdown, skidDecel, SURFACES, YARD, MPH, RPM } from "./flight.mjs";
import { rollBall, rollingDecel, finishFeet, landNearCup, landedAt, HOLE_RADIUS, FOOT, greenHeight, greenGradient } from "./putting.mjs";
import { surfaceAt, makePath, nearest, pointAt, LIES, DEEP_ROUGH, lieRaster, MAPPED_DEEP, LIE_CODES, insideBlob, potShape, sinkShape } from "./course.mjs";
import { bushesFor, bushFits, BUSH_REACH } from "./bushes.mjs";
import { validLock, liveLock, lockedTrees, keptTree, makeLock, keyOf } from "./treelock.mjs";
import { teeSpots } from "./tees.mjs";
import { unpackGrid, gridHeight, insideOutline } from "./terrain.mjs";
import { holeRolls, greenGrain, firmnessAt } from "./rolls.mjs";
import { plugChance, plugKind, sandWet, wetSandSurface, DEFAULT_PLUGS } from "./sand.mjs";
import { skipChance, WATER_SKIP } from "./skip.mjs";
import { courseGreen, idealLine } from "./puttguide.mjs";
import { dayPin } from "./pinday.mjs";
import { penaltyOf, penaltyDrop, waterAt } from "./penalty.mjs";
import { applyLie, LIE_EFFECT, FLAT, middleCarry, middleCarryFor } from "./lie.mjs";
import { lieOutcome } from "./lieguide.mjs";
import { BAG } from "./clubs.mjs";
import { withEdits, groundShaping, clearCrowns, underHandTree, bunkerEdgeAhead, hitsFace, faceWidthAt, LIP } from "./holeedits.mjs";
import { pondLevel, wallOf, wallDistance } from "./walls.mjs";
import { brookLevels } from "./brooks.mjs";
import { treeIndex, treeState, treeStep, hashNumbers, treeForm, apartTrees } from "./treehits.mjs";
import { palettedTrees, standsSeed } from "./treepalette.mjs";
import { offCauseways } from "./causeway.mjs";
import { withWoodEdges } from "./woodedge.mjs";
import { joinPots } from "./potjoin.mjs";

export { LIE_EFFECT, BAG };

// How each surface takes a bounce.
const BOUNCE = {
  tee: SURFACES.fairway,
  fairway: SURFACES.fairway,
  fringe: SURFACES.approach,
  green: SURFACES.green,
  semi: SURFACES.semi,
  rough: SURFACES.rough,
  deep: SURFACES.deep,
  trees: SURFACES.deep,
  bunker: SURFACES.sand,
  greenside: SURFACES.sand,
  // A waste area's firm sand and scrub (sim/wastearea.mjs).
  waste: SURFACES.waste,
  // Asphalt is asphalt, whether the fairways are playing soft or firm.
  path: SURFACES.path,
};

// The course's ground: how its fairways take a landing, and how much more
// or less than usual the fairways, tees, fringes and first cut slow a
// rolling ball. Greens keep their stimp; rough, sand and water don't change.
export const GROUND = {
  soft: { name: "Soft", fairway: SURFACES.soft, decel: 2 },
  normal: { name: "Normal", fairway: SURFACES.fairway, decel: 1 },
  firm: { name: "Firm", fairway: SURFACES.firm, decel: 0.8 },
};
const GROUND_SCALED = new Set(["tee", "fairway", "fringe", "semi"]);

// The typical amateur bag, for suggesting a club and for test shots, lives
// in clubs.mjs with the clubs' names and order; it's passed on from here too.
export const BAG_ORDER = Object.keys(BAG);

// ---- Helpers for a hole ------------------------------------------------------

// The flight's air for a shot on a hole in a round's weather: { wind,
// temperatureC, altitudeM, humidity } for simulateFlight, or nothing in still air.
// ball, groundAt: where it's played from and the ground's rise under the
// flight (the shot's frame), so the wind goes by the height above the
// ground; gusts: the owner's setting for gusts during the flight (only in a
// wind of FLIGHT_GUSTS.mph and up). Trees along the hole shelter the air
// near the ground beyond the tree line (weather.mjs flightWind).
export function weatherAir(weather, hole, aim, shot, { ball = null, groundAt = null, gusts = true } = {}) {
  if (!weather) return {};
  const bearing = holeBearing(hole) + (aim * 180) / Math.PI;
  const seed = Math.round((shot.speedMph ?? 0) * 1000 + (shot.vla ?? 0) * 100 + (shot.totalSpin ?? 0));
  const gust = gustFor(weather.wind, seed);
  const out = {};
  const line = hole.layout?.treeLine;
  const shelter =
    ball && hole.path && Number.isFinite(line)
      ? (fx, fz) => {
          const [hx, hz] = toHole(ball, aim, fx, fz);
          const d = Math.abs(nearest(hole.path, hx, hz).d);
          return Math.min(1, Math.max(0, (d - (line - 15)) / 15));
        }
      : null;
  const wind = flightWind(gust, bearing, { seed, ground: groundAt, gusts, shelter });
  if (wind) out.wind = wind;
  if (Number.isFinite(weather.temperatureC)) out.temperatureC = weather.temperatureC;
  // (The course's altitude and humidity, when it has them.)
  if (weather.altitudeM > 0) out.altitudeM = weather.altitudeM;
  if (weather.humidity > 0) out.humidity = weather.humidity;
  return out;
}

// A hole's trees as they grow (layout: with its edits laid on): those by
// a pond marked, so that as likely as not one is a weeping willow, and on
// a course (stands: sim/treepalette.mjs standsFor) those of no given kind
// growing in stands of the hole's kinds (palettedTrees; a seed alone, of
// the newer kinds: treehits.mjs treeForm, treeStands). The same
// trees whether the hole is played or seen from another hole
// (sim/neighbours.mjs).
// None standing in another (treehits.mjs apartTrees; a map's real trees,
// which have their kind, stay); `apart: false` keeps every one, in the
// layout's order. None on or by an island green's causeway to land
// (sim/causeway.mjs), whether made, real or planted by hand. And those at
// a wood's edge marked, their open side to the hole's line of play and not
// to another hole's ground (sim/woodedge.mjs: they grow reaching out to
// it, treehits.mjs EDGE_FORM) - from the trees as they grow here, so the
// same wherever the hole is seen from (`edges: false` leaves them
// unmarked: only their kinds wanted, grownKinds).
export function grownTrees(layout, stands = null, { apart = true, edges = true } = {}) {
  const byWater = (t) => t[3] == null && (layout.water ?? []).some((w) => insideBlob(w, t[0], t[1], 14));
  const marked = offCauseways(layout, layout.trees ?? []).map((t) => (byWater(t) ? [t[0], t[1], t[2] ?? 1, t[3], t[4] ?? 1, t[5], t[6], 1] : t));
  // (Thinned before the stands are laid on, so it's the same trees on a
  // course as in the Challenges.)
  const spaced = apart ? apartTrees(marked) : marked;
  // (On a course, in stands of the hole's kinds: sim/treepalette.mjs.)
  const grown = stands == null ? spaced : palettedTrees(spaced, stands);
  return edges ? withWoodEdges(grown, { path: layout.path, otherGround: layout.otherGround }) : grown;
}

// A hole's trees as they grow (grownTrees) - as they first grew, if it
// has them kept (sim/treelock.mjs: its stored layout's treeLock). layout:
// the stored one with its edits laid on (playLayout, withEdits).
// Returns { trees, lock, exact, kept } - lock: the one it has, or null;
// exact: the trees are the lock's, nothing changed since; kept(): the
// trees as a lock keeps them (treelock.mjs keptTree), for a lock afresh.
export function keptTrees(stored, layout, stands = null) {
  // (Not if it's been told to grow them afresh since: liveLock.)
  const lock = liveLock(validLock(stored?.treeLock), stored?.edits);
  const handAt = new Set((layout?.handTrees ?? []).map(([x, z]) => `${x},${z}`));
  const hand = (t) => handAt.has(`${t[0]},${t[1]}`);
  const keep = (trees) => () => trees.map((t) => keptTree(t, hand(t)));
  if (!lock) {
    const trees = grownTrees(layout, stands);
    return { trees, lock, exact: false, kept: keep(trees) };
  }
  const edits = stored.edits ?? [];
  const grow = (list) => (list === edits ? grownTrees(layout, stands) : grownTrees(playLayout({ ...stored, edits: list }), stands));
  const { trees, exact } = lockedTrees(lock, edits, grow, hand);
  return { trees, lock, exact, kept: keep(trees) };
}

// What kind each of a hole's trees grows as (sim/treeshapes.mjs KINDS'
// index), in the order it keeps them - its own if it's given one, else as
// grownTrees and treehits.mjs treeForm have it.
// (As it first grew, where the hole's trees are kept: sim/treelock.mjs.)
export function grownKinds(layout, stands = null) {
  const lock = validLock(layout?.treeLock);
  const kept = lock ? new Map(lock.trees.map((t) => [keyOf(t), t])) : null;
  return grownTrees(layout, stands, { apart: false, edges: false }).map((t) => treeForm(kept?.get(keyOf(t)) ?? t).kind);
}

// A hole's layout as it's played (prepareHole's, before its trees grow and
// the day's pin is cut): changes made by hand laid on, its bunkers as
// they're dug, and (tees) its tee boxes worked out - so a hole not built
// yet can be drawn as it will be (the next tee from the hole before:
// sim/nexttee.mjs).
export function playLayout(stored, { tees = false } = {}) {
  let layout = withEdits(stored);
  // Pot bunkers made the first way, deep all round, as they're made now:
  // low at the back (course.mjs potShape).
  if (layout.bunkers?.some((b) => potShape(b) !== b)) layout = { ...layout, bunkers: layout.bunkers.map(potShape) };
  // Pots laid over each other joined into one (sim/potjoin.mjs): drawn,
  // dug and played as one pot, as overlapping bunkers are.
  if (layout.bunkers?.length > 1) {
    const joined = joinPots(layout.bunkers);
    if (joined !== layout.bunkers) layout = { ...layout, bunkers: joined };
  }
  // Every other bunker on a designed hole dug a little below the grass
  // (course.mjs sinkShape).
  if (layout.source !== "map" && layout.bunkers?.some((b) => sinkShape(b, layout.green) !== b)) layout = { ...layout, bunkers: layout.bunkers.map((b) => sinkShape(b, layout.green)) };
  if (tees && layout.path?.length >= 2) layout = { ...layout, teeSpots: teeSpots(layout, { path: makePath(layout.path) }) };
  return layout;
}

// Everything play needs about a hole, worked out once.
// A hole rebuilt from a map also brings its real ground (the terrain grid,
// part of `green` so rolls feel every slope) and a raster of its lies.
// Any changes made by hand (holeedits.mjs) are laid on first: the shapes
// where they've been moved to, dug bunkers in the ground, the green's tilt
// in its contours, and trees planted by hand playing as trees.
// stands: on a course (not the Challenges), what its trees grow with
// (sim/treepalette.mjs standsFor: the hole's seed, its kinds and where it
// lies) - its trees of no given kind then grow in stands of the hole's
// kinds (palettedTrees); a seed alone, the old stands of the newer kinds
// (treehits.mjs treeStands).
// tees: a course's hole, with its other tee boxes (sim/tees.mjs) worked
// out and kept as layout.teeSpots - they play as tee (the Challenges'
// holes have the one).
// grain: the green has grain (sim/rolls.mjs greenGrain; the owner's
// setting, on by default). A course's designed holes (tees) roll in
// patches (sim/rolls.mjs holeRolls); a map's have their real ground, and
// the Challenges' stay level.
// pinDay: { day, key } - the cup cut where it is that day (sim/pinday.mjs),
// not at the hole's own pin; or null.
export function prepareHole(stored, { stimp = 10, cupRadius = HOLE_RADIUS, stands = null, tees = false, grain = false, pinDay = null, calm = null } = {}) {
  let layout = playLayout(stored, { tees });
  const path = makePath(layout.path);
  const mapped = layout.source === "map";
  const terrain = mapped && layout.terrain ? unpackGrid(layout.terrain) : null;
  if (mapped && layout.clearedCrowns?.length && layout.canopy) {
    const standing = layout.trees.filter((t) => t[3] != null);
    layout = { ...layout, canopy: clearCrowns(layout.canopy, layout.clearedCrowns, standing) };
  }
  // (A brook's water runs downhill with the ground as it was before
  // anything was dug: baseHeightAt, below - asked for only once the hole's
  // made.)
  const shaping = groundShaping(layout, terrain, terrain ? (x, z) => gridHeight(terrain, x, z) : null, (x, z) => baseHeightAt(x, z));
  const holeSeed = standsSeed(stands) * 7919 + 13;
  const rolls = tees && !mapped ? holeRolls(layout, holeSeed, { calm }) : null;
  const green = { stimp, uphill: 0, fallRight: 0, contours: layout.contours, terrain, shaping, rolls, grain: grain ? greenGrain(layout, holeSeed) : null };
  const raster = mapped ? lieRaster(layout, path) : null;
  // Under a tree planted by hand, or a bush: trees, where it would
  // otherwise be grass. (A copy: the bushes join it below.)
  const hand = [...(layout.handTrees ?? [])];
  const UNDER = new Set(["rough", "deep", "semi"]);
  const underTrees = (list) => {
    if (!raster) return;
    for (const [tx, tz, r] of list) {
      for (let iz = Math.max(0, Math.floor((tz - r - raster.z0) / raster.cell)); iz <= Math.min(raster.nz - 1, Math.ceil((tz + r - raster.z0) / raster.cell)); iz++) {
        for (let ix = Math.max(0, Math.floor((tx - r - raster.x0) / raster.cell)); ix <= Math.min(raster.nx - 1, Math.ceil((tx + r - raster.x0) / raster.cell)); ix++) {
          const i = iz * raster.nx + ix;
          if (UNDER.has(LIE_CODES[raster.lie[i]]) && Math.hypot(raster.x0 + ix * raster.cell - tx, raster.z0 + iz * raster.cell - tz) <= r) raster.lie[i] = LIE_CODES.indexOf("trees");
        }
      }
    }
  };
  underTrees(hand);
  const baseLie = (x, z) => {
    const l = surfaceAt(layout, x, z, path);
    return hand.length && UNDER.has(l) && underHandTree(hand, x, z) ? "trees" : l;
  };
  let bushLies = [];
  let treeLock = null;
  // Bushes (sim/bushes.mjs), where they'd grow, and the trees by the water
  // marked, so that as likely as not one is a weeping willow (treehits.mjs
  // treeForm): both in the hole's trees, drawn and met alike. A ball that
  // finishes in a bush plays from the trees.
  {
    const lie = raster ? raster.at : baseLie;
    const g = layout.green ?? {};
    // Other holes' fairways, greens and tees (sim/treeclear.mjs
    // clearedLayout's otherGround) read as theirs, so no bush grows there.
    const others = (layout.otherGround ?? []).filter((o) => o?.poly?.length > 2);
    // (Their outlines walked by bands, past their boxes not at all:
    // terrain.mjs insideOutline - every ring round every spot a bush was
    // tried at walked every other hole's every outline, a few tenths of a
    // second of a links hole made ready.)
    const bushLie = others.length ? (x, z) => others.find((o) => insideOutline(o.poly, x, z))?.lie ?? lie(x, z) : lie;
    // As they first grew, if the hole has them kept (sim/treelock.mjs):
    // its bushes each where it still may stand (bushes.mjs bushFits).
    const grown = keptTrees(stored, layout, stands);
    const { lock } = grown;
    const bushes = lock ? lock.bushes.filter((b) => bushFits(bushLie, layout.trees ?? [], b[0], b[1], b[2] ?? 1)) : bushesFor(layout, bushLie, (Math.round((g.x ?? 0) * 10) * 31 + Math.round((g.z ?? 0) * 10)) >>> 0);
    // (A lock to keep afresh: none yet, or the hole changed since.)
    treeLock = { lock, make: grown.exact ? null : () => makeLock({ edits: stored?.edits, trees: grown.kept(), bushes: bushes.map((b) => keptTree(b)), backdrop: lock?.backdrop ?? null }) };
    layout = { ...layout, trees: [...grown.trees, ...bushes] };
    bushLies = bushes.map(([x, z, s]) => [x, z, s * BUSH_REACH * 0.75]);
    hand.push(...bushLies);
    underTrees(bushLies);
  }
  const baseHeightAt = shaping ? (x, z) => greenHeight({ ...green, shaping: null }, x, z) : (x, z) => greenHeight(green, x, z);
  // The level each pond's water lies at (sim/walls.mjs pondLevel): on real
  // ground from the ground before anything was built up by hand, so land
  // held up to a wall's top can't lift the water with it.
  const levels = new Map(layout.water.map((w) => [w, w.brook ? null : pondLevel(layout, w, baseHeightAt)]));
  // A brook's water runs downhill (sim/brooks.mjs brookLevels): its level
  // where it's nearest, worked out the first time it's asked for.
  const brookLevelsOf = new Map();
  const brookLevel = (w) => {
    let lv = brookLevelsOf.get(w);
    if (!lv) brookLevelsOf.set(w, (lv = brookLevels(w, baseHeightAt)));
    return lv;
  };
  // The trees a ball in the air can meet (treehits.mjs), as they're drawn:
  // worked out the first time a shot needs them.
  let trees = null;
  // The day's pin, from the green's own slopes.
  if (pinDay?.day) {
    const pin = dayPin(layout, (x, z) => greenGradient(green, x, z), pinDay);
    if (pin !== layout.pin) layout = { ...layout, pin, ownPin: layout.pin };
  }
  return {
    layout,
    path,
    mapped,
    green,
    raster,
    cup: { x: layout.pin[0], z: layout.pin[1], r: cupRadius },
    lieAt: raster ? raster.at : baseLie,
    // Whether (x, z) is on the green - as lieAt says it, without trying
    // every other shape on the hole first where it isn't (surfaceAt asks
    // the green first): the green's grid asks it every 10 cm.
    onGreen: raster ? (x, z) => raster.at(x, z) === "green" : (x, z) => insideBlob(layout.green, x, z),
    heightAt: (x, z) => greenHeight(green, x, z),
    // How far below the ground a coarse sheet near here must lie to stay
    // under anything dug by hand.
    sunk: shaping ? shaping.sunk : () => 0,
    // The ground without what's been dug or banked up by hand.
    baseHeightAt,
    gradientAt: (x, z) => greenGradient(green, x, z),
    // The hole's own seed (its rolls, its grain, its fairway's firmness).
    seed: holeSeed,
    // Its trees as kept (sim/treelock.mjs): { lock, make } - lock: the one
    // it was made from, or null; make(): a lock of them as they are now,
    // when that's not it (null when it is). course/holebuild.js keeps it.
    treeLock,
    // On a wall's face, where a rolling ball stops dead; on a wall's hard
    // top (sim/walls.mjs, holeedits.mjs groundShaping).
    wallAt: shaping ? shaping.wallAt : null,
    hardAt: shaping ? shaping.hardAt : () => false,
    // (A brook's: its lowest.)
    pondLevel: (w) => (w?.brook ? brookLevel(w).low : (levels.get(w) ?? pondLevel(layout, w, baseHeightAt))),
    // The water's level at (x, z) in pond or brook `w`: a pond's is the
    // same all over; a brook's falls along it.
    waterLevelAt: (w, x, z) => (w?.brook ? brookLevel(w).at(x, z) : (levels.get(w) ?? pondLevel(layout, w, baseHeightAt))),
    treeIndex: () => (trees ??= treeIndex(layout.trees ?? [], (x, z) => greenHeight(green, x, z))),
    // Where the bushes stand and how far round each plays as trees:
    // [x, z, radius].
    bushes: bushLies,
  };
}

// How much higher the pin is than the ball, metres (0 on a flat hole).
export function riseToPin(hole, ball) {
  if (!hole.green.terrain) return 0;
  return hole.heightAt(hole.cup.x, hole.cup.z) - hole.heightAt(ball[0], ball[1]);
}

export function distanceToPin(hole, ball) {
  return Math.hypot(hole.cup.x - ball[0], hole.cup.z - ball[1]);
}

// Rotates shot-frame (forward, right) into the hole frame round `from`.
function toHole(from, aim, fx, fz) {
  const c = Math.cos(aim);
  const s = Math.sin(aim);
  return [from[0] + fx * c - fz * s, from[1] + fx * s + fz * c];
}

// Clubs you can't get away with from a lie.
const NO_CLUB = {
  deep: ["DR", "3W", "5W"],
  bunker: ["DR", "3W"],
  greenside: ["DR", "3W", "5W", "4H", "4I", "5I", "6I", "7I", "8I", "9I", "PW", "AW", "GW"],
  trees: ["DR", "3W", "5W"],
};

// The club for a distance (metres) from a lie. The driver only from the tee.
// Plays the shot longer by what the lie takes off, and leaves out clubs the
// lie won't allow (no woods from deep rough, a sand wedge from a greenside
// bunker).
// From a dug bunker, `face` (faceAhead, for the way the ball's aimed) and
// the stance: only a club whose usual launch from here clears the face
// with a few degrees to spare, at the swing it takes to get to the target
// (a soft splash needs more height than a full swing) - the longest of
// those that doesn't go past the target. If none clears with room to
// spare, the most lofted that clears at all, so the suggestion never loses
// loft as the ball gets nearer the face; if none clears, the lob wedge,
// the best chance of getting out.
// reach: how far this player's clubs go against the bag's (a swing pad or
// controller player's level and Power: madeshot.mjs reachOf) - a number for
// every club, or each club's (club => share); 1 for the bag.
export function suggestClub(distance, lie, { face = null, stance = FLAT, reach = 1 } = {}) {
  if (lie === "green") return "PT";
  const far = typeof reach === "function" ? reach : () => reach;
  // Played for the middle of what the lie takes off.
  const yards = distance / YARD / middleCarry(lie);
  const banned = NO_CLUB[lie] ?? [];
  // Allow for some roll-out on longer clubs.
  const fits = BAG_ORDER.filter(
    (c) => (c !== "DR" || lie === "tee") && !banned.includes(c) && BAG[c].carry * far(c) * (BAG[c].carry > 180 ? 1.1 : 1.03) <= yards * 1.02 + 6,
  );
  const plain = lie === "greenside" ? "SW" : (fits[0] ?? "LW");
  if (!face || (lie !== "bunker" && lie !== "greenside")) return plain;
  const clubs = lie === "greenside" ? ["SW", "LW"] : [...new Set([...fits, "LW"])];
  // (The swing it takes, in the bag's yards for the club.)
  const to = (c) => distance / YARD / far(c);
  const safe = clubs.find((c) => clubClearsFace(face, c, lie, stance, FACE_MARGIN, to(c)));
  if (safe) return safe;
  return [...clubs].reverse().find((c) => clubClearsFace(face, c, lie, stance, 0, to(c))) ?? "LW";
}

// ---- A dug bunker's face -------------------------------------------------------

// Degrees of launch to spare before a club is suggested out of a bunker:
// a slightly thin one still gets out.
export const FACE_MARGIN = 3;

// The face ahead of a ball in a dug bunker (holeedits.mjs), along `aim`:
// { edge, need, at, bunker } - how far to the edge (metres), how high the
// ball must be there (the face and its lip, above the ball), and where the
// lip is. Null if there's nothing to clear: not in a dug bunker, or the
// ground ahead is no higher than the ball. The same test play makes.
export function faceAhead(hole, ball, aim) {
  const ahead = bunkerEdgeAhead(hole.layout, ball, aim);
  if (!ahead) return null;
  const need = hole.heightAt(ahead.at[0], ahead.at[1]) - hole.heightAt(ball[0], ball[1]) + LIP;
  if (need <= 0) return null;
  return { ...ahead, need };
}

// Does this shot (as it leaves the lie: after applyLie) get out over the
// face? Judged as play judges it - the flight as if over level ground, its
// height where it reaches the edge against what's needed - and it has to
// get there in the air: one that comes down short of the edge doesn't hit
// the face, but it hasn't got out either.
export function clearsFace(face, shot) {
  if (!face) return true;
  const path = simulateFlight(shot).path;
  return path[path.length - 1][0] >= face.edge && !hitsFace(path, face.edge, face.need);
}

// How far a player would carry `club` to a target `yards` away: all of it
// when the target's further than the club goes, and short of the pin near
// the green, letting it run up (as the test shots do).
export function plannedCarry(club, yards) {
  const full = BAG[club]?.carry ?? 150;
  if (yards == null) return full;
  return Math.min(full, Math.max(8, yards * (yards < 60 ? 0.7 : 0.95)));
}

// The swing a player makes with `club` from a lie and stance to carry
// plannedCarry(club, yards) from there, as the launch monitor reads it:
// { speedMph, vla, hla, totalSpin, spinAxis } - the club's usual launch
// and spin, and the ball speed for that carry (the full swing's if the
// target's as far as it goes, or `yards` is left out). Working a speed
// out takes a dozen flights, so each one is kept.
const swings = new Map();
export function swingFor(club, lie, stance = FLAT, yards = null) {
  const c = BAG[club] ?? BAG["7I"];
  const raw = (speedMph) => ({ speedMph, vla: c.vla, hla: 0, totalSpin: c.spin, spinAxis: 0 });
  const want = plannedCarry(club, yards);
  const key = [club, lie, stance.side ?? 0, stance.slope ?? 0, Math.round(want * 2)].join();
  if (swings.has(key)) return raw(swings.get(key));
  const opts = { lie, stance, club };
  const carry = (s) => simulateFlight(applyLie(raw(s), opts)).landing.position[0] / YARD;
  let speed = c.speed;
  if (want < carry(c.speed)) {
    let lo = 5;
    let hi = c.speed;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      if (carry(mid) < want) lo = mid;
      else hi = mid;
    }
    speed = (lo + hi) / 2;
  }
  if (swings.size > 2000) swings.clear();
  swings.set(key, speed);
  return raw(speed);
}

// A club's usual strike from a lie and stance, as the ball leaves it
// (after applyLie): the swing for `yards` (swingFor).
export function typicalShot(club, lie, stance = FLAT, yards = null) {
  return applyLie(swingFor(club, lie, stance, yards), { lie, stance, club });
}

// Does a club's usual swing from here, to a target `yards` away, clear the
// face with `margin` degrees of launch to spare?
export function clubClearsFace(face, club, lie, stance = FLAT, margin = 0, yards = null) {
  const raw = swingFor(club, lie, stance, yards);
  return clearsFace(face, applyLie({ ...raw, vla: raw.vla - margin }, { lie, stance, club }));
}

// The least launch that clears the face with this swing (`raw`, as the
// launch monitor reads it) from a lie and stance: any launch at least this
// high gets out, any lower hits the face. In the launch monitor's own
// terms - the number the player sees on it - with what the lie and slope
// do to the launch left to play, as play does. Null if nothing up to 80
// degrees would get out.
export function launchToClear(face, raw, { lie = "bunker", stance = FLAT, club = null } = {}) {
  if (!face) return 0;
  const at = (vla) => clearsFace(face, applyLie({ ...raw, vla }, { lie, stance, club }));
  // A shallow face, a lie that pops it up: any launch at all.
  if (at(0)) return 0;
  // The first five degrees that clear, then closer in between. Too low it
  // hits the face or lands short; anything higher gets over it.
  let lo = 0;
  let hi = null;
  for (let v = 5; v <= 80; v += 5) {
    if (at(v)) {
      hi = v;
      break;
    }
    lo = v;
  }
  if (hi == null) return null;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

// Where to aim by default: at the pin if this club can get there, otherwise
// down the middle of the hole as far as the club goes (round a dog-leg).
export function defaultAim(hole, ball, club) {
  const toPin = Math.atan2(hole.cup.z - ball[1], hole.cup.x - ball[0]);
  if (club === "PT" || !BAG[club]) return toPin;
  const reach = BAG[club].carry * YARD * (BAG[club].carry > 180 ? 1.12 : 1.05);
  if (distanceToPin(hole, ball) <= reach) return toPin;
  const here = nearest(hole.path, ball[0], ball[1]);
  // The point on the centreline about `reach` away from the ball.
  let s = here.s;
  let target = pointAt(hole.path, s).p;
  while (s < hole.path.length && Math.hypot(target[0] - ball[0], target[1] - ball[1]) < reach) {
    s += 2;
    target = pointAt(hole.path, s).p;
  }
  return Math.atan2(target[1] - ball[1], target[0] - ball[0]);
}

// ---- A full shot ---------------------------------------------------------------

// Plays one shot from `ball` with lie `lie`.
//   shot { speedMph, vla, hla, totalSpin, spinAxis }  from the launch monitor
//   stance { side, slope }, club: see lie.mjs
//   pin: whether the flag is in. It is for any shot played from off the
//   green (the ball can hit the pole in the cup, sim/cup.mjs) - a putt
//   (playPutt) never has it.
// Returns { path: [[x, y, z, t]], flightPoints, rest, lie, holed, penalty,
//           carryYards, totalYards, firstBounce, severity, lieOutcome },
//           and for its sound pinTime if it knocked back off the pin,
//           lipped and lipTime if it touched the rim and stayed out,
//           cupSpeed and cupTime if holed, and cupEvents (putting.mjs
//           rollBall)
// severity: where in the lie's range this strike fell (lie.mjs
// drawSeverity for a real shot; the middle if it's left out), and
// lieOutcome what that did (lieguide.mjs) - left out from a clean lie.
// penalty: null, or { kind: "water" | "lost", drop: [x, z] }
// trees: what any tree it met in the air did (treehits.mjs), when it met
// one - [{ kind: "clip" | "branch" | "caught" | "trunk", t, at: [x, y, z]
// as in the path, speedIn, speedOut, depth (how deep in the crown it got,
// 0-1) }], in the order it met them. `trees: false`
// flies it as if there were none; `seed` picks how the leaves take it (by
// default one from the shot itself, so the same shot always does the same).
// weather: the round's (sim/weather.mjs) - { wind: { mph, from, gust },
// temperatureC, sky } - or null for still air at 20 °C. The shot meets its
// own gust of the wind, from the hole's bearing and its aim; in rain or
// showers the fairways play soft.
// plugs: how often a ball plugs in sand (sim/sand.mjs PLUGS, the course
// panel's); plug: this ball's own plugged lie ("egg", "buried"), from the
// shot before.
// gusts: gusts during the flight in a strong wind (the owner's setting).
export function playShot(hole, ball, lie, shot, aim, { stance = FLAT, club = null, ground = "normal", pin = lie !== "green", severity = 0.5, trees = true, seed = null, weather = null, plugs = DEFAULT_PLUGS, plug = null, gusts = true } = {}) {
  const res = playLie(hole, ball, lie, shot, aim, { stance, club, ground, pin, severity, trees, seed, weather, plugs, plug, gusts });
  // What the lie did to it, against the same numbers off the fairway (not
  // for one that hit a bunker's face: it never got to carry anywhere).
  const outcome = res.face ? null : lieOutcome(shot, { lie, stance, club, severity });
  return outcome ? { ...res, severity, lieOutcome: outcome } : { ...res, severity };
}

function playLie(hole, ball, lie, shot, aim, { stance, club, ground, pin, severity, trees, seed, weather, plugs = DEFAULT_PLUGS, plug = null, gusts = true }) {
  // A wet round (rain or showers) plays its fairways soft, whatever the
  // owner's setting (sim/weather.mjs roundGround).
  const g = GROUND[roundGround(ground, weather)] ?? GROUND.normal;
  // Out of grass the strike wanders a little either way, more the lower it
  // comes out (sim/lie.mjs EXIT) - which way from the strike (its speed and
  // launch, roughly) and where it's played from, so a replay goes the same
  // way and a shot aimed a touch differently wanders the same.
  const wander = ((hashNumbers([Math.round(shot.speedMph / 4), Math.round((shot.vla ?? 0) / 2), Math.round(ball[0]), Math.round(ball[1])]) >>> 0) % 2000) / 1000 - 1;
  // Wet sand (after rain) and a plugged ball (sim/sand.mjs).
  const wet = sandWet(weather);
  const adjusted = applyLie(shot, { lie, stance, club, severity, wander, plug, wet });
  // On real ground the flight ends where it meets the ground, which may be
  // well above or below where it was hit from. Path heights come back as
  // height above the ground under the ball, the same as on a flat hole.
  const hilly = !!hole.green.terrain;
  const h0 = hilly ? hole.heightAt(ball[0], ball[1]) : 0;
  const rise = (hx, hz) => (hilly ? hole.heightAt(hx, hz) - h0 : 0);
  const groundAt = hilly
    ? (fx, fz) => {
        const [hx, hz] = toHole(ball, aim, fx, fz);
        return rise(hx, hz);
      }
    : undefined;
  // The trees in its way, met in the hole's frame at their real heights.
  const index = trees ? hole.treeIndex?.() : null;
  const met = index?.list.length ? treesInFlight(hole, ball, aim, hilly ? h0 : null, index, seed ?? shotSeed(adjusted, ball, aim)) : null;
  // The air it flies in: the round's wind (this shot's gust of it, blowing
  // across or along the way it's aimed) and temperature.
  const air = weatherAir(weather, hole, aim, adjusted, { ball, groundAt, gusts });
  const flight = simulateFlight(adjusted, { groundAt, obstacle: met?.obstacle, ...air });
  const path = flight.path.map(([x, y, z, t]) => {
    const [hx, hz] = toHole(ball, aim, x, z);
    return [hx, Math.max(0, y - rise(hx, hz)), hz, t];
  });
  // Out of a bunker dug by hand, the shot has to clear its face.
  const face = lie === "bunker" || lie === "greenside" ? faceShot(hole, ball, aim, adjusted, hilly ? null : flight.path) : null;
  if (face) return face;
  // How much of the path is in the air before it first comes down (the cup
  // can take a ball still in the air, and then it lands in its model).
  let flightPoints = path.length;
  const land = flight.landing;
  let p = toHole(ball, aim, land.position[0], land.position[2]);
  const c = Math.cos(aim);
  const s = Math.sin(aim);
  let v = [land.velocity[0] * c - land.velocity[2] * s, land.velocity[1], land.velocity[0] * s + land.velocity[2] * c];
  let spinRpm = land.spin / RPM;
  let t = land.time;
  const firstBounce = [...p];
  // What the cup did to it, over every visit, for its sound: a lip-out,
  // a knock off the pin, each touch of the rim, wall, floor or pin.
  const cup = { lipTime: null, pinTime: null, events: [] };
  const note = (w) => {
    cup.events.push(...(w.cupEvents ?? []));
    if (w.holed) return;
    if (w.lipTime != null) cup.lipTime = w.lipTime;
    if (w.pinTime != null && cup.pinTime == null) cup.pinTime = w.pinTime;
  };
  const treeHits = met?.hits() ?? [];
  // How many times it has skipped off water (sim/skip.mjs).
  let skips = 0;
  const out = (extra) => ({
    ...(skips ? { skipped: skips } : {}),
    ...(treeHits.length ? { trees: treeHits } : {}),
    ...(!extra.holed && cup.lipTime != null ? { lipped: true, lipTime: cup.lipTime } : {}),
    ...(!extra.holed && cup.pinTime != null ? { pinTime: cup.pinTime } : {}),
    ...(cup.events.length ? { cupEvents: cup.events } : {}),
    path,
    flightPoints,
    firstBounce,
    carryYards: Math.hypot(firstBounce[0] - ball[0], firstBounce[1] - ball[1]) / YARD,
    ...extra,
    totalYards: Math.hypot(extra.rest[0] - ball[0], extra.rest[1] - ball[1]) / YARD,
  });

  // On real ground a low ball coming across a pond meets a wall along it
  // (sim/walls.mjs) below the wall's top: it drops into the water, never
  // up onto the ground held up behind the wall (where the flight would
  // otherwise end, meeting the ground there).
  if (hilly && flight.path.length > 1) {
    const [ax, ay, az] = flight.path[flight.path.length - 2];
    const before = toHole(ball, aim, ax, az);
    if (hole.lieAt(before[0], before[1]) === "water" && hole.lieAt(p[0], p[1]) !== "water") {
      const w = hole.layout.water.find((q) => wallOf(q) && wallDistance(q, p[0], p[1], 2) < 1.5);
      if (w && h0 + ay < (hole.waterLevelAt ? hole.waterLevelAt(w, p[0], p[1]) : hole.pondLevel(w)) + wallOf(w).h) {
        path.pop();
        return out({ ...waterPenalty(hole, path, ball, before, land.time), wall: true });
      }
    }
  }
  // Rolling, it slows by whatever it's rolling on (and faster while it's
  // still skidding, as on the range).
  const stimpDecel = rollingDecel(hole.green.stimp);
  // The fairway's firmness varies (sim/rolls.mjs firmnessAt): firmer on a
  // swell's crown, softer in a hollow, firmer on a hot, dry day.
  const dry = weather ? dryFor(weather.sky, weather.temperatureC) : 0;
  const friction = (x, z, speed) => {
    const l = hole.lieAt(x, z);
    const firm = GROUND_SCALED.has(l) ? g.decel * firmnessAt(hole.green.rolls, x, z, hole.seed ?? 1, dry, !!hole.layout?.links) : 1;
    // (Wet sand is firmer: a shorter slowing.)
    const sand = l === "bunker" || l === "greenside" ? 1 - 0.3 * wet : 1;
    return (l === "green" ? stimpDecel : LIES[l].decel * firm * sand) + skidDecel(speed);
  };
  // Bounces, each on whatever it lands on - unless it comes down on or by
  // the hole, when the cup has it (putting.mjs landNearCup): it can dunk,
  // land on the rim, or clatter off the back edge and out.
  let since = path[0]?.[3] ?? 0;
  let airborne = true;
  let visit = null;
  // A touchdown the cup has just handed back, to bounce as any other.
  let handed = false;
  for (let n = 0; n < 8; n++) {
    const here = hole.lieAt(p[0], p[1]);
    visit = handed ? null : landNearCup({ p: [p[0], 0, p[1]], v, t, spinRpm }, since, hole.green, hole.cup, { friction, pin });
    handed = false;
    if (visit) {
      // Its fall from where the cup took it is the cup's.
      while (path.length > 1 && path[path.length - 1][3] > visit.from) path.pop();
      path.push(...visit.path);
      note(visit);
      if (airborne) flightPoints = landedAt(path, visit.grounded);
      if (!visit.landed) break;
      // Down on the green by the hole (off the pin, perhaps): it bounces.
      p = [visit.p[0], visit.p[2]];
      v = [...visit.v];
      t = visit.t;
      spinRpm = visit.spinRpm;
      visit = null;
      handed = true;
      airborne = false;
    }
    if (here === "water") {
      // Low and fast, now and then it skips (a rare bonus): whether, from
      // the shot's own numbers and which touch of the water this is, so a
      // replay skips the same.
      const vh = Math.hypot(v[0], v[2]);
      const steep = (Math.atan2(-v[1], vh) * 180) / Math.PI;
      const roll = ((shotSeed(adjusted, ball, aim) >>> (4 + skips * 3)) % 1000) / 1000;
      const hop = roll < skipChance(steep, Math.hypot(vh, v[1]), skips) ? bounce([p[0], 0, p[1]], v, spinRpm, t, WATER_SKIP) : null;
      if (!hop) return out(waterPenalty(hole, path, ball, p, t));
      skips++;
      airborne = false;
      since = t;
      path.push(...hop.path);
      p = [hop.p[0], hop.p[2]];
      v = hop.v;
      spinRpm = hop.spinRpm * 0.3;
      t = hop.t;
      continue;
    }
    // Coming down steep and fast into sand, it can plug: it stays where it
    // went in (sim/sand.mjs) - whether, from the shot's own numbers, so a
    // replay plugs the same.
    if (airborne && (here === "bunker" || here === "greenside")) {
      const vh = Math.hypot(v[0], v[2]);
      const steep = (Math.atan2(-v[1], vh) * 180) / Math.PI;
      const speed = Math.hypot(vh, v[1]);
      const roll = ((shotSeed(adjusted, ball, aim) >>> 8) % 1000) / 1000;
      if (roll < plugChance(steep, speed, { plugs, wet })) return out({ rest: [...p], lie: here, holed: false, penalty: null, plug: plugKind(steep, speed) });
    }
    // A wall's hard top (timber sleepers, a pond wall's cap) kicks like a
    // path, whatever the ground beside it.
    const sandy = here === "bunker" || here === "greenside";
    const surface = hole.hardAt?.(p[0], p[1]) ? BOUNCE.path : here === "tee" || here === "fairway" ? g.fairway : sandy ? wetSandSurface(BOUNCE[here] ?? SURFACES.sand, wet) : (BOUNCE[here] ?? SURFACES.rough);
    // On real ground the ball meets the slope where it lands: into a bank
    // it checks, down a slope it skips on. A designed hole's rolls kick it
    // the same way (and are level by the green, as before).
    const slope = hilly ? hole.gradientAt(p[0], p[1]) : hole.green.rolls ? hole.green.rolls.gradient(p[0], p[1]) : null;
    const b = bounce([p[0], 0, p[1]], v, spinRpm, t, surface, slope);
    if (!b) {
      v = touchdown(v, spinRpm, surface, slope);
      break;
    }
    airborne = false;
    since = t;
    path.push(...b.path);
    p = [b.p[0], b.p[2]];
    v = b.v;
    spinRpm = b.spinRpm;
    t = b.t;
  }
  if (visit) {
    if (visit.holed) return out({ rest: [hole.cup.x, hole.cup.z], lie: "cup", holed: true, cupSpeed: visit.cupSpeed, cupTime: visit.cupTime, ...(airborne && visit.firstTouch !== "green" ? { fly: true } : {}), penalty: null });
    p = [visit.p[0], visit.p[2]];
    v = [visit.v[0], 0, visit.v[2]];
    t = visit.t;
  }

  // Roll, slowing by whatever it's rolling on; can drop in the cup.
  // In a strong wind the ball is pushed a little as it rolls (weather.mjs
  // groundPush).
  const push = weather ? groundPush(gustFor(weather.wind, shotSeed(adjusted, ball, aim)), holeBearing(hole)) : null;
  const roll = rollBall({ p, v: [v[0], v[2]], t }, hole.green, hole.cup, {
    frictionAt: friction,
    wallAt: hole.wallAt,
    pin,
    push,
  });
  note(roll);
  // Stop the roll where it runs into water.
  for (let i = 0; i < roll.path.length; i++) {
    const [x, z, tt] = roll.path[i];
    if (i % 3 === 0 && hole.lieAt(x, z) === "water") {
      for (let j = 0; j < i; j++) path.push([roll.path[j][0], roll.path[j][3] ?? 0, roll.path[j][1], roll.path[j][2]]);
      return out(waterPenalty(hole, path, ball, [x, z], tt));
    }
  }
  for (const [x, z, tt, y] of roll.path) path.push([x, y ?? 0, z, tt]);
  if (roll.holed) return out({ rest: [hole.cup.x, hole.cup.z], lie: "cup", holed: true, cupSpeed: roll.cupSpeed, cupTime: roll.cupTime, penalty: null });

  const rest = roll.rest;
  const restLie = hole.lieAt(rest[0], rest[1]);
  const n = nearest(hole.path, rest[0], rest[1]);
  // Mapped: lost well into a wood, or right off the hole. Drop on the way
  // back towards the line of play, at the first spot that isn't trees or
  // water.
  if (hole.mapped && ((restLie === "trees" && Math.abs(n.d) > MAPPED_DEEP + 15) || Math.abs(n.d) > MAPPED_DEEP + 40)) {
    const at = pointAt(hole.path, n.s).p;
    let drop = at;
    const d = Math.hypot(rest[0] - at[0], rest[1] - at[1]) || 1;
    for (let k = 2; k < d; k += 2) {
      const q = [rest[0] + ((at[0] - rest[0]) / d) * k, rest[1] + ((at[1] - rest[1]) / d) * k];
      if (!["trees", "water"].includes(hole.lieAt(q[0], q[1])) && Math.abs(nearest(hole.path, q[0], q[1]).d) <= MAPPED_DEEP + 10) {
        drop = q;
        break;
      }
    }
    return out({ rest, lie: restLie, holed: false, penalty: { kind: "lost", drop } });
  }
  if (hole.mapped) return out({ rest, lie: restLie, holed: false, penalty: null });
  // Deep in the trees: lost. Drop back at the edge of the rough, one stroke.
  // (The distances grow and shrink with a hole drawn to a player's drive:
  // course.mjs bandScale.)
  const band = hole.layout.bandScale ?? 1;
  // (A links hole's long grass the same: deep rough, but lost as far out.)
  if ((restLie === "trees" || (hole.layout.links && restLie === "deep")) && Math.abs(n.d) > hole.layout.treeLine + 18 * band) {
    const at = pointAt(hole.path, n.s);
    // In the rough, short of the deep stuff.
    const off = Math.sign(n.d) * (hole.layout.treeLine - (DEEP_ROUGH + 3) * band);
    const drop = [at.p[0] - at.dir[1] * off, at.p[1] + at.dir[0] * off];
    return out({ rest, lie: restLie, holed: false, penalty: { kind: "lost", drop } });
  }
  return out({ rest, lie: restLie, holed: false, penalty: null });
}

// The same shot always meets the trees the same way: its seed comes from
// its numbers and where it's played from.
function shotSeed(shot, ball, aim) {
  return hashNumbers([shot.speedMph, shot.vla, shot.hla, shot.totalSpin, shot.spinAxis, ball[0], ball[1], aim]);
}

// The flight's step through the trees (treehits.mjs treeStep), turned
// from the shot's frame - relative to the ball, heights from where it was
// hit (h0 on real ground; on a level hole from the ground under it, as
// it's drawn) - to the hole's and back. hits(): what the trees did, with
// each `at` as the path has it (height above the ground).
function treesInFlight(hole, ball, aim, h0, index, seed) {
  const state = treeState(seed);
  const c = Math.cos(aim);
  const s = Math.sin(aim);
  const toAbs = ([fx, fy, fz]) => {
    const [hx, hz] = toHole(ball, aim, fx, fz);
    return [hx, h0 != null ? h0 + fy : fy + hole.heightAt(hx, hz), hz];
  };
  const obstacle = (p, np, nv, t, dt) => {
    const hv = [nv[0] * c - nv[2] * s, nv[1], nv[0] * s + nv[2] * c];
    const res = treeStep(index, state, toAbs(p), toAbs(np), hv, t, dt);
    if (!res) return null;
    const [px, py, pz] = res.position;
    const ox = px - ball[0];
    const oz = pz - ball[1];
    const [vx, vy, vz] = res.velocity;
    return {
      position: [ox * c + oz * s, h0 != null ? py - h0 : py - hole.heightAt(px, pz), -ox * s + oz * c],
      velocity: [vx * c + vz * s, vy, -vx * s + vz * c],
      spin: res.spin,
    };
  };
  const hits = () =>
    state.hits.map(({ tree, kind, t, at, speedIn, speedOut, depth }) => ({
      tree,
      kind,
      t,
      at: [at[0], Math.max(0, at[1] - hole.heightAt(at[0], at[2])), at[2]],
      speedIn,
      speedOut,
      depth,
    }));
  return { obstacle, hits };
}

// A shot from a dug bunker (holeedits.mjs) that doesn't get high enough
// to clear the face by the time it reaches the edge: it hits the face and
// drops back to the foot of it, still in the sand. Null if it clears.
// Judged on the flight through the air as if the ground were level (on
// real ground the flight would otherwise stop where it meets the face,
// and bounce off it at full speed); `flat`, that flight if it's to hand.
function faceShot(hole, ball, aim, shot, flat) {
  const ahead = faceAhead(hole, ball, aim);
  if (!ahead) return null;
  const need = ahead.need;
  const shotFrame = flat ?? simulateFlight(shot).path;
  const hit = hitsFace(shotFrame, ahead.edge, need);
  if (!hit) return null;
  const h0 = hole.heightAt(ball[0], ball[1]);
  const kept = shotFrame.slice(0, hit.index + 1).map(([x, y, z, t]) => {
    const [hx, hz] = toHole(ball, aim, x, z);
    return [hx, Math.max(0, y - (hole.heightAt(hx, hz) - h0)), hz, t];
  });
  const at = [ball[0] + Math.cos(aim) * hit.forward, ball[1] + Math.sin(aim) * hit.forward];
  kept.push([at[0], Math.max(0, hit.height - (hole.heightAt(at[0], at[1]) - hole.heightAt(ball[0], ball[1]))), at[1], hit.t]);
  // Down the face, to settle a little way back from its foot - off a wall,
  // just short of it.
  const back = ahead.wall
    ? Math.max(Math.min(0.3, ahead.edge * 0.5), ahead.edge - 0.35)
    : Math.max(Math.min(0.3, ahead.edge * 0.5), Math.min(ahead.edge * 0.6, ahead.edge - faceWidthAt(ahead) - 1));
  const rest = [ball[0] + Math.cos(aim) * back, ball[1] + Math.sin(aim) * back];
  kept.push([rest[0], 0, rest[1], hit.t + 0.6]);
  const lie = hole.lieAt(rest[0], rest[1]);
  return {
    path: kept,
    flightPoints: hit.index + 2,
    firstBounce: at,
    carryYards: hit.forward / YARD,
    totalYards: back / YARD,
    rest,
    lie: lie === "bunker" || lie === "greenside" ? lie : "bunker",
    holed: false,
    penalty: null,
    face: true,
  };
}

// Out of a bunker with a wall (sim/walls.mjs) too high to get over the way
// it's aimed (at the pin, unless `aim` says otherwise) - the club
// suggested for it can't clear it with a few degrees to spare - the
// nearest way out to the side that can: aims 10, 20, 30... degrees either
// side, and the club for it. Null if it can get out that way (or isn't
// facing a wall), or if nothing gets out.
export function escapeAim(hole, ball, lie, stance = FLAT, aim = null) {
  const toPin = aim ?? Math.atan2(hole.cup.z - ball[1], hole.cup.x - ball[0]);
  const face = faceAhead(hole, ball, toPin);
  if (!face?.wall) return null;
  const distance = distanceToPin(hole, ball) + riseToPin(hole, ball);
  const yards = distance / YARD;
  const gets = (f) => {
    const club = suggestClub(distance, lie, { face: f, stance });
    return !f || clubClearsFace(f, club, lie, stance, FACE_MARGIN, yards) ? club : null;
  };
  if (gets(face)) return null;
  for (let k = 1; k <= 12; k++) {
    for (const side of [1, -1]) {
      const turned = toPin + (side * k * 10 * Math.PI) / 180;
      const f = faceAhead(hole, ball, turned);
      const club = gets(f);
      if (club) return { aim: turned, club };
    }
  }
  return null;
}

// Into the water: a stroke, and a drop by the Rules for its penalty area
// (sim/penalty.mjs): where it last crossed onto dry land, back on the line
// from the hole - or for a red area beside play, within two club-lengths
// of it if that's the better lie.
function waterPenalty(hole, path, ball, at, t) {
  let crossed = [...ball];
  for (let i = path.length - 1; i >= 0; i--) {
    const [x, , z] = path[i];
    if (hole.lieAt(x, z) !== "water") {
      crossed = [x, z];
      break;
    }
  }
  const w = waterAt(hole.layout, at[0], at[1]);
  const area = w ? penaltyOf(w, hole.layout) : "red";
  const { drop, how } = penaltyDrop({ lieAt: hole.lieAt, cup: [hole.cup.x, hole.cup.z], crossed, area });
  path.push([at[0], -0.1, at[1], t]);
  // (Where it crossed in, for the player's own choice of drop: course/relief.js.)
  return { rest: at, lie: "water", holed: false, penalty: { kind: "water", drop, area, how, crossed: [Math.round(crossed[0] * 100) / 100, Math.round(crossed[1] * 100) / 100] } };
}

// ---- Putting -----------------------------------------------------------------

// A putt from `ball`: speed and start line (hla) relative to `aim`.
// weather: the round's - in a strong wind a putt is pushed a little
// (weather.mjs groundPush).
export function playPutt(hole, ball, shot, aim, { weather = null } = {}) {
  const a = aim + ((shot.hla ?? 0) * Math.PI) / 180;
  const speed = shot.speedMph * MPH;
  const stimpDecel = rollingDecel(hole.green.stimp);
  const roll = rollBall({ p: ball, v: [speed * Math.cos(a), speed * Math.sin(a)], t: 0 }, hole.green, hole.cup, {
    frictionAt: (x, z) => {
      const l = hole.lieAt(x, z);
      return l === "green" ? stimpDecel : LIES[l].decel;
    },
    wallAt: hole.wallAt,
    push: weather ? groundPush(weather.wind, holeBearing(hole)) : null,
  });
  const path = roll.path.map(([x, z, t, y]) => [x, y ?? 0, z, t]);
  const rest = roll.holed ? [hole.cup.x, hole.cup.z] : roll.rest;
  const lie = roll.holed ? "cup" : hole.lieAt(rest[0], rest[1]);
  if (lie === "water") return { path, flightPoints: 0, ...waterPenalty(hole, path, ball, rest, roll.time), holed: false };
  return {
    path,
    flightPoints: 0,
    rest,
    lie,
    holed: roll.holed,
    ...(roll.holed ? { cupSpeed: roll.cupSpeed, cupTime: roll.cupTime } : {}),
    lipped: roll.lipped,
    ...(roll.lipped ? { lipTime: roll.lipTime } : {}),
    ...(roll.cupEvents ? { cupEvents: roll.cupEvents } : {}),
    penalty: null,
    ...finishFeet(rest, hole.cup),
  };
}

// The read for a putt on this hole's green: line (as an aim) and pace.
// It is the ideal line (puttguide.mjs idealLine) worked out on the whole of
// the ground the ball rolls on - hole.green seen from the ball through
// courseGreen's frame: the real ground from a map or LiDAR, anything dug or
// banked up by hand, a shaped green and the contours alike. It used to turn
// only the contours into the putting frame, so on a mapped green, whose
// slopes are all in the terrain, it read every putt as flat and started it
// straight at the hole (Harding Test's 2nd from 15.8 ft: 0 degrees, when
// the putt only dropped from several degrees left). Being the very line
// the T line draws, the read, the line shown and the ball all agree.
// { heading, speedMph, hla, aim, holes } - holes false when no line drops
// (the nearest try is given, as the ideal line does).
export function readPutt(hole, ball) {
  const cg = courseGreen(hole, ball);
  const line = idealLine(cg.green, cg.distance, { holeRadius: hole.cup.r });
  return { heading: cg.heading, speedMph: line.speedMph, hla: line.hla, aim: cg.heading + (line.hla * Math.PI) / 180, holes: line.ok };
}

// ---- Test shots --------------------------------------------------------------

// The ball speed that carries a club a given distance (yards).
export function shotForCarry(club, carryYards) {
  const c = BAG[club] ?? BAG["7I"];
  let lo = 5;
  let hi = 200;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    const f = simulateFlight({ speedMph: mid, vla: c.vla, hla: 0, totalSpin: c.spin, spinAxis: 0 });
    if (f.landing.position[0] / YARD < carryYards) lo = mid;
    else hi = mid;
  }
  return { speedMph: (lo + hi) / 2, vla: c.vla, hla: 0, totalSpin: c.spin, spinAxis: 0 };
}

// What testShotFor's full shot carries struck steady (its wobble at the
// middle), yards in still air: the carry it searches for, worked out
// without the search - its two searches of the club's flights stopped a
// phone for a good part of a second each time the swing pad asked
// (app.js swingPlan: the flag's mark). Not for a putt.
export function testShotCarry(hole, ball, lie, club) {
  const c = BAG[club] ?? BAG["7I"];
  return plannedCarry(club, distanceToPin(hole, ball) / YARD) / middleCarryFor(lie, c.vla);
}

// A made-up shot for playing without the launch monitor: the right sort of
// distance for the club and what's left, with some human error. read: a
// putt's read if it's already been worked out ({ speedMph, hla }: the
// ideal line, course/putting.js) - else it's read here.
export function testShotFor(hole, ball, lie, club, rand = Math.random, read = null) {
  const jitter = (v, amount) => v + (rand() - 0.5) * 2 * amount;
  const d = distanceToPin(hole, ball) / YARD;
  if (lie === "green" || club === "PT") {
    read ??= readPutt(hole, ball);
    return { speedMph: read.speedMph * jitter(1, 0.12), vla: 1, hla: read.hla + jitter(0, 1.2), totalSpin: 0, spinAxis: 0 };
  }
  // Short of a full swing near the green: aim to carry most of the way,
  // swinging harder for what the lie takes off, as a player would.
  const carry = plannedCarry(club, d);
  // (Out of grass, by how this club launches: sim/lie.mjs exitFactor.)
  const first = shotForCarry(club, carry / middleCarry(lie));
  const shot = shotForCarry(club, carry / middleCarryFor(lie, first.vla));
  return {
    ...shot,
    speedMph: jitter(shot.speedMph, shot.speedMph * 0.035),
    hla: jitter(0, 2.5),
    totalSpin: jitter(shot.totalSpin, shot.totalSpin * 0.1),
    spinAxis: jitter(0, 7),
  };
}

// How far a full shot ran on after it first came down, for the line under
// the result ("On the green - 24 ft, rolled 16 yds"): "rolled 16 yds",
// "spun back 2 yds", or "" for a putt, a penalty, a holed shot or one that
// stopped where it landed.
export function rollNote(res) {
  if (!res || res.penalty || res.holed || !(res.flightPoints > 1)) return "";
  const roll = (res.totalYards ?? 0) - (res.carryYards ?? 0);
  const n = Math.round(Math.abs(roll));
  if (n < 1) return "";
  const yds = n === 1 ? "yd" : "yds";
  return roll < 0 ? `spun back ${n} ${yds}` : `rolled ${n} ${yds}`;
}

// ---- Scoring -----------------------------------------------------------------

export function scoreName(strokes, par) {
  const d = strokes - par;
  if (strokes === 1) return "Hole in one!";
  return { "-3": "Albatross", "-2": "Eagle", "-1": "Birdie", 0: "Par", 1: "Bogey", 2: "Double bogey", 3: "Triple bogey" }[d] ?? `+${d}`;
}

export function toPar(scores, pars) {
  let over = 0;
  scores.forEach((s, i) => {
    if (s != null) over += s - pars[i];
  });
  return over === 0 ? "E" : over > 0 ? `+${over}` : String(over);
}

export { FOOT };

// Whether the next putt is given: on the green, within the gimme (feet; 0
// for none) - and never on the stroke that's the pick-up (maxStrokes), so a
// tenth stroke scores ten whether it finished close or not.
export function puttGiven({ lie, leftM, gimmeFeet, strokes, maxStrokes }) {
  return lie === "green" && gimmeFeet > 0 && leftM <= gimmeFeet * FOOT && strokes < maxStrokes;
}
