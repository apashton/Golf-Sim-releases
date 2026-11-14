// The webcams (public/cameras.js owns them): which ones the owner has
// chosen and what each is called, how each is asked for, what a failure to
// open one means in plain English, and how its replays are encoded. Pure,
// for the page and the tests.
//
// A camera is remembered by its deviceId, with its label as a fallback:
// Windows gives a webcam a new deviceId now and then (another USB port, a
// driver update), and a label like "Logitech BRIO (046d:085e)" usually
// survives that.

import { cleanSwingReplay } from "./swingreplay.mjs";
import { cleanView } from "./camview.mjs";

// The sizes offered, and the frame rates. 1280x720 at 60 by default: ideal,
// not exact, so a camera that can't do 60 gives its best (usually 30).
export const RESOLUTIONS = [
  { w: 1920, h: 1080, name: "1080p" },
  { w: 1280, h: 720, name: "720p" },
  { w: 854, h: 480, name: "480p" },
];
export const FRAME_RATES = [60, 30];
export const CAMERA_DEFAULTS = { width: 1280, height: 720, fps: 60 };
// At most this many cameras at once: each costs two encoders while replay
// is on (see sim/clips.mjs), and a GTX 1070 has a handful.
export const MAX_CAMERAS = 4;

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// A camera's settings made sensible: { id, deviceId, label, name, on,
// width, height, fps, replay, view }, or null for anything that isn't one.
export function cleanCamera(c) {
  if (!c || typeof c !== "object") return null;
  const id = /^[a-z0-9-]{1,24}$/.test(c.id ?? "") ? c.id : null;
  const deviceId = str(c.deviceId, 256);
  const label = str(c.label, 200);
  if (!id || (!deviceId && !label)) return null;
  const res = RESOLUTIONS.find((r) => r.w === c.width && r.h === c.height) ?? { w: CAMERA_DEFAULTS.width, h: CAMERA_DEFAULTS.height };
  return {
    id,
    deviceId,
    label,
    name: str(c.name, 40) || "Camera",
    on: c.on !== false,
    width: res.w,
    height: res.h,
    fps: FRAME_RATES.includes(c.fps) ? c.fps : CAMERA_DEFAULTS.fps,
    replay: c.replay !== false,
    // Where its picture shows (the owner: "options to be able to remove
    // from either"): a box in the command centre (the controls window),
    // and the shot data screen's camera column. Off in both, it still
    // records its replays.
    centre: c.centre !== false,
    shotScreen: c.shotScreen !== false,
    // Turned and cropped (sim/camview.mjs): { rotate, crop }.
    view: cleanView(c.view),
  };
}

// Everything kept about the cameras: the list, whether instant replay is
// on at all, the microphone - null in phase 1, kept for the recorder that
// will want one - and the swing replay on the game window (which one or two
// cameras, its speed, times round and place: sim/swingreplay.mjs). Settings
// kept before there was a swing replay get its defaults.
export function cleanCameraSettings(s) {
  const src = s && typeof s === "object" ? s : {};
  const seen = new Set();
  const cams = [];
  for (const c of Array.isArray(src.cams) ? src.cams : []) {
    const cam = cleanCamera(c);
    if (!cam || seen.has(cam.id)) continue;
    seen.add(cam.id);
    cams.push(cam);
    if (cams.length >= MAX_CAMERAS) break;
  }
  const mic = src.mic && typeof src.mic === "object" ? { deviceId: str(src.mic.deviceId, 256), label: str(src.mic.label, 200) } : null;
  return { cams, replay: src.replay !== false, mic: mic && (mic.deviceId || mic.label) ? mic : null, swing: cleanSwingReplay(src.swing, cams.map((c) => c.id)) };
}

// A new camera's id, not one already used: c1, c2...
export function newCameraId(cams) {
  const used = new Set(cams.map((c) => c.id));
  for (let i = 1; ; i++) if (!used.has(`c${i}`)) return `c${i}`;
}

// A name for a camera nobody has named yet: the usual golf angles first.
export const ANGLE_NAMES = ["Face on", "Down the line", "Behind", "Overhead"];
export function defaultName(cams) {
  const used = new Set(cams.map((c) => c.name));
  return ANGLE_NAMES.find((n) => !used.has(n)) ?? `Camera ${cams.length + 1}`;
}

// Which of the video inputs present (enumerateDevices: { deviceId, label,
// kind }) a chosen camera is: its own deviceId if that's still there, else
// the one with its label - unless that one is taken by another chosen
// camera (two identical webcams share a label). Null when it's unplugged.
export function matchDevice(cam, devices, taken = new Set()) {
  const video = devices.filter((d) => d.kind === "videoinput" && !taken.has(d.deviceId));
  if (cam.deviceId) {
    const byId = video.find((d) => d.deviceId === cam.deviceId);
    if (byId) return byId;
  }
  if (cam.label) {
    const byLabel = video.find((d) => d.label && d.label === cam.label);
    if (byLabel) return byLabel;
  }
  return null;
}

