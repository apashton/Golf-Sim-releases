// The approach challenge: nine approaches, one shot each, from the lies a
// round gives you (sim/approachchallenge.mjs) - the fairway, the first
// cut, the rough, a fairway bunker, the four slopes - each to a green of
// its own, scored up to 100 for finishing close against how far it was.
//
// Everything about a shot in flight (the tracer, the camera, the sounds,
// the look at the green) is the approach ladder's, so this sets up the
// holes and the lie, draws rings round the pin for what scores what, and
// scores the one shot.

import { prepareHole, suggestClub, distanceToPin, faceAhead } from "./sim/courseplay.mjs";
import { feetFromPin, feetText, APPROACH_BANDS } from "./sim/ladder.mjs";
import { approachPlan, approachHole, approachPoints, pointRings, lieText, APPROACH_HOLES, HOLED_POINTS } from "./sim/approachchallenge.mjs";
import { afterLine } from "./sim/lieguide.mjs";
import { FOOT } from "./sim/putting.mjs";
import { YARD } from "./sim/flight.mjs";
import { ApproachLadder } from "./approachladder.js";
import { fmt, esc } from "./util.js";

// Seconds to look at where the shot finished before the next turn.
const PAUSE = 3.6;

export class ApproachChallenge extends ApproachLadder {
  constructor(host) {
    super(host);
    this.id = "approachtest";
    this.option = {
      label: "Distances",
      choices: Object.fromEntries(Object.entries(APPROACH_BANDS).map(([k, b]) => [k, `${b.name} (${b.holes[0][0]}-${b.holes[2][1]} yds)`])),
      fallback: "mixed",
    };
  }

  get info() {
    return this.plan?.holes[this.holeIndex] ?? null;
  }
  get yards() {
    return this.info?.yards ?? 0;
  }

  // ---- A game, a hole, a turn ------------------------------------------------------

  start(band, seed) {
    this.band = band in APPROACH_BANDS ? band : "mixed";
    this.seed = seed;
    this.plan = approachPlan(this.band, seed);
    this.builtKey = null;
  }

  // Hole `i`: its own green, the ball on its lie. The same for everyone.
  buildTurnHole(i) {
    const key = `${this.seed}:${this.band}:${i}`;
    if (this.builtKey === key) return;
    this.builtKey = key;
    const info = this.plan.holes[i];
    const { layout, spot } = approachHole(info, this.seed + i + 1, i + 1);
    this.hole = prepareHole(layout);
    this.spot = spot;
    // The lie it's really on (the hole's own say), on the hole's slope.
    this.lie = this.hole.lieAt(spot[0], spot[1]);
    this.stance = info.stance;
    this.drawHole();
  }

  beginTurn() {
    const i = this.holeIndex;
    this.buildTurnHole(i);
    const distance = distanceToPin(this.hole, this.spot);
    const aim = Math.atan2(this.hole.cup.z - this.spot[1], this.hole.cup.x - this.spot[0]);
    // In a fairway bunker, a club that gets out over its face.
    const face = this.lie === "bunker" ? faceAhead(this.hole, this.spot, aim) : null;
    this.club = suggestClub(distance, this.lie, { face, stance: this.stance, reach: this.host.clubReach?.(this.match.player?.name) ?? 1 });
    this.freshLadder(`Hole ${i + 1} - ${this.shownYards} yds - ${this.lieName}`);
  }

  get lieName() {
    return lieText({ lie: this.lie, stance: this.stance });
  }

  // One shot a turn: its points are the turn's.
  newTurn() {
    return { shots: [], made: 0, over: false };
  }
  turnText() {
    return "";
  }

  // ---- The rings round the pin --------------------------------------------------------

  // What scores what: rings at 75, 50 and 25 points from this far, the
  // innermost gold, fading out, with a faint wash inside the outer one.
  drawRing() {
    const g = this.ringGroup;
    for (const o of g.children) (o.geometry.dispose(), o.material.dispose());
    g.clear();
    if (!this.hole || !this.ladder) return;
    const rings = pointRings(this.shownYards);
    const colours = [0xffd23f, 0xffffff, 0xffffff];
    const opacity = [0.95, 0.7, 0.45];
    rings.forEach((ring, k) => {
      const r = ring.feet * FOOT;
      const width = Math.max(this.look3d.ringWidth * 0.8, r * 0.025);
      g.add(this.ringMesh(r - width, r, colours[k], opacity[k]));
    });
    g.add(this.ringMesh(0.2, rings[2].feet * FOOT, 0xffffff, 0.08));
  }

  // ---- The shot ---------------------------------------------------------------------

