// Playing the Tour's events (sim/tour.mjs; net/tourhub.mjs keeps the week
// and the cards, and sends what's played):
//   putt     this week's green - the putting green set to the week's
//            numbers, not to be changed while it's on (putting.js setFixed),
//            each putt a go;
//   updown   up and down - the week's chips, each putted out (updown.js),
//            each chip and its putts a go.
// Each event is 50 goes a week on an account's card (the owner, 16 November
// 2026: "max 50 shots. Top made and also top streak in that amount. Don't
// have to be done in one session"): leave when you like, and the rest are
// there next time. A go counts for the account signed in here, when it's
// that account's player hitting: on the launch monitor's card when every
// shot of it was a launch monitor's, on the made-up swings' when any was
// the mouse's, a finger's or a controller's - played at the Tour's one
// level (app.js swingLevelOf). A test shot's go never counts.
//
// Leaving the Tour - its Leave, or going to another mode - puts the green
// back as the player had it.
//
// And the week's round (sim/tour.mjs weekRound): nine holes on the course
// mode, one go - a season by post's fixed round (course/seasonpost.js),
// kept on this device under TOUR:<week> as it's played, carried on from the
// next hole when it's left, sent as it finishes (or from the Tour's panel,
// when it couldn't be): on the made-up swings' board if any shot of it was
// one, on no board if a test shot was.

import { EVENTS, DIVISIONS, SHOTS, MEASURES, MEASURE_ORDER, TOUR_LEVEL, cardDone, greenLine, weekWords, closesWords, placeWords, ordinal, toParWords, weekStart, tourScorecard, courseFits } from "./sim/tour.mjs";
import { carryOn } from "./sim/postal.mjs";
import { rollConditions, cleanConditions } from "./sim/weather.mjs";
import { madeUpSwing, TEST_SHOT } from "./sim/mouseswing.mjs";
import { streakCelebration, afterTry, newRun } from "./sim/streaks.mjs";
import { esc } from "./util.js";

// The modes an event's played in (app.js setMode: going anywhere else
// leaves the Tour).
const MODES = { putt: ["putting"], updown: ["chipping", "putting"] };
// How long the last go's left to be seen before a finished card leaves.
const DONE_MS = 3200;
// The Tour's round among the fixed rounds a device keeps (course/
// seasonpost.js: TOUR:<week>).
export const ROUND_CODE = "TOUR";
// The round's weather, the same for everyone: rolled from its seed - calm
// to windy, never a gale (a week's one go is a test, not a lottery).
export const ROUND_WINDS = ["calm", "breezy", "breezy", "windy"];
export const roundWeather = (seed) => cleanConditions(rollConditions({ wind: ROUND_WINDS[Math.abs(seed) % ROUND_WINDS.length], temp: "random", sky: "random", time: "any" }, seed));

// How long after the week's known its courses are made and checked (the
// game's own start first).
export const COURSE_CHECK_MS = 30_000;

// One of the Tour's courses as it comes with the game (sim/tour.mjs
// TOUR_COURSES), from the game's own server, or null.
export async function tourCourse(id, fetchImpl = (u) => fetch(u)) {
  try {
    const res = await fetchImpl(`/api/tour/course/${encodeURIComponent(id)}`);
    const c = res.ok ? await res.json() : null;
    return c && Array.isArray(c.holes) && c.holes.length ? c : null;
  } catch {
    return null;
  }
}

