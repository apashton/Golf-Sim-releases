// A blank area on a screen: part of a window kept black - where a webcam
// hangs in front of the laptop's screen, say, or a beam catches the
// projector - with everything in that window moved into the biggest clear
// part beside it. Each window keeps its own (blankarea.js draws and edits
// them); this is the arithmetic, pure so the tests can hold it.
//
// A blank area is a rectangle { x, y, w, h }: shares (0 - 1) of the window's
// inside, from its top left. As shares, it stays over the same part of the
// screen when the window's size changes a little (full screen, a different
// resolution).

// The smallest and biggest a side can be, as a share of the window: big
// enough to see and grab, never so big nothing is left to show.
export const MIN_SIDE = 0.02;
export const MAX_SIDE = 0.9;
// How far an arrow key moves or sizes it (Shift + arrow sizes it).
export const NUDGE = 0.005;

import { clamp } from "./mathutil.mjs";
const round = (v) => Math.round(v * 10000) / 10000;

// A rectangle made sensible: numbers, inside the window, neither too small
// nor too big. Null for anything that isn't one (none saved, or nonsense).
export function cleanRect(r) {
  if (!r || typeof r !== "object") return null;
  const { x, y, w, h } = r;
  if (![x, y, w, h].every((v) => typeof v === "number" && Number.isFinite(v))) return null;
  const cw = clamp(w, MIN_SIDE, MAX_SIDE);
  const ch = clamp(h, MIN_SIDE, MAX_SIDE);
  return { x: round(clamp(x, 0, 1 - cw)), y: round(clamp(y, 0, 1 - ch)), w: round(cw), h: round(ch) };
}

// The rectangle between two corners (a drag), in any order.
export function rectFromPoints(ax, ay, bx, by) {
  const x0 = clamp(Math.min(ax, bx), 0, 1);
  const y0 = clamp(Math.min(ay, by), 0, 1);
  const x1 = clamp(Math.max(ax, bx), 0, 1);
  const y1 = clamp(Math.max(ay, by), 0, 1);
  return cleanRect({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
}

// Moved by (dx, dy), kept inside the window at the same size.
export function moveRect(r, dx, dy) {
  const c = cleanRect(r);
  return c && cleanRect({ ...c, x: c.x + dx, y: c.y + dy });
}

// Resized by (dw, dh) from its top left corner.
export function resizeRect(r, dw, dh) {
  const c = cleanRect(r);
  return c && cleanRect({ ...c, w: Math.min(c.w + dw, 1 - c.x), h: Math.min(c.h + dh, 1 - c.y) });
}

// The corner that stays put while another is dragged: the one opposite.
// corner: "tl", "tr", "bl" or "br". Dragging then draws the rectangle
// between it and the pointer (rectFromPoints), so a corner can be pulled
// right over to the other side.
export function oppositeCorner(r, corner) {
  const c = cleanRect(r);
  if (!c) return null;
  return [round(corner.includes("l") ? c.x + c.w : c.x), round(corner.startsWith("t") ? c.y + c.h : c.y)];
}

// Where the window's content goes: the biggest clear part beside the blank
// area - the strip below it, the strip above, or the part to its right or
// left - as the insets it keeps from each edge, { top, right, bottom, left }
// (shares of the window). When two are as big, below wins, then above,
// right and left: a strip right across keeps a row of buttons in one piece.
// No blank area: no insets.
export function freeInsets(rect) {
  const r = cleanRect(rect);
  const none = { top: 0, right: 0, bottom: 0, left: 0 };
  if (!r) return none;
  const choices = [
    { area: 1 - (r.y + r.h), insets: { ...none, top: r.y + r.h } },
    { area: r.y, insets: { ...none, bottom: 1 - r.y } },
    { area: 1 - (r.x + r.w), insets: { ...none, left: r.x + r.w } },
    { area: r.x, insets: { ...none, right: 1 - r.x } },
  ];
  let best = choices[0];
  for (const c of choices.slice(1)) if (c.area > best.area + 1e-9) best = c;
  const out = {};
  for (const [k, v] of Object.entries(best.insets)) out[k] = round(v);
  return out;
}

// The insets as CSS custom properties for the window's root element:
// top and bottom as shares of its height (vh), left and right of its width
// (vw). style.css pads the page by them and keeps menus and messages in.
export function insetVars(insets) {
  const v = (share, unit) => `${round(share * 100)}${unit}`;
  return {
    "--blank-top": v(insets.top ?? 0, "vh"),
    "--blank-right": v(insets.right ?? 0, "vw"),
    "--blank-bottom": v(insets.bottom ?? 0, "vh"),
    "--blank-left": v(insets.left ?? 0, "vw"),
  };
}

// Shift + B: the blank area for the window the key was pressed in.
export function isBlankKey(e) {
  return !!e && !!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && (e.key === "B" || e.key === "b");
}

// What a key does while the blank area is being drawn: "save" (Enter),
// "clear" (Delete, Backspace), "cancel" (Esc), a move or a resize (the
// arrows, and Shift with them), or null for any other key - which does
// nothing while the drawing is up.
export function editorKey(e) {
  if (!e || typeof e.key !== "string") return null;
  if (e.key === "Enter") return { act: "save" };
  if (e.key === "Escape") return { act: "cancel" };
  if (e.key === "Delete" || e.key === "Backspace") return { act: "clear" };
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const d = arrows[e.key];
  if (!d) return null;
  return { act: e.shiftKey ? "resize" : "move", dx: d[0] * NUDGE, dy: d[1] * NUDGE };
}