// Every chosen camera matched to a device at once, so two cameras never
// claim the same one: by deviceId first for all, then by label.
// Returns Map(cam.id -> device).
export function matchAll(cams, devices) {
  const out = new Map();
  const taken = new Set();
  for (const cam of cams) {
    const d = cam.deviceId && devices.find((x) => x.kind === "videoinput" && x.deviceId === cam.deviceId);
    if (d) {
      out.set(cam.id, d);
      taken.add(d.deviceId);
    }
  }
  for (const cam of cams) {
    if (out.has(cam.id)) continue;
    const d = matchDevice({ ...cam, deviceId: "" }, devices, taken);
    if (d) {
      out.set(cam.id, d);
      taken.add(d.deviceId);
    }
  }
  return out;
}

// What getUserMedia is asked for. Ideal, not exact: a camera that can't do
// the size or rate gives the nearest it can rather than failing. Video
// only - the microphone is the recorder's business (phase 2).
export function constraintsFor(cam, deviceId = cam.deviceId) {
  return {
    audio: false,
    video: {
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      width: { ideal: cam.width },
      height: { ideal: cam.height },
      frameRate: { ideal: cam.fps },
    },
  };
}

// Why a camera didn't open, in words for the owner. The one that matters
// most on Windows: a webcam can only be open in one program at a time, so
// with another program holding it Chromium says NotReadableError.
export function cameraProblem(err) {
  const name = err?.name ?? "";
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError")
    return { code: "busy", text: "in use by another program - close that program, or stop it using this camera" };
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError")
    return { code: "denied", text: "not allowed - camera access was refused for A² Golf (Windows Settings → Privacy → Camera)" };
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError")
    return { code: "missing", text: "not found - is it plugged in?" };
  if (name === "unsupported") return { code: "unsupported", text: "cameras need the A² Golf app, or a browser at localhost" };
  return { code: "error", text: `couldn't be opened${err?.message ? ` (${String(err.message).slice(0, 120)})` : ""}` };
}

// The recording format for replays: H.264 in MP4 where MediaRecorder can
// (the Windows app: hardware encoded where the graphics card offers it, and
// what YouTube and every phone play), else WebM with VP9, then VP8.
// isSupported: MediaRecorder.isTypeSupported. Returns { mime, ext }, or
// null when nothing will do.
export const RECORDING_TYPES = [
  { mime: "video/mp4;codecs=avc1", ext: "mp4" },
  { mime: "video/mp4", ext: "mp4" },
  { mime: "video/webm;codecs=vp9", ext: "webm" },
  { mime: "video/webm;codecs=vp8", ext: "webm" },
  { mime: "video/webm", ext: "webm" },
];
export function pickRecordingType(isSupported) {
  for (const t of RECORDING_TYPES) {
    try {
      if (isSupported(t.mime)) return t;
    } catch {
      // Asking threw: not that one.
    }
  }
  return null;
}

// Bits per second for a replay: about 8 Mbps at 720p60, in proportion to
// the pixels a second, within 2 - 16 Mbps. Plenty for a swing played back
// slowly; small enough that five seconds is a few megabytes.
export function bitrateFor(width, height, fps) {
  const px = Math.max(1, width) * Math.max(1, height) * Math.max(1, fps);
  const bits = (8_000_000 * px) / (1280 * 720 * 60);
  return Math.round(Math.min(16_000_000, Math.max(2_000_000, bits)) / 100_000) * 100_000;
}

// What a camera is actually giving, from its track's getSettings(): "1280x720
// at 30 fps".
export function describeTrack(s) {
  if (!s || !s.width) return "";
  return `${s.width}x${s.height}${s.frameRate ? ` at ${Math.round(s.frameRate)} fps` : ""}`;
}

// The chosen microphone among those present: its deviceId, else its name
// ("default" and "communications" are Windows' stand-ins, only taken by id).
export function matchMic(mic, devices) {
  const list = devices.filter((d) => d.kind === "audioinput");
  return list.find((d) => mic.deviceId && d.deviceId === mic.deviceId) ?? list.find((d) => mic.label && d.label === mic.label && !["default", "communications"].includes(d.deviceId)) ?? null;
}

// Why a microphone didn't open, in the camera's words, but about the
// microphone.
export function micProblem(err) {
  const p = cameraProblem(err);
  return { ...p, text: p.text.replace("using this camera", "using this microphone").replace("Privacy → Camera", "Privacy → Microphone").replace("camera access", "microphone access").replace("cameras need", "a microphone needs") };
}