export class TourPlay {
  // hub: the TourHub. putting: the putting green. upDown: the up and
  // down game (updown.js), or null. goTo(mode): the game to that mode.
  // hitter(): who's hitting. account(): the account in use here ({ player })
  // or null. toast(text, ms). openTour(): the Tour's panel. signIn(): the
  // sign-in card. now(): the clock. anon(): the player's chosen to be shown
  // as "A player" (tourpanel.js). firstDivision(): the board a go's
  // expected on before one's played (how this device is played).
  // later(fn, ms): a timer. course: the course mode (the week's round).
  // courseFor(id): the week's round's course as it comes with the game
  // (tourCourse).
  constructor({ hub, putting, upDown = null, course = null, goTo, hitter, account, toast = () => {}, openTour = () => {}, signIn = () => {}, now = () => Date.now(), onChange = () => {}, anon = () => false, firstDivision = () => "monitor", later = (fn, ms) => setTimeout(fn, ms), courseFor = (id) => tourCourse(id) }) {
    Object.assign(this, { hub, putting, upDown, course, goTo, hitter, account, toast, openTour, signIn, now, onChange, anon, firstDivision, later, courseFor });
    // The week's round's course and the next weeks' (the relay's ahead):
    // made here a little after the week's known - kept, ready to play even
    // though none need be in the player's own courses - and each checked
    // against the Tour's scorecard (checkCourses). { week, list, made }.
    this.courses = null;
    hub.onChange?.(() => this.courseCheckSoon());
    this.event = null;
    // The board the last go went on (the card shown), and why the last
    // one didn't count (or null).
    this.division = null;
    this.why = null;
    // (The week or this account's places looked at again: the card too.)
    hub.onChange(() => this.event && this.redraw({ quiet: true }));
  }

  get on() {
    return !!this.event;
  }
  // Whether the event being played is played in this mode.
  inMode(mode) {
    return !!this.event && MODES[this.event].includes(mode);
  }
  // The board shown while it's played: the last go's, else how this
  // device is played.
  get shown() {
    return this.division ?? (this.firstDivision() === "swing" ? "swing" : "monitor");
  }
  // This account's card on it.
  card(event = this.event) {
    return this.hub.card(event, this.shown);
  }

  // An event started: false (and why said) when it can't be.
  play(event) {
    const setup = this.hub.view?.setup;
    if (!setup || this.hub.view.week?.n !== this.hub.week) {
      this.toast("This week's Tour isn't here yet - check the internet and open the Tour again", 4000);
      this.hub.refresh({ force: true });
      return false;
    }
    if (!this.account()) {
      this.toast(`Sign in to play the Tour - your ${SHOTS} shots a week are kept with your account`, 4500);
      this.signIn();
      return false;
    }
    if (this.on) this.leave({ quiet: true });
    // (A practice up and down under way: over, its greens let go.)
    if (this.upDown?.on) this.upDown.stop({ quiet: true });
    this.division = null;
    this.why = null;
    const card = this.card(event);
    if (cardDone(card)) {
      this.toast(`Your ${SHOTS} are played this week - ${this.cardWords(event, card)}. A new week starts on Monday`, 5000);
      this.openTour();
      return false;
    }
    if (event === "updown") {
      if (!this.upDown) return false;
      this.event = "updown";
      this.upDown.start({ setup: setup.updown, tour: this });
      this.onChange();
      return true;
    }
    this.event = "putt";
    this.week = setup.week;
    this.goTo("putting");
    this.putting.setFixed(setup.putt, {
      key: `Tour ${weekWords(setup.week)}`,
      lockedWords: "This week's green is the same for everyone - leave the Tour to change the green",
      banner: () => this.puttBanner(),
      // Over the picture (the side panel folds away as it's played).
      note: () => "The Tour",
      stats: () => this.cardStats("putt"),
      noStreak: true,
      act: (a) => (a === "leave" ? this.leave() : a === "board" ? this.openTour() : a === "signin" ? this.signIn() : null),
      onPutt: (putt, res) => this.putted(putt, res),
    });
    this.onChange();
    return true;
  }

  // Out of the Tour: the green as the player had it, and what's played
  // sent. (Up and down's go under way counts as it stands: updown.js stop.)
  leave({ quiet = false } = {}) {
    const was = this.event;
    if (!was) return;
    // (Up and down's go under way: counted as not down - updown.js stop.)
    const midway = was === "updown" && !!this.upDown?.goOn;
    this.event = null;
    if (was === "putt") this.putting.setFixed(null);
    else this.upDown?.stop({ quiet: true });
    this.hub.flush();
    if (!quiet) {
      const card = this.hub.card(was, this.shown);
      const left = cardDone(card) ? "" : ` ${SHOTS - card.shots} of your ${SHOTS} left for this week, whenever you like`;
      this.toast(`Left the Tour - ${midway ? "the chip under way counts as not down, and " : ""}the green's yours again.${left}`, 4000);
    }
    this.onChange();
  }

