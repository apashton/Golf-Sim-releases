// The country past the trees: where the fields, hedgerows, tracks, ponds and
// woods lie round a hole, the range or a practice green, how far it starts
// from play, the far woods' trees, the glimpses of a course's other holes, a
// fuller backdrop behind each green, each hole's character, and the eased
// skirt round a mapped hole. All of it scenery, none of it in play: it lies
// beyond where a ball can finish.
//
// Pure functions, so where everything goes can be tested; look/country.js
// paints the country onto the far ground and look/farwoods.js draws the far
// woods. Positions here are in whatever frame they're asked in (the world's
// x and z for the country and its woods; the hole's frame for the glimpses
// and the backdrop, as the hole's own trees are).

import { seeded, seedName, makePath, pointAt, nearest, blobRadius } from "./course.mjs";
import { KINDS, shapeCount } from "./treeshapes.mjs";

// ---- Numbers ------------------------------------------------------------------

export const COUNTRY = {
  // How far past the end of what plays (the line of play's lost-ball reach)
  // the country starts to show, and over how many metres it comes in.
  start: 90,
  fade: 100,
  // The far woods: from this far out from play to this far.
  woodsNear: 150,
  woodsFar: 900,
  // How many far trees on Medium (Standard: half; High: woodsHigh times
  // as many).
  woodsCount: 3000,
  woodsHigh: 1.5,
  // Fields: their sites this far apart, on average.
  spacing: 170,
  // A hedgerow's or track's half width, metres.
  hedge: 2.6,
  track: 1.6,
  // Glimpsed holes stand at least this far off the line of play.
  glimpseClear: 120,
  // Under a tree's crown the ground is darkened by at most this much (and
  // its leaf litter takes no more than LITTER of it).
  shade: 0.3,
  litter: 0.12,
};

// The camera's far limit (every mode's PerspectiveCamera), and the furthest
// the far ridge stands from the backdrop's centre: inside it, from any
// camera on a hole (none is ever more than HOLE_REACH from that centre).
export const CAMERA_FAR = 6000;
export const RIDGE_FAR = 4600;
export const HOLE_REACH = 900;

import { clamp, smoothstep } from "./mathutil.mjs";
export { smoothstep };

