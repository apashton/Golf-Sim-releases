// The putting green. Two ways to use it:
//   Practice            slopes and contours, the grid with rolling markers,
//                       the read, and a record of makes by distance - from
//                       one distance, or a random one between two limits
//                       each putt. Every putt holed is celebrated, more each
//                       time in a row, with the most in a row kept per
//                       player and distance (streaks.js): a heartbeat as a
//                       run closes on the best, a crowd when it beats it.
//   Distance challenge  a flat green, one distance, ten putts scored for
//                       pace (in the hole best, just past next), with a
//                       personal best for each distance, cup and green speed.
//                       Or lag putting: the same ten long putts every round
//                       (two each from 30 to 50 ft, mixed up), scored for
//                       leaving a sure second putt.
//   Golf pong           on a real green, a rack of cups each end (three: lanes)
//                       (golfpong.js, which has the scene while it's played).

import * as THREE from "three";
import {
  simulatePutt,
  greenHeight,
  greenGradient,
  makeContours,
  CONTOUR_NAMES,
  CUPS,
  FOOT,
} from "./sim/putting.mjs";
import { scorePutt, scoreLag, scorePace, lagOrder, LAG_ZONES, PACE_ZONES, LAG_DISTANCES } from "./sim/scoring.mjs";
import { forgetFlags, makeBall, setFlagLook, toWorld, BallShadow } from "./scenery.js";
import { flagFor, flagLook, FLAG_FADE } from "./sim/flagstick.mjs";
import { disposeSurface } from "./look/sandwater.js";
import { addEnvironment, applyReflections, fitShadows } from "./look/environment.js";
import { buildGreenScene } from "./greenscene.js";
import { GreenGrid, SLOPE_LEGEND, slopeShade } from "./greengrid.js";
import { Challenge } from "./challenge.js";
import { Celebration } from "./celebrate.js";
import { Sounds } from "./sounds.js";
import { Streaks } from "./streaks.js";
import { HIGH } from "./look/quality.js";
import { streakKey, distanceKey, streakCelebration, afterTry, newRun } from "./sim/streaks.mjs";
import { nextDistance } from "./sim/practice.mjs";
import { loadSetting, saveSetting, fmt, lr, esc } from "./util.js";
import { clearGroup } from "./look/dispose.js";
import { audio } from "./audio/engine.js";
import { puttCues, soundscape, CueQueue } from "./audio/cues.mjs";
import {
  lineFigures,
  lineText,
  puttFeedback,
  feedbackText,
  idealLineSteps,
  idealText,
  aimText,
  Stepper,
  GuideCache,
  followsPutt,
  followPose,
} from "./sim/puttguide.mjs";
import { puttLine, stepLineLevel, setLineLevel, setPlaysLike, setGridColours, watchLineLevel, lineOptions } from "./puttline.js";
import { distanceMarks, regridDue } from "./sim/greenread.mjs";
import { randomGreen, FLAT_GREEN, SEVERITY, SEVERITY_NAMES, nudgeAim as stepAim, clampAim, clampSlope, aimForCups, startLine, matLine, aimWords, greenWords, isFlat, CUP } from "./sim/puttgreen.mjs";
import { SectionView } from "./sectionview.js";
import { makeShotTracer, TracerSet } from "./look/tracer.js";
import { KEEP_PRACTICE, tracerColour } from "./sim/tracer.mjs";
import { GolfPong } from "./golfpong.js";
import { fitLens } from "./sim/upright.mjs";

const BALL_R = 0.02135;
const DISTANCES = [3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 35, 40, 50, 60];
const BUCKETS = [
  [0, 6, "Under 6 ft"],
  [6, 12, "6 - 12 ft"],
  [12, 25, "12 - 25 ft"],
  [25, 45, "25 - 45 ft"],
  [45, 999, "45 ft +"],
];
const ZONE_COLORS = { 10: "#ffd23f", 7: "#ffd23f", 5: "#9be15d", 3: "#4cc9f0", 1: "#ffffff" };

