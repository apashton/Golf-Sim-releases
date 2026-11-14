// The mode's box in the command centre (arrange.js): one box, in the same
// place whatever's being played, holding the boxes of the mode showing -
// the last shot's numbers, the result, the scorecard, the map - so the
// screen stays as it was set out when the mode changes, and only what's
// in that box changes (the owner, 16 October 2026: "Everything needs to be
// laid out where it's initially set out ... Maybe we can have a box that
// changes based on the type, so rather than you having to set over
// different boxes here, there and everywhere, that one box becomes the game
// specific box"). A mode's options go in the drawer down the left instead
// (sim/ccdrawer.mjs), and the boxes for every mode - the Shot details, the
// messages, the game screen, the cameras - stay where they are. Pure, for
// the page and the tests.
//
// What's kept (the ccModeBox setting, the same in every mode):
//   { rect, zoom, place }
//   rect  where it is: { x, y, w, h } shares of the window, or null - not
//         placed yet (it places itself, and is kept there)
//   zoom  { key: z } the text size of a box in it, where the player has set
//         one (a mode's box is known by its mode and name, "course:Scorecard")
//   place { key: { x, y, w, h, z } } a box in it moved or sized by hand,
//         kept there: shares of its inside (below its heading), h null for
//         as tall as what's in it, z its text size. The rest pack round
//         those (the owner, 20 October 2026: "when trying to move within
//         that window ... the items are glued to the top").

import { COLUMN, MIN_COLUMN, GAP, overlaps } from "./arrange.mjs";

// head: its heading's height (pixels). share: how much of the room between
// the drawers' tabs it takes when it places itself (in whole columns, the
// boxes for every mode in the columns to its left). least: the smallest
// free space it goes in among boxes placed by hand. zooms: the most text
// sizes kept. min: the least a box in it is held to before the rest of
// what's in it scrolls.
export const MODE_BOX = { head: 38, share: 0.55, least: { w: 300, h: 220 }, zooms: 120, min: 96 };

// The least share of its inside a box placed in it is (wide, tall).
const LEAST = 0.05;

const num = (v) => typeof v === "number" && Number.isFinite(v);
const round = (v) => Math.round(v * 10000) / 10000;
const ZOOM = { min: 0.6, max: 3 };

// What's kept, made sound: a rectangle inside the window no smaller than a
// box can be read in, and text sizes in range.
export function cleanModeBox(s) {
  const out = { rect: null, zoom: {}, place: {} };
  if (!s || typeof s !== "object") return out;
  const r = s.rect;
  if (r && [r.x, r.y, r.w, r.h].every(num) && r.w > 0.05 && r.h > 0.05) {
    const x = Math.min(0.95, Math.max(0, r.x));
    const y = Math.min(0.95, Math.max(0, r.y));
    out.rect = { x: round(x), y: round(y), w: round(Math.min(1 - x, r.w)), h: round(Math.min(1 - y, r.h)) };
  }
  if (s.zoom && typeof s.zoom === "object") {
    for (const [k, z] of Object.entries(s.zoom).slice(0, MODE_BOX.zooms)) {
      if (typeof k === "string" && k && k.length < 200 && num(z) && Math.abs(z - 1) > 1e-6) out.zoom[k] = round(Math.min(ZOOM.max, Math.max(ZOOM.min, z)));
    }
  }
  if (s.place && typeof s.place === "object") {
    for (const [k, p] of Object.entries(s.place).slice(0, MODE_BOX.zooms)) {
      const at = typeof k === "string" && k && k.length < 200 ? cleanPlace(p) : null;
      if (at) out.place[k] = at;
    }
  }
  return out;
}

// One box's place in it, made sound: inside it, no smaller than LEAST.
function cleanPlace(p) {
  if (!p || ![p.x, p.y, p.w].every(num) || !(p.h == null || num(p.h))) return null;
  const x = Math.min(1 - LEAST, Math.max(0, p.x));
  const y = Math.min(1 - LEAST, Math.max(0, p.y));
  const w = Math.min(1 - x, Math.max(LEAST, p.w));
  const h = p.h == null ? null : Math.min(1 - y, Math.max(LEAST, p.h));
  const z = num(p.z) ? Math.min(ZOOM.max, Math.max(ZOOM.min, p.z)) : 1;
  return { x: round(x), y: round(y), w: round(w), h: h == null ? null : round(h), z: round(z) };
}

