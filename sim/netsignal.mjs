// Online play: how good each bay's connection is, for the bars beside its
// name. Each bay times its own keep-alive to the relay (once a minute -
// counted already), or its last change across the house, and says it with
// the next change it sends anyway; the host puts it with that bay in the
// game, which goes out after the change - so knowing it costs nothing more
// of the relay's allowance (relay/README.md, "Free-plan rules").

const GOOD_MS = 300;
const FAIR_MS = 900;

// A bay's signal: { level: "good" | "fair" | "poor" | "off" | null, bars:
// 0-3, words }. level null: connected, not timed yet.
export function signalOf(bay) {
  if (!bay) return { level: null, bars: null, words: "" };
  if (bay.online === false) return { level: "off", bars: 0, words: "not connected" };
  const ms = Number.isFinite(bay.rtt) ? bay.rtt : null;
  if (ms == null) return { level: null, bars: null, words: "connected" };
  const level = ms < GOOD_MS ? "good" : ms < FAIR_MS ? "fair" : "poor";
  return { level, bars: level === "good" ? 3 : level === "fair" ? 2 : 1, words: `${level} connection (${Math.round(ms)} ms)` };
}

// A round trip's time, kept steady: the last few weighed together so one
// slow one doesn't flip the bars.
export function smoothRtt(was, ms) {
  if (!Number.isFinite(ms) || ms < 0) return was ?? null;
  return Number.isFinite(was) ? Math.round(was * 0.6 + ms * 0.4) : Math.round(ms);
}
