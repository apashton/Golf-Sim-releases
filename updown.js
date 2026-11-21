// Up and down (the owner, 14 November 2026: "an up and down practice. 1
// chip 1 putt. A chip in allow for 1 two putt (extra life), but trying to
// get a streak of up and downs for both practice and leaderboards/tour"):
// a chip on the chipping green, then the putt it left on the putting
// green - and the next chip. Holed, the up and down's made; a chip-in
// makes it too, and earns a life; a missed putt spends a life on a second
// putt, or with none in hand ends the run (sim/tour.mjs afterChip,
// afterPutt). A chip that finishes off the green ends it: there's no putt
// from there. One left inside TAP_IN_FT is tapped in.
//
// Two ways in: practice (the chipping green's Up and down - a fresh nine
// chips each run, the best run kept for each player here) and the Tour's
// week (tourplay.js - the week's chips, the same in the same order for
// everyone: 50 of them on the account's card, each chip and its putts a
// go put on it as it's finished, the run and its lives carried from one go
// to the next - next time too).
//
// Each chip and putt is its green's own, set from here and not to be
// changed while a run's on (chipping.js, putting.js setFixed).

import { newUpDown, afterChip, afterPutt, upDownHole, weekUpDown, weekWords, closesWords, SHOTS, cardDone } from "./sim/tour.mjs";
import { madeUpSwing, TEST_SHOT } from "./sim/mouseswing.mjs";
import { streakCelebration, afterTry, newRun } from "./sim/streaks.mjs";
import { esc, fmt, loadSetting, saveSetting } from "./util.js";

// A chip left this close is tapped in: nobody's asked to putt a foot.
export const TAP_IN_FT = 2;
// The putting green's longest putt.
const LONGEST_FT = 80;
// How long a chip's or a putt's result is left up before the next.
const PAUSE_MS = 3200;
const round1 = (v) => Math.round(v * 10) / 10;

export class UpDown {
  // chipping, putting: the two greens. goTo(mode): the game to that mode.
  // hitter(): who's hitting. toast(text, ms). celebrate(mode, desc): that
  // green's celebration. later(fn, ms) / never(id): timers.
  constructor({ chipping, putting, goTo, hitter, toast = () => {}, now = () => Date.now(), onChange = () => {}, later = (fn, ms) => setTimeout(fn, ms), never = (id) => clearTimeout(id) }) {
    Object.assign(this, { chipping, putting, goTo, hitter, toast, now, onChange, later, never });
    this.state = null;
    // (Moving between the two greens itself: not the player leaving.)
    this.moving = false;
  }

  get on() {
    return !!this.state;
  }
  // The green the run's on now: "chipping" or "putting".
  get stage() {
    return this.state?.stage ?? null;
  }

  // A run started. setup: the chips (sim/tour.mjs weekUpDown) - the Tour's
  // week's (tour: tourplay.js, which each go's put on the card through), or
  // none for practice: a fresh nine.
  start({ setup = null, tour = null } = {}) {
    this.stop({ quiet: true });
    this.state = { tour, weekly: setup, setup: setup ?? freshSetup(), run: newUpDown(), stage: null, began: null, made: false, test: false, other: false, timer: null, last: null, goOn: false, goLeave: -1, goPutts: 0 };
    this.toChip();
    this.onChange();
  }

  // The Tour: a chip's been played and its go isn't over yet.
  get goOn() {
    return !!this.state?.goOn;
  }

  // Out of it: both greens as the player had them. A practice run still
  // going is kept if it's the player's best; the Tour's go under way counts
  // as not down (no chip played again by leaving after it).
  stop({ quiet = false } = {}) {
    const st = this.state;
    if (!st) return;
    this.never(st.timer);
    if (st.tour && st.goOn) {
      st.goOn = false;
      st.tour.went("updown", { r: "x", d: [st.goLeave, st.goPutts], made: st.made, test: st.test, other: st.other });
    }
    this.state = null;
    if (!st.tour && st.run.made > 0 && !st.run.over) this.keepBest(st.run.made);
    this.chipping.setFixed(null);
    this.putting.setFixed(null);
    if (!quiet) this.toast("Left up and down - the greens are yours again", 2200);
    this.onChange();
  }

