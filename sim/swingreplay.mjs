// The swing replay on the game window (the projector): the last shot's
// camera replay, asked for by voice ("replay", "show me that swing"), the Q
// key or a camera box's "Show on projector", shown big where the golfer
// can see it from the mat, a few times round, then gone. Everything else
// of the cameras stays in the controls window.
//
// Pure, for the page (public/swingreplay.js) and the tests: the settings
// (which one or two cameras, left and right; the speed; how many times
// round; where on the picture), which clips a replay shows, and the
// replay's own steps - waiting for a clip still recording, going round,
// closing after the last time round, at the next shot or when told.

import { defaultName } from "./players.mjs";

// ---- Settings -----------------------------------------------------------------------

// Speeds offered: a quarter, half (to begin with) and full speed.
export const SWING_SPEEDS = [0.25, 0.5, 1];
export const SPEED_WORDS = { 0.25: "¼ speed", 0.5: "½ speed", 1: "full speed" };
// Times round before it closes by itself.
export const LOOP_LIMITS = { min: 1, max: 10 };
// Where on the game window: the whole picture, or a large panel on one
// side that leaves the rest of the picture (and the ball) in view.
export const PLACES = ["full", "left", "right"];
export const PLACE_WORDS = { full: "The whole picture", left: "A panel on the left", right: "A panel on the right" };
export const SWING_DEFAULTS = { cams: null, speed: 0.5, loops: 3, place: "full" };

// The swing replay's settings made sensible. cams: the camera ids chosen,
// left then right (one or two), or null for "automatic" - the first one or
// two cameras with Replay on. Ids of cameras no longer in the list
// (camIds, when given) are dropped; none left is automatic again.
export function cleanSwingReplay(s, camIds = null) {
  const src = s && typeof s === "object" ? s : {};
  let cams = null;
  if (Array.isArray(src.cams)) {
    const ids = [];
    for (const id of src.cams) {
      if (typeof id !== "string" || !/^[a-z0-9-]{1,24}$/.test(id) || ids.includes(id)) continue;
      if (camIds && !camIds.includes(id)) continue;
      ids.push(id);
      if (ids.length === 2) break;
    }
    cams = ids.length ? ids : null;
  }
  const loops = Math.round(Number(src.loops));
  return {
    cams,
    speed: SWING_SPEEDS.includes(src.speed) ? src.speed : SWING_DEFAULTS.speed,
    loops: Number.isFinite(loops) ? Math.min(LOOP_LIMITS.max, Math.max(LOOP_LIMITS.min, loops)) : SWING_DEFAULTS.loops,
    place: PLACES.includes(src.place) ? src.place : SWING_DEFAULTS.place,
  };
}

// ---- Which cameras ---------------------------------------------------------------------

// The cameras a swing replay shows, left then right: [cam] (one or two), or
// [] when there's none to show. cams: the chosen cameras in the Cameras
// panel's order ({ id, on, replay }); swing: the settings above; replayOn:
// whether replays are on at all.
//   - Chosen by hand: those of them still ticked with Replay on, in their
//     order. One of two missing (unplugged, unticked, Replay off) leaves
//     the other; both missing falls back to automatic.
//   - Automatic: the first one or two ticked with Replay on.
export function pickReplayCams(cams, swing, { replayOn = true } = {}) {
  if (!replayOn) return [];
  const usable = (Array.isArray(cams) ? cams : []).filter((c) => c && c.on !== false && c.replay !== false);
  const chosen = (swing?.cams ?? []).map((id) => usable.find((c) => c.id === id)).filter(Boolean);
  return chosen.length ? chosen : usable.slice(0, 2);
}

// Why there's nothing to replay, in a few words for a toast - or null when
// there is (or may still be: a clip on its way). Checked in this order:
//   setup     no camera for it (none chosen, or none with Replay on)
//   off       replays turned off altogether
//   paused    the recorder has the cameras' replays paused
//   none      no shot since the cameras started
//   missed    the shot came but none of these cameras was recording it
//   gone      its clip isn't there any more
export const NO_REPLAY = {
  setup: "Set up a swing replay camera in Cameras",
  off: "Replays are off - turn them on in Cameras",
  paused: "No replay - the camera replays are paused while recording video",
  none: "No swing to replay yet",
  missed: "No replay of that shot - the cameras weren't recording it",
  late: "The replay didn't come - try again in a moment",
  gone: "That replay has gone",
};

