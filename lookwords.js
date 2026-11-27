// The words under a scene look (sim/scenelook.mjs): every words layer's
// numbers, labels and lines in the look's one typeface and colours (the
// owner, 23 November 2026: "a consistent type look across all scenes is
// needed"), drawn in the box inside its frame, on the look's plate
// (framedraw.js drawPlate, which the compositor draws under them) - so no
// backing, outline, corners or colours of the layer's own. Its text size,
// alignment, labels and units, and how its tiles are arranged, stay its
// own. Labels in capitals and spaced out, numbers in the typeface's number
// weight, units quieter beside them; a soft glow in the accent round the
// numbers where the look has one (the neon tube's). Words with no plate
// under them (a layer set to no backing: words only) get a soft shadow to
// read over the picture.
//
// compositor.js wordsFor draws a layer with these while a look is on; the
// look "own" draws each layer as it always has (compositor.js drawTiles,
// drawStat, drawLines, drawTitle).

import { textMul } from "./sim/layerstyle.mjs";
import { tileLayout } from "./sim/videotiles.mjs";
import { lookFont } from "./sim/scenelook.mjs";
import { drawDivider } from "./framedraw.js";
import { SHORT_NAME } from "./sim/clips.mjs";

// ---- Setting the type -------------------------------------------------------------------

// Letter spacing in pixels, where the canvas has it.
function spacing(g, px) {
  if ("letterSpacing" in g) g.letterSpacing = px > 0 ? `${px.toFixed(2)}px` : "0px";
}
// The look's type at a weight and size (px), spaced em of its size.
function setType(g, spec, weight, size, em = 0) {
  g.font = lookFont(spec, weight, size);
  spacing(g, em * size);
}
// A line's width as it's seen: measured unspaced, with the spacing between
// its letters added (none after the last) - the same in every browser.
function widthOf(g, text, size, em = 0) {
  if (!(em > 0) || !("letterSpacing" in g)) return g.measureText(text).width;
  const was = g.letterSpacing;
  g.letterSpacing = "0px";
  const w = g.measureText(text).width;
  g.letterSpacing = was;
  return w + Math.max(0, [...text].length - 1) * em * size;
}
// The biggest size (px, up to max) at which text fits width; the type left
// set at it.
function fitType(g, spec, text, weight, width, max, em = 0) {
  let size = Math.max(6, Math.floor(max));
  setType(g, spec, weight, size, em);
  const m = widthOf(g, text, size, em);
  if (m > width && m > 0) {
    size = Math.max(6, Math.floor((size * width) / m));
    setType(g, spec, weight, size, em);
  }
  return size;
}
const upper = (spec, text) => (spec.type.labelUpper ? String(text).toUpperCase() : String(text));
// Where a line of width tw starts in a box from x to x + w, aligned.
const alignedX = (align, x, w, tw) => (align === "center" ? x + (w - tw) / 2 : align === "right" ? x + w - tw : x);

// Over the picture with no plate: a soft shadow under the words. On the
// plate: none.
function shade(g, bare) {
  if (bare) {
    g.shadowColor = "rgba(0, 0, 0, 0.75)";
    g.shadowBlur = 6;
    g.shadowOffsetY = 2;
  } else {
    g.shadowColor = "transparent";
    g.shadowBlur = 0;
    g.shadowOffsetY = 0;
  }
}
// A number's glow in the accent (the look's, scaled with the picture), or
// the shade as above where it has none.
function glow(g, spec, k, bare) {
  const gl = spec.type.glow;
  if (!gl) return shade(g, bare);
  g.shadowColor = gl.colour;
  g.shadowBlur = gl.blur * k;
  g.shadowOffsetY = 0;
}

// A label: capitals, spaced, quiet.
function label(g, spec, text, x, y, size, bare) {
  const T = spec.type;
  setType(g, spec, T.labelWeight, size, T.labelSpacing);
  g.fillStyle = T.muted;
  shade(g, bare);
  g.fillText(text, x, y);
  spacing(g, 0);
}

