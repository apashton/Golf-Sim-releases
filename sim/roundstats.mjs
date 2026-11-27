// Round stats: each course round's fairways hit, greens in regulation,
// putts, up-and-downs and penalties, hole by hole and in total, from the
// shots the round recorded and its scorecard (the round's game line).
// Pure, so a round can be built shot by shot in the tests.
//
// What a course shot holds (shotstats.mjs has the rest):
//   g    { k: "course", id: the round, course: its name, hole, par }
//   lie  where it was played from: "tee", "fairway", "green"...
//   tg   { d, f, made }: yards to the flag before it and after it, and
//        whether it went in
//   sw   "putt" from the green
//   to   where it came to rest: a lie ("fairway", "green", "rough"...),
//        "water", or "cup" when holed
//   pen  the penalty stroke it cost: "water", or "lost" (a lost ball)
//   up   the penalty strokes for declaring the ball unplayable where it
//        came to rest (1, or 2 out of a bunker): on top of pen
// to and pen are recorded from 28 September 2026. Before that, where a shot
// came to rest is read from where the next shot on the hole was played -
// the same place, unless the ball was dropped (a penalty), which shows as
// the next shot starting somewhere other than where this one finished. So
// an old round shows everything but which penalty it was; and a hole whose
// last shot wasn't holed needs the scorecard to say whether the next putt
// was given or the ball picked up.
//
// Counted as:
//   fairway hit     a par 4 or 5's tee shot came to rest on the fairway
//   green in reg.   on the green (or in the hole) in par - 2 strokes or
//                   fewer, penalty strokes included
//   putts           strokes from the green; a gimme (the next putt given)
//                   is one
//   up and down     the green missed in regulation, then from the first
//                   chip or pitch played off the green after that, in the
//                   hole in two strokes or fewer
//   penalties       penalty strokes: water, a lost ball, an unplayable
//                   (and each kind counted; an old round's only as a drop)
//   sand save       from the first greenside bunker shot, in the hole in
//                   two strokes or fewer
//   fairway missed  where the tee shot finished (rough, trees, a bunker,
//                   water, lost) and which way from where it was aimed
//   strokes gained  against a tour player, shot by shot, by kind: off the
//                   tee, approach, around the green, putting
//                   (strokesgained.mjs) - on a finished hole not picked up
// And across a round's holes, approach shots by how far out (how often on
// the green, how close) and putts by how long (how many went in).
// Every stroke of the round counts here as it did on the scorecard - a shot
// taken out of the club numbers as a misread, or a punch, too.

import { dayKey, formatOf, gameFormatOf, dayTest, viewFilter, markOf } from "./statdays.mjs";
import { mean } from "./shotstats.mjs";
import { holeShots, sumByCategory, emptyBands, addToBands, mergeBands, bandsReport, CATEGORIES } from "./strokesgained.mjs";

// A course round picks the ball up after this many strokes (course.js).
export const PICK_UP = 10;
const ON_GREEN = new Set(["green", "cup"]);

const holedShot = (s) => !!s.tg?.made || s.to === "cup";
const fromGreen = (s) => s.lie === "green" || s.sw === "putt";
const aroundGreen = (s) => (s.sw === "chip" || s.sw === "pitch") && !fromGreen(s);

// The strokes a shot's ball cost when declared unplayable where it came
// to rest (server/stats.mjs keeps them as up).
export const unplayableStrokes = (s) => (Number.isInteger(s?.up) && s.up > 0 ? s.up : 0);

// A missed fairway's lie, in the few kinds the breakdown counts.
export const MISS_KINDS = { rough: "Rough", trees: "Trees", bunker: "Fairway bunker", water: "Water", lost: "Lost or out", other: "Elsewhere" };
function missWhere(at) {
  if (at === "semi" || at === "rough" || at === "deep" || at === "fringe" || at === "waste") return "rough";
  if (at === "trees") return "trees";
  if (at === "bunker" || at === "greenside") return "bunker";
  if (at === "water") return "water";
  if (at === "penalty" || at === "lost") return "lost";
  return "other";
}
// Left or right of where it was aimed: its offline, 3 yds or more.
export const MISS_SIDE_YDS = 3;
function sideOf(s) {
  const off = s?.r?.off;
  return !Number.isFinite(off) || Math.abs(off) < MISS_SIDE_YDS ? null : off > 0 ? "right" : "left";
}
// A shot out of a greenside bunker: its lie says so, or a bunker within 40
// yds of the flag.
const sandShot = (s) => s.lie === "greenside" || (s.lie === "bunker" && Number.isFinite(s.tg?.d) && s.tg.d <= 40);

