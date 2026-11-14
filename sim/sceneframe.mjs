// Framing a recording's scene in the designer (the owner: "enable better
// framing of things" - snapping to thirds and safe areas, quick frame
// buttons, tidy borders and spacing). The Recording panel and the scene
// designer page use these (public/videopanel.js); the layers' own rules are
// sim/videolayout.mjs's, their lining up sim/layerplace.mjs's.
//
//   guide lines   the rule of thirds, and the safe area - the picture's
//                 edge in from all four sides, where nothing that must be
//                 read is cut off on a TV or under YouTube's own buttons -
//                 lines dragged edges lock onto, as they do another
//                 layer's (guideLines)
//   quick frames  one click puts the picked layer in a stock place:
//                 the whole picture, a half, a corner picture-in-picture, a
//                 strip along the bottom or the top (FRAMES, frameLayer)
//   tidy          several picked spread with even gaps between them, across
//                 or down (spreadLayers); their borders and corners made
//                 the first one's (matchLooks)
//
// Pure: shares of the picture in, a layout out.

import { setLayer, layerPixels } from "./videolayout.mjs";
import { boundsOf } from "./layerplace.mjs";

// The safe area's margin: this share of the picture in from each side
// (the usual title-safe 90%).
export const SAFE = 0.05;
// The guides the designer can show and snap to.
export const GUIDES = ["thirds", "safe"];
export const GUIDE_NAMES = { thirds: "Thirds", safe: "Safe area" };

// The guides' lines, in pixels of a W x H picture: { xs, ys }.
export function guideLines({ W, H, thirds = false, safe = false } = {}) {
  const xs = [];
  const ys = [];
  if (thirds) {
    xs.push(W / 3, (2 * W) / 3);
    ys.push(H / 3, (2 * H) / 3);
  }
  if (safe) {
    xs.push(W * SAFE, W * (1 - SAFE));
    ys.push(H * SAFE, H * (1 - SAFE));
  }
  return { xs, ys };
}

// The quick frames, in the order their buttons go.
export const FRAMES = ["fill", "left", "right", "tl", "tr", "bl", "br", "lower", "upper", "centre"];
export const FRAME_NAMES = {
  fill: "Whole picture",
  left: "Left half",
  right: "Right half",
  tl: "Top left corner",
  tr: "Top right corner",
  bl: "Bottom left corner",
  br: "Bottom right corner",
  lower: "Strip along the bottom",
  upper: "Strip along the top",
  centre: "Middle",
};
// The layers that are a line or two of words (numbers, tiles, a piece of
// information): framed shorter in a corner. The rest - pictures, the map,
// the flight path, the round card - keep the picture's shape.
export const SHORT_KINDS = ["stat", "tiles", "field", "info", "player", "title", "clock", "text"];
// A corner picture's width (share of the picture), and a strip's height.
export const CORNER_W = 0.28;
export const STRIP_H = 0.15;

// Where a quick frame puts a layer, as shares { x, y, w, h }: the halves
// and the whole picture edge to edge (pictures fill them); a corner
// picture the picture's own shape, in from the safe area's edge; a strip
// the safe area's width. `words`: a words layer (tiles, numbers) - its
// corner box a little shorter, as words want.
export function frameRect(how, { W = 1920, H = 1080, words = false } = {}) {
  const m = SAFE;
  const cw = CORNER_W;
  // The picture's shape, as shares: a corner picture W:H like the picture.
  const ch = words ? cw * 0.42 : cw;
  const r = (v) => Math.round(v * 10000) / 10000;
  const box = {
    fill: { x: 0, y: 0, w: 1, h: 1 },
    left: { x: 0, y: 0, w: 0.5, h: 1 },
    right: { x: 0.5, y: 0, w: 0.5, h: 1 },
    tl: { x: m, y: m, w: cw, h: ch },
    tr: { x: 1 - m - cw, y: m, w: cw, h: ch },
    bl: { x: m, y: 1 - m - ch, w: cw, h: ch },
    br: { x: 1 - m - cw, y: 1 - m - ch, w: cw, h: ch },
    lower: { x: m, y: 1 - m - STRIP_H, w: 1 - 2 * m, h: STRIP_H },
    upper: { x: m, y: m, w: 1 - 2 * m, h: STRIP_H },
    centre: { x: 1 / 6, y: 1 / 6, w: 2 / 3, h: 2 / 3 },
  }[how];
  if (!box) return null;
  return { x: r(box.x), y: r(box.y), w: r(box.w), h: r(box.h) };
}

// The layer put in a quick frame.
export function frameLayer(layout, id, how, { W = 1920, H = 1080, words = false } = {}) {
  const box = frameRect(how, { W, H, words });
  if (!box || !layout.layers.some((l) => l.id === id)) return layout;
  return setLayer(layout, id, box);
}

// Several layers spread out evenly: the outermost two stay where they are
// and the rest are moved so the gaps between them are all the same -
// across (left to right) or down (top to bottom), in the order they sit.
export function spreadLayers(layout, ids, how = "across", { W = 1920, H = 1080 } = {}) {
  const across = how !== "down";
  const items = layout.layers
    .filter((l) => ids.includes(l.id))
    .map((l) => ({ l, p: layerPixels(l, W, H) }))
    .sort((a, b) => (across ? a.p.x - b.p.x : a.p.y - b.p.y));
  if (items.length < 3) return layout;
  const box = boundsOf(layout, ids, W, H);
  const used = items.reduce((t, { p }) => t + (across ? p.w : p.h), 0);
  const gap = ((across ? box.w : box.h) - used) / (items.length - 1);
  let at = across ? box.x : box.y;
  let out = layout;
  for (const { l, p } of items) {
    out = setLayer(out, l.id, across ? { x: at / W } : { y: at / H });
    at += (across ? p.w : p.h) + gap;
  }
  return out;
}

// The look a picture's frame or a words box has: its corners, border or
// outline, and its backing.
export const LOOK_KEYS = ["radius", "border", "borderWidth", "borderColour", "rounded", "outline", "outlineWidth", "bg", "bgColour", "bgAlpha", "shadow"];

// The others picked given the first one's corners and border: each only
// what it has (a picture's border to pictures, a words box's outline and
// backing to words).
export function matchLooks(layout, ids) {
  const first = layout.layers.find((l) => l.id === ids[0]);
  if (!first) return layout;
  let out = layout;
  for (const id of ids.slice(1)) {
    const l = out.layers.find((x) => x.id === id);
    if (!l) continue;
    const patch = {};
    for (const k of LOOK_KEYS) if (k in first && k in l) patch[k] = first[k];
    if (Object.keys(patch).length) out = setLayer(out, id, patch);
  }
  return out;
}
