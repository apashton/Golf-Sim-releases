// A range session's numbers (docs/ANDROID-PLAN.md, "At the range,
// properly"): its shots as a list, each club's distances, and the session
// summed up when it's finished - the phone's session card draws them
// (public/phonerange.js), and the PC's side panel its By club table from
// the same clubDistances (range.js renderSession).
//
// A shot is the range's own record (range.js shots): { club, ball: {
// speedMph, totalSpin }, result: { carry, total, offline (yards, + right) },
// removed (a misread: out of every number), mark (thin, fat, topped) }.
// Pure.

import { CLUB_ORDER, BAG } from "./clubs.mjs";
import { gappingSummary, gapWords, gappingClubName } from "./gapping.mjs";

// The shots in the numbers: not misreads, and with a carry.
const counted = (shots) => (shots ?? []).filter((s) => !s?.removed && Number.isFinite(s?.result?.carry));
const mean = (list) => list.reduce((a, v) => a + v, 0) / list.length;
const clubRank = (c) => {
  const i = CLUB_ORDER.indexOf(c);
  return i < 0 ? CLUB_ORDER.length : i;
};

// Each shot as a line of the list, newest first: { n (its number in the
// session, from 1), club, carry, total, offline, speed, spin, misread,
// mark } - a misread kept in the list (crossed out), out of the numbers.
export function shotRows(shots) {
  const rows = (shots ?? []).map((s, i) => ({
    n: i + 1,
    club: s.club ?? null,
    carry: s.result?.carry ?? null,
    total: s.result?.total ?? null,
    offline: s.result?.offline ?? null,
    speed: s.ball?.speedMph ?? null,
    spin: s.ball?.totalSpin ?? null,
    misread: !!s.removed,
    mark: s.mark ?? null,
  }));
  return rows.reverse();
}

// Each club's distances, longest club first (the bag's order): { club, n,
// carry and total (averages), low and high (its shortest and longest
// carry), width (from its furthest left to its furthest right), side (its
// average line, + right), speed (average ball speed) }.
export function clubDistances(shots) {
  const byClub = new Map();
  for (const s of counted(shots)) {
    if (!byClub.has(s.club)) byClub.set(s.club, []);
    byClub.get(s.club).push(s);
  }
  return [...byClub]
    .map(([club, list]) => {
      const carries = list.map((s) => s.result.carry);
      const lines = list.map((s) => s.result.offline ?? 0);
      return {
        club,
        n: list.length,
        carry: mean(carries),
        total: mean(list.map((s) => s.result.total ?? s.result.carry)),
        low: Math.min(...carries),
        high: Math.max(...carries),
        width: Math.max(...lines) - Math.min(...lines),
        side: mean(lines),
        speed: mean(list.map((s) => s.ball?.speedMph ?? 0)),
      };
    })
    .sort((a, b) => clubRank(a.club) - clubRank(b.club));
}

// A club needs this many shots for the summary to call it the straightest.
export const STRAIGHT_MIN = 3;

// The session summed up: { shots (counted), misreads, minutes, clubs
// (clubDistances), longest ({ club, carry }: the longest carry),
// straightest ({ club, width, side }: of the clubs with STRAIGHT_MIN
// shots, the narrowest spread, or null), gaps (the gapping card's words
// for the clubs hit: overlaps and big gaps) }. start, end: when its first
// shot came and when it finished (ms).
export function sessionSummary(shots, { start = null, end = null } = {}) {
  const good = counted(shots);
  const clubs = clubDistances(shots);
  const longest = good.reduce((best, s) => (!best || s.result.carry > best.carry ? { club: s.club, carry: s.result.carry } : best), null);
  const steady = clubs.filter((c) => c.n >= STRAIGHT_MIN).sort((a, b) => a.width - b.width || Math.abs(a.side) - Math.abs(b.side));
  const straightest = steady.length ? { club: steady[0].club, width: steady[0].width, side: steady[0].side } : null;
  const balls = new Map();
  for (const s of good) if (BAG[s.club]) (balls.get(s.club) ?? balls.set(s.club, []).get(s.club)).push(s.result.carry);
  const gaps = gapWords(gappingSummary(balls).gaps);
  const minutes = Number.isFinite(start) && Number.isFinite(end) && end > start ? Math.max(1, Math.round((end - start) / 60000)) : null;
  return { shots: good.length, misreads: (shots ?? []).length - good.length, minutes, clubs, longest, straightest, gaps };
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const yds = (v) => `${Math.round(v)} yds`;
// "8 L", "5 R", "on line".
export const sideWords = (v) => (Math.abs(v) < 0.5 ? "on line" : `${Math.round(Math.abs(v))} ${v < 0 ? "L" : "R"}`);

// The summary in words: { head: "24 shots in 35 minutes with 4 clubs",
// lines: ["Longest: 7 iron, 168 yds carry", ...] }.
export function summaryWords(summary) {
  const { shots, minutes, clubs, longest, straightest, gaps, misreads } = summary;
  if (!shots) return { head: "No shots this session", lines: [] };
  const head = `${plural(shots, "shot")}${minutes ? ` in ${plural(minutes, "minute")}` : ""} with ${plural(clubs.length, "club")}`;
  const lines = [];
  if (longest) lines.push(`Longest: ${gappingClubName(longest.club)}, ${yds(longest.carry)} carry`);
  if (straightest) lines.push(`Straightest: ${gappingClubName(straightest.club)}, ${yds(straightest.width)} wide, ${sideWords(straightest.side)} on average`);
  lines.push(...gaps);
  if (misreads) lines.push(`${plural(misreads, "misread")} left out`);
  return { head, lines };
}
