// Placing a recording's layers together, in the designer (the owner: "we
// need boxes to easily lock to each other so they sit with each other
// cleanly ... being able to type sizes of width and height ... group two or
// more boxes together to move together"): several moved as one, groups
// that stay together, lining up and butting together, a place typed in
// pixels, and which edges sit on another's (the designer's guides). Pure:
// videopanel.js draws it; a layout is sim/videolayout.mjs's.

import { setLayer, layerPixels, placeLayer } from "./videolayout.mjs";
import { snapToEdges } from "./arrange.mjs";

// A place is typed in pixels of a 1080p picture, whatever size is
// recorded (a layout is kept as shares of the picture).
export const PLACE_W = 1920;
export const PLACE_H = 1080;

// ---- Groups -----------------------------------------------------------------------------

// The layers in id's group (just id when it's in none).
export function groupIds(layout, id) {
  const g = layout.layers.find((l) => l.id === id)?.group;
  return g ? layout.layers.filter((l) => l.group === g).map((l) => l.id) : [id];
}

// What moves when id is dragged: the layers picked with it (several
// picked, it among them), else its group - each picked one's group with
// it.
export function movingIds(layout, id, picked = []) {
  const start = picked.length > 1 && picked.includes(id) ? picked : [id];
  return [...new Set(start.flatMap((x) => groupIds(layout, x)))].filter((x) => layout.layers.some((l) => l.id === x));
}

// The layers (and any group they're in) made one group: a name of its
// own ("g1", "g2"...). Fewer than two: as it was.
export function groupLayers(layout, ids) {
  const all = new Set(ids.flatMap((x) => groupIds(layout, x)));
  if (all.size < 2) return layout;
  // Already one group, all of it: as it is.
  const now = new Set([...all].map((x) => layout.layers.find((l) => l.id === x)?.group));
  if (now.size === 1 && !now.has(undefined)) return layout;
  // (Joined to a group: under its name.)
  const used = new Set(layout.layers.map((l) => l.group).filter(Boolean));
  let n = 1;
  while (used.has(`g${n}`)) n++;
  const g = [...now].find(Boolean) ?? `g${n}`;
  return { ...layout, layers: layout.layers.map((l) => (all.has(l.id) ? { ...l, group: g } : l)) };
}

// Every group the layers are in taken apart: each layer on its own again.
export function ungroupLayers(layout, ids) {
  const groups = new Set(ids.map((x) => layout.layers.find((l) => l.id === x)?.group).filter(Boolean));
  if (!groups.size) return layout;
  return {
    ...layout,
    layers: layout.layers.map((l) => {
      if (!groups.has(l.group)) return l;
      const { group: _g, ...rest } = l;
      return rest;
    }),
  };
}

// A group of one is no group: what's left of one after its others went
// (taken out, or a layer copied out of it) is on its own again.
export function tidyGroups(layout) {
  const count = new Map();
  for (const l of layout.layers) if (l.group) count.set(l.group, (count.get(l.group) ?? 0) + 1);
  if (![...count.values()].some((n) => n < 2)) return layout;
  return {
    ...layout,
    layers: layout.layers.map((l) => {
      if (!l.group || count.get(l.group) > 1) return l;
      const { group: _g, ...rest } = l;
      return rest;
    }),
  };
}

// ---- Moving several together ----------------------------------------------------------

// The rectangle round some layers, in pixels of a W x H picture.
export function boundsOf(layout, ids, W, H) {
  const rs = layout.layers.filter((l) => ids.includes(l.id)).map((l) => layerPixels(l, W, H));
  if (!rs.length) return null;
  const x = Math.min(...rs.map((r) => r.x));
  const y = Math.min(...rs.map((r) => r.y));
  return { x, y, w: Math.max(...rs.map((r) => r.x + r.w)) - x, h: Math.max(...rs.map((r) => r.y + r.h)) - y };
}

// The layers moved by (dx, dy) picture pixels together - lined up as one
// with the other shown layers' edges and the picture's (unless snap is
// false), and kept inside the picture as one: none is squashed against an
// edge while the rest go on.
export function moveLayers(layout, ids, dx, dy, { W, H, snap = true, within = undefined, lines = null }) {
  const box = boundsOf(layout, ids, W, H);
  if (!box) return layout;
  let r = { ...box, x: box.x + dx, y: box.y + dy };
  if (snap) {
    const others = layout.layers.filter((l) => !ids.includes(l.id) && l.on).map((l) => layerPixels(l, W, H));
    r = snapToEdges(r, others, { W, H, within, lines });
  }
  const mx = Math.min(W - box.w, Math.max(0, r.x)) - box.x;
  const my = Math.min(H - box.h, Math.max(0, r.y)) - box.y;
  let out = layout;
  for (const l of layout.layers) {
    if (!ids.includes(l.id)) continue;
    const p = layerPixels(l, W, H);
    out = setLayer(out, l.id, { x: (p.x + mx) / W, y: (p.y + my) / H });
  }
  return out;
}