  // Why a go wouldn't count (in words), or null. shots: what's known of
  // its shots ({ test, other }).
  notCounted({ test = false, other = false } = {}) {
    const acc = this.account();
    if (test) return "Test shots don't count on the Tour";
    if (!acc) return "Sign in to play the Tour";
    if (other || (acc.player && this.hitter() && this.hitter() !== acc.player)) return `The Tour's shots count for ${acc.player} - the account signed in here`;
    return null;
  }

  // A go finished - its letter (sim/tour.mjs GOES), what it was (d), and
  // what's known of its shots: made (any made-up swing in it), test,
  // other (someone else hitting). Counted on its board's card, or why not
  // said. -> { card, before, division }, or null when it didn't count.
  went(event, { r, d = null, made = false, test = false, other = false }) {
    const why = this.notCounted({ test, other });
    this.why = why;
    if (why) {
      this.toast(`${why} - that one's not on your card`, 3500);
      this.redraw();
      return null;
    }
    const division = made ? "swing" : "monitor";
    this.division = division;
    const before = this.hub.card(event, division);
    if (cardDone(before)) {
      this.toast(`Your ${SHOTS} on the ${DIVISIONS[division].name.toLowerCase()} board are played this week`, 3500);
      this.redraw();
      return null;
    }
    const acc = this.account();
    // (The name the boards show: the player's - or none, shown as "A player".)
    const card = this.hub.went({ event, division, r, d, name: this.anon() ? "" : (acc.player ?? this.hitter() ?? "") });
    if (cardDone(card)) this.done(event, division, card);
    this.redraw();
    return { card, before, division };
  }

  // A card's 50 played: what it came to said, once the relay's placed it,
  // and the Tour left (after a moment to see the last go).
  async done(event, division, card) {
    const was = this.event;
    this.later(() => this.event === was && this.leave({ quiet: true }), DONE_MS);
    await this.hub.flush();
    this.toast(`That's your ${SHOTS} for this week: ${this.cardWords(event, card, division)}`, 7000);
  }

  // "31 holed (4th of 12), longest streak 9 (2nd of 12)".
  cardWords(event, card, division = this.shown) {
    const st = this.hub.standing(event, division);
    const placed = st && st.shots === card.shots;
    const at = (m) => (placed ? ` (${placeWords(st.places[m], st.count)})` : "");
    return `${card.made} ${EVENTS[event].made}${at("made")}, longest streak ${card.streak}${at("streak")}`;
  }

  redraw() {
    if (this.event === "putt") this.putting.renderFixed();
    else if (this.event === "updown") this.upDown?.render();
    this.onChange();
  }

  // ---- This week's green -------------------------------------------------------------

  // A putt finished on the week's green (putting.js finish).
  putted(putt, res) {
    if (this.event !== "putt") return;
    const out = this.went("putt", {
      r: res.holed ? "h" : "m",
      // (And the aim the line's from: the relay rolls a holed one again -
      // relay/tourcheck.mjs.)
      d: [round1(putt.ball?.speedMph ?? 0), round1(putt.ball?.hla ?? 0), round1(putt.aimDeg ?? 0)],
      made: madeUpSwing(putt.deviceId),
      test: putt.deviceId === TEST_SHOT,
    });
    if (!out) return;
    // Each one holed in a row celebrated as the green's own run would be.
    if (res.holed) this.putting.celebrate?.(streakCelebration("putt", afterTry({ ...newRun(0), count: out.before.run }, true)));
    if (cardDone(out.card)) return;
    // A streak over: said (the putting green says the miss for itself).
    if (!res.holed && out.before.run > 1) this.toast(`Streak over at ${out.before.run}${out.card.streak > out.before.run ? ` - your longest is ${out.card.streak}` : " - your longest this week"}`, 3500);
  }

