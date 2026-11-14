// The courses you make kept in your own Google Drive, so they're on every
// PC and browser you turn it on in (the owner, 14 November 2026: "Yeah
// let's build but have that an an option not a default"). Off unless it's
// turned on, device by device; then the device's own courses - the ones
// made in the designer, not the game's and not friends' fetched by a code -
// are kept in step with a folder in the Drive, one file a course.
//
// The rules, pure (sim/coursedrive.mjs does it; sim/drivefiles.mjs talks to
// Drive): what a sync does about each course, from what's here, what's in
// the Drive, and what this device last saw of each.
//   - A course only here is sent; one only in the Drive is fetched.
//   - Changed here since they were last in step: sent. Changed there:
//     fetched. Changed in both: the newer one wins (its own saved time).
//   - Deleted here: its file in the Drive binned (it's in Drive's bin for
//     30 days). Deleted there: deleted here - once Drive itself says the
//     file's gone, never because a list came back short.
//   - An edit beats a delete: a course deleted on one device and changed on
//     another since stays, and comes back to the first.

import { COURSE_ID } from "./coursekeep.mjs";

// The folder in the Drive, inside "A² Golf" (where each player's stats
// folder is: sim/drivesync.mjs FOLDER).
export const COURSES_FOLDER = "A² Golf courses";
export const COURSE_MIME = "application/json";
// A course's file there, and the course a file's name says.
export const courseFile = (id) => `${id}.json`;
export function readCourseFile(name) {
  const m = /^(.+)\.json$/.exec(String(name ?? ""));
  return m && COURSE_ID.test(m[1]) ? m[1] : null;
}

// A course that's the device's own to keep there: made in the designer (or
// a real one from the map) - not one that comes with the game, nor a
// friend's (that's theirs; its code fetches it again).
export const ownCourse = (c) => !!c && COURSE_ID.test(c.id ?? "") && (c.origin === "made" || c.origin === "real") && !c.builtIn;

// What to do about each course:
//   local   [{ id, updated }]        the device's own courses
//   remote  [{ id, fileId, md5 }]    the files in the Drive's folder
//   kept    { id: { fileId, local, remote } }   what was in step last time:
//           the file, the course's saved time here, the file's version there
// -> [{ id, what, fileId? }], what one of:
//   "up"         send it (a new file, or its file replaced)
//   "down"       fetch it
//   "meet"       here and there, never seen together: read theirs; the same
//                course is left, else the newer wins
//   "both"       changed in both since: read theirs; the newer wins
//   "dropHere"   deleted there: delete it here (once the file's seen gone)
//   "dropThere"  deleted here: bin its file
//   "forget"     gone from both: nothing kept about it
export function planSync(local = [], remote = [], kept = {}) {
  const here = new Map(local.map((c) => [c.id, c]));
  const there = new Map();
  // (Two files of one name - made on two devices before either saw the
  // other: the first listed stands; the other's left where it is.)
  for (const f of remote) if (f?.id && !there.has(f.id)) there.set(f.id, f);
  const out = [];
  for (const id of new Set([...here.keys(), ...there.keys(), ...Object.keys(kept ?? {})])) {
    const l = here.get(id) ?? null;
    const r = there.get(id) ?? null;
    const k = kept?.[id] ?? null;
    const changedHere = !!l && !!k && l.updated !== k.local;
    const changedThere = !!r && !!k && (r.md5 !== k.remote || r.fileId !== k.fileId);
    if (l && r) {
      if (!k) out.push({ id, what: "meet", fileId: r.fileId });
      else if (changedHere && changedThere) out.push({ id, what: "both", fileId: r.fileId });
      else if (changedHere) out.push({ id, what: "up", fileId: r.fileId });
      else if (changedThere) out.push({ id, what: "down", fileId: r.fileId });
    } else if (l) {
      if (!k || changedHere) out.push({ id, what: "up", fileId: null });
      else out.push({ id, what: "dropHere", fileId: k.fileId });
    } else if (r) {
      if (!k || changedThere) out.push({ id, what: "down", fileId: r.fileId });
      else out.push({ id, what: "dropThere", fileId: r.fileId });
    } else out.push({ id, what: "forget" });
  }
  return out;
}

// Which of two copies of a course is the newer, by when each was saved:
// "here", "there" or "same". (Saved at the same moment, or one with no
// time: theirs - it's the one every other device already has.)
export function newerCopy(hereUpdated, thereUpdated) {
  if (hereUpdated && hereUpdated === thereUpdated) return "same";
  const a = Date.parse(hereUpdated ?? "");
  const b = Date.parse(thereUpdated ?? "");
  return Number.isFinite(a) && (!Number.isFinite(b) || a > b) ? "here" : "there";
}

// How often it's done by itself (the PC: its server knows when a course is
// saved, and has the sign-in to do it unasked).
export const COURSE_SYNC = Object.freeze({ first: 30_000, every: 15 * 60_000, afterChange: 20_000 });

// What a sync did, in words: "2 sent, 1 fetched, 1 deleted" - or "all in step".
export function syncWords(done = {}) {
  const parts = [];
  if (done.up) parts.push(`${done.up} sent`);
  if (done.down) parts.push(`${done.down} fetched`);
  if (done.dropped) parts.push(`${done.dropped} deleted here`);
  if (done.binned) parts.push(`${done.binned} deleted there`);
  return parts.length ? parts.join(", ") : "all in step";
}

// Why it couldn't, in words (sim/drivefiles.mjs throws { error }).
export function syncTrouble(err) {
  const e = String(err?.error ?? err?.message ?? err ?? "");
  if (e === "offline") return "Couldn't reach Google - check the internet and try again";
  if (e === "signin" || e === "invalid_grant") return "Google needs you to sign in again";
  if (e === "http 403") return "Google wouldn't let A² Golf at its folder - turn it on again and allow Drive";
  return `Google said: ${e || "no answer"}`;
}
