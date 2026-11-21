// The scramble: moving players to their team's ball and picking which ball
// the team plays next.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import { YARD } from "../sim/flight.mjs";
import { FOOT } from "../sim/putting.mjs";
import { LIE_NAMES } from "../sim/lie.mjs";
import { distanceToPin } from "../sim/courseplay.mjs";
import { fmt, esc } from "../util.js";
import { waitingFor, waitingWords } from "../sim/netgame.mjs";
import { teamsOf, teamName, scramblePick, scrambleFromLog } from "../sim/teams.mjs";

export class CourseScramble {
  // ---- The scramble ---------------------------------------------------------------

  // A player about to hit from their team's ball.
  toTeamBall(i, team) {
    const p = this.round.players[i];
    if (team.hit[i]) return;
    p.ball = [...team.spot];
    p.lie = team.lie;
    p.strokes = team.stroke;
    const last = p.shots.at(-1);
    if (!last || last[0] !== team.spot[0] || last[1] !== team.spot[1]) p.shots.push([...team.spot]);
  }

  // Whether a player's marker is drawn in a scramble: their ball once
  // they've hit from the team's; of those still to hit, one marks the
  // team's ball - unless the one to play is standing at it.
  scrambleMarker(i) {
    const r = this.round;
    const t = r.scr.find((x) => x.members.includes(i));
    if (!t || t.hit[i]) return true;
    if (t.members.includes(r.turn) && !t.hit[r.turn]) return false;
    return t.members.find((m) => !t.hit[m]) === i;
  }

  // Online: the team balls from the game's record of this hole (shots and
  // picks from every bay, netgame.mjs), with this bay's own not yet back
  // from the host on the end. A team that's holed it: its players here
  // have finished; another bay's players still to hit stand at the team's
  // ball.
  scrambleNet() {
    const r = this.round;
    const g = this.netGame;
    if (!r?.scr || !r.net || !g) return;
    const ids = r.players.map((p) => p.netId);
    const log = g.scramble?.[r.index] ?? [];
    const key = (e) => (e.pick != null ? `pick:${e.pick}:${e.s}` : `${e.p}:${e.s}:${e.h ? 1 : 0}`);
    const seen = new Set(log.map(key));
    r.scrLocal = r.scrLocal.filter((e) => !seen.has(key(e)));
    const gone = (i) => !!g.players.find((x) => x.id === ids[i])?.dropped;
    r.scr = scrambleFromLog(teamsOf(r.teamOf).map((t) => t.members), [...log, ...r.scrLocal], ids, gone, this.teeAt());
    for (const t of r.scr) {
      for (const m of t.members) {
        const p = r.players[m];
        if (t.done) {
          if (!p.done) {
            p.scores[r.index] = t.score;
            p.strokes = t.score;
            p.done = true;
          }
        } else if (p.remote && !t.hit[m]) {
          p.ball = [...t.spot];
          p.lie = t.lie;
          p.strokes = t.stroke;
        }
      }
    }
  }

  // "Waiting for Sam to pick", "Waiting for Sam and Jo": who another bay's
  // part of the scramble is waiting on.
  scrambleWaitWords() {
    const r = this.round;
    const names = [];
    for (const t of r.scr ?? []) {
      if (t.done || !t.members.some((m) => !r.players[m].remote)) continue;
      if (t.picking) names.push(`${r.players[t.members[0]].name} to pick`);
      else for (const m of t.members) if (r.players[m].remote && !t.hit[m]) names.push(r.players[m].name);
    }
    return names.length ? waitingWords(names) : waitingWords(waitingFor(this.netGame, r.index, r.net?.bay));
  }

  // "1-2": the keys for the pick.
  pickKeys() {
    const t = this.round?.scr?.[this.round.pick];
    return t ? `1-${t.members.length}` : "";
  }

  // The captain's card: each ball the team hit, where it lies.
  showPick() {
    const r = this.round;
    const t = r?.scr?.[r.pick];
    if (!t || !this.isActive) {
      this.pickEl.hidden = true;
      return;
    }
    const names = r.players.map((p) => p.name);
    const where = (h) => {
      const left = distanceToPin(r.hole, h.ball);
      return h.lie === "green" ? `Green, ${fmt(left / FOOT, 0)} ft` : `${LIE_NAMES[h.lie] ?? h.lie}, ${fmt(left / YARD, 0)} yds`;
    };
    const buttons = t.members
      .map((m, k) => `<button data-pick="${k}" style="border-color:${r.players[m].colour}"><kbd>${k + 1}</kbd> ${esc(names[m])} - ${esc(where(t.hit[m]))}${t.hit[m].strokes > t.stroke + 1 ? " (+1 penalty)" : ""}</button>`)
      .join("");
    this.pickEl.innerHTML =
      `<div class="cc-q">${esc(teamName(t.members, names))}: which ball?</div>` +
      `<div class="cc-why">${esc(names[t.members[0]])} picks - everyone plays the next shot from it (${this.pickKeys()})</div>` +
      `<div class="cc-buttons">${buttons}</div>`;
    this.pickEl.hidden = false;
  }

  hidePick() {
    if (this.pickEl) this.pickEl.hidden = true;
  }

  // The captain picks the k-th player's ball (in the team's order): the
  // whole team plays on from there. False with no pick waiting.
  pickBall(k) {
    const r = this.round;
    const t = r?.scr?.[r.pick];
    const m = t?.members[k];
    if (m == null || !t.hit[m] || this.flying) return false;
    const h = t.hit[m];
    r.scr[r.pick] = scramblePick(t, m);
    if (r.net) {
      r.scrLocal.push({ pick: r.players[m].netId, s: h.strokes });
      this.netSend?.({ type: "pick", hole: r.index, player: r.players[m].netId, strokes: h.strokes });
    }
    for (const q of t.members) {
      const pl = r.players[q];
      pl.ball = [...h.ball];
      pl.lie = h.lie;
      pl.strokes = h.strokes;
      if (q !== m) pl.lieAfter = "";
    }
    r.pick = null;
    this.hidePick();
    this.onToast(`${r.players[m].name}'s ball`, 1600);
    this.passTurn(true);
    this.drawMarkers();
    return true;
  }
}
