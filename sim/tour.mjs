// The Tour (docs/TOUR-PLAN.md; the owner, 14 November 2026: "I don't see
// the tour? This should be really obvious and key in getting original
// players to come back ... in the beginning the main place to compete"):
// each week, the same for every player in the world -
//   putt     this week's green: one set putt;
//   updown   up and down (the owner: "1 chip 1 putt. A chip in allow for 1
//            two putt (extra life), but trying to get a streak of up and
//            downs"): the same chips for everyone;
//   round    the week's round: 9 holes on one of the courses that come
//            with the game, in turn - the same weather and pins for
//            everyone, one go - with a board for the world, one net of
//            handicaps and one for each flight of handicaps.
// Each of the two is 50 shots a week (the owner, 16 November 2026: "should
// be max 50 shots. Top made and also top streak in that amount. Don't have
// to be done in one session"): an account's card, played as and when it
// likes all week, with a board for the most made and one for the longest
// streak.
// A week runs Monday to Monday (00:00 UTC), opens and closes by itself.
// Playing needs the account you're signed in with: one card per account
// on each board. Two divisions, never mixed: a launch monitor's shots, and
// made-up swings (the mouse, a finger, a controller) at the one level the
// Tour sets.
//
// Pure, and the relay's copy too (relay/game/tour.mjs, tools/relaygame.mjs):
// the week from the clock, what a week holds, a card and how a go changes
// it, a board and places on it. No imports - it's copied as it is.

export const DAY_MS = 24 * 3600 * 1000;
export const WEEK_MS = 7 * DAY_MS;
// The first Monday there was (5 January 1970, 00:00 UTC): weeks count from it.
const FIRST_MONDAY = 4 * DAY_MS;

export const weekOf = (now = Date.now()) => Math.floor((now - FIRST_MONDAY) / WEEK_MS);
export const weekStart = (n) => FIRST_MONDAY + n * WEEK_MS;
export const weekEnd = (n) => weekStart(n + 1);
export const goodWeek = (n) => Number.isInteger(n) && n > 2000 && n < 100000;
// A go played as the week closed can still be sent for this long.
export const LATE_MS = 15 * 60 * 1000;
export const weekOpen = (n, now = Date.now()) => now >= weekStart(n) && now < weekEnd(n) + LATE_MS;

// "9 - 15 November" (the week's Monday to its Sunday, UTC).
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function weekWords(n) {
  const a = new Date(weekStart(n));
  const b = new Date(weekEnd(n) - DAY_MS);
  const day = (d) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  return a.getUTCMonth() === b.getUTCMonth() ? `${a.getUTCDate()} - ${day(b)}` : `${day(a)} - ${day(b)}`;
}
// How long a week has left, in words: "closes in 3 days", "closes in 5
// hours", "closes in 20 minutes", "closed".
export function closesWords(n, now = Date.now()) {
  const left = weekEnd(n) - now;
  if (left <= 0) return "closed";
  const days = Math.floor(left / DAY_MS);
  if (days >= 2) return `closes in ${days} days`;
  const hours = Math.floor(left / 3600000);
  if (hours >= 2) return `closes in ${hours} hours`;
  const mins = Math.max(1, Math.round(left / 60000));
  return hours === 1 ? "closes in an hour" : `closes in ${mins} minute${mins === 1 ? "" : "s"}`;
}

// ---- The events and the divisions -------------------------------------------------

// low: the lower score's the better (a round's strokes). go: what one of
// its 50 shots is; made: what's counted.
export const EVENTS = {
  putt: { name: "This week's green", short: "Putting", go: "putt", gos: "putts", made: "holed", low: false },
  updown: { name: "Up and down", short: "Up and down", go: "chip", gos: "chips", made: "up and downs", low: false },
  round: { name: "The week's round", short: "The round", low: true },
};
// The events played 50 shots a week on a card (the round's its own).
export const EVENT_ORDER = ["putt", "updown"];
export const goodEvent = (e) => EVENT_ORDER.includes(e);

export const DIVISIONS = {
  monitor: { name: "Launch monitor", line: "Every shot hit for real on a launch monitor" },
  swing: { name: "Mouse, finger & controller", line: "Swung with the mouse, a finger or a controller - everyone at the Tour's level" },
};
export const DIVISION_ORDER = ["monitor", "swing"];
export const goodDivision = (d) => Object.prototype.hasOwnProperty.call(DIVISIONS, d);
// The level every made-up swing plays the Tour at (sim/swinglevels.mjs).
export const TOUR_LEVEL = "amateur";

