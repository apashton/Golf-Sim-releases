// Small helpers shared across the pages: settings, number formats, and
// making text safe to put in a page.

// Settings live in the browser's storage; it can be missing (private window)
// or throw, so every read and write is guarded and falls back to defaults.
// A setting that's a plain value (true, a number) rather than an object
// comes back as it was kept, or as the default given.
//
// While the game's video plays (showreel.js) settings are held: whatever
// the page saves goes into `held` instead of the browser's storage, and is
// read back from there, so the page behaves as if it were saved while
// nothing the owner keeps is touched. The video ends by reloading the page,
// which forgets them.
let held = null;
export function holdSettings() {
  held ??= new Map();
}
export const settingsHeld = () => held !== null;
export function loadSetting(key, defaults) {
  const plain = defaults === null || typeof defaults !== "object";
  try {
    const raw = held?.has(key) ? held.get(key) : localStorage.getItem(`golfsim.${key}`);
    if (plain) return raw ? JSON.parse(raw) : defaults;
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return plain ? defaults : { ...defaults };
  }
}
export function saveSetting(key, value) {
  if (held) {
    held.set(key, JSON.stringify(value));
    return;
  }
  try {
    localStorage.setItem(`golfsim.${key}`, JSON.stringify(value));
  } catch {
    // Not saved; the setting still applies for this session.
  }
}

export function fmt(n, digits = 1) {
  return Number.isFinite(n) ? n.toFixed(digits) : "-";
}

// "3.2 R", "1.0 L" or "0.0" for a signed distance, right positive.
export function lr(value, digits = 1, unit = "") {
  const u = unit ? ` ${unit}` : "";
  if (Math.abs(value) < 0.5 * 10 ** -digits) return `0${u} - on line`;
  return `${fmt(Math.abs(value), digits)}${u} ${value > 0 ? "right" : "left"}`;
}

// Text made safe to put inside a page's HTML: a name or a course typed in
// with a < or & in it shows as typed, rather than breaking the page. Nothing
// (null or undefined) shows as nothing.
export function esc(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// A number typed into a box: blank or not a number keeps what it was, and
// it's kept within the box's range - so clearing the temperature doesn't
// quietly set 0°C.
export function numberOr(text, previous, min = -Infinity, max = Infinity) {
  const n = typeof text === "number" ? text : parseFloat(String(text ?? "").trim());
  if (!Number.isFinite(n)) return previous;
  return Math.min(max, Math.max(min, n));
}

// Whether someone's typing in a box on the page right now (a name, a code):
// a redraw on a timer or from the network then waits, rather than wiping
// what's half typed. doc: the page (document).
export function typingNow(doc = globalThis.document) {
  const el = doc?.activeElement;
  if (!el) return false;
  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName !== "INPUT") return false;
  return ["text", "search", "email", "number", "tel", "url", "password", ""].includes(String(el.type ?? "").toLowerCase());
}
