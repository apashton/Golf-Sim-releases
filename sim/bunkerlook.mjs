// How a course's bunkers look (the owner: "Bunkers. Need more variation,
// they all look a bit similar"): its sand, and each bunker's own edge and
// state - drawn by look/sandwater.js, on every course, those made before
// this too. Nothing here changes how a bunker plays.
//
// The sand (SANDS), the course's (courseSand): the colour it's tinted by
// (over palette.js sand), how coarse it is (stones: small dark grains and
// pebbles), how it's kept:
//   golden   the warm sand parkland courses have always had here
//   white    bright silica sand, raked crisp - the big modern courses'
//   heath    coarse, browner sand with small stones - heathland and woodland
//   links    pale, greyer buff sand, windblown, rippled more than raked
// Each bunker (bunkerLook): its edge - ragged, the grass breaking into the
// sand in bays and fingers, an eroded lip (a rugged course's, a links
// hole's blown-out bunkers); clean-cut, the turf edged off sharp over a
// sliver of soil (most of a modern course's, many a parkland course's, a
// pot's revetted face); or soft, the grass thinning out into the sand with
// no line between (the owner, 23 October 2026: "A clear edge or a smooth
// edge need to be varied or designed") - and whether it's freshly raked,
// raked a while ago and walked through, or windblown smooth.

export const SANDS = {
  golden: { name: "Golden", tint: [1, 1, 1], stones: 0 },
  white: { name: "White silica", tint: [1.07, 1.08, 1.13], stones: 0 },
  heath: { name: "Heathland - coarse and brown", tint: [0.92, 0.85, 0.76], stones: 1 },
  links: { name: "Links - pale and windblown", tint: [0.97, 0.94, 0.86], stones: 0.4 },
};

// How a bunker's kept: rake, how strong its rake lines are (1: as always);
// prints, how many footprints (1: as always).
export const KEPT = {
  raked: { rake: 1.15, prints: 0.25 },
  walked: { rake: 0.7, prints: 1.1 },
  windblown: { rake: 0.15, prints: 0.35 },
};

// A course's bunkers' style by its holes (sim/course.mjs holeBunkerStyle,
// passed in to keep this module on its own): which most of them are.
// Mapped courses keep golden sand; a classic (parkland) course's is golden
// or white by its name.
export function courseSand(course, styleOf = () => "classic") {
  const holes = course?.holes ?? [];
  // (A course made up and put on hills is rebuilt as a map's is, but keeps
  // its holes' styles: sim/imaginary.mjs.)
  const imaginary = course?.source?.kind === "imaginary";
  if (!holes.length || course.source === "map" || (!imaginary && holes.every((h) => h?.spec?.source === "map"))) return "golden";
  const count = {};
  for (const h of holes) {
    const s = styleOf(h?.spec?.options ?? {});
    count[s] = (count[s] ?? 0) + 1;
  }
  const most = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
  if (most === "links") return "links";
  if (most === "rugged") return "heath";
  if (most === "modern") return "white";
  return hash(String(course.seedAs ?? course.id ?? course.name ?? "")) < 0.45 ? "white" : "golden";
}

// A number 0 - 1 from a string or a spot.
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}
function spotHash(x, z, k) {
  const h = Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 43758.5453;
  return h - Math.floor(h);
}