// ---- What a week holds --------------------------------------------------------------

// A small seeded draw (mulberry32): the same numbers for the same week,
// here and on the relay.
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// A week's own draw for one thing (salt): its number well stirred first, so
// one week's numbers say nothing of the next's.
export function weekDraw(n, salt) {
  let h = (Math.imul(n | 0, 0x9e3779b1) ^ Math.imul(salt | 0, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0;
  return seeded((h ^ (h >>> 16)) >>> 0);
}
const pick = (rand, list) => list[Math.floor(rand() * list.length) % list.length];
// (To the nearest half - and never "-0", which a store hands back as 0.)
const half = (v) => Math.round(v * 2) / 2 || 0;

// The week's putt, in turn: lengths most people hole now and then, not
// nine times in ten - a week of 4-footers would have runs of hundreds.
export const PUTT_ROTA = [10, 8, 14, 12, 7, 18, 9, 16, 11, 22, 6, 13];
// The green's numbers as the putting green has them (putting.js settings):
// { distanceFt, uphill, fallRight, contours, seed, stimp, cup }. A longer
// putt gets a gentler green; there's always some break.
export function weekGreen(n) {
  const rand = weekDraw(n, 1);
  const distanceFt = PUTT_ROTA[((n % PUTT_ROTA.length) + PUTT_ROTA.length) % PUTT_ROTA.length];
  const most = distanceFt >= 16 ? 1.5 : distanceFt >= 11 ? 2 : 2.5;
  const side = Math.max(0.5, half(0.5 + rand() * (most - 0.5))) * (rand() < 0.5 ? -1 : 1);
  const uphill = half((rand() * 2 - 1) * Math.min(2, most));
  return { distanceFt, uphill, fallRight: side, contours: distanceFt >= 16 ? "none" : "gentle", seed: 1 + (n % 9973), stimp: pick(rand, [9, 10, 10, 11, 12]), cup: "normal" };
}

// Up and down: the week's chips, the same in the same order for everyone -
// each a chip's length (yards) and what the green does to the putt after
// it (as the putt's played: uphill, fall to the right, in %). The week's
// 50 go round them in turn (practice: a run starts at the first).
export const UPDOWN_HOLES = 9;
export const UPDOWN_YARDS = [10, 12, 15, 18, 20, 25, 30];
export function weekUpDown(n) {
  const rand = weekDraw(n, 2);
  const holes = [];
  for (let i = 0; i < UPDOWN_HOLES; i++) {
    let yards = pick(rand, UPDOWN_YARDS);
    // (Never the same length twice running.)
    if (holes.length && holes[holes.length - 1].yards === yards) yards = UPDOWN_YARDS[(UPDOWN_YARDS.indexOf(yards) + 2) % UPDOWN_YARDS.length];
    holes.push({ yards, uphill: half((rand() * 2 - 1) * 1.5), fallRight: half((rand() * 2 - 1) * 2) });
  }
  return { holes, stimp: pick(rand, [9, 10, 10, 11]) };
}
// The chip that's next: the week's, having played `n` of them (practice:
// a run having made n).
export const upDownHole = (setup, n) => setup.holes[((n % setup.holes.length) + setup.holes.length) % setup.holes.length];

// Everything fixed for a week. (The round's kept apart - weekRound - as
// it came after the week's first setups were.)
export const weekSetup = (n) => ({ week: n, putt: weekGreen(n), updown: weekUpDown(n) });

// ---- The week's round -------------------------------------------------------------------

// One round a week (docs/TOUR-PLAN.md step 2): nine holes on one of the
// courses that come with the game, the weeks going round them in turn. Its
// weather (rolled in the game from its seed: tourplay.js roundWeather) and
// its pins (the week's number for their day) are the same for everyone.
// One go: stroke play, no restarts, mulligans or gimmes, no skill points
// (a season by post's fixed round - course/seasonpost.js); begun once, and
// sent as it finishes.
export const ROUND_HOLES = 9;
// Each: its id and name; from - the first week it's in the rotation; and
// scorecard - its first nine holes, [par, yards] each, as the game makes it.
// The scorecard is the version the Tour's played on: a game whose course
// makes anything else is told to update before it can begin the round,
// and so is one that can't make the course at all (the owner, 19 November
// 2026: "tour play must have the right version to join ... ensure people
// either have the map or know they need to update to get on the tour").
// (test/tourcourse.test.mjs: each scorecard is what the game makes now.)
//
// A new course: added with `from` at least five weeks after it's merged,
// so the version that makes it can be built and out before it's among the
// next TOUR_AHEAD weeks the panel shows - from then, a game without it is
// told ahead of its week to update. Changing an existing course's first
// nine changes its scorecard here too: every player needs that version
// for the round from the moment the relay has it.
//
// And edition, editionFrom: the course's edition (sim/shown.mjs EDITIONS:
// each improvement round that changes a course that comes with the game
// moves it on - test/tourcourse.test.mjs holds them the same) and the week
// the round's played on it from (roundEdition: the edition before till
// then), so everyone in a week's round plays the same holes (the owner, 23
// November 2026: "another improvement round ... would require all users to
// update to ensure seeing the same things"). A game with an older edition
// is told to update, ahead of that week, and the relay won't begin its
// round. editionFrom at least five weeks after the round's merged, as a
// new course's `from` is: a merge puts the relay up before any version
// with the new edition is built.
export const TOUR_COURSES = [
  { id: "hillside-park", name: "Hillside Park", from: 0, edition: 2, editionFrom: 2973, scorecard: [[4, 395], [4, 460], [3, 130], [5, 495], [4, 360], [4, 245], [5, 590], [3, 230], [4, 435]] },
  { id: "links-by-the-sea", name: "Links by the Sea", from: 0, edition: 2, editionFrom: 2973, scorecard: [[4, 395], [4, 470], [3, 235], [4, 430], [4, 365], [5, 490], [4, 250], [3, 130], [5, 590]] },
  { id: "nine-oaks-mountain", name: "Nine Oaks Mountain", from: 0, edition: 2, editionFrom: 2973, scorecard: [[4, 395], [4, 245], [5, 495], [4, 430], [3, 130], [4, 370], [5, 590], [3, 235], [4, 470]] },
  { id: "sea-links", name: "Sea Links", from: 0, edition: 2, editionFrom: 2973, scorecard: [[4, 400], [4, 430], [3, 125], [4, 270], [4, 465], [5, 495], [4, 370], [3, 225], [5, 595]] },
  { id: "golf-sim-links", name: "Golf Sim Links", from: 0, edition: 2, editionFrom: 2973, scorecard: [[4, 395], [5, 525], [4, 370], [4, 360], [3, 130], [4, 465], [4, 445], [5, 565], [3, 190]] },
];
// How many weeks ahead the Tour says which course is coming (the owner:
// "we should ensure we know the path of the next 4 tour courses").
export const TOUR_AHEAD = 4;
// The courses in the rotation in week n: those whose week has come.
export const tourCoursesIn = (n) => TOUR_COURSES.filter((c) => (c.from ?? 0) <= n);
// A scorecard as holes ([{ par, yards }]).
export const scorecardHoles = (card) => (Array.isArray(card) ? card.map(([par, yards]) => ({ par, yards })) : null);
// The scorecard the Tour plays a course on, as holes - null for one it
// hasn't (a course from a later version than this copy).
export const tourScorecard = (id) => scorecardHoles(TOUR_COURSES.find((c) => c.id === id)?.scorecard);
// An edition as said (1: one from before courses had them, or none said).
export const goodEdition = (e) => (Number.isInteger(e) && e >= 1 && e < 1000 ? e : 1);
// The edition of a Tour course (TOUR_COURSES' entry) the round's played on
// in week n: its edition from its week, the one before till then.
export const roundEdition = (c, n) => {
  const e = goodEdition(c?.edition);
  return n >= (c?.editionFrom ?? 0) ? e : Math.max(1, e - 1);
};
export function weekRound(n) {
  const list = tourCoursesIn(n);
  const c = list[((n % list.length) + list.length) % list.length];
  const rand = weekDraw(n, 3);
  return { week: n, course: c.id, name: c.name, holes: ROUND_HOLES, seed: 1 + Math.floor(rand() * 0x7ffffff), pin: n, scorecard: scorecardHoles(c.scorecard), edition: roundEdition(c, n) };
}
// The next weeks' rounds after week n: [{ week, course, name, start,
// scorecard, edition }], soonest first.
export function tourAhead(n, ahead = TOUR_AHEAD) {
  return Array.from({ length: ahead }, (_, i) => {
    const r = weekRound(n + 1 + i);
    return { week: r.week, course: r.course, name: r.name, start: weekStart(r.week), scorecard: r.scorecard, edition: r.edition };
  });
}
// Whether a course as this game has it is the edition the Tour's round is
// played on (or a later one): its edition (sim/shown.mjs, stamped on it as
// it's served) at least the round's.
export const editionFits = (course, edition = 1) => goodEdition(course?.edition) >= goodEdition(edition);
// Whether a course as this game makes it is the one the Tour plays: its
// first nine holes' pars and yards those of the scorecard - and its
// edition the round's (editionFits).
export function courseFits(course, scorecard, edition = 1) {
  const holes = Array.isArray(course?.holes) ? course.holes.slice(0, ROUND_HOLES).map((h) => ({ par: h?.spec?.par, yards: h?.spec?.yards })) : null;
  return !!scorecard && !!holes && holes.length === scorecard.length && holes.every((h, i) => h.par === scorecard[i].par && h.yards === scorecard[i].yards) && editionFits(course, edition);
}
// A round begun before its week closed can be sent for this long after.
export const ROUND_LATE_MS = 12 * 3600 * 1000;
export const roundOpen = (n, now = Date.now()) => now >= weekStart(n) && now < weekEnd(n) + ROUND_LATE_MS;
export const roundLine = (r) => `${r.name}, the first ${r.holes} holes${r.par ? `, par ${r.par}` : ""} - the same weather and pins for everyone`;

// A round's holes as the game has them ([{ par, yards }]), checked: the
// first player's copy is the week's, and anyone's that differs isn't the
// same round. -> the holes made sound, or null.
export function cleanHoles(holes) {
  if (!Array.isArray(holes) || holes.length !== ROUND_HOLES) return null;
  const out = holes.map((h) => (h && Number.isInteger(h.par) && h.par >= 3 && h.par <= 6 && Number.isInteger(h.yards) && h.yards >= 50 && h.yards <= 900 ? { par: h.par, yards: h.yards } : null));
  return out.every(Boolean) ? out : null;
}
export const sameHoles = (a, b) => !!a && !!b && a.length === b.length && a.every((h, i) => h.par === b[i].par && h.yards === b[i].yards);

// A player's handicap on the round: their index's share for nine holes (a
// season by post's playingHandicap; none plays off NO_INDEX).
export const NO_INDEX = 18;
export const goodIndex = (i) => typeof i === "number" && Number.isFinite(i) && i >= -10 && i <= 54;
export const roundHandicap = (index, holes = ROUND_HOLES) => Math.round(((goodIndex(index) ? index : NO_INDEX) * holes) / 18);
// The flights of handicaps, each with a board of its own (gross).
export const FLIGHTS = ["Handicap 9 and under", "Handicap 10 - 18", "Handicap 19 - 28", "Handicap 29 and over, or none"];
export const flightOf = (index) => (!goodIndex(index) ? 3 : index < 10 ? 0 : index < 19 ? 1 : index < 29 ? 2 : 3);
// The round's boards: the world's (gross), net, and each flight's.
export const ROUND_BOARDS = ["world", "net", ...FLIGHTS.map((_, i) => `f${i}`)];

// A round's scores, sent: nine, each a hole's strokes or null (not
// finished - par and 3, as a season by post's). -> { gross, toPar, scores }
// or null when they aren't a round's.
export const NOT_FINISHED = 3;
export function roundScore(scores, holes) {
  if (!Array.isArray(scores) || scores.length !== ROUND_HOLES || !holes) return null;
  let gross = 0;
  const out = [];
  for (let i = 0; i < ROUND_HOLES; i++) {
    const x = scores[i];
    if (x != null && !(Number.isInteger(x) && x >= 1 && x <= 20)) return null;
    out.push(x ?? null);
    gross += x ?? holes[i].par + NOT_FINISHED;
  }
  const par = holes.reduce((a, h) => a + h.par, 0);
  return { gross, toPar: gross - par, scores: out };
}
// "+3", "-1", "E".
export const toParWords = (n) => (n === 0 ? "E" : n > 0 ? `+${n}` : String(n));

// ---- The season ---------------------------------------------------------------------------

// Twelve weeks a season (docs/TOUR-PLAN.md step 3), the first beginning the
// week the round did. Each week's round gives points for its place in its
// flight, in its division - every season's points (sim/season.mjs pointsAt:
// 500, 300, 190 ... down to 1 for finishing at all, level places sharing
// them) - and a player's best eight weeks count.
export const SEASON_WEEKS = 12;
export const SEASON_BEST = 8;
export const FIRST_SEASON_WEEK = 2967;
// Season 1, 2 ... (0 or less: before there were seasons).
export const seasonOf = (n) => Math.floor((n - FIRST_SEASON_WEEK) / SEASON_WEEKS) + 1;
export const seasonStart = (s) => FIRST_SEASON_WEEK + (s - 1) * SEASON_WEEKS;
export const seasonWeeks = (s) => Array.from({ length: SEASON_WEEKS }, (_, i) => seasonStart(s) + i);
// Which of its twelve a week is: 1 - 12.
export const weekInSeason = (n) => n - seasonStart(seasonOf(n)) + 1;
export const goodSeason = (s) => Number.isInteger(s) && s >= 1 && s < 5000;
// "16 November - 7 February".
export function seasonWords(s) {
  const a = new Date(weekStart(seasonStart(s)));
  const b = new Date(weekEnd(seasonStart(s) + SEASON_WEEKS - 1) - DAY_MS);
  return `${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]} - ${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]}`;
}
// (sim/season.mjs's own: test/tour.test.mjs holds them the same.)
const SEASON_POINTS = [500, 300, 190, 135, 110, 100, 90, 85, 80, 75, 70, 65, 60, 57, 55, 53, 51, 49, 47, 45, 43, 41, 39, 37, 35, 34, 32, 31, 29, 28];
export const seasonPoints = (place) => (place <= SEASON_POINTS.length ? SEASON_POINTS[place - 1] : Math.max(1, 28 - (place - SEASON_POINTS.length)));

// The season's table, from each account's rounds in it:
//   accounts: [{ who, name, weeks: { [week]: { division, flight, gross } } }]
// -> { monitor: [row], swing: [row] }, each best first - row: { who, name,
// total (its best SEASON_BEST weeks'), played, points: { [week]: points },
// counted: [the weeks counted], place } (level totals share a place).
export function seasonTable(accounts) {
  // Each week, division and flight's field, its grosses in order.
  const field = new Map();
  const add = (k, g) => (field.has(k) ? field.get(k).push(g) : field.set(k, [g]));
  for (const a of accounts ?? []) for (const [w, r] of Object.entries(a?.weeks ?? {})) if (r && Number.isFinite(r.gross)) add(`${w}:${r.division}:${r.flight}`, r.gross);
  for (const list of field.values()) list.sort((x, y) => x - y);
  // A place: one more than how many had fewer strokes.
  const placeIn = (k, g) => {
    const list = field.get(k);
    let lo = 0;
    let hi = list.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid] < g) lo = mid + 1;
      else hi = mid;
    }
    return lo + 1;
  };
  const out = Object.fromEntries(DIVISION_ORDER.map((d) => [d, []]));
  for (const a of accounts ?? []) {
    const by = {};
    for (const [w, r] of Object.entries(a?.weeks ?? {})) {
      if (!r || !Number.isFinite(r.gross) || !out[r.division]) continue;
      (by[r.division] ??= {})[w] = seasonPoints(placeIn(`${w}:${r.division}:${r.flight}`, r.gross));
    }
    for (const [d, points] of Object.entries(by)) {
      const best = Object.entries(points)
        .sort((x, y) => y[1] - x[1] || Number(x[0]) - Number(y[0]))
        .slice(0, SEASON_BEST);
      out[d].push({ who: a.who, name: a.name, total: best.reduce((t, [, p]) => t + p, 0), played: Object.keys(points).length, points, counted: best.map(([w]) => Number(w)) });
    }
  }
  for (const rows of Object.values(out)) {
    rows.sort((x, y) => y.total - x.total || x.played - y.played || String(x.name).localeCompare(String(y.name)));
    let place = 0;
    rows.forEach((r, i) => (r.place = i && rows[i - 1].total === r.total ? place : (place = i + 1)));
  }
  return out;
}

