// The Challenges: short games with a score to beat, for one to four players
// taking turns hole by hole. What the games are, whose turn it is, the
// totals and who won, personal bests, and what the end of a game deserves.
// Pure, so the rules can be tested; challenges.js does the rest.

import { describeLevel } from "./celebration.mjs";

// The games, in the order they're offered. `holes` is how many each player
// plays; `max` the best possible score (null where there's no ceiling);
// `kind` what the stats call it (recorder.js), for its shots and games.
export const GAMES = [
  {
    id: "approach",
    kind: "approach-ladder",
    name: "Approach ladder",
    rules: "A circle round the pin shrinks after every shot inside it, 40 ft down to 10 ft. Three holes, ten shots at most on each - the first miss ends the hole.",
    holes: 3,
    max: 30,
  },
  {
    id: "driving",
    kind: "driving-challenge",
    name: "Driving challenge",
    rules: "Nine holes, wide open to narrow, some needing a draw or a fade. Points for distance, heavy penalties for missing the fairway.",
    holes: 9,
    max: null,
  },
  {
    id: "chipping",
    kind: "chip-ladder",
    name: "Chipping ladder",
    rules: "The same shrinking circle, 11 ft down to 2 ft, on one green: three pins, chipping 10-30 yds from the fringe, the approach and the rough.",
    holes: 3,
    max: 30,
  },
  {
    id: "approachtest",
    kind: "approach-challenge",
    name: "Approach challenge",
    rules: "Nine approaches, one shot each, from the fairway, the first cut, the rough, a fairway bunker and the four slopes. Up to 100 a shot for finishing close - a tour pro averages about 60.",
    holes: 9,
    max: 900,
  },
];
export const gameById = (id) => GAMES.find((g) => g.id === id) ?? null;

// A game in progress: who's playing, each one's score on each hole, and
// whose turn it is. Turns go hole by hole: everyone plays the first hole in
// the listed order, then everyone plays the second, and so on.
export class Match {
  // players: [{ name, colour }]
  constructor(players, holes) {
    this.holes = holes;
    this.players = players.map((p) => ({ ...p, scores: Array(holes).fill(null) }));
    this.turn = 0; // index into the whole sequence of turns
  }

  get turns() {
    return this.holes * this.players.length;
  }
  get finished() {
    return this.turn >= this.turns;
  }
  // The hole being played and whose turn it is (null once finished).
  get hole() {
    return this.finished ? null : Math.floor(this.turn / this.players.length);
  }
  get playerIndex() {
    return this.finished ? null : this.turn % this.players.length;
  }
  get player() {
    return this.finished ? null : this.players[this.playerIndex];
  }
  // Whether this turn starts a new hole (so the scene changes).
  get newHole() {
    return !this.finished && this.turn % this.players.length === 0;
  }

  // The player whose turn it is has finished their hole with this score.
  // Returns what comes next: { finished, newHole }.
  record(points) {
    if (this.finished) return { finished: true, newHole: false };
    this.players[this.playerIndex].scores[this.hole] = points;
    this.turn++;
    return { finished: this.finished, newHole: this.newHole };
  }

  total(i) {
    return this.players[i].scores.reduce((a, s) => a + (s ?? 0), 0);
  }
}

// Everyone's totals, best first (higher is better). Level totals share a
// place and keep the listed order.
export function results(match) {
  const rows = match.players.map((p, index) => ({ index, name: p.name, colour: p.colour, scores: [...p.scores], total: match.total(index) }));
  rows.sort((a, b) => b.total - a.total || a.index - b.index);
  let place = 0;
  rows.forEach((r, i) => {
    if (i === 0 || r.total !== rows[i - 1].total) place = i + 1;
    r.place = place;
  });
  return rows;
}

// Who won: everyone on the top total.
export function winnerNames(rows) {
  return rows.filter((r) => r.place === 1).map((r) => r.name);
}

