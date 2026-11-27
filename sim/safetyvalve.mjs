// The safety valve: a picture that stays slow sheds detail, one step at a
// time between shots, and gets it back once there's room again - High's
// extras first (so High steps down to Medium), then Medium's, then the
// whole picture drawn at 85% and 70% (sim/graphics.mjs ladder). Pure: it's
// given the frame rate and what's happening, and says when to step down or
// up; look/safety.js keeps the steps and does them.
//
// Each step only switches counts, distances, visibility or the picture's
// size (fewer raindrops, simpler far trees, no grass round the ball, no
// leaf flutter), never a shader or a buffer, so a step can't cause a hitch
// in a recording. The picture's own two steps draw the 3D picture at 85%,
// then 70%, of its pixels and stretch it to fill the window - the biggest
// saving and the least visible, while the words and the hole map over it
// (the page, not the 3D picture) stay sharp (look/renderscale.js). It
// never touches colours, the sky, cloud shadows or scenery. At the last
// step, a picture still slow suggests Standard, as it always has.
//
// Switching back and forth over the same step is a stutter of its own:
// the FLIPS-th switch over one step within FLIP_MS settles it - the valve
// stays on the lower side of that step for the rest of the session (it can
// still go lower if the picture gets slower), and says so (settled).
//
// The owner: "The auto changing graphics mode seems very aggressive. I
// didn't play for 5 mins and it started to claim that medium will be
// better for my pc... Occasionally dipping the fps in this golf game is
// going to be fine." So it only answers a picture that's slow most of the
// time, not a dip: slow time builds up while the frame rate is under
// SLOW_FPS and drains away again at the same rate while it isn't, so a few
// slow seconds as the camera chases a drive, then a minute of good frames,
// leave nothing; it steps down once SLOW_MS has built up. Back up the same
// way over FAST_FPS. (Before: under 45 fps for 5 s running stepped down,
// and 20 s over 58 back up, so an ordinary PC on a 60 Hz screen went down
// and up and down again within minutes and was told to drop a setting.)

// Slow time built up under this frame rate, SLOW_MS of it: a step down.
// (The two frame rates are for a 60 Hz screen: each valve is given its
// screen's own, in proportion - sim/refresh.mjs thresholds, fps.js.)
export const SLOW_FPS = 40;
export const SLOW_MS = 20000;
// Fast time built up over this, FAST_MS of it: a step back up.
export const FAST_FPS = 55;
export const FAST_MS = 30000;
// On the phone (the owner, 1 November 2026: "Graphics in general on mobile
// need to be a bit zippier. The auto change graphics never seems to kick
// in"): Ultra's ladder is long - its own steps, the effects, High's extras
// - and at SLOW_MS a step, taken only between shots, a phone at 30 fps
// spent most of a round slow before the picture had eased a whole setting.
// There it steps down after 8 s of slow time, and back up only after a
// minute of room - a phone's frame rate swings with the view (60 looking
// at the sky, 26 on the green), and a quick way back up only went down
// again.
export const PHONE_VALVE = Object.freeze({ slowMs: 8000, fastMs: 60000 });
// Four switches over the same step in half an hour: going back and forth.
export const FLIPS = 4;
export const FLIP_MS = 30 * 60_000;

export class SafetyValve {
  // steps: how many steps there are to shed.
  constructor(steps = 0, { slowFps = SLOW_FPS, slowMs = SLOW_MS, fastFps = FAST_FPS, fastMs = FAST_MS, flips = FLIPS, flipMs = FLIP_MS } = {}) {
    this.steps = steps;
    this.level = 0;
    Object.assign(this, { slowFps, slowMs, fastFps, fastMs, flips, flipMs });
    this.slow = 0;
    this.fast = 0;
    this.last = null;
    // The fewest steps it may shed: never back up above this (a setting
    // above the highest, or a step it kept switching over).
    this.least = 0;
    // The step it settled on, after going back and forth over it (1 is the
    // first step), or null.
    this.settled = null;
    // When it switched over each step: step -> [times].
    this.switches = new Map();
  }

