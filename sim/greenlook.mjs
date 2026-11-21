// The green's layout on screen during a round - its grid and its slopes'
// colours (course/putting.js showGrid, showShade) - and the way to ask for
// it (the owner, 14 November 2026: "still not obvious enough how to show
// colours/grid on screen when near a green, anywhere closer that 40yards
// should have an obvious option to see the green layout. Further out still
// possible. But not show obviously").
//
// Where the ball is, for it (lookZone):
//   on    the green's the next thing read - putting, on the green or with
//         the putter picked off it, or on the fringe with any club. The
//         read's there by itself, made of what the round's settings say
//         (Grid on the greens, Slope shading on the greens).
//   near  a shot with a club from within NEAR_YARDS of the pin. Nothing's
//         drawn until it's asked for - and what's asked for stays for the
//         shots like it after (settings of its own: nearGrid, nearShade).
//   far   further out. Still to be had - Shift + G, for the hole being
//         played - but never offered.
// On and near, two switches sit over the picture, Grid and Colours
// (lookChips): each what it says, there and then. From off the green the
// whole green's drawn in full, not only the line to the hole: it's the
// lie of the green that's being looked at, not a putt's line.
//
// Pure: course/putting.js draws it; test/greenlook.test.mjs.

export const NEAR_YARDS = 40;

// read: the green's being read by itself (course.js greenRead: a putt to
// play - on the green, or the putter picked off it - or the fringe with
// any club); toPin: yards to the pin.
export function lookZone({ read = false, toPin = null } = {}) {
  if (read) return "on";
  return Number.isFinite(toPin) && toPin <= NEAR_YARDS ? "near" : "far";
}

// The settings each switch keeps, by zone.
export const LOOK_KEYS = { on: { grid: "grid", shade: "shade" }, near: { grid: "nearGrid", shade: "nearShade" } };

// What's drawn now: { grid, shade, whole } - whole: the whole green in
// full (from off it), not only the putt's channel.
//   s: the round's settings; far: asked for from far off (Shift + G).
export function greenLook(zone, s = {}, { far = false } = {}) {
  if (zone === "on") return { grid: !!s.grid, shade: !!s.shade, whole: false };
  if (zone === "near") return { grid: !!s.nearGrid, shade: !!s.nearShade, whole: true };
  return { grid: !!far, shade: !!far, whole: true };
}

// The switches over the picture: none from far off.
export function lookChips(zone, s = {}) {
  const keys = LOOK_KEYS[zone];
  if (!keys) return [];
  return [
    { id: "grid", label: "Grid", on: !!s[keys.grid], title: "The grid over the green, with its dots running downhill" },
    { id: "shade", label: "Colours", on: !!s[keys.shade], title: "The green coloured by how steep it is" },
  ];
}

// A switch pressed: the setting it changes ({ key: value }), or null from
// far off.
export function chipPressed(zone, s = {}, id) {
  const key = LOOK_KEYS[zone]?.[id];
  return key ? { [key]: !s[key] } : null;
}

// Shift + G: the green's layout on or off, from wherever the ball is.
// On and near: both switches off if either's on, else both on. From far
// off: for this hole, on or off.
// -> { settings: { key: value } | null, far, on }
export function lookToggled(zone, s = {}, far = false) {
  const keys = LOOK_KEYS[zone];
  if (!keys) return { settings: null, far: !far, on: !far };
  const on = !(s[keys.grid] || s[keys.shade]);
  return { settings: { [keys.grid]: on, [keys.shade]: on }, far, on };
}

// What Shift + G says.
export const lookWords = (zone, on) => (on ? (zone === "far" ? "The green's grid and colours on, for this hole" : "The green's grid and colours on") : "The green's grid and colours off");

// The green's box in the grid's own terms (u across the line from the ball
// to the hole, v back along it - greengrid.js), so a grid asked for from
// off the green is laid only where the green is, however far the ball.
//   ball, toward, green: [x, z] in the grid's world; r: the green's reach.
export function greenBox(ball, toward, green, r) {
  const dx = ball[0] - toward[0];
  const dz = ball[1] - toward[1];
  const len = Math.hypot(dx, dz) || 1;
  const ev = [dx / len, dz / len];
  const eu = [ev[1], -ev[0]];
  const gx = green[0] - ball[0];
  const gz = green[1] - ball[1];
  const u = gx * eu[0] + gz * eu[1];
  const v = gx * ev[0] + gz * ev[1];
  return { x0: u - r, x1: u + r, z0: v - r, z1: v + r };
}
