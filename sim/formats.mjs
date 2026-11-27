// Games with friends: stroke play, Stableford, match play and skins, and
// in teams better ball and the scramble (sim/teams.mjs), with handicap
// strokes. Who gets strokes where, each game's standings as the
// round goes, what a finished hole meant, and who won. Pure: course.js
// shows it, and the same standings are worked out on every bay of an online
// game (sim/netgame.mjs), from the same scores.
//
// Handicaps: each player's course handicap from their handicap index and
// the course (sim/handicap.mjs: the rating from its length), the strokes
// given on the hardest holes by the card's stroke index. 100% of it in
// every game; in match play the lowest handicap plays off scratch and the
// others get the difference. A player with no index plays off scratch.

import { courseHandicap, courseRating, strokesByHole, STANDARD_SLOPE } from "./handicap.mjs";
import { teamsOf, teamName, scrambleHandicap, TEAM_FORMATS } from "./teams.mjs";

export const FORMATS = ["stroke", "stableford", "match", "skins", "bestball", "scramble"];
export const FORMAT_NAMES = { stroke: "Stroke play", stableford: "Stableford", match: "Match play", skins: "Skins", bestball: "Better ball", scramble: "Scramble" };
export const FORMAT_HELP = {
  stroke: "Every stroke counts; lowest total wins - net of handicaps with them on.",
  stableford: "Points a hole against your net par: 1 for a bogey, 2 a par, 3 a birdie, 4 an eagle. Most points wins; a bad hole costs no more than nothing.",
  match: "Hole by hole: the lower net score wins the hole. Two players head to head, or two teams (the better ball of each side wins the hole).",
  skins: "Each hole is worth a skin to the one lowest net score on it; a tie carries it on to the next hole.",
  bestball: "In teams: everyone plays their own ball, and each hole the team's best net score counts. Lowest team total wins.",
  scramble: "In teams: everyone hits, the captain picks the best ball, and everyone plays the next shot from there, until it's holed. Lowest team total wins.",
};

// Match play needs two sides: two players, or two teams. The team games
// need at least two players. teamOf: each player's team (sim/teams.mjs);
// without it four players are the first two against the last two.
export function formatFits(format, players, teamOf = null) {
  if (format === "match") return players === 2 || (teamOf ? teamsOf(teamOf.slice(0, players)).length === 2 : players === 4);
  if (TEAM_FORMATS.includes(format)) return players >= 2;
  return true;
}

// Match play's two sides, as player indices.
export function matchSides(n, teamOf = null) {
  if (n === 2) return [[0], [1]];
  if (teamOf) {
    const t = teamsOf(teamOf.slice(0, n));
    if (t.length === 2) return t.map((x) => x.members);
  }
  return [[0, 1], [2, 3]];
}

// The teams of a team game, as player indices; everyone alone without
// teamOf.
const teamList = (n, teamOf) => (teamOf ? teamsOf(teamOf.slice(0, n)).map((t) => t.members) : Array.from({ length: n }, (_, i) => [i]));

// Each player's handicap strokes on each hole.
//   players  [{ index }]: handicap index, or null
//   holes    [{ par, yards, si }] for every hole of the course
//   on       false: nobody gets any
// Returns [{ courseHandicap, strokes: [per hole] }].
export function handicapStrokes(players, holes, { on = true, format = "stroke", slope = STANDARD_SLOPE } = {}) {
  const none = () => ({ courseHandicap: null, strokes: holes.map(() => 0) });
  if (!on || !holes.length) return players.map(none);
  const rating = courseRating(holes);
  const par = holes.reduce((a, h) => a + (h.par ?? 4), 0);
  const n = Math.min(18, holes.length);
  const ch = players.map((p) => (Number.isFinite(p.index) && rating != null ? courseHandicap(p.index, { rating, par, slope, holes: n }) : null));
  // Match play: off the lowest.
  const low = format === "match" ? Math.min(...ch.map((c) => c ?? 0)) : 0;
  return ch.map((c) => {
    if (c == null) return none();
    const give = Math.max(0, c - low);
    return { courseHandicap: c, strokes: strokesByHole(holes, give) };
  });
}

