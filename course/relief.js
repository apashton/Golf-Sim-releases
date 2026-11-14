// The view from the ball (S), and an unplayable ball: the relief options,
// their marks and taking a drop.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import * as THREE from "three";
import { YARD } from "../sim/flight.mjs";
import { distanceToPin } from "../sim/courseplay.mjs";
import { toWorld } from "../scenery.js";
import { reliefOptions, penaltyOptions, canDeclare, clearDropsView } from "../sim/relief.mjs";
import { areaFor, spotCheck } from "../sim/reliefarea.mjs";
import { clearGroup } from "../look/dispose.js";
import { esc } from "../util.js";
import { BALL_VIEW, DROPS_VIEW, MAX_STROKES } from "../course.js";

export class CourseRelief {
  // ---- From the ball, and an unplayable ball -----------------------------------

  // S: the view from the ball itself - from just above it, looking along
  // the aim (← → turn it) - to see the ways out from where it lies: the
  // gaps between the trees, how low the branches come, the lip ahead. S
  // again, a shot or the next player goes back behind the ball.
  toggleBallView() {
    if (this.fromBall) {
      this.fromBall = false;
      this.placeCamera(false);
      this.onToast("Back behind the ball", 1200);
      this.render();
      return true;
    }
    if (this.round && this.takeTurn()) return false;
    const why = this.ballViewWhy();
    if (why) {
      this.onToast(why, 2200);
      return false;
    }
    this.hideRelief({ camera: false });
    this.fromBall = true;
    this.placeCamera(false);
    this.onToast("From the ball - ← → to look round, S to go back", 2500);
    this.render();
    return true;
  }

  // Why the ball can't be looked from now, or null: between shots, with
  // the ball still to play, off the green (where I looks along the putt).
  ballViewWhy() {
    const r = this.round;
    if (!r || r.finished || r.done) return "From the ball: in a round, with a ball to play";
    if (this.flying) return "Not while the ball's moving";
    if (this.flyover || this.lookDown) return "Not while the camera's flying over the hole";
    if (this.me.done) return "That ball's in";
    if (this.putting) return "Putting, I looks along the putt's line";
    return null;
  }

  // The camera at the ball: just above and behind it, clear of the grass
  // round it, looking along the aim and a little up, at the branches.
  atBall(b, r) {
    const dir = new THREE.Vector3(Math.sin(r.aim), 0, -Math.cos(r.aim));
    this.camWant.copy(b).addScaledVector(dir, -BALL_VIEW.back).setY(b.y + BALL_VIEW.up);
    this.lookWant.copy(b).addScaledVector(dir, BALL_VIEW.ahead).setY(b.y + BALL_VIEW.up + BALL_VIEW.rise);
  }

  // While an unplayable ball's drops are shown: low down behind those
  // nearby (the tee's is on the map) and round to one side, looking at
  // them through the trunks rather than down on the crowns, all of them
  // left of the card, from where no trunk is in the way of the ball if
  // there's such a place (sim/relief.mjs clearDropsView).
  overDrops(b, r) {
    // A spot being chosen: the view from behind it (course/dropspot.js).
    if (this.relief.pick) return this.overSpot();
    const ball = r.ball;
    const near = this.relief.options.filter((o) => Math.hypot(o.ball[0] - ball[0], o.ball[1] - ball[1]) < 80);
    const halfWidth = Math.atan(Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.aspect);
    // The trees the camera keeps clear of, in the hole's frame (a world
    // x, z is the hole's z, -x): not in a trunk, nor one in the way.
    const trees = (this.cameraTrees ?? []).filter((t) => Number.isFinite(t.r)).map((t) => ({ x: -t.z, z: t.x, r: t.r }));
    const v = clearDropsView({ spots: [ball, ...near.map((o) => o.ball)], cup: [this.hole.cup.x, this.hole.cup.z], halfWidth, trees, behind: DROPS_VIEW.behind, side: DROPS_VIEW.side });
    const ballY = this.heightAt(ball[0], ball[1]);
    toWorld(v.cam[0], Math.max(this.heightAt(v.cam[0], v.cam[1]) + DROPS_VIEW.up, ballY + DROPS_VIEW.up * 0.6), v.cam[1], this.camWant);
    toWorld(v.look[0], ballY + 0.3, v.look[1], this.lookWant);
  }

