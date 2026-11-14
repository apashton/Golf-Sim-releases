// Match ladders (docs/LADDER-PLAN.md): one against one match play on a
// ladder of rungs. Challenge someone up to REACH rungs above you; beat them
// and take their rung. An Elo rating works underneath (sim/elo.mjs): the
// odds, what a win is worth, a newcomer's start; on a handicap ladder the
// strokes come from each player's ladder handicap (sim/ladderhcp.mjs).
//
// A ladder is kept as its settings and a list of what happened (events):
// who joined, each challenge, its acceptance, its result... Everything else
// - the rungs, ratings, handicaps, open challenges, the honours board - is
// worked out from them by ladderState, the same on every bay, so a result
// voided or a rule changed is just the list read again.
//
// Four ways to play a ladder:
//   - at the bay: friends sharing this PC; a match is played there and then
//   - solo: against season mode's made-up golfers, one to a rung
//     (sim/season.mjs), their scores worked out hole by hole; the field
//     plays among itself each week
//   - live: friends online, both playing at once (step 3 of the plan)
//   - postal: each plays the same course, cups and weather when they like,
//     in one go, the scores hidden until both have played (the store keeps
//     them: relay/ladders.mjs), then the reveal (sim/postal.mjs). Its log
//     says who's begun their round and who's played it ("begin",
//     "played"), not the scores; a hole not played is lost.
// The online two have deadlines (TIMED): a challenge not accepted within
// two days is a walkover, one accepted but not played in seven lapses (on
// a Postal ladder, a walkover to the one who played their round, if only
// one did), and a player three weeks without a match slides down a rung a
// week unless they're away.
//
// Pure: course/matchladder.js shows a ladder at the bay and solo, and plays its
// matches as course rounds.

import { hardestFirst } from "./handicap.mjs";
import { START, rate, startRating, expected } from "./elo.mjs";
import { ladderIndex } from "./ladderhcp.mjs";
import { makeField, simRound } from "./season.mjs";

export const KINDS = ["handicap", "scratch"];
export const KIND_NAMES = { handicap: "Handicap", scratch: "Scratch" };
export const KIND_HELP = {
  handicap: "Strokes from each player's ladder handicap, given on the hardest holes: anyone can beat anyone - who's playing best right now.",
  scratch: "No strokes: who's the best.",
};
export const PLAYS = ["bay", "solo", "live", "postal"];
export const PLAY_NAMES = { bay: "At the bay", solo: "Solo", live: "Live", postal: "Postal" };
export const PLAY_HELP = {
  bay: "Friends sharing this PC: a challenge is played there and then.",
  solo: "Against made-up golfers, one to a rung, round your handicap.",
  live: "Friends online, both playing at once.",
  postal: "Friends online, each playing the same course when they like - the scores hidden until both have played.",
};
// The ways online, with deadlines and the idle slide.
export const TIMED = new Set(["live", "postal"]);
// Where a ladder lives (the owner, 1 November 2026: "It should be mainly
// used for playing against other people online, in the same ways the play
// online thing is"): the Course tab's are played on this PC - at the bay,
// or solo against made-up golfers; the Online tab's against other people
// online - live, or by post. Each tab makes only its own kinds, so a live
// ladder can't come out a made-up golfers' one by a slip.
export const SCOPE_PLAYS = Object.freeze({ offline: Object.freeze(["bay", "solo"]), online: Object.freeze(["live", "postal"]) });
export const ladderScope = (L) => (L?.online || TIMED.has(L?.play) ? "online" : "offline");
// A tab's ladders, in the list's order.
export const scopeLadders = (list, scope) => (list ?? []).filter((L) => ladderScope(L) === scope);
// The ladder a tab shows: the one last used, if it's the tab's, else its
// first - or null with none.
export function scopeLadder(list, current, scope) {
  const mine = scopeLadders(list, scope);
  return mine.find((L) => L.id === current) ?? mine[0] ?? null;
}
export const WAYS = ["monitor", "madeup", "any"];
export const WAY_NAMES = { monitor: "Launch monitor", madeup: "Mouse, finger or controller", any: "Any way (handicap only)" };
// The level everyone swings at on a mouse, finger or controller ladder.
export const LEVELS = ["beginner", "amateur", "pro", "tour"];
export const DEFAULT_LEVEL = "amateur";
export const HOLE_CHOICES = [9, 18];
export const DEFAULT_HOLES = 9;
// A putt this close (feet) is given (0: none).
export const GIMME_CHOICES = [0, 2, 3];
export const DEFAULT_GIMME = 2;
export const SEASONS = ["month", "quarter"];
export const SEASON_NAMES = { month: "A month", quarter: "Three months" };
export const DEFAULT_SEASON = "month";
// An online ladder's places (the owner, 7 November 2026: "make joining
// ladders etc really easy and even doable with strangers. So start lobby
// that waits until filled and then competition can start"): 0, none set -
// its admin lets each player in, and it's under way from the first; else
// that many, each taken at once by whoever joins, and the ladder starts by
// itself when the last one goes - its rungs drawn then (a start event: the
// relay's draw, relay/ladders.mjs startOrder). No challenge counts before
// it. Listed: shown to anyone in the Online tab's open ladders (and on the
// web), not only to those sent its link.
export const PLACE_CHOICES = [0, 4, 6, 8, 12, 16];
export const DEFAULT_PLACES = 0;
export const PLACE_NAMES = { 0: "None set - you let each player in", 4: "4", 6: "6", 8: "8", 12: "12", 16: "16" };

