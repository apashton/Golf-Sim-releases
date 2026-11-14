// Online play: a match over several games - a league for the evening, a
// Ryder Cup weekend - kept by the host (the owner's "tournament/league over
// several rounds"). Each game the group plays while it's on adds where
// everyone finished, and the running table gives points by place (as a
// season's events do): 10 for first, 8, 6, 5, 4, 3, 2, 1. It's kept on the
// host's PC or phone (its own storage) and goes out with the game for
// everyone to see - none of it is kept on the relay (relay/README.md,
// "Free-plan rules").
//
// match: { name, games: [{ id, name, places: [{ name, place, text }] }] }

export const MATCH_POINTS = [10, 8, 6, 5, 4, 3, 2, 1];
const NAME = 40;
const GAMES = 40;
const PLAYERS = 8;

const clip = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export function newMatch(name) {
  return { name: clip(name, NAME) || "The match", games: [] };
}

// A match as it may be kept or sent: anything else left out.
export function cleanMatch(m) {
  if (!m || typeof m !== "object") return null;
  const games = (Array.isArray(m.games) ? m.games : [])
    .slice(-GAMES)
    .map((g) => ({
      id: clip(g?.id, 40),
      name: clip(g?.name, 60) || "Game",
      places: (Array.isArray(g?.places) ? g.places : [])
        .slice(0, PLAYERS)
        .map((p) => ({ name: clip(p?.name, 20), place: Number.isInteger(p?.place) && p.place >= 1 && p.place <= PLAYERS ? p.place : null, text: clip(p?.text, 30) }))
        .filter((p) => p.name && p.place),
    }))
    .filter((g) => g.places.length);
  return { name: clip(m.name, NAME) || "The match", games };
}

export const pointsFor = (place) => MATCH_POINTS[place - 1] ?? 0;

// The match with a game's result added (once: a game's id already in is
// left as it was). result: { id, name, places: [{ name, place, text }] }.
export function addGame(match, result) {
  const m = cleanMatch(match) ?? newMatch();
  const [game] = cleanMatch({ games: [result] }).games;
  if (!game || (game.id && m.games.some((g) => g.id === game.id))) return m;
  return { ...m, games: [...m.games, game] };
}

// Places from each player's result (lower first, unless high: higher
// first): level results share a place. rows: [{ name, value, text }].
export function placesOf(rows, { high = false } = {}) {
  const counted = rows.filter((r) => Number.isFinite(r.value));
  const order = [...counted].sort((a, b) => (high ? b.value - a.value : a.value - b.value));
  return order.map((r, k) => {
    let place = k + 1;
    for (let j = k - 1; j >= 0 && order[j].value === r.value; j--) place = j + 1;
    return { name: r.name, place, text: r.text ?? "" };
  });
}

// The running table: each player (by name, as they play in every game)
// with their points, games played, wins and best place - most points
// first, then most wins.
export function matchTable(match) {
  const m = cleanMatch(match);
  if (!m) return [];
  const rows = new Map();
  for (const g of m.games) {
    for (const p of g.places) {
      const row = rows.get(p.name) ?? { name: p.name, points: 0, played: 0, wins: 0, best: null };
      row.points += pointsFor(p.place);
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

// "Alex leads on 18 points after 2 games", "Alex and Sam lead on 18 ...".
export function matchLine(match) {
  const t = matchTable(match);
  const n = cleanMatch(match)?.games.length ?? 0;
  if (!t.length || !n) return "";
  const top = t.filter((r) => r.place === 1).map((r) => r.name);
  const who = top.length === 1 ? `${top[0]} leads` : `${top.slice(0, -1).join(", ")} and ${top.at(-1)} lead`;
  return `${who} on ${t[0].points} point${t[0].points === 1 ? "" : "s"} after ${n} game${n === 1 ? "" : "s"}`;
}