  // The numbers over the picture: the card's.
  cardStats(event) {
    const c = this.card(event);
    return [
      { label: "Shot", value: `${Math.min(SHOTS, c.shots + 1)}/${SHOTS}` },
      { label: EVENTS[event].made === "holed" ? "Holed" : "Made", value: String(c.made), accent: true },
      { label: "In a row", value: String(c.run) },
      { label: "Longest", value: String(c.streak) },
    ];
  }

  // Where this account stands, under the card: its places on the two
  // boards (as the relay last said - once what's played is sent).
  standingWords(event) {
    const acc = this.account();
    if (!acc) return `<button data-fixed="signin">Sign in</button> to play the Tour.`;
    const division = this.shown;
    const card = this.card(event);
    if (!card.shots) return `Nothing on your card yet this week - the first ${EVENTS[event].go} starts it.`;
    const st = this.hub.standing(event, division);
    const placed = st && st.shots === card.shots;
    const places = placed ? MEASURE_ORDER.map((m) => `${esc(MEASURES[m].name.toLowerCase())} <b>${esc(placeWords(st.places[m], st.count))}</b>`).join(", ") : "your places once they're sent";
    return `On the Tour (${esc(DIVISIONS[division].name.toLowerCase())}): ${places}.`;
  }

  // The putting panel's card while the week's green is on.
  puttBanner() {
    const v = this.hub.view;
    const n = v?.week?.n ?? this.week;
    const c = this.card("putt");
    return `<h3>The Tour - ${esc(EVENTS.putt.name.toLowerCase())}</h3>
      <p class="small">${esc(greenLine(v?.setup?.putt ?? {}))}. ${esc(weekWords(n))}, ${esc(closesWords(n, this.now()))}.</p>
      <div class="streak-now"><span>Putt <b>${Math.min(SHOTS, c.shots + 1)}</b> of ${SHOTS}</span><span>Holed <b>${c.made}</b></span><span>In a row <b>${c.run}</b></span><span>Longest <b>${c.streak}</b></span></div>
      <p class="small">${this.standingWords("putt")}</p>
      ${this.why && this.account() ? `<p class="small worse">${esc(this.why)}.</p>` : ""}
      <p class="small muted">${SHOTS} putts this week, as and when you like - leave any time, and the rest are here when you come back. Two boards: the most holed, and the longest streak in a row.</p>
      <div class="buttons"><button data-fixed="board">The Tour's boards</button><button data-fixed="leave">Leave the Tour</button></div>`;
  }

  // ---- The week's round ----------------------------------------------------------------

  roundKey(week = this.hub.week) {
    return `${ROUND_CODE}:${week}`;
  }
  // This account's round as it's kept here (scores so far, done, how it
  // was swung), or null.
  keptRound(week = this.hub.week) {
    return this.course?.postSeasons?.rounds?.[this.roundKey(week)] ?? null;
  }
  dropRound(week) {
    if (!this.course?.postSeasons) return;
    delete this.course.postSeasons.rounds[this.roundKey(week)];
    this.course.savePostSeasons();
  }
  // Where it is: "play" (not begun), "carry" (begun here, holes left),
  // "send" (played here, not in yet), "in" (the relay has it) or
  // "elsewhere" (begun on another device).
  roundState() {
    const mine = this.hub.mine?.round;
    if (mine?.sent) return "in";
    const kept = this.keptRound();
    if (kept?.done) return "send";
    if (kept) return "carry";
    return mine?.began ? "elsewhere" : "play";
  }
  // "38 (+2), net 34 - 3rd of 40 on the Tour, 2nd net, 1st of 12 in your
  // flight. The season: 4th of 52, 1,140 points".
  roundWords(r = this.hub.mine?.round) {
    if (!r?.sent) return "";
    // (Held for a look, or hidden: no places - why said instead.)
    if (r.held) return `${r.gross} (${toParWords(r.toPar)}), net ${r.net} - ${r.held}`;
    const season = r.season ?? this.hub.mine?.season?.[r.division] ?? null;
    return `${r.gross} (${toParWords(r.toPar)}), net ${r.net} - ${placeWords(r.places.world, r.counts.world)} on the Tour, ${ordinal(r.places.net)} net, ${placeWords(r.places.flight, r.counts.flight)} in your flight${season ? `. The season: ${placeWords(season.place, season.count)}, ${season.total.toLocaleString("en-GB")} points` : ""}`;
  }

