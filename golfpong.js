// Golf pong on a real practice green (sim/golfpong.mjs has the rules), with
// the trees, bunkers and clubhouse round it as the putting green has them
// (greenscene.js): a rack of cups cut in the green at each end, two
// players taking turns putting at each other's cups - four-way, a rack on
// each side of a square patch; three, a lane each side by side - against
// bots, everyone here, or online against other bays. No backboard: a putt
// that runs past rolls on down the green. The camera stands behind
// whoever's putting, so each sees the green as the others do.
//
// Or everyone at once (Putts: All at once): a ball each, all rolling
// together - a round at a time, each waiting for the others before their
// next putt, or racing (Race), putting again as soon as their own ball
// stops. The camera stays behind this bay's player then, the balls in view.
//
// The putting green (putting.js) hands over to this while its game is
// "pong": its scene, camera, shots, aim and what lies over the picture.

import * as THREE from "three";
import { pongTable, pongPutt, newMatch, playPutt, refusePutt, botPutt, startAim, puttWords, cupsLeft, holedBy, facing, stillToPutt, botMoments, botAgain, LAYOUTS, SPACINGS, LENGTHS, SIZES, SLOPES, SPEEDS, BOT_LEVELS, DEFAULT_SETUP } from "./sim/golfpong.mjs";
import { greenHeight, greenGradient, HOLE_RADIUS } from "./sim/putting.mjs";
import { makeBall, toWorld, BallShadow, forgetFlags } from "./scenery.js";
import { buildGreenScene, addClubhouse } from "./greenscene.js";
import { addEnvironment, fitShadows } from "./look/environment.js";
import { audio } from "./audio/engine.js";
import { puttCues, soundscape, CueQueue } from "./audio/cues.mjs";
import { loadSetting, saveSetting, esc, fmt } from "./util.js";
import { clearGroup } from "./look/dispose.js";
import { cupHoleMaterial } from "./look/cuphole.js";
import { fitLens } from "./sim/upright.mjs";

const BALL_R = 0.02135;
// The ball sits on the green itself (no mat under it).
const MAT_UP = 0;
const OPPONENTS = { bot: "Against bots", local: "Everyone here, in turn" };
const PLAYERS = { 2: "1 v 1 - from either end", 3: "Three - a lane each, side by side", 4: "Four-way - a rack each side" };
const PUTTS = { turn: "In turn", together: "All at once" };
const GAME_NAMES = { 2: "Golf pong", 3: "Three-lane pong", 4: "Four-way pong" };
const RACE_WORDS = "Race - putt again as soon as your ball stops";

// "Sam", "Sam and Jo", "Sam, Jo and Kit".
const listed = (names) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);

