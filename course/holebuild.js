// Building a course hole in 3D: the scene built at once or a step at a time (buildHoleSteps), the ground, greens, bunkers, water and trees, keeping and reusing baked parts, and letting a hole's scene go.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import * as THREE from "three";
import { blobRadius, blobOutline, fairwayHalfWidth, deepRoughFrom, makePath, nearest, pointAt, FIRST_CUT, DEEP_ROUGH, insideBlob, isPot, teeBoxes, teeBridges, greenMownReach, SURROUND, FRINGE, shapeReach, FINGERED_POINTS } from "../sim/course.mjs";
import { insideDepth, shapeBounds } from "../sim/holeedits.mjs";
import { fairwayPit, cutOver, cutOverSteps, sinkUnder, levelNormals, levelNormalsSteps, faceLight, trimOut, trimOutSteps, rimAngles, refine, refineSteps, refineNear, refineNearSteps, nearShapes, nearAny } from "../look/dugground.js";
import { forgetFlags, makeBall, makeFlag, toWorld, makeGrassTufts } from "../scenery.js";
import { withOtherGround } from "../sim/holetufts.mjs";
import { bunkerLook, rimTuck, RIM_UNDER } from "../sim/bunkerlook.mjs";
import { runOf } from "../sim/waterflow.mjs";
import { fringeLook } from "../sim/fringe.mjs";
import { penaltyMarks } from "../sim/penalty.mjs";
import { penaltyMarking } from "../look/hazards.js";
import { Marks } from "../look/marks.js";
import { Sprays } from "../look/sprays.js";
import { sandForSteps, waterFor, marshLook, lipMaterial, bankMaterial, bankSlopeMaterial, disposeSurface } from "../look/sandwater.js";
import { makeWall, trimAlongWalls, landStrip } from "../look/walls.js";
import { wallOf, wallLine, wallDistance, wallViews, sunkPond, POND_SINK, SHORE, shoreAt } from "../sim/walls.mjs";
import { greenZone, waterDry } from "../sim/greenfirst.mjs";
import { causeways, causewayOutline, causewayBounds, causewayPast } from "../sim/causeway.mjs";
import { brookBed, waterEdgeScale } from "../sim/brooks.mjs";
import { applyReflections, fitShadows } from "../look/environment.js";
import { grassMaterial, edgeStrip, edgeBand, edgeMesh, withRim, LAYER, GRASS, mowOptions } from "../look/grass.js";
import { fairwayOutline, firstCutBand } from "../sim/firstcut.mjs";
import { holeToWorld } from "../look/glsl/ground.js";
import { MOW_WIDTH } from "../sim/mowing.mjs";
import { makeTrees, forgetTrees, wantTreeKinds } from "../look/trees.js";
import { courseTreeKinds } from "../sim/coursekinds.mjs";
import { useShortGrass, forgetTufts } from "../look/groundbits.js";
import { forgetGrass } from "../look/longgrass.js";
import { frontRow } from "../sim/treelod.mjs";
import { ringMesh, groundPatch, groundRect, makeCup, sheetXZ } from "../greenscene.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { HIGH, EXTRA, LEVEL, PHONE } from "../look/quality.js";
import { PALETTE } from "../look/palette.js";
import { TracerSet } from "../look/tracer.js";
import { runAll, WAIT, hurried } from "../sim/idlework.mjs";
import { tuftChance, tuftClearOfPaths } from "../sim/tufts.mjs";
import { SURFACE_LIFT } from "../look/lifts.js";
import { CupMark } from "../look/cupmark.js";
import { withCountry } from "../look/country.js";
import { result } from "../look/offload.js";
import { loadBake, saveBake, holeFingerprint, bakesOn } from "../look/bake.js";
import { mergeSmallPieces } from "../look/fewerdraws.js";
import { seaLevel } from "../sim/coast.mjs";
import { holeExtras, backdropTrees } from "../sim/country.mjs";
import { treeClearance, treeReach } from "../sim/treeclear.mjs";
import { keptTree, treesKey } from "../sim/treelock.mjs";
import { lockFor, lockPaths } from "../sim/pathlock.mjs";
import { keepClear } from "../view.js";
import { holeSoundscape } from "../audio/cues.mjs";
import { BAKE_WAIT, BALL_R, COUNTRY_WAIT, mowSeed, holeMowing } from "../course.js";

import { treeForms } from "../sim/treehits.mjs";
import { holeHeightField } from "../sim/coursefield.mjs";
import { cropBoxOf, neighbourPaths } from "../sim/holecrop.mjs";
import { ownArea } from "../sim/neighbours.mjs";
import { blendOutside, cropGrid, insideCrop, sheetSteps, worldRect, FINE_NEAR } from "../sim/cropground.mjs";
import { sheetHeight, coversSheet, sheetFinder } from "../sim/sheetheight.mjs";
import { mownFieldSteps, mownLine } from "../sim/mowncut.mjs";
import { cutPicture } from "../look/cutline.js";
import { cutOnlyNearCup } from "../look/cupcut.js";

// A mown edge - a tee's, its surround's, a fringe's, the first cut's round
// the green - fades into what's beneath over this many metres: a clean
// line, wavering only as a mower's does (look/grass.js edge).
// (And the next tee's from the hole before: holescenery.js addNextTee.)
export const MOWN_EDGE = 0.3;
// A box's outline, [[x, z]...], with a point every metre along its sides,
// so a band along it runs square to each side rather than slanting in
// from its corners.
export function lineAlong(corners) {
  const out = [];
  for (let i = 0; i < corners.length; i++) {
    const [x0, z0] = corners[i];
    const [x1, z1] = corners[(i + 1) % corners.length];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0)));
    for (let k = 0; k < n; k++) out.push([x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n]);
  }
  return out;
}

// A part of a build worked out a step at a time: its steps (a generator
// that stops now and then without saying what it's done) named `label`
// each - the answer at its end handed back.
function* named(steps, label) {
  for (let r = steps.next(); ; r = steps.next()) {
    if (r.done) return r.value;
    yield label;
  }
}
// How many corners of a big shape are laid on the ground a step.
const DRAPE_STEP = 40000;
// How many of the far ground's corners round the holes have their height
// read a step (the course's height field, the coast).
const FAR_EVERY = 12000;

// How many outline points a dug bunker's rim is drawn with: its sand's
// spokes (greenscene.js ringMesh, at rimAngles) and the ground round it
// cut back to the very same points (look/dugground.js trimOut), so the
// two meet with no slit - at a long one's tight end, sand drawn to evenly
// spaced spokes and ground cut to its own points missed each other by a
// few centimetres, the sky showing through (Golf Sim Links 13 and 14).
// Finer on High, and along a wall, where it has to meet the wall's foot -
// and finest round a fingered bunker (sim/fingers.mjs), its fingers
// narrow: as many as its outline has (course.mjs FINGERED_POINTS).
export const rimPoints = (b) => (b.fingered ? FINGERED_POINTS : HIGH || wallOf(b) ? 128 : 96);

// A fingered bunker's sand (holebuild's dug bunkers): its outline (hole
// frame) filled flat, split until no side is longer than FINGERED_SAND
// metres, and laid on heightAt (world x, z) + lift.
const FINGERED_SAND = 0.3;
function fingeredSand(outline, heightAt, lift, material) {
  let geo = new THREE.ShapeGeometry(new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(z, x)))).rotateX(-Math.PI / 2);
  geo = refine(geo, FINGERED_SAND);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)) + lift);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

// The courses the page had from its own server (course.js fromOwnServer):
// those whose holes' trees are kept there once grown (keepTreeLock) - not
// an online game's host's course, nor one handed over to play as it is.
const ownCourses = new WeakSet();
export function fromOwnServer(course) {
  if (course && typeof course === "object") ownCourses.add(course);
  return course;
}

