// A round's highlight reel (the owner: "Round highlight reel"): its best
// shots picked out once the round's over - every hole-out from off the
// green (an ace above all), the longest holed putts, the longest drive,
// the approach that finished closest and a putt or chip that only just
// missed - then played back hole by hole with the flyover's camera
// (course.js watchHighlights).
//
// Each hole's strokes are kept as it's finished (course.js keepForReel),
// worked out here from where each began and finished (strokeFacts) - the
// flight's own points, thinned, so a long round doesn't hold thousands.

// How many clips at most; how many holed putts; the least a putt must be
// holed from (metres) and a drive's length to count; how close an
// approach (or a near miss) must finish.
export const REEL = { most: 6, putts: 2, putt: 3, drive: 180, approach: 6, approachFrom: 55, near: 0.35, nearFrom: 4 };
const FT = 0.3048;
const YD = 0.9144;
const ft = (m) => `${Math.max(1, Math.round(m / FT))} ft`;
const yds = (m) => `${Math.round(m / YD)} yds`;

// A flight's points thinned to at most `most` (its first and last kept).
export function thin(points, most = 60) {
  if (!points || points.length <= most) return points ?? [];
  const out = [];
  for (let i = 0; i < most - 1; i++) out.push(points[Math.round((i * (points.length - 1)) / (most - 1))]);
  out.push(points[points.length - 1]);
  return out;
}

// A stroke's flight ({ drawn: [[x, y, z]...] in the hole's frame, air: how
// many of them are in the air - course.js's tracer's made) thinned: its
// flight and its run each to a few dozen points.
export function thinStroke({ drawn, air }) {
  const n = Math.max(0, Math.min(air ?? 0, drawn.length));
  const up = thin(drawn.slice(0, n), 40);
  const run = thin(drawn.slice(n), 30);
  return { drawn: [...up, ...run], air: up.length };
}

// What a stroke did, from its points (thinStroke's) and the cup ([x, z],
// the hole's frame): { from: metres to the cup at the start, finish:
// metres at the end, length: start to rest, carry: start to where it came
// down, holed }.
export function strokeFacts({ drawn, air }, cup, { last = false } = {}) {
  const hole = ([x, , z]) => [x, z];
  const pts = drawn ?? [];
  if (!pts.length) return null;
  const a = hole(pts[0]);
  const b = hole(pts[pts.length - 1]);
  const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const down = air && air > 0 ? hole(pts[Math.min(pts.length - 1, air - 1)]) : b;
  const finish = d(b, cup);
  return { from: d(a, cup), finish, length: d(a, b), carry: d(a, down), holed: last && finish < 0.2 };
}

// The reel: [{ index (the hole's in the course), number, player, stroke
// (its place in the hole's list), kind, words, rank }], in the order the
// holes were played. reel: [{ index, number, par, strokes: [{ player,
// putt, first, last, facts }] }]; names: each player's, when there's more
// than one.
export function pickHighlights(reel, { names = null } = {}) {
  const all = [];
  for (const h of reel ?? []) {
    h.strokes.forEach((s, k) => {
      if (s.facts) all.push({ h, s, k });
    });
  }
  const clip = ({ h, s, k }, kind, words, rank) => ({ index: h.index, number: h.number, player: s.player, stroke: k, kind, words: `Hole ${h.number}${names ? ` - ${names[s.player]}` : ""}: ${words}`, rank });
  const out = [];
  // Holed from off the green: an ace, an eagle from the fairway, a chip-in.
  for (const c of all) {
    const { s } = c;
    if (s.putt || !s.facts.holed) continue;
    if (s.first) out.push(clip(c, "ace", c.h.par === 3 ? `a hole in one from ${yds(s.facts.from)}!` : `holed it from ${yds(s.facts.from)}!`, 100));
    else out.push(clip(c, "holeout", s.facts.from > 40 ? `holed it from ${yds(s.facts.from)}` : `chipped in from ${yds(s.facts.from)}`, 90 + s.facts.from / 100));
  }
  // The longest holed putts.
  const putts = all.filter(({ s }) => s.putt && s.facts.holed && s.facts.from >= REEL.putt).sort((a, b) => b.s.facts.from - a.s.facts.from);
  for (const c of putts.slice(0, REEL.putts)) out.push(clip(c, "putt", `holed from ${ft(c.s.facts.from)}`, 60 + c.s.facts.from));
  // The longest drive (a first stroke on a par 4 or 5).
  const drives = all.filter(({ h, s }) => s.first && !s.putt && !s.facts.holed && h.par >= 4 && s.facts.length >= REEL.drive).sort((a, b) => b.s.facts.length - a.s.facts.length);
  if (drives[0]) out.push(clip(drives[0], "drive", `longest drive, ${yds(drives[0].s.facts.length)}`, 50));
  // The approach that finished closest (not holed, from well out).
  const approaches = all.filter(({ s }) => !s.putt && !s.facts.holed && s.facts.from >= REEL.approachFrom && s.facts.finish <= REEL.approach).sort((a, b) => a.s.facts.finish - b.s.facts.finish);
  if (approaches[0]) out.push(clip(approaches[0], "approach", `to ${ft(approaches[0].s.facts.finish)} from ${yds(approaches[0].s.facts.from)}`, 45 - approaches[0].s.facts.finish));
  // A putt or chip that only just missed.
  const near = all.filter(({ s }) => !s.facts.holed && s.facts.from >= REEL.nearFrom && s.facts.finish <= REEL.near).sort((a, b) => b.s.facts.from - a.s.facts.from);
  if (near[0]) out.push(clip(near[0], "near", `so close from ${s(near[0])}`, 30));
  // The best few, in the order they were played.
  const seen = new Set();
  const kept = out
    .sort((a, b) => b.rank - a.rank)
    .filter((c) => {
      const key = `${c.index}:${c.player}:${c.stroke}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, REEL.most);
  return kept.sort((a, b) => a.index - b.index || a.stroke - b.stroke);
}
const s = (c) => (c.s.putt ? ft(c.s.facts.from) : yds(c.s.facts.from));
