// The shot tracer's rules, kept apart from three.js so they can be tested:
// how wide each part of it is drawn, whose colour it's in, how an earlier
// shot's is dimmed, which one is the last shot's, and how far along each
// part the ball has got.
//
// A tracer follows the whole of a shot, not just its flight: a thin line
// through the air, then a thicker one along the bounces and the roll, so
// where it came down and how far it ran out can both be seen afterwards.
// A putt, which never leaves the ground, has a line of its own: as thin as
// the flight's, lying on the green, and fading only very close to the
// camera, which crouches a couple of metres behind the ball.

import { PLAYER_COLOURS } from "./players.mjs";

// The width the tracer was before it had parts: its radius as a share of
// its distance from the camera, about 5 pixels across on a 1080-line
// picture. Each part is drawn as some share of it.
export const BASE_WIDTH = 0.0025;

// Each part's look:
//   width  radius as a share of distance from the camera (screen-constant)
//   min    never thinner than this, in metres, close to
//   near, far  metres from the camera: clear inside near, full beyond far
//   lift   how far the line is raised off the ground, in its own radii,
//          so it sits on the grass rather than half in it (and doesn't
//          flicker against it) however wide it's drawn from far away
//   above  and a little more, in metres
//   fadeFrom, fadeTo, least  far off, it thins into the haze: full
//          strength out to fadeFrom metres, `least` of it from fadeTo on
export const TRACER_STYLES = {
  // Through the air: thinner than it was, so the flight reads as a line
  // drawn across the sky rather than a band.
  air: { width: BASE_WIDTH * 0.65, min: 0.013, near: 3, far: 14, lift: 0, above: 0, fadeFrom: 160, fadeTo: 420, least: 0.5 },
  // The bounces and the roll: thicker, so it shows against the grass from
  // the tee, and laid just on top of the ground.
  ground: { width: BASE_WIDTH * 1.8, min: 0.03, near: 3, far: 14, lift: 1.2, above: 0.015, fadeFrom: 160, fadeTo: 420, least: 0.6 },
  // A putt: the flight's width, which reads on a green seen from close
  // behind the ball without covering the ideal line or the grid's marks,
  // and a much shorter fade, or the camera's two or three metres back
  // would hide the first half of it.
  putt: { width: BASE_WIDTH * 0.65, min: 0.004, near: 0.35, far: 1.3, lift: 1, above: 0.002, fadeFrom: 160, fadeTo: 420, least: 1 },
};

// How strong a part is `d` metres from the camera, from the far fade alone
// (1 near to, `least` far off).
export function farFade(style, d) {
  const t = Math.min(1, Math.max(0, (d - style.fadeFrom) / (style.fadeTo - style.fadeFrom)));
  return 1 - (1 - style.least) * t * t * (3 - 2 * t);
}

// How a tracer is drawn: the last shot's at full strength, every earlier
// one's faint, so it's there to be seen without getting in the way.
export const LOOKS = {
  last: { opacity: 0.95 },
  faint: { opacity: 0.4 },
};

// How many tracers stay up where shots are many: the range's last twenty,
// a practice green's last twelve putts or chips.
export const KEEP_RANGE = 20;
export const KEEP_PRACTICE = 12;

// The colour for a player's slot in the list; playing alone, with nobody
// named or a slot that isn't there, player 1's.
export function tracerColour(slot) {
  return PLAYER_COLOURS[Number.isInteger(slot) && slot >= 0 && slot < PLAYER_COLOURS.length ? slot : 0];
}

