// A suggested tidy-up for My stats: shots that sit well away from the rest
// of their club's - more than two standard deviations from the club's
// average carry or ball speed - listed so the player can tick the ones that
// were misfits (a misread, a shot that wasn't a real swing) and take them
// out. Only suggested: nothing is taken out until they say, and taken out
// is the same as a misread (put back from Latest shots, or Undo).
//
// Which shots: those in the club's numbers (shotstats.mjs counts - a full
// swing, struck well, off a good lie), not ones the player has already said
// something about. A thin or fat one is out of the carry already, and the
// player's word on a shot stands.
//
// Each shot is measured against the club's other shots (its own left out
// of the average and the spread), so one wild shot can't widen the spread
// enough to hide itself. A club needs TIDY_MIN shots before anything is
// suggested: with fewer, "normal" isn't known well enough.
//
// Pure, for the server (server/stats.mjs) and the tests.

import { counts } from "./shotstats.mjs";
import { CLUB_ORDER } from "./clubs.mjs";

export const TIDY_SPREADS = 2;
export const TIDY_MIN = 8;
// At most this many listed, the furthest out first.
export const TIDY_LISTED = 60;

// What's measured, and where it is on a stored shot.
export const TIDY_FIELDS = {
  carry: { name: "Carry", unit: "yds", get: (s) => s.r?.carry },
  speed: { name: "Ball speed", unit: "mph", get: (s) => s.b?.s },
};

const r1 = (v) => Math.round(v * 10) / 10;

// The suggestions for a player's shots: { clubs: [{ club, n, shots: [{ id,
// t, carry, speed, why: [{ field, value, mean, sd, spreads }] }] }], total }.
// Each club's shots furthest out first.
export function tidySuggestions(shots, { spreads = TIDY_SPREADS, min = TIDY_MIN, listed = TIDY_LISTED } = {}) {
  const byClub = new Map();
  for (const s of shots) {
    if (!counts(s) || s.my) continue;
    if (!byClub.has(s.c)) byClub.set(s.c, []);
    byClub.get(s.c).push(s);
  }
  const clubs = [];
  let total = 0;
  for (const club of CLUB_ORDER) {
    const list = byClub.get(club);
    if (!list || list.length < min) continue;
    // Running sums for each field, so each shot's "the others" is quick.
    const sums = {};
    for (const [k, f] of Object.entries(TIDY_FIELDS)) {
      let n = 0;
      let sum = 0;
      let sq = 0;
      for (const s of list) {
        const v = f.get(s);
        if (!Number.isFinite(v)) continue;
        n++;
        sum += v;
        sq += v * v;
      }
      sums[k] = { n, sum, sq };
    }
    const out = [];
    for (const s of list) {
      const why = [];
      for (const [k, f] of Object.entries(TIDY_FIELDS)) {
        const v = f.get(s);
        const { n, sum, sq } = sums[k];
        if (!Number.isFinite(v) || n - 1 < min - 1) continue;
        // The others: this shot taken out of the sums.
        const m = n - 1;
        const mean = (sum - v) / m;
        const variance = Math.max(0, ((sq - v * v) - m * mean * mean) / (m - 1));
        const sd = Math.sqrt(variance);
        if (!(sd > 0)) continue;
        const z = (v - mean) / sd;
        if (Math.abs(z) > spreads) why.push({ field: k, value: r1(v), mean: r1(mean), sd: r1(sd), spreads: r1(z) });
      }
      if (why.length) out.push({ id: s.id, t: s.t, carry: r1(s.r.carry), speed: Number.isFinite(s.b?.s) ? r1(s.b.s) : null, why });
    }
    if (!out.length) continue;
    const far = (x) => Math.max(...x.why.map((w) => Math.abs(w.spreads)));
    out.sort((a, b) => far(b) - far(a));
    total += out.length;
    clubs.push({ club, n: list.length, shots: out });
  }
  // Too many to go through: the furthest out overall.
  if (total > listed) {
    const all = clubs.flatMap((c) => c.shots.map((s) => ({ c, s, far: Math.max(...s.why.map((w) => Math.abs(w.spreads))) })));
    const keep = new Set(all.sort((a, b) => b.far - a.far).slice(0, listed).map((x) => x.s));
    for (const c of clubs) c.shots = c.shots.filter((s) => keep.has(s));
    return { clubs: clubs.filter((c) => c.shots.length), total: listed, more: total - listed };
  }
  return { clubs, total, more: 0 };
}

// One reason in words: "carry 112 yds - usually 151 ± 6".
export function tidyWhy(w) {
  const f = TIDY_FIELDS[w.field];
  return `${f.name.toLowerCase()} ${w.value} ${f.unit} - usually ${w.mean} ± ${w.sd}`;
}