// The week's green in words: "12 ft, 1.5% uphill, breaks 2% to the left,
// gentle contours, Stimp 10".
export function greenLine(g) {
  const parts = [`${g.distanceFt} ft`];
  if (g.uphill) parts.push(`${Math.abs(g.uphill)}% ${g.uphill > 0 ? "uphill" : "downhill"}`);
  if (g.fallRight) parts.push(`breaks ${Math.abs(g.fallRight)}% to the ${g.fallRight > 0 ? "right" : "left"}`);
  if (g.contours && g.contours !== "none") parts.push(`${g.contours} contours`);
  parts.push(`Stimp ${g.stimp}`);
  return parts.join(", ");
}
export function upDownLine(u) {
  const ys = u.holes.map((h) => h.yards);
  return `${u.holes.length} chips in turn, ${Math.min(...ys)} to ${Math.max(...ys)} yards, each putted out - Stimp ${u.stimp}`;
}

// ---- A week's card: 50 shots ------------------------------------------------------------

// Each event's shots a week, for each account on each board: played as and
// when it likes - each go counted as it's played, the card kept on the
// relay, so what's left is there next time (and on another device). On
// this week's green a go is a putt; in up and down it's a chip and the
// putts after it.
export const SHOTS = 50;
// The two boards each event has in each division, of its cards.
export const MEASURES = {
  made: { name: "Most made", short: "Made" },
  streak: { name: "Longest streak", short: "Longest streak" },
};
export const MEASURE_ORDER = ["made", "streak"];
export const goodMeasure = (m) => Object.prototype.hasOwnProperty.call(MEASURES, m);