  // The player's gone to another mode (app.js setMode): unless it's this
  // moving between its two greens, that's leaving.
  modeChanged(next) {
    if (!this.on || this.moving || next === this.state.stage) return;
    const tour = this.state.tour;
    if (tour) tour.leave({ quiet: true });
    else this.stop({ quiet: true });
  }

  to(mode) {
    this.moving = true;
    try {
      this.goTo(mode);
    } finally {
      this.moving = false;
    }
  }

  what() {
    return {
      noStreak: true,
      lockedWords: this.state?.tour ? "Up and down's chips are the same for everyone this week - leave the Tour to change them" : "Up and down sets each chip and putt - leave it to change them",
      banner: () => this.banner(),
      act: (a) => this.act(a),
      note: () => (this.state?.tour ? "The Tour · up and down" : "Up and down"),
      stats: () => this.stats(),
    };
  }
  act(a) {
    const tour = this.state?.tour;
    if (a === "leave") return tour ? tour.leave() : this.stop();
    if (a === "board") return tour?.openTour();
    if (a === "signin") return tour?.signIn();
  }

  // ---- The chip ----------------------------------------------------------------------

  // The chip being played: the Tour's next of the week's (by the card),
  // practice's next of the run's.
  get hole() {
    const st = this.state;
    return upDownHole(st.setup, st.tour ? st.tour.card("updown").shots : st.run.made);
  }

  toChip() {
    const st = this.state;
    if (!st) return;
    // (Each go's own: how it was swung, and - on the Tour - the run and its
    // lives as the card has them.)
    Object.assign(st, { made: false, test: false, other: false, goOn: false, goLeave: -1, goPutts: 0 });
    if (st.tour) {
      const c = st.tour.card("updown");
      st.run = { ...newUpDown(), made: c.run, lives: c.lives };
    }
    st.stage = "chipping";
    this.putting.setFixed(null);
    this.to("chipping");
    this.chipping.setFixed({ holeYards: this.hole.yards, stimp: st.setup.stimp }, { ...this.what(), onChip: (chip, res) => this.chipped(chip, res) });
    this.onChange();
  }

  note(shot) {
    const st = this.state;
    st.began ??= this.now();
    if (madeUpSwing(shot.deviceId)) st.made = true;
    if (shot.deviceId === TEST_SHOT) st.test = true;
    const acc = st.tour?.account();
    if (acc?.player && this.hitter() && this.hitter() !== acc.player) st.other = true;
  }

  chipped(chip, res) {
    const st = this.state;
    if (!st || st.stage !== "chipping" || st.timer) return;
    this.note(chip);
    const onGreen = !res.water && res.finishedIn === "green";
    st.goOn = true;
    st.goLeave = res.holed ? 0 : onGreen ? Math.max(0.1, round1(res.leaveFeet)) : -1;
    st.run = afterChip(st.run, { holed: res.holed, leaveFt: res.leaveFeet, onGreen });
    if (st.run.said === "chipin") {
      this.chipping.celebrate?.(streakCelebration("chip-pin", afterTry({ ...newRun(0), count: st.run.made - 1 }, true), { holed: true }));
      if (st.tour) return this.tourGo("c", (n) => `Chip-in! ${n} in a row - and a life earned`);
      this.say(`Chip-in! ${st.run.made} in a row - and a life earned`, 3200);
      return this.next(() => this.toChip());
    }
    if (st.run.over) {
      const why = res.water ? "In the water - no putt from there" : `Off the green (${wordsFor(res.finishedIn)}) - no putt from there`;
      return st.tour ? this.tourGo("x", null, why) : this.over(why);
    }
    // Inside a couple of feet: tapped in.
    if (res.leaveFeet <= TAP_IN_FT) {
      st.run = afterPutt(st.run, { holed: true });
      this.chipping.celebrate?.(streakCelebration("chip-pin", afterTry({ ...newRun(0), count: st.run.made - 1 }, true)));
      if (st.tour) return this.tourGo("u", (n) => `${fmt(res.leaveFeet, 1)} ft - tapped in. Up and down! ${n} in a row`);
      this.say(`${fmt(res.leaveFeet, 1)} ft - tapped in. Up and down! ${st.run.made} in a row`, 3200);
      return this.next(() => this.toChip());
    }
    this.say(`${fmt(res.leaveFeet, 0)} ft left - putt it out`, 2600);
    this.next(() => this.toPutt(res.leaveFeet));
  }

  // ---- The putt ----------------------------------------------------------------------

