// Strokes gained: how many strokes a shot saved (or cost) against a tour
// player from the same place - Mark Broadie's measure (Every Shot Counts).
// From anywhere, a tour pro takes on average a known number of strokes to
// hole out (the baseline below): 2.80 from 100 yds in the fairway, 1.61
// from 10 ft on the green. A shot's strokes gained is what it was worth -
// the average from where it was played, less the average from where it
// finished, less the stroke itself (and a penalty stroke if it cost one):
// a drive leaving a 7-iron from the middle is worth more than one leaving
// a 4-iron from the rough, a 40 ft putt to a tap-in more than one to 6 ft.
// Added up by kind - off the tee, approach, around the green, putting - it
// says where a round's strokes went. Against a tour pro nearly everyone's
// is below nothing; what matters is which part is furthest below.
//
// Pure: roundstats.mjs adds it to each hole and round.

// Average strokes to hole out, by lie and distance (yards; the green in
// feet): the PGA Tour's, from Broadie. Between two distances it's read in
// a straight line; beyond the last, on in the same line.
const BASELINE = {
  tee: [
    [100, 2.92], [120, 2.99], [140, 2.97], [160, 2.99], [180, 3.05], [200, 3.12], [220, 3.17], [240, 3.25],
    [260, 3.45], [280, 3.65], [300, 3.71], [320, 3.79], [340, 3.86], [360, 3.92], [380, 3.96], [400, 3.99],
    [420, 4.02], [440, 4.08], [460, 4.17], [480, 4.28], [500, 4.41], [520, 4.54], [540, 4.65], [560, 4.74],
    [580, 4.79], [600, 4.82],
  ],
  fairway: [
    [0, 1.9], [5, 2.1], [10, 2.18], [20, 2.4], [30, 2.52], [40, 2.6], [60, 2.7], [80, 2.75], [100, 2.8],
    [120, 2.85], [140, 2.91], [160, 2.98], [180, 3.08], [200, 3.19], [220, 3.32], [240, 3.45], [260, 3.58],
    [280, 3.69], [300, 3.78], [320, 3.84], [340, 3.88], [360, 3.95], [380, 4.03], [400, 4.11], [420, 4.15],
    [440, 4.2], [460, 4.29], [480, 4.4], [500, 4.53], [520, 4.66], [540, 4.78], [560, 4.86], [580, 4.94],
    [600, 5.0],
  ],
  rough: [
    [0, 2.05], [5, 2.25], [10, 2.34], [20, 2.59], [30, 2.7], [40, 2.78], [60, 2.91], [80, 2.96], [100, 3.02],
    [120, 3.08], [140, 3.15], [160, 3.23], [180, 3.31], [200, 3.42], [220, 3.53], [240, 3.64], [260, 3.74],
    [280, 3.83], [300, 3.9], [320, 3.95], [340, 4.02], [360, 4.11], [380, 4.21], [400, 4.3], [420, 4.34],
    [440, 4.39], [460, 4.48], [480, 4.59], [500, 4.72], [600, 5.19],
  ],
  sand: [
    [0, 2.2], [5, 2.35], [10, 2.43], [20, 2.53], [30, 2.66], [40, 2.82], [60, 3.15], [80, 3.24], [100, 3.23],
    [120, 3.21], [140, 3.22], [160, 3.28], [180, 3.4], [200, 3.55], [220, 3.7], [240, 3.84], [260, 3.93],
    [280, 4.0], [300, 4.04], [320, 4.12], [340, 4.26], [360, 4.41], [380, 4.55], [400, 4.69], [500, 5.18],
    [600, 5.5],
  ],
  recovery: [
    [0, 2.6], [50, 3.3], [100, 3.8], [120, 3.78], [140, 3.8], [160, 3.81], [180, 3.82], [200, 3.87],
    [220, 3.92], [240, 3.97], [260, 4.03], [280, 4.1], [300, 4.2], [320, 4.31], [340, 4.44], [360, 4.56],
    [380, 4.66], [400, 4.75], [500, 5.2], [600, 5.6],
  ],
  green: [
    [0, 1.0], [2, 1.01], [3, 1.04], [4, 1.13], [5, 1.23], [6, 1.34], [7, 1.42], [8, 1.5], [9, 1.56],
    [10, 1.61], [15, 1.78], [20, 1.87], [30, 1.98], [40, 2.06], [50, 2.14], [60, 2.21], [90, 2.4],
  ],
};

// Deep rough and a bad lie in the trees play harder than the table.
const EXTRA = { deep: 0.15 };