// The ball was dropped between two shots (a penalty): the next one didn't
// start where this one finished.
function dropped(a, b) {
  const f = a.tg?.f;
  const d = b?.tg?.d;
  return Number.isFinite(f) && Number.isFinite(d) && Math.abs(f - d) > 0.5;
}

// One hole: its shots in the order played, its par, and its score from the
// scorecard (null if there's none). `later`: the round has shots on a later
// hole, so this one was finished even without a scorecard.
//   { hole, par, score, putts, fir, gir, upDown, penalties, given,
//     pickedUp, complete, old, sg }
// sg: strokes gained { total, tee, approach, around, putting }, or null.
// fir, gir and upDown are true, false, or null (not a chance: a par 3's
// fairway, the green found in regulation's up and down - or not known).
// level: the handicap strokes gained is measured against (null: the tour).
// yards: the hole's length, when there are no shots to tell it.
export function holeStats(shots, { hole = shots[0]?.g?.hole ?? null, par = shots[0]?.g?.par ?? null, card = null, later = false, level = null, yards = null } = {}) {
  const n = shots.length;
  const teeYards = shots[0]?.lie === "tee" && Number.isFinite(shots[0]?.tg?.d) ? Math.round(shots[0].tg.d) : null;
  const out = { hole, par, yards: teeYards ?? (Number.isFinite(yards) ? yards : null), score: Number.isFinite(card) ? card : null, strokes: n, putts: null, fir: null, gir: null, upDown: null, sandSave: null, teeMiss: null, penaltyKinds: null, penalties: null, given: false, pickedUp: false, complete: false, old: false, sg: null };
  if (!n) return out;
  // Where each shot came to rest, and the penalty it cost.
  const rest = [];
  const pens = [];
  for (let i = 0; i < n; i++) {
    const s = shots[i];
    const next = shots[i + 1];
    let pen = (s.pen ? 1 : 0) + unplayableStrokes(s);
    let at = s.to ?? null;
    if (holedShot(s)) at = "cup";
    else if (!("to" in s)) {
      out.old = true;
      if (next && dropped(s, next)) {
        pen = 1;
        at = "penalty";
      } else if (next) at = next.lie ?? null;
    }
    rest.push(at);
    pens.push(pen);
  }
  const penalties = pens.reduce((a, p) => a + p, 0);
  const strokes = n + penalties;
  const last = n - 1;
  // How the hole ended: holed, the next putt given, or picked up.
  let finished = holedShot(shots[last]);
  if (!finished && Number.isFinite(card)) {
    if (card === strokes + 1 && card <= PICK_UP) {
      out.given = true;
      rest[last] ??= "green";
      finished = rest[last] === "green";
    } else if (card === strokes && strokes >= PICK_UP) {
      out.pickedUp = true;
      finished = true;
    }
  } else if (!finished && card == null && later) {
    if (strokes >= PICK_UP) {
      out.pickedUp = true;
      finished = true;
    } else if (rest[last] === "green") {
      out.given = true;
      finished = true;
    }
  }
  const score = strokes + (out.given ? 1 : 0);
  // All of it recorded: from the tee, finished, and matching the scorecard.
  out.complete = finished && shots[0].lie === "tee" && (out.score == null || out.score === score);
  if (!out.complete) return out;
  out.score = score;
  out.penalties = penalties;
  out.putts = shots.filter(fromGreen).length + (out.given ? 1 : 0);
  if (par >= 4) out.fir = rest[0] == null ? null : rest[0] === "fairway";
  // A fairway missed: where the tee shot finished, and which way it went
  // from where it was aimed (its offline: a bend or a dog-leg run through
  // straight is neither).
  if (out.fir === false) out.teeMiss = { where: shots[0].pen === "lost" || shots[0].pen === "water" ? shots[0].pen : missWhere(rest[0]), side: sideOf(shots[0]) };
  // Each penalty by what it was: water, a lost ball, an unplayable - or
  // only known from the ball being dropped (an old round).
  const kinds = { water: 0, lost: 0, unplayable: 0, dropped: 0 };
  shots.forEach((s, i) => {
    if (s.pen === "water" || s.pen === "lost") kinds[s.pen]++;
    else if (s.pen) kinds.dropped++;
    else if (rest[i] === "penalty") kinds.dropped++;
    kinds.unplayable += unplayableStrokes(s);
  });
  out.penaltyKinds = kinds;
  // On the green in regulation: the strokes it took to get there.
  let taken = 0;
  let reached = null;
  for (let i = 0; i < n; i++) {
    taken += 1 + pens[i];
    if (rest[i] == null && !out.pickedUp) break;
    if (ON_GREEN.has(rest[i])) {
      reached = taken;
      break;
    }
  }
  const knownAll = rest.slice(0, out.pickedUp ? n - 1 : n).every((r) => r != null);
  if (Number.isFinite(par)) out.gir = reached != null ? reached <= par - 2 : knownAll ? false : null;
  // Up and down: after regulation, the first chip or pitch from off the
  // green, then in within two strokes.
  if (out.gir === false) {
    let before = 0;
    for (let i = 0; i < n; i++) {
      if (before >= par - 2 && aroundGreen(shots[i])) {
        out.upDown = score - before <= 2;
        break;
      }
      before += 1 + pens[i];
    }
  }
  // A sand save: from the first greenside bunker shot, in the hole in two
  // strokes or fewer (penalties counted) - whether or not the green was
  // found in regulation.
  {
    let before = 0;
    for (let i = 0; i < n; i++) {
      if (sandShot(shots[i])) {
        out.sandSave = score - before <= 2;
        break;
      }
      before += 1 + pens[i];
    }
  }
  // Strokes gained, shot by shot (not on a hole picked up).
  if (!out.pickedUp && Number.isFinite(par)) {
    const list = holeShots(shots, pens, { par, given: out.given, level });
    if (list) {
      out.sg = sumByCategory(list);
      Object.defineProperty(out, "sgShots", { value: list, enumerable: false });
    }
  }
  return out;
}