// ---- The layers ---------------------------------------------------------------------------

// s: the layer's style (sim/videolayout.mjs cleanStyle, with lineScale: the
// picture's height against 1080, and from the compositor outerW, outerH:
// the layer's own box, frame and all - w and h are what's inside the
// frame); spec: the look (sim/scenelook.mjs lookSpec); bare: no plate
// under it (the layer's backing is none).
//
// The type's size comes from the layer's own box, not from what its frame
// leaves inside it, so a box's words are the same size in every look (the
// owner, 23 November 2026: "a consistent type look across all scenes") -
// "Alex · 7 iron" had been 22 pixels in broadcast glass and 14 in walnut's
// thick frame. The frame eats only the padding round the words; they go
// smaller only where they'd not fit inside it.

// The layer's own box (outer) and how much of it the frame takes each side.
function boxOf(s, w, h) {
  const OW = s.outerW > 0 ? s.outerW : w;
  const OH = s.outerH > 0 ? s.outerH : h;
  return { OW, OH, fx: Math.max(0, (OW - w) / 2), fy: Math.max(0, (OH - h) / 2) };
}
// How far in from the frame's inner edge words sit that would sit `want` in
// from the box's edge: the frame takes its part, but never more than half.
const inFrom = (want, frame) => Math.max(want - frame, want * 0.5);

// One size for a set of things each fitted on its own (every number in a
// strip of tiles, every label; the numbers in a grid of stat boxes): the
// smallest - but not under 0.8 of the middle one, so one long value
// doesn't shrink all the rest (it alone goes smaller). Mixed sizes in one
// strip read as amateur.
export function sharedSize(sizes) {
  const ok = [...sizes].filter((v) => v > 0).sort((a, b) => a - b);
  if (!ok.length) return 0;
  return Math.max(ok[0], ok[Math.floor((ok.length - 1) / 2)] * 0.8);
}

// A number as it's set: its figures big; what's said of them after
// ("0.2 open": open, "1.0 R": R) smaller in the text's colour; its unit -
// a degree raised beside the figures as a scoreboard has it (" °" on the
// line read as a stray full stop), any other quieter after them. Units only
// where the layer shows them.
export function valueParts(t, s) {
  const value = String(t.value ?? "");
  const m = /^([+\-−]?\d[\d.,]*)\s+(\S.*)$/.exec(value);
  const unit = s.units && t.unit ? String(t.unit) : "";
  return { num: m ? m[1] : value, word: m ? m[2] : "", unit, deg: unit.startsWith("°") };
}
// Its pieces at a number size v: the text, weight, size and ink of each.
function runParts(spec, p, v, k) {
  const T = spec.type;
  const out = [{ text: p.num, weight: T.numberWeight, size: v, ink: T.text, lit: true }];
  if (p.deg) out.push({ text: p.unit, weight: T.numberWeight, size: v * 0.55, ink: T.text, lit: true, gap: k, raise: true });
  if (p.word) out.push({ text: ` ${p.word}`, weight: T.labelWeight, size: v * 0.48, ink: T.text });
  if (p.unit && !p.deg) out.push({ text: ` ${p.unit}`, weight: T.labelWeight, size: v * 0.42, ink: T.muted });
  return out;
}
function runWidth(g, spec, parts) {
  let w = 0;
  for (const q of parts) {
    setType(g, spec, q.weight, q.size);
    w += (q.gap ?? 0) + g.measureText(q.text).width;
  }
  return w;
}
// The biggest number size (up to max) at which the whole run fits width.
function fitRun(g, spec, p, width, max, k) {
  let v = Math.max(6, Math.floor(max));
  for (let i = 0; i < 3; i++) {
    const w = runWidth(g, spec, runParts(spec, p, v, k));
    if (!(w > width) || v <= 6) break;
    v = Math.max(6, Math.floor((v * width) / w));
  }
  return v;
}
// The run drawn from x on the baseline: the figures (and a degree) glowing
// where the look's numbers glow, the rest shaded as words are.
function drawRun(g, spec, parts, x, base, k, bare) {
  let at = x;
  for (const q of parts) {
    g.save();
    setType(g, spec, q.weight, q.size);
    if (q.lit) glow(g, spec, k, bare);
    else shade(g, bare);
    g.fillStyle = q.ink;
    at += q.gap ?? 0;
    // (A degree's top level with the figures' tops.)
    const y = q.raise ? base - parts[0].size * 0.72 + q.size * 0.8 : base;
    g.fillText(q.text, at, y);
    at += g.measureText(q.text).width;
    g.restore();
  }
  shade(g, false);
}
// A label above a number and the number's figures, as a block: how tall
// (the label's line and the gap under it, the figures' height).
const blockOf = (v, l) => (l > 0 ? l * 1.45 : 0) + v * 0.72;