  // A frame at time (ms) with the frame rate over the last second (fps, or
  // null when there's no measure yet).
  //   play: the game is being played (not loading, not a hidden window, not
  //         a menu over the picture); frames that aren't don't count either way
  //   cut: a camera cut or a new scene this frame, which isn't counted
  //   between: between shots (no ball in the air), when a step may be taken
  // Returns "down", "up" or null; level is how many steps are shed.
  frame(time, fps, { play = true, cut = false, between = true } = {}) {
    const last = this.last;
    this.last = time;
    if (last === null || !Number.isFinite(fps)) return null;
    const dt = Math.min(time - last, 250);
    if (!(dt > 0) || !play || cut) return null;
    // Each builds up while it holds and drains while it doesn't, so a dip
    // between good spells comes to nothing.
    const drain = (x) => Math.max(0, x - dt);
    // (Neither banks more than it takes to step, so a long good spell can't
    // pay for a slow one later, nor the other way round.)
    if (fps < this.slowFps) {
      this.slow = Math.min(this.slow + dt, this.slowMs);
      this.fast = drain(this.fast);
    } else if (fps > this.fastFps) {
      this.fast = Math.min(this.fast + dt, this.fastMs);
      this.slow = drain(this.slow);
    } else {
      this.slow = drain(this.slow);
      this.fast = drain(this.fast);
    }
    if (!between) return null;
    if (this.level < Math.min(this.least, this.steps)) {
      this.level = Math.min(this.least, this.steps);
      return "down";
    }
    if (this.slow >= this.slowMs && this.level < this.steps) {
      this.level++;
      this.slow = 0;
      this.fast = 0;
      this.switched(time, this.level);
      return "down";
    }
    if (this.fast >= this.fastMs && this.level > this.least) {
      this.fast = 0;
      // The switch that would make it back and forth isn't made: it stays
      // on the lower side.
      if (this.switched(time, this.level)) return null;
      this.level--;
      this.slow = 0;
      return "up";
    }
    return null;
  }

  // A switch over `step` at time (ms): true when that's going back and
  // forth (FLIPS within FLIP_MS), which settles it on that step's lower
  // side for good.
  switched(time, step) {
    const times = (this.switches.get(step) ?? []).filter((t) => time - t < this.flipMs);
    times.push(time);
    this.switches.set(step, times);
    if (times.length < this.flips) return false;
    this.least = Math.max(this.least, step);
    this.settled = step;
    return true;
  }

  // Some detail shed.
  get reduced() {
    return this.level > 0;
  }

  // Whether a slow picture may suggest Standard: only once every step is
  // shed (and at once when there are none).
  get spent() {
    return this.level >= this.steps;
  }
}

// ---- The picture's size ----------------------------------------------------------

// The picture's own steps, after the extras: drawn at this share of its
// pixels (each way), in order. 85% is about 72% of the pixels to fill,
// 70% about half.
export const PICTURE_STEPS = [
  { name: "picture at 85%", scale: 0.85 },
  { name: "picture at 70%", scale: 0.7 },
];

// The share the picture is drawn at with `level` steps shed, `extras` of
// them before the picture's own (1 while only extras are shed).
export function pictureScale(level, extras) {
  const n = Math.min(Math.max(0, level - extras), PICTURE_STEPS.length);
  return n ? PICTURE_STEPS[n - 1].scale : 1;
}

// The renderer's pixel ratio for the picture at `scale` of a full-size
// `base` (the screen's own, capped by the setting): rounded, so the same
// scale always gives the same ratio and a resize lands on the same size.
export function scaledPixelRatio(base, scale = 1) {
  const b = Number.isFinite(base) && base > 0 ? base : 1;
  const s = Number.isFinite(scale) && scale > 0 ? Math.min(scale, 1) : 1;
  return Math.round(b * s * 1000) / 1000;
}

// The drawing buffer the renderer makes for a window `width` × `height`
// CSS pixels at `ratio` (as three.js does: rounded down).
export function drawingSize(width, height, ratio) {
  return { width: Math.floor(width * ratio), height: Math.floor(height * ratio) };
}

// "85%": the picture's share, for the readout and the report.
export function scaleText(scale) {
  return `${Math.round((Number(scale) || 1) * 100)}%`;
}
