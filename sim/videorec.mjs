// The recorder's rules (public/videorec.js runs them): its settings, the
// format and bitrate it records in, how loud the game and the microphone
// are in the mix, how many video encoders are busy, and when to say the
// game is slowing down. Pure, for the page and the tests.
//
// It records only between Start and Stop: one session, one file. (It used
// to offer a clip of its picture around every shot too - "Per shot", or
// "Both" - taken out when the owner decided a recording is something you
// start and finish; quick review is the cameras' own replays.)

import { OUTPUT_SIZES, OUTPUT_FPS } from "./videolayout.mjs";
import { volumeGain } from "../audio/params.mjs";
import { NAMES as GRAPHICS_NAMES } from "./graphics.mjs";

// ---- Settings ------------------------------------------------------------------------

// What the recorder does:
//   size, fps     the video's size ("1920x1080") and frame rate (60 to
//                 begin with; 30 is lighter on the PC)
//   game, mic     the game's sound and the microphone's, 0 - 100 (the mic
//                 to 150, as some are quiet)
//   micOn         the microphone in the recording at all
//   recDot        a small REC dot on the game window while recording (off:
//                 the projector stays clean)
//   keepReplays   the cameras' own instant replays keep running while
//                 recording (off: they pause, as every encoder counts and
//                 the session has the swing in it)
//   what          what's recorded (RECORD_WHAT): asked each time Record's
//                 pressed, the screen as it is, or the scene picked
//   lastWhat      what was recorded last ("screen" or "scene"): what voice
//                 records when it's set to ask (it can't be asked)
//   monitor       on the game window while recording: "off", or "box" -
//                 a box showing what's being recorded (monitorView)
//   format        "small": H.265 where the graphics card can (about half
//                 the size), or "anywhere": H.264, which every player
//                 opens (RECORD_FORMATS)
//   v             which version of these the settings were saved by
export const VIDEO_DEFAULTS = { size: "1920x1080", fps: 60, game: 100, mic: 100, micOn: false, recDot: false, keepReplays: false, quality: "best", what: "ask", lastWhat: "scene", monitor: "off", format: "small" };

// What a recording is of (the owner: "when we hit record, we need to pick
// how it is recording? Full screen or a scene?"): the game window just as
// it shows - its own numbers, cards and messages too - or one of the
// recording's scenes (sim/videolayout.mjs), laid out for the video.
export const RECORD_WHAT = ["ask", "screen", "scene"];
export const RECORD_WHAT_NAMES = { ask: "Ask each time", screen: "Full screen (what the screen shows)", scene: "The scene picked in Layout" };

// What's being recorded, on the game window (the owner: "Can the game
// screen show the recording screen (flick between the two) so I can see
// what is being recorded even if I have in a smaller box"): a box over the
// game while recording (the monitor setting), and the whole window flicked
// to the recording's picture and back (Shift + Q: full).
export const MONITORS = ["off", "box"];
export const MONITOR_NAMES = { off: "Nothing (the projector stays clean)", box: "A box showing what's being recorded" };

// What the game window shows of the recording now: "none", "box" or
// "full". Never while recording full screen - the window is what's
// recorded, and the recording would be in it, inside itself - nor in the
// game's own video (reel), which has the window to itself.
export function monitorView(settings, { full = false, recording = false, what = "scene", reel = false } = {}) {
  if (reel || (recording && what === "screen")) return "none";
  if (full) return "full";
  return recording && settings?.monitor === "box" ? "box" : "none";
}
export const SETTINGS_VERSION = 2;
export const MIC_MAX = 150;

const num = (v, lo, hi, dflt) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};

