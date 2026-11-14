// Where each tree's picture goes in the far woods' atlas (look/treeatlas.js
// draws them there, look/farwoods.js reads them back). Every kind and shape
// of tree has a cell of its own, in rows of COLS; each tree is drawn as
// large as its cell allows, its foot on the cell's floor, centred across,
// so the picture keeps the tree's own proportions and a card the size of
// the tree (its box) shows exactly it. Pure.

export const COLS = 8;
// A cell, in pixels: High's, and Standard's (half, the woods being
// smaller on a smaller picture).
export const CELL = { high: [128, 256], standard: [64, 128] };
// Pixels left clear round each picture, so a shrunk (mipmapped) picture
// doesn't take colour from its neighbour.
export const PAD = { high: 4, standard: 2 };

// The cells: counts [n0, n1, ...] (shapes of each kind) -> { cells:
// [kind][shape] -> { col, row }, cols, rows }.
export function atlasGrid(counts, cols = COLS) {
  let i = 0;
  const cells = counts.map((n) =>
    Array.from({ length: n }, () => {
      const at = { col: i % cols, row: Math.floor(i / cols) };
      i++;
      return at;
    }),
  );
  return { cells, cols, rows: Math.ceil(i / cols) };
}

// A tree in its cell: box { x0, x1, h } (model units: across from its
// trunk, left and right as seen from the side, and its height above its
// foot), cell { col, row }, size [w, h] pixels a cell, pad pixels, and the
// atlas's size [W, H] pixels. Returns scale (pixels a model unit), the
// picture's foot (px, py: where the trunk stands, in the atlas's pixels, y
// up from the bottom as a texture's is), and its rectangle as texture
// co-ordinates (u0, v0, du, dv; 0 - 1).
export function fitInCell(box, { col, row }, [cw, ch], pad, [W, H]) {
  const wide = Math.max(1e-6, box.x1 - box.x0);
  const tall = Math.max(1e-6, box.h);
  const scale = Math.min((cw - 2 * pad) / wide, (ch - 2 * pad) / tall);
  const w = wide * scale;
  const h = tall * scale;
  const left = col * cw + (cw - w) / 2;
  const bottom = row * ch + pad;
  return {
    scale,
    px: left - box.x0 * scale,
    py: bottom,
    u0: left / W,
    v0: bottom / H,
    du: w / W,
    dv: h / H,
  };
}

// A far tree's picture as its card shows it: the cell's rectangle
// (fitInCell) and its box, mirrored or not. Returns rect [u0, v0, du, dv]
// - du negative when mirrored, so the picture reads right to left - and
// the card's left and right edges across from its trunk, [x0, x1], as a
// share of the tree's height (the box's own x0 and x1 over its h; swapped
// and negated when mirrored, so the trunk stays where it stands).
export function cardFor(fit, box, flip = false) {
  const x0 = box.x0 / box.h;
  const x1 = box.x1 / box.h;
  if (!flip) return { rect: [fit.u0, fit.v0, fit.du, fit.dv], x0, x1 };
  return { rect: [fit.u0 + fit.du, fit.v0, -fit.du, fit.dv], x0: -x1, x1: -x0 };
}
