// The driving range: flies each shot, shows the numbers, keeps the session.

import { windField, gustFor, windy, windArrow, arrowAngle, windWords, playsLike, flagYaw, SKY_KINDS, SKY_CHOICE_NAMES, cleanSky, rainingAt, hazeFor, dryFor } from "./sim/weather.mjs";
import * as THREE from "three";
import { simulateShot, YARD } from "./sim/flight.mjs";
import { shotGuide } from "./sim/swingguide.mjs";
import { mergeStatic, mergePlaced } from "./look/merge.js";
import { fadeBoard } from "./look/fadeboard.js";
import { BallShadow, blob, makeGrassTufts, makeBall, makeBallPyramid, makeBunker, makeFlag, makePond, makeRangeBalls, makeSign, toWorld, sizeBall } from "./scenery.js";
import { REAL_BALL_R, ballDrawRadius } from "./sim/ballsize.mjs";
import { addEnvironment, applyReflections, fitShadows, setSky, setSun } from "./look/environment.js";
import { sunFor, cleanTime, TIME_CHOICES, TIME_CHOICE_NAMES } from "./sim/daylight.mjs";
import { grassMaterial, edgeStrip, edgeMesh, rectangle, GRASS, LAYER } from "./look/grass.js";
import { lipMaterial, splashWater } from "./look/sandwater.js";
import { Sprays } from "./look/sprays.js";
import { sandPuff, waterSplash, spraySeed } from "./sim/sprays.mjs";
import { SAND_LIES } from "./sim/marks.mjs";
import { makeTrees, seeded } from "./look/trees.js";
import { makeWindsock } from "./look/windsock.js";
import { RANGE_SOCK } from "./sim/windsock.mjs";
import { rangeWoods } from "./sim/woods.mjs";
import { edgeDressing } from "./sim/dressing.mjs";
import { makeDressing } from "./look/dressing.js";
import { countryScene, withCountry, setCountry } from "./look/country.js";
import { playReach } from "./sim/country.mjs";
import { HIGH, PHONE } from "./look/quality.js";
import { nestClumps, makeNest, showNest, dropNest } from "./look/lienest.js";
import { stripDivots } from "./sim/wear.mjs";
import { makeDivots } from "./look/wear.js";
import { makeShotTracer, TracerSet } from "./look/tracer.js";
import { KEEP_RANGE, tracerColour, pathLifts } from "./sim/tracer.mjs";
import { PALETTE } from "./look/palette.js";
import { insideOutline } from "./sim/edgefield.mjs";
import { rangeNets, targetShape, bankHeight, pondBirds, DIVIDERS, PICKER, END_BANK, TARGET_BANK, BAYS, MAT, bayLayout } from "./sim/furniture.mjs";
import { makeBirds } from "./look/wildlife.js";
import { polygonArea } from "./sim/buildings.mjs";
import { makePracticeGround, makeBanks } from "./look/club.js";
import { loadSetting, saveSetting, fmt, lr, numberOr, esc } from "./util.js";
import { view, keepInView, sessionBallSize, BALL_RADIUS } from "./view.js";
import { greenEntry, greenView, greenFollow } from "./sim/greencam.mjs";
import { nextTarget, targetName } from "./sim/practice.mjs";
import { applyLie, describeLie, LIE_NAMES, drawSeverity } from "./sim/lie.mjs";
import { beforeLine, afterLine, lieOutcome } from "./sim/lieguide.mjs";
import { ownCarry } from "./owncarry.js";
import { BAG } from "./sim/clubs.mjs";
import { readyFan, withFlight, flightStep } from "./sim/preflight.mjs";
import { clubColor } from "./clubcolors.js";
import { clubShort } from "./sim/clubs.mjs";
import { clubDistances } from "./sim/rangesession.mjs";
import { audio } from "./audio/engine.js";
import { shotCues, soundscape, fowlOnWater, CueQueue } from "./audio/cues.mjs";
import { EYE } from "./sim/eye.mjs";
import { fitLens } from "./sim/upright.mjs";

const TARGETS = [50, 100, 150, 200, 250];
// The ball in the air: drawn larger than life (a real one is 0.0213 m) the
// higher it is, so it can be followed from the tee camera. On the mat,
// where it lands and rolls, and in the pyramids by the mats, a real ball
// (the owner: "on the floor, in any situation, make it realistic size":
// sim/ballsize.mjs).
export const RANGE_BALL_R = 0.06;
// (The bays' mats and pyramids of balls stand by the hitter's hand: sim/
// furniture.mjs bayLayout, PYRAMID_X; layBays below.)
// The golfer's eye, as on the course (sim/eye.mjs).
const TEE_CAMERA = new THREE.Vector3(0, EYE.up, EYE.back);
const TEE_LOOK = new THREE.Vector3(0, -EYE.drop, -90);
// The session view (S): high behind the tee, so every ball on the range
// spreads out instead of stacking up along the horizon.
const SESSION_CAMERA = new THREE.Vector3(0, 58, 34);
const SESSION_LOOK = new THREE.Vector3(0, 0, -125);
// The wind's directions on the range, as the golfer stands (degrees it
// comes from, the target line due north).
const RANGE_WINDS = [
  [0, "Into you"],
  [45, "Into you, from the right"],
  [90, "From the right"],
  [135, "Behind you, from the right"],
  [180, "Behind you (helping)"],
  [225, "Behind you, from the left"],
  [270, "From the left"],
  [315, "Into you, from the left"],
];

// Range stances to practise, at a fair 4 degrees.
const STANCES = {
  flat: { side: 0, slope: 0 },
  above: { side: 4, slope: 0 },
  below: { side: -4, slope: 0 },
  uphill: { side: 0, slope: 4 },
  downhill: { side: 0, slope: -4 },
};
const STANCE_NAMES = { flat: "Flat", above: "Ball above feet", below: "Ball below feet", uphill: "Uphill", downhill: "Downhill" };
// Every ball hit this session stays where it finished, in its club's colour.
const MAX_SESSION_BALLS = 2000;

// What's drawn on top where two range surfaces overlap.
const SURFACE_ORDER = ["water", "sand", "green", "fringe", "mat", "tee", "bank", "fairway"];

function boxOf(outline) {
  const xs = outline.map((p) => p[0]);
  const zs = outline.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)];
}

// A bunker's or pond's outline (userData.outline, in its own frame) where
// it has been put down on the range.
function placed(group) {
  group.updateMatrix();
  const v = new THREE.Vector3();
  return group.userData.outline.map(([x, z]) => (v.set(x, 0, z).applyMatrix4(group.matrix), [v.x, v.z]));
}

export class Range {
  // later: built when first come into rather than now (the phone app's
  // page plays one place: app.js buildLater).
  constructor(panel, renderer, { later = false } = {}) {
    this.panel = panel;
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    // Far enough out for every cloud (look/environment.js).
    this.camera = new THREE.PerspectiveCamera(EYE.lens, 1, 0.1, 6000);
    this.camera.position.copy(TEE_CAMERA);
    this.camera.lookAt(TEE_LOOK);
    this.look = TEE_LOOK.clone();
    this.settings = loadSetting("range", { surface: "fairway", temperatureC: 20, altitudeM: 0, target: 0, lie: "fairway", stance: "flat", windMph: 0, windFrom: 0, gusts: true, time: "any" });
    // The range used to fly at 18°C where the course, chipping and the shot
    // data screen fly at 20. A saved 18 was that old default rather than a
    // choice (every range setting saves them all), so it moves to 20 once.
    if (!this.settings.conditions) {
      if (this.settings.temperatureC === 18) this.settings.temperatureC = 20;
      this.settings.conditions = 2;
    }
    this.shots = [];
    // The session's tracers: the last twenty shots', the last one bright.
    this.tracers = new TracerSet(this.scene, { keep: KEEP_RANGE });
    // The colour of whoever's hitting (app.js), player 1's alone.
    this.hitterColour = () => tracerColour(0);
    this.flying = null;
    this.restTimer = 0;
    this.sessionView = false;
    this.targetText = "";
    this.onChange = () => {};
    this.unbuilt = later;
    if (!later) this.build();
    this.buildPanel();
  }

  // Coming in: built now if it waited (above).
  setActive(on) {
    if (!on || !this.unbuilt) return;
    this.build();
    this.showLieGuide();
  }

  // The range's light as it comes on show (app.js setMode: look/environment.js
  // useSun): its Time of day, its own each visit if any.
  sunNow() {
    return this.unbuilt ? null : sunFor(this.settings.time, this.skySeed);
  }

