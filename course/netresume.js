// Online play on a course: this bay's own players picked back up where the
// game has them when the page (or the app) started again part way through
// a round (sim/netresume.mjs) - on the hole everyone's on, their scores so
// far, each ball where it lies - rather than back on the 1st tee.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

export class CourseNetResume {
  // Each of this bay's players' finished holes, before the round's first
  // hole is shown (startRound).
  resumeScores(resume) {
    const r = this.round;
    if (!resume || !r) return;
    for (const p of r.players) {
      if (p.remote) continue;
      (resume.scores?.[p.netId] ?? []).forEach((s, h) => {
        if (s != null) p.scores[h] = s;
      });
    }
  }

  // On the hole being played, once it's shown: each of them where their ball
  // is, their strokes, finished or not - then whose turn it is, or waiting
  // for the others if they've all finished it here (showHole).
  resumeOwn() {
    const r = this.round;
    const res = r?.resume;
    if (!res || r.index !== res.hole) return;
    r.resume = null;
    for (const p of r.players) {
      const at = p.remote ? null : res.at?.[p.netId];
      if (!at) continue;
      p.strokes = at.strokes;
      p.ball = [...at.ball];
      p.lie = at.done ? "cup" : at.lie;
      p.done = !!at.done;
      p.shots = [p.shots?.[0] ?? [...at.ball], [...at.ball]];
    }
    r.turn = this.whoseTurn();
    if (r.players.every((q) => q.remote || q.done)) this.waitForOthers();
  }
}