// A number 0 - 1 from two integers and a seed: the same every time.
export function hash2(i, j, seed = 0) {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(j | 0, 0x165667b1) ^ Math.imul(seed | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Smooth value noise, 0 - 1, about one feature per `scale` metres.
export function valueNoise(x, z, scale, seed = 0) {
  const fx = x / scale;
  const fz = z / scale;
  const i = Math.floor(fx);
  const j = Math.floor(fz);
  const u = fx - i;
  const v = fz - j;
  const su = u * u * (3 - 2 * u);
  const sv = v * v * (3 - 2 * v);
  const a = hash2(i, j, seed);
  const b = hash2(i + 1, j, seed);
  const c = hash2(i, j + 1, seed);
  const d = hash2(i + 1, j + 1, seed);
  return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
}

// A seed from a name (a course's id), so each course has its own country.
export function nameSeed(name = "") {
  let h = 2166136261;
  for (const ch of String(name)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

// ---- A hole's character ---------------------------------------------------------

// Each hole has a character, from its seed: it sets how thick the country's
// woods are, what its fields are, how many ponds, how full the backdrop
// behind the green, and the mix of what dresses the rough. For the look
// only: nothing that plays changes.
export const CHARACTERS = ["woodland", "parkland", "heath", "lakeside"];
export const CHARACTER = {
  woodland: { woods: 0.42, conifer: 0.35, ponds: 0.03, hedges: 0.75, belts: 0.12, backdrop: 26, fields: { pasture: 4, meadow: 2, straw: 1, stubble: 1 }, dress: { heather: 0.4, gorse: 0.5, bracken: 1, stumps: 1, flowers: 0.6, fescue: 0.6 } },
  parkland: { woods: 0.26, conifer: 0.15, ponds: 0.04, hedges: 0.85, belts: 0.18, backdrop: 18, fields: { pasture: 4, meadow: 3, straw: 2, stubble: 1 }, dress: { heather: 0.35, gorse: 0.35, bracken: 0.5, flowers: 1, fescue: 0.7 } },
  heath: { woods: 0.16, conifer: 0.55, ponds: 0.02, hedges: 0.35, belts: 0.06, backdrop: 9, fields: { heath: 4, meadow: 2, straw: 1, stubble: 1, pasture: 1 }, dress: { flowers: 0.5, lilies: 0.6, reeds: 0.7 } },
  lakeside: { woods: 0.24, conifer: 0.1, ponds: 0.12, hedges: 0.7, belts: 0.25, backdrop: 14, fields: { pasture: 4, meadow: 3, straw: 1, stubble: 1 }, dress: { heather: 0.4, gorse: 0.4, bracken: 0.6 } },
};

export function holeCharacter(seed = 1) {
  return CHARACTERS[Math.floor(hash2(seed | 0, 77, 0x3c6ef372) * CHARACTERS.length)];
}

// A links hole (a designed hole with no trees: course.mjs buildHole's trees
// "none") is always a links: long grass and dunes round it, not woods. It's
// never rolled for a hole of trees (not one of CHARACTERS).
CHARACTER.links = { woods: 0.03, conifer: 0.6, ponds: 0.02, hedges: 0.1, belts: 0.02, backdrop: 0, fields: { dunes: 5, heath: 2, meadow: 1 }, dress: { flowers: 0.4, bracken: 0.2, stumps: 0 } };
// A green links (course.mjs trees "greenlinks"): grazing and hay meadows
// round it rather than dunes, still hardly a tree.
CHARACTER.linksgreen = { woods: 0.03, conifer: 0.5, ponds: 0.02, hedges: 0.3, belts: 0.03, backdrop: 0, fields: { pasture: 4, meadow: 3, heath: 1 }, dress: { flowers: 0.6, bracken: 0.2, stumps: 0, gorse: 0.6 } };

// A course's hole's country seed: from the course (seedName: its id, or its name)
// and the hole's number - so the hole has the same country, character and
// woods whichever hole of the course it's seen from.
export function courseHoleSeed(course, number = 1) {
  return (nameSeed(seedName(course)) ^ Math.imul((number ?? 1) + 1, 0x9e3779b1)) >>> 0;
}

// A hole's character from its layout and seed: links for a links hole,
// else rolled (holeCharacter).
export function characterFor(L, seed) {
  if (L?.links) return L.links === "green" ? "linksgreen" : "links";
  return holeCharacter(seed);
}

// The rough's dressing (sim/dressing.mjs roughDressing) thinned for a
// hole's character: a heath keeps all its heather and gorse, woodland its
// bracken and stumps, a lakeside its reeds and lilies. Only ever fewer, the
// same ones every time.
export function dressFor(character, dressing) {
  const keep = CHARACTER[character]?.dress;
  if (!keep || !dressing) return dressing;
  const out = { ...dressing };
  for (const [kind, share] of Object.entries(keep)) {
    if (!Array.isArray(out[kind]) || share >= 1) continue;
    out[kind] = out[kind].filter((_, i) => hash2(i, kind.length, 0x51ed) < share);
  }
  return out;
}

// What a hole's scenery has beyond the country, by who draws it: the
// course's designed holes have glimpses of other holes, a fuller backdrop
// and a character; a mapped hole is its real ground (its course's own woods
// stand in for the rest); the Driving Challenge's hole, drawn to a
// player's drive with trees of its own rules, has none of them.
export function holeExtras({ challenge = null, mapped = false } = {}) {
  const plain = challenge === "driving";
  return { glimpses: !plain && !mapped, backdrop: !plain && !mapped, character: !plain };
}

// ---- How far from play ---------------------------------------------------------------

// The distance from (x, z) to a line of points (the line of play).
export function lineDistance(points, x, z) {
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    const ax = points[i - 1][0];
    const az = points[i - 1][1];
    const ex = points[i][0] - ax;
    const ez = points[i][1] - az;
    let f = ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez || 1);
    if (f < 0) f = 0;
    else if (f > 1) f = 1;
    const px = ax + ex * f - x;
    const pz = az + ez * f - z;
    const d2 = px * px + pz * pz;
    if (d2 < best) best = d2;
  }
  if (points.length === 1) return Math.hypot(x - points[0][0], z - points[0][1]);
  return Math.sqrt(best);
}

// The distance from (x, z) to a box { x0, x1, z0, z1 } (0 inside).
export function boxDistance(b, x, z) {
  const dx = Math.max(b.x0 - x, 0, x - b.x1);
  const dz = Math.max(b.z0 - z, 0, z - b.z1);
  return Math.hypot(dx, dz);
}

// How far beyond where a ball can finish (x, z) is: a function (x, z) ->
// metres past it (0 or less inside), from what plays -
//   line   the line of play (points), and reach: how far either side a
//          ball can finish (the lost-ball distance, or a mapped hole's box)
//   box    a box that plays (a mapped hole's ground, the range)
// whichever is nearer.
export function playReach({ line = null, reach = 0, box = null, boxReach = 0 } = {}) {
  return (x, z) => {
    let d = Infinity;
    if (line) d = Math.min(d, lineDistance(line, x, z) - reach);
    if (box) d = Math.min(d, boxDistance(box, x, z) - boxReach);
    return d;
  };
}

// How much of the country shows at `past` metres beyond play: none inside
// COUNTRY.start, all of it COUNTRY.fade further out.
export function countryWeight(past) {
  return smoothstep(COUNTRY.start, COUNTRY.start + COUNTRY.fade, past);
}

// ---- The patchwork ---------------------------------------------------------------------

// Fields round sites on a jittered grid: each point belongs to its nearest
// site's field, and where two fields meet runs a hedgerow, a farm track,
// a shelterbelt of poplars, or nothing (an open boundary). Some fields are
// woods (broadleaf or conifer), and the odd one holds a pond.
//   seed       the country's seed
//   character  the hole's (CHARACTER), for its woods, fields and ponds
export function makeCountry({ seed = 1, character = "parkland", spacing = COUNTRY.spacing } = {}) {
  const look = CHARACTER[character] ?? CHARACTER.parkland;
  const kinds = Object.entries(look.fields);
  const total = kinds.reduce((s, [, w]) => s + w, 0);
  const cache = new Map();
  const site = (i, j) => {
    const key = i * 100003 + j;
    let s = cache.get(key);
    if (s) return s;
    const h = (k) => hash2(i * 7 + k, j * 13 - k, seed);
    // Fields are longer one way than the other (stretched along a
    // direction of their own), as old field systems are.
    const x = (i + 0.15 + 0.7 * h(1)) * spacing;
    const z = (j + 0.15 + 0.7 * h(2)) * spacing;
    let kind;
    const r = h(3);
    if (r < look.woods) kind = h(4) < look.conifer ? "conifer" : "wood";
    else {
      let pick = h(5) * total;
      kind = kinds[kinds.length - 1][0];
      for (const [k, w] of kinds) {
        if ((pick -= w) < 0) {
          kind = k;
          break;
        }
      }
    }
    const pond = kind !== "wood" && kind !== "conifer" && h(6) < look.ponds ? { r: 14 + h(7) * 22, sq: 0.6 + h(8) * 0.5, ox: (h(9) - 0.5) * 30, oz: (h(10) - 0.5) * 30 } : null;
    // Its shade: fields of a kind aren't all the same.
    s = { i, j, x, z, kind, pond, shade: h(11) };
    cache.set(key, s);
    return s;
  };
  // What lies between two fields: by the pair, the same either way round.
  const boundary = (a, b) => {
    const swap = a.i * 1000 + a.j > b.i * 1000 + b.j;
    const p = swap ? b : a;
    const q = swap ? a : b;
    const h = hash2(p.i * 31 + q.i, p.j * 17 + q.j, seed ^ 0x5bd1);
    if (a.kind === "wood" || a.kind === "conifer" || b.kind === "wood" || b.kind === "conifer") return h < 0.25 ? "track" : null;
    if (h < 0.16) return "track";
    if (h < 0.16 + look.belts) return "belt";
    if (h < 0.16 + look.belts + look.hedges * (1 - 0.16 - look.belts)) return "hedge";
    return null;
  };
  // The two nearest sites to (x, z), and how far (x, z) is from the line
  // between their fields.
  // (The last cell's nine sites kept: neighbouring points mostly share it.)
  let lastI = NaN;
  let lastJ = NaN;
  const near9 = [];
  const at = (x, z) => {
    const ci = Math.floor(x / spacing);
    const cj = Math.floor(z / spacing);
    if (ci !== lastI || cj !== lastJ) {
      lastI = ci;
      lastJ = cj;
      near9.length = 0;
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) near9.push(site(ci + di, cj + dj));
    }
    let a = null;
    let b = null;
    let da = Infinity;
    let db = Infinity;
    for (let k = 0; k < 9; k++) {
      {
        const s = near9[k];
        const d = (s.x - x) * (s.x - x) + (s.z - z) * (s.z - z);
        if (d < da) {
          b = a;
          db = da;
          a = s;
          da = d;
        } else if (d < db) {
          b = s;
          db = d;
        }
      }
    }
    // Distance to the bisector between the two.
    const sep = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    near.site = a;
    near.other = b;
    near.edge = (db - da) / (2 * sep);
    return near;
  };
  const near = { site: null, other: null, edge: 0 };
  // What's at (x, z): { kind, line, site, edge } - the field's kind (or
  // "pond"), the hedge, track or belt it's on if any, its field's site and
  // how far it is from the field's edge. (One object, filled in again at
  // each call: read it before the next.)
  const here = { kind: "", line: null, site: null, edge: 0 };
  const what = (x, z) => {
    const { site: s, other, edge } = at(x, z);
    here.site = s;
    here.edge = edge;
    here.line = null;
    here.kind = s.kind;
    if (s.pond) {
      const dx = x - s.x - s.pond.ox;
      const dz = (z - s.z - s.pond.oz) / s.pond.sq;
      if (dx * dx + dz * dz < s.pond.r * s.pond.r) {
        here.kind = "pond";
        return here;
      }
    }
    if (edge < COUNTRY.hedge) {
      const b = boundary(s, other);
      const half = b === "track" ? COUNTRY.track : COUNTRY.hedge;
      if (b && edge < half) here.line = b;
    }
    return here;
  };
  return { seed, character, look, site, at, what, boundary };
}

// ---- The country's picture -------------------------------------------------------------

// The country as one square picture over the ground (box: { x0, z0, size }
// metres; n pixels a side), for look/country.js to lay over the far
// ground's own grass: each pixel's colour premultiplied by how much it
// covers (alpha), in linear light, so the ground's shader takes
//   ground * (1 - alpha) + colour
// - none of it near play, all of it out in the country. On it:
//   country   makeCountry's
//   past      (x, z) -> metres beyond play (playReach)
//   colours   { pasture, meadow, straw, stubble, heath, wood, conifer,
//             pond, hedge, track, belt, floor }: linear [r, g, b]
//   lines     the hedgerows, tracks and belts drawn (false on Standard)
//   floor     the woods floor beyond the tree lines of a designed hole:
//             (x, z) -> 0 - 1, how much (null: none)
// Returns a Uint8Array of n * n * 4 (rows along z).
export function paintCountry({ box, n, country, past, colours, lines = true, floor = null }) {
  const out = new Uint8Array(n * n * 4);
  const cell = box.size / n;
  const px = [0, 0, 0, 0];
  // How far past play, worked out every few pixels and filled in between
  // (it changes smoothly, and it's most of the work).
  const step = 4;
  const m = Math.ceil(n / step) + 1;
  const coarse = new Float32Array(m * m);
  for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) coarse[j * m + i] = past(box.x0 + (i * step + 0.5) * cell, box.z0 + (j * step + 0.5) * cell);
  const pastAt = (col, row) => {
    const i = Math.floor(col / step);
    const j = Math.floor(row / step);
    const u = (col - i * step) / step;
    const v = (row - j * step) / step;
    const a = coarse[j * m + i];
    const b = coarse[j * m + i + 1];
    const c = coarse[(j + 1) * m + i];
    const d = coarse[(j + 1) * m + i + 1];
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
  };
  let col = 0;
  let row = 0;
  const opts = { country, past: () => pastAt(col, row), colours, lines, floor };
  for (row = 0; row < n; row++) {
    const z = box.z0 + (row + 0.5) * cell;
    for (col = 0; col < n; col++) {
      const x = box.x0 + (col + 0.5) * cell;
      countryPixel(x, z, opts, px);
      const k = (row * n + col) * 4;
      out[k] = Math.round(px[0] * 255);
      out[k + 1] = Math.round(px[1] * 255);
      out[k + 2] = Math.round(px[2] * 255);
      out[k + 3] = Math.round(px[3] * 255);
    }
  }
  return out;
}

