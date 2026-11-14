// A season of events (the owner: "Career / season mode"): a run of rounds
// on your courses against a field of made-up golfers, each event's
// leaderboard from your own round (its gross score, every hole played)
// and theirs worked out hole by hole from their handicaps, points and
// prize money by where you finish, and a season's standings across them.
// Pure: course.js shows it and plays the events.
//
// The owner, 25 October 2026: "it needs to put you against people of a
// similar playing level, so if very few games have been played a
// handicap should be requested, but once some data is in, the handicapp
// is stored. Leaderboard should be visible between holes and teammates
// scores on the hole you are on visable too (even if no balls shown in
// flight etc)". So the field to begin with is golfers at your level (your
// handicap, from your rounds or asked: the season keeps it as `you`), the
// leaderboard is worked out as you go (liveBoard) and two of the field
// play with you, their strokes on each hole shown as yours go
// (groupOf, groupOnHole).

// The fields to play against: their handicap indexes (a tour player's
// below scratch) - round yours (level: `spread` either way, one standard
// deviation), or in a band - the purse each event plays for, and its
// currency.
export const FIELDS = {
  level: { name: "Golfers at your level", spread: 3.5, purse: 20000 },
  club: { name: "Club golfers", hcp: [2, 24], purse: 5000 },
  county: { name: "County players", hcp: [-2, 6], purse: 60000 },
  tour: { name: "Tour pros", hcp: [-6, -1], purse: 8000000 },
};
export const SEASON_LENGTHS = [4, 6, 8, 10];
export const DEFAULT_FIELD = "level";
// A handicap index as the game takes one (a plus handicap below 0).
export const HCP_RANGE = [-10, 54];
// Who plays with you each event, from the field.
export const GROUP_SIZE = 2;
// How many in the field (you among them).
export const FIELD_SIZE = 40;
export const YOU = "you";

// Points by finishing place (the leader's 500, down to 1), shared when
// tied; prize money's share of the purse (% by place, 0.5% after).
const POINTS = [500, 300, 190, 135, 110, 100, 90, 85, 80, 75, 70, 65, 60, 57, 55, 53, 51, 49, 47, 45, 43, 41, 39, 37, 35, 34, 32, 31, 29, 28];
const SHARE = [18, 10.9, 6.9, 4.9, 4.1, 3.625, 3.375, 3.125, 2.925, 2.725, 2.525, 2.325, 2.125, 1.925, 1.825, 1.725, 1.625, 1.525, 1.425, 1.325, 1.225, 1.125, 1.045, 0.965, 0.885, 0.805, 0.775, 0.745, 0.715, 0.685];
// (Exported for the online season, sim/netseason.mjs: the same points.)
export const pointsAt = (pos) => (pos <= POINTS.length ? POINTS[pos - 1] : Math.max(1, 28 - (pos - POINTS.length)));
const shareAt = (pos) => (pos <= SHARE.length ? SHARE[pos - 1] : 0.5) / 100;

function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Alex", "Ben", "Callum", "Dan", "Ewan", "Finn", "George", "Harry", "Ian", "Jack", "Kieran", "Liam", "Matt", "Neil", "Owen", "Pete", "Rory", "Sam", "Tom", "Will", "Amy", "Beth", "Claire", "Daisy", "Emma", "Fiona", "Grace", "Holly", "Isla", "Jess", "Kate", "Lucy", "Mia", "Nina", "Olivia", "Rosie", "Sophie", "Zoe", "Jordan", "Robin"];
const LAST = ["Anderson", "Baker", "Campbell", "Davies", "Evans", "Fraser", "Graham", "Hughes", "Irvine", "Johnson", "Kerr", "Lewis", "Murray", "Nicholson", "O'Brien", "Patel", "Quinn", "Robertson", "Stewart", "Taylor", "Usher", "Vaughan", "Walker", "Young", "Morgan", "Reid", "Bell", "Hunter", "Ross", "Wood"];