  // ---- The week's courses -------------------------------------------------------------

  // The week's round's course and the next TOUR_AHEAD weeks', as the relay
  // has them: [{ week, course, name, start, scorecard }], this week's first.
  wantedCourses() {
    const R = this.hub.view?.round;
    if (!R?.setup) return [];
    const s = R.setup;
    return [{ week: s.week, course: s.course, name: s.name, start: weekStart(s.week), scorecard: s.scorecard ?? tourScorecard(s.course) }, ...(Array.isArray(R.ahead) ? R.ahead : [])];
  }

  // Checked a while after the week's known (not while the game's starting),
  // or at once when asked (the panel's open).
  courseCheckSoon(ms = COURSE_CHECK_MS) {
    const week = this.hub.view?.round?.setup?.week;
    if (!Number.isInteger(week) || this.courses?.week === week || this.checkingFor === week) return;
    this.checkingFor = week;
    this.later(() => this.checkCourses(), ms);
  }

  // Each of the courses made here and checked: [{ week, course, name,
  // start, ready }] - ready: this game makes it as the Tour plays it
  // (false: it can't make it, or makes it otherwise - an update's needed).
  // The made ones are kept (made), so they're ready to play.
  async checkCourses() {
    const want = this.wantedCourses();
    const week = want[0]?.week;
    if (!Number.isInteger(week)) return null;
    if (this.courses?.week === week) return this.courses.list;
    if (this.checking?.week === week) return this.checking.done;
    const done = (async () => {
      const made = new Map();
      const list = [];
      for (const w of want) {
        const c = made.get(w.course) ?? (await this.courseFor(w.course));
        if (c) made.set(w.course, c);
        list.push({ week: w.week, course: w.course, name: w.name, start: w.start, ready: !!c && (!w.scorecard || courseFits(c, w.scorecard)) });
      }
      this.courses = { week, list, made };
      this.checking = null;
      this.checkingFor = null;
      this.onChange();
      // Said once: the first course this game can't play as the Tour plays
      // it - this week's, or one coming - so it's known without opening the Tour.
      const missing = list.find((c) => !c.ready);
      if (missing) {
        const day = new Date(missing.start).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
        this.toast(missing.week === week ? `This week's Tour round is on ${missing.name}, which this version of A² Golf doesn't have - update A² Golf to play it` : `From ${day} the Tour's round is on ${missing.name}, which this version of A² Golf doesn't have - update A² Golf before then to play it`, 7000);
      }
      return list;
    })();
    this.checking = { week, done };
    return done;
  }

  // How this game stands with the week's round's course: "ready",
  // "update" (it can't make it as the Tour plays it), or null (not checked).
  courseState() {
    const first = this.courses?.week === this.hub.view?.round?.setup?.week ? this.courses.list[0] : null;
    return first ? (first.ready ? "ready" : "update") : null;
  }