// One spot of it: [r, g, b, a] (premultiplied) into `out`.
export function countryPixel(x, z, { country, past, colours, lines = true, floor = null }, out = [0, 0, 0, 0]) {
  const p = past(x, z);
  const w = countryWeight(p);
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  if (w > 0) {
    const here = country.what(x, z);
    let c = colours[here.kind] ?? colours.pasture;
    if (here.line && lines) c = colours[here.line] ?? c;
    // Fields of a kind vary a little, field to field.
    const v = here.kind === "pond" || (here.line && lines) ? 1 : 0.9 + 0.2 * here.site.shade;
    r = c[0] * v * w;
    g = c[1] * v * w;
    b = c[2] * v * w;
    a = w;
  }
  // Beyond a designed hole's tree lines, the woods floor (under the
  // country, which takes over further out).
  const f = floor ? floor(x, z) * (1 - w) : 0;
  if (f > 0) {
    r += colours.floor[0] * f;
    g += colours.floor[1] * f;
    b += colours.floor[2] * f;
    a += f;
  }
  out[0] = r;
  out[1] = g;
  out[2] = b;
  out[3] = a;
  return out;
}

// ---- Shade under the trees ---------------------------------------------------------------

// Under a crown: how much the ground is darkened (shade) and how much of
// it is leaf litter or needles (litter) at `d` metres from the trunk of a
// crown `r` across. Never more than COUNTRY.shade darker all told - the
// litter is mixed in at near the ground's own brightness.
export function canopyAt(d, r) {
  const k = 1 - smoothstep(r * 0.55, r * 1.15, d);
  return { shade: COUNTRY.shade * k * 0.8, litter: COUNTRY.litter * k };
}