// A score is null (not played yet), or strokes. PICK_UP: the course picks
// the ball up at this many (course.js MAX_STROKES).
export const PICK_UP = 10;
const played = (s) => Number.isFinite(s);
// Where the round began: the first hole anyone has a score on. A round
// started part way round (the designer's Play this hole, a video's online
// game) has nobody's on the holes before it, and those don't stop the
// holes after them counting. Results stay indexed by hole (null before).
function firstPlayed(players, holes) {
  const h = holes.findIndex((_, i) => players.some((p) => played(p.scores[i])));
  return h < 0 ? 0 : h;
}
const net = (score, strokes) => score - (strokes ?? 0);
export const stablefordPoints = (score, par, strokes = 0) => (played(score) && score < PICK_UP ? Math.max(0, 2 + par + strokes - score) : 0);

const pluralPts = (n) => `${n} pt${n === 1 ? "" : "s"}`;
const signed = (v) => (v === 0 ? "E" : v > 0 ? `+${v}` : `${v}`);

// The standings of a game so far.
//   players  [{ name, scores: [per hole] }]
//   holes    [{ par }]
//   hs       handicapStrokes(...)
//   teamOf   each player's team, for the team games and match play
// Returns { format, rows: [{ index, name, value, text, place }], line,
// done: bool (a match decided early), winners: [index], title, byPlayer }.
// In the team games a row is a team (index its place in the teams list,
// members its players); byPlayer is each player's row either way.
export function standingsFor(format, players, holes, hs, teamOf = null) {
  const out = standingsOnly(format, players, holes, hs, teamOf);
  out.byPlayer = players.map((_, i) => out.rows.find((r) => (r.members ? r.members.includes(i) : r.index === i)) ?? null);
  return out;
}

function standingsOnly(format, players, holes, hs, teamOf) {
  const pars = holes.map((h) => h.par);
  const st = (i, h) => hs?.[i]?.strokes?.[h] ?? 0;
  if (format === "bestball" || format === "scramble") return teamStandings(format, players, holes, hs, teamOf);
  if (format === "stableford") {
    const rows = players.map((p, i) => {
      const pts = p.scores.reduce((a, s, h) => a + stablefordPoints(s, pars[h], st(i, h)), 0);
      return { index: i, name: p.name, value: pts, text: pluralPts(pts) };
    });
    return ranked("stableford", rows, (a, b) => b.value - a.value);
  }
  if (format === "match" && formatFits("match", players.length, teamOf)) return matchStandings(players, holes, hs, teamOf);
  if (format === "skins") return skinsStandings(players, holes, hs);
  // Stroke play: net with handicaps, else gross.
  const rows = players.map((p, i) => {
    let gross = 0;
    let netTotal = 0;
    let parTotal = 0;
    let holesPlayed = 0;
    p.scores.forEach((s, h) => {
      if (!played(s)) return;
      gross += s;
      netTotal += net(s, st(i, h));
      parTotal += pars[h];
      holesPlayed++;
    });
    const usesNet = hs?.some((x) => x.courseHandicap != null);
    const value = usesNet ? netTotal : gross;
    return { index: i, name: p.name, value: holesPlayed ? value : Infinity, toPar: holesPlayed ? value - parTotal : Infinity, holesPlayed, text: holesPlayed ? `${usesNet ? `net ${netTotal}` : gross} (${signed(value - parTotal)})` : "-" };
  });
  // Ranked on to par: the same order as the totals once everyone has played
  // the same holes, and a fair one before - 4 on one hole doesn't beat 12
  // on three.
  return ranked("stroke", rows, byToPar);
}

// Stroke play's order (and a team's): the fewest over par first (none
// played, last). (Infinity - Infinity is NaN: equal.)
function byToPar(a, b) {
  if (a.toPar === b.toPar) return 0;
  return a.toPar - b.toPar;
}

function ranked(format, rows, cmp) {
  const order = [...rows].sort((a, b) => cmp(a, b) || a.index - b.index);
  order.forEach((r, k) => (r.place = k > 0 && cmp(order[k - 1], r) === 0 ? order[k - 1].place : k + 1));
  const any = rows.some((r) => Number.isFinite(r.value) && (r.holesPlayed ?? 1) > 0);
  const winners = any ? order.filter((r) => r.place === 1).map((r) => r.index) : [];
  const names = winners.map((i) => rows[i].name);
  return {
    format,
    rows,
    order: order.map((r) => r.index),
    line: order.filter((r) => r.text !== "-").map((r) => `${r.name} ${r.text}`).join(" · "),
    done: false,
    winners,
    title: !names.length ? "Round complete" : names.length === 1 ? `${names[0]} wins!` : `${names.slice(0, -1).join(", ")} and ${names.at(-1)} tie!`,
  };
}

