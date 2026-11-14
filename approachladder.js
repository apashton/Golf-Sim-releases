// The approach ladder: three holes at different distances, played from one
// spot on the fairway. A circle round the pin starts at 40 ft and shrinks by
// 3 1/3 ft after every shot that finishes inside it, down to 10 ft for the
// tenth; the first shot outside ends the hole. The score is how many were
// made. The ball flies and rolls exactly as on the course (courseplay.mjs),
// so it finishes where the shot really would, on the green or off it.

import { runAll } from "./sim/idlework.mjs";
import { preparedHole } from "./sim/holesite.mjs";
import * as THREE from "three";
import { FOOT } from "./sim/putting.mjs";
import { prepareHole, playShot, suggestClub, distanceToPin, riseToPin, testShotFor, BAG_ORDER, BAG, plannedCarry, swingFor } from "./sim/courseplay.mjs";
import { shotGuide } from "./sim/swingguide.mjs";
import { drawSeverity, LIE_RANGES, FLAT } from "./sim/lie.mjs";
import { beforeLine, afterLine } from "./sim/lieguide.mjs";
import { treeWarning } from "./sim/treewarn.mjs";
import { LADDERS, LadderHole, rungs, ringColour, APPROACH_BANDS, approachYards, approachLayout, approachSpot, feetFromPin, feetText, missText } from "./sim/ladder.mjs";
import { YARD } from "./sim/flight.mjs";
import { makeBall, BallShadow, toWorld, sizeBall } from "./scenery.js";
import { REAL_BALL_R, ballDrawRadius } from "./sim/ballsize.mjs";
import { fitShadows } from "./look/environment.js";
import { makeShotTracer } from "./look/tracer.js";
import { tracerColour, drawnHeight } from "./sim/tracer.mjs";
import { clearGroup } from "./look/dispose.js";
import { view, keepInView, clearOfTrees } from "./view.js";
import { HoleScenery, lookKeepingBall } from "./holeview.js";
import { greenEntry, greenView, greenFollow } from "./sim/greencam.mjs";
import { fmt } from "./util.js";
import { shotFacts } from "./recorder.js";
import { audio } from "./audio/engine.js";
import { shotCues, CueQueue } from "./audio/cues.mjs";
import { flightStep } from "./sim/preflight.mjs";

const BALL_R = 0.045; // its tracer, as on the course (the ball itself: placeBall)
// Seconds to look at where a shot finished before the next, and a bit
// longer when it ends the hole.
const PAUSE = 2.4;
const PAUSE_OVER = 3.4;
// Where the ball sits in the picture from behind it: this far under the
// middle (radians), whatever the distance - clear of the numbers along the
// bottom in bay view.
const BALL_BELOW = 0.28;
// A radius as it's shown: 36.7 ft, 10 ft.
export const radiusText = (r) => `${Number.isInteger(r) ? r : fmt(r, 1)} ft`;

export class ApproachLadder {
  constructor(host) {
    this.host = host;
    this.id = "approach";
    this.option = {
      label: "Distances",
      choices: Object.fromEntries(Object.entries(APPROACH_BANDS).map(([k, b]) => [k, `${b.name} (${b.holes[0][0]}-${b.holes[2][1]} yds)`])),
      fallback: "mixed",
    };
    this.scenery = new HoleScenery({ scene: host.scene, world: host.world, light: host.light, challenge: "approach" });
    this.ballShadow = new BallShadow(host.light.userData.sun, BALL_R);
    host.scene.add(this.ballShadow.mesh);
    this.look = new THREE.Vector3();
    this.camWant = new THREE.Vector3();
    this.lookWant = new THREE.Vector3();
    this.builtKey = null;
    this.ladder = null;
    this.flying = null;
    this.pause = null;
    this.message = "";
    this.last = null;
    this.club = "7I";
    // What the chipping ladder (chipladder.js) plays differently: its
    // circle, the lie, and a closer look at a smaller target.
    this.rules = LADDERS.approach;
    this.lie = "fairway";
    this.stance = FLAT;
    // From 80 yards and more the circle is small in the picture, so it's
    // drawn thick, and each turn opens on a look at the green (`intro`
    // seconds) so its size is seen before hitting.
    this.look3d = { ringWidth: 0.3, ringShare: 0.07, mark: 0.35, chase: 24, pad: 6, lift: 3, back: 8, up: 3.2, intro: 2.6 };
  }

