// The controls window's boxes (arrange.js): where each one goes. The top
// bar in two halves, each of the mode's panel sections, the area where the
// game window's prompts are copied - laid out round the blank area rather
// than below it, so both sides of a webcam hanging over the screen are
// used, and moved, sized and zoomed by hand when the owner wants them
// elsewhere. Pure: the packing and the rules for moving and sizing, for the
// page and the tests.
//
// Rectangles are in pixels { x, y, w, h } for the working out. What's kept
// is shares of the window - { x, y, w, h, z }, h null for a box as tall as
// what's in it, z its zoom - so a layout fits the window it's in.

// The narrowest column the panel's boxes are packed into (the side panel's
// own width), and the gap between boxes.
export const COLUMN = 360;
export const GAP = 8;
// Narrower columns still, down to this, when everything won't fit the
// window at COLUMN: a laptop at 1280 x 720 gets four slimmer columns rather
// than three and a page to scroll.
export const MIN_COLUMN = 300;
// Moves and sizes snap to this, in pixels.
export const GRID = 8;
// The smallest a box can be sized to.
export const MIN_W = 140;
export const MIN_H = 48;
// A half of the top bar needs at least this much room beside the blank area.
export const MIN_BAR = 240;
// The text sizes a box steps through with - and +.
export const ZOOMS = [0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.6, 1.8, 2, 2.5, 3];

const round = (v) => Math.round(v * 10000) / 10000;

// Whether two rectangles overlap (touching edges don't).
export function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

// The first top, from y down, at which a box of this size clears every
// obstacle in its column.
export function firstClear(x, y, w, h, obstacles) {
  let top = y;
  for (let moved = true, n = 0; moved && n < 100; n++) {
    moved = false;
    for (const o of obstacles) {
      if (overlaps({ x, y: top, w, h }, o)) {
        top = o.y + o.h;
        moved = true;
      }
    }
  }
  return top;
}

// The mode's panel sections, packed into columns across the window: in
// order, down one column and on to the next, clearing the obstacles (the
// blank area, the top bar's halves, boxes placed by hand), with the
// columns as even as they can be - the shortest height they all fit in.
//   boxes      [{ id, h, first, min }] in order, each h its height at the
//              column's width; first: it stays in the first column (the
//              Shot details head it), however
//              that evens the columns out; min: the least it can be held
//              to, scrolling what's left inside itself (with shrink)
//   area       { x, y, w, h } the window
//   obstacles  [{ x, y, w, h }]
//   columns    how many (the most COLUMN-wide ones that fit, unless said)
//   shrink     a box with a min that doesn't fit the room left in its
//              column is held to that room rather than moved on, and the
//              columns are filled down from the top rather than evened
//              out: for when nothing else fits the window
// Returns { rects: { id: { x, y, w, h, shrunk } }, width, fits } - width
// the column's, less the gap; shrunk: held shorter than its h - with any
// that don't fit even at the window's height carried on below it (fits
// false).
export function packColumns(boxes, { area, obstacles = [], columns = null, gap = GAP, shrink = false }) {
  const n = columns ?? Math.max(1, Math.floor(area.w / COLUMN));
  const cw = area.w / n;
  const width = Math.max(1, cw - gap);
  // What the boxes after each need in the last column, held as short as
  // they can be: room a box held shorter there leaves for them.
  const after = Array(boxes.length + 1).fill(0);
  for (let i = boxes.length - 1; i >= 0; i--) after[i] = after[i + 1] + (boxes[i].min ?? boxes[i].h) + gap;
  // Down each column in turn, no lower than `limit`; with overflow, the
  // last column carries on down past it.
  const place = (limit, overflow = false) => {
    const rects = {};
    const bottoms = Array(n).fill(area.y + gap / 2);
    let col = 0;
    for (const [i, b] of boxes.entries()) {
      for (;;) {
        const x = area.x + col * cw + gap / 2;
        const top = firstClear(x, bottoms[col], width, b.h, obstacles);
        const last = col === n - 1;
        if (top + b.h <= area.y + limit + 0.5 || (overflow && (last || b.first))) {
          rects[b.id] = { x, y: top, w: width, h: b.h };
          bottoms[col] = top + b.h + gap;
          break;
        }
        if (shrink && b.min != null && b.min < b.h) {
          // Held to the room down to the column's foot or the next obstacle
          // - in the last column, less what the boxes after it need, where
          // that leaves it its least (rather than it taking all the room
          // and them carried on below the window: two boxes in the
          // command centre's mode's box under a blank area).
          const at = firstClear(x, bottoms[col], width, b.min, obstacles);
          const most = Math.min(b.h, area.y + limit - at, roomBelow({ x, y: at, w: width, h: b.h }, obstacles, Infinity));
          const leaving = most - after[i + 1];
          const room = last && leaving >= b.min ? leaving : most;
          if (room >= b.min) {
            rects[b.id] = { x, y: at, w: width, h: room, shrunk: true };
            bottoms[col] = at + room + gap;
            break;
          }
        }
        if (last || b.first) return null;
        col++;
      }
    }
    return rects;
  };
  if (!boxes.length) return { rects: {}, width, fits: true };
  if (shrink) {
    const rects = place(area.h);
    return rects ? { rects, width, fits: true } : { rects: place(area.h, true), width, fits: false };
  }
  // As even as can be: the least height they all fit in, found by halving.
  let hi = area.h;
  let lo = Math.min(hi, Math.max(...boxes.map((b) => b.h)));
  if (!place(hi)) {
    // Too much for the window: every column carries on below it, to
    // scroll to, as evenly as they can (rather than all of it down the
    // first column).
    lo = hi;
    for (let i = 0; i < 12 && !place(hi); i++) hi *= 2;
    if (!place(hi)) return { rects: place(area.h, true), width, fits: false };
  }
  const fits = hi <= area.h;
  if (place(lo)) return { rects: place(lo), width, fits };
  for (let i = 0; i < 24 && hi - lo > 1; i++) {
    const mid = (lo + hi) / 2;
    if (place(mid)) hi = mid;
    else lo = mid;
  }
  return { rects: place(hi), width, fits };
}

