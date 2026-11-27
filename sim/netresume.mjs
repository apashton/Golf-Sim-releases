// Online play on a course: where this bay's round picks up again when its
// game page (or the whole app) starts again part way through - a crash, the
// app closed by mistake - rather than back on the 1st tee with its scores
// gone (the owner's "rejoin mid-round after an app restart"). The host has
// every hole each player has finished and where their ball is on the hole
// being played (sim/netgame.mjs progress), so this bay takes its own
// players' back from that: the hole everyone's on, their scores so far, and
// for each of them still on it, their strokes, ball and lie.

import { holeDone, scoresOf } from "./netgame.mjs";

// { hole, scores: { pid: [score|null per hole] }, at: { pid: { strokes,
// ball, lie, done } | null } } - or null when there's nothing to pick up
// (not a course round, or nothing played yet).
export function resumeAt(g, bay) {
  if (!g?.started || g.ended || (g.round?.mode ?? "course") !== "course") return null;
  const holes = g.round.holes ?? 0;
  if (!holes) return null;
  // The hole being played: the first that not everyone has finished (the
  // others go on together, so nobody's further on).
  let hole = 0;
  while (hole < holes - 1 && holeDone(g, hole)) hole++;
  const own = g.players.filter((p) => p.bay === bay);
  const scores = Object.fromEntries(own.map((p) => [p.id, scoresOf(g, p.id)]));
  const at = Object.fromEntries(
    own.map((p) => {
      const x = g.progress?.[p.id]?.[hole];
      const played = x && (x.done || x.strokes > 0) && Array.isArray(x.ball);
      return [p.id, played ? { strokes: x.strokes, ball: [...x.ball], lie: x.lie ?? "fairway", done: !!x.done } : null];
    }),
  );
  const any = hole > 0 || Object.values(at).some(Boolean) || Object.values(scores).some((s) => s.some((v) => v != null));
  return any ? { hole, scores, at } : null;
}

// "Back in the game - hole 5"
export function resumeWords(r) {
  return r ? `Back in the online game - hole ${r.hole + 1}` : "";
}
