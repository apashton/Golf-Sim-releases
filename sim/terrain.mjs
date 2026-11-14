// Real ground: heights from open elevation data, as a grid in a hole's frame.
//
// Heights come from the free "Terrain Tiles" on AWS (Terrarium PNGs, built
// from national LiDAR and other open elevation data), zoom 15 - a sample
// every 2.5-5 m, finer the further from the equator. That catches the lie of
// the land - hills, valleys, dunes, a tee raised above a fairway - but not
// the edge of a bunker. Pure functions, shared by the server (which fetches
// the tiles) and the page (which plays on the result).

export const EARTH_R = 6378137;
export const TILE_ZOOM = 15;
const DEG = Math.PI / 180;

// ---- Where things are ---------------------------------------------------------------

// Latitude/longitude to metres east and north of `origin` { lat, lon }. Flat
// is fine over the couple of kilometres a course covers.
export function project(origin, lat, lon) {
  return [(lon - origin.lon) * DEG * EARTH_R * Math.cos(origin.lat * DEG), (lat - origin.lat) * DEG * EARTH_R];
}

export function unproject(origin, east, north) {
  return { lat: origin.lat + north / (EARTH_R * DEG), lon: origin.lon + east / (EARTH_R * DEG * Math.cos(origin.lat * DEG)) };
}

// A hole's frame: x from the tee down the hole, z to the right (see
// course.mjs). tee: [east, north]; heading: radians, 0 = east, anticlockwise.
export function holeFrame(tee, heading) {
  const dx = Math.cos(heading);
  const dn = Math.sin(heading);
  return {
    tee,
    heading,
    // [east, north] -> [x, z]
    toHole: ([e, n]) => {
      const u = e - tee[0];
      const v = n - tee[1];
      return [u * dx + v * dn, u * dn - v * dx];
    },
    // [x, z] -> [east, north]
    toLocal: ([x, z]) => [tee[0] + x * dx + z * dn, tee[1] + x * dn - z * dx],
  };
}

// ---- Terrain tiles ----------------------------------------------------------------------

// Which tile, and where in it, a point falls: fractional tile coordinates.
export function tileCoords(lat, lon, zoom = TILE_ZOOM) {
  const n = 2 ** zoom;
  const x = ((lon + 180) / 360) * n;
  const y = ((1 - Math.asinh(Math.tan(lat * DEG)) / Math.PI) / 2) * n;
  return { x, y };
}

// Metres per pixel of a 256-pixel tile at this latitude.
export function tileResolution(lat, zoom = TILE_ZOOM) {
  return (2 * Math.PI * EARTH_R * Math.cos(lat * DEG)) / (2 ** zoom * 256);
}

// A Terrarium pixel to metres above sea level.
export const terrarium = (r, g, b) => r * 256 + g + b / 256 - 32768;

// Decodes an RGB(A) pixel array (from a PNG) into heights.
export function decodeTerrarium(pixels, channels = 3) {
  const n = pixels.length / channels;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = terrarium(pixels[i * channels], pixels[i * channels + 1], pixels[i * channels + 2]);
  return out;
}

// The tiles needed to cover a box of latitudes and longitudes.
export function tilesFor(box, zoom = TILE_ZOOM) {
  const a = tileCoords(box.north, box.west, zoom);
  const b = tileCoords(box.south, box.east, zoom);
  const out = [];
  for (let x = Math.floor(a.x); x <= Math.floor(b.x); x++) for (let y = Math.floor(a.y); y <= Math.floor(b.y); y++) out.push({ z: zoom, x, y });
  return out;
}

// Height at any latitude/longitude, from decoded tiles.
// getTile(x, y) -> Float32Array(256 * 256) or null. Bilinear between pixels,
// across tile edges. Where there is no data, null.
export function tileSampler(getTile, zoom = TILE_ZOOM) {
  const px = (tx, ty) => {
    const x = Math.floor(tx / 256);
    const y = Math.floor(ty / 256);
    const tile = getTile(x, y);
    if (!tile) return null;
    return tile[(ty - y * 256) * 256 + (tx - x * 256)];
  };
  return (lat, lon) => {
    const t = tileCoords(lat, lon, zoom);
    // Pixel centres sit at +0.5.
    const fx = t.x * 256 - 0.5;
    const fy = t.y * 256 - 0.5;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const u = fx - x0;
    const v = fy - y0;
    const a = px(x0, y0);
    const b = px(x0 + 1, y0);
    const c = px(x0, y0 + 1);
    const d = px(x0 + 1, y0 + 1);
    if (a == null || b == null || c == null || d == null) return a ?? b ?? c ?? d ?? null;
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  };
}

// ---- A height grid --------------------------------------------------------------------------

