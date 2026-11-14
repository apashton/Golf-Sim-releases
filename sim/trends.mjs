// Trends: which way each number is going over the period in view - better,
// worse or steady - with a little line of it over time. For the stats
// page's Trends section: scoring from the course rounds (score, strokes
// gained, fairways, greens, putts, up-and-downs), each club's carry and
// how far off line, the short game (how close chips and pitches finish,
// short putts holed, how close lag putts finish), the practice plans' and
// the challenges' scores. The two-week summary (fortnight.mjs) compares
// the same numbers, one fortnight against another.
//
// How a direction is decided: the period's shots (or rounds) are split in
// two by time, earlier and recent halves, and the halves' averages
// compared. It's only called better or worse when the difference is both
// big enough to matter (each number has its own, a yard of carry isn't a
// stroke a round) and clear of the scatter - 1.5 standard errors - so a
// couple of good shots don't make a trend. Too few to tell says so.
//
// Pure: server/stats.mjs adds it to a player's report.

import { counts } from "./shotstats.mjs";
import { drillScores, drillById } from "./practiceplan.mjs";
import { GAMES } from "./challenges.mjs";

export const MIN_ITEMS = { round: 4, shot: 12, plan: 3 };
const CLEAR = 1.5;

// How a period's time is grouped for the little line: by the hour for a
// day, by the day for up to a month, by the week to about six months, by
// the month beyond.
export function bucketUnit(from, to) {
  const span = to - from;
  const day = 86400000;
  if (span <= 1.5 * day) return "hour";
  if (span <= 32 * day) return "day";
  if (span <= 190 * day) return "week";
  return "month";
}

export function bucketStart(t, unit) {
  const d = new Date(t);
  if (unit === "hour") return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()).getTime();
  if (unit === "day") return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (unit === "week") {
    // Weeks from Monday.
    const back = (d.getDay() + 6) % 7;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - back).getTime();
  }
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

const wmean = (items) => {
  const w = items.reduce((a, x) => a + x.w, 0);
  return w ? items.reduce((a, x) => a + x.v * x.w, 0) / w : NaN;
};

// The spread of a half's average: its weighted variance over its
// effective number of items.
function halfError(items, m) {
  const w = items.reduce((a, x) => a + x.w, 0);
  const w2 = items.reduce((a, x) => a + x.w * x.w, 0);
  if (!w || items.length < 2) return Infinity;
  const variance = items.reduce((a, x) => a + x.w * (x.v - m) ** 2, 0) / w;
  const n = (w * w) / w2;
  return variance / Math.max(1, n - 1);
}

// One number's trend. items: [{ t, v, w }] (w: how much it counts - a
// round of 18 is 1, a round's 14 fairway chances 14). better: "up" or
// "down". min: the least difference that matters. kind: "round" or "shot"
// (how many it needs).
//   { earlier, recent, change, direction: "better" | "worse" | "steady" |
//     "few", points: [{ t, v, n }] }
export function trendOf(items, { better = "up", min = 0, kind = "shot", unit = "month" } = {}) {
  const list = items.filter((x) => Number.isFinite(x.v) && Number.isFinite(x.t) && x.w > 0).sort((a, b) => a.t - b.t);
  const buckets = new Map();
  for (const x of list) {
    const k = bucketStart(x.t, unit);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(x);
  }
  const points = [...buckets].map(([t, xs]) => ({ t, v: wmean(xs), n: xs.length }));
  const out = { earlier: null, recent: null, change: null, direction: "few", n: list.length, points };
  if (list.length < (MIN_ITEMS[kind] ?? 4)) return out;
  // Split by weight at the middle.
  const total = list.reduce((a, x) => a + x.w, 0);
  let acc = 0;
  let cut = 0;
  while (cut < list.length && acc + list[cut].w / 2 < total / 2) acc += list[cut++].w;
  cut = Math.min(list.length - 1, Math.max(1, cut));
  const c = compareSets(list.slice(0, cut), list.slice(cut), { better, min });
  Object.assign(out, { earlier: c.earlier, recent: c.recent, change: c.change });
  // Spread over less than two buckets' worth of time, there's no trend to see.
  if (list.at(-1).t - list[0].t <= 0) return out;
  out.direction = c.direction;
  return out;
}

// Two sets of the same number, earlier and recent, compared: better or
// worse only when the difference is at least `min` and clear of the
// scatter (1.5 standard errors), else steady.
//   { earlier, recent, change, direction }
export function compareSets(a, b, { better = "up", min = 0 } = {}) {
  const ma = wmean(a);
  const mb = wmean(b);
  const change = mb - ma;
  const se = Math.sqrt(halfError(a, ma) + halfError(b, mb));
  const clear = Math.abs(change) >= min && Math.abs(change) > CLEAR * se;
  return { earlier: ma, recent: mb, change, direction: !clear ? "steady" : (change > 0) === (better === "up") ? "better" : "worse" };
}