// How many columns a window W wide can be packed in: the most COLUMN-wide
// ones first, then one more at a time while they're no narrower than
// MIN_COLUMN.
export function columnChoices(W) {
  const most = Math.max(1, Math.floor(W / COLUMN));
  const slimmest = Math.max(most, Math.floor(W / MIN_COLUMN));
  return Array.from({ length: slimmest - most + 1 }, (_, i) => most + i);
}

// packColumns, with as many columns as it takes for everything to fit the
// window: the usual COLUMN-wide ones if they do (so a big screen looks just
// as it always has), or more, slimmer ones (columnChoices) on a small one
// rather than a page to scroll; then, if none of those fit, the same again
// with the boxes that can be held shorter (a min: the Shot details, whose
// oldest messages scroll out of sight) held to the room they have. Only
// when even that doesn't fit does it carry on below the window, in the
// usual columns - slimmer ones would only make it longer.
//   list       the boxes [{ id, first, min }], in order (as packColumns)
//   heightAt   (id, width) -> its height at that column width
//   area, obstacles, gap as packColumns
// Returns packColumns' { rects, width, fits }, and columns: how many.
export function packToFit(list, heightAt, { area, obstacles = [], gap = GAP }) {
  let usual = null;
  const measured = {};
  for (const shrink of [false, true]) {
    if (shrink && !list.some((b) => b.min != null)) break;
    for (const n of columnChoices(area.w)) {
      const width = Math.max(1, area.w / n - gap);
      measured[n] ??= list.map((b) => ({ ...b, h: heightAt(b.id, width) }));
      const packed = { ...packColumns(measured[n], { area, obstacles, columns: n, gap, shrink }), columns: n };
      if (packed.fits) return packed;
      usual ??= packed;
    }
  }
  return usual;
}

