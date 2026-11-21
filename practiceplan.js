// A practice plan in the sim: one drill (sim/practiceplan.mjs) played in
// its mode - the mode set up for it, each shot scored as it's recorded, the
// running score said after each, and at the end the score saved as a game
// (so My stats keeps it and its trend) and the mode put back as it was.
//
// Or a gapping session (sim/gapping.mjs) on the range: five good balls with
// every club, the club picked for each in turn, what the stats made of each
// shot said (a thin one doesn't count), N skipping a club, and at the end a
// card of the carries side by side with the gaps and overlaps. The shots
// themselves fill the stats page's gapping chart; no score is kept.
//
// Or a warm-up (sim/warmup.mjs): a few balls to loosen up, kept out of the
// stats, then drivers, a long iron, a short iron, a wedge and drivers again,
// five each - the game picking each club - and ten putts on the practice
// green to finish.

import { DrillRun, drillById, suggestDrills, GAME_KIND } from "./sim/practiceplan.mjs";
import { GappingRun, sessionClubs, gapWords } from "./sim/gapping.mjs";
import { WarmupRun, warmupSteps, stepWords, WARMUP } from "./sim/warmup.mjs";
import { CLUB_NAMES } from "./sim/clubs.mjs";
import { loadSetting, saveSetting, esc } from "./util.js";

const clubWords = (c) => CLUB_NAMES[c]?.toLowerCase() ?? c;
const ClubWords = (c) => CLUB_NAMES[c] ?? c;

// What a drill changes in each mode, to put back afterwards.
const KEEPS = {
  putting: ["game", "next", "distanceMode", "minFt", "maxFt", "distanceFt"],
  chipping: ["game", "distanceMode", "minYards", "maxYards", "holeYards", "hazard"],
  range: ["target"],
};

export class PracticePlan {
  // modes: the sim's modes. setMode(name), setClub(club), toast(text, ms),
  // recordGame(game), hitter(): the app's. changed(): the overlay again.
  // view: the picture's element, for the gapping session's card at the end;
  // openStats(): My stats, from that card.
  constructor({ modes, setMode, setClub, toast, recordGame, hitter, changed = () => {}, view = null, openStats = null }) {
    Object.assign(this, { modes, setMode, setClub, toast, recordGame, hitter, changed, view, openStats });
    this.run = null;
    this.kept = null;
    this.card = null;
  }

  get active() {
    return !!this.run;
  }
  // A gapping session is on.
  get gapping() {
    return this.run instanceof GappingRun;
  }
  // A warm-up is on.
  get warmup() {
    return this.run instanceof WarmupRun;
  }
  // The next shot is kept out of the stats altogether (a warm-up's first
  // few: app.js doesn't record it).
  get unsaved() {
    return this.run instanceof WarmupRun && this.run.unsaved;
  }

  // The drill the stats point to for whoever's hitting (fetched now), or
  // the one asked for by id.
  async suggested() {
    const name = this.hitter();
    let report = null;
    try {
      if (name) report = await fetch(`/api/stats/player?name=${encodeURIComponent(name)}&period=3m&sg=${encodeURIComponent(loadSetting("statsSg", { choice: "mine" }).choice ?? "mine")}`).then((r) => r.json());
    } catch {
      report = null;
    }
    // (My weak spot is a drill: a gapping session is offered on its own.)
    return suggestDrills(report).find((x) => x.drill.kind !== "gapping") ?? null;
  }

  // opts.clubs: a gapping session's clubs - "mine" (the hitter's own) or
  // "all".
  async start(id = "suggested", { clubs = "mine" } = {}) {
    if (id === "gapping") return this.startGapping(clubs);
    if (id === "warmup") return this.startWarmup();
    let why = "";
    let drill = drillById(id);
    if (!drill || drill.kind === "gapping") {
      const s = await this.suggested();
      drill = s?.drill ?? drillById("approach-100-150");
      why = s?.why ?? "";
    }
    if (this.run) this.stop({ quiet: true });
    const mode = this.modes[drill.mode];
    this.run = new DrillRun(drill);
    this.setMode(drill.mode);
    this.kept = { mode: drill.mode, values: Object.fromEntries((KEEPS[drill.mode] ?? []).map((k) => [k, mode.settings[k]])), band: mode.planBand ?? null };
    this.setUp(drill, mode);
    if (drill.club) this.setClub(drill.club);
    const past = this.past(drill.id);
    this.toast(`${drill.name} - ${drill.what}${why ? ` ${why}` : ""}${past ? ` Best ${past.best}, last ${past.last}.` : ""}`, 7000);
    this.changed();
    return drill;
  }