// { x0, z0, cell, nx, nz, h: Float32Array(nx * nz) }, index iz * nx + ix, in
// a hole's frame. heightAt(x, z) samples it for each point.
export function makeGrid({ x0, z0, x1, z1, cell = 2.5 }, heightAt) {
  const nx = Math.max(2, Math.ceil((x1 - x0) / cell) + 1);
  const nz = Math.max(2, Math.ceil((z1 - z0) / cell) + 1);
  const h = new Float32Array(nx * nz);
  let last = 0;
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const v = heightAt(x0 + ix * cell, z0 + iz * cell);
      // No data (off the edge of the tiles): carry on the last height.
      if (v != null && Number.isFinite(v)) last = v;
      h[iz * nx + ix] = last;
    }
  }
  return { x0, z0, cell, nx, nz, h };
}

// Bilinear height, held at the edge value beyond the grid.
export function gridHeight(g, x, z) {
  let fx = (x - g.x0) / g.cell;
  let fz = (z - g.z0) / g.cell;
  fx = Math.min(Math.max(fx, 0), g.nx - 1.000001);
  fz = Math.min(Math.max(fz, 0), g.nz - 1.000001);
  const ix = Math.floor(fx);
  const iz = Math.floor(fz);
  const u = fx - ix;
  const v = fz - iz;
  const i = iz * g.nx + ix;
  const h = g.h;
  return h[i] * (1 - u) * (1 - v) + h[i + 1] * u * (1 - v) + h[i + g.nx] * (1 - u) * v + h[i + g.nx + 1] * u * v;
}

// Slope [dh/dx, dh/dz]: centred differences half a cell each way, so it
// changes smoothly rather than jumping at every grid line.
export function gridGradient(g, x, z) {
  const e = g.cell * 0.5;
  return [(gridHeight(g, x + e, z) - gridHeight(g, x - e, z)) / (2 * e), (gridHeight(g, x, z + e) - gridHeight(g, x, z - e)) / (2 * e)];
}

// ---- Storing a grid in a course file ----------------------------------------------------

// To JSON: heights in whole centimetres above the lowest point, as base64.
export function packGrid(g) {
  let base = Infinity;
  for (const v of g.h) base = Math.min(base, v);
  base = Math.floor(base * 100) / 100;
  const bytes = new Uint8Array(g.h.length * 2);
  for (let i = 0; i < g.h.length; i++) {
    const cm = Math.max(0, Math.min(65535, Math.round((g.h[i] - base) * 100)));
    bytes[i * 2] = cm & 255;
    bytes[i * 2 + 1] = cm >> 8;
  }
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { x0: g.x0, z0: g.z0, cell: g.cell, nx: g.nx, nz: g.nz, base, cm: btoa(bin) };
}

export function unpackGrid(p) {
  const bin = atob(p.cm);
  const h = new Float32Array(p.nx * p.nz);
  for (let i = 0; i < h.length; i++) h[i] = p.base + (bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8)) / 100;
  return { x0: p.x0, z0: p.z0, cell: p.cell, nx: p.nx, nz: p.nz, h };
}

// A yes/no grid (a Uint8Array of 0s and 1s) to JSON: eight cells a byte,
// as base64 - a metre grid over a whole hole is a dozen kilobytes.
export function packMask(mask) {
  const bytes = new Uint8Array(Math.ceil(mask.length / 8));
  for (let i = 0; i < mask.length; i++) if (mask[i]) bytes[i >> 3] |= 1 << (i & 7);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function unpackMask(text, n) {
  const bin = atob(text);
  const mask = new Uint8Array(n);
  for (let i = 0; i < n; i++) mask[i] = (bin.charCodeAt(i >> 3) >> (i & 7)) & 1;
  return mask;
}

// A stored mask grid { x0, z0, cell, nx, nz, [key]: packed } - its cells,
// unpacked the first time they're asked for and kept with the object.
const unpacked = new WeakMap();
export function maskCells(grid, key) {
  let m = unpacked.get(grid);
  if (!m) unpacked.set(grid, (m = {}));
  return (m[key] ??= unpackMask(grid[key], grid.nx * grid.nz));
}

// Is the cell nearest (x, z) set? Off the grid, no.
export function maskAt(grid, key, x, z) {
  if (!onMask(grid, x, z) || !grid[key]) return false;
  return maskCells(grid, key)[Math.round((z - grid.z0) / grid.cell) * grid.nx + Math.round((x - grid.x0) / grid.cell)] === 1;
}

// Is (x, z) on a mask grid (nearest cell)?
export function onMask(grid, x, z) {
  const ix = Math.round((x - grid.x0) / grid.cell);
  const iz = Math.round((z - grid.z0) / grid.cell);
  return ix >= 0 && iz >= 0 && ix < grid.nx && iz < grid.nz;
}

// Whether a LiDAR surface model has the say on the trees at (x, z) of a
// hole (its canopy grid, see server/lidar.mjs): on its metre grid wherever
// it had data - the real trees found there are the trees - and beyond that,
// over the hole's woods, where it showed bare ground.
export function dsmDecides(canopy, x, z) {
  if (onMask(canopy, x, z)) return maskAt(canopy, "cover", x, z);
  return !!canopy.far && maskAt(canopy.far, "bare", x, z);
}

// ---- Polygons ---------------------------------------------------------------------------------

// [[x, z], ...], either way round, not closed.
// (Each corner read once, carried on as the next edge's other end: asked
// of every spot whose lie is wanted, so kept quick - the same sums.)
export function insidePolygon(poly, x, z) {
  let inside = false;
  const n = poly.length;
  if (!n) return false;
  const last = poly[n - 1];
  let xj = last[0];
  let zj = last[1];
  for (let i = 0; i < n; i++) {
    const p = poly[i];
    const xi = p[0];
    const zi = p[1];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    xj = xi;
    zj = zi;
  }
  return inside;
}

// Distance from (x, z) to the polygon's edge.
export function distanceToEdge(poly, x, z) {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const ax = poly[j][0];
    const az = poly[j][1];
    const bx = poly[i][0];
    const bz = poly[i][1];
    const dx = bx - ax;
    const dz = bz - az;
    const len2 = dx * dx + dz * dz || 1;
    const t = ((x - ax) * dx + (z - az) * dz) / len2;
    let clampedT = t;
    if (clampedT < 0) clampedT = 0;
    else if (clampedT > 1) clampedT = 1;
    const px = x - (ax + dx * clampedT);
    const pz = z - (az + dz * clampedT);
    const distSq = px * px + pz * pz;
    if (distSq < best) best = distSq;
  }
  return Math.sqrt(best);
}