  toPutt(leaveFt) {
    const st = this.state;
    if (!st) return;
    st.stage = "putting";
    const h = this.hole;
    this.to("putting");
    this.putting.setFixed(
      { distanceFt: Math.min(LONGEST_FT, Math.max(TAP_IN_FT, round1(leaveFt))), uphill: h.uphill, fallRight: h.fallRight, contours: "none", seed: 1, stimp: st.setup.stimp, cup: "normal" },
      { ...this.what(), onPutt: (putt, res) => this.putted(putt, res) },
    );
    this.onChange();
  }

  putted(putt, res) {
    const st = this.state;
    if (!st || st.stage !== "putting" || st.timer) return;
    this.note(putt);
    st.goPutts += 1;
    st.run = afterPutt(st.run, { holed: res.holed, leaveFt: res.leaveFeet });
    const said = st.run.said;
    if (said === "made" || said === "saved") {
      this.putting.celebrate?.(streakCelebration("putt", afterTry({ ...newRun(0), count: st.run.made - 1 }, true)));
      if (st.tour) return this.tourGo(said === "saved" ? "s" : "u", (n) => `${said === "saved" ? "Saved with the life - " : ""}Up and down! ${n} in a row`);
      this.say(`${said === "saved" ? "Saved with the life - " : ""}Up and down! ${st.run.made} in a row`, 3200);
      return this.next(() => this.toChip());
    }
    if (said === "life") {
      // (Its second putt: tapped in from close, as a chip's leave is.)
      if (res.leaveFeet <= TAP_IN_FT) {
        st.run = afterPutt(st.run, { holed: true });
        if (st.tour) return this.tourGo("s", (n) => `Missed - a life spent, and tapped in from ${fmt(res.leaveFeet, 1)} ft. ${n} in a row`);
        this.say(`Missed - a life spent, and tapped in from ${fmt(res.leaveFeet, 1)} ft. ${st.run.made} in a row`, 3600);
        return this.next(() => this.toChip());
      }
      this.say(`Missed - a life spent: putt it again, from ${fmt(res.leaveFeet, 0)} ft`, 3200);
      return this.next(() => this.toPutt(res.leaveFeet));
    }
    if (st.tour) return this.tourGo("x", null, "Missed");
    this.over("Missed");
  }

  // ---- The Tour: a go over -------------------------------------------------------------

  // Put on the card (tourplay.js went: its letter, the chip's leave and
  // the putts) and said - made(n): the words for it, n in a row now; or
  // why it wasn't down. Then the next chip: the card's next, the same one
  // again when it didn't count, none when the 50 are played.
  tourGo(r, made, why = null) {
    const st = this.state;
    // (A tap-in's a putt, though it isn't played.)
    const putts = r === "c" ? 0 : r === "s" ? 2 : r === "u" ? 1 : st.goPutts;
    st.goOn = false;
    const out = st.tour.went("updown", { r, d: [st.goLeave, putts], made: st.made, test: st.test, other: st.other });
    if (this.state !== st) return;
    if (out) {
      const c = out.card;
      if (made) this.say(made(c.run), 3200);
      else this.say(`${why} - ${out.before.run > 0 ? `streak over at ${out.before.run}` : "not down"}`, 3200);
      if (cardDone(c)) return this.render();
    }
    this.next(() => this.toChip());
  }

  // ---- A run over ----------------------------------------------------------------------

  // Practice's (the Tour's goes go on: tourGo). why: what ended it, in a
  // few words.
  over(why) {
    const st = this.state;
    const run = st.run;
    st.last = { count: run.made };
    if (run.made > 0) this.practiceOver(run.made, why);
    else this.say(`${why} - again from the first chip`, 3200);
    // The next run: from the first chip (practice: a fresh nine).
    Object.assign(st, { run: newUpDown(), began: null, made: false, test: false, other: false });
    if (!st.weekly) st.setup = freshSetup();
    this.next(() => this.toChip());
  }

  // Practice: each player's best run kept here.
  // -> the best before, when this run's the better (kept), else null.
  keepBest(n) {
    const who = this.hitter() ?? "";
    const bests = loadSetting("upDownBest", {});
    const was = bests[who] ?? 0;
    if (n <= was) return null;
    bests[who] = n;
    saveSetting("upDownBest", bests);
    return was;
  }
  practiceOver(n, why) {
    const before = this.keepBest(n);
    if (before != null) this.say(`${why}. ${n} up and down${n === 1 ? "" : "s"} in a row - ${before ? `your best (it was ${before})` : "your best"}`, 4500);
    else this.say(`${why}. Run over at ${n} - your best is ${this.best()}`, 3500);
  }
  best() {
    return loadSetting("upDownBest", {})[this.hitter() ?? ""] ?? 0;
  }

