// One shot sent twice must never be played twice (the owner, 16 October
// 2026, report #362: "I played one shot, and then it seemed to like move me
// for where that ball may have landed and then shoot again, so it's kind of
// doubled the hit. We just need to avoid that entirely"). The Omni sent the
// same shot message twice, a quarter of a second apart, byte for byte, with
// a heartbeat between - so the check for a message the same as the one just
// before (omnilink.js receive) let it through - and the second flew from
// where the first came down. A repeat is dropped where the
// message comes in (omnilink.js: the same bytes again) and again where the
// shot is handed to the game (server.mjs deliverShot: a launch monitor's
// shot the same as its last, or straight after it), so no launch monitor
// or connector can play one swing twice. Pure, for both and the tests.

// sameWithin: a shot the same as the last one, this long after it, is that
// shot again (no two swings give the same speed, launch, direction and spin
// to the hundredth). gap: nothing a launch monitor sends this soon after its
// last shot is a new swing - the Omni takes a couple of seconds to be ready
// for the next ball.
export const REPEAT_MS = { sameWithin: 30_000, gap: 1500 };

// The sources a repeat is looked for from: the launch monitors. A test shot
// or a mouse swing is asked for each time (and the tests fire them quickly).
const WATCHED = new Set(["omni", "launch monitor"]);

const BALL_KEYS = ["speedMph", "vla", "hla", "totalSpin", "spinAxis"];
export function sameBall(a, b) {
  return !!a && !!b && BALL_KEYS.every((k) => Number.isFinite(a[k]) && a[k] === b[k]);
}

// Why `next` is a repeat of `last` ("same": the same ball again; "soon":
// too soon after it to be another swing), or null for a shot of its own.
// Each { source, at (ms), ball }. rules: REPEAT_MS, or null to look for
// none (the server's tests, which send shots back to back).
export function repeatShot(last, next, rules = REPEAT_MS) {
  if (!rules || !last || !next || !WATCHED.has(next.source) || last.source !== next.source) return null;
  const dt = next.at - last.at;
  if (!Number.isFinite(dt) || dt < 0) return null;
  if (dt <= rules.gap) return "soon";
  if (dt <= rules.sameWithin && sameBall(last.ball, next.ball)) return "same";
  return null;
}

// The Omni's shot message again: the same bytes as its last, within the
// same while. last and next: { hex, at }.
export function repeatOmniMessage(last, next) {
  if (!last?.hex || !next?.hex || last.hex !== next.hex) return false;
  const dt = next.at - last.at;
  return Number.isFinite(dt) && dt >= 0 && dt <= REPEAT_MS.sameWithin;
}

// What the log says of one dropped.
export function repeatWords(why, seconds) {
  const s = Number.isFinite(seconds) ? `${seconds.toFixed(2)} s` : "moments";
  return why === "same" ? `the same shot again ${s} after it - not played twice` : `a second shot ${s} after the last - too soon to be another swing, not played`;
}