// Lays the trees' shade over a country picture (paintCountry's): each tree
// [x, z, r] (crown radius, metres) darkens the ground under it, a little
// offset away from the sun (shadow: [dx, dz] metres per metre of radius),
// with leaf litter (litter: linear [r, g, b]) - or needles, under a pine.
// Where crowns overlap the shade doesn't pile up past COUNTRY.shade.
export function paintCanopy(pixels, { box, n, trees, litter, shadow = [0, 0] }) {
  const cell = box.size / n;
  const shade = new Float32Array(n * n);
  const leaf = new Float32Array(n * n);
  for (const [x, z, r] of trees) {
    const cx = x + shadow[0] * r;
    const cz = z + shadow[1] * r;
    const reach = r * 1.2;
    const c0 = Math.max(0, Math.floor((cx - reach - box.x0) / cell));
    const c1 = Math.min(n - 1, Math.ceil((cx + reach - box.x0) / cell));
    const r0 = Math.max(0, Math.floor((cz - reach - box.z0) / cell));
    const r1 = Math.min(n - 1, Math.ceil((cz + reach - box.z0) / cell));
    for (let row = r0; row <= r1; row++) {
      const pz = box.z0 + (row + 0.5) * cell;
      for (let col = c0; col <= c1; col++) {
        const px = box.x0 + (col + 0.5) * cell;
        const { shade: s, litter: l } = canopyAt(Math.hypot(px - cx, pz - cz), r);
        const k = row * n + col;
        shade[k] = Math.max(shade[k], s);
        leaf[k] = Math.max(leaf[k], l);
      }
    }
  }
  for (let k = 0; k < n * n; k++) {
    const s = shade[k];
    const l = leaf[k];
    if (s <= 0 && l <= 0) continue;
    // ground' = (ground * (1 - a) + c) * (1 - s - l) + litter * l
    const keep = 1 - s - l;
    const i = k * 4;
    const a = pixels[i + 3] / 255;
    pixels[i] = Math.round(clamp((pixels[i] / 255) * keep + litter[0] * l, 0, 1) * 255);
    pixels[i + 1] = Math.round(clamp((pixels[i + 1] / 255) * keep + litter[1] * l, 0, 1) * 255);
    pixels[i + 2] = Math.round(clamp((pixels[i + 2] / 255) * keep + litter[2] * l, 0, 1) * 255);
    pixels[i + 3] = Math.round(clamp(1 - (1 - a) * keep, 0, 1) * 255);
  }
  return pixels;
}