// Its rectangle in pixels on a window W x H, or null; and back to shares.
export function modeBoxPixels(m, W, H) {
  const r = m?.rect;
  return r ? { x: r.x * W, y: r.y * H, w: r.w * W, h: r.h * H } : null;
}
export function modeBoxShares(r, W, H) {
  return cleanModeBox({ rect: { x: r.x / W, y: r.y / H, w: r.w / W, h: r.h / H } }).rect;
}

// A box's text size in it: as set, or 1.
export function boxZoom(m, key) {
  return m?.zoom?.[key] ?? 1;
}
// One set (1: as it comes).
export function zoomBox(m, key, z) {
  const zoom = { ...(m?.zoom ?? {}) };
  if (num(z) && Math.abs(z - 1) > 1e-6) zoom[key] = z;
  else delete zoom[key];
  return cleanModeBox({ ...m, zoom });
}

// The biggest space in area clear of every obstacle (rectangles in
// pixels), or null for none: tried between every pair of the obstacles'
// edges and the area's.
export function largestFree(area, obstacles = []) {
  const inside = obstacles.filter((o) => o && overlaps(o, area));
  const clampX = (v) => Math.min(area.x + area.w, Math.max(area.x, v));
  const clampY = (v) => Math.min(area.y + area.h, Math.max(area.y, v));
  const xs = [...new Set([area.x, area.x + area.w, ...inside.flatMap((o) => [o.x, o.x + o.w])].map(clampX))].sort((a, b) => a - b);
  const ys = [...new Set([area.y, area.y + area.h, ...inside.flatMap((o) => [o.y, o.y + o.h])].map(clampY))].sort((a, b) => a - b);
  let best = null;
  let most = 0;
  for (let i = 0; i < xs.length; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      const w = xs[j] - xs[i];
      for (let k = 0; k < ys.length; k++) {
        for (let l = k + 1; l < ys.length; l++) {
          const h = ys[l] - ys[k];
          if (w * h <= most) continue;
          const r = { x: xs[i], y: ys[k], w, h };
          if (inside.some((o) => overlaps(r, o))) continue;
          best = r;
          most = w * h;
        }
      }
    }
  }
  return best;
}

const inset = (r, by = GAP / 2) => ({ x: r.x + by, y: r.y + by, w: Math.max(1, r.w - 2 * by), h: Math.max(1, r.h - 2 * by) });

// Where it places itself: the right-hand columns of the room between the
// drawers' tabs below the top bar - MODE_BOX.share of them, leaving at
// least one for the boxes for every mode - or, on a window too narrow for
// two columns, its lower half. Where a box placed by hand (or the blank
// area) is in the way, the biggest space free of them instead, if that's
// big enough to read a box in.
//   area  the room between the drawers' tabs { x, y, w, h }
//   top   the foot of the top bar
//   hand  boxes placed by hand, and the blank area, in pixels
export function defaultModeBox(area, { top = area.y, hand = [] } = {}) {
  const room = { x: area.x, y: top, w: area.w, h: Math.max(1, area.y + area.h - top) };
  const n = Math.max(1, Math.floor(room.w / COLUMN));
  let r;
  if (n < 2) r = { x: room.x, y: room.y + room.h / 2, w: room.w, h: room.h / 2 };
  else {
    const cols = Math.max(1, Math.min(n - 1, Math.round(n * MODE_BOX.share)));
    const cw = room.w / n;
    r = { x: room.x + (n - cols) * cw, y: room.y, w: cols * cw, h: room.h };
  }
  r = inset(r);
  const inWay = hand.filter(Boolean);
  if (!inWay.some((o) => overlaps(r, o))) return r;
  const free = largestFree(room, inWay);
  return free && free.w >= MODE_BOX.least.w && free.h >= MODE_BOX.least.h ? inset(free) : r;
}