  // U: the ball called unplayable (Rule 19), and the card of where it can
  // be played from for a penalty stroke - back where it was played from
  // (the tee, after a tee shot), back on the line, or within two
  // club-lengths, and in a bunker out of it for two (sim/relief.mjs) -
  // each marked on the hole and the map. U again, or Esc, it's played as
  // it lies.
  unplayable() {
    if (this.relief) return this.playAsItLies();
    if (this.round && this.takeTurn()) return false;
    const why = this.reliefWhy();
    if (why) {
      this.onToast(why, 2600);
      return false;
    }
    const p = this.me;
    const options = reliefOptions(this.hole, { ball: p.ball, lie: p.lie, from: p.from?.ball ?? null, fromLie: p.from?.lie ?? null });
    if (!options.length) {
      this.onToast("Nowhere to drop it from here - it's played as it lies", 2400);
      return false;
    }
    this.openRelief({ player: p, options, water: null, suggested: null });
    return true;
  }

  // The card up, its places marked on the hole and the map, the camera
  // over them.
  openRelief(rel) {
    this.fromBall = false;
    this.relief = { ...rel, pick: null };
    this.dropPointer();
    this.showRelief();
    this.drawReliefMarks();
    this.drawMaps();
    // (A cut, there and back: eased, the camera would sweep up over the
    // crowns of the trees round a ball under them.)
    this.placeCamera(true);
    this.render();
  }

  // Into a penalty area's water (course.js settle, its stroke counted
  // there): where it can be played from (sim/relief.mjs penaltyOptions) -
  // back where it was played from, back on the line from where it went
  // in, or (a red area) within two club-lengths of that - with the game's
  // own pick (back on the line, as the Rules' usual drop) put where the
  // ball is meanwhile. { options, suggested, text }, or null where it's
  // just dropped there: another bay's ball, a scramble's (the team plays
  // another), the game's video, or nowhere to choose from.
  waterChoices(p, pen) {
    const r = this.round;
    if (!r || p.remote || r.scr || this.pace !== 1 || this.heldView || !this.isActive) return null;
    const options = penaltyOptions(r.hole, { crossed: pen.crossed ?? p.ball, area: pen.area, from: p.from?.ball ?? null, fromLie: p.from?.lie ?? null });
    if (options.length < 2) return null;
    const suggested = Math.max(0, options.findIndex((o) => o.kind === "line"));
    const o = options[suggested];
    p.ball = [...o.ball];
    p.lie = o.lie;
    p.shots[p.shots.length - 1] = [...o.ball];
    const colour = pen.area === "red" ? "red" : "yellow";
    return { options, suggested, text: `In the ${colour} penalty area - one penalty stroke: where from?` };
  }

  // The card for it (settle's), for the player who hit it.
  waterRelief(p, { options, suggested }) {
    this.openRelief({ player: p, options, water: options[0]?.water ?? "yellow", suggested });
  }

  // Whether the ball lies in trouble - in the trees or deep rough, with
  // the trees in the way of the shot, or in a bunker whose face is too
  // steep for any launch to get over that way - for the tips about S and U.
  inTrouble() {
    const p = this.me;
    if (!p?.ball || p.done || !p.strokes || this.flying || this.onGreen) return false;
    if (p.lie === "trees" || p.lie === "deep" || this.treeWarn()) return true;
    const face = this.faceHelp();
    return !!face && face.need == null;
  }

  // How far the ball in play is from the pin (yards), or null with none.
  get yardsToPin() {
    const p = this.me;
    if (!this.round?.hole || !p?.ball || p.done) return null;
    return distanceToPin(this.hole, p.ball) / YARD;
  }

  // Why the ball can't be called unplayable now, or null.
  reliefWhy() {
    const r = this.round;
    if (!r || r.finished) return "Unplayable: in a round on the course";
    if (r.done || r.waiting) return "The hole's finished";
    if (this.flying) return "Not while the ball's moving";
    if (this.flyover || this.lookDown) return "Not while the camera's flying over the hole";
    if (r.scr) return "In a scramble the team plays another ball instead";
    const p = this.me;
    if (!p || p.done) return "That ball's in";
    if (p.remote) return "That's another bay's ball";
    if (!p.strokes) return "Unplayable: once the ball's been hit";
    const can = canDeclare(p.lie);
    return can.ok ? null : can.why;
  }

