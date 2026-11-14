// Containers in a recording's layout (the owner, 1 November 2026: "better
// ways of auto organising say give things a container and stick everything
// into that container evenly"): a background box that lays out the other
// layers in its group inside itself - down it, across it, or in a grid -
// each the same size, an even gap between them and padding round them, in
// pixels of a 1080p picture. Sized or moved, it lays them out again; a
// layer grouped with it joins in. Pure: videopanel.js is the designer; a
// layout is sim/videolayout.mjs's.

import { addLayer, setLayer, layerPixels } from "./videolayout.mjs";
import { groupLayers, boundsOf, PLACE_W, PLACE_H } from "./layerplace.mjs";
import { FILL_HOW, FILL_START, cleanFill } from "./fillbox.mjs";

export { FILL_HOW, FILL_HOW_NAMES, FILL_START, FILL_MAX, cleanFill } from "./fillbox.mjs";

// The places of n things laid out in a box (pixels of a W x H picture):
// the box less its padding, in equal cells an even gap apart.
export function fillCells(box, n, fill, { W = PLACE_W, H = PLACE_H } = {}) {
  if (!(n > 0)) return [];
  const k = H / PLACE_H;
  const pad = fill.pad * k;
  const gap = fill.gap * k;
  const inner = { x: box.x + pad, y: box.y + pad, w: Math.max(8, box.w - pad * 2), h: Math.max(8, box.h - pad * 2) };
  const cols = fill.how === "down" ? 1 : fill.how === "across" ? n : Math.min(n, fill.cols);
  const rows = Math.ceil(n / cols);
  const cw = Math.max(4, (inner.w - gap * (cols - 1)) / cols);
  const ch = Math.max(4, (inner.h - gap * (rows - 1)) / rows);
  return Array.from({ length: n }, (_, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    return { x: Math.min(W - cw, inner.x + c * (cw + gap)), y: Math.min(H - ch, inner.y + r * (ch + gap)), w: cw, h: ch };
  });
}

// What a container holds: the rest of its group, in the layers' order
// (back to front - the list's ↑ and ↓ change it).
export function containerMembers(layout, boxId) {
  const box = layout.layers.find((l) => l.id === boxId);
  if (!box?.group) return [];
  return layout.layers.filter((l) => l.group === box.group && l.id !== boxId);
}

// Every container's layers laid out in it again.
export function flowContainers(layout, { W = PLACE_W, H = PLACE_H } = {}) {
  let out = layout;
  for (const box of layout.layers) {
    if (box.kind !== "box" || !box.fill || !box.group) continue;
    const members = containerMembers(out, box.id);
    const cells = fillCells(layerPixels(box, W, H), members.length, box.fill, { W, H });
    members.forEach((l, i) => {
      const c = cells[i];
      out = setLayer(out, l.id, { x: c.x / W, y: c.y / H, w: c.w / W, h: c.h / H });
    });
  }
  return out;
}

// The layers picked put in a container: one of them if it's a background
// box (the biggest), else a new box round them all with the padding to
// spare; grouped with it, in the order they sit (top to bottom down it,
// left to right across it, row by row in a grid), and laid out. Returns
// { layout, id } (id: the container's; null when there was no room for a
// box).
export function containIn(layout, ids, how = "down", { W = PLACE_W, H = PLACE_H, gap = FILL_START.gap, pad = FILL_START.pad, cols = FILL_START.cols } = {}) {
  const picked = layout.layers.filter((l) => ids.includes(l.id));
  if (!picked.length || !FILL_HOW.includes(how)) return { layout, id: null };
  const boxes = picked.filter((l) => l.kind === "box").sort((a, b) => b.w * b.h - a.w * a.h);
  let out = layout;
  let boxId = boxes[0]?.id ?? null;
  const fill = cleanFill({ how, gap, pad, cols });
  if (!boxId) {
    // A new box as big as they need laid out its way at about their own
    // sizes - down it, as tall as they are together and as wide as the
    // widest - from where they are, inside the picture (smaller if need be).
    const b = boundsOf(layout, picked.map((l) => l.id), W, H);
    const k = H / PLACE_H;
    const p = pad * k;
    const g = gap * k;
    const rs = picked.map((l) => layerPixels(l, W, H));
    const n = rs.length;
    const sum = (key) => rs.reduce((t, x) => t + x[key], 0);
    const most = (key) => Math.max(...rs.map((x) => x[key]));
    const c = how === "down" ? 1 : how === "across" ? n : Math.min(n, cols);
    const rows = Math.ceil(n / c);
    let bw = how === "across" ? sum("w") + g * (n - 1) : c * most("w") + g * (c - 1);
    let bh = how === "down" ? sum("h") + g * (n - 1) : rows * most("h") + g * (rows - 1);
    bw += p * 2;
    bh += p * 2;
    const fit = Math.min(1, W / bw, H / bh);
    bw *= fit;
    bh *= fit;
    const r = { x: Math.min(W - bw, Math.max(0, b.x - p)), y: Math.min(H - bh, Math.max(0, b.y - p)), w: bw, h: bh };
    const added = addLayer(out, "box");
    if (!added.id) return { layout, id: null };
    boxId = added.id;
    out = setLayer(added.layout, boxId, { x: r.x / W, y: r.y / H, w: r.w / W, h: r.h / H });
  }
  out = groupLayers(out, [boxId, ...picked.map((l) => l.id)]);
  out = setLayer(out, boxId, { fill });
  // In the order they sit, for the way they're laid out: their places in
  // the list swapped round to it (they don't overlap once laid out).
  const members = containerMembers(out, boxId);
  const key = how === "across" ? (l) => [l.x, l.y] : (l) => [l.y, l.x];
  const sorted = [...members].sort((a, b) => {
    const [a1, a2] = key(a);
    const [b1, b2] = key(b);
    return Math.abs(a1 - b1) > 0.01 ? a1 - b1 : a2 - b2;
  });
  const slots = members.map((l) => out.layers.indexOf(l)).sort((a, b) => a - b);
  const layers = [...out.layers];
  slots.forEach((slot, i) => (layers[slot] = sorted[i]));
  out = flowContainers({ ...out, layers }, { W, H });
  return { layout: out, id: boxId };
}