  build() {
    this.unbuilt = false;
    const s = this.scene;
    const { light, sun } = addEnvironment(s, this.renderer, { shadowSize: 90 });
    // The range's own sky, set in the Conditions panel (a fair day unless
    // it's been changed), with its own amount of cloud each visit (sim/
    // weather.mjs skyCover, from the visit's seed: none at all to plenty).
    this.skySeed = (Math.floor(Date.now() / 1000) % 999983) + 1;
    // And its time of day, as picked in the Conditions panel (sim/daylight.mjs
    // sunFor: any - its own each visit - a time of its own, or the clock's).
    setSun(sunFor(this.settings.time, this.skySeed));
    setSky(s, this.settings.sky, this.skySeed);
    this.light = light;
    this.ballShadow = new BallShadow(sun, RANGE_BALL_R);
    s.add(this.ballShadow.mesh);
    const rand = seeded(7);

    // The country past the range's woods painted over it, and the shade
    // under its trees (look/country.js; set once the trees are placed).
    const rough = new THREE.Mesh(new THREE.PlaneGeometry(3200, 3200), withCountry(grassMaterial(GRASS.rough)));
    rough.rotation.x = -Math.PI / 2;
    rough.receiveShadow = true;
    s.add(rough);

    // A wide mown strip down the middle, striped across like a real range.
    const length = 345 * YARD;
    const fairway = new THREE.Mesh(new THREE.PlaneGeometry(72, length), grassMaterial(GRASS.fairway));
    fairway.rotation.x = -Math.PI / 2;
    fairway.position.set(0, 0.01, -length / 2 + 4);
    fairway.receiveShadow = true;
    s.add(fairway);
    // Its edges fade raggedly into the rough.
    const [fz0, fz1] = [4, 4 - length];
    const fairEdge = edgeMesh(
      edgeStrip([[-36, fz0], [36, fz0], [36, fz1], [-36, fz1]], 4, () => 0.01),
      grassMaterial({ ...GRASS.fairway, edge: true }),
      LAYER.fairway,
    );
    s.add(fairEdge);
    // What's drawn where, and how high it lies: the ball, its shadow and the
    // session's balls sit on it (surfaceY). Filled in as the range is built.
    this.surfaces = [];
    const surface = (outline, y, kind = "ground") => this.surfaces.push({ outline, y, kind, box: boxOf(outline) });

    // The tee: a strip of short grass with a row of hitting mats, each with
    // its pyramid of balls.
    const tee = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), grassMaterial(GRASS.tee));
    tee.rotation.x = -Math.PI / 2;
    tee.position.set(0, 0.02, 2);
    tee.receiveShadow = true;
    s.add(tee);
    // Its edges fade raggedly into the rough and the fairway, as a course's
    // tee does, rather than drawing a hard line across the picture.
    // (Deeper than a course tee's: seen this low it's the front edge, a few
    // metres ahead, that crosses the picture.)
    s.add(edgeMesh(edgeStrip(rectangle(-20, -3, 20, 7), 6, () => 0.02), grassMaterial({ ...GRASS.tee, edge: true }), LAYER.tee));
    // Sand-filled divots in rows along the front of the strip, clear of the
    // mats (High only).
    if (HIGH) {
      const onStrip = (x, z) => (x > -20 && x < 20 && z > -3 && z < 7 ? "tee" : "rough");
      // (A mat reaches 1.1 m from its ball on the stance's side: MAT.)
      const mats = (x, z) => z > -0.6 && Math.abs(x - Math.round(x / 4) * 4) < 1.25 && Math.abs(x) <= 13;
      const divots = makeDivots(stripDivots(onStrip, { seed: 5, skip: mats }), (x, z) => [x, 0.02, z], { frameRot: Math.PI / 2 });
      if (divots) s.add(divots);
    }
    // Hitting mats: synthetic turf, a thin slab whose sides are a lighter
    // green (a dark side read as a black line along the front), with a
    // rubber tee.
    const matTop = new THREE.MeshLambertMaterial({ color: PALETTE.rangeMat });
    const matSide = new THREE.MeshLambertMaterial({ color: PALETTE.rangeMatEdge });
    const rubber = new THREE.MeshLambertMaterial({ color: PALETTE.rubber });
    // (Built piece by piece, then merged: one draw call per material for
    // all the bays, not one per mat face, tee and ball - look/merge.js.)
    // Each bay laid for a right-hander (sim/furniture.mjs bayLayout: the
    // ball on the right-hand side of its mat, the pyramid on the other
    // side), and the lot mirrored for a left-hander as they step up
    // (layBays).
    const lay = bayLayout("right");
    const bays = [];
    for (const x of BAYS) {
      // Box faces: +x, -x, +y (top), -y, +z, -z.
      const mat = new THREE.Mesh(new THREE.BoxGeometry(MAT.wide, 0.02, MAT.deep), [matSide, matSide, matTop, matSide, matSide, matSide]);
      mat.position.set(x + lay.mat.x, 0.03, lay.mat.z);
      mat.receiveShadow = true;
      bays.push(mat);
      if (x !== 0) {
        const tee = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.03, 8), rubber);
        tee.position.set(x, 0.055, 0);
        bays.push(tee);
      }
      // Its pyramid of balls, each the size of the ball on the mat, on the
      // grass on the other side of the mat from the stance, and nearer the
      // divider than the mat (the owner: "balls would usually be on the
      // other side of the mat. And move closer to the divider than the
      // mat"): 0.16 m from the divider.
      const pyramid = makeBallPyramid(REAL_BALL_R, x + 20, undefined, { fine: x === 0 && !PHONE });
      pyramid.position.set(x + lay.pyramid.x, 0.02, lay.pyramid.z);
      bays.push(pyramid);
    }
    this.bays = mergeStatic(bays, { name: "bays" });
    s.add(this.bays);
    // (And the mats' lie outlines, with the bays laid for the hand.)
    this.matHand = null;
    this.layBays("right");

    // Target greens of several shapes (kidney, peanut, oval: sim/furniture.mjs
    // targetShape) with a ragged collar of fringe, raised on a bank so they
    // read from the tee, a flag, and bunkers guarding some of them. A look
    // only: the range plays flat, and the ball (and the balls lying about)
    // sit on the mound where they're drawn.
    this.targetFlags = new Map();
    this.targetBoards = [];
    this.targetGreens = [];
    // Where the sand and the water are, for a ball's sound (outlines in the
    // world's ground plane, as placed - the same ones the surfaces use).
    this.bunkers = [];
    const fringeMat = grassMaterial(GRASS.fringe);
    // What never moves round the greens, shared and merged once they're all
    // placed (look/merge.js): the fringes, the flags' poles (and the thicker
    // poles that cast their shadows), and the grass lips round the bunkers -
    // one draw call each, not one per green, flag or bunker. Their own
    // materials were the same but for being separate copies. What waves (a
    // flag's cloth and its painted shadow), fades (the boards) or differs
    // green to green (each green mown in rings round its own flag, each
    // bunker's sand raked its own way) stays as it was.
    const fringes = [];
    const flagPoles = [];
    const lips = [];
    const lipMat = lipMaterial();
    const flagColors = PALETTE.rangeFlags;
    const H = TARGET_BANK.high;
    const banks = [];
    // An outline from a target's shape: [[x, z]] in the world round `pos`.
    const loop = (pos, r, n = 72) => Array.from({ length: n }, (_, k) => {
      const t = (k / n) * Math.PI * 2;
      return [pos.x + Math.cos(t) * r(t), pos.z - Math.sin(t) * r(t)];
    });
    const shapeOf = (pos, pts) => new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x - pos.x, -(z - pos.z))));
    TARGETS.forEach((yd, i) => {
      const side = [-12, 10, -8, 14, -4][i];
      const pos = new THREE.Vector3(side, 0, -yd * YARD);
      const radius = 6 + yd * 0.035;
      const shape = targetShape(i, radius);
      // Bunkers either side, front or back, varying by green: just off the
      // fringe, where the bank drops down into them.
      const guards = [
        [[1, 0.2]],
        [[-1, -0.3], [0.2, 1]],
        [[1, 0.5]],
        [[-1, 0.1], [0.8, -0.9]],
        [[1, -0.2]],
      ][i];
      const pits = guards.map(([gx, gz], j) => {
        const brx = 2.5 + yd * 0.012;
        const t = Math.atan2(-gz, gx);
        const out = shape.fringe(t) + brx * 0.85 + 0.4;
        return { x: Math.cos(t) * out, z: -Math.sin(t) * out, r: brx * 1.15, brx, seed: 60 + i * 5 + j };
      });
      const fringePts = loop(pos, shape.fringe);
      const greenPts = loop(pos, shape.r);
      const fringe = new THREE.Mesh(new THREE.ShapeGeometry(shapeOf(pos, fringePts)), fringeMat);
      fringe.rotation.x = -Math.PI / 2;
      fringe.position.copy(pos).setY(H + 0.03);
      fringe.receiveShadow = true;
      // Mown in rings round the flag.
      const green = new THREE.Mesh(new THREE.ShapeGeometry(shapeOf(pos, greenPts)), grassMaterial({ ...GRASS.green, stripeWidth: 1.6, mow: 2, centre: [pos.x, pos.z] }));
      green.rotation.x = -Math.PI / 2;
      green.position.copy(pos).setY(H + 0.05);
      green.receiveShadow = true;
      fringes.push(fringe);
      s.add(green);
      const bankAt = (dx, dz) => bankHeight(shape, dx, dz, pits);
      banks.push({ x: pos.x, z: pos.z, reach: shape.reach + 0.5, height: (dx, dz) => {
        const h = bankAt(dx, dz);
        // (Just under the fringe and green where they lie over it.)
        return h >= H - 1e-6 ? H - 0.02 : h;
      } });
      this.targetGreens.push({ x: pos.x, z: pos.z, r: Math.max(...fringePts.map(([x, z]) => Math.hypot(x - pos.x, z - pos.z))) });
      const flag = makeFlag({ color: flagColors[i], height: 2.4 });
      flag.position.copy(pos).setY(H + 0.05);
      flag.scale.setScalar(1 + yd / 120);
      s.add(flag);
      flagPoles.push(...flag.userData.poles);
      // Its yardage on a board behind it, towards the middle of the range,
      // in the same style as the boards down the side - big enough to read
      // from the tee, and a real thing the chase camera passes, not a
      // floating number that swells as it flies by.
      // (Off to the green's outer side, so from the tee the boards spread
      // out rather than standing one in front of the next; and it fades
      // away as the chase camera comes up to it - fadeBoards - so it never
      // blocks the view of where the ball came down.)
      const board = makeSign(`${yd}`, { width: 2 + yd / 50 });
      const bx = Math.sign(pos.x) * radius * 0.6;
      const bz = -radius * 0.85 - 3.5;
      board.position.set(pos.x + bx, bankAt(bx, bz), pos.z + bz);
      s.add(board);
      // Materials of its own (it fades on its own: fadeBoards), one per
      // material it had, and its pieces merged into one mesh each - four
      // draw calls a board, not nine (look/merge.js).
      const own = new Map();
      const mine = (m) => (own.has(m) ? own.get(m) : own.set(m, m.clone()).get(m));
      board.traverse((o) => {
        if (!o.isMesh) return;
        o.material = Array.isArray(o.material) ? o.material.map(mine) : mine(o.material);
      });
      const pieces = mergeStatic([...board.children]);
      board.clear();
      board.add(...pieces.children);
      this.targetBoards.push(board);
      surface(fringePts, H + 0.03, "fringe");
      surface(greenPts, H + 0.05, "green");
      // The bank round it: the ball sits on it where it's drawn.
      const bankPts = loop(pos, shape.bank);
      this.surfaces.push({ outline: bankPts, y: 0, yAt: (x, z) => bankAt(x - pos.x, z - pos.z) + 0.01, kind: "bank", box: boxOf(bankPts) });
      for (const p of pits) {
        const bunker = makeBunker(p.brx, 1.6 + yd * 0.008, { seed: p.seed });
        bunker.position.set(pos.x + p.x, 0, pos.z + p.z);
        bunker.rotation.y = rand() * Math.PI;
        s.add(bunker);
        lips.push(Object.assign(bunker.userData.lip, { material: lipMat }));
        surface(placed(bunker), 0.042, "sand");
        this.bunkers.push(placed(bunker));
      }
      this.targetFlags.set(yd, pos);
    });
    s.add(mergeStatic(fringes, { name: "fringes" }));
    // Each flag's pole in the first's materials (the same colours), so the
    // five are drawn as one.
    const [firstPole, firstShadow] = flagPoles;
    for (const o of flagPoles) o.material = o.material.colorWrite === false ? firstShadow.material : firstPole.material;
    // The banks, and the mound across the far end, in the range's grass.
    banks.push({
      x: 0,
      z: END_BANK.z,
      reach: END_BANK.depth / 2 + 1,
      halfX: END_BANK.half + 8,
      height: (dx, dz) => {
        const across = Math.max(0, Math.abs(dx) - END_BANK.half) / 8;
        const k = Math.max(0, 1 - Math.abs(dz) / (END_BANK.depth / 2)) * Math.max(0, 1 - across);
        return END_BANK.high * k * k * (3 - 2 * k);
      },
    });
    const endBankAt = (x, z) => banks.at(-1).height(x, z - END_BANK.z);
    s.add(makeBanks(banks, grassMaterial(GRASS.rough)));

    // Fairway bunkers where drives land, and a pond out on the left.
    for (const [x, yd, seed] of [
      [-30, 235, 71],
      [31, 265, 72],
      [-27, 290, 73],
    ]) {
      const bunker = makeBunker(6, 3.2, { seed });
      bunker.position.set(x, 0, -yd * YARD);
      bunker.rotation.y = Math.PI / 2;
      s.add(bunker);
      lips.push(Object.assign(bunker.userData.lip, { material: lipMat }));
      surface(placed(bunker), 0.042, "sand");
      this.bunkers.push(placed(bunker));
    }
    s.add(mergePlaced([...flagPoles, ...lips], { name: "flagpoles and lips" }));
    const pond = makePond(26, 8, { seed: 4 });
    pond.rotation.y = Math.PI / 2;
    pond.position.set(-49, 0, -120);
    s.add(pond);
    surface(placed(pond), 0.04, "water");
    surface([[-20, -3], [20, -3], [20, 7], [-20, 7]], 0.02, "tee");
    surface([[-36, fz0], [36, fz0], [36, fz1], [-36, fz1]], 0.01, "fairway");
    // The range's sound: open ground, a breeze, birds in the trees, and the
    // pond lapping when the camera's near it (its outline, as placed).
    this.pond = placed(pond);
    // What its shots throw up: sand from its bunkers, water from its pond
    // (look/sprays.js, Medium and up).
    this.sprays = new Sprays(s);
    this.soundscape = soundscape({ wind: 0.4, water: [{ points: this.pond, y: 0.04 }] });

    // Yardage boards down the left edge, facing the tee: merged, one draw
    // call for all their posts, one for their rails and backs, and one for
    // each board's painted face (look/merge.js).
    const sideBoards = [];
    for (let yd = 25; yd <= 325; yd += 25) {
      if (TARGETS.includes(yd)) continue;
      const sign = makeSign(`${yd}`, { width: 1.6 + yd / 70 });
      sign.position.set(-38.5, 0, -yd * YARD);
      sideBoards.push(sign);
    }
    s.add(mergeStatic(sideBoards, { name: "yardage boards" }));

    // A practice ground, not a field (sim/furniture.mjs, look/club.js):
    // ball-stop poles and netting down both sides at the front of the woods
    // and across the far end on its bank (the netting fading as the chase
    // camera comes near), low timber dividers between the bays, and the
    // ball-picker parked out on the field. None of it is in play.
    const boardZ = [];
    for (let yd = 25; yd <= 325; yd += 25) if (!TARGETS.includes(yd)) boardZ.push(-yd * YARD);
    const blocked = (x, z) =>
      [[0, 0], [1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]].some(([dx, dz]) => insideOutline(this.pond, x + dx, z + dz)) ||
      (x < -34 && boardZ.some((bz) => Math.abs(bz - z) < 1.5));
    const { poles, nets } = rangeNets(blocked);
    const onBank = ([x, z, ...rest]) => [x, z, ...rest.slice(0, 1), endBankAt(x, z)];
    s.add(
      makePracticeGround({
        poles: poles.map(onBank),
        nets: nets.map(([a, b]) => [[a[0], a[1], endBankAt(...a)], [b[0], b[1], endBankAt(...b)]]),
        dividers: DIVIDERS,
        picker: PICKER,
        high: HIGH,
      }),
    );

    // Ducks, or a pair of swans, on the pond, off the mown strip where the
    // balls come down (sim/furniture.mjs pondBirds, look/wildlife.js).
    const [pcx, pcz] = this.pond.reduce((a, [x, z]) => [a[0] + x / this.pond.length, a[1] + z / this.pond.length], [0, 0]);
    const birds = pondBirds([{ x: pcx, z: pcz, area: polygonArea(this.pond), inside: (x, z) => insideOutline(this.pond, x, z) }], {
      clearOf: (x) => Math.abs(x) >= 40,
      seed: 7,
      high: HIGH,
    });
    const flock = makeBirds(birds, (x, z) => [x, 0.04, z]);
    if (flock) s.add(flock);
    // And heard: each calls now and then from where it sits.
    this.soundscape.fowl = fowlOnWater(birds.map((b) => ({ kind: b.kind, at: [b.at[0], 0.04, b.at[1]] })));

    // Balls lying about from other people's shots - not in the pond or the
    // bunkers, nor on the target greens.
    s.add(
      makeRangeBalls(HIGH ? 2200 : 800, {
        surfaceY: (x, z) => {
          const at = this.surfaceAt(x, z);
          return ["water", "sand", "green", "fringe"].includes(at.kind) ? null : at.y;
        },
      }),
    );

    // Woods either side grown in stands, one to five deep, with bays,
    // gaps, a poplar line, blocks of conifers, specimen oaks out in the
    // rough, willows by the pond and a backstop at the end
    // (sim/woods.mjs rangeWoods).
    const trees = rangeWoods({ high: HIGH, seed: 7, pond: { x: -49, z: -120, rx: 4, rz: 13 } });
    const woods = makeTrees(trees, { seed: 7 });
    s.add(woods);
    if (woods.userData.feet) s.add(woods.userData.feet);
    // (And the far woods out in it: look/farwoods.js.)
    const country = countryScene({
      box: { x0: -1600, z0: -1600, size: 3200 },
      past: playReach({ box: { x0: -120, x1: 120, z0: -410, z1: 82 }, boxReach: 20 }),
      seed: 7,
      character: "parkland",
      trees: woods.userData.crowns.map((t) => [t.x, t.z, t.r]),
      near: woods.userData.kinds,
    });
    setCountry(rough.material, country.map);
    if (country.woods) s.add(country.woods);
    // The range's edges dressed as a course's rough is - heather, gorse,
    // rocks and wildflowers - and its pond with reeds and lily pads
    // (sim/dressing.mjs edgeDressing, in the hole frame: world (x, z) is
    // (z, -x) there). None of it is in play.
    const pondBox = this.pond.reduce((b, [x, z]) => ({ x0: Math.min(b.x0, -z - 1), x1: Math.max(b.x1, -z + 1), z0: Math.min(b.z0, x - 1), z1: Math.max(b.z1, x + 1) }), { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity });
    const rangeLie = (hx, hz) => {
      const [wx, wz] = [hz, -hx];
      if (insideOutline(this.pond, wx, wz)) return "water";
      return Math.abs(wx) >= 41 && Math.abs(wx) <= 110 && wz <= 12 && wz >= -365 ? "rough" : "fairway";
    };
    const dressed = edgeDressing({
      lieAt: rangeLie,
      zones: [{ x0: -8, x1: 360, z0: 41, z1: 66 }, { x0: -8, x1: 360, z0: -66, z1: -41 }],
      trees: trees.map(([x, z]) => [-z, x]),
      seed: 7,
      heather: 10,
      gorse: 8,
      rocks: 14,
      flowers: 6,
      ponds: [{ ...pondBox, level: 0.04 }],
    });
    s.add(makeDressing(dressed, () => 0, { high: HIGH, seed: 7 }));
    // A windsock beside the tee line, at the edge of the tee camera's
    // picture (sim/windsock.mjs, look/windsock.js).
    const sock = makeWindsock({ seed: 7 });
    sock.position.set(RANGE_SOCK[0], 0, RANGE_SOCK[1]);
    s.add(sock);
    // Longer grass in the rough either side of the tee, where the camera is
    // low - thinning out towards the fairway, so it never stands as a hedge.
    if (HIGH) {
      s.add(
        makeGrassTufts(4000, (r) => {
          const side = r() < 0.5 ? -1 : 1;
          const out = r() * 22;
          if (r() > 0.35 + out / 12) return null;
          return [side * (39 + out), 8 - r() * 110];
        }),
      );
    }

    // Custom target flag for target practice at distances without a green.
    this.customFlag = makeFlag({ color: PALETTE.targetFlag, height: 2.4 });
    this.customFlag.scale.setScalar(2.5);
    this.customFlag.visible = false;
    s.add(this.customFlag);

    this.ball = makeBall(RANGE_BALL_R);
    this.ballR = sizeBall(this.ball, REAL_BALL_R);
    this.ball.position.set(0, REAL_BALL_R + this.surfaceAt(0, 0).y, 0);
    s.add(this.ball);
    // Lie practice: the ball in a patch of the lie it's played from.
    this.liePatch = new THREE.Group();
    s.add(this.liePatch);
    this.showLiePatch();
    // The session's balls, drawn bigger than life so a 200-yard ball still
    // shows from the tee; unlit, so the club colours stay true.
    this.sessionBalls = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
      MAX_SESSION_BALLS,
    );
    this.sessionBalls.count = 0;
    // Its colours there from the start: a colour given at the first ball
    // (setColorAt) made a new shader for it then, a freeze as it landed.
    this.sessionBalls.setColorAt(0, new THREE.Color(0xffffff));
    this.sessionBalls.frustumCulled = false;
    s.add(this.sessionBalls);
    // Where each one lies and how big it's drawn from the tee; nearer the
    // camera it's drawn smaller (see sizeSessionBalls).
    this.sessionSpots = [];
    // A ring round the last one: over the ground's see-through edges and
    // pulled forward over the greens it lies on.
    this.lastRing = new THREE.Mesh(
      new THREE.RingGeometry(1, 1.25, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false,
        polygonOffset: true, polygonOffsetFactor: -10, polygonOffsetUnits: -16,
      }),
    );
    this.lastRing.renderOrder = 3;
    this.lastRing.visible = false;
    s.add(this.lastRing);
    applyReflections(s);
    fitShadows(this.light, s);
    this.placeTarget();
  }

  // The surface drawn at world (x, z): { kind, y } - the rough, at 0, if
  // nothing else.
  surfaceAt(x, z) {
    let best = null;
    for (const s of this.surfaces) {
      const [x0, z0, x1, z1] = s.box;
      if (x < x0 || x > x1 || z < z0 || z > z1) continue;
      if (best && SURFACE_ORDER.indexOf(s.kind) >= SURFACE_ORDER.indexOf(best.kind)) continue;
      if (insideOutline(s.outline, x, z)) best = s;
    }
    if (best?.yAt) return { kind: best.kind, y: best.yAt(x, z) };
    return best ?? { kind: "rough", y: 0 };
  }

  buildPanel() {
    this.panel.innerHTML = `
      <section class="numbers" id="range-numbers" data-cc="off">
        ${["Carry", "Total", "Offline", "Ball speed", "Launch", "Direction", "Spin", "Spin axis", "Apex", "Descent"]
          .map((n) => `<div class="stat"><span>${n}</span><b data-k="${n}">-</b></div>`)
          .join("")}
      </section>
      <section class="target-result" id="range-target" data-cc="off"></section>
      <section class="lie-guide" id="range-lie-guide" data-cc="off"></section>
      <section class="odd-shot" data-cc="off"><button id="range-odd" title="Mark the last shot thin, fat or topped, or take it out of your stats as a misread (Delete does that straight away)">Last shot thin, fat or a misread?</button></section>
      <section>
        <h3>Dispersion <small>(this session)</small></h3>
        <canvas id="range-plot" width="320" height="360"></canvas>
      </section>
      <section>
        <h3>By club</h3>
        <table class="clubs" id="range-clubs"></table>
      </section>
      <section class="settings">
        <h3>Practice</h3>
        <label>Target <select id="range-target-select">
          <option value="0">None - free hitting</option>
          ${[30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 225, 250]
            .map((y) => `<option value="${y}">${y} yds</option>`)
            .join("")}
          <option value="-1">Random each shot</option>
        </select></label>
        <label>Hit from <select id="range-lie">
          ${["fairway", "semi", "rough", "deep", "waste", "bunker", "greenside"].map((l) => `<option value="${l}">${LIE_NAMES[l]}</option>`).join("")}
        </select></label>
        <label>Stance <select id="range-stance">
          ${Object.entries(STANCE_NAMES).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}
        </select></label>
        <h3>Conditions</h3>
        <label>Ground <select id="range-surface">
          <option value="fairway">Fairway</option><option value="firm">Firm</option>
          <option value="soft">Soft</option><option value="rough">Rough</option>
        </select></label>
        <label title="The wind on the range, in mph (0 for none). It carries the ball as it does outside - more the higher it flies">Wind mph <input id="range-wind" type="number" min="0" max="40" step="1"></label>
        <label title="Where the wind comes from, as you stand on the mat">From <select id="range-wind-from">
          ${RANGE_WINDS.map(([deg, name]) => `<option value="${deg}">${name}</option>`).join("")}
        </select></label>
        <label title="The range's sky: only a look - the Ground setting is how it plays">Sky <select id="range-sky">
          ${SKY_KINDS.map((k) => `<option value="${k}">${SKY_CHOICE_NAMES[k]}</option>`).join("")}
        </select></label>
        <label title="The range's light: the sun's height and colour, and where your shadow falls - only a look">Time of day <select id="range-time">
          ${TIME_CHOICES.map((k) => `<option value="${k}">${k === "any" ? "Any - a surprise each visit" : TIME_CHOICE_NAMES[k]}</option>`).join("")}
        </select></label>
        <label>Temperature °C <input id="range-temp" type="number" min="-10" max="45" step="1"></label>
        <label>Altitude m <input id="range-alt" type="number" min="0" max="3500" step="50"></label>
        <label title="Humid air is a little thinner: 0 for dry air">Humidity % <input id="range-hum" type="number" min="0" max="100" step="5"></label>
        <button id="range-overview" data-head title="All this session's balls, from above (S)">Session view</button>
        <button id="range-clear">Clear session</button>
      </section>`;
    const $ = (id) => this.panel.querySelector(id);
    const surface = $("#range-surface");
    const temp = $("#range-temp");
    const alt = $("#range-alt");
    const hum = $("#range-hum");
    const wind = $("#range-wind");
    const windFrom = $("#range-wind-from");
    const sky = $("#range-sky");
    sky.value = cleanSky(this.settings.sky);
    const time = $("#range-time");
    time.value = cleanTime(this.settings.time);
    wind.value = this.settings.windMph ?? 0;
    windFrom.value = String(this.settings.windFrom ?? 0);
    const target = $("#range-target-select");
    surface.value = this.settings.surface;
    temp.value = this.settings.temperatureC;
    alt.value = this.settings.altitudeM;
    hum.value = this.settings.humidity ?? 0;
    target.value = String(this.settings.target);
    const lie = $("#range-lie");
    const stance = $("#range-stance");
    lie.value = this.settings.lie in LIE_NAMES ? this.settings.lie : "fairway";
    stance.value = this.settings.stance in STANCES ? this.settings.stance : "flat";
    const save = () => {
      this.settings.surface = surface.value;
      // A box left empty (or with nonsense in it) keeps what it had.
      this.settings.temperatureC = numberOr(temp.value, this.settings.temperatureC, -10, 45);
      this.settings.altitudeM = numberOr(alt.value, this.settings.altitudeM, 0, 3500);
      this.settings.humidity = numberOr(hum.value, this.settings.humidity ?? 0, 0, 100);
      temp.value = this.settings.temperatureC;
      alt.value = this.settings.altitudeM;
      hum.value = this.settings.humidity;
      this.settings.windMph = numberOr(wind.value, this.settings.windMph ?? 0, 0, 40);
      wind.value = this.settings.windMph;
      this.settings.windFrom = Number(windFrom.value) || 0;
      this.settings.sky = cleanSky(sky.value);
      this.settings.time = cleanTime(time.value);
      setSun(sunFor(this.settings.time, this.skySeed));
      setSky(this.scene, this.settings.sky);
      this.settings.target = Number(target.value);
      this.settings.lie = lie.value;
      this.settings.stance = stance.value;
      saveSetting("range", this.settings);
      this.showLiePatch();
      this.placeTarget();
      this.showLieGuide();
    };
    for (const el of [surface, temp, alt, hum, wind, windFrom, sky, time, target, lie, stance]) el.addEventListener("change", save);
    $("#range-odd").addEventListener("click", (e) => {
      e.target.blur();
      this.onOddShot?.();
    });
    $("#range-overview").addEventListener("click", (e) => {
      this.toggleSessionView();
      e.target.blur();
    });
    $("#range-clear").addEventListener("click", () => this.clearSession());
    this.renderSession();
    this.showLieGuide();
  }

  // Clear session: every shot, ball and tracer gone - the session ended
  // first (end), unless it's only cleared from sight.
  clearSession({ end = true } = {}) {
    if (end && this.shots.length) this.onSessionEnd?.();
    this.shots = [];
    // (Not built yet: no balls or lines out there - the constructor's later.)
    if (this.unbuilt) return this.renderSession();
    this.sessionBalls.count = 0;
    this.sessionSpots = [];
    this.lastBall = null;
    this.lastRing.visible = false;
    this.tracers.clear();
    this.renderSession();
  }

  // T: the target steps through a few distances (none, 50 to 250 yds, a
  // random one each shot), so it can be changed from the mat.
  cycleTarget() {
    this.settings.target = nextTarget(this.settings.target);
    const select = this.panel.querySelector("#range-target-select");
    if (select) select.value = String(this.settings.target);
    saveSetting("range", this.settings);
    this.placeTarget();
    this.onToast(targetName(this.settings.target), 1800);
    this.onChange();
  }

  // Where the current target is, in yards down the line and yards right.
  placeTarget() {
    const t = this.settings.target;
    if (t === 0) {
      this.target = null;
    } else {
      // A random target: 40 to 220 yds, or in a practice plan's band.
      const [lo, hi] = this.planBand ?? [40, 220];
      const yd = t === -1 ? lo + Math.round((Math.random() * (hi - lo)) / 5) * 5 : t;
      const onGreen = this.targetFlags.get(yd);
      const right = onGreen ? onGreen.x / YARD : 0;
      this.target = { yards: yd, right };
    }
    this.customFlag.visible = !!this.target && !this.targetFlags.has(this.target.yards);
    if (this.customFlag.visible) this.customFlag.position.copy(toWorld(this.target.yards * YARD, 0, 0));
    const el = this.panel.querySelector("#range-target");
    if (el) el.innerHTML = this.target ? `Target: <b>${this.target.yards} yds</b>` : "";
    this.targetText = "";
    this.onChange();
  }

  onShot(entry) {
    // A new shot before the last one stopped: settle the last one first.
    if (this.flying) this.finishFlight();
    // The launch monitor's numbers, then as they come off this lie - each
    // strike somewhere in its range.
    const lie = this.settings.lie;
    const stance = STANCES[this.settings.stance] ?? STANCES.flat;
    const severity = drawSeverity();
    const b = applyLie(entry.ball, { lie, stance, club: entry.club, severity });
    // The range's wind (its gust for this shot), the target line due north.
    const w = this.wind;
    const result = simulateShot(b, { ...this.settings, wind: w ? windField(gustFor(w, Math.round(b.speedMph * 1000 + b.totalSpin)), 0) : undefined });
    const shot = { ...entry, ball: b, measured: entry.ball, result };
    // The flight it flew (its lie, the wind, the air), for the recording's
    // and the command centre's flight path (sim/shotflight.mjs).
    this.onFlight?.({ path: result.path, flightPoints: result.flightPoints });
    // What the lie did, against the same numbers off the fairway.
    const outcome = lieOutcome(entry.ball, { lie, stance, club: entry.club, severity });
    shot.lieAfter = afterLine(lie, stance, outcome, { carry: result.carry });
    shot.lie = lie;
    shot.stance = this.settings.stance;
    if (this.target) {
      const dx = result.total - this.target.yards;
      const dz = result.offline - this.target.right;
      shot.target = { ...this.target, miss: Math.hypot(dx, dz), long: dx, right: dz };
    }
    this.shots.push(shot);
    // Only the newest shots' flights are drawn. The older ones keep their
    // numbers for the session's chart and averages, but not the few hundred
    // points of their flight (tens of kilobytes each).
    const old = this.shots[this.shots.length - 1 - KEEP_RANGE];
    if (old) delete old.result.path;
    this.startFlight(shot);
    this.showNumbers(shot);
    this.showLieGuide();
    this.record(shot);
  }

  // The range's wind ({ mph, from, gust }), or null for none: set in the
  // panel (or the menu's Ball flight page), gusting a little shot to shot.
  // The swing pad's two lines at the target (sim/swingguide.mjs): its
  // distance, and what it plays like in the range's wind and air and from
  // its lie - null with no target. club: the one in hand.
  swingGuide(club) {
    if (!this.target || this.flying) return null;
    return shotGuide({ flagYards: this.target.yards, lie: this.settings.lie, club, wind: this.wind, bearing: 0, temperatureC: this.settings.temperatureC });
  }

  get wind() {
    const mph = Number(this.settings.windMph) || 0;
    return mph > 0 ? { mph, from: Number(this.settings.windFrom) || 0, gust: 0.15 } : null;
  }

  // Where the camera will go while this shot flies, for which trees are
  // drawn near (look/trees.js updateTreeDetail): the chase camera follows
  // the ball, so its flight, as world [x, z] points - the same array for as
  // long as it lasts - with the fan it was got ready for. Between shots
  // that fan: down the range to its end bank, either side of straight, so
  // the trees a shot will pass are made near while the ball waits, not as
  // it's struck (sim/preflight.mjs).
  treePath() {
    this.ready ??= readyFan(null, { spot: "mat", from: [0, 0], aim: 0, length: -END_BANK.z, phone: PHONE });
    const f = this.flying;
    if (!f) return this.ready.paths;
    return (f.treePath ??= withFlight(this.ready.paths, f.shot.result.path.filter((_, i, a) => i % 4 === 0 || i === a.length - 1).map(([x, , z]) => [z, -x])));
  }

  // The range's wind, for the scenery (app.js's frame): its flags, clouds
  // and pond show it as a course's do (look/weatherlook.js) - limp in a
  // calm, streaming in a strong wind, on the gust clock.
  // Its sky goes with it: a shower comes or goes only between shots.
  sceneryWind() {
    const w = this.wind;
    const kind = cleanSky(this.settings.sky);
    const t = this.settings.temperatureC;
    if (!this.flying || this.showerKind !== kind) {
      this.showerKind = kind;
      this.raining = rainingAt(kind, 7, this.shots.length);
    }
    const sky = { kind, seed: this.skySeed, raining: this.raining, haze: hazeFor(kind, t), dry: dryFor(kind, t) };
    return w ? { mph: w.mph, yaw: flagYaw(w, 0), seed: 7, sky } : { mph: 0, yaw: flagYaw({ from: Number(this.settings.windFrom) || 0 }, 0), seed: 7, sky };
  }

  // For the player's stats (recorder.js). A club check that finds it was
  // another club moves the ball to that club here too.
  record(shot) {
    // (The phone's session card counts it as it's hit: phonerange.js.)
    this.onSession?.(this.shots);
    const r = shot.result;
    const t = shot.target;
    this.onRecord?.({
      club: shot.club,
      ball: shot.measured,
      result: { carry: r.carry, total: r.total, offline: r.offline, apex: r.apex, descent: r.descentAngle },
      target: t ? { distance: t.yards, finish: t.miss, long: t.long } : undefined,
      intended: t?.yards,
      lie: this.settings.lie,
      // A sloping stance changes the carry: kept out of the club's numbers.
      uneven: this.settings.stance !== "flat" || windy(this.wind) || undefined,
      // The air it flew in: the stats keep it when it isn't the 20°C at sea
      // level every other mode flies in.
      air: { temperatureC: this.settings.temperatureC, altitudeM: this.settings.altitudeM, humidity: this.settings.humidity ?? 0, ...(this.wind ? { windMph: this.wind.mph, windFrom: this.wind.from } : {}) },
      onFix: (club) => {
        shot.club = club;
        this.renderSession();
      },
      // Taken out as a misread (or put back): out of the session's
      // averages and chart too.
      onMark: (say) => {
        shot.removed = say === "misread";
        this.renderSession();
      },
    });
  }

  startFlight(shot) {
    // Its tracer, in the hitter's colour, through the air and then along
    // the ground on whatever it rolls over (a target green stands proud of
    // the range); the earlier ones stay, faint in their hitters' colours.
    const r = shot.result;
    // The flight is flown over flat ground; the greens it passes over stand
    // proud. Lifted smoothly from the tee to where it lands (sim/tracer.mjs
    // pathLifts), not over every green and bank on the way, which made the
    // ball and its line bob up and down.
    const lifts = pathLifts(r.path, r.flightPoints, (x, z) => this.surfaceAt(z, -x).y);
    const drawn = r.path.map((p, i) => [p[0], p[1] + lifts[i], p[2], p[3]]);
    const place = (p) => toWorld(p[0], p[1], p[2]);
    const tracer = this.tracers.add(makeShotTracer(drawn, r.flightPoints, place, { colour: this.hitterColour() }));

    // Its sounds as the ball gets there: landing and each bounce, on a
    // target green or the range's ground.
    const cues = new CueQueue(shotCues(r, { lieAt: (x, z) => this.groundAt(x, z) }));
    // Run onto a target green: the camera closes in there as it comes on,
    // to see how near its flag it stops (sim/greencam.mjs), as on the course.
    this.flying = { shot, drawn, elapsed: 0, index: 0, tracer, cues, green: this.greenWatch(r) };
    showNest(this.nest, false);
    this.restTimer = 0;
    this.growLastBall();
  }

  update(dt) {
    // What the shots threw up, flying and falling back.
    this.sprays?.step(dt);
    const f = this.flying;
    if (f) {
      // A shot's first moments: its first picture with the ball on the
      // mat, then no frame's step longer than a normal one's until it's on
      // its way - the camera with it (sim/preflight.mjs).
      dt = flightStep(f.elapsed, dt, { first: !f.started });
      f.started = true;
      f.elapsed += dt;
      const path = f.shot.result.path;
      while (f.index < path.length - 1 && path[f.index + 1][3] <= f.elapsed) f.index++;
      // In the air, along the tracer's smooth line; on the ground, on
      // whatever it's rolling over (or under the pond).
      const air = f.index < f.shot.result.flightPoints - 1;
      const pts = air ? f.drawn : path;
      const a = pts[f.index];
      const b = pts[Math.min(f.index + 1, path.length - 1)];
      const span = b[3] - a[3] || 1;
      const k = Math.min(1, Math.max(0, (f.elapsed - a[3]) / span));
      const px = a[0] + (b[0] - a[0]) * k;
      const pz = a[2] + (b[2] - a[2]) * k;
      toWorld(px, a[1] + (b[1] - a[1]) * k, pz, this.ball.position);
      this.ballR = sizeBall(this.ball, ballDrawRadius({ air, height: a[1] + (b[1] - a[1]) * k, flight: RANGE_BALL_R }));
      this.ball.position.y += air ? this.ballR : this.ballLift(this.ball.position);
      for (const c of f.cues.due(f.elapsed)) {
        audio.cue(c, this.ball.position);
        // Rings spreading where it goes in (Ultra), and a splash; a puff
        // where it lands in a bunker (look/sprays.js).
        const at = new THREE.Vector3(this.ball.position.x, this.ball.position.y - this.ballR, this.ball.position.z);
        if (c.kind === "splash" || (c.kind === "land" && c.lie === "water")) {
          splashWater(this.ball.position.x, this.ball.position.z, c.speed);
          at.y = 0.04;
          this.sprays?.throw(at, waterSplash(c, spraySeed(c.at[0], c.at[2], 2)));
        } else if (c.kind === "land" && SAND_LIES.has(c.lie)) {
          // (Heading the way it flew: from where it was hit to here.)
          const [hx, hz] = [c.at[0] - path[0][0], c.at[2] - path[0][2]];
          const len = Math.hypot(hx, hz) || 1;
          this.sprays?.throw(at, sandPuff(c, [hz / len, -hx / len], spraySeed(c.at[0], c.at[2], 3 + (c.bounce ?? 0))));
        }
      }
      f.tracer.userData.reveal(f.index, k);
      const p = this.ball.position;
      if (view.follow && f.green && f.elapsed >= f.green.t) {
        // Run onto a target green: in close, low, behind the line
        // (following a ball still running up) - the ball, where it stops
        // and the flag all in the picture.
        const g = f.green.view;
        const { cam: [cx, cz], look: [lx, lz] } = greenFollow([px, pz], g);
        const c = toWorld(cx, 0, cz);
        c.y = this.surfaceAt(c.x, c.z).y + g.up;
        this.camera.position.lerp(c, 1 - Math.exp(-dt * 2.2));
        const l = toWorld(lx, 0, lz);
        l.y = this.surfaceAt(l.x, l.z).y;
        this.look.lerp(l, 1 - Math.exp(-dt * 3));
      } else if (view.follow) {
        // Chase camera: rises with the ball and stays behind it.
        const want = new THREE.Vector3(p.x * 0.7, Math.max(2.5, p.y * 0.7 + 3), p.z + 28 + p.y * 0.3);
        if (want.z > TEE_CAMERA.z) want.z = TEE_CAMERA.z;
        this.camera.position.lerp(want, 1 - Math.exp(-dt * 1.6));
        this.look.lerp(p, 1 - Math.exp(-dt * 5));
      } else {
        // Staying put: turn only as far as keeps the ball in view.
        const [cam, look] = this.home();
        this.camera.position.lerp(cam, 1 - Math.exp(-dt * 2.5));
        this.look.lerp(keepInView(this.camera.position, look, p, new THREE.Vector3()), 1 - Math.exp(-dt * 4));
      }
      if (f.index >= path.length - 1) this.finishFlight();
    } else if (this.restTimer > 0) {
      this.restTimer -= dt;
      if (this.restTimer <= 0) {
        this.ballR = sizeBall(this.ball, REAL_BALL_R);
        this.ball.position.set(0, REAL_BALL_R + this.surfaceAt(0, 0).y, 0);
        showNest(this.nest, true);
        // The next ball down on the mat, heard.
        audio.teeUp(this.ball.position);
        // Cut back rather than flying back down the tracer.
        const [cam, look] = this.home();
        this.camera.position.copy(cam);
        this.look.copy(look);
        this.growLastBall();
        if (this.settings.target === -1) this.placeTarget();
      }
    } else {
      const [cam, look] = this.home();
      this.camera.position.lerp(cam, 1 - Math.exp(-dt * 2.5));
      this.look.lerp(look, 1 - Math.exp(-dt * 2.5));
    }
    this.camera.lookAt(this.look);
    this.ballShadow.update(this.ball.position, (x, z) => this.surfaceAt(x, z).y, this.ballR);
    this.sizeSessionBalls();
    this.fadeBoards();
  }

  // The target greens' boards fade out as the camera comes within about
  // 35 m and are gone inside 15 m, as the tracer does close up: a board
  // the chase camera comes down beside otherwise filled the middle of the
  // picture and hid the green beyond. Its shadow stays (look/fadeboard.js).
  fadeBoards() {
    const cam = this.camera.position;
    for (const board of this.targetBoards ?? []) {
      const d = Math.hypot(board.position.x - cam.x, board.position.z - cam.z);
      const a = Math.min(1, Math.max(0, (d - 15) / 20));
      fadeBoard(board, a);
    }
  }

  // How far above the path's height the ball's centre is drawn: its radius
  // above whatever it's on - or, in the pond, gone under.
  ballLift(p) {
    const at = this.surfaceAt(p.x, p.z);
    return at.kind === "water" && p.y < 0.2 ? at.y - 0.1 : at.y + REAL_BALL_R;
  }

  // The session's balls are drawn big enough to see from the tee
  // (sessionBallSize in view.js), which up close (the chase camera coming
  // down by one) is the size of a beach ball: nearer the camera they
  // shrink, to a few pixels across. The one the chase camera has just
  // stopped behind is drawn at the real ball's size, tucked inside it,
  // until the camera is back at the tee (growLastBall).
  sizeSessionBalls() {
    const cam = this.camera.position;
    if (this.sizedFrom && this.sizedFrom.distanceToSquared(cam) < 0.25) return;
    (this.sizedFrom ??= new THREE.Vector3()).copy(cam);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    this.sessionSpots.forEach(({ at, on, closeUp }, i) => {
      const size = sessionBallSize(at.length(), { closeUp });
      const s = closeUp ? size : Math.min(size, Math.max(0.05, at.distanceTo(cam) * 0.006));
      // On what it finished on; in the pond, half under the water.
      const y = on.kind === "water" ? on.y : on.y + (closeUp ? BALL_RADIUS : s * 0.8);
      this.sessionBalls.setMatrixAt(i, m.compose(v.set(at.x, y, at.z), q, new THREE.Vector3(s, s, s)));
      if (i === this.sessionSpots.length - 1) this.lastRing.scale.setScalar(s * 2.2);
    });
    this.sessionBalls.instanceMatrix.needsUpdate = true;
  }

  // What a ball lands on, for its sound (physics frame): the pond, a
  // bunker, a target green, or the ground the range is set to.
  groundAt(x, z) {
    const w = toWorld(x, 0, z);
    if (insideOutline(this.pond, w.x, w.z)) return "water";
    if (this.bunkers.some((b) => insideOutline(b, w.x, w.z))) return "bunker";
    if (this.targetGreens.some((g) => Math.hypot(w.x - g.x, w.z - g.z) < g.r)) return "green";
    return this.settings.surface === "rough" ? "rough" : "fairway";
  }

  // The close look at the target green a shot runs onto, or null: when to
  // close in and where to stand, in the range's own frame (x down the
  // range, z right), the flag at the green's middle.
  greenWatch(r) {
    const on = greenEntry(r.path, { flightPoints: r.flightPoints, onGreen: (x, z) => this.groundAt(x, z) === "green" });
    if (!on) return null;
    const w = toWorld(on.at[0], 0, on.at[1]);
    const g = this.targetGreens.find((t) => Math.hypot(w.x - t.x, w.z - t.z) < t.r);
    if (!g) return null;
    const end = r.path.at(-1);
    return { t: on.t, view: greenView({ from: [0, 0], touch: on.at, rest: [end[0], end[2]], pin: [-g.z, g.x] }) };
  }

  // Where the camera rests between shots: at the tee, or up high looking
  // over the session's balls.
  home() {
    return this.sessionView ? [SESSION_CAMERA, SESSION_LOOK] : [TEE_CAMERA, TEE_LOOK];
  }

  // S: the session view on and off.
  toggleSessionView() {
    this.sessionView = !this.sessionView;
    this.onToast(this.sessionView ? `Session view - ${this.shots.length} ${this.shots.length === 1 ? "ball" : "balls"}` : "Tee view", 1500);
    return this.sessionView;
  }

  finishFlight() {
    const f = this.flying;
    this.flying = null;
    f.tracer.userData.revealAll();
    this.markLanding(f.shot);
    this.showLieGuide();
    this.restTimer = 3;
  }

  // The last ball, drawn at its real size while the chase camera was near
  // it, grows to the size that shows from the tee.
  growLastBall() {
    if (!this.lastBall) return;
    const { i } = this.lastBall;
    this.lastBall = null;
    if (i >= this.sessionBalls.count || !this.sessionSpots[i]) return;
    this.sessionSpots[i].closeUp = false;
    this.sizedFrom = null;
    this.sizeSessionBalls();
  }

  markLanding(shot) {
    const r = shot.result;
    const i = this.sessionBalls.count;
    if (i < MAX_SESSION_BALLS) {
      const at = toWorld(r.rest[0], 0, r.rest[2]);
      // Grows with distance from the tee, so it's a few pixels wherever it
      // is - but the chase camera has stopped just behind it, so it starts at
      // the real ball's size and grows once the camera is back at the tee
      // (growLastBall). On what it finished on; in the pond, half under the
      // water.
      const on = this.surfaceAt(at.x, at.z);
      this.sessionSpots[i] = { at, on, closeUp: view.follow };
      this.sessionBalls.setColorAt(i, new THREE.Color(clubColor(shot.club)));
      this.sessionBalls.count = i + 1;
      this.sessionBalls.instanceColor.needsUpdate = true;
      this.sizedFrom = null;
      this.lastRing.position.set(at.x, on.y + 0.01, at.z);
      this.lastRing.visible = true;
      this.lastBall = view.follow ? { i } : null;
      this.sizeSessionBalls();
    }
    this.renderSession();
    const el = this.panel.querySelector("#range-target");
    if (shot.target && el) {
      const t = shot.target;
      const feet = t.miss * 3;
      const close = feet < 30 ? `${fmt(feet, 0)} ft` : `${fmt(t.miss, 0)} yds`;
      this.targetText = `${close} from the ${t.yards} yd target - ${fmt(Math.abs(t.long), 0)} ${t.long >= 0 ? "long" : "short"}, ${lr(t.right)}`;
      el.innerHTML = `Target <b>${t.yards} yds</b>: ${close} away - ${fmt(Math.abs(t.long), 0)} ${t.long >= 0 ? "long" : "short"}, ${lr(t.right)}`;
      if (this.settings.target === -1) this.panel.querySelector("#range-target").innerHTML += " - next target coming";
    }
    this.onChange();
  }

  showNumbers(shot) {
    const b = shot.ball;
    const r = shot.result;
    const set = (k, v) => {
      const el = this.panel.querySelector(`[data-k="${k}"]`);
      if (el) el.textContent = v;
    };
    set("Carry", `${fmt(r.carry, 1)} yds`);
    set("Total", `${fmt(r.total, 1)} yds`);
    set("Offline", lr(r.offline));
    set("Ball speed", `${fmt(b.speedMph, 1)} mph`);
    set("Launch", `${fmt(b.vla, 1)}°`);
    set("Direction", b.hla === 0 ? "0.0°" : `${fmt(Math.abs(b.hla), 1)}° ${b.hla > 0 ? "R" : "L"}`);
    set("Spin", `${Math.round(b.totalSpin)} rpm`);
    set("Spin axis", b.spinAxis === 0 ? "0.0°" : `${fmt(Math.abs(b.spinAxis), 1)}° ${b.spinAxis > 0 ? "R" : "L"}`);
    set("Apex", `${fmt(r.apex, 0)} yds`);
    set("Descent", `${fmt(r.descentAngle, 0)}°`);
    this.onChange();
  }

  // "Hitting from: Rough - ball above your feet (4°)", or "" from a flat
  // fairway lie.
  lieText() {
    const s = this.settings;
    if (s.lie === "fairway" && s.stance === "flat") return "";
    return `Hitting from: ${describeLie(s.lie, STANCES[s.stance] ?? STANCES.flat)}`;
  }

  // The lie's guidance off anything but a flat fairway: what the lie did to
  // the last shot (if it was hit from this lie), and what it's likely to do
  // to the next with the club in hand - scaled to the hitter's own full
  // carry with it (their stats, else the bag's).
  lieLines() {
    const s = this.settings;
    const stance = STANCES[s.stance] ?? STANCES.flat;
    const last = this.shots[this.shots.length - 1];
    const club = this.currentClub?.() ?? last?.club ?? "7I";
    const own = ownCarry(this.hitter?.(), club, () => this.showLieGuide());
    const key = [s.lie, s.stance, club, own].join();
    if (this.lieCache?.key !== key) this.lieCache = { key, text: beforeLine(s.lie, stance, { club, full: own ?? BAG[club]?.carry, own: own != null }) };
    const before = this.lieCache.text;
    const after = last && !this.flying && last.lie === s.lie && last.stance === s.stance ? last.lieAfter : "";
    return [after, before].filter(Boolean);
  }

  // Lie practice ('Hit from'): the ball shown in that lie - a patch of first
  // cut, rough or deep rough (with grass round the ball on High:
  // look/lienest.js), or of sand, over the front of the mat where the ball
  // sits. The ground's colour shows on both settings. Nothing for the
  // fairway: the mat.
  showLiePatch() {
    if (!this.liePatch) return;
    for (const c of [...this.liePatch.children]) {
      this.liePatch.remove(c);
      if (c === this.nest) continue;
      c.traverse((o) => {
        o.geometry?.dispose();
        if (o.material && !o.material.userData?.shared) o.material.dispose?.();
      });
    }
    dropNest(this.nest);
    this.nest = null;
    const lie = this.settings.lie;
    const kind = { semi: GRASS.semi, rough: GRASS.rough, deep: GRASS.deep }[lie];
    // Over the mat's front half, round the ball at the origin.
    const cz = -0.5;
    const y = 0.046;
    // (A waste area's sandy ground and scrub: sim/wastearea.mjs.)
    if (lie === "bunker" || lie === "greenside" || lie === "waste") {
      const bunker = makeBunker(1.3, 0.95, { seed: 7, y: y - 0.012, waste: lie === "waste" });
      bunker.position.set(0, 0, cz);
      this.liePatch.add(bunker);
      return;
    }
    if (!kind) return;
    const shape = blob(1.3, 0.95, 7);
    const outline = shape.getPoints().slice(0, -1).map((p) => [p.x, cz - p.y]);
    const patch = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), grassMaterial({ ...kind, layer: LAYER.green }));
    patch.position.set(0, y, cz);
    patch.receiveShadow = true;
    const edge = edgeMesh(edgeStrip(outline, 0.45, () => y), grassMaterial({ ...kind, edge: true, layer: LAYER.green }), LAYER.green);
    this.liePatch.add(patch, edge);
    const r = REAL_BALL_R;
    const clumps = nestClumps({ ball: [0, 0], lieAt: (x, z) => (insideOutline(outline, x, z) ? lie : "fairway"), cap: Math.max(0.004, (2 * r) / 3 - (y - 0.04)), seed: 11, radius: 1.8, count: 900 });
    this.nest = makeNest(clumps, (x, z) => [x, y, z]);
    if (this.nest) this.liePatch.add(this.nest);
  }

  // The bays laid for the hitter's hand (sim/furniture.mjs bayLayout):
  // built for a right-hander and mirrored across the tee line's middle for
  // a left-hander - the bays stand symmetrically about it, so each mat
  // moves to the other side of its ball and each pyramid to the other side
  // of its mat - with the mats' lie outlines (surfaceAt) laid again to
  // match. As the hitter, or their hand, changes (showLieGuide).
  layBays(hand = "right") {
    const h = hand === "left" ? "left" : "right";
    // (Not built yet: laid as it is - setActive.)
    if (this.unbuilt || this.matHand === h) return;
    this.matHand = h;
    this.bays.scale.x = h === "left" ? -1 : 1;
    this.bays.updateMatrixWorld(true);
    const lay = bayLayout(h);
    this.surfaces = this.surfaces.filter((q) => q.kind !== "mat");
    for (const x of BAYS) {
      const outline = lay.mat.outline.map(([ox, oz]) => [x + ox, oz]);
      this.surfaces.push({ outline, y: 0.04, kind: "mat", box: boxOf(outline) });
    }
  }

  showLieGuide() {
    this.layBays(this.hand?.() ?? "right");
    const el = this.panel.querySelector("#range-lie-guide");
    if (el) el.innerHTML = this.lieLines().map(esc).join("<br>");
    this.onChange();
  }

  // What bay view lays over the picture.
  overlay() {
    const s = this.shots[this.shots.length - 1];
    const w = this.wind;
    const windNote = w ? `Wind ${windArrow(arrowAngle(w, 0))} ${windWords(w, 0)}` : "";
    const target = this.target ? `Target: ${this.target.yards} yds${w ? ` (plays ${Math.round(playsLike(this.target.yards, w, 0, this.settings.temperatureC))})` : ""}` : "";
    const full = [target, windNote, this.lieText()].filter(Boolean).join(" · ");
    // The lie of the land, drawn on the game screen (bay.js), where the
    // note says only what the ball sits in.
    const stance = this.flying || this.settings.stance === "flat" ? null : (STANCES[this.settings.stance] ?? null);
    const sits = this.settings.lie === "fairway" ? "" : `Hitting from: ${LIE_NAMES[this.settings.lie] ?? this.settings.lie}`;
    const note = stance ? { text: full, short: [target, windNote, sits].filter(Boolean).join(" · ") } : full;
    const lie = this.lieLines();
    if (!s) return { title: "Driving range", note, lie, stance, stats: [] };
    const b = s.ball;
    const r = s.result;
    const side = (v, unit) => (Math.abs(v) < 0.5 ? "0" : `${fmt(Math.abs(v), 0)} ${unit}`);
    return {
      title: this.targetText,
      note,
      lie,
      stance,
      stats: [
        { label: "Carry", value: fmt(r.carry, 0), unit: "yds", accent: true },
        { label: "Total", value: fmt(r.total, 0), unit: "yds", accent: true },
        { label: "Offline", value: side(r.offline, r.offline > 0 ? "R" : "L") },
        { label: "Ball speed", value: fmt(b.speedMph, 0), unit: "mph" },
        { label: "Launch", value: `${fmt(b.vla, 1)}°` },
        { label: "Direction", value: Math.abs(b.hla ?? 0) < 0.05 ? "0.0°" : `${fmt(Math.abs(b.hla), 1)}° ${b.hla > 0 ? "R" : "L"}` },
        { label: "Spin", value: String(Math.round(b.totalSpin)), unit: "rpm" },
        { label: "Spin axis", value: Math.abs(b.spinAxis) < 0.5 ? "0°" : `${fmt(Math.abs(b.spinAxis), 0)}° ${b.spinAxis > 0 ? "R" : "L"}` },
        { label: "Apex", value: fmt(r.apex, 0), unit: "yds" },
        { label: "Descent", value: `${fmt(r.descentAngle, 0)}°` },
        // (All the last shot's: the command centre's Last shot box has
        // them, This shot the rest - sim/thisshot.mjs.)
      ].map((t) => ({ ...t, of: "shot" })),
    };
  }

  renderSession() {
    // Averages per club (sim/rangesession.mjs: the phone's session card's too).
    const clubs = clubDistances(this.shots);
    const table = this.panel.querySelector("#range-clubs");
    const rows = clubs.map(
      (c) => `<tr><td>${clubShort(c.club)}</td><td>${c.n}</td><td>${fmt(c.carry, 0)}</td>
        <td>${fmt(c.total, 0)}</td><td>${fmt(c.high - c.low, 0)}</td>
        <td>${fmt(c.width, 0)}</td><td>${fmt(c.speed, 0)}</td></tr>`,
    );
    table.innerHTML = `<tr><th>Club</th><th>#</th><th>Carry</th><th>Total</th><th>Carry range</th><th>Width</th><th>Speed</th></tr>${
      rows.join("") || `<tr><td colspan="7" class="muted">No shots yet</td></tr>`
    }`;
    this.drawPlot(clubs.map((c) => c.club));
    this.onSession?.(this.shots);
  }

  drawPlot(clubs) {
    clubs = clubs || [...new Set(this.shots.map((s) => s.club))];
    const canvas = this.panel.querySelector("#range-plot");
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    let maxTotal = 0;
    let maxOffline = 0;
    for (let i = 0; i < this.shots.length; i++) {
      const s = this.shots[i].result;
      if (s.total > maxTotal) maxTotal = s.total;
      const offlineAbs = Math.abs(s.offline);
      if (offlineAbs > maxOffline) maxOffline = offlineAbs;
    }

    const maxYd = Math.max(100, Math.ceil(maxTotal / 50) * 50 + 25);
    const side = Math.max(30, Math.ceil(maxOffline / 10) * 10 + 10);
    const X = (off) => w / 2 + (off / side) * (w / 2 - 10);
    const Y = (yd) => h - 20 - (yd / maxYd) * (h - 30);
    ctx.fillStyle = "#28492a";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "11px system-ui";
    for (let yd = 50; yd < maxYd; yd += 50) {
      ctx.beginPath();
      ctx.moveTo(0, Y(yd));
      ctx.lineTo(w, Y(yd));
      ctx.stroke();
      ctx.fillText(`${yd}`, 4, Y(yd) - 3);
    }
    ctx.beginPath();
    ctx.moveTo(X(0), 0);
    ctx.lineTo(X(0), h);
    ctx.stroke();
    ctx.fillText(`±${side} yds`, w - 60, h - 6);
    this.shots.forEach((s, i) => {
      if (s.removed) return;
      ctx.fillStyle = clubColor(s.club);
      ctx.globalAlpha = i === this.shots.length - 1 ? 1 : 0.7;
      ctx.beginPath();
      ctx.arc(X(s.result.offline), Y(s.result.total), i === this.shots.length - 1 ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    clubs.forEach((c, i) => {
      ctx.fillStyle = clubColor(c);
      ctx.fillText(c, w - 30, 14 + i * 14);
    });
    if (this.target) {
      ctx.strokeStyle = "#ff7f11";
      ctx.beginPath();
      ctx.arc(X(this.target.right), Y(this.target.yards), 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  resize(aspect) {
    // (A picture taller than it's wide - the phone held upright - with the
    // lens widened: sim/upright.mjs.)
    fitLens(this.camera, aspect);
  }
}