// The top bar's two halves - the mode buttons and pickers ("bar-main"), and
// the links, connection and buttons ("bar-tools") - across the top: one
// each side of a blank area that reaches up there (wrapping onto another
// row when a side is narrower than it), both on the one side when only one
// has room, or side by side along the top with no blank area in the way.
//   W          the window's width
//   blank      the blank area in pixels, or null
//   natural    (id) -> its width on one row
//   heightAt   (id, width) -> its height at that width
// Returns { "bar-main": rect, "bar-tools": rect }.
export function placeBars({ W, blank = null, natural, heightAt }) {
  const mainW = Math.min(W, natural("bar-main"));
  const toolsW = Math.min(W, natural("bar-tools"));
  const at = (id, x, y, w) => ({ x, y, w, h: heightAt(id, w) });
  // A blank area counts when it reaches the top bar's first row.
  const firstRow = Math.max(heightAt("bar-main", mainW), heightAt("bar-tools", toolsW));
  const inTheWay = blank && blank.y < firstRow;
  if (!inTheWay) {
    if (mainW + toolsW <= W) return { "bar-main": at("bar-main", 0, 0, mainW), "bar-tools": at("bar-tools", W - toolsW, 0, toolsW) };
    const main = at("bar-main", 0, 0, W);
    return { "bar-main": main, "bar-tools": at("bar-tools", 0, main.h, W) };
  }
  const left = blank.x;
  const right = W - (blank.x + blank.w);
  if (left >= MIN_BAR && right >= MIN_BAR) {
    const wm = Math.min(mainW, left);
    const wt = Math.min(toolsW, right);
    return { "bar-main": at("bar-main", 0, 0, wm), "bar-tools": at("bar-tools", W - wt, 0, wt) };
  }
  // Only one side with room: both there, one above the other.
  if (Math.max(left, right) >= MIN_BAR) {
    const x = left >= right ? 0 : blank.x + blank.w;
    const w = Math.max(left, right);
    const main = at("bar-main", x, 0, Math.min(mainW, w));
    return { "bar-main": main, "bar-tools": at("bar-tools", x, main.h, Math.min(toolsW, w)) };
  }
  // No room either side: below it, as the one window has it.
  const y = blank.y + blank.h;
  const main = at("bar-main", 0, y, W);
  return { "bar-main": main, "bar-tools": at("bar-tools", 0, y + main.h, W) };
}

// Whether the top bar's halves, both where they placed themselves (kept,
// in shares, auto), should place themselves afresh because that's better
// now: either half outgrown by what it holds - a tab added since (the
// Online tab), or a narrower window - so it wraps onto a second row in its
// place, where a fresh place gives it more room (the tools half only while
// the two still fit side by side: its width changes with the connection's
// words, which never put the two on two rows); or the two on two rows where
// they fit side by side now (placed first in a narrower window). Never a
// half put there by hand.
//   kept     the kept places, { "bar-main": s, "bar-tools": s, ... }
//   W        the window's width
//   natural  (id) -> its width on one row now (unzoomed)
//   fresh    () -> placeBars' rectangles now (asked only when it might help)
export function barsAfresh(kept, { W, natural, fresh }) {
  const sm = kept?.["bar-main"];
  const st = kept?.["bar-tools"];
  const m = cleanBox(sm);
  const t = cleanBox(st);
  if (!sm?.auto || !st?.auto || !m || !t || !(W > 0)) return false;
  const now = { main: m.w * W, tools: t.w * W };
  const outgrown = natural("bar-main") * m.z > now.main + 2;
  const toolsOutgrown = natural("bar-tools") * t.z > now.tools + 2;
  const twoRows = t.y > m.y && natural("bar-main") + natural("bar-tools") <= W;
  if (!outgrown && !toolsOutgrown && !twoRows) return false;
  const f = fresh();
  const oneRow = f["bar-main"].y === f["bar-tools"].y;
  if (outgrown && f["bar-main"].w > now.main + 2) return true;
  if (toolsOutgrown && oneRow && f["bar-tools"].w > now.tools + 2) return true;
  return twoRows && oneRow;
}

// How tall a box kept where the owner put it, as tall as what's in it, can
// be: down to the top of the first box below it that it would run into, or
// the window's foot - so one that's grown since (the Shot details as the
// messages come in), or one kept on a bigger window, scrolls inside itself
// rather than covering the box below or making the page scroll. A small
// box put wholly inside it on purpose doesn't count. Never less than a box
// can be sized to.
//   r       the box { x, y, w, h, l }, h what's in it needs, l its layer
//   others  every other box's rectangle (and the blank area's)
//   H       the window's height
export function roomBelow(r, others, H) {
  let bottom = H;
  for (const o of others) {
    if (!o || o.y <= r.y || o.x >= r.x + r.w || r.x >= o.x + o.w) continue;
    // On purpose: narrower, over it, and not reaching out of it. (The box
    // below in the same column is as wide, however far this one has grown.)
    const inside = o.w < r.w - 1 && o.x >= r.x && o.x + o.w <= r.x + r.w && o.y + o.h <= r.y + r.h && (o.l ?? 0) > (r.l ?? 0);
    if (!inside) bottom = Math.min(bottom, o.y);
  }
  return Math.max(MIN_H, bottom - r.y);
}

