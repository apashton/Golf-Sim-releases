// Each player's stats kept in their own Google Drive, the true copy (the
// owner, 10 November 2026: "Can we have a way to save stats to Google
// drive? And that be the true source that if offline is updated
// afterwards"; docs/STATS-CLOUD-PLAN.md). The rules, pure:
//
//   - A folder "A² Golf" in the player's Drive, a folder per player in it,
//     and in that a file per device per month: "2026-11.pc-7f3a.jsonl".
//     A device only ever writes its own files, so two can never overwrite
//     each other (Drive has no "add to the end": a file's replaced whole,
//     and a month of one device's lines keeps that small).
//   - The lines are the stats file's own (server/stats.mjs), unchanged: a
//     shot, a game, and the lines that change one (a club put right, a
//     strike said, a note...), each with its time and its shot's id.
//   - A device's own lines are those it wrote; lines it took from another
//     device's files are kept in its stats file too, marked with that
//     device (dv), and never sent on.
//   - Taking another device's lines: a shot or game once (by its id); a
//     line that sets something - a club answer, a strike said, a power, club
//     data, skill points, a day or session left out - only when it's newer
//     than what's set here already, so every device ends up with the latest
//     whichever order the lines arrive in; a note or an unplayable ball
//     once each.
// server/drivesync.mjs does the sending and fetching.

export const FOLDER = "A² Golf";
export const FOLDER_MIME = "application/vnd.google-apps.folder";
// In step this often while the game's running, soon after it starts, and a
// minute after a shot (a few shots together).
export const SYNC_EVERY_MS = 5 * 60000;
export const FIRST_SYNC_MS = 15000;
export const AFTER_SHOT_MS = 60000;

// The month a line belongs to (UTC, so every device agrees).
export const monthOf = (t) => new Date(Number(t)).toISOString().slice(0, 7);
export const monthFile = (month, device) => `${month}.${device}.jsonl`;
const MONTH_FILE = /^(\d{4}-\d{2})\.([a-z]{2,8}-[a-z0-9]{4,16})\.jsonl$/;
// { month, device } from a file's name, or null for anything else.
export function readMonthFile(name) {
  const m = MONTH_FILE.exec(String(name ?? ""));
  return m ? { month: m[1], device: m[2] } : null;
}
// This device's id: its kind and some random letters, made once.
export function newDevice(kind = "pc", random = Math.random) {
  let s = "";
  while (s.length < 8) s += Math.floor(random() * 36).toString(36);
  return `${kind}-${s}`;
}

// A player's folder once they've started again: the old one kept, renamed.
export const archivedName = (name, t) => `${name} (before ${new Date(t).toISOString().slice(0, 10)})`;

// How a line is taken from another device: { how: "once" | "newest", key }.
export function lineKind(o) {
  if (!o || typeof o !== "object") return null;
  if (o.id && o.r) return { how: "once", key: `shot:${o.id}` };
  if (o.game) return { how: "once", key: `game:${o.t}:${o.game.kind ?? ""}:${o.game.id ?? o.game.key ?? ""}` };
  if (o.fix) return { how: "newest", key: `fix:${o.fix}` };
  if (o.mark) return { how: "newest", key: `mark:${o.mark}` };
  if (o.pow) return { how: "newest", key: `pow:${o.pow}` };
  if (o.kd) return { how: "newest", key: `kd:${o.kd}` };
  if (o.sk) return { how: "newest", key: "sk" };
  if (typeof o.day === "string") return { how: "newest", key: `day:${o.day}:${"out" in o ? "out" : "x"}` };
  if (typeof o.ses === "string") return { how: "newest", key: `ses:${o.ses}:${"out" in o ? "out" : "x"}` };
  if (o.note) return { how: "once", key: `note:${o.note}:${o.t}:${o.drop ? 1 : 0}` };
  if (o.unp) return { how: "once", key: `unp:${o.unp}:${o.t}` };
  return { how: "once", key: `line:${JSON.stringify(o)}` };
}

// What a stats file has, for taking another device's lines: { seen: keys
// of "once" lines, last: key -> newest time of "newest" lines }.
export const newIndex = () => ({ seen: new Set(), last: new Map() });
export function noteLine(index, o) {
  const k = lineKind(o);
  if (!k) return;
  if (k.how === "once") index.seen.add(k.key);
  else {
    const t = Number(o.t);
    if (Number.isFinite(t) && !(index.last.get(k.key) >= t)) index.last.set(k.key, t);
  }
}
// Whether another device's line is wanted here.
export function wanted(index, o) {
  const k = lineKind(o);
  if (!k) return false;
  if (k.how === "once") return !index.seen.has(k.key);
  const t = Number(o.t);
  if (!Number.isFinite(t)) return false;
  const have = index.last.get(k.key);
  return have == null || t > have;
}

// A device's own lines from part of its stats file: complete lines only
// (one cut short is left for next time), those without another device's
// mark. -> { lines: [{ month, text }], used: characters read }.
export function ownLines(text) {
  const end = text.lastIndexOf("\n");
  if (end < 0) return { lines: [], used: 0 };
  const lines = [];
  let lastT = null;
  for (const line of text.slice(0, end).split("\n")) {
    if (!line.trim()) continue;
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      continue;
    }
    if (!o || typeof o !== "object") continue;
    if (Number.isFinite(Number(o.t))) lastT = Number(o.t);
    if (o.dv) continue;
    if (lastT == null) continue;
    lines.push({ month: monthOf(lastT), text: JSON.stringify(o) });
  }
  return { lines, used: end + 1 };
}

// Another device's month file: its lines, each with that device's mark.
export function theirLines(text, device) {
  const out = [];
  for (const line of String(text ?? "").split("\n")) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line);
      if (o && typeof o === "object" && !o.dv) out.push({ ...o, dv: device });
    } catch {
      // A line cut short: the rest still count.
    }
  }
  return out;
}

// A Drive query's quoted name.
export const quoted = (s) => `'${String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

// What My stats says about it.
export function driveWords(v, { now = Date.now() } = {}) {
  if (!v) return "";
  if (v.paused) return v.paused;
  if (v.busy) return v.busy;
  const ago = (t) => {
    const m = Math.round((now - t) / 60000);
    return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
  };
  const when = v.at ? `in step ${ago(v.at)}` : "not in step yet";
  const waiting = v.waiting ? " - some shots still to send" : "";
  const trouble = v.error ? ` (last try: ${v.error})` : "";
  return `Stats in Drive: ${when}${waiting}${trouble}`;
}