// How far up a challenge reaches: REACH rungs, NEW_REACH in a player's
// first NEWCOMER_MATCHES.
export const REACH = 3;
export const NEW_REACH = 5;
export const NEWCOMER_MATCHES = 3;
// The online ladders' deadlines and rests, in days.
export const RULES = { accept: 2, play: 7, rest: 3, again: 7, idle: 21, awayMost: 28, repeatWindow: 30, repeatFree: 3, declineEvery: 30 };
export const DAY = 24 * 3600 * 1000;
const WEEK = 7 * DAY;
// The made-up golfers on a solo ladder (you're the next rung down).
export const SOLO_FIELD = 9;
// The handicap a player without one plays off.
export const NO_INDEX = 18;
// A standard card, for the made-up golfers' matches among themselves.
const CARD = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5];

const pick = (v, list, fallback) => (list.includes(v) ? v : fallback);

// A new ladder. For a solo one, `around` is your handicap: the made-up
// golfers are drawn round it, the best at the top.
export function newLadder({ id, name, kind = "handicap", play = "bay", way = "monitor", level = DEFAULT_LEVEL, holes = DEFAULT_HOLES, gimme = DEFAULT_GIMME, season = DEFAULT_SEASON, created = Date.now(), seed = 1, around = null, places = DEFAULT_PLACES, listed = false }) {
  const k = pick(kind, KINDS, "handicap");
  const timed = TIMED.has(play);
  const ladder = {
    v: 1,
    id: String(id ?? created.toString(36)),
    name: String(name ?? "Match ladder").slice(0, 40),
    kind: k,
    play: pick(play, PLAYS, "bay"),
    // "Any way" only where strokes even it out.
    way: way === "any" && k !== "handicap" ? "monitor" : pick(way, WAYS, "monitor"),
    level: pick(level, LEVELS, DEFAULT_LEVEL),
    holes: pick(Number(holes), HOLE_CHOICES, DEFAULT_HOLES),
    gimme: pick(Number(gimme), GIMME_CHOICES, DEFAULT_GIMME),
    season: pick(season, SEASONS, DEFAULT_SEASON),
    // (Places only online: at the bay and solo, everyone's on it at once.)
    places: timed ? pick(Number(places), PLACE_CHOICES, DEFAULT_PLACES) : 0,
    created,
    seed: seed >>> 0 || 1,
    events: [],
  };
  // (Listed only with places: one its admin lets players into isn't for
  // strangers to find.)
  if (ladder.places && listed === true) ladder.listed = true;
  if (ladder.play === "solo") {
    const field = makeField(ladder.seed, "level", SOLO_FIELD, { around: Number.isFinite(around) ? around : null }).sort((a, b) => a.hcp - b.hcp);
    for (const g of field) ladder.events.push({ type: "join", t: created, id: g.id, name: g.name, bot: true, own: g.hcp });
  }
  return ladder;
}