// Match play: singles (2) or better ball (two teams; with no teams, 2 v 2:
// players 0 and 1 against 2 and 3). Each hole to the lower net score of
// each side's best.
function matchStandings(players, holes, hs, teamOf) {
  const sides = matchSides(players.length, teamOf);
  const four = sides.some((s) => s.length > 1);
  const sideName = (s) => teamName(sides[s], players.map((p) => p.name));
  let up = 0; // + side 0 ahead
  let playedHoles = 0;
  let decidedAt = null;
  const start = firstPlayed(players, holes);
  const results = Array(start).fill(null);
  for (let h = start; h < holes.length; h++) {
    const best = sides.map((side) => {
      const nets = side.map((i) => (played(players[i].scores[h]) ? net(players[i].scores[h], hs?.[i]?.strokes?.[h] ?? 0) : null));
      if (nets.some((v) => v == null)) return null;
      return Math.min(...nets);
    });
    if (best.some((v) => v == null)) break;
    playedHoles++;
    const w = best[0] < best[1] ? 0 : best[1] < best[0] ? 1 : null;
    if (w === 0) up++;
    if (w === 1) up--;
    results.push(w);
    const left = holes.length - start - playedHoles;
    if (decidedAt == null && Math.abs(up) > left) decidedAt = { up: Math.abs(up), left, side: up > 0 ? 0 : 1 };
  }
  const left = holes.length - start - playedHoles;
  const lead = Math.abs(up);
  const leader = up > 0 ? 0 : up < 0 ? 1 : null;
  let status;
  if (decidedAt) status = `${sideName(decidedAt.side)} win${four ? "" : "s"} ${decidedAt.left ? `${decidedAt.up} & ${decidedAt.left}` : `${decidedAt.up} up`}`;
  else if (!playedHoles) status = "All square";
  else if (!left) status = leader == null ? "Match halved" : `${sideName(leader)} win${four ? "" : "s"} ${lead} up`;
  else status = leader == null ? `All square with ${left} to play` : `${sideName(leader)} ${lead} up${lead === left ? " (dormie)" : ""} with ${left} to play`;
  const winSide = decidedAt ? decidedAt.side : !left && leader != null ? leader : null;
  const rows = players.map((p, i) => {
    const side = sides.findIndex((s) => s.includes(i));
    const mine = side === 0 ? up : -up;
    return { index: i, name: p.name, value: mine, side, text: mine === 0 ? "AS" : mine > 0 ? `${mine} up` : `${-mine} down` };
  });
  const winners = winSide == null ? [] : sides[winSide];
  return {
    format: "match",
    rows,
    order: [...rows].sort((a, b) => b.value - a.value || a.index - b.index).map((r) => r.index),
    line: status,
    status,
    results,
    done: !!decidedAt || (!left && playedHoles > 0),
    winners,
    title: winSide == null ? (playedHoles ? "Match halved" : "Round complete") : `${sideName(winSide)} win${four ? "" : "s"}!`,
  };
}

// Skins: the one lowest net score on a hole wins it and any carried; a tie
// carries it on. Skins still carried at the end go unwon.
function skinsStandings(players, holes, hs) {
  const won = players.map(() => 0);
  let carry = 0;
  const start = firstPlayed(players, holes);
  const results = Array(start).fill(null);
  for (let h = start; h < holes.length; h++) {
    if (!players.every((p) => played(p.scores[h]))) break;
    const nets = players.map((p, i) => net(p.scores[h], hs?.[i]?.strokes?.[h] ?? 0));
    const low = Math.min(...nets);
    const at = nets.map((v, i) => (v === low ? i : -1)).filter((i) => i >= 0);
    const worth = carry + 1;
    if (at.length === 1) {
      won[at[0]] += worth;
      results.push({ winner: at[0], skins: worth });
      carry = 0;
    } else {
      results.push({ winner: null, skins: 0, carried: worth });
      carry = worth;
    }
  }
  const rows = players.map((p, i) => ({ index: i, name: p.name, value: won[i], text: `${won[i]} skin${won[i] === 1 ? "" : "s"}` }));
  const out = ranked("skins", rows, (a, b) => b.value - a.value);
  out.results = results;
  out.carry = carry;
  if (carry) out.line += ` · ${carry} carried`;
  if (!rows.some((r) => r.value > 0)) {
    out.winners = [];
    out.title = "Round complete";
  }
  return out;
}

