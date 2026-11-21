// Seasons by post (the owner, 7 November 2026: "I can't see a way to have a
// non-live season? I start a season, but doesn't seem to be a way to invite
// people to it, set deadline for the first round to be completed by etc.
// scores and lead tables etc"): an online season whose events each player
// plays on their own, whenever they like before the event's deadline - as a
// Postal ladder's match is (sim/postal.mjs), but stroke play against
// everyone in it. Kept on the relay (relay/seasons.mjs: one store each,
// by code, "SK7Q2M"), joined with its link or code, run by whoever made it.
//
//   - Made: its name, events (4, 6, 8 or 10), gross or net, 9 or 18 holes,
//     how everyone swings (and the level for made-up swings), the days each
//     event's open (3, 7 or 14), and its events - going round the courses
//     that come with the game (everyone has them), each with its first
//     holes (to check a player's copy is the same course), the tees, the
//     weather (rolled as it's made) and the luck's seed fixed for everyone.
//   - Joined: with its link or code, straight in - before it starts or
//     after (an event already closed is missed).
//   - Started by its maker: the first event opens then and closes `days`
//     later; each next event opens as the last one closes. The cups are each
//     event's opening day's.
//   - Played: once per event, in one go (no restarts, no mulligans, no
//     skill points, no gimmes - it's stroke play), begun and sent to the
//     relay; the scores show on the event's leaderboard as they come in.
//   - Closed: the event's places (gross, or net of each player's handicap
//     as they began), points by place as every season's (500, 300, 190...:
//     sim/season.mjs pointsAt, sim/netseason.mjs eventPoints), the
//     season's table across the events.
// Pure: the game (course/seasonpost.js), the relay's store and its web page
// (relay/webpages.mjs /s/CODE, from a copy in relay/game) all use it.

import { SEASON_LENGTHS } from "./season.mjs";
import { netSeasonTable, netSeasonLine } from "./netseason.mjs";

export { SEASON_LENGTHS };
export const DAY = 24 * 3600 * 1000;
export const DAY_CHOICES = [3, 7, 14];
export const DEFAULT_DAYS = 7;
export const DEFAULT_EVENTS = 6;
export const HOLE_CHOICES = [9, 18];
export const WAYS = ["monitor", "madeup", "any"];
export const LEVELS = ["beginner", "amateur", "pro", "tour"];
export const SCORINGS = ["gross", "net"];
// A round begun before its event closed may still be sent this long after
// (begun late at night, finished after midnight).
export const LATE_MS = 12 * 3600 * 1000;
// A player with no handicap plays off this (as a ladder's).
export const NO_INDEX = 18;
const TITLES = ["Classic", "Open", "Championship", "Invitational", "Masters", "Trophy"];

const pick = (v, list, fallback) => (list.includes(v) ? v : fallback);
const clip = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");

// A new season's settings and its events from the courses given ([{ id,
// name, holes: [{ par, yards, si }] }] - the first holes of each) and what's
// fixed for each event as it's made (weather(k): the conditions rolled for
// it). Null with no courses.
export function newPostSeason({ name = "", events = DEFAULT_EVENTS, scoring = "gross", holes = 9, way = "monitor", level = "amateur", days = DEFAULT_DAYS, tees = null, courses = [], weather = () => null, seed = 1 } = {}) {
  const n = pick(Number(holes), HOLE_CHOICES, 9);
  const list = (courses ?? []).filter((c) => c?.id && Array.isArray(c.holes) && c.holes.length >= n);
  if (!list.length) return null;
  const count = pick(Number(events), SEASON_LENGTHS, DEFAULT_EVENTS);
  const start = Math.abs(Math.floor(seed)) % list.length;
  const kind = pick(scoring, SCORINGS, "gross");
  return {
    name: clip(name, 40) || "Season by post",
    scoring: kind,
    holes: n,
    way: way === "any" && kind !== "net" ? "monitor" : pick(way, WAYS, "monitor"),
    level: pick(level, LEVELS, "amateur"),
    days: pick(Number(days), DAY_CHOICES, DEFAULT_DAYS),
    tees: clip(tees, 20) || null,
    events: Array.from({ length: count }, (_, k) => {
      const c = list[(start + k) % list.length];
      return { name: `${clip(c.name, 50)} ${TITLES[k % TITLES.length]}`, course: c.id, courseName: clip(c.name, 60), holes: c.holes.slice(0, n).map((h) => ({ par: h.par, yards: h.yards ?? null, si: h.si ?? null })), weather: weather(k) ?? null };
    }),
  };
}

