// The sums for drawing a piece of the page into a canvas (domraster.js):
// the page's computed styles read as numbers - a colour, a corner's
// radius, a gradient and where its colours fall. Pure.

// A computed colour ("rgb(1, 2, 3)", "rgba(1, 2, 3, 0.5)", the newer
// "rgb(1 2 3 / 0.5)", "transparent") as [r, g, b, a], or null if it's
// none of those.
export function parseColour(text) {
  const s = String(text ?? "").trim();
  if (!s || s === "transparent" || s === "none") return s === "transparent" ? [0, 0, 0, 0] : null;
  const m = /^rgba?\(([^)]*)\)$/i.exec(s);
  if (!m) return null;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const num = (p, scale) => (p.endsWith("%") ? (parseFloat(p) / 100) * scale : parseFloat(p));
  const [r, g, b] = parts.slice(0, 3).map((p) => num(p, 255));
  const a = parts.length > 3 ? num(parts[3], 1) : 1;
  if (![r, g, b, a].every(Number.isFinite)) return null;
  return [r, g, b, Math.max(0, Math.min(1, a))];
}

// A colour as canvas takes it.
export function colourText([r, g, b, a]) {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${+a.toFixed(3)})`;
}

// A corner's radius ("16px", "50%", "8px 12px" - its first) for a box
// { w, h }, in px, no more than half the box's shorter side.
export function cornerRadius(text, { w, h }) {
  const first = String(text ?? "0").trim().split(/\s+/)[0] ?? "0";
  const v = parseFloat(first);
  if (!Number.isFinite(v) || v <= 0) return 0;
  const px = first.endsWith("%") ? (v / 100) * Math.min(w, h) : v;
  return Math.min(px, w / 2, h / 2);
}

// Splits on the commas between a gradient's parts, not those inside its
// colours' brackets.
function topLevel(text) {
  const out = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "," && depth === 0) {
      out.push(text.slice(from, i).trim());
      from = i + 1;
    }
  }
  out.push(text.slice(from).trim());
  return out.filter(Boolean);
}

// The first gradient of a computed background-image, or null:
// { kind: "linear", angle (degrees, CSS's: 180 down), stops } or
// { kind: "radial", at: [fx, fy] (0 - 1 of the box), stops }; stops
// [{ colour: [r, g, b, a], at: 0 - 1 }], each placed (CSS's way: unplaced
// ones evenly between their neighbours).
export function gradientOf(text) {
  const s = String(text ?? "");
  const m = /(linear|radial)-gradient\((.*)\)/i.exec(s);
  if (!m) return null;
  const kind = m[1].toLowerCase();
  const parts = topLevel(m[2]);
  let angle = 180;
  let at = [0.5, 0.5];
  // The first part says the way (an angle, "to right", "ellipse at 50% 0%")
  // unless it starts with a colour.
  if (parts.length && !/^(rgba?\(|transparent\b|#|hsla?\(|color\()/i.test(parts[0])) {
    const way = parts.shift();
    if (kind === "linear") {
      const deg = /(-?[\d.]+)deg/.exec(way);
      if (deg) angle = parseFloat(deg[1]);
      else {
        const to = { top: 0, right: 90, bottom: 180, left: 270 };
        const words = way.replace(/^to\s+/, "").split(/\s+/);
        if (words.length === 1 && to[words[0]] != null) angle = to[words[0]];
        else if (words.length === 2) angle = ({ "top right": 45, "right top": 45, "bottom right": 135, "right bottom": 135, "bottom left": 225, "left bottom": 225, "top left": 315, "left top": 315 })[words.join(" ")] ?? 180;
      }
    } else {
      const pos = /at\s+([\d.]+)%\s+([\d.]+)%/.exec(way);
      if (pos) at = [parseFloat(pos[1]) / 100, parseFloat(pos[2]) / 100];
    }
  }
  const stops = [];
  for (const p of parts) {
    const cm = /^(rgba?\([^)]*\)|transparent)\s*([\d.]+%)?/i.exec(p);
    if (!cm) continue;
    const colour = parseColour(cm[1]);
    if (!colour) continue;
    stops.push({ colour, at: cm[2] != null ? parseFloat(cm[2]) / 100 : null });
  }
  if (stops.length < 2) return null;
  // Unplaced stops: the first at 0, the last at 1, the rest evenly between.
  if (stops[0].at == null) stops[0].at = 0;
  if (stops.at(-1).at == null) stops.at(-1).at = 1;
  for (let i = 1; i < stops.length - 1; i++) {
    if (stops[i].at != null) continue;
    let j = i;
    while (stops[j].at == null) j++;
    const from = stops[i - 1].at;
    const step = (stops[j].at - from) / (j - i + 1);
    for (let k = i; k < j; k++) stops[k].at = from + step * (k - i + 1);
  }
  for (const st of stops) st.at = Math.max(0, Math.min(1, st.at));
  return kind === "linear" ? { kind, angle, stops } : { kind, at, stops };
}

// Where a gradient runs in a box { w, h }: a linear one's start and end
// points (CSS's gradient line, through the middle at its angle, long enough
// to reach the corners); a radial one's centre and radius (to the farthest
// corner).
export function gradientGeometry(grad, { w, h }) {
  if (grad.kind === "linear") {
    const a = (grad.angle * Math.PI) / 180;
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
    return { x0: w / 2 - dx * half, y0: h / 2 - dy * half, x1: w / 2 + dx * half, y1: h / 2 + dy * half };
  }
  const cx = grad.at[0] * w;
  const cy = grad.at[1] * h;
  const r = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
  return { cx, cy, r };
}