// One bunker's look: { tint (rgb, the sand's and a touch of its own), ragged
// (0 - 1), cut (0 - 1, how clean-cut its edge), soft (0 - 1, how softly
// the grass thins into it), rake, prints, stones, kept } - and a waste
// area's waste: 1. b: the bunker
// (its place, and whether it's fingered or a pot); sand: the course's
// (SANDS); style: the hole's (holeBunkerStyle).
export function bunkerLook(b, { sand = "golden", style = "classic" } = {}) {
  // A heathland waste area (sim/course.mjs WASTE): coarse heath sand,
  // the most ragged of edges, windblown - whatever the course's sand.
  // (waste: drawn as sandy ground with scrub through it, not a bunker's
  // sand - look/sandwater.js.)
  if (b.waste) return { tint: SANDS.heath.tint, ragged: 1, cut: 0, soft: 0.5, ...KEPT.windblown, stones: SANDS.heath.stones, kept: "windblown", waste: 1 };
  const S = SANDS[sand] ?? SANDS.golden;
  const r = (k) => spotHash(b.x ?? 0, b.z ?? 0, k);
  // (A pot: a tall turf face - course.mjs isPot, whose pots are now dug
  // shallow at the back.)
  const pot = b.wall?.m === 0 && (b.wall.h ?? 1.2) >= 1.1 && (b.dig ?? 0) > 0;
  const linksy = style === "links" || sand === "links";
  // Its edge: a rugged course's bunkers and a links hole's open ones
  // ragged (now and then with the grass thinning in too, or a worn cut
  // along the lip); a pot's revetted face clean-cut; a modern course's
  // mostly clean-cut; a parkland course's clean-cut, soft or a little worn,
  // bunker by bunker.
  let ragged = 0;
  let cut = 0;
  let soft = 0;
  const e = r(5);
  if (pot) {
    ragged = 0.15;
    cut = 1;
  } else if (b.fingers || style === "rugged") {
    ragged = 0.6 + 0.4 * r(1);
    if (e < 0.35) soft = 0.4 + 0.3 * r(6);
  } else if (linksy) {
    ragged = 0.45 + 0.35 * r(1);
    if (e < 0.4) cut = 0.3 + 0.3 * r(6);
  } else if (style === "modern") {
    ragged = 0.05 * r(1);
    if (e < 0.8) cut = 0.85 + 0.15 * r(6);
    else soft = 0.6 + 0.4 * r(6);
  } else if (e < 0.45) {
    ragged = 0.03 * r(2);
    cut = 0.75 + 0.25 * r(6);
  } else if (e < 0.8) {
    ragged = 0.05 * r(2);
    soft = 0.55 + 0.45 * r(6);
  } else ragged = 0.2 + 0.2 * r(2);
  // How it's kept: on a links course the wind has most of them.
  const k = r(3);
  const kept = linksy ? (k < 0.45 ? "windblown" : k < 0.8 ? "walked" : "raked") : style === "modern" ? (k < 0.65 ? "raked" : "walked") : k < 0.45 ? "raked" : k < 0.85 ? "walked" : "windblown";
  // A touch lighter or darker than the next (topped up, or not).
  const tone = 0.96 + 0.08 * r(4);
  const r3 = (v) => Math.round(v * 1000) / 1000;
  return { tint: S.tint.map((v) => r3(v * tone)), ragged: r3(ragged), cut: r3(cut), soft: r3(soft), ...KEPT[kept], stones: S.stones, kept };
}

// How far (metres) a dug or walled bunker's sand is drawn below where it
// would be `e` metres in from its edge: RIM_TUCK at the edge itself,
// easing to none RIM_TUCK_IN metres in. Sand is drawn a few centimetres
// over the ground (look/lifts.js), so at a dug bowl's rim its edge stood
// proud of the collar of grass round it - and there's no ground under a
// dug bowl's sand, so from a low camera outside it the sea or the sky
// below showed through the slit under the sand's edge as a white line
// round the rim (a pot bunker's, by the speed test's links green). Tucked
// under the collar's inner edge, the collar covers it.
export const RIM_TUCK = 0.05;
export const RIM_TUCK_IN = 0.3;
// How far (metres) in under that edge the ground round a dug bowl reaches,
// laid on the grass there, so no slit opens between the two.
export const RIM_UNDER = 0.03;
export function rimTuck(e) {
  const t = Math.min(1, Math.max(0, e / RIM_TUCK_IN));
  return RIM_TUCK * (1 - t * t * (3 - 2 * t));
}