// What a go can be, a letter each:
//   putt    h holed, m missed;
//   updown  c a chip-in (made, and a life earned), u up and down (the chip
//           and one putt), s saved (two putts, a life spent on the second),
//           x not down (off the green, a putt missed with no life, or the
//           second missed too).
export const GOES = { putt: "hm", updown: "cusx" };
const MADE = { h: 1, c: 1, u: 1, s: 1 };

// A card: { shots, made, streak (the longest of them in a row), run (in a
// row now: carried to the next go, next time too), lives (up and down's:
// the run's), log (each go's letter) }.
export const newCard = () => ({ shots: 0, made: 0, streak: 0, run: 0, lives: 0, log: "" });
const whole = (v, most) => (Number.isInteger(v) && v >= 0 ? Math.min(v, most) : 0);
// A card as it's to be read, whatever else is kept with it.
export const cardOf = (c) => ({ shots: whole(c?.shots, SHOTS), made: whole(c?.made, SHOTS), streak: whole(c?.streak, SHOTS), run: whole(c?.run, SHOTS), lives: whole(c?.lives, SHOTS), log: typeof c?.log === "string" ? c.log.slice(0, SHOTS) : "" });
// A go played on it: the card after - the card as it was when the go isn't
// one, or its 50 are played. Made, it's one more in a row (a chip-in earns
// a life, a saved two-putt spends one); not, the run and its lives are
// over. A two-putt with no life in hand isn't saved.
export function cardWith(card, event, r) {
  const c = cardOf(card);
  if (c.shots >= SHOTS || typeof r !== "string" || r.length !== 1 || !GOES[event]?.includes(r)) return c;
  const go = r === "s" && c.lives < 1 ? "x" : r;
  let { made, run, lives } = c;
  if (MADE[go]) {
    made += 1;
    run += 1;
    if (go === "c") lives += 1;
    if (go === "s") lives -= 1;
  } else {
    run = 0;
    lives = 0;
  }
  return { shots: c.shots + 1, made, streak: Math.max(c.streak, run), run, lives, log: c.log + go };
}
export const cardAfter = (card, event, goes) => goes.reduce((c, r) => cardWith(c, event, r), cardOf(card));
export const cardDone = (card) => (card?.shots ?? 0) >= SHOTS;

