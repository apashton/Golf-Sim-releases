// Mulligans (the owner, 16 October 2026: "Also need a way to have a
// mulligan if something like that was to happen, or it was a really bad
// misread. But mulligan should be an option that you can switch on and off,
// certainly not in an online play"): the last stroke taken back - the ball
// where it was, the stroke not counted, the round as it was before it - to
// be played again. Only with Mulligans on (the course's Options), never
// online, not in a scramble (the team's ball), and only until the next
// stroke is played or the next hole comes. Pure: what's kept before each
// stroke, what a mulligan puts back, and whether one can be taken now
// (course/mulligan.js does it).

// What a mulligan can't be taken for, and what it says: null when it can.
//   on        the course's Mulligans setting
//   online    an online game (no mulligans there, ever)
//   scramble  a scramble's round
//   ladder    a match ladder's match (course/matchladder.js)
//   kept      what was kept before the last stroke (null: no stroke yet,
//             or already taken back)
//   sameHole  that stroke was on the hole being played
export function mulliganRefusal({ on, online, scramble, ladder, kept, sameHole }) {
  if (online) return "No mulligans in online play";
  if (ladder) return "No mulligans in a ladder match";
  if (!on) return "Mulligans are off - turn them on in the course's Options";
  if (scramble) return "No mulligans in a scramble";
  if (!kept) return "No shot to take back";
  if (!sameHole) return "Too late for a mulligan - that hole's over";
  return null;
}

// What's kept of the round and the player just before a stroke: enough to
// put it all back as it was. p: the player; r: the round.
export function beforeStroke(p, r) {
  return {
    hole: r.index,
    turn: r.turn,
    round: { message: r.message ?? "", pending: !!r.pending, done: !!r.done, waiting: !!r.waiting },
    player: {
      strokes: p.strokes,
      ball: [...p.ball],
      lie: p.lie,
      plug: p.plug ?? null,
      stance: p.stance ?? null,
      aim: p.aim,
      club: p.club,
      lieAfter: p.lieAfter ?? "",
      last: p.last ?? null,
      from: p.from ?? null,
      recordedId: p.recordedId ?? null,
      puttFeedback: p.puttFeedback ?? null,
      done: !!p.done,
      score: p.scores?.[r.index],
      shots: p.shots?.length ?? 0,
      log: p.log?.length ?? 0,
    },
  };
}

// Puts the round and the player back as they were before the stroke kept:
// the ball, the strokes, the hole not finished if it finished it, its
// positions and the round card's line for it gone. Counts the mulligan.
export function takeBack(p, r, kept) {
  const k = kept.player;
  p.strokes = k.strokes;
  p.ball = [...k.ball];
  p.lie = k.lie;
  p.plug = k.plug;
  p.stance = k.stance;
  p.aim = k.aim;
  p.club = k.club;
  p.lieAfter = k.lieAfter;
  p.last = k.last;
  p.from = k.from;
  p.recordedId = k.recordedId;
  p.puttFeedback = k.puttFeedback;
  p.done = k.done;
  if (p.scores) {
    if (k.score == null) p.scores[kept.hole] = null;
    else p.scores[kept.hole] = k.score;
  }
  if (p.shots) p.shots.length = Math.min(p.shots.length, k.shots);
  if (p.log) p.log.length = Math.min(p.log.length, k.log);
  p.mulligans = (p.mulligans ?? 0) + 1;
  r.turn = kept.turn;
  r.message = kept.round.message;
  r.pending = kept.round.pending;
  r.done = kept.round.done;
  r.waiting = kept.round.waiting;
  return p;
}

// What the player's told: taken back, how many this round, and how to take
// a misread out of their stats too.
export function mulliganWords(p, { multi = false } = {}) {
  const n = p.mulligans ?? 1;
  const who = multi ? `${p.name}: ` : "";
  return `${who}Mulligan - play it again${n > 1 ? ` (${n} this round)` : ""}. A misread? Delete takes it out of your stats too`;
}
