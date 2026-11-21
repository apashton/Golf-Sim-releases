// Online play: watching another player's view (the owner, 29 October 2026:
// "What the possibility on view the other person's view point, say you
// are on the green and don't want to putt but watch the other players
// from Thier view?"): the camera behind a friend's ball looking at the
// flag, after it as it flies, and back to this bay's ball - Watch in the
// side panel (or the bar over the picture), Next for the next friend,
// Back to my ball. It stops by itself as a player here swings, as the
// friend finishes the hole, or at a new hole (sim/netwatch.mjs). Nothing
// more goes between the bays: the friend's ball where it lies and their
// flights as they're struck are here already.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import * as THREE from "three";
import { toWorld } from "../scenery.js";
import { EYE } from "../sim/eye.mjs";
import { clearOfTrees } from "../view.js";
import { nextWatch, watchable, watchStops, stopWords } from "../sim/netwatch.mjs";
import { distanceToPin, toPar } from "../sim/courseplay.mjs";
import { LIES } from "../sim/course.mjs";
import { LIE_NAMES } from "../sim/lie.mjs";
import { YARD } from "../sim/flight.mjs";
import { FOOT } from "../sim/putting.mjs";
import { esc, fmt } from "../util.js";

const dir = new THREE.Vector3();
const from = new THREE.Vector3();

export class CourseWatch {
  // Watches a friend (p, one of the other bays' players) - or, with none
  // given, the next of them still playing after whoever's watched now.
  watchPlayer(p = null) {
    const r = this.round;
    if (!r?.net || r.done || r.finished) return false;
    const at = p ? r.players.indexOf(p) : nextWatch(r.players, this.watching ? r.players.indexOf(this.watching) : null);
    const who = r.players[at];
    if (!who || !watchable(r.players).includes(at)) return false;
    this.watching = who;
    // (Their ball without its stick, which would stand in the view.)
    this.drawMarkers();
    // Their shot flies here at once from now on (startRemoteFlights).
    this.stepWatch(true);
    this.renderWatch();
    this.render();
    return true;
  }

  // Back to this bay's ball: the camera behind it again.
  stopWatching({ why = "" } = {}) {
    if (!this.watching) return;
    const name = this.watching.name;
    this.watching = null;
    this.drawMarkers();
    const words = stopWords(name, why);
    if (words) this.onToast(words, 2600);
    if (this.round?.hole && this.me) this.placeCamera(true);
    this.renderWatch();
    this.render();
  }

  // Each frame (before the game's video can hold the view): while a friend
  // is watched, the camera where they'd stand - behind their ball looking
  // at the flag, or after their ball as it flies. cut: put it there at
  // once (watching just started).
  stepWatch(cut = false) {
    const p = this.watching;
    if (!p) return;
    const r = this.round;
    const theirs = [...(this.remoteFlying ?? []), ...(this.remoteParked ?? [])].find((f) => f.p === p);
    const waiting = (this.remoteFlights ?? []).some((q) => q.p === p);
    const stops = watchStops({ watched: p, players: r?.players ?? [], ownFlying: !!this.flying, flying: !!theirs || waiting });
    if (!r?.net || r.done || r.finished || stops.stop) return this.stopWatching({ why: stops.why });
    const cup = r.hole.cup;
    if (theirs && !this.remoteParked.includes(theirs)) {
      // In the air (or running out): after it, along the way it's going.
      const ball = theirs.ball.position;
      const start = theirs.flight.path[0];
      toWorld(start[0], start[1], start[2], from);
      dir.set(ball.x - from.x, 0, ball.z - from.z);
      if (dir.lengthSq() < 1) toWorld(cup.x, 0, cup.z, dir).sub(from).setY(0);
      dir.normalize();
      if (theirs.putt) {
        // A putt: low behind where it was struck, the ball in view.
        this.camWant.copy(from).addScaledVector(dir, -2.6).add(new THREE.Vector3(0, 1.3, 0));
        this.keepAboveGround(this.camWant, 0.8);
      } else {
        const above = ball.y - this.worldHeight(ball.x, ball.z);
        this.camWant.copy(ball).addScaledVector(dir, -24).add(new THREE.Vector3(0, Math.max(3, above * 0.6 + 3), 0));
        this.keepAboveGround(this.camWant, 2.5);
        clearOfTrees(this.cameraTrees, this.camWant, ball);
      }
      this.lookWant.copy(ball);
    } else {
      // At rest (or down and waiting for its words): behind it, looking at
      // the flag - lower and closer on the green, as for a putt here.
      const end = theirs?.flight.path.at(-1);
      const [x, z] = end ? [end[0], end[2]] : p.ball;
      const rest = toWorld(x, this.heightAt(x, z), z);
      const green = (end ? r.hole.lieAt?.(x, z) : p.lie) === "green";
      toWorld(cup.x, this.heightAt(cup.x, cup.z), cup.z, from);
      dir.set(from.x - rest.x, 0, from.z - rest.z);
      const far = dir.length();
      dir.normalize();
      const back = green ? 2.6 : EYE.back;
      const up = green ? 1.3 : EYE.up;
      this.camWant.copy(rest).addScaledVector(dir, -back).add(new THREE.Vector3(0, up, 0));
      this.keepAboveGround(this.camWant, green ? 0.8 : 1.5);
      clearOfTrees(this.cameraTrees, this.camWant, rest);
      this.lookWant.copy(rest).addScaledVector(dir, green ? Math.min(far, 10) : Math.min(60, far)).setY(rest.y - (green ? 0.6 : EYE.drop));
    }
    if (cut) {
      this.camera.position.copy(this.camWant);
      this.look.copy(this.lookWant);
      this.camera.lookAt(this.look);
    }
  }