// The same two questions for a hole's kept outlines (its bunkers, greens,
// fairways, water, tees), asked of every spot of a field of tufts or a lie
// grid: a spot outside an outline's box, grown by the reach asked about,
// is outside it and further than that from its edge, so the walk round it
// is skipped (on a hole drawn from a map, a minute and more of tufts on
// Ultra was that walk). Each outline's box kept by the outline: outlines
// aren't changed once made.
const outlineBoxes = new WeakMap();
function outlineBox(poly) {
  let b = outlineBoxes.get(poly);
  if (!b || b.n !== poly.length) outlineBoxes.set(poly, (b = { ...polygonBounds(poly), n: poly.length }));
  return b;
}
const outsideBox = (poly, x, z, grow) => {
  const b = outlineBox(poly);
  return x < b.x0 - grow || x > b.x1 + grow || z < b.z0 - grow || z > b.z1 + grow;
};
// insidePolygon, for a kept outline: inside its box, the walk round it
// only along the edges that reach the spot's band across the outline (its
// box cut into bands along z, each edge listed in every band it spans) -
// the edges a line from the spot can cross, the very same sums, a
// fraction of the walk round a long outline. (Dressing a links hole by
// the sea asked it of every other hole's fairways, greens and tees round
// it and of its own pots: a second and a half of the page held as a hole
// was built ahead, the owner's report of 20 October 2026.)
export const insideOutline = (poly, x, z) => {
  if (outsideBox(poly, x, z, 0)) return false;
  if (poly.length < BANDED) return insidePolygon(poly, x, z);
  const b = outlineBox(poly);
  const bands = (b.bands ??= edgeBands(poly, b));
  const k = Math.min(bands.count - 1, Math.floor((z - b.z0) / bands.height));
  if (!(k >= 0)) return insidePolygon(poly, x, z);
  let inside = false;
  for (let e = bands.start[k]; e < bands.start[k + 1]; e += 2) {
    const [xi, zi] = poly[bands.edges[e]];
    const [xj, zj] = poly[bands.edges[e + 1]];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};
// (Outlines of fewer points are walked whole.)
const BANDED = 16;
// A kept outline's edges by band: about six points' worth of edges a band
// (at most 64 bands); edges as pairs [i, j] of points, as insidePolygon
// takes them, band k's from start[k] to start[k + 1].
function edgeBands(poly, b) {
  const n = poly.length;
  const count = Math.max(1, Math.min(64, Math.floor(n / 6)));
  const height = (b.z1 - b.z0) / count || 1;
  const band = (z) => Math.max(0, Math.min(count - 1, Math.floor((z - b.z0) / height)));
  const lists = Array.from({ length: count }, () => []);
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const lo = band(Math.min(poly[i][1], poly[j][1]));
    const hi = band(Math.max(poly[i][1], poly[j][1]));
    for (let k = lo; k <= hi; k++) lists[k].push(i, j);
  }
  const start = new Int32Array(count + 1);
  for (let k = 0; k < count; k++) start[k + 1] = start[k] + lists[k].length;
  return { count, height, start, edges: Int32Array.from(lists.flat()) };
}
// Whether (x, z) is within `reach` metres of a kept outline's edge: past
// its box, no; else asked of only its edges in the cells round the spot
// (the outline's box cut into cells at least `reach` across, each edge
// listed in every cell its own box reaches: one within reach of the spot
// has a point in the spot's cell or one beside it) - each by the same
// sums as distanceToEdge's. (A hole drawn from a map has its lies worked
// out from bands round its fairways, greens and tees: every spot near one
// walked all of every outline, most of a second as the hole was made
// ready.)
export const nearOutline = (poly, x, z, reach) => {
  if (outsideBox(poly, x, z, reach)) return false;
  if (poly.length < BANDED) return distanceToEdge(poly, x, z) <= reach;
  const b = outlineBox(poly);
  b.grids ??= new Map();
  let g = b.grids.get(reach);
  if (!g) b.grids.set(reach, (g = edgeCells(poly, b, reach)));
  const i = Math.floor((x - b.x0) / g.cell);
  const k = Math.floor((z - b.z0) / g.cell);
  const reachSq = reach * reach;
  for (let a = Math.max(0, i - 1); a <= Math.min(g.nx - 1, i + 1); a++) {
    for (let c = Math.max(0, k - 1); c <= Math.min(g.nz - 1, k + 1); c++) {
      const cell = a * g.nz + c;
      for (let e = g.start[cell]; e < g.start[cell + 1]; e += 2) {
        const pa = poly[g.edges[e + 1]];
        const pb = poly[g.edges[e]];
        const ax = pa[0];
        const az = pa[1];
        const bx = pb[0];
        const bz = pb[1];
        const dx = bx - ax;
        const dz = bz - az;
        const len2 = dx * dx + dz * dz || 1;
        const t = ((x - ax) * dx + (z - az) * dz) / len2;
        let clampedT = t;
        if (clampedT < 0) clampedT = 0;
        else if (clampedT > 1) clampedT = 1;
        const px = x - (ax + dx * clampedT);
        const pz = z - (az + dz * clampedT);
        if (px * px + pz * pz <= reachSq) return true;
      }
    }
  }
  return false;
};
// A kept outline's edges ([i, j] pairs, from point j to point i, as
// distanceToEdge takes them) by cell over its box, cells `reach` across or
// more (at most about 64 along it).
function edgeCells(poly, b, reach) {
  const cell = Math.max(reach, (b.x1 - b.x0 + (b.z1 - b.z0)) / 64, 1e-6);
  const nx = Math.floor((b.x1 - b.x0) / cell) + 1;
  const nz = Math.floor((b.z1 - b.z0) / cell) + 1;
  const lists = Array.from({ length: nx * nz }, () => []);
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a0 = Math.floor((Math.min(poly[i][0], poly[j][0]) - b.x0) / cell);
    const a1 = Math.floor((Math.max(poly[i][0], poly[j][0]) - b.x0) / cell);
    const c0 = Math.floor((Math.min(poly[i][1], poly[j][1]) - b.z0) / cell);
    const c1 = Math.floor((Math.max(poly[i][1], poly[j][1]) - b.z0) / cell);
    for (let a = a0; a <= a1; a++) for (let c = c0; c <= c1; c++) lists[a * nz + c].push(i, j);
  }
  const start = new Int32Array(nx * nz + 1);
  for (let c = 0; c < nx * nz; c++) start[c + 1] = start[c] + lists[c].length;
  return { cell, nx, nz, start, edges: Int32Array.from(lists.flat()) };
}
// Whether (x, z) is surely more than `reach` metres outside a kept outline.
export const beyondOutline = (poly, x, z, reach) => outsideBox(poly, x, z, reach);

export function polygonArea(poly) {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  return a / 2;
}

export function polygonCentroid(poly) {
  let cx = 0;
  let cz = 0;
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const f = poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
    cx += (poly[j][0] + poly[i][0]) * f;
    cz += (poly[j][1] + poly[i][1]) * f;
    a += f;
  }
  if (Math.abs(a) < 1e-9) {
    const n = poly.length || 1;
    // ⚡ Bolt: Replaced poly.reduce with a for loop for performance
    let sx = 0, sz = 0;
    for (let i = 0; i < poly.length; i++) {
      sx += poly[i][0];
      sz += poly[i][1];
    }
    return [sx / n, sz / n];
  }
  return [cx / (3 * a), cz / (3 * a)];
}

export function polygonBounds(poly) {
  let x0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let z1 = -Infinity;
  for (const [x, z] of poly) {
    x0 = Math.min(x0, x);
    z0 = Math.min(z0, z);
    x1 = Math.max(x1, x);
    z1 = Math.max(z1, z);
  }
  return { x0, z0, x1, z1 };
}
