// Online seasons, played together (the Online tab's Seasons): a run of
// events on the host's courses, each an online round everyone in the game
// plays at once, and the season's standings across them - real players,
// where a season on one PC is against made-up golfers (sim/season.mjs).
// The host runs it: it's kept on the host's PC or phone (its own storage,
// netseasonkeep.js) and goes out with the game for every bay to see,
// as the match over several games does (sim/netmatch.mjs) - none of it on
// the relay. Each event's places from its round's standings (stroke play,
// gross or net as the season's scored), points by place as a season's
// (500 for first, 300, 190, 135...: ties share the places they span), the
// standings by points. Pure.
//
// season: { name, scoring: "gross" | "net", events: [{ courseId, course,
// name, done, game, places: [{ name, place, text }] }] }

import { SEASON_LENGTHS, pointsAt } from "./season.mjs";

export { SEASON_LENGTHS };
export const NET_SEASON_EVENTS = 6;
// How it's scored: everyone's strokes as they are, or less each one's
// handicap (the round's handicaps on).
export const SCORINGS = { gross: "Gross - strokes as they are", net: "Net - less each player's handicap" };
const NAME = 40;
const EVENT_NAME = 60;
const PLAYERS = 8;
const EVENTS = Math.max(...SEASON_LENGTHS);
const TITLES = ["Classic", "Open", "Championship", "Invitational", "Masters", "Trophy"];

const clip = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");

// A new season of `events` events going round the courses given ([{ id,
// name }]) from one picked by the seed - or null with no courses.
export function newNetSeason({ name = "", events = NET_SEASON_EVENTS, courses = [], scoring = "gross", seed = 1 } = {}) {
  const list = (Array.isArray(courses) ? courses : []).filter((c) => c?.id);
  if (!list.length) return null;
  const n = SEASON_LENGTHS.includes(events) ? events : NET_SEASON_EVENTS;
  const start = Math.abs(Math.floor(seed)) % list.length;
  return cleanNetSeason({
    name: clip(name, NAME) || "Online season",
    scoring,
    events: Array.from({ length: n }, (_, k) => {
      const c = list[(start + k) % list.length];
      return { courseId: c.id, course: c.name, name: `${c.name} ${TITLES[k % TITLES.length]}`, done: false, game: null, places: [] };
    }),
  });
}

// A season as it may be kept or sent: anything else left out.
export function cleanNetSeason(s) {
  if (!s || typeof s !== "object") return null;
  const events = (Array.isArray(s.events) ? s.events : []).slice(0, EVENTS).map((e) => {
    const places = (Array.isArray(e?.places) ? e.places : [])
      .slice(0, PLAYERS)
      .map((p) => ({ name: clip(p?.name, 20), place: Number.isInteger(p?.place) && p.place >= 1 && p.place <= PLAYERS ? p.place : null, text: clip(p?.text, 30) }))
      .filter((p) => p.name && p.place);
    const done = e?.done === true && places.length > 0;
    return { courseId: clip(e?.courseId, 60), course: clip(e?.course, 60) || "Course", name: clip(e?.name, EVENT_NAME) || "Event", done, game: done ? clip(e?.game, 40) || null : null, places: done ? places : [] };
  });
  if (!events.length || events.some((e) => !e.courseId)) return null;
  return { name: clip(s.name, NAME) || "Online season", scoring: s.scoring === "net" ? "net" : "gross", events };
}

// The next event to play (its index), or -1 once they're all played.
export const nextNetEvent = (s) => (cleanNetSeason(s)?.events ?? []).findIndex((e) => !e.done);

// "Event 2 of 6: Hillside Park Open".
export function eventWords(s, k) {
  const e = s?.events?.[k];
  return e ? `Event ${k + 1} of ${s.events.length}: ${e.name}` : "";
}

// What the round's started as (the online game's round.season, sim/
// netgame.mjs): { k, of, name } - so every bay can say which event it is.
export function seasonRef(x) {
  if (!x || typeof x !== "object" || !Number.isInteger(x.k) || x.k < 0 || x.k >= EVENTS) return null;
  const of = Number.isInteger(x.of) && x.of > x.k && x.of <= EVENTS ? x.of : x.k + 1;
  return { k: x.k, of, name: clip(x.name, EVENT_NAME) || `Event ${x.k + 1}` };
}

// The season with event k played: its places (sim/netresults.mjs
// courseResult's, from the round's standings) kept - once (the game it was
// played in, by id; an event already played is left as it was).
export function recordNetEvent(s, k, result) {
  const season = cleanNetSeason(s);
  if (!season || !season.events[k] || season.events[k].done || !result?.places?.length) return season;
  if (result.id && season.events.some((e) => e.game === result.id)) return season;
  const events = season.events.map((e, i) => (i === k ? { ...e, done: true, game: clip(result.id, 40) || null, places: result.places } : e));
  return cleanNetSeason({ ...season, events });
}

// Points for each player in an event's places: a place's points, those
// level sharing the places they span (two tied 2nd: (300 + 190) / 2 each).
export function eventPoints(places) {
  const out = new Map();
  for (const p of places ?? []) {
    const level = places.filter((q) => q.place === p.place).length;
    let pts = 0;
    for (let at = p.place; at < p.place + level; at++) pts += pointsAt(at);
    out.set(p.name, Math.round((pts / level) * 10) / 10);
  }
  return out;
}

// The standings: each player (by name, as they play in every event) with
// their points, events played, wins and best place - most points first,
// then most wins.
export function netSeasonTable(s) {
  const season = cleanNetSeason(s);
  if (!season) return [];
  const rows = new Map();
  for (const e of season.events) {
    if (!e.done) continue;
    const pts = eventPoints(e.places);
    for (const p of e.places) {
      const row = rows.get(p.name) ?? { name: p.name, points: 0, played: 0, wins: 0, best: null };
      row.points = Math.round((row.points + pts.get(p.name)) * 10) / 10;
      row.played++;
      if (p.place === 1) row.wins++;
      row.best = row.best == null ? p.place : Math.min(row.best, p.place);
      rows.set(p.name, row);
    }
  }
  const out = [...rows.values()].sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name));
  out.forEach((r, k) => (r.place = k > 0 && out[k - 1].points === r.points && out[k - 1].wins === r.wins ? out[k - 1].place : k + 1));
  return out;
}

// "Sam leads on 800 points after 2 of 6 events", "Sam and Ali lead...",
// "Season over: Sam wins on 1,690 points", or "" before any's played.
export function netSeasonLine(s) {
  const season = cleanNetSeason(s);
  const t = netSeasonTable(season);
  if (!season || !t.length) return "";
  const played = season.events.filter((e) => e.done).length;
  const top = t.filter((r) => r.place === 1).map((r) => r.name);
  const who = top.length === 1 ? top[0] : `${top.slice(0, -1).join(", ")} and ${top.at(-1)}`;
  const pts = `${t[0].points.toLocaleString("en-GB")} point${t[0].points === 1 ? "" : "s"}`;
  if (played === season.events.length) return `Season over: ${who} ${top.length === 1 ? "wins" : "share it"} on ${pts}`;
  return `${who} ${top.length === 1 ? "leads" : "lead"} on ${pts} after ${played} of ${season.events.length} events`;
}