// Where boxes kept by the owner go down to, to clear the top bar: on a
// narrower window than they were arranged on a half of it wraps onto
// another row, and reaches boxes that were clear of it. Each one it reaches
// goes just below it, and any it then reaches below that, top to bottom, a
// box's least height apart (roomBelow then holds each above the next);
// the rest stay exactly where they were put.
//   boxes  [{ id, x, y, w }] kept boxes
//   bars   the top bar's halves' rectangles
// Returns { id: y }.
export function clearOfBars(boxes, bars) {
  const out = {};
  const moved = [];
  for (const b of [...boxes].sort((a, c) => a.y - c.y)) {
    const band = { x: b.x, y: b.y, w: b.w, h: MIN_H };
    const hit = [...bars, ...moved].some((o) => overlaps(band, o));
    out[b.id] = hit ? firstClear(b.x, b.y, b.w, MIN_H, [...bars, ...moved]) : b.y;
    if (hit) moved.push({ ...band, y: out[b.id] });
  }
  return out;
}

// A rectangle moved clear of an obstacle it overlaps, the shortest way that
// keeps it inside the window (W x H): left, right, down or up.
export function pushOut(r, o, W, H) {
  if (!o || !overlaps(r, o)) return r;
  const options = [
    { ...r, x: o.x - r.w },
    { ...r, x: o.x + o.w },
    { ...r, y: o.y + o.h },
    { ...r, y: o.y - r.h },
  ].filter((c) => c.x >= 0 && c.y >= 0 && c.x + c.w <= W + 0.5 && (c.y + c.h <= H + 0.5 || c.y >= o.y + o.h));
  if (!options.length) return { ...r, y: o.y + o.h };
  const d = (c) => Math.abs(c.x - r.x) + Math.abs(c.y - r.y);
  return options.reduce((a, b) => (d(b) < d(a) ? b : a));
}

// Onto the grid.
export const snap = (v, grid = GRID) => Math.round(v / grid) * grid;

// A box dragged to (x, y): on the grid, and inside the window.
export function moveTo(r, x, y, W, H) {
  const nx = Math.min(Math.max(0, snap(x)), Math.max(0, W - r.w));
  const ny = Math.min(Math.max(0, snap(y)), Math.max(0, H - MIN_H));
  return { ...r, x: nx, y: ny };
}

// A box's corner dragged to (x, y): its new size, on the grid, no smaller
// than a box can be and no wider than the window.
export function sizeTo(r, x, y, W) {
  const w = Math.min(W - r.x, Math.max(MIN_W, snap(x - r.x)));
  const h = Math.max(MIN_H, snap(y - r.y));
  return { ...r, w, h };
}

// The next text size up (+1) or down (-1) from z.
export function stepZoom(z, dir) {
  const i = ZOOMS.findIndex((s) => s >= z - 1e-6);
  const at = i < 0 ? ZOOMS.length - 1 : ZOOMS[i] > z + 1e-6 && dir > 0 ? i - 1 : i;
  return ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, at + dir))];
}

// Pixels to what's kept, and back. h null stays null (as tall as it needs).
export function toShares(r, W, H, z = 1) {
  return { x: round(r.x / W), y: round(r.y / H), w: round(r.w / W), h: r.h == null ? null : round(r.h / H), z: round(z) };
}
export function toPixels(s, W, H) {
  return { x: s.x * W, y: s.y * H, w: s.w * W, h: s.h == null ? null : s.h * H, z: s.z ?? 1 };
}

// A kept box made sensible: numbers, inside the window, a sensible zoom.
// Null for anything else.
export function cleanBox(s) {
  if (!s || typeof s !== "object") return null;
  const num = (v) => typeof v === "number" && Number.isFinite(v);
  if (![s.x, s.y, s.w].every(num)) return null;
  const w = Math.min(1, Math.max(0.02, s.w));
  const h = num(s.h) ? Math.min(1, Math.max(0.02, s.h)) : null;
  const z = num(s.z) ? Math.min(ZOOMS.at(-1), Math.max(ZOOMS[0], s.z)) : 1;
  return { x: round(Math.min(1 - w, Math.max(0, s.x))), y: round(Math.min(0.98, Math.max(0, s.y))), w: round(w), h: h == null ? null : round(h), z: round(z) };
}