export class GolfPong {
  // panel: the element the settings go in. hitter(): who's hitting here;
  // players(): everyone playing here; setHitter(name); toast; onChange.
  constructor(panel, renderer, { hitter = () => "Player 1", players = () => [], setHitter = () => {}, toast = () => {}, onChange = () => {} } = {}) {
    this.panel = panel;
    this.hitter = hitter;
    this.players = players;
    this.setHitter = setHitter;
    this.toast = toast;
    this.onChange = onChange;
    this.settings = { ...DEFAULT_SETUP, opponent: "bot", bot: "club", together: false, race: false, ...loadSetting("golfpong", {}) };
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.02, 6000);
    this.light = addEnvironment(this.scene, renderer, { shadowSize: 10 }).light;
    this.soundscape = soundscape({ wind: 0.2 });
    this.world = new THREE.Group();
    this.scene.add(this.world);
    // A ball (and its shadow) for each player: in turn, the first moved to
    // whoever's putting; all at once, everyone's own.
    this.balls = Array.from({ length: 4 }, () => {
      const mesh = makeBall(BALL_R);
      const shadow = new BallShadow(this.light.userData.sun, BALL_R);
      this.scene.add(mesh, shadow.mesh);
      return { mesh, shadow };
    });
    this.aimLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffd23f }));
    this.scene.add(this.aimLine);
    this.look = new THREE.Vector3();
    this.games = 0;
    this.net = null;
    // Every ball rolling now (in turn, one at most).
    this.rolls = [];
    this.wait = 0;
    // All at once: each bot's moment to putt (seconds; null: none coming),
    // and where the next here to putt is counted from.
    this.botWait = [];
    this.lastHere = -1;
    this.result = "";
    this.buildPanel();
    this.newGame({ quiet: true });
  }

  // A ball rolling (the first of them, all at once), or null.
  get rolling() {
    return this.rolls[0] ?? null;
  }

  // ---- Who's who ------------------------------------------------------------------

  // The players' names, in order round the mat.
  get names() {
    if (this.net) return this.net.names;
    const n = this.table?.n ?? 2;
    if (this.settings.opponent === "local") {
      const list = this.players();
      return Array.from({ length: n }, (_, i) => list[i] ?? `Player ${i + 1}`);
    }
    const level = BOT_LEVELS[this.settings.bot]?.name ?? "Club golfer";
    return [this.hitter(), ...Array.from({ length: n - 1 }, (_, i) => (n === 2 ? `Bot (${level})` : `Bot ${i + 1}`))];
  }
  // Whether end p putts from here (not the bot, not the other bay).
  mine(p) {
    if (this.net) return this.net.mine.includes(p);
    return this.settings.opponent === "local" || p === 0;
  }
  // Whether end p is a bot's.
  isBot(p) {
    return !this.net && this.settings.opponent === "bot" && p !== 0;
  }
  get botTurn() {
    return !this.net && !this.match.together && this.settings.opponent === "bot" && this.match.turn !== 0 && this.match.winner == null;
  }
  // All at once: player p's ball rolling.
  rollOf(p) {
    return this.rolls.find((R) => R.player === p) ?? null;
  }
  // All at once: whether player p may putt now - the rules let them (not
  // twice in a round), their ball isn't rolling, and the round's begun here.
  free(p) {
    const m = this.match;
    return !refusePutt(m, { player: p }) && !this.rollOf(p) && (m.race || this.roundShown === m.round);
  }
  // The player here a putt from the launch monitor goes to now, or null:
  // in turn, whoever's turn it is, if they're here; all at once, the next
  // of the players here who can putt now (hasn't this round - racing,
  // whose ball isn't rolling), from the one after the last to putt here.
  get shooter() {
    const m = this.match;
    if (!m || m.winner != null) return null;
    if (!m.together) return this.mine(m.turn) && !this.botTurn && !this.rolling ? m.turn : null;
    for (let k = 1; k <= m.n; k++) {
      const p = (this.lastHere + k + m.n) % m.n;
      if (this.mine(p) && this.free(p)) return p;
    }
    return null;
  }
  // Whose end the camera watches from: in turn, whoever's putting; all at
  // once, this bay's player's - the whole game long (everyone here: the
  // game's first).
  get viewer() {
    const m = this.match;
    if (!m.together) return m.turn;
    if (this.net) return this.net.mine[0] ?? 0;
    return this.settings.opponent === "local" ? m.first : 0;
  }

  // ---- A game ---------------------------------------------------------------------

  // A new mat (a new seed: new slopes) and a fresh match - who goes first
  // takes turns from game to game.
  newGame({ quiet = false } = {}) {
    if (this.net) return this.toast("Online: the host starts a new game", 2000);
    const s = this.settings;
    this.setTable({ ...s, seed: Math.floor(Math.random() * 1e9) });
    this.match = newMatch({ players: this.table.n, first: this.games++ % this.table.n, together: !!s.together, race: !!s.together && !!s.race });
    this.result = "";
    this.lastHere = this.match.first - 1;
    if (this.match.together) this.startRound(true);
    else this.startTurn();
    if (quiet) return;
    if (!this.match.together) this.toast(`Golf pong - ${this.names[this.match.turn]} first`, 2400);
    else this.toast(this.match.race ? "Golf pong - a race: putt again as soon as your ball stops" : "Golf pong - everyone putts at once, then waits for the others", 2600);
  }

  setTable(setup) {
    this.table = pongTable(setup);
    this.rolls = [];
    this.wait = 0;
    this.botWait = [];
    this.roundShown = null;
    this.aimFor = undefined;
    // (Online: putts sent from here, the host's match while balls roll,
    // the other bays' putts still to roll here.)
    this.sent = 0;
    this.pendingMatch = null;
    this.netQueue = [];
    this.won = false;
    this.resultHere = "";
    // (The last match was on the last mat: its cups may not be these.)
    this.match = null;
    this.buildMat();
  }

  // The next putt: its player's aim, the camera behind them.
  startTurn() {
    const m = this.match;
    this.wait = 0;
    this.showBalls();
    this.aimDeg = startAim(this.table, m, m.turn);
    this.placeBall(m.turn, this.table.starts[m.turn]);
    this.placeCamera(true);
    this.drawCups();
    this.drawAim();
    if (m.winner == null && this.mine(m.turn) && (this.settings.opponent === "local" || this.net)) this.setHitter(this.names[m.turn]);
    // The bot takes a moment over it.
    if (this.botTurn) this.wait = 1.4;
    this.renderPanel();
    this.onChange();
  }

  // All at once: a round begins (racing, the game) - every ball not
  // rolling back on its spot, each bot to putt a short random moment from
  // now (never two together), the aim and the hitter to the next here.
  startRound(snap = false) {
    const m = this.match;
    this.wait = 0;
    this.roundShown = m.round;
    this.result = "";
    this.showBalls();
    for (let p = 0; p < m.n; p++) if (!this.rollOf(p)) this.placeBall(p, this.table.starts[p]);
    this.botWait = [];
    const bots = Array.from({ length: m.n }, (_, p) => p).filter((p) => this.isBot(p) && this.free(p));
    botMoments(bots.length).forEach((t, k) => (this.botWait[bots[k]] = t));
    this.aimFor = undefined;
    this.followShooter();
    this.placeCamera(snap);
    this.drawCups();
    this.renderPanel();
    this.onChange();
  }

  // All at once: the aim and the hitter to the next player here to putt
  // (the aim afresh for a new player or a new round; racing, the same
  // player keeps theirs).
  followShooter() {
    const p = this.shooter;
    if (p !== this.aimFor) {
      if (p != null) {
        this.aimDeg = startAim(this.table, this.match, p);
        if (this.settings.opponent === "local" || this.net) this.setHitter(this.names[p]);
      }
      if (p != null || this.aimFor === undefined) this.aimFor = p;
    }
    this.drawAim();
  }

  // ---- The mat ------------------------------------------------------------------------

  heightAt(x, z) {
    return greenHeight(this.table.green, x, z);
  }

  // The world's ground: the table's green (its frame turned to the world's).
  worldHeight = (wx, wz) => greenHeight(this.table.green, -wz, wx);
  worldNormal = (wx, wz) => {
    const [gx, gz] = greenGradient(this.table.green, -wz, wx);
    return new THREE.Vector3(-gz, 1, gx).normalize();
  };

  // A real practice green round the patch in play (greenscene.js: its
  // fringe, the rough, bunkers, the trees and the clubhouse beyond), the
  // racks cut in it, a spot where each player putts from - and with three,
  // a chalk line between the lanes.
  buildMat() {
    forgetFlags(this.world);
    clearGroup(this.world);
    const t = this.table;
    // The green, a little bigger than what's in play (its edge wanders).
    const half = t.area.round ? [t.area.r, t.area.r] : [t.area.x, t.area.z];
    const green = { cx: 0, cz: 0, rx: half[1] + 1.2, rz: half[0] + 1.2, seed: 21 + (t.setup.seed % 50) };
    const built = buildGreenScene(this.world, { heightAt: this.worldHeight, normalAt: this.worldNormal, green, hole: null, seed: 7, treeSeed: 7 + (t.setup.seed % 100003) });
    this.inside = built.inside;
    addClubhouse(this.world, { green, heightAt: this.worldHeight, seed: 3 });
    // Where each putts from: a small white spot painted on the green.
    const paint = new THREE.MeshBasicMaterial({ color: 0xf2f2ea });
    for (const [x, z] of t.starts) {
      const spot = new THREE.Mesh(new THREE.CircleGeometry(0.035, 20).rotateX(-Math.PI / 2), paint);
      spot.position.copy(toWorld(x, this.heightAt(x, z) + 0.002, z));
      this.world.add(spot);
    }
    // Three: a line of chalk between the lanes, the length of the patch.
    if (t.lanes) {
      for (let k = 1; k < t.n; k++) {
        const z = (t.starts[k - 1][1] + t.starts[k][1]) / 2;
        const pts = [];
        for (let x = -t.H; x <= t.H + 1e-9; x += 0.1) pts.push(toWorld(x, this.heightAt(x, z) + 0.003, z));
        this.world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xf2f2ea, transparent: true, opacity: 0.55 })));
      }
    }
    // The cups: open - looking down into a real cup, its soil edge, white
    // liner and dark depths (look/cuphole.js) - or covered (a plug of turf).
    const holeLook = cupHoleMaterial(HOLE_RADIUS);
    this.cupMeshes = t.cups.map((rack) =>
      rack.map(([x, z]) => {
        const g = new THREE.Group();
        const y = this.heightAt(x, z) + 0.0015;
        g.position.copy(toWorld(x, y, z));
        const hole = new THREE.Mesh(new THREE.CircleGeometry(HOLE_RADIUS, 40).rotateX(-Math.PI / 2), holeLook);
        // The cut edge of the turf round it, a shade darker.
        const rim = new THREE.Mesh(new THREE.RingGeometry(HOLE_RADIUS, HOLE_RADIUS + 0.004, 40).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x2f5a26, transparent: true, opacity: 0.6 }));
        const plug = new THREE.Mesh(new THREE.CylinderGeometry(HOLE_RADIUS + 0.004, HOLE_RADIUS + 0.004, 0.006, 40), new THREE.MeshStandardMaterial({ color: 0x3f8f3a, roughness: 1 }));
        plug.position.y = 0.002;
        g.add(hole, rim, plug);
        g.userData = { hole, rim, plug };
        this.world.add(g);
        return g;
      }),
    );
    fitShadows(this.light, this.scene);
    this.drawCups();
  }

  drawCups() {
    if (!this.cupMeshes || !this.match) return;
    this.cupMeshes.forEach((rack, p) =>
      rack.forEach((g, i) => {
        const open = this.match.cups[p][i];
        g.userData.hole.visible = open;
        g.userData.rim.visible = open;
        g.userData.plug.visible = !open;
      }),
    );
  }

  // Player p's ball: all at once their own, in turn the one ball.
  ballOf(p) {
    return this.balls[this.match?.together ? p : 0].mesh;
  }
  // In turn one ball; all at once one for each player.
  showBalls() {
    const each = !!this.match?.together;
    this.balls.forEach((b, i) => {
      b.mesh.visible = each ? i < this.table.n : i === 0;
      if (!b.mesh.visible) b.shadow.mesh.visible = false;
    });
  }

  placeBall(p, [x, z], y = 0) {
    this.ballOf(p).position.copy(toWorld(x, this.heightAt(x, z) + MAT_UP + y + BALL_R, z));
  }

  // Behind the putter, looking down the mat at the other's cups. All at
  // once, behind this bay's player and still - with three, back and up a
  // little and over towards the middle lane, every lane in view.
  placeCamera(snap = false) {
    const t = this.table;
    const p = this.viewer;
    const [sx, sz] = t.starts[p];
    const [fx, fz] = facing(t, p);
    let cam;
    let look;
    if (this.match.together && t.lanes) {
      const zc = sz * 0.2;
      const back = 2.6 + t.L * 0.12;
      cam = toWorld(sx - back, this.heightAt(sx, zc) + 1.5 + t.L * 0.1, zc);
      look = toWorld(t.H * 0.15, 0, zc * 0.5);
    } else {
      const back = 1.5 + t.L * 0.08 + (this.match.together ? 0.4 : 0);
      cam = toWorld(sx - fx * back, this.heightAt(sx, sz) + 0.9 + t.L * (t.n === 4 ? 0.15 : 0.05) + (this.match.together ? 0.3 : 0), sz - fz * back);
      // Looking at the rack across (three: down their lane at their own).
      const far = t.cups[t.lanes ? p : (p + t.n / 2) % t.n].reduce((a, c) => [a[0] + c[0] / 6, a[1] + c[1] / 6], [0, 0]);
      look = toWorld(far[0] - fx * 0.3, 0, far[1] - fz * 0.3).lerp(toWorld(sx, 0, sz), 0.25);
    }
    this.camWant = cam;
    this.lookWant = look;
    if (snap) {
      this.camera.position.copy(cam);
      this.look.copy(look);
      this.camera.lookAt(this.look);
    }
  }

  // The aim: a line from the ball the way it's aimed, while it's someone
  // here's turn to putt (all at once, the next here's).
  drawAim() {
    const m = this.match;
    const p = m.together ? this.shooter : m.turn;
    const show = m.together ? p != null : m.winner == null && this.mine(p) && !this.rolling && !this.botTurn;
    this.aimLine.visible = show;
    if (!show) return;
    const [sx, sz] = this.table.starts[p];
    const [dx, dz] = facing(this.table, p, this.aimDeg);
    const pts = [];
    for (let k = 0; k <= 20; k++) {
      const x = sx + dx * k * 0.08;
      const z = sz + dz * k * 0.08;
      if (!this.table.onMat(x, z, p)) break;
      pts.push(toWorld(x, this.heightAt(x, z) + MAT_UP + 0.004, z));
    }
    this.aimLine.geometry.setFromPoints(pts);
  }

  // ← →: the aim a quarter of a degree (Shift: a degree).
  nudgeAim(dir, big = false) {
    if (this.match.together) {
      if (this.shooter == null) return this.toast(this.waitWords(), 1400);
    } else if (this.rolling || !this.mine(this.match.turn) || this.botTurn) return this.toast("Aim on your turn", 1400);
    this.aimDeg = Math.round((this.aimDeg + dir * (big ? 1 : 0.25)) * 100) / 100;
    this.drawAim();
    this.onChange();
  }

  // All at once, nobody here can putt now: why.
  waitWords() {
    const m = this.match;
    if (m.winner != null) return `${this.names[m.winner]} won`;
    if (m.race) return "Wait for your ball to stop";
    if (this.roundShown !== m.round) return "Next round in a moment";
    const still = stillToPutt(m).filter((p) => !this.mine(p) && !this.rollOf(p)).sort((a, b) => a - b);
    return still.length ? `Wait for the others - ${listed(still.map((p) => this.names[p]))} to putt` : "Wait for the others";
  }

  // ---- Putts ------------------------------------------------------------------------

  // A putt from the launch monitor (or a test putt), for whoever's turn it is
  // here - all at once, the next here who can putt now.
  onShot(entry) {
    const m = this.match;
    const b = entry.ball ?? {};
    if (m.together) {
      if (m.winner != null) return this.toast(`${this.names[m.winner]} won${this.net ? "" : " - N for a new game"}`, 2400);
      const p = this.shooter;
      if (p == null) return this.toast(this.waitWords(), 1800);
      if (this.settings.opponent === "local" || this.net) this.setHitter(this.names[p]);
      return this.roll(p, { speedMph: b.speedMph, hla: b.hla ?? 0 }, this.aimDeg, { send: !!this.net });
    }
    if (this.rolling) return this.toast("Wait for the ball to stop", 1500);
    if (m.winner != null) return this.toast(`${this.names[m.winner]} won - N for a new game`, 2400);
    if (!this.mine(m.turn) || this.botTurn) return this.toast(`It's ${this.names[m.turn]}'s putt`, 2000);
    this.roll(m.turn, { speedMph: b.speedMph, hla: b.hla ?? 0 }, this.aimDeg, { send: !!this.net });
  }

  // Rolls a putt and plays it out: the ball down the mat, the cup it found.
  // (All at once, online, it's sent as it's struck, so the other bays roll
  // it with theirs.)
  roll(player, strike, aimDeg, { send = false, decided = undefined } = {}) {
    const r = pongPutt(this.table, player, strike, aimDeg, this.match.cups);
    // Online, the other bay's putt counts as it said it went.
    if (decided !== undefined && (decided.cup !== r.cup || decided.rack !== r.rack)) Object.assign(r, { rack: decided.rack ?? null, cup: decided.cup ?? null, holed: decided.cup != null });
    if (decided?.taken) r.taken = true;
    const R = { player, r, strike, aimDeg, send, elapsed: 0, index: 0, cues: new CueQueue(puttCues(r)) };
    this.rolls.push(R);
    if (!this.match.together) {
      this.result = "";
      this.aimLine.visible = false;
      return this.onChange();
    }
    if (this.mine(player)) {
      this.lastHere = player;
      this.resultHere = "";
      if (send) {
        R.send = false;
        this.sent = (this.sent ?? 0) + 1;
        Promise.resolve(this.net.send(this.netPutt(player, strike, aimDeg, r))).then((res) => {
          // Refused (the host saw it otherwise): nothing to wait for.
          if (res?.ok === false) this.sent = Math.max(0, this.sent - 1);
        });
      }
    }
    this.followShooter();
    this.renderPanel();
    this.onChange();
  }

  // A putt as the host is told of it.
  netPutt(player, strike, aimDeg, r) {
    return { type: "pong", player: this.net.ids[player], aim: aimDeg, speed: strike.speedMph, hla: strike.hla, rack: r.rack, cup: r.cup, off: !!r.off };
  }

  // A ball stopped: its putt counted - all at once, in the order they stop.
  finish(R = this.rolling) {
    this.rolls = this.rolls.filter((x) => x !== R);
    if (this.match.together) return this.finishTogether(R);
    const { player, r, strike, aimDeg, send } = R;
    if (!refusePutt(this.match, { player, rack: r.rack, cup: r.cup })) this.match = playPutt(this.match, { player, rack: r.rack, cup: r.cup, off: r.off });
    // Online, the host's word on the match, which came while it rolled -
    // once any other putts it holds have rolled here too.
    if (this.pendingMatch && !this.netQueue.length) {
      this.match = this.pendingMatch;
      this.pendingMatch = null;
    }
    if (send) this.net.send(this.netPutt(player, strike, aimDeg, r));
    this.drawCups();
    const m = this.match;
    this.result = puttWords(r, r.rack == null ? 0 : cupsLeft(m, r.rack), m.n === 4 && r.rack != null ? this.names[r.rack] : null);
    if (m.winner != null) {
      this.result = `${this.names[m.winner]} wins!`;
      const score = m.n === 2 ? ` ${holedBy(m, m.winner)}-${holedBy(m, 1 - m.winner)}` : "";
      this.toast(`${this.names[m.winner]} wins${score}!${this.net ? "" : " N for another game"}`, 4500);
    } else this.wait = 2;
    this.renderPanel();
    this.onChange();
  }

  finishTogether(R) {
    const { player, r } = R;
    let taken = !!r.taken;
    if (!refusePutt(this.match, { player, rack: r.rack, cup: r.cup })) {
      this.match = playPutt(this.match, { player, rack: r.rack, cup: r.cup, off: r.off });
      taken ||= !!this.match.putts.at(-1)?.taken;
    }
    this.drawCups();
    const m = this.match;
    const owner = m.n === 4 && r.rack != null ? this.names[r.rack] : null;
    this.result = `${this.names[player]}: ${puttWords(taken ? { taken } : r, r.rack == null ? 0 : cupsLeft(m, r.rack), owner)}`;
    if (this.mine(player)) this.resultHere = this.result;
    // Racing: a fresh ball on the spot, and a bot at it again in a moment.
    if (m.race && m.winner == null) {
      this.placeBall(player, this.table.starts[player]);
      if (this.isBot(player)) this.botWait[player] = botAgain();
    }
    this.reconcile();
    this.settle();
  }

  // All at once, after a ball stops or the host's word: the winner, or the
  // next round once every ball's stopped (a moment to see how they went
  // first), and the next here to putt.
  settle() {
    const m = this.match;
    if (m.winner != null && !this.won) {
      this.won = true;
      this.botWait = [];
      this.result = `${this.names[m.winner]} wins!`;
      this.toast(`${this.names[m.winner]} wins!${this.net ? "" : " N for another game"}`, 4500);
    }
    if (m.winner == null && !m.race && !this.rolls.length && m.round !== this.roundShown && !(this.wait > 0)) this.wait = 2;
    this.followShooter();
    this.renderPanel();
    this.onChange();
  }

  // The putt the game would play here (what made-up swings aim with):
  // about right for the middle of the cups, with a human amount of error.
  testPutt() {
    const m = this.match;
    const p = this.shooter ?? (m.together ? (this.net?.mine[0] ?? 0) : m.turn);
    const read = botPutt(this.table, m, { speed: 0, aim: 0 }, () => 0.5, p);
    // The read's line, from where the player's aimed.
    return { speedMph: read.speedMph * (1 + (Math.random() - 0.5) * 0.3), hla: read.aimDeg + read.hla - this.aimDeg + (Math.random() - 0.5) * 3 };
  }

  // A ball along its path: where it is, its sounds - and stopped, counted.
  stepRoll(R, dt) {
    R.elapsed += dt;
    const path = R.r.path;
    while (R.index < path.length - 1 && path[R.index + 1][2] <= R.elapsed) R.index++;
    const a = path[R.index];
    const b = path[Math.min(R.index + 1, path.length - 1)];
    const k = Math.min(1, Math.max(0, (R.elapsed - a[2]) / (b[2] - a[2] || 1)));
    const x = a[0] + (b[0] - a[0]) * k;
    const z = a[1] + (b[1] - a[1]) * k;
    const y = (a[3] ?? 0) + ((b[3] ?? 0) - (a[3] ?? 0)) * k;
    this.placeBall(R.player, [x, z], y);
    const ball = this.ballOf(R.player);
    ball.rotation.x -= dt * 12;
    for (const c of R.cues.due(R.elapsed)) audio.cue(c, ball.position);
    // Watching it go: the look follows the ball a little (in turn: all at
    // once, the camera stays still).
    if (!this.match.together) this.lookWant.lerp(ball.position, 1 - Math.exp(-dt * 0.8));
    if (R.index >= path.length - 1) this.finish(R);
  }

  update(dt) {
    const rolled = this.rolls.length > 0;
    for (const R of [...this.rolls]) this.stepRoll(R, dt);
    if (this.match.together) this.tick(dt);
    else if (!rolled && this.wait > 0) {
      this.wait -= dt;
      if (this.wait <= 0) {
        if (this.netQueue.length) {
          this.nextNetPutt();
        } else if (this.botTurn) {
          const b = botPutt(this.table, this.match, this.settings.bot);
          this.aimDeg = b.aimDeg;
          this.roll(this.match.turn, { speedMph: b.speedMph, hla: b.hla }, b.aimDeg);
        } else if (this.match.winner == null && !this.rolling) {
          this.startTurn();
        }
      }
    }
    this.camera.position.lerp(this.camWant, 1 - Math.exp(-dt * 2));
    this.look.lerp(this.lookWant, 1 - Math.exp(-dt * 2.5));
    this.camera.lookAt(this.look);
    for (const { mesh, shadow } of this.balls) if (mesh.visible) shadow.update(mesh.position, (wx, wz) => this.heightAt(-wz, wx) + MAT_UP);
  }

  // All at once: the pause between rounds, and the bots' moments.
  tick(dt) {
    const m = this.match;
    if (m.winner != null) return;
    if (!m.race && m.round !== this.roundShown) {
      // Between rounds: once every ball's stopped, a moment to see how they
      // went (settle), then the next.
      if (this.wait > 0) this.wait -= dt;
      if (this.wait <= 0 && !this.rolls.length) this.startRound();
      return;
    }
    this.botWait.forEach((t, p) => {
      if (t == null) return;
      this.botWait[p] = t - dt;
      if (this.botWait[p] > 0) return;
      this.botWait[p] = null;
      if (!this.free(p)) return;
      const b = botPutt(this.table, this.match, this.settings.bot, Math.random, p);
      this.roll(p, { speedMph: b.speedMph, hla: b.hla }, b.aimDeg);
    });
  }

  // Anything moving: a putt rolling, a turn coming, the camera on its way.
  get moving() {
    return !!this.rolling || this.wait > 0 || this.camera.position.distanceToSquared(this.camWant) > 1e-6 || this.look.distanceToSquared(this.lookWant) > 1e-6;
  }

  // ---- Online -------------------------------------------------------------------------

  // The host started golf pong (app.js): the mat from its setup, this
  // bay's end(s). net: { names, ids, mine: [ends played here], send(ev) }.
  startNet(net, game) {
    this.net = net;
    // (As many as there are players: two, three in lanes, or four-way.)
    this.setTable({ ...game.round.setup, players: game.players?.length ?? game.pong?.n ?? 2 });
    this.match = game.pong;
    this.result = "";
    this.seen = game.seq;
    this.lastHere = this.match.first - 1;
    if (this.match.together) {
      this.startRound(true);
      return this.toast(`Online golf pong: ${net.names.join(" v ")} - ${this.match.race ? "a race" : "everyone at once"}`, 3500);
    }
    this.startTurn();
    this.toast(`Online golf pong: ${net.names.join(" v ")} - ${net.names[this.match.turn]} first`, 3500);
  }

  // Each change from the host: the other bays' putts rolled here as they
  // went, one after another (two players on one bay can putt twice while
  // the first is still rolling here: it waits its turn, never left out);
  // then the match as the host has it.
  applyNet(game) {
    if (!this.net || !game?.pong) return;
    if (this.match.together) return this.applyNetTogether(game);
    const fresh = (game.pongPutts ?? []).filter((q) => q.seq > (this.seen ?? 0));
    this.seen = game.seq;
    this.netQueue.push(...fresh.filter((q) => !this.mine(q.p)));
    this.pendingMatch = game.pong;
    if (!this.rolling) this.nextNetPutt();
  }

  // In turn, online: the next of the other bays' putts rolled here - or,
  // none left, the host's match.
  nextNetPutt() {
    if (this.rolling) return;
    const q = this.netQueue.shift();
    if (q) {
      this.wait = 0;
      this.match = { ...this.match, turn: q.p };
      this.placeCamera(false);
      this.roll(q.p, { speedMph: q.speed, hla: q.hla }, q.aim, { decided: { rack: q.rack ?? null, cup: q.cup ?? null } });
      return;
    }
    const g = this.pendingMatch;
    if (!g) return;
    this.pendingMatch = null;
    const turned = this.match.turn !== g.turn || this.match.winner !== g.winner;
    this.match = g;
    if (turned && g.winner == null) this.startTurn();
    else this.drawCups();
  }

  // All at once: every other bay's putt rolled here at once, as it came -
  // while this bay's own may be rolling - and the host's match taken once
  // nothing's rolling here.
  applyNetTogether(game) {
    const fresh = (game.pongPutts ?? []).filter((q) => q.seq > (this.seen ?? 0));
    this.seen = game.seq;
    for (const q of fresh) {
      if (this.mine(q.p)) continue;
      // (Racing, struck again on its own bay before its last ball has
      // stopped here: that one's done.)
      const was = this.rollOf(q.p);
      if (was) this.finish(was);
      this.roll(q.p, { speedMph: q.speed, hla: q.hla }, q.aim, { decided: { rack: q.rack ?? null, cup: q.cup ?? null, taken: !!q.taken } });
    }
    this.pendingMatch = game.pong;
    this.reconcile();
    this.settle();
  }

  // Online, all at once: the host's match, once nothing's rolling here and
  // it has every putt sent from here.
  reconcile() {
    const g = this.pendingMatch;
    if (!g || this.rolls.length) return;
    if (g.putts.filter((q) => this.mine(q.player)).length < (this.sent ?? 0)) return;
    this.pendingMatch = null;
    this.match = g;
    this.drawCups();
  }

  stopNet() {
    if (!this.net) return;
    this.net = null;
    this.newGame({ quiet: true });
  }

  // ---- Over the picture, and the panel ----------------------------------------------

  overlay() {
    const m = this.match;
    const t = this.table;
    let title;
    if (m.together) title = this.togetherWords();
    else {
      const turn = m.winner != null ? `${this.names[m.winner]} wins!` : this.rolling ? "" : this.result || `${this.names[m.turn]}'s putt`;
      title = m.winner != null ? turn : this.rolling ? "" : turn + (this.result && m.winner == null ? ` - ${this.names[m.turn]} next` : "");
    }
    const aiming = m.together ? this.shooter != null : this.mine(m.turn) && !this.botTurn;
    return {
      club: "PT",
      // (Shown as HTML: the players' names come from other bays online.)
      title: esc(title),
      note: `${GAME_NAMES[t.n]}${m.together ? (m.race ? ", a race" : ", all at once") : ""} - ${LAYOUTS[t.setup.layout].name.toLowerCase()}, ${t.n === 4 ? SIZES[t.setup.size].name : LENGTHS[t.setup.length].name}, ${SLOPES[t.setup.slopes].name.toLowerCase()} slopes`,
      stats: [
        // How many each has holed: six wins.
        ...this.names.map((name, p) => ({ label: name, value: `${holedBy(m, p)}/6`, unit: "holed", accent: this.upNow(p) })),
        ...(aiming && Math.abs(this.aimDeg) >= 0.01 ? [{ label: "Aim", value: `${fmt(Math.abs(this.aimDeg), 2)}° ${this.aimDeg > 0 ? "R" : "L"}` }] : []),
      ],
      guide: [],
    };
  }

  // Whether player p is up: in turn, whose turn it is; all at once, still
  // to putt this round (racing, nobody in particular).
  upNow(p) {
    const m = this.match;
    if (m.winner != null) return false;
    if (!m.together) return m.turn === p;
    return stillToPutt(m).includes(p) && !this.rollOf(p);
  }

  // All at once, the words over the picture: the last putt's, then whose
  // putt is still to come this round (racing: putt again as soon as your
  // ball stops).
  togetherWords() {
    const m = this.match;
    if (m.winner != null) return `${this.names[m.winner]} wins!`;
    // (Racing: how the last putt here went, till the next.)
    if (m.race) return this.resultHere ? `${this.resultHere} - putt again as soon as your ball stops` : RACE_WORDS;
    let state;
    const still = stillToPutt(m).filter((p) => !this.rollOf(p)).sort((a, b) => a - b);
    if (this.roundShown !== m.round) state = `round ${m.round} next`;
    else if (still.length) state = `Round ${m.round}: ${listed(still.map((p) => this.names[p]))} to putt`;
    else state = `Round ${m.round}: everyone's putted`;
    return this.result ? `${this.result} - ${state}` : state;
  }

  buildPanel() {
    const s = this.settings;
    const opt = (list, value) => Object.entries(list).map(([k, v]) => `<option value="${k}" ${k === value ? "selected" : ""}>${esc(v.name ?? v)}</option>`).join("");
    this.panel.innerHTML = `
      <section class="pong-board">
        <h3>Golf pong</h3>
        <div id="pong-score" class="pong-score"></div>
      </section>
      <section class="settings">
        <h3>Golf pong</h3>
        <p class="muted small">On a real green: a rack of cups at each end - take turns putting at the other's (or all putt at once); a cup holed is covered. First to hole all six wins. No backboard: too firm and it runs on down the green. Four-way: a rack on each side, putt at anyone's. Three: a lane each, side by side, your own rack at the end. Every player has the same putts, slopes and all.</p>
        <label title="Two from either end, three in lanes side by side, or four with a rack on each side">Players <select id="pong-players">${opt(PLAYERS, String(s.players))}</select></label>
        <label title="Against bots, or everyone playing here taking the putts (each the hitter on theirs)">Play <select id="pong-opponent">${opt(OPPONENTS, s.opponent)}</select></label>
        <label class="pong-bot" title="How well the bots putt: each reads the real slopes, then misses about as much as that golfer would">Bots <select id="pong-bot">${opt(BOT_LEVELS, s.bot)}</select></label>
        <label title="In turn: one putt at a time, round the players. All at once: everyone putts together, each waiting for the others before their next">Putts <select id="pong-putts">${opt(PUTTS, s.together ? "together" : "turn")}</select></label>
        <label class="check pong-race" title="All at once with no rounds: putt again as soon as your ball stops - speed matters too, the first to hole them all wins"><input type="checkbox" id="pong-race" ${s.race ? "checked" : ""}> Race</label>
        <label title="How each rack of six is laid out: a triangle either way round, a line across, two rows, a zigzag, an arrow or a ring">Cups <select id="pong-layout">${opt(LAYOUTS, s.layout)}</select></label>
        <label title="How far apart the cups in a rack are - wider gaps make it harder to hole one by luck. Where a rack wouldn't fit, as far apart as it can be">Gaps <select id="pong-spacing">${opt(SPACINGS, s.spacing)}</select></label>
        <label class="pong-two" title="How far it is from where you putt to the far end of the patch">Length <select id="pong-length">${opt(LENGTHS, s.length)}</select></label>
        <label class="pong-four" title="Four-way: how far it is across the square patch">Size <select id="pong-size">${opt(SIZES, s.size)}</select></label>
        <label title="How much the green rises and falls - the same for every player">Slopes <select id="pong-slopes">${opt(SLOPES, s.slopes)}</select></label>
        <label title="How fast the green runs (its stimp)">Speed <select id="pong-speed">${opt(SPEEDS, s.speed)}</select></label>
        <button id="pong-new" data-head>New game (N)</button>
        <p class="muted small">← → aim. Online against another bay: Menu, Play, Online play - host, and pick Golf pong.</p>
      </section>`;
    for (const k of ["players", "opponent", "bot", "putts", "race", "layout", "spacing", "length", "size", "slopes", "speed"]) {
      this.panel.querySelector(`#pong-${k}`).addEventListener("change", (e) => {
        if (k === "putts") s.together = e.target.value === "together";
        else if (k === "race") s.race = e.target.checked;
        else s[k] = k === "players" ? Number(e.target.value) : e.target.value;
        saveSetting("golfpong", s);
        if (this.net) return this.toast("Online: the host's green is played - this is for next time", 2400);
        this.newGame();
      });
    }
    this.panel.querySelector("#pong-new").addEventListener("click", () => this.newGame());
  }

  renderPanel() {
    const el = this.panel.querySelector("#pong-score");
    if (!el || !this.match) return;
    const m = this.match;
    el.innerHTML = this.names
      .map((n, p) => `<div class="${this.upNow(p) ? "turn" : ""}${m.winner === p ? " won" : ""}"><b>${esc(n)}</b> <span>${holedBy(m, p)} holed</span></div>`)
      .join("");
    const bot = this.panel.querySelector(".pong-bot");
    if (bot) bot.hidden = this.settings.opponent !== "bot";
    const race = this.panel.querySelector(".pong-race");
    if (race) race.hidden = !this.settings.together;
    const four = this.settings.players === 4;
    for (const el of this.panel.querySelectorAll(".pong-two")) el.hidden = four;
    for (const el of this.panel.querySelectorAll(".pong-four")) el.hidden = !four;
  }

  resize(aspect) {
    // (A picture taller than it's wide - the phone held upright - with the
    // lens widened: sim/upright.mjs.)
    fitLens(this.camera, aspect);
  }
}
