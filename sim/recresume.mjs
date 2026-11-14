// A recording that carries on after the game's page starts again. The
// recorder (public/videorec.js) runs in the game's page, so when the page
// goes - a crash: the Windows app opens it again a second after its
// renderer is gone, or a minute after it stops answering - the file it was
// writing stops there (what had reached the local server is kept). So the
// page remembers that it's recording (a mark, kept again every few
// seconds), and the page that comes back finishes the file that was cut off
// and goes on in the next one, as an hour's file does: the same recording,
// the next part.
//
// Nothing is recorded without being started: a recording the player
// stopped leaves no mark; one cut off by closing or reloading the game on
// purpose (pagehide) is finished then and never started again; nor is one
// whose mark is old (the game closed, and opened again later), nor one of
// the game's own video (it can't carry on from the middle). Pure, for the
// recorder and the tests.

// Where the page keeps the mark (a setting of the page's own, never shown).
export const RESUME_KEY = "recordingNow";
// How often the mark is kept again while recording.
export const BEAT_MS = 5000;
// A mark older than this is from a game that was closed, not one that's
// just come back: nothing carries on.
export const RESUME_WITHIN_MS = 5 * 60_000;

// What the page keeps while recording: the server's file (session), the
// recording it belongs to (rec) and which file of it (part), what it's of
// (what, scene), whether it's the game's own video (reel), when the
// recording began (startedWall, ms) and when the mark was kept (beat).
// closed: the page was closed or reloaded on purpose (its file finished
// then).
export function recordingMark({ session, rec, part = 1, what = "scene", scene = null, reel = false, startedWall = null, at = Date.now(), closed = false }) {
  return { session, rec: rec ?? session, part, what, scene, reel: !!reel, startedWall, beat: at, closed: !!closed };
}

// What the page that's just started does with a mark:
//   { act: "none" }                      nothing (no mark, an old one)
//   { act: "finish", session, quiet }    finish the file that was cut off,
//                                        and record no more (quiet: it was
//                                        closed on purpose - nothing said)
//   { act: "resume", session, carry: { rec, part, startedWall }, what,
//     scene, gapSeconds }                finish it, and carry on in the
//                                        next file
export function resumePlan(mark, now = Date.now()) {
  if (!mark || typeof mark !== "object" || typeof mark.session !== "string" || !mark.session) return { act: "none" };
  const age = now - Number(mark.beat);
  if (!(age >= 0) || age > RESUME_WITHIN_MS) return { act: "none" };
  const session = mark.session;
  if (mark.closed) return { act: "finish", session, quiet: true };
  // (tour: a mark kept by a version before, for its videos.)
  if (mark.reel || mark.tour) return { act: "finish", session, quiet: false };
  const part = Number.isInteger(mark.part) && mark.part >= 1 ? mark.part : 1;
  const startedWall = Number.isFinite(mark.startedWall) ? mark.startedWall : null;
  return {
    act: "resume",
    session,
    carry: { rec: typeof mark.rec === "string" && mark.rec ? mark.rec : session, part: part + 1, startedWall },
    what: mark.what === "screen" ? "screen" : "scene",
    scene: typeof mark.scene === "string" ? mark.scene : null,
    gapSeconds: Math.round(age / 1000),
  };
}

// What the player's told once the page is back. ok: the recording carried
// on (in part); finished: the cut-off file was saved (false when the local
// server had restarted too - it saved the file itself as it started).
export function resumeSaid(plan, { ok = false, part = null, finished = true } = {}) {
  if (plan.act === "none" || plan.quiet) return null;
  const saved = finished ? "what was recorded is saved" : "what was recorded was saved as A² Golf started";
  if (plan.act === "finish") return `A² Golf restarted while recording its video - ${saved}`;
  if (ok) return `A² Golf restarted while recording - the recording goes on in a new file (part ${part}), about ${Math.max(1, plan.gapSeconds)} s missing`;
  return `A² Golf restarted while recording and the recording stopped - ${saved}. Press Record to carry on`;
}