export class CourseHoleBuild {
  // The hole's trees kept as they first grew (sim/treelock.mjs), so it's
  // built the same next time whatever the version: sent to the server the
  // first time it's built, or when it's changed since (courseplay.mjs
  // prepareHole's treeLock), with the backdrop behind its green (newBackdrop:
  // grown now, not kept). Only a course from this page's own server, and
  // only the once for each hole made ready.
  keepTreeLock(backdrop, newBackdrop) {
    const kept = this.hole?.treeLock;
    const course = this.course;
    if (!kept || (!kept.make && !newBackdrop) || this.challenge || !course?.id || !ownCourses.has(course)) return;
    // (Which hole it is: the course's whose line it is.)
    const path = this.hole.recipe?.stored?.path;
    const index = path ? course.holes.findIndex((h) => h?.layout?.path === path) : -1;
    if (index < 0) return;
    const lock = kept.make ? kept.make() : { ...kept.lock };
    if (newBackdrop || !Array.isArray(lock.backdrop)) lock.backdrop = backdrop.map((t) => keptTree(t));
    // (For the made trees its course file has: treelock.mjs lockFor.)
    lock.r = treesKey(course.holes[index].layout.trees ?? []);
    kept.make = null;
    kept.lock = lock;
    fetch(`/api/courses/${encodeURIComponent(course.id)}/trees/${index}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lock) }).catch(() => {});
  }

  // The course's cart paths kept as first worked out (sim/pathlock.mjs), so
  // it's played with the same paths whatever the version: worked out and
  // sent to the server the first time it's played, or when it's changed
  // since. Only a course from this page's own server.
  keepPathLock(course = this.course) {
    if (!course?.id || (course.holes?.length ?? 0) < 2 || this.challenge || !ownCourses.has(course) || lockFor(course)) return;
    let lock;
    try {
      lock = lockPaths(course);
    } catch {
      return;
    }
    course.pathLock = lock;
    fetch(`/api/courses/${encodeURIComponent(course.id)}/paths`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lock) }).catch(() => {});
  }

  // The hole drawn: built at once (the usual way), or - the next hole,
  // ahead of time - a step at a time in the picture's quiet moments
  // (prebuildNext).
  buildHoleScene() {
    runAll(this.buildHoleSteps());
  }

  // The last hole's picture gone: its shapes, materials and pictures let go
  // of (`of`: the state they're in - this mode's own, or a hole built
  // ahead and never shown).
  disposeWorld(of = this) {
    const world = of.world;
    forgetFlags(world);
    // The last hole's slope shading had a material of its own.
    of.shade?.material.dispose();
    // The last hole's tracers go with it.
    if (of === this) this.tracers?.clear();
    world.traverse((o) => {
      // (Nor kept on any list for the safety valve or near and far: the
      // trees, the tufts, the grass.)
      forgetTrees(o);
      forgetTufts(o);
      forgetGrass(o);
      // (A batch of trees holds its instances' matrices and colours too.)
      // (And an instanced mesh, its instances' matrices and colours.)
      if (o.isBatchedMesh) o.dispose();
      else {
        if (!o.userData.keepGeometry) o.geometry?.dispose();
        if (o.isInstancedMesh) o.dispose();
      }
      // Sand and water, with their fields, and the signs' painted faces
      // (look/sandwater.js).
      for (const m of [].concat(o.material ?? [])) disposeSurface(m);
    });
    world.clear();
    // The last mapped hole's ground textures.
    for (const t of of.splat ?? []) t.dispose();
    // The last hole's country (look/country.js), laid over the ground
    // materials made below (addCountry).
    of.countryPicture?.texture.dispose();
    // And its mower's line (look/cutline.js).
    of.cutField?.texture.dispose();
    of.cutField = null;
    of.mownEdge = null;
  }

  // Something the hole's building does to the scene as a whole (the
  // horizon, the shadows' reach, the tufts' and ground's country): done
  // now, or - for a hole built ahead - when it's shown. Kept with the hole
  // (sceneSteps), so a kept hole shown again does them again
  // (course/flyover.js restoreKept).
  sceneStep(fn) {
    this.sceneSteps?.push(fn);
    if (this.prebuild) this.prebuild.after.push(fn);
    else fn();
  }

  // What's kept of the hole from the last time it was built, on this
  // graphics setting, by this version of the game (look/bake.js): the
  // shapes of its ground cut round its bunkers and ponds, and what the
  // other cores worked out for it - taken as they were rather than worked
  // out again. Only for a hole built a step at a time (wait): built
  // straight through, there's no waiting for the file. A hole with no
  // recipe (sim/holesite.mjs) can't be fingerprinted, and isn't kept.
  *openBake(L, wait) {
    this.bake = null;
    if (!wait || !bakesOn()) return;
    const site = this.bakeSite(L);
    const id = holeFingerprint(site, { level: LEVEL });
    if (!id) return;
    let bake = null;
    let done = false;
    loadBake(LEVEL, id)
      .then((b) => (bake = b))
      .catch(() => {})
      .finally(() => (done = true));
    const until = performance.now() + BAKE_WAIT;
    while (!done && !hurried() && performance.now() < until) yield WAIT;
    // (A course's first hole is kept for good: server/bakes.mjs.)
    if (bake) bake.first = site.index === 0;
    this.bake = bake;
    yield "what's kept of the hole";
  }

  // What was worked out afresh, kept for next time (in the background).
  // Returns what's kept of the build, for the report: { hits, misses, ms }.
  closeBake() {
    const bake = this.bake;
    this.bake = null;
    if (!bake) return null;
    if (bake.changed) saveBake(bake);
    return bake.summary();
  }

  // wait: built a step at a time in the quiet moments (sim/idlework.mjs),
  // so able to wait for what's worked out on another core - never when run
  // straight through (runAll).
  *buildHoleSteps(wait = false) {
    // (Ahead of time the world is new and empty, and the hole on show
    // keeps its own until it goes.)
    if (!this.prebuild) this.disposeWorld();
    this.waterLevels = [];
    this.splat = null;
    this.countryPicture = null;
    this.countryMats = [];
    this.sceneSteps = [];
    yield "clearing the last hole";
    // The kinds of tree the course grows on the shelves of shapes now,
    // while it loads (look/trees.js wantTreeKinds: only those in use take
    // memory) - once a course, not as each hole meets one.
    if (!this.challenge && this.course?.holes?.length && this.kindsWanted !== this.course) {
      this.kindsWanted = this.course;
      if (wantTreeKinds(courseTreeKinds(this.course))) yield "the course's kinds of tree made ready";
    }
    const L = this.hole.layout;
    // By the sea (sim/coast.mjs): the coast round this hole.
    this.shore = this.shoreOf(L);
    // What's kept of it from the last time it was built (openBake).
    yield* this.openBake(L, wait);
    // (Built a step at a time, the ground sheets' heights are read on
    // another core from here on: startSheets.)
    const sheetsJob = wait ? this.startSheets(L) : null;
    const path = makePath(L.path);
    const cup = { x: L.pin[1], z: -L.pin[0], r: this.hole.cup.r }; // world
    const flat = (pts) => new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(z, x))); // hole -> shape (x=wx, y=-wz)
    // On rolling ground (sim/rolls.mjs), a flat shape is split finely
    // enough first to follow it, not just at its outline.
    const rollingGround = !!this.hole.green?.rolls;
    // (The same a part at a time, `name` its steps': a deep rough or
    // first cut band.)
    const redrapeSteps = function* (geo, heightAt, most, name) {
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) - heightAt(pos.getX(i), pos.getZ(i)));
      const fine = yield* named(refineSteps(geo, most), `${name}, split finer`);
      yield `${name}, split finer`;
      const fp = fine.attributes.position;
      for (let i = 0; i < fp.count; i++) fp.setY(i, fp.getY(i) + heightAt(fp.getX(i), fp.getZ(i)));
      yield `${name}, laid over the ground`;
      // (Lit a part at a time: four heights a corner.)
      if (fine.attributes.normal) yield* named(levelNormalsSteps(fine, heightAt), `${name}, lit as the ground`);
      return fine;
    };
    const redrape = (geo, heightAt, most) => {
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) - heightAt(pos.getX(i), pos.getZ(i)));
      const fine = refine(geo, most);
      const fp = fine.attributes.position;
      for (let i = 0; i < fp.count; i++) fp.setY(i, fp.getY(i) + heightAt(fp.getX(i), fp.getZ(i)));
      if (fine.attributes.normal) levelNormals(fine, heightAt);
      return fine;
    };
    // (step: split this finely whatever the ground, for a shape reaching
    // out over ground that isn't level, as a tee's surround does.)
    // (The same a part at a time, `name` its steps': the fairway - split
    // finer, then laid on the ground DRAPE_STEP corners at a time.)
    const laySteps = function* (geo, y, name) {
      geo.rotateX(-Math.PI / 2);
      if (rollingGround) geo = yield* named(refineSteps(geo, L.links ? 1.5 : 3), `${name}, split finer`);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        pos.setY(i, this.drapeHeight(pos.getX(i), pos.getZ(i)) + y);
        if (i % DRAPE_STEP === DRAPE_STEP - 1) yield `${name}, laid on the ground`;
      }
      geo.computeVertexNormals();
      return geo;
    }.bind(this);
    const lay = (geo, y, step = null) => {
      geo.rotateX(-Math.PI / 2);
      if (rollingGround || step) geo = refine(geo, step ?? (L.links ? 1.5 : 3));
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setY(i, this.drapeHeight(pos.getX(i), pos.getZ(i)) + y);
      geo.computeVertexNormals();
      return geo;
    };
    const mesh = (geo, mat) => {
      const m = new THREE.Mesh(geo, mat);
      m.receiveShadow = true;
      this.world.add(m);
      return m;
    };
    // A soft edge, drawn before anything else see-through (grass.js edgeMesh).
    const edge = (geo, mat, layer) => this.world.add(edgeMesh(geo, mat, layer));

    // Bunkers dug by hand, or with a wall along part of their edge
    // (sim/walls.mjs), and ponds, which on a designed hole lie below the
    // grass (sunkPond: all but a brook or a links burn): flat shapes laid
    // over the ground leave them open (see pitCut, and the fairway below).
    const dug = L.bunkers.filter((b) => b.dig || wallOf(b));
    const lowPonds = this.hole.mapped ? [] : L.water.filter((w) => sunkPond(w));
    // Brooks (sim/brooks.mjs): what's laid flat over the ground runs on down
    // a brook's open banks to its water - split finely near them and laid
    // on the ground as dug, lit as it slopes - so the fairway is mown down
    // to the water as a burn's is (and plays as it's drawn), and the
    // banks' bare earth is drawn over it (drawBrook). Along a walled brook
    // it stops at the banks instead, split finely first so nothing reaches
    // across the channel, and the ground (a sheet of its own) shows them.
    const brooks = this.hole.mapped ? [] : L.water.filter((w) => w.brook);
    const beds = brooks.map((w) => brookBed(w));
    const nearBed = nearShapes(beds, 1);
    const walledBeds = beds.filter((_, k) => brooks[k].walls?.length);
    const openBeds = beds.filter((_, k) => !brooks[k].walls?.length);
    const nearWalled = nearShapes(walledBeds, 1);
    const nearOpen = nearShapes(openBeds, 0.5);
    // (Only down into what's dug: the ground raised round a pot or a
    // revetted bunker beside the brook stays under it, as it does
    // everywhere else - laid over that too, the grass folded up its face.)
    const downTo = (x, z) => {
      const d = this.drapeHeight(x, z);
      return d + Math.min(0, this.worldHeight(x, z) - d);
    };
    // (Split this finely within BANK_REACH of the water, where a cut bank
    // curves most and its earth lies - out to half a metre: across that
    // curve, a band split 0.6 m apart lay up to 0.3 m over it, the bank's
    // earth cut into teeth, sim/brooks.mjs - look/sandwater.js BANK_PULL.
    // The rest of the bank 0.6 m apart: split as finely all the way out,
    // a burn hole was a tenth more triangles, and slower to build.)
    const BANK_STEP = HIGH ? 0.3 : 0.45;
    const BANK_REACH = 0.6;
    const nearOpenWater = nearShapes(brooks.filter((w) => !w.walls?.length), BANK_REACH);
    // (Stopping now and then: two readings of the ground a corner, and a
    // long burn's banks are thousands of them.)
    const LAY_EVERY = 3000;
    const layDownSteps = function* (g, lift) {
      const pos = g.attributes.position;
      const nor = g.attributes.normal;
      const laid = new Uint8Array(pos.count);
      let n = 0;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        if (!nearOpen(x, z)) continue;
        if (++n % LAY_EVERY === 0) yield;
        pos.setY(i, downTo(x, z) + lift);
        laid[i] = 1;
      }
      pos.needsUpdate = true;
      // Lit as it's laid: each corner laid down a bank by the faces round
      // it (four more readings of the ground a corner, as the rest of the
      // band is lit, were most of the time).
      if (nor && n) yield* faceLight(g, laid);
      return g;
    };
    const layDown = (g, lift) => {
      const steps = layDownSteps(g, lift);
      for (let r = steps.next(); ; r = steps.next()) if (r.done) return r.value;
    };
    const offWalled = (geo, heightAt, lift) => (walledBeds.length ? trimOut(refineNear(geo, 0.6, nearWalled, heightAt), walledBeds, heightAt, lift, 0.02) : geo);
    const offBeds = (geo, heightAt, lift) => {
      geo = offWalled(geo, heightAt, lift);
      return openBeds.length ? layDown(refineNear(refineNear(geo, 0.6, nearOpen, heightAt), BANK_STEP, nearOpenWater, heightAt), lift) : geo;
    };
    // The same a part at a time (a long burn's banks split that finely
    // are a few thousand triangles of a band) - `name` the step's.
    const offBedsSteps = function* (geo, heightAt, lift, name) {
      geo = offWalled(geo, heightAt, lift);
      if (!openBeds.length) return geo;
      let g = yield* named(refineNearSteps(geo, 0.6, nearOpen, heightAt, RIM_EVERY), `${name}: split finer down the brook's banks`);
      g = yield* named(refineNearSteps(g, BANK_STEP, nearOpenWater, heightAt, RIM_EVERY), `${name}: split finer by the brook's water`);
      return yield* named(layDownSteps(g, lift), `${name}: laid down the brook's banks`);
    };
    const inPit = (wx, wz) => dug.some((b) => insideBlob(b, -wz, wx, 0.3)) || lowPonds.some((w) => insideBlob(w, -wz, wx, 0.02)) || beds.some((b) => insideBlob(b, -wz, wx, 0.02));
    // (Round a lowered pond, trimmed along its edge itself: whole triangles
    // taken out left a staircase of lighter and darker grass by its wall.
    // It stops POND_CLEAR short of the edge, behind a wall's coping - any
    // closer and the grass showed through the coping's face as a green
    // line - and the ring of grass round the pond fills the gap.)
    const POND_CLEAR = 0.35;
    // (Round a dug bunker, the shapes laid over the ground stop this far
    // out from its edge, under the collar - not a whisker inside it, where
    // beside a wall the ground has already dropped to its foot.)
    const PIT_CLEAR = 0.05;
    // What's trimmed to a dug bunker's edge is split finer round it first,
    // to RIM_STEP metres (look/dugground.js refineNear): over it and just
    // past its rim - so nothing is left with a long side reaching across it,
    // nor cutting across the curve of its edge.
    const RIM_STEP = 0.4;
    // (A part at a time while the next hole is built ahead: so many
    // triangles looked at, or an eighth as many new corners laid, a step -
    // each patch round a green's bunkers was a step of 0.1 - 0.25 s.)
    const RIM_EVERY = 12000;
    // (Through a grid of them: sim/shapegrid.mjs.) And round a flashed
    // one, out as far as the grass behind its lip eases back down
    // (sim/hazardshapes.mjs flashLift's back): the shapes laid over the
    // ground follow it up there (drapeHeight), split finely enough to stay
    // over the rough on its slope.
    const flashed = dug.filter((b) => b.flash?.back > 0);
    const FLASH_REACH = Math.max(0, ...flashed.map((b) => b.flash.back)) + 0.3;
    const nearRim = flashed.length ? nearAny([nearShapes(dug, 0.6), nearShapes(flashed, FLASH_REACH)]) : nearShapes(dug, 0.6);
    const toRim = (geo, heightAt, lift, grow) => trimOut(refineNear(geo, RIM_STEP, nearRim, heightAt), dug, heightAt, lift, grow, null, rimPoints);
    // The same a part at a time - split finer, then trimmed - `name` the
    // steps'. (Trimmed in one go, the fairway's was a step of 0.3 s.)
    const toRimSteps = function* (geo, heightAt, lift, grow, name) {
      const fine = yield* named(refineNearSteps(geo, RIM_STEP, nearRim, heightAt, RIM_EVERY), `${name} split finer round the bunkers`);
      return yield* named(trimOutSteps(fine, dug, heightAt, lift, grow, null, rimPoints), `${name} round the bunkers`);
    };
    // Which of the hole's heights a shape's laid on, by name, for what's
    // kept of it: null for any other (not kept).
    const heightsName = (h) => (h === this.drapeHeight ? "drape" : h === this.worldHeight ? "world" : null);
    // A band of grass laid over the ground and cut round dug bunkers and
    // ponds (cutPits) - or the very band kept from the last time (look/
    // bake.js), by the band it was cut from.
    const pitCut = (geo, heightAt, lift) => {
      const h = heightsName(heightAt);
      return this.bake && h ? this.bake.geometry("pitCut", { geo, h, lift }, () => cutPits(geo, heightAt, lift)) : cutPits(geo, heightAt, lift);
    };
    // The same a part at a time, for the big bands (the deep rough, the
    // first cut): laid over the ground, then cut - `name` the step's.
    // (What's kept is still by the band as it was handed in: it's laid
    // over the ground as a copy.)
    const pitCutSteps = function* (geo, heightAt, lift, name) {
      const h = heightsName(heightAt);
      const kept = this.bake && h ? { geo, h, lift } : null;
      if (kept && this.bake.has("pitCut", kept)) return this.bake.geometry("pitCut", kept, () => null);
      let cut = geo;
      if (rollingGround) {
        cut = yield* redrapeSteps(geo.clone(), heightAt, L.links ? 1.5 : 2.5, name);
        yield `${name}, lit as the ground`;
      }
      if (dug.length) cut = yield* toRimSteps(cut, heightAt, lift, PIT_CLEAR, `${name},`);
      cut = yield* named(trimOutSteps(cut, lowPonds, heightAt, lift, POND_CLEAR), `${name}, round the ponds`);
      cut = yield* offBedsSteps(cut, heightAt, lift, name);
      if (kept) this.bake.geometry("pitCut", kept, () => cut);
      return cut;
    }.bind(this);
    const cutPits = (geo, heightAt, lift) => {
      // On rolling ground a band draped only every few metres dips under
      // the finer ground between its points, a sawtooth along its edge
      // (the owner: "far too blocky"): split finer and laid again, each
      // point as far over the ground as it was.
      if (rollingGround) geo = redrape(geo, heightAt, L.links ? 1.5 : 2.5);
      // Nor across a dug bunker, as the fairway is cut (a pot at the
      // fairway's edge had the first cut lying flat across it): trimmed
      // along its edge, just outside it under the collar. (Cut into whole
      // triangles, it left a ring of saw teeth round a pot, the rough
      // showing through them.)
      if (dug.length) geo = toRim(geo, heightAt, lift, PIT_CLEAR);
      return offBeds(trimOut(geo, lowPonds, heightAt, lift, POND_CLEAR), heightAt, lift);
    };
    // Nothing drawn on a grid (`cell` metres) may lie across a wall: a
    // triangle from the grass to the sand at its foot would be a ramp in
    // front of it. Those are trimmed back to the wall's line, and a strip
    // of the same grass along the wall's top meets it exactly
    // (look/walls.js); round a lowered pond, nothing reaches in over its
    // bank, which has a ring of grass round it.
    // (`lift`: how far above the ground it was laid, for what's trimmed
    // back to a pond's edge. `ponds` false: not - the green's fringe, which
    // water gives way to, sim/greenfirst.mjs.)
    const clearOfWalls = (geo, cell, lift, ponds = true) => {
      const reach = cell * 0.75 + 0.05;
      geo = trimAlongWalls(geo, dug, reach, (b) => (x, z) => insideDepth(b, x, z) > 0, this.worldHeight, lift);
      return ponds ? trimOut(geo, lowPonds, this.worldHeight, lift, POND_CLEAR) : geo;
    };
    // Do two shapes' boxes overlap?
    const overlaps = (a, b) => {
      const ra = shapeReach(a);
      const rb = shapeReach(b);
      return Math.abs(a.x - b.x) < ra + rb && Math.abs(a.z - b.z) < ra + rb;
    };
    // Where a bunker's sand is drawn onto the green (joined to it), its wall
    // stands at the green's edge.
    const faceIn = (p) => Math.max(0, insideDepth(L.green, p[0], p[1]));
    yield "the ground's shape";
    if (this.hole.mapped) yield* this.buildMappedGround(L, cup);
    else {
      // The sheets laid on a grid (groundSheets), their heights and light
      // read already on another core if they were sent there (or read
      // here as they're laid, if not, or not back in time).
      let readings = null;
      if (sheetsJob) {
        const until = performance.now() + COUNTRY_WAIT;
        while (!sheetsJob.job.done && !hurried() && performance.now() < until) yield WAIT;
        readings = result(sheetsJob.job);
      }
      const sheets = new Map(this.groundSheets(L).map((q) => [q.key, q]));
      const sheetAt = (key, lift) => {
        const q = sheets.get(key);
        const heights = readings?.[key]?.heights ?? null;
        return q.size != null ? groundPatch(q.size, q.step, this.worldHeight, lift, rough, q.cx, q.cz, heights) : groundRect(q.w, q.d, q.step, this.worldHeight, lift, rough, q.cx, q.cz, heights);
      };
      const presetOf = (key) => (readings?.[key]?.normals ? { ...sheetsJob.xz.get(key), normals: readings[key].normals } : null);
      // Ground: a fine patch that follows the green's slopes, and a big sheet
      // (sunk where something's been dug, with a fine patch over each).
      // (A brown links hole's rough is the dunes' khaki.)
      const roughLook = L.links && L.links !== "green" ? GRASS.duneRough : L.links ? { ...GRASS.rough, dune: 0.6 } : GRASS.rough;
      const rough = grassMaterial({ ...roughLook, hole: cup });
      // The country past the trees and the shade under them over it
      // (addCountry).
      this.countryMats.push(withCountry(rough));
      const gWorld = toWorld(L.green.x, 0, L.green.z);
      // How the hole is mown (look/glsl/ground.js mowingFor).
      const mowing = holeMowing(L);
      // The fairway mown in the hole's own pattern. (A links hole's firm
      // and dry: browner on a brown one, and patchier either way, worn
      // thin in places.) Ultra's short grass across it in its stripes'
      // shades (look/groundbits.js).
      const linksLook = L.links === "dunes" ? { light: PALETTE.linksFairway[0], dark: PALETTE.linksFairway[1], patch: 0.36, patchScale: 0.05 } : L.links ? { patch: 0.3, patchScale: 0.05 } : {};
      const fairGrass = { ...GRASS.fairway, stripeWidth: MOW_WIDTH.fairway, hole: cup, ...mowOptions(mowing.fairway), ...linksLook };
      this.sceneStep(() => useShortGrass(fairGrass));
      const cell = HIGH ? 0.5 : 1;
      // Not under a dug bunker's sand: a grid this coarse cuts corners
      // across a steep face and would poke up through the sand. Only what's
      // wholly inside goes - one reaching out over the rim stays, or the
      // sky showed through the gap left round the edge - and it's lit as
      // the grass was before the dig.
      // What does reach in over the rim has its corners inside brought out
      // to the rim and laid on the grass there (dugground.js trimOut) - a
      // few centimetres inside it, under the sand's edge, which is tucked
      // just under the collar (sim/bunkerlook.mjs rimTuck) - so the ground
      // meets the sand with no slit between. (Dropped well down under the
      // sand instead, as they were, the triangle sagged below the rim, and
      // there's nothing under a dug bowl's sand: seen through the collar's
      // soft outer edge from a low camera, the sea's reflection of the sky
      // far below showed through as a white line round a pot's rim.)
      const underSand = (m, lift, step = cell, preset = null) => {
        if (!dug.length && !lowPonds.length) return m;
        if (dug.length) m.geometry = toRim(m.geometry, this.worldHeight, lift, -RIM_UNDER);
        m.geometry = clearOfWalls(m.geometry, step, lift);
        levelNormals(m.geometry, this.drapeHeight, preset);
        return m;
      };
      // (What the patch round the green covers, left out of the others:
      // below.)
      const aroundGreen = (wx, wz) => Math.abs(wx - gWorld.x) < 49 && Math.abs(wz - gWorld.z) < 49;
      const beyondGreen = (m) => {
        m.geometry = cutOver(m.geometry, aroundGreen, "all");
        return m;
      };
      // A piece of the ground laid on a grid (groundSheets): its sheet laid
      // on the ground, cut round what's dug (underSand) and - all but the
      // green's own - left out where the green's patch lies (beyondGreen).
      // Or, built before, the very piece kept then (look/bake.js): it's
      // worked out from nothing but the hole and the sheet (its heights
      // and light read from them on another core), so the sheet's all it's
      // kept by - and only one laid from those readings is kept.
      // (A part a step: the sheet, then cut round what's dug, then along
      // the walls - `name` the step's. On a links hole of walled pots the
      // whole piece was most of a second of the page.)
      const groundPiece = function* (key, name) {
        const q = sheets.get(key);
        if (this.bake?.has("ground", { q })) {
          const m = new THREE.Mesh(this.bake.geometry("ground", { q }, () => null), rough);
          m.receiveShadow = true;
          return m;
        }
        const m = sheetAt(key, q.lift);
        // (None along a brook, whose own sheet shows its banks: a coarser
        // one's straight sides stood over the curve of a shelving bank, in
        // khaki patches through the grass laid down it.)
        if (beds.length) m.geometry = cutOver(m.geometry, nearBed, "all");
        yield `${name}: its sheet`;
        if (dug.length || lowPonds.length) {
          if (dug.length) {
            // (toRim, a part a step - and the splitting itself a part a step.)
            m.geometry = yield* named(refineNearSteps(m.geometry, RIM_STEP, nearRim, this.worldHeight, RIM_EVERY), `${name}: split finer round the bunkers`);
            yield `${name}: split finer round the bunkers`;
            m.geometry = yield* named(trimOutSteps(m.geometry, dug, this.worldHeight, q.lift, -RIM_UNDER, null, rimPoints), `${name}: round the bunkers`);
            yield `${name}: round the bunkers`;
          }
          m.geometry = clearOfWalls(m.geometry, q.under, q.lift);
          yield `${name}: along the walls`;
          // (Lit a part at a time: those split finer round the bunkers
          // aren't among what the other core read.)
          yield* named(levelNormalsSteps(m.geometry, this.drapeHeight, presetOf(key)), `${name}: lit as the ground`);
          yield `${name}: lit as the ground`;
        }
        if (q.beyond) beyondGreen(m);
        if (this.bake) this.bake.geometry("ground", { q }, () => m.geometry, { keep: () => !!readings });
        return m;
      }.bind(this);
      this.world.add(yield* groundPiece("green", "the ground round the green"));
      // The patches round a dug or walled bunker and a lowered pond leave
      // out what the patch round the green (just drawn) already covers -
      // they're often beside the green, and drawing that ground twice cost
      // frames for nothing - and on the lower graphics setting are laid a
      // metre and a half apart, as coarse as that setting draws elsewhere.
      yield "the ground round the green";
      yield "the ground round the green";
      const coarse = HIGH ? cell : 1.5;
      const mid = toWorld(L.length / 2, 0, L.path[Math.floor(L.path.length / 2)][1]);
      // The far sheet, out into the country (addCountry paints it) - by
      // the sea running down through low dunes and a beach under the
      // water (sim/coast.mjs shoreHeight), on a finer grid for them.
      this.farSheet = { x: mid.x, z: mid.z, size: 2400 };
      // On the hole, the sheet stays under its own ground (-sunk). Past
      // that it eases onto the course height field (sim/cropground.mjs),
      // finer over the crop and coarse out to the haze.
      const index = this.round?.index ?? Math.max(0, (L.number ?? 1) - 1);
      const field = !this.challenge && this.course?.holes?.length ? holeHeightField(this.course, index) : null;
      const own = field ? ownArea(L) : null;
      const sunkAt = (x, z) => -this.hole.sunk(x, z);
      const holeFar = (x, z) => (field ? blendOutside(own(x, z), sunkAt(x, z), field(x, z)) : sunkAt(x, z));
      const far = this.shored((wx, wz) => holeFar(-wz, wx), 0);
      // The hole's own rolling ground (sim/rolls.mjs: a links hole's
      // dunes), drawn as finely as it's played over all of it, the far
      // sheet left out under it: its 20 m grid can't follow a dune.
      const rolls = this.hole.green?.rolls;
      const rb = rolls?.bounds;
      const inRolls = rb ? (wx, wz) => wx > rb.z0 + 2 && wx < rb.z1 - 2 && -wz > rb.x0 + 2 && -wz < rb.x1 - 2 : () => false;
      // What stands out there (other holes' trees, the woods, a
      // neighbour's fairway laid over it) stands on the ground as it's
      // drawn (sim/sheetheight.mjs): the far sheet's triangles - a coarse
      // one's cut under a rise's curve, and a tree on the curve stood clear
      // of it, by 0.47 m on Golf Sim Links' 17th - and over them, where
      // one's laid, the hole's own fine patches: round the green, the
      // rolling ground, a dug bunker, a walled pond, a brook's banks. The
      // sheet's sunk under those (a metre, round the 13th's pond, where
      // the 14th's trees stood that far down in the grass).
      const farSheets = [];
      const patchKeys = ["green", ...(rb ? ["rolls"] : []), ...[...dug.keys()].map((k) => `dug${k}`), ...[...lowPonds.keys()].map((k) => `pond${k}`), ...[...brooks.keys()].map((k) => `brook${k}`)];
      const patches = patchKeys
        .filter((key) => sheets.has(key))
        .map((key) => {
          const q = sheets.get(key);
          const k = key.startsWith("brook") ? Number(key.slice(5)) : -1;
          // (A brook's is laid only along its bed and banks.)
          const covers = k >= 0 ? (wx, wz) => coversSheet(q, wx, wz) && insideBlob(beds[k], -wz, wx, 1.5) : (wx, wz) => coversSheet(q, wx, wz);
          return { covers, height: sheetHeight(q, this.worldHeight, q.lift ?? -0.035) };
        });
      let findFar = null;
      const farAt = (spec) => {
        farSheets.push({ spec, height: sheetHeight(spec, far, -0.07) });
        findFar = null;
      };
      this.farGround = (wx, wz) => {
        let top = -Infinity;
        for (const p of patches) if (p.covers(wx, wz)) top = Math.max(top, p.height(wx, wz));
        if (!inRolls(wx, wz)) {
          findFar ??= sheetFinder(farSheets);
          const sheet = findFar(wx, wz);
          top = Math.max(top, sheet ? sheet.height(wx, wz) : far(wx, wz) - 0.07);
        }
        return top > -Infinity ? top : far(wx, wz) - 0.07 + (rolls ? rolls.height(-wz, wx) : 0);
      };
      if (this.shore) this.shore.level = seaLevel(0) - 0.07;
      const layFar = (mesh) => {
        if (rb) mesh.geometry = cutOver(mesh.geometry, inRolls, "all");
        this.world.add(mesh);
      };
      const crop = field ? cropBoxOf(this.course, index, { preset: LEVEL }) : null;
      if (crop?.box) {
        const steps = sheetSteps(LEVEL, !!this.shore);
        const outer = groundPatch(2400, steps.outer, far, -0.07, rough, mid.x, mid.z);
        outer.geometry = cutOver(outer.geometry, (wx, wz) => insideCrop(wx, wz, crop.box, steps.outer), "all");
        layFar(outer);
        yield "the far ground out to the haze";
        // Fine along this hole and the ones around it, coarse over the
        // rest of the crop's square, each step one mesh.
        const lines = [L.path, ...neighbourPaths(this.course, index)];
        const cells = this.shore || steps.crop >= 16 ? [{ ...crop.box, step: steps.crop }] : cropGrid(crop.box, lines, { coarse: 16, fine: steps.crop, near: FINE_NEAR });
        // (Where things stand: the crop's cells, the finest first, then the
        // sheet out to the haze.)
        for (const cell of [...cells].sort((a, b) => a.step - b.step)) farAt(worldRect(cell, cell.step));
        farAt({ size: 2400, step: steps.outer, cx: mid.x, cz: mid.z });
        // (Their heights read FAR_EVERY corners a step - each the course's
        // height field and the coast - and laid as they always were.)
        const layCells = function* (name, list, label) {
          if (!list.length) return;
          const inputs = { cells: list.map((c) => [Math.round(c.x0), Math.round(c.z0), Math.round(c.x1), Math.round(c.z1), c.step]) };
          let geo;
          if (this.bake?.has(name, inputs)) geo = this.bake.geometry(name, inputs, () => null);
          else {
            const geos = [];
            for (const cell of list) {
              const rect = worldRect(cell, cell.step);
              const { xs, zs } = sheetXZ(rect);
              // (Kept as they were worked out: a height rounded twice could be a
              // hair off the one laid in one go.)
              const heights = new Float64Array(xs.length);
              for (let i = 0; i < xs.length; i++) {
                heights[i] = far(xs[i], zs[i]);
                if (i % FAR_EVERY === FAR_EVERY - 1) yield label;
              }
              const mesh = groundRect(rect.w, rect.d, rect.step, far, -0.07, rough, rect.cx, rect.cz, heights);
              if (rb) mesh.geometry = cutOver(mesh.geometry, inRolls, "all");
              geos.push(mesh.geometry);
            }
            const made = geos.length === 1 ? geos[0] : mergeGeometries(geos);
            geo = this.bake ? this.bake.geometry(name, inputs, () => made) : made;
          }
          const mesh = new THREE.Mesh(geo, rough);
          mesh.receiveShadow = true;
          this.world.add(mesh);
        }.bind(this);
        yield* layCells("crop-coarse", cells.filter((c) => c.step >= 16), "the far ground round the holes");
        yield "the far ground round the holes";
        yield* layCells("crop-fine", cells.filter((c) => c.step < 16), "the far ground");
      } else {
        farAt({ size: 2400, step: this.shore ? 10 : 20, cx: mid.x, cz: mid.z });
        layFar(groundPatch(2400, this.shore ? 10 : 20, far, -0.07, rough, mid.x, mid.z));
      }
      // (Each big piece of ground a step of its own.)
      yield "the far ground";
      if (rb) this.world.add(yield* groundPiece("rolls", "the rolling ground"));
      yield "the rolling ground";
      for (const k of dug.keys()) {
        yield "a dug bunker's ground";
        this.world.add(yield* groundPiece(`dug${k}`, "a dug bunker's ground"));
      }
      // Round a pond lowered below the grass: the same, a metre apart (the
      // ground round it is flat) - a metre and a half on the lower setting.
      const pondStep = HIGH ? 1 : 1.5;
      for (const k of lowPonds.keys()) {
        yield "a pond's ground";
        this.world.add(yield* groundPiece(`pond${k}`, "a pond's ground"));
      }
      // Along a brook, its banks: the ground finely, out a little past them
      // (as far as what's laid over the ground was cut back), the rest
      // left to the sheets round it.
      // Split as finely as what's laid down its banks by its water
      // (BANK_STEP), and lit as they slope, by its own faces: lit as the
      // ground was before the digging - as round a dug bunker, where the
      // grass round its rim would shade dark - a bank's face was lit as
      // flat grass, and nothing showed the brook lay in a channel.
      // Nor any under a band of grass laid over it (the fairway, the first
      // cut, the deep rough) or well under the water: across the curve of
      // a cut bank both are straight-sided, and the sheet came up through
      // the band in khaki teeth and patches. (Kept for 0.75 m in from a
      // band's edge, under its soft edge, and along the water's.)
      const BANDED = new Set(["fairway", "semi", "deep", "water"]);
      const AROUND = [[0.75, 0], [-0.75, 0], [0, 0.75], [0, -0.75]];
      const underBand = (x, z) => {
        const lie = this.hole.lieAt(x, z);
        return BANDED.has(lie) && AROUND.every(([dx, dz]) => this.hole.lieAt(x + dx, z + dz) === lie);
      };
      for (const k of brooks.keys()) {
        yield "a brook's ground";
        const m = sheetAt(`brook${k}`, -0.035);
        m.geometry = cutOver(m.geometry, (wx, wz) => !insideBlob(beds[k], -wz, wx, 1.5) || underBand(-wz, wx), "all");
        underSand(m, -0.035, HIGH ? 0.5 : 0.75, presetOf(`brook${k}`));
        m.geometry = yield* named(refineNearSteps(m.geometry, BANK_STEP, nearShapes([brooks[k]], BANK_REACH), this.worldHeight, RIM_EVERY), "a brook's ground: its banks split finer");
        m.geometry.computeVertexNormals();
        m.name = "brook ground";
        yield "a brook's ground: its banks lit";
        // (All along it, by the green too: the green's patch leaves it out.)
        this.world.add(m);
      }
      // Along each wall's top, the grass laid again right up to it.
      const apron = grassMaterial({ ...roughLook, hole: cup, layer: LAYER.apron });
      for (const s of [...dug, ...lowPonds, ...brooks.flatMap((w) => wallViews(w))]) {
        if (!wallOf(s)) continue;
        // (Wide enough to cover the coarsest patch's cut along the wall,
        // and running on as far past its ends: what was cut there, reaching
        // in past a wall's end, was a hole beside a pot's end on the lower
        // setting.)
        const width = Math.max(coarse, pondStep, 1) * 1.5 + 0.3;
        const strip = landStrip(s, {
          width,
          ext: width,
          heightAt: (x, z) => this.heightAt(x, z),
          lift: SURFACE_LIFT.rough + 0.004,
          material: apron,
          faceIn: L.bunkers.includes(s) ? faceIn : null,
        });
        if (strip) this.world.add(strip);
      }

      // Fairway.
      yield "the ground round the ponds";
      const f = L.fairway;
      const fairSemiLook = L.links === "dunes" ? { light: PALETTE.linksFirstCut[0], dark: PALETTE.linksFirstCut[1], patch: 0.34 } : {};
      // Fairways added by hand (below), and what's on the hole's own
      // fairway (world x/z): the bands round each stop at the other's edge.
      const added = L.extraFairways ?? [];
      const offAdded = (geo, lift, shapes = added) => (shapes.length ? trimOut(geo, shapes, this.drapeHeight, lift, 0) : geo);
      const onBand = (wx, wz) => {
        const n = nearest(path, -wz, wx);
        return Math.abs(n.d) <= fairwayHalfWidth(f, n.s, n.d < 0 ? -1 : 1);
      };
      // (And an island green's causeway, which plays as fairway over
      // whatever it crosses: the first cuts and mown edges stop at it.)
      const ways = causeways(L);
      const offWays = (geo) => (ways.length ? cutOver(geo, (wx, wz) => ways.some((c) => causewayPast(c, -wz, wx) < 0)) : geo);
      // Its outline, each edge every 3 m along the line (sim/firstcut.mjs).
      const { loop, sAt } = fairwayOutline(L, path);
      if (loop.length) {
        const fairway = flat(loop);
        // (A lowered pond's cut exactly at its edge, where the grass stops
        // and the bank or the wall drops away.)
        const pits = [...dug.map((b) => fairwayPit(b, path, f, PIT_CLEAR)), ...lowPonds.map((w) => fairwayPit(w, path, f, 0))];
        for (const pit of pits.filter(Boolean)) fairway.holes.push(new THREE.Path(pit.map(([x, z]) => new THREE.Vector2(z, x))));
        // Where a dug bunker runs off the fairway, a sliver is left between
        // the cut-out and the fairway's edge, lying at the old ground level
        // across the hollow: that goes too, and so does any long, thin
        // triangle reaching from the fairway's edge down over the face.
        // (Round a lowered pond it's trimmed along the pond's edge itself:
        // cut into whole triangles, it ended in long straight-sided wedges
        // of fairway out in the rough.)
        // (Dug by hand there: the ground below where it was before - not
        // merely low. Judged by the ground's own height, every dip of a
        // rolling hole below the course's level counted, and the fairway
        // was cut away down its middle on any hole with a dug or walled
        // bunker - the owner, on Golf Sim Links' 1st: "long grass in the
        // fairway".)
        const dugAt = (x, z) => this.hole.heightAt(x, z) - (this.hole.baseHeightAt ?? this.hole.heightAt)(x, z);
        // (Only near a dug bunker can it be dug: anywhere else, without
        // working out the ground twice - for each of the fairway's few
        // hundred thousand triangles' middles and corners, a third of a
        // second while the next hole was built ahead.)
        const nearDug = nearShapes(dug, 1.5);
        const hollow = (wx, wz) => nearDug(wx, wz) && dugAt(-wz, wx) < -0.04 && !lowPonds.some((w) => insideBlob(w, -wz, wx, 1)) && !nearBed(wx, wz);
        // Kept from the last time the hole was built (look/bake.js), by its
        // outline and what's cut out of it - laid and cut all at once - or
        // laid and cut now, and kept.
        const fairKept = this.bake ? { inputs: { loop, pits, lift: SURFACE_LIFT.fairway } } : null;
        let fairCut = fairKept && this.bake.has("fairway", fairKept.inputs) ? this.bake.geometry("fairway", fairKept.inputs, () => null) : null;
        if (!fairCut) {
          fairCut = yield* laySteps(new THREE.ShapeGeometry(fairway), SURFACE_LIFT.fairway, "the fairway's shape");
          // (Each part a step of its own: a links fairway laid over its
          // rolling ground is a few hundred thousand triangles.)
          yield "the fairway's shape";
          if (dug.length) {
            fairCut = yield* named(refineNearSteps(fairCut, RIM_STEP, nearRim, this.drapeHeight, RIM_EVERY), "the fairway split finer round the bunkers");
            fairCut = yield* named(trimOutSteps(fairCut, dug, this.drapeHeight, SURFACE_LIFT.fairway, PIT_CLEAR, null, rimPoints), "the fairway round the bunkers");
          }
          yield "the fairway round the bunkers";
          fairCut = yield* named(trimOutSteps(fairCut, lowPonds, this.drapeHeight, SURFACE_LIFT.fairway, POND_CLEAR), "the fairway round the ponds");
          fairCut = yield* offBedsSteps(fairCut, this.drapeHeight, SURFACE_LIFT.fairway, "the fairway");
          // (A part a step: every triangle's middle asked, near a dug one
          // the ground worked out twice.)
          if (dug.length) fairCut = yield* named(cutOverSteps(fairCut, hollow), "the fairway off the dug ground");
          if (fairKept) {
            const cut = fairCut;
            this.bake.geometry("fairway", fairKept.inputs, () => cut);
          }
        }
        mesh(fairCut, grassMaterial(fairGrass));
        yield "the fairway";
        // A clean-up pass one mower wide round its edge, and past the edge
        // a clean line into the first cut, as the mower leaves it (the
        // owner: "The mower cut is a neat line").
        const worldLoop = loop.map(([x, z]) => [z, -x]);
        const cleanup = [{ off: -1.4, edge: 2 }, { off: -MOWN_EDGE / 2, edge: 1 }, { off: MOWN_EDGE / 2, edge: 0 }];
        edge(
          offWays(offAdded(yield* pitCutSteps(edgeBand(worldLoop, cleanup, this.drapeHeight, SURFACE_LIFT.fairway + 0.003), this.drapeHeight, SURFACE_LIFT.fairway, "the fairway's edge"), SURFACE_LIFT.fairway + 0.003)),
          grassMaterial({ ...fairGrass, edge: true, cleanup: true, layer: LAYER.fairwayEdge }),
          LAYER.fairwayEdge,
        );
        // The first cut: its own band along the fairway, where it plays as
        // semi-rough (sim/course.mjs FIRST_CUT), crisp under the fairway's
        // edge and ending in a clean line at the rough, as the mower leaves
        // it (where the rough's grass is cut off too: sim/mowncut.mjs) -
        // and on round the fairway's ends, as it plays (sim/course.mjs
        // fairwayBand: a mower goes round them).
        // (Its width wandering along each side, as it plays: sim/course.mjs
        // firstCutWidth - drawn out to the mower's line, wherever that runs
        // wider or narrower, round the curve to the green's mown grass and
        // beside the fairway's ends: sim/firstcut.mjs.)
        yield "the fairway";
        const cut = firstCutBand(L, loop, sAt, path);
        const cutWorld = cut.points.map(([x, z]) => [z, -x]);
        const firstCut = (i) => [{ off: -0.6, edge: 1 }, { off: cut.reach[i] - MOWN_EDGE / 2, edge: 1 }, { off: cut.reach[i] + MOWN_EDGE / 2, edge: 0 }];
        edge(offWays(offAdded(yield* pitCutSteps(edgeBand(cutWorld, firstCut, this.drapeHeight, SURFACE_LIFT.fairway), this.drapeHeight, SURFACE_LIFT.fairway, "the first cut"), SURFACE_LIFT.fairway)), grassMaterial({ ...GRASS.semi, hole: cup, edge: true, ...fairSemiLook }), LAYER.semi);
      }
      // Fairways added by hand (holeedits "a+"): mown as the hole's is, its
      // clean-up pass round the edge and its first cut round that (sim/
      // course.mjs surfaceAt), cut round dug bunkers and ponds as it is -
      // and where one meets the hole's own fairway, or another, the two
      // run into each other as one, with no edge between them.
      for (const s of added) {
        const loop = blobOutline(s, 72);
        const others = added.filter((o) => o !== s);
        let geo = pitCut(lay(new THREE.ShapeGeometry(flat(loop)), SURFACE_LIFT.fairway, L.links ? 1.5 : 3), this.drapeHeight, SURFACE_LIFT.fairway);
        // (Nothing laid twice over the hole's own: what's wholly on it goes.)
        geo = cutOver(geo, onBand, "all");
        mesh(geo, grassMaterial(fairGrass));
        const ring = loop.map(([x, z]) => [z, -x]);
        const bands = (lift, widths) => offWays(cutOver(offAdded(pitCut(edgeBand(ring, widths, this.drapeHeight, lift), this.drapeHeight, SURFACE_LIFT.fairway), lift, others), onBand));
        edge(bands(SURFACE_LIFT.fairway + 0.003, [{ off: -1.4, edge: 2 }, { off: -MOWN_EDGE / 2, edge: 1 }, { off: MOWN_EDGE / 2, edge: 0 }]), grassMaterial({ ...fairGrass, edge: true, cleanup: true, layer: LAYER.fairwayEdge }), LAYER.fairwayEdge);
        edge(bands(SURFACE_LIFT.fairway, [{ off: -0.6, edge: 1 }, { off: FIRST_CUT - MOWN_EDGE / 2, edge: 1 }, { off: FIRST_CUT + MOWN_EDGE / 2, edge: 0 }]), grassMaterial({ ...GRASS.semi, hole: cup, edge: true, ...fairSemiLook }), LAYER.semi);
      }
      // An island green's causeway to land (sim/causeway.mjs): fairway,
      // mown as the hole's is, with its clean-up pass round the edge -
      // across the pond, which gives way to it as to the green, so it's
      // laid on the ground as it was (not cut round the pond as the
      // fairway is).
      // (Where it runs onto a fairway, no mown edge between them.)
      for (const c of ways) {
        mesh(lay(new THREE.ShapeGeometry(flat(causewayOutline(c, 12))), SURFACE_LIFT.fairway, HIGH ? 0.5 : 1), grassMaterial(fairGrass));
        const cleanup = [{ off: -1.4, edge: 2 }, { off: -MOWN_EDGE / 2, edge: 1 }, { off: 0, edge: 0 }];
        edge(cutOver(offAdded(edgeBand(causewayOutline(c, 12).map(([x, z]) => [z, -x]), cleanup, this.drapeHeight, SURFACE_LIFT.fairway + 0.003), SURFACE_LIFT.fairway + 0.003), onBand), grassMaterial({ ...fairGrass, edge: true, cleanup: true, layer: LAYER.fairwayEdge }), LAYER.fairwayEdge);
      }
      // Deep rough: a band down each side, from DEEP_ROUGH short of the tree
      // line out under the trees, fading in from the rough.
      // (A links hole's is its long grass, out past where a ball is lost:
      // straw on a brown one, darker patches of green on a green one.)
      yield "the first cut";
      const deepMat = withCountry(grassMaterial({ ...(L.links === "green" ? GRASS.longGreen : L.links ? GRASS.fescue : GRASS.deep), hole: cup, edge: true }));
      this.countryMats.push(deepMat);
      // (Where it starts wandering along each side, as it plays: sim/
      // course.mjs deepRoughFrom.)
      for (const side of [-1, 1]) {
        // (Each side a step of its own: on rolling ground each is laid
        // finely over it.)
        if (side === 1) yield "the deep rough";
        edge(yield* pitCutSteps(this.deepRoughBand(path, L.bandScale ? L.treeLine - DEEP_ROUGH : (s) => deepRoughFrom(L, Math.min(Math.max(s, 0), path.length), side), L.treeLine + (L.links ? 60 : 30), side), this.drapeHeight, SURFACE_LIFT.deep, "the deep rough"), deepMat, LAYER.deep);
      }
      // Tee box, where it plays as tee (sim/course.mjs surfaceAt), and the
      // other tee boxes (sim/tees.mjs), back and forward along the line:
      // the square round each spot that plays as tee. Round each, its mown
      // surround of first cut (sim/course.mjs SURROUND, where it plays as
      // first cut over the rough), cut in straight lines: the tee's edge
      // and the surround's a clean line each, so the rough's long grass
      // starts at a straight one (the owner: "They would get cut in
      // straight lines").
      yield "the deep rough";
      const semiLook = L.links === "dunes" ? { light: PALETTE.linksFirstCut[0], dark: PALETTE.linksFirstCut[1], patch: 0.34 } : {};
      const semiMat = grassMaterial({ ...GRASS.semi, hole: cup, ...semiLook });
      const semiEdge = grassMaterial({ ...GRASS.semi, hole: cup, edge: true, ...semiLook });
      const corners = ([x0, x1, z0, z1], out = 0) => [[x0 - out, z0 - out], [x1 + out, z0 - out], [x1 + out, z1 + out], [x0 - out, z1 + out]];
      // (And between tee boxes close enough to share it: sim/course.mjs
      // teeBridges.)
      for (const bridge of teeBridges(L.teeSpots)) {
        mesh(pitCut(lay(new THREE.ShapeGeometry(flat(corners(bridge, -MOWN_EDGE / 2))), SURFACE_LIFT.fairway, 1), this.drapeHeight, SURFACE_LIFT.fairway), semiMat);
        edge(pitCut(edgeStrip(lineAlong(corners(bridge, -MOWN_EDGE / 2)).map(([x, z]) => [z, -x]), MOWN_EDGE, this.drapeHeight, SURFACE_LIFT.fairway), this.drapeHeight, SURFACE_LIFT.fairway), semiEdge, LAYER.semi);
      }
      for (const box of teeBoxes(L.teeSpots)) {
        const teeBox = corners(box);
        mesh(pitCut(lay(new THREE.ShapeGeometry(flat(corners(box, SURROUND.tee - MOWN_EDGE / 2))), SURFACE_LIFT.fairway, 1), this.drapeHeight, SURFACE_LIFT.fairway), semiMat);
        edge(pitCut(edgeStrip(lineAlong(corners(box, SURROUND.tee - MOWN_EDGE / 2)).map(([x, z]) => [z, -x]), MOWN_EDGE, this.drapeHeight, SURFACE_LIFT.fairway), this.drapeHeight, SURFACE_LIFT.fairway), semiEdge, LAYER.semi);
        mesh(lay(new THREE.ShapeGeometry(flat(teeBox)), SURFACE_LIFT.tee), grassMaterial(GRASS.tee));
        edge(edgeStrip(lineAlong(teeBox).map(([x, z]) => [z, -x]), MOWN_EDGE, this.drapeHeight, SURFACE_LIFT.tee), grassMaterial({ ...GRASS.tee, edge: true }), LAYER.tee);
      }

      // Green and fringe: rings out to the green's outline, following its slopes.
      yield "the tees";
      const g = L.green;
      const outline = (a) => {
        // World angle -> hole angle -> the green's own angle.
        const theta = Math.atan2(Math.cos(a), -Math.sin(a));
        return blobRadius(g, theta - g.rot);
      };
      const segments = HIGH ? 180 : 120;
      // A dug bunker set to meet the green has its face right under the
      // fringe: the fringe stops just short of its edge, following it (it
      // would otherwise lie flat across the drop).
      const joinedPits = dug.filter((b) => b.join === 1);
      const otherPits = dug.filter((b) => b.join !== 1);
      // Its look, the hole's (sim/fringe.mjs): one shade, mown in rings
      // round the green, or a lusher collar.
      const fl = fringeLook(mowSeed(L));
      const fringeGrass = fl === "rings" ? { dark: PALETTE.fringeDark, stripeWidth: 0.8, mow: 2, centre: [gWorld.x, gWorld.z] } : fl === "lush" ? { light: PALETTE.fringeLush, dark: PALETTE.fringeLush, patch: 0.2 } : {};
      const fringe = ringMesh({
        cx: gWorld.x, cz: gWorld.z, outline, inner: 1, innerExtra: -0.05, outerExtra: 1.6,
        rings: 4, segments, heightAt: this.worldHeight, lift: SURFACE_LIFT.fringe,
        material: grassMaterial({ ...GRASS.fringe, ...fringeGrass, hole: cup }),
        clip: joinedPits.length ? (wx, wz) => joinedPits.some((b) => insideBlob(b, -wz, wx, 0.05)) : null,
      });
      if (otherPits.length) fringe.geometry = cutOver(fringe.geometry, (wx, wz) => otherPits.some((b) => insideBlob(b, -wz, wx, 0.3)), false);
      fringe.geometry = clearOfWalls(fringe.geometry, 0.4, SURFACE_LIFT.fringe, false);
      this.world.add(fringe);
      // (The fringe, the green and the bands round it a step each: the
      // three together were up to 65 ms.)
      yield "the fringe";
      // Mown in the hole's own pattern, with a clean-up ring just inside
      // the fringe.
      this.world.add(
        this.shadeSlopes(
          withRim(
            ringMesh({
              cx: gWorld.x, cz: gWorld.z, outline, rings: Math.ceil(Math.max(g.rx, g.rz) / (HIGH ? 0.2 : 0.35)), segments,
              heightAt: this.worldHeight, lift: SURFACE_LIFT.green, material: grassMaterial({ ...GRASS.green, stripeWidth: MOW_WIDTH.green, hole: cup, ...mowOptions(mowing.green), rim: true, grain: this.hole.green?.grain ? holeToWorld(this.hole.green.grain.dir) : null }),
            }),
            gWorld.x, gWorld.z, outline,
          ),
        ),
      );
      yield "the green";
      // The fringe's outer edge, a clean line; and past it the green's
      // surround of first cut (sim/course.mjs SURROUND, where it plays as
      // first cut over the rough), a channel of even width following the
      // green's outline, its own outer edge a clean line too, so the
      // rough's long grass starts at one (the owner: "around the green in
      // a perfect channel"). Under the fairway, which is drawn over it.
      const fringeEdge = [];
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        const r = outline(a) + FRINGE;
        fringeEdge.push([gWorld.x + Math.cos(a) * r, gWorld.z + Math.sin(a) * r]);
      }
      // (It follows the dug ground down under the sand, so only what's
      // wholly in a pit goes: dropping every piece near one left teeth.)
      const offPits = (geo) => (dug.length ? cutOver(geo, (wx, wz) => dug.some((b) => insideBlob(b, -wz, wx)), "all") : geo);
      const fringeStrip = edgeStrip(fringeEdge, MOWN_EDGE, this.worldHeight, SURFACE_LIFT.fringe);
      edge(clearOfWalls(offPits(fringeStrip), 1.4, SURFACE_LIFT.fringe, false), grassMaterial({ ...GRASS.fringe, ...fringeGrass, hole: cup, edge: true }), LAYER.fringe);
      // Its outer edge out over the rough that's mown with it where it
      // comes near the fairway's first cut (sim/course.mjs greenMown): out
      // along each point's way out, as the band lays it.
      const out =
        fringeEdge.reduce((a, [x0, z0], i) => {
          const [x1, z1] = fringeEdge[(i + 1) % fringeEdge.length];
          return a + x0 * z1 - x1 * z0;
        }, 0) > 0
          ? -1
          : 1;
      const reach = fringeEdge.map(([x, z], i) => {
        const [px, pz] = fringeEdge[(i - 1 + fringeEdge.length) % fringeEdge.length];
        const [nx, nz] = fringeEdge[(i + 1) % fringeEdge.length];
        const len = Math.hypot(nx - px, nz - pz) || 1;
        const [ux, uz] = [(-(nz - pz) / len) * out, ((nx - px) / len) * out];
        // (In the hole's frame: x = -wz, z = wx.)
        return greenMownReach(L, -z, x, -uz, ux, SURROUND.green, 14, path);
      });
      const channel = edgeBand(fringeEdge, (i) => [{ off: -0.3, edge: 1 }, { off: reach[i] - MOWN_EDGE / 2, edge: 1 }, { off: reach[i] + MOWN_EDGE / 2, edge: 0 }], this.worldHeight, SURFACE_LIFT.fairway);
      edge(clearOfWalls(offPits(channel), 1.4, SURFACE_LIFT.fairway), semiEdge, LAYER.semi);
    }
    yield "the green and fringe";
    // The mower's line (sim/mowncut.mjs): the rough's grass - the tufts,
    // the long grass, the grass round the ball - cut off in a neat line
    // along every edge a mower makes (look/cutline.js; the course's scene
    // uses it while it's drawn: course.js).
    // (And the line itself, for the row of long grass grown along it round
    // the ball: growLongGrass.)
    // (A part a step.)
    const mown = yield* named(mownFieldSteps(L, { path }), "the mower's line");
    this.cutField = cutPicture(mown);
    this.mownEdge = mown ? { field: mown, line: mownLine(mown) } : null;
    yield "the mower's line";
    const pinWorld = toWorld(L.pin[0], this.heightAt(...L.pin), L.pin[1]);
    const cupMesh = makeCup(this.hole.cup.r, this.worldNormal(pinWorld.x, pinWorld.z));
    cupMesh.position.copy(pinWorld);
    this.world.add(cupMesh);
    // The yellow glow and closing circle that point it out (look/cupmark.js).
    this.cupMark = new CupMark({ at: pinWorld, normal: this.worldNormal(pinWorld.x, pinWorld.z), radius: this.hole.cup.r });
    this.world.add(this.cupMark.mesh);
    const flag = makeFlag({ height: 2.2 });
    flag.position.copy(pinWorld).add(new THREE.Vector3(0, -0.1, 0));
    flag.scale.setScalar(1.3);
    this.world.add(flag);
    // In or out as the shot needs it (showFlag): nothing else here goes by
    // it - the cup, the aim, the camera and the map all go by pinWorld.
    this.flag = flag;
    this.pinWorld = pinWorld;
    // (The cup, the cart paths and the wear a step each: the three together
    // were up to 145 ms.)
    yield "the cup and flag";
    // Cart paths, and the signs round the hole.
    this.pathGround = this.hole.mapped ? this.pathGround : this.worldHeight;
    this.addPaths(L);
    yield "the cart paths";
    this.addWear(L);
    yield "the cup, paths and wear";
    // (A step each: the two together were up to two thirds of a second.)
    yield* this.addDressing(L);
    yield "the links ground";
    this.addSignage(L);
    yield "the signs";
    // Each penalty area's stakes and line (sim/penalty.mjs), none on the
    // green or its fringe (sim/greenfirst.mjs).
    const greens = greenZone(L);
    this.world.add(penaltyMarking(penaltyMarks(L), (x, z) => this.heightAt(x, z), greens.within));
    // (Built a step at a time, the tufts all over the hole are placed on
    // another core from here on, while the rest is built: startTufts.)
    const tuftsJob = wait ? this.startTufts(L) : null;
    yield "dressing and signs";
    if (!this.hole.mapped) {
      // Bunkers and water, from the same outlines the physics uses.
      // Sand and water sit on top of the grass; polygon offset keeps them
      // there from far away. Each has its own material, which knows how far
      // each spot is from its edge (look/sandwater.js); round the sand, a
      // collar of longer grass fades out, and round water a muddy margin.
      const worldLoop = (shape, n = 48, grow = 0) => blobOutline(shape, n, grow).map(([x, z]) => [z, -x]);
      const lip = lipMaterial(cup);
      // Where sand runs into water: the sand darkens to wet sand for its
      // last metre, the water shows a shelf of sand under its shallows, and
      // no collar of grass lies between.
      const waterLoops = L.water.map((w) => worldLoop(w, 96));
      const bunkerLoops = L.bunkers.map((b) => worldLoop(b, 96));
      const nearWater = (wx, wz, grow) => L.water.some((w) => insideBlob(w, -wz, wx, grow));
      // By a green shaped by hand the ground under the sand isn't flat (the
      // green's bank eases down into it), so every bunker follows it, as
      // dug ones do: a flat sheet would float over the ball.
      const shapedGreen = (L.contours ?? []).some((c) => c.sculpt);
      // Bunkers laid over each other (a third of made-up holes have two on
      // much the same spot - the owner: "Clashing bunkers"): drawn as one
      // patch of sand, with no lip, damp band or bowl edge across the
      // other's sand, raked the same way (look/sandwater.js sandFor's
      // join). Two dug alike as well: where they overlap the ground's dug
      // as deep as the deeper (holeedits.mjs groundShaping), one bowl. A
      // walled one's edge is a real drop.
      const laidOver = (a, o) => a !== o && !wallOf(a) && !wallOf(o) && !a.dig === !o.dig && overlaps(a, o) && (blobOutline(o, 48).some(([x, z]) => insideBlob(a, x, z)) || blobOutline(a, 48).some(([x, z]) => insideBlob(o, x, z)));
      const patch = L.bunkers.map((_, i) => i);
      const patchOf = (i) => (patch[i] === i ? i : (patch[i] = patchOf(patch[i])));
      L.bunkers.forEach((a, i) => L.bunkers.forEach((o, j) => j > i && laidOver(a, o) && (patch[patchOf(j)] = patchOf(i))));
      // (Each patch's one sand, by its first bunker.)
      const patchSand = [];
      for (const [bi, b] of L.bunkers.entries()) {
        // (Each bunker a step of its own: a hole of a dozen dug ones was one
        // long step, the page held for all of them.)
        if (bi) yield "a bunker";
        const outline = bunkerLoops[bi];
        const others = L.bunkers.filter((o) => o !== b);
        const joined = L.bunkers.flatMap((o, j) => (laidOver(b, o) ? [bunkerLoops[j]] : []));
        const overBy = L.bunkers.filter((o) => laidOver(b, o));
        const inside = (list) => (wx, wz) => list.some((o) => insideBlob(o, -wz, wx));
        // The collar: not across another bunker's sand. It starts a little
        // under the sand, which lies higher: meeting exactly at the edge,
        // the two would show a hairline of whatever's beneath between them.
        // (Not a dug one's: there the sand drops away at once, and the
        // collar would stand above it as a band of grass.)
        const tuck = b.dig || wallOf(b) ? 0 : 0.1;
        const collar = edgeStrip(worldLoop(b, 96, -tuck), 0.9 + tuck, this.worldHeight, 0.01);
        // Set to meet the green (holeedits.mjs): no longer grass between the
        // sand and the green, so none of the collar lies over the green.
        const onGreen = b.join === 1 ? (wx, wz) => insideBlob(L.green, -wz, wx, 0.15) : null;
        const cut = (wx, wz) => (onGreen && onGreen(wx, wz)) || (L.water.length && nearWater(wx, wz, 0.4));
        // Across another's sand only where wholly in it: a triangle part in
        // it lies under that sand (drawn a little over the ground), where
        // cutting it left a sliver of nothing where two edges cross.
        // (Its corners in that sand let down under it, out of sight.)
        const cutSand = (g) => {
          if (!others.length) return g;
          const cutG = cutOver(g, inside(others), "all");
          const pos = cutG.attributes.position;
          const under = inside(others);
          for (let i = 0; i < pos.count; i++) if (under(pos.getX(i), pos.getZ(i))) pos.setY(i, pos.getY(i) - 0.06);
          pos.needsUpdate = true;
          return cutG;
        };
        // (A waste area has none: its sand runs out into the heath.)
        // (Nor a pot's: the turf runs straight to its sand, as on a links.)
        if (!b.waste && !isPot(b)) edge(cutSand(onGreen || L.water.length ? cutOver(collar, cut) : collar), lip, LAYER.lip);
        const walled = !!wallOf(b);
        // By a wall, the sand is drawn at the wall's foot right up to it,
        // never up the face (look/walls.js besideWall).
        const sandHeight = walled ? this.besideWall(b, true) : this.worldHeight;
        // Its look (sim/bunkerlook.mjs): the course's sand, and its own edge
        // and raking - a patch of bunkers laid over each other alike.
        const look = bunkerLook(L.bunkers[patchOf(bi)], this.sandLook(L));
        // A patch laid over each other is one bunker to look at: one sand
        // for all of it, shaded from its outside line (look/sandwater.js
        // sandFor's patch), so no line shows where one's outline crosses
        // another's sand.
        const members = L.bunkers.flatMap((_, j) => (patchOf(j) === patchOf(bi) ? [j] : []));
        // (Its field a part a step: sandForSteps.)
        const sandOf = () => named(sandForSteps(outline, b.dig || walled ? sandHeight : null, LAYER.sand, waterLoops, { join: joined, rakeFrom: bunkerLoops[patchOf(bi)], look, patch: members.length > 1 ? members.map((j) => bunkerLoops[j]) : null }), "a bunker's sand");
        if (members.length > 1 && !patchSand[patchOf(bi)]) patchSand[patchOf(bi)] = yield* sandOf();
        const sand = members.length > 1 ? patchSand[patchOf(bi)] : yield* sandOf();
        // (Its sand's picture of how far in each spot is, its wall and its
        // bowl a step each: a big dug one by a wall was 0.15 s in one.)
        yield "a bunker's sand";
        if (walled) {
          const wall = makeWall(b, "bunker", { heightAt: (x, z) => this.heightAt(x, z), faceIn });
          if (wall) this.world.add(wall);
          yield "a bunker's wall";
        }
        if (dug.length || shapedGreen || lowPonds.length) {
          // With any dug by hand (holeedits.mjs groundShaping): every bunker
          // follows the ground, finely enough for the face of one dug, and
          // where two overlap the shallower gives way to the deeper. The
          // sand knows how deep into the bowl each spot is.
          const bw = toWorld(b.x, 0, b.z);
          const round = (a) => blobRadius(b, Math.atan2(Math.cos(a), -Math.sin(a)) - (b.rot ?? 0));
          // (A wall counts as deep as it drops.)
          const depthOf = (o) => Math.max(o.dig ?? 0, wallOf(o)?.h ?? 0);
          const deeper = others.filter((o) => depthOf(o) > depthOf(b) || (depthOf(o) === depthOf(b) && L.bunkers.indexOf(o) > L.bunkers.indexOf(b)));
          const rings = b.dig ? Math.ceil(Math.max(b.rx, b.rz) / 0.3) : 14;
          // (Two undug ones overlapping just lie one a hair over the other,
          // as flat ones always did: cutting one out of the other would
          // leave a row of teeth along the line.)
          const cutBy = deeper.filter((o) => o.dig || wallOf(o) || b.dig || walled);
          // Under a deeper one with no wall (sinkUnder), its sand runs on
          // beneath that one's - not stopped at its edge: a spoke stopped
          // there stays stopped (greenscene.js ringMesh), and one that
          // crossed the deeper and came out beyond it, still in this one,
          // left no sand there over the dug ground - a hole showing the sky
          // (the owner, on the phone, of Nine Oaks 1's greenside pair: "a
          // bunker mis draw"). A walled one's, trimmed back to its edge
          // (look/dugground.js trimOut), at its wall's top - past it the
          // sand would lie across its pit - and elsewhere a few
          // centimetres under its sand, so no hairline of grass shows
          // between them: not ringMesh's clip, for the same stopped
          // spokes (Sea Links 2's pair of pots).
          const under = cutBy.filter((o) => !wallOf(o));
          const atWall = cutBy.filter((o) => wallOf(o));
          // Running into a pond lowered below the grass (one with a wall),
          // the sand stops right at the pond's edge, where its bank drops
          // away (ringMesh's clip).
          const intoPond = lowPonds.filter((w) => insideBlob(w, b.x, b.z, shapeReach(b) + 1) || blobOutline(b, 24).some(([x, z]) => insideBlob(w, x, z)));
          // Running into another bunker's wall: finely, and cut clear of it.
          const walls = others.filter((o) => wallOf(o) && overlaps(o, b));
          const deep = b.dig || walled || intoPond.length || walls.length;
          const bowlHeight = deep ? (wx, wz) => sandHeight(wx, wz) - rimTuck(Math.max(insideDepth(b, -wz, wx), ...overBy.map((o) => insideDepth(o, -wz, wx)))) : sandHeight;
          const lift = SURFACE_LIFT.bunker + (deep ? 0 : 0.004 * bi);
          // A fingered bunker's sand (sim/fingers.mjs) filled from its own
          // outline and split fine, not a fan of spokes: a finger's sides
          // run nearly along the spokes, so its dug face fell between two
          // of them, drawn as long slivers - fine dark streaks fanning into
          // the sand from every finger. Its edge the very points the ground
          // round it is cut to (rimPoints), as the spokes' were.
          const fill = b.fingered && deep && !intoPond.length ? fingeredSand(blobOutline(b, rimPoints(b)), bowlHeight, lift, sand) : null;
          const bowl = fill ?? ringMesh({
            cx: bw.x,
            cz: bw.z,
            outline: round,
            // (A little coarser on the lower graphics setting, except
            // along a wall, where it has to meet the wall's foot.)
            rings: deep ? Math.ceil(Math.max(b.rx, b.rz) / (HIGH || walled ? 0.3 : 0.4)) : rings,
            // (A dug one's spokes through its own outline points, which the
            // ground round it is cut to: rimPoints.)
            // (A waste area's big ragged outline finer than a little
            // bunker's: its sand where it plays as one.)
            segments: deep ? rimPoints(b) : b.waste ? 160 : 64,
            angles: deep ? rimAngles(b, rimPoints(b)) : null,
            // (A dug one's edge tucked under its collar: sim/bunkerlook.mjs
            // rimTuck.)
            // (Only at the patch's own edge: not where another laid over
            // it carries the sand on.)
            heightAt: bowlHeight,
            lift,
            material: sand,
            clip: intoPond.length ? (wx, wz) => intoPond.some((w) => insideBlob(w, -wz, wx)) : null,
          });
          if (under.length) sinkUnder(bowl.geometry, under);
          // (Along the edge itself, not losing whole triangles there, which
          // left a torn, saw-toothed edge with grass showing through. Not
          // under it by the wall, where it would hang down the wall's face.)
          if (atWall.length) bowl.geometry = trimOut(bowl.geometry, atWall, bowlHeight, lift, 0, (x, z) => 0.06 * Math.min(1, ...atWall.map((o) => Math.max(0, (wallDistance(o, x, z, 0.6) - 0.3) / 0.3))));
          // Nor under water, where it would be hidden anyway: a dug face
          // running down beneath a pond could show a thread through it.
          if (L.water.length) bowl.geometry = cutOver(bowl.geometry, (wx, wz) => nearWater(wx, wz, -0.3), false);
          // (Not cut clear of the wall of a shallower one it runs into, as
          // it was: that one's sand stops at this one's edge - atWall or
          // sinkUnder above - so with this one's cut there too, neither
          // covered the dug ground: Sea Links 2's pair of pots showed the
          // sky in a crescent between them.)
          this.world.add(bowl);
          continue;
        }
        // The same outline as its collar's inner edge: a coarser one's
        // straight sides would cut inside it and leave a sliver of rough.
        // (One laid over another a hair above it, so the two never fight
        // over which shows.)
        mesh(lay(new THREE.ShapeGeometry(flat(blobOutline(b, 96))), SURFACE_LIFT.bunker + (joined.length ? 0.004 * bi : 0)), sand);
      }
      const bank = bankMaterial(cup);
      // None of any water on the green or its fringe (sim/greenfirst.mjs):
      // the water stops there, and its banks.
      const zone = greenZone(L);
      const onGreen = (wx, wz) => zone.within(-wz, wx);
      for (const [wi, w] of L.water.entries()) {
        // (And each pond.)
        if (wi) yield "a pond";
        if (w.brook) {
          yield "a brook";
          this.drawBrook(w, waterLoops[wi], bunkerLoops);
          continue;
        }
        const wall = wallOf(w);
        const dry = waterDry(zone, w);
        const offGreen = (geo) => (dry ? cutOver(geo, onGreen) : geo);
        if (!sunkPond(w)) {
          // Tucked a little under the water, as the sand's collar is.
          edge(offGreen(edgeStrip(worldLoop(w, 96, -0.15), 1.35, this.drapeHeight, 0.01)), bank, LAYER.bank);
          // Built from the same outline as the bank, so no sliver of grass
          // shows between them.
          // (A links burn, a few metres wide, with its margin and shallows
          // as narrow as a brook's: a pond's filled it from bank to bank,
          // and it read from above as a dark green streak across the
          // fairway - the owner: "big dark streak across it".)
          // (A burn runs: shallow and clear, its ripples carried down
          // along it - sim/waterflow.mjs runOf.)
          const run = w.burn ? runOf(blobOutline(w, 96), { heightAt: (x, z) => this.heightAt(x, z) }) : null;
          mesh(lay(new THREE.ShapeGeometry(flat(blobOutline(w, 96))), SURFACE_LIFT.water), waterFor(waterLoops[wi], LAYER.water, bunkerLoops, null, w.burn ? waterEdgeScale(w.rx, true) : 1, dry, { marsh: marshLook(w), run }));
          continue;
        }
        // A pond lies below the grass (sim/walls.mjs pondLevel: a wall's
        // height, or POND_SINK's): a bank down to the water inside its
        // outline, a ring of grass round it, the water flat at its level,
        // and its wall if it has one. Without one, the bank rolls over from
        // the grass and down past the water (holeedits groundShaping) -
        // gently in stretches, short and steep where the water's worn it
        // (sim/walls.mjs shoreAt) - and the grass comes down it nearly to
        // the water on the gentle stretches, to a lip of turf over a face of
        // earth on the steep ones (the owner, 23 October 2026: "water edges
        // look very different and are often smooth due to water erosion").
        const level = this.hole.pondLevel(w);
        this.waterLevels.push({ w, level });
        const pw = toWorld(w.x, 0, w.z);
        const holeAngle = (a) => Math.atan2(Math.cos(a), -Math.sin(a));
        const round = (a) => blobRadius(w, holeAngle(a) - (w.rot ?? 0));
        const bankW = wall ? Math.min(1.8, Math.max(0.6, 1.5 * wall.h + 0.3)) : POND_SINK.bank * SHORE.wide * 0.6;
        const low = wall ? this.besideWall(w) : this.worldHeight;
        // How far in from its edge along a spoke (world angle a) the
        // ground is down to `above` over the water.
        const downTo = (a, above, most) => {
          const edge = round(a);
          const [ca, sa] = [Math.cos(a), Math.sin(a)];
          const h = (e) => low(pw.x + ca * (edge - e), pw.z + sa * (edge - e)) - level;
          if (h(0) <= above) return 0;
          let lo = 0;
          let hi = most;
          if (h(hi) > above) return most;
          for (let k = 0; k < 14; k++) {
            const mid = (lo + hi) / 2;
            if (h(mid) > above) lo = mid;
            else hi = mid;
          }
          return hi;
        };
        // The turf's edge down the bank: shoreAt's, with small bites out
        // of it.
        const turfAt = (a) => {
          const ah = holeAngle(a);
          const bite = 1 + 0.22 * Math.sin(13 * ah + w.x) + 0.12 * Math.sin(31 * ah + w.z);
          return shoreAt(w, ah).turf * bite;
        };
        this.world.add(
          ringMesh({ cx: pw.x, cz: pw.z, outline: round, inner: 1, innerExtra: -(bankW + 0.6), outerExtra: 0, rings: 10, segments: 160, heightAt: low, lift: 0, material: bankSlopeMaterial(level), clip: dry && onGreen }),
        );
        const apron = grassMaterial({ ...(L.links && L.links !== "green" ? GRASS.duneRough : GRASS.rough), hole: cup, layer: LAYER.apron });
        this.world.add(ringMesh({ cx: pw.x, cz: pw.z, outline: round, inner: 1, innerExtra: 0, outerExtra: 1.6, rings: 3, segments: 160, heightAt: this.worldHeight, lift: SURFACE_LIFT.rough + 0.004, material: apron }));
        // The grass on down the bank to its turf line (not along a wall:
        // its face goes straight down) - lit mostly as the grass round it
        // is, as if level (lit as steep as it is, it was a bright band
        // along the top of the bank).
        const nearWall = (wx, wz) => !!wall && wallDistance(w, -wz, wx, 1.2) < 1.2;
        const turf = ringMesh({
          cx: pw.x,
          cz: pw.z,
          outline: round,
          inner: 1,
          innerExtraAt: (a) => -downTo(a, turfAt(a), bankW + 0.5),
          outerExtra: 0,
          rings: 4,
          segments: 160,
          heightAt: low,
          lift: SURFACE_LIFT.rough + 0.004,
          material: apron,
          clip: (wx, wz) => nearWall(wx, wz) || (!!dry && onGreen(wx, wz)),
        });
        levelNormals(turf.geometry, (x, z) => this.drapeHeight(x, z) + 0.3 * (low(x, z) - this.drapeHeight(x, z)));
        this.world.add(turf);
        // Where it gives way to the green (sim/greenfirst.mjs) - an island
        // green, and its causeway to land (sim/causeway.mjs) - their own
        // bank inside it, from the fringe's and the causeway's edges down
        // into the water: earth, grass over its top, as the pond's own
        // bank. (The ground's sheets stop at the pond's edge, so nothing
        // else is there: it showed as a white gap under the island's edge.)
        if (dry) {
          const step = HIGH ? 0.4 : 0.6;
          const near = [shapeBounds(L.green, FRINGE + 3), ...zone.ways.map((c) => causewayBounds(c, 3))];
          const pb = shapeBounds(w, 0.5);
          const hb = {
            x0: Math.max(pb.x0, Math.min(...near.map((b) => b.x0))),
            x1: Math.min(pb.x1, Math.max(...near.map((b) => b.x1))),
            z0: Math.max(pb.z0, Math.min(...near.map((b) => b.z0))),
            z1: Math.min(pb.z1, Math.max(...near.map((b) => b.z1))),
          };
          if (hb.x1 > hb.x0 && hb.z1 > hb.z0) {
            const gw = toWorld(L.green.x, 0, L.green.z);
            // (Under the fringe and the causeway it sits well down: just
            // under them, seen low across a curved or slanting edge, its
            // grid's corners came up through them in a row of teeth.)
            const under = (wx, wz) => this.worldHeight(wx, wz) - (zone.past(-wz, wx, 3) < 0 ? 0.1 : 0);
            const own = groundRect(hb.z1 - hb.z0, hb.x1 - hb.x0, step, under, -0.03, bankSlopeMaterial(level, this.drapeHeight(gw.x, gw.z)), (hb.z0 + hb.z1) / 2, -(hb.x0 + hb.x1) / 2);
            own.geometry = cutOver(
              own.geometry,
              (wx, wz) => {
                const past = zone.past(-wz, wx, 3);
                return past > 2.5 || past < -0.8 || !insideBlob(w, -wz, wx, 0.2);
              },
              "all",
            );
            this.world.add(own);
          }
        }
        const line = wall ? wallLine(w).pts : null;
        const sheet = new THREE.ShapeGeometry(flat(blobOutline(w, 96)));
        sheet.rotateX(-Math.PI / 2);
        const pos = sheet.attributes.position;
        for (let i = 0; i < pos.count; i++) pos.setY(i, level);
        sheet.computeVertexNormals();
        // Its shallows and margin from where the water meets the bank, not
        // from the grass's edge above it (the bank between hid them, and
        // the water showed its deeper green right up to the bank).
        const waterline = Array.from({ length: 96 }, (_, i) => {
          const a = (i / 96) * Math.PI * 2;
          const r = round(a) - downTo(a, 0, bankW + 0.5);
          return [pw.x + Math.cos(a) * r, pw.z + Math.sin(a) * r];
        });
        mesh(sheet, waterFor(waterline, LAYER.water, bunkerLoops, line?.map(([x, z]) => [z, -x]) ?? null, 1, dry, { marsh: marshLook(w) }));
        const built = wall ? makeWall(w, "water", { heightAt: (x, z) => this.heightAt(x, z), level }) : null;
        if (built) this.world.add(built);
      }
    }
    // What the hole sounds like: its water, where it's drawn.
    yield "bunkers and water";
    // The cup's hole cut only in a patch of ground round the cup, the rest
    // drawn without it, so the graphics card can skip hidden ground there
    // (look/cupcut.js). (Every piece of ground that cuts it is laid by now.)
    cutOnlyNearCup(this.world);
    yield "the cup's hole cut round the cup";
    this.world.userData.soundscape = holeSoundscape(L, { heightAt: (x, z) => this.heightAt(x, z) });
    // Trees, and what the chase camera keeps clear of (view.js
    // clearOfTrees): each crown's reach and how high it stands.
    // Each drawn as a ball in the air meets it (sim/treehits.mjs).
    // (And past them, the fuller backdrop behind the green: scenery only,
    // beyond where a ball can finish - sim/country.mjs backdropTrees.)
    // Clear of the other holes' play (sim/treeclear.mjs), as they're drawn from every hole.
    const treeOk = !this.challenge && this.course?.holes?.length > 1 ? treeClearance(this.course, this.round?.index ?? Math.max(0, (L.number ?? 1) - 1)) : () => true;
    // (As it first grew, if the hole's trees are kept: sim/treelock.mjs.)
    const keptBackdrop = this.hole.treeLock?.lock?.backdrop;
    const grownBackdrop = keptBackdrop ?? (holeExtras({ challenge: this.challenge, mapped: this.hole.mapped }).backdrop ? backdropTrees(L, { seed: this.countrySeed(L), character: this.characterOf(L) }) : []);
    this.keepTreeLock(grownBackdrop, !keptBackdrop);
    const backdrop = grownBackdrop.filter((t) => this.inland(t[1], -t[0]) && treeOk(t[0], t[1], treeReach(t)));
    this.backdrop = backdrop;
    const forms = [...treeForms(L.trees), ...treeForms(backdrop)];
    // (The front row - the trees lining the hole, nearest its line - drawn
    // close up from further off on High and Ultra: sim/treelod.mjs.)
    const front = new Uint8Array(L.trees.length + backdrop.length);
    front.set(frontRow(L.trees, L.path));
    // (And the hole's own trees, not the backdrop, at their best wherever
    // they are on Ultra: sim/treelod.mjs HOLE_TOP.)
    const own = new Uint8Array(L.trees.length + backdrop.length).fill(1, 0, L.trees.length);
    // (Where they stand, then the trees themselves: a step each.)
    yield "where the trees stand";
    // (Seen from its line of play: those buried in a wood behind others,
    // on High, in their shape further off - sim/treelod.mjs buriedTrees.)
    const trees = makeTrees([...L.trees, ...backdrop].map(([x, z, ...size]) => [z, -x, ...size]), { seed: this.hole.layout.number ?? 3, groundY: this.worldHeight, forms, front, own, facing: L.path.map(([x, z]) => [z, -x]) });
    this.world.add(trees);
    // The ground round their feet (look/treefoot.js).
    if (trees.userData.feet) this.world.add(trees.userData.feet);
    // Each as far as its leaves are drawn (look/trees.js crowns): a size
    // for its kind fell metres short of a big real tree's leaf cards, and
    // took no account of its lean, so the camera went into them.
    // And the club's buildings (addClub: the clubhouse, a mapped course's
    // own), each as the cylinders it says it fills (view.js keepClear).
    this.cameraTrees = keepClear(trees.userData.crowns, this.world);
    // (And what kinds they are, for the far woods to take after.)
    this.nearKinds = trees.userData.kinds;
    // The country past the trees, and the shade under them; and glimpses
    // of the course's other holes out in it.
    yield "the trees";
    // (Built a step at a time, worked out on another core while the rest
    // is built, and laid out at the end.)
    const country = this.startCountry(L, wait);
    if (!country?.job) {
      yield* this.placeCountrySteps(country);
      yield "the country (here)";
      yield* this.glimpseSteps(L);
    }
    yield "the country's glimpses";
    // Tufts of longer grass in the rough, near the tee and round the green:
    // kept clear of sand and water (a tuft's cards are wider than any gap a
    // lie check at one point leaves), and thinning out with distance from
    // the green rather than stopping at a line, which read as a hedge.
    if (HIGH) {
      // And off the cart paths, by more than a tuft's width, so none
      // stands over one (sim/tufts.mjs tuftClearOfPaths) - every path as
      // it's drawn on the hole, the next hole's too (holescenery.js
      // grassPaths: on the phone, with Grass all over the hole off, these
      // stood on the path the cart drives off the green along).
      const paths = this.grassPaths(L);
      // (The other holes' fairways, greens and tees read as theirs: they're
      // drawn in full over this hole's rough - sim/neighbours.mjs ownArea.)
      const lieAt = withOtherGround((x, z) => this.hole.lieAt(x, z), L.otherGround);
      const clear = (x, z) =>
        ["rough", "deep"].includes(lieAt(x, z)) &&
        tuftClearOfPaths(paths, x, z) &&
        !L.bunkers.some((b) => insideBlob(b, x, z, 1.2)) &&
        !L.water.some((w) => insideBlob(w, x, z, 1.2));
      const nearTee = (rand) => {
        const x = -10 + rand() * 90;
        const z = (rand() < 0.5 ? -1 : 1) * (12 + rand() * 30);
        return clear(x, z) ? toXZ(x, z) : null;
      };
      const nearGreen = (rand) => {
        const a = rand() * Math.PI * 2;
        const g = L.green;
        const out = rand() * 16;
        const r = Math.max(g.rx, g.rz) + 1.6 + 4 + out;
        // Few at first, fullest a few metres out, thinning again beyond.
        if (rand() > tuftChance(out)) return null;
        const x = g.x + Math.cos(a) * r;
        const z = g.z + Math.sin(a) * r;
        return clear(x, z) && !insideBlob(g, x, z, 5) ? toXZ(x, z) : null;
      };
      // (And whether it's in deep rough, whose colour it takes.)
      // (Their colours a links hole's: tuftMaterial's 2 - 4.)
      const deepCode = L.links === "green" ? 4 : L.links ? 2 : 1;
      const roughCode = L.links && L.links !== "green" ? 3 : 0;
      const toXZ = (x, z) => [z, -x, lieAt(x, z) === "deep" ? deepCode : roughCode];
      // Tufts all over the hole (the owner, of a links hole: "we need at
      // least 20x the amount of grass tufts"; and the same on parkland
      // holes): over its rough, and taller over its long grass - in
      // squares that thin with distance and drop out of sight (sim/
      // holetufts.mjs, look/groundbits.js tuftFieldMesh). Behind the Grass
      // all over the hole switch. (Placed on another core: placed at the end.)
      const tuftIn = this.tuftInput(L);
      if (tuftIn) {
        if (!tuftsJob) {
          yield "grass";
          const fields = yield* this.tuftsHere(tuftIn, L);
          yield* this.placeTuftsSteps(tuftIn, fields);
        }
      } else {
        this.world.add(makeGrassTufts(2500, nearTee, { seed: 3, groundY: this.worldHeight }));
        this.world.add(makeGrassTufts(2500, nearGreen, { seed: 4, groundY: this.worldHeight }));
      }
      // A links hole's long grass: taller tufts all along it, thickest out
      // past its rough, thinning in towards the fairway (a links hole from
      // a map: its own ground has no rolls to lay a field over).
      if (L.links && !tuftIn && L.path) {
        const linksPath = makePath(L.path);
        const fescue = (rand) => {
          const s = -20 + rand() * (linksPath.length + 60);
          const at = pointAt(linksPath, Math.min(linksPath.length, Math.max(0, s)));
          const out = L.treeLine - DEEP_ROUGH + (rand() ** 1.6) * (DEEP_ROUGH + 55);
          if (out < L.treeLine && rand() > 0.35) return null;
          const side = rand() < 0.5 ? -1 : 1;
          const x = at.p[0] - at.dir[1] * side * out + (rand() - 0.5) * 6;
          const z = at.p[1] + at.dir[0] * side * out + (rand() - 0.5) * 6;
          if (L.bunkers.some((b) => insideBlob(b, x, z, 1.5)) || L.water.some((w) => insideBlob(w, x, z, 1.5)) || insideBlob(L.green, x, z, 8)) return null;
          if (lieAt(x, z) !== "deep" || !tuftClearOfPaths(paths, x, z, true)) return null;
          return [z, -x, deepCode];
        };
        // (Knee-high and more: the owner, "much longer for links areas".)
        this.world.add(makeGrassTufts(EXTRA ? 16000 : 9000, fescue, { seed: 5, groundY: this.worldHeight, height: 0.95 }));
      }
    }