// A go as it's sent: { id, r, d } - id: the device's own name for it (sent
// twice, it's counted once), r: its letter, d: what it was -
//   putt    [speed (mph), line (degrees), aim (degrees: the line the putt
//           was aimed along, which the line's from - sent since step 4, so
//           the relay can roll it again: rollsIn below)]
//   updown  [the chip's leave (feet: 0 a chip-in, -1 off the green), putts]
// -> the go made sound to keep (d rounded, or null when it's not there or
// not sense), or null when it isn't a go.
const num = (v, lo, hi) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
export function cleanGo(event, go) {
  if (!go || typeof go !== "object") return null;
  if (typeof go.id !== "string" || !/^[A-Za-z0-9_-]{4,24}$/.test(go.id)) return null;
  if (typeof go.r !== "string" || go.r.length !== 1 || !GOES[event]?.includes(go.r)) return null;
  const d = Array.isArray(go.d) ? go.d : [];
  const r1 = (v) => Math.round(v * 10) / 10 || 0;
  let kept = null;
  if (event === "putt" && num(d[0], 0.3, 40) && num(d[1], -45, 45)) kept = num(d[2], -45, 45) ? [r1(d[0]), r1(d[1]), r1(d[2])] : [r1(d[0]), r1(d[1])];
  if (event === "updown" && num(d[0], -1, 300) && [0, 1, 2].includes(d[1])) kept = [r1(d[0]), d[1]];
  return { id: go.id, r: go.r, d: kept };
}

