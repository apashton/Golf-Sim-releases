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
//
// What kept it drawing is kept too, by the time each thing held it (the
// owner's PC, 16 - 21 November 2026: every report said "resting 0% of the
// time" - 268,294 frames in 76 minutes - and nothing said why): the game
// names what's moving (app.js movingWhy), a wake says what woke it, and a
// report carries the most of them (awakeWords).

// Still this long (ms) before the picture rests; while resting, one check
// this often (ms).
export const STILL = { after: 1000, check: 800 };
// The camera counts as still when nothing in its view (its matrices)
// changes by more than this - an easing camera creeps on for ever by
// amounts nobody could see.
export const VIEW_EPS = 1e-4;
// A gap between frames longer than this (ms) isn't time kept drawing (the
// window hidden, the page held): not counted for what kept it awake.
export const AWAKE_GAP = 250;
// What's said when the game didn't say.
export const AWAKE = { moving: "something moving", camera: "the camera moving", woken: "a key, a click or a control" };

// What the recording's picture is in use for (compositor.js users), in
// words: it's drawn all the time while it is, so the game's picture never
// rests.
export const RECORDING_USES = [
  ["record", "a recording being made"],
  ["mirror", "a Game screen box showing the recording's picture"],
  ["monitor", "the recording's picture shown on the game window"],
  ["preview", "the Recording panel's preview"],
];
export function recordingWhy(users) {
  const has = new Set(users ?? []);
  return RECORDING_USES.find(([k]) => has.has(k))?.[1] ?? "the recording's picture in use";
}

// "kept drawing by a recording being made 96%, the camera moving 3%": the
// most of what a report's still facts hold (awake: [[what, share of the
// time]]), or "" for none.
export function awakeWords(awake, most = 3) {
  const list = (Array.isArray(awake) ? awake : []).filter((a) => Array.isArray(a) && a[0] && a[1] > 0).slice(0, most);
  if (!list.length) return "";
  return `kept drawing by ${list.map(([what, share]) => `${what} ${Math.round(share * 100)}%`).join(", ")}`;
}

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
    // What kept it drawing: what -> ms, and what holds it now (the last
    // thing that moved or woke it, through the `after` that follows).
    this.awake = new Map();
    this.heldBy = null;
    this.lastFrame = null;
  }

  // Something happened (a key, a click, a shot coming in): draw for at
  // least `after` from now. why: what it was, in words, for a report.
  wake(now, why = null) {
    this.awakeUntil = Math.max(this.awakeUntil, now + this.after);
    this.heldBy = typeof why === "string" && why ? why : AWAKE.woken;
  }

  // Each frame (now: ms): on, the setting ("Pause the picture while
  // nothing moves"); moving: anything moving this frame; view: the camera's
  // numbers. Returns { draw, woke, check }: draw - draw this frame; woke -
  // the first frame drawn after resting (its gap isn't a slow frame);
  // check - a resting frame drawn only to check (the scenery stays still).
  // why: what's moving, in words (for a report: what kept it drawing).
  frame(now, { on = true, moving = false, view = null, why = null } = {}) {
    const changed = viewChanged(view, this.lastView);
    const dt = this.lastFrame === null ? 0 : now - this.lastFrame;
    this.lastFrame = now;
    if (!on || moving || changed) {
      this.awakeUntil = Math.max(this.awakeUntil, now + this.after);
      if (moving) this.heldBy = (typeof why === "string" && why) || AWAKE.moving;
      else if (changed) this.heldBy = AWAKE.camera;
    }
    if (now < this.awakeUntil) {
      // (With the setting off it's drawn whatever happens: nothing kept it.)
      if (on && dt > 0 && dt <= AWAKE_GAP) {
        const what = this.heldBy ?? AWAKE.camera;
        this.awake.set(what, (this.awake.get(what) ?? 0) + dt);
      }
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

  // For a report: how many rest spells, the share of the time resting
  // since `since` (ms), and what kept it drawing the rest - awake: [[what,
  // share of the time]], the most first, those of half a percent and over.
  report(now, since = 0) {
    const resting = this.restedMs + (this.resting && this.restSince !== null ? now - this.restSince : 0);
    const span = Math.max(1, now - since);
    const awake = [...this.awake]
      .map(([what, ms]) => [what, Math.round((ms / span) * 1000) / 1000])
      .filter(([, share]) => share >= 0.005)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    return { spells: this.spells, restingShare: Math.round((resting / span) * 1000) / 1000, resting: this.resting, awake };
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
