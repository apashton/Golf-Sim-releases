// What's round a course hole once built: the country beyond it, the shore, glimpses, paths, wear, dressing, links ground, signs and the clubhouse, brooks, the green's grid and shade, and the long and hole grass grown near the ball.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import * as THREE from "three";
import { YARD } from "../sim/flight.mjs";
import { makePath, nearest, insideBlob, seedName, holeBunkerStyle, FRINGE, edgeReach, shapeReach, SURROUND, surfaceAt } from "../sim/course.mjs";
import { shapeBounds } from "../sim/holeedits.mjs";
import { ownCarry } from "../owncarry.js";
import { BAG } from "../sim/courseplay.mjs";
import { toWorld } from "../scenery.js";
import { setTuftCountry } from "../look/groundbits.js";
import { tuftFieldMesh } from "../look/tuftfield.js";
import { courseSand, SANDS } from "../sim/bunkerlook.mjs";
import { holeProbe } from "../sim/holesite.mjs";
import { waterFor, bankSlopeMaterial } from "../look/sandwater.js";
import { makeWall } from "../look/walls.js";
import { wallOf, wallViews, sunkPond, wallAt } from "../sim/walls.mjs";
import { greenZone, waterDry } from "../sim/greenfirst.mjs";
import { brookBed, brookHalf, brookBankHeight, brookAcross, waterEdgeScale, brookBankLines, brookRoom } from "../sim/brooks.mjs";
import { grassMaterial, onLayer, LAYER, GRASS, mowOptions, edgeStrip, edgeMesh } from "../look/grass.js";
import { holeToWorld } from "../look/glsl/ground.js";
import { MOW_WIDTH } from "../sim/mowing.mjs";
import { sheetXZ } from "../greenscene.js";
import { drawHole } from "../coursemap.js";
import { HIGH, EXTRA, ULTRA, LEVEL } from "../look/quality.js";
import { PALETTE } from "../look/palette.js";
import { WAIT, hurried } from "../sim/idlework.mjs";
import { TUFT_FIELD, fieldBounds, keptShare } from "../sim/tufts.mjs";
import { holeTuftsSteps, TUFT_STRIDE } from "../sim/holetufts.mjs";
import { hayAt } from "../sim/hay.mjs";
import { SURFACE_LIFT, drawnLift } from "../look/lifts.js";
import { makePaths } from "../look/paths.js";
import { makeSignage } from "../look/signs.js";
import { refine } from "../look/dugground.js";
import { signsFor, nextTeeFrom } from "../sim/signs.mjs";
import { nextTeeView } from "../sim/nexttee.mjs";
import { othersWater } from "../sim/coursepaths.mjs";
import { gapToPaths } from "../sim/paths.mjs";
import { drawnPaths } from "../sim/pathjoin.mjs";
import { MOWN_EDGE, lineAlong } from "./holebuild.js";
import { windsockSpot } from "../sim/windsock.mjs";
import { makeWindsock } from "../look/windsock.js";
import { holeFurniture, pondBirds, BIRDS } from "../sim/furniture.mjs";
import { makeBirds } from "../look/wildlife.js";
import { polygonArea, clubhouseSpot, clubhouseClear, raiseBuildings, largestBuilding, plotCorners } from "../sim/buildings.mjs";
import { makeFurniture, makeClubhouse, makeBuildings } from "../look/club.js";
import { wearLines, wearPatches, teeDivots } from "../sim/wear.mjs";
import { makeWear, makeDivots } from "../look/wear.js";
import { nestClumps, makeNest, dropNest, NEST } from "../look/lienest.js";
import { makeLongGrass, dropLongGrass, makeHoleGrass, holeGrassSteps, dropHoleGrass } from "../look/longgrass.js";
import { mirrorsChanged } from "../look/mirrors.js";
import { linksGround, reliefRolls } from "../sim/linksground.mjs";
import { makeLinksGround } from "../look/linksground.js";
import { longGrassClumps, LONG_GRASS } from "../sim/longgrass.mjs";
import { holeGrassClumps, holeGrassField, groundNormal, HOLE_GRASS, HOLE_CHUNKS } from "../sim/holegrass.mjs";
import { withOtherGround } from "../sim/holetufts.mjs";
import { roughDressingSteps } from "../sim/dressing.mjs";
import { wasteDressing, withWasteDressing } from "../sim/wastearea.mjs";
import { makeDressing } from "../look/dressing.js";
import { setCountry, courseColours, countryColours, patchColours, shadeOffset, countryTexture, countryWoods } from "../look/country.js";
import { countryParts } from "../sim/countryparts.mjs";
import { offload, answer, result, canOffload } from "../look/offload.js";
import { holeFingerprint, keptKey } from "../look/bake.js";
import { ownArea, neighbourLows, toWorldXZ, NEIGHBOURS } from "../sim/neighbours.mjs";
import { holeCrop } from "../sim/holecrop.mjs";
import { lieWithOthers, othersDecor } from "../sim/treeclear.mjs";
import { decorDressing, withDecor } from "../sim/decor.mjs";
import { cropSurfaces, liftAt, surfaceAlpha, toneAt } from "../sim/cropsurfaces.mjs";
import { neighbourPrint, neighbourShed } from "../sim/coursetiers.mjs";
import { makeTrees, watchNeighbourTrees, neighboursInFull } from "../look/trees.js";
import { dunesDressing, duneFaceOutcrops } from "../sim/dunes.mjs";
import { coursePlaces } from "../sim/imaginary.mjs";
import { holeFrame, insidePolygon, distanceToEdge } from "../sim/terrain.mjs";
import { setBackdrop } from "../look/backdrop.js";
import { coastOf, coastHere, shoreHeight, duneLump, seaLevel, COAST } from "../sim/coast.mjs";
import { makeSea } from "../look/sea.js";
import { runOf } from "../sim/waterflow.mjs";
import { applyReflections } from "../look/environment.js";
import { nameSeed, characterFor, courseHoleSeed, courseTrees, farMix, pickKind, holeExtras, glimpsesFor, dressFor } from "../sim/country.mjs";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { TessellateModifier } from "three/addons/modifiers/TessellateModifier.js";
import { fowlOnWater } from "../audio/cues.mjs";
import { GRASS_FIELD, HOLE_GRASS_WAIT, offShore, teeBoxAt } from "../course.js";
import { REAL_BALL_R } from "../sim/ballsize.mjs";

// The other holes' shapes in the crop are cut to this edge (metres) where
// they follow the ground and fade out at the circle's edge and onto the
// hole's own ground.
const CROP_EDGE_STEP = 10;
// How many of the other holes' shapes are built a step (cropSurfaceSteps).
export const CROP_PIECES = 4;
// Other holes' ponds: their colour (as the hole's own water reads from the
// air) and how far in from the bank they fade up from nothing.
const CROP_POND = "#5d8790";
// The next hole's cart paths on each course's holes (nextTeePaths): a
// course's own, gone with it.
const nextPathsMemo = new WeakMap();
// The paths as drawn on each hole's layout, for the grass (grassPaths).
const grassPathsMemo = new WeakMap();
const CROP_SHORE = 8;
const smoothstepJS = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// Distance from (x, z) to a polygon's edge.
function edgeDistance(pts, x, z) {
  let d = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [ax, az] = pts[j];
    const dx = pts[i][0] - ax;
    const dz = pts[i][1] - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return d;
}

// How far out from a dug bunker's edge its fine patch of ground reaches,
// metres (groundSheets) - one dug only a little below the grass as every
// bunker is (sim/course.mjs sinkShape: shaped only inside its edge), just
// past it (SUNK_PATCH).
export const DUG_PATCH = 12;
export const SUNK_PATCH = 3;

export class CourseHoleScenery {
  // The country past where a ball can finish (sim/country.mjs, look/
  // country.js), painted over the far ground: fields, hedgerows, tracks,
  // wood patches and ponds; beyond a designed hole's tree lines the woods
  // floor; and under every tree its soft shade. Its seed is the course's
  // and the hole's, so courses (and holes) differ; the hole's character
  // (woodland, parkland, heath, lakeside) is from it too, except in the
  // Driving Challenge (this.challenge === "driving"), whose holes have
  // none of their own.
  //
  // Worked out (sim/countryparts.mjs) at once, or - `wait`: the hole built a
  // step at a time - on another of the computer's cores (look/offload.js)
  // while the rest of it is built, and laid out (placeCountry) once back.
  // null with no ground to lay it on.
  startCountry(L, wait = false) {
    this.neighbours = null;
    if (!(this.countryMats ?? []).length) return null;
    const input = this.countryInput(L);
    // (Kept, it's laid out where the other core's would be, so the hole's
    // put together in the same order either way.)
    const kept = this.bake?.find("task:countryParts", input);
    if (kept) return wait && canOffload() ? { job: this.keptJob("countryParts", input, kept) } : { parts: kept };
    if (wait && canOffload()) return { job: this.keepAnswer(offload("countryParts", input), "countryParts", input) };
    const parts = countryParts(input);
    this.bake?.keep("task:countryParts", input, parts);
    return { parts };
  }

  // A part another core is working out (look/offload.js), kept with the
  // hole once it's back (look/bake.js) - when it's built a step at a time.
  // (Its key taken now, from the input as it was sent: the build goes on
  // meanwhile and changes some of what's in it - the country's - so keyed
  // once back, it was never found again, and waited for every time.)
  keepAnswer(job, name, input) {
    const bake = this.bake;
    if (bake) {
      const key = bake.partKey(`task:${name}`, input);
      job.keep = (value) => bake.keepAt(key, value);
    }
    return job;
  }

  // A part kept from the last time, as if another core had just given it.
  keptJob(name, input, value) {
    return { name, input, done: true, value, error: null, kept: true };
  }