// The made-up golfers: [{ id, name, hcp }]. around: your handicap, for
// the field at your level (18 without one).
export function makeField(seed, field = "club", size = FIELD_SIZE - 1, { around = null } = {}) {
  const f = FIELDS[field] ?? FIELDS.club;
  const rand = seeded(seed ^ 0xf1e1d);
  const used = new Set();
  const out = [];
  const mid = Number.isFinite(around) ? around : 18;
  const hcpOf = () => {
    if (!f.spread) return f.hcp[0] + rand() * (f.hcp[1] - f.hcp[0]);
    const g = (rand() + rand() + rand() - 1.5) * 2;
    return Math.max(HCP_RANGE[0], Math.min(HCP_RANGE[1], mid + g * f.spread));
  };
  for (let i = 0; out.length < size && i < size * 20; i++) {
    const name = `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`;
    if (used.has(name)) continue;
    used.add(name);
    out.push({ id: `g${out.length}`, name, hcp: Math.round(hcpOf() * 10) / 10 });
  }
  return out;
}

// Your handicap as the season keeps it: { hcp, from } - from "rounds"
// (your own rounds gave it), "typed" (in the course panel or Saved
// players), "asked" (you said it, with too few rounds) or "start" (your
// swing level's start); null without a number.
export const YOU_FROM = { rounds: "from your rounds", typed: "as typed in", asked: "as you gave it", start: "your level's start" };
export function cleanYou(you) {
  const h = you?.hcp;
  if (h == null || h === "" || !Number.isFinite(Number(h))) return null;
  const hcp = Math.round(Math.max(HCP_RANGE[0], Math.min(HCP_RANGE[1], Number(h))) * 10) / 10;
  return { hcp, from: Object.hasOwn(YOU_FROM, you.from) ? you.from : "asked" };
}

// A handicap as it's said: "12.4", "+2.1" for a plus one.
export const hcpWords = (h) => (h < 0 ? `+${Math.abs(h).toFixed(1)}` : h.toFixed(1));

// A made-up golfer's round on holes of these pars: each hole's strokes, as
// a golfer of that handicap scores - over par by about their handicap
// (times 0.9, plus a little) over 18, more on long holes, birdies and
// double bogeys as they come.
export function simRound(golfer, pars, seed) {
  const rand = seeded(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
  const over = (0.9 * golfer.hcp + 1.2) / 18;
  return pars.map((par) => {
    const e = over * (par === 5 ? 1.15 : par === 3 ? 0.85 : 1);
    return par + Math.min(4, Math.max(-2, Math.round(e + gauss() * 0.78)));
  });
}

const hashText = (text) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
};

// A new season: { name, seed, field, players, events: [{ courseId, name,
// done, results }] } - its events going round the courses given ([{ id,
// name }]), from a randomness of its own.
// you: your handicap ({ hcp, from }: cleanYou), round which the field at
// your level is drawn. started: when (ms) - a skill re-spend is once a
// season (sim/skills.mjs).
export function newSeason({ seed = 1, field = DEFAULT_FIELD, events = 6, courses = [], name = null, you = null, started = null }) {
  const list = courses.filter((c) => c?.id);
  if (!list.length) return null;
  const n = SEASON_LENGTHS.includes(events) ? events : 6;
  const rand = seeded(seed ^ 0x5ea5);
  const start = Math.floor(rand() * list.length);
  const key = FIELDS[field] ? field : DEFAULT_FIELD;
  const me = cleanYou(you);
  return {
    name: name ?? `${FIELDS[key].name} season`,
    seed,
    ...(Number.isFinite(started) ? { started } : {}),
    field: key,
    you: me,
    players: makeField(seed, key, FIELD_SIZE - 1, { around: me?.hcp }),
    events: Array.from({ length: n }, (_, k) => {
      const c = list[(start + k) % list.length];
      return { courseId: c.id, name: `${c.name} ${["Classic", "Open", "Championship", "Invitational", "Masters", "Trophy"][k % 6]}`, course: c.name, done: false, results: null };
    }),
  };
}

