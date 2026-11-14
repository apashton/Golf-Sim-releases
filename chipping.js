// The chipping green: a strip of approach, a green, a spot to land it on.
//   To the pin      land it on the spot and let it roll to the hole. The spot
//                   is where the club in hand has to land, at this distance
//                   and green speed, to finish at the hole - worked out with
//                   the chip's own physics (sim/chipping.mjs landingPlan) -
//                   and the panel lists every club's spot and which one
//                   suits it. A streak of chips finishing inside 5 ft.
//   Landing zone    no pin: land it in the zone. A streak of landings in it.
//   Challenge       ten chips from one distance, scored for landing on the
//                   club's spot and finishing close, with the hole worth
//                   most; personal bests per distance, cup and green speed.
// Practice is from one distance, or a random one between two limits after
// every chip. A success is celebrated, more each time in a row, with the
// most in a row kept per player (streaks.js).

import * as THREE from "three";
import { makeShotTracer, TracerSet } from "./look/tracer.js";
import { KEEP_PRACTICE, tracerColour } from "./sim/tracer.mjs";
import { YARD } from "./sim/flight.mjs";
import { CUPS } from "./sim/putting.mjs";
import {
  simulateChip,
  chipLayout,
  chipGreen,
  APPROACH,
  chipForCarry,
  CHIP_DISTANCES,
  CHIP_CLUBS,
  landingPlan,
  landingPlanSteps,
  recommendClub,
  chipGround,
  hazardOutline,
  hazardFor,
  hazardFits,
  HAZARD_CHOICES,
} from "./sim/chipping.mjs";
import { anotherDistance, nextDistance, distanceWords } from "./sim/practice.mjs";
import { scoreChip, CHIP_LANDING, CHIP_FINISH, CHIP_HOLED } from "./sim/scoring.mjs";
import { streakKey, distanceKey, CHIP_STREAK_FEET, streakCelebration, afterTry, newRun } from "./sim/streaks.mjs";
import { Stepper, GuideCache } from "./sim/puttguide.mjs";
import { forgetFlags, makeBall, toWorld, BallShadow, bunkerOutline, pondOutline, sizeBall } from "./scenery.js";
import { REAL_BALL_R, ballDrawRadius } from "./sim/ballsize.mjs";
import { view } from "./view.js";
import { greenEntry, greenView, greenFollow } from "./sim/greencam.mjs";
import { disposeSurface } from "./look/sandwater.js";
import { addEnvironment, applyReflections, fitShadows } from "./look/environment.js";
import { HIGH } from "./look/quality.js";
import { buildGreenScene } from "./greenscene.js";
import { Challenge } from "./challenge.js";
import { Celebration } from "./celebrate.js";
import { Sounds } from "./sounds.js";
import { Streaks } from "./streaks.js";
import { clubName } from "./bay.js";
import { clubShort } from "./sim/clubs.mjs";
import { loadSetting, saveSetting, fmt, lr, esc } from "./util.js";
import { disposeTree, clearGroup } from "./look/dispose.js";
import { flightFacts } from "./recorder.js";
import { audio } from "./audio/engine.js";
import { shotCues, soundscape, CueQueue } from "./audio/cues.mjs";
import { flightStep } from "./sim/preflight.mjs";
import { fitLens } from "./sim/upright.mjs";

// In the air, drawn a little larger than life the higher it goes: at 30
// yards a real ball is a speck. On the ground, a real ball (sim/ballsize.mjs).
const BALL_R = 0.03;
export const CHIP_CLUB_LIST = Object.keys(CHIP_CLUBS);
// Practice distances, yards: one of these, or any whole yard between two.
const PRACTICE_DISTANCES = [5, 8, 10, 12, 15, 18, 20, 22, 25, 28, 30, 35, 40, 45, 50];
// The landing zone's size: this far either way of its middle, yards.
const ZONE_SIZES = [1, 1.5, 2, 3];
const GAMES = { practice: "To the pin", zone: "Landing zone", challenge: "Challenge" };

