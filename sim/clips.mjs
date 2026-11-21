// Instant replay's rules (public/replay.js runs them, server/clips.mjs
// keeps the clips): which of a camera's rolling recorders covers a shot,
// when each is restarted, what a clip's file is called, the index tying
// each clip to its shot, and which clips go when the disk allowance is
// used up. Pure, for the page, the server and the tests.
//
// ---- Why overlapping recorders ------------------------------------------------
//
// A replay wants the seconds *before* the Omni reports the shot. The
// browser's MediaRecorder can't cut a window out of one long recording:
// only its first chunk carries the headers, and a later chunk starts
// wherever the encoder happens to be, not on a keyframe, so it can't be
// played by itself. So each camera has two recorders running, started
// about half a cycle apart, and each is restarted (thrown away and begun
// again) every cycle. At any moment one of them has been going for at least
// the pre-roll. When a shot comes, the one that covers it with the least
// to spare is kept going until the post-roll is over, then stopped: its
// whole recording - a keyframe at the start, playable anywhere - is the
// clip, starting a little before the pre-roll asked for. The clip's
// offset says where the asked-for window starts, so playback begins there.
// (coverFor's offset is counted from when the recorder was started;
// replay.js measures it again from the end of the finished file, which is
// when it was stopped, because a busy PC's encoder can drop the first
// second or two.)
//
// The cost: two encoders per camera all the time, and a clip up to a cycle
// longer than asked (8 s by default, a few megabytes). The alternatives
// were worse: WebCodecs with a hand-written MP4 muxer and a ring buffer of
// encoded frames is exact but a lot of code to get wrong; recording
// continuously with a keyframe forced every second or so would still need
// remuxing to cut. Both remain open to phase 2 if the encoders prove too
// dear.


// The clip window: seconds before the shot and after it.
export const CLIP_WINDOW = { preRoll: 3, postRoll: 2 };
export const WINDOW_LIMITS = { min: 0.5, max: 8 };

const clampNum = (v, lo, hi, dflt) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};

export function cleanClipWindow(w) {
  const src = w && typeof w === "object" ? w : {};
  const { min, max } = WINDOW_LIMITS;
  return {
    preRoll: Math.round(clampNum(src.preRoll, min, max, CLIP_WINDOW.preRoll) * 10) / 10,
    postRoll: Math.round(clampNum(src.postRoll, min, max, CLIP_WINDOW.postRoll) * 10) / 10,
  };
}

// ---- The rolling recorders ----------------------------------------------------

// How a camera's recorders roll, for a pre-roll (ms):
//   count    how many recorders (two is enough: see rollStep)
//   spare    how long a recorder must have been going before its partner
//            may be restarted: the pre-roll and a second to be safe
//   cycle    how long a recorder runs before it's restarted
//   stagger  how long after the first the second starts
//   maxAge   a recorder is restarted after this however things stand, so
//            nothing grows without end (memory)
export function rollPlan(preRollMs) {
  const spare = Math.max(0, preRollMs) + 1000;
  const cycle = Math.max(8000, 2 * spare);
  return { count: 2, spare, cycle, stagger: cycle / 2, maxAge: 2 * cycle };
}

// What to do now with a camera's recorders. recs: [{ id, active, startedAt,
// until, notBefore }] - active while recording, startedAt when it began
// (ms), until the time it's being kept going to for a shot (null when
// free), notBefore the soonest an idle one may start. Returns { start:
// [ids], restart: [ids] }.
//
// A free recorder is restarted when it's a cycle old - but only while
// another free one has been going for at least `spare`, so there's always
// one with the pre-roll in hand. That also brings the two back half a cycle
// apart after a shot has kept one going (it restarts late, then its partner
// waits for it). One held for a shot is never restarted; its partner
// carries on however old it gets, up to maxAge.
export function rollStep(recs, now, plan) {
  const start = [];
  const restart = [];
  for (const r of recs) if (!r.active && !(r.until > now) && now >= (r.notBefore ?? 0)) start.push(r.id);
  const free = recs.filter((r) => r.active && r.until == null);
  // The oldest first: at most one restart a step, so the pair is never
  // restarted together.
  const byAge = [...free].sort((a, b) => a.startedAt - b.startedAt);
  for (const r of byAge) {
    const age = now - r.startedAt;
    if (age >= plan.maxAge) {
      restart.push(r.id);
      break;
    }
    if (age < plan.cycle) continue;
    const partner = free.some((o) => o !== r && now - o.startedAt >= plan.spare);
    if (partner) {
      restart.push(r.id);
      break;
    }
  }
  return { start, restart };
}