const TYPES = new Set(["join", "leave", "challenge", "accept", "decline", "cancel", "result", "void", "away", "begin", "played", "say", "start"]);

// A ladder as kept, made sound (null if it isn't one).
export function cleanLadder(x) {
  if (!x || typeof x !== "object" || !Array.isArray(x.events)) return null;
  const base = newLadder({ ...x, play: x.play === "solo" ? "bay" : x.play });
  return { ...base, play: pick(x.play, PLAYS, "bay"), events: x.events.filter((e) => e && TYPES.has(e.type) && Number.isFinite(e.t)) };
}

// The ladder with one more thing that happened.
export const withEvent = (ladder, ev) => ({ ...ladder, events: [...ladder.events, ev] });

// ---- A match's result -----------------------------------------------------------

// A Postal match's scores: a hole not played (its round ended early) is a
// pick-up, lost to any score - both picked up, halved.
export const PICK_UP = 99;
export const pickUps = (scores, n) => Array.from({ length: n }, (_, i) => (Number.isFinite(scores?.[i]) ? scores[i] : PICK_UP));

// Match play from hole scores: each hole to the lower net score (strokes
// taken off), the match over once one side is more holes up than are left.
// Holes not played (both null) after it's decided don't count; a match
// left unfinished goes to whoever's ahead.
//   { winner: "a" | "b" | null, up, left, played, words }  ("3&2", "1 up",
//   "halved", "2 up after 7")
export function matchResult(scoresA, scoresB, strokesA = [], strokesB = []) {
  const n = Math.max(scoresA.length, scoresB.length);
  let up = 0;
  let played = 0;
  for (let i = 0; i < n; i++) {
    const a = scoresA[i];
    const b = scoresB[i];
    if (!Number.isFinite(a) || !Number.isFinite(b)) break;
    played++;
    const na = a - (strokesA[i] ?? 0);
    const nb = b - (strokesB[i] ?? 0);
    if (na < nb) up++;
    else if (nb < na) up--;
    const left = n - played;
    if (Math.abs(up) > left) return { winner: up > 0 ? "a" : "b", up: Math.abs(up), left, played, words: left ? `${Math.abs(up)}&${left}` : `${Math.abs(up)} up` };
  }
  const left = n - played;
  const winner = up > 0 ? "a" : up < 0 ? "b" : null;
  const words = !winner ? (left ? `all square after ${played}` : "halved") : `${Math.abs(up)} up${left ? ` after ${played}` : ""}`;
  return { winner, up: Math.abs(up), left, played, words };
}

// The strokes on each hole for two players of these indexes over these
// holes ([{ par, yards, si }]): the difference between them, all of it
// (over 9 holes half), to the higher; from the indexes' tenths, rounded
// once. Scratch: none.
//   { a: [..], b: [..], give, to: "a" | "b" | null }
export function matchStrokes(holes, indexA, indexB, kind = "handicap") {
  const zero = holes.map(() => 0);
  if (kind !== "handicap") return { a: zero, b: zero, give: 0, to: null };
  const ia = Number.isFinite(indexA) ? indexA : NO_INDEX;
  const ib = Number.isFinite(indexB) ? indexB : NO_INDEX;
  const share = holes.length === 9 ? 0.5 : holes.length / 18;
  const give = Math.round(Math.abs(ia - ib) * share);
  if (!give) return { a: zero, b: zero, give: 0, to: null };
  const per = byHardest(holes, give);
  return ia > ib ? { a: per, b: zero, give, to: "a" } : { a: zero, b: per, give, to: "b" };
}

// `give` strokes over the holes, the hardest first (the card's stroke
// index, else the longest for its par): one each for every round of them.
function byHardest(holes, give) {
  const n = holes.length;
  const base = Math.floor(give / n);
  const extra = give - base * n;
  const order = holes
    .map((h, i) => ({ i, si: Number.isFinite(h.si) ? h.si : null, hard: (h.yards ?? 0) / (h.par ?? 4) }))
    .sort(hardestFirst)
    .slice(0, extra)
    .map((x) => x.i);
  return holes.map((_, i) => base + (order.includes(i) ? 1 : 0));
}

// ---- Seasons --------------------------------------------------------------------

