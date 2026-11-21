// What the Tour says as the game opens (docs/TOUR-PLAN.md, "the notice as
// the game opens"; the owner, 14 November 2026: the Tour's "key in getting
// original players to come back"): one line, and only when there's
// something new -
//   passed   a place of yours gone down since you last looked (the week's
//            round, this week's green's or up and down's boards)
//   last     how last week went (once a week): your round and its places,
//            where you stand in the season
//   open     the week's round open and not begun yet (once a day)
// The first of them there is; nothing when there's none.
//
// Pure: public/tournotice.js asks the Tour and shows it (test/tournotice.test.mjs).
//   seen: { week, places: { [key]: place }, last: the week last said, open:
//   the day the open round was last said }

import { EVENTS, MEASURES, DIVISIONS, toParWords, placeWords, ordinal } from "./tour.mjs";

// This week's places of yours, by board: { "round:world": 3, "putt:monitor:made": 2, ... }.
export function placesOf(mine) {
  const out = {};
  const r = mine?.round;
  if (r?.sent) for (const b of ["world", "net", "flight"]) if (Number.isInteger(r.places?.[b])) out[`round:${b}`] = r.places[b];
  for (const event of ["putt", "updown"])
    for (const [division, card] of Object.entries(mine?.[event] ?? {}))
      for (const [m, p] of Object.entries(card?.places ?? {})) if (Number.isInteger(p) && card.shots > 0) out[`${event}:${division}:${m}`] = p;
  return out;
}

// A board's name in words: "the week's round", "net", "this week's green (most made, launch monitor)".
function boardWords(key) {
  const [event, a, b] = key.split(":");
  if (event === "round") return a === "world" ? "the week's round" : a === "net" ? "the week's round, net" : "the week's round, in your flight";
  return `${EVENTS[event]?.name.toLowerCase() ?? event} (${MEASURES[b]?.name.toLowerCase() ?? b}, ${DIVISIONS[a]?.name.toLowerCase() ?? a})`;
}

// What to say now - { kind, text, seen } with what's seen after - or null.
//   week: this week's number; day: today (a number); round: the week's round
//   setup (or null); mine: this account's this week (TourHub mine); last:
//   its last week (or null when not asked); season: its season rows by
//   division (or null).
export function tourNotice({ week, day, round = null, mine = null, last = null, season = null, seen = null }) {
  const was = seen && typeof seen === "object" ? seen : {};
  const now = placesOf(mine);
  const before = was.week === week ? (was.places ?? {}) : {};
  const after = (extra) => ({ ...was, week, places: now, ...extra });
  // Passed: the biggest drop first.
  const drops = Object.entries(now)
    .filter(([k, p]) => Number.isInteger(before[k]) && p > before[k])
    .sort((x, y) => y[1] - before[y[0]] - (x[1] - before[x[0]]));
  if (drops.length) {
    const [k, p] = drops[0];
    const more = drops.length > 1 ? ` (and ${drops.length - 1} more board${drops.length > 2 ? "s" : ""})` : "";
    return { kind: "passed", text: `The Tour: you've been passed - ${ordinal(p)} now on ${boardWords(k)}, from ${ordinal(before[k])}${more}. Tour at the top to see the boards`, seen: after({}) };
  }
  // Last week, once.
  if (last && was.last !== week - 1) {
    const r = last.round;
    const parts = [];
    if (r?.sent && !r.held) parts.push(`your round ${r.gross} (${toParWords(r.toPar)}) - ${placeWords(r.places.world, r.counts.world)}, ${ordinal(r.places.net)} net, ${ordinal(r.places.flight)} in your flight`);
    for (const event of ["putt", "updown"]) {
      const cards = Object.values(last[event] ?? {}).filter((c) => c?.shots > 0);
      const best = cards.sort((x, y) => (x.places?.made ?? 1e9) - (y.places?.made ?? 1e9))[0];
      if (best) parts.push(`${EVENTS[event].short.toLowerCase()} ${best.made} ${EVENTS[event].made} (${ordinal(best.places.made)})`);
    }
    const rows = Object.values(season ?? {}).filter(Boolean).sort((x, y) => x.place - y.place);
    if (rows[0]) parts.push(`the season: ${placeWords(rows[0].place, rows[0].count)}`);
    if (parts.length) return { kind: "last", text: `The Tour, last week: ${parts.join("; ")}`, seen: after({ last: week - 1 }) };
  }
  // The round open, not begun: once a day.
  if (round && !mine?.round?.began && was.open !== day) return { kind: "open", text: `The Tour: this week's round is open - ${round.name}, nine holes, one go. Tour at the top to play it`, seen: after({ open: day }) };
  return null;
}

// What's seen once the boards have been looked at (the Tour's panel open).
export const lookedAt = (seen, week, mine) => ({ ...(seen && typeof seen === "object" ? seen : {}), week, places: placesOf(mine) });