  // Begun (or carried on) on the course: false (and why said) when it can't be.
  async playRound() {
    const setup = this.hub.view?.round?.setup;
    if (!setup || this.hub.view.week?.n !== this.hub.week) {
      this.toast("This week's Tour isn't here yet - check the internet and open the Tour again", 4000);
      this.hub.refresh({ force: true });
      return false;
    }
    const acc = this.account();
    if (!acc) {
      this.toast("Sign in to play the Tour's round - it's kept with your account", 4500);
      this.signIn();
      return false;
    }
    const c = this.course;
    const state = this.roundState();
    if (state === "in") {
      this.toast(`Your round's in this week: ${this.roundWords()}`, 6000);
      this.openTour();
      return false;
    }
    if (state === "elsewhere") {
      this.toast("You began this week's round on another device - carry it on there", 5000);
      return false;
    }
    if (state === "send") return this.sendKeptRound();
    // The course as it comes with the game - never the player's own copy,
    // which may have been deleted or changed (the owner, 19 November 2026:
    // "It has to be available to play"): served by the game's own server
    // (server/starter.mjs tourCourse; the phone's and the web version's
    // from the app), made already if it's been checked (checkCourses) -
    // and only if it's the Tour's scorecard's (the owner: "tour play must
    // have the right version to join").
    const madeHere = this.courses?.made?.get(setup.course);
    const course = madeHere ? structuredClone(madeHere) : await this.courseFor(setup.course);
    const scorecard = setup.scorecard ?? tourScorecard(setup.course);
    const holes = course && course.holes.length >= setup.holes ? c.holesOf(course, setup.holes) : null;
    if (!holes || (scorecard && !courseFits(course, scorecard))) {
      this.toast(`${holes ? `This version of A² Golf makes ${setup.name} differently from the Tour's` : `This version of A² Golf can't make ${setup.name}`} - update A² Golf to play this week's round`, 6000);
      return false;
    }
    const player = acc.player ?? this.hitter();
    let kept = this.keptRound();
    const ask = kept ? "Carry on with this week's Tour round?" : `Play this week's Tour round now? ${setup.name}, ${setup.holes} holes - it's one go, no restarts.`;
    if (!(c.underway ? await c.leaveRound(ask) : await c.askFirst(ask, { yes: kept ? "Carry on" : "Play it", no: "Not now" }))) return false;
    if (!kept) {
      try {
        await this.hub.beginRound({ holes, index: await c.ownIndex(player) });
      } catch (err) {
        this.toast(err.message, 5000);
        return false;
      }
      kept = { scores: [], at: this.now(), done: false, madeUp: false, test: false };
      c.postSeasons.rounds[this.roundKey()] = kept;
      c.savePostSeasons();
    }
    if (this.on) this.leave({ quiet: true });
    if (this.upDown?.on) this.upDown.stop({ quiet: true });
    const go = carryOn(kept, setup.holes);
    if (go.lost) this.toast(`Hole ${go.lost} was left part way, so it counts as unfinished (par and 3)`, 5000);
    if (go.done) {
      c.postSeasons.rounds[this.roundKey()] = { ...kept, scores: Array.from({ length: setup.holes }, (_, i) => (Number.isFinite(go.scores[i]) ? go.scores[i] : null)), done: true };
      c.savePostSeasons();
      return this.sendKeptRound();
    }
    this.goTo("course");
    c.pendingPostSeason = { tour: true, code: ROUND_CODE, k: setup.week, name: "The Tour", event: "The week's round", holes: setup.holes, seed: setup.seed, level: TOUR_LEVEL, players: [player], tees: null, pin: setup.pin, madeUp: !!kept.madeUp, test: !!kept.test };
    c.postCarry = go.scores;
    c.startRound(setup.course, go.from, null, { weather: roundWeather(setup.seed), course });
    this.onChange();
    return true;
  }

  // Played (course/seasonpost.js postSeasonPlayed): sent.
  roundPlayed(ps) {
    return this.sendKeptRound(ps.k);
  }

  // A round played here sent to the relay (once): kept until it's in, and
  // let go when it can't be sent at all. -> true once it's in.
  async sendKeptRound(week = this.hub.week) {
    const kept = this.keptRound(week);
    if (!kept?.done) return false;
    if (kept.test) {
      this.dropRound(week);
      this.toast("A test shot was played in it, so this week's round can't go on the Tour", 5000);
      return false;
    }
    const acc = this.account();
    const name = this.anon() ? "" : (acc?.player ?? this.hitter() ?? "");
    try {
      const r = await this.hub.sendRound({ week, division: kept.madeUp ? "swing" : "monitor", scores: kept.scores, name });
      this.dropRound(week);
      this.toast(`Your round's in: ${this.roundWords(r)}`, 7000);
      this.onChange();
      return true;
    } catch (err) {
      const never = err.closed || err.status === 400 || err.status === 409;
      if (never) this.dropRound(week);
      this.toast(`Your round couldn't be sent (${err.message})${never ? "" : " - it's kept: Send it from the Tour"}`, 6000);
      this.onChange();
      return false;
    }
  }
}

const round1 = (v) => Math.round(v * 10) / 10;