// The shot data tiles: one set under one plate and frame, each number in
// its own part of it, fine lines between them (framedraw.js drawDivider) -
// no box per tile. Arranged as the layer's own box has them
// (sim/videotiles.mjs), so the rows and columns are the same in every look,
// and every number in the set one size, every label one size.
export function lookTiles(g, tiles, w, h, H, s, spec, bare = false) {
  const T = spec.type;
  const k = s.lineScale ?? H / 1080;
  const { OW, OH } = boxOf(s, w, h);
  const { cols, rows } = tileLayout(tiles.length, OW, OH, s);
  // Each tile's part of what's inside the frame, and of the whole box (the
  // type's sized from that).
  const tw = w / cols;
  const th = h / rows;
  const twO = OW / cols;
  const thO = OH / rows;
  const pad = Math.max(4, Math.min(twO, thO) * 0.1);
  const m = textMul(s, s.labels ? thO * 0.5 : thO * 0.62);
  const vmax = (s.labels ? thO * 0.5 : thO * 0.62) * m;
  // (Labels never too small to read where there's room: 11 pixels of 1080p.)
  const lmax = Math.max(thO * 0.2 * m, Math.min(thO * 0.26, 11 * k));
  const room = Math.max(8, tw - pad * 2);
  // (The labels a little further off the lines between the tiles.)
  const lroom = Math.max(8, tw - pad * 3);
  const parts = tiles.map((t) => valueParts(t, s));
  const labels = tiles.map((t) => (s.labels ? upper(spec, t.label) : ""));
  // Every tile measured first, then one size for all the numbers and one
  // for all the labels.
  const vfit = parts.map((p) => fitRun(g, spec, p, room, vmax, k));
  const lfit = labels.map((text) => (text ? fitType(g, spec, text, T.labelWeight, lroom, lmax, T.labelSpacing) : 0));
  let V = sharedSize(vfit);
  let L = sharedSize(lfit);
  // Kept to a tile's height inside the frame.
  const most = th - 2 * Math.max(2 * k, Math.min(pad, th * 0.08));
  if (blockOf(V, L) > most) {
    const q = most / blockOf(V, L);
    V *= q;
    L *= q;
  }
  const block = blockOf(V, L);
  g.textBaseline = "alphabetic";
  g.textAlign = "left";
  for (let i = 0; i < tiles.length; i++) {
    const x = (i % cols) * tw;
    const y = Math.floor(i / cols) * th;
    const top = y + (th - block) / 2;
    const l = Math.min(L, lfit[i]);
    if (labels[i] && l > 0) {
      setType(g, spec, T.labelWeight, l, T.labelSpacing);
      const lw = widthOf(g, labels[i], l, T.labelSpacing);
      label(g, spec, labels[i], alignedX(s.align, x + pad * 1.5, lroom, lw), top + L * 0.8, l, bare);
    }
    const run = runParts(spec, parts[i], Math.min(V, vfit[i]), k);
    const rw = runWidth(g, spec, run);
    drawRun(g, spec, run, alignedX(s.align, x + pad, room, rw), top + block, k, bare);
  }
  shade(g, false);
  // The lines between them, on the plate (none over the bare picture): down
  // between each tile and the next in a row, across between the rows.
  if (bare) return;
  const n = tiles.length;
  for (let row = 0; row < rows; row++) {
    for (let col = 1; col < cols; col++) {
      if (row * cols + col >= n) break;
      const x = Math.round(col * tw);
      drawDivider(g, x, row * th + th * 0.18, x, (row + 1) * th - th * 0.18, spec, H);
    }
    if (row === 0) continue;
    const y = Math.round(row * th);
    for (let col = 0; col < cols; col++) {
      if (row * cols + col >= n) break;
      drawDivider(g, col * tw + tw * 0.1, y, (col + 1) * tw - tw * 0.1, y, spec, H);
    }
  }
}