// Where it can place itself, the likeliest first: the room's right-hand
// columns, MODE_BOX.share of them (as defaultModeBox), then a column fewer
// each time down to one - so the boxes for every mode, packed in the
// columns to its left, can be given more room until they all fit (the
// first layout, and Tidy up, try them in turn: arrange.js). Where a box
// placed by hand or the blank area is in a choice's way, the biggest
// space free of them in its own columns instead - not anywhere in the
// room, which could be all of it (the owner, 19 October 2026: "pressing
// tidy seems to maximise the game specific options and push all other
// items to the bottom of the screen") - or no choice there if that's too
// small to read a box in. Too narrow for two columns: defaultModeBox's.
export function modeBoxChoices(area, { top = area.y, hand = [] } = {}) {
  const room = { x: area.x, y: top, w: area.w, h: Math.max(1, area.y + area.h - top) };
  const n = Math.max(1, Math.floor(room.w / COLUMN));
  const fallback = defaultModeBox(area, { top, hand });
  if (n < 2) return [fallback];
  const inWay = hand.filter(Boolean);
  const cw = room.w / n;
  const most = Math.max(1, Math.min(n - 1, Math.round(n * MODE_BOX.share)));
  const out = [];
  for (let cols = most; cols >= 1; cols--) {
    const span = { x: room.x + (n - cols) * cw, y: room.y, w: cols * cw, h: room.h };
    let r = inset(span);
    if (inWay.some((o) => overlaps(r, o))) {
      const free = largestFree(span, inWay);
      if (!(free && free.w >= MODE_BOX.least.w && free.h >= MODE_BOX.least.h)) continue;
      r = inset(free);
    }
    out.push(r);
  }
  return out.length ? out : [fallback];
}

// Its inside, below its heading: where its boxes are packed. head: the
// heading's height as it's drawn - taller than MODE_BOX.head when its tabs
// and buttons take two rows (putting's seven on a 1280 wide window: the
// first row stood out over its top edge, under the top bar - the owner, 20
// October 2026: "Button behind stuff").
export function modeBoxInside(r, head = MODE_BOX.head) {
  const top = Math.max(MODE_BOX.head, head);
  return { x: r.x + 4, y: r.y + top, w: Math.max(1, r.w - 8), h: Math.max(1, r.h - top - 4) };
}

// A box moved or sized by hand in it: kept there (r in pixels, h null for
// as tall as what's in it, z its text size) as shares of its inside, held
// inside it. r null: forgotten - it packs with the rest again.
export function placeInBox(m, key, r, inside) {
  const place = { ...(m?.place ?? {}) };
  if (r && inside) {
    const x = (r.x - inside.x) / inside.w;
    const y = (r.y - inside.y) / inside.h;
    place[key] = { x, y, w: r.w / inside.w, h: r.h == null ? null : r.h / inside.h, z: r.z ?? 1 };
  } else delete place[key];
  return cleanModeBox({ ...m, place });
}

// Where a box placed by hand is in it now, in pixels ({ x, y, w, h, z }, h
// null for as tall as what's in it), or null for one that packs.
export function placedIn(m, key, inside) {
  const p = m?.place?.[key];
  if (!p) return null;
  return { x: inside.x + p.x * inside.w, y: inside.y + p.y * inside.h, w: p.w * inside.w, h: p.h == null ? null : p.h * inside.h, z: p.z ?? 1 };
}

// A rectangle (pixels) held inside it: moved in, and made no bigger.
export function holdInside(r, inside) {
  const w = Math.min(r.w, inside.w);
  const h = r.h == null ? null : Math.min(r.h, inside.h);
  const x = Math.min(Math.max(inside.x, r.x), inside.x + inside.w - w);
  const y = Math.min(Math.max(inside.y, r.y), inside.y + inside.h - (h ?? 0));
  return { ...r, x, y, w, h };
}

// Every box of a mode placed by hand in it forgotten (Tidy up, Start
// again): they pack again.
export function forgetPlaces(m, mode) {
  const place = Object.fromEntries(Object.entries(m?.place ?? {}).filter(([k]) => !k.startsWith(`${mode}:`)));
  return cleanModeBox({ ...m, place });
}

// The room beside it for the boxes for every mode that place themselves:
// the wider side of it, left or right, if that's a column wide - else all
// of area, round it.
export function besideModeBox(area, box) {
  if (!box) return area;
  const left = { x: area.x, y: area.y, w: Math.max(0, box.x - area.x), h: area.h };
  const right = { x: box.x + box.w, y: area.y, w: Math.max(0, area.x + area.w - box.x - box.w), h: area.h };
  const wider = left.w >= right.w ? left : right;
  return wider.w >= MIN_COLUMN ? wider : area;
}