  // The numbers under the picture while a friend's watched (course.js
  // stats): theirs - how far they have to the pin, their lie, strokes and
  // score. (Their club isn't known here.)
  watchStats() {
    const r = this.round;
    const p = this.watching;
    const toPin = distanceToPin(r.hole, p.ball);
    const pars = this.course.holes.map((h) => h.spec.par);
    return [
      p.lie === "green" ? { label: "To the hole", value: fmt(toPin / FOOT, 0), unit: "ft", accent: true } : { label: "To the pin", value: fmt(toPin / YARD, 0), unit: "yds", accent: true },
      { label: "Lie", value: LIE_NAMES[p.lie] ?? LIES[p.lie]?.name ?? p.lie },
      { label: "Strokes", value: String(p.strokes) },
      { label: "Score", value: toPar(p.scores, pars) },
    ];
  }

  // The bar over the picture while a friend's watched: who, Next, Back to
  // my ball - in the overlay's column just above the numbers (bay.js), so
  // it's over nothing else at any size (style.css .watch-bar).
  renderWatch() {
    if (!this.view) return;
    let bar = this.watchBarEl;
    if (!bar) {
      bar = this.watchBarEl = document.createElement("div");
      bar.className = "watch-bar";
      bar.hidden = true;
      bar.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-watch]");
        if (!b) return;
        if (b.dataset.watch === "back") this.stopWatching();
        else this.watchPlayer();
      });
      const stats = this.view.querySelector(".bay-overlay > .bay-stats");
      if (stats) stats.before(bar);
      else this.view.appendChild(bar);
    }
    const p = this.watching;
    bar.hidden = !p;
    if (!p) return;
    const others = watchable(this.round?.players ?? []).length;
    bar.innerHTML = `<span class="watch-dot" style="background:${esc(p.colour ?? "#fff")}"></span><span>Watching <b>${esc(p.name)}</b></span>${others > 1 ? `<button data-watch="next">Next</button>` : ""}<button class="primary" data-watch="back">Back to my ball</button>`;
  }

  // The side panel's line for it, online: a Watch button for each friend
  // still playing the hole, or who's watched and Back to my ball.
  watchHtml() {
    const r = this.round;
    if (!r?.net || r.done || r.finished) return "";
    const list = watchable(r.players);
    if (!list.length && !this.watching) return "";
    const buttons = list.map((i) => {
      const p = r.players[i];
      const on = p === this.watching;
      return `<button type="button" data-watch-player="${i}"${on ? ' class="on" aria-pressed="true"' : ""} title="See ${esc(p.name)}'s shot from behind their ball, and their ball in the air">${on ? "Watching" : "Watch"} ${esc(p.name)}</button>`;
    });
    if (this.watching) buttons.push(`<button type="button" data-watch-player="back" class="primary">Back to my ball</button>`);
    return buttons.join("");
  }
}