  get match() {
    return this.host.match;
  }
  get holeIndex() {
    return this.match?.hole ?? 0;
  }
  get yards() {
    return this.holeYards?.[this.holeIndex] ?? 0;
  }
  // The yards shown: the real distance from the ball to the pin, which can
  // be a little less than the hole was made for when the ball's spot had
  // to move up onto the fairway.
  get shownYards() {
    return this.hole && this.spot ? Math.round(distanceToPin(this.hole, this.spot) / YARD) : this.yards;
  }
  // Shots played on the hole in hand, so a game just begun can be left
  // without asking.
  get shotsThisTurn() {
    return this.ladder?.shots.length ?? 0;
  }
  get madeSoFar() {
    return this.ladder?.made ?? 0;
  }
  get focus() {
    return this.scenery.pinWorld?.clone() ?? new THREE.Vector3();
  }

  // ---- A game, a hole, a turn --------------------------------------------------------

  start(band, seed) {
    this.band = band in APPROACH_BANDS ? band : "mixed";
    this.seed = seed;
    this.holeYards = approachYards(this.band, seed);
    this.builtKey = null;
  }

  // Draws hole `i` of this game (unless it's already up) - at once, or a
  // step at a time (buildHoleSteps: ahead of time, sim/idlework.mjs).
  buildHole(i, yards, seed) {
    runAll(this.buildHoleSteps(i, yards, seed));
  }
  // (wait: as HoleScenery buildSteps.)
  *buildHoleSteps(i, yards, seed, wait = false) {
    const key = `${seed}:${i}:${yards}`;
    if (this.builtKey === key) return;
    // (Not built until it's all there: one stopped part-way is built again.)
    this.builtKey = null;
    const layout = approachLayout(yards, seed, i + 1);
    this.hole = preparedHole(layout, {});
    this.spot = approachSpot(layout, yards);
    yield* this.drawHoleSteps(wait);
    this.builtKey = key;
  }

  // The hole that's up, in 3D, with room on top for the circle.
  drawHole() {
    runAll(this.drawHoleSteps());
  }
  *drawHoleSteps(wait = false) {
    yield* this.scenery.buildSteps(this.hole, wait);
    // What goes on top: the circle, where this player's shots finished.
    const world = this.host.world;
    this.ringGroup = new THREE.Group();
    this.marks = new THREE.Group();
    world.add(this.ringGroup, this.marks);
    this.tracer = null;
    fitShadows(this.host.light, this.host.scene);
  }

  // Everyone's first hole seeds from the game's seed, the next from one
  // more, and so on: the same three holes for every player.
  beginTurn() {
    const i = this.holeIndex;
    this.buildHole(i, this.yards, this.seed + i + 1);
    // (A swing pad or controller player's clubs go as far as their level.)
    this.club = suggestClub(distanceToPin(this.hole, this.spot), "fairway", { reach: this.host.clubReach?.(this.match.player?.name) ?? 1 });
    this.freshLadder(`Hole ${i + 1} - ${this.shownYards} yds`);
  }

  // A new ladder on the hole that's up, for the player whose turn it is,
  // and a toast saying who and where.
  freshLadder(where) {
    this.ladder = this.newTurn();
    this.flying = null;
    this.pause = null;
    this.message = "";
    this.last = null;
    this.lieAfter = "";
    clearGroup(this.marks);
    this.clearTracer();
    this.aim = Math.atan2(this.hole.cup.z - this.spot[1], this.hole.cup.x - this.spot[0]);
    this.drawRing();
    this.address(true);
    // A look at the green and its circle first, then back behind the ball.
    if (this.look3d.intro) {
      this.viewFinish([this.hole.cup.x, this.hole.cup.z]);
      this.host.camera.position.copy(this.camWant);
      this.look.copy(this.lookWant);
      this.intro = { t: this.look3d.intro };
    }
    const p = this.match.player;
    const text = `${where}${this.turnText()}`;
    this.host.toast(this.host.multi ? `${p.name} to play - ${text}` : text, 2600);
  }

  // A player's go at a hole (the approach challenge has its own), and what
  // the toast says of it after where it is.
  newTurn() {
    return new LadderHole(this.rules);
  }
  turnText() {
    return ` - ${radiusText(this.ladder.radius)} circle`;
  }

