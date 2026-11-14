// The phone draws at most PHONE_FPS frames a second (app.js, in the app's
// page): many phones' screens run at 90 or 120 Hz, and the animation loop
// comes once a refresh, so while anything moved a phone drew every one of
// them - twice the graphics card's work, heat and battery of 60 for a
// picture no smoother to see on a six-inch screen. (The safety valve aims
// at 60 at most anyway: sim/refresh.mjs TOP_TARGET.)
//
// A frame's drawn once its time has come: 1000 / fps after the last one,
// less SLACK, the time over carried on - so a 120 Hz screen draws every
// other refresh, and a 90 Hz one two of each three: 60 a second either
// way. A 60 Hz screen (or slower) draws every frame, as before. Pure.

export const PHONE_FPS = 60;
// How early a frame may come and still be drawn, ms: a refresh's timestamp
// wanders a little either side of its interval.
const SLACK = 2;

export class FrameCap {
  constructor(fps = PHONE_FPS) {
    this.interval = 1000 / fps;
    this.last = null;
    this.carry = 0;
  }

  // Whether the frame at `time` (the animation loop's, ms) is to be drawn.
  // Marks it drawn if so.
  due(time) {
    if (this.last === null || !(time > this.last)) return this.mark(time, 0);
    const since = time - this.last + this.carry;
    if (since < this.interval - SLACK) return false;
    // (A long gap - the picture rested, or the page was slow - carries
    // nothing on: the next frame's timed from this one.)
    return this.mark(time, since < 2 * this.interval ? Math.max(0, since - this.interval) : 0);
  }

  mark(time, carry) {
    this.last = time;
    this.carry = carry;
    return true;
  }
}