// When event k is open: { opens, closes } (ms), or null before the season's
// started.
export function eventWindow(season, k) {
  if (!Number.isFinite(season?.started) || !season.events?.[k]) return null;
  const span = (season.days ?? DEFAULT_DAYS) * DAY;
  return { opens: season.started + k * span, closes: season.started + (k + 1) * span };
}

// Where event k is: "waiting" (the season hasn't started), "coming" (opens
// later), "open" or "closed".
export function eventState(season, k, now = Date.now()) {
  const w = eventWindow(season, k);
  if (!w) return "waiting";
  if (now < w.opens) return "coming";
  return now < w.closes ? "open" : "closed";
}

// The event to play now (its index), or the next to open; -1 once they've
// all closed.
export function currentEvent(season, now = Date.now()) {
  const n = season?.events?.length ?? 0;
  for (let k = 0; k < n; k++) if (eventState(season, k, now) !== "closed") return k;
  return -1;
}

// The cups' day for event k: its opening day ("2026-11-07").
export function eventPinDay(season, k) {
  const w = eventWindow(season, k);
  return w ? new Date(w.opens).toISOString().slice(0, 10) : null;
}

// A player's strokes for a round of `holes` holes off a handicap index
// (none: NO_INDEX): the index for 18, half for 9, rounded.
export function playingHandicap(index, holes = 18) {
  const i = Number.isFinite(index) ? index : NO_INDEX;
  return Math.round((i * holes) / 18);
}

// Whether player `id` may begin event k now ("" if so, else why), and send
// their round (canSend).
export function beginProblem(season, entries, k, id, now = Date.now()) {
  const st = eventState(season, k, now);
  if (st === "waiting") return "The season hasn't started yet";
  if (st === "coming") return "That event isn't open yet";
  if (st === "closed") return "That event's closed";
  if (entries?.[k]?.[id]?.begun != null) return "You've begun that round already - it's one go";
  return "";
}
export function sendProblem(season, entries, k, id, now = Date.now()) {
  const e = entries?.[k]?.[id];
  const w = eventWindow(season, k);
  if (!w) return "The season hasn't started yet";
  if (e?.begun == null) return "Begin your round first";
  if (e.scores) return "Your round's in already";
  if (now > w.closes && !(e.begun < w.closes && now <= w.closes + LATE_MS)) return "Too late - that event's closed";
  return "";
}

// Event k's leaderboard: each player who's sent their round - gross, their
// strokes, net, the score that counts and its place (level ones share it) -
// then those still playing (until it's too late to send theirs). -> [{ id,
// name, gross, hcp, net, score, place, text, playing }]
export function leaderboard(view, k, now = Date.now()) {
  const season = view?.season;
  const entries = view?.entries?.[k] ?? {};
  const names = Object.fromEntries((view?.members ?? []).map((m) => [m.id, m.name]));
  const par = (season?.events?.[k]?.holes ?? []).reduce((a, h) => a + (h.par ?? 4), 0);
  const w = eventWindow(season, k);
  const over = !!w && now > w.closes + LATE_MS;
  const done = [];
  const playing = [];
  for (const [id, e] of Object.entries(entries)) {
    const name = names[id] ?? e.name ?? "?";
    if (!Array.isArray(e.scores)) {
      if (e.begun != null && !over) playing.push({ id, name, playing: true });
      continue;
    }
    // (A hole not finished counts as par and 3 - the most a hole takes on a
    // card a round's been sent with.)
    const gross = e.scores.reduce((a, x, i) => a + (Number.isFinite(x) ? x : (season.events[k].holes[i]?.par ?? 4) + 3), 0);
    const hcp = playingHandicap(e.own, season.holes);
    const net = gross - hcp;
    const score = season.scoring === "net" ? net : gross;
    done.push({ id, name, gross, hcp, net, score, toPar: score - par });
  }
  done.sort((a, b) => a.score - b.score || a.gross - b.gross || a.name.localeCompare(b.name));
  done.forEach((r, i) => (r.place = i > 0 && done[i - 1].score === r.score ? done[i - 1].place : i + 1));
  for (const r of done) r.text = `${r.score} (${r.toPar === 0 ? "level" : r.toPar > 0 ? `+${r.toPar}` : r.toPar})${season.scoring === "net" ? `, ${r.gross} gross` : ""}`;
  return [...done, ...playing];
}