// One number, big: its label small above, the number, its unit beside it.
// What it'd be drawn at alone: { vsize, lsize } - the compositor draws a
// set of stat boxes of one size shown together (the owner's eight in a
// grid) all at the set's (sharedSize), passed back as s.fitNumber and
// s.fitLabel.
function statPlan(g, t, w, h, H, s, spec) {
  const T = spec.type;
  const k = s.lineScale ?? H / 1080;
  const { OW, OH, fx, fy } = boxOf(s, w, h);
  const m = textMul(s, s.labels ? OH * 0.56 : OH * 0.72);
  const padO = Math.max(6, Math.min(OW, OH) * 0.12);
  const side = inFrom(padO * 1.15, fx);
  const room = Math.max(8, w - side * 2);
  const text = s.labels ? upper(spec, t.label) : "";
  const lsize = text ? fitType(g, spec, text, T.labelWeight, room, OH * 0.18 * m, T.labelSpacing) : 0;
  const p = valueParts(t, s);
  const vsize = fitRun(g, spec, p, room, (s.labels ? OH * 0.56 : OH * 0.72) * m, k);
  return { k, text, p, side, room, vpad: Math.max(3 * k, padO - fy), fit: { vsize, lsize } };
}
export const statSizes = (g, t, w, h, H, s, spec) => statPlan(g, t, w, h, H, s, spec).fit;

export function lookStat(g, t, w, h, H, s, spec, bare = false) {
  const T = spec.type;
  const z = statPlan(g, t, w, h, H, s, spec);
  let v = Math.min(z.fit.vsize, s.fitNumber > 0 ? s.fitNumber : Infinity);
  let l = Math.min(z.fit.lsize, s.fitLabel > 0 ? s.fitLabel : Infinity);
  // The label and the number together, in the middle of the box (a number
  // set smaller than fits doesn't leave its label stranded at the top),
  // kept inside the frame.
  const most = h - z.vpad * 2;
  if (blockOf(v, l) > most) {
    const q = most / blockOf(v, l);
    v *= q;
    l *= q;
  }
  const top = (h - blockOf(v, l)) / 2;
  g.textBaseline = "alphabetic";
  g.textAlign = "left";
  if (z.text && l > 0) {
    setType(g, spec, T.labelWeight, l, T.labelSpacing);
    label(g, spec, z.text, alignedX(s.align, z.side, z.room, widthOf(g, z.text, l, T.labelSpacing)), top + l * 0.8, l, bare);
  }
  const run = runParts(spec, z.p, v, z.k);
  drawRun(g, spec, run, alignedX(s.align, z.side, z.room, runWidth(g, spec, run)), top + blockOf(v, l), z.k, bare);
}

