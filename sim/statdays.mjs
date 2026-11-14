// A player's shots by day, and what the stats page is looking at: each day
// they hit shots, days left out or marked Experimental after the fact, and
// the filter (a period, chosen days, which formats) every number on the
// page goes through. Pure, so the server (server/stats.mjs) and the tests
// share one copy.
//
// Formats (see sim/recording.mjs): a shot's rec is "r" (round play) or "x"
// (experimental), and none is practice. A course round is always round
// play - old ones too, from before there was a switch. A finished game's
// line carries its rec the same way.
//
// Day lines in the player's file (append-only like the rest, the latest
// for a day winning):
//   { day: "2026-09-28", out: 1, t, p }  left out of every number (out: 0
//                                        puts it back)
//   { day: "2026-09-28", x: 1, t, p }    every shot and game that day made
//                                        experimental (x: 0 takes it back)
// A day left out counts nowhere, whatever the filter; an experimental day
// counts only with Experimental switched into the view.
//
// A session - a range visit, a putting or chipping session, a challenge or
// a round: the shots whose game (g.id) is the same, and the game line with
// that id - can be marked the same way, on its own (asked when it ends:
// "that was just testing", or on My stats):
//   { ses: "<game id>", out: 1, t, p }   left out (out: 0 puts it back)
//   { ses: "<game id>", x: 1, t, p }     made experimental (x: 0 takes it back)
// Kept in the same map as the days, under "ses:<id>", so everything that
// asks about a day's marks asks about the session's too (markOf).

export const FORMAT_CODES = ["p", "r", "x"];
export const FORMAT_WORDS = { p: "Practice", r: "Round", x: "Experimental" };
// What the page shows unless asked otherwise: practice and round play,
// every day that isn't left out.
export const COUNTED = ["p", "r"];
export const PERIODS = ["today", "7", "30", "3m", "6m", "12m", "all", "days"];
export const DAY = /^\d{4}-\d{2}-\d{2}$/;

// The local day a time falls on, "2026-09-28". Asked for every shot each
// time the page is drawn, so each quarter of an hour is worked out once
// (every time zone's offset, and every clock change, is a whole number of
// quarter hours, so a quarter never spans two days).
const quarters = new Map();
export function dayKey(t) {
  const q = Math.floor(t / 900000);
  let k = quarters.get(q);
  if (k === undefined) {
    const d = new Date(t);
    k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (quarters.size > 100000) quarters.clear();
    quarters.set(q, k);
  }
  return k;
}

// The day a number of days before another ("2026-09-28", 6 -> "2026-09-22"),
// by the calendar, so a clock change doesn't lose or add one.
export function daysBefore(day, n) {
  const [y, m, d] = day.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d - n, 12).getTime());
}

// The day n calendar months before (the 31st to the end of a shorter
// month): "2026-09-30" 3 months back is "2026-06-30".
export function monthsBefore(day, n) {
  const [y, m, d] = day.split("-").map(Number);
  const last = new Date(y, m - 1 - n + 1, 0, 12).getDate();
  return dayKey(new Date(y, m - 1 - n, Math.min(d, last), 12).getTime());
}

// The first day a period counts from (null: from the start, or chosen days).
export function periodStart(filter, today) {
  const p = filter.period;
  if (p === "today") return today;
  if (p === "7" || p === "30") return daysBefore(today, Number(p) - 1);
  if (p === "3m" || p === "6m" || p === "12m") return daysBefore(monthsBefore(today, parseInt(p, 10)), -1);
  return null;
}

// ---- Day marks ------------------------------------------------------------------

// Day marks as the file is read: a Map of day -> { out, x }.
export function applyDayMark(marks, o) {
  if (!o || typeof o.day !== "string" || !DAY.test(o.day)) return false;
  const m = { ...(marks.get(o.day) ?? { out: false, x: false }) };
  if ("out" in o) m.out = !!o.out;
  if ("x" in o) m.x = !!o.x;
  if (m.out || m.x) marks.set(o.day, m);
  else marks.delete(o.day);
  return true;
}