// ---- The far woods ----------------------------------------------------------------------

// The far woods are pictures of the course's own trees (look/treeatlas.js
// draws each kind and shape once, from the side): every kind the near
// trees come in (sim/treeshapes.mjs KINDS) can stand among them.
export const FAR_KINDS = KINDS;

// How tall each kind stands out in the woods, and how wide, in metres
// (each tree then 0.8 - 1.25 of that): grown trees, as the old painted
// woods had them.
export const FAR_SIZE = {
  pine: [18, 8],
  leaf: [19, 14],
  birch: [15, 7],
  willow: [12, 13],
  poplar: [24, 5.5],
  bush: [3.5, 4],
  scots: [19, 10],
  oak: [17, 15],
  column: [12, 4],
  spruce: [21, 8],
  snag: [13, 7],
  beech: [21, 16],
  chestnut: [19, 15],
  cedar: [17, 18],
  holly: [9, 5],
  hawthorn: [7, 7],
};

// What the woods are made of, by the hole's character (sim/country.mjs
// CHARACTER): for each place a far tree stands - a broadleaf wood, a
// conifer block, a shelterbelt, a hedgerow - its kinds and how often each.
// A heath's woods mostly Scots pine and spruce, a parkland's oaks and
// broadleaves, a lakeside's willows and poplars among them; now and then a
// dead snag in a wood, and bushes along a hedge.
const FAR_MIX = {
  woodland: {
    wood: { leaf: 3, oak: 2.2, beech: 2.4, birch: 1.5, poplar: 0.2, holly: 0.6, snag: 0.08 },
    conifer: { spruce: 3, pine: 2, scots: 1.5, birch: 0.4 },
  },
  parkland: {
    wood: { oak: 3, leaf: 3, beech: 2, chestnut: 1.2, birch: 1, poplar: 0.3, scots: 0.3, cedar: 0.15, snag: 0.05 },
    conifer: { spruce: 2.5, pine: 2, scots: 1.5, column: 0.4, birch: 0.4 },
  },
  heath: {
    wood: { birch: 3, scots: 2, oak: 1, leaf: 0.6, holly: 0.5, hawthorn: 0.4, snag: 0.1 },
    conifer: { scots: 3.5, spruce: 2, pine: 1, birch: 0.6 },
  },
  lakeside: {
    wood: { leaf: 2.2, oak: 1.5, willow: 1.4, poplar: 1, birch: 1, chestnut: 0.6, snag: 0.04 },
    conifer: { spruce: 2.5, pine: 2, scots: 1, birch: 0.5 },
  },
};
// A links: what few trees there are, wind-bent pines and birches among gorse.
FAR_MIX.links = {
  wood: { birch: 2, scots: 2, bush: 2.5, hawthorn: 1.5, snag: 0.1 },
  conifer: { scots: 3, pine: 1.5, bush: 1 },
};
FAR_MIX.linksgreen = FAR_MIX.links;
const FAR_LINES = {
  belt: { poplar: 4, birch: 1 },
  hedge: { oak: 3, hawthorn: 2.5, leaf: 2, bush: 1.5, birch: 0.8, holly: 0.5 },
};
// Which places each kind may stand in, when it's pulled in by the trees
// near play (farMix).
const FAR_PLACE = {
  pine: "conifer",
  scots: "conifer",
  spruce: "conifer",
  column: "conifer",
  leaf: "wood",
  oak: "wood",
  birch: "wood",
  willow: "wood",
  poplar: "wood",
  snag: "wood",
  bush: "hedge",
  beech: "wood",
  chestnut: "wood",
  cedar: "conifer",
  holly: "wood",
  hawthorn: "hedge",
};
// How strongly the trees near play pull the woods towards themselves:
// with this share of a place's picks given over to their mix.
export const NEAR_PULL = 0.5;

// The woods' mix for a hole: { wood, conifer, belt, hedge }, each { kind:
// weight }, from its character, pulled towards the kinds of the trees near
// play (near: { kind: count }, or a list of kind names), so the woods past
// a hole are the same trees as the hole's own - a course of willows and
// birches has willows and birches out in its woods. Pure.
export function farMix(character = "parkland", near = {}) {
  const base = FAR_MIX[character] ?? FAR_MIX.parkland;
  const counts = Array.isArray(near) ? near.reduce((a, k) => ((a[k] = (a[k] ?? 0) + 1), a), {}) : near ?? {};
  const out = {};
  for (const [place, mix] of Object.entries({ ...base, ...FAR_LINES })) {
    const own = { ...mix };
    const total = Object.values(own).reduce((a, b) => a + b, 0);
    const here = Object.entries(counts).filter(([k, n]) => FAR_PLACE[k] === place && n > 0);
    const seen = here.reduce((a, [, n]) => a + n, 0);
    if (seen > 0) for (const [k, n] of here) own[k] = (own[k] ?? 0) + (total * NEAR_PULL * n) / seen / (1 - NEAR_PULL);
    out[place] = own;
  }
  return out;
}