// ---- Keeping it honest ---------------------------------------------------------------
// (docs/TOUR-PLAN.md, "Keeping it honest" - step 4.) The relay can't see a
// shot hit; what it can do: turn down what can't be, roll a holed putt
// again itself (relay/tourcheck.mjs), and hold back what's out of the
// ordinary - shown to its player, kept off the boards until the owner's
// looked (released, or hidden).

// A go that doesn't add up, or null: up and down's letter and its putts
// (a chip-in is no putts, an up and down one, a save two).
const PUTTS_OF = { c: 0, u: 1, s: 2 };
export function goDoubt(event, go) {
  if (event !== "updown" || !Array.isArray(go?.d) || !(go.r in PUTTS_OF)) return null;
  return go.d[1] === PUTTS_OF[go.r] ? null : "a go whose putts don't add up";
}

// Out of the ordinary on a week's event: { made, streak } - a card with
// either at or past it is held for a look. The week's putt is between 6
// and 22 feet: the longer, the fewer holed in a good week.
export function holdAt(event, setup) {
  if (event === "putt") {
    const ft = setup?.putt?.distanceFt ?? 10;
    return ft <= 8 ? { made: 48, streak: 40 } : ft <= 12 ? { made: 44, streak: 30 } : ft <= 16 ? { made: 38, streak: 20 } : { made: 32, streak: 15 };
  }
  return { made: 45, streak: 30 };
}
// Why a card's held, or null (cleared: the owner's looked at it already).
export function cardHold(event, card, setup, { cleared = false } = {}) {
  if (cleared) return null;
  const c = cardOf(card);
  const at = holdAt(event, setup);
  if (c.made >= at.made) return `${c.made} of ${SHOTS}`;
  if (c.streak >= at.streak) return `${c.streak} in a row`;
  return null;
}
// The week's round: in under ROUND_QUICK_MS from begun (nine holes in
// minutes), or ROUND_HOLD_TO_PAR or better, is held for a look.
export const ROUND_QUICK_MS = 9 * 60 * 1000;
export const ROUND_HOLD_TO_PAR = -9;
export function roundHold({ began, sent, toPar }, { cleared = false } = {}) {
  if (cleared) return null;
  if (sent - began < ROUND_QUICK_MS) return `nine holes in ${Math.max(1, Math.round((sent - began) / 60000))} minutes`;
  if (toPar <= ROUND_HOLD_TO_PAR) return `${toParWords(toPar)} for nine holes`;
  return null;
}
// What a player's told about a held entry of theirs.
export const HELD_WORDS = "Held for a look - out of the ordinary, so it's checked before it goes on the board";
// Why a score can be reported (the owner reads them).
export const REPORT_WHY = { score: "The score can't be right", name: "The name isn't fit to show", other: "Something else" };
export const goodWhy = (w) => Object.prototype.hasOwnProperty.call(REPORT_WHY, w);