// What a finished hole meant, in the game's words ("Anna 3 pts", "Anna wins
// the hole - 1 up with 4 to play", "Ben wins 2 skins", "Halved - all
// square"), once everyone has finished it. null when it says nothing new.
export function holeWords(format, players, holes, hs, h, teamOf = null) {
  if (!players.every((p) => played(p.scores[h]))) return null;
  const upTo = (list) => list.map((p) => ({ ...p, scores: p.scores.map((s, k) => (k <= h ? s : null)) }));
  const st = standingsFor(format, upTo(players), holes, hs, teamOf);
  if ((format === "bestball" || format === "scramble") && st.holeScores) {
    // Best first; a tie in the teams' order.
    return [...st.rows]
      .sort((a, b) => st.holeScores[a.index][h] - st.holeScores[b.index][h] || a.index - b.index)
      .map((r) => `${r.name} ${st.holeScores[r.index][h]}`)
      .join(" · ");
  }
  if (format === "stableford") {
    return players.map((p, i) => `${p.name} ${pluralPts(stablefordPoints(p.scores[h], holes[h].par, hs?.[i]?.strokes?.[h] ?? 0))}`).join(" · ");
  }
  if (format === "match" && st.results) {
    const w = st.results[h];
    const sides = matchSides(players.length, teamOf);
    const four = sides.some((x) => x.length > 1);
    const who = w == null ? "Halved" : `${teamName(sides[w], players.map((p) => p.name))} win${four ? "" : "s"} the hole`;
    return `${who} - ${st.status}`;
  }
  if (format === "skins" && st.results) {
    const r = st.results[h];
    return r.winner == null ? `Tied - ${r.carried} skin${r.carried === 1 ? "" : "s"} carried to the next` : `${players[r.winner].name} wins ${r.skins} skin${r.skins === 1 ? "" : "s"}`;
  }
  return null;
}

// The team games: each team's score a hole - better ball the best net (or
// gross, with no handicaps) of its players once they've all finished it,
// the scramble the team's one score (every player on it has the same),
// less the team's strokes there. Lowest total wins.
function teamStandings(format, players, holes, hs, teamOf) {
  const teams = teamList(players.length, teamOf);
  const names = players.map((p) => p.name);
  const pars = holes.map((h) => h.par);
  const usesNet = hs?.some((x) => x.courseHandicap != null);
  const holeScores = teams.map((members) => {
    // The scramble's strokes are the team's, from its handicap.
    const teamStrokes =
      format === "scramble" && usesNet ? strokesByHole(holes, scrambleHandicap(members.map((i) => hs?.[i]?.courseHandicap ?? null)) ?? 0) : null;
    return holes.map((_, h) => {
      if (!members.every((i) => played(players[i].scores[h]))) return null;
      if (format === "scramble") {
        const s = players[members[0]].scores[h];
        return usesNet ? s - (teamStrokes?.[h] ?? 0) : s;
      }
      return Math.min(...members.map((i) => (usesNet ? net(players[i].scores[h], hs?.[i]?.strokes?.[h] ?? 0) : players[i].scores[h])));
    });
  });
  const rows = teams.map((members, k) => {
    let total = 0;
    let parTotal = 0;
    let holesPlayed = 0;
    holeScores[k].forEach((v, h) => {
      if (v == null) return;
      total += v;
      parTotal += pars[h];
      holesPlayed++;
    });
    return {
      index: k,
      name: teamName(members, names),
      members,
      value: holesPlayed ? total : Infinity,
      toPar: holesPlayed ? total - parTotal : Infinity,
      holesPlayed,
      text: holesPlayed ? `${usesNet ? `net ${total}` : total} (${signed(total - parTotal)})` : "-",
    };
  });
  const out = ranked(format, rows, byToPar);
  out.holeScores = holeScores;
  // "Anna & Ben win!": a team's names are plural.
  if (out.winners.length === 1 && rows[out.winners[0]].members.length > 1) out.title = `${rows[out.winners[0]].name} win!`;
  return out;
}