// A kind from a mix { kind: weight }, r even in 0 - 1.
export function pickKind(mix, r) {
  const list = Object.entries(mix);
  let left = r * list.reduce((a, [, w]) => a + w, 0);
  for (const [k, w] of list) if ((left -= w) < 0) return k;
  return list[list.length - 1][0];
}

// The far woods' trees round play: { x, z, h, w, kind, shape, tint, flip,
// stretch } - in the country's woods (broadleaf and conifer blocks, with
// clearings), in rows along its shelterbelts, and now and then along a
// hedgerow - all from COUNTRY.woodsNear to COUNTRY.woodsFar beyond play,
// and inside `box` ({ x0, x1, z0, z1 }: the ground drawn). count: at most
// this many. Each is one of the course's kinds (FAR_KINDS) and one of its
// shapes, from the hole's mix (farMix: its character, and near, the kinds
// of the trees near play); flip: drawn mirrored; stretch: a little wider
// or narrower than its picture - so the pictures go further. avoid(x, z):
// where none may stand (the course's other holes' open ground:
// sim/neighbours.mjs neighbourGround).
export function farWoods({ country, past, box, count = COUNTRY.woodsCount, seed = 1, near = {}, avoid = null }) {
  const rand = seeded((seed ^ 0xf00d5) >>> 0 || 1);
  const mix = farMix(country.character, near);
  const out = [];
  const tries = count * 14;
  const w = box.x1 - box.x0;
  const d = box.z1 - box.z0;
  const kindAt = (here) => {
    const r = rand();
    if (here.line === "belt") return pickKind(mix.belt, r);
    if (here.line === "hedge") return pickKind(mix.hedge, r);
    if (here.kind === "conifer") return pickKind(mix.conifer, r);
    return pickKind(mix.wood, r);
  };
  for (let t = 0; t < tries && out.length < count; t++) {
    const x = box.x0 + rand() * w;
    const z = box.z0 + rand() * d;
    const p = past(x, z);
    if (p < COUNTRY.woodsNear || p > COUNTRY.woodsFar) continue;
    if (avoid?.(x, z)) continue;
    const here = country.what(x, z);
    let keep = 0;
    if (here.line === "belt") keep = 0.9;
    else if (here.line === "hedge") keep = 0.16;
    else if (here.kind === "wood" || here.kind === "conifer") {
      // Clearings, and the wood thinning towards its edges.
      const open = valueNoise(x, z, 60, country.seed ^ 0x77);
      keep = open < 0.3 ? 0.02 : smoothstep(0, 18, here.edge ?? 99) * 0.75;
    }
    if (rand() >= keep) continue;
    const kind = kindAt(here);
    const size = 0.8 + rand() * 0.45;
    const [h, wd] = FAR_SIZE[kind];
    const stretch = 0.85 + rand() * 0.3;
    const shape = Math.floor(rand() * shapeCount(KINDS.indexOf(kind)));
    out.push({ x, z, h: h * size, w: wd * size * stretch, kind, shape, tint: rand(), flip: rand() < 0.5, stretch });
  }
  return out;
}

// A mapped course's other holes' trees, in this hole's frame: each hole's
// trees [x, z, size, ...] are in its own frame (sim/terrain.mjs holeFrame,
// from layout.geo's tee and heading). Those outside this hole's box
// (`region`, grown by `margin`) and within `reach` of it are kept, as
// [x, z, size] in this hole's frame.
export function courseTrees(holes, index, { margin = 10, reach = COUNTRY.woodsFar } = {}) {
  const me = holes[index]?.layout;
  if (!me?.geo || !me.region) return [];
  const frame = (geo) => {
    const dx = Math.cos(geo.heading);
    const dn = Math.sin(geo.heading);
    const [te, tn] = geo.tee;
    return {
      toLocal: ([x, z]) => [te + x * dx + z * dn, tn + x * dn - z * dx],
      toHole: ([e, n]) => {
        const u = e - te;
        const v = n - tn;
        return [u * dx + v * dn, u * dn - v * dx];
      },
    };
  };
  const mine = frame(me.geo);
  const r = me.region;
  const grown = { x0: r.x0 - margin, x1: r.x1 + margin, z0: r.z0 - margin, z1: r.z1 + margin };
  const out = [];
  holes.forEach((h, i) => {
    const L = h.layout;
    if (i === index || !L?.geo || !L.trees) return;
    const theirs = frame(L.geo);
    for (const t of L.trees) {
      const [x, z] = mine.toHole(theirs.toLocal([t[0], t[1]]));
      const d = boxDistance(grown, x, z);
      if (d <= 0 || d > reach) continue;
      out.push([x, z, t[2] ?? 1]);
    }
  });
  return out;
}

// ---- Glimpses of the course's other holes -------------------------------------------