  // The hole's ground laid on a grid (greenscene.js groundPatch,
  // groundRect): round the green, over its rolling ground, round each dug
  // or walled bunker and each lowered pond - each { key, size or w and d,
  // step, cx, cz }. (Not a hole from a map: its ground is its own.)
  groundSheets(L) {
    if (this.hole.mapped) return [];
    const cell = HIGH ? 0.5 : 1;
    const g = toWorld(L.green.x, 0, L.green.z);
    // (Each with how far over the ground it's laid, the spacing it's cut
    // round what's dug at (underSand), and whether it leaves out what the
    // green's patch covers (beyondGreen): buildHoleSteps groundPiece.)
    const rl = SURFACE_LIFT.rough;
    const out = [{ key: "green", size: 100, step: cell, cx: g.x, cz: g.z, lift: rl, under: cell, beyond: false }];
    const rb = this.hole.green?.rolls?.bounds;
    if (rb) {
      const step = L.links ? (HIGH ? 1.5 : 2.5) : HIGH ? 2 : 3;
      out.push({ key: "rolls", w: rb.z1 - rb.z0, d: rb.x1 - rb.x0, step, cx: (rb.z0 + rb.z1) / 2, cz: -(rb.x0 + rb.x1) / 2, lift: rl, under: step, beyond: true });
    }
    // (On the lower setting a metre and a half apart, as coarse as that
    // setting draws elsewhere; round a pond a metre, the ground there flat.)
    // A dug bunker's fine patch lies under the rolling ground's sheet and
    // shows only where that's cut round the bunker and where the ground
    // shaped round it rises over the coarser sheet - all within some 6 m
    // of its edge (sim/holeedits/ground.mjs potGround's reach) - so it
    // reaches DUG_PATCH metres out, not the 36 it did: on a links hole of
    // pots most of the ground's triangles were these, drawn under the
    // sheet where nothing of them showed.
    L.bunkers
      .filter((b) => b.dig || wallOf(b))
      .forEach((b, k) => {
        const at = toWorld(b.x, 0, b.z);
        // (A fingered one's finely on every setting: its flashed face's back slope
        // bends round each finger, and laid coarser, the ground poked up
        // through the fairway between them in dark shards: sim/fingers.mjs.)
        const step = HIGH ? cell : b.fingered ? 0.5 : 1.5;
        out.push({ key: `dug${k}`, size: Math.round(2 * (Math.max(Math.max(b.rx, b.rz) * 1.3, b.fingered ? shapeReach(b) : 0) + (b.sunk ? SUNK_PATCH : DUG_PATCH))), step, cx: at.x, cz: at.z, lift: -0.035, under: step, beyond: true });
      });
    // (A pond with no wall changes the ground only inside its outline:
    // its patch reaches 6 m past it, not 20 - sim/walls.mjs POND_SINK.)
    L.water
      .filter((w) => sunkPond(w))
      .forEach((w, k) => {
        const at = toWorld(w.x, 0, w.z);
        const step = HIGH ? 1 : 1.5;
        out.push({ key: `pond${k}`, size: Math.round(2 * (Math.max(w.rx, w.rz) * 1.3 * edgeReach(w) + (wallOf(w) ? 20 : 6))), step, cx: at.x, cz: at.z, lift: -0.035, under: step, beyond: true });
      });
    // Along each brook (sim/brooks.mjs): its banks finely.
    L.water
      .filter((w) => w.brook)
      .forEach((w, k) => {
        const b = shapeBounds(brookBed(w), 2);
        out.push({ key: `brook${k}`, w: Math.ceil(b.z1 - b.z0), d: Math.ceil(b.x1 - b.x0), step: HIGH ? 0.5 : 0.75, cx: (b.z0 + b.z1) / 2, cz: -(b.x0 + b.x1) / 2 });
      });
    return out;
  }

  // Their heights, and their light where anything's dug (levelNormals),
  // read on another core (sim/sheetreadings.mjs) from the hole made again
  // there - null where it can't be.
  startSheets(L) {
    const recipe = this.hole.recipe;
    const sheets = this.groundSheets(L);
    if (!recipe || !sheets.length || !canOffload()) return null;
    // (Every piece kept from the last time (buildHoleSteps groundPiece):
    // nothing to read.)
    if (this.bake && sheets.every((q) => this.bake.has("ground", { q }))) return null;
    const normals = L.bunkers.some((b) => b.dig || wallOf(b)) || L.water.some((w) => sunkPond(w) || w.brook);
    const xz = new Map(sheets.map((q) => [q.key, sheetXZ(q)]));
    const site = this.offloadSite(L);
    const probe = holeProbe((x, z) => this.heightAt(x, z), (x, z) => this.hole.lieAt(x, z), L);
    return { xz, job: offload("sheetReadings", { site, probe, sheets: sheets.map((q) => ({ key: q.key, ...xz.get(q.key), normals })) }) };
  }

  // The course's sand and this hole's bunker style, for each bunker's look
  // (sim/bunkerlook.mjs): { sand, style }. (The Challenges' holes: golden
  // sand, classic bunkers.)
  sandLook(L) {
    const index = this.round?.index ?? Math.max(0, (L.number ?? 1) - 1);
    const options = this.course?.holes?.[index]?.spec?.options ?? {};
    return { sand: courseSand(this.course, holeBunkerStyle), style: L.links ? "links" : holeBunkerStyle(options) };
  }

  // The course's sand's own colour (its tint over the palette's sand), for
  // the marks a ball leaves in it and the sand it throws up.
  sandColour(L) {
    const tint = SANDS[this.sandLook(L).sand]?.tint ?? [1, 1, 1];
    const c = new THREE.Color(PALETTE.sand);
    return c.setRGB(c.r * tint[0], c.g * tint[1], c.b * tint[2]);
  }

  // What the tufts all over the hole are placed from (sim/holetufts.mjs
  // holeTufts), less the hole itself: null for none (below High, the Grass
  // all over the hole switch off).
  tuftInput(L) {
    if (!HIGH || !GRASS_FIELD) return null;
    // (Off every path as it's drawn here, the next hole's too: grassPaths.)
    const paths = this.grassPaths(L);
    // (Where there are no rolls - a parkland hole, a hole from a map - over
    // its path's box, out past its long grass.)
    const rb = this.hole.green?.rolls?.bounds ?? fieldBounds(L.path ?? [], (L.treeLine ?? 40) + (L.links ? 60 : 30));
    if (!rb) return null;
    return {
      rb: { x0: rb.x0, x1: rb.x1, z0: rb.z0, z1: rb.z1 },
      per: TUFT_FIELD.perM2[LEVEL] ?? TUFT_FIELD.perM2.medium,
      most: TUFT_FIELD.most,
      tall: TUFT_FIELD.height[L.links ? "links" : "parkland"],
      // (Their colours a links hole's: tuftMaterial's 2 - 4.)
      deepCode: L.links === "green" ? 4 : L.links ? 2 : 1,
      roughCode: L.links && L.links !== "green" ? 3 : 0,
      rocks: (this.dressing?.rocks ?? []).map(([x, z, size]) => [x, z, size]),
      stony: (this.dunes?.patches ?? []).filter((q) => q.kind === "stone").map(({ x, z, r }) => ({ x, z, r })),
      ...(paths.length ? { paths } : {}),
    };
  }

  // The next hole's cart paths as addPaths draws them on this hole - cut
  // off its play and its own paths - in this hole's frame, for the grass to
  // keep off as it keeps off the hole's own: this hole's tufts stood on
  // them, and from any way off their cards hid the path, as if under the
  // ground, until the camera came near (the owner, in the game's video).
  nextTeePaths() {
    return this.nextTeeSight()?.paths ?? [];
  }

  // The next hole as it's seen from this one (sim/nexttee.mjs nextTeeView,
  // its cart paths cut by nextTeeKeepOff) and its paths in this hole's
  // frame: { view, paths }, or null with no next hole. (Worked out once a
  // course's hole: nextPathsMemo.)
  nextTeeSight() {
    const i = this.round?.index ?? 0;
    if (this.challenge || !this.course?.holes?.[i + 1]) return null;
    let byHole = nextPathsMemo.get(this.course);
    if (!byHole) nextPathsMemo.set(this.course, (byHole = new Map()));
    if (!byHole.has(i)) {
      const view = nextTeeView(this.course, i, {}, { keepOff: this.nextTeeKeepOff() });
      byHole.set(i, view ? { view, paths: (view.paths ?? []).map((p) => ({ ...p, p: p.p.map(view.to) })) } : null);
    }
    return byHole.get(i);
  }

  // Every cart path drawn on this hole - its own, those between holes and
  // the next hole's as it's seen from here (nextTeeSight) - with how far
  // apart the points along them are (closer on real ground): what addPaths
  // draws, and the grass keeps off as drawn (grassPaths).
  pathsHere(L = this.hole.layout) {
    const sight = this.nextTeeSight();
    const next = sight?.paths ?? [];
    const view = next.length ? sight.view : null;
    return { paths: [...(L?.paths ?? []), ...next], step: this.hole?.mapped || view?.layout.source === "map" ? 0.75 : 1, view };
  }

  // The cart paths as they're drawn on this hole (sim/pathjoin.mjs
  // drawnPaths: joined, their kinks and bends as laid, a free end run on
  // into its gravel) - what every grass and plant on the hole keeps off:
  // the tufts all over it, and round its tee and green where those are
  // off (on the phone), its long grass, the grass across the hole, the
  // lie's nest, a links hole's marram and the dressing. One list, so none
  // stands on a path wherever it's drawn - not only off its line as it
  // plays, nor only the hole's own (the owner, 3 November 2026, of the
  // phone's cart ride: "grass still sticking through. Need to ensure the
  // code always removes grass, not just from the areas shown"). Worked
  // out once for a hole's layout.
  grassPaths(L = this.hole.layout) {
    if (!L) return [];
    let got = grassPathsMemo.get(L);
    if (!got) {
      const { paths, step } = this.pathsHere(L);
      grassPathsMemo.set(L, (got = drawnPaths(paths, { step })));
    }
    return got;
  }

  // Where the next hole's cart paths aren't drawn on this hole (this
  // hole's frame): its fairway, green, tee or sand - over its water on a
  // bridge, as when that hole's played (cut at each bank, Links by the Sea
  // 7's burn had a path running into it and out again) - and where they're
  // this hole's own, drawn already (one strip, not two over each other).
  nextTeeKeepOff() {
    const play = new Set(["fairway", "green", "fringe", "tee", "bunker", "waste"]);
    const mine = this.hole.layout?.paths ?? [];
    return (x, z) => play.has(this.hole.lieAt(x, z)) || gapToPaths(mine, x, z, 1) < -0.6;
  }