// The table a course lie reads from.
export function baselineLie(lie) {
  switch (lie) {
    case "tee":
      return "tee";
    case "green":
      return "green";
    case "fairway":
    case "fringe":
    case "path":
      return "fairway";
    case "semi":
    case "rough":
    case "deep":
    // (A waste area: off the fairway, the ball sitting up - played as from
    // the rough.)
    case "waste":
      return "rough";
    case "bunker":
    case "greenside":
    case "sand":
      return "sand";
    case "trees":
      return "recovery";
    default:
      return "rough";
  }
}

// Read between a table's rows (ascending), carried on past its last. The
// row is found by halving (read for every shot the course search plays).
function read(table, x) {
  if (x <= table[0][0]) return table[0][1];
  let lo = 1;
  let hi = table.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (x <= table[mid][0]) hi = mid;
    else lo = mid + 1;
  }
  if (lo < table.length) {
    const [x0, y0] = table[lo - 1];
    const [x1, y1] = table[lo];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  const [x0, y0] = table.at(-2);
  const [x1, y1] = table.at(-1);
  return y1 + ((y1 - y0) * (x - x1)) / (x1 - x0);
}

// The average strokes to hole out from a lie `yards` from the hole (on the
// green, read in feet), 0 once it's in: the tour's, or with `level` a
// golfer of that handicap's.
//
// A handicap golfer's is the tour's with every stroke beyond the last one
// taking longer: 1 + (tour - 1) x (1 + (handicap + 2) / 54). Over a round
// the tour takes about 54 strokes more than one a hole, and a scratch
// golfer about 2 more than the tour, each handicap stroke one more - so a
// round from the tees comes to about par + 2 + the handicap, and the extra
// falls where the tour's strokes do: a tap-in stays a tap-in, a 10 footer
// is 1.61 for the tour and about 1.84 for an 18 handicap, 150 yds from the
// fairway 2.98 and about 3.71. An approximation of the amateur tables
// (Broadie's and the shot-tracking apps' are much like it), but the same
// way for every lie and distance, so it compares fairly.
export function expected(lie, yards, level = null) {
  if (!Number.isFinite(yards) || lie === "cup") return 0;
  const kind = baselineLie(lie);
  let e;
  if (kind === "green") e = read(BASELINE.green, Math.max(0, yards) * 3);
  // A tee shot shorter than any par 3 plays like one from the fairway.
  else if (kind === "tee" && yards < 100) e = read(BASELINE.fairway, yards);
  else e = read(BASELINE[kind], Math.max(0, yards)) + (EXTRA[lie] ?? 0);
  return Number.isFinite(level) ? 1 + (e - 1) * levelFactor(level) : e;
}

export const levelFactor = (handicap) => 1 + (Math.min(54, Math.max(-2, handicap)) + 2) / 54;

// Who strokes gained is measured against: the tour, a scratch golfer, a
// handicap, or the player's own handicap index ("mine").
export const BASELINES = ["mine", "tour", "0", "5", "10", "15", "20", "25", "30"];
export const baselineName = (choice, index = null) =>
  choice === "tour" ? "a tour pro" : choice === "0" ? "a scratch golfer" : choice === "mine" ? (index != null ? `your handicap (${index.toFixed(1)})` : "your handicap") : `a ${choice} handicap`;
// With no index yet, "mine" is measured against a 20 handicap.
export const MINE_DEFAULT = 20;
// The level (a handicap, or null for the tour) a choice means.
export function baselineLevel(choice, index = null) {
  if (choice === "tour") return null;
  if (choice === "mine" || !BASELINES.includes(choice)) return index ?? MINE_DEFAULT;
  return Number(choice);
}

// Around the green: a shot from within this many yards that isn't a putt.
export const AROUND = 30;
export const CATEGORIES = ["tee", "approach", "around", "putting"];
export const CATEGORY_NAMES = { tee: "Off the tee", approach: "Approach", around: "Around the green", putting: "Putting", total: "Total" };

// Which kind a shot is: a par 4 or 5's tee shot, a putt, a shot from
// within 30 yds of the hole, or an approach (the rest, par 3 tee shots
// too).
export function category(shot, par) {
  const green = shot.lie === "green" || shot.sw === "putt";
  if (green) return "putting";
  if (shot.lie === "tee" && par >= 4) return "tee";
  if (Number.isFinite(shot.tg?.d) && shot.tg.d <= AROUND) return "around";
  return "approach";
}