// Parts of neighbouring holes seen through and over the trees: a fairway
// strip, its green with a bunker or two, a tee - with no flags, so nothing
// can be taken for the target. In the hole's frame, from its seed; each at
// least COUNTRY.glimpseClear off the line of play (and past the woods
// along it), and within `within` metres of the hole's middle (the far
// ground drawn). Returns { fairways: [[[x, z], ...]], greens: [{ x, z, rx,
// rz, rot }], bunkers: [{ x, z, rx, rz, rot }], tees: [{ x, z, rot }] }.
// land(x, z): by the sea, whether a spot is well inland (none on the
// shore, nor out to sea).
export function glimpsesFor(L, { seed = 1, character = "parkland", within = 1050, land = null } = {}) {
  const rand = seeded((seed ^ 0x611e5) >>> 0 || 1);
  const path = makePath(L.path);
  const out = { fairways: [], greens: [], bunkers: [], tees: [] };
  const clear = Math.max(COUNTRY.glimpseClear, (L.treeLine ?? 40) + 70);
  const mid = pointAt(path, path.length / 2).p;
  const ok = (x, z, pad = 0) => lineDistance(L.path, x, z) >= clear + pad && Math.hypot(x - mid[0], z - mid[1]) < within - pad && (!land || land(x, z));
  const want = character === "heath" ? 2 : 3;
  for (let tries = 0; tries < 24 && out.greens.length < want; tries++) {
    // Alongside the hole, one side or the other, running roughly with it
    // or back the other way.
    const s = rand() * path.length;
    const at = pointAt(path, s);
    const side = rand() < 0.5 ? -1 : 1;
    const off = clear + 40 + rand() * 160;
    const sx = at.p[0] - at.dir[1] * side * off;
    const sz = at.p[1] + at.dir[0] * side * off;
    const heading = Math.atan2(at.dir[1], at.dir[0]) + (rand() < 0.5 ? 0 : Math.PI) + (rand() - 0.5) * 0.7;
    const len = 170 + rand() * 200;
    const half = 13 + rand() * 6;
    const hx = Math.cos(heading);
    const hz = Math.sin(heading);
    // Its centre line, gently curving.
    const bend = (rand() - 0.5) * 0.5;
    const line = [];
    for (let k = 0; k <= 12; k++) {
      const u = k / 12;
      const sway = Math.sin(u * Math.PI) * bend * len * 0.25;
      line.push([sx + hx * len * (u - 0.5) - hz * sway, sz + hz * len * (u - 0.5) + hx * sway]);
    }
    const end = line.at(-1);
    const gr = 11 + rand() * 4;
    const green = { x: end[0] + hx * (gr + 8), z: end[1] + hz * (gr + 8), rx: gr, rz: gr * (0.75 + rand() * 0.2), rot: heading };
    const start = line[0];
    const tee = { x: start[0] - hx * 30, z: start[1] - hz * 30, rot: heading };
    const spots = [...line, [green.x, green.z], [tee.x, tee.z]];
    if (!spots.every(([x, z]) => ok(x, z, 30))) continue;
    // Not over another glimpse.
    if (out.greens.some((g) => Math.hypot(g.x - green.x, g.z - green.z) < 220)) continue;
    if (out.fairways.some((f) => f.some(([x, z]) => line.some(([a, b]) => Math.hypot(x - a, z - b) < 70)))) continue;
    // The strip's outline: along one side and back the other.
    const left = [];
    const right = [];
    line.forEach(([x, z], k) => {
      const u = k / 12;
      const w = half * (0.85 + 0.15 * Math.sin(u * Math.PI * 2 + seed));
      left.push([x - hz * w, z + hx * w]);
      right.push([x + hz * w, z - hx * w]);
    });
    out.fairways.push([...left, ...right.reverse()]);
    out.greens.push(green);
    out.tees.push(tee);
    // A bunker or two by the green, clear of it.
    const nb = 1 + Math.floor(rand() * 2);
    for (let b = 0; b < nb; b++) {
      const a = heading + (b ? -1 : 1) * (0.9 + rand() * 0.6);
      const rx = 6 + rand() * 3;
      const rz = 3 + rand() * 1.5;
      const r = gr + rx + 3;
      out.bunkers.push({ x: green.x + Math.cos(a) * r, z: green.z + Math.sin(a) * r, rx, rz, rot: a + Math.PI / 2 });
    }
  }
  return out;
}

// ---- A fuller backdrop behind the green -------------------------------------------------

// More trees behind a designed hole's green, beyond today's ring of
// backstop trees (sim/course.mjs: 28 - 53 m past the green's edge) and
// beyond where a ball can finish: a copse and scattered trees from 70 m to
// 150 m past the green's edge, as many as the hole's character has.
// Returns [[x, z, size], ...] in the hole's frame, scenery only.
export function backdropTrees(L, { seed = 1, character = "parkland" } = {}) {
  const rand = seeded((seed ^ 0xbac4d) >>> 0 || 1);
  const want = CHARACTER[character]?.backdrop ?? 16;
  const path = makePath(L.path);
  const end = pointAt(path, path.length);
  const approach = Math.atan2(end.dir[1], end.dir[0]);
  const g = L.green;
  const edge = blobRadius(g, 0);
  const out = [];
  // A copse: its middle somewhere behind, its trees clustered round it.
  const ca = approach + (rand() - 0.5) * 1.2;
  const cr = edge + 95 + rand() * 30;
  const copse = [g.x + Math.cos(ca) * cr, g.z + Math.sin(ca) * cr];
  for (let tries = 0; tries < want * 8 && out.length < want; tries++) {
    let x;
    let z;
    if (out.length < want * 0.55) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 26;
      x = copse[0] + Math.cos(a) * r;
      z = copse[1] + Math.sin(a) * r;
    } else {
      const a = approach + (rand() - 0.5) * 2.4;
      const r = edge + 70 + rand() * 80;
      x = g.x + Math.cos(a) * r;
      z = g.z + Math.sin(a) * r;
    }
    // Beyond where a ball can finish: well past the green, and past the
    // lost-ball reach of the line of play.
    if (Math.hypot(x - g.x, z - g.z) < edge + 68) continue;
    if (Math.abs(nearest(path, x, z).d) < (L.treeLine ?? 40) + 20 && nearest(path, x, z).s < path.length) continue;
    if (out.some(([a, b]) => Math.hypot(a - x, b - z) < 6.5)) continue;
    out.push([Math.round(x * 100) / 100, Math.round(z * 100) / 100, Math.round((0.95 + rand() * 0.6) * 100) / 100]);
  }
  return out;
}

