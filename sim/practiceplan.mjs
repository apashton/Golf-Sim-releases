// Practice plans: a short scored drill for the part of the game that costs
// the most strokes. What the drills are, how each shot scores, which one
// the stats point to, and the drill's running score. Pure: practiceplan.js
// runs one in the sim, the stats page suggests them.
//
// A drill is ten shots in one of the practice modes, set up by its own
// settings - the range's target somewhere in a band of distances, the
// putting green's distance anywhere in a band, the chipping green's the
// same - and scored 0 to 100 a shot, the drill's score the average. So a
// score is comparable with the last time: the stats page's trends show it.

export const SHOTS = 10;

// Each drill: its mode, what it's called and why it's scored as it is, the
// settings it plays with, and a shot's points from what the mode recorded
// (its target: distance, finish (yards away, or the miss on the range),
// made; its result: offline).
export const DRILLS = [
  {
    id: "tee",
    name: "Fairway finder",
    kind: "tee",
    mode: "range",
    club: "DR",
    what: "Ten drives down the middle: 100 for a fairway (within 15 yds of the line), 50 for the first cut (25), none beyond.",
    setup: { target: 0 },
    points: (ctx) => {
      const off = Math.abs(ctx.result?.offline ?? Infinity);
      return off <= 15 ? 100 : off <= 25 ? 50 : 0;
    },
  },
  ...[
    [50, 100],
    [100, 150],
    [150, 200],
    [200, 230],
  ].map(([lo, hi]) => ({
    id: `approach-${lo}-${hi}`,
    name: `Approach combine ${lo}-${hi} yds`,
    kind: "approach",
    band: [lo, hi],
    mode: "range",
    what: `Ten shots at targets anywhere from ${lo} to ${hi} yds, a new one each shot: 100 in the hole, nothing once you're 15% of the distance away (22 yds at 150). A tour pro averages about 60.`,
    setup: { targetBand: [lo, hi] },
    points: (ctx) => {
      const d = ctx.target?.distance;
      const miss = ctx.target?.finish;
      if (!Number.isFinite(d) || !Number.isFinite(miss)) return 0;
      return Math.round(100 * Math.max(0, 1 - miss / (0.15 * d)));
    },
  })),
  {
    id: "around",
    name: "Up and down: chips 10-30 yds",
    kind: "around",
    mode: "chipping",
    what: "Ten chips from anywhere between 10 and 30 yds: 100 holed, 10 less for every foot left (nothing from 10 ft).",
    setup: { minYards: 10, maxYards: 30 },
    points: (ctx) => (ctx.target?.made ? 100 : Math.round(Math.max(0, 100 - 10 * 3 * (ctx.target?.finish ?? Infinity)))),
  },
  {
    id: "putts-short",
    name: "Short putts 3-10 ft",
    kind: "putting",
    band: [3, 10],
    mode: "putting",
    what: "Ten putts from 3 to 10 ft, a new length each time: 100 for every one holed.",
    setup: { minFt: 3, maxFt: 10 },
    points: (ctx) => (ctx.target?.made ? 100 : 0),
  },
  {
    id: "putts-mid",
    name: "Makeable putts 10-20 ft",
    kind: "putting",
    band: [10, 20],
    mode: "putting",
    what: "Ten putts from 10 to 20 ft: 100 holed, 50 within 3 ft for a sure second putt.",
    setup: { minFt: 10, maxFt: 20 },
    points: (ctx) => (ctx.target?.made ? 100 : (ctx.target?.finish ?? Infinity) * 3 <= 3 ? 50 : 0),
  },
  {
    id: "putts-lag",
    name: "Lag putts 20-45 ft",
    kind: "putting",
    band: [20, 45],
    mode: "putting",
    what: "Ten long putts, 20 to 45 ft: 100 holed, 70 within 3 ft, 30 within 6 ft - no three putts.",
    setup: { minFt: 20, maxFt: 45 },
    points: (ctx) => {
      if (ctx.target?.made) return 100;
      const ft = (ctx.target?.finish ?? Infinity) * 3;
      return ft <= 3 ? 70 : ft <= 6 ? 30 : 0;
    },
  },
];
// Not ten scored shots but a session of its own (sim/gapping.mjs): five
// good balls with every club, the game picking each in turn. Listed with
// the drills so My stats can suggest it and "Practise this" can start it.
DRILLS.push({
  id: "gapping",
  name: "Gapping session",
  kind: "gapping",
  mode: "range",
  what: "Five good balls with every club in your bag, wedges first: A² Golf picks each club in turn and moves on by itself, and your gapping chart fills in. N skips a club you don't carry.",
  setup: { target: 0 },
  points: () => null,
});
export const drillById = (id) => DRILLS.find((d) => d.id === id) ?? null;
// The drills that are ten scored shots (all but the gapping session).
export const SCORED = DRILLS.filter((d) => d.kind !== "gapping");
// Clubs with this many good shots are in the gapping chart; a chart with
// fewer than CHARTED of them is worth a gapping session.
export const CHART_SHOTS = 5;
export const CHARTED = 6;
export const GAME_KIND = "practice-plan";

