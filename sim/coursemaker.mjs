// The course maker (the owner: "make it easy to just create 18 holes with a
// few clicks, but also with a few more create a bit of customisation" - and
// "set hole ranges into different styles, say 1-9 tree lines, 10-18 links
// styles, even switch every 6 holes"). A course is made from:
//   holes     9 or 18
//   sections  ranges of holes, each in a style: [{ from, to, style }]
//   pars      the mix of par 3s, 4s and 5s (or every hole a par 3, or a
//             chip and putt's)
//   length    shorter, normal or longer holes
//   details   course-wide choices that override the styles: water,
//             bunkers, dog-legs, greens, cart paths
// into a scorecard - [{ par, yards, si, options }] for buildCourse - every
// hole's options from its section's style and the details, seeded so the
// same choices make the same card. A quick start (PRESETS) sets them all
// at once. Pure: designer.js draws it.

import { seeded } from "./course.mjs";
import { composeCard } from "./sequence.mjs";

// Each style: a look and how it plays (the hole options it gives) and how
// often a hole of it has water.
export const STYLES = {
  parkland: { name: "Parkland", blurb: "Tree-lined fairways, a few ponds", colour: "#3f8f4a", options: { trees: "normal", fairway: "normal", bunkers: "some" }, water: 0.25 },
  woodland: { name: "Woodland", blurb: "Tight, through thick woods", colour: "#2b5e33", options: { trees: "heavy", fairway: "narrow", bunkers: "few" }, water: 0.15 },
  open: { name: "Open", blurb: "Wide fairways, light trees", colour: "#8fbf5a", options: { trees: "light", fairway: "wide", bunkers: "some" }, water: 0.2 },
  lakes: { name: "Lakes", blurb: "Water on most holes", colour: "#3a86b8", options: { trees: "normal", fairway: "normal", bunkers: "some" }, water: 0.75 },
  links: { name: "Links - brown dunes", blurb: "No trees: dune grass everywhere off the fairways", colour: "#c2a15e", options: { trees: "dunes", fairway: "wide", bunkers: "lots" }, water: 0.05 },
  greenlinks: { name: "Links - green", blurb: "No trees: darker, thicker long grass", colour: "#6f9a3a", options: { trees: "greenlinks", fairway: "wide", bunkers: "lots" }, water: 0.05 },
};

// How sections are laid out, for a course of n holes.
export const PATTERNS = {
  one: "One style",
  halves: "Front nine / back nine",
  sixes: "Every 6 holes",
  threes: "Every 3 holes",
};

// The mix of pars, per nine (a full course's goes round twice); par 3s
// and chip and putt every hole a par 3.
export const PARS = {
  standard: { name: "Standard (par 72)", nine: [4, 4, 3, 5, 4, 3, 4, 5, 4] },
  short: { name: "Short (par 68)", nine: [4, 3, 4, 3, 4, 4, 3, 4, 5] },
  long: { name: "Long (par 74)", nine: [4, 5, 3, 4, 5, 4, 3, 5, 4] },
  par3: { name: "Every hole a par 3", nine: [3, 3, 3, 3, 3, 3, 3, 3, 3] },
  chipputt: { name: "Chip and putt (25 - 70 yds)", nine: [3, 3, 3, 3, 3, 3, 3, 3, 3] },
};
// Yards by par: the middle of the range and how far either way.
const YARDS = { 3: [160, 35], 4: [395, 50], 5: [525, 40] };
const CHIP_PUTT = [25, 70];
export const LENGTHS = { shorter: { name: "Shorter", k: 0.88 }, normal: { name: "Normal", k: 1 }, longer: { name: "Longer", k: 1.1 } };

