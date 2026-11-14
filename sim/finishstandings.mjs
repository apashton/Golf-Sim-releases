// The standings at the finish (the owner, 5 November 2026: "a way to show
// the season rankings on the final screen and the finish screen alongside
// the scorecard. So any online seasons, match ladders, stuff like that show
// on the finish"): what a finished round counted for, each as a block of
// standings - beside the round card at the end of a round (roundcard.js)
// and in the recording's Finish scene (compositor.js, the "standings"
// layer). Pure: each kind's own module works its table out; this says it
// the same way for all of them.
//
// A block: { kind, title, line, rows: [{ place, name, value, me } | { gap:
// true }] } - the top TOP and those this bay plays as (me) wherever they
// are, a gap where rows are skipped.
//   kind  "season" (a season on this PC, against made-up golfers),
//         "netseason" (an online season played together), "match" (the
//         online match over several games), "ladder" (a match ladder)

import { standings, placeWords, moneyWords, YOU } from "./season.mjs";
import { netSeasonTable, netSeasonLine, eventPoints } from "./netseason.mjs";
import { matchTable, matchLine } from "./netmatch.mjs";

export const TOP = 5;
export const KIND_TITLES = { season: "Season", netseason: "Online season", match: "Match", ladder: "Match ladder" };

// The rows kept: the top `top` and any marked me, a gap where rows are
// skipped between them.
export function keepRows(rows, top = TOP) {
  const out = [];
  let last = -1;
  rows.forEach((r, i) => {
    if (i >= top && !r.me) return;
    if (last >= 0 && i > last + 1) out.push({ gap: true });
    out.push(r);
    last = i;
  });
  return out;
}

const pts = (n) => `${Number(n).toLocaleString("en-GB")} pts`;

// A season on this PC whose event k this round was (sim/season.mjs - its
// event recorded): how you finished it, and the season's standings. you:
// the name to say for "you".
export function seasonBlock(season, k, { you = "You" } = {}) {
  const e = season?.events?.[k];
  if (!e?.done) return null;
  const mine = e.results?.find((r) => r.id === YOU);
  const table = standings(season);
  const played = season.events.filter((x) => x.done).length;
  const line = [mine ? `${e.name}: ${placeWords(mine)}, ${mine.points} pts, ${moneyWords(mine.money)}` : e.name, `after ${played} of ${season.events.length} events`].join(" - ");
  const rows = table.map((r, i) => ({ place: i + 1, name: r.id === YOU ? you : r.name, value: pts(r.points), me: r.id === YOU }));
  return { kind: "season", title: season.name, line, rows: keepRows(rows) };
}

// An online season (sim/netseason.mjs) whose event k this round was:
// where everyone finished it, once the host's recorded it, and the
// standings. mine: the names this bay plays as.
export function netSeasonBlock(s, k, { mine = [] } = {}) {
  const e = s?.events?.[k];
  if (!e) return null;
  const me = new Set(mine);
  const won = e.done ? e.places.filter((p) => p.place === 1).map((p) => p.name) : [];
  const line = e.done ? `${e.name}: won by ${won.join(" and ")}${won.length === 1 && e.places[0].text ? ` (${e.places[0].text})` : ""}${pointsOf(e, mine)} - ${netSeasonLine(s)}` : `${e.name}: being counted by the host`;
  const rows = netSeasonTable(s).map((r) => ({ place: r.place, name: r.name, value: pts(r.points), me: me.has(r.name) }));
  return { kind: "netseason", title: s.name, line, rows: keepRows(rows) };
}
// (This bay's player's place and points in it - only the points when
// they won it, said already.)
function pointsOf(e, mine) {
  const got = eventPoints(e.places);
  const ours = e.places.filter((p) => mine.includes(p.name));
  if (ours.length !== 1) return "";
  const p = ours[0];
  const alone = e.places.filter((q) => q.place === 1).length === 1;
  return p.place === 1 && alone ? `, ${got.get(p.name)} pts` : `; ${p.name} ${placeWords({ pos: p.place, tied: e.places.filter((q) => q.place === p.place).length > 1 })}, ${got.get(p.name)} pts`;
}

// The online match over several games (sim/netmatch.mjs): its table.
export function matchBlock(m, { mine = [] } = {}) {
  const t = matchTable(m);
  if (!t.length) return null;
  const me = new Set(mine);
  const rows = t.map((r) => ({ place: r.place, name: r.name, value: `${r.points} pts`, me: me.has(r.name) }));
  return { kind: "match", title: m.name, line: matchLine(m), rows: keepRows(rows) };
}

// A match ladder (sim/matchladder.mjs ladderState) after its match: the
// match's result in words, and the rungs - each player's record - with
// the two who played marked: "W3 L1" (and halved, H, if any).
export function ladderBlock({ name, state, match, players = [] } = {}) {
  if (!state?.rungs?.length) return null;
  const result = state.results?.find((r) => r.match === match) ?? null;
  const two = new Set(players);
  const rows = state.rungs.map((id, i) => {
    const p = state.players[id] ?? { name: id };
    return { place: i + 1, name: p.name, value: `W${p.won ?? 0} L${p.lost ?? 0}${p.halved ? ` H${p.halved}` : ""}`, me: two.has(id) };
  });
  return { kind: "ladder", title: name, line: result?.words ?? "The match is being reported", rows: keepRows(rows) };
}

// The blocks, in the order they're shown: the round's own competition
// first (a season's event, a ladder match), the match over several games
// last; none missing.
export function finishBlocks(blocks) {
  const order = ["season", "netseason", "ladder", "match"];
  return (blocks ?? []).filter(Boolean).sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}
