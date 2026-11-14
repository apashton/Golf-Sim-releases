// A hole in 3D for the Challenges, drawn exactly as the course draws it:
// ground, fairway, green, bunkers, water, trees, cup and flag.
//
// Rather than copy the course's scenery code (and have the two drift apart),
// this borrows the course mode's own drawing methods. They only need the
// hole, the group to draw into, the scene and its sun, and the height
// helpers below, which is all this provides.

import * as THREE from "three";
import { CourseMode } from "./course.js";
import { toWorld } from "./scenery.js";
import { DEEP_ROUGH } from "./sim/course.mjs";

const course = CourseMode.prototype;

export class HoleScenery {
  // world: the group to draw into (emptied on each build). scene and light:
  // for the reflections and the shadow's reach. challenge: which Challenge
  // draws it ("driving" or "approach"), said outright so the course's
  // drawing never has to read course state it doesn't have here: the
  // Driving Challenge's hole, drawn to a player's drive, gets no glimpses
  // of other holes, no backdrop and no character of its own.
  constructor({ scene, world, light, challenge = "challenge" }) {
    this.scene = scene;
    this.world = world;
    this.light = light;
    this.challenge = challenge;
    this.hole = null;
    // (No course or round: the Challenges' holes stand on their own.)
    this.course = null;
    this.round = null;
    // (Never built ahead here: course.js prebuildNext.)
    this.prebuild = null;
  }

  heightAt(x, z) {
    return this.hole ? this.hole.heightAt(x, z) : 0;
  }
  worldHeight = (wx, wz) => this.heightAt(-wz, wx);
  drapeHeight = (wx, wz) => (this.hole?.baseHeightAt ?? this.hole.heightAt)(-wz, wx);
  worldGradient = (wx, wz) => {
    const [gx, gz] = this.hole.gradientAt(-wz, wx);
    return [gz, -gx];
  };
  worldNormal = (wx, wz) => {
    const [gx, gz] = this.worldGradient(wx, wz);
    return new THREE.Vector3(-gx, 1, -gz).normalize();
  };

  // Draws a prepared hole (courseplay.mjs prepareHole). Afterwards `ball`,
  // `pinWorld`, `markers` and `aimGroup` are there, as on the course.
  build(hole) {
    this.hole = hole;
    course.buildHoleScene.call(this);
  }
  // The same, a step at a time (sim/idlework.mjs).
  // (wait: its country worked out on another core - course.js
  // startCountry.)
  *buildSteps(hole, wait = false) {
    this.hole = hole;
    yield* course.buildHoleSteps.call(this, wait);
  }

  // A point in the hole's frame, on the ground (plus `lift`), in the world.
  at(x, z, lift = 0, out = new THREE.Vector3()) {
    return toWorld(x, this.heightAt(x, z) + lift, z, out);
  }

