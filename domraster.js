// A piece of the page drawn into a canvas as it shows, for the recording
// (compositor.js): the recording copies the game's picture and draws over
// it what the game window has over its picture - here the cards made of the
// page's boxes and words, the scorecard after each hole and on the cart's
// screen (the owner, 26 October 2026: "The scorecard whilst showing on the
// game screen doesn't show on the record screen"). Each box and word is
// drawn where the page laid it out, from its computed style
// (sim/domraster.mjs reads those): backgrounds (a colour, a linear or
// radial gradient), borders, an outline, rounded corners, opacity and the
// words in their own font and colour - and a canvas or a drawn icon (svg)
// as it shows, for the hole editor the game's video records (showreel.js).
// Not a whole browser: no shadows, other pictures or ::before words - none
// of which the cards need.

import { parseColour, colourText, cornerRadius, gradientOf, gradientGeometry } from "./sim/domraster.mjs";

// A rounded box's path.
function shape(g, b, r) {
  g.beginPath();
  if (r > 0 && g.roundRect) g.roundRect(b.x, b.y, b.w, b.h, r);
  else g.rect(b.x, b.y, b.w, b.h);
}

function fillGradient(g, grad, b) {
  const geo = gradientGeometry(grad, b);
  const fill =
    grad.kind === "linear"
      ? g.createLinearGradient(b.x + geo.x0, b.y + geo.y0, b.x + geo.x1, b.y + geo.y1)
      : g.createRadialGradient(b.x + geo.cx, b.y + geo.cy, 0, b.x + geo.cx, b.y + geo.cy, Math.max(1, geo.r));
  for (const s of grad.stops) fill.addColorStop(s.at, colourText(s.colour));
  g.fillStyle = fill;
  g.fill();
}

// A box's background, borders and outline.
function paintBox(g, cs, b) {
  if (!(b.w > 0) || !(b.h > 0)) return;
  const radius = cornerRadius(cs.borderTopLeftRadius, b);
  const bg = parseColour(cs.backgroundColor);
  const grad = cs.backgroundImage && cs.backgroundImage !== "none" ? gradientOf(cs.backgroundImage) : null;
  if ((bg && bg[3] > 0) || grad) {
    shape(g, b, radius);
    if (bg && bg[3] > 0) {
      g.fillStyle = colourText(bg);
      g.fill();
    }
    if (grad) fillGradient(g, grad, b);
  }
  // Borders: all four alike round a rounded box, else each side as a strip
  // (the scorecard's rows have only a line under them).
  const sides = ["Top", "Right", "Bottom", "Left"].map((s) => ({
    w: cs[`border${s}Style`] === "none" ? 0 : parseFloat(cs[`border${s}Width`]) || 0,
    c: parseColour(cs[`border${s}Color`]),
  }));
  const seen = sides.filter((s) => s.w > 0 && s.c && s.c[3] > 0);
  if (seen.length === 4 && radius > 0 && sides.every((s) => s.w === sides[0].w)) {
    const w = sides[0].w;
    shape(g, { x: b.x + w / 2, y: b.y + w / 2, w: b.w - w, h: b.h - w }, Math.max(0, radius - w / 2));
    g.lineWidth = w;
    g.strokeStyle = colourText(sides[0].c);
    g.stroke();
  } else if (seen.length) {
    const [t, r, bt, l] = sides;
    const strip = (s, x, y, w, h) => {
      if (!(s.w > 0) || !s.c || s.c[3] <= 0) return;
      g.fillStyle = colourText(s.c);
      g.fillRect(x, y, w, h);
    };
    strip(t, b.x, b.y, b.w, t.w);
    strip(bt, b.x, b.y + b.h - bt.w, b.w, bt.w);
    strip(l, b.x, b.y, l.w, b.h);
    strip(r, b.x + b.w - r.w, b.y, r.w, b.h);
  }
  // An outline (the hole being played, on the scorecard).
  const ow = cs.outlineStyle && cs.outlineStyle !== "none" ? parseFloat(cs.outlineWidth) || 0 : 0;
  const oc = parseColour(cs.outlineColor);
  if (ow > 0 && oc && oc[3] > 0) {
    const off = (parseFloat(cs.outlineOffset) || 0) + ow / 2;
    g.lineWidth = ow;
    g.strokeStyle = colourText(oc);
    g.strokeRect(b.x - off, b.y - off, b.w + off * 2, b.h + off * 2);
  }
}

