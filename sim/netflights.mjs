// Online (course.js): when the other bays' shots fly in here. A friend's
// shot comes once it has landed at their own bay (that bay's settle sends
// it), and then flies here in their colour. How they come is the course
// setting Friends' shots:
//   together  (the first) the ones waiting fly in at the same time, once
//             nothing of this bay's own is in the air - after a moment's
//             wait for any friend still to play this hole who isn't in yet,
//             so tee shots struck at once on three bays come in at once
//   landed    each flies in the moment it arrives, even with this bay's own
//             ball still in the air
//   after     "after your shot" (the owner: "delay viewing other people's
//             shots until after your shot"): held while a player here is
//             about to swing, and flown in together once their ball has
//             landed; with nobody here to hit (waiting on the others), as
//             together
// Either way a player's next shot waits for their last to land, and one
// with more of theirs behind it flies at double speed to catch up.
// Pure.

export const FRIENDS_SHOTS = ["together", "landed", "after"];
export const FRIENDS_SHOTS_NAMES = { together: "Together", landed: "As each lands", after: "After your shot" };
// The longest the waiting ones are held for a friend still to play.
export const GATHER_SECONDS = 2;

export const friendsShots = (v) => (FRIENDS_SHOTS.includes(v) ? v : FRIENDS_SHOTS[0]);

// Which of the waiting flights start now: their indexes in `waiting`.
//   mode       friends' shots (FRIENDS_SHOTS)
//   waiting    [{ pid }], oldest first
//   flying     [{ pid }], in the air here now
//   ownFlying  this bay's own ball in the air
//   due        how many other bays' players are still to play the hole
//              with nothing of theirs waiting or in the air
//   gathered   seconds the waiting ones have been held for them so far
//   toHit      a player here is about to swing (ball at rest, their turn)
// A waiting one with `released` came in while this bay's ball was in the
// air, or was waiting when this bay hit: "after your shot" lets it in
// once that ball is down, whoever is to hit next here.
//   watch      the player watched here (pid, sim/netwatch.mjs): theirs
//              flies at once, whatever the setting, with none of theirs in
//              the air and this bay's own ball down
export function startNow({ mode = "together", waiting = [], flying = [], ownFlying = false, due = 0, gathered = 0, toHit = false, watch = null } = {}) {
  const now = startPlain({ mode, waiting, flying, ownFlying, due, gathered, toHit });
  if (watch == null || ownFlying || flying.some((f) => f.pid === watch)) return now;
  const i = waiting.findIndex((w) => w.pid === watch);
  return i < 0 || now.includes(i) ? now : [...now, i].sort((a, b) => a - b);
}
function startPlain({ mode, waiting, flying, ownFlying, due, gathered, toHit }) {
  const m = friendsShots(mode);
  if (m === "after") {
    if (ownFlying) return [];
    if (toHit) waiting = waiting.map((w) => (w.released ? w : { ...w, held: true }));
  }
  // Each player's oldest waiting shot, unless one of theirs is still in the air.
  const busy = new Set(flying.map((f) => f.pid));
  const next = [];
  waiting.forEach((w, i) => {
    if (w.held || busy.has(w.pid)) return;
    busy.add(w.pid);
    next.push(i);
  });
  if (!next.length || m === "landed") return next;
  if (ownFlying) return [];
  // Some already in the air: these join them.
  if (flying.length) return next;
  return due > 0 && gathered < GATHER_SECONDS ? [] : next;
}

// How fast a shot flies here: double with more of the same player's
// waiting behind it, so they don't fall further behind.
export function flightSpeed(pid, waiting = []) {
  return waiting.some((w) => w.pid === pid) ? 2 : 1;
}

// What's said as shots that flew in together have all landed: one
// player's own words ("Sam: On the green - 14 ft"), or for several just
// where each finished ("Sam: Fairway · Jo: Rough · Kit: Bunker").
// landed: [{ name, text }] in the order they landed.
export function landedWords(landed = []) {
  const said = landed.filter((l) => l?.name && l?.text);
  if (!said.length) return null;
  if (said.length === 1) return `${said[0].name}: ${said[0].text}`;
  return said.map((l) => `${l.name}: ${String(l.text).split(" - ")[0]}`).join(" · ");
}
