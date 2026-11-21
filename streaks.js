// Streaks for a practice mode (the rules are sim/streaks.mjs): each player's
// run at the practice in hand, their bests kept in this browser, and what a
// success or a miss gets - the celebration that grows with the run, the
// crowd for a new record, the heartbeat while a run closes on the best, and
// a word when a good run ends.

import { newRun, afterTry, recordStreak, bestOf, streakCelebration, heartbeatFor, runEndedText, describeKey, STREAK_KINDS } from "./sim/streaks.mjs";
import { loadSetting, saveSetting, esc } from "./util.js";

// How long after a try the heartbeat starts: once its celebration (or the
// word on a miss) has had its moment.
const HEARTBEAT_DELAY = 2.2;

export class Streaks {
  // sounds: sounds.js's (the crowd, the heartbeat). celebrate(desc): plays
  // a celebration over the mode's picture. toast(text, ms).
  constructor({ sounds, celebrate = () => {}, toast = () => {} }) {
    this.sounds = sounds;
    this.celebrate = celebrate;
    this.toast = toast;
    // "player\nkey" -> the run in hand, and each player's practice now.
    this.runs = new Map();
    this.current = new Map();
  }

  get bests() {
    return loadSetting("streaks", {});
  }

  // A player's run at a practice, measured against their best. "In a row"
  // means one after another: a player turning to another practice (another
  // distance, the cup, the zone) starts afresh there, and coming back
  // starts afresh too.
  run(player, key) {
    const id = `${player}\n${key}`;
    if (this.current.get(player) !== key) {
      const was = this.current.get(player);
      if (was !== undefined) this.runs.delete(`${player}\n${was}`);
      this.current.set(player, key);
      this.runs.delete(id);
    }
    if (!this.runs.has(id)) this.runs.set(id, newRun(bestOf(this.bests, player, key)));
    return this.runs.get(id);
  }

  best(player, key) {
    return bestOf(this.bests, player, key);
  }

  // After a try at a practice: a success is celebrated (and kept as the
  // best if it's the most in a row yet), a good run ending is said, and the
  // heartbeat set for what comes next. Returns afterTry's outcome.
  //   kind     "putt", "chip-pin" or "chip-zone"
  //   holed    it went in (a chip-in says so)
  add({ player, kind, key, success, holed = false }) {
    const id = `${player}\n${key}`;
    const out = afterTry(this.run(player, key), success);
    this.runs.set(id, out.run);
    if (success) {
      const { bests, isBest } = recordStreak(this.bests, player, key, out.run.count);
      if (isBest) saveSetting("streaks", bests);
      this.celebrate(streakCelebration(kind, out, { holed }));
      if (out.firstRecord) this.sounds?.cheer("big");
      else if (out.record) this.sounds?.cheer("small");
    } else {
      const text = runEndedText(kind, out);
      if (text) this.toast(text, 2800);
    }
    this.pulse(out.run, HEARTBEAT_DELAY);
    return out;
  }

  // The heartbeat for a run about to be played on: on while it's closing
  // on the best, off otherwise.
  pulse(run, delay = 0) {
    const beat = heartbeatFor(run);
    if (beat) this.sounds?.heartbeat({ ...beat, delay });
    else this.sounds?.stopHeartbeat();
  }

  // The practice in hand has changed (another distance, the cup, whoever's
  // hitting): the heartbeat follows its run.
  switchTo(player, key) {
    this.pulse(this.run(player, key));
  }

  stop() {
    this.sounds?.stopHeartbeat();
  }

  // The panel's section: this run, the best, and every best of this kind
  // for the player.
  html(player, kind, key) {
    const k = STREAK_KINDS[kind];
    const run = this.run(player, key);
    const mine = Object.entries(this.bests[player] ?? {})
      .filter(([k2]) => k2.startsWith(`${kind}:`))
      .map(([k2, v]) => ({ key: k2, ...v, ...describeKey(k2) }))
      .sort((a, b) => b.best - a.best);
    const rows = mine
      .map((b) => `<tr${b.key === key ? ' class="here"' : ""}><td>${esc(b.distance)}${b.extra.length ? ` <span class="muted">${esc(b.extra.join(", "))}</span>` : ""}</td><td><b>${b.best}</b></td><td>${esc(b.date ?? "")}</td></tr>`)
      .join("");
    return `
      <div class="streak-now"><span>In a row <b>${run.count}</b></span><span>Best <b>${Math.max(run.best, run.count) || "-"}</b></span></div>
      <table class="clubs streak-bests"><tr><th>${esc(k?.name ?? "Best")}</th><th>Best</th><th>Date</th></tr>${
        rows || `<tr><td colspan="3" class="muted">None yet</td></tr>`
      }</table>`;
  }
}