// Course-wide choices, each "style" (as each hole's style has it) or a
// value for every hole.
export const DETAILS = {
  // Strategic (sim/architect.mjs, sim/sequence.mjs): every hole built round
  // a better side of the fairway, a few of the great courses' template
  // holes, the pars, lengths, water and dog-legs composed for variety and
  // pace. Classic: as courses were made before.
  design: { label: "Design", choices: { strategic: "Strategic - holes built round a better side", classic: "Classic" } },
  water: { label: "Water", choices: { style: "As the style", none: "None", some: "On some holes", lots: "On most holes" } },
  bunkers: { label: "Bunkers", choices: { style: "As the style", few: "Few", some: "Some", lots: "Lots" } },
  doglegs: { label: "Dog-legs", choices: { style: "Some (as it comes)", none: "None - all straight", lots: "Lots" } },
  green: { label: "Greens", choices: { normal: "Normal", small: "Small", large: "Large" } },
  contours: { label: "Green slopes", choices: { gentle: "Gentle", moderate: "Moderate", severe: "Severe" } },
  paths: { label: "Cart paths", choices: { auto: "Every hole, whichever side suits", left: "Down the left", right: "Down the right", none: "None" } },
};
export const DEFAULT_DETAILS = { design: "strategic", water: "style", bunkers: "style", doglegs: "style", green: "normal", contours: "gentle", paths: "auto" };
const WATER_SHARE = { none: 0, some: 0.3, lots: 0.7 };

// Quick starts: everything set in one click.
export const PRESETS = {
  parkland: { name: "Parkland", pattern: "one", styles: ["parkland"], pars: "standard" },
  woodland: { name: "Woodland", pattern: "one", styles: ["woodland"], pars: "standard" },
  open: { name: "Open", pattern: "one", styles: ["open"], pars: "standard" },
  lakes: { name: "Lakes", pattern: "one", styles: ["lakes"], pars: "standard" },
  links: { name: "Links - brown dunes", pattern: "one", styles: ["links"], pars: "standard" },
  greenlinks: { name: "Links - green", pattern: "one", styles: ["greenlinks"], pars: "standard" },
  halves: { name: "Parkland front, links back", pattern: "halves", styles: ["parkland", "links"], pars: "standard" },
  sixes: { name: "Changes every 6 holes", pattern: "sixes", styles: ["woodland", "lakes", "greenlinks"], pars: "standard" },
  par3: { name: "Par 3 course", pattern: "one", styles: ["parkland"], pars: "par3" },
  chipputt: { name: "Chip and putt", pattern: "one", styles: ["open"], pars: "chipputt", details: { water: "none", bunkers: "few", doglegs: "none", paths: "none" } },
};

// The sections for a pattern: the course's holes in runs, the styles given
// taking turns ([a, b] every 6 holes of 18: a, b, a).
export function sectionsFor(pattern, holes, styles = ["parkland"]) {
  const n = holes > 9 ? 18 : 9;
  const list = styles.filter((s) => STYLES[s]);
  if (!list.length) list.push("parkland");
  const run = { one: n, halves: Math.ceil(n / 2), sixes: 6, threes: 3 }[pattern] ?? n;
  const out = [];
  for (let from = 1, k = 0; from <= n; from += run, k++) out.push({ from, to: Math.min(n, from + run - 1), style: list[k % list.length] });
  return out;
}

// The sections made sound: in order, covering holes 1 to n with no gaps or
// overlaps (a range's end decides where the next starts), each a known
// style.
export function cleanSections(sections, holes) {
  const n = holes > 9 ? 18 : 9;
  const list = (Array.isArray(sections) ? sections : []).filter((s) => s && STYLES[s.style]);
  if (!list.length) return [{ from: 1, to: n, style: "parkland" }];
  const out = [];
  let from = 1;
  for (const s of list) {
    if (from > n) break;
    const to = Math.max(from, Math.min(n, Math.round(Number(s.to)) || n));
    out.push({ from, to, style: s.style });
    from = to + 1;
  }
  if (from <= n) out[out.length - 1].to = n;
  return out;
}

// Which style hole number `h` (1-based) is.
export function styleOf(sections, h) {
  return (sections.find((s) => h >= s.from && h <= s.to) ?? sections[sections.length - 1])?.style ?? "parkland";
}

// Stroke indexes for a card: the hardest holes (longest for their par)
// lowest; on 18 holes the front nine has the odd ones, the back the even.
export function strokeIndexes(card) {
  const hard = (h) => h.yards / (YARDS[h.par]?.[0] ?? 400);
  if (card.length <= 9) {
    const order = card.map((h, i) => [i, hard(h)]).sort((a, b) => b[1] - a[1]);
    const si = [];
    order.forEach(([i], k) => (si[i] = k + 1));
    return si;
  }
  const si = [];
  for (const [half, odd] of [[[0, 9], true], [[9, card.length], false]]) {
    const order = card
      .map((h, i) => [i, hard(h)])
      .slice(half[0], half[1])
      .sort((a, b) => b[1] - a[1]);
    order.forEach(([i], k) => (si[i] = odd ? 2 * k + 1 : 2 * k + 2));
  }
  return si;
}