  // What another core needs to make this hole again (sim/holesite.mjs
  // holeSite) - or null, with no recipe to make it from.
  offloadSite(L = this.hole?.layout) {
    const recipe = this.hole?.recipe;
    if (!recipe) return null;
    return { recipe, course: this.shore ? this.course : null, index: this.round?.index ?? Math.max(0, (L?.number ?? 1) - 1), shore: !!this.shore, horizonSeed: this.horizonSeed() };
  }

  // The name the hole's kept file has, or would have (look/bake.js): null
  // if holes aren't kept.
  bakeKeyOf(L) {
    const id = holeFingerprint(this.bakeSite(L), { level: LEVEL });
    return id ? keptKey(LEVEL, id) : null;
  }

  // The hole as it's kept (look/bake.js): what it's made from, less the
  // day's pin and the green's speed - neither changes a part that's kept
  // (test/bakesite.test.mjs), and with them in, every hole was built afresh
  // the first time each day (a new day, a new pin) and again for every
  // green speed.
  bakeSite(L) {
    const site = this.offloadSite(L);
    if (!site) return null;
    const { pinDay, stimp, ...opts } = site.recipe.opts ?? {};
    return { ...site, recipe: { ...site.recipe, opts }, neighbours: neighbourPrint(this.course, site.index) };
  }

  // The tufts placed on another core (look/offload.js), from the hole made
  // again there from what it was made from (its recipe: preparedHole) -
  // null where it can't be.
  startTufts(L) {
    const input = this.tuftInput(L);
    const recipe = this.hole.recipe;
    if (!input || !recipe || !canOffload()) return null;
    const site = this.offloadSite(L);
    const probe = holeProbe((x, z) => this.heightAt(x, z), (x, z) => this.hole.lieAt(x, z), L);
    const sent = { ...input, site, probe };
    // (Kept by the hole as it's kept: bakeSite.)
    const keyed = this.bake ? { ...sent, site: this.bakeSite(L) } : null;
    const kept = this.bake?.find("task:holeTufts", keyed);
    if (kept) return { input, job: this.keptJob("holeTufts", sent, kept) };
    return { input, job: this.keepAnswer(offload("holeTufts", sent), "holeTufts", keyed) };
  }

  // The tufts worked out here, a step at a time (sim/holetufts.mjs
  // holeTuftsSteps): no other core to ask, or its answer late. (Once one
  // step: 108 s on Ultra, a hole drawn from a map waited on.)
  *tuftsHere(input, L) {
    return yield* holeTuftsSteps({ ...input, L, lieAt: (x, z) => this.hole.lieAt(x, z), groundY: this.worldHeight, onShore: (wx, wz) => this.onShore(wx, wz) }, "the tufts, worked out here");
  }

  // The fields drawn (holeTufts's: the rough's, the long grass's, then
  // the hay's: sim/hay.mjs). (A step each: the two together were one of a
  // hole's longest steps.) A parkland hole's long grass and hay always
  // there, however far off (sim/tufts.mjs keptShare).
  *placeTuftsSteps(input, [rough, long, hay]) {
    this.world.add(tuftFieldMesh(rough, { height: input.tall[0] }));
    yield "the rough's tufts";
    this.world.add(tuftFieldMesh(long, { height: input.tall[1], keep: this.keptTufts(long) }));
    if (hay?.length) {
      yield "the long grass's tufts";
      this.world.add(tuftFieldMesh(hay, { height: input.tall[2], keep: this.keptTufts(hay) }));
    }
  }

  // The share of a field's far tufts drawn however far off: a parkland
  // hole's long grass and hay (sim/tufts.mjs keptShare), as many as its
  // budget allows; none kept on a links hole.
  keptTufts(squares) {
    return keptShare(squares.reduce((n, sq) => n + sq.data.length / TUFT_STRIDE, 0), !this.hole.layout?.links);
  }

  // What the country's worked out from: all plain data (sim/countryparts.mjs).
  countryInput(L) {
    const line = L.path.map(([x, z]) => [z, -x]);
    const band = L.bandScale ?? 1;
    let box;
    let reach;
    let floor = null;
    if (this.hole.mapped) {
      const r = L.region;
      // (Hole frame -> world: x = z, z = -x.)
      const play = { x0: r.z0, x1: r.z1, z0: -r.x1, z1: -r.x0 };
      reach = { line, reach: 78, box: play, boxReach: 0 };
      const size = Math.max(play.x1 - play.x0, play.z1 - play.z0) + 1800;
      box = { x0: (play.x0 + play.x1) / 2 - size / 2, z0: (play.z0 + play.z1) / 2 - size / 2, size };
    } else {
      const f = this.farSheet;
      reach = { line, reach: L.treeLine + 18 * band };
      box = { x0: f.x - f.size / 2, z0: f.z - f.size / 2, size: f.size };
      // The woods floor beyond the tree lines, as a mapped hole has (a
      // links hole's long grass).
      floor = { line, from: L.treeLine + (L.links ? 40 : 6) * band };
    }
    // The course (for its other holes painted round this one, seen from
    // the air - sim/neighbours.mjs - a mapped course's woods, and the
    // coast): none in the Challenges.
    const course = this.challenge || !this.course?.holes?.length ? null : this.course;
    // The hole's own area round its green, from its own pin, not the day's
    // (a few metres apart on the green): the same country every day, so
    // it's taken from what was kept (look/bake.js).
    const { ownPin, ...own } = L;
    return {
      L: ownPin ? { ...own, pin: ownPin } : L,
      mapped: !!this.hole.mapped,
      seed: this.countrySeed(L),
      character: this.characterOf(L) ?? "parkland",
      box,
      reach,
      floor,
      // The shade under the hole's own trees.
      trees: (this.cameraTrees ?? []).map((t) => [t.x, t.z, t.r]),
      extra: this.courseWoods(L),
      near: this.nearKinds ?? {},
      backdrop: this.backdrop ?? [],
      // The woods out from a designed hole's back rows of trees, so it
      // runs through woods rather than an avenue (sim/deepwoods.mjs).
      deepOn: !!holeExtras({ challenge: this.challenge, mapped: this.hole.mapped }).backdrop,
      patches: (this.dunes?.patches ?? []).map((p) => ({ ...p, x: p.z, z: -p.x })),
      course,
      index: this.round?.index ?? Math.max(0, (L.number ?? 1) - 1),
      shore: !!this.shore,
      colours: { country: countryColours(), holes: courseColours(), patch: patchColours() },
      n: HIGH ? 1024 : 768,
      lines: HIGH,
      high: HIGH,
      extraWoods: EXTRA,
      shadow: shadeOffset(),
      preset: LEVEL,
      shedNear: neighbourShed(),
    };
  }

  // The country laid out (startCountry's): its picture over the ground and
  // under the tufts, the far woods standing in it (look/farwoods.js), the
  // sea and the horizon.
  placeCountry(country) {
    const steps = this.placeCountrySteps(country);
    for (let r = steps.next(); !r.done; r = steps.next());
  }
  // The same a part a step (its picture, then the far woods, then the sea
  // and the horizon): a step of up to 50 ms in one, while the next hole's
  // built ahead.
  *placeCountrySteps(country) {
    if (!country) return;
    const parts = country.parts ?? answer(country.job);
    const mats = this.countryMats ?? [];
    this.neighbours = parts.neighbours?.length ? parts.neighbours : null;
    this.crop = parts.crop?.box ? parts.crop : null;
    const map = countryTexture(parts);
    this.countryPicture = map;
    this.sceneStep(() => {
      for (const m of mats) setCountry(m, map);
      // (And the tufts', so each is the colour of the patch it grows in.)
      setTuftCountry(map);
    });
    yield "the country's picture";
    const woods = countryWoods(parts.woods, { groundY: this.farGround ?? (() => 0), medium: parts.medium });
    if (woods) this.world.add(woods);
    yield "the far woods";
    const { box } = parts;
    const centre = [box.x0 + box.size / 2, box.z0 + box.size / 2];
    // The sea (look/sea.js): out to the horizon from the shore - with the
    // sky's reflection, as the shiny things have it (it's added after the
    // hole's handed out: holebuild.js applyReflections). Without it the sea
    // reflected nothing, and far out, where water is nearly all
    // reflection, it went nearly black: a dark band under the haze.
    if (this.shore) {
      const sea = makeSea({ at: this.shore.at, level: this.shore.level, centre });
      applyReflections(this.scene, sea);
      this.world.add(sea);
    }
    // The horizon (look/backdrop.js): the course's own, round this hole -
    // by the sea, only on the land.
    const horizon = { seed: this.horizonSeed(), centre, shore: this.shore ? { at: this.shore.at, level: this.shore.level } : null };
    this.sceneStep(() => setBackdrop(this.scene, horizon));
  }

  // The course's horizon's seed: from its id, so each course has its own.
  horizonSeed() {
    return nameSeed(seedName(this.course)) || 7;
  }

  // The coast round a hole of a course by the sea (sim/coast.mjs coastOf,
  // coastHere: at(x, z) in the world), or null - inland, or in the
  // Challenges, which have no course. Its level is set as the ground's
  // drawn (shored).
  shoreOf(L) {
    if (this.challenge || !this.course?.holes?.length) return null;
    const coast = coastOf(this.course);
    if (!coast) return null;
    const index = this.round?.index ?? Math.max(0, (L.number ?? 1) - 1);
    const place = coursePlaces(this.course)[Math.min(index, this.course.holes.length - 1)];
    const here = coastHere(coast, place);
    return here ? { ...here, level: 0 } : null;
  }