  // The card: a button for each choice - what it is and where the game
  // would put the ball (each marked on the hole) - and, unplayable, one to
  // play it as it lies. A choice whose relief area has room in it then has
  // its spot chosen (course/dropspot.js: the card says what it's like
  // there, Drop here and Back to the choices).
  showRelief() {
    const rel = this.relief;
    if (!rel) return;
    const who = this.multi ? `${esc(rel.player.name)}: ` : "";
    this.reliefEl.classList.toggle("pad-keys", !!rel.pick);
    if (rel.pick) {
      this.reliefEl.innerHTML = this.spotCard(rel, who);
      this.reliefEl.hidden = false;
      return;
    }
    const buttons = rel.options
      .map((o, k) => `<button data-relief="${k}"><kbd>${k + 1}</kbd> <b>${esc(o.title)}</b> <span class="rp-detail">${esc(o.detail)}${o.kind === "back" ? "" : " - you choose the spot"}</span></button>`)
      .join("");
    const keys = rel.options.length > 1 ? `1 - ${rel.options.length}` : "1";
    const colour = rel.water === "red" ? "red" : "yellow";
    const head = rel.water ? `In the ${colour} penalty area - where from?` : "Unplayable - where from?";
    const why = rel.water ? `One penalty stroke under the Rules (Rule 17), each place marked on the hole - ${keys} to choose` : `A penalty stroke under the Rules (Rule 19), each place marked on the hole - ${keys} to choose`;
    const keep = rel.water ? "" : `<button data-relief="keep"><kbd>Esc</kbd> Play it as it lies</button>`;
    this.reliefEl.innerHTML = `<div class="cc-q">${who}${head}</div><div class="cc-why">${why}</div><div class="cc-buttons">${buttons}${keep}</div>`;
    this.reliefEl.hidden = false;
  }

  // The k-th choice picked: one place (back where it was played from)
  // taken at once; a relief area's spot to be chosen in it - starting
  // where the game would put it, or `at` (a click on the ground near it).
  chooseRelief(k, at = null) {
    const rel = this.relief;
    const o = rel?.options[k];
    if (!o || this.flying || rel.player !== this.me) return false;
    const area = areaFor(this.hole, o);
    if (area.kind === "spot") return this.takeRelief(k);
    rel.pick = { k, area, at: [...o.ball], info: null };
    if (at) return this.moveDrop(at);
    rel.pick.info = spotCheck(this.hole, area, rel.pick.at);
    this.showDrop({ camera: true });
    return true;
  }

  // Back from choosing a spot to the choices.
  backToChoices() {
    const rel = this.relief;
    if (!rel?.pick) return false;
    rel.pick = null;
    this.showRelief();
    this.drawReliefMarks();
    this.drawMaps();
    this.placeCamera(false);
    this.render();
    return true;
  }

  // The card and its marks go; the camera eases back behind the ball
  // (unless whatever closed it places it).
  hideRelief({ camera = true } = {}) {
    if (!this.relief) return;
    this.relief = null;
    this.reliefEl.hidden = true;
    if (this.reliefGroup) clearGroup(this.reliefGroup);
    if (!this.round?.hole || !this.me) return;
    this.drawMaps();
    if (camera) this.placeCamera(true);
  }

  // Esc, U again or the card's button: no drop - played from where it is.
  // (Not out of the water: there it has to be dropped.)
  playAsItLies() {
    if (!this.relief) return false;
    if (this.relief.water) {
      this.onToast("Out of a penalty area it has to be dropped - choose where from", 2400);
      return true;
    }
    this.hideRelief();
    this.onToast("Played as it lies", 1400);
    this.render();
    return true;
  }