// Settings made sensible. Those saved before version 2 had a mode
// (session, per shot or both) and a shot clip's seconds, which are simply
// left behind; and 30 fps, then the default the panel saved with every
// change, becomes 60, the owner's choice of default - 30 is picked again
// in the panel.
export function cleanVideoSettings(s) {
  const src = s && typeof s === "object" ? s : {};
  const old = src.v !== SETTINGS_VERSION;
  const size = OUTPUT_SIZES.some((o) => `${o.w}x${o.h}` === src.size) ? src.size : VIDEO_DEFAULTS.size;
  return {
    size,
    fps: OUTPUT_FPS.includes(src.fps) && !(old && src.fps === 30) ? src.fps : VIDEO_DEFAULTS.fps,
    game: Math.round(num(src.game, 0, 100, VIDEO_DEFAULTS.game)),
    mic: Math.round(num(src.mic, 0, MIC_MAX, VIDEO_DEFAULTS.mic)),
    micOn: src.micOn === true,
    recDot: src.recDot === true,
    keepReplays: src.keepReplays === true,
    quality: src.quality === "standard" || src.quality === "compact" ? src.quality : "best",
    what: RECORD_WHAT.includes(src.what) ? src.what : VIDEO_DEFAULTS.what,
    lastWhat: src.lastWhat === "screen" ? "screen" : "scene",
    monitor: MONITORS.includes(src.monitor) ? src.monitor : VIDEO_DEFAULTS.monitor,
    format: RECORD_FORMATS.includes(src.format) ? src.format : VIDEO_DEFAULTS.format,
    v: SETTINGS_VERSION,
  };
}

// How a recording starts, from what's set: { ask: true } - the picker
// (recordchoice.js) - or { what, scene } straight away. by: "button" (the
// Record button, Shift + V, the menu, the panel: someone's at a screen to
// pick) or "voice" (nobody to click: what was recorded last).
export function startHow(settings, { by = "button", active = null } = {}) {
  const what = settings?.what ?? VIDEO_DEFAULTS.what;
  if (what === "ask" && by !== "voice") return { ask: true };
  const pick = what === "ask" ? (settings?.lastWhat === "screen" ? "screen" : "scene") : what;
  return pick === "screen" ? { what: "screen" } : { what: "scene", scene: active };
}

// The picker's choices: the screen first, then each scene, the one picked
// in Layout first among them (and the one recorded last said so). [{ what,
// scene?, name, note }].
export function recordChoices(layouts, settings = {}) {
  const list = layouts?.layouts ?? [];
  const active = layouts?.active;
  const scenes = [...list.filter((l) => l.id === active), ...list.filter((l) => l.id !== active)];
  return [
    { what: "screen", name: "Full screen", note: `What the screen shows - the game with its own numbers, cards and messages${settings.lastWhat === "screen" ? " (last time)" : ""}` },
    ...scenes.map((l) => ({ what: "scene", scene: l.id, name: `Scene: ${l.name}`, note: l.id === active ? `The scene picked in Layout${settings.lastWhat !== "screen" ? " (last time)" : ""}` : "" })),
  ];
}

// The choice a box's answer names (the button's value: its place in the
// list), or null - Cancel, clicking off it, or Esc, which answers nothing
// at all ("", which as a number is 0: the first choice).
export function choiceFor(choices, value) {
  return typeof value === "string" && /^\d+$/.test(value) ? (choices?.[Number(value)] ?? null) : null;
}

export function sizeOf(settings) {
  const [w, h] = String(settings?.size ?? VIDEO_DEFAULTS.size).split("x").map(Number);
  return { w: w || 1920, h: h || 1080 };
}

// ---- Format and bitrate ---------------------------------------------------------------

