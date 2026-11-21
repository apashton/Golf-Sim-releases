// Not drawing the picture while nothing moves (the owner: "stop redrawing
// while nothing moves"): between shots, with the camera still, the same
// picture would be drawn sixty times a second for nothing, keeping the
// graphics card hot and its fans loud. Once nothing has moved for
// STILL.after the picture rests: the last one stays on the screen, the
// scenery's own motion (the flag, the trees in the wind, the water, the
// clouds, the birds) stops with it, and nothing is drawn but a check once a
// second (STILL.check), in case something changed that wasn't seen. It
// starts again the moment anything moves - a shot, the camera, a ball, a
// key or a click - and the scenery carries on from where it stopped.
//
// What counts as moving is the game's (app.js): a ball in the air or
// rolling, the camera, a flyover or a look down the hole, a celebration, a
// friend's shot flying in, the green-reading grid's markers (their speed
// and direction are the read), rain falling, a recording or the game's video.
// Pure: it's told each frame what's going on and says whether to draw.

// Still this long (ms) before the picture rests; while resting, one check
// this often (ms).
export const STILL = { after: 1000, check: 800 };
// The camera counts as still when nothing in its view (its matrices)
// changes by more than this - an easing camera creeps on for ever by
// amounts nobody could see.
export const VIEW_EPS = 1e-4;

// Whether two views differ: arrays of numbers (the camera's matrices), or
// either missing.
export function viewChanged(a, b, eps = VIEW_EPS) {
  if (!a || !b || a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i] - b[i]);
    if (!(d <= eps * Math.max(1, Math.abs(b[i])))) return true;
  }
  return false;
}

export class StillPicture {
  constructor({ after = STILL.after, check = STILL.check } = {}) {
    Object.assign(this, { after, check });
    // Drawing until this time (ms) at least: anything moving keeps it on.
    this.awakeUntil = -Infinity;
    this.lastView = null;
    this.lastDraw = -Infinity;
    // Resting now (not drawing but for the checks).
    this.resting = false;
    // Rest spells so far, and their time (ms), for a report.
    this.spells = 0;
    this.restedMs = 0;
    this.restSince = null;
  }

  // Something happened (a key, a click, a shot coming in): draw for at
  // least `after` from now.
  wake(now) {
    this.awakeUntil = Math.max(this.awakeUntil, now + this.after);
  }

  // Each frame (now: ms): on, the setting ("Pause the picture while
  // nothing moves"); moving: anything moving this frame; view: the camera's
  // numbers. Returns { draw, woke, check }: draw - draw this frame; woke -
  // the first frame drawn after resting (its gap isn't a slow frame);
  // check - a resting frame drawn only to check (the scenery stays still).
  frame(now, { on = true, moving = false, view = null } = {}) {
    const changed = viewChanged(view, this.lastView);
    if (!on || moving || changed) this.wake(now);
    if (now < this.awakeUntil) {
      const woke = this.resting;
      if (woke) this.stopResting(now);
      this.lastView = view ? Array.from(view) : null;
      this.lastDraw = now;
      return { draw: true, woke, check: false };
    }
    if (!this.resting) {
      this.resting = true;
      this.spells++;
      this.restSince = now;
    }
    if (now - this.lastDraw >= this.check) {
      this.lastDraw = now;
      return { draw: true, woke: false, check: true };
    }
    return { draw: false, woke: false, check: false };
  }

  stopResting(now) {
    this.resting = false;
    if (this.restSince !== null) this.restedMs += Math.max(0, now - this.restSince);
    this.restSince = null;
  }

  // For a report: how many rest spells, and the share of the time resting
  // since `since` (ms).
  report(now, since = 0) {
    const resting = this.restedMs + (this.resting && this.restSince !== null ? now - this.restSince : 0);
    const span = Math.max(1, now - since);
    return { spells: this.spells, restingShare: Math.round((resting / span) * 1000) / 1000, resting: this.resting };
  }
}

// The scenery's own clock (seconds): it runs while the picture is drawn
// and stops while it rests, so the flag and the water carry on from where
// they stopped. step(time, running): the animation loop's ms, and whether
// the scenery moves this frame.
export class SceneryClock {
  constructor() {
    this.ms = 0;
    this.last = null;
  }

  step(time, running = true) {
    const last = this.last;
    this.last = time;
    if (running && last !== null && Number.isFinite(time)) this.ms += Math.min(Math.max(0, time - last), 100);
    return this.ms / 1000;
  }

  get seconds() {
    return this.ms / 1000;
  }
}