  setUp(drill, mode) {
    const s = mode.settings;
    const set = drill.setup;
    if (drill.mode === "range") {
      mode.planBand = set.targetBand ?? null;
      s.target = set.targetBand ? -1 : 0;
      mode.placeTarget();
    } else if (drill.mode === "putting") {
      mode.setGame?.("practice");
      Object.assign(s, { game: "practice", next: "same", distanceMode: "random", minFt: set.minFt, maxFt: set.maxFt });
      mode.randomPutt();
    } else if (drill.mode === "chipping") {
      mode.setGame?.("practice");
      // Over open ground, whatever the practice green was set to.
      Object.assign(s, { game: "practice", distanceMode: "random", minYards: set.minYards, maxYards: set.maxYards, hazard: "none" });
      mode.next();
    }
  }

  // The mode as it was before the drill.
  restore() {
    const k = this.kept;
    this.kept = null;
    if (!k) return;
    const mode = this.modes[k.mode];
    Object.assign(mode.settings, k.values);
    if (k.mode === "range") {
      mode.planBand = k.band;
      mode.placeTarget();
    } else mode.save?.();
  }

  stop({ quiet = false } = {}) {
    if (!this.run) return;
    const run = this.run;
    this.run = null;
    this.restore();
    if (run instanceof GappingRun) {
      // What was hit so far still makes a card (and is in the chart).
      if (!quiet) this.gappingCard(run, { stopped: true });
    } else if (run instanceof WarmupRun) {
      if (!quiet) this.toast(`Warm-up stopped after ${run.total} shots`, 2500);
    } else if (!quiet) this.toast(`${run.drill.name} stopped after ${run.points.length} of ${run.shots}`, 2500);
    this.changed();
  }

  // Every recorded shot: the drill's, scored. ctx.mouse: a mouse swing.
  // done: the stats' reply for it (a promise), which a gapping session
  // waits for to know how it was struck.
  onRecord(modeName, ctx, done = null) {
    const run = this.run;
    if (run instanceof GappingRun) return void this.gappingShot(run, modeName, ctx, done);
    if (run instanceof WarmupRun) return void this.warmupShot(run, modeName);
    if (!run) return;
    const p = run.add(modeName, ctx);
    if (p == null) return;
    // A mouse swing in it: the drill's score is kept out of My stats and
    // the bests, as the swing itself is (recorder.js).
    if (ctx.mouse) run.mouse = true;
    if (!run.done) {
      this.toast(run.line(p), 2200);
      this.changed();
      return;
    }
    this.finish(run);
  }

  finish(run) {
    this.run = null;
    const score = run.score;
    const past = this.past(run.drill.id);
    const best = !past || score > past.best;
    if (!run.mouse) this.remember(run.drill.id, score);
    this.recordGame({ mode: run.drill.mode, kind: GAME_KIND, key: run.drill.id, name: run.drill.name, score, shots: run.points.length, note: false, mouse: !!run.mouse });
    if (run.mouse) this.toast(`${run.drill.name}: ${score}. With a mouse swing in it, it stays out of My stats and your bests.`, 6000);
    else this.toast(`${run.drill.name}: ${score}${best && past ? " - a new best!" : past ? ` (best ${past.best}, last ${past.last})` : ""}. My stats keeps it and shows its trend.`, 6000);
    this.restore();
    this.changed();
  }

  // A line for the overlay while a drill's on.
  note() {
    if (this.run instanceof GappingRun || this.run instanceof WarmupRun) return this.run.note();
    return this.run ? `${this.run.drill.name}: shot ${Math.min(this.run.points.length + 1, this.run.shots)} of ${this.run.shots} · average ${this.run.score}` : "";
  }

