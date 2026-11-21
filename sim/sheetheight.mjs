// The height of a ground sheet as it's drawn (greenscene.js groundPatch,
// groundRect): a grid of points on the height field, two triangles a cell,
// flat between its points - not the height field's own curve, which a
// coarse sheet's triangles cut under on a rise. What stands on the sheet
// (another hole's trees, the woods, a neighbour's fairway laid over it)
// stands on that, as it does past a mapped hole (look/mappedground.js
// terrainMeshHeight): a tree set on the curve stood clear of the ground
// (half a metre, from Golf Sim Links' 17th, on the 18th's trees).
//
//   sheetHeight({ size | w, d, step, cx, cz }, heightAt, lift) -> (wx, wz) => y
//   coversSheet(spec, wx, wz) -> whether the sheet is over that spot
//
// The sheet's grid is three.js's PlaneGeometry laid flat (greenscene.js
// sheetGeometry): nx by nz cells of w by d metres round (cx, cz), world x
// across and z along, each cell cut from its (x0, z1) corner to its
// (x1, z0). Each point's height is asked for once. Pure.

const dims = ({ size, w = size, d = size, step }) => {
  const square = size != null;
  const nx = square ? Math.round(size / step) : Math.max(1, Math.round(w / step));
  const nz = square ? nx : Math.max(1, Math.round(d / step));
  return { w, d, nx, nz };
};

export function coversSheet(spec, wx, wz) {
  const { w, d } = dims(spec);
  return Math.abs(wx - (spec.cx ?? 0)) <= w / 2 && Math.abs(wz - (spec.cz ?? 0)) <= d / 2;
}

export function sheetHeight(spec, heightAt, lift = 0) {
  const { w, d, nx, nz } = dims(spec);
  const x0 = (spec.cx ?? 0) - w / 2;
  const z0 = (spec.cz ?? 0) - d / 2;
  const sx = w / nx;
  const sz = d / nz;
  const known = new Map();
  const at = (i, j) => {
    const k = j * (nx + 1) + i;
    let h = known.get(k);
    if (h === undefined) {
      h = heightAt(x0 + i * sx, z0 + j * sz) + lift;
      known.set(k, h);
    }
    return h;
  };
  return (wx, wz) => {
    const fx = Math.min(nx - 1e-9, Math.max(0, (wx - x0) / sx));
    const fz = Math.min(nz - 1e-9, Math.max(0, (wz - z0) / sz));
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    const u = fx - i;
    const v = fz - j;
    // Which of the cell's two triangles: (i, j), (i, j+1), (i+1, j), or
    // (i, j+1), (i+1, j+1), (i+1, j).
    if (u + v <= 1) {
      const h00 = at(i, j);
      return h00 + u * (at(i + 1, j) - h00) + v * (at(i, j + 1) - h00);
    }
    const h11 = at(i + 1, j + 1);
    return h11 + (1 - u) * (at(i, j + 1) - h11) + (1 - v) * (at(i + 1, j) - h11);
  };
}

// The first of a list of sheets (in the list's order: the finest first)
// over a spot, found through 64 m squares rather than by trying every one
// (a crop's ground is laid in up to a hundred and fifty pieces, and this
// is asked for every point of what's laid over it). items: [{ spec, ... }].
// Returns (wx, wz) -> the item, or null.
export function sheetFinder(items, bucket = 64) {
  const grid = new Map();
  items.forEach((item, order) => {
    const { w, d } = dims(item.spec);
    const cx = item.spec.cx ?? 0;
    const cz = item.spec.cz ?? 0;
    for (let i = Math.floor((cx - w / 2) / bucket); i <= Math.floor((cx + w / 2) / bucket); i++)
      for (let j = Math.floor((cz - d / 2) / bucket); j <= Math.floor((cz + d / 2) / bucket); j++) {
        const k = `${i},${j}`;
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(order);
      }
  });
  return (wx, wz) => {
    const list = grid.get(`${Math.floor(wx / bucket)},${Math.floor(wz / bucket)}`);
    if (!list) return null;
    for (const order of list) if (coversSheet(items[order].spec, wx, wz)) return items[order];
    return null;
  };
}
