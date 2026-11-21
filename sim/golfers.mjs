// Golfers to design a course for (docs/COURSE-DESIGN-PLAN.md, phase 0):
// a few typical players, each with how far and how straight they hit it,
// so the course maker can tell whether a bunker sits where anyone lands,
// which side of a fairway gives the better way in, and what a hole costs
// each of them (sim/holeeval.mjs plays the hole as each would).
//
//   drive     how far a good drive goes, carry and run (yards): the USGA's
//             course rating takes 250 for a scratch golfer and 200 for a
//             bogey golfer; Arccos's players average about 244 (0-5
//             handicaps), 223 (10-15) and 199 (20-25)
//   angle     how far off line a full shot starts (degrees, one standard
//             deviation): Mark Broadie measured 4.0 for tour players and
//             8.1 for amateurs off the tee
//   length    how far long or short of the shot it means to hit (a share
//             of the distance, one standard deviation)
//   miss      how often a shot is a proper miss - thinned, heeled, topped
//             - going only about two thirds as far and twice as far off line
// Set so that on a plain hole each plays about as the strokes-gained
// table says a golfer of their handicap does (sim/strokesgained.mjs
// expected; the tests hold them to it); the short hitter, who'd play the
// forward tees, takes a little more from the back.
//
// They're the course's golfers, not the player's own: the player's shots
// never enter them. Pure.

export const GOLFERS = {
  scratch: { name: "Scratch golfer", handicap: 0, drive: 250, angle: 4, length: 0.045, miss: 0.025 },
  mid: { name: "10 handicap", handicap: 10, drive: 223, angle: 5.3, length: 0.06, miss: 0.06 },
  bogey: { name: "Bogey golfer", handicap: 20, drive: 200, angle: 6.5, length: 0.075, miss: 0.09 },
  short: { name: "Short hitter", handicap: 28, drive: 170, angle: 7.5, length: 0.085, miss: 0.12 },
};

// The order they're listed in, best first.
export const GOLFER_ORDER = ["scratch", "mid", "bogey", "short"];

// How far a golfer can hit it from a lie, as a share of their drive: the
// driver from the tee, a fairway wood from a good lie, less from the
// rough, a long way less from a fairway bunker or the trees (a punch out).
// Round the green (sim/holeeval.mjs SHORT_GAME) the short game takes over.
export const REACH = { tee: 1, fairway: 0.9, fringe: 0.9, path: 0.9, semi: 0.85, rough: 0.72, waste: 0.8, deep: 0.5, bunker: 0.6, greenside: 0.3, trees: 0.3 };

// The furthest a golfer can hit it from `lie` (yards).
export const reachFrom = (golfer, lie) => golfer.drive * (REACH[lie] ?? 0.72);

// A golfer's spread for a shot of `yards`: one standard deviation off line
// (yards) and in length (yards). A full drive goes off line by the
// golfer's angle; a shorter shot, an iron, less so, and misses more on
// length than on line - the way real approach shots spread (deeper than
// wide), which is why a green turned across the line is harder to hold
// than one running along it. Never quite dead straight (a couple of yards
// either way).
export function spreadFor(golfer, yards) {
  const f = Math.min(1, yards / golfer.drive);
  const angle = golfer.angle * (0.4 + 0.6 * f * f);
  const across = Math.max(2, yards * Math.tan((angle * Math.PI) / 180));
  const along = Math.max(2, yards * golfer.length * (1.9 - 0.9 * f));
  return { across, along };
}

// The same fixed set of swings for every choice (common random numbers):
// `n` of them, each a pair of standard normal draws (a: off line, b: in
// length) and m, 0 - 1, a miss for a golfer who misses more often than
// that - spread evenly (a low-discrepancy sequence), so a hole always
// scores the same and two aims are compared on the same swings. Where one
// finishes: sim/holeeval.mjs.
const SHOTS = new Map();
export function shotSet(n = 24) {
  if (SHOTS.has(n)) return SHOTS.get(n);
  const out = [];
  for (let i = 0; i < n; i++) {
    // Halton bases 2 and 3, through Box-Muller.
    const u = Math.min(1 - 1e-9, Math.max(1e-9, (halton(i + 1, 2) + 0.5 / n) % 1));
    const v = halton(i + 1, 3);
    const r = Math.sqrt(-2 * Math.log(u));
    out.push({ a: r * Math.cos(2 * Math.PI * v), b: r * Math.sin(2 * Math.PI * v), m: halton(i + 1, 5) });
  }
  SHOTS.set(n, out);
  return out;
}

function halton(i, base) {
  let f = 1;
  let r = 0;
  while (i > 0) {
    f /= base;
    r += f * (i % base);
    i = Math.floor(i / base);
  }
  return r;
}