// Lines of words, as big as fit. first: the first line in the accent;
// label: a small label above them; bold: every line in the number weight
// (else the first alone).
//
// One line with no label is set at about 55% of its plate's height at
// most, as TV sport's lower thirds set theirs (not as big as fills it);
// more lines at 78% of each one's room. And every plate in a scene the
// same size or near it: the compositor measures them all (lookLineSize)
// and passes the most a plate's lines may be as s.fitLine (compositor.js
// lineFits) - the art direction, round 2: "Alex · 7 iron" had been 50
// pixels beside info lines of 22.
function linesPlan(g, lines, w, h, s, spec, { bold = false, label: lab = "" } = {}) {
  const T = spec.type;
  const k = s.lineScale ?? 1;
  const { OH, fx, fy } = boxOf(s, w, h);
  const n = lines.length;
  // The sizes as the layer's own box gives them.
  const pad = Math.max(3, (OH * 0.1) / (n + (lab ? 0.5 : 0)) + 3);
  const labH = lab ? (OH - pad * 2) * 0.28 : 0;
  const lh = (OH - pad * 2 - labH) / n;
  const base = n === 1 && !lab ? Math.min(lh * 0.78, OH * 0.55) : lh * 0.78;
  const m = textMul(s, base);
  const side = inFrom(Math.max(pad * 1.3, Math.min(OH * 0.3, 18 * k)), fx);
  const room = Math.max(8, w - side * 2);
  const weight = (i) => (bold || i === 0 ? T.numberWeight : 500);
  const labText = lab ? upper(spec, lab) : "";
  // Every line the same size: as big as the longest fits.
  const size = Math.min(...lines.map((text, i) => fitType(g, spec, text, weight(i), room, base * m)));
  const lsize = labText ? fitType(g, spec, labText, T.labelWeight, room, labH * 0.72 * m, T.labelSpacing) : 0;
  return { T, k, fy, n, pad, lh, side, room, weight, labText, size, lsize };
}
// The size (px) a plate's lines would be drawn at on their own, and how
// many lines there are: { size, lines } (compositor.js lineFits).
export function lookLineSize(g, lines, w, h, s, spec, o = {}) {
  return { size: linesPlan(g, lines, w, h, s, spec, o).size, lines: lines.length };
}

export function lookLines(g, lines, w, h, s, spec, { bold = false, first = false, label: lab = "", bare = false } = {}) {
  const { T, k, fy, n, pad, lh, side, room, weight, labText, ...z } = linesPlan(g, lines, w, h, s, spec, { bold, label: lab });
  // (No bigger than the scene's plates allow: fitLine.)
  let size = s.fitLine > 0 ? Math.min(z.size, s.fitLine) : z.size;
  let lsize = z.lsize;
  // Set as a block in the middle: lines smaller than their room closer
  // together, not spread out over it - and inside the frame, the lines
  // closer still (no closer than 1.15) before they're made smaller.
  let step = Math.min(lh, size * 1.4);
  const most = h - 2 * Math.max(2 * k, pad - fy);
  const tall = () => (lsize ? lsize * 1.45 : 0) + (n - 1) * step + size;
  if (tall() > most) step = Math.max(size * 1.15, n > 1 ? (most - size - (lsize ? lsize * 1.45 : 0)) / (n - 1) : 0);
  if (tall() > most) {
    const q = most / tall();
    size *= q;
    lsize *= q;
    step *= q;
  }
  let y = (h - tall()) / 2;
  g.textAlign = "left";
  g.textBaseline = "middle";
  if (labText) {
    setType(g, spec, T.labelWeight, lsize, T.labelSpacing);
    label(g, spec, labText, alignedX(s.align, side, room, widthOf(g, labText, lsize, T.labelSpacing)), y + lsize / 2, lsize, bare);
    y += lsize * 1.45;
  }
  for (const [i, text] of lines.entries()) {
    setType(g, spec, weight(i), size);
    shade(g, bare);
    g.fillStyle = i === 0 && first ? (T.accentText ?? T.accent) : T.text;
    g.fillText(text, alignedX(s.align, side, room, widthOf(g, text, size)), y + size / 2 + step * i);
  }
  shade(g, false);
}