  // Some scenery for behind the picker: the first hole of a fixed game - at
  // once, or a step at a time ahead of being come into (challenges.js
  // prepareAhead).
  preview() {
    runAll(this.previewSteps());
  }
  *previewSteps(wait = false) {
    const yards = approachYards("mixed", 3)[1];
    yield* this.buildHoleSteps(1, yards, 5, wait);
    this.aim = Math.atan2(this.hole.cup.z - this.spot[1], this.hole.cup.x - this.spot[0]);
    this.ladder = null;
    this.flying = null;
    this.pause = null;
    clearGroup(this.ringGroup);
    clearGroup(this.marks);
    this.address(true);
  }

  // The game's over: back behind the ball for the results, the last hole
  // in the picture.
  atRest() {
    this.flying = null;
    this.pause = null;
    for (const o of this.ringGroup.children) (o.geometry.dispose(), o.material.dispose());
    this.ringGroup.clear();
    this.clearTracer();
    this.address(false);
  }

  stop() {
    this.flying = null;
    this.pause = null;
    this.intro = null;
    this.ladder = null;
    this.builtKey = null;
  }

  // ---- The circle ----------------------------------------------------------------------

  // A ring on the ground round the pin at this shot's radius, following the
  // green's slopes, in its colour for the rung (yellow to red as it
  // tightens), with a faint wash inside so it shows from 150 yards, and a
  // thin white ring at the smallest size to show where it's heading.
  drawRing() {
    const g = this.ringGroup;
    for (const o of g.children) (o.geometry.dispose(), o.material.dispose());
    g.clear();
    const LADDER = this.rules;
    const l = this.ladder;
    // All ten made: nothing left to aim at.
    if (!l || l.made >= LADDER.shots) return;
    // After a miss, the circle it missed stays up, so you can see by how much.
    const rung = l.made;
    const r = (l.over ? l.shots[l.shots.length - 1].radius : l.radius) * FOOT;
    const colour = ringColour(LADDER, rung);
    const width = Math.max(this.look3d.ringWidth, r * this.look3d.ringShare);
    g.add(this.ringMesh(r - width, r, colour, 0.95));
    g.add(this.ringMesh(0.2, r - width, colour, 0.26));
    if (rung < LADDER.shots - 1) g.add(this.ringMesh(LADDER.end * FOOT - 0.06, LADDER.end * FOOT, 0xffffff, 0.55));
  }