// One course round: its shots in time order and its scorecard (the game
// line: { scores, toPar, total, name, complete }), or null. Returns the
// holes and the totals.
// level: the handicap strokes gained is measured against (null: the tour).
export function roundStats(shots, card = null, { level = null } = {}) {
  const byHole = new Map();
  for (const s of shots) {
    const h = s.g?.hole;
    if (!Number.isFinite(h)) continue;
    if (!byHole.has(h)) byHole.set(h, []);
    byHole.get(h).push(s);
  }
  const scores = Array.isArray(card?.scores) ? card.scores : [];
  const numbers = [...new Set([...byHole.keys(), ...scores.map((v, i) => (Number.isFinite(v) ? i + 1 : null)).filter(Boolean)])].sort((a, b) => a - b);
  const lastPlayed = Math.max(0, ...byHole.keys());
  const holes = numbers.map((h) => {
    const list = byHole.get(h) ?? [];
    const cardScore = Number.isFinite(scores[h - 1]) ? scores[h - 1] : null;
    const cardPar = Number.isFinite(card?.pars?.[h - 1]) ? card.pars[h - 1] : null;
    const stats = holeStats(list, { hole: h, par: list[0]?.g?.par ?? cardPar, card: cardScore, later: h < lastPlayed, level, yards: card?.yards?.[h - 1] ?? null });
    if (Number.isFinite(card?.sis?.[h - 1])) stats.si = card.sis[h - 1];
    return stats;
  });
  const played = holes.filter((h) => Number.isFinite(h.score));
  const withPar = played.filter((h) => Number.isFinite(h.par));
  const sum = (list, f) => list.reduce((a, h) => a + f(h), 0);
  const known = (key) => holes.filter((h) => h[key] != null);
  const fir = known("fir");
  const gir = known("gir");
  const ud = known("upDown");
  const putts = known("putts");
  const pens = known("penalties");
  const first = shots[0];
  const sgHoles = holes.filter((h) => h.sg);
  const sg = sgHoles.length ? { ...sumByCategory(sgHoles.flatMap((h) => h.sgShots)), holes: sgHoles.length } : null;
  const bands = emptyBands();
  for (const h of sgHoles) addToBands(bands, h.sgShots);
  // The round's best shot: the one that gained the most.
  let best = null;
  for (const h of sgHoles)
    for (const x of h.sgShots)
      if (!best || x.sg > best.sg) best = { hole: h.hole, par: h.par, score: h.score, cat: x.cat, sg: Math.round(x.sg * 100) / 100, lie: x.lie, d: x.d, f: x.f, made: x.made, club: x.club ?? null };
  return {
    id: first?.g?.id ?? card?.id ?? null,
    t: first?.t ?? card?.t ?? null,
    course: card?.name ?? first?.g?.course ?? null,
    holes,
    played: played.length,
    // How many holes the course has, from the scorecard (null without one).
    of: scores.length || null,
    score: Number.isFinite(card?.total) && card.holes === played.length ? card.total : sum(played, (h) => h.score),
    toPar: Number.isFinite(card?.toPar) && card.holes === played.length ? card.toPar : withPar.length === played.length ? sum(withPar, (h) => h.score - h.par) : null,
    complete: card ? card.complete !== false : null,
    carded: !!card,
    fairways: { hit: fir.filter((h) => h.fir).length, of: fir.length },
    greens: { hit: gir.filter((h) => h.gir).length, of: gir.length },
    putts: { total: sum(putts, (h) => h.putts), holes: putts.length },
    upDowns: { made: ud.filter((h) => h.upDown).length, of: ud.length },
    penalties: { total: sum(pens, (h) => h.penalties), holes: pens.length },
    sandSaves: { made: holes.filter((h) => h.sandSave).length, of: holes.filter((h) => h.sandSave != null).length },
    teeMisses: tallyMisses(holes),
    penaltyKinds: tallyPenalties(holes),
    old: holes.some((h) => h.old),
    rec: first?.rec ?? card?.rec ?? null,
    // Strokes gained over the holes it's known for ({ total, tee, approach,
    // around, putting, holes }), and the approach and putting bands.
    sg,
    bands,
    best,
  };
}

