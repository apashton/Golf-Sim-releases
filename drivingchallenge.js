// The driving challenge: nine tee shots, one a hole, each scored for how
// far down the hole it went and where it finished. Every player gets the
// same nine holes, each drawn to the length of their own average drive
// (sim/drivingchallenge.mjs has the holes and the points). The ball flies
// and runs exactly as on the course (courseplay.mjs).
//
// A player's average comes from what they typed in the side panel, their
// last warm-up, their own driver numbers in the stats (recorder.js - full
// swings, carry and roll), their driver shots on the range this session
// (only taken for granted with one player: the range doesn't know who hit
// what), or - if none of those - three warm-up drives before their first
// hole.

import * as THREE from "three";
import { prepareHole, playShot, BAG, BAG_ORDER } from "./sim/courseplay.mjs";
import {
  DRIVING_HOLES,
  DEFAULT_DRIVE,
  WARMUP_DRIVES,
  FAIRWAYS,
  drivingHoles,
  scaleHole,
  drivePoints,
  driveShare,
  averageDrive,
  countedDrives,
  lastIsMishit,
  clampDrive,
  driveTotal,
  alongHole,
  holeAdvice,
  shapeWord,
  woodStop,
  averageSource,
  statsDrive,
} from "./sim/drivingchallenge.mjs";
import { BallShadow, toWorld, sizeBall } from "./scenery.js";
import { REAL_BALL_R, ballDrawRadius } from "./sim/ballsize.mjs";
import { fitShadows } from "./look/environment.js";
import { makeShotTracer } from "./look/tracer.js";
import { tracerColour, drawnHeight } from "./sim/tracer.mjs";
import { clearGroup } from "./look/dispose.js";
import { view, keepInView, clearOfTrees } from "./view.js";
import { HoleScenery, lookKeepingBall } from "./holeview.js";
import { audio } from "./audio/engine.js";
import { shotCues, CueQueue } from "./audio/cues.mjs";
import { fmt, saveSetting, esc } from "./util.js";
import { shotFacts } from "./recorder.js";
import { YARD } from "./sim/flight.mjs";
import { flightStep } from "./sim/preflight.mjs";

// (Its tracer, at the height the ball flies at.)
const BALL_R = 0.045;
// Seconds to look at where a drive finished before the next player's turn,
// and between warm-up drives.
const PAUSE = 3.6;
const PAUSE_WARMUP = 2.2;
// How the ground line and the list show where a drive finished.
const LIE_COLOUR = { fairway: 0x5ee06a, semi: 0xc8e05e, rough: 0xf0b43c, bunker: 0xf0d58c, deep: 0xf08a3c, trees: 0xff5a4e, lost: 0xff5a4e, water: 0x4ea8ff };
const hex = (c) => `#${c.toString(16).padStart(6, "0")}`;
const signed = (n) => (n < 0 ? `−${-n}` : String(n));

export class DrivingChallenge {
  constructor(host) {
    this.host = host;
    this.id = "driving";
    this.option = {
      label: "Fairways",
      choices: Object.fromEntries(Object.entries(FAIRWAYS).map(([k, f]) => [k, f.name])),
      fallback: "standard",
    };
    this.scenery = new HoleScenery({ scene: host.scene, world: host.world, light: host.light, challenge: "driving" });
    this.ballShadow = new BallShadow(host.light.userData.sun, BALL_R);
    this.ballShadow.mesh.visible = false;
    host.scene.add(this.ballShadow.mesh);
    this.look = new THREE.Vector3();
    this.camWant = new THREE.Vector3();
    this.lookWant = new THREE.Vector3();
    this.builtKey = null;
    this.flying = null;
    this.pause = null;
    this.message = "";
    this.last = null;
    this.warm = null;
    this.shot = null;
    this.club = "DR";
    // Each player's driver average from their stats, by name: a number,
    // null (not enough drives), or a promise while it's being asked for.
    this.statsDrives = new Map();
  }