export class PuttingGreen {
  // view: the element over the picture (a celebration's banner, and the
  // line's big profile - sectionview.js).
  // later: the green built when first come into rather than now (the phone
  // app's page plays one place: app.js buildLater).
  constructor(panel, renderer, view = null, { later = false } = {}) {
    this.panel = panel;
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    // Far enough out for every cloud (look/environment.js).
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.02, 6000);
    this.settings = loadSetting("putting", {
      game: "practice",
      distanceFt: 10,
      uphill: 0.5,
      fallRight: 1,
      contours: "gentle",
      seed: 1,
      stimp: 10,
      cup: "normal",
      showGrid: true,
      slopeShade: false,
      next: "same",
      gameDistanceFt: 10,
      // The challenge's lag putting (30 - 50 ft) in place of one distance.
      gameLag: false,
      // One distance, or a random one between two limits each putt.
      distanceMode: null,
      minFt: 6,
      maxFt: 20,
      // How severe a random green (N) may be (sim/puttgreen.mjs SEVERITY).
      severity: "moderate",
    });
    // The aim off the mat, degrees right of the hole (← →): nought for
    // each new green, kept for the putts from the same one.
    this.aimDeg = 0;
    this.builtKey = null;
    // Before there was a choice, "new random putt" meant a random distance
    // (4 to 35 ft) as well as a random green: kept as it was.
    const s = this.settings;
    if (s.distanceMode === null) {
      s.distanceMode = s.next === "random" ? "random" : "fixed";
      if (s.next === "random") Object.assign(s, { minFt: 4, maxFt: 35 });
    }
    this.putts = [];
    this.rolling = null;
    this.resetTimer = 0;
    this.resultText = "";
    this.active = false;
    this.onChange = () => {};
    this.onToast = () => {};
    // Whose putts these are (app.js: whoever's hitting).
    this.hitter = () => "Player 1";
    // Everyone playing here, and making one the hitter (golf pong's two
    // players here take turns).
    this.playerNames = () => [];
    this.setHitterName = () => {};
    // Their colour, for the putts' lines (player 1's alone).
    this.hitterColour = () => tracerColour(0);
    this.challenge = new Challenge({ maxPoints: 10, onEvent: (e) => this.roundOver(e) });
    // Lag putting: the ten putts of the round being played (or of the next
    // to start), and the distance the ball is at now - which changes only
    // as the green is built for it, so a putt is always from where it shows.
    this.lagPlan = lagOrder();
    this.lagFt = this.lagPlan[0];
    // A quiet green: a light breeze and birds, no water.
    this.soundscape = soundscape({ wind: 0.25 });
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.light = addEnvironment(this.scene, renderer, { shadowSize: 30 }).light;
    this.ballShadow = new BallShadow(this.light.userData.sun, BALL_R);
    this.scene.add(this.ballShadow.mesh);
    // The ideal line for a green, kept for a few greens back (the same
    // putt again, or back to one just changed away from).
    this.ideals = new GuideCache(8);
    this.sounds = new Sounds();
    this.celebration = view ? new Celebration({ view, canvas: renderer.domElement, scene: this.scene, sounds: this.sounds, high: HIGH }) : null;
    if (this.celebration) this.celebration.onBannerGone = () => this.onChange();
    this.streaks = new Streaks({
      sounds: this.sounds,
      celebrate: (desc) => this.celebrate(desc),
      toast: (text, ms) => this.onToast(text, ms),
    });
    // Looking along the line a section at a time (I, or the panel's buttons).
    this.sections = new SectionView({ camera: this.camera, view });
    this.sections.onChange = () => {
      this.showGuide();
      this.onChange();
    };
    this.buildPanel();
    this.unbuilt = later;
    if (!later) {
      this.buildGreen();
      if (this.isPong) this.usePong(true);
    }
    // The ideal line setting changed on the course: the same here.
    watchLineLevel(() => {
      const box = this.panel.querySelector("#putt-line");
      if (box) box.value = puttLine.level;
      const help = this.panel.querySelector("#putt-playslike");
      if (help) help.checked = puttLine.playsLike;
      const colours = this.panel.querySelector("#putt-gridcolours");
      if (colours) colours.checked = puttLine.gridColours;
      const legend = this.panel.querySelector("#putt-legend");
      if (legend) legend.hidden = !puttLine.gridColours;
      // (A green not built yet draws its read once it is.)
      if (this.unbuilt) return;
      this.drawRead();
      this.describePutt();
    });
  }

  get isPong() {
    return this.settings.game === "pong";
  }
  // Golf pong picked and there to hand over to. (While it's being made it
  // already asks for the picture's notes - the overlay - and isn't there
  // yet: the owner's "golf pong doesn't start" was that.)
  get pongOn() {
    return this.isPong && !!this.pong;
  }

  // Golf pong: its scene, camera and sounds in place of the green's while
  // it's played (app.js draws whatever these are).
  usePong(on) {
    if (on) {
      this.pong ??= new GolfPong(this.panel.querySelector("#putt-pong"), this.renderer, {
        hitter: () => this.hitter(),
        players: () => this.playerNames(),
        setHitter: (name) => this.setHitterName(name),
        toast: (text, ms) => this.onToast(text, ms),
        onChange: () => this.onChange(),
      });
      this.greenParts ??= { scene: this.scene, camera: this.camera, soundscape: this.soundscape };
      this.pong.resize(this.aspect ?? 1);
      Object.assign(this, { scene: this.pong.scene, camera: this.pong.camera, soundscape: this.pong.soundscape });
    } else if (this.greenParts) {
      Object.assign(this, this.greenParts);
    }
  }

  // Whether the picture is moving (app.js pictureMoving): golf pong's own
  // ball and camera.
  pictureMoving() {
    return this.pongOn && this.pong.moving;
  }

  get isGame() {
    return this.settings.game === "distance";
  }
  // The challenge as lag putting: ten long putts, a different length each.
  get isLag() {
    return this.isGame && !!this.settings.gameLag;
  }
  // Yards to the hole, for another launch monitor's connector (app.js
  // sendClub).
  targetYards() {
    return this.distanceFt / 3;
  }
  get distanceFt() {
    if (this.isLag) return this.lagFt;
    return this.isGame ? this.settings.gameDistanceFt : this.settings.distanceFt;
  }
  get distance() {
    return this.distanceFt * FOOT;
  }
  get cup() {
    return CUPS[this.settings.cup] ?? CUPS.normal;
  }
  // The distance challenge at one distance: no hole, a target with a half
  // circle just past it (sim/scoring.mjs scorePace). Lag putting keeps its
  // hole.
  get noHole() {
    return this.isGame && !this.isLag;
  }
  get green() {
    const s = this.settings;
    if (this.isGame) return { stimp: s.stimp, uphill: 0, fallRight: 0, contours: [] };
    return { stimp: s.stimp, uphill: s.uphill, fallRight: s.fallRight, contours: this.contours ?? [] };
  }
  // The personal-best key for the current challenge.
  get gameKey() {
    const s = this.settings;
    // (The target zone's scores kept apart from the hole's, from before.)
    return s.gameLag ? `putt:lag:${s.cup}:s${s.stimp}` : `putt:${s.gameDistanceFt}ft:zone:s${s.stimp}`;
  }
  // Lag putting: a new round's ten. Online, the host's order for everyone.
  newLagPlan() {
    const seed = this.net?.setup?.seed;
    return lagOrder(Number.isFinite(seed) ? seed : undefined);
  }
  // Where the next lag putt is from: the round's next, or the first of the
  // next round's.
  get nextLagFt() {
    const r = this.challenge.round;
    return r?.lag && !r.finished ? r.lag[r.scores.length] : this.lagPlan[0];
  }
  // The ball (and the green round it) to a lag putt's distance: the green
  // is built again only when it's a different one.
  toLag(ft) {
    if (ft === this.lagFt) return false;
    this.lagFt = ft;
    this.save();
    return true;
  }
  // The practice's distance as set: one, a random one between two limits,
  // or the ladder.
  get distanceSetting() {
    const s = this.settings;
    return { mode: s.next === "ladder" ? "ladder" : s.distanceMode, value: s.distanceFt, min: s.minFt, max: s.maxFt };
  }
  // The key a practice's most-in-a-row is kept under: the distance setting
  // and the cup.
  get streakKey() {
    const s = this.settings;
    return streakKey("putt", distanceKey(this.distanceSetting), s.cup === "normal" ? "" : (CUPS[s.cup]?.name ?? s.cup).toLowerCase());
  }

  heightAt(px, pz) {
    return greenHeight(this.green, px, pz);
  }
  // The same surface in world coordinates, for building and drawing.
  worldHeight = (wx, wz) => greenHeight(this.green, -wz, wx);
  worldGradient = (wx, wz) => {
    const [gx, gz] = greenGradient(this.green, -wz, wx);
    return [gz, -gx];
  };
  worldNormal = (wx, wz) => {
    const [gx, gz] = this.worldGradient(wx, wz);
    return new THREE.Vector3(-gx, 1, -gz).normalize();
  };

  // Rebuilds everything that depends on the green, the hole or the mode.
  buildGreen() {
    this.unbuilt = false;
    forgetFlags(this.world);
    // The last green's putts' lines.
    this.tracers?.clear();
    // The last green's slope shading had a material of its own.
    this.shade?.material.dispose();
    this.world.traverse((o) => {
      o.geometry?.dispose();
      disposeSurface(o.material); // sand and water, with their fields (look/sandwater.js)
    });
    this.world.clear();
    this.sections.attach(this.world);
    this.resultText = "";
    // A green changed mid-roll: the last putt's "Rolling..." goes with it.
    const box = this.panel.querySelector("#putt-result");
    if (box && /Rolling/.test(box.textContent)) box.textContent = "Putt when ready";
    const s = this.settings;
    const d = this.distance;
    // A different green: the aim starts straight at the hole again.
    if (this.greenKey !== this.builtKey) this.aimDeg = 0;
    this.builtKey = this.greenKey;
    this.aimGroup = new THREE.Group();
    this.world.add(this.aimGroup);
    this.contours = this.isGame ? [] : makeContours(s.contours, s.seed, d, { uphill: s.uphill, fallRight: s.fallRight });

    const along = Math.max(9, d / 2 + 5);
    const across = Math.max(8, d / 2 + 4) * 0.85;
    const built = buildGreenScene(this.world, {
      heightAt: this.worldHeight,
      normalAt: this.worldNormal,
      green: { cx: 0, cz: -Math.max(4, d / 2), rx: across, rz: along, seed: 21 },
      hole: this.noHole ? null : { x: 0, z: -d, r: this.cup.radius, style: s.cup },
      seed: 5,
      // Its ring of trees grown its own way for each green.
      treeSeed: 5 + (this.isGame ? 0 : (s.seed ?? 0) % 100003),
    });
    // (No hole: the target's spot stands in for it - the camera, the zones
    // and a celebration are all round it.)
    this.holeWorld = built.holeWorld ?? new THREE.Vector3(0, this.worldHeight(0, -d), -d);
    this.flag = built.flag;
    this.cupMark = built.cupMark;

    // Practice: the grid. Challenge: the scoring zones round the hole.
    this.grid = null;
    this.gridLook = null;
    if (!this.isGame) {
      this.gridLook = { inside: built.inside, across, d };
      this.makeGrid(0);
    } else {
      this.world.add(this.scoringZones(d));
    }
    // The slope shading, when it's on: made when first wanted for a green.
    this.shade = null;
    this.shadeArea = { inside: built.inside, bounds: { x0: -(across + 0.6), x1: across + 0.6, z0: -Math.max(4, d / 2) - along - 0.6, z1: -Math.max(4, d / 2) + along + 0.6 } };
    this.showShade();

    this.ball = makeBall(BALL_R);
    this.world.add(this.ball);
    this.readGroup = new THREE.Group();
    this.world.add(this.readGroup);
    // Each putt's line stays on this green, the last dozen, only the last
    // one bright.
    this.tracers = new TracerSet(this.world, { keep: KEEP_PRACTICE });
    this.tracer = null;
    applyReflections(this.scene, this.world);
    fitShadows(this.light, this.scene);
    // The slope along the line, as figures, and what it plays like.
    this.fig = lineFigures(this.green, d);
    this.lastFeedback = null;
    this.resetBall();
    // The line to look along a section at a time: this green, this putt.
    this.sections.setPutt({
      green: this.green,
      distance: d,
      toWorld,
      address: () => ({ position: this.addressCam, look: this.addressLook }),
    });
    this.startIdeal();
    this.drawRead();
    this.drawAim();
    this.describePutt();
    this.renderGame();
  }

  // The practice grid, squared to the putt: the hole straight ahead, or
  // the aim (aim, radians right of it) once it's been turned and left
  // there a moment (sim/greenread.mjs regridDue).
  makeGrid(aim) {
    const { inside, across, d } = this.gridLook;
    const s = this.settings;
    const shown = this.grid ? this.grid.group.visible : s.showGrid;
    if (this.grid) {
      this.world.remove(this.grid.group);
      this.grid.dispose();
    }
    this.grid = new GreenGrid({
      heightAt: this.worldHeight,
      gradientAt: this.worldGradient,
      inside,
      bounds: { x0: -Math.min(across - 0.5, 4.3), x1: Math.min(across - 0.5, 4.3), z0: -(d + 3), z1: 1.8 },
      stimp: s.stimp,
      // Squared to the putt (world: the hole straight ahead, or the aim),
      // with a distance mark every 5 ft, then 10.
      origin: [0, 0],
      toward: [d * Math.sin(aim), -d * Math.cos(aim)],
      marks: distanceMarks(this.distanceFt),
      // Coloured by how steep, or plain (puttline.js gridColours).
      colours: () => puttLine.gridColours,
    });
    this.grid.group.visible = shown;
    this.world.add(this.grid.group);
    this.gridAim = aim;
    this.aimTurnedAt = performance.now();
  }

  // ---- The aim off the mat --------------------------------------------------------

  // The mat's own frame: the player stands behind the ball looking along
  // the mat, which is turned aimDeg right of the line to the hole. The
  // camera sits in this frame, so a turn of the aim swings the green round
  // on the screen as it does on the course; the putt itself is worked out
  // in the hole's frame (startLine).
  get aimRad() {
    return (this.aimDeg * Math.PI) / 180;
  }
  // A point of the mat's frame (x right, z forward negative, as the
  // world's are with the aim straight) in the world.
  matToWorld(mx, y, mz, out = new THREE.Vector3()) {
    const c = Math.cos(this.aimRad);
    const sn = Math.sin(this.aimRad);
    return out.set(mx * c - mz * sn, y, mx * sn + mz * c);
  }
  worldToMat(wx, wz) {
    const c = Math.cos(this.aimRad);
    const sn = Math.sin(this.aimRad);
    return [wx * c + wz * sn, -wx * sn + wz * c];
  }

  // ← / →: turn the aim a quarter degree (Shift: a degree), practice only -
  // the challenge's green is flat, so there's nothing to aim off for.
  nudgeAim(dir, big = false) {
    if (this.pongOn) return this.pong.nudgeAim(dir, big);
    if (this.isGame) return this.onToast("Flat green in the challenge - aim at the hole", 1800);
    if (this.rolling) return this.onToast("Turn the aim before the putt", 1500);
    this.setAim(stepAim(this.aimDeg, dir, big));
  }
  setAim(deg, { toast = true } = {}) {
    this.aimDeg = clampAim(deg);
    this.aimTurnedAt = performance.now();
    // Aiming is done from behind the ball.
    this.sections.reset();
    this.placeCamera();
    this.drawAim();
    this.describePutt();
    // (The aim's there to see: not a message to keep - sim/gametext.mjs.)
    if (toast) this.onToast(aimWords(this.aimDeg, this.distance), 1400, { quick: true });
    this.onChange();
  }
  // Where the read says to aim, as the aim.
  aimAtRead() {
    if (this.isGame) return this.onToast("No read in the distance challenge", 1800);
    const ideal = this.readNow();
    if (!ideal?.ok) return this.onToast("No line holes this one - aim it yourself", 2000);
    this.setAim(ideal.hla);
  }
  aimAtHole() {
    this.setAim(0);
  }
  aimWordsNow() {
    return this.isGame ? "Flat green in the challenge - the aim stays at the hole" : aimWords(this.aimDeg, this.distance);
  }

  // The aim line: from the ball along the mat to the hole's distance, with
  // a ring where it ends - only once the aim is off the hole, so a putt
  // straight at it isn't under a second line.
  drawAim() {
    if (!this.aimGroup) return;
    clearGroup(this.aimGroup);
    if (this.isGame || Math.abs(this.aimDeg) < 0.01) return;
    const d = this.distance;
    const pts = [];
    const v = new THREE.Vector3();
    for (let k = 0; k <= 60; k++) {
      this.matToWorld(0, 0, -(d * k) / 60, v);
      pts.push(new THREE.Vector3(v.x, this.worldHeight(v.x, v.z) + 0.02, v.z));
    }
    this.aimLook ??= {
      line: new THREE.LineDashedMaterial({ color: 0xffb347, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.85 }),
      ring: new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -10, polygonOffsetUnits: -16 }),
    };
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), this.aimLook.line);
    line.computeLineDistances();
    line.renderOrder = 3;
    this.aimGroup.add(line);
    const end = pts[pts.length - 1];
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.07, 0.1, 32).rotateX(-Math.PI / 2), this.aimLook.ring);
    ring.position.set(end.x, end.y + 0.01, end.z);
    ring.renderOrder = 3;
    this.aimGroup.add(ring);
  }

  // The camera crouched behind the ball, looking along the mat (the aim):
  // a bit higher for long putts so the grid reads.
  placeCamera() {
    const ballPos = this.ball.position;
    const d = this.distance;
    const lift = Math.min(0.8, d * 0.04);
    this.camBack = 2.6 + lift;
    this.matToWorld(0, ballPos.y + 1.1 + lift, this.camBack, this.camera.position);
    // Where the mat points, level with the hole, a little above it, pulled
    // a fifth of the way back to the ball.
    this.look = this.matToWorld(0, this.holeWorld.y + 0.3, -d).lerp(ballPos, 0.2);
    this.camera.lookAt(this.look);
    // The view behind the ball, for the section views to come back to.
    this.addressCam = this.camera.position.clone();
    this.addressLook = this.look.clone();
  }

  // The green changed by voice or the menu: a new random one (how severe),
  // a flat one, a slope, contours, a distance, or the aim.
  //   { random: severity | null } | { flat: true } | { uphill } | { breaks }
  //   | { contours } | { distance } | { aim: { cups | degrees, side } |
  //   "hole" | "read" }
  voice(cmd) {
    if (this.isPong) return { why: "That's for putting practice - golf pong has its own green" };
    if (this.isGame && !cmd.distance) return { why: "That's for putting practice - the challenge's green is flat" };
    const s = this.settings;
    if (cmd.aim) {
      if (this.rolling) return { why: "Turn the aim before the putt" };
      if (cmd.aim === "hole") this.aimAtHole();
      else if (cmd.aim === "read") {
        const ideal = this.readNow();
        if (!ideal?.ok) return { why: "No line holes this one - aim it yourself" };
        this.setAim(ideal.hla, { toast: false });
      } else if (cmd.aim.cups != null) this.setAim(aimForCups(cmd.aim.cups * cmd.aim.side, this.distance), { toast: false });
      else this.setAim((cmd.aim.degrees ?? 0) * cmd.aim.side, { toast: false });
      const words = aimWords(this.aimDeg, this.distance);
      return { done: words.toLowerCase(), short: words };
    }
    if (cmd.distance != null) {
      const ft = Math.round(cmd.distance);
      if (ft < 2 || ft > 80) return { why: "A putt is from 2 to 80 ft" };
      if (this.isGame) Object.assign(s, { gameDistanceFt: ft, gameLag: false });
      else {
        s.distanceMode = "fixed";
        s.distanceFt = ft;
      }
      this.save();
      return { done: `${ft} ft`, short: `${ft} ft putt` };
    }
    if (cmd.random !== undefined) {
      if (cmd.random) s.severity = cmd.random;
      this.randomPutt();
      return { done: `new green: ${greenWords(s, CONTOUR_NAMES)}`, short: `New green: ${greenWords(s, CONTOUR_NAMES)}` };
    }
    if (cmd.flat) Object.assign(s, FLAT_GREEN);
    if (cmd.uphill !== undefined) s.uphill = clampSlope(cmd.uphill);
    if (cmd.breaks !== undefined) s.fallRight = clampSlope(cmd.breaks);
    if (cmd.contours) s.contours = cmd.contours in CONTOUR_NAMES ? cmd.contours : s.contours;
    this.save();
    const words = greenWords(s, CONTOUR_NAMES);
    return { done: `green: ${words}`, short: `Green: ${words}` };
  }

  // Coloured bands on the green showing what each finish scores: gold for
  // the 0-2 ft past "perfect pace" zone and so on. The green is flat in the
  // challenge, so they lie at height 0.
  scoringZones(d) {
    const group = new THREE.Group();
    const r0 = this.cup.radius + 0.03;
    // Ring pieces in the XY plane, laid flat so +y points past the hole.
    const band = (inner, outer, from, length, color, opacity) => {
      const m = new THREE.Mesh(
        new THREE.RingGeometry(inner, outer, 64, 1, from, length).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }),
      );
      m.position.set(0, 0.003, -d);
      group.add(m);
    };
    if (this.isLag) {
      // Lag putting: short or past alike - a 3 ft circle, a 6 ft one.
      const [dead, twoPutt] = LAG_ZONES.slice(1, 3);
      band(r0, dead.within * FOOT, 0, Math.PI * 2, ZONE_COLORS[dead.points], 0.3);
      band(dead.within * FOOT, twoPutt.within * FOOT, 0, Math.PI * 2, ZONE_COLORS[twoPutt.points], 0.2);
      band(twoPutt.within * FOOT - 0.015, twoPutt.within * FOOT, 0, Math.PI * 2, ZONE_COLORS[1], 0.55);
      return group;
    }
    if (this.noHole) {
      // No hole: a white spot where it would be, a line across it, and the
      // half circle just past it to finish in (the owner: "the idea is to
      // hit just past the hole semicircle, not before and not too far
      // past"), a band beyond it for a touch firm.
      const [zone, firm] = PACE_ZONES;
      band(0, zone.within * FOOT, 0, Math.PI, ZONE_COLORS[zone.points], 0.34);
      band(zone.within * FOOT, firm.within * FOOT, 0, Math.PI, ZONE_COLORS[firm.points], 0.22);
      band(zone.within * FOOT - 0.012, zone.within * FOOT, 0, Math.PI, "#ffffff", 0.6);
      band(0, firm.within * FOOT, -0.004, 0.008, "#ffffff", 0.7);
      band(0, firm.within * FOOT, Math.PI - 0.004, 0.008, "#ffffff", 0.7);
      band(0, 0.035, 0, Math.PI * 2, "#ffffff", 0.9);
      return group;
    }
    band(r0, 2 * FOOT, 0, Math.PI, ZONE_COLORS[7], 0.3); // 0-2 ft past
    band(2 * FOOT, 3 * FOOT, 0, Math.PI, ZONE_COLORS[5], 0.22); // 2-3 ft past
    band(r0, 2 * FOOT, Math.PI, Math.PI, ZONE_COLORS[3], 0.2); // just short
    band(5 * FOOT - 0.015, 5 * FOOT, 0, Math.PI * 2, ZONE_COLORS[1], 0.55); // 5 ft circle
    // A line across at the hole marks past from short.
    band(r0, 3 * FOOT, -0.004, 0.008, "#ffffff", 0.6);
    band(r0, 3 * FOOT, Math.PI - 0.004, 0.008, "#ffffff", 0.6);
    return group;
  }

  resetBall() {
    this.rolling = null;
    // Back behind the ball, if the view was off along the line.
    this.sections.reset();
    // A fresh putt: the last one's ideal line (at "after") and the camera
    // following it go. Its feedback stays until the next is struck.
    this.lastFinished = false;
    this.follow = null;
    if (this.readGroup) this.drawRead();
    this.showFlag();
    toWorld(0, this.heightAt(0, 0) + BALL_R, 0, this.ball.position);
    this.placeCamera();
    if (this.fig) this.describePutt();
  }

  // The green tinted by how steep it is (greengrid.js slopeShade), with
  // the setting on - practice only: the challenge's green is flat.
  showShade() {
    const on = this.settings.slopeShade && !this.isGame;
    if (on && !this.shade && this.shadeArea) {
      this.shade = slopeShade({ heightAt: this.worldHeight, gradientAt: this.worldGradient, ...this.shadeArea });
      // Faint beyond the putt's channel, as the grid is.
      if (this.grid) this.shade.userData.setChannel(this.grid.axes.origin, [this.holeWorld.x, this.holeWorld.z]);
      this.world.add(this.shade);
    }
    if (this.shade) this.shade.visible = on;
  }

  // The flag for this putt (sim/flagstick.mjs): in while lining up from
  // beyond 15 ft, lifted out and faded as the putt is struck (update);
  // from 15 ft or less, out from the start - only the hole shows. Nothing
  // else goes by it: the camera, the read and the grid use holeWorld.
  showFlag(struck = false) {
    this.flagPlan = flagFor({ putting: true, distance: this.distance });
    this.flagSince = struck && this.flagPlan === "pulled" ? 0 : null;
    setFlagLook(this.flag, flagLook(this.flagPlan, this.flagSince));
  }

  // Whether the ideal line shows: never in the challenge; before the putt
  // with the setting at "before and after", once it has finished with it
  // at "after" as well.
  get lineShowing() {
    if (this.isGame) return false;
    const level = puttLine.level;
    return level === "always" || (level === "after" && this.lastFinished);
  }

  // The ideal line for this green: worked out a few milliseconds a frame
  // from just after the green is on screen (update), never holding it up;
  // or at once when it's wanted before then (readNow).
  startIdeal() {
    const key = this.greenKey;
    this.ideal = this.ideals.get(key) ?? null;
    this.idealJob = this.ideal ? null : new Stepper(idealLineSteps(this.green, this.distance, { holeRadius: this.cup.radius }));
    this.idealKey = key;
  }
  get greenKey() {
    const s = this.settings;
    return this.isGame ? `game:${this.distanceFt}:${s.stimp}:${s.cup}` : [s.distanceFt, s.uphill, s.fallRight, s.contours, s.seed, s.stimp, s.cup].join(":");
  }
  // Called each frame: a little more of the search, if it's still going.
  stepIdeal() {
    if (!this.idealJob) return;
    if (this.idealJob.run(4)) this.idealDone();
  }
  idealDone() {
    this.ideal = this.ideals.set(this.idealKey, this.idealJob.value);
    this.idealJob = null;
    this.drawRead();
    this.describePutt();
  }

  drawRead() {
    // (Not before the green's built: a change to the putting line's
    // settings - Menu, or the panel - reaches every putting green, the one
    // not drawn yet too. The owner's Phone check, 5 November 2026: "Cannot
    // read properties of undefined (reading 'children')".)
    if (!this.readGroup) return;
    clearGroup(this.readGroup);
    this.readGroup.visible = this.lineShowing;
    if (!this.readGroup.visible || !this.ideal?.path.length) return;
    const pts = this.ideal.path.map((p) => toWorld(p[0], this.heightAt(p[0], p[1]) + 0.006, p[1]));
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      // See-through (though it isn't), so it's drawn with the tracers and
      // after them: over the putts' lines left on the green, not under.
      new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.1, gapSize: 0.07, transparent: true }),
    );
    line.computeLineDistances();
    line.renderOrder = 3;
    this.readGroup.add(line);
    // Aim marker level with the hole.
    const aimSide = this.ideal.aim;
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: 0x4cc9f0 }));
    toWorld(this.distance, this.heightAt(this.distance, aimSide) + 0.03, aimSide, marker.position);
    this.readGroup.add(marker);
  }

  // The read for this green (the ideal line), worked out now if it hasn't been.
  readNow() {
    if (this.idealJob) {
      this.idealJob.finish();
      this.idealDone();
    }
    return this.ideal;
  }

  // The guide line: before a putt, the slope along the line and what it
  // plays like (and the ideal line, with it on before the putt); after
  // one, what the stroke would have done on the flat, what the slope did
  // and the pace against what was needed (and the ideal line, with it on).
  guideLines() {
    const lines = [];
    // What it plays like: once a putt's been struck from here, or before
    // with that help on.
    if (this.fig) lines.push(lineText(this.fig, { playsLike: puttLine.playsLike || !!this.lastFeedback }));
    // The last putt's, until the next is struck or the green changes.
    if (this.lastFeedback && !this.rolling) lines.push(feedbackText(this.lastFeedback));
    if (this.lineShowing && !this.rolling && this.ideal) lines.push(idealText(this.ideal));
    // The mat aimed off the hole (← →).
    if (!this.isGame && !this.rolling && Math.abs(this.aimDeg) >= 0.01) lines.push(aimWords(this.aimDeg, this.distance));
    // Looking from a stop along the line: where it is, its heights, its slope.
    if (!this.rolling) lines.push(...this.sections.lines());
    return lines;
  }

  // "10 ft, 0.5% uphill, breaks right, gentle contours, stimp 10".
  plainDescription() {
    const s = this.settings;
    if (this.isLag) return `Lag putting: ${this.lagFt} ft (${LAG_DISTANCES[0]} - ${LAG_DISTANCES.at(-1)}), ${this.cup.name.toLowerCase()}, stimp ${s.stimp}`;
    if (this.isGame) return `Distance challenge: ${s.gameDistanceFt} ft to the zone, stimp ${s.stimp}`;
    const range = s.next !== "ladder" && s.distanceMode === "random" ? ` (${Math.min(s.minFt, s.maxFt)} - ${Math.max(s.minFt, s.maxFt)} ft at random)` : "";
    const slope = [];
    if (Math.abs(s.uphill) >= 0.25) slope.push(`${fmt(Math.abs(s.uphill), 1)}% ${s.uphill > 0 ? "uphill" : "downhill"}`);
    // With contours the tilt is only the overall fall; the humps can
    // override it locally, so it isn't called the break.
    const wavy = s.contours !== "none";
    if (Math.abs(s.fallRight) >= 0.25) {
      slope.push(wavy ? `falls ${s.fallRight > 0 ? "right" : "left"} overall` : `breaks ${s.fallRight > 0 ? "right" : "left"}`);
    }
    if (wavy) slope.push(`${CONTOUR_NAMES[s.contours].toLowerCase()} contours`);
    return `${s.distanceFt} ft${range}, ${slope.join(", ") || "flat"}, stimp ${s.stimp}`;
  }

  // What bay view lays over the picture.
  overlay() {
    if (this.pongOn) return this.pong.overlay();
    const last = this.putts[this.putts.length - 1];
    let note = this.plainDescription();
    const stats = [];
    if (this.isGame) {
      const r = this.challenge.round;
      note += r ? ` - putt ${this.challenge.progress}` : " - putt to start a round";
      stats.push({ label: "Score", value: r ? String(r.total) : "-", unit: "", accent: true });
      stats.push({ label: "Personal best", value: String(this.challenge.best(this.gameKey) ?? "-") });
    }
    if (last) {
      const b = last.ball;
      // (The last putt's numbers are of: "shot" - the command centre's Last
      // shot box has them, This shot the rest: sim/thisshot.mjs.)
      stats.push({ label: "Ball speed", value: fmt(b.speedMph, 1), unit: "mph", accent: !this.isGame, of: "shot" });
      if (!this.isGame) {
        stats.push({ label: "Start line", value: Math.abs(b.hla) < 0.05 ? "0°" : `${fmt(Math.abs(b.hla), 1)}° ${b.hla > 0 ? "R" : "L"}`, of: "shot" });
      }
      stats.push({ label: "Needed", value: fmt(last.needed.speedMph, 1), unit: "mph", of: "shot" });
      if (!this.rolling) {
        stats.push({ label: "Leave", value: last.result.holed ? "In" : fmt(last.result.leaveFeet, 1), unit: last.result.holed ? "" : "ft", of: "shot" });
      }
    }
    if (!this.isGame && this.putts.length) {
      stats.push({ label: "Session", value: `${this.putts.filter((p) => p.result.holed).length}/${this.putts.length}`, unit: "holed" });
    }
    if (!this.isGame) {
      const run = this.streaks.run(this.hitter(), this.streakKey);
      stats.push({ label: "In a row", value: String(run.count) });
      stats.push({ label: "Best", value: String(Math.max(run.best, run.count) || "-") });
    }
    if (!this.isGame && Math.abs(this.aimDeg) >= 0.01) stats.push({ label: "Aim", value: `${fmt(Math.abs(this.aimDeg), 2)}° ${this.aimDeg > 0 ? "R" : "L"}` });
    const title = this.rolling || this.celebration?.showing ? "" : this.resultText || "Putt when ready";
    // The result line whole, for This shot (the panel's: "4.2 ft away - 3.1
    // ft long, 2.8 ft right", the points).
    const full = this.panel.querySelector("#putt-result")?.textContent ?? "";
    return { club: "PT", title, full, note, stats, guide: this.guideLines() };
  }

  describePutt() {
    const el = this.panel.querySelector("#putt-describe");
    this.onChange();
    if (!el) return;
    let text = this.plainDescription().replace(/^([^,]*),/, "<b>$1</b>,");
    if (this.lineShowing && this.ideal?.ok && !this.lastFinished) {
      text += `<br>Read: <b>${aimText(this.ideal.aim)}</b>, ` +
        `about <b>${fmt(this.ideal.speedMph, 1)} mph</b> ball speed to finish 18 in past`;
    }
    if (!this.isGame && Math.abs(this.aimDeg) >= 0.01) text += `<br>${esc(aimWords(this.aimDeg, this.distance))}`;
    el.innerHTML = text;
    this.showGuide();
  }

  // The guide line in the panel, under the numbers.
  showGuide() {
    const el = this.panel.querySelector("#putt-guide");
    if (el) el.innerHTML = this.guideLines().map((l) => `<span>${esc(l)}</span>`).join("<br>");
  }

  // What the "test putt" button sends: the ideal putt with a human amount of error.
  testPutt() {
    if (this.pongOn) return this.pong.testPutt();
    const ideal = this.readNow();
    return {
      speedMph: ideal.speedMph * (1 + (Math.random() - 0.5) * 0.3),
      hla: matLine(ideal.hla, this.isGame ? 0 : this.aimDeg) + (Math.random() - 0.5) * 3,
    };
  }

  buildPanel() {
    const s = this.settings;
    const opt = (list, value, label = (v) => v) =>
      list.map((v) => `<option value="${v}" ${String(v) === String(value) ? "selected" : ""}>${label(v)}</option>`).join("");
    const slopes = [];
    for (let v = -4; v <= 4.001; v += 0.5) slopes.push(Number(v.toFixed(1)));
    const cupOptions = opt(Object.keys(CUPS), s.cup, (k) => `${CUPS[k].name} (${CUPS[k].short})`);
    this.panel.innerHTML = `
      <section class="tabs" data-cc="head">
        <button data-game="practice">Practice</button>
        <button data-game="distance">Distance challenge</button>
        <button data-game="pong">Golf pong</button>
      </section>
      <section class="putt-result" id="putt-result" data-cc="off">Putt when ready</section>
      <section class="numbers" id="putt-numbers" data-cc="off">
        ${["Ball speed", "Start line", "Needed", "Leave"].map((n) => `<div class="stat"><span>${n}</span><b data-k="${n}">-</b></div>`).join("")}
      </section>
      <section data-cc="off"><p id="putt-guide" class="guide"></p></section>
      <section data-cc="off"><p id="putt-describe" class="describe"></p></section>
      <section class="line-read" id="putt-read"></section>

      <div id="putt-practice">
        <section class="settings">
          <h3>This putt</h3>
          <label class="dist-choice">Distance <select id="putt-dist-mode">
            <option value="fixed">One distance</option>
            <option value="random">A random one each putt</option>
          </select></label>
          <label class="dist-fixed">How far <select id="putt-distance">${opt(DISTANCES, s.distanceFt, (v) => `${v} ft`)}</select></label>
          <label class="dist-random">Between <span><select id="putt-min">${opt(DISTANCES, s.minFt, (v) => `${v} ft`)}</select> and <select id="putt-max">${opt(DISTANCES, s.maxFt, (v) => `${v} ft`)}</select></span></label>
          <label>Up / down hill <select id="putt-uphill">${opt(slopes, s.uphill, (v) => (v === 0 ? "Level" : `${Math.abs(v)}% ${v > 0 ? "uphill" : "downhill"}`))}</select></label>
          <label>Side slope <select id="putt-side">${opt(slopes, s.fallRight, (v) => (v === 0 ? "None" : `${Math.abs(v)}% - breaks ${v > 0 ? "right" : "left"}`))}</select></label>
          <label>Contours <select id="putt-contours">${opt(Object.keys(CONTOUR_NAMES), s.contours, (k) => CONTOUR_NAMES[k])}</select></label>
          <label>Green speed <select id="putt-stimp">${opt([7, 8, 9, 10, 11, 12, 13, 14], s.stimp, (v) => `Stimp ${v}`)}</select></label>
          <label>Cup <select id="putt-cup">${cupOptions}</select></label>
          <label>After each putt <select id="putt-next">
            <option value="same">Same green again</option>
            <option value="random">A new random green</option>
            <option value="ladder">Ladder 3 - 6 - 9 - 12 - 15 - 20 ft</option>
          </select></label>
          <label class="check"><input type="checkbox" id="putt-grid"> Grid with pace markers</label>
          <label class="check" title="The grid's markers coloured by how steep the green is under them. Off, plain white: the grid's lines and the markers' pace show the slopes on their own. The same setting as the course's"><input type="checkbox" id="putt-gridcolours" ${puttLine.gridColours ? "checked" : ""}> Colours on the grid</label>
          <label class="check" title="The green tinted by how steep it is, in the markers' colours: clear under 1%, deeper as it steepens"><input type="checkbox" id="putt-shade"> Slope shading</label>
          <div class="legend" id="putt-legend" ${puttLine.gridColours ? "" : "hidden"}>Markers roll downhill, faster where it's steeper:
            ${SLOPE_LEGEND.map(([t, c]) => `<span><i style="background:${c}"></i>${t}</span>`).join("")}</div>
          <label title="The line a putt finishing about 18 in past would have taken, and where to aim to start it on it (T)">Ideal line <select id="putt-line">${lineOptions()}</select></label>
          <label class="check" title="A help: what the putt plays like (the distance it needs on the flat) said before it's struck. Off, it's said after the first putt from here"><input type="checkbox" id="putt-playslike" ${puttLine.playsLike ? "checked" : ""}> Plays-like before the putt</label>
          <label title="How steep a random green (N) may be: a real pin is cut where the green is under about 3%">Random green <select id="putt-severity">${opt(SEVERITY, s.severity, (k) => SEVERITY_NAMES[k])}</select></label>
          <div class="buttons"><button id="putt-random">Random green (N)</button><button id="putt-flat">Flat green</button></div>
          <label>Aim off the mat <span class="muted small">← → a quarter degree, Shift a degree</span></label>
          <div class="buttons aim-buttons"><button id="putt-aim-left" data-head title="Aim a cup left">◀ cup</button><button id="putt-aim-hole" data-head>At the hole</button><button id="putt-aim-read" data-head title="Where the read says to aim">At the read</button><button id="putt-aim-right" data-head title="Aim a cup right">cup ▶</button></div>
        </section>
        <section>
          <h3>In a row</h3>
          <div id="putt-streak"></div>
        </section>
        <section>
          <h3>Session</h3>
          <table class="clubs" id="putt-stats"></table>
          <button id="putt-clear">Clear session</button>
        </section>
      </div>

      <div id="putt-pong" hidden></div>

      <div id="putt-game">
        <section class="settings">
          <h3>Distance challenge</h3>
          <p class="muted small" id="game-rules"></p>
          <table class="zones" id="game-zones"></table>
          <label title="One distance for all ten putts, scored for pace - or lag putting: two each from ${LAG_DISTANCES.join(", ")} ft, mixed up, scored for leaving a sure second putt">Distance <select id="game-distance">${opt(DISTANCES, s.gameDistanceFt, (v) => `${v} ft`)}<option value="lag">Lag: ${LAG_DISTANCES[0]} - ${LAG_DISTANCES.at(-1)} ft</option></select></label>
          <label>Cup <select id="game-cup">${cupOptions}</select></label>
          <label>Green speed <select id="game-stimp">${opt([7, 8, 9, 10, 11, 12, 13, 14], s.stimp, (v) => `Stimp ${v}`)}</select></label>
        </section>
        <section id="game-round"></section>
        <section class="round-buttons" data-cc="head"><button id="game-start">Start round (N)</button></section>
        <section>
          <h3>Personal bests</h3>
          <table class="clubs" id="game-bests"></table>
        </section>
      </div>`;
    const $ = (id) => this.panel.querySelector(id);
    $("#putt-next").value = s.next;
    $("#putt-dist-mode").value = s.distanceMode;
    $("#putt-grid").checked = s.showGrid;
    $("#putt-shade").checked = !!s.slopeShade;

    for (const btn of this.panel.querySelectorAll("[data-game]")) {
      btn.addEventListener("click", () => this.setGame(btn.dataset.game));
    }
    const practiceChange = () => {
      s.distanceMode = $("#putt-dist-mode").value;
      s.minFt = Number($("#putt-min").value);
      s.maxFt = Number($("#putt-max").value);
      if (s.distanceMode === "fixed") s.distanceFt = Number($("#putt-distance").value);
      // Into a random one: the first one now, between the limits.
      else if (s.distanceFt < Math.min(s.minFt, s.maxFt) || s.distanceFt > Math.max(s.minFt, s.maxFt)) s.distanceFt = nextDistance({ mode: "random", min: s.minFt, max: s.maxFt }, s.distanceFt);
      s.uphill = Number($("#putt-uphill").value);
      s.fallRight = Number($("#putt-side").value);
      s.contours = $("#putt-contours").value;
      s.stimp = Number($("#putt-stimp").value);
      s.cup = $("#putt-cup").value;
      s.next = $("#putt-next").value;
      s.severity = $("#putt-severity").value;
      s.showGrid = $("#putt-grid").checked;
      this.save();
    };
    for (const id of ["#putt-dist-mode", "#putt-distance", "#putt-min", "#putt-max", "#putt-uphill", "#putt-side", "#putt-contours", "#putt-stimp", "#putt-cup", "#putt-next", "#putt-severity"]) {
      $(id).addEventListener("change", practiceChange);
    }
    // The ideal line: one setting with the course's greens.
    $("#putt-line").addEventListener("change", () => setLineLevel($("#putt-line").value));
    $("#putt-playslike").addEventListener("change", () => setPlaysLike($("#putt-playslike").checked));
    $("#putt-gridcolours").addEventListener("change", () => setGridColours($("#putt-gridcolours").checked));
    // The grid toggles without rebuilding the green.
    $("#putt-grid").addEventListener("change", () => {
      s.showGrid = $("#putt-grid").checked;
      saveSetting("putting", s);
      if (this.grid) this.grid.group.visible = s.showGrid;
    });
    // So does the shading.
    $("#putt-shade").addEventListener("change", () => {
      s.slopeShade = $("#putt-shade").checked;
      saveSetting("putting", s);
      this.showShade();
    });
    const gameChange = () => {
      const dist = $("#game-distance").value;
      s.gameLag = dist === "lag";
      if (!s.gameLag) s.gameDistanceFt = Number(dist);
      s.cup = $("#game-cup").value;
      s.stimp = Number($("#game-stimp").value);
      // A different challenge: any round in progress no longer counts.
      this.challenge.round = null;
      // Lag putting starts from a fresh round's first putt.
      this.lagPlan = this.newLagPlan();
      this.lagFt = this.lagPlan[0];
      this.save();
    };
    for (const id of ["#game-distance", "#game-cup", "#game-stimp"]) $(id).addEventListener("change", gameChange);
    $("#game-start").addEventListener("click", () => this.startRound());
    $("#putt-random").addEventListener("click", () => this.randomPutt());
    $("#putt-flat").addEventListener("click", () => this.flatGreen());
    $("#putt-aim-left").addEventListener("click", () => this.aimCups(-1));
    $("#putt-aim-right").addEventListener("click", () => this.aimCups(1));
    $("#putt-aim-hole").addEventListener("click", () => this.aimAtHole());
    $("#putt-aim-read").addEventListener("click", () => this.aimAtRead());
    $("#putt-clear").addEventListener("click", () => {
      this.putts = [];
      this.renderStats();
    });
    this.sections.panel($("#putt-read"), (i) => this.pickSection(i));
    this.showGamePanels();
    this.syncPanel();
    this.renderStats();
  }

  save() {
    saveSetting("putting", this.settings);
    this.syncPanel();
    // (Golf pong has its own mat: the green's is built when it's back.)
    if (!this.isPong) this.buildGreen();
    this.renderStreak();
    if (this.active && !this.isGame) this.streaks.switchTo(this.hitter(), this.streakKey);
  }

  setGame(game) {
    if (this.settings.game === game) return;
    this.settings.game = game;
    this.celebration?.clear();
    if (game !== "practice") this.streaks.stop();
    this.usePong(game === "pong");
    this.showGamePanels();
    this.save();
  }

  // Coming in and going: a celebration or a heartbeat doesn't carry on in
  // another mode, and the line's big profile goes with it.
  setActive(on) {
    this.active = on;
    // (Built now if it waited: the constructor's later.)
    if (on && this.unbuilt) {
      this.buildGreen();
      if (this.isPong) this.usePong(true);
    }
    this.sections.setActive(on);
    if (!on) {
      this.celebration?.clear();
      this.streaks.stop();
    } else if (!this.isGame && !this.isPong) {
      this.renderStreak();
      this.streaks.switchTo(this.hitter(), this.streakKey);
    }
  }

  // Whoever's hitting has changed: their run and best.
  hitterChanged() {
    this.renderStreak();
    if (this.active && !this.isGame && !this.isPong) this.streaks.switchTo(this.hitter(), this.streakKey);
    this.pong?.renderPanel();
    this.onChange();
  }

  renderStreak() {
    const el = this.panel.querySelector("#putt-streak");
    if (el) el.innerHTML = this.streaks.html(this.hitter(), "putt", this.streakKey);
  }

  // A celebration round the hole.
  celebrate(desc) {
    if (!this.celebration || !this.active) return;
    const focus = this.holeWorld.clone();
    const away = new THREE.Vector3().subVectors(this.camera.position, focus);
    this.celebration.play(desc, { focus, camera: this.camera, away, groundAt: (x, z) => this.worldHeight(x, z) });
    this.onChange();
  }

  showGamePanels() {
    const $ = (id) => this.panel.querySelector(id);
    $("#putt-practice").hidden = this.isGame || this.isPong;
    $("#putt-game").hidden = !this.isGame;
    $("#putt-pong").hidden = !this.isPong;
    // The practice and challenge's own read-outs: not golf pong's.
    for (const id of ["#putt-result", "#putt-numbers", "#putt-read"]) $(id).hidden = this.isPong;
    for (const id of ["#putt-guide", "#putt-describe"]) $(id).parentElement.hidden = this.isPong;
    for (const btn of this.panel.querySelectorAll("[data-game]")) btn.classList.toggle("active", btn.dataset.game === this.settings.game);
  }

  syncPanel() {
    const s = this.settings;
    const $ = (id) => this.panel.querySelector(id);
    $("#putt-dist-mode").value = s.distanceMode;
    $("#putt-min").value = s.minFt;
    $("#putt-max").value = s.maxFt;
    // A distance drawn at random, or up the ladder, may not be one of the
    // list's: it's added for the moment, so the box says what's played.
    const sel = $("#putt-distance");
    if (![...sel.options].some((o) => Number(o.value) === s.distanceFt)) sel.insertAdjacentHTML("beforeend", `<option value="${s.distanceFt}">${s.distanceFt} ft</option>`);
    sel.value = s.distanceFt;
    const ladder = s.next === "ladder";
    for (const el of this.panel.querySelectorAll("#putt-practice .dist-choice")) el.hidden = ladder;
    for (const el of this.panel.querySelectorAll("#putt-practice .dist-fixed")) el.hidden = ladder || s.distanceMode === "random";
    for (const el of this.panel.querySelectorAll("#putt-practice .dist-random")) el.hidden = ladder || s.distanceMode !== "random";
    $("#putt-uphill").value = s.uphill;
    $("#putt-side").value = s.fallRight;
    $("#putt-contours").value = s.contours;
    $("#putt-stimp").value = s.stimp;
    $("#putt-severity").value = s.severity;
    $("#game-stimp").value = s.stimp;
    $("#putt-cup").value = s.cup;
    $("#game-cup").value = s.cup;
    $("#game-distance").value = s.gameLag ? "lag" : s.gameDistanceFt;
    this.renderZones();
  }

  // The challenge's rules and zones: one distance's for pace, or lag
  // putting's.
  renderZones() {
    const rules = this.panel.querySelector("#game-rules");
    const table = this.panel.querySelector("#game-zones");
    if (!rules || !table) return;
    const lag = !!this.settings.gameLag;
    rules.textContent = lag
      ? `Flat green. Ten long putts - two each from ${LAG_DISTANCES.join(", ")} ft, mixed up - scored for leaving a sure second putt, short or past alike:`
      : "Flat green, no hole. Ten putts from one distance to finish in the half circle just past the white line - not short, not too far past:";
    // (No hole: past the line, within so far of its spot, or nothing.)
    const zones = lag ? LAG_ZONES : [...PACE_ZONES.map((z) => ({ ...z, past: true })), { points: 0, label: "Short, or too firm" }];
    table.innerHTML = zones
      .map(
        (z) => `<tr><td><i style="background:${ZONE_COLORS[z.points] ?? (z.points === 10 ? "#1a1714" : "transparent")}"></i></td>
          <td>${z.label}${z.within ? ` <span class="muted">(${z.past === true ? "past, " : z.past === false ? "short, " : ""}within ${z.within} ft)</span>` : ""}</td>
          <td><b>${z.points}</b></td></tr>`,
      )
      .join("");
  }

  // N: a new random putt in practice, a fresh round in the challenge.
  next() {
    if (this.pongOn) return this.pong.newGame();
    if (this.isGame) this.startRound();
    else this.randomPutt();
  }

  // T: the read - the ideal line - off, after each putt, or before and
  // after, from the mat. Practice only: a challenge never shows it.
  toggleRead() {
    if (this.isPong) return this.onToast("No read in golf pong", 1600);
    if (this.isGame) {
      this.onToast("No read in the distance challenge", 1800);
      return;
    }
    this.onToast(stepLineLevel(), 1800, { quick: true });
    this.onChange();
  }

  // I (Shift + I back): the view steps along the line - 25%, 50%, 75%,
  // behind the hole, side-on, and back behind the ball - before the putt.
  stepSection(delta = 1) {
    if (this.isPong) return;
    if (!this.canLookAlong()) return;
    const stop = this.sections.step(delta);
    if (stop) this.onToast(stop.id === "ball" ? "Back behind the ball" : `Line: ${stop.name.toLowerCase()}`, 1400, { quick: true });
  }
  // A stop's button in the panel.
  pickSection(i) {
    if (this.canLookAlong()) this.sections.go(i);
  }
  // Only while lining up: not while the ball rolls, nor while the last
  // putt's finish is still being looked at.
  canLookAlong() {
    if (!this.rolling && !this.lastFinished) return true;
    this.onToast("Look along the line before the putt", 1800);
    return false;
  }

  // A new random green - its slopes and contours, within what the Random
  // green setting allows (sim/puttgreen.mjs) - and, with a random distance,
  // a new distance too. One distance stays as it's set.
  randomPutt() {
    const s = this.settings;
    s.distanceFt = nextDistance({ mode: s.distanceMode, value: s.distanceFt, min: s.minFt, max: s.maxFt }, s.distanceFt);
    Object.assign(s, randomGreen(s.severity));
    this.save();
  }
  // A flat green: no slope, no contours.
  flatGreen() {
    if (isFlat(this.settings)) return this.onToast("Already flat", 1200, { quick: true });
    Object.assign(this.settings, FLAT_GREEN);
    this.save();
    this.onToast("Flat green", 1400, { quick: true });
  }
  // The aim a cup (the hole's width at the hole) left or right of where it is.
  aimCups(dir) {
    if (this.isGame) return this.onToast("Flat green in the challenge - aim at the hole", 1800);
    const cups = Math.round(((Math.tan(this.aimRad) * this.distance) / CUP) * 2) / 2 + dir;
    this.setAim(aimForCups(cups, this.distance));
  }

  startRound() {
    // Lag putting: a round started again part way through gets ten new
    // putts; one started by its first putt is from where the ball is.
    const lag = this.isLag;
    if (lag && this.challenge.round && !this.challenge.round.finished) this.lagPlan = this.newLagPlan();
    this.challenge.start(this.gameKey);
    if (lag) {
      this.challenge.round.lag = this.lagPlan;
      this.toLag(this.lagPlan[0]);
    }
    this.resultText = "";
    this.renderGame();
    this.onToast(lag ? `Lag putting - 10 putts, ${LAG_DISTANCES[0]} to ${LAG_DISTANCES.at(-1)} ft` : `${this.settings.gameDistanceFt} ft challenge - 10 putts`);
    this.onChange();
  }

  // The challenge's name, for the stats and online.
  get gameName() {
    return this.settings.gameLag ? `Lag putting challenge (${LAG_DISTANCES[0]} - ${LAG_DISTANCES.at(-1)} ft)` : `${this.settings.gameDistanceFt} ft putting challenge`;
  }

  // Online (netside.js NetTurns): the host's challenge, this bay's
  // players one after another, each putt's points going to every bay.
  startNet(net) {
    const s = this.settings;
    const u = net.setup;
    if (Number.isFinite(u.distance)) s.gameDistanceFt = u.distance;
    s.gameLag = !!u.lag;
    if (typeof u.cup === "string" && u.cup in CUPS) s.cup = u.cup;
    if (Number.isFinite(u.stimp)) s.stimp = u.stimp;
    this.stopNet();
    this.net = net;
    // Lag putting: the host's ten, in the host's order, for every player.
    this.challenge.round = null;
    this.lagPlan = this.newLagPlan();
    this.lagFt = this.lagPlan[0];
    // Into the distance challenge (its panel, no practice streak).
    if (s.game !== "distance") this.setGame("distance");
    else this.save();
    this.startRound();
    if (net.player) this.onToast(`Online: ${net.player.name} first - ${s.gameLag ? `lag putts, ${LAG_DISTANCES[0]} - ${LAG_DISTANCES.at(-1)} ft` : `${s.gameDistanceFt} ft`}, 10 putts`, 3000);
  }

  stopNet() {
    clearTimeout(this.netTimer);
    this.net = null;
    this.pong?.stopNet();
  }

  // Online golf pong (app.js): into the game, the host's mat and match.
  startPong(net, game) {
    this.stopNet();
    this.setGame("pong");
    this.usePong(true);
    this.pong.startNet(net, game);
  }
  pongNet(game) {
    this.pong?.applyNet(game);
  }

  // A player here has had their ten: on to the next, after a moment.
  netNext() {
    if (!this.net) return;
    const next = this.net.next();
    clearTimeout(this.netTimer);
    if (next) {
      this.netTimer = setTimeout(() => {
        if (this.net && (!this.challenge.round || this.challenge.round.finished)) this.startRound();
      }, 3800);
      setTimeout(() => this.net && this.onToast(`${next.name}'s go - 10 putts`, 3000), 3600);
    } else setTimeout(() => this.net && this.onToast("Everyone here has played - waiting for the other bays", 3500), 3600);
  }

  roundOver({ total, isBest, previous }) {
    // Online: the next player here - once this round's last putt and score
    // have gone into the stats as the player's who played them.
    if (this.net) setTimeout(() => this.netNext(), 0);
    const r = this.challenge.round;
    this.onGame?.({ kind: "putting-challenge", id: r.id, key: r.key, score: total, name: this.gameName });
    // Lag putting: the next round's ten (online, the same again).
    if (r.lag) this.lagPlan = this.newLagPlan();
    const msg = isBest ? (previous === null ? `First score: ${total}` : `New PB! ${total} (was ${previous})`) : `Round over: ${total}`;
    this.onToast(msg, 3500);
  }

  renderGame() {
    const el = this.panel.querySelector("#game-round");
    if (!el) return;
    el.innerHTML = this.challenge.html(this.gameKey, "Putt");
    // By distance, lag putting after them all.
    const far = (key) => (key.split(":")[1] === "lag" ? 999 : parseInt(key.split(":")[1]));
    const bests = this.challenge.bestsFor("putt:").sort((a, b) => far(a.key) - far(b.key));
    this.panel.querySelector("#game-bests").innerHTML =
      `<tr><th>Distance</th><th>Target</th><th>Stimp</th><th>Best</th><th>Date</th></tr>` +
      (bests
        .map((b) => {
          const [, dist, cup, stimp] = b.key.split(":");
          const here = b.key === this.gameKey ? ' class="here"' : "";
          return `<tr${here}><td>${dist === "lag" ? `Lag ${LAG_DISTANCES[0]} - ${LAG_DISTANCES.at(-1)} ft` : dist.replace("ft", " ft")}</td><td>${cup === "zone" ? "Zone, no hole" : (CUPS[cup]?.short ?? cup)}</td><td>${stimp.slice(1)}</td><td>${b.score}</td><td>${b.date}</td></tr>`;
        })
        .join("") || `<tr><td colspan="5" class="muted">No rounds finished yet</td></tr>`);
    this.panel.querySelector("#game-start").textContent = this.challenge.round && !this.challenge.round.finished ? "Restart round (N)" : "Start round (N)";
  }

  nextPutt() {
    const s = this.settings;
    // Lag putting: on to the round's next distance.
    if (this.isLag && this.toLag(this.nextLagFt)) return;
    if (!this.isGame && s.next === "random") return this.randomPutt();
    if (!this.isGame && s.next === "ladder") {
      const ladder = [3, 6, 9, 12, 15, 20];
      const i = ladder.indexOf(s.distanceFt);
      s.distanceFt = ladder[(i + 1) % ladder.length];
      return this.save();
    }
    // The same green, from another distance.
    if (!this.isGame && s.distanceMode === "random") {
      s.distanceFt = nextDistance({ mode: "random", min: s.minFt, max: s.maxFt }, s.distanceFt);
      return this.save();
    }
    this.resetBall();
  }

  onShot(entry) {
    if (this.pongOn) return this.pong.onShot(entry);
    if (this.rolling || this.resetTimer > 0) this.nextPuttNow();
    // The last one's party is over.
    this.celebration?.clear();
    // Struck while looking along the line: straight back behind the ball.
    if (this.sections.showing) {
      this.sections.reset();
      this.camera.position.copy(this.addressCam);
      this.look.copy(this.addressLook);
      this.camera.lookAt(this.look);
    }
    // In the challenge, putting starts a round if none is running.
    if (this.isGame && (!this.challenge.round || this.challenge.round.finished)) {
      // Online, everyone here has had their go: nothing more to score.
      if (this.net?.done) {
        this.onToast("Everyone here has played - the scoreboard has the rest (Menu, Play, Online play to leave)", 3000);
        return;
      }
      this.startRound();
    }
    const b = entry.ball;
    // The ball starts where the mat points plus the stroke's own line.
    const line = { speedMph: b.speedMph, hla: startLine(b.hla, this.isGame ? 0 : this.aimDeg) };
    const result = simulatePutt(line, this.green, this.distance, this.noHole ? null : this.cup.radius);
    this.showFlag(true);
    const putt = { ...entry, result, distanceFt: this.distanceFt, needed: this.readNow(), aimDeg: this.isGame ? 0 : this.aimDeg };
    // How far that stroke would have gone on the flat, and what the slope
    // did to it: shown once it has finished rolling, whatever the setting.
    this.lastFeedback = null;
    putt.feedback = puttFeedback(this.green, this.distance, { ...b, hla: line.hla }, { holed: result.holed, fig: this.fig });
    // A long putt, or one whose ball would go small on screen, is followed
    // down the green.
    this.follow = followsPutt({ distance: this.distance, path: result.path, fovDeg: this.camera.fov, camBack: this.camBack }) ? { at: [0, 0] } : null;
    this.putts.push(putt);
    // Its line on the green as it rolls, in the hitter's colour, lying on
    // the grass - and down into the cup after the ball (y, the path's
    // height, sim/cup.mjs), never up in the air with a hop out of it.
    const place = ([x, z, , y]) => toWorld(x, this.heightAt(x, z) + 0.003 + Math.min(0, y ?? 0), z);
    this.tracer = this.tracers.add(makeShotTracer(result.path, 0, place, { colour: this.hitterColour(), putt: true }));
    // The drop into the cup (or the tick of a lip-out) as the ball gets there.
    this.rolling = { putt, elapsed: 0, index: 0, cues: new CueQueue(puttCues(result)) };
    this.set("Ball speed", `${fmt(b.speedMph, 1)} mph`);
    this.set("Start line", b.hla === 0 ? "0.0°" : `${fmt(Math.abs(b.hla), 1)}° ${b.hla > 0 ? "R" : "L"}`);
    // What was needed, as it would have to be struck off the mat.
    const need = matLine(putt.needed.hla, putt.aimDeg);
    this.set("Needed", `${fmt(putt.needed.speedMph, 1)} mph ${fmt(Math.abs(need), 1)}°${need >= 0 ? "R" : "L"}`);
    this.set("Leave", "...");
    this.panel.querySelector("#putt-result").textContent = "Rolling...";
    this.resultText = "";
    this.onChange();
  }

  // A new putt while the last is still rolling: settle (and score) the last
  // one first, so a quick second putt never loses a result.
  nextPuttNow() {
    if (this.rolling) this.finish(this.rolling.putt);
    this.resetTimer = 0;
    // Lag putting: from the round's next distance, as it would have been.
    if (this.isLag && this.toLag(this.nextLagFt)) return;
    this.resetBall();
  }

  set(k, v) {
    const el = this.panel.querySelector(`[data-k="${k}"]`);
    if (el) el.textContent = v;
  }

  update(dt) {
    if (this.pongOn) return this.pong.update(dt);
    // The yellow glow and closing circle round the cup, sized for the camera.
    this.cupMark?.update(this.camera, dt);
    if (this.flagSince != null) {
      this.flagSince += dt;
      setFlagLook(this.flag, flagLook(this.flagPlan, this.flagSince));
      if (this.flagSince > FLAG_FADE) this.flagSince = null;
    }
    const r = this.rolling;
    if (r) {
      r.elapsed += dt;
      const path = r.putt.result.path;
      while (r.index < path.length - 1 && path[r.index + 1][2] <= r.elapsed) r.index++;
      const a = path[r.index];
      const b = path[Math.min(r.index + 1, path.length - 1)];
      const k = Math.min(1, Math.max(0, (r.elapsed - a[2]) / (b[2] - a[2] || 1)));
      const px = a[0] + (b[0] - a[0]) * k;
      const pz = a[1] + (b[1] - a[1]) * k;
      // Its height off the green: down into the cup, riding the lip,
      // hopping out off the back edge (sim/cup.mjs).
      const py = (a[3] ?? 0) + ((b[3] ?? 0) - (a[3] ?? 0)) * k;
      toWorld(px, this.heightAt(px, pz) + py + BALL_R, pz, this.ball.position);
      this.ball.rotation.x -= dt * 12;
      this.tracer?.userData.reveal(r.index, k);
      for (const c of r.cues.due(r.elapsed)) audio.cue(c, this.ball.position);
      if (this.follow) this.follow.at = [px, pz];
      else {
        // A short putt: drift a little after it, the whole of it in view.
        const ballPos = this.ball.position;
        const [mx, mz] = this.worldToMat(ballPos.x, ballPos.z);
        const want = this.matToWorld(mx * 0.5, ballPos.y + 1.1, Math.min(2.6, mz + 3.5));
        this.camera.position.lerp(want, 1 - Math.exp(-dt * 0.9));
      }
      if (r.index >= path.length - 1) this.finish(r.putt);
    } else if (this.resetTimer > 0) {
      this.resetTimer -= dt;
      if (this.resetTimer <= 0) this.nextPutt();
    }
    // Following a long putt: behind the ball down the line, then settling
    // where it finished (followPose), until the next putt.
    if (this.follow) {
      const pose = followPose({ start: [0, 0], hole: [this.distance, 0], ball: this.follow.at }, { startBack: this.camBack });
      const [cx, cz] = pose.cam;
      const [lx, lz] = pose.look;
      const camWant = toWorld(cx, this.heightAt(cx, cz) + pose.up, cz);
      const lookWant = toWorld(lx, this.heightAt(lx, lz), lz);
      this.camera.position.lerp(camWant, 1 - Math.exp(-dt * 2.2));
      this.look.lerp(lookWant, 1 - Math.exp(-dt * 3));
    }
    this.stepIdeal();
    if (this.grid?.group.visible) {
      // Turned to a new aim once it's been left there a moment.
      // (By the clock: a frame's dt is capped, so a slow picture would wait longer.)
      const still = (performance.now() - (this.aimTurnedAt ?? 0)) / 1000;
      if (!this.rolling && this.gridLook && regridDue({ builtAim: this.gridAim, aim: this.aimRad, still })) this.makeGrid(this.aimRad);
      this.grid.update(dt, this.camera);
    }
    this.celebration?.update(dt, this.camera);
    // Looking along the line from a stop, or on the way: the section view
    // has the camera; otherwise the camera looks where it always does.
    if (!this.sections.drive(dt)) this.camera.lookAt(this.look);
    this.ballShadow.update(this.ball.position, this.worldHeight);
  }

  finish(putt) {
    this.rolling = null;
    this.tracer?.userData.revealAll();
    const res = putt.result;
    const box = this.panel.querySelector("#putt-result");
    let scoreText = "";
    let game;
    if (this.isGame && this.challenge.round && !this.challenge.round.finished) {
      const score = this.isLag ? scoreLag(res) : this.noHole ? scorePace(res) : scorePutt(res);
      putt.score = score;
      scoreText = `+${score.points} ${score.label}`;
      game = { kind: "putting-challenge", id: this.challenge.round.id, key: this.gameKey };
      // Online: its points to every bay (before the round can end, and
      // the go pass to the next player here).
      this.net?.scored(this.challenge.round.scores.length, score.points, score.label);
      this.challenge.add(score);
      this.renderGame();
    }
    // For the player's stats: distances in yards, like every other shot.
    this.onRecord?.({
      factsKey: putt.factsKey,
      club: "PT",
      swing: "putt",
      ball: putt.ball,
      result: { carry: 0, total: (putt.distanceFt + (res.holed ? 0 : res.longFeet)) / 3, offline: (res.rightFeet ?? 0) / 3 },
      target: { distance: putt.distanceFt / 3, finish: (res.leaveFeet ?? 0) / 3, long: (res.longFeet ?? 0) / 3, made: res.holed },
      lie: "green",
      game,
    });
    // Practice keeps a run of putts holed; the challenge celebrates each
    // one that drops.
    if (!this.isGame) {
      putt.streak = this.streaks.add({ player: this.hitter(), kind: "putt", key: this.streakKey, success: res.holed });
      this.renderStreak();
    } else if (res.holed || (this.noHole && putt.score?.points === PACE_ZONES[0].points)) {
      // (No hole: one that finishes in the zone is the one celebrated.)
      this.celebrate(streakCelebration("putt", afterTry(newRun(0), true)));
    }
    if (res.holed) {
      box.innerHTML = `<b class="made">Holed!</b>${scoreText ? ` <span class="points">+${putt.score.points}</span>` : ""}`;
      this.set("Leave", "In");
      this.resultText = `<b class="made">Holed!</b>${scoreText ? ` +${putt.score.points}` : ""}`;
    } else {
      const long = res.longFeet;
      const along = `${fmt(Math.abs(long), 1)} ft ${long >= 0 ? "long" : "short"}`;
      box.innerHTML = `<b>${fmt(res.leaveFeet, 1)} ft</b> away - ${along}, ${lr(res.rightFeet, 1, "ft")}${res.lipped ? " - lipped out" : ""}` +
        (scoreText ? `<br><span class="points">${scoreText}</span>` : "");
      this.set("Leave", `${fmt(res.leaveFeet, 1)} ft`);
      this.resultText = scoreText || `${fmt(res.leaveFeet, 1)} ft ${long >= 0 ? "long" : "short"}${res.lipped ? " - lipped out" : ""}`;
    }
    // The feedback, and the ideal line with it on after the putt. A little
    // longer to read it before the next putt.
    this.lastFinished = true;
    this.lastFeedback = putt.feedback;
    this.drawRead();
    this.showGuide();
    this.resetTimer = this.lineShowing ? 4 : 2.8;
    this.renderStats();
    this.onChange();
  }

  renderStats() {
    const table = this.panel.querySelector("#putt-stats");
    if (!table) return;
    const practice = this.putts.filter((p) => !p.score);
    const rows = BUCKETS.map(([lo, hi, label]) => {
      const list = practice.filter((p) => p.distanceFt >= lo && p.distanceFt < hi);
      if (!list.length) return "";
      const made = list.filter((p) => p.result.holed).length;
      const missed = list.filter((p) => !p.result.holed);
      const leave = missed.length ? missed.reduce((a, p) => a + p.result.leaveFeet, 0) / missed.length : 0;
      const tapIn = list.filter((p) => p.result.leaveFeet < 3).length;
      return `<tr><td>${label}</td><td>${made}/${list.length}</td><td>${Math.round((100 * made) / list.length)}%</td>
        <td>${missed.length ? fmt(leave, 1) + " ft" : "-"}</td><td>${Math.round((100 * tapIn) / list.length)}%</td></tr>`;
    }).join("");
    table.innerHTML = `<tr><th>Distance</th><th>Made</th><th>%</th><th>Avg miss</th><th>Inside 3 ft</th></tr>${
      rows || `<tr><td colspan="5" class="muted">No putts yet</td></tr>`
    }`;
  }

  resize(aspect) {
    this.aspect = aspect;
    this.pong?.resize(aspect);
    if (this.greenParts) {
      fitLens(this.greenParts.camera, aspect);
    }
    // (A picture taller than it's wide - the phone held upright - with the
    // lens widened: sim/upright.mjs.)
    fitLens(this.camera, aspect);
    this.sections.refresh();
  }
}