// When the season holding `t` ends (the first of the next month or
// quarter, UTC), and its name ("October 2026", "Oct - Dec 2026").
export function seasonOf(t, season = DEFAULT_SEASON) {
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  if (season === "quarter") {
    const q = Math.floor(m / 3);
    return { ends: Date.UTC(y, q * 3 + 3, 1), name: `${MONTHS[q * 3].slice(0, 3)} - ${MONTHS[q * 3 + 2].slice(0, 3)} ${y}` };
  }
  return { ends: Date.UTC(y, m + 1, 1), name: `${MONTHS[m]} ${y}` };
}

// ---- The ladder as it stands ----------------------------------------------------

// Everything about a ladder as of `now`, from its events:
//   { rungs: [id], players: { id: player }, open: [match], results: [result],
//     notes: [{ t, words }], honours: [{ season, champion, t }], season }
// player: { id, name, bot, own, rating, played, won, lost, halved, joined,
//   lastMatch, lastDefence, awayUntil, rounds, declinedAt }
// match (open): { match, by, of, t, acceptedAt, holes, strokes, index,
//   begun: { id: t }, played: { id: t } } (+ postal: tees, pin, weather, seed)
// result: { match, t, by, of, winner, words, up, odds, changes: { [id]: d },
//   swapped, walkover }
export function ladderState(ladder, now = Date.now()) {
  const L = ladder;
  const timed = TIMED.has(L.play);
  const players = {};
  const rungs = [];
  const open = new Map();
  const results = [];
  const notes = [];
  const honours = [];
  const blocks = [];
  const pairs = [];
  // Set lines said on online matches (sim/ladderlines.mjs).
  const said = [];
  const voided = new Set(L.events.filter((e) => e.type === "void").map((e) => e.match));
  const events = [...L.events].sort((a, b) => a.t - b.t);
  let nextWeek = L.created + WEEK;
  let week = 0;
  let season = seasonOf(L.created, L.season);
  // A ladder with places waits for them to fill (PLACE_CHOICES): under way
  // from its start event; without places, from the first.
  let started = L.places ? null : L.created;

  const rungOf = (id) => rungs.indexOf(id);
  const indexOf = (id, t) => {
    const p = players[id];
    if (!p) return null;
    if (p.bot) return p.own;
    return ladderIndex(p.rounds, p.own, t).index;
  };
  // The challenger takes the rung: they and everyone between move down one.
  const takeRung = (by, of) => {
    const from = rungOf(by);
    const to = rungOf(of);
    if (from < 0 || to < 0 || to >= from) return false;
    rungs.splice(from, 1);
    rungs.splice(to, 0, by);
    return true;
  };
  const close = (m) => open.delete(m.match);
  // (To the challenger, or on a Postal ladder to whichever played their
  // round: the one challenged keeps their rung.)
  const walkover = (m, t, why, winner = m.by) => {
    close(m);
    const loser = winner === m.by ? m.of : m.by;
    const swapped = winner === m.by && takeRung(m.by, m.of);
    // (Held: the challenger can't come straight back, as after a match.)
    if (winner === m.of && players[m.of]) {
      players[m.of].lastDefence = t;
      blocks.push({ by: m.by, of: m.of, until: t + RULES.again * DAY });
    }
    results.push({ match: m.match, t, by: m.by, of: m.of, winner, words: "walkover", up: 0, odds: null, changes: {}, swapped, walkover: true });
    notes.push({ t, words: `${players[loser]?.name} ${why}: a walkover - ${players[winner]?.name} ${swapped ? `takes rung ${rungOf(m.by) + 1}` : winner === m.of ? `keeps rung ${rungOf(m.of) + 1}` : "stays put"}` });
  };

  // The deadlines, weekly turns and season ends due by `t`, in order.
  const advance = (t) => {
    for (;;) {
      let due = null;
      if (timed) {
        for (const m of open.values()) {
          const at = m.acceptedAt == null ? m.t + RULES.accept * DAY : m.acceptedAt + RULES.play * DAY;
          if (at <= t && (!due || at < due.at)) due = { at, kind: "deadline", m };
        }
      }
      if (nextWeek <= t && (!due || nextWeek < due.at)) due = { at: nextWeek, kind: "week" };
      if (season.ends <= t && (!due || season.ends < due.at)) due = { at: season.ends, kind: "season" };
      if (!due) return;
      if (due.kind === "deadline") {
        if (due.m.acceptedAt == null) walkover(due.m, due.at, "didn't answer in time");
        else if (Object.keys(due.m.played ?? {}).length === 1) walkover(due.m, due.at, "didn't play their round in time", Object.keys(due.m.played)[0]);
        else {
          close(due.m);
          notes.push({ t: due.at, words: `${players[due.m.by]?.name} v ${players[due.m.of]?.name} wasn't played in time - it lapsed` });
        }
      } else if (due.kind === "week") {
        if (timed) idleSlide(due.at);
        if (L.play === "solo") fieldPlays(due.at, week);
        week++;
        nextWeek += WEEK;
      } else {
        if (rungs.length && started != null) honours.push({ season: season.name, champion: rungs[0], t: due.at });
        season = seasonOf(season.ends, L.season);
      }
    }
  };
  // Three weeks without a match, not away: down a rung (one at most a week).
  const idle = (id, t) => {
    const p = players[id];
    if (started == null || !p || (p.awayUntil && p.awayUntil > t)) return false;
    if ([...open.values()].some((m) => m.by === id || m.of === id)) return false;
    return t - Math.max(p.joined, p.lastMatch ?? 0) > RULES.idle * DAY;
  };
  const idleSlide = (t) => {
    for (let i = rungs.length - 2; i >= 0; i--) {
      if (idle(rungs[i], t) && !idle(rungs[i + 1], t)) {
        notes.push({ t, words: `${players[rungs[i]].name} slips a rung: three weeks without a match` });
        [rungs[i], rungs[i + 1]] = [rungs[i + 1], rungs[i]];
      }
    }
  };
  // A solo ladder's field plays among itself: each week one of them takes on
  // the golfer above (both made up), their match worked out hole by hole.
  const fieldPlays = (t, k) => {
    const bots = rungs.map((id, i) => ({ id, i })).filter((x) => x.i > 0 && players[x.id].bot && players[rungs[x.i - 1]].bot);
    if (!bots.length) return;
    const one = bots[(L.seed + k * 7919) % bots.length];
    const by = one.id;
    const of = rungs[one.i - 1];
    const pars = CARD.slice(0, L.holes);
    const holes = pars.map((par, i) => ({ par, yards: par * 110 + i, si: i + 1 }));
    const sa = simRound({ hcp: players[by].own }, pars, (L.seed ^ (k * 2654435761)) >>> 0);
    const sb = simRound({ hcp: players[of].own }, pars, (L.seed ^ (k * 40503 + 17)) >>> 0);
    const s = matchStrokes(holes, players[by].own, players[of].own, L.kind);
    settle({ match: `w${k}`, by, of, t, holes, strokes: { [by]: s.a, [of]: s.b } }, { [by]: sa, [of]: sb }, t);
  };
  // A match's result: the rungs, the ratings, the handicaps' rounds.
  const settle = (m, scores, t) => {
    // (Postal: both rounds played to the end, a hole not played lost.)
    const n = m.holes?.length ?? L.holes;
    const res = L.play === "postal" ? matchResult(pickUps(scores[m.by], n), pickUps(scores[m.of], n), m.strokes?.[m.by], m.strokes?.[m.of]) : matchResult(scores[m.by] ?? [], scores[m.of] ?? [], m.strokes?.[m.by], m.strokes?.[m.of]);
    const winner = res.winner === "a" ? m.by : res.winner === "b" ? m.of : null;
    const a = players[m.by];
    const b = players[m.of];
    const since = t - RULES.repeatWindow * DAY;
    const before = pairs.filter((x) => x.t >= since && ((x.a === m.by && x.b === m.of) || (x.a === m.of && x.b === m.by))).length;
    const r = rate({ ra: a.rating, rb: b.rating, pa: a.played, pb: b.played, score: winner === m.by ? 1 : winner ? 0 : 0.5, up: res.up, weight: before >= RULES.repeatFree ? 0.5 : 1 });
    a.rating = r.a;
    b.rating = r.b;
    for (const [p, w] of [
      [a, winner === m.by],
      [b, winner === m.of],
    ]) {
      p.played++;
      if (w) p.won++;
      else if (!winner) p.halved++;
      else p.lost++;
      p.lastMatch = t;
    }
    pairs.push({ a: m.by, b: m.of, t });
    const rungBefore = { [m.by]: rungOf(m.by) + 1, [m.of]: rungOf(m.of) + 1 };
    const swapped = winner === m.by && takeRung(m.by, m.of);
    if (winner !== m.by) {
      b.lastDefence = t;
      blocks.push({ by: m.by, of: m.of, until: t + RULES.again * DAY });
    }
    for (const id of [m.by, m.of]) {
      const p = players[id];
      if (!p.bot && m.holes?.length) p.rounds.push({ t, holes: m.holes.map((h, i) => ({ par: h.par, yards: h.yards, si: h.si, score: scores[id]?.[i] ?? null })) });
    }
    results.push({ match: m.match, t, by: m.by, of: m.of, winner, words: res.words, up: res.up, odds: r.odds, changes: { [m.by]: r.da, [m.of]: r.db }, swapped, rungBefore, strokes: m.strokes, scores, holes: m.holes });
  };

  for (const ev of events) {
    if (ev.t > now) break;
    advance(ev.t);
    const t = ev.t;
    if (ev.type === "join") {
      if (players[ev.id]) continue;
      const own = Number.isFinite(ev.own) ? ev.own : null;
      players[ev.id] = { id: ev.id, name: String(ev.name ?? ev.id).slice(0, 30), bot: !!ev.bot, own, rating: L.kind === "scratch" ? startRating(own ?? NO_INDEX, L.holes) : START, played: 0, won: 0, lost: 0, halved: 0, joined: t, lastMatch: null, lastDefence: null, awayUntil: null, rounds: [], declinedAt: null };
      rungs.push(ev.id);
    } else if (ev.type === "leave") {
      if (!players[ev.id]) continue;
      for (const m of [...open.values()]) if (m.by === ev.id || m.of === ev.id) close(m);
      rungs.splice(rungOf(ev.id), 1);
      players[ev.id].left = t;
    } else if (ev.type === "challenge") {
      if (!players[ev.by] || !players[ev.of] || open.has(ev.match)) continue;
      // At the bay and solo, a new match does away with one left unplayed.
      if (!timed) for (const m of [...open.values()]) if ([m.by, m.of].some((x) => x === ev.by || x === ev.of)) close(m);
      // Only a challenge the rules allow counts (out of reach, downward, a
      // second one open...): the rules are kept here, in the replay, so an
      // online ladder's store needn't know them.
      if (challengeProblem({ rungs, players, open: [...open.values()], blocks, started }, L, ev.by, ev.of, t)) continue;
      open.set(ev.match, { match: ev.match, by: ev.by, of: ev.of, t, acceptedAt: null, holes: null, strokes: null, index: null, begun: {}, played: {} });
    } else if (ev.type === "accept") {
      const m = open.get(ev.match);
      if (!m || m.acceptedAt != null) continue;
      m.acceptedAt = t;
      m.holes = Array.isArray(ev.holes) ? ev.holes.map((h) => ({ par: h.par, yards: h.yards, si: h.si })) : null;
      m.course = ev.course ?? null;
      // (Postal: what's fixed for both rounds - the tees, the cups' day, the
      // weather and the luck's seed.)
      if (L.play === "postal") {
        m.tees = typeof ev.tees === "string" ? ev.tees : null;
        m.pin = typeof ev.pin === "string" ? ev.pin : null;
        m.weather = ev.weather && typeof ev.weather === "object" ? ev.weather : null;
        m.seed = Number.isFinite(ev.seed) ? ev.seed >>> 0 : null;
      }
      // Both handicaps frozen for the match.
      m.index = { [m.by]: indexOf(m.by, t), [m.of]: indexOf(m.of, t) };
      const s = m.holes ? matchStrokes(m.holes, m.index[m.by], m.index[m.of], L.kind) : null;
      m.strokes = s ? { [m.by]: s.a, [m.of]: s.b } : null;
    } else if (ev.type === "decline") {
      const m = open.get(ev.match);
      if (!m || m.acceptedAt != null) continue;
      const p = players[m.of];
      if (p.declinedAt == null || t - p.declinedAt >= RULES.declineEvery * DAY) {
        p.declinedAt = t;
        close(m);
        notes.push({ t, words: `${p.name} turned down ${players[m.by].name}'s challenge (one a month without it counting)` });
      } else walkover(m, t, "turned it down a second time this month");
    } else if (ev.type === "cancel") {
      const m = open.get(ev.match);
      if (m) close(m);
    } else if (ev.type === "void") {
      // Called off by the admin before a result: nothing to it (a result
      // already in is voided above, in the replay of the result itself).
      const m = open.get(ev.match);
      if (m) {
        close(m);
        notes.push({ t, words: `${players[m.by].name} v ${players[m.of].name}: called off` });
      }
    } else if (ev.type === "result") {
      const m = open.get(ev.match);
      if (!m || m.acceptedAt == null) continue;
      close(m);
      if (voided.has(ev.match)) {
        notes.push({ t, words: `${players[m.by].name} v ${players[m.of].name}: voided` });
        continue;
      }
      if (!m.holes && Array.isArray(ev.holes)) m.holes = ev.holes;
      settle(m, ev.scores ?? {}, t);
    } else if (ev.type === "begin" || ev.type === "played") {
      // A Postal round begun, or played (its scores kept hidden by the store).
      const m = open.get(ev.match);
      if (!m || m.acceptedAt == null || ![m.by, m.of].includes(ev.id)) continue;
      (ev.type === "begin" ? m.begun : m.played)[ev.id] = t;
      if (ev.type === "played") m.begun[ev.id] ??= t;
    } else if (ev.type === "away") {
      const p = players[ev.id];
      if (p) p.awayUntil = Math.min(ev.until ?? t, t + RULES.awayMost * DAY);
    } else if (ev.type === "say") {
      if (players[ev.id] && Number.isInteger(ev.line)) said.push({ t, id: ev.id, match: typeof ev.match === "string" ? ev.match : null, line: ev.line });
    } else if (ev.type === "start") {
      // The places filled (or its admin's Start now): the rungs as drawn -
      // anyone the draw didn't name (joined since) below, as they came -
      // and the three weeks to the idle slide counted from now.
      if (started != null) continue;
      started = t;
      const order = (Array.isArray(ev.order) ? ev.order : []).filter((id, i, a) => rungs.includes(id) && a.indexOf(id) === i);
      const rest = rungs.filter((id) => !order.includes(id));
      rungs.splice(0, rungs.length, ...order, ...rest);
      for (const id of rungs) players[id].joined = t;
      notes.push({ t, words: `The ladder's under way: ${rungs.length} players, the rungs drawn` });
    }
  }
  advance(now);
  // (With places: how many are taken, and whether it's waiting for the rest.)
  const waiting = started == null ? { places: L.places, filled: rungs.length } : null;
  return { rungs, players, open: [...open.values()], results, notes, honours, season, blocks, said: said.slice(-60), started, waiting };
}

