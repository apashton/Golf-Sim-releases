// An online match ladder's match while it's being played online (the owner,
// 1 November 2026: "when I cancelled it, I couldn't seem to then start a
// new one"): Host the match / Join the match (app.js ladderNetGame) marks
// this bay's game as that match (course/ladderonline.js pendingNetLadder:
// { code, match, name, course, game }) - its player alone, the ladder's
// rules. game is the online game's own code once it's known (the one
// joined, or the one the relay gave the host). The mark must go the moment
// that game's over or left, or the next ordinary online game would bring
// only the ladder's player and start as the old match.
//
// keepNetLadder(pending, happened) -> the mark kept, or null:
//   { what: "left", game }               this bay's out of an online game (it
//                                        ended, or was left) - its code: the
//                                        mark goes if it's the match's game
//                                        (not one left while setting it up)
//   { what: "started", ladder }          the online round began - kept only
//                                        if it's this very match (its round's
//                                        ladder: { code, match })
//   { what: "finished" }                 the round's over, whatever came of it
//   { what: "closed", open }             the ladder says the match isn't open
//                                        any more (open: false)
// Pure.

export function keepNetLadder(pending, happened = {}) {
  if (!pending) return null;
  const { what } = happened;
  if (what === "left") return pending.game && pending.game === happened.game ? null : pending;
  if (what === "finished") return null;
  if (what === "started") {
    const l = happened.ladder;
    return l && l.code === pending.code && l.match === pending.match ? pending : null;
  }
  if (what === "closed") return happened.open ? pending : null;
  return pending;
}

// The online game a change of this bay's view (netplay.js: { mode, code })
// left - its code - or null: in a game (hosting or a guest) before, and out
// of it now, or in another one.
export function leftGame(before, now) {
  const inGame = (v) => v?.mode === "host" || v?.mode === "guest";
  if (!inGame(before)) return null;
  if (inGame(now) && now.code === before.code) return null;
  return before.code ?? null;
}