  // The same on what's drawn there (the course's surfaceHeight): for the
  // ball, which rests on the fairway's grass or down in the sand.
  ballAt(x, z, lift = 0, out = new THREE.Vector3()) {
    return toWorld(x, this.surfaceHeight(x, z, lift < 0.1) + lift, z, out);
  }
  worldSurface = (wx, wz) => this.surfaceHeight(-wz, wx);
}
// The course draws the deep rough from DEEP_ROUGH short of the tree line;
// a hole drawn to a player's drive (the driving challenge) scales that band
// with it (bandScale), so it's moved to match where it plays.
HoleScenery.prototype.deepRoughBand = function (path, from, to, side) {
  const k = this.hole?.layout.bandScale ?? 1;
  return course.deepRoughBand.call(this, path, typeof from === "function" ? from : from + DEEP_ROUGH * (1 - k), to, side);
};
// Everything else buildHoleScene and buildMappedGround call on `this` is
// borrowed too (test/holeview.test.mjs checks none is missed: one was, and
// the Challenges couldn't draw a hole from a map, nor start at all when they
// were the mode last used).
HoleScenery.prototype.buildMappedGround = course.buildMappedGround;
// The drawing's steps (course.js buildHoleSteps), letting go of the last
// hole's, and what it does to the scene as a whole - always at once here.
HoleScenery.prototype.buildHoleSteps = course.buildHoleSteps;
HoleScenery.prototype.disposeWorld = course.disposeWorld;
HoleScenery.prototype.sceneStep = course.sceneStep;
// Shading on the slopes round greens and in dug ground: only needs the
// height and slope helpers above. (Missing it broke all three Challenges;
// test/holeview.test.mjs now checks every method the course's drawing
// calls is here.)
HoleScenery.prototype.shadeSlopes = course.shadeSlopes;
HoleScenery.prototype.surfaceHeight = course.surfaceHeight;
// A shot's path as it's drawn, as on the course: its tracer, and the ball
// through the air.
HoleScenery.prototype.pathDrawn = course.pathDrawn;
HoleScenery.prototype.besideWall = course.besideWall;
HoleScenery.prototype.drawBrook = course.drawBrook;
HoleScenery.prototype.brookBanks = course.brookBanks;
// Cart paths are drawn if a hole has them (Challenges holes don't); signs
// never are: the driving challenge's holes are drawn to a player's drive,
// and yardage posts would be wrong for their scale.
HoleScenery.prototype.addPaths = course.addPaths;
// Worn grass (tracks off the tee, thin patches in the rough) as on the
// course; with no next hole, no track towards one.
HoleScenery.prototype.addWear = course.addWear;
// And what dresses the rough: heather, gorse, rocks, wildflowers, reeds.
HoleScenery.prototype.addDressing = course.addDressing;
// (And a links hole's ground: none on the Challenges' level holes, which
// have no rolls, but called all the same.)
HoleScenery.prototype.addLinksGround = course.addLinksGround;
HoleScenery.prototype.linksRollsOf = course.linksRollsOf;
// (By the sea only on a course: the Challenges have no shore.)
HoleScenery.prototype.onShore = course.onShore;
HoleScenery.prototype.shoreDown = course.shoreDown;
// The country past the trees, and the shade under them (look/country.js):
// scenery, so the Challenges' holes have it as the course's do.
HoleScenery.prototype.startCountry = course.startCountry;
HoleScenery.prototype.countryInput = course.countryInput;
HoleScenery.prototype.placeCountry = course.placeCountry;
HoleScenery.prototype.placeCountrySteps = course.placeCountrySteps;
// And the tufts all over the hole, placed on another core as on the course.
HoleScenery.prototype.tuftInput = course.tuftInput;
HoleScenery.prototype.startTufts = course.startTufts;
HoleScenery.prototype.offloadSite = course.offloadSite;
HoleScenery.prototype.bakeSite = course.bakeSite;
HoleScenery.prototype.placeTuftsSteps = course.placeTuftsSteps;
HoleScenery.prototype.keptTufts = course.keptTufts;
HoleScenery.prototype.tuftsHere = course.tuftsHere;
// (The next hole's cart paths, drawn with its own and kept off: none on
// a Challenge's hole.)
HoleScenery.prototype.nextTeePaths = course.nextTeePaths;
HoleScenery.prototype.nextTeeSight = course.nextTeeSight;
HoleScenery.prototype.pathsHere = course.pathsHere;
HoleScenery.prototype.grassPaths = course.grassPaths;
HoleScenery.prototype.nextTeeKeepOff = course.nextTeeKeepOff;
// And the ground sheets' heights, read there too.
HoleScenery.prototype.groundSheets = course.groundSheets;
// Their bunkers' look: golden sand and classic bunkers, with no course.
HoleScenery.prototype.sandLook = course.sandLook;
HoleScenery.prototype.sandColour = course.sandColour;
HoleScenery.prototype.startSheets = course.startSheets;
// What's kept of a hole once it's built (course.js openBake, look/bake.js):
// not for the Challenges' holes - the Driving Challenge's are drawn to
// each player's drive, so few would ever be built the same twice, and
// each kept would only fill the folder.
HoleScenery.prototype.openBake = function* () {
  this.bake = null;
};
HoleScenery.prototype.closeBake = course.closeBake;
// Nor are their trees kept (sim/treelock.mjs): a Challenge's hole has no
// course to keep them with.
HoleScenery.prototype.keepTreeLock = function () {};
HoleScenery.prototype.keepAnswer = course.keepAnswer;
HoleScenery.prototype.keptJob = course.keptJob;
// (Its country's seed from the Challenge and the hole, not a course.)
HoleScenery.prototype.countrySeed = function (L) {
  return (Math.imul((L.number ?? 1) + 1, 0x9e3779b1) ^ (this.challenge === "driving" ? 0x0d1e : 0xa99c)) >>> 0;
};
HoleScenery.prototype.characterOf = course.characterOf;
// Glimpses of other holes: on the Approach Ladder's holes, never on the
// Driving Challenge's (sim/country.mjs holeExtras).
HoleScenery.prototype.glimpseSteps = course.glimpseSteps;
// Nor a crop of a course's other holes (course/holescenery.js
// cropSurfaceSteps, Option C): the Challenges' holes stand alone, so the
// made-up glimpses stay.
HoleScenery.prototype.cropSurfaceSteps = function* () {
  return false;
};
// (No course here: the Challenges' own horizon, and no other holes' woods.)
HoleScenery.prototype.horizonSeed = function () {
  return this.challenge === "driving" ? 0x0d1e : 0xa99c;
};
HoleScenery.prototype.courseWoods = function () {
  return [];
};
// Nor a sea (sim/coast.mjs): the Challenges' holes are inland.
HoleScenery.prototype.shoreOf = function () {
  return null;
};
HoleScenery.prototype.shored = course.shored;
HoleScenery.prototype.inland = course.inland;
HoleScenery.prototype.nextLayout = function () {
  return null;
};
HoleScenery.prototype.nextTeeOf = function () {
  return null;
};
HoleScenery.prototype.addSignage = function () {};

// Where to look from a camera at `cam`, facing along `dir` (level, length
// one), so that the ball at `ball` sits `below` radians under the middle of
// the picture - the same place whatever lies beyond it, and clear of the
// numbers along the bottom in bay view. Returns `out`.
export function lookKeepingBall(cam, ball, dir, below, out = new THREE.Vector3()) {
  const flat = Math.hypot(ball.x - cam.x, ball.z - cam.z);
  const down = Math.atan2(cam.y - ball.y, flat) - below;
  const reach = 60;
  return out.copy(cam).addScaledVector(dir, Math.cos(down) * reach).add(new THREE.Vector3(0, -Math.sin(down) * reach, 0));
}