  // ---- A warm-up ----------------------------------------------------------------

  // The clubs change from one warm-up to the next (each player's count).
  async startWarmup() {
    if (this.run) this.stop({ quiet: true });
    this.closeCard();
    const n = this.past("warmup")?.count ?? 0;
    const steps = warmupSteps(n, await this.knownClubs());
    const run = new WarmupRun(steps);
    this.run = run;
    this.rememberWarmup(n + 1);
    this.setMode("range");
    this.toast(`Warm-up: ${steps.map(stepWords).join(", then ")}. The club comes up by itself; N skips ahead.`, 8000);
    this.changed();
    return { name: "Warm-up", mode: "range" };
  }

  warmupShot(run, modeName) {
    const r = run.add(modeName);
    if (!r) return;
    if (!r.stepDone) {
      this.toast(`${stepWords(r.step)}: ${r.n} of ${r.of}`, 1800);
      this.changed();
      return;
    }
    this.warmupNext(run, r.next, r.finished, `${stepWords(r.step)} done - `);
  }

  // On to the warm-up's next step: its club, and the putting green for the
  // putts (set up for practice, and put back as it was after).
  warmupNext(run, next, finished, said) {
    if (finished || !next) {
      this.run = null;
      this.restore();
      this.toast(`Warm-up done - ${run.total} shots. Ready to play.`, 5000);
      this.changed();
      return;
    }
    if (next.mode === "putting" && !this.kept) {
      const mode = this.modes.putting;
      this.setMode("putting");
      this.kept = { mode: "putting", values: Object.fromEntries(KEEPS.putting.map((k) => [k, mode.settings[k]])), band: null };
      mode.setGame?.("practice");
      Object.assign(mode.settings, { game: "practice", next: "same", distanceMode: "random", minFt: WARMUP.puttFt[0], maxFt: WARMUP.puttFt[1] });
      mode.randomPutt?.();
    }
    if (next.club) this.setClub(next.club);
    this.toast(`${said}now ${stepWords(next)}`, 3000);
    this.changed();
  }

  rememberWarmup(count) {
    const all = loadSetting("practicePlans", {});
    const who = this.hitter() ?? "";
    const mine = (all[who] ??= {});
    mine.warmup = { ...(mine.warmup ?? {}), count, t: Date.now() };
    saveSetting("practicePlans", all);
  }

  // ---- A gapping session -----------------------------------------------------

  // The clubs the hitter's stats have shots with (every day kept).
  async knownClubs() {
    const name = this.hitter();
    if (!name) return [];
    try {
      const report = await fetch(`/api/stats/player?name=${encodeURIComponent(name)}`).then((r) => r.json());
      return (report?.clubs ?? []).filter((c) => c.n > 0).map((c) => c.club);
    } catch {
      return [];
    }
  }

  async startGapping(choice = "mine") {
    const drill = drillById("gapping");
    const clubs = sessionClubs(choice, choice === "mine" ? await this.knownClubs() : []);
    if (this.run) this.stop({ quiet: true });
    this.closeCard();
    const mode = this.modes.range;
    this.setMode("range");
    this.kept = { mode: "range", values: { target: mode.settings.target }, band: mode.planBand ?? null };
    this.setUp(drill, mode);
    const run = new GappingRun(clubs);
    run.drill = drill;
    this.run = run;
    this.setClub(run.club);
    this.toast(`Gapping session: ${clubs.length} clubs, five good balls each, the ${clubWords(run.club)} first - the next club comes up by itself. N skips one you don't carry.`, 7000);
    this.changed();
    return drill;
  }

