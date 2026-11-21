// A leaf picture's edges grown by a pixel or two (look/trees.js
// dilateCutout): each see-through pixel next to a leaf takes the leaves'
// average colour round it, at a low alpha, so the small versions of the
// card (and alpha-to-coverage) don't fringe dark.
//
// Most see-through pixels have no leaf anywhere near them, and looking at
// every pixel of the (2r+1) x (2r+1) box round each of them was most of
// the work: the largest single step of building the range on Ultra (the
// leaf pictures are a thousand pixels square there, nine of them, painted
// as the game starts). So the leaves along each row are counted first (a
// running count, one step a pixel), the box's count is a column of those,
// and only a pixel with leaves round it has their colours added up - the
// same sums as before, so the very same picture. Pure: pixels in, pixels
// out.

// Leaf pixels: those this solid count towards the colour round them.
export const LEAF_ALPHA = 200;
// See-through pixels: those this faint or fainter take it.
export const CLEAR_ALPHA = 16;
// The alpha a grown pixel gets.
export const GROWN_ALPHA = 32;

// src: the picture's RGBA bytes (read only); out: where the grown picture
// goes (a copy of src - or src itself, its own copy taken first - as a
// Uint8ClampedArray, so a colour's rounded as the canvas's own data
// rounds it). The edge `radius` pixels in from each side are left as
// they were, as the box round them would run off the picture.
export function dilatePixels(src, out, w, h, radius) {
  const r = Math.max(0, Math.floor(radius));
  if (!r || w <= 2 * r || h <= 2 * r) return out;
  const from = src === out ? src.slice() : src;
  // The leaf pixels along each row within r of each pixel (for the columns
  // that are worked out, r .. w-1-r): a running count.
  const rows = new Int32Array(w * h);
  for (let y = 0; y < h; y++) {
    const line = y * w;
    let n = 0;
    for (let x = 0; x < 2 * r; x++) if (from[(line + x) * 4 + 3] >= LEAF_ALPHA) n++;
    for (let x = r; x < w - r; x++) {
      if (from[(line + x + r) * 4 + 3] >= LEAF_ALPHA) n++;
      rows[line + x] = n;
      if (from[(line + x - r) * 4 + 3] >= LEAF_ALPHA) n--;
    }
  }
  for (let y = r; y < h - r; y++) {
    for (let x = r; x < w - r; x++) {
      const i = (y * w + x) * 4;
      if (from[i + 3] > CLEAR_ALPHA) continue;
      // The box's leaves: a column of the rows' counts. None: nothing to do.
      let n = 0;
      for (let dy = -r; dy <= r; dy++) n += rows[(y + dy) * w + x];
      if (!n) continue;
      let cr = 0;
      let cg = 0;
      let cb = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const j = ((y + dy) * w + (x + dx)) * 4;
          if (from[j + 3] < LEAF_ALPHA) continue;
          cr += from[j];
          cg += from[j + 1];
          cb += from[j + 2];
        }
      }
      out[i] = cr / n;
      out[i + 1] = cg / n;
      out[i + 2] = cb / n;
      out[i + 3] = GROWN_ALPHA;
    }
  }
  return out;
}