  ringMesh(inner, outer, colour, opacity) {
    const seg = 96;
    const [cx, cz] = [this.hole.cup.x, this.hole.cup.z];
    const pos = [];
    const index = [];
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      for (const rad of [inner, outer]) {
        const x = cx + Math.cos(a) * rad;
        const z = cz + Math.sin(a) * rad;
        const w = this.scenery.at(x, z, 0.035);
        pos.push(w.x, w.y, w.z);
      }
      if (i < seg) {
        const k = i * 2;
        index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(index);
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        color: colour, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
      }),
    );
    mesh.renderOrder = 2;
    return mesh;
  }

  // Where a shot finished: a dot, green if inside, red if not.
  markFinish(rest, inside) {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(this.look3d.mark, 20).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: inside ? 0x5ee06a : 0xff5a4e, transparent: true, opacity: 0.9, depthWrite: false }),
    );
    this.scenery.at(rest[0], rest[1], 0.04, m.position);
    m.renderOrder = 3;
    this.marks.add(m);
  }

  // ---- Camera -----------------------------------------------------------------------

  // Behind the ball, looking towards the pin, with the ball at the same
  // place in the picture however far it is to the green.
  address(snap) {
    this.placeBall(this.spot);
    const b = this.scenery.ball.position;
    const dir = new THREE.Vector3(Math.sin(this.aim), 0, -Math.cos(this.aim));
    this.camWant.copy(b).addScaledVector(dir, -this.look3d.back).add(new THREE.Vector3(0, this.look3d.up, 0));
    lookKeepingBall(this.camWant, b, dir, BALL_BELOW, this.lookWant);
    this.addressLook = this.lookWant.clone();
    if (snap) {
      this.host.camera.position.copy(this.camWant);
      this.look.copy(this.lookWant);
    }
  }

  // After a shot: up and back from the green, and off to one side (from
  // straight behind, the tracer coming down is a line up the middle of the
  // picture), so the circle and where the ball finished both show.
  viewFinish(rest) {
    const pin = this.scenery.pinWorld;
    const ball = this.scenery.at(rest[0], rest[1]);
    const r = Math.min(30, Math.max(this.rules.start * FOOT, ball.distanceTo(pin) + this.look3d.lift));
    // On the side the ball finished, so it's in the near half of the picture.
    const right = -(rest[0] - this.spot[0]) * Math.sin(this.aim) + (rest[1] - this.spot[1]) * Math.cos(this.aim);
    const side = this.aim + (right > 0 ? -0.55 : 0.55);
    const dir = new THREE.Vector3(Math.sin(side), 0, -Math.cos(side));
    this.camWant.copy(pin).addScaledVector(dir, -(r * 1.6 + this.look3d.pad)).add(new THREE.Vector3(0, r * 0.9 + this.look3d.lift, 0));
    this.lookWant.copy(pin).lerp(ball, 0.45);
  }

  // On the ground it's a real ball (sim/ballsize.mjs).
  placeBall([x, z], y = 0) {
    this.ballR = sizeBall(this.scenery.ball, REAL_BALL_R);
    this.scenery.ballAt(x, z, y + this.ballR, this.scenery.ball.position);
  }

  // ---- Shots ------------------------------------------------------------------------

  onShot(entry) {
    if (!this.ladder) return;
    if (this.flying) this.settle();
    // A shot during the look at the last one: that wait is over.
    if (this.pause) {
      const over = this.ladder.over;
      this.endPause();
      // The hole was over: the shot belongs to whoever's turn is next (or
      // the game has finished and it's for no one).
      if (over) return this.host.state === "playing" ? this.onShot(entry) : undefined;
    }
    this.intro = null;
    this.address(true);
    // Out of grass or sand, each strike somewhere in the lie's range.
    const res = playShot(this.hole, this.spot, this.lie, entry.ball, this.aim, { club: this.club, stance: this.stance, severity: drawSeverity() });
    // The flight it flew, for the recording's and the command centre's
    // flight path, turned to the shot's frame (sim/shotflight.mjs).
    this.host.onFlight?.({ path: res.path, flightPoints: res.flightPoints, from: this.spot, aim: this.aim });
    this.lieAfter = "";
    // Its tracer, flight and ground, in this player's colour, where it's
    // drawn as on the course (pathDrawn). The turn's earlier shots keep
    // theirs, faint.
    const drawn = this.scenery.pathDrawn(res.path, res.flightPoints);
    const place = ([x, y, z]) => toWorld(x, y + BALL_R, z);
    this.tracer = this.scenery.tracers.add(makeShotTracer(drawn, res.flightPoints, place, { colour: this.match.player?.colour ?? tracerColour(0) }));
    // Run onto the green, the camera closes in there as it comes on, as on
    // the course (sim/greencam.mjs).
    const on = greenEntry(res.path, { flightPoints: res.flightPoints, onGreen: (x, z) => this.hole.lieAt(x, z) === "green" });
    const end = res.path.at(-1);
    const green = on && { t: on.t, view: greenView({ from: this.spot, touch: on.at, rest: [end[0], end[2]], pin: [this.hole.cup.x, this.hole.cup.z] }) };
    // Its sounds as the ball gets there: landings, water, the cup.
    this.flying = { res, entry, elapsed: 0, index: 0, cues: new CueQueue(shotCues(res, { lieAt: this.hole.lieAt })), green, drawn };
    this.message = "";
    this.host.changed();
  }

  // This turn's tracers gone (the scenery keeps them, in a TracerSet
  // look/tracer.js, and empties it when it draws another hole).
  clearTracer() {
    this.scenery.tracers?.clear();
    this.tracer = null;
  }

  update(dt) {
    const f = this.flying;
    const cam = this.host.camera;
    if (f) {
      // Its first picture with the ball where it was struck from, then no
      // frame's step longer than a normal one's until it's on its way
      // (sim/preflight.mjs).
      dt = flightStep(f.elapsed, dt, { first: !f.started });
      f.started = true;
      f.elapsed += dt;
      const path = f.res.path;
      while (f.index < path.length - 1 && path[f.index + 1][3] <= f.elapsed) f.index++;
      const a = path[f.index];
      const b = path[Math.min(f.index + 1, path.length - 1)];
      const k = Math.min(1, Math.max(0, (f.elapsed - a[3]) / (b[3] - a[3] || 1)));
      const at = [a[0] + (b[0] - a[0]) * k, a[2] + (b[2] - a[2]) * k];
      // Through the air along its tracer; then on what it rolls over.
      // (Larger the higher it is, to follow it.)
      if (f.index < f.res.flightPoints - 1) {
        this.ballR = sizeBall(this.scenery.ball, ballDrawRadius({ air: true, height: a[1] + (b[1] - a[1]) * k }));
        toWorld(at[0], drawnHeight(f.drawn, f.index, k) + this.ballR, at[1], this.scenery.ball.position);
      } else this.placeBall(at, a[1] + (b[1] - a[1]) * k);
      for (const c of f.cues.due(f.elapsed)) audio.cue(c, this.scenery.ball.position);
      if (this.tracer) this.tracer.userData.reveal(f.index, k);
      // As on the course: chase the ball (in close once it runs onto the
      // green), or stay put and keep it in view.
      const closing = !!f.green && view.follow && f.elapsed >= f.green.t;
      const p = this.scenery.ball.position;
      if (closing) {
        // Run onto the green: in close, low, behind the line (following a
        // ball still running up) - the ball, where it stops and the pin
        // all in the picture.
        const g = f.green.view;
        const { cam: [cx, cz], look: [lx, lz] } = greenFollow(at, g);
        this.scenery.at(cx, cz, g.up, this.camWant);
        clearOfTrees(this.scenery.cameraTrees, this.camWant, p);
        this.scenery.at(lx, lz, 0, this.lookWant);
      } else if (view.follow) {
        const dir = new THREE.Vector3(Math.sin(this.aim), 0, -Math.cos(this.aim));
        const above = p.y - this.scenery.worldHeight(p.x, p.z);
        this.camWant.copy(p).addScaledVector(dir, -this.look3d.chase).add(new THREE.Vector3(0, Math.max(this.look3d.lift, above * 0.6 + this.look3d.lift), 0));
        clearOfTrees(this.scenery.cameraTrees, this.camWant, p);
        this.lookWant.copy(p);
      } else {
        keepInView(cam.position, this.addressLook ?? this.lookWant, p, this.lookWant);
      }
      if (f.index >= path.length - 1) this.settle();
    } else if (this.pause) {
      this.pause.t -= dt;
      if (this.pause.t <= 0) this.endPause();
    } else if (this.intro) {
      this.intro.t -= dt;
      if (this.intro.t <= 0) this.endIntro();
    }
    const lerp = 1 - Math.exp(-dt * (f && !(f.green && view.follow && f.elapsed >= f.green.t) ? 1.6 : 2.2));
    cam.position.lerp(this.camWant, lerp);
    this.look.lerp(this.lookWant, 1 - Math.exp(-dt * 4));
    cam.lookAt(this.look);
    if (this.scenery.ball) this.ballShadow.update(this.scenery.ball.position, this.scenery.worldSurface, this.ballR ?? REAL_BALL_R);
  }

  // The shot has finished: in the circle or not.
  settle() {
    const f = this.flying;
    if (!f) return;
    this.flying = null;
    this.tracer?.userData.revealAll();
    const res = f.res;
    const lost = !!res.penalty;
    const feet = lost ? Infinity : feetFromPin(this.hole.layout.pin, res.rest, res.holed);
    const r = this.ladder.add(feet);
    const rest = res.holed ? [this.hole.cup.x, this.hole.cup.z] : res.rest;
    // Holed, it lies where its path ends, in the bottom of the cup.
    const end = res.path.at(-1);
    if (res.holed) this.placeBall([end[0], end[2]], end[1]);
    else this.placeBall(rest, 0);
    this.markFinish(rest, r.inside);
    this.last = { feet, lost, holed: res.holed, carry: res.carryYards, ...r };
    // What the lie did to it, until the next shot.
    this.lieAfter = afterLine(this.lie, this.stance, res.lieOutcome, { carry: res.carryYards });
    this.record(f.entry, res, feet, r);
    const sounds = this.host.sounds;
    if (r.complete) {
      this.message = "All ten! Ladder complete";
      sounds.play("arpeggio", 0.8);
      this.sparkle(rest, 0.8);
    } else if (r.inside) {
      // The next circle's size is in the note and the numbers below.
      this.message = res.holed ? "Holed!" : `In - ${feetText(feet, r.radius)} ft`;
      sounds.play("chime", 0.5);
      this.sparkle(rest, 0.35);
    } else {
      const why = lost ? (res.penalty.kind === "water" ? "In the water" : "Lost") : `Missed by ${missText(r.by)}`;
      this.message = `${why} - ${r.made} made`;
      sounds.play("low", 0.4);
    }
    this.drawRing();
    this.viewFinish(lost ? res.penalty.drop ?? rest : rest);
    this.pause = { t: r.over ? PAUSE_OVER : PAUSE };
    this.host.changed();
  }

  // For the player's stats: the shot against the pin, and the ladder's
  // circle it was played to - made or missed by the circle, which isn't
  // holed (target.made is only ever holed, as the chipping stats count it).
  // The swing is left to the stats to decide from the distance (a full or
  // part swing), except where a game knows better (swingFor).
  record(entry, res, feet, r) {
    const cup = [this.hole.cup.x, this.hole.cup.z];
    const from = this.spot;
    const along = [cup[0] - from[0], cup[1] - from[1]];
    const len = Math.hypot(...along) || 1;
    const rest = res.rest ?? from;
    const long = ((rest[0] - cup[0]) * along[0] + (rest[1] - cup[1]) * along[1]) / len / YARD;
    const toPin = distanceToPin(this.hole, from) / YARD;
    const result = shotFacts(res, from, this.aim);
    const lost = !Number.isFinite(feet);
    this.host.record(
      {
        club: this.club,
        swing: this.swingFor(result),
        ball: entry.ball,
        result,
        target: { distance: toPin, finish: lost ? undefined : res.holed ? 0 : feet / 3, long: lost || res.holed ? 0 : long, made: !!res.holed },
        toPin,
        intended: toPin,
        lie: this.lie,
        // Off a slope its carry isn't the club's (as on the course).
        ...(this.stance.side || this.stance.slope ? { uneven: true } : {}),
      },
      this.recordExtra(r),
    );
  }
  // The rung played (1-10), its circle in feet, and whether it was in.
  recordExtra(r) {
    return { rung: this.ladder.shots.length, circle: Math.round(r.radius * 10) / 10, inside: r.inside ? 1 : 0 };
  }
  swingFor() {
    return undefined;
  }

  // A small ring of sparkles where a made shot finished (the course's
  // celebration effects, without a banner).
  sparkle([x, z], amount) {
    const focus = this.scenery.at(x, z);
    this.host.celebration.effects.start({ level: 0, confetti: 0, fireworks: 0, sparkle: amount }, { focus, camera: this.host.camera, cameraAt: this.camWant });
  }

  // The wait after a shot is over: the next shot from the same spot, or
  // the hole is done and it's the next turn.
  endPause() {
    if (!this.pause) return;
    this.pause = null;
    if (this.ladder.over) {
      this.host.turnOver(this.ladder.made);
      return;
    }
    // The shots so far keep their tracers, faint, until the turn is over.
    this.address(!view.follow);
    this.host.changed();
  }

  // The look at the green is over: back behind the ball.
  endIntro() {
    this.intro = null;
    this.address(false);
  }

  next() {
    if (this.flying) this.settle();
    else if (this.pause) this.endPause();
    else if (this.intro) this.endIntro();
  }

  testShot() {
    if (!this.ladder) return null;
    return testShotFor(this.hole, this.spot, this.lie, this.club);
  }

  // The swing pad's two lines for the shot in hand (sim/swingguide.mjs):
  // the flag's distance on the flat, and as it plays up or down to the
  // green and out of the lie (no wind in the challenges) - null between
  // shots.
  swingGuide() {
    if (!this.ladder || this.flying || !this.spot) return null;
    return shotGuide({ flagYards: distanceToPin(this.hole, this.spot) / YARD, riseYards: riseToPin(this.hole, this.spot) / YARD, lie: this.lie, club: this.club });
  }

  get clubs() {
    return BAG_ORDER.filter((c) => c !== "DR");
  }
  stepClub(delta) {
    const list = this.clubs;
    const i = Math.max(0, list.indexOf(this.club));
    this.club = list[Math.min(list.length - 1, Math.max(0, i + delta))];
    this.host.sendClub();
    this.host.changed();
    return this.club;
  }

  // ---- What's on show -----------------------------------------------------------------

  // The line under the title: which hole, how far, the circle.
  noteFor(i, radius) {
    return `Approach ladder - hole ${i + 1} of 3 - ${this.shownYards} yds - ${radiusText(radius)} circle`;
  }

  overlay() {
    const l = this.ladder;
    if (!l) return { title: "", note: "", stats: [] };
    const i = this.holeIndex;
    const radius = l.over ? l.shots[l.shots.length - 1].radius : l.radius;
    const note = this.noteFor(i, radius);
    const best = this.host.bestFor(this.id, this.host.option);
    const total = this.match.total(this.match.playerIndex) + l.made;
    const stats = [
      { label: "Circle", value: fmt(radius, Number.isInteger(radius) ? 0 : 1), unit: "ft", accent: true },
      { label: "Made", value: `${l.made}`, unit: `of ${this.rules.shots}` },
      { label: "Score", value: String(total) },
    ];
    if (this.last && !this.flying) {
      const t = this.last;
      stats.push({ label: "Finished", value: t.lost ? "Lost" : t.holed ? "In" : feetText(t.feet, t.radius), unit: t.lost || t.holed ? "" : "ft", tone: t.inside ? "good" : "bad" });
      stats.push({ label: "Carry", value: fmt(t.carry, 0), unit: "yds" });
    }
    stats.push({ label: "Personal best", value: best ? String(best.score) : "-" });
    const title = this.flying ? "" : this.message ? (this.last?.inside ? `<b class="made">${this.message}</b>` : this.message) : "Hit when ready";
    return { title, note, lie: this.lieLines(), stats };
  }

  // The lie's guidance, as on the course: what the lie did to the last
  // shot, and what it's likely to do to the next. Nothing off a clean lie.
  // And a warning if the course's trees are in the way of this club's
  // shot at the pin (sim/treewarn.mjs), as on the course.
  lieLines() {
    if (this.flying || !this.hole) return [];
    const key = [this.lie, this.stance.side, this.stance.slope, this.club, this.shownYards, this.spot, this.aim].join();
    if (this.lieCache?.key !== key) {
      const w = this.spot && this.aim != null ? treeWarning(this.hole, this.spot, this.aim, { club: this.club, lie: this.lie, yards: this.shownYards }) : null;
      this.lieCache = {
        key,
        text: this.guided ? beforeLine(this.lie, this.stance, { club: this.club, ...this.lieSwing() }) : "",
        trees: w ? { text: w.text, short: w.short } : null,
      };
    }
    return this.guided ? [this.lieAfter, this.lieCache.text, this.lieCache.trees].filter(Boolean) : [this.lieCache.trees].filter(Boolean);
  }
  // Whether the lie (or the slope) changes the shot, so there's guidance.
  get guided() {
    return !!LIE_RANGES[this.lie] || !!(this.stance.side || this.stance.slope);
  }

  // The swing this shot takes, for the guidance: a full one with the club,
  // or less near the green - { full } or { swing, plan }.
  lieSwing() {
    const yards = this.shownYards;
    const plan = plannedCarry(this.club, yards);
    const full = BAG[this.club]?.carry ?? 150;
    return plan < full * 0.9 ? { swing: swingFor(this.club, "fairway", this.stance, yards), plan } : { full };
  }

  // The ladder over the picture: ten rungs, the biggest circle at the
  // bottom; made ones ticked, a miss crossed, the one to play highlighted.
  sideHtml() {
    const l = this.ladder;
    if (!l) return "";
    const LADDER = this.rules;
    const list = rungs(LADDER)
      .map((r, i) => {
        const shot = l.shots[i];
        const state = shot ? (shot.inside ? "rung-made" : "rung-missed") : i === l.made && !l.over ? "rung-now" : "";
        const mark = shot ? (shot.inside ? "✓" : "✗") : "";
        const colour = `#${ringColour(LADDER, i).toString(16).padStart(6, "0")}`;
        return `<li class="${state}" style="--rung:${colour}"><span>${Number.isInteger(r) ? r : fmt(r, 1)} ft</span><i>${mark}</i></li>`;
      })
      .reverse()
      .join("");
    return `<div class="ladder-head">Hole ${this.holeIndex + 1}<small>${this.shownYards} yds</small></div><ol class="ladder">${list}</ol><div class="ladder-foot">${l.made} made</div>`;
  }
}