// A finished hole's shots: each one's strokes gained, and its kind.
// pens: the penalty strokes each shot cost; given: the last putt was
// given (the ball is taken as holed with one more stroke). Returns null
// when a shot's distance isn't known.
//   [{ cat, sg, lie, d, f, made, green, pen }]
// level: the handicap it's measured against (null: the tour).
export function holeShots(shots, pens, { par, given = false, level = null } = {}) {
  const out = [];
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    const next = shots[i + 1];
    const d = s.tg?.d;
    if (!Number.isFinite(d)) return null;
    const start = expected(s.lie === "green" || s.sw === "putt" ? "green" : s.lie, d, level);
    let end;
    const holed = !!s.tg?.made || s.to === "cup";
    if (holed) end = 0;
    else if (next) {
      if (!Number.isFinite(next.tg?.d)) return null;
      end = expected(next.lie === "green" || next.sw === "putt" ? "green" : next.lie, next.tg.d, level);
    } else if (given) end = 1;
    else return null;
    const pen = pens[i] ?? 0;
    const onGreen = holed || s.to === "green" || (next && (next.lie === "green" || next.sw === "putt") && !pen);
    out.push({ cat: category(s, par), sg: start - end - 1 - pen, lie: s.lie, d, f: s.tg?.f ?? null, made: holed, green: !!onGreen, pen, club: s.c ?? null });
  }
  return out;
}

// Strokes gained by kind, added up: { total, tee, approach, around,
// putting } (to two places).
export function sumByCategory(list) {
  const out = { total: 0, tee: 0, approach: 0, around: 0, putting: 0 };
  for (const s of list) {
    out[s.cat] += s.sg;
    out.total += s.sg;
  }
  for (const k of Object.keys(out)) out[k] = Math.round(out[k] * 100) / 100;
  return out;
}

// Approach shots by how far out (yards), for how close they finished:
// from 50 yds up, the share that found the green and how far away they
// finished on average (feet). A shot that cost a penalty is left out.
export const APPROACH_BANDS = [
  [50, 100],
  [100, 150],
  [150, 200],
  [200, Infinity],
];
export const bandName = ([lo, hi], unit) => (hi === Infinity ? `${lo}+ ${unit}` : `${lo}-${hi} ${unit}`);

// Putts by how long (feet): how many went in.
export const PUTT_BANDS = [
  [0, 3],
  [3, 6],
  [6, 10],
  [10, 20],
  [20, 40],
  [40, Infinity],
];

export const emptyBands = () => ({
  approach: APPROACH_BANDS.map(() => ({ n: 0, green: 0, feet: 0 })),
  putts: PUTT_BANDS.map(() => ({ n: 0, made: 0 })),
});

const bandOf = (bands, x) => bands.findIndex(([lo, hi]) => x >= lo && x < hi);

// Adds a hole's shots (holeShots) to the bands.
export function addToBands(bands, list) {
  for (const s of list) {
    if (s.cat === "putting") {
      const i = bandOf(PUTT_BANDS, s.d * 3);
      if (i < 0) continue;
      bands.putts[i].n++;
      if (s.made) bands.putts[i].made++;
    } else if (s.cat === "approach" && !s.pen && Number.isFinite(s.f)) {
      const i = bandOf(APPROACH_BANDS, s.d);
      if (i < 0) continue;
      const b = bands.approach[i];
      b.n++;
      if (s.green) b.green++;
      b.feet += s.f * 3;
    }
  }
  return bands;
}

// Several rounds' bands added together.
export function mergeBands(list) {
  const out = emptyBands();
  for (const b of list) {
    if (!b) continue;
    b.approach.forEach((x, i) => {
      out.approach[i].n += x.n;
      out.approach[i].green += x.green;
      out.approach[i].feet += x.feet;
    });
    b.putts.forEach((x, i) => {
      out.putts[i].n += x.n;
      out.putts[i].made += x.made;
    });
  }
  return out;
}

// The bands as they're shown: approach { name, shots, greenPct, feet }
// and putts { name, putts, madePct }.
export function bandsReport(bands) {
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : null);
  return {
    approach: APPROACH_BANDS.map((r, i) => {
      const b = bands.approach[i];
      return { name: bandName(r, "yds"), shots: b.n, greenPct: pct(b.green, b.n), feet: b.n ? Math.round(b.feet / b.n) : null };
    }),
    putts: PUTT_BANDS.map((r, i) => {
      const b = bands.putts[i];
      return { name: bandName(r, "ft"), putts: b.n, madePct: pct(b.made, b.n) };
    }),
  };
}