// The owner: "file size is massive, can we not have a more effective file
// size and compression?" H.265 (HEVC) in MP4 first, where the graphics
// card can encode it (a GTX 1070 can; Chromium says so only when the card
// can): much the same picture in about half the bits. Then H.264 in MP4:
// what YouTube, phones and Windows' own player all take, and on Windows
// the A-Squared Golf app (Electron's Chromium) can hand it to the graphics
// card's encoder. Then WebM. Not plain "video/mp4": a Chromium without
// H.264 answers that with VP9 in MP4, which Windows' own players won't
// open. H.265 is named with its profile (Main), as Chromium only takes
// it so.
export const HEVC = "hvc1.1.6.L153.B0";
export const VIDEO_TYPES = [
  { mime: `video/mp4;codecs=${HEVC},mp4a.40.2`, ext: "mp4", audio: true, codec: "hevc" },
  { mime: `video/mp4;codecs=${HEVC},opus`, ext: "mp4", audio: true, codec: "hevc" },
  { mime: `video/mp4;codecs=${HEVC}`, ext: "mp4", audio: false, codec: "hevc" },
  { mime: "video/mp4;codecs=avc1,mp4a.40.2", ext: "mp4", audio: true, codec: "avc" },
  { mime: "video/mp4;codecs=avc1,opus", ext: "mp4", audio: true, codec: "avc" },
  { mime: "video/mp4;codecs=avc1", ext: "mp4", audio: false, codec: "avc" },
  { mime: "video/webm;codecs=vp9,opus", ext: "webm", audio: true, codec: "vp9" },
  { mime: "video/webm;codecs=vp8,opus", ext: "webm", audio: true, codec: "vp8" },
  { mime: "video/webm;codecs=vp9", ext: "webm", audio: false, codec: "vp9" },
  { mime: "video/webm;codecs=vp8", ext: "webm", audio: false, codec: "vp8" },
  { mime: "video/webm", ext: "webm", audio: null, codec: null },
];

// The Format choice: smaller files (H.265 where the card can, else H.264)
// or H.264, which plays anywhere - Windows' own Media Player opens H.265
// only with Microsoft's HEVC Video Extensions (VLC, YouTube, phones and
// the game take it as it is).
export const RECORD_FORMATS = ["small", "anywhere"];
export const RECORD_FORMAT_NAMES = { small: "Smaller files (H.265)", anywhere: "Plays anywhere (H.264)" };

// The type to record in: the first MediaRecorder takes, with sound or
// without as asked, H.265 only for format "small". isSupported:
// MediaRecorder.isTypeSupported. Returns { mime, ext, codec } or null.
export function pickVideoType(isSupported, { audio = true, format = "small" } = {}) {
  for (const t of VIDEO_TYPES) {
    if (t.audio !== null && t.audio !== audio) continue;
    if (t.codec === "hevc" && format !== "small") continue;
    try {
      if (isSupported(t.mime)) return { mime: t.mime, ext: t.ext, codec: t.codec };
    } catch {
      // Asking threw: not that one.
    }
  }
  return null;
}

// How much of the usual bitrate each quality keeps. Best is today's
// picture (about 5.5 GB an hour at 1080p60 in H.264, 3 in H.265).
// Standard is half, Compact about a third.
export const RECORD_QUALITY = { best: 1, standard: 0.5, compact: 0.33 };

// H.265's share of H.264's bits for much the same picture.
export const HEVC_SHARE = 0.55;

// Bits a second, for H.264: about 12 Mbps at 1080p60, 8 at 1080p30, 6 at
// 720p, 20 at 1440p60 and 14 at 1440p30 - enough for a clean YouTube
// upload of a moving picture. Other sizes in proportion to their pixels,
// within 3 - 24 Mbps. H.265 (codec "hevc") takes HEVC_SHARE of that.
// quality: "best", "standard" or "compact".
export function videoBitrate(w, h, fps, quality = "best", codec = "avc") {
  const key = `${w}x${h}@${fps >= 45 ? 60 : 30}`;
  const table = { "1920x1080@60": 12e6, "1920x1080@30": 8e6, "1280x720@60": 6e6, "1280x720@30": 6e6, "2560x1440@60": 20e6, "2560x1440@30": 14e6 };
  const scale = RECORD_QUALITY[quality] ?? 1;
  const raw = table[key] ?? (Math.max(1, w) * Math.max(1, h)) / (1920 * 1080) * (fps >= 45 ? 12e6 : 8e6);
  const bits = Math.min(24e6, Math.max(3e6, raw * scale)) * (codec === "hevc" ? HEVC_SHARE : 1);
  return Math.round(bits / 1e5) * 1e5;
}
// The sound's: plenty for the game and a voice.
export const AUDIO_BITRATE = 160_000;