// ---- Names ----------------------------------------------------------------------------

export const NO_NAME = "A player";
// Never shown on a board (a short list: the worst of what turns up).
const NOT_SHOWN = ["fuck", "shit", "cunt", "nigg", "fagg", "bitch", "wank", "twat", "rape", "nazi", "hitler", "penis", "vagina", "porn"];
// A player's name as a board shows it: tidy, short, and never an email
// address or one of the words that aren't shown.
export function boardName(name) {
  const s = String(name ?? "")
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
  if (!s || s.includes("@")) return NO_NAME;
  const plain = s.toLowerCase().replace(/[^a-z]/g, "");
  return NOT_SHOWN.some((w) => plain.includes(w)) ? NO_NAME : s;
}

// ---- A board --------------------------------------------------------------------------

// A board (one for each measure of an event's cards in a division):
// { count, hist: { score: how many }, top: [{ who, name, score, at, shots }] }
// - the count and a tally of the scores (so a place is counted without
// every card in hand), and its top places (shots: how many of the 50
// they've played).
export const TOP = 20;
export const newBoard = () => ({ count: 0, hist: {}, top: [] });
// Whether score a beats b on this event.
export const beats = (event, a, b) => (EVENTS[event]?.low ? a < b : a > b);
// The order of a board: the better score, then in fewer shots, then
// whoever got there first.
const inOrder = (event) => (a, b) => (a.score !== b.score ? (beats(event, a.score, b.score) ? -1 : 1) : (a.shots ?? 0) !== (b.shots ?? 0) ? (a.shots ?? 0) - (b.shots ?? 0) : a.at - b.at);

// A place on it: 1 and how many have a better score (level scores share).
export function placeOf(board, event, score) {
  let better = 0;
  for (const [s, n] of Object.entries(board?.hist ?? {})) if (beats(event, Number(s), score)) better += n;
  return better + 1;
}

