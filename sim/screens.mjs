// Keys pressed in another of A-Squared Golf's windows (the controls, the shot
// data), handed to the sim. At the mat nobody should have to click the
// projector first: whichever window has the keyboard, the sim's keys work.
// Pure, so the rules can be tested; the windows do the handing on.
//
//   - The controls window (Separate windows) is the sim's own page, split in
//     two: its keys go to the sim's own key handler as they are, so the
//     rules for a box that has the keyboard (keys.mjs) apply there too - a
//     tick box never keeps a key, a number box only the keys that type a
//     number, a clicker always changes club.
//   - The shot data window keeps only its own few keys (F and F11 flick it
//     between full screen and a window) and what belongs to Windows (Alt +
//     F4, Ctrl + anything); every other key is sent on to the sim, over a
//     BroadcastChannel, as a message of plain values.

import { HISTORY_MARKS, HISTORY_MAX } from "./shothistory.mjs";
import { CLUB_ORDER } from "./clubs.mjs";

// The channel the shot data window sends keys on.
export const KEY_CHANNEL = "golfsim-keys";

// Keys that press nothing by themselves.
const MODIFIERS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock", "AltGraph", "Process", "Unidentified", "Dead", "NumLock", "ScrollLock"]);

// Shift + D: the game, controls and shot data as windows of their own, or
// back in one.
export function isScreensKey(e) {
  return !!e && !!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && (e.key === "D" || e.key === "d");
}

// Whether the shot data window keeps a key for itself (true), or sends it
// on to the sim (false).
export function shotScreenKeeps(e) {
  if (!e || typeof e.key !== "string" || !e.key) return true;
  if (MODIFIERS.has(e.key)) return true;
  if (e.ctrlKey || e.altKey || e.metaKey) return true;
  if (e.key === "F11" || e.key === "f" || e.key === "F") return true;
  return false;
}

// The shot data window's Shot history, as the command centre's (the owner:
// "the shot history on the shot screen needs to be able to be amended in
// the same way"): the game says which shots can still be changed - its
// recorder's last few (sim/shothistory.mjs HISTORY_MAX), what each was
// marked and its club - whenever that changes or the window asks; the
// window sends back a mark or a club. The game's recorder does it, as from
// the command centre (Z undoes it there).
//   history-ask   the window, opening: what can be changed?
//   history-list  the game: { list: [{ id, club, say }] }, newest first
//   history       the window: { id, say } or { id, club }
export const HISTORY_ASK = { type: "history-ask" };
const SAYS = new Set([...HISTORY_MARKS, "auto"]);
export function historyMessage({ id, say = null, club = null } = {}) {
  if (typeof id !== "string" || !id || id.length > 64) return null;
  const s = typeof say === "string" && SAYS.has(say) ? say : null;
  const c = typeof club === "string" && CLUB_ORDER.includes(club) ? club : null;
  if (!s && !c) return null;
  return { type: "history", id, say: s, club: c };
}
export function historyListMessage(list) {
  return { type: "history-list", list: (list ?? []).slice(0, HISTORY_MAX).map((s) => ({ id: String(s.id), club: s.club ?? null, say: s.say ?? null })) };
}
// The list as the window takes it: a Map of id -> { club, say }, or null
// for anything else.
export function readHistoryList(m) {
  if (m?.type !== "history-list" || !Array.isArray(m.list)) return null;
  const out = new Map();
  for (const s of m.list.slice(0, HISTORY_MAX)) {
    if (typeof s?.id !== "string" || !s.id) continue;
    out.set(s.id, { club: CLUB_ORDER.includes(s.club) ? s.club : null, say: SAYS.has(s.say) ? s.say : null });
  }
  return out;
}
export function keyMessage(e) {
  return {
    type: "key",
    key: String(e?.key ?? ""),
    code: String(e?.code ?? ""),
    shiftKey: !!e?.shiftKey,
    ctrlKey: !!e?.ctrlKey,
    altKey: !!e?.altKey,
    metaKey: !!e?.metaKey,
    repeat: !!e?.repeat,
  };
}

// What the sim makes of a message: the KeyboardEvent to raise, or null for
// anything that isn't a sensible key (a key name is a character or a word
// like "PageDown", never more). A key the shot data window would have kept
// is refused too, so a second copy can't sneak Ctrl + something through.
export function keyInit(msg) {
  if (!msg || typeof msg !== "object" || msg.type !== "key") return null;
  const key = msg.key;
  if (typeof key !== "string" || !key || key.length > 20 || !/^(.|[A-Za-z][A-Za-z0-9]*)$/u.test(key)) return null;
  const init = {
    key,
    code: typeof msg.code === "string" && msg.code.length <= 30 ? msg.code : "",
    shiftKey: msg.shiftKey === true,
    ctrlKey: msg.ctrlKey === true,
    altKey: msg.altKey === true,
    metaKey: msg.metaKey === true,
    repeat: msg.repeat === true,
    bubbles: true,
    cancelable: true,
  };
  if (shotScreenKeeps(init)) return null;
  return init;
}

// "separate" or "docked", from whatever was saved (anything else is docked:
// one screen is how A-Squared Golf starts).
export function screensMode(saved) {
  return saved === "separate" ? "separate" : "docked";
}