// ---- Lining up ----------------------------------------------------------------------------

export const ALIGN_HOW = ["left", "centre", "right", "top", "middle", "bottom", "width", "height", "stack", "row"];
export const ALIGN_HOW_NAMES = {
  left: "Left edges",
  centre: "Centres",
  right: "Right edges",
  top: "Tops",
  middle: "Middles",
  bottom: "Bottoms",
  width: "Same width",
  height: "Same height",
  stack: "Stacked, touching",
  row: "Side by side, touching",
};

// The layers lined up: their left edges (or centres, right edges, tops,
// middles, bottoms) on the outermost one's; the same width or height as
// `to` (the one picked first); or butted together with no gaps - stacked
// top to bottom in the order they sit, from the top one down, or side by
// side from the left one. W x H: the picture, in pixels. Each kept inside
// the picture.
export function alignLayers(layout, ids, how, { W, H, to = ids[0] } = {}) {
  const picked = layout.layers.filter((l) => ids.includes(l.id));
  if (picked.length < 2 || !ALIGN_HOW.includes(how)) return layout;
  const px = new Map(picked.map((l) => [l.id, layerPixels(l, W, H)]));
  const all = [...px.values()];
  const ref = px.get(to) ?? all[0];
  const want = new Map();
  if (how === "stack" || how === "row") {
    const along = how === "stack" ? "y" : "x";
    const size = how === "stack" ? "h" : "w";
    const order = [...px.entries()].sort((a, b) => a[1][along] - b[1][along]);
    let at = order[0][1][along];
    for (const [id, r] of order) {
      want.set(id, { ...r, [along]: at });
      at += r[size];
    }
  } else {
    const left = Math.min(...all.map((r) => r.x));
    const right = Math.max(...all.map((r) => r.x + r.w));
    const top = Math.min(...all.map((r) => r.y));
    const bottom = Math.max(...all.map((r) => r.y + r.h));
    for (const [id, r] of px) {
      const n = { ...r };
      if (how === "left") n.x = left;
      if (how === "right") n.x = right - r.w;
      if (how === "centre") n.x = (left + right) / 2 - r.w / 2;
      if (how === "top") n.y = top;
      if (how === "bottom") n.y = bottom - r.h;
      if (how === "middle") n.y = (top + bottom) / 2 - r.h / 2;
      if (how === "width") n.w = ref.w;
      if (how === "height") n.h = ref.h;
      want.set(id, n);
    }
  }
  let out = layout;
  for (const [id, r] of want) out = placeLayer(out, id, r, { W, H, snap: false });
  return out;
}

// ---- Typed --------------------------------------------------------------------------------

// A layer's place in pixels of a 1080p picture, whole pixels: { x, y, w, h }.
export function placeOf(layer) {
  const r = layerPixels(layer, PLACE_W, PLACE_H);
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) };
}

// A place typed (any of x, y, w, h, in pixels of a 1080p picture): the
// rest as it is, kept no smaller than a layer can be and inside the
// picture - a width too big for where it is moves it left to fit.
export function typedPlace(layout, id, typed) {
  const layer = layout.layers.find((l) => l.id === id);
  if (!layer) return layout;
  const now = layerPixels(layer, PLACE_W, PLACE_H);
  const r = { ...now };
  for (const k of ["x", "y", "w", "h"]) {
    const v = Number(typed?.[k]);
    if (typed?.[k] !== undefined && typed[k] !== "" && Number.isFinite(v)) r[k] = v;
  }
  return placeLayer(layout, id, r, { W: PLACE_W, H: PLACE_H, snap: false });
}

// ---- Guides -------------------------------------------------------------------------------

// Where the layers' outer edges sit on another shown layer's edge, or the
// picture's: the designer draws a line there while they're dragged, so
// it's seen that they're flush. { xs: [px], ys: [px] }.
export function touchingEdges(layout, ids, { W, H, tol = 0.75, lines = null } = {}) {
  const box = boundsOf(layout, ids, W, H);
  if (!box) return { xs: [], ys: [] };
  const others = layout.layers.filter((l) => !ids.includes(l.id) && l.on).map((l) => layerPixels(l, W, H));
  const xLines = [0, W, ...others.flatMap((o) => [o.x, o.x + o.w]), ...(lines?.xs ?? [])];
  const yLines = [0, H, ...others.flatMap((o) => [o.y, o.y + o.h]), ...(lines?.ys ?? [])];
  const hit = (v, lines) => lines.some((c) => Math.abs(c - v) <= tol);
  const xs = [box.x, box.x + box.w].filter((v) => hit(v, xLines) && v > tol && v < W - tol);
  const ys = [box.y, box.y + box.h].filter((v) => hit(v, yLines) && v > tol && v < H - tol);
  return { xs, ys };
}