// Which recorder covers a shot at shotAt (ms) with preRollMs before it:
// of those recording since before the shot (held for an earlier shot or
// not), the one that started latest while still having the whole pre-roll
// - the shortest clip - or, if none has it all, the one with the most.
// Returns { id, offsetMs, shortMs } - offsetMs from the recording's start to
// where the replay should begin, shortMs how much of the pre-roll is
// missing - or null when nothing is recording.
export function coverFor(recs, shotAt, preRollMs) {
  const going = recs.filter((r) => r.active && r.startedAt <= shotAt);
  if (!going.length) return null;
  const from = shotAt - preRollMs;
  const whole = going.filter((r) => r.startedAt <= from);
  const pick = whole.length ? whole.reduce((a, b) => (b.startedAt > a.startedAt ? b : a)) : going.reduce((a, b) => (b.startedAt < a.startedAt ? b : a));
  return { id: pick.id, offsetMs: Math.max(0, from - pick.startedAt), shortMs: Math.max(0, pick.startedAt - from) };
}

// ---- Naming -------------------------------------------------------------------

// Characters Windows won't have in a file name, and control characters.
const BAD = /[<>:"/\\|?*\u0000-\u001f\u007f]/g;

// Text made safe as part of a file name: no characters Windows refuses,
// single spaces, no dot or space at the end, at most max characters.
export function sanitizePart(text, max = 40) {
  const s = String(text ?? "")
    .normalize("NFC")
    .replace(BAD, " ")
    // Words that are only dots (a path's "..") go.
    .replace(/(^|\s)\.+(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .replace(/[. ]+$/, "")
    .trim();
  return s;
}

// A camera's angle for a file name: "Down the line" -> "down-the-line".
export function angleSlug(name) {
  const s = String(name ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/, "");
  return s || "camera";
}

const pad = (n) => String(n).padStart(2, "0");
// "2026-09-29 14-05-12", in the PC's own time.
export function stamp(at) {
  const d = at instanceof Date ? at : new Date(at);
  if (!Number.isFinite(d.getTime())) return "0000-00-00 00-00-00";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

// A clip's file name: "2026-09-29 14-05-12 Player1 7I 153yds face-on.mp4".
// Whatever isn't known is left out.
export function clipName({ at, player, club, carry, angle, ext = "webm" }) {
  const parts = [stamp(at)];
  const who = sanitizePart(player, 30);
  if (who) parts.push(who);
  if (typeof club === "string" && /^[A-Z0-9]{1,3}$/.test(club)) parts.push(club);
  const c = Number(carry);
  if (carry != null && carry !== "" && Number.isFinite(c) && c >= 0 && c < 1000) parts.push(`${Math.round(c)}yds`);
  parts.push(angleSlug(angle));
  return `${parts.join(" ")}.${ext === "mp4" ? "mp4" : "webm"}`;
}

// A whole session's recording: "2026-09-29 14-05 A-Squared Golf session.mp4" (to
// the minute: it's one of a few a day, not one of hundreds).
// The game's own video (sim/showreel.mjs; `video` REEL_ID) is named as
// that, with the game's short name: "... A² Golf video.mp4".
// A long recording goes on in a new file each hour (public/videorec.js
// rollPart): the second and later named as parts, "... session part 2.mp4".
// The game's name as its video has it, short (the owner: "Where we have A
// squared golf, can we ensure we have the shorter A² format please"): every
// recording's corner title (compositor.js) and the video's file.
export const SHORT_NAME = "A² Golf";
// The game's own video's id, as a recording's meta has it.
export const REEL_ID = "reel";
const videoFileWords = (id) => (id === REEL_ID ? "video" : null);
export function sessionName({ at, ext = "webm", video = null, part = 1 }) {
  const words = videoFileWords(video);
  const nth = Number.isInteger(part) && part > 1 ? ` part ${part}` : "";
  return `${stamp(at).slice(0, 16)} ${words ? `${SHORT_NAME} ${words}` : "A-Squared Golf session"}${nth}.${ext === "mp4" ? "mp4" : "webm"}`;
}
// A recording put back together after a crash: "... (recovered).webm".
export const recoveredName = (name) => String(name).replace(/\.(webm|mp4)$/, " (recovered).$1");

// What the clips folder keeps: each camera's instant replay ("replay"),
// and the recorder's whole sessions ("session"), which live in a folder of
// their own inside it. "shot" was the recorder's clip of its composed
// picture around each shot, a mode since taken out: such clips from before
// are still listed, counted and deleted with the saved replays.
//
// A replay is temporary to begin with: kept (in the unsaved folder) only
// until the next shot, unless the owner saves it, when it moves into the
// clips folder itself and is kept like any clip. Anything left in the
// unsaved folder when the server starts is from a run that has ended, and
// goes. With a folder chosen for the recordings (on another drive, say),
// the replays go there too, in a replays folder inside it (its own unsaved
// folder inside that): an entry's dir says which folder, when it isn't the
// usual one.
export const KINDS = ["replay", "shot", "session"];
export const SESSION_FOLDER = "recordings";
export const UNSAVED_FOLDER = "unsaved";
export const REPLAY_FOLDER = "replays";
export const kindOf = (o) => (KINDS.includes(o?.kind) ? o.kind : "replay");

// The name, or "<name> (2).mp4"... when it's taken.
export function uniqueName(name, taken) {
  if (!taken.has(name)) return name;
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  for (let i = 2; ; i++) {
    const next = `${stem} (${i})${ext}`;
    if (!taken.has(next)) return next;
  }
}

// ---- The index ------------------------------------------------------------------

// Each clip, as the index keeps it: { id, kind, file, at, player, club,
// carry, mode, angle, cam, shot, stats, offset, pre, post, bytes, mime,
// length, temp, keep }. kind is KINDS' (an entry from before there were
// kinds is a replay); a session's file is in SESSION_FOLDER; length its
// seconds. temp: a replay not saved (yet), in UNSAVED_FOLDER, gone at the
// next shot - a replay from before there was saving has none, and is kept
// as it always was. keep: a session the owner marked never to delete. at is
// when the shot came (ISO); shot the server's shot number; stats the
// shot's id in the player's stats, when it was recorded; offset seconds
// into the file where the replay starts (the shot less the pre-roll). dir:
// a session recorded into a folder chosen in the app (another drive, say)
// rather than the usual one - the whole path to it, there only then. rec
// and part: a session's recording (the id its first file was begun as) and
// which file of it this is - a long one is a file an hour, kept together.
const ID = /^[a-z0-9]{6,32}$/;
const FILE = /^[^<>:"/\\|?*\u0000-\u001f]{1,200}\.(mp4|webm)$/;
const WORD = /^[a-z0-9-]{1,24}$/;

export function cleanEntry(o) {
  if (!o || typeof o !== "object") return null;
  if (!ID.test(o.id ?? "") || !FILE.test(o.file ?? "") || o.file.startsWith(".")) return null;
  const at = new Date(o.at);
  if (!Number.isFinite(at.getTime())) return null;
  const num = (v, lo, hi) => (v == null || v === "" ? null : Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Number(v))) : null);
  return {
    id: o.id,
    kind: kindOf(o),
    file: o.file,
    at: at.toISOString(),
    player: sanitizePart(o.player, 30) || null,
    club: typeof o.club === "string" && /^[A-Z0-9]{1,3}$/.test(o.club) ? o.club : null,
    carry: num(o.carry, 0, 999),
    mode: WORD.test(o.mode ?? "") ? o.mode : null,
    angle: sanitizePart(o.angle, 40) || null,
    cam: WORD.test(o.cam ?? "") ? o.cam : null,
    shot: Number.isInteger(o.shot) && o.shot > 0 ? o.shot : null,
    stats: typeof o.stats === "string" && /^[a-z0-9]{1,24}$/.test(o.stats) ? o.stats : null,
    offset: num(o.offset, 0, 600) ?? 0,
    pre: num(o.pre, 0, 60),
    post: num(o.post, 0, 60),
    bytes: Math.max(0, Math.round(Number(o.bytes) || 0)),
    mime: typeof o.mime === "string" && /^video\/(mp4|webm)(;[a-z0-9=.,"-]*)?$/i.test(o.mime) ? o.mime : null,
    length: num(o.length, 0, 86400),
    temp: kindOf(o) === "replay" && o.temp === true,
    keep: kindOf(o) === "session" && o.keep === true,
    ...(kindOf(o) !== "shot" && folderPath(o.dir) ? { dir: o.dir } : {}),
    ...(kindOf(o) === "session" && ID.test(o.rec ?? "") ? { rec: o.rec, part: Number.isInteger(o.part) && o.part > 1 ? Math.min(o.part, 999) : 1 } : {}),
  };
}

// The files of the same recording as `clip` (its hours: rec), itself
// included - finishing one never deletes another of them to make room.
export function sameRecording(clips, clip) {
  if (!clip) return [];
  if (!clip.rec) return [clip.id];
  return clips.filter((c) => kindOf(c) === "session" && (c.id === clip.id || c.rec === clip.rec)).map((c) => c.id);
}

// A folder's whole path, as a chosen folder's is kept: from a drive or the
// root (C:\Golf videos, /media/videos, \\server\share), nothing that can't
// be in one.
export function folderPath(d) {
  return typeof d === "string" && d.length > 1 && d.length <= 500 && /^([a-zA-Z]:[\\/]|[\\/])/.test(d) && !/[\u0000-\u001f<>"|?*]/.test(d.slice(2));
}

// The disk allowance: keep at most maxGB of saved clips, and (when set)
// none older than maxDays. Default 5 GB, no age limit. Session recordings
// have an allowance of their own, sessionMaxGB (10 GB to begin with - an
// hour at 1080p60 is 3 to 5.5 GB; the owner, 20 October 2026: "let's set
// to 10gb anyway"; the owner can change it, never to nothing), and are
// never deleted by age. Unsaved replays count against neither: they go at
// the next shot anyway.
export const RETENTION = { maxGB: 5, maxDays: null, sessionMaxGB: 10 };
// What the owner may set either limit to, in the System menu, the Cameras
// panel or the Recording panel.
export const LIMIT_GB = { min: 1, max: 500 };
const SESSION_GB_MAX = 20000;
export function cleanRetention(r) {
  const src = r && typeof r === "object" ? r : {};
  const gb = Number(src.maxGB);
  const days = src.maxDays == null || src.maxDays === "" ? null : Number(src.maxDays);
  // None set (null, or an index from before sessions had an allowance):
  // the 5 GB the owner chose.
  const sgb = src.sessionMaxGB == null || src.sessionMaxGB === "" ? NaN : Number(src.sessionMaxGB);
  return {
    maxGB: Number.isFinite(gb) && gb > 0 ? Math.min(2000, Math.max(0.001, Math.round(gb * 1000) / 1000)) : RETENTION.maxGB,
    maxDays: Number.isFinite(days) && days > 0 ? Math.min(3650, Math.round(days)) : null,
    sessionMaxGB: Number.isFinite(sgb) && sgb > 0 ? Math.min(SESSION_GB_MAX, Math.max(0.001, Math.round(sgb * 1000) / 1000)) : RETENTION.sessionMaxGB,
  };
}

// The index file, made sensible: { clips (oldest first, no repeats),
// retention }.
export function cleanIndex(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const seen = new Set();
  const clips = [];
  for (const o of Array.isArray(src.clips) ? src.clips : []) {
    const e = cleanEntry(o);
    if (!e || seen.has(e.id) || seen.has(`f:${e.file}`)) continue;
    seen.add(e.id);
    seen.add(`f:${e.file}`);
    clips.push(e);
  }
  clips.sort((a, b) => a.at.localeCompare(b.at));
  return { clips, retention: cleanRetention(src.retention) };
}

// A clip added: the index with it in time order.
export function addEntry(index, entry) {
  const e = cleanEntry(entry);
  if (!e) return index;
  const clips = index.clips.filter((c) => c.id !== e.id && c.file !== e.file);
  clips.push(e);
  clips.sort((a, b) => a.at.localeCompare(b.at));
  return { ...index, clips };
}

// Which clips go: first any older than maxDays, then the oldest until the
// rest fit in maxGB. keep: an id (or a list of them) never to delete - the
// clip just saved, so one bigger than the whole allowance is still kept
// until the next. Returns the ids, oldest first.
// Unsaved replays are left out: the next shot deletes them. Sessions are
// apart from the clips: only sessionMaxGB deletes them, oldest first, and
// never by age; one the owner marked Keep is never deleted and doesn't
// count against it. (A session still being recorded isn't in the index
// until it's finished, so it can't be deleted either.)
// only: "clips" or "sessions" to plan for one of the two (a replay saved
// never deletes a recording, nor a recording finished a clip); null both.
export function retentionPlan(clips, retention, { now = Date.now(), keep = null, only = null } = {}) {
  const { maxGB, maxDays, sessionMaxGB } = cleanRetention(retention);
  const spare = new Set([keep].flat().filter(Boolean));
  const out = [];
  if (only !== "sessions") out.push(...sizePlan(clips.filter((c) => kindOf(c) !== "session" && !c.temp), { maxGB, maxDays }, { now, spare }));
  if (only !== "clips") out.push(...sizePlan(clips.filter((c) => kindOf(c) === "session" && !c.keep), { maxGB: sessionMaxGB, maxDays: null }, { now, spare }));
  return out;
}

function sizePlan(clips, { maxGB, maxDays }, { now, spare }) {
  const oldest = [...clips].sort((a, b) => a.at.localeCompare(b.at));
  const out = [];
  const gone = new Set();
  if (maxDays) {
    const cutoff = now - maxDays * 86_400_000;
    for (const c of oldest) if (!spare.has(c.id) && Date.parse(c.at) < cutoff) (out.push(c.id), gone.add(c.id));
  }
  const limit = maxGB * 1e9;
  let total = oldest.filter((c) => !gone.has(c.id)).reduce((s, c) => s + (c.bytes || 0), 0);
  for (const c of oldest) {
    if (total <= limit) break;
    if (gone.has(c.id) || spare.has(c.id)) continue;
    out.push(c.id);
    gone.add(c.id);
    total -= c.bytes || 0;
  }
  return out;
}

// ---- Replays kept until the next shot ----------------------------------------------

// The unsaved replays a new shot replaces: every one not of that shot.
// Returns their ids.
export function replacedBy(clips, shot) {
  return clips.filter((c) => c.temp && c.shot !== shot).map((c) => c.id);
}

// What becomes of a replay clip arriving at the server, given the shot
// whose replay is current ({ shot, save } - save: the owner has asked to
// keep it): "save" (kept, in the clips folder), "temp" (kept until the
// next shot) or "drop" (its shot has been replaced and it wasn't saved:
// thrown away). save: the page says the owner saved it (while it was
// current). With no current shot known (the server has just started), a
// clip's own shot becomes the current one.
export function clipFate(current, { shot, save = false } = {}) {
  if (save) return "save";
  if (current?.shot == null) return "temp";
  if (current.shot !== shot) return "drop";
  return current.save ? "save" : "temp";
}

// ---- Changing a limit ------------------------------------------------------------------

// A limit typed by the owner: { gb } when it's a number from LIMIT_GB.min
// to LIMIT_GB.max (to a tenth), else { why }.
export function checkLimit(value) {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  if (!Number.isFinite(n) || n < LIMIT_GB.min || n > LIMIT_GB.max) return { why: `A limit from ${LIMIT_GB.min} to ${LIMIT_GB.max} GB` };
  return { gb: Math.round(n * 10) / 10 };
}

// What a new limit would delete now: which is "clips" (the saved clips'
// maxGB) or "sessions" (the recordings' sessionMaxGB). Returns { retention
// (as it would be), goes (the entries deleted, oldest first) }. A
// recording marked Keep, an unsaved replay and the one being recorded are
// never among them.
export function limitChange(clips, retention, which, gb) {
  const key = which === "sessions" ? "sessionMaxGB" : "maxGB";
  const next = cleanRetention({ ...cleanRetention(retention), [key]: gb });
  const ids = new Set(retentionPlan(clips, next, { only: which === "sessions" ? "sessions" : "clips" }));
  const goes = clips.filter((c) => ids.has(c.id)).sort((a, b) => a.at.localeCompare(b.at));
  return { retention: next, goes };
}

// The question before a limit deletes anything: "Lower the recordings'
// limit to 3 GB? These 5 would be deleted now, the oldest first (4.2 GB):
// "a.mp4", "b.mp4", "c.mp4" and 2 more. (Recordings marked Keep never
// are.)"
export function limitQuestion(goes, which, gb) {
  const what = which === "sessions" ? "recordings'" : "saved clips'";
  const shown = goes.slice(0, 3).map((c) => `"${c.file}"`);
  const more = goes.length > 3 ? ` and ${goes.length - 3} more` : "";
  const list = shown.join(", ");
  const mb = goes.reduce((s, c) => s + (c.bytes || 0), 0);
  const size = mb >= 1e9 ? `${(mb / 1e9).toFixed(1)} GB` : `${Math.round(mb / 1e6)} MB`;
  const keep = which === "sessions" ? " (Recordings marked Keep never are.)" : "";
  return `Lower the ${what} limit to ${gb} GB? ${goes.length === 1 ? "This would be" : `These ${goes.length} would be`} deleted now, the oldest first (${size}): ${list}${more}.${keep}`;
}

// ---- The recordings' allowance, for the Recording panel ---------------------------------

// How the session recordings stand against their allowance: { used (bytes
// of those not kept), limit (bytes), kept, keptBytes, room (bytes before
// the oldest must go), minutesLeft (at perHour bytes an hour, null if not
// given), goes (the recordings deleted when one of extra bytes - the one
// being recorded - is finished, oldest first) }.
export function sessionUse(clips, retention, { extra = 0, perHour = null } = {}) {
  const { sessionMaxGB } = cleanRetention(retention);
  const sessions = clips.filter((c) => kindOf(c) === "session");
  const open = sessions.filter((c) => !c.keep);
  const kept = sessions.filter((c) => c.keep);
  const limit = sessionMaxGB * 1e9;
  const used = open.reduce((s, c) => s + (c.bytes || 0), 0);
  const room = Math.max(0, limit - used);
  const next = { id: "\u0000recording", at: "9999-12-31T23:59:59.999Z", bytes: Math.max(0, extra), kind: "session" };
  const plan = new Set(sizePlan([...open, next], { maxGB: sessionMaxGB, maxDays: null }, { now: 0, spare: new Set([next.id]) }));
  const goes = open.filter((c) => plan.has(c.id)).sort((a, b) => a.at.localeCompare(b.at));
  return {
    used,
    limit,
    kept: kept.length,
    keptBytes: kept.reduce((s, c) => s + (c.bytes || 0), 0),
    room,
    minutesLeft: perHour > 0 ? Math.floor((Math.max(0, room - Math.max(0, extra)) / perHour) * 60) : null,
    goes,
  };
}

// ---- Room on the drive ----------------------------------------------------------------------

// The drive the recordings and replays go to running low. The owner's
// start-up scripts used to warn with a box over the game when it had under
// 20 GB free ("Only 19 GB free on the video drive (C:\)"); the game says
// it instead, without stopping play: once a session, and on the Disk space
// page. In GB as Windows counts them (1024 MB), so it reads as Explorer does.
export const LOW_FREE_GB = 20;
const WIN_GB = 1024 ** 3;

// The room left, as the server measures it ({ bytes, drive }: the drive
// new recordings go to), in words: { gb, text: "19 GB free on C:\", low },
// or null when it isn't known.
export function freeSpace(free) {
  if (!free || !Number.isFinite(free.bytes) || free.bytes < 0) return null;
  const gb = free.bytes / WIN_GB;
  const shown = gb >= 10 ? Math.floor(gb) : Math.floor(gb * 10) / 10;
  return { gb, low: gb < LOW_FREE_GB, text: `${shown} GB free${free.drive ? ` on ${free.drive}` : ""}` };
}

// The note given over play when the drive is low, or null when it isn't.
export function lowSpaceNote(free) {
  const f = freeSpace(free);
  // Its gist first (shown big in bay view), then what to do about it.
  return f?.low ? `Only ${f.text} - delete or move old recordings and replays: Menu, Cameras & video, Disk space` : null;
}

// A new clip's id.
let counter = 0;
export function newClipId(now = Date.now()) {
  return `${now.toString(36)}${(counter++ % 1296).toString(36).padStart(2, "0")}${Math.floor(Math.random() * 1296).toString(36).padStart(2, "0")}`;
}

// ---- A stats shot's video ---------------------------------------------------------

// Where a shot in a player's stats can be watched: its own replays (each
// camera's, by its stats id), and any session recording that was running
// when it was hit - from SESSION_PRE seconds before, as a replay starts
// with its pre-roll. shot: { id, hit } as the stats page lists it (hit:
// ms, null for a shot from before the hit time was kept, which only its
// own replays can show). -> [{ file, offset, angle, kind }], its own
// replays first.
export const SESSION_PRE = 3;
export function clipsForShot(clips, shot) {
  if (!shot || !Array.isArray(clips)) return [];
  const own = [];
  const sessions = [];
  for (const c of clips) {
    if (!c?.file) continue;
    if (c.kind !== "session" && shot.id && c.stats === shot.id) {
      own.push({ file: c.file, offset: c.offset ?? 0, angle: c.angle ?? null, kind: c.kind });
    } else if (c.kind === "session" && Number.isFinite(shot.hit) && Number.isFinite(c.length)) {
      const into = (shot.hit - Date.parse(c.at)) / 1000;
      if (into >= 0 && into <= c.length) sessions.push({ file: c.file, offset: Math.max(0, Math.round((into - SESSION_PRE) * 10) / 10), angle: c.angle ?? null, kind: "session" });
    }
  }
  return [...own, ...sessions];
}

// ---- Every saved replay -------------------------------------------------------------

// The saved replays in one list (the Recording panel's Saved replays): a
// shot each - its cameras' clips together, as they share the shot's time
// and number - newest first. Not the recordings, nor a replay not saved
// (it goes at the next shot). An old "shot" clip, the recorder's picture
// round a shot, is one too. -> [{ key, at, player, club, carry, mode,
// clips: [{ id, file, angle, offset, bytes, kind }], bytes }].
export function savedReplays(clips) {
  const shots = new Map();
  for (const c of Array.isArray(clips) ? clips : []) {
    if (!c?.id || !c.file || !c.at || kindOf(c) === "session" || c.temp) continue;
    const key = `${c.at}|${c.shot ?? ""}`;
    let s = shots.get(key);
    if (!s) shots.set(key, (s = { key, at: c.at, player: c.player ?? null, club: c.club ?? null, carry: c.carry ?? null, mode: c.mode ?? null, clips: [], bytes: 0 }));
    s.clips.push({ id: c.id, file: c.file, angle: c.angle ?? (kindOf(c) === "shot" ? "Recording" : null), offset: c.offset ?? 0, bytes: c.bytes ?? 0, kind: kindOf(c) });
    s.bytes += c.bytes ?? 0;
  }
  for (const s of shots.values()) s.clips.sort((a, b) => String(a.angle ?? "~").localeCompare(String(b.angle ?? "~")));
  return [...shots.values()].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

// A saved shot in words: "Andy · 7I · 153 yds · Range" (what isn't known
// left out; "A shot" when nothing is). modeNames: { range: "Range", ... }.
export function replayWords(shot, modeNames = {}) {
  const parts = [];
  if (shot?.player) parts.push(shot.player);
  if (shot?.club) parts.push(shot.club);
  if (Number.isFinite(shot?.carry)) parts.push(`${Math.round(shot.carry)} yds`);
  if (shot?.mode && modeNames[shot.mode]) parts.push(modeNames[shot.mode]);
  return parts.length ? parts.join(" · ") : "A shot";
}