// The season with your handicap as it is now (a newer one from your
// rounds, kept: the owner's "once some data is in, the handicapp is
// stored"). The field stays as it was drawn.
export function withYou(season, you) {
  const me = cleanYou(you);
  if (!season || !me) return season;
  return { ...season, you: me };
}

// The next event to play (its index), or -1 when the season's over.
export const nextEvent = (season) => (season?.events ?? []).findIndex((e) => !e.done);

// A golfer's strokes hole by hole in event k (the same every time it's
// asked, so the leaderboard as you go ends where the result does).
const roundOf = (season, k, g, pars) => simRound(g, pars, hashText(`${season.seed}|${k}|${g.id}`));

// Event k's leaderboard with your round (each hole's strokes, all played)
// on holes of these pars: [{ id, name, total, toPar, pos, tied, points,
// money }] best first.
export function eventResults(season, k, myScores, pars) {
  const purse = FIELDS[season.field]?.purse ?? FIELDS.club.purse;
  const parTotal = pars.reduce((a, b) => a + b, 0);
  const rows = [
    { id: YOU, name: "You", total: myScores.reduce((a, b) => a + b, 0) },
    ...season.players.map((g) => ({ id: g.id, name: g.name, total: roundOf(season, k, g, pars).reduce((a, b) => a + b, 0) })),
  ].sort((a, b) => a.total - b.total || (a.id === YOU ? -1 : b.id === YOU ? 1 : 0));
  // Places, ties sharing the points and money of the places they span.
  let i = 0;
  while (i < rows.length) {
    let j = i;
    while (j + 1 < rows.length && rows[j + 1].total === rows[i].total) j++;
    const n = j - i + 1;
    let pts = 0;
    let share = 0;
    for (let p = i + 1; p <= j + 1; p++) {
      pts += pointsAt(p);
      share += shareAt(p);
    }
    for (let q = i; q <= j; q++) Object.assign(rows[q], { pos: i + 1, tied: n > 1, toPar: rows[q].total - parTotal, points: Math.round((pts / n) * 10) / 10, money: Math.round((purse * share) / n) });
    i = j + 1;
  }
  return rows;
}

// The season with event k played: your round recorded and its leaderboard
// kept (only the top and you, to keep it small).
export function recordEvent(season, k, myScores, pars) {
  const results = eventResults(season, k, myScores, pars);
  const kept = results.filter((r, i) => i < 10 || r.id === YOU);
  // Everyone's points and money for the standings, by id.
  const tally = Object.fromEntries(results.map((r) => [r.id, [r.points, r.money, r.pos]]));
  const events = season.events.map((e, i) => (i === k ? { ...e, done: true, results: kept, tally, par: pars.reduce((a, b) => a + b, 0) } : e));
  return { ...season, events };
}

// Who plays with you in event k: GROUP_SIZE of the field near your
// handicap (of the dozen closest, a different pair each event) - [{ id,
// name, hcp }].
export function groupOf(season, k) {
  const players = season?.players ?? [];
  if (!players.length) return [];
  const mid = season.you?.hcp ?? players.map((g) => g.hcp).sort((a, b) => a - b)[Math.floor(players.length / 2)];
  const near = [...players].sort((a, b) => Math.abs(a.hcp - mid) - Math.abs(b.hcp - mid) || a.id.localeCompare(b.id)).slice(0, 12);
  const rand = seeded(hashText(`${season.seed}|group|${k}`));
  const out = [];
  while (out.length < Math.min(GROUP_SIZE, near.length)) {
    const g = near[Math.floor(rand() * near.length)];
    if (!out.includes(g)) out.push(g);
  }
  return out.map((g) => ({ id: g.id, name: g.name, hcp: g.hcp }));
}