// Fairways missed: { of, left, right, where: { rough, trees, ... } }.
function tallyMisses(holes) {
  const out = { of: 0, left: 0, right: 0, where: Object.fromEntries(Object.keys(MISS_KINDS).map((k) => [k, 0])) };
  for (const h of holes) {
    if (!h.teeMiss) continue;
    out.of++;
    if (h.teeMiss.side) out[h.teeMiss.side]++;
    out.where[h.teeMiss.where]++;
  }
  return out;
}
function tallyPenalties(holes) {
  const out = { water: 0, lost: 0, unplayable: 0, dropped: 0 };
  for (const h of holes) if (h.penaltyKinds) for (const k of Object.keys(out)) out[k] += h.penaltyKinds[k];
  return out;
}
const addUp = (list) => {
  if (!list.length) return null;
  const out = structuredClone(list[0]);
  const add = (a, b) => {
    for (const k of Object.keys(a)) {
      if (typeof a[k] === "object") add(a[k], b[k]);
      else a[k] += b[k] ?? 0;
    }
  };
  for (const x of list.slice(1)) add(out, x);
  return out;
};

// Across rounds: the average score against par and putts and penalties a
// round, and fairways, greens and up-and-downs as a share of every chance.
export function roundAverages(rounds) {
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : null);
  const one = (v) => (Number.isFinite(v) ? Math.round(v * 10) / 10 : null);
  const sum = (f) => rounds.reduce((a, r) => a + f(r), 0);
  const toPar = rounds.filter((r) => Number.isFinite(r.toPar));
  // Only rounds whose every hole's putts are known, so a partly recorded
  // round doesn't pull the average down.
  const fullPutts = rounds.filter((r) => r.putts.holes && r.putts.holes === r.played);
  const puttHoles = sum((r) => r.putts.holes);
  return {
    rounds: rounds.length,
    holes: sum((r) => r.played),
    toPar: one(mean(toPar.map((r) => r.toPar))),
    fairways: pct(sum((r) => r.fairways.hit), sum((r) => r.fairways.of)),
    fairwayChances: sum((r) => r.fairways.of),
    greens: pct(sum((r) => r.greens.hit), sum((r) => r.greens.of)),
    greenChances: sum((r) => r.greens.of),
    puttsPerRound: one(mean(fullPutts.map((r) => r.putts.total))),
    puttsPerHole: puttHoles ? Math.round((100 * sum((r) => r.putts.total)) / puttHoles) / 100 : null,
    upDowns: pct(sum((r) => r.upDowns.made), sum((r) => r.upDowns.of)),
    upDownChances: sum((r) => r.upDowns.of),
    penaltiesPerRound: one(mean(rounds.filter((r) => r.penalties.holes).map((r) => r.penalties.total))),
    sandSaves: pct(sum((r) => r.sandSaves.made), sum((r) => r.sandSaves.of)),
    sandChances: sum((r) => r.sandSaves.of),
    // Every fairway missed, by side and where; every penalty by kind.
    teeMisses: addUp(rounds.map((r) => r.teeMisses)),
    penaltyKinds: addUp(rounds.map((r) => r.penaltyKinds)),
    // Strokes gained a round of 18 holes, by kind, over every hole it's
    // known for; and the approach and putting bands.
    sg: sgPer18(rounds),
    ...bandsShown(rounds),
  };
}