// A drill being played: its shots' points so far.
export class DrillRun {
  constructor(drill, { shots = SHOTS } = {}) {
    this.drill = drill;
    this.shots = shots;
    this.points = [];
  }
  get done() {
    return this.points.length >= this.shots;
  }
  get score() {
    return this.points.length ? Math.round(this.points.reduce((a, p) => a + p, 0) / this.points.length) : 0;
  }
  // A shot recorded in the drill's mode: its points. Putts and chips that
  // weren't for the hole (a zone game), or a shot in another mode, don't
  // count (null).
  add(mode, ctx) {
    if (this.done || mode !== this.drill.mode) return null;
    const p = this.drill.points(ctx);
    if (!Number.isFinite(p)) return null;
    this.points.push(p);
    return p;
  }
  // "Approach combine 150-200 yds: 4 of 10, 62 (average 55)".
  line(last = null) {
    return `${this.drill.name}: ${this.points.length} of ${this.shots}${last != null ? `, ${last}` : ""} (average ${this.score})`;
  }
}

// Roughly what share a tour pro holes from each of the stats page's putt
// lengths (0-3, 3-6, 6-10, 10-20, 20-40, 40+ ft).
const TOUR_MAKES = [97, 78, 50, 25, 8, 3];

const CATEGORY_WORDS = { tee: "Your driving", approach: "Your approach play", around: "Your short game", putting: "Your putting" };

// The drill for each part of the game, from the stats: the approach band
// that finds the fewest greens, the putt length furthest below the tour's.
function drillFor(kind, averages) {
  if (kind === "tee") return { drill: drillById("tee"), why: "" };
  if (kind === "around") return { drill: drillById("around"), why: "" };
  if (kind === "approach") {
    const bands = (averages?.approachBands ?? []).filter((b) => b.shots >= 3);
    const worst = bands.sort((a, b) => (a.greenPct ?? 0) - (b.greenPct ?? 0))[0];
    const id = worst ? { "50-100 yds": "approach-50-100", "100-150 yds": "approach-100-150", "150-200 yds": "approach-150-200", "200+ yds": "approach-200-230" }[worst.name] : "approach-100-150";
    return { drill: drillById(id ?? "approach-100-150"), why: worst ? `greens hit from ${worst.name}: ${worst.greenPct}%` : "" };
  }
  const putts = averages?.puttBands ?? [];
  let best = null;
  putts.forEach((b, i) => {
    if (!b.putts || b.madePct == null) return;
    const lost = ((TOUR_MAKES[i] - b.madePct) / 100) * b.putts;
    if (!best || lost > best.lost) best = { i, lost, b };
  });
  const id = !best || best.i <= 2 ? "putts-short" : best.i === 3 ? "putts-mid" : "putts-lag";
  return { drill: drillById(id), why: best ? `holed from ${best.b.name}: ${best.b.madePct}%` : "" };
}

// The drills the stats point to, most useful first: [{ drill, why }].
// report: the stats page's data (rounds.averages with strokes gained and
// the bands, the baseline it's against, the trends). With no rounds yet,
// what's declining in practice; failing that, a sensible start.
export function suggestDrills(report) {
  const a = report?.rounds?.averages ?? null;
  const sg = a?.sg ?? null;
  const against = report?.sgBaseline?.name ?? "a tour pro";
  const out = [];
  const seen = new Set();
  const push = (x) => {
    if (x?.drill && !seen.has(x.drill.id)) {
      seen.add(x.drill.id);
      out.push(x);
    }
  };
  if (sg) {
    const kinds = ["tee", "approach", "around", "putting"].sort((x, y) => sg[x] - sg[y]);
    for (const k of kinds) {
      const d = drillFor(k, a);
      const v = sg[k];
      const cost = v < 0 ? `costs you ${Math.abs(v).toFixed(1)} strokes a round against ${against}` : `gains you ${v.toFixed(1)} a round against ${against}`;
      push({ drill: d.drill, why: `${CATEGORY_WORDS[k]} ${cost}${d.why ? ` - ${d.why}` : ""}.`, sg: v });
    }
  }
  const t = report?.trends;
  if (t) {
    for (const c of t.clubs ?? []) if (c.offline?.direction === "worse" || c.carry?.direction === "worse") push({ drill: drillById(c.club === "DR" ? "tee" : "approach-100-150"), why: `Your ${c.club} is ${c.offline?.direction === "worse" ? "going further off line" : "carrying shorter"} lately.` });
    for (const m of t.short ?? []) {
      if (m.direction !== "worse") continue;
      push({ drill: drillById(m.key === "chips" ? "around" : "putts-short"), why: m.key === "chips" ? "Your chips are finishing further away lately." : "You're holing fewer short putts lately." });
    }
  }
  // A gapping chart with few clubs in it: a gapping session fills it in.
  if (report) {
    const charted = (report.clubs ?? []).filter((c) => c.n >= CHART_SHOTS).length;
    if (charted < CHARTED)
      push({
        drill: drillById("gapping"),
        why: charted ? `Your gapping chart has ${charted} club${charted === 1 ? "" : "s"} with ${CHART_SHOTS} good shots - a session fills in the rest.` : `Your gapping chart is empty - a session fills it in, ${CHART_SHOTS} good balls a club.`,
      });
  }
  for (const id of ["approach-100-150", "putts-short", "around", "tee"]) push({ drill: drillById(id), why: "" });
  return out;
}

// The drill's scores over time, for the trends: [{ t, v, w }] by drill.
export function drillScores(games) {
  const by = new Map();
  for (const g of games) {
    if (g.kind !== GAME_KIND || !Number.isFinite(g.score) || !drillById(g.key)) continue;
    if (!by.has(g.key)) by.set(g.key, []);
    by.get(g.key).push({ t: g.t, v: g.score, w: 1 });
  }
  return by;
}
