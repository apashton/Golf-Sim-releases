// Ten-attempt rounds with personal bests, shared by the putting and chipping
// challenges. The rules live in sim/scoring.mjs; this is the bookkeeping and
// the panel that shows it.

import { Round, recordBest, ATTEMPTS } from "./sim/scoring.mjs";
import { loadSetting, saveSetting, esc } from "./util.js";

export class Challenge {
  // maxPoints: best possible for one attempt, for colouring.
  constructor({ maxPoints, onEvent = () => {} }) {
    this.maxPoints = maxPoints;
    this.onEvent = onEvent;
    this.round = null;
    this.last = null;
  }

  get bests() {
    return loadSetting("bests", {});
  }
  best(key) {
    return this.bests[key]?.score ?? null;
  }

  start(key) {
    this.round = new Round(key);
    // So each attempt can say which round it was part of, for the stats.
    this.round.id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
    this.last = null;
  }

  // Adds a scored attempt. Returns what happened, including a new PB.
  add(score) {
    if (!this.round || this.round.finished) return null;
    this.round.add(score);
    this.last = score;
    if (!this.round.finished) return { finished: false };
    const { bests, isBest, previous } = recordBest(this.bests, this.round.key, this.round.total);
    if (isBest) saveSetting("bests", bests);
    const result = { finished: true, total: this.round.total, isBest, previous };
    this.onEvent(result);
    return result;
  }

  // "Putt 4 of 10", for overlays.
  get progress() {
    if (!this.round) return "";
    const n = Math.min(this.round.scores.length + 1, ATTEMPTS);
    return this.round.finished ? "Round complete" : `${n} of ${ATTEMPTS}`;
  }

  // The panel section: attempts so far, total, PB.
  html(key, noun = "Putt") {
    const pb = this.best(key);
    const r = this.round;
    const boxes = [];
    for (let i = 0; i < ATTEMPTS; i++) {
      const s = r?.scores[i];
      if (!s) {
        boxes.push(`<span class="attempt empty">${i + 1}</span>`);
        continue;
      }
      const tier = s.points >= this.maxPoints * 0.75 ? "top" : s.points >= this.maxPoints * 0.4 ? "mid" : s.points > 0 ? "low" : "zero";
      boxes.push(`<span class="attempt ${tier}" title="${esc(s.label)}">${s.points}</span>`);
    }
    let status = `Press <b>Start round</b>, then ${ATTEMPTS} ${noun.toLowerCase()}s.`;
    if (r && !r.finished) status = `${noun} <b>${r.scores.length + 1}</b> of ${ATTEMPTS}`;
    if (r?.finished) status = "Round complete";
    return `
      <div class="round-status">${status}</div>
      <div class="attempts">${boxes.join("")}</div>
      <div class="round-total"><span>Score <b>${r ? r.total : "-"}</b> / ${this.maxPoints * ATTEMPTS}</span>
        <span>PB <b>${pb ?? "-"}</b></span></div>`;
  }

  // Every PB saved for keys starting with a prefix, for the PB table.
  bestsFor(prefix) {
    return Object.entries(this.bests)
      .filter(([k]) => k.startsWith(prefix))
      .map(([key, v]) => ({ key, ...v }));
  }
}