// The rounds' numbers, a round at a time (roundstats.mjs roundStats).
export const ROUND_METRICS = [
  { key: "diff", name: "Score differential", unit: "handicap", better: "down", min: 1, digits: 1 },
  { key: "toPar", name: "Score to par", unit: "a round of 18", better: "down", min: 1, digits: 1 },
  { key: "sgTotal", name: "Strokes gained", unit: "a round of 18", better: "up", min: 1, digits: 1 },
  { key: "sgTee", name: "SG off the tee", unit: "a round", better: "up", min: 0.5, digits: 1 },
  { key: "sgApproach", name: "SG approach", unit: "a round", better: "up", min: 0.5, digits: 1 },
  { key: "sgAround", name: "SG around the green", unit: "a round", better: "up", min: 0.5, digits: 1 },
  { key: "sgPutting", name: "SG putting", unit: "a round", better: "up", min: 0.5, digits: 1 },
  { key: "fairways", name: "Fairways hit", unit: "%", better: "up", min: 5, digits: 0 },
  { key: "greens", name: "Greens in regulation", unit: "%", better: "up", min: 5, digits: 0 },
  { key: "putts", name: "Putts", unit: "a round of 18", better: "down", min: 1, digits: 1 },
  { key: "upDowns", name: "Up and downs", unit: "%", better: "up", min: 8, digits: 0 },
];

const per18 = (v, holes) => (holes ? (v * 18) / holes : NaN);

function roundItems(r, key) {
  const t = r.t;
  switch (key) {
    case "diff":
      return Number.isFinite(r.hcp?.diff) ? [{ t, v: r.hcp.diff, w: 1 }] : [];
    case "toPar": {
      const withPar = r.holes.filter((h) => Number.isFinite(h.score) && Number.isFinite(h.par));
      return withPar.length ? [{ t, v: per18(withPar.reduce((a, h) => a + h.score - h.par, 0), withPar.length), w: withPar.length / 18 }] : [];
    }
    case "putts":
      return r.putts.holes ? [{ t, v: per18(r.putts.total, r.putts.holes), w: r.putts.holes / 18 }] : [];
    case "fairways":
      return r.fairways.of ? [{ t, v: (100 * r.fairways.hit) / r.fairways.of, w: r.fairways.of }] : [];
    case "greens":
      return r.greens.of ? [{ t, v: (100 * r.greens.hit) / r.greens.of, w: r.greens.of }] : [];
    case "upDowns":
      return r.upDowns.of ? [{ t, v: (100 * r.upDowns.made) / r.upDowns.of, w: r.upDowns.of }] : [];
    default: {
      if (!r.sg) return [];
      const k = { sgTotal: "total", sgTee: "tee", sgApproach: "approach", sgAround: "around", sgPutting: "putting" }[key];
      return [{ t, v: per18(r.sg[k], r.sg.holes), w: r.sg.holes / 18 }];
    }
  }
}

// Each club's carry and how far off line (r.off, yards): its good full
// swings.
const CLUB_MIN = MIN_ITEMS.shot;

// Chips and pitches: how far from the hole they finish (feet); short putts
// (3 to 10 ft): how many go in; lag putts (30 to 50 ft, as the distance
// challenge's lag putting): how far from the hole they finish, holed none.
// From the course, the chipping and putting greens alike.
export const LAG_FT = [30, 50];
function shortItems(shots) {
  const chips = [];
  const putts = [];
  const lags = [];
  for (const s of shots) {
    if (s.my === "misread" || !Number.isFinite(s.tg?.d)) continue;
    const green = s.sw === "putt" || s.lie === "green";
    if (green) {
      const ft = s.tg.d * 3;
      if (ft >= 3 && ft < 10) putts.push({ t: s.t, v: s.tg.made ? 100 : 0, w: 1 });
      // (Half a foot either side: a 50 ft putt is 50 ft, give or take the
      // yards it's kept in.)
      else if (ft >= LAG_FT[0] - 0.5 && ft < LAG_FT[1] + 0.5 && (s.tg.made || Number.isFinite(s.tg.f))) lags.push({ t: s.t, v: s.tg.made ? 0 : s.tg.f * 3, w: 1 });
    } else if ((s.sw === "chip" || s.sw === "pitch") && Number.isFinite(s.tg.f) && s.tg.d <= 60 && !s.pen && !s.up) {
      chips.push({ t: s.t, v: s.tg.f * 3, w: 1 });
    }
  }
  return { chips, putts, lags };
}

// The challenges' scores, each game and version of it (its key: a putting
// challenge's distance, cup and green speed) on its own: higher is better.
// `min`, the least change that matters: a twentieth of the best possible,
// where there is one.
const CHALLENGE_MAX = { "putting-challenge": 100, "chipping-challenge": 130, ...Object.fromEntries(GAMES.map((g) => [g.kind, g.max])) };
const CHALLENGE_NAMES = Object.fromEntries(GAMES.map((g) => [g.kind, g.name]));
function challengeItems(games) {
  const by = new Map();
  for (const g of games) {
    if (!(g.kind in CHALLENGE_MAX) || !Number.isFinite(g.score)) continue;
    const key = `${g.kind}|${g.key ?? ""}`;
    if (!by.has(key)) by.set(key, { kind: g.kind, key: g.key ?? "", name: null, items: [] });
    const e = by.get(key);
    e.items.push({ t: g.t, v: g.score, w: 1 });
    // The Challenges' games keep the option played as the name ("Tight"):
    // the game's own name with it. The latest name stands.
    const own = CHALLENGE_NAMES[g.kind];
    e.name = own ? (g.name ? `${own} (${g.name})` : own) : (g.name ?? g.kind);
  }
  return [...by.values()].map((e) => ({ ...e, min: CHALLENGE_MAX[e.kind] ? CHALLENGE_MAX[e.kind] / 20 : 0 }));
}

