// Playing without a launch monitor: a swing with the mouse (or a finger, or
// a trackpad) instead. For trying the game out, and for friends who don't
// have a launch monitor or don't really play golf.
//
// Press on the swing pad, pull back (down) - the further, the harder, with a
// line marking "just right" for this shot - then push up through where you
// pressed: that's the strike. Straight up and down hits it straight; across
// the line to one side starts it that way, and a slanted push curves it.
//
// "Just right" is the shot A-Squared Golf would pick here (the same one its
// test shot plays, without the test shot's made-up wobble): the club's full
// swing on the range, the shot that reaches the target on the course, the
// putt that reaches the hole on the green. The swing only changes how well
// it's struck - how hard, which way it starts and how it curves.
//
// Pure: public/mouseswing.js is the pad, this is the maths (tested in
// test/mouseswing.test.mjs).

// The launch monitor's name each made-up swing's shot carries (Open
// Connect's DeviceID): the mouse on the swing pad, and a game controller's
// stick (sim/gamepad.mjs). Neither is anybody's real strike: always kept as
// experimental, out of every stat, tip and club check (CLAUDE.md).
export const SWING_DEVICES = { mouse: "Mouse swing", controller: "Controller swing" };
export const madeUpSwing = (deviceId) => Object.values(SWING_DEVICES).includes(deviceId);
// A test shot's (app.js testShot): the shot the game would play, near
// perfect. Players no longer have one (the owner, 30 October 2026: "The
// test shots can be removed now?"); the tests and browser checks still
// hit them (window.golfsim.testShot). Kept as experimental too, and never
// played online.
export const TEST_SHOT = "Test shot";

// How much the swing's faults matter, by the help chosen.
export const HELP = {
  easy: { label: "Easy - most shots go near where they should", errors: 0.35 },
  normal: { label: "Normal", errors: 1 },
  hard: { label: "Hard - every fault shows", errors: 1.6 },
};
export const HELP_ORDER = ["easy", "normal", "hard"];

// The pull back for "just right", as a share of the pad's full pull.
export const JUST_RIGHT = 0.75;
// The biggest swing (percent): sim/madeshot.mjs MOST, kept here too so the
// stick's reader (gamepad.mjs) and this one need nothing heavier.
export const MOST_PCT = 105;
// Pulled past that it's no bigger a swing, but over the top - the further,
// the worse it goes (sim/madeshot.mjs BEYOND): a little past it is let go
// (a finger overshoots: the owner, 25 October 2026, "overpowering is way
// to easy to do"), from here on it's too far. And the furthest a pull's
// counted.
export const TOO_FAR_PCT = MOST_PCT + 3;
export const PULL_MOST_PCT = 150;
// Let go before coming back up through the ball: the swing as far as it
// was pulled, a tenth shorter (the owner, 26 October 2026: "Letting go
// early penalty is too harsh, maybe 10% (but make it obvious what
// happened)" - it was half or less).
export const LET_GO = 0.1;
// The half-power pad (the owner, 25 October 2026: "Chipping can be very
// hard in touch. The user should be able to pick 50% power max. To give a
// longer line that they can draw to... that allows for 12% power shots to
// be enough of a line rather than 12% of 100%"): its full pull - the gold
// line - is a half swing, so every percent is twice as long a pull; and
// that's the most it gives (no over-swinging, never too far).
export const HALF = 0.5;
// A swing that's barely a nudge isn't a shot (a click, a slip).
const MIN_POWER = 0.05;
// Past "just right" a full swing gains a little and loses control; a putt or
// chip just goes further.
const OVER_GAIN = 0.35;
const OVER_MAX = 1.1;