// A key frame (a whole picture) every 4 seconds, not Chromium's every 100
// frames (1.7 s at 60): each costs many times the frames between, so the
// same bits buy a better picture. A player's seek lands within 4 s.
export const KEY_FRAME_MS = 4000;

// About how many bytes an hour, for the panel.
export const bytesPerHour = (w, h, fps, quality = "best", codec = "avc") => ((videoBitrate(w, h, fps, quality, codec) + AUDIO_BITRATE) / 8) * 3600;

// ---- The sound -------------------------------------------------------------------------

// The gains of the mix: the game's sound (after its own volume settings,
// as the speakers hear it) and the microphone's, from the panel's 0 - 100
// (mic 0 - 150), on the same curve as the Sound settings (volumeGain: the
// square, so the slider's middle sounds like half). No microphone, or not
// ticked: nothing from it.
export function mixGains({ game = 100, mic = 100, micOn = false, hasMic = false } = {}) {
  const g = volumeGain(num(game, 0, 100, 100) / 100);
  const m = num(mic, 0, MIC_MAX, 100) / 100;
  return { game: g, mic: micOn && hasMic ? m * m : 0 };
}

// ---- The encoders ---------------------------------------------------------------------------

// How many video encoders are busy while recording: one for the session,
// and two for each camera's replay unless they're paused. NVIDIA's
// consumer cards (a GTX 1070) run only a few hardware encodes at once -
// three to five, by driver - so beyond that Chromium falls back to
// encoding on the processor.
export function encoderCount({ replayCams = 0, keepReplays = false, recording = true } = {}) {
  const composed = recording ? 1 : 0;
  const replays = !recording || keepReplays ? replayCams * 2 : 0;
  return { composed, replays, total: composed + replays };
}
export const NVENC_SESSIONS = 3;

// ---- Keeping an eye on the game's frame rate ---------------------------------------------------

// Whether recording is slowing the game down, from the FrameMeter's
// frames a second: the usual rate is learnt while not recording (a slow
// average, so a hitch doesn't count), and while recording a rate well
// below it - under 80% and 8 fps down - held for a few seconds is said,
// with what to try. The recording's own rate matters too: a game drawing
// 40 fps can't give a 60 fps video.
export class PerfWatch {
  constructor({ holdMs = 4000 } = {}) {
    this.holdMs = holdMs;
    this.baseline = null;
    this.slowSince = null;
  }

  // A reading (fps) at time now (ms). Returns the hint, or null.
  feed(fps, now, { recording = false, size = "1920x1080", rate = VIDEO_DEFAULTS.fps } = {}) {
    if (!Number.isFinite(fps) || fps <= 0) return null;
    if (!recording) {
      this.slowSince = null;
      this.baseline = this.baseline == null ? fps : this.baseline * 0.95 + fps * 0.05;
      return null;
    }
    const base = this.baseline ?? Math.max(fps, rate);
    const slow = fps < base * 0.8 && fps < base - 8;
    const short = fps < rate * 0.85;
    if (!slow && !short) {
      this.slowSince = null;
      return null;
    }
    this.slowSince ??= now;
    if (now - this.slowSince < this.holdMs) return null;
    return perfHint({ fps, baseline: base, size, rate });
  }
}

// What to say: "Recording at 1080p60 is slowing the game (38 fps, usually
// 60) - try 30 fps or 720p".
export function perfHint({ fps, baseline, size, rate }) {
  const [w, h] = String(size).split("x").map(Number);
  const name = OUTPUT_SIZES.find((o) => o.w === w && o.h === h)?.name ?? size;
  const tries = [];
  if (rate > 30) tries.push("30 fps");
  if (h > 720) tries.push("720p");
  if (!tries.length) tries.push(`${GRAPHICS_NAMES.standard} graphics (menu)`);
  const usual = Number.isFinite(baseline) ? `, usually ${Math.round(baseline)}` : "";
  return `Recording at ${name}${rate} is slowing the game (${Math.round(fps)} fps${usual}) - try ${tries.join(" or ")}`;
}