export class ChippingGreen {
  // view: the element over the picture (for a celebration's banner).
  // later: the green built when first come into rather than now (the phone
  // app's page plays one place: app.js buildLater).
  constructor(panel, renderer, view = null, { later = false } = {}) {
    this.panel = panel;
    this.scene = new THREE.Scene();
    // Far enough out for every cloud (look/environment.js).
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.05, 6000);
    const s = (this.settings = loadSetting("chipping", {
      game: "practice",
      holeYards: 20,
      distanceMode: "fixed",
      minYards: 10,
      maxYards: 30,
      gameYards: null,
      zoneSize: 2,
      cup: "normal",
      stimp: 10,
      hazard: "none",
    }));
    // The club is the program's one club in hand (app.js keeps it, in the
    // "app" setting); this is the chipping club that stands for it here.
    // A club kept here by an older version is dropped, so there's never a
    // second record of it.
    this.clubNow = CHIP_CLUBS[s.club] ? s.club : "SW";
    if ("club" in s) {
      delete s.club;
      saveSetting("chipping", s);
    }
    if (!GAMES[s.game]) s.game = "practice";
    // The challenge's own distance (it once shared the practice's).
    if (!CHIP_DISTANCES.includes(s.gameYards)) s.gameYards = CHIP_DISTANCES.includes(s.holeYards) ? s.holeYards : 20;
    if (!ZONE_SIZES.includes(s.zoneSize)) s.zoneSize = 2;
    if (!HAZARD_CHOICES[s.hazard]) s.hazard = "none";
    // The hazard in front of this chip (now and then, rolled for each).
    this.rollHazard();
    this.chips = [];
    // A quiet green: a light breeze and birds, no water.
    this.soundscape = soundscape({ wind: 0.25 });
    this.flying = null;
    this.resetTimer = 0;
    this.resultText = "";
    this.active = false;
    this.onChange = () => {};
    this.onToast = () => {};
    this.onClub = () => {};
    // Whose chips these are (app.js: whoever's hitting).
    this.hitter = () => "Player 1";
    // Their colour, for the tracers (player 1's alone).
    this.hitterColour = () => tracerColour(0);
    this.challenge = new Challenge({ maxPoints: 3 + CHIP_HOLED, onEvent: (e) => this.roundOver(e) });
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.light = addEnvironment(this.scene, renderer, { shadowSize: 45 }).light;
    this.ballShadow = new BallShadow(this.light.userData.sun, BALL_R);
    this.scene.add(this.ballShadow.mesh);
    // Where each club lands to roll to the hole, by distance and green
    // speed, worked out once each.
    this.plans = new GuideCache(80);
    this.advice = null;
    this.adviceJob = null;
    this.sounds = new Sounds();
    this.celebration = view ? new Celebration({ view, canvas: renderer.domElement, scene: this.scene, sounds: this.sounds, high: HIGH }) : null;
    if (this.celebration) this.celebration.onBannerGone = () => this.onChange();
    this.streaks = new Streaks({
      sounds: this.sounds,
      celebrate: (desc) => this.celebrate(desc),
      toast: (text, ms) => this.onToast(text, ms),
    });
    this.buildPanel();
    this.unbuilt = later;
    if (!later) this.build();
  }

  get isGame() {
    return this.settings.game === "challenge";
  }
  get isZone() {
    return this.settings.game === "zone";
  }
  // How far: the challenge's distance, or practice's (the one being played
  // now, when it's a random one each chip).
  get distanceYards() {
    return this.isGame ? this.settings.gameYards : this.settings.holeYards;
  }
  get distanceSetting() {
    const s = this.settings;
    return { mode: s.distanceMode, value: s.holeYards, min: s.minYards, max: s.maxYards };
  }
  // Where the club in hand lands to finish at the hole (none in the zone game).
  get plan() {
    return this.isZone ? null : this.planFor(this.club);
  }
  planFor(club) {
    const d = this.distanceYards;
    const key = this.planKey(club);
    const had = this.plans.get(key);
    return had !== undefined ? had : this.plans.set(key, landingPlan(chipLayout(d, null, this.settings.stimp, this.hazard), club));
  }
  planKey(club, d = this.distanceYards) {
    return `${d}:${this.settings.stimp}:${this.hazard ?? ""}:${club}`;
  }
  // What lies between the ball and the pin: a bunker, water, or nothing
  // (and never in the challenge, nor on a chip too short for one).
  get hazard() {
    return this.isGame || !hazardFits(this.distanceYards) ? null : this.hazardNow;
  }
  get layout() {
    const d = this.distanceYards;
    // The zone game's spot is the distance itself; the others land on the
    // club's spot (or a couple of yards on, if no chip with it can stop).
    if (this.isZone) return chipLayout(d, d, this.settings.stimp, this.hazard);
    const plan = this.plan;
    return chipLayout(d, plan?.ok ? plan.landingYards : null, this.settings.stimp, this.hazard);
  }
  get cup() {
    return CUPS[this.settings.cup] ?? CUPS.normal;
  }
  get club() {
    return this.clubNow;
  }
  // The challenge's personal-best key. (Older ones had a fixed landing spot
  // in them: "chip:20yd:land8:normal:s10".)
  get gameKey() {
    const s = this.settings;
    return `chip:${s.gameYards}yd:${s.cup}:s${s.stimp}`;
  }
  // The streak this practice counts, and the key its best is kept under.
  get streakKind() {
    return this.isGame ? null : this.isZone ? "chip-zone" : "chip-pin";
  }
  get streakKey() {
    const s = this.settings;
    const dist = distanceKey({ ...this.distanceSetting, unit: "yds" });
    // Over a hazard is a run of its own.
    const over = s.hazard !== "none" ? `, ${HAZARD_CHOICES[s.hazard].toLowerCase()}` : "";
    return this.isZone ? streakKey("chip-zone", dist, `${s.zoneSize} yd zone${over}`) : streakKey("chip-pin", dist, `stimp ${s.stimp}${over}`);
  }

  // Everything is flat here: the skill is judging carry and roll.
  worldHeight = () => 0;
  worldNormal = () => new THREE.Vector3(0, 1, 0);

  build() {
    this.unbuilt = false;
    forgetFlags(this.world);
    // The last green's tracers.
    this.tracers?.clear();
    this.world.traverse((o) => {
      o.geometry?.dispose();
      disposeSurface(o.material); // sand and water, with their fields (look/sandwater.js)
    });
    this.world.clear();
    const L = this.layout;
    const hole = L.holeYards * YARD;
    // The green and the approach, as the chip physics plays them
    // (chipping.mjs chipGreen): the picture turned into the world's frame.
    // The zone game has no hole.
    const g = chipGreen(L);
    const built = buildGreenScene(this.world, {
      heightAt: this.worldHeight,
      normalAt: this.worldNormal,
      green: { cx: 0, cz: -g.centre, rx: g.across, rz: g.along, seed: g.seed },
      hole: this.isZone ? null : { x: 0, z: -hole, r: this.cup.radius, style: this.settings.cup },
      approach: { from: APPROACH.behind, to: -g.front - 1, width: APPROACH.halfWidth * 2 },
      seed: 9,
      // Its ring of trees grown its own way for each green.
      treeSeed: 9 + ((g.seed ?? 0) % 100003),
    });
    this.holeWorld = built.holeWorld;
    this.cupMark = built.cupMark;
    // The bunker or the water to chip over, the outline the chip plays
    // (physics x, z to the world's z, x).
    if (L.hazard) {
      const outline = hazardOutline(L.hazard).map(([x, z]) => [z, -x]);
      const hazard = L.hazard.kind === "water" ? pondOutline(outline) : bunkerOutline(outline, { y: 0.02 });
      this.world.add(hazard);
    }
    this.ground = chipGround(L);

    // The landing spot: rings a yard, two and three across it - in the zone
    // game, the zone's own edge in gold.
    this.spot = new THREE.Group();
    this.drawSpot();
    this.world.add(this.spot);

    // Pitch marks of this round (or the last few chips in practice).
    this.marks = new THREE.Group();
    this.world.add(this.marks);

    this.ball = makeBall(BALL_R);
    this.world.add(this.ball);
    // The chips' tracers on this green: the last dozen, the last one bright.
    this.tracers = new TracerSet(this.world, { keep: KEEP_PRACTICE });
    this.tracer = null;
    applyReflections(this.scene, this.world);
    fitShadows(this.light, this.scene);
    this.resetBall();
    this.startAdvice();
    this.describe();
    this.renderGame();
    this.renderStreak();
  }

  drawSpot() {
    clearGroup(this.spot);
    const ring = (inner, outer, color, opacity) => {
      const m = new THREE.Mesh(
        new THREE.RingGeometry(inner, outer, 64).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
      );
      this.spot.add(m);
    };
    if (this.isZone) {
      const r = this.settings.zoneSize * YARD;
      ring(r - 0.08, r, 0xffd23f, 0.95);
      ring(0, r - 0.08, 0xffd23f, 0.12);
      for (const y of [1, 2, 3]) if (Math.abs(y - this.settings.zoneSize) > 0.01) ring(y * YARD - 0.03, y * YARD, 0xffffff, 0.25);
    } else {
      ring(1 * YARD - 0.06, 1 * YARD, 0xffd23f, 0.9);
      ring(2 * YARD - 0.04, 2 * YARD, 0xffffff, 0.45);
      ring(3 * YARD - 0.03, 3 * YARD, 0xffffff, 0.25);
    }
    ring(0, 0.08, 0xffd23f, 0.9);
    this.placeSpot();
  }

  // The spot where this club lands: moved, not rebuilt, as the club changes.
  placeSpot() {
    if (!this.spot) return;
    this.spot.position.set(0, 0.004, -this.layout.landingYards * YARD);
  }

  resetBall() {
    this.flying = null;
    // On the ground a real ball (sim/ballsize.mjs); larger only in the air.
    this.ballR = sizeBall(this.ball, REAL_BALL_R);
    this.ball.position.set(0, this.ballR, 0);
    const L = this.layout;
    const h = Math.min(3.2, 1.5 + L.holeYards * 0.04);
    this.camera.position.set(0.6, h, 3.6);
    this.look = new THREE.Vector3(0, 0, -((L.landingYards + L.holeYards) / 2) * YARD);
    this.camera.lookAt(this.look);
  }

  // ---- Where to land it: every club's spot, for the panel -----------------------------

  // Works out the rest of the clubs' spots a few milliseconds a frame
  // (update), so the table fills in without holding anything up.
  startAdvice() {
    this.advice = null;
    this.adviceJob = null;
    if (this.isZone) return this.renderAdvice();
    const d = this.distanceYards;
    const stimp = this.settings.stimp;
    const layout = chipLayout(d, null, stimp, this.hazard);
    const plans = this.plans;
    const clubs = [this.club, ...CHIP_CLUB_LIST.filter((c) => c !== this.club)];
    const keyOf = (club) => this.planKey(club, d);
    function* all() {
      const out = {};
      for (const club of clubs) {
        const key = keyOf(club);
        let p = plans.get(key);
        if (p === undefined) p = plans.set(key, yield* landingPlanSteps(layout, club));
        out[club] = p;
      }
      return out;
    }
    this.adviceJob = new Stepper(all());
    this.adviceFor = `${d}:${stimp}:${this.hazard ?? ""}`;
    this.renderAdvice();
  }

  // A few milliseconds a frame - a little more when the frames are slow
  // anyway, so a slower PC still has the table before long.
  stepAdvice(dt = 1 / 60) {
    if (!this.adviceJob || !this.adviceJob.run(Math.min(20, Math.max(4, dt * 250)))) return;
    this.advice = this.adviceJob.value;
    this.adviceJob = null;
    this.renderAdvice();
    this.describe();
  }

  // The club that suits this distance and green speed, once every club's
  // spot is known.
  get suggested() {
    return this.advice ? recommendClub(this.advice) : null;
  }

  renderAdvice() {
    const box = this.panel.querySelector("#chip-advice");
    if (!box) return;
    box.hidden = this.isZone;
    if (this.isZone) return;
    const table = this.panel.querySelector("#chip-plans");
    const best = this.suggested;
    const rows = CHIP_CLUB_LIST.map((club) => {
      const p = this.advice?.[club] ?? this.plans.get(this.planKey(club));
      const cls = [club === this.club ? "here" : "", club === best ? "best" : ""].filter(Boolean).join(" ");
      const name = `${club === best ? "★ " : ""}${esc(clubShort(club))}${p?.flop ? " flop" : ""}`;
      if (!p) return `<tr class="${cls}"><td>${name}</td><td colspan="3" class="muted">...</td></tr>`;
      if (!p.ok) return `<tr class="${cls}"><td>${name}</td><td colspan="3" class="muted">${this.hazard ? esc(p.why) : "runs past - too little loft"}</td></tr>`;
      const on = p.onGreenYards < 0 ? `${fmt(-p.onGreenYards, 1)} short` : p.onGreenYards < 0.3 ? "front edge" : `${fmt(p.onGreenYards, 1)} on`;
      return `<tr class="${cls}"><td>${name}</td><td>${fmt(p.landingYards, 1)}</td><td>${on}</td><td>${fmt(p.rollYards, 1)}</td></tr>`;
    }).join("");
    table.innerHTML = `<tr><th>Club</th><th>Land it</th><th>Green</th><th>Rolls</th></tr>${rows}`;
  }

  // ---- Words ---------------------------------------------------------------------------

  plainDescription() {
    const d = this.distanceYards;
    if (this.isZone) {
      const z = this.settings.zoneSize;
      return `${d} yds to the zone - land it within ${z} yd${z === 1 ? "" : "s"} of the middle`;
    }
    const p = this.plan;
    const best = this.suggested;
    const hz = this.layout.hazard;
    // Over a bunker or water, to a pin just past it: the flop.
    const to = hz ? `${d} yds to the hole, over ${hz.kind === "water" ? "water" : "a bunker"} - the pin ${fmt(d - this.layout.greenStartYards, 1)} yds on` : `${d} yds to the hole`;
    if (!p?.ok) {
      if (hz) return `${to}: the ${clubName(this.club).toLowerCase()} ${p?.why ?? "can't stop it there"}${best ? ` - take the ${clubName(best).toLowerCase()}${this.advice?.[best]?.flop ? " and flop it" : ""}` : ""}`;
      return `${to} - the ${clubName(this.club).toLowerCase()} runs past from here: take more loft${best ? ` (the ${clubName(best).toLowerCase()})` : ""}`;
    }
    const on = p.onGreenYards < 0 ? `${fmt(-p.onGreenYards, 1)} short of the green` : p.onGreenYards < 0.3 ? "the front edge" : `${fmt(p.onGreenYards, 1)} on`;
    const suits = best && best !== this.club ? ` - the ${clubName(best).toLowerCase()} suits it` : "";
    const how = p.flop ? "flop it: open the face, swing hard, " : "";
    return `${to} - ${how}land it ${fmt(p.landingYards, 1)} yds (${on}), rolls ${fmt(p.rollYards, 1)}${suits}`;
  }

  describe() {
    const el = this.panel.querySelector("#chip-describe");
    if (el) el.innerHTML = esc(this.plainDescription()).replace(/^(\d+ yds)/, "<b>$1</b>");
    this.onChange();
  }

  overlay() {
    const last = this.chips[this.chips.length - 1];
    let note = this.plainDescription();
    const stats = [];
    if (this.isGame) {
      const r = this.challenge.round;
      note += r ? ` - chip ${this.challenge.progress}` : " - chip to start a round";
      stats.push({ label: "Score", value: r ? String(r.total) : "-", accent: true });
      stats.push({ label: "Personal best", value: String(this.challenge.best(this.gameKey) ?? "-") });
    }
    if (last) {
      const res = last.result;
      // (The last chip's numbers are of: "shot" - the command centre's Last
      // shot box has them, This shot the rest: sim/thisshot.mjs.)
      stats.push({ label: "Carry", value: fmt(res.carryYards, 1), unit: "yds", accent: !this.isGame, of: "shot" });
      stats.push({ label: this.isZone ? "Off the middle" : "Off the spot", value: fmt(res.landingMissYards, 1), unit: "yds", of: "shot" });
      if (!this.flying && !this.isZone) {
        stats.push({ label: "Leave", value: res.holed ? "In" : fmt(res.leaveFeet, 0), unit: res.holed ? "" : "ft", of: "shot" });
      }
      if (this.isGame) stats.push({ label: "Ball speed", value: fmt(last.ball.speedMph, 0), unit: "mph", of: "shot" });
    }
    if (this.streakKind) {
      const run = this.streaks.run(this.hitter(), this.streakKey);
      stats.push({ label: "In a row", value: String(run.count) });
      stats.push({ label: "Best", value: String(Math.max(run.best, run.count) || "-") });
    }
    const title = this.flying || this.celebration?.showing ? "" : this.resultText || "Chip when ready";
    // The result line whole, for This shot (the panel's: "4 ft away - 2 ft
    // long, 3 ft right", the points).
    const full = this.flying ? "" : (this.panel.querySelector("#chip-result")?.textContent ?? "");
    // The roll too, for the command centre's Last shot box alone.
    const more = last && !this.flying && !this.isZone ? [{ label: "Rolled", value: fmt(last.result.totalYards - last.result.carryYards, 1), unit: "yds", of: "shot" }] : [];
    // The club that suits the chip (This shot says it when another's in
    // hand).
    const suggest = this.flying || this.isZone ? null : (this.suggested ?? null);
    return { club: this.club, title, full, note, stats, more, suggest };
  }

  testShot() {
    const L = this.layout;
    const shot = chipForCarry(this.club, L.landingYards + (Math.random() - 0.5) * 3, { flop: !!this.plan?.flop });
    return { ...shot, hla: (Math.random() - 0.5) * 4, spinAxis: (Math.random() - 0.5) * 10 };
  }

  // ---- The panel -------------------------------------------------------------------------

  buildPanel() {
    const s = this.settings;
    const opt = (list, value, label = (v) => v) =>
      list.map((v) => `<option value="${v}" ${String(v) === String(value) ? "selected" : ""}>${label(v)}</option>`).join("");
    const yds = (v) => `${v} yds`;
    this.panel.innerHTML = `
      <section class="tabs" data-cc="head">
        ${Object.entries(GAMES).map(([id, name]) => `<button data-game="${id}">${name}</button>`).join("")}
      </section>
      <section class="putt-result" id="chip-result" data-cc="off">Chip when ready</section>
      <section class="numbers" data-cc="off">
        ${["Carry", "Off the spot", "Leave", "Rolled"].map((n) => `<div class="stat"><span data-label="${n}">${n}</span><b data-k="${n}">-</b></div>`).join("")}
      </section>
      <section data-cc="off"><p id="chip-describe" class="describe"></p></section>
      <section class="settings">
        <h3>The chip</h3>
        <label>Club <select id="chip-club">${opt(CHIP_CLUB_LIST, this.club, clubName)}</select></label>
        <div id="chip-practice-distance">
          <label>Distance <select id="chip-dist-mode">
            <option value="fixed">One distance</option>
            <option value="random">A random one each chip</option>
          </select></label>
          <label class="dist-fixed"><span id="chip-to">To the hole</span> <select id="chip-distance">${opt(PRACTICE_DISTANCES, s.holeYards, yds)}</select></label>
          <label class="dist-random">Between <span><select id="chip-min">${opt(PRACTICE_DISTANCES, s.minYards, yds)}</select> and <select id="chip-max">${opt(PRACTICE_DISTANCES, s.maxYards, yds)}</select></span></label>
        </div>
        <label id="chip-hazard-wrap">Over a hazard <select id="chip-hazard">${opt(Object.keys(HAZARD_CHOICES), s.hazard, (k) => HAZARD_CHOICES[k])}</select></label>
        <label id="chip-zone-wrap">Zone <select id="chip-zone">${opt(ZONE_SIZES, s.zoneSize, (v) => `${v} yd${v === 1 ? "" : "s"} either way`)}</select></label>
        <label id="chip-cup-wrap">Cup <select id="chip-cup">${opt(Object.keys(CUPS), s.cup, (k) => `${CUPS[k].name} (${CUPS[k].short})`)}</select></label>
        <label>Green speed <select id="chip-stimp">${opt([7, 8, 9, 10, 11, 12, 13, 14], s.stimp, (v) => `Stimp ${v}`)}</select></label>
      </section>
      <section id="chip-advice">
        <h3>Where to land it <small>(this distance and green speed)</small></h3>
        <table class="clubs chip-plans" id="chip-plans"></table>
        <p class="muted small">Land it on the spot and it rolls out to the hole. ★ suits it best: the least lofted club landing safely on the green without running most of the way.</p>
      </section>
      <section id="chip-streak">
        <h3>In a row</h3>
        <div id="chip-streak-body"></div>
      </section>
      <section class="settings">
        <h3>Next chip's power <kbd>Shift + E</kbd></h3>
        <div class="power-pick" id="chip-power">${[null, 25, 50, 75, 100]
          .map((pw) => `<button data-power="${pw ?? ""}" class="${pw == null ? "active" : ""}">${pw == null ? "Normal" : pw === 100 ? "Full" : `${pw}%`}</button>`)
          .join("")}</div>
        <p class="muted small">A chip said to be at a power - here, Shift + E or "power next fifty" - is kept with it, and My stats shows each club's carry at each power.</p>
      </section>
      <div id="chip-game">
        <section class="settings">
          <h3>Scoring</h3>
          <label>To the hole <select id="chip-game-distance">${opt(CHIP_DISTANCES, s.gameYards, yds)}</select></label>
          <table class="zones">
            <tr><td colspan="2">Landing on the club's spot: within ${CHIP_LANDING.map((z) => `${z.within} yd <b>+${z.points}</b>`).join(", ")}</td></tr>
            <tr><td colspan="2">Finish: holed <b>+${CHIP_HOLED}</b>, ${CHIP_FINISH.map((z) => `${z.within} ft <b>+${z.points}</b>`).join(", ")}</td></tr>
          </table>
        </section>
        <section id="chip-round"></section>
        <section class="round-buttons" data-cc="head"><button id="chip-start">Start round (N)</button></section>
        <section>
          <h3>Personal bests</h3>
          <table class="clubs" id="chip-bests"></table>
        </section>
      </div>
      <section id="chip-practice">
        <h3>Session</h3>
        <table class="clubs" id="chip-stats"></table>
        <button id="chip-clear">Clear session</button>
      </section>`;
    const $ = (id) => this.panel.querySelector(id);
    $("#chip-dist-mode").value = s.distanceMode;
    for (const btn of this.panel.querySelectorAll("[data-game]")) {
      btn.addEventListener("click", () => this.setGame(btn.dataset.game));
    }
    const change = () => {
      s.distanceMode = $("#chip-dist-mode").value;
      s.minYards = Number($("#chip-min").value);
      s.maxYards = Number($("#chip-max").value);
      if (s.distanceMode === "fixed") s.holeYards = Number($("#chip-distance").value);
      // Into a random one: the first one now, between the limits.
      else if (s.holeYards < Math.min(s.minYards, s.maxYards) || s.holeYards > Math.max(s.minYards, s.maxYards)) s.holeYards = nextDistance(this.distanceSetting);
      s.gameYards = Number($("#chip-game-distance").value);
      s.zoneSize = Number($("#chip-zone").value);
      s.cup = $("#chip-cup").value;
      s.stimp = Number($("#chip-stimp").value);
      s.hazard = $("#chip-hazard").value;
      this.challenge.round = null;
      this.save();
    };
    for (const id of ["#chip-dist-mode", "#chip-distance", "#chip-min", "#chip-max", "#chip-game-distance", "#chip-zone", "#chip-cup", "#chip-stimp", "#chip-hazard"]) {
      $(id).addEventListener("change", change);
    }
    $("#chip-club").addEventListener("change", () => this.setClub($("#chip-club").value));
    $("#chip-start").addEventListener("click", () => this.startRound());
    // The next chip's power (recorder.js keeps it, and clears it after the chip).
    for (const b of this.panel.querySelectorAll("#chip-power button")) {
      b.addEventListener("click", () => {
        b.blur();
        this.onPowerNext?.(b.dataset.power ? Number(b.dataset.power) : null);
      });
    }
    $("#chip-clear").addEventListener("click", () => {
      this.chips = [];
      clearGroup(this.marks);
      this.renderStats();
    });
    this.showGamePanels();
    this.renderStats();
  }

  // The hazard for the next chip, from the setting (rolled again for each
  // chip when it's now and then), and kept until the setting changes.
  rollHazard() {
    this.hazardChoice = this.settings.hazard;
    this.hazardNow = hazardFor(this.settings.hazard);
  }

  save() {
    if (this.settings.hazard !== this.hazardChoice) this.rollHazard();
    if (this.panel.querySelector("#chip-hazard")) this.panel.querySelector("#chip-hazard").value = this.settings.hazard;
    saveSetting("chipping", this.settings);
    this.showGamePanels();
    this.build();
    // The heartbeat goes with the run of the practice now in hand (none in
    // the challenge).
    if (this.active && this.streakKind) this.streaks.switchTo(this.hitter(), this.streakKey);
    else this.streaks.stop();
  }

  setGame(game) {
    if (!GAMES[game] || this.settings.game === game) return;
    this.settings.game = game;
    this.celebration?.clear();
    this.save();
  }

  setClub(club) {
    if (!CHIP_CLUBS[club]) return;
    this.clubNow = club;
    this.panel.querySelector("#chip-club").value = club;
    // The spot moves to where this club lands.
    this.placeSpot();
    if (!this.flying) this.resetBall();
    this.renderAdvice();
    this.describe();
    this.onClub(club);
    this.onChange();
  }

  // The power buttons: what the next chip was said to be (recorder.js's
  // power, from them, Shift + E or voice), or Normal.
  showPower(pw) {
    for (const b of this.panel.querySelectorAll("#chip-power button")) b.classList.toggle("active", b.dataset.power === (pw == null ? "" : String(pw)));
  }

  stepClub(delta) {
    const i = CHIP_CLUB_LIST.indexOf(this.club);
    const next = CHIP_CLUB_LIST[Math.min(CHIP_CLUB_LIST.length - 1, Math.max(0, i + delta))];
    if (next !== this.club) this.setClub(next);
    return next;
  }

  showGamePanels() {
    const $ = (id) => this.panel.querySelector(id);
    const s = this.settings;
    $("#chip-game").hidden = !this.isGame;
    $("#chip-practice").hidden = this.isGame;
    $("#chip-streak").hidden = this.isGame;
    $("#chip-practice-distance").hidden = this.isGame;
    $("#chip-zone-wrap").hidden = !this.isZone;
    $("#chip-hazard-wrap").hidden = this.isGame;
    $("#chip-cup-wrap").hidden = this.isZone;
    $("#chip-to").textContent = this.isZone ? "To the zone" : "To the hole";
    for (const el of this.panel.querySelectorAll(".dist-fixed")) el.hidden = s.distanceMode === "random";
    for (const el of this.panel.querySelectorAll(".dist-random")) el.hidden = s.distanceMode !== "random";
    $("#chip-distance").value = String(s.holeYards);
    $("[data-label='Off the spot']").textContent = this.isZone ? "Off the middle" : "Off the spot";
    $("[data-label='Leave']").textContent = this.isZone ? "In the zone" : "Leave";
    for (const btn of this.panel.querySelectorAll("[data-game]")) btn.classList.toggle("active", btn.dataset.game === s.game);
  }

  // Coming in and going: a celebration or a heartbeat doesn't carry on in
  // another mode.
  setActive(on) {
    this.active = on;
    // (Built now if it waited: the constructor's later.)
    if (on && this.unbuilt) this.build();
    if (!on) {
      this.celebration?.clear();
      this.streaks.stop();
    } else if (this.streakKind) {
      this.renderStreak();
      this.streaks.switchTo(this.hitter(), this.streakKey);
    }
  }

  // Whoever's hitting has changed: their run and best.
  hitterChanged() {
    if (!this.streakKind) return;
    this.renderStreak();
    if (this.active) this.streaks.switchTo(this.hitter(), this.streakKey);
    this.onChange();
  }

  // N: a new challenge round, or in practice another distance - a random
  // one between the limits, or another from the list.
  next() {
    if (this.isGame) return this.startRound();
    const s = this.settings;
    s.holeYards = s.distanceMode === "random" ? nextDistance(this.distanceSetting, s.holeYards) : anotherDistance(PRACTICE_DISTANCES, s.holeYards);
    this.save();
    this.onToast(`${s.holeYards} yds ${this.isZone ? "to the zone" : "to the hole"}`, 1500);
  }

  // After a chip, with a random distance each time: the next one.
  nextChip() {
    const s = this.settings;
    const was = this.hazard;
    // Now and then a hazard: rolled again for every chip.
    if (!this.isGame && s.hazard === "mixed") this.rollHazard();
    if (this.isGame || s.distanceMode !== "random") {
      if (this.hazard === was) return this.resetBall();
      this.build();
    } else {
      s.holeYards = nextDistance(this.distanceSetting, s.holeYards);
      saveSetting("chipping", s);
      this.build();
    }
    const hz = this.hazard ? ` over ${this.hazard === "water" ? "water" : "a bunker"}` : "";
    if (hz || s.distanceMode === "random") this.onToast(`${this.distanceYards} yds${hz}`, 1500);
  }

  startRound() {
    this.challenge.start(this.gameKey);
    clearGroup(this.marks);
    this.resultText = "";
    this.renderGame();
    this.onToast(`${this.settings.gameYards} yd chipping challenge - 10 chips`);
    this.onChange();
  }

  // Online (netside.js NetTurns): the host's challenge, this bay's
  // players one after another, each chip's points going to every bay.
  startNet(net) {
    const s = this.settings;
    const u = net.setup;
    if (Number.isFinite(u.yards)) s.gameYards = u.yards;
    if (typeof u.cup === "string" && u.cup in CUPS) s.cup = u.cup;
    if (Number.isFinite(u.stimp)) s.stimp = u.stimp;
    this.stopNet();
    this.net = net;
    // Into the challenge (its panel, no practice streak).
    if (s.game !== "challenge") this.setGame("challenge");
    else this.save();
    this.startRound();
    if (net.player) this.onToast(`Online: ${net.player.name} first - ${s.gameYards} yd, 10 chips`, 3000);
  }

  stopNet() {
    clearTimeout(this.netTimer);
    this.net = null;
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
      setTimeout(() => this.net && this.onToast(`${next.name}'s go - 10 chips`, 3000), 3600);
    } else setTimeout(() => this.net && this.onToast("Everyone here has played - waiting for the other bays", 3500), 3600);
  }

  roundOver({ total, isBest, previous }) {
    // Online: the next player here - once this round's last chip and score
    // have gone into the stats as the player's who played them.
    if (this.net) setTimeout(() => this.netNext(), 0);
    const r = this.challenge.round;
    this.onGame?.({ kind: "chipping-challenge", id: r.id, key: r.key, score: total, name: `${this.settings.gameYards} yd chipping challenge` });
    this.onToast(isBest ? (previous === null ? `First score: ${total}` : `New PB! ${total} (was ${previous})`) : `Round over: ${total}`, 3500);
  }

  renderGame() {
    const el = this.panel.querySelector("#chip-round");
    if (!el) return;
    el.innerHTML = this.challenge.html(this.gameKey, "Chip");
    const bests = this.challenge.bestsFor("chip:").sort((a, b) => parseInt(a.key.split(":")[1]) - parseInt(b.key.split(":")[1]));
    this.panel.querySelector("#chip-bests").innerHTML =
      `<tr><th>To hole</th><th>Land</th><th>Cup</th><th>Stimp</th><th>Best</th><th>Date</th></tr>` +
      (bests
        .map((b) => {
          // Older rounds were to one landing spot for every club.
          const parts = b.key.split(":");
          const old = parts[2]?.startsWith("land");
          const [dist, land, cup, stimp] = old ? parts.slice(1) : [parts[1], null, parts[2], parts[3]];
          const here = b.key === this.gameKey ? ' class="here"' : "";
          return `<tr${here}><td>${dist.replace("yd", " yds")}</td><td>${old ? `${land.replace("land", "")} yds` : "club's spot"}</td><td>${CUPS[cup]?.short ?? cup}</td><td>${stimp?.slice(1) ?? "-"}</td><td>${b.score}</td><td>${b.date}</td></tr>`;
        })
        .join("") || `<tr><td colspan="6" class="muted">No rounds finished yet</td></tr>`);
    this.panel.querySelector("#chip-start").textContent = this.challenge.round && !this.challenge.round.finished ? "Restart round (N)" : "Start round (N)";
  }

  renderStreak() {
    const el = this.panel.querySelector("#chip-streak-body");
    if (!el || !this.streakKind) return;
    el.innerHTML = this.streaks.html(this.hitter(), this.streakKind, this.streakKey);
  }

  // ---- A chip ------------------------------------------------------------------------------

  onShot(entry) {
    if (this.flying) this.finish(this.flying.chip);
    if (this.isGame && (!this.challenge.round || this.challenge.round.finished)) {
      // Online, everyone here has had their go: nothing more to score.
      if (this.net?.done) {
        this.onToast("Everyone here has played - the scoreboard has the rest (Menu, Play, Online play to leave)", 3000);
        return;
      }
      this.startRound();
    }
    // The last one's party is over.
    this.celebration?.clear();
    this.resetTimer = 0;
    this.resetBall();
    const result = simulateChip(entry.ball, this.layout, this.cup.radius, { hole: !this.isZone });
    const chip = { ...entry, result, game: this.settings.game };
    // The flight it flew, for the recording's and the command centre's
    // flight path (sim/shotflight.mjs).
    this.onFlight?.({ path: result.path, flightPoints: result.flightPoints });
    this.chips.push(chip);

    // A tracer over the flight and the run out, as on the range and the
    // course, in the hitter's colour; the earlier chips' stay, faint.
    const place = (p) => toWorld(p[0], p[1] + BALL_R, p[2]);
    this.tracer = this.tracers.add(makeShotTracer(result.path, result.flightPoints, place, { colour: this.hitterColour() }));

    // Its sounds as the ball gets there: the landing, on the approach or
    // the green, each bounce, and the cup.
    const greenStart = this.layout.greenStartYards * YARD;
    const ground = this.ground;
    const lieAt = (x, z) => {
      const on = ground?.(x, z);
      return on === "bunker" || on === "water" || on === "rough" ? on : x >= greenStart ? "green" : "fairway";
    };
    const cues = new CueQueue(shotCues(result.water ? { ...result, penalty: { kind: "water" } } : result, { lieAt }));
    // Onto the green: the camera closes in there as it comes on, to see it
    // run out and how near the hole it stops (sim/greencam.mjs) - with the
    // camera set to follow (V), as on the course.
    const L = this.layout;
    const on = greenEntry(result.path, { flightPoints: result.flightPoints, onGreen: (x) => x >= greenStart });
    const end = result.path.at(-1);
    const pin = [(this.isZone ? L.landingYards : L.holeYards) * YARD, 0];
    const green = on && { t: on.t, view: greenView({ from: [0, 0], touch: on.at, rest: [end[0], end[2]], pin }) };
    this.flying = { chip, elapsed: 0, index: 0, cues, green };
    this.set("Carry", `${fmt(result.carryYards, 1)} yds`);
    this.set("Off the spot", "...");
    this.set("Leave", "...");
    this.set("Rolled", "...");
    this.panel.querySelector("#chip-result").textContent = "...";
    this.resultText = "";
    this.onChange();
  }

  set(k, v) {
    const el = this.panel.querySelector(`[data-k="${k}"]`);
    if (el) el.textContent = v;
  }

  update(dt) {
    // The yellow glow and closing circle round the cup, sized for the camera.
    this.cupMark?.update(this.camera, dt);
    const f = this.flying;
    if (f) {
      // Its first picture with the ball where it was struck from, then no
      // frame's step longer than a normal one's until it's on its way
      // (sim/preflight.mjs).
      dt = flightStep(f.elapsed, dt, { first: !f.started });
      f.started = true;
      f.elapsed += dt;
      const path = f.chip.result.path;
      while (f.index < path.length - 1 && path[f.index + 1][3] <= f.elapsed) f.index++;
      const a = path[f.index];
      const b = path[Math.min(f.index + 1, path.length - 1)];
      const k = Math.min(1, Math.max(0, (f.elapsed - a[3]) / (b[3] - a[3] || 1)));
      const px = a[0] + (b[0] - a[0]) * k;
      const pz = a[2] + (b[2] - a[2]) * k;
      const air = f.index < f.chip.result.flightPoints - 1;
      this.ballR = sizeBall(this.ball, ballDrawRadius({ air, height: a[1] + (b[1] - a[1]) * k, flight: BALL_R }));
      toWorld(px, a[1] + (b[1] - a[1]) * k + this.ballR, pz, this.ball.position);
      for (const c of f.cues.due(f.elapsed)) audio.cue(c, this.ball.position);
      this.tracer?.userData.reveal(f.index, k);
      if (f.index === f.chip.result.flightPoints - 1 && !f.marked) {
        f.marked = true;
        this.pitchMark(f.chip.result);
        this.set("Off the spot", `${fmt(f.chip.result.landingMissYards, 1)} yds`);
      }
      if (f.green && view.follow && f.elapsed >= f.green.t) {
        // Run onto the green: in close, low, behind the line (following a
        // ball still running up) - the ball, where it stops and the hole
        // all in the picture.
        const g = f.green.view;
        const { cam: [cx, cz], look: [lx, lz] } = greenFollow([px, pz], g);
        this.camera.position.lerp(toWorld(cx, g.up, cz), 1 - Math.exp(-dt * 2.2));
        this.look.lerp(toWorld(lx, 0, lz), 1 - Math.exp(-dt * 3));
      } else {
        // Keep the ball in view without chasing it.
        this.look.lerp(this.ball.position, 1 - Math.exp(-dt * 1.5));
      }
      if (f.index >= path.length - 1) this.finish(f.chip);
    } else if (this.resetTimer > 0) {
      this.resetTimer -= dt;
      if (this.resetTimer <= 0) this.nextChip();
    }
    this.stepAdvice(dt);
    this.celebration?.update(dt, this.camera);
    this.camera.lookAt(this.look);
    this.ballShadow.update(this.ball.position, this.worldHeight, this.ballR ?? REAL_BALL_R);
  }

  pitchMark(res) {
    const mark = new THREE.Mesh(
      new THREE.CircleGeometry(0.07, 16).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }),
    );
    toWorld(res.firstBounce[0], 0.006, res.firstBounce[1], mark.position);
    this.marks.add(mark);
    while (this.marks.children.length > 10) {
      const oldest = this.marks.children[0];
      this.marks.remove(oldest);
      disposeTree(oldest);
    }
  }

  // A celebration over this green: at the hole, or the zone's middle.
  celebrate(desc) {
    if (!this.celebration || !this.active) return;
    const focus = this.holeWorld ?? new THREE.Vector3(0, 0, -this.layout.landingYards * YARD);
    const away = new THREE.Vector3().subVectors(this.camera.position, focus);
    this.celebration.play(desc, { focus, camera: this.camera, away });
    this.onChange();
  }

  finish(chip) {
    if (!this.flying || this.flying.chip !== chip) return;
    if (!this.flying.marked) this.pitchMark(chip.result);
    this.flying = null;
    const res = chip.result;
    // Holed, it lies where its path ends, in the bottom of the cup.
    const end = res.path.at(-1);
    // In the water it's gone under.
    this.ballR = sizeBall(this.ball, REAL_BALL_R);
    const rest = res.holed ? toWorld(end[0], end[1] + this.ballR, end[2]) : toWorld(res.rest[0], res.water ? -0.1 : this.ballR, res.rest[1]);
    this.ball.position.copy(rest);
    this.tracer?.userData.revealAll();

    const score = scoreChip(res);
    let scoreText = "";
    let game;
    if (this.isGame && this.challenge.round && !this.challenge.round.finished) {
      chip.score = score;
      game = { kind: "chipping-challenge", id: this.challenge.round.id, key: this.gameKey };
      // Online: its points to every bay (before the round can end, and
      // the go pass to the next player here).
      this.net?.scored(this.challenge.round.scores.length, score.points, score.label);
      this.challenge.add(score);
      this.renderGame();
      scoreText = `+${score.points}: landing +${score.landing}, finish +${score.finish}`;
    }
    const inZone = this.isZone && res.landingMissYards <= this.settings.zoneSize;
    this.set("Off the spot", `${fmt(res.landingMissYards, 1)} yds`);
    this.set("Leave", this.isZone ? (inZone ? "Yes" : "No") : res.holed ? "In!" : res.water ? "Water" : `${fmt(res.leaveFeet, 1)} ft`);
    this.set("Rolled", `${fmt(res.totalYards - res.carryYards, 1)} yds`);
    const box = this.panel.querySelector("#chip-result");
    if (this.isZone) {
      box.innerHTML = inZone
        ? `<b class="made">In the zone</b> - ${fmt(res.landingMissYards, 1)} yds from the middle`
        : `<b>${fmt(res.landingMissYards, 1)} yds</b> from the middle - ${fmt(Math.abs(res.carryYards - this.distanceYards), 1)} yds ${res.carryYards >= this.distanceYards ? "long" : "short"}`;
      this.resultText = inZone ? `<b class="made">In the zone</b>` : `${fmt(res.landingMissYards, 1)} yds off the middle`;
    } else if (res.holed) {
      box.innerHTML = `<b class="made">Holed!</b>${res.how === "in on the fly" ? " On the fly!" : ""}${scoreText ? `<br><span class="points">${scoreText}</span>` : ""}`;
      this.resultText = `<b class="made">Holed!</b>${chip.score ? ` +${chip.score.points}` : ""}`;
    } else if (res.water) {
      box.innerHTML = `<b>In the water</b> - carried ${fmt(res.carryYards, 1)} yds, it needed ${fmt(this.layout.greenStartYards, 1)} to reach the green`;
      this.resultText = "In the water";
    } else {
      const long = res.longFeet;
      box.innerHTML = `<b>${fmt(res.leaveFeet, 1)} ft</b> away - ${fmt(Math.abs(long), 1)} ft ${long >= 0 ? "long" : "short"}, ${lr(res.rightFeet, 1, "ft")}` +
        (scoreText ? `<br><span class="points">${scoreText}</span>` : "");
      this.resultText = chip.score
        ? `+${chip.score.points} - ${fmt(res.leaveFeet, 0)} ft away`
        : `${fmt(res.leaveFeet, 0)} ft away, landed ${fmt(res.landingMissYards, 1)} yds off the spot`;
      if (res.finishedIn === "bunker") {
        box.innerHTML = `<b>In the bunker</b> - ${box.innerHTML}`;
        this.resultText = `In the bunker - ${this.resultText}`;
      }
    }
    // The streak: chips inside 5 ft to the pin, landings in the zone. In
    // the challenge a chip-in still gets its moment.
    if (this.streakKind) {
      const success = !res.water && (this.isZone ? inZone : res.holed || res.leaveFeet <= CHIP_STREAK_FEET);
      chip.streak = this.streaks.add({ player: this.hitter(), kind: this.streakKind, key: this.streakKey, success, holed: res.holed });
      this.renderStreak();
    } else if (res.holed) {
      this.celebrate(streakCelebration("chip-pin", afterTry(newRun(0), true), { holed: true }));
    }
    // For the player's stats: always a chip or pitch, never a full swing.
    // The zone game has no hole: how far the target was, and no finish (so
    // it stays out of how close their chips finish).
    const flight = flightFacts(res.path, res.flightPoints);
    const d = this.distanceYards;
    this.onRecord?.({
      factsKey: chip.factsKey,
      club: chip.club,
      swing: res.carryYards < 20 ? "chip" : "pitch",
      ball: chip.ball,
      result: { carry: res.carryYards, total: res.totalYards, offline: res.rest[1] / YARD, apex: flight.apex, descent: flight.descent },
      // (In the water there's no finish: it's kept out of how close they come.)
      target: this.isZone || res.water ? { distance: d } : { distance: d, finish: res.holed ? 0 : res.leaveFeet / 3, long: res.holed ? 0 : res.longFeet / 3, made: res.holed },
      toPin: this.isZone ? undefined : d,
      lie: "fairway",
      game,
    });
    // The flight's few hundred points were for drawing it and the numbers
    // above. The session's table needs only the numbers, so a long session
    // doesn't keep every chip's flight.
    delete res.path;
    this.resetTimer = 3.5;
    this.renderStats();
    this.onChange();
  }

  renderStats() {
    const table = this.panel.querySelector("#chip-stats");
    if (!table) return;
    const zone = this.isZone;
    const byClub = new Map();
    for (const c of this.chips.filter((c) => !c.score && (c.game === "zone") === zone)) {
      if (!byClub.has(c.club)) byClub.set(c.club, []);
      byClub.get(c.club).push(c);
    }
    const avg = (list, f) => list.reduce((a, c) => a + f(c), 0) / list.length;
    if (zone) {
      const rows = [...byClub].map(([club, list]) => {
        const inZone = list.filter((c) => c.streak?.success).length;
        return `<tr><td>${clubShort(club)}</td><td>${list.length}</td><td>${fmt(avg(list, (c) => c.result.carryYards), 1)}</td>
          <td>${fmt(avg(list, (c) => c.result.landingMissYards), 1)}</td><td>${inZone} (${Math.round((100 * inZone) / list.length)}%)</td></tr>`;
      });
      table.innerHTML = `<tr><th>Club</th><th>#</th><th>Carry</th><th>Off middle</th><th>In zone</th></tr>${
        rows.join("") || `<tr><td colspan="5" class="muted">No chips yet</td></tr>`
      }`;
      return;
    }
    const rows = [...byClub].map(([club, list]) => {
      const ratio = avg(list, (c) => (c.result.totalYards - c.result.carryYards) / Math.max(0.5, c.result.carryYards));
      return `<tr><td>${clubShort(club)}</td><td>${list.length}</td><td>${fmt(avg(list, (c) => c.result.carryYards), 1)}</td>
        <td>1:${fmt(ratio, 1)}</td><td>${fmt(avg(list, (c) => c.result.landingMissYards), 1)}</td>
        <td>${fmt(avg(list, (c) => c.result.leaveFeet), 1)}</td><td>${list.filter((c) => c.result.holed).length}</td></tr>`;
    });
    table.innerHTML = `<tr><th>Club</th><th>#</th><th>Carry</th><th>Carry:roll</th><th>Off spot</th><th>Leave ft</th><th>In</th></tr>${
      rows.join("") || `<tr><td colspan="7" class="muted">No chips yet</td></tr>`
    }`;
  }

  resize(aspect) {
    // (A picture taller than it's wide - the phone held upright - with the
    // lens widened: sim/upright.mjs.)
    fitLens(this.camera, aspect);
  }
}

// For the tests and the console: the distances offered, and the words for them.
export { PRACTICE_DISTANCES, ZONE_SIZES, distanceWords };