// What the swing was, from the pointer's path.
// samples: [{ t (ms), x, y (px) }] from the press to the strike (or the
// release). full: the pad's full pull back, in px. scale: what the pad's
// "just right" pull is a share of a full swing (1; HALF on the half-power
// pad, where a pull to the line is 50% and that's the most).
// Returns null if it wasn't a swing, else
//   { power     the pull back: 1 = "just right" (0 to about 1.33), less
//               for a let-go
//     pct       the swing's size: 100 at the line, an overswing past it
//               up to 105 (sim/madeshot.mjs MOST), however far it's pulled
//     pulled    how far it was pulled, the same way (to PULL_MOST_PCT):
//               past TOO_FAR_PCT, over the top
//     start     sideways at the strike, as a share of the full pull (+ right)
//     slant     how the push up leaned (+ to the right), tan of its angle
//     tempoMs   the push up's time, from the top to the strike
//     backMs    the pull back's, from the press to first reaching the top
//     downMs    and the push's, from last leaving the top to the strike
//     struck    whether it came back up through the start (else a release)
//     pushed    how much of the way back up it came (1 when struck) }
export function readSwing(samples, full, { scale = 1 } = {}) {
  if (!Array.isArray(samples) || samples.length < 2 || !(full > 0)) return null;
  const k = scale > 0 && scale < 1 ? scale : 1;
  const most = k < 1 ? 100 * k : MOST_PCT;
  const s0 = samples[0];
  let top = s0;
  for (const s of samples) if (s.y > top.y) top = s;
  const back = (top.y - s0.y) / full;
  if (back < MIN_POWER * JUST_RIGHT) return null;
  // The strike: the first point after the top back level with the start.
  const after = samples.slice(samples.indexOf(top));
  let hit = after.find((s) => s.y <= s0.y);
  const struck = !!hit;
  // Let go before coming back through: struck where it was let go (its
  // line read from there), LET_GO weaker.
  if (!hit) hit = after.at(-1);
  const up = top.y - hit.y;
  const pushed = struck ? 1 : Math.max(0, up / (top.y - s0.y));
  // The rhythm: the top first reached, and last left (a pause there is
  // neither the pull nor the push).
  const reached = samples.find((s) => s.y >= top.y - full * 0.02) ?? top;
  const left = samples.slice(0, samples.indexOf(hit) + 1).findLast((s) => s.y >= top.y - full * 0.03) ?? top;
  const size = (back / JUST_RIGHT) * 100 * k;
  return {
    power: (k < 1 ? Math.min(k, (back / JUST_RIGHT) * k) : back / JUST_RIGHT) * (struck ? 1 : 1 - LET_GO),
    pct: Math.min(most, size),
    pulled: k < 1 ? Math.min(most, size) : Math.min(PULL_MOST_PCT, size),
    start: (hit.x - s0.x) / full,
    slant: up > 1 ? (hit.x - top.x) / up : 0,
    tempoMs: Math.max(0, hit.t - top.t),
    backMs: Math.max(0, reached.t - s0.t),
    downMs: Math.max(0, hit.t - left.t),
    struck,
    pushed,
  };
}

// The shot: the "just right" ball for here, struck as the swing says.
// ideal: { speedMph, vla, hla, totalSpin, spinAxis }. putt: a putt (only
// how hard and which way). help: a HELP key.
// Returns { ball, words } - words say what happened, for the toast.
export function swingShot(ideal, swing, { putt = false, help = "normal" } = {}) {
  const errors = (HELP[help] ?? HELP.normal).errors;
  let p = Math.max(0, swing.power);
  // Over-swinging: a full shot gains only a little, and the faults grow.
  let over = 0;
  if (!putt && p > 1) {
    over = p - 1;
    p = Math.min(OVER_MAX, 1 + over * OVER_GAIN);
  }
  // A slow, steering push up loses some of the strike (not for a putt).
  const slow = !putt && swing.tempoMs > 700 ? Math.max(0.85, 1 - (swing.tempoMs - 700) / 3000) : 1;
  const faults = errors * (1 + over * 3);
  const clamp = (v, n) => Math.max(-n, Math.min(n, v));
  const start = clamp(swing.start * (putt ? 6 : 18) * faults, putt ? 8 : 20);
  const curve = putt ? 0 : clamp((Math.atan(swing.slant) * 180) / Math.PI * 0.9 * faults, 40);
  const speed = ideal.speedMph * p * slow;
  const ball = {
    speedMph: Math.max(0.5, speed),
    vla: putt ? ideal.vla : ideal.vla * (0.85 + 0.15 * Math.min(1, p)),
    hla: ideal.hla + start,
    totalSpin: putt ? 0 : Math.max(0, ideal.totalSpin * Math.min(1.1, p)),
    spinAxis: putt ? 0 : ideal.spinAxis + curve,
  };
  return { ball, words: swingWords(swing, { putt, p, start, curve, slow }) };
}

// "Just right - straight", "A bit short - starts left, curving right".
function swingWords(swing, { putt, p, start, curve, slow }) {
  if (!swing.struck) return `Let go early - ${Math.round(LET_GO * 100)}% shorter`;
  const how = p < 0.8 ? "Short" : p < 0.95 ? "A bit short" : p <= 1.05 ? "Just right" : putt ? "Firm" : p < 1.08 ? "A bit long" : "Over-swung";
  const side = (v, n, l, r) => (Math.abs(v) < n ? "" : v < 0 ? l : r);
  const startWords = side(start, putt ? 1 : 1.5, "starts left", "starts right");
  const curveWords = side(curve, 6, "curving left", "curving right");
  const line = [startWords, curveWords].filter(Boolean).join(", ") || "straight";
  return `${how} - ${line}${slow < 1 ? " (slow through)" : ""}`;
}
