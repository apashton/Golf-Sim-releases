// Teams for a game with friends: who's on which side, the team games'
// names, and the scramble - everyone on the team hits from the same spot,
// the captain picks the best ball, and everyone plays the next from there.
// Pure: course.js shows it and plays it; sim/formats.mjs scores it.
//
// Teams are kept as a team letter per player (0 = A, 1 = B, ...), in the
// players' order: [0, 0, 1, 1] is two against two.

export const MAX_TEAMS = 4;
export const TEAM_LETTERS = ["A", "B", "C", "D"];

// The games played in teams. Match play is too, past two players.
export const TEAM_FORMATS = ["bestball", "scramble"];
export const usesTeams = (format, players) => TEAM_FORMATS.includes(format) || (format === "match" && players > 2);

// A new list's teams: the first half against the second (four players are
// the first two against the last two, as match play always had it).
export const defaultTeams = (n) => Array.from({ length: n }, (_, i) => (i < Math.ceil(n / 2) ? 0 : 1));

// A team letter for each of n players from what was saved: anything
// missing or out of range takes its place in the default split.
export function cleanTeams(saved, n) {
  const def = defaultTeams(n);
  return def.map((d, i) => {
    const t = Array.isArray(saved) ? saved[i] : undefined;
    return Number.isInteger(t) && t >= 0 && t < MAX_TEAMS ? t : d;
  });
}

// The teams that have players: [{ id (letter index), members: [player index] }],
// A first.
export function teamsOf(teamOf) {
  const out = [];
  for (let id = 0; id < MAX_TEAMS; id++) {
    const members = teamOf.map((t, i) => (t === id ? i : -1)).filter((i) => i >= 0);
    if (members.length) out.push({ id, members });
  }
  return out;
}

// "Anna", "Anna & Ben", "Anna, Ben & Cy".
export function teamName(members, names) {
  const n = members.map((i) => names[i]);
  return n.length <= 1 ? (n[0] ?? "") : `${n.slice(0, -1).join(", ")} & ${n.at(-1)}`;
}

// A scramble team's handicap from its players' course handicaps, the
// usual allowances: 35% of the lower and 15% of the higher for two; 30, 20
// and 10% for three; 25, 20, 15 and 10% for four; 10% each past that.
// Lowest handicap first. Null when nobody has one.
const ALLOWANCE = { 1: [1], 2: [0.35, 0.15], 3: [0.3, 0.2, 0.1], 4: [0.25, 0.2, 0.15, 0.1] };
export function scrambleHandicap(courseHandicaps) {
  const have = courseHandicaps.filter((c) => Number.isFinite(c));
  if (!have.length) return null;
  // A player with none plays off scratch.
  const all = courseHandicaps.map((c) => (Number.isFinite(c) ? c : 0)).sort((a, b) => a - b);
  const share = ALLOWANCE[all.length] ?? all.map(() => 0.1);
  return Math.round(all.reduce((a, c, k) => a + c * share[k], 0));
}

// ---- The scramble on a hole ------------------------------------------------------

// One team's state on a hole. stroke: the team's strokes so far (from the
// spot); hit: each member's shot from it this time, by player index
// { ball, lie, strokes (the team's count if it's picked), holed }.
// A team with nobody left in it (online, everyone gone) has finished.
// tee: where the round's tees are on the hole (sim/tees.mjs).
export function newScramble(members, tee = [0, 0]) {
  return { members: [...members], stroke: 0, spot: [...tee], lie: "tee", hit: {}, picking: false, done: !members.length, score: null, picked: [] };
}

// A member's shot from the spot. Holed (or picked up) finishes the hole
// for the team; once everyone has hit, the captain picks.
export function scrambleHit(s, player, shot) {
  if (s.done || s.picking || !s.members.includes(player) || s.hit[player]) return s;
  const hit = { ...s.hit, [player]: { ball: [...shot.ball], lie: shot.lie, strokes: shot.strokes, holed: !!shot.holed } };
  if (shot.holed) return { ...s, hit, done: true, score: shot.strokes };
  const all = s.members.every((m) => hit[m]);
  return { ...s, hit, picking: all };
}

// The captain's choice: everyone plays the next from that ball.
export function scramblePick(s, player) {
  const h = s.hit[player];
  if (!s.picking || !h) return s;
  return { ...s, stroke: h.strokes, spot: [...h.ball], lie: h.lie, hit: {}, picking: false, picked: [...s.picked, player] };
}

// The member still to hit from the spot (in the team's order), or null.
export const scrambleNext = (s) => (s.done || s.picking ? null : (s.members.find((m) => !s.hit[m]) ?? null));

// The captain: the team's first player.
export const captain = (s) => s.members[0];

// Who plays next in a scramble, team by team as players would:
//   states    each team's state
//   order     the players here, in honour order (the team's place in it
//             is its first member's); online, the other bays' players
//             aren't in it, and play at the same time on their own bays
//   distance  ([x, z]) -> metres to the hole
// Returns { player } for a shot, { pick: team } for the captain's pick,
// { wait: true } when nothing's left to do here until another bay has
// played or picked, or null when every team has finished. A team part way
// through a stroke finishes it before another starts; a pick comes first.
export function scrambleTurn(states, order, distance) {
  const here = (i) => order.includes(i);
  const pick = states.findIndex((s) => s.picking && here(captain(s)));
  if (pick >= 0) return { pick, player: captain(states[pick]) };
  const open = states.map((s, k) => k).filter((k) => !states[k].done);
  if (!open.length) return null;
  const live = open.filter((k) => !states[k].picking && states[k].members.some((m) => here(m) && !states[k].hit[m]));
  if (!live.length) return { wait: true };
  const going = live.find((k) => Object.keys(states[k].hit).length > 0);
  const place = (k) => {
    const at = Math.min(...states[k].members.map((m) => order.indexOf(m)).filter((x) => x >= 0));
    return Number.isFinite(at) ? at : Infinity;
  };
  let team;
  if (going != null) team = going;
  else {
    const onTee = live.filter((k) => states[k].stroke === 0).sort((a, b) => place(a) - place(b));
    if (onTee.length) team = onTee[0];
    else team = live.reduce((best, k) => (distance(states[k].spot) > distance(states[best].spot) ? k : best), live[0]);
  }
  return { team, player: states[team].members.find((m) => here(m) && !states[team].hit[m]) };
}

// Online: the team balls from the game's record of the hole (netgame.mjs
// scramble[hole]) - the same on every bay.
//   teams    [members] by player index
//   log      the hole's shots and picks, by player id
//   ids      each player index's id
//   gone     (index) -> whether that player has left the game
//   tee      where the round's tees are on the hole
export function scrambleFromLog(teams, log, ids, gone = () => false, tee = [0, 0]) {
  let states = teams.map((members) => newScramble(members.filter((i) => !gone(i)), tee));
  const teamOf = (i) => states.findIndex((s) => s.members.includes(i));
  for (const e of log ?? []) {
    const i = ids.indexOf(e.pick ?? e.p);
    const k = teamOf(i);
    if (k < 0) continue;
    states = states.map((s, j) => (j !== k ? s : e.pick != null ? scramblePick(s, i) : scrambleHit(s, i, { ball: e.b ?? [0, 0], lie: e.h ? "cup" : e.l, strokes: e.s, holed: !!e.h })));
  }
  return states;
}