// A run of words, each where the page put it (so wrapping, alignment and
// the table's columns come out as they show).
function paintText(g, node, cs, toBox, clip) {
  const text = node.data;
  if (!text || !text.trim()) return;
  const colour = parseColour(cs.color);
  if (!colour || colour[3] <= 0) return;
  g.save();
  if (clip) {
    g.beginPath();
    g.rect(clip.x, clip.y, clip.w, clip.h);
    g.clip();
  }
  g.fillStyle = colourText(colour);
  g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  if ("letterSpacing" in g) g.letterSpacing = cs.letterSpacing && cs.letterSpacing !== "normal" ? cs.letterSpacing : "0px";
  g.textAlign = "left";
  g.textBaseline = "middle";
  const upper = cs.textTransform === "uppercase";
  const range = node.ownerDocument.createRange();
  const words = /\S+/g;
  let m;
  while ((m = words.exec(text))) {
    range.setStart(node, m.index);
    range.setEnd(node, m.index + m[0].length);
    const r = range.getClientRects()[0];
    if (!r || !(r.width > 0)) continue;
    const b = toBox(r);
    g.fillText(upper ? m[0].toUpperCase() : m[0], b.x, b.y + b.h / 2);
  }
  g.restore();
}

// A drawn icon (an svg in the page) as a picture, once it's loaded: null
// till then (the next drawing has it). Kept by its markup.
const svgs = new Map();
function svgPicture(node) {
  const view = node.ownerDocument.defaultView;
  const text = new view.XMLSerializer().serializeToString(node);
  let img = svgs.get(text);
  if (!img) {
    if (svgs.size > 200) svgs.clear();
    img = new view.Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
    svgs.set(text, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

// Inside a box's border and padding: where a canvas's picture goes.
function contentBox(cs, b) {
  const n = (v) => parseFloat(v) || 0;
  const l = n(cs.borderLeftWidth) + n(cs.paddingLeft);
  const t = n(cs.borderTopWidth) + n(cs.paddingTop);
  const r = n(cs.borderRightWidth) + n(cs.paddingRight);
  const bt = n(cs.borderBottomWidth) + n(cs.paddingBottom);
  return { x: b.x + l, y: b.y + t, w: Math.max(0, b.w - l - r), h: Math.max(0, b.h - t - bt) };
}

// The element `el` drawn at its own size (its CSS pixels, before any
// transform - the cart's screen is scaled to fit the screen in the picture)
// times `scale`, into a canvas of its own: { canvas, w, h, live }, or null
// if it isn't laid out. live: the canvases in it left out, and listed
// instead ({ el, box (in its CSS pixels), alpha }) for the caller to draw
// as they are each time (the hole editor's map, moving as it's used),
// rather than as they were when this was drawn.
export function rasterize(el, { scale = 1, live = false } = {}) {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const R = el.getBoundingClientRect();
  if (!(w > 0) || !(h > 0) || !(R.width > 0)) return null;
  // Its own transform's scale, taken back out.
  const k = R.width / w;
  const toBox = (r) => ({ x: (r.left - R.left) / k, y: (r.top - R.top) / k, w: r.width / k, h: r.height / k });
  const doc = el.ownerDocument;
  const canvas = doc.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(w * scale));
  canvas.height = Math.max(1, Math.ceil(h * scale));
  const g = canvas.getContext("2d");
  g.scale(scale, scale);
  const view = doc.defaultView;
  const canvases = live ? [] : null;
  const walk = (node, alpha, clip) => {
    const cs = view.getComputedStyle(node);
    if (cs.display === "none") return;
    // (The element's own opacity is the caller's: it changes as it fades.)
    const a = node === el ? alpha : alpha * (Number(cs.opacity) || 0);
    if (a <= 0.004) return;
    const box = toBox(node.getBoundingClientRect());
    const shown = cs.visibility !== "hidden" || node === el;
    if (shown) {
      g.save();
      g.globalAlpha = a;
      paintBox(g, cs, box);
      g.restore();
    }
    // A canvas, or a drawn icon: its picture, as it shows now.
    const tag = node.localName;
    if (tag === "canvas" || tag === "svg") {
      if (!shown) return;
      const at = tag === "canvas" ? contentBox(cs, box) : box;
      if (tag === "canvas" && canvases) canvases.push({ el: node, box: at, alpha: a });
      else {
        const src = tag === "canvas" ? node : svgPicture(node);
        if (src && at.w > 0 && at.h > 0 && (tag !== "canvas" || (node.width > 0 && node.height > 0))) {
          g.save();
          g.globalAlpha = a;
          g.drawImage(src, at.x, at.y, at.w, at.h);
          g.restore();
        }
      }
      return;
    }
    // Words cut off where the box cuts them (a long name in its column).
    const inner = cs.overflow === "hidden" || cs.overflowX === "hidden" ? box : clip;
    for (const child of node.childNodes) {
      if (child.nodeType === 1) walk(child, a, inner);
      else if (child.nodeType === 3 && shown) {
        g.save();
        g.globalAlpha = a;
        paintText(g, child, cs, toBox, inner);
        g.restore();
      }
    }
  };
  walk(el, 1, null);
  return { canvas, w, h, live: canvases ?? [] };
}