  next(fn) {
    const st = this.state;
    this.never(st.timer);
    st.timer = this.later(() => {
      if (this.state !== st) return;
      st.timer = null;
      fn();
    }, PAUSE_MS);
    this.render();
  }
  say(text, ms) {
    this.toast(text, ms);
  }
  render() {
    this.chipping.renderFixed();
    this.putting.renderFixed();
    this.onChange();
  }

  // ---- What's shown ----------------------------------------------------------------------

  stats() {
    const st = this.state;
    if (!st) return [];
    if (st.tour) {
      const c = st.tour.card("updown");
      return [
        { label: "Chip", value: `${Math.min(SHOTS, c.shots + 1)}/${SHOTS}` },
        { label: "Made", value: String(c.made), accent: true },
        { label: "In a row", value: String(st.run.made) },
        { label: "Lives", value: String(st.run.lives) },
        { label: "Longest", value: String(c.streak) },
      ];
    }
    return [
      { label: "Up & downs", value: String(st.run.made), accent: true },
      { label: "Lives", value: String(st.run.lives) },
      { label: "Best", value: String(this.best() || "-") },
    ];
  }

  // The card at the top of the green's panel.
  banner() {
    const st = this.state;
    if (!st) return "";
    const run = st.run;
    const h = this.hole;
    const where = st.stage === "putting" ? (run.on?.spent ? "The putt again - the life's spent, this one has to drop." : "The putt: hole it for the up and down.") : `The chip: ${h.yards} yards to the pin. Get it close - or in, for a life.`;
    const lives = run.lives ? `${run.lives} ${run.lives === 1 ? "life" : "lives"} - each good for one two-putt` : "No life in hand: a chip-in earns one";
    const tour = st.tour;
    let foot;
    let head = `<div class="streak-now"><span>In a row <b>${run.made}</b></span><span>Lives <b>${run.lives}</b></span></div>`;
    if (tour) {
      const v = tour.hub.view;
      const n = v?.week?.n ?? tour.hub.week;
      const c = tour.card("updown");
      head = `<div class="streak-now"><span>Chip <b>${Math.min(SHOTS, c.shots + 1)}</b> of ${SHOTS}</span><span>Made <b>${c.made}</b></span><span>In a row <b>${run.made}</b></span><span>Lives <b>${run.lives}</b></span><span>Longest <b>${c.streak}</b></span></div>`;
      foot = `<p class="small">${tour.standingWords("updown")}</p>
        ${tour.why && tour.account() ? `<p class="small worse">${esc(tour.why)}.</p>` : ""}
        <p class="small muted">${esc(weekWords(n))}, ${esc(closesWords(n, this.now()))}. ${SHOTS} chips this week, the same in the same order for everyone, each putted out - leave any time, and the rest are here next time (one left after its chip counts as not down). Two boards: the most up and downs, and the longest streak.</p>
        <div class="buttons"><button data-fixed="board">The Tour's boards</button><button data-fixed="leave">Leave the Tour</button></div>`;
    } else {
      const best = this.best();
      foot = `<p class="small">${best ? `Your best: <b>${best}</b> in a row.` : "No run of yours yet - the first up and down starts one."}</p>
        <p class="small muted">One chip, one putt. A chip-in earns a life, good for one two-putt; miss the putt with none in hand and the run's over. Inside ${TAP_IN_FT} ft is tapped in. The Tour has a week's board for it too.</p>
        <div class="buttons"><button data-fixed="leave">Leave up and down</button></div>`;
    }
    return `<h3>${tour ? "The Tour - up and down" : "Up and down"}</h3>
      ${head}
      <p class="small">${esc(where)}</p>
      <p class="small muted">${esc(lives)}.</p>
      ${foot}`;
  }
}

// Practice's chips: a fresh nine each run.
const freshSetup = () => weekUpDown(100000 + Math.floor(Math.random() * 1e6));
const wordsFor = (ground) => ({ fringe: "on the fringe", rough: "in the rough", bunker: "in the bunker" })[ground] ?? "short of it";