  // A height (wx, wz) -> metres for the far ground, by the sea run down to
  // the shore (sim/coast.mjs shoreHeight): its dunes and beach, the sea
  // bed under the water. top: the level it eases to away from the hole,
  // the back of the beach. Inland, the height as it is.
  shored(height, top) {
    const shore = this.shore;
    if (!shore) return height;
    const level = seaLevel(top);
    const back = COAST.beach + COAST.dunes;
    const seed = this.horizonSeed();
    return (wx, wz) => {
      const g = height(wx, wz);
      const d = shore.at(wx, wz);
      return d >= back ? g : shoreHeight(d, g, level, duneLump(wx, wz, seed), shore.past(wx, wz));
    };
  }

  // Whether (wx, wz) is clear of the shore's dunes, beach and sea - where a
  // tree may stand. Always, inland.
  inland(wx, wz) {
    return !this.shore || this.shore.at(wx, wz) >= COAST.beach + COAST.dunes + 20;
  }

  // A mapped course's own trees past this hole's box, in the world, as far
  // woods (sim/country.mjs courseTrees): what its other holes' maps found.
  // (On Medium and High neighboursOf's trees, of their own kinds.)
  courseWoods(L) {
    if (!this.hole.mapped || !this.course?.holes) return [];
    const list = courseTrees(this.course.holes, this.round?.index ?? 0);
    // Their kinds (its maps don't say): mostly broadleaf, one in five a
    // conifer, as the hole's own trees are mixed (sim/country.mjs farMix).
    const mix = farMix(this.characterOf(L) ?? "parkland", this.nearKinds ?? {});
    return list.map(([x, z, size], i) => {
      const kind = pickKind(i % 5 === 3 ? mix.conifer : mix.wood, (i * 0.381966) % 1);
      return { x: z, z: -x, h: 11 + 4 * Math.min(2.5, size), w: 7 + 3 * Math.min(2.5, size), kind, tint: ((i * 0.618) % 1 + 1) % 1 };
    });
  }

  // The country's seed for a hole: the course's (its id) and the hole's.
  countrySeed(L) {
    return courseHoleSeed(this.course, L.number);
  }

  // A hole's character (sim/country.mjs holeCharacter), from its seed;
  // the Driving Challenge's holes have none (null).
  characterOf(L) {
    if (!holeExtras({ challenge: this.challenge }).character) return null;
    return characterFor(L, this.countrySeed(L));
  }

