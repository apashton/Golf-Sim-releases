// The recording format: how the shots being hit now go into the stats.
// One switch with four settings (the top bar next to Hitting, the System
// menu, Shift + R, and golfsim.setRecording for a voice command):
//
//   practice      recorded and counted - the normal, and the default
//   round         recorded and counted, tagged as round play; a course round
//                 is always round play, whatever is chosen
//   experimental  recorded and kept, but out of every number, tip and club
//                 check until switched into the view on My stats
//   off           warm up: nothing recorded - shots still fly and games
//                 still score, but no line is written. Every time A² Golf
//                 starts it starts here (the owner, 19 November 2026: "the
//                 initial login to the driving range should always be in
//                 warm-up mode ... so it doesn't record"), until the player
//                 picks another - or starts a course round, which is
//                 recorded (startFormat, warmUpOver). Called "Not
//                 recording" before then; still "off" underneath, so a
//                 saved setting and a voice command still mean it.
//
// A shot keeps its format as a short field (rec, see shotstats.mjs): "r"
// round play, "x" experimental, none for practice - so every shot recorded
// before there was a switch is practice (or a round, on a course).
//
// Anything but practice is kept through a reload or a restart - an update
// or a crash mid-session mustn't quietly put an experimental session into
// the numbers, or start recording one that was meant to be off - but not
// into a new day: the next day's first session is practice again, with a
// toast saying so. Off left on by mistake would lose a whole day's shots,
// and an experimental morning would hide them.
//
// Pure, so the rules are tested; public/recording.js is the page's side.

export const FORMATS = ["practice", "round", "experimental", "off"];
export const FORMAT_NAMES = { practice: "Practice", round: "Round", experimental: "Experimental", off: "Warm up" };
// What each writes on a shot (and a finished game): practice writes nothing.
export const REC_CODES = { round: "r", experimental: "x" };
// The key that goes round them.
export const RECORDING_KEY = "Shift + R";

// A format from what a voice command or a page call might say. null when
// it isn't one.
export function parseRecording(value) {
  const t = typeof value === "string" ? value.trim().toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim() : "";
  if (FORMATS.includes(t)) return t;
  if (/^(practise|normal|record|recording|record normally|start recording|recording on|on|counted)$/.test(t)) return "practice";
  if (/^(round play|a round|rounds|round stats|playing a round)$/.test(t)) return "round";
  if (/^(experiment|experimenting|experimental stats|test|testing|messing about|playing about|friends)$/.test(t)) return "experimental";
  if (/^(stop|stop recording|not recording|no recording|recording off|pause|pause recording|don t record|do not record|warm up|warmup|warm ups|warming up|warm up mode)$/.test(t)) return "off";
  return null;
}

// Shift + R: on to the next one, and round again.
export function nextFormat(format) {
  const i = FORMATS.indexOf(format);
  return FORMATS[(i + 1) % FORMATS.length];
}

// The format a shot hit now is recorded as, in a mode: what's chosen, but a
// course round is always round play (unless it's experimental or off).
export function shotFormat(chosen, mode) {
  const f = FORMATS.includes(chosen) ? chosen : "practice";
  return f === "practice" && mode === "course" ? "round" : f;
}

// What a shot (or game) line carries for a format: "r", "x", or nothing.
export const recCode = (format) => REC_CODES[format];

// The line over the picture in bay view and on the game window, big enough
// to read from the mat: "" when shots are going in as normal (practice, or
// a course round, which is round play anyway).
export function bayLine(chosen, mode) {
  if (chosen === "off") return "WARM UP";
  if (chosen === "experimental") return "EXPERIMENTAL";
  if (chosen === "round" && mode !== "course") return "ROUND";
  return "";
}

// What changing to it says, as a toast.
export function formatToast(format) {
  if (format === "off") return `Warm up - shots fly and games score, but nothing goes in your stats (${RECORDING_KEY} for Practice when you're ready)`;
  if (format === "experimental") return `Recording: Experimental - kept, but out of every number, tip and club check (${RECORDING_KEY} to change)`;
  if (format === "round") return `Recording: Round - counted, and kept as round play (${RECORDING_KEY} to change)`;
  return `Recording: Practice - every shot counts (${RECORDING_KEY} to change)`;
}

// The format as A² Golf starts: warm up on its first load (fresh: nothing
// in this window's session yet) - a reload mid-session (a graphics change,
// the speed test, the app reloading a page that's stuck) keeps what was
// chosen. -> { format, auto } - auto: the warm up the start chose, not
// the player.
export function startFormat(saved, { fresh = false } = {}) {
  if (fresh) return { format: "off", auto: true };
  return { format: FORMATS.includes(saved?.format) ? saved.format : "practice", auto: saved?.auto === true && saved.format === "off" };
}
// A course round beginning: the warm up A² Golf started in is over - the
// round's recorded (as practice, which a course round is as round play).
// One the player picked stays.
export const warmUpOver = (saved) => saved?.format === "off" && saved.auto === true;
// What's said as A² Golf starts in it.
export const WARM_UP_START = `Warming up - nothing's recorded yet. ${RECORDING_KEY}, or Warm up in the top bar, for Practice when you're ready`;

// A local day, "2026-09-28".
export function localDay(t) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// How long nothing must have been recorded under a format, as well as the
// day having changed, before it goes back to practice: a session that runs
// on past midnight keeps its format, the next morning's doesn't.
export const NEW_DAY_GAP_MS = 3 * 60 * 60 * 1000;

// Whether a saved format ({ format, at }: at is when it was chosen or last
// recorded a shot) has had its day, and it's back to practice now.
export function staleFormat(saved, now = Date.now()) {
  const f = saved?.format;
  if (!FORMATS.includes(f) || f === "practice") return false;
  const at = Number(saved.at);
  if (!Number.isFinite(at)) return true;
  return localDay(now) !== localDay(at) && now - at >= NEW_DAY_GAP_MS;
}