// Every number the trends follow, with what it's made of: [{ group
// ("scoring", "clubs", "short", "practice", "challenges"), key, name,
// unit, better, min, digits, kind ("round", "shot", "plan": how many it
// needs), items: [{ t, v, w }] }]; a club's two also have club and part
// ("carry", "offline"). Clubs with fewer than `clubMin` good full swings
// are left out.
export function metricList({ shots = [], rounds = [], games = [], clubOrder = [], clubMin = CLUB_MIN } = {}) {
  const out = [];
  const rs = rounds.filter((r) => Number.isFinite(r.t) && r.played);
  for (const m of ROUND_METRICS) {
    const items = rs.flatMap((r) => roundItems(r, m.key));
    if (items.length) out.push({ group: "scoring", ...m, kind: "round", items });
  }
  const byClub = new Map();
  for (const s of shots) {
    if (!counts(s) || !Number.isFinite(s.r?.carry)) continue;
    if (!byClub.has(s.c)) byClub.set(s.c, []);
    byClub.get(s.c).push(s);
  }
  const rank = (c) => {
    const i = clubOrder.indexOf(c);
    return i < 0 ? 999 : i;
  };
  for (const [club, list] of [...byClub].sort((a, b) => rank(a[0]) - rank(b[0]))) {
    if (list.length < clubMin) continue;
    const base = { group: "clubs", club, shots: list.length, unit: "yds", digits: 1, kind: "shot" };
    out.push({ ...base, key: `${club}:carry`, part: "carry", name: `${club} carry`, better: "up", min: 3, items: list.map((s) => ({ t: s.t, v: s.r.carry, w: 1 })) });
    out.push({ ...base, key: `${club}:offline`, part: "offline", name: `${club} off line`, better: "down", min: 2, items: list.filter((s) => Number.isFinite(s.r.off)).map((s) => ({ t: s.t, v: Math.abs(s.r.off), w: 1 })) });
  }
  const { chips, putts, lags } = shortItems(shots);
  const short = { group: "short", kind: "shot" };
  if (chips.length) out.push({ ...short, key: "chips", name: "Chips and pitches: left", unit: "ft", better: "down", min: 1, digits: 1, items: chips });
  if (putts.length) out.push({ ...short, key: "shortPutts", name: "Putts holed from 3-10 ft", unit: "%", better: "up", min: 5, digits: 0, items: putts });
  if (lags.length) out.push({ ...short, key: "lagPutts", name: `Lag putts ${LAG_FT[0]}-${LAG_FT[1]} ft: left`, unit: "ft", better: "down", min: 1, digits: 1, items: lags });
  // Practice plans: each drill's score.
  for (const [id, items] of drillScores(games)) out.push({ group: "practice", key: id, name: drillById(id).name, unit: "", better: "up", min: 5, digits: 0, kind: "plan", items });
  // The challenges: each one's score.
  for (const c of challengeItems(games)) out.push({ group: "challenges", key: `${c.kind}|${c.key}`, name: c.name, unit: "", better: "up", min: c.min, digits: 0, kind: "plan", items: c.items });
  return out;
}

// The Trends section: { unit, from, to, scoring: [...], clubs: [...],
// short: [...] } - each a metric's { key, name, unit, better, digits, ...
// trendOf }. from: the period's first moment (null: its first shot).
// games: the games in view (practice plans' scores).
export function trendsReport({ shots = [], rounds = [], games = [], from = null, now = Date.now(), clubOrder = [] } = {}) {
  const times = [...shots.map((s) => s.t), ...rounds.map((r) => r.t)].filter(Number.isFinite);
  const start = from ?? (times.length ? Math.min(...times) : now);
  const unit = bucketUnit(start, now);
  const list = metricList({ shots, rounds, games, clubOrder });
  // Each number's trend, without its items.
  const trend = ({ items, group, kind, club, part, shots: n, ...m }) => ({ ...m, ...trendOf(items, { better: m.better, min: m.min, kind, unit }) });
  const of = (group) => list.filter((m) => m.group === group);
  const clubs = [];
  for (const m of of("clubs")) {
    if (m.part === "carry") clubs.push({ club: m.club, shots: m.shots, carry: trend(m) });
    else clubs.at(-1).offline = trend(m);
  }
  return { unit, from: start, to: now, scoring: of("scoring").map(trend), clubs, short: of("short").map(trend), practice: of("practice").map(trend), challenges: of("challenges").map(trend) };
}