function bandsShown(rounds) {
  const b = bandsReport(mergeBands(rounds.map((r) => r.bands)));
  return { approachBands: b.approach, puttBands: b.putts };
}

function sgPer18(rounds) {
  const withSg = rounds.filter((r) => r.sg);
  const holes = withSg.reduce((a, r) => a + r.sg.holes, 0);
  if (!holes) return null;
  const out = { holes };
  for (const k of ["total", ...CATEGORIES]) out[k] = Math.round((withSg.reduce((a, r) => a + r.sg[k], 0) * 18 * 10) / holes) / 10;
  return out;
}

// The Rounds section of My stats: every course round in view (by its first
// shot's day and format; not on a day left out), newest first, with the
// averages across them - and other play recorded in the Round format (a
// range session or a challenge played as a round), which has no holes to
// work out, listed with its shots and score.
export function roundsReport(shots, games, marks, filter = viewFilter(), now = Date.now(), rounds = roundsInView(shots, games, marks, filter, now)) {
  const f = viewFilter(filter);
  const inDays = dayTest(f, dayKey(now));
  const wanted = new Set(f.formats);
  const shows = (t, format, id) => {
    const day = dayKey(t);
    return !markOf(marks, day, id).out && inDays(day) && wanted.has(format);
  };
  const other = new Map();
  for (const s of shots) {
    const id = s.g?.id;
    if (id && s.g.k !== "course" && s.rec === "r") {
      if (!other.has(id)) other.set(id, []);
      other.get(id).push(s);
    }
  }
  const byId = new Map();
  for (const g of games) if (g.id) byId.set(g.id, g);
  const play = [];
  for (const [id, list] of other) {
    const first = list[0];
    if (!shows(first.t, formatOf(first, marks), id)) continue;
    const g = byId.get(id);
    play.push({ id, kind: first.g.k, t: first.t, to: list.at(-1).t, shots: list.length, score: g?.score ?? null, name: g?.name ?? null });
  }
  play.sort((a, b) => b.t - a.t);
  return { list: rounds.slice(0, 100), averages: roundAverages(rounds), other: play.slice(0, 50), old: rounds.some((r) => r.old) };
}

// A round played with the mouse or a controller: the device and level its
// card says (sw, lv), for that handicap (sim/madeuphcp.mjs).
const swungWith = (card) => (card?.sw ? { sw: card.sw, lv: card.lv ?? null } : {});

// Every course round in view (by its first shot's day and format; not on a
// day left out), newest first - for the Rounds section and the trends.
// level: the handicap strokes gained is measured against (null: the tour).
export function roundsInView(shots, games, marks, filter = viewFilter(), now = Date.now(), { level = null } = {}) {
  const f = viewFilter(filter);
  const inDays = dayTest(f, dayKey(now));
  const wanted = new Set(f.formats);
  const cards = new Map();
  for (const g of games) if (g.kind === "course" && g.id) cards.set(g.id, g);
  const courseRounds = new Map();
  for (const s of shots) {
    const id = s.g?.id;
    if (!id || s.g.k !== "course") continue;
    if (!courseRounds.has(id)) courseRounds.set(id, []);
    courseRounds.get(id).push(s);
  }
  const shows = (t, format, id) => {
    const day = dayKey(t);
    return !markOf(marks, day, id).out && inDays(day) && wanted.has(format);
  };
  const rounds = [];
  for (const [id, list] of courseRounds) {
    const first = list[0];
    if (!shows(first.t, formatOf(first, marks), id)) continue;
    const card = cards.get(id) ?? null;
    rounds.push({ ...roundStats(list, card, { level }), rec: formatOf(first, marks), ...swungWith(card) });
  }
  // A scorecard whose shots weren't recorded (recording was off for them)
  // still shows the round, with its score.
  for (const [id, card] of cards) {
    if (courseRounds.has(id) || !shows(card.t, gameFormatOf(card, marks), id)) continue;
    rounds.push({ ...roundStats([], card, { level }), t: card.t, rec: gameFormatOf(card, marks), ...swungWith(card) });
  }
  rounds.sort((a, b) => (b.t ?? 0) - (a.t ?? 0));
  return rounds;
}