  get match() {
    return this.host.match;
  }
  get holeIndex() {
    return this.match?.hole ?? 0;
  }
  get playerIndex() {
    return this.match?.playerIndex ?? 0;
  }
  // Shots played this turn (warm-ups too), so a game just begun can be
  // left without asking.
  get shotsThisTurn() {
    return (this.warm?.drives.length ?? 0) + (this.shot ? 1 : 0);
  }
  // The points for the hole in hand, for the scorecard, once it's played.
  get madeSoFar() {
    return this.shot?.points ?? "";
  }
  get focus() {
    return this.scenery.ball?.position.clone() ?? new THREE.Vector3();
  }
  share(total) {
    return driveShare(total);
  }

  // ---- Each player's average drive ---------------------------------------------------

  // What's kept about each player's driving, by name: { how, yards, last },
  // how being "warmup" (warm up again), "last" (the last warm-up's), "range"
  // or "typed", and last the last warm-up's average.
  get drivers() {
    return this.host.settings.drivers ?? {};
  }
  setDriver(name, value) {
    this.host.settings.drivers = { ...this.drivers, [name]: { ...this.drivers[name], ...value } };
    saveSetting("challenges", this.host.settings);
  }
  // The range's driver shots this session, averaged (null with under three).
  get rangeAverage() {
    return averageDrive(this.host.rangeDrives?.() ?? []);
  }
  // A player's driver average from their stats, or null while it's not
  // known (asked for the first time it's wanted; the panel and the cards
  // show it once it's in).
  statsAverage(name) {
    const v = this.statsDrives.get(name);
    if (v === undefined) {
      const ask = fetch(`/api/stats/player?name=${encodeURIComponent(name)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((report) => statsDrive(report))
        .catch(() => null)
        .then((yards) => {
          if (this.statsDrives.get(name) !== ask) return;
          this.statsDrives.set(name, yards);
          if (yards != null && this.host.state !== "playing") this.host.render();
        });
      this.statsDrives.set(name, ask);
      return null;
    }
    return typeof v === "number" ? v : null;
  }
  // Forgets what the stats said, so it's asked again (coming back to the
  // Challenges, or after a game has added drives).
  refreshStats() {
    this.statsDrives.clear();
  }
  // How a player's average is found: what they picked; or else their last
  // warm-up; or else their own stats; or else, playing alone, the range if
  // there's a session there; or a warm-up. With friends the range is only
  // used when picked for someone, since it can't tell whose drives they
  // were - otherwise everyone would get the same holes.
  howFor(name) {
    return averageSource(this.drivers[name], { range: !!this.rangeAverage, alone: this.host.players.length === 1, stats: this.statsAverage(name) != null });
  }
  // A player's average (yards), or null if it's to be found by warming up.
  averageFor(name) {
    const how = this.howFor(name);
    if (how === "typed") return clampDrive(this.drivers[name].yards);
    if (how === "last") return clampDrive(this.drivers[name].last);
    if (how === "stats") return this.statsAverage(name);
    if (how === "range") return this.rangeAverage;
    return null;
  }

  // ---- A game, a hole, a turn --------------------------------------------------------

  start(fairways, seed) {
    this.fairways = fairways in FAIRWAYS ? fairways : "standard";
    this.seed = seed;
    this.units = drivingHoles(seed, this.fairways);
    this.averages = this.match.players.map((p) => ({ yards: this.averageFor(p.name), how: this.howFor(p.name) }));
    // What each player's drive on each hole did, for the list down the side.
    this.played = this.match.players.map(() => Array(DRIVING_HOLES).fill(null));
    this.builtKey = null;
  }

  // Draws a hole scaled for `yards` (unless it's already up).
  buildHole(unit, yards) {
    const key = `${this.seed}:${unit.number}:${yards}`;
    if (this.builtKey === key) return;
    this.builtKey = key;
    this.layout = scaleHole(unit, yards);
    this.hole = prepareHole(this.layout);
    this.aim = this.layout.drive.aim;
    this.scenery.build(this.hole);
    this.lines = new THREE.Group();
    this.marks = new THREE.Group();
    this.host.world.add(this.lines, this.marks);
    this.tracer = null;
    this.drawLines();
    fitShadows(this.host.light, this.host.scene);
  }

  beginTurn() {
    this.flying = null;
    this.pause = null;
    this.shot = null;
    this.last = null;
    this.message = "";
    const avg = this.averages[this.playerIndex];
    const p = this.match.player;
    if (avg.yards == null) {
      // Warm-ups on the first hole, drawn for an everyday drive while
      // there's nothing better to go on.
      this.warm = { drives: [] };
      this.buildHole(this.units[0], DEFAULT_DRIVE);
      this.aim = this.layout.drive.aim;
      this.club = "DR";
      clearGroup(this.marks);
      this.clearTracer();
      this.drawLines();
      this.address(true);
      this.host.toast(`${this.host.multi ? `${p.name}: ` : ""}${WARMUP_DRIVES} warm-up drives to set your average`, 2800);
      return;
    }
    this.warm = null;
    this.setUpHole();
    const d = this.layout.drive;
    const where = `Hole ${this.holeIndex + 1} - ${shapeWord(d.shape, d.kind)}`;
    this.host.toast(this.host.multi ? `${p.name} to play - ${where}` : where, 2400);
  }

  setUpHole() {
    const yards = this.averages[this.playerIndex].yards;
    this.buildHole(this.units[this.holeIndex], yards);
    clearGroup(this.marks);
    this.clearTracer();
    this.aim = this.layout.drive.aim;
    this.club = this.suggestClub();
    this.drawLines();
    this.address(true);
  }

  // The driver, except where the fairway runs out: the longest club that
  // stops short of the water, going by the player's own driver distance.
  suggestClub() {
    const d = this.layout.drive;
    if (d.shape !== "layup") return "DR";
    const k = d.average / (BAG.DR.carry * 1.1);
    const total = (c) => BAG[c].carry * (BAG[c].carry > 180 ? 1.1 : 1.04) * k;
    return BAG_ORDER.find((c) => total(c) <= d.full + 6) ?? "PW";
  }

  // Some scenery for behind the picker: not used (the approach ladder's
  // green is shown), but here if the picker ever shows this game first.
  preview() {
    this.seed = 11;
    this.units = drivingHoles(11);
    this.buildHole(this.units[0], DEFAULT_DRIVE);
    this.aim = this.layout.drive.aim;
    this.address(true);
  }

  atRest() {
    this.flying = null;
    this.pause = null;
    this.clearTracer();
  }

  stop() {
    this.flying = null;
    this.pause = null;
    this.warm = null;
    this.shot = null;
    this.builtKey = null;
    this.ballShadow.mesh.visible = false;
  }

  // ---- On the ground: where to go ------------------------------------------------------

  // The target line (the shape the hole wants, in yellow, ending in a ring
  // at the target) and the aim (a short white line straight out from the
  // tee), both lying on the grass.
  drawLines() {
    const g = this.lines;
    if (!g) return;
    for (const o of g.children) (o.geometry.dispose(), o.material.dispose());
    g.clear();
    const d = this.layout.drive;
    if (!this.warm) {
      g.add(this.strip(d.line, 0.7, 0xffd84a, 0.85, true));
      g.add(this.ring(d.target, 4, 5.2, 0xffd84a, 0.9));
    }
    const reach = Math.min(90, d.average * 0.35);
    const a = this.aim ?? d.aim;
    const aimLine = [2, reach].map((r) => [Math.cos(a) * r, Math.sin(a) * r]);
    g.add(this.strip(aimLine, 0.25, 0xffffff, 0.75));
  }

  // A ribbon along points on the ground; dashed leaves every other stretch out.
  strip(points, width, colour, opacity, dashed = false) {
    const pts = [];
    // Finer, so it follows the ground.
    for (let i = 0; i < points.length - 1; i++) {
      const [ax, az] = points[i];
      const [bx, bz] = points[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 3));
      for (let k = 0; k < n; k++) pts.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
    }
    pts.push(points[points.length - 1]);
    const pos = [];
    const index = [];
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i];
      const [nx, nz] = pts[Math.min(pts.length - 1, i + 1)];
      const [px, pz] = pts[Math.max(0, i - 1)];
      const l = Math.hypot(nx - px, nz - pz) || 1;
      const sx = (-(nz - pz) / l) * width * 0.5;
      const sz = ((nx - px) / l) * width * 0.5;
      for (const s of [-1, 1]) {
        const w = this.scenery.at(x + sx * s, z + sz * s, 0.05);
        pos.push(w.x, w.y, w.z);
      }
      if (i < pts.length - 1 && (!dashed || Math.floor(i / 2) % 2 === 0)) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    return this.flatMesh(pos, index, colour, opacity);
  }

  ring([cx, cz], inner, outer, colour, opacity) {
    const seg = 48;
    const pos = [];
    const index = [];
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      for (const r of [inner, outer]) {
        const w = this.scenery.at(cx + Math.cos(a) * r, cz + Math.sin(a) * r, 0.05);
        pos.push(w.x, w.y, w.z);
      }
      if (i < seg) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    return this.flatMesh(pos, index, colour, opacity);
  }

  flatMesh(pos, index, colour, opacity) {
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

  // Where a drive finished: a disc in the colour of where it is.
  markFinish(rest, colour) {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(1.8, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: 0.9, depthWrite: false }),
    );
    this.scenery.at(rest[0], rest[1], 0.06, m.position);
    m.renderOrder = 3;
    this.marks.add(m);
  }

  // ←/→: the aim, a degree at a time.
  nudgeAim(dir) {
    if (this.flying || this.pause || !this.layout) return;
    this.aim += (dir * Math.PI) / 180;
    this.drawLines();
    this.address(true);
    this.host.changed();
  }

  // ---- Camera -----------------------------------------------------------------------

  // Up behind the tee, looking down the aim: higher than on the course,
  // so the way the fairway bends and where it runs out can be seen.
  address(snap) {
    this.placeBall([0, 0]);
    const b = this.scenery.ball.position;
    const dir = new THREE.Vector3(Math.sin(this.aim), 0, -Math.cos(this.aim));
    this.camWant.copy(b).addScaledVector(dir, -13).add(new THREE.Vector3(0, 6.5, 0));
    // The ball kept clear of the numbers along the bottom in bay view.
    lookKeepingBall(this.camWant, b, dir, 0.3, this.lookWant);
    this.addressLook = this.lookWant.clone();
    if (snap) {
      this.host.camera.position.copy(this.camWant);
      this.look.copy(this.lookWant);
    }
    this.ballShadow.mesh.visible = true;
  }

  // After a drive: high behind where it finished, so the fairway it found
  // or missed, and the ball, are both in the picture.
  viewFinish(rest) {
    const ball = this.scenery.at(rest[0], rest[1]);
    const heading = Math.atan2(rest[1], rest[0]);
    const dir = new THREE.Vector3(Math.sin(heading), 0, -Math.cos(heading));
    this.camWant.copy(ball).addScaledVector(dir, -55).add(new THREE.Vector3(0, 30, 0));
    this.lookWant.copy(ball).addScaledVector(dir, 12);
  }

  // On the ground it's a real ball (sim/ballsize.mjs).
  placeBall([x, z], y = 0) {
    this.ballR = sizeBall(this.scenery.ball, REAL_BALL_R);
    this.scenery.ballAt(x, z, y + this.ballR, this.scenery.ball.position);
  }

  // ---- Shots ------------------------------------------------------------------------

  onShot(entry) {
    if (!this.layout) return;
    if (this.flying) this.settle();
    if (this.pause) {
      const over = this.pause.over;
      this.endPause();
      // The turn was over: the shot is the next player's (or the game's
      // finished and it's no one's).
      if (over) return this.host.state === "playing" ? this.onShot(entry) : undefined;
    }
    if (this.shot) return;
    this.address(true);
    // Into the wood in a dog-leg's corner, in the air or along the ground,
    // and it stops there. The challenge's trees are its own rules (the
    // wood, lost beyond the tree line), so a ball isn't knocked about by
    // them one by one as it is on the course.
    const res = woodStop(this.layout, playShot(this.hole, [0, 0], "tee", entry.ball, this.aim, { club: this.club, trees: false }), this.hole.path);
    // The flight it flew, for the recording's and the command centre's
    // flight path, turned to the shot's frame (sim/shotflight.mjs).
    this.host.onFlight?.({ path: res.path, flightPoints: res.flightPoints, from: [0, 0], aim: this.aim });
    // Its tracer, flight and ground, in this player's colour, where it's
    // drawn as on the course (pathDrawn). The turn's earlier shots keep
    // theirs, faint.
    const drawn = this.scenery.pathDrawn(res.path, res.flightPoints);
    const place = ([x, y, z]) => toWorld(x, y + BALL_R, z);
    this.tracer = this.scenery.tracers.add(makeShotTracer(drawn, res.flightPoints, place, { colour: this.match.player?.colour ?? tracerColour(0) }));
    // Its sounds as the ball gets there: the landing, water, into the wood.
    this.flying = { res, entry, elapsed: 0, index: 0, cues: new CueQueue(shotCues(res, { lieAt: this.hole.lieAt })), drawn };
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
      const p = this.scenery.ball.position;
      if (view.follow) {
        const dir = new THREE.Vector3(Math.sin(this.aim), 0, -Math.cos(this.aim));
        const above = p.y - this.scenery.worldHeight(p.x, p.z);
        this.camWant.copy(p).addScaledVector(dir, -30).add(new THREE.Vector3(0, Math.max(4, above * 0.6 + 4), 0));
        clearOfTrees(this.scenery.cameraTrees, this.camWant, p);
        this.lookWant.copy(p);
      } else {
        keepInView(cam.position, this.addressLook ?? this.lookWant, p, this.lookWant);
      }
      if (f.index >= path.length - 1) this.settle();
    } else if (this.pause) {
      this.pause.t -= dt;
      if (this.pause.t <= 0) this.endPause();
    }
    const lerp = 1 - Math.exp(-dt * (f ? 1.6 : 2.2));
    cam.position.lerp(this.camWant, lerp);
    this.look.lerp(this.lookWant, 1 - Math.exp(-dt * 4));
    cam.lookAt(this.look);
    if (this.scenery.ball) this.ballShadow.update(this.scenery.ball.position, this.scenery.worldSurface, this.ballR ?? REAL_BALL_R);
  }

  // The drive has stopped: a warm-up measured, or a hole scored.
  settle() {
    const f = this.flying;
    if (!f) return;
    this.flying = null;
    this.tracer?.userData.revealAll();
    const res = f.res;
    const rest = res.rest;
    this.placeBall(rest, res.penalty?.kind === "water" ? -0.12 : 0);
    const sounds = this.host.sounds;
    if (this.warm) {
      // As the range would measure it: carry and roll on flat ground.
      const yards = driveTotal(f.entry.ball);
      this.warm.drives.push(yards);
      this.record(f, { hole: undefined, warmup: this.warm.drives.length });
      this.last = { warm: true, yards, carry: res.carryYards };
      const n = this.warm.drives.length;
      // A top or a duff isn't their drive: not counted, and another asked for.
      this.message = lastIsMishit(this.warm.drives) ? `Warm-up ${n} - ${fmt(yards, 0)} yds: a mishit, not counted` : `Warm-up ${n} - ${fmt(yards, 0)} yds`;
      this.markFinish(rest, 0xffffff);
      sounds.play("chime", 0.3);
      this.viewFinish(rest);
      this.pause = { t: PAUSE_WARMUP, over: false };
      this.host.changed();
      return;
    }
    const along = alongHole(this.layout, rest);
    const r = drivePoints({ lie: res.lie, penalty: res.penalty, along, average: this.layout.drive.average });
    this.shot = { ...r, yards: along, carry: res.carryYards };
    this.played[this.playerIndex][this.holeIndex] = this.shot;
    // Where it finished and what it scored, with the shot.
    this.record(f, { finish: r.lie, points: r.points, percent: r.percent });
    this.last = this.shot;
    const colour = LIE_COLOUR[r.lie] ?? 0xffffff;
    this.markFinish(rest, colour);
    const where = r.lie === "water" ? "In the water" : r.lie === "lost" ? "Lost in the trees" : res.wood ? "Into the corner trees" : r.name;
    // The yards are in the numbers below, so the title stays on one line.
    this.message = `${where} - ${signed(r.points)} points`;
    if (r.lie === "fairway") {
      sounds.play(r.points >= 105 ? "arpeggio" : "chime", r.points >= 105 ? 0.7 : 0.5);
      this.sparkle(rest, r.points >= 105 ? 0.7 : 0.35);
    } else {
      sounds.play("low", 0.4);
    }
    this.viewFinish(rest);
    this.pause = { t: PAUSE, over: true };
    this.host.changed();
  }

  // For the player's stats: a tee shot, always a full swing (a lay-up
  // iron too), and like any full swing its club can be questioned. The
  // target is where the hole's line ends: the full or lay-up distance.
  record(f, extra) {
    const res = f.res;
    const d = this.layout.drive;
    const rest = res.rest ?? [0, 0];
    const result = shotFacts(res, [0, 0], this.aim);
    const target = this.warm ? null : d.target;
    const lost = !!res.penalty;
    this.host.record(
      {
        club: this.club,
        swing: "full",
        ball: f.entry.ball,
        result,
        target: target
          ? { distance: Math.hypot(...target) / YARD, finish: lost ? undefined : Math.hypot(rest[0] - target[0], rest[1] - target[1]) / YARD }
          : undefined,
        lie: "tee",
      },
      extra,
    );
  }

  sparkle([x, z], amount) {
    const focus = this.scenery.at(x, z);
    this.host.celebration.effects.start({ level: 0, confetti: 0, fireworks: 0, sparkle: amount }, { focus, camera: this.host.camera, cameraAt: this.camWant });
  }

  // The wait after a drive is over: another warm-up, the hole once they're
  // done, or the next turn.
  endPause() {
    const p = this.pause;
    if (!p) return;
    this.pause = null;
    if (p.over) {
      this.host.turnOver(this.shot.points);
      return;
    }
    // The warm-ups keep their tracers, faint, until the hole is set up.
    const warmedUp = this.warm && averageDrive(this.warm.drives);
    if (warmedUp) {
      const yards = warmedUp;
      this.averages[this.playerIndex] = { yards, how: "warmup" };
      // Kept for the next game, so a warm-up isn't needed every time.
      this.setDriver(this.match.player.name, { last: yards, how: "last" });
      this.warm = null;
      this.last = null;
      this.message = "";
      this.setUpHole();
      const d = this.layout.drive;
      this.host.toast(`Average ${yards} yds - hole ${this.holeIndex + 1}: ${shapeWord(d.shape, d.kind)}`, 2800);
    } else {
      this.address(!view.follow);
    }
    this.host.changed();
  }

  next() {
    if (this.flying) this.settle();
    else if (this.pause) this.endPause();
  }

  // A made-up drive with the club in hand: now and then shaped the way the
  // hole wants, and never quite straight.
  testShot() {
    if (!this.layout) return null;
    const c = BAG[this.club] ?? BAG.DR;
    const j = (v, amount) => v + (Math.random() - 0.5) * 2 * amount;
    const shape = this.warm ? "straight" : this.layout.drive.shape;
    const curve = shape === "draw" ? -20 : shape === "fade" ? 20 : 0;
    return {
      speedMph: j(c.speed, c.speed * 0.04),
      vla: j(c.vla, 1.2),
      hla: j(0, 2.5),
      totalSpin: j(c.spin, c.spin * 0.1),
      spinAxis: j(Math.random() < 0.6 ? curve : 0, 8),
    };
  }

  get clubs() {
    return BAG_ORDER;
  }
  stepClub(delta) {
    const list = BAG_ORDER;
    const i = Math.max(0, list.indexOf(this.club));
    this.club = list[Math.min(list.length - 1, Math.max(0, i + delta))];
    this.host.sendClub();
    this.host.changed();
    return this.club;
  }

  // ---- What's on show -----------------------------------------------------------------

  overlay() {
    if (!this.layout) return { title: "", note: "", stats: [] };
    const avg = this.averages?.[this.playerIndex];
    if (this.warm) {
      const counted = countedDrives(this.warm.drives);
      const n = counted.length;
      const stats = this.warm.drives.map((y, i) => ({ label: `Warm-up ${i + 1}`, value: fmt(y, 0), unit: counted.includes(y) ? "yds" : "yds, not counted" }));
      if (n) stats.push({ label: "Average so far", value: fmt(counted.reduce((a, b) => a + b, 0) / n, 0), unit: "yds", accent: true });
      const title = this.flying ? "" : this.message || "Hit when ready";
      return { title, note: `Driving challenge - warm-up drive ${Math.min(n + 1, WARMUP_DRIVES)} of ${WARMUP_DRIVES}, to set your average`, stats };
    }
    const d = this.layout.drive;
    const i = this.holeIndex;
    const note = `Driving challenge - hole ${i + 1} of ${DRIVING_HOLES} - ${holeAdvice(d)}`;
    const best = this.host.bestFor(this.id, this.fairways);
    const total = this.match.total(this.playerIndex) + (this.shot?.points ?? 0);
    const stats = [{ label: d.shape === "layup" ? "Lay up" : "Full drive", value: String(d.shape === "layup" ? d.full : d.average), unit: "yds", accent: true }];
    // Before the drive, what the hole asks; after it, what it got (so the
    // numbers along the bottom of the bay view stay few).
    if (!this.shot || this.flying) {
      if (d.layback) stats.push({ label: "Straight, at most", value: String(d.layback), unit: "yds" });
      stats.push({ label: "Fairway width", value: String(d.width), unit: "yds" });
    } else {
      const t = this.shot;
      const good = t.lie === "fairway";
      const gone = t.lie === "water" || t.lie === "lost";
      stats.push({ label: "Distance", value: gone ? "-" : fmt(t.yards, 0), unit: gone ? "" : "yds", tone: good ? "good" : "bad" });
      stats.push({ label: "Points", value: signed(t.points), tone: good ? "good" : "bad" });
    }
    stats.push({ label: "Total", value: signed(total) });
    stats.push({ label: this.host.multi ? "Your average" : "Average", value: String(avg.yards), unit: "yds" });
    stats.push({ label: "Personal best", value: best ? String(best.score) : "-" });
    const title = this.flying ? "" : this.message ? (this.shot?.lie === "fairway" ? `<b class="made">${esc(this.message)}</b>` : esc(this.message)) : "Hit when ready";
    return { title, note, stats };
  }

  // Down the side: the nine holes, what each wants, and this player's
  // points on those played.
  sideHtml() {
    if (!this.units) return "";
    const p = this.playerIndex;
    const avg = this.averages[p];
    const rows = this.units
      .map((u, i) => {
        const shot = this.played[p][i];
        const now = i === this.holeIndex && !this.warm;
        const colour = shot ? hex(LIE_COLOUR[shot.lie] ?? 0xffffff) : now ? "var(--accent)" : "rgba(255,255,255,0.4)";
        const cls = shot ? (shot.lie === "fairway" ? "rung-made" : "rung-missed") : now ? "rung-now" : "";
        return `<li class="${cls}" style="--rung:${colour}"><span>${i + 1} ${shapeWord(u.shape, u.kind)}</span><i>${shot ? signed(shot.points) : ""}</i></li>`;
      })
      .join("");
    const head = this.warm ? "Warm-up" : `Hole ${this.holeIndex + 1}`;
    const sub = avg.yards ? `Average ${avg.yards} yds` : `${countedDrives(this.warm?.drives ?? []).length} of ${WARMUP_DRIVES} drives`;
    return `<div class="ladder-head">${head}<small>${sub}</small></div><ol class="ladder drive-list">${rows}</ol><div class="ladder-foot">${signed(this.match.total(p) + (this.shot?.points ?? 0))} points</div>`;
  }

  // On the results, by each player's score: the average their holes were
  // drawn to, and where it came from, so a number typed in low shows.
  resultNote(i) {
    const a = this.averages?.[i];
    if (!a?.yards) return "";
    return `${a.yards} yds${{ typed: " typed in", range: " range", stats: " stats" }[a.how] ?? " warm-up"}`;
  }

  // On the picker's card: whose average comes from where.
  cardNote() {
    const names = this.host.players;
    const one = (n) => {
      const how = this.howFor(n);
      if (how === "warmup") return "3 warm-up drives first";
      const from = { range: " (this session's range drives)", last: " (last warm-up)", typed: " (typed in)", stats: " (your stats)" }[how];
      return `${this.averageFor(n)} yds${from}`;
    };
    if (names.length === 1) return `Your drive: ${one(names[0])}`;
    return names.map((n) => `${n}: ${one(n)}`).join(" - ");
  }

  // In the side panel under the players: each one's average drive, typed
  // in, from the range, or found with warm-ups.
  panelHtml() {
    const range = this.rangeAverage;
    const rows = this.host.players
      .map((n, i) => {
        const how = this.howFor(n);
        const d = this.drivers[n] ?? {};
        const mine = this.statsAverage(n);
        const opts = [
          ...(d.last ? [["last", `Last warm-up: ${d.last} yds`]] : []),
          ...(mine != null ? [["stats", `From your stats: ${mine} yds`]] : []),
          ["warmup", d.last ? "Warm up again" : "Warm up first"],
          ...(range ? [["range", `Range: ${range} yds`]] : []),
          ["typed", "Typed in"],
        ]
          .map(([v, t]) => `<option value="${v}" ${v === how ? "selected" : ""}>${esc(t)}</option>`)
          .join("");
        const typed = how === "typed" ? `<input type="number" min="120" max="360" step="5" data-yards="${i}" value="${d.yards ?? ""}" aria-label="${esc(n)}'s average drive"> yds` : "";
        return `<div class="driver-row"><span>${esc(n)}</span><select data-how="${i}">${opts}</select>${typed}</div>`;
      })
      .join("");
    return `<div class="players-head">Average drive <small class="muted">(carry and roll)</small></div>${rows}
      <p class="muted small">The holes are drawn to each player's own drive. Your stats are your full drives on record; the range figure is this session's driver shots, whoever hit them. Changes count from the next game.</p>`;
  }

  bindPanel(el) {
    const names = this.host.players;
    for (const sel of el.querySelectorAll("[data-how]")) {
      sel.addEventListener("change", () => {
        const name = names[Number(sel.dataset.how)];
        const value = { how: sel.value };
        if (sel.value === "typed" && !this.drivers[name]?.yards) value.yards = this.drivers[name]?.last ?? this.statsAverage(name) ?? this.rangeAverage ?? DEFAULT_DRIVE;
        this.setDriver(name, value);
        this.host.render();
      });
    }
    for (const input of el.querySelectorAll("[data-yards]")) {
      input.addEventListener("keydown", (e) => e.key === "Enter" && input.blur());
      input.addEventListener("change", () => {
        const v = Number(input.value);
        if (Number.isFinite(v) && v > 0) this.setDriver(names[Number(input.dataset.yards)], { how: "typed", yards: clampDrive(v) });
        this.host.render();
      });
    }
  }
}