    yield "tufts and grass";
    this.ball = makeBall(BALL_R);
    this.world.add(this.ball);
    this.markers = new THREE.Group();
    this.world.add(this.markers);
    this.aimGroup = new THREE.Group();
    this.world.add(this.aimGroup);
    this.reliefGroup = new THREE.Group();
    this.world.add(this.reliefGroup);
    this.idealGroup = new THREE.Group();
    this.world.add(this.idealGroup);
    // On Ultra, the hole's divots and pitch marks, and its marks in the
    // sand, in the course's sand (look/marks.js); on Medium and up, what
    // its shots throw up (look/sprays.js).
    const sand = this.sandColour(L);
    this.marks = new Marks(this.world, (x, z) => toWorld(x, this.heightAt(x, z), z), { sand, surface: (x, z) => toWorld(x, this.surfaceHeight(x, z), z) });
    this.sprays = new Sprays(this.world, { sand });
    // Every shot on the hole keeps its tracer, everyone's, until the next
    // tee: the last one bright, the rest faint (look/tracer.js) - in this
    // hole's group. (Built ahead, the set is still the hole on show's: it's
    // moved over as this one's swapped in, swapIn.)
    this.tracer = null;
    if (!this.tracers) this.tracers = new TracerSet(this.world);
    else if (!this.prebuild) this.tracers.parent = this.world;
    this.grid = null;
    this.shade = null;
    // (Its own materials take the scene's reflections now, so a hole built
    // ahead has its shaders built as they'll be drawn.)
    applyReflections(this.scene, this.world);
    // The tufts, back from the other core (or placed here, a step at a
    // time: the hole there wasn't this one, or it took too long).
    if (tuftsJob) {
      const until = performance.now() + COUNTRY_WAIT;
      while (!tuftsJob.job.done && !hurried() && performance.now() < until) yield WAIT;
      const fields = result(tuftsJob.job)?.fields ?? (yield* this.tuftsHere(tuftsJob.input, L));
      yield* this.placeTuftsSteps(tuftsJob.input, fields);
      yield "the tufts (from another core)";
    }
    // The country, back from the other core (a while yet, and it's worked
    // out here instead: look/offload.js).
    if (country?.job) {
      const until = performance.now() + COUNTRY_WAIT;
      while (!country.job.done && !hurried() && performance.now() < until) yield WAIT;
      yield* this.placeCountrySteps(country);
      yield "the country (from another core)";
      yield* this.glimpseSteps(L);
      yield "the other holes' glimpses";
    }
    // On the phone, its small pieces that share a material drawn as one
    // (look/fewerdraws.js): fewer draws for its processor to send.
    if (PHONE) {
      this.mergedPieces = mergeSmallPieces(this.world);
      yield "fewer draws";
    }
    this.sceneStep(() => fitShadows(this.light, this.scene));
    // (Kept as a step of its own: the file's bytes are put together here.)
    if (this.bake?.changed) yield "keeping the hole for next time";
    this.bakeNote = this.closeBake();
  }
}