// The scorecard: { holes, sections, pars, length, details, seed } in,
// [{ par, yards, si, options }] out.
export function makeCard({ holes = 18, sections = null, pars = "standard", length = "normal", details = {}, seed = 1 } = {}) {
  const n = holes > 9 ? 18 : 9;
  const secs = cleanSections(sections ?? sectionsFor("one", n), n);
  const mix = PARS[pars] ?? PARS.standard;
  const d = { ...DEFAULT_DETAILS, ...details };
  const k = (LENGTHS[length] ?? LENGTHS.normal).k;
  if (d.design === "strategic" && pars !== "chipputt") return strategicCard({ n, secs, mix, k, d, seed, par3: pars === "par3" });
  const rand = seeded(seed ^ 0xc0de);
  const card = [];
  for (let i = 0; i < n; i++) {
    const par = mix.nine[i % 9];
    const style = STYLES[styleOf(secs, i + 1)];
    // The draws for every choice taken each hole, whichever are used, so
    // changing one choice doesn't change the rest of the course.
    const [ry, rw, rs, rd] = [rand(), rand(), rand(), rand()];
    let yards;
    if (pars === "chipputt") yards = Math.round(CHIP_PUTT[0] + ry * (CHIP_PUTT[1] - CHIP_PUTT[0]));
    else {
      const [mid, spread] = YARDS[par];
      yards = Math.round(((mid + (ry * 2 - 1) * spread) * k) / 5) * 5;
    }
    const options = { ...style.options };
    // Water: the style's share of holes, or the course's.
    const share = d.water === "style" ? style.water : WATER_SHARE[d.water] ?? style.water;
    if (pars === "chipputt") options.water = "none";
    else if (rw < share) options.water = par === 3 && rs < 0.5 ? "front" : rs < 0.5 ? "left" : "right";
    else options.water = "none";
    if (d.bunkers !== "style") options.bunkers = d.bunkers;
    options.dogleg = d.doglegs === "none" || pars === "chipputt" ? "none" : d.doglegs === "lots" && par > 3 ? (rd < 0.5 ? "left" : "right") : "auto";
    options.green = d.green;
    options.contours = d.contours;
    options.paths = pars === "chipputt" && d.paths === "auto" ? "none" : d.paths;
    card.push({ par, yards, options, style: styleOf(secs, i + 1) });
  }
  const si = strokeIndexes(card);
  return card.map((h, i) => ({ ...h, si: si[i] }));
}

// A strategic course's card (sim/sequence.mjs composeCard): its pars,
// lengths, template holes, water and dog-legs composed, each hole its
// section's style otherwise, the course-wide choices over them.
function strategicCard({ n, secs, mix, k, d, seed, par3 }) {
  const styles = Array.from({ length: n }, (_, i) => styleOf(secs, i + 1));
  const shares = styles.map((st) => (d.water === "style" ? STYLES[st].water : WATER_SHARE[d.water] ?? STYLES[st].water));
  const plan = composeCard({ nine: mix.nine, n, k, shares, seed, spread: par3 ? PAR3_SPREAD : null });
  const card = plan.pars.map((par, i) => {
    const options = { ...STYLES[styles[i]].options, design: "strategic", template: plan.templates[i] ?? "auto", water: plan.water[i] };
    if (d.bunkers !== "style") options.bunkers = d.bunkers;
    const bend = plan.doglegs[i];
    options.dogleg = d.doglegs === "none" ? "none" : d.doglegs === "lots" && par > 3 && bend === "auto" ? (i % 2 ? "left" : "right") : bend;
    options.green = d.green;
    options.contours = d.contours;
    options.paths = d.paths;
    return { par, yards: plan.yards[i], options, style: styles[i] };
  });
  const si = strokeIndexes(card);
  return card.map((h, i) => ({ ...h, si: si[i] }));
}
// A course of par 3s: from a wedge to a long iron.
const PAR3_SPREAD = { 3: [110, 205] };

// What a preset sets: { pattern, sections, pars, details }.
export function presetChoices(id, holes = 18) {
  const p = PRESETS[id] ?? PRESETS.parkland;
  return { pattern: p.pattern, sections: sectionsFor(p.pattern, holes, p.styles), pars: p.pars, details: { ...DEFAULT_DETAILS, ...(p.details ?? {}) } };
}