// What joining an online ladder did, in words, for the one who joined: a
// place taken (and how many are left to fill), or asked to be let in.
export function joinedWords(ladder, name, now = Date.now()) {
  if (!ladder?.places) return `Asked to join as ${name} - the ladder's admin lets you in`;
  const s = ladderState(ladder, now);
  if (s.waiting) {
    const left = s.waiting.places - s.waiting.filled;
    return `You're in as ${name} - ${s.waiting.filled} of ${s.waiting.places} places taken; it starts when ${left === 1 ? "the last one goes" : `${left} more join`}`;
  }
  return `You're in as ${name} - the ladder's under way: challenge someone above you`;
}

// ---- Who can challenge whom -----------------------------------------------------

// How far up a player can reach now.
export const reachOf = (state, id) => ((state.players[id]?.played ?? 0) < NEWCOMER_MATCHES ? NEW_REACH : REACH);

// Why `by` can't challenge `of` now, or null if they can.
export function challengeProblem(state, ladder, by, of, now = Date.now()) {
  const a = state.players[by];
  const b = state.players[of];
  if (!a || !b || a.left || b.left) return "Not on this ladder";
  if (by === of) return "That's you";
  const ra = state.rungs.indexOf(by);
  const rb = state.rungs.indexOf(of);
  if (rb >= ra) return "Only someone above you";
  if (ladder.places && state.started == null) return "The ladder starts when its places are filled";
  if (ra - rb > reachOf(state, by)) return `More than ${reachOf(state, by)} rungs above`;
  if (TIMED.has(ladder.play)) {
    if (state.open.some((m) => m.by === by || m.of === by)) return "You've a challenge open already";
    if (state.open.some((m) => m.by === of || m.of === of)) return `${b.name} has a challenge open`;
    if (b.awayUntil && b.awayUntil > now) return `${b.name} is away`;
    if (b.lastDefence && now - b.lastDefence < RULES.rest * DAY) return `${b.name} defended in the last ${RULES.rest} days`;
    if (state.blocks.some((x) => x.by === by && x.of === of && x.until > now)) return `You played ${b.name} in the last ${RULES.again} days`;
  }
  return null;
}