  // Glimpses of the course's other holes out past the trees (sim/country.mjs
  // glimpsesFor): fairway strips, greens with a bunker or two and tees,
  // with no flags, on the far ground - two draws, the grass in the
  // fairway's own (its greens and tees tinted), the sand in one. On Medium
  // and High a course's real other holes are painted on the ground instead
  // (addCountry), and only their greens and tees are drawn here, as low,
  // plain shapes (sim/neighbours.mjs neighbourLows) - one draw. A course's
  // other holes a few shapes a step (cropSurfaceSteps).
  *glimpseSteps(L) {
    if (yield* this.cropSurfaceSteps(L)) return;
    const lows = this.neighbours?.length ? neighbourLows(this.neighbours, { own: ownArea(L, { band: L.bandScale ?? 1 }) }) : null;
    if (!lows && !holeExtras({ challenge: this.challenge, mapped: this.hole.mapped }).glimpses) return;
    const g = lows ? null : glimpsesFor(L, { seed: this.countrySeed(L), character: this.characterOf(L), land: this.shore ? (x, z) => this.shore.at(z, -x) >= COAST.beach + COAST.dunes + 60 : null });
    if (g ? !g.greens.length : !lows.greens.length && !lows.tees.length) return;
    const ground = this.farGround ?? (() => 0);
    const tessellate = new TessellateModifier(NEIGHBOURS.lowEdge, 8);
    const tint = (hex) => {
      const a = new THREE.Color(hex);
      const f = new THREE.Color(PALETTE.fairway[0]);
      return [a.r / f.r, a.g / f.g, a.b / f.b];
    };
    // Hole frame [x, z] outline -> a piece on the far ground, lifted,
    // coloured. Cut into triangles no more than a few metres a side, so it
    // lies on the ground's rises and falls - a green made of its outline
    // alone was flat across them, sunk into a rise or floating over a dip.
    const piece = (pts, lift, colour) => {
      let geo = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(z, x))));
      geo.rotateX(-Math.PI / 2);
      geo = tessellate.modify(geo);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setY(i, ground(pos.getX(i), pos.getZ(i)) + lift);
      geo.computeVertexNormals();
      geo.deleteAttribute("uv");
      geo.setAttribute("color", new THREE.Float32BufferAttribute(Array.from({ length: pos.count }, () => colour).flat(), 3));
      return geo;
    };
    const oval = (o, n = 36) => Array.from({ length: n }, (_, k) => {
      const a = (k / n) * Math.PI * 2;
      const [cx, cz] = [Math.cos(a) * o.rx, Math.sin(a) * o.rz];
      return [o.x + cx * Math.cos(o.rot) - cz * Math.sin(o.rot), o.z + cx * Math.sin(o.rot) + cz * Math.cos(o.rot)];
    });
    const grass = lows
      ? [...lows.greens.map((p) => piece(p, 0.09, tint(PALETTE.green[0]))), ...lows.tees.map((p) => piece(p, 0.09, tint(PALETTE.tee[0])))]
      : [
          ...g.fairways.map((f) => piece(f, 0.06, [1, 1, 1])),
          ...g.greens.map((o) => piece(oval(o), 0.09, tint(PALETTE.green[0]))),
          ...g.tees.map((t) => piece(oval({ ...t, rx: 7, rz: 6 }, 4), 0.09, tint(PALETTE.tee[0]))),
        ];
    // (A neighbour's greens and tees plain, with no stripes: the fairway's
    // ran the way the hole being played does, not theirs.)
    const lawn = grassMaterial({ ...GRASS.fairway, stripeWidth: lows ? 0 : 9, layer: LAYER.fairway });
    lawn.vertexColors = true;
    const mesh = new THREE.Mesh(mergeGeometries(grass), lawn);
    mesh.receiveShadow = true;
    this.world.add(mesh);
    if (g?.bunkers.length) {
      const sand = onLayer(new THREE.MeshLambertMaterial({ color: PALETTE.sand }), LAYER.sand);
      const bunkers = new THREE.Mesh(mergeGeometries(g.bunkers.map((b) => piece(oval(b, 24), 0.12, [1, 1, 1]))), sand);
      bunkers.receiveShadow = true;
      this.world.add(bunkers);
    }
  }

  // The crop's other holes as low ground on the far sheet (sim/cropsurfaces.mjs):
  // fairways, greens and tees in one draw, bunkers in one, water in one.
  // Tier 1 greens crown and its bunkers dip. Its trees are the light far
  // crowns, not the full trees, and not the painted cards. Returns whether
  // any of that was drawn, so the made-up glimpses stay for a course of one hole.
  // Built CROP_PIECES shapes a step (the owner, 21 October 2026: "Go with
  // the top two" - in one, 0.15 - 0.3 s, it was the longest step left in
  // building a parkland hole ahead), each the very same and in the same
  // order as in one go.
  *cropSurfaceSteps(L) {
    if (this.challenge || (this.course?.holes?.length ?? 0) < 2) return false;
    const index = this.round?.index ?? Math.max(0, (L.number ?? 1) - 1);
    const crop = this.crop?.box ? this.crop : holeCrop(this.course, index, { preset: LEVEL, woods: false });
    if (!crop?.box) return false;
    // The play area, as the painted picture uses (sim/countryparts.mjs), so
    // a shape and its paint end in the same place.
    const own = ownArea(L, { band: L.bandScale ?? 1, play: true });
    const surfaces = cropSurfaces(crop, { own, shaped: true });
    yield "the other holes' shapes";
    const alphaAt = surfaceAlpha(crop, own);
    const toneOf = toneAt(crop);
    const fine = new TessellateModifier(CROP_EDGE_STEP, 8);
    const ground = this.farGround ?? (() => 0);
    const tint = (hex) => {
      const a = new THREE.Color(hex);
      const f = new THREE.Color(PALETTE.fairway[0]);
      return [a.r / f.r, a.g / f.g, a.b / f.b];
    };
    const piece = (pts, spec, colour) => {
      let geo;
      try {
        geo = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(z, x))));
      } catch {
        return null;
      }
      geo.rotateX(-Math.PI / 2);
      // Cut fine everywhere: so it follows the height field (a shape with
      // only its corners on the ground lay flat, floating over links dunes),
      // and its alpha eases rather than steps where it fades.
      geo = fine.modify(geo);
      geo.deleteAttribute("uv");
      geo.deleteAttribute("normal");
      geo = mergeVertices(geo);
      const yOf = liftAt(pts, spec);
      // (Water: gone on its hole's greens and their fringes, faded out
      // over half a metre before them - sim/greenfirst.mjs - and on an
      // island green's causeway.)
      const past = (g, x, z) => (insidePolygon(g, x, z) ? -1 : 1) * distanceToEdge(g, x, z);
      const dry = spec.dry?.length ? (x, z) => smoothstepJS(0, 0.5, Math.min(...spec.dry.map((g) => past(g, x, z) - FRINGE), ...(spec.ways ?? []).map((c) => past(c, x, z)))) : () => 1;
      const pos = geo.attributes.position;
      const rgba = new Float32Array(pos.count * 4);
      for (let i = 0; i < pos.count; i++) {
        const wx = pos.getX(i);
        const wz = pos.getZ(i);
        pos.setY(i, ground(wx, wz) + yOf(-wz, wx));
        const k = spec.toned ? toneOf(-wz, wx) : 1;
        const shore = spec.shore ? smoothstepJS(0, spec.shore, edgeDistance(pts, -wz, wx)) : 1;
        rgba.set([colour[0] * k, colour[1] * k, colour[2] * k, alphaAt(-wz, wx) * shore * dry(-wz, wx)], i * 4);
      }
      geo.computeVertexNormals();
      geo.setAttribute("color", new THREE.Float32BufferAttribute(rgba, 4));
      return geo;
    };
    const built = function* (list, colour, toned = true, shore = 0) {
      const geos = [];
      for (let i = 0; i < list.length; i++) {
        const geo = piece(list[i].pts, { ...list[i], toned, shore }, colour);
        if (geo) geos.push(geo);
        if ((i + 1) % CROP_PIECES === 0 && i + 1 < list.length) yield "the other holes' glimpses: a few shapes";
      }
      return geos;
    };
    const add = (geos, material) => {
      if (!geos.length) return;
      // Vertex alpha: the shapes fade into the painted picture at the
      // crop's edge.
      material.vertexColors = true;
      material.transparent = true;
      const mesh = new THREE.Mesh(mergeGeometries(geos), material);
      mesh.receiveShadow = true;
      this.world.add(mesh);
    };
    // Each neighbour's fairway and green mown as when that hole is played
    // (holebuild.js): its own patterns (sim/mowing.mjs, turned into this
    // frame, from its own tee), the same stripe widths, and a links hole's
    // fairway in its linksLook. Tees in the usual fairway look, tinted.
    // One draw per neighbour's fairway and per green, so each keeps its own.
    const mowOf = (s, which) => {
      const m = s.mowing;
      if (!m?.[which]) return {};
      return { ...mowOptions(m[which]), centre: holeToWorld(m.origin ?? [0, 0]) };
    };
    const groups = (list) => {
      const by = new Map();
      for (const s of list) {
        const key = `${s.number}|${s.links ?? ""}`;
        if (!by.has(key)) by.set(key, []);
        by.get(key).push(s);
      }
      return [...by.values()];
    };
    let grass = 0;
    for (const list of groups(surfaces.fairway)) {
      const geos = yield* built(list, [1, 1, 1]);
      if (!geos.length) continue;
      const links = list[0].links;
      const look = links === "dunes" ? { light: PALETTE.linksFairway[0], dark: PALETTE.linksFairway[1], patch: 0.36, patchScale: 0.05 } : links || L.links ? { patch: 0.3, patchScale: 0.05 } : {};
      add(geos, grassMaterial({ ...GRASS.fairway, stripeWidth: MOW_WIDTH.fairway, ...mowOf(list[0], "fairway"), ...look, layer: LAYER.fairway }));
      grass += geos.length;
      yield "the other holes' glimpses: a fairway";
    }
    for (const list of groups(surfaces.green)) {
      const geos = yield* built(list, [1, 1, 1]);
      if (!geos.length) continue;
      add(geos, grassMaterial({ ...GRASS.green, stripeWidth: MOW_WIDTH.green, ...mowOf(list[0], "green"), layer: LAYER.fairway }));
      grass += geos.length;
      yield "the other holes' glimpses: a green";
    }
    // (Not the next hole's, where its own tee boxes are drawn: addNextTee.)
    const nextBoxes = this.world.userData.nextTeeBoxes;
    const tees = yield* built(
      surfaces.tee.filter((s) => s.number == null || s.number !== nextBoxes),
      tint(PALETTE.tee[0]),
    );
    if (tees.length) add(tees, grassMaterial({ ...GRASS.fairway, stripeWidth: 10, ...(L.links ? { patch: 0.3, patchScale: 0.05 } : {}), layer: LAYER.fairway }));
    grass += tees.length;
    yield "the other holes' glimpses: tees";
    if (surfaces.bunker.length) add(yield* built(surfaces.bunker, [1, 1, 1], false), onLayer(new THREE.MeshLambertMaterial({ color: PALETTE.sand }), LAYER.sand));
    yield "the other holes' glimpses: bunkers";
    // Water as the far ponds are painted (PALETTE.farPond), with the
    // hole's own water's sheen (look/sandwater.js waterMaterial); vertex
    // alpha fades it at the crop's edge like the rest. (waterDeep is the
    // deep tint the water shader mixes from, near black on its own.)
    if (surfaces.water.length) {
      // Lighter than the painted pond: from the air the hole's own water
      // shows the sky. Its shore blends over CROP_SHORE metres.
      const pond = onLayer(new THREE.MeshStandardMaterial({ color: CROP_POND, roughness: 0.12, metalness: 0, envMapIntensity: 0.6 }), LAYER.water);
      // (The sky to show: they're built after the hole's shiny things are
      // given it - holebuild.js applyReflections - and had none.)
      pond.envMap = this.scene?.userData.envMap ?? null;
      pond.polygonOffsetFactor = -8;
      add(yield* built(surfaces.water, [1, 1, 1], false, CROP_SHORE), pond);
      yield "the other holes' glimpses: water";
    }
    const placeTrees = (list, farOnly) => {
      if (!list.length || neighbourShed()) return;
      const forms = [];
      const positions = list.map((t) => {
        const fade = farOnly ? t.fade : 1;
        const form = t.form ? { ...t.form, h: (t.form.h ?? 1) * fade, w: (t.form.w ?? 1) * fade } : null;
        forms.push(form);
        const at = toWorldXZ(t.at);
        if (!form && at.length > 2) at[2] *= fade;
        return at;
      });
      // (Seen from this hole's line of play: sim/treelod.mjs buriedTrees.)
      this.world.add(watchNeighbourTrees(makeTrees(positions, { groundY: ground, forms, farOnly, shadows: !farOnly, seed: (L.number ?? 1) + (farOnly ? 17 : 19), facing: L.path.map(toWorldXZ) })));
    };
    // (On High and Ultra all of them real trees: no low ones inside the
    // hole's ground - look/trees.js neighboursInFull. Below, those along
    // the walk to the next tee, the rest the low version.)
    if (neighboursInFull()) placeTrees(surfaces.trees, false);
    else {
      placeTrees(surfaces.trees.filter((t) => t.walk), false);
      placeTrees(surfaces.trees.filter((t) => !t.walk), true);
    }
    return grass > 0 || surfaces.bunker.length > 0 || surfaces.water.length > 0 || surfaces.trees.length > 0;
  }

  // The hole's cart paths (look/paths.js) - its own, those between holes,
  // and the next hole's as it's seen from here (nextTeeSight) - all in one,
  // so those that meet end to end are one path (sim/pathjoin.mjs), laid on
  // the ground as it's drawn, with worn grass along their edges only where
  // it's rough.
  addPaths(L) {
    const { paths: all, step, view } = this.pathsHere(L);
    if (!all.length) return;
    const rough = new Set(["rough", "semi", "deep", "trees"]);
    // The next hole's ground, in its own frame: its tee boxes, its play and
    // its water, as its layout has them.
    const line = view ? makePath(view.layout.path) : null;
    const nextLie = view ? (x, z) => surfaceAt(view.layout, ...view.from([x, z]), line) : null;
    // (And over the other holes' water, where a path between holes or one
    // kept off them crosses it: sim/coursepaths.mjs othersWater; and the
    // next hole's, as it lies.)
    const index = this.round?.index ?? Math.max(0, (L.number ?? 1) - 1);
    const others = !this.challenge && this.course?.holes?.length > 1 ? othersWater(this.course, index) : null;
    const wet = (x, z) => this.hole.lieAt(x, z) === "water" || !!others?.(x, z) || nextLie?.(x, z) === "water";
    const nextTee = view ? teeBoxAt(view.layout) : null;
    const ownTee = teeBoxAt(L);
    // Laid on the ground drawn there: the hole's own, or the other holes'
    // shapes and the far ground beyond it (as the cart rides).
    const own = this.pathGround ?? this.worldHeight;
    const ground = (wx, wz) => {
      const far = this.farGround?.(wx, wz);
      return Number.isFinite(far) ? Math.max(own(wx, wz), far) : own(wx, wz);
    };
    this.world.add(
      makePaths({ ...L, paths: all }, ground, {
        step,
        // (Its own lie, and the next hole's where that's drawn: worn
        // grass beside its paths, not on its fairway or tee. Beside its
        // path as it lies there, before it was cut where this hole's own
        // runs along it.)
        keepVerge: (x, z) => {
          if (!rough.has(this.hole.lieAt(x, z))) return false;
          const there = nextLie?.(x, z);
          return !there || there === "path" || rough.has(there);
        },
        // Over water on a bridge (look/bridges.js), clear of the water as
        // it's drawn there.
        wet,
        waterAt: (x, z) => (wet(x, z) ? this.surfaceHeight(x, z) : null),
        // The tee boxes on top (the owner: "Tee box should always be on
        // top"): none of a path drawn over one - the next hole's too.
        under: nextTee ? (x, z) => ownTee(x, z) || nextTee(...view.from([x, z])) : ownTee,
      }),
    );
  }

  // Worn grass (sim/wear.mjs, look/wear.js): tracks trodden across the rough
  // - off the tee, from the green on to the next tee, between the cart
  // path's ends and the tee and green - and patches of thin grass well away
  // from the fairway and green. Never on a green. And divots on the tee.
  addWear(L) {
    if (!HIGH) return;
    const lieAt = (x, z) => this.hole.lieAt(x, z);
    const seed = (L.number ?? 1) * 7919 + (L.yards ?? 0);
    const nextTee = this.nextTeeOf(L);
    this.wear = { lines: wearLines(L, lieAt, { seed, nextTee }), patches: wearPatches(L, lieAt, seed) };
    this.world.add(makeWear(this.wear, this.pathGround ?? this.worldHeight));
    // Sand-filled divots across the front of the tee, heavier on a par 3.
    const divots = makeDivots(teeDivots(lieAt, { seed, par: L.par }), (x, z) => {
      const p = toWorld(x, this.surfaceHeight(x, z), z);
      return [p.x, p.y, p.z];
    });
    if (divots) this.world.add(divots);
  }

  // What dresses the rough (sim/dressing.mjs, look/dressing.js): heather
  // and gorse (more on an open hole), rocks, and on High wildflowers and
  // reeds at the water's edge. For the look only: none of it changes how a
  // ball plays.
  // (A kind or two at a time - its steps named for them - and the links
  // ground a step of its own: on a links hole by the sea it was half a
  // second of the page.)
  *addDressing(L) {
    // Other holes' fairways, greens and tees read as theirs, so none of it
    // is laid on them (sim/treeclear.mjs lieWithOthers).
    const index = this.round?.index ?? Math.max(0, (L.number ?? 1) - 1);
    const own = (x, z) => this.hole.lieAt(x, z);
    const others = !this.challenge && this.course?.holes?.length > 1 ? lieWithOthers(this.course, index, own) : own;
    // (And every path as it's drawn here reads as path, which it all keeps
    // well clear of: grassPaths.)
    const drawn = this.grassPaths(L);
    const lieAt = drawn.length ? (x, z) => (gapToPaths(drawn, x, z, 0.01) <= 0 ? "path" : others(x, z)) : others;
    this.decorLie = lieAt;
    const seed = (L.number ?? 1) * 104729 + (L.yards ?? 0);
    // (Thinned for the hole's character: sim/country.mjs dressFor.)
    this.dressing = dressFor(this.characterOf(L), yield* roughDressingSteps(L, lieAt, seed));
    // And its waste areas' heather, gorse, stones and fescue (sim/
    // wastearea.mjs) - theirs whatever the hole's character.
    this.dressing = withWasteDressing(this.dressing, wasteDressing(L, lieAt, seed));
    // Decor placed by hand (sim/decor.mjs): this hole's, and the other
    // holes' in its crop, where they stand on the course - the same from
    // every hole. (Their bushes come as their trees.)
    const placed = [...(L.decor ?? []), ...(!this.challenge && this.course ? othersDecor(this.course, index) : [])];
    if (placed.length) this.dressing = withDecor(this.dressing, decorDressing(placed));
    // A brown links hole's dunes: rocky outcrops among the dressing, and
    // patches of sand, heather, greener grass and stony ground over its
    // rough (sim/dunes.mjs; the patches painted by addCountry).
    this.dunes = L.links && L.links !== "green" ? dunesDressing(L, lieAt, seed) : null;
    // And on any links hole, rock breaking through its steeper dune faces
    // (a hole from a map's real ones: its relief, sim/linksground.mjs
    // reliefRolls).
    const faces = L.links ? duneFaceOutcrops(L, this.linksRollsOf(L), lieAt, seed) : null;
    if (faces && this.dunes) this.dunes = { ...this.dunes, patches: [...this.dunes.patches, ...faces.patches] };
    if (this.dunes) this.dressing = { ...this.dressing, rocks: [...this.dressing.rocks, ...this.dunes.rocks] };
    if (faces) this.dressing = { ...this.dressing, rocks: [...this.dressing.rocks, ...faces.rocks] };
    // (None on the beach, with the sea brought close: onShore.)
    if (this.shore) this.dressing = offShore(this.dressing, (x, z) => this.onShore(z, -x));
    this.world.add(makeDressing(this.dressing, this.pathGround ?? this.worldHeight, { high: HIGH, seed }));
    yield "the dressing";
    this.addLinksGround(L, seed);
  }

  // What tells a links hole's crests from its swales: its rolls, or on a
  // hole from a map made a links hole (the hole builder's Ground), its
  // real ground's relief. Worked out once a hole.
  linksRollsOf(L) {
    if (!L.links) return null;
    if (!this.hole.mapped) return this.hole.green?.rolls ?? null;
    // (Its own name: "relief" is an unplayable ball's drops on show.)
    if (this.linksReliefFor !== this.hole) {
      this.linksReliefFor = this.hole;
      const hole = this.hole;
      this.linksRelief = reliefRolls(fieldBounds(L.path ?? [], (L.treeLine ?? 40) + 30), (x, z) => hole.heightAt(x, z));
    }
    return this.linksRelief;
  }

  // A links hole's ground (sim/linksground.mjs, look/linksground.js):
  // marram along the crests, rabbit scrapes, blown sand and pebbles round
  // its bunkers.
  addLinksGround(L, seed) {
    const rolls = this.linksRollsOf(L);
    if (!L.links || !rolls) return;
    this.links = linksGround(L, rolls, this.decorLie ?? ((x, z) => this.hole.lieAt(x, z)), { seed, setting: LEVEL, paths: this.grassPaths(L) });
    if (this.shore) this.links = offShore(this.links, (x, z) => this.onShore(z, -x));
    this.world.add(makeLinksGround(this.links, this.worldHeight, { high: HIGH }));
  }

  // Where the next hole's tee is, in hole i's frame (the round's hole, if
  // not said): from where the map has both, else from the course's layout
  // (its routing); null on the last.
  nextTeeOf(L, i = this.round?.index ?? 0) {
    const holes = this.course?.holes ?? [];
    if (!holes[i + 1]) return null;
    const mapped = nextTeeFrom(L, holes[i + 1].layout);
    if (mapped) return mapped;
    const places = coursePlaces(this.course);
    if (!places?.[i] || !places[i + 1]) return null;
    return holeFrame([places[i].x, places[i].z], places[i].heading).toHole([places[i + 1].x, places[i + 1].z]);
  }

  // The next hole's layout in the round, or null.
  nextLayout() {
    const i = this.round?.index ?? 0;
    return this.course?.holes?.[i + 1]?.layout ?? null;
  }

  // The signs round the hole (sim/signs.mjs, look/signs.js): the tee sign
  // with the card's number, par and yards (and, on the higher graphics
  // setting, a little map of the hole), yardage posts and plates, an arrow
  // on to the next tee where the cart path ends, tee markers.
  addSignage(L) {
    const i = this.round?.index ?? 0;
    const holes = this.course?.holes ?? [];
    const spec = holes[i]?.spec ?? {};
    const info = {
      number: spec.number ?? L.number,
      par: spec.par ?? L.par,
      // From the round's tees (the panel's, before a round).
      yards: spec.yards != null ? this.yardsOf(i) : L.yards,
      tee: this.round?.tees ?? this.settings.tees,
      next: i + 1 < holes.length ? (holes[i + 1].spec?.number ?? i + 2) : null,
      last: holes.length > 0 && i === holes.length - 1,
      nextTee: this.nextTeeOf(L, i),
    };
    let map = null;
    if (HIGH && holes[i]) {
      map = document.createElement("canvas");
      map.width = 96;
      map.height = 160;
      drawHole(map, holes[i].layout);
    }
    const onGround = (x, z) => this.heightAt(x, z);
    const signs = signsFor(L, info);
    this.world.add(makeSignage(signs, info, onGround, map));
    this.addNextTee(L);
    // A windsock beside the tee sign, for the wind at a glance from the tee
    // (sim/windsock.mjs, look/windsock.js).
    const sock = windsockSpot(L, signs.tee);
    if (sock) {
      const w = makeWindsock({ seed: info.number ?? 1 });
      w.position.set(sock[1], onGround(sock[0], sock[1]), -sock[0]);
      this.world.add(w);
    }
    this.addClub(L, { info, sign: signs.tee, sock, arrow: signs.arrow });
  }

  // The next tee as it's drawn when that hole's played (sim/nexttee.mjs):
  // its sign with the card on it, its markers in the round's colour, its
  // windsock and the benches by it (its cart paths are drawn with this
  // hole's: addPaths), and (a designed hole) its tee boxes in their mown surround - each made as that hole makes them, in its own
  // frame, the lot turned to where the course puts it and stood on the
  // ground this hole draws there. Driving up to it, it's the tee you
  // arrive at (the owner, 26 October 2026: it was a board "in the middle
  // of the tee box, not where it'd land when you actually drive up").
  addNextTee(L) {
    this.world.userData.nextTeeBoxes = null;
    if (this.challenge) return;
    const i = this.round?.index ?? 0;
    const holes = this.course?.holes ?? [];
    const spec = holes[i + 1]?.spec;
    if (!spec) return;
    const info = { number: spec.number ?? i + 2, par: spec.par, yards: spec.yards != null ? this.yardsOf(i + 1) : undefined, tee: this.round?.tees ?? this.settings.tees };
    // (Its cart paths cut off this hole's play and its own: nextTeeKeepOff.)
    const view = nextTeeView(this.course, i, info, { keepOff: this.nextTeeKeepOff() });
    if (!view) return;
    // Its frame -> this hole's world, and the ground drawn there.
    const world = (x, z) => {
      const [hx, hz] = view.to([x, z]);
      return [hz, -hx];
    };
    const ground = (x, z) => this.rideGround(...world(x, z));
    const group = new THREE.Group();
    group.name = "next tee";
    group.position.set(view.at[0], 0, view.at[1]);
    group.rotation.y = view.turn;
    let map = null;
    if (HIGH) {
      map = document.createElement("canvas");
      map.width = 96;
      map.height = 160;
      drawHole(map, holes[i + 1].layout);
    }
    group.add(makeSignage(view.signs, info, ground, map));
    const furniture = makeFurniture(view.furniture, ground);
    if (furniture) group.add(furniture);
    // (Its cart paths are drawn with this hole's: addPaths, so where they
    // meet they're one path.)
    if (view.boxes.length) {
      this.addNextTeeBoxes(group, view, ground);
      // (For the crop to leave its stand-in tee out: the hole's own group
      // knows, whichever hole's being built.)
      this.world.userData.nextTeeBoxes = view.number;
    }
    this.world.add(group);
    // The windsock straight into this world: its cloth flies with the
    // wind as this world has it (the course's, across every hole).
    if (view.sock) {
      const w = makeWindsock({ seed: info.number ?? 1 });
      const [wx, wz] = world(...view.sock);
      w.position.set(wx, this.rideGround(wx, wz), wz);
      this.world.add(w);
    }
  }

  // The next hole's tee boxes (holebuild.js draws them as it's played:
  // the square round each spot, the first cut mown round it, and between
  // two close together), into `group` - its own world, turned into this
  // one (view.at, view.turn) - on ground(x, z) in its frame, a little over
  // the other holes' shapes here. The tee's stripes run as its own do,
  // from its own tee.
  addNextTeeBoxes(group, view, ground) {
    const heightAt = (wx, wz) => ground(-wz, wx);
    const lift = { semi: 0.05, tee: 0.1 };
    const corners = ([x0, x1, z0, z1], out = 0) => [[x0 - out, z0 - out], [x1 + out, z0 - out], [x1 + out, z1 + out], [x0 - out, z1 + out]];
    const lay = (pts, y) => {
      let geo = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(z, x))));
      geo.rotateX(-Math.PI / 2);
      geo = refine(geo, 1.5);
      const pos = geo.attributes.position;
      for (let k = 0; k < pos.count; k++) pos.setY(k, heightAt(pos.getX(k), pos.getZ(k)) + y);
      geo.computeVertexNormals();
      return geo;
    };
    const mesh = (geo, mat) => {
      const m = new THREE.Mesh(geo, mat);
      m.receiveShadow = true;
      group.add(m);
    };
    const strip = (pts, y) => edgeStrip(lineAlong(pts).map(([x, z]) => [z, -x]), MOWN_EDGE, heightAt, y);
    const L = view.layout;
    const semiLook = L.links === "dunes" ? { light: PALETTE.linksFirstCut[0], dark: PALETTE.linksFirstCut[1], patch: 0.34 } : {};
    const semi = grassMaterial({ ...GRASS.semi, ...semiLook });
    const semiEdge = grassMaterial({ ...GRASS.semi, edge: true, ...semiLook });
    const turned = { stripeAngle: GRASS.tee.stripeAngle - view.turn, centre: view.at };
    const tee = grassMaterial({ ...GRASS.tee, ...turned });
    const teeEdge = grassMaterial({ ...GRASS.tee, edge: true, ...turned });
    for (const bridge of view.bridges) {
      mesh(lay(corners(bridge, -MOWN_EDGE / 2), lift.semi), semi);
      group.add(edgeMesh(strip(corners(bridge, -MOWN_EDGE / 2), lift.semi), semiEdge, LAYER.semi));
    }
    for (const box of view.boxes) {
      const round = corners(box, SURROUND.tee - MOWN_EDGE / 2);
      mesh(lay(round, lift.semi), semi);
      group.add(edgeMesh(strip(round, lift.semi), semiEdge, LAYER.semi));
      mesh(lay(corners(box), lift.tee), tee);
      group.add(edgeMesh(strip(corners(box), lift.tee), teeEdge, LAYER.tee));
    }
  }

  // The club round the hole, beside its signs (and like them never in the
  // Challenges, which leave the signs out): the furniture by the tee and
  // the rakes by greenside bunkers (sim/furniture.mjs, look/club.js); past
  // a designed course's last green, where the "Clubhouse" arrow points,
  // the clubhouse (sim/buildings.mjs clubhouseSpot); on a course from a
  // map, its own buildings. None of it takes part in play; the buildings
  // join what the chase camera and the flyover keep clear of (view.js
  // keepClear).
  addClub(L, { info, sign, sock, arrow }) {
    const onGround = (x, z) => this.heightAt(x, z);
    const furniture = makeFurniture(holeFurniture(L, { sign, sock }), onGround);
    if (furniture) this.world.add(furniture);
    const spot = info.last ? clubhouseSpot(L, arrow) : null;
    if (spot) {
      // Hole frame -> world, and its front turned to face back at the green.
      const [x, z] = spot.at;
      const [wx, wz] = [z, -x];
      const turn = Math.atan2(spot.face[1], -spot.face[0]);
      const y = Math.min(...plotCorners(wx, wz, turn).map(([px, pz]) => this.worldHeight(px, pz)), this.worldHeight(wx, wz));
      // Out past the hole, beyond the box the sun's shadow map is fitted
      // to: a painted shadow, casting nothing into the map.
      const house = makeClubhouse({ turn, cast: false, painted: true, board: null, high: HIGH, seed: info.number ?? 18 });
      house.position.set(wx, y, wz);
      house.userData.keepClear = clubhouseClear(wx, wz, turn, y);
      this.world.add(house);
    }
    // Ducks, or a pair of swans, on its larger ponds, paddling clear of
    // where a ball comes down: away from the line of play and the green
    // (sim/furniture.mjs pondBirds, look/wildlife.js).
    if (L.water?.length) {
      const path = makePath(L.path);
      const ponds = L.water.map((w) => ({ x: w.x, z: w.z, area: w.poly ? polygonArea(w.poly) : Math.PI * w.rx * w.rz, inside: (x, z) => insideBlob(w, x, z) }));
      const clearOf = (x, z) => Math.abs(nearest(path, x, z).d) >= BIRDS.clear && !insideBlob(L.green, x, z, BIRDS.clear);
      const birds = pondBirds(ponds, { clearOf, seed: (info.number ?? 1) * 31 + 7, high: HIGH });
      // On the water: a pond's own level where it has one (a mapped or a
      // walled pond), else as the course draws the water there.
      const level = (x, z) => {
        const w = L.water.find((p) => insideBlob(p, x, z));
        if (w?.brook) return this.hole.waterLevelAt(w, x, z);
        return w && (this.hole.mapped || sunkPond(w)) ? this.hole.pondLevel(w) : this.surfaceHeight(x, z);
      };
      const place = (x, z) => [z, level(x, z), -x];
      const flock = makeBirds(birds, place);
      if (flock) this.world.add(flock);
      // And heard: each calls now and then from where it sits.
      const scape = this.world.userData.soundscape;
      if (scape) scape.fowl = fowlOnWater(birds.map((b) => ({ kind: b.kind, at: place(...b.at) })));
    }
    // A course from a map: its buildings, where the map has them, the
    // course's largest as its clubhouse (sim/buildings.mjs raiseBuildings).
    if (L.source === "map" && L.buildings?.length) {
      const built = makeBuildings(raiseBuildings(L, { largest: largestBuilding(this.course?.holes) }), onGround);
      if (built) this.world.add(built);
    }
  }

  // A brook (sim/brooks.mjs): its water, falling along it as it runs
  // downhill (the hole's waterLevelAt), and a wall for each walled stretch
  // of bank. Its banks are the ground's own (holeedits.mjs groundShaping).
  // (loop: its outline, world; sand: bunkers' outlines running into it.)
  drawBrook(w, loop, sand) {
    // (Its muddy margin and shallows as narrow as a brook's width needs;
    // none of it on a green or its fringe, sim/greenfirst.mjs - it runs
    // under them, as under a cart path.)
    // (Its own banks mirrored along its far side, not a pond's trees.)
    // (Running downhill, as its water falls: sim/waterflow.mjs runOf.)
    const run = runOf(w.brook.p, { heightAt: (x, z) => this.hole.waterLevelAt(w, x, z) });
    const material = waterFor(loop, LAYER.water, sand, null, waterEdgeScale(brookHalf(w.brook)), waterDry(greenZone(this.hole.layout), w), { bank: { height: brookBankHeight(w.brook), across: 2 * brookHalf(w.brook) }, run });
    const levelAt = (x, z) => this.hole.waterLevelAt(w, x, z);
    (this.waterLevels ??= []).push({ w, level: this.hole.pondLevel(w), at: levelAt });
    const geo = new THREE.ShapeGeometry(new THREE.Shape(w.poly.map(([x, z]) => new THREE.Vector2(z, x))));
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, levelAt(-pos.getZ(i), pos.getX(i)));
    geo.computeVertexNormals();
    // Each corner's way across it and how far from its middle (sim/brooks.mjs
    // brookAcross), world: where its far bank is, smoothly - read from the
    // slope of its edge's distance, stored a few centimetres a step, the
    // far bank mirrored in it came out in teeth.
    const across = new Float32Array(pos.count * 2);
    const side = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const a = brookAcross(w.brook, -pos.getZ(i), pos.getX(i));
      across[i * 2] = a.lz;
      across[i * 2 + 1] = -a.lx;
      side[i] = a.s;
    }
    geo.setAttribute("bAcross", new THREE.Float32BufferAttribute(across, 2));
    geo.setAttribute("bSide", new THREE.Float32BufferAttribute(side, 1));
    const m = new THREE.Mesh(geo, material);
    m.receiveShadow = true;
    this.world.add(m);
    for (const v of wallViews(w)) {
      const built = makeWall(v, "water", { heightAt: (x, z) => this.heightAt(x, z), level: levelAt });
      if (built) this.world.add(built);
    }
    const banks = this.brookBanks(w, levelAt);
    if (banks) this.world.add(banks);
  }

  // A brook's banks' bare earth and silt (sim/brooks.mjs brookBankLines),
  // over the grass of its banks: from just under its water up to where the
  // turf comes down to - a short face of earth under a lip of turf on the
  // outside of a bend, a long shelf of silt on the inside - each corner
  // with its water's level (it falls along the brook) and how far up to
  // the turf it is (look/sandwater.js bankSlopeMaterial along). None on a
  // green or its fringe (sim/greenfirst.mjs), nor along a wall.
  brookBanks(w, levelAt) {
    const runs = brookBankLines(w, {
      heightAt: (x, z) => this.heightAt(x, z),
      levelAt,
      step: HIGH ? 0.4 : 0.6,
      wallsAt: w.walls ? (x, z) => wallAt(w, x, z)?.wn ?? 0 : undefined,
      // (Short of the hole's bunkers, as the ground is: sim/holeedits/ground.mjs.)
      room: brookRoom(w, this.hole.layout.bunkers, insideBlob),
    });
    const zone = greenZone(this.hole.layout);
    const ROWS = 6;
    const FROM = -0.35;
    const pos = [];
    const bank = [];
    const index = [];
    for (const run of runs) {
      const base = pos.length / 3;
      for (const q of run) {
        for (let j = 0; j <= ROWS; j++) {
          const o = FROM + ((q.to - FROM) * j) / ROWS;
          const x = q.x + q.nx * o;
          const z = q.z + q.nz * o;
          const at = toWorld(x, 0, z);
          pos.push(at.x, this.heightAt(x, z) + 0.006, at.z);
          bank.push(levelAt(x, z), Math.max(0, o / q.to));
        }
      }
      // (Wound to face up, whichever side of the brook it's on.)
      const p = (k) => [pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]];
      const [a0, a1, b0] = [p(base), p(base + 1), p(base + ROWS + 1)];
      const up = (a1[2] - a0[2]) * (b0[0] - a0[0]) - (a1[0] - a0[0]) * (b0[2] - a0[2]) > 0;
      for (let i = 0; i + 1 < run.length; i++) {
        if (zone.within(run[i].x, run[i].z) || zone.within(run[i + 1].x, run[i + 1].z)) continue;
        for (let j = 0; j < ROWS; j++) {
          const a = base + i * (ROWS + 1) + j;
          const b = a + ROWS + 1;
          if (up) index.push(a, a + 1, b, b, a + 1, b + 1);
          else index.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    if (!index.length) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("bBank", new THREE.Float32BufferAttribute(bank, 2));
    geo.setIndex(index);
    // (Lit nearly as steep as it is, as the grass laid down the bank round
    // it is - course/holebuild.js downBanks - a quarter as level ground, so
    // a face away from the sun isn't black. Lit far more as level, while
    // the grass was lit as flat, a cut bank read as a log by the water.)
    geo.computeVertexNormals();
    const nor = geo.attributes.normal;
    for (let i = 0; i < nor.count; i++) {
      const [x, y, z] = [nor.getX(i) * 0.75, nor.getY(i) * 0.75 + 0.25, nor.getZ(i) * 0.75];
      const l = Math.hypot(x, y, z) || 1;
      nor.setXYZ(i, x / l, y / l, z / l);
    }
    const m = new THREE.Mesh(geo, bankSlopeMaterial(this.hole.pondLevel(w), null, { along: true }));
    m.receiveShadow = true;
    m.name = "brook banks";
    return m;
  }

  // Grass round the ball at rest in the first cut, rough or deep rough (on
  // High: look/lienest.js), taken away when it's hit.
  growNest(ball) {
    dropNest(this.nest);
    this.nest = null;
    if (!HIGH || !ball) return;
    // (The ball at rest: real size, sim/ballsize.mjs.)
    const r = REAL_BALL_R;
    // A third of the way up the ball, from its foot, over the ground drawn.
    const cap = Math.max(0.004, this.surfaceHeight(...ball, true) - this.surfaceHeight(...ball) + (2 * r) / 3);
    const seed = Math.round(ball[0] * 131 + ball[1] * 977) | 0;
    // A links hole's: its long grass much longer, in its own colours (the
    // long grass round it the same: growLongGrass).
    const L = this.hole.layout;
    const brown = L.links && L.links !== "green";
    const heights = L.links ? { ...NEST.height, rough: brown ? LONG_GRASS.kinds[3].h : NEST.height.rough, deep: LONG_GRASS.kinds[brown ? 2 : 4].h } : NEST.height;
    // (Off the cart paths, the hole's own and those between holes: sim/
    // tufts.mjs grassPathRoom.)
    const clumps = nestClumps({ ball, lieAt: (x, z) => this.hole.lieAt(x, z), cap, seed, heights, paths: this.grassPaths(L) });
    if (L.links) for (const c of clumps) c.lie = c.lie === NEST.lies.deep ? (brown ? 4 : 5) : c.lie === NEST.lies.rough && brown ? 3 : c.lie;
    this.nest = makeNest(clumps, (x, z) => {
      const p = toWorld(x, this.surfaceHeight(x, z), z);
      return [p.x, p.y, p.z];
    });
    if (this.nest) this.world.add(this.nest);
    // (Never in a pond's reflection: look/mirrors.js.)
    mirrorsChanged();
  }

  // Long grass round the ball (High and Ultra: look/longgrass.js, sim/
  // longgrass.mjs) over the rough, the deep rough and a links hole's long
  // grass, in the hole's colours as its tufts are. Grown as the shot is
  // set up, it stays through the shot; the next shot's takes its place.
  growLongGrass(ball) {
    dropLongGrass(this.longGrass);
    this.longGrass = null;
    if (!EXTRA || !ball) return;
    const L = this.hole.layout;
    const codes = { rough: L.links && L.links !== "green" ? 3 : 0, deep: L.links === "green" ? 4 : L.links ? 2 : 1 };
    const seed = Math.round(ball[0] * 977 + ball[1] * 131) | 0;
    // Off the cart paths - the hole's own and those between holes - so the
    // path is always on top (the owner: "the car path should definitely be
    // on top of the grass, not below it").
    // (And a row along the mower's line, so it stands right up to it:
    // sim/mowncut.mjs, course/holebuild.js mownEdge.)
    // (And hay, waist-high, where it grows in the deep rough: sim/hay.mjs.)
    const path = makePath(L.path);
    const field = longGrassClumps({ centre: ball, lieAt: (x, z) => this.hole.lieAt(x, z), codes, setting: ULTRA ? "ultra" : "high", nest: this.nest ? NEST.radius : 0, seed, paths: this.grassPaths(L), edge: this.mownEdge, hay: (x, z) => hayAt(L, x, z, path) });
    // (The rough's drawn lift over the ground: every clump's lie is grass.)
    const lift = drawnLift("rough", this.hole.mapped);
    // (Each clump lit by the slope it stands on: sim/holegrass.mjs
    // groundNormal.)
    this.longGrass = makeLongGrass(
      field,
      (x, z) => {
        const p = toWorld(x, this.heightAt(x, z) + lift, z);
        return [p.x, p.y, p.z];
      },
      (x, z) => groundNormal((a, b) => this.heightAt(a, b), x, z),
    );
    if (this.longGrass) this.world.add(this.longGrass);
    mirrorsChanged();
    this.growHoleGrass(ball, codes);
  }

  // Ultra's grass across the hole (sim/holegrass.mjs, look/longgrass.js):
  // every kind of grass in sight, round the ball and round where the shot's
  // likely to land (along the aim, as far as the club carries), grown with
  // the long grass as the shot is set up. On the green, round the ball only.
  // Placed on another core (look/offload.js, the holeGrass task: the hole
  // made again there from its recipe, every clump with its height), the
  // last shot's field kept until it's back - half a second or so - then
  // its meshes made a few thousand clumps a step in the quiet moments
  // (holeGrassSteps)
  // and swapped in, never while a shot's watched. Placing it here held the
  // page about a second a shot (a report: 934 ms frames at address, nearly
  // all of it this) - as it still does where there's no other core.
  growHoleGrass(ball, codes) {
    this.idleWork?.cancel("hole-grass");
    this.holeGrassJob = null;
    if (!ULTRA || !ball) return this.swapHoleGrass(null);
    const p = this.me;
    const centres = [{ x: ball[0], z: ball[1], r: this.onGreen ? 30 : HOLE_GRASS.ball, ball: true }];
    if (!this.onGreen && p) {
      const carry = Math.max(BAG[p.club]?.carry ?? 150, ownCarry(p.name, p.club) ?? 0) * YARD;
      centres.push({ x: ball[0] + Math.cos(p.aim ?? 0) * carry, z: ball[1] + Math.sin(p.aim ?? 0) * carry, r: HOLE_GRASS.landing });
    }
    const seed = Math.round(ball[0] * 613 + ball[1] * 197) | 0;
    // (Off the other holes' fairways, greens and tees, which are drawn in
    // full over this hole's rough: sim/neighbours.mjs ownArea.)
    // (Off the cart paths - the next hole's too, which the cart drives
    // off the green along: nextTeePaths.)
    const paths = this.grassPaths();
    const want = { centres, codes, seed, others: this.hole.layout?.otherGround ?? null, paths: paths.length ? paths : null };
    const site = this.offloadSite();
    if (!site || !this.idleWork || !canOffload()) return this.swapHoleGrass(makeHoleGrass(this.holeGrassHere(want)));
    const probe = holeProbe((x, z) => this.heightAt(x, z), (x, z) => this.hole.lieAt(x, z), this.hole.layout);
    const job = (this.holeGrassJob = offload("holeGrass", { site, probe, ...want }, { quick: true }));
    const hole = this.hole;
    this.idleWork.add({ id: "hole-grass", priority: 2, steps: () => this.holeGrassSteps(job, want, hole), failed: (err) => console.warn("The shot's grass across the hole wasn't made:", err) });
  }

  // The field placed here and now, as it always was: the clumps, each on
  // its own ground's drawn surface (the fairway's lift isn't the rough's).
  holeGrassHere({ centres, codes, seed, others, paths = null }) {
    const clumps = holeGrassClumps({ centres, lieAt: withOtherGround((x, z) => this.hole.lieAt(x, z), others), codes, seed, paths });
    // (Each clump lit by the slope it stands on: groundNormal.)
    return holeGrassField(
      clumps,
      (x, z, lie) => {
        const q = toWorld(x, this.heightAt(x, z) + drawnLift(lie, this.hole.mapped), z);
        return [q.x, q.y, q.z];
      },
      HOLE_CHUNKS.size,
      (x, z) => this.heightAt(x, z),
    );
  }

  // The field on show replaced by `group` - or taken away (null).
  swapHoleGrass(group) {
    dropHoleGrass(this.holeGrass);
    this.holeGrass = group;
    if (group) this.world.add(group);
    mirrorsChanged();
  }

  // The quiet moments' steps for a shot's grass across the hole: wait for
  // the other core's field (job), make its meshes a few thousand clumps a
  // step, swap it
  // in - unless a newer shot wanted its own meanwhile, or the hole moved on
  // - and never while a shot's in the air (nothing changes while it's
  // watched; the next shot's setup wants its own anyway). The core's
  // answer not back in HOLE_GRASS_WAIT, or no core to be had: placed here
  // after all.
  *holeGrassSteps(job, want, hole) {
    const mine = () => this.holeGrassJob === job && this.hole === hole;
    const until = performance.now() + HOLE_GRASS_WAIT;
    // (Run straight through - hurried - it stops waiting and places the
    // field here.)
    while (!job.done && mine() && !hurried() && performance.now() < until) yield WAIT;
    if (!mine()) return;
    const field = result(job) ?? this.holeGrassHere(want);
    const group = new THREE.Group();
    group.userData.holeGrass = true;
    let shown = false;
    try {
      for (const _ of holeGrassSteps(field, group)) {
        yield;
        if (!mine()) return;
      }
      while (this.flying && mine() && !hurried()) yield WAIT;
      if (!mine()) return;
      this.swapHoleGrass(group);
      shown = true;
      // (Sent to the graphics card before the shot, where the camera will
      // follow the ball first.)
      this.sendNewSoon();
    } finally {
      // (Never shown - a newer shot's wanted, the job cancelled: its meshes
      // let go of, not left to the valve's list.)
      if (!shown) dropHoleGrass(group);
    }
  }
}