export function winnerLine(rows) {
  const names = winnerNames(rows);
  if (names.length === 1) return `${names[0]} wins!`;
  if (names.length === rows.length) return "All square!";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} tie!`;
}

// ---- Personal bests --------------------------------------------------------------

// The key a best is kept under: the game and whatever option changes how
// hard it is (a distance band, a green's slopes).
export const bestKey = (game, option) => `challenge:${game}:${option}`;

// Personal bests, as scoring.mjs keeps them ({ [key]: { score, date, name } }),
// for a finished game: the top score of the game counts, and its player's
// name is kept when there were several (with one, there's no one to tell
// them from). Nothing made is nothing to beat, so a score of 0 or less is
// never a best. Returns { bests, isBest, previous, name }.
export function recordChallengeBest(bests, key, rows, multi, date = new Date().toISOString().slice(0, 10)) {
  const top = rows[0];
  const old = bests[key];
  if (!top || top.total <= 0 || (old && old.score >= top.total)) return { bests, isBest: false, previous: old?.score ?? null, name: null };
  const entry = { score: top.total, date };
  if (multi) entry.name = winnerNames(rows).join(" & ");
  return { bests: { ...bests, [key]: entry }, isBest: true, previous: old?.score ?? null, name: entry.name ?? null };
}

// ---- For each player's stats ------------------------------------------------------

// What a challenge shot says about the game it belongs to, for the stats
// (recorder.js's `game`): the kind, this game's id, the option played (the
// best's key) and the hole, 1 to 9. `extra` is the game's own few fields.
export function shotGame(meta, { id, key, hole }, extra = {}) {
  return { kind: meta.kind, id, key, ...(Number.isInteger(hole) ? { hole: hole + 1 } : {}), ...extra };
}

// A finished game, one record per player (recorder.js's onGame): their own
// total and hole-by-hole scores, the option played by name, and whether
// they won. The end-of-game note is only for someone playing alone, as on
// the course: with friends it would be one player's out of several.
export function gameRecords(meta, { id, key, optionName }, rows, multi) {
  const winners = winnerNames(rows);
  return rows.map((r) => ({
    kind: meta.kind,
    id,
    key,
    name: optionName,
    player: r.name,
    score: r.total,
    scores: r.scores,
    ...(multi ? { players: rows.length, won: winners.includes(r.name) } : {}),
    note: !multi,
  }));
}

// ---- The end of a game -----------------------------------------------------------

// How big a party the end of a game gets: by how much of the best possible
// score it made, with a new personal best a rung higher (never below a
// bright banner). Uses the course's celebration ladder (celebration.mjs),
// so a better score never gets less than a worse one.
//  score, max  the top score and the most possible (max null: use `share`)
//  share       0-1, how good the score is where there's no maximum
export function challengeLevel({ score, max = null, share = null, isBest = false }) {
  const k = max ? score / max : Math.max(0, Math.min(1, share ?? 0));
  let level = k >= 0.9 ? 3 : k >= 0.7 ? 2 : k >= 0.45 ? 1 : k >= 0.2 ? 0 : -1;
  if (isBest) level = Math.max(1, Math.min(3, level + 1));
  return level;
}

export function challengeCelebration({ game, rows, max = null, share = null, isBest = false, previous = null, multi = false }) {
  const top = rows[0]?.total ?? 0;
  const level = challengeLevel({ score: top, max, share, isBest });
  const d = describeLevel(level);
  const out = max ? ` out of ${max}` : "";
  let title = level >= 2 ? "Brilliant!" : level >= 1 ? "Well played!" : "Game over";
  let subtitle = `${top}${out}`;
  if (multi) {
    title = winnerLine(rows);
    subtitle = rows.map((r) => `${r.name} ${r.total}`).join(" - ");
  }
  let detail = game.name;
  if (isBest) detail = previous == null ? `${game.name} - first score` : `New personal best! (was ${previous})`;
  if (isBest && !multi) title = "New personal best!";
  return {
    tier: `challenge-${level}`,
    level,
    round: true,
    title,
    subtitle,
    detail,
    wrap: multi,
    ...d,
    // The results stay on screen, so the banner needn't hurry.
    hold: d.hold + 2,
    // Nothing to circle: the results card is what matters now.
    camera: null,
  };
}