// A session mark as the file is read, into the same map (see the top).
export const SESSION_ID = /^[A-Za-z0-9_-]{1,40}$/;
export const sessionKey = (id) => `ses:${id}`;
export function applySessionMark(marks, o) {
  if (!o || typeof o.ses !== "string" || !SESSION_ID.test(o.ses)) return false;
  const key = sessionKey(o.ses);
  const m = { ...(marks.get(key) ?? { out: false, x: false }) };
  if ("out" in o) m.out = !!o.out;
  if ("x" in o) m.x = !!o.x;
  if (m.out || m.x) marks.set(key, m);
  else marks.delete(key);
  return true;
}

// What a shot or game is marked with: its day's marks and its session's
// together. `id` is the session (a shot's g.id, a game's id).
const NONE = Object.freeze({ out: false, x: false });
export function markOf(marks, day, id) {
  const d = marks?.get(day);
  const ss = id ? marks?.get(sessionKey(id)) : null;
  if (!d && !ss) return NONE;
  return { out: !!(d?.out || ss?.out), x: !!(d?.x || ss?.x) };
}

// ---- Formats ----------------------------------------------------------------------

// The format a shot counts as: an experimental day's, else what it was
// recorded as, a course round's shots always round play.
export function formatOf(s, marks, day = dayKey(s.t)) {
  if (markOf(marks, day, s.g?.id).x) return "x";
  if (s.rec === "x" || s.rec === "r") return s.rec;
  return s.g?.k === "course" || s.m === "course" ? "r" : "p";
}
// The same for a finished game (a course round's is round play).
export function gameFormatOf(g, marks, day = dayKey(g.t)) {
  if (markOf(marks, day, g.id).x) return "x";
  if (g.rec === "x" || g.rec === "r") return g.rec;
  return g.kind === "course" ? "r" : "p";
}

// ---- The filter -------------------------------------------------------------------

// What the page asked for, made safe: { period, days, formats }. period is
// "today", "7" (the last 7 days, today too), "30", "3m", "6m", "12m" (the
// last 3, 6 or 12 months), "all" or "days" (the days chosen); formats which of "p", "r", "x" to count.
export function viewFilter({ period, days, formats } = {}) {
  const list = (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : []).map((x) => String(x).trim()).filter(Boolean);
  const chosen = [...new Set(list(days).filter((d) => DAY.test(d)))].slice(0, 400);
  const fs = [...new Set(list(formats).filter((f) => FORMAT_CODES.includes(f)))];
  return {
    period: PERIODS.includes(String(period)) ? String(period) : "all",
    days: chosen,
    formats: fs.length ? FORMAT_CODES.filter((f) => fs.includes(f)) : [...COUNTED],
  };
}

// Whether a day is in the filter's period (today is the day it is now).
export function dayTest(filter, today) {
  const p = filter.period;
  if (p === "today") return (day) => day === today;
  const from = periodStart(filter, today);
  if (from && p !== "today") return (day) => day >= from && day <= today;
  if (p === "days") {
    const set = new Set(filter.days);
    return (day) => set.has(day);
  }
  return () => true;
}

// The shots and games the page counts: in the period, in the formats asked
// for, and not on a day left out. Everything else about a shot (a misread,
// a club still to check) is still for shotstats.mjs to decide.
export function inView(shots, games, marks, filter = viewFilter(), now = Date.now()) {
  const f = viewFilter(filter);
  const inDays = dayTest(f, dayKey(now));
  const wanted = new Set(f.formats);
  const keep = (day, id, format) => !markOf(marks, day, id).out && inDays(day) && wanted.has(format);
  const outShots = [];
  for (const s of shots) {
    const day = dayKey(s.t);
    if (keep(day, s.g?.id, formatOf(s, marks, day))) outShots.push(s);
  }
  const outGames = [];
  for (const g of games) {
    const day = dayKey(g.t);
    if (keep(day, g.id, gameFormatOf(g, marks, day))) outGames.push(g);
  }
  return { shots: outShots, games: outGames };
}