// What a key does while arranging: "done" (Enter), "cancel" (Esc), "drawer"
// (D: open or minimise the side drawer down the right), "left" (A: the one
// down the left), or a nudge of the chosen box -
// moved by the arrows, sized with Shift, a grid step at a time - or null
// for any other key, which does nothing then.
export function arrangeKey(e) {
  if (!e || typeof e.key !== "string") return null;
  if (e.key === "Enter") return { act: "done" };
  if (e.key === "Escape") return { act: "cancel" };
  if (e.key === "+" || e.key === "=") return { act: "zoom", dir: 1 };
  if (e.key === "-" || e.key === "_") return { act: "zoom", dir: -1 };
  // D: the side drawer opened, or minimised to lay out the boxes under it.
  if ((e.key === "d" || e.key === "D") && !e.ctrlKey && !e.metaKey && !e.altKey) return { act: "drawer" };
  if ((e.key === "a" || e.key === "A") && !e.ctrlKey && !e.metaKey && !e.altKey) return { act: "left" };
  // H: the Arrange panel minimised to a strip, or shown in full again.
  if ((e.key === "h" || e.key === "H") && !e.ctrlKey && !e.metaKey && !e.altKey) return { act: "small" };
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const d = arrows[e.key];
  if (!d) return null;
  return { act: e.shiftKey ? "size" : "move", dx: d[0] * GRID, dy: d[1] * GRID };
}

// A box sized from any of its edges or corners - `edges` is some of n, s, e
// and w ("se" the bottom right corner) - the opposite sides staying put: on
// the grid, inside the window, never smaller than a box can be.
export function resizeFrom(r, edges, px, py, W, H) {
  const right = r.x + r.w;
  const bottom = r.y + r.h;
  let { x, y, w, h } = r;
  if (edges.includes("e")) w = Math.min(W - x, Math.max(MIN_W, snap(px) - x));
  if (edges.includes("s")) h = Math.max(MIN_H, snap(py) - y);
  if (edges.includes("w")) {
    x = Math.max(0, Math.min(snap(px), right - MIN_W));
    w = right - x;
  }
  if (edges.includes("n")) {
    y = Math.max(0, Math.min(snap(py), bottom - MIN_H));
    h = bottom - y;
  }
  return { ...r, x, y, w, h: Math.min(h, Math.max(MIN_H, H)) };
}

// How close, in pixels, an edge has to come to another's to line up with it.
export const SNAP = 10;

// Lines a box up with its neighbours: an edge that comes within SNAP of
// another box's edge (or the blank area's, or the window's) goes onto it,
// so boxes sit flush side by side and in rows. Moving, the whole box
// shifts; sizing, only the edges being dragged move. others: rectangles.
// within: how close counts (SNAP to begin with; the recording's designer
// asks for its own, a few of the screen's pixels however small its
// picture is drawn).
// lines: more to lock onto ({ xs, ys }: the recording designer's guides,
// sim/sceneframe.mjs).
export function snapToEdges(r, others, { W, H, edges = null, within = SNAP, lines = null } = {}) {
  const xs = [0, W, ...(lines?.xs ?? [])];
  const ys = [0, H, ...(lines?.ys ?? [])];
  for (const o of others) {
    xs.push(o.x, o.x + o.w, o.x - GAP, o.x + o.w + GAP);
    ys.push(o.y, o.y + o.h, o.y - GAP, o.y + o.h + GAP);
  }
  const near = (v, list) => {
    let best = null;
    for (const c of list) if (Math.abs(c - v) <= within && (best === null || Math.abs(c - v) < Math.abs(best - v))) best = c;
    return best;
  };
  const out = { ...r };
  if (!edges) {
    const l = near(r.x, xs);
    const rt = near(r.x + r.w, xs);
    if (l !== null && (rt === null || Math.abs(l - r.x) <= Math.abs(rt - r.x - r.w))) out.x = l;
    else if (rt !== null) out.x = rt - r.w;
    const t = near(r.y, ys);
    const b = near(r.y + r.h, ys);
    if (t !== null && (b === null || Math.abs(t - r.y) <= Math.abs(b - r.y - r.h))) out.y = t;
    else if (b !== null) out.y = b - r.h;
    return out;
  }
  if (edges.includes("e")) {
    const c = near(r.x + r.w, xs);
    if (c !== null && c - r.x >= MIN_W) out.w = c - r.x;
  }
  if (edges.includes("s")) {
    const c = near(r.y + r.h, ys);
    if (c !== null && c - r.y >= MIN_H) out.h = c - r.y;
  }
  if (edges.includes("w")) {
    const c = near(r.x, xs);
    if (c !== null && r.x + r.w - c >= MIN_W) {
      out.w = r.x + r.w - c;
      out.x = c;
    }
  }
  if (edges.includes("n")) {
    const c = near(r.y, ys);
    if (c !== null && r.y + r.h - c >= MIN_H) {
      out.h = r.y + r.h - c;
      out.y = c;
    }
  }
  return out;
}