// "A² Golf" (SHORT_NAME) with a little flag, and the owner's own words after
// it, in the look's type: the name in the accent. Its size kept to the
// scene's plates', as the lines are (s.fitLine: the flag with it).
function titlePlan(g, text, w, h, s, spec) {
  const T = spec.type;
  const k = s.lineScale ?? 1;
  const { OH, fx } = boxOf(s, w, h);
  const pad = inFrom(OH * 0.16, fx);
  // (An exact text size: the title's words that many pixels high.) Sized
  // from the layer's own box, kept inside the frame.
  const fh0 = s.textPx > 0 ? (s.textPx * (s.lineScale ?? 1)) / 0.8 : (OH - OH * 0.32) * Math.min(1, s.textScale);
  const fh1 = Math.min(fh0, h - 2 * Math.max(2, 3 * k));
  const name = T.accentText ?? T.accent;
  const words = text ? [[SHORT_NAME, name, T.numberWeight], [`  ${text}`, T.text, 500]] : [[SHORT_NAME, name, T.numberWeight]];
  const all = words.map((wd) => wd[0]).join("");
  const size = fitType(g, spec, all, T.numberWeight, w - pad * 2 - fh1 * 0.82, fh1 * 0.8);
  return { T, k, pad, fh1, words, all, size };
}
export const lookTitleSize = (g, text, w, h, s, spec) => ({ size: titlePlan(g, text, w, h, s, spec).size, lines: 1 });

export function lookTitle(g, text, w, h, s, spec, bare = false) {
  const { T, pad, fh1, words, all, ...z } = titlePlan(g, text, w, h, s, spec);
  // (No bigger than the scene's plates allow: fitLine, the flag with it.)
  const q = s.fitLine > 0 && z.size > s.fitLine ? s.fitLine / z.size : 1;
  const fh = fh1 * q;
  const flagW = fh * 0.82;
  const size = q < 1 ? Math.min(s.fitLine, fitType(g, spec, all, T.numberWeight, w - pad * 2 - flagW, fh * 0.8)) : z.size;
  const textW = words.reduce((sum, [t, , weight]) => (setType(g, spec, weight, size), sum + g.measureText(t).width), 0);
  const x0 = alignedX(s.align, pad, w - pad * 2, flagW + textW);
  const mid = h / 2;
  shade(g, bare);
  // The flag: a pole and a pennant.
  const fx0 = x0 + fh * 0.18;
  const ft = mid - fh / 2;
  g.strokeStyle = T.text;
  g.lineWidth = Math.max(1.5, fh * 0.07);
  g.beginPath();
  g.moveTo(fx0, ft + fh * 0.05);
  g.lineTo(fx0, ft + fh);
  g.stroke();
  g.fillStyle = T.accent;
  g.beginPath();
  g.moveTo(fx0, ft + fh * 0.05);
  g.lineTo(fx0 + fh * 0.5, ft + fh * 0.22);
  g.lineTo(fx0, ft + fh * 0.4);
  g.closePath();
  g.fill();
  g.textBaseline = "middle";
  g.textAlign = "left";
  let at = x0 + flagW;
  for (const [t, colour, weight] of words) {
    setType(g, spec, weight, size);
    g.fillStyle = colour;
    g.fillText(t, at, mid);
    at += g.measureText(t).width;
  }
  shade(g, false);
}

// A line in the middle of a box in the look's type, quiet: a camera not
// there yet, the map waiting for the course (the designer's picture alone).
export function lookNote(g, text, r, H, spec) {
  g.save();
  g.textAlign = "center";
  g.textBaseline = "middle";
  setType(g, spec, spec.type.labelWeight, H / 40);
  g.fillStyle = spec.type.muted;
  g.fillText(text, r.x + r.w / 2, r.y + r.h / 2, r.w - 16);
  g.restore();
}