// Each player above `by` within reach, and whether they can be challenged:
// [{ id, name, rung, ok, why }].
export function challengeable(state, ladder, by, now = Date.now()) {
  const at = state.rungs.indexOf(by);
  if (at <= 0) return [];
  return state.rungs
    .slice(Math.max(0, at - reachOf(state, by)), at)
    .map((id) => ({ id, name: state.players[id].name, rung: state.rungs.indexOf(id) + 1, why: challengeProblem(state, ladder, by, id, now) }))
    .map((x) => ({ ...x, ok: !x.why }));
}

// A match before it's played: the odds, the strokes, the rung at stake.
//   { odds, rung, strokes, give, to, index: { by, of } }
export function preview(state, ladder, by, of, holes, now = Date.now()) {
  const a = state.players[by];
  const b = state.players[of];
  const ia = a.bot ? a.own : ladderIndex(a.rounds, a.own, now).index;
  const ib = b.bot ? b.own : ladderIndex(b.rounds, b.own, now).index;
  const s = matchStrokes(holes, ia, ib, ladder.kind);
  return { odds: expected(a.rating, b.rating), rung: state.rungs.indexOf(of) + 1, strokes: { [by]: s.a, [of]: s.b }, give: s.give, to: s.to === "a" ? by : s.to === "b" ? of : null, index: { [by]: ia, [of]: ib } };
}