// What a replay would show now: { why } (a NO_REPLAY key), or { cams,
// shot, ready, pending } - the cameras to show (left, right), the shot
// number, the ids whose clip is in hand, and those still recording.
//   pick       pickReplayCams' answer
//   replayOn   replays on at all
//   paused     replays paused (the recorder)
//   shot       the current shot's replay: { shotNumber, recording: [ids
//              recording when it came], clips: [ids with a clip in hand],
//              gone: [ids whose clip has gone] }, or null (no shot yet)
export function replayPlan({ pick, replayOn = true, paused = false, shot = null }) {
  if (!replayOn) return { why: "off" };
  if (!pick?.length) return { why: "setup" };
  if (!shot) return { why: paused ? "paused" : "none" };
  const clips = new Set(shot.clips ?? []);
  const recording = new Set(shot.recording ?? []);
  const gone = new Set(shot.gone ?? []);
  const cams = pick.filter((c) => (clips.has(c.id) || recording.has(c.id)) && !gone.has(c.id));
  if (!cams.length) {
    if (pick.some((c) => gone.has(c.id))) return { why: "gone" };
    return { why: paused && !recording.size ? "paused" : "missed" };
  }
  return {
    cams,
    shot: shot.shotNumber,
    ready: cams.filter((c) => clips.has(c.id)).map((c) => c.id),
    pending: cams.filter((c) => !clips.has(c.id)).map((c) => c.id),
  };
}

// How long to wait for a clip still recording its post-roll: until the
// post-roll has run out and a few seconds more for it to be finished and
// read (sim/clips.mjs), and never less than a few seconds from now.
export function waitUntil({ now, shotAt, postRoll = 2 }) {
  const due = Number.isFinite(shotAt) ? shotAt + postRoll * 1000 + 8000 : now + 10000;
  return Math.max(now + 3000, due);
}

// ---- The caption ------------------------------------------------------------------------

// Whose swing it was, for the caption - or null to leave the name out.
// The owner: practising alone, "Player 1" on every replay is just noise,
// so the name only shows when there are several players to tell apart.
// A single player is left out whatever they're called: it's the same
// rule as the picture's own "who's hitting" and the review cards
// (recorder.multi), and a solo golfer knows it was their swing.
//   players  the players list (names) or how many there are; not known
//            (null), only the default "Player 1" is left out.
export function captionPlayer(player, players = null) {
  if (typeof player !== "string" || !player.trim()) return null;
  const count = Array.isArray(players) ? players.length : Number.isFinite(players) ? players : null;
  if (count != null) return count > 1 ? player : null;
  return player === defaultName(0) ? null : player;
}

// "Ben · 7 iron · 154 yds · ½ speed": who (captionPlayer's rule), which
// club and how far, if known, and the speed. name(club): the club's name
// ("7 iron"). players: the players list, or how many there are.
export function replayCaption(meta = {}, speed = 0.5, name = (c) => c, { players = null } = {}) {
  const carry = Number(meta?.carry);
  return [captionPlayer(meta?.player, players), meta?.club ? name(meta.club) : null, meta?.carry != null && Number.isFinite(carry) && carry > 0 ? `${Math.round(carry)} yds` : null, SPEED_WORDS[speed] ?? `${speed}×`].filter(Boolean).join(" · ");
}

// ---- The replay's steps ------------------------------------------------------------------

// The state: { phase, shot, cams, ready, speed, loops, loop, deadline,
// run, why }.
//   phase     "idle", "waiting" (a clip still recording) or "showing"
//   loop      which time round it's on (1 to loops)
//   run       counts up each time the clips should start again from the
//             beginning (the page seeks every video back when it changes)
//   why       why it last closed: "done" (its times round), "shot" (the
//             next shot), "closed" (Esc, Q, "close replay"), "late" (the
//             clip never came), or null
export const IDLE = Object.freeze({ phase: "idle", shot: null, cams: [], ready: [], speed: 0.5, loops: 3, loop: 0, deadline: 0, run: 0, why: null });