  // A shot on the range in a gapping session: counted or not, as the stats
  // judged it, and on to the next club after five good ones.
  async gappingShot(run, modeName, ctx, done) {
    if (modeName !== "range") return;
    let reply = null;
    try {
      reply = await done;
    } catch {
      reply = null;
    }
    if (this.run !== run) return;
    const r = run.add({ club: ctx.club, carry: ctx.result?.carry, strike: reply?.strike ?? "good", odd: !!reply?.odd, swing: reply?.swing ?? "full", special: reply?.special ?? null, mouse: !!ctx.mouse });
    if (!r) return;
    const said = r.counted ? `${Math.round(r.carry)} yds` : r.why;
    if (r.finished) {
      this.run = null;
      this.restore();
      this.gappingCard(run);
    } else if (r.clubDone) {
      this.setClub(r.next);
      const carries = run.balls.get(r.club);
      this.toast(`${ClubWords(r.club)}: ${said}. ${carries.length ? `Done - ${Math.round(run.summary().rows.find((x) => x.club === r.club)?.carry ?? 0)} yds typically` : "Done"}. Now the ${clubWords(r.next)}.`, 3500);
    } else this.toast(`${ClubWords(r.club)}: ${said} - ${r.n} of ${run.per}`, r.counted ? 2000 : 3000);
    this.changed();
  }

  // N in a gapping session (or a warm-up): on to the next club. True if
  // one was on.
  skipClub() {
    const run = this.run;
    if (run instanceof WarmupRun) {
      const r = run.skip();
      this.warmupNext(run, r.next, r.finished, `Skipped - `);
      return true;
    }
    if (!(run instanceof GappingRun)) return false;
    const r = run.skip();
    if (r.finished) {
      this.run = null;
      this.restore();
      this.gappingCard(run);
    } else {
      this.setClub(r.next);
      this.toast(`Skipped the ${clubWords(r.skipped)} - now the ${clubWords(r.next)}`, 2500);
    }
    this.changed();
    return true;
  }

  // The carries side by side, longest first, with the step to the next
  // club and the gaps and overlaps called out.
  gappingCard(run, { stopped = false } = {}) {
    const { rows, gaps } = run.summary();
    if (!rows.length) {
      this.toast(stopped ? "Gapping session stopped - no clubs finished" : "Gapping session over - no good shots to show", 3000);
      return;
    }
    const words = gapWords(gaps);
    this.toast(`Gapping session ${stopped ? "stopped" : "done"}: ${rows.length} club${rows.length === 1 ? "" : "s"} - your gapping chart in My stats has them now.`, 4000);
    if (!this.view) return;
    this.closeCard();
    const el = document.createElement("div");
    el.className = "corner-card gapping-card";
    const step = new Map(gaps.map((g) => [g.from, g]));
    el.innerHTML = `<h3>Gapping session${stopped ? " (stopped)" : ""}</h3>
      <table><thead><tr><th>Club</th><th>Carry</th><th>Spread</th><th>To the next</th></tr></thead><tbody>
      ${rows
        .map((r) => {
          const g = step.get(r.club);
          return `<tr><td>${esc(ClubWords(r.club))}</td><td><b>${Math.round(r.carry)}</b></td><td>${Math.round(r.low)}-${Math.round(r.high)}</td><td class="${g?.flag ?? ""}">${g ? `${Math.round(g.diff)} yds${g.flag === "gap" ? " - big gap" : g.flag === "overlap" ? " - overlap" : ""}` : ""}</td></tr>`;
        })
        .join("")}
      </tbody></table>
      ${words.length ? `<ul>${words.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>` : `<p>No big gaps or overlaps.</p>`}
      <div class="cc-buttons">${this.openStats ? `<button data-act="stats">My stats</button>` : ""}<button data-act="close" class="primary">Close</button></div>`;
    el.addEventListener("click", (e) => {
      const act = e.target.closest("button[data-act]")?.dataset.act;
      if (act === "stats") this.openStats?.();
      if (act) this.closeCard();
    });
    this.view.appendChild(el);
    this.card = el;
  }

  closeCard() {
    this.card?.remove();
    this.card = null;
  }

  // Each player's best and last score at each drill, kept here as well as
  // in the stats (the stats have them over time).
  past(id) {
    return loadSetting("practicePlans", {})[this.hitter() ?? ""]?.[id] ?? null;
  }
  remember(id, score) {
    const all = loadSetting("practicePlans", {});
    const who = this.hitter() ?? "";
    const mine = (all[who] ??= {});
    const was = mine[id];
    mine[id] = { best: Math.max(score, was?.best ?? 0), last: score, t: Date.now() };
    saveSetting("practicePlans", all);
  }
}