  // The k-th choice taken, the ball dropped at `at` (the spot chosen in
  // its relief area; else where the game would put it): its penalty -
  // unplayable, the stroke (two out of a bunker) added now and kept with
  // the shot that left it unplayable, for the round stats and the round
  // card; out of the water, the stroke counted already as it went in. Told
  // to the other bays online (a shot event with no flight: the ball moves,
  // with the words). At the most strokes a hole allows, it's picked up.
  // Out of the water, play goes on from here as it would have from the
  // shot (the next player, or this one's next shot).
  takeRelief(k, at = null) {
    const rel = this.relief;
    const o = rel?.options[k];
    if (!o || this.flying || rel.player !== this.me) return false;
    const r = this.round;
    const p = rel.player;
    const info = at ? spotCheck(this.hole, areaFor(this.hole, o), at) : null;
    if (info && !info.ok) {
      this.onToast(info.why, 2000);
      return false;
    }
    this.hideRelief({ camera: false });
    const spot = info ? info.at : [...o.ball];
    p.strokes += o.strokes;
    p.ball = spot;
    p.lie = info ? info.lie : o.lie;
    p.lieAfter = "";
    if (rel.water) p.shots[p.shots.length - 1] = [...spot];
    else p.shots.push([...spot]);
    if (o.strokes) {
      const logged = p.log?.at(-1);
      if (logged) logged.up = (logged.up ?? 0) + o.strokes;
      const n = o.strokes;
      Promise.resolve(p.recordedId).then((id) => id && this.onUnplayable?.({ player: p.name, id, n }));
    }
    const done = info ? dropDone(o, info) : o.done;
    const text = rel.water ? `${rel.water === "red" ? "Red" : "Yellow"} penalty area - ${done}` : `Unplayable - ${done}`;
    this.onToast(this.multi ? `${p.name}: ${text}` : text, 3000);
    if (p.strokes >= MAX_STROKES) {
      this.finishHole(p, { text: "Picked up" });
      return true;
    }
    r.message = this.multi ? `${p.name}: ${text}` : text;
    this.netSend?.({ type: "shot", player: p.netId, hole: r.index, strokes: p.strokes, ball: p.ball, lie: p.lie, text, flight: null, putt: false });
    if (rel.water && this.multi) {
      // (As settle would have: a moment, then whoever plays next.)
      r.pending = true;
      clearTimeout(this.turnTimer);
      this.turnTimer = setTimeout(() => {
        if (this.round === r && !this.flying && r.pending) this.passTurn();
      }, this.paced(1400));
      this.placeCamera(false);
      this.render();
      return true;
    }
    this.newPosition(true);
    return true;
  }

  // The card's keys while it's up - ahead of a club check's, since it was
  // asked for just now: 1 - 4 for its choices, Esc to play it as it lies;
  // choosing a spot, the arrows move it (Shift: ten metres back on the
  // line), Enter drops it there and Esc goes back to the choices.
  reliefKey(key, shift = false) {
    const rel = this.relief;
    if (!rel) return false;
    if (rel.pick) {
      const move = { ArrowUp: { back: 1 }, ArrowDown: { back: -1 }, ArrowLeft: { right: -1 }, ArrowRight: { right: 1 } }[key];
      if (move) return this.nudgeDrop({ ...move, big: shift });
      if (key === "Enter") return this.dropHere();
      if (key === "Escape") return this.backToChoices();
    } else if (key === "Escape") return this.playAsItLies();
    const k = /^[1-4]$/.test(key) ? Number(key) - 1 : -1;
    return k >= 0 && k < rel.options.length ? this.chooseRelief(k) : false;
  }

  // Each choice's place on the hole: a ring on the ground in the flag's
  // yellow, and its number over it, seen through anything in the way - and
  // its relief area, faintly (the line back, the two club-lengths round),
  // so where each could go is seen before one's chosen. Choosing a spot:
  // only that choice's area, brighter, and the spot (course/dropspot.js).
  drawReliefMarks() {
    clearGroup(this.reliefGroup);
    const rel = this.relief;
    if (!rel) return;
    if (rel.pick) return this.drawDrop();
    rel.options.forEach((o, k) => {
      this.addDropMark(o.ball, String(k + 1), true);
      const area = areaFor(this.hole, o);
      if (area.kind !== "spot") this.addAreaShape(area, o.ball, { faint: true });
    });
  }
}

// The words once a chosen spot's taken: "dropped back on the line, 34 yds
// back - one penalty stroke".
function dropDone(o, info) {
  const pens = (o.pens ?? o.strokes) === 2 ? "two penalty strokes" : "one penalty stroke";
  const n = Number.isFinite(info.back) ? Math.max(1, Math.round(info.back / YARD)) : null;
  if (o.kind === "line" || o.kind === "outside") return `dropped ${o.kind === "outside" ? "out of the bunker, " : ""}back on the line${n ? `, ${n} yd${n === 1 ? "" : "s"} back` : ""} - ${pens}`;
  if (o.kind === "lateral") return `dropped within two club-lengths of where it went in - ${pens}`;
  if (o.kind === "beside") return `dropped within two club-lengths - ${pens}`;
  return o.done;
}
