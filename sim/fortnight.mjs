// The two-week summary at the top of My stats: what improved and what
// slipped over a fortnight, against the last fortnight played before it,
// with how much was played and the bests set.
//
// Fortnights run from a Monday to the Sunday the week after - the same
// fortnights always (counted from Monday 1 January 2024), so a finished
// one always says the same; the one under way is "so far". A player who
// missed a fortnight or two is compared with the last one they played.
//
// The numbers are the trends' (trends.mjs metricList: scoring from the
// course rounds, each club's carry and line, the short game, the practice
// plans' and the challenges' scores), each compared as the trends compare
// their halves: improved or slipped only when the change matters and is
// clear of the ups and downs of single shots, else steady. Each side
// needs half of what a trend needs (6 shots, 2 rounds, 2 games).
//
// Pure: server/stats.mjs adds it to a player's report.

import { dayKey } from "./statdays.mjs";
import { metricList, compareSets, MIN_ITEMS } from "./trends.mjs";

export const FORTNIGHT = 14;

// A calendar day as a whole number of days, and back ("2026-10-05").
export function dayNumber(day) {
  const [y, m, d] = day.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}
export function dayOfNumber(n) {
  const d = new Date(n * 86400000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

// Monday 1 January 2024: the first fortnight's first day.
const EPOCH = dayNumber("2024-01-01");

// Fortnight i: its number, first day and last day.
export function fortnightAt(i) {
  const first = EPOCH + i * FORTNIGHT;
  return { i, from: dayOfNumber(first), to: dayOfNumber(first + FORTNIGHT - 1) };
}
// The fortnight a day ("2026-10-09") is in.
export function fortnightOf(day) {
  return fortnightAt(Math.floor((dayNumber(day) - EPOCH) / FORTNIGHT));
}
// The fortnight a moment falls in (its local day's), by number - asked of
// every shot several times, so each day's is worked out once.
const byDay = new Map();
function indexOf(t) {
  const day = dayKey(t);
  let i = byDay.get(day);
  if (i === undefined) {
    i = Math.floor((dayNumber(day) - EPOCH) / FORTNIGHT);
    if (byDay.size > 20000) byDay.clear();
    byDay.set(day, i);
  }
  return i;
}

// How many each side needs: half a trend's, and never fewer than two.
export const needs = (kind) => Math.max(2, Math.ceil((MIN_ITEMS[kind] ?? 4) / 2));

// How much a change stands out, to put the biggest first: in the number's
// own least change that matters (or a twentieth of where it was).
function standout(m) {
  const unit = m.min || Math.abs(m.earlier) / 20 || 1;
  return Math.abs(m.change) / unit;
}

// The days of fortnights, first to last: what the server works out
// course rounds for.
export function fortnightDays(...list) {
  const out = [];
  for (const f of list) {
    if (!f) continue;
    const first = dayNumber(f.from);
    for (let d = 0; d < FORTNIGHT; d++) out.push(dayOfNumber(first + d));
  }
  return out;
}

// The summary of one fortnight.
//   shots, games          everything the page counts (practice and round
//                         play as ticked, days left out gone), all time
//   rounds                the course rounds (roundstats.mjs) - or, as
//                         working them all out is slow, a function giving
//                         those on a list of days (fortnightDays)
//   at                    a day in the fortnight wanted ("2026-09-22");
//                         by default today's, or the latest with play
//                         when there's none in it yet
// Returns { from, to, soFar, day, against: { from, to } | null, earlier,
// later (the first days of the fortnights played either side, to step
// to), played: { days, shots, rounds, games }, before (the same for the
// fortnight compared with), improved, slipped: [{ group, key, name, club,
// part, unit, digits, better, earlier, recent, change, n }], steady, few,
// bests: [{ kind, key, name, score, previous, t }] }; null with nothing
// played at all.
export function fortnightReport({ shots = [], games = [], rounds = [], at = null, now = Date.now(), clubOrder = [] } = {}) {
  const today = indexOf(now);
  // Every fortnight with something in it, up to this one.
  const playedIn = new Set();
  for (const x of shots) playedIn.add(indexOf(x.t));
  for (const x of games) playedIn.add(indexOf(x.t));
  if (Array.isArray(rounds)) for (const x of rounds) if (Number.isFinite(x.t)) playedIn.add(indexOf(x.t));
  const played = [...playedIn].filter((i) => i <= today).sort((a, b) => a - b);
  if (!played.length) return null;
  let i = typeof at === "string" && /^\d{4}-\d{2}-\d{2}$/.test(at) ? Math.min(today, fortnightOf(at).i) : today;
  if (at == null && !playedIn.has(i)) i = played.at(-1);
  const cur = fortnightAt(i);
  const before = played.filter((k) => k < i).at(-1);
  const after = played.find((k) => k > i);
  const prev = before == null ? null : fortnightAt(before);
  const rs = (typeof rounds === "function" ? rounds(fortnightDays(prev, cur)) : rounds).filter((r) => Number.isFinite(r.t));

  // What was played in each.
  const inIt = (k) => (x) => Number.isFinite(x.t) && indexOf(x.t) === k;
  const amount = (k) => {
    if (k == null) return null;
    const test = inIt(k);
    const days = new Set();
    let n = 0;
    for (const s of shots) {
      if (!test(s)) continue;
      n++;
      days.add(dayKey(s.t));
    }
    let g = 0;
    for (const x of games) {
      if (!test(x)) continue;
      days.add(dayKey(x.t));
      if (x.kind !== "course") g++;
    }
    return { days: days.size, shots: n, rounds: rs.filter((r) => r.played && test(r)).length, games: g };
  };

  // The numbers, each fortnight's on its own side.
  const both = (x) => Number.isFinite(x.t) && (indexOf(x.t) === i || (prev && indexOf(x.t) === prev.i));
  const list = metricList({ shots: shots.filter(both), rounds: rs.filter(both), games: games.filter(both), clubOrder, clubMin: 0 });
  const improved = [];
  const slipped = [];
  let steady = 0;
  let few = 0;
  for (const m of list) {
    const b = m.items.filter((x) => indexOf(x.t) === i);
    // Only what was played this fortnight is worth a word.
    if (!b.length) continue;
    const a = prev ? m.items.filter((x) => indexOf(x.t) === prev.i) : [];
    if (a.length < needs(m.kind) || b.length < needs(m.kind)) {
      few++;
      continue;
    }
    const c = compareSets(a, b, { better: m.better, min: m.min });
    if (c.direction === "steady") {
      steady++;
      continue;
    }
    const entry = { group: m.group, key: m.key, name: m.name, club: m.club ?? null, part: m.part ?? null, unit: m.unit, digits: m.digits, better: m.better, min: m.min, ...c, n: [a.length, b.length] };
    (c.direction === "better" ? improved : slipped).push(entry);
  }
  const order = (x, y) => standout(y) - standout(x);
  improved.sort(order);
  slipped.sort(order);

  // Bests set this fortnight: a game's best score (a course's lowest
  // finished round) beating every one before it, or its first.
  const best = new Map();
  for (const g of games) {
    if (!Number.isFinite(g.score) || !Number.isFinite(g.t) || indexOf(g.t) > i) continue;
    const key = `${g.kind}|${g.key ?? ""}`;
    const low = g.kind === "course";
    const e = best.get(key) ?? { before: null, now: null };
    const side = indexOf(g.t) === i ? "now" : "before";
    const top = e[side];
    if (!top || (low ? g.score < top.score : g.score > top.score)) e[side] = g;
    best.set(key, e);
  }
  const bests = [];
  for (const { before: was, now: g } of best.values()) {
    if (!g) continue;
    const low = g.kind === "course";
    if (was && (low ? g.score >= was.score : g.score <= was.score)) continue;
    bests.push({ kind: g.kind, key: g.key ?? "", name: g.name ?? null, score: g.score, previous: was?.score ?? null, t: g.t });
  }
  // Beaten bests first, then first scores; newest first within each.
  bests.sort((x, y) => (x.previous == null) - (y.previous == null) || y.t - x.t);

  return {
    from: cur.from,
    to: cur.to,
    soFar: i === today,
    day: i === today ? dayNumber(dayKey(now)) - dayNumber(cur.from) + 1 : FORTNIGHT,
    against: prev ? { from: prev.from, to: prev.to } : null,
    earlier: prev?.from ?? null,
    later: after == null ? null : fortnightAt(after).from,
    played: amount(i),
    before: amount(prev?.i),
    improved,
    slipped,
    steady,
    few,
    bests,
  };
}