const closed = (s, why) => ({ ...s, phase: "idle", loop: 0, deadline: 0, why });
const start = (s) => ({ ...s, phase: "showing", loop: 1, deadline: 0, run: s.run + 1, why: null });

// One step: the state after an event.
//   { type: "show", shot, cams: [ids], ready: [ids], speed, loops, deadline }
//       asked for: showing if every clip is in hand, else waiting for the
//       rest until deadline. Asked for again while showing the same shot,
//       it starts again (at the speed asked for).
//   { type: "ready", shot, cam }   a clip came
//   { type: "tick", now }          time passing: waiting too long shows
//                                  what's in hand, or closes ("late")
//   { type: "ended" }              the clips reached their end: round again,
//                                  or closed after the last time ("done")
//   { type: "again", speed? }      from the beginning, the count afresh
//   { type: "speed", speed }       a different speed, where it is
//   { type: "shot" }               the next shot: closed at once
//   { type: "close" }              closed
export function replayStep(state, ev) {
  const s = state ?? IDLE;
  switch (ev?.type) {
    case "show": {
      const cams = [...(ev.cams ?? [])];
      if (!cams.length) return closed(s, s.why);
      const speed = SWING_SPEEDS.includes(ev.speed) ? ev.speed : s.speed;
      const loops = Number.isInteger(ev.loops) && ev.loops > 0 ? ev.loops : s.loops;
      if (s.phase !== "idle" && s.shot === ev.shot && sameList(s.cams, cams)) {
        if (s.phase === "waiting") return { ...s, speed, loops, ready: union(s.ready, ev.ready ?? []), deadline: Math.max(s.deadline, ev.deadline ?? 0) };
        return start({ ...s, speed, loops });
      }
      const ready = (ev.ready ?? []).filter((id) => cams.includes(id));
      const next = { ...s, shot: ev.shot, cams, ready, speed, loops, why: null };
      if (cams.every((id) => ready.includes(id))) return start(next);
      return { ...next, phase: "waiting", loop: 0, deadline: ev.deadline ?? 0 };
    }
    case "ready": {
      if (s.phase === "idle" || ev.shot !== s.shot || !s.cams.includes(ev.cam)) return s;
      const ready = union(s.ready, [ev.cam]);
      if (s.phase === "waiting" && s.cams.every((id) => ready.includes(id))) return start({ ...s, ready });
      return { ...s, ready };
    }
    case "tick": {
      if (s.phase !== "waiting" || !(ev.now >= s.deadline)) return s;
      // Waited long enough: what's in hand is shown without the rest.
      if (s.ready.length) return start({ ...s, cams: s.cams.filter((id) => s.ready.includes(id)) });
      return closed(s, "late");
    }
    case "ended": {
      if (s.phase !== "showing") return s;
      if (s.loop >= s.loops) return closed(s, "done");
      return { ...s, loop: s.loop + 1, run: s.run + 1 };
    }
    case "again": {
      const speed = SWING_SPEEDS.includes(ev.speed) ? ev.speed : s.speed;
      if (s.phase === "showing") return start({ ...s, speed });
      if (s.phase === "waiting") return { ...s, speed };
      return s;
    }
    case "speed":
      return SWING_SPEEDS.includes(ev.speed) && s.phase !== "idle" ? { ...s, speed: ev.speed } : s;
    case "shot":
      return s.phase === "idle" ? s : closed(s, "shot");
    case "close":
      return s.phase === "idle" ? s : closed(s, "closed");
    default:
      return s;
  }
}

const union = (a, b) => [...new Set([...a, ...b])];
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// ---- Two clips in step ---------------------------------------------------------------------

// Where a follower should be to match the leader: both clips start a few
// seconds before the shot (their own start), so the same time since each
// one's start is the same moment of the swing. Returns the time to seek the
// follower to, or null when it's close enough (within tolerance seconds)
// or can't get there (past its end: it waits there for the next time round).
export function followerTime({ leaderTime, leaderStart, followerStart, followerTime: now, followerEnd = Infinity, tolerance = 0.08 }) {
  const want = followerStart + (leaderTime - leaderStart);
  if (!Number.isFinite(want) || want > followerEnd) return null;
  return Math.abs(want - now) > tolerance ? Math.max(followerStart, want) : null;
}