// The head-to-head between two: { a: wins, b: wins, halved }.
export function headToHead(state, a, b) {
  const out = { a: 0, b: 0, halved: 0 };
  for (const r of state.results) {
    if (r.walkover || !((r.by === a && r.of === b) || (r.by === b && r.of === a))) continue;
    if (!r.winner) out.halved++;
    else if (r.winner === a) out.a++;
    else out.b++;
  }
  return out;
}

// A player's ladder handicap now (sim/ladderhcp.mjs), or a made-up
// golfer's own.
export function playerIndex(state, id, now = Date.now()) {
  const p = state.players[id];
  if (!p) return null;
  return p.bot ? { index: p.own, from: "bot", rounds: 0, capped: false } : ladderIndex(p.rounds, p.own, now);
}

// A made-up golfer's scores for a solo match, hole by hole: the same every
// time for that match (its id and the golfer).
export function botScores(ladder, matchId, golfer, pars) {
  let h = ladder.seed >>> 0;
  for (const c of `${matchId}|${golfer.id}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return simRound({ hcp: golfer.own }, pars, h);
}

// A result in a line: "Sam beat Alex 3&2 and takes rung 2", "Alex held off
// Sam 1 up", "Sam and Alex halved".
export function resultWords(state, r) {
  const n = (id) => state.players[id]?.name ?? "?";
  if (r.walkover) return `${n(r.winner ?? r.by)} by a walkover`;
  if (!r.winner) return `${n(r.by)} and ${n(r.of)} halved - ${n(r.of)} keeps rung ${r.rungBefore?.[r.of] ?? "?"}`;
  if (r.winner === r.by) return `${n(r.by)} beat ${n(r.of)} ${r.words}${r.swapped ? ` and takes rung ${r.rungBefore?.[r.of] ?? "?"}` : ""}`;
  return `${n(r.of)} held off ${n(r.by)} ${r.words}`;
}
