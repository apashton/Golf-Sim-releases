// What each shot was hit as against what it played like and did in the
// game, and the shot at hand's read before it's struck - for the
// recording's numbers and words and the command centre's boxes
// (sim/shotreading.mjs; app.js onReading, info).
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import { distanceToPin, riseToPin } from "../sim/courseplay.mjs";
import { shotGuide } from "../sim/swingguide.mjs";
import { holeBearing } from "../sim/weather.mjs";
import { YARD } from "../sim/flight.mjs";
import { puttReading, puttDone, fullReading, fullDone, aimedAt } from "../sim/shotreading.mjs";
import { puttLine } from "../puttline.js";

export class CourseReading {
  // A putt being played now (app.js info: the recording's putting scene) -
  // the ball on the green, or the putter picked off it, with a shot to
  // play there.
  puttingNow() {
    const r = this.round;
    return !!r?.hole && !r.finished && !r.done && !!this.me && !this.me.done && this.putting;
  }

  // The shot at hand before it's struck, or null (no round going, the
  // hole over, a ball in the air): on the green its putt - how far, up or
  // down once its figures are in, what it plays like with that help on
  // (puttline.js), the ideal line's aim where it's showing; off it the
  // flag's distance and what it plays like, where it's played at
  // (flagFigures).
  shotRead() {
    const r = this.round;
    const p = this.me;
    if (!r?.hole || r.finished || r.done || !p?.ball || p.done || this.flying) return null;
    if (this.putting) {
      const g = this.puttGuide;
      if (!g) return null;
      return puttReading({ distance: g.cg.distance, stimp: this.hole.green.stimp, fig: g.fig, aim: this.idealShowing ? g.ideal.aim : null, before: true, showNeeded: puttLine.playsLike });
    }
    return fullReading({ ...this.flagFigures(p.ball, p.aim, p.lie, p.club), before: true });
  }

  // The flag from a ball, yards: how far, how much higher, and what it
  // plays like as the swing pad has it (sim/swingguide.mjs playYards: the
  // wind, the air, up or down, the lie) - null where it isn't played at
  // (a lay-up, a drive down a long hole: sim/shotreading.mjs aimedAt).
  // Kept until the ball, aim, club, lie or hole moves.
  flagFigures(ball, aim, lie, club) {
    const r = this.round;
    const key = [r.id, r.index, ball[0], ball[1], aim, lie, club].join();
    if (this.flagKept?.key === key) return this.flagKept.figures;
    const toPin = distanceToPin(r.hole, ball) / YARD;
    const rise = riseToPin(r.hole, ball) / YARD;
    const w = r.weather;
    const guide = shotGuide({ flagYards: toPin, riseYards: rise, lie, club, wind: w?.wind ?? null, bearing: holeBearing(r.hole) + (aim * 180) / Math.PI, temperatureC: w?.temperatureC ?? 20 });
    const plays = guide?.playYards ?? null;
    const figures = { toPin, rise, plays: aimedAt(plays, club) ? plays : null };
    this.flagKept = { key, figures };
    return figures;
  }

  // A shot as it's struck (course.js onShot): a putt's hit as and what it
  // needed (its feedback, sim/puttguide.mjs), how long it rolls, and the
  // ideal line's aim if that's shown after a putt; a full shot's flag and
  // what it plays like. Kept with the shot for when it's down.
  readingStruck(shot, entry) {
    const g = this.puttGuide;
    if (shot.putt && g) {
      shot.reading = puttReading({
        distance: g.cg.distance,
        stimp: this.hole.green.stimp,
        feedback: shot.feedback,
        fig: g.fig,
        aim: puttLine.level !== "off" && g.ideal?.ok ? g.ideal.aim : null,
        speedMph: entry.ball?.speedMph,
        rollSeconds: shot.result.path.at(-1)?.[3],
      });
    } else if (!shot.putt) shot.reading = fullReading(this.flagFigures(shot.from, shot.aim, shot.lie, shot.club));
    else return;
    this.onReading?.({ factsKey: entry.factsKey, ...shot.reading });
  }

  // The shot once it's down (course.js record): where it finished against
  // the flag - holed, or how far, along the line (long, past it +) and
  // across it (side, right +), yards.
  shotReadingDone(shot, { holed, finish, long, side }) {
    if (!shot.reading) return;
    shot.reading = shot.putt ? puttDone(shot.reading, { holed, long: long * 3, right: side * 3 }) : fullDone(shot.reading, { holed, away: finish, long, right: side });
    this.onReading?.({ factsKey: shot.entry?.factsKey, ...shot.reading });
  }
}