// The leaderboard as event k goes, with your scores so far (null for a
// hole not yet played): everyone over the same holes you've played -
// { thru, rows: [{ id, name, toPar, pos, tied, you, partner }] } best
// first (you before those you're level with).
export function liveBoard(season, k, myScores, pars) {
  const played = pars.map((_, i) => i).filter((i) => Number.isFinite(myScores?.[i]));
  const group = new Set(groupOf(season, k).map((g) => g.id));
  const over = (scores) => played.reduce((a, i) => a + scores[i] - pars[i], 0);
  const rows = [
    { id: YOU, name: "You", toPar: over(myScores ?? []), you: true, partner: false },
    ...(season?.players ?? []).map((g) => ({ id: g.id, name: g.name, toPar: over(roundOf(season, k, g, pars)), you: false, partner: group.has(g.id) })),
  ].sort((a, b) => a.toPar - b.toPar || (a.you ? -1 : b.you ? 1 : 0));
  let i = 0;
  while (i < rows.length) {
    let j = i;
    while (j + 1 < rows.length && rows[j + 1].toPar === rows[i].toPar) j++;
    for (let q = i; q <= j; q++) Object.assign(rows[q], { pos: i + 1, tied: j > i });
    i = j + 1;
  }
  return { thru: played.length, rows };
}

// The leaderboard's lines to show: the top `top`, and you and your group
// wherever you are (in order, a gap marked where rows are skipped).
export function boardLines(board, top = 5) {
  const keep = board.rows.filter((r, i) => i < top || r.you || r.partner);
  const out = [];
  let last = -1;
  for (const r of keep) {
    const i = board.rows.indexOf(r);
    if (last >= 0 && i > last + 1) out.push({ gap: true });
    out.push(r);
    last = i;
  }
  return out;
}

// Your group on hole i of event k as you play it: [{ id, name, strokes,
// holed, score }] - each partner's strokes keeping pace with yours (mine:
// yours so far) until they've holed out, all holed once you have (done);
// score their strokes against par then ("Par", "Birdie"...: scoreName's).
export function groupOnHole(season, k, pars, i, mine = 0, done = false) {
  return groupOf(season, k).map((g) => {
    const full = roundOf(season, k, (season.players ?? []).find((x) => x.id === g.id) ?? g, pars)[i];
    const holed = done || mine >= full;
    return { id: g.id, name: g.name, strokes: holed ? full : Math.max(0, mine), holed, toPar: holed ? full - pars[i] : null };
  });
}

// A to-par as a leaderboard says it: "E", "-2", "+3".
export const toParWords = (n) => (n === 0 ? "E" : n > 0 ? `+${n}` : `${n}`);

// The season's standings: [{ id, name, points, money, played, wins, best }]
// best first.
export function standings(season) {
  const table = new Map([[YOU, { id: YOU, name: "You", points: 0, money: 0, played: 0, wins: 0, best: null }], ...season.players.map((g) => [g.id, { id: g.id, name: g.name, points: 0, money: 0, played: 0, wins: 0, best: null }])]);
  for (const e of season.events) {
    if (!e.done) continue;
    for (const [id, [pts, money, pos]] of Object.entries(e.tally ?? {})) {
      const row = table.get(id);
      if (!row) continue;
      row.points += pts;
      row.money += money;
      row.played++;
      if (pos === 1) row.wins++;
      row.best = row.best == null ? pos : Math.min(row.best, pos);
    }
  }
  return [...table.values()].map((r) => ({ ...r, points: Math.round(r.points * 10) / 10 })).sort((a, b) => b.points - a.points || b.money - a.money);
}

// A place, as a leaderboard says it: "1st", "T4th".
export function placeWords({ pos, tied }) {
  const s = pos % 100 >= 11 && pos % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][pos % 10] ?? "th";
  return `${tied ? "T" : ""}${pos}${s}`;
}
// Money as a purse says it.
export const moneyWords = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;