// The shots that count for what's normal for a player - the club check,
// the full carry that decides a part swing, the strike's normal: practice
// and round play on days not left out.
export function countedShots(shots, marks) {
  const out = [];
  for (const s of shots) {
    const day = dayKey(s.t);
    if (!markOf(marks, day, s.g?.id).out && formatOf(s, marks, day) !== "x") out.push(s);
  }
  return out;
}

// ---- The days list ------------------------------------------------------------------

// Each day the player hit shots, newest first: how many, in which modes,
// the games finished (with scores), how many in each format, and whether
// it's left out or marked Experimental. Every shot and game, whatever the
// filter, so a left-out day can be put back.
//   { day, shots, p, r, x, modes: [mode...], games: [{ kind, key, name,
//     score, toPar }], out, xday, first, last }
export function dayList(shots, games, marks) {
  const days = new Map();
  const get = (day) => {
    let d = days.get(day);
    if (!d) {
      d = { day, shots: 0, p: 0, r: 0, x: 0, modes: [], games: [], out: !!marks.get(day)?.out, xday: !!marks.get(day)?.x, first: null, last: null };
      days.set(day, d);
    }
    return d;
  };
  for (const s of shots) {
    const day = dayKey(s.t);
    const d = get(day);
    d.shots++;
    d[formatOf(s, marks, day)]++;
    const mode = s.m ?? "other";
    if (!d.modes.includes(mode)) d.modes.push(mode);
    if (d.first == null || s.t < d.first) d.first = s.t;
    if (d.last == null || s.t > d.last) d.last = s.t;
  }
  for (const g of games) {
    const day = dayKey(g.t);
    // A game with no shots that day (its shots weren't recorded) still
    // shows the day.
    const d = get(day);
    d.games.push({ kind: g.kind, key: g.key ?? "", name: g.name ?? null, score: g.score ?? g.total ?? null, toPar: g.toPar ?? null, rec: gameFormatOf(g, marks, day) });
  }
  // Days marked but with nothing recorded (every shot since archived) are
  // left out of the list: there's nothing to show.
  return [...days.values()].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
}

// ---- The sessions list --------------------------------------------------------------

// Each session the player hit shots in, newest first (at most `limit`):
// its kind, when, how many shots, the game's score if it finished one, and
// whether it's left out or experimental - its own mark (out, x) and what
// its day adds (dayOut, dayX). Every shot, whatever the filter, so a
// session left out can be put back.
//   { id, kind, first, last, shots, day, rec, score, name, out, x, dayOut, dayX }
export function sessionList(shots, games, marks, limit = 60) {
  const byId = new Map();
  for (const s of shots) {
    const id = s.g?.id;
    if (!id) continue;
    let e = byId.get(id);
    if (!e) {
      e = { id, kind: s.g.k ?? s.m ?? "other", first: s.t, last: s.t, shots: 0, rec: s.rec ?? null };
      byId.set(id, e);
    }
    e.shots++;
    if (s.t < e.first) e.first = s.t;
    if (s.t > e.last) e.last = s.t;
  }
  for (const g of games) {
    if (!g.id) continue;
    let e = byId.get(g.id);
    if (!e) {
      e = { id: g.id, kind: g.kind, first: g.t, last: g.t, shots: 0, rec: g.rec ?? null };
      byId.set(g.id, e);
    }
    if (Number.isFinite(g.score)) e.score = g.score;
    if (g.name) e.name = g.name;
  }
  // Newest first; two ending in the same moment, the one begun later first.
  const order = [...byId.values()].map((e, i) => ({ e, i }));
  return order
    .sort((a, b) => b.e.last - a.e.last || b.i - a.i)
    .map(({ e }) => e)
    .slice(0, limit)
    .map((e) => {
      const day = dayKey(e.first);
      const own = marks.get(sessionKey(e.id));
      const d = marks.get(day);
      return { ...e, day, score: e.score ?? null, name: e.name ?? null, out: !!own?.out, x: !!own?.x, dayOut: !!d?.out, dayX: !!d?.x };
    });
}