// ---- Layers, the side drawer, boxes out of sight ------------------------------------------

// The layers again with one box on top: the others keep their order, and
// every layer is numbered 1, 2, 3... (it counted up for ever before, and
// a box picked up often enough ended up over the cards).
//   layers  { id: l } every box's layer (0: as the page has it)
//   id      the box picked up
// Returns { id: l } for the boxes with a layer of their own.
export function restack(layers, id) {
  const order = Object.entries(layers)
    .filter(([k, l]) => k !== id && l > 0)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k);
  if (id != null) order.push(id);
  return Object.fromEntries(order.map((k, i) => [k, i + 1]));
}

// The side drawer down the right of the controls window, for the cards,
// the keys and the shot history: its width on a window this wide, and a
// tab's when it's closed. It opens over the boxes (they're laid out as if
// it weren't there), so it starts closed.
export const DRAWER = { min: 280, share: 0.24, max: 420, tab: 30, least: 200 };
// share: the width the player gave the tab showing (dragged by its edge
// while arranging), a share of the window's - no narrower than
// DRAWER.least, and leaving the window's left edge showing.
export function drawerWidth(W, open = true, share = null) {
  if (!open) return DRAWER.tab;
  if (typeof share === "number" && Number.isFinite(share)) return Math.round(Math.max(Math.min(DRAWER.least, W * 0.5), Math.min(W * share, W - 2 * DRAWER.tab)));
  return Math.round(Math.min(DRAWER.max, Math.max(DRAWER.min, W * DRAWER.share), W * 0.45));
}

// A box dropped on the drawer (r, its rectangle: its middle over the
// drawer's) - one of the drawer's goes back into it (the owner, 16 October
// 2026: "they've now popped out and I can't get them back into the slide
// out screen").
export function overDrawer(r, drawer) {
  if (!r || !drawer) return false;
  const cx = r.x + r.w / 2;
  const cy = r.y + Math.min(r.h, 60) / 2;
  return cx >= drawer.x && cx <= drawer.x + drawer.w && cy >= drawer.y && cy <= drawer.y + drawer.h;
}

// The boxes in the drawer, one under another from its top: each as tall as
// it needs, the last that can (the shot history) taking all that's left
// (scrolling what doesn't fit), and none less than a box can be.
//   items   [{ id, h, grow, max, size }] top to bottom, h what's in it
//           needs, max the most of the drawer's height it can have (the
//           keys, so the shot history below them still shows), size the
//           share of it the player has given it (dragging its foot while
//           arranging): that tall, whatever's in it, as far as there's room
//   area    the drawer's inside { x, y, w, h }
// Returns { id: { x, y, w, h, fixedH } }.
export function stackDrawer(items, area, gap = GAP) {
  const out = {};
  let y = area.y;
  const bottom = area.y + area.h;
  items.forEach((it, i) => {
    const left = bottom - y - (items.length - 1 - i) * (MIN_H + gap);
    let h;
    if (it.size > 0) h = Math.max(MIN_H, Math.min(it.size * area.h, left));
    else {
      h = Math.max(0, it.max ? Math.min(it.h, Math.max(MIN_H, it.max * area.h)) : it.h);
      if (it.grow) h = Math.max(MIN_H, left);
      else if (h > left) h = Math.max(MIN_H, left);
    }
    out[it.id] = { x: area.x, y, w: area.w, h, fixedH: it.size > 0 || !!it.grow || h < it.h - 0.5 };
    y += h + (h > 0 ? gap : 0);
  });
  return out;
}

// How many boxes start below the foot of the window (or show less than
// their heading there): they're there, but out of sight until it's
// scrolled down.
export function belowFold(rects, H, heading = 32) {
  return Object.values(rects).filter((r) => r && r.y + Math.min(r.h ?? heading, heading) > H + 0.5).length;
}