// ---- The edges of a mapped hole ---------------------------------------------------------

// The level the ground beyond a mapped hole's box eases to: the mean of
// its edge's heights (h(x, z) in the hole's frame).
export function skirtLevel(h, r, step = 10) {
  let sum = 0;
  let count = 0;
  for (let x = r.x0; x <= r.x1; x += step) {
    sum += h(x, r.z0) + h(x, r.z1);
    count += 2;
  }
  for (let z = r.z0; z <= r.z1; z += step) {
    sum += h(r.x0, z) + h(r.x1, z);
    count += 2;
  }
  return count ? sum / count : 0;
}

// The skirt's height at (x, z) outside the box `r`: the edge's own height
// where it meets the box, easing over `ease` metres to `level` - rather
// than the edge heights carried straight out, which left straight ribs on
// sloping ground. Inside the box, h itself.
export function skirtHeight(h, r, level, x, z, ease = 75) {
  const ex = clamp(x, r.x0, r.x1);
  const ez = clamp(z, r.z0, r.z1);
  const d = Math.hypot(x - ex, z - ez);
  if (d <= 0) return h(x, z);
  const t = smoothstep(0, ease, d);
  return h(ex, ez) * (1 - t) + level * t;
}

// Where the ground beyond a mapped hole's box meets the box (course.js
// buildMappedGround). It used to be one coarse mesh (a point every dozen
// metres) laid over the box and the land round it, sunk wherever the hole
// was dug so its big triangles couldn't stand up through a pond or bunker.
// But a pond on steep ground is dug deep (its bank: holeedits.mjs
// POND_BANK), so all round it the land beyond the box stood that far below
// the hole's own edge - a cliff at the box's edge, beside the water. Now a
// ring of the hole's own fineness runs round the box (SKIRT.ring metres
// wide), its inner edge on the hole's own edge points, so the two meet with
// no step; it eases down SKIRT.drop to the coarse land beyond - laid that
// much lower everywhere, kept SKIRT.ring less one of its own cells'
// breadth clear of the box (so none of its triangles reaches the box), and
// running on under the ring's outer part.
export const SKIRT = { ring: 30, drop: 0.3 };

// The lines of a ring's grid along one side of the box (a0 to a1): the
// box's own (from a0, `spacing` apart, the last at a1 - as terrainMesh
// lays them, so they meet the hole's mesh point for point), and `out`
// metres more each way, `spacing` apart.
export function ringAxis(a0, a1, spacing, out) {
  const n = Math.ceil(out / spacing);
  const before = Array.from({ length: n }, (_, k) => a0 - (n - k) * spacing);
  const inner = [];
  for (let k = 0; ; k++) {
    const v = Math.min(a1, a0 + k * spacing);
    inner.push(v);
    if (v >= a1) break;
  }
  const after = Array.from({ length: n }, (_, k) => a1 + (k + 1) * spacing);
  return [...before, ...inner, ...after];
}

// How far the ring lies under the land beyond's level (0 at the box's
// edge, SKIRT.drop at its outer edge), at (x, z) outside the box `r`.
export function ringDrop(r, x, z) {
  const d = Math.hypot(x - clamp(x, r.x0, r.x1), z - clamp(z, r.z0, r.z1));
  return SKIRT.drop * smoothstep(0, SKIRT.ring, d);
}

// ---- The horizon ------------------------------------------------------------------------

// The hills' height at angle `a` (radians) and `t` (0 at their foot, 1 at
// the far edge) - from seeded noise rather than four sine waves, so each
// course has its own skyline - and the far ridge's.
export function hillHeight(a, t, seed = 1, { top = 170 } = {}) {
  const u = a / (Math.PI * 2);
  // Noise round the ring (wrapping: the same at 0 and 2 pi).
  const ring = (cells, s) => {
    const f = u * cells;
    const i = Math.floor(f);
    const k = f - i;
    const sk = k * k * (3 - 2 * k);
    const v0 = hash2(((i % cells) + cells) % cells, s, seed);
    const v1 = hash2((((i + 1) % cells) + cells) % cells, s, seed);
    return v0 + (v1 - v0) * sk;
  };
  const ridge = 0.5 * ring(5, 1) + 0.3 * ring(13, 2) + 0.15 * ring(31, 3) + 0.05 * ring(67, 4);
  const rise = Math.sin(Math.min(1, t * 1.3) * Math.PI * 0.5);
  return Math.max(0, (0.3 + ridge * 0.95) * top * rise) - 4;
}