// An account's card as it is now, put on the board (was: its score there
// before, { score }, or null - new to it): -> the board after. The same
// score as before keeps its place in the order (when it got there), with
// its shots and name brought up to date.
export function boardWith(board, event, entry, was = null) {
  const b = { count: board?.count ?? 0, hist: { ...(board?.hist ?? {}) }, top: [...(board?.top ?? [])] };
  const old = b.top.find((e) => e.who === entry.who);
  const same = !!was && was.score === entry.score;
  if (was && !same) {
    const n = (b.hist[was.score] ?? 0) - 1;
    if (n > 0) b.hist[was.score] = n;
    else delete b.hist[was.score];
  } else if (!was) b.count += 1;
  if (!same) b.hist[entry.score] = (b.hist[entry.score] ?? 0) + 1;
  if (same && !old) return b;
  const at = same ? old.at : entry.at;
  b.top = [...b.top.filter((e) => e.who !== entry.who), { who: entry.who, name: entry.name, score: entry.score, at, shots: entry.shots ?? 0 }].sort(inOrder(event)).slice(0, TOP);
  return b;
}

// An account taken off a board (held, or hidden by the owner): its score
// out of the tally and its place out of the top.
export function boardWithout(board, who, score) {
  const b = { count: board?.count ?? 0, hist: { ...(board?.hist ?? {}) }, top: [...(board?.top ?? [])] };
  if (score == null) return b;
  const n = (b.hist[score] ?? 0) - 1;
  if (n > 0) b.hist[score] = n;
  else delete b.hist[score];
  b.count = Math.max(0, b.count - 1);
  b.top = b.top.filter((e) => e.who !== who);
  return b;
}

// A board as anyone may see it: { count, top: [{ place, name, score,
// shots }] } - never who (an account's id, hashed though it is).
export function boardView(board, event) {
  const b = board ?? newBoard();
  return { count: b.count, top: b.top.map((e) => ({ place: placeOf(b, event, e.score), name: e.name, score: e.score, shots: e.shots ?? 0 })) };
}

// "3rd", "21st", "112th".
export function ordinal(n) {
  const t = n % 100;
  const s = t >= 11 && t <= 13 ? "th" : ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"][n % 10];
  return `${n}${s}`;
}
// "3rd of 212" - "1st of 1" is said as it is: nobody's made up.
export const placeWords = (place, count) => `${ordinal(place)} of ${count}`;

// ---- A run of up and downs ------------------------------------------------------------

// Each chip and its putts as they're played (the Tour's go by go, each
// go's letter from how it ended; practice's runs). The run as it goes:
// { made, lives, holes: [[leaveFt, putts]], on: the hole being played -
// null between holes, or { leaveFt, putts so far, spent: a life's been
// used on it } }, over.
export const newUpDown = () => ({ made: 0, lives: 0, holes: [], on: null, over: false });

// A chip played: holed (a chip-in: the up and down's made, and a life
// earned), or left `leaveFt` from the hole to putt - `on` the green or not
// (off it, there's no putt: the up and down's missed).
export function afterChip(run, { holed = false, leaveFt = 0, onGreen = true } = {}) {
  if (run.over) return run;
  if (holed) return { ...run, made: run.made + 1, lives: run.lives + 1, holes: [...run.holes, [0, 0]], on: null, said: "chipin" };
  if (!onGreen) return { ...run, on: null, over: true, said: "off" };
  // (first: the chip's leave, as the run's record keeps it - never nought,
  // which is a chip-in's.)
  return { ...run, on: { leaveFt, first: Math.max(0.1, Math.round(leaveFt * 10) / 10), putts: 0, spent: false }, said: "putt" };
}
// A putt played: holed - the up and down's made; missed with a life in
// hand and none spent on this hole - the life's spent, and it's putted
// again from where it finished (leaveFt); missed otherwise - the run's over.
export function afterPutt(run, { holed = false, leaveFt = 0 } = {}) {
  if (run.over || !run.on) return run;
  const putts = run.on.putts + 1;
  if (holed) return { ...run, made: run.made + 1, holes: [...run.holes, [run.on.first, putts]], on: null, said: putts === 2 ? "saved" : "made" };
  if (run.lives > 0 && !run.on.spent) return { ...run, lives: run.lives - 1, on: { ...run.on, leaveFt, putts, spent: true }, said: "life" };
  return { ...run, on: null, over: true, said: "missed" };
}
