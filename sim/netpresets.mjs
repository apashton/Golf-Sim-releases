// Online play: the host's game settings saved by name ("Sunday four-ball:
// Sea Links, stableford, handicaps on") and picked again in one go (the
// owner's "the host's game settings saved as presets"). Kept on the host's
// own PC or phone, nothing on the relay. A preset is what the Online play
// panel starts (what to play) and the course panel's game for it.
//
// preset: { name, what, courseId, courseName, settings: { format, handicaps,
//           tees, pins, wind, temp, sky, reads, madeUp, skills, carry } }

export const MAX_PRESETS = 12;
const NAME = 40;
// The course panel's settings a preset keeps (and nothing else of them).
export const PRESET_KEYS = ["format", "handicaps", "tees", "pins", "wind", "temp", "sky", "reads", "madeUp", "skills", "carry"];

const clip = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const plain = (v) => v === null || ["string", "number", "boolean"].includes(typeof v) || (typeof v === "object" && JSON.stringify(v).length < 400);

export function cleanPreset(p) {
  if (!p || typeof p !== "object") return null;
  const name = clip(p.name, NAME);
  if (!name) return null;
  const settings = {};
  for (const k of PRESET_KEYS) if (p.settings && k in p.settings && plain(p.settings[k])) settings[k] = p.settings[k];
  return { name, what: clip(p.what, 40) || "course", courseId: clip(p.courseId, 80) || null, courseName: clip(p.courseName, 60) || null, settings };
}

export function cleanPresets(list) {
  const seen = new Set();
  const out = [];
  for (const p of Array.isArray(list) ? list : []) {
    const c = cleanPreset(p);
    if (!c || seen.has(c.name.toLowerCase())) continue;
    seen.add(c.name.toLowerCase());
    out.push(c);
  }
  return out.slice(0, MAX_PRESETS);
}

// The list with `preset` saved: a preset of the same name is replaced; the
// newest first.
export function savePreset(list, preset) {
  const p = cleanPreset(preset);
  if (!p) return cleanPresets(list);
  return cleanPresets([p, ...cleanPresets(list).filter((q) => q.name.toLowerCase() !== p.name.toLowerCase())]);
}

export function removePreset(list, name) {
  return cleanPresets(list).filter((q) => q.name.toLowerCase() !== String(name ?? "").toLowerCase());
}

// A preset made from what's set now: what the Online play panel starts and
// the course panel's settings and course.
export function presetOf(name, { what = "course", course = null, settings = {} } = {}) {
  return cleanPreset({ name, what, courseId: course?.id ?? null, courseName: course?.name ?? null, settings: Object.fromEntries(PRESET_KEYS.filter((k) => k in settings).map((k) => [k, settings[k]])) });
}

// "Sea Links, stableford" - what it starts, in a few words.
export function presetWords(p, { formatName = (f) => f, whatName = (w) => w } = {}) {
  if (!p) return "";
  if (p.what !== "course") return whatName(p.what);
  return [p.courseName ?? "the course", p.settings?.format ? formatName(p.settings.format) : null].filter(Boolean).join(", ");
}
