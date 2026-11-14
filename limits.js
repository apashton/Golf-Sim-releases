// The two disk limits the owner sets - the saved clips' (the cameras'
// replays kept with Save) and the recordings' (the recorder's sessions),
// 5 GB each to begin with - changed from the menu, the Cameras panel
// or the Recording panel. Oldest first is how either makes room; a limit
// lowered below what's kept asks first, naming what would go (a recording
// marked Keep never does). The rules are sim/clips.mjs's.

import { checkLimit, limitChange, limitQuestion, RETENTION } from "./sim/clips.mjs";

// The clips index (every clip and recording, the limits), or null.
export async function readClips() {
  try {
    const res = await fetch("/api/clips");
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

// A limit typed: which is "clips" or "sessions". Checked (1 - 500 GB),
// asked about if it would delete anything now, then set. confirm(text) and
// toast(text, ms) are the caller's (the window it's in). Returns the
// server's { retention, deleted }, or null when nothing was changed.
export async function changeLimit(which, value, { confirm, toast }) {
  const ok = checkLimit(value);
  if (ok.why) {
    toast(ok.why, 2500);
    return null;
  }
  const lib = await readClips();
  if (!lib) {
    toast("The limit wasn't changed - is the local server running?", 3000);
    return null;
  }
  const { goes } = limitChange(lib.clips, lib.retention, which, ok.gb);
  if (goes.length && !confirm(limitQuestion(goes, which, ok.gb))) return null;
  try {
    const key = which === "sessions" ? "sessionMaxGB" : "maxGB";
    const res = await fetch("/api/clips/retention", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: ok.gb }) });
    const r = await res.json();
    if (!res.ok) throw new Error(r.error ?? `the server said ${res.status}`);
    const n = r.deleted?.length ?? 0;
    toast(`${which === "sessions" ? "Recordings" : "Saved clips"}: up to ${ok.gb} GB${n ? ` - ${n} deleted to fit` : ""}`, 2500);
    return r;
  } catch (err) {
    toast(`The limit wasn't changed: ${err.message}`, 3000);
    return null;
  }
}

// "1.2 GB", "750 MB".
export function sizeText(bytes) {
  if (!(bytes > 0)) return "0 MB";
  if (bytes < 1e9) return `${Math.max(1, Math.round(bytes / 1e6))} MB`;
  const gb = bytes / 1e9;
  return `${gb >= 10 || Number.isInteger(gb) ? Math.round(gb) : gb.toFixed(1)} GB`;
}

// What each limit has in use now: { clips: { used, limit }, sessions: {
// used, limit, kept, keptBytes } }, from the clips index.
export function usage(lib) {
  const clips = lib?.clips ?? [];
  const saved = clips.filter((c) => c.kind !== "session" && !c.temp);
  const sessions = clips.filter((c) => c.kind === "session");
  const open = sessions.filter((c) => !c.keep);
  const kept = sessions.filter((c) => c.keep);
  const sum = (list) => list.reduce((s, c) => s + (c.bytes || 0), 0);
  return {
    clips: { used: sum(saved), limit: lib?.retention?.maxGB ?? 5, count: saved.length },
    sessions: { used: sum(open), limit: lib?.retention?.sessionMaxGB ?? RETENTION.sessionMaxGB, count: sessions.length, kept: kept.length, keptBytes: sum(kept) },
  };
}
