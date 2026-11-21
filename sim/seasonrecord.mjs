// A season's record (the owner, 17 November 2026: "Ending an offline season
// early didn't give any end results. Playing an offline season, there
// doesn't seem to be a way to show on a record screen the standings etc."):
// everything there is to see of a season on this PC (sim/season.mjs) - where
// you stand, each event (where you finished it, its score, points and
// money, and who won), and the whole field's standings - for the season
// screen (seasonscreen.js): opened from the Course tab's Season at any time,
// shown when a season's ended, and kept, once it's over or ended early,
// with your past seasons.
//
// Pure: test/seasonrecord.test.mjs.
//   seasonRecord(season, { you }) -> a record (a season in play)
//   finalRecord(season, { at, you }) -> the record as it ended, to keep -
//     null when nothing was played
//   withPast(past, record) -> the past seasons with it, newest first
//   cleanPast(x) -> the past seasons as kept, made sound

import { standings, placeWords, moneyWords, nextEvent, toParWords, FIELDS, YOU } from "./season.mjs";

// How many past seasons are kept.
export const PAST_KEPT = 12;

// A record: { name, field (its name), events: n, played, next (the next
// event's index, or -1), over (all played), early (ended before then),
// endedAt, you: { place, of, points, money, wins, best } | null,
// rounds: [{ k, name, course, done, next, mine: { pos, tied, toPar,
// points, money } | null, winner: { name, toPar } | null }],
// standings: [{ place, name, points, money, played, wins, me }] }.
export function seasonRecord(season, { you = "You" } = {}) {
  if (!season?.events?.length) return null;
  const table = standings(season);
  const played = season.events.filter((e) => e.done).length;
  const next = nextEvent(season);
  // Places: level points (and money) share one.
  let place = 0;
  const rows = table.map((r, i) => {
    const prev = table[i - 1];
    place = i && prev.points === r.points && prev.money === r.money ? place : i + 1;
    return { place, name: r.id === YOU ? you : r.name, points: r.points, money: r.money, played: r.played, wins: r.wins, me: r.id === YOU };
  });
  const mine = rows.find((r) => r.me);
  const meRow = table.find((r) => r.id === YOU);
  return {
    name: season.name,
    field: FIELDS[season.field]?.name ?? "",
    events: season.events.length,
    played,
    next,
    over: next < 0,
    early: false,
    endedAt: null,
    you: played ? { place: mine.place, of: rows.length, points: mine.points, money: mine.money, wins: meRow.wins, best: meRow.best } : null,
    rounds: season.events.map((e, k) => {
      const me = e.done ? e.results?.find((r) => r.id === YOU) : null;
      const top = e.done ? e.results?.[0] : null;
      return { k, name: e.name, course: e.course, done: !!e.done, next: k === next, mine: me ? { pos: me.pos, tied: !!me.tied, toPar: me.toPar, points: me.points, money: me.money } : null, winner: top ? { name: top.id === YOU ? you : top.name, toPar: top.toPar } : null };
    }),
    standings: rows,
  };
}

// The season as it ended - played to the last event, or ended early - to
// keep with the past ones. Nothing played: nothing to keep (null).
export function finalRecord(season, { at = Date.now(), you = "You" } = {}) {
  const r = seasonRecord(season, { you });
  if (!r?.played) return null;
  // (Nothing's next once it's ended: the events not played stay not played.)
  return { ...r, next: -1, early: !r.over, endedAt: at, rounds: r.rounds.map((e) => ({ ...e, next: false })) };
}

// The past seasons with this one, newest first, no more than PAST_KEPT.
export const withPast = (past, record) => (record ? [record, ...cleanPast(past)].slice(0, PAST_KEPT) : cleanPast(past));
export const cleanPast = (x) => (Array.isArray(x) ? x.filter((r) => r && typeof r.name === "string" && Array.isArray(r.standings) && Array.isArray(r.rounds) && Number.isFinite(r.endedAt)) : []);

// ---- In words --------------------------------------------------------------------------

// "3 of 6 events played", "Season over", "Ended after 3 of 6 events".
export function stateWords(r) {
  if (r.early) return `Ended after ${r.played} of ${r.events} event${r.events === 1 ? "" : "s"}`;
  if (r.over) return `Season over - all ${r.events} events played`;
  return `${r.played} of ${r.events} events played`;
}
// "You finished 5th of 40: 450 pts, £12,345 - 1 win", "You're 2nd ...".
export function youWords(r) {
  const y = r.you;
  if (!y) return "Nothing played yet - the first event puts you on the table.";
  const done = r.over || r.early;
  const champion = done && y.place === 1 ? " - champion!" : "";
  return `${done ? "You finished" : "You're"} ${placeWords({ pos: y.place })} of ${y.of}: ${pointsWords(y.points)}, ${moneyWords(y.money)}${y.wins ? ` - ${y.wins} win${y.wins === 1 ? "" : "s"}` : ""}${champion}`;
}
export const pointsWords = (n) => `${Number(n).toLocaleString("en-GB")} pts`;
// An event's result of yours: "T4th, -2, 110 pts, £800".
export const resultWords = (m) => (m ? `${placeWords(m)}, ${toParWords(m.toPar)}, ${pointsWords(m.points)}, ${moneyWords(m.money)}` : "");
// When a past season ended: "17 November 2026".
export const endedWords = (at) => new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