  // The shot has finished: its points.
  settle() {
    const f = this.flying;
    if (!f) return;
    this.flying = null;
    this.tracer?.userData.revealAll();
    const res = f.res;
    const lost = !!res.penalty;
    const feet = lost ? Infinity : feetFromPin(this.hole.layout.pin, res.rest, res.holed);
    const yards = distanceToPin(this.hole, this.spot) / YARD;
    const points = approachPoints({ yards, feet, holed: res.holed, lost });
    const t = this.ladder;
    t.shots.push({ feet, points });
    t.made = points;
    t.over = true;
    const rest = res.holed ? [this.hole.cup.x, this.hole.cup.z] : res.rest;
    const end = res.path.at(-1);
    if (res.holed) this.placeBall([end[0], end[2]], end[1]);
    else this.placeBall(rest, 0);
    this.markFinish(rest, points > 0);
    this.last = { feet, lost, holed: res.holed, carry: res.carryYards, points, inside: points > 0 };
    this.lieAfter = afterLine(this.lie, this.stance, res.lieOutcome, { carry: res.carryYards });
    this.record(f.entry, res, feet, { points });
    const sounds = this.host.sounds;
    if (res.holed) {
      this.message = `Holed! +${HOLED_POINTS}`;
      sounds.play("arpeggio", 0.8);
      this.sparkle(rest, 0.8);
    } else if (lost) {
      this.message = res.penalty.kind === "water" ? "In the water - no points" : "Lost - no points";
      sounds.play("low", 0.4);
    } else if (points > 0) {
      this.message = `+${points} - ${feetText(feet)} ft`;
      sounds.play("chime", 0.3 + points / 250);
      if (points >= 75) this.sparkle(rest, 0.35);
    } else {
      this.message = `${feetText(feet)} ft - no points`;
      sounds.play("low", 0.4);
    }
    this.viewFinish(lost ? (res.penalty.drop ?? rest) : rest);
    this.pause = { t: PAUSE };
    this.host.changed();
  }

  recordExtra(r) {
    return { points: r.points };
  }

  // ---- What's on show -----------------------------------------------------------------

  overlay() {
    const t = this.ladder;
    if (!t) return { title: "", note: "", stats: [] };
    const i = this.holeIndex;
    const note = `Approach challenge - hole ${i + 1} of ${APPROACH_HOLES} - ${this.shownYards} yds - ${this.lieName}`;
    const best = this.host.bestFor(this.id, this.host.option);
    const total = this.match.total(this.match.playerIndex) + (t.over ? t.made : 0);
    const stats = [{ label: "Score", value: String(total), unit: `of ${(i + 1) * HOLED_POINTS}`, accent: true }];
    if (this.last && !this.flying) {
      const l = this.last;
      stats.push({ label: "Points", value: String(l.points), tone: l.points >= 50 ? "good" : l.points > 0 ? "" : "bad" });
      stats.push({ label: "Finished", value: l.lost ? "Lost" : l.holed ? "In" : feetText(l.feet), unit: l.lost || l.holed ? "" : "ft" });
      stats.push({ label: "Carry", value: fmt(l.carry, 0), unit: "yds" });
    } else {
      // What scores what from here.
      const [a, b, c] = pointRings(this.shownYards);
      stats.push({ label: "75 inside", value: fmt(a.feet, 0), unit: "ft" });
      stats.push({ label: "50 inside", value: fmt(b.feet, 0), unit: "ft" });
      stats.push({ label: "25 inside", value: fmt(c.feet, 0), unit: "ft" });
    }
    stats.push({ label: "Personal best", value: best ? String(best.score) : "-" });
    const title = this.flying ? "" : this.message ? (this.last?.points >= 50 ? `<b class="made">${this.message}</b>` : this.message) : "Hit when ready";
    return { title, note, lie: this.lieLines(), stats };
  }

  // Down the side: the nine holes, their distance and lie, and this
  // player's points on the ones played.
  sideHtml() {
    if (!this.ladder || !this.plan) return "";
    const m = this.match;
    const scores = m.players[m.playerIndex]?.scores ?? [];
    const rows = this.plan.holes
      .map((h, k) => {
        const now = k === this.holeIndex;
        const pts = now && this.ladder.over ? this.ladder.made : scores[k];
        const state = now ? "rung-now" : pts != null ? (pts >= 50 ? "rung-made" : "rung-missed") : "";
        const short = lieText(h).replace(/ \(\d+°\)/g, "").replace("Fairway - ", "").replace(/^./, (c) => c.toUpperCase());
        return `<li class="${state}" style="--rung:#ffd23f"><span>${k + 1}. ${h.yards} · ${esc(short)}</span><i>${pts != null ? pts : ""}</i></li>`;
      })
      .join("");
    const total = m.total(m.playerIndex) + (this.ladder.over ? this.ladder.made : 0);
    return `<div class="ladder-head">Approaches<small>${this.band ? esc(APPROACH_BANDS[this.band].name) : ""}</small></div><ol class="ladder approach-list">${rows}</ol><div class="ladder-foot">${total} points</div>`;
  }
}