// The slot of `name` in the players list (0 when not in it).
export function slotOf(name, names = []) {
  return Math.max(0, names.indexOf(name));
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const hex = (c) => `#${c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("")}`;

// An earlier shot's colour: part of the way to a grey as bright as it is
// (less saturated) and then darker, toward the ground it lies over. Its hue
// is the same, so whose shot it was can still be told.
//   grey  share of the way to the grey (0 none, 1 all of it)
//   dark  how much darker (0 none, 1 black)
export function faintColour(colour, { grey = 0.45, dark = 0.35 } = {}) {
  const c = rgb(colour);
  const l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  return hex(c.map((v) => (v + (l - v) * grey) * (1 - dark)));
}

// Which look each of `count` tracers has, oldest first: only the last
// is at full strength.
export function tracerLooks(count) {
  return Array.from({ length: count }, (_, i) => (i === count - 1 ? "last" : "faint"));
}

// Where a shot's path splits: its first `flightPoints` points are in the
// air, the rest along the ground. The ground part starts at the landing
// (the flight's last point), so the two meet. A putt (no flight) is all
// ground. Returns index ranges [from, to) into the path, or null for a
// part it hasn't got (fewer than two points).
export function splitPath(length, flightPoints) {
  const fp = Math.min(Math.max(0, flightPoints | 0), length);
  const air = fp > 1 ? [0, fp] : null;
  const from = fp > 1 ? fp - 1 : 0;
  const ground = length - from > 1 ? [from, length] : null;
  return { air, ground };
}

// How far along each part to draw, with the ball `k` of the way from path
// point `index` to the next: for each part, null (none of it yet), "all",
// or [index, k] within that part.
export function partsAt(index, k, length, flightPoints) {
  const { air, ground } = splitPath(length, flightPoints);
  const within = (range) => {
    if (!range) return null;
    const [from, to] = range;
    if (index < from) return null;
    if (index >= to - 1) return "all";
    return [index - from, k];
  };
  return { air: within(air), ground: within(ground) };
}

// How high above the path's own heights each point is drawn, where the
// flight was worked out over flat ground but the ground drawn under it
// isn't (the range's target greens stand proud on their banks).
// `groundY(x, z)` is the ground's height at a path point. Along the ground
// (from the landing on) each point sits on what's under it; through the air
// the lift goes evenly, by time, from the ground at the start to the ground
// at the landing - so the flight is as smooth as it was flown, rather than
// bobbing up and down over every green and bank it passes over, and still
// meets the ground at both ends.
export function pathLifts(path, flightPoints, groundY) {
  const n = path.length;
  const lifts = path.map((p) => groundY(p[0], p[2]));
  const land = Math.min(Math.max(0, flightPoints | 0), n) - 1;
  if (land < 1) return lifts;
  const t0 = path[0][3] ?? 0;
  const span = (path[land][3] ?? land) - t0;
  const from = lifts[0];
  const to = lifts[land];
  for (let i = 1; i < land; i++) {
    const k = span > 0 ? ((path[i][3] ?? i) - t0) / span : i / land;
    lifts[i] = from + (to - from) * Math.min(1, Math.max(0, k));
  }
  return lifts;
}

// Where a hole's shot is drawn - its tracer, and the ball through the air:
// the path with each height the height itself rather than above the
// ground ([x, y, z, t], hole frame).
//   ground(x, z)   the ground's height
//   surface(x, z)  what's drawn there: the grass, or the top of a pond's
//                  water (which lies above its bed, and a wall's height
//                  below the grass round a pond with a wall)
//   flown          the flight was flown over the ground itself (real
//                  ground: a hole from a map or on hills), its heights
//                  above the ground under each point; otherwise over flat
//                  ground (a made-up hole), and drawn rising evenly from
//                  where it was hit to where it lands (pathLifts) - not
//                  sinking over a walled pond's water and bed and jumping
//                  back up at its far bank (the owner: "a flight path that
//                  went a bit funny then as I was going over a pond and a
//                  brick wall"), nor bumping over every rise.
// Either way never under what's drawn there: a ball meeting a pond meets
// the top of its water.
export function drawnPath(path, flightPoints, { ground, surface = ground, flown = false }) {
  const lifts = flown ? path.map((p) => ground(p[0], p[2])) : pathLifts(path, flightPoints, surface);
  return path.map((p, i) => [p[0], Math.max(p[1] + lifts[i], surface(p[0], p[2])), p[2], p[3]]);
}

// The height of a drawn path (drawnPath) `k` of the way from point `i` to
// the next.
export function drawnHeight(drawn, i, k) {
  const a = drawn[i];
  const b = drawn[Math.min(i + 1, drawn.length - 1)];
  return a[1] + (b[1] - a[1]) * k;
}