// The season as sim/netseason.mjs keeps one - each closed event's places -
// so its table and its line are a season's (points by place).
export function asNetSeason(view, now = Date.now()) {
  const s = view?.season;
  if (!s?.events?.length) return null;
  return {
    name: s.name,
    scoring: s.scoring,
    events: s.events.map((e, k) => {
      const closed = eventState(s, k, now) === "closed";
      const places = closed
        ? leaderboard(view, k, now)
            .filter((r) => !r.playing)
            .slice(0, 8)
            .map((r) => ({ name: r.name, place: Math.min(r.place, 8), text: r.text }))
        : [];
      return { courseId: e.course, course: e.courseName, name: e.name, done: closed && places.length > 0, game: null, places };
    }),
  };
}

// The season's table and its line ("Sam leads on 800 points after 2 of 6
// events").
export const postTable = (view, now = Date.now()) => netSeasonTable(asNetSeason(view, now));
export const postLine = (view, now = Date.now()) => netSeasonLine(asNetSeason(view, now));

// What a player can do about event k now, from the season as the relay last
// said (view: its me is them) and their round as kept on this PC ({ scores,
// next, playing, done }, or null):
//   "waiting" (not started), "coming", "play", "carry" (begun here: carry
//   on), "send" (played, not sent yet), "in" (sent), "elsewhere" (begun on
//   another PC), "late" (begun, too late to send now), "missed" (closed,
//   not played).
export function myRound(view, k, kept, now = Date.now()) {
  const season = view?.season;
  const id = view?.me?.id;
  const e = id ? view?.entries?.[k]?.[id] : null;
  if (Array.isArray(e?.scores)) return "in";
  const st = eventState(season, k, now);
  if (e?.begun != null) {
    if (!kept) return "elsewhere";
    // (The relay says whether it's in time: sendProblem.)
    if (sendProblem(season, view.entries, k, id, now)) return "late";
    return kept.done ? "send" : "carry";
  }
  if (st === "open") return "play";
  return st === "closed" ? "missed" : st;
}

// The seasons kept on this PC, made sound: { list: [{ code, key, view,
// at }], current: code, rounds: { "<code>:<k>": { scores, next, playing,
// done, at } } } - view is the relay's last word on it (the season, who's
// in it, the rounds, me, admin).
export function readKept(x) {
  const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
  const list = (Array.isArray(x?.list) ? x.list : []).filter((s) => typeof s?.code === "string" && typeof s.key === "string" && s.view?.season?.events?.length).map((s) => ({ code: s.code, key: s.key, view: s.view, at: Number.isFinite(s.at) ? s.at : 0 }));
  return { list, current: list.some((s) => s.code === x?.current) ? x.current : (list[0]?.code ?? null), rounds: obj(x?.rounds) };
}
export const roundOf = (code, k) => `${code}:${k}`;

// Its rules in a line: "Net, 9 holes, each event open 7 days, launch
// monitor swings".
export function rulesLine(season) {
  if (!season) return "";
  const way = season.way === "monitor" ? "launch monitor swings" : season.way === "madeup" ? `mouse, finger or controller swings (${season.level})` : "any swings";
  return `${season.scoring === "net" ? "Net" : "Gross"}, ${season.holes} holes, each event open ${season.days} days, ${way}`;
}

// An event's dates in words: "Opens Sat 7 Nov, closes Sat 14 Nov".
export function windowWords(season, k, now = Date.now()) {
  const w = eventWindow(season, k);
  if (!w) return `Opens when ${clip(season?.name, 40) || "the season"} starts`;
  const d = (t) => new Date(t).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" });
  const st = eventState(season, k, now);
  if (st === "closed") return `Closed ${d(w.closes)}`;
  if (st === "open") return `Open now - closes ${d(w.closes)}`;
  return `Opens ${d(w.opens)}, closes ${d(w.closes)}`;
}
