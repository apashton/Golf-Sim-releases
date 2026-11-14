// Where everyone finished an online game, for the host's match over several
// games (sim/netmatch.mjs): a round on the course from its standings (the
// game it was - stroke play, stableford, skins... sim/formats.mjs), a
// putting, chipping or Challenge game from its tally, golf pong from who
// won and the cups each holed. { id, name, places: [{ name, place, text }] },
// or null while the game isn't over.

import { tallyRows } from "./netgame.mjs";
import { placesOf } from "./netmatch.mjs";

// A round on the course: players [{ name }] and the standings
// (formats.mjs standingsFor: byPlayer[i] { place, text }).
export function courseResult({ id, name, players, st }) {
  if (!st?.byPlayer || !players?.length) return null;
  const places = players
    .map((p, i) => {
      const row = st.byPlayer[i];
      return row && Number.isInteger(row.place) ? { name: p.name, place: row.place, text: row.text ?? "" } : null;
    })
    .filter(Boolean);
  return places.length ? { id, name, places } : null;
}

// Putting, chipping or a Challenge: once everyone's finished.
export function tallyResult(g) {
  if (!g?.started || !g.tally) return null;
  const t = tallyRows(g);
  if (!t.finished) return null;
  const places = t.rows.filter((r) => !r.dropped && r.played > 0).map((r) => ({ name: r.name, place: r.place, text: `${r.total} pts` }));
  return places.length ? { id: g.round.id, name: g.round.name, places } : null;
}

// Golf pong: the winner first, the rest by the cups they holed.
export function pongResult(g) {
  const m = g?.pong;
  if (!m || m.winner == null) return null;
  const rows = g.players.map((p, i) => ({ name: p.name, value: i === m.winner ? Infinity : (m.holed?.[i] ?? 0), text: `${m.holed?.[i] ?? 0} cups` }));
  // (The winner's Infinity: counted as the most, first.)
  const places = placesOf(rows.map((r) => ({ ...r, value: Number.isFinite(r.value) ? r.value : 1e9 })), { high: true });
  return { id: g.round.id, name: g.round.name ?? "Golf pong", places };
}

// The course's leaderboard beside the map, online (course.js
// drawStandings): the players by where they stand - the game's standing
// when it's shown (game: course/netflights.js game()), else to par over the
// holes played - with their places (level ones share; none before a hole's
// played). [{ i, place }]
export function boardOrder(players, pars, game = null) {
  const rows = players.map((p, i) => {
    const st = game?.shown ? game.st?.byPlayer?.[i] : null;
    if (st && Number.isInteger(st.place)) return { i, key: st.place, any: p.scores.some((s) => s != null) };
    let over = 0;
    let played = 0;
    p.scores.forEach((s, h) => {
      if (s == null) return;
      over += s - (pars[h] ?? 0);
      played++;
    });
    return { i, key: played ? over : Infinity, any: played > 0 };
  });
  const order = [...rows].sort((a, b) => a.key - b.key || a.i - b.i);
  const places = [];
  order.forEach((r, k) => places.push(!r.any || !Number.isFinite(r.key) ? null : k > 0 && order[k - 1].key === r.key && places[k - 1] != null ? places[k - 1] : k + 1));
  return order.map((r, k) => ({ i: r.i, place: places[k] }));
}
