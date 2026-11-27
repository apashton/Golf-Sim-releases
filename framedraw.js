// The scene looks drawn (sim/scenelook.mjs): a box's plate (its backing, in
// the look's material) and its frame (round it, in the look's metal, wood,
// light or weave), on a 2D canvas. The compositor (compositor.js) puts a
// plate under each box, what's in it on the plate, then the frame over its
// edge; the Recording panel's Look page shows a card of each look
// (drawLookCard).
//
// Each must read as the real thing in a 1080p video, and still look clean
// round a 150 pixel stat box: bevels lit from the top left (light top and
// left, darker bottom and right, mitred corners), steel brushed along each
// side, polished gold reflecting a bright sky above and dark ground below,
// walnut with grain running along each side and a brass lip, a neon tube's
// wide soft glow round its colour and a near-white hot core, carbon's twill
// weave under a glossy clear coat. Sizes are pixels of a 1080p picture
// scaled by H/1080. Every texture is made from a seed - nothing random at
// drawing time - so a frame never shimmers from one picture to the next.
//
// A recording draws 60 pictures a second, so nothing here is drawn twice: a
// frame is drawn once for its look and size into canvases of its own
// (padded for its shadow or glow, and cut into four strips along its sides
// so the empty middle isn't copied every picture), a plate likewise, and
// copied from then on. The cache keeps the most recently used (LOOK_CACHE).

import { insetRect, innerRadius, lookSpec, lookFont, rgbaOf } from "./sim/scenelook.mjs";
import { clamp, smoothstep } from "./sim/mathutil.mjs";

// ---- Small helpers --------------------------------------------------------------------

function canvasOf(w, h) {
  w = Math.max(1, Math.ceil(w));
  h = Math.max(1, Math.ceil(h));
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// A rounded rectangle added to the path (no beginPath).
function rr(c, x, y, w, h, r) {
  const q = Math.max(0, Math.min(r, w / 2, h / 2));
  if (q <= 0.01) {
    c.rect(x, y, w, h);
    return;
  }
  c.moveTo(x + q, y);
  c.lineTo(x + w - q, y);
  c.arcTo(x + w, y, x + w, y + q, q);
  c.lineTo(x + w, y + h - q);
  c.arcTo(x + w, y + h, x + w - q, y + h, q);
  c.lineTo(x + q, y + h);
  c.arcTo(x, y + h, x, y + h - q, q);
  c.lineTo(x, y + q);
  c.arcTo(x, y, x + q, y, q);
  c.closePath();
}
// The band between two insets of a box (a, b from its outer edge), its
// corners following the box's: fill or clip it with "evenodd".
function band(c, x, y, w, h, a, b, rad) {
  c.beginPath();
  rr(c, x + a, y + a, w - 2 * a, h - 2 * a, Math.max(0, rad - a));
  rr(c, x + b, y + b, w - 2 * b, h - 2 * b, Math.max(0, rad - b));
}

const rgbOf = (hex) => {
  const n = parseInt(String(hex).slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mixRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c, a = 1) => `rgba(${Math.round(clamp(c[0], 0, 255))}, ${Math.round(clamp(c[1], 0, 255))}, ${Math.round(clamp(c[2], 0, 255))}, ${a})`;
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];
// A colour along a ramp (dark to light), v 0 - 1.
function rampAt(ramp, v) {
  const cols = ramp.map(rgbOf);
  const p = clamp(v, 0, 1) * (cols.length - 1);
  const i = Math.min(cols.length - 2, Math.floor(p));
  return mixRgb(cols[i], cols[i + 1], p - i);
}

// ---- Seeded noise (the textures are made from it once) --------------------------------

function hash2(x, y, seed) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
// Smooth value noise, 0 - 1; px, py: its period in lattice steps (0: none),
// so a texture made from it tiles.
function vnoise(x, y, seed, px = 0, py = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const wx = (i) => (px ? ((i % px) + px) % px : i);
  const wy = (i) => (py ? ((i % py) + py) % py : i);
  const a = hash2(wx(xi), wy(yi), seed);
  const b = hash2(wx(xi + 1), wy(yi), seed);
  const c = hash2(wx(xi), wy(yi + 1), seed);
  const d = hash2(wx(xi + 1), wy(yi + 1), seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

// A canvas drawn pixel by pixel: fn(x, y) -> [r, g, b, a?].
function pixels(w, h, fn) {
  const c = canvasOf(w, h);
  const g = c.getContext("2d");
  const img = g.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = fn(x, y);
      const i = (y * w + x) * 4;
      d[i] = p[0];
      d[i + 1] = p[1];
      d[i + 2] = p[2];
      d[i + 3] = p[3] ?? 255;
    }
  g.putImageData(img, 0, 0);
  return c;
}

const textures = new Map();
const texture = (key, make) => {
  if (!textures.has(key)) textures.set(key, make());
  return textures.get(key);
};

// Brushed metal: fine streaks along the length (x), grey about the middle
// (laid over a face with "overlay"). Tiles both ways.
const BRUSH_W = 512;
const BRUSH_H = 256;
const brushed = () =>
  texture("brushed", () =>
    pixels(BRUSH_W, BRUSH_H, (x, y) => {
      const row = hash2(3, y, 11) - 0.5;
      const long = vnoise((x * 6) / BRUSH_W, y / 0.8, 21, 6, BRUSH_H / 0.8) - 0.5;
      const mid = vnoise((x * 24) / BRUSH_W, y / 0.5, 22, 24, BRUSH_H / 0.5) - 0.5;
      const fine = hash2(x >> 3, y, 23) - 0.5;
      const v = 128 + 70 * row + 60 * long + 34 * mid + 10 * fine;
      return [v, v, v];
    }),
  );

// Felt or baize: a fine soft fuzz, grey about the middle. Tiles both ways.
const FELT = 128;
const felt = () =>
  texture("felt", () =>
    pixels(FELT, FELT, (x, y) => {
      const fuzz = hash2(x, y, 30) - 0.5;
      const a = vnoise(x / 2, y / 2, 31, FELT / 2, FELT / 2) - 0.5;
      const b = vnoise(x / 8, y / 8, 32, FELT / 8, FELT / 8) - 0.5;
      const v = 128 + 30 * fuzz + 44 * a + 28 * b;
      return [v, v, v];
    }),
  );

// Walnut: grain along the length (x), rings across (y), for a picture k
// times 1080p (the grain is the same wood at every size of frame). Long
// enough for the longest side of a 1440p picture; the faces of a frame
// take different rows of it.
const WOOD_ROWS = 120;
function woodTexture(pal, seed, k) {
  const q = Math.round(k * 20) / 20;
  return texture(`wood|${pal.join()}|${seed}|${q}`, () => {
    const L = Math.ceil(2048 * Math.max(1, q));
    const T = Math.ceil(WOOD_ROWS * q);
    const cols = pal;
    const P = (lambda) => Math.max(1, Math.round(L / q / lambda));
    const p1 = P(260);
    const p2 = P(70);
    const p3 = P(420);
    const p4 = P(9);
    const p5 = P(2.2);
    return pixels(L, T, (x, y) => {
      const u = x / L;
      const V = y / q;
      const warp = 11 * (vnoise(u * p1, V / 34, seed, p1) - 0.5) + 3 * (vnoise(u * p2, V / 9, seed + 1, p2) - 0.5);
      const r = (V + warp) / 4.4;
      const f = r - Math.floor(r);
      const late = smoothstep(0.58, 0.86, f) * (1 - smoothstep(0.9, 1, f));
      const tone = vnoise(u * p3, V / 46, seed + 2, p3) - 0.5;
      const pore = smoothstep(0.7, 0.9, vnoise(u * p4, V / 0.8, seed + 3, p4));
      const fleck = vnoise(u * p5, V / 0.7, seed + 4, p5) - 0.5;
      const t = 0.66 + 0.42 * tone - 0.46 * late - 0.16 * pore + 0.08 * fleck;
      return rampAt(cols, t);
    });
  });
}

// Carbon fibre's 2x2 twill: tows `cell` pixels wide, each over two and
// under two, a step along each row - the diagonal a real weave has. Where a
// tow's on top it shows two cells long: down the picture (two cells tall)
// in half of them, across (two cells wide) in the rest, the two ways
// catching the light differently (the light one and the dark one), each a
// soft round ridge with its fibres along it, darker at its ends where it
// dives under. Tiles both ways.
function weave(cell, base, light) {
  return texture(`weave|${cell}|${base}|${light}`, () => {
    const B = rgbOf(base);
    const Lt = rgbOf(light);
    const n = cell * 4;
    return pixels(n, n, (x, y) => {
      const i = Math.floor(x / cell);
      const j = Math.floor(y / cell);
      const u = ((x % cell) + 0.5) / cell;
      const v = ((y % cell) + 0.5) / cell;
      const m = (((i - j) % 4) + 4) % 4;
      // m 0, 1: a tow running down, its top half in row i - 1 (m 1) and
      // its bottom in row i; m 2, 3: one running across, its left half at
      // m 2.
      const down = m < 2;
      const across = down ? u : v;
      const along = down ? (1 - m + v) / 2 : (m - 2 + u) / 2;
      const ridge = Math.pow(Math.sin(Math.PI * across), 0.8);
      const ends = Math.pow(Math.sin(Math.PI * along), 0.35);
      const fibre = 0.84 + 0.16 * hash2(Math.floor(across * cell * 2), down ? i : j + 50, 41);
      // (Both ways read: the cross tows had been 0.42 against the down
      // ones' 0.95, a grille of short dashes rather than a weave - the art
      // direction, round 2.)
      const lum = (down ? 0.95 : 0.7) * ridge * ends * fibre + 0.03;
      return mixRgb(B, Lt, lum);
    });
  });
}
// The weave's tows: 9 pixels of 1080p (6 at 720p; smaller blurred into
// grey noise), never under 4.
const towOf = (k) => Math.max(4, Math.round(9 * k));
// A frame's tows: as a plate's, but at least two and a half of them across
// its thickness (a 12 pixel frame showed one row of blocks), never under 4.
const frameTow = (k, bw) => Math.max(4, Math.min(towOf(k), Math.round(bw / 2.5)));

// The light running over carbon's clear coat: a broad band at about 30
// degrees across each side of the band between insets a and b - bright in
// the middle of the top and bottom, and the other way round down the sides
// (bright at their ends, dark in their middle), so the weave seems to turn
// as the light moves over it, as real twill does. Laid on as light on a
// dark surface ("overlay"): the tows catch it, the black between them
// stays black. peak: its strongest.
const SHEEN_SLOPE = Math.tan(Math.PI / 6);
function carbonSheen(c, x, y, w, h, a, b, rad, peak) {
  if (!(peak > 0) || b <= a) return;
  for (const face of facesOf(x, y, w, h, a, b)) {
    c.save();
    clipFace(c, x, y, w, h, a, b, rad, face);
    const gr = face.vertical ? c.createLinearGradient(x, y, x + h * SHEEN_SLOPE, y + h) : c.createLinearGradient(x, y, x + w, y + w * SHEEN_SLOPE);
    sheenStops(gr, peak, face.vertical);
    c.globalCompositeOperation = "overlay";
    c.fillStyle = gr;
    c.fillRect(x, y, w, h);
    c.restore();
  }
}
// The sheen's stops: 0, peak, 0 along the top and bottom; peak, 0, peak
// down the sides (flipped: the other phase).
function sheenStops(gr, peak, flipped) {
  const at = (t) => {
    const v = Math.sin(Math.PI * t) ** 2;
    return peak * (flipped ? 1 - v : v);
  };
  for (const t of [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1]) gr.addColorStop(t, `rgba(255, 255, 255, ${at(t).toFixed(3)})`);
}

// Leather: a fine pebbled grain with soft creases between the pebbles, and
// a slow mottle, grey about the middle. Tiles both ways.
const LEATHER = 128;
const leather = () =>
  texture("leather", () =>
    pixels(LEATHER, LEATHER, (x, y) => {
      const q = Math.round(LEATHER / 2.56);
      const p = vnoise(x / 2.56, y / 2.56, 71, q, q);
      const pebble = smoothstep(0.3, 0.7, p) - 0.5;
      const crease = Math.exp(-(((p - 0.5) / 0.06) ** 2));
      const mottle = vnoise(x / 16, y / 16, 72, LEATHER / 16, LEATHER / 16) - 0.5;
      const fine = hash2(x, y, 73) - 0.5;
      const v = 128 + 30 * pebble - 26 * crease + 34 * mottle + 10 * fine;
      return [v, v, v];
    }),
  );

// ---- Light ---------------------------------------------------------------------------

// Light from the top left, a little in front.
const norm3 = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const LIGHT = norm3([-0.42, -0.74, 0.8]);
const HALF = norm3([LIGHT[0], LIGHT[1], LIGHT[2] + 1]);

// How lit a surface is that leans `a` radians out from facing the viewer,
// toward d (the face's outward direction: [0, -1] the top side): its
// diffuse light, a specular glint and what it reflects (a bright sky above
// the horizon, dark ground below - what makes polished metal look
// polished).
function lit(a, d, f) {
  const s = Math.sin(a);
  const co = Math.cos(a);
  const n = [d[0] * s, d[1] * s, co];
  const diff = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
  const nh = Math.max(0, n[0] * HALF[0] + n[1] * HALF[1] + n[2] * HALF[2]);
  const spec = Math.pow(nh, f.shine ?? 30) * (f.spec ?? 0.5);
  // The reflected view (R = 2(n.v)n - v, looking straight in): a studio's
  // big soft light above and to the left, a darker sky beyond it, the dark
  // ground below the horizon.
  const ry = 2 * co * n[1];
  const rx = 2 * co * n[0];
  const sky = 0.4 + 0.6 * Math.exp(-(((ry + 0.62) / 0.3) ** 2));
  const ground = 0.08 + 0.1 * Math.exp(-Math.max(0, ry) * 3);
  const env = ground + (sky - ground) * smoothstep(0.06, -0.06, ry) + 0.22 * Math.exp(-(((rx + 0.62) / 0.35) ** 2));
  return { v: (f.ambient ?? 0.1) + (f.diffuse ?? 0.6) * diff + (f.env ?? 0) * env, spec };
}

// Cross-sections, outer edge (t 0) to inner (t 1): [t0, t1, lean at t0,
// lean at t1] - leaning out (+) or in (-) toward the picture. The faces
// mostly lean out (the frame rises toward the picture), so the top and left
// sides catch the light and the bottom and right fall into shade.
// A metal bezel: a steep outer wall, the broad face, a rolled crest, a wall
// down into the picture.
const BEZEL = [
  [0, 0.08, 1.2, 1.0],
  [0.08, 0.78, 0.62, 0.3],
  [0.78, 0.88, 0.05, -0.4],
  [0.88, 1, -1.1, -1.1],
];
// A picture frame's moulding: a bead along the outside, a step down, the
// long slope up to the lip.
const MOULDING = [
  [0, 0.1, 1.2, 0.85],
  [0.1, 0.3, 0.7, 0.05],
  [0.3, 0.36, -0.45, -0.45],
  [0.36, 1, 0.5, 0.18],
];
// The brass lip: half round.
const HALF_ROUND = [
  [0, 0.25, 1.0, 0.55],
  [0.25, 1, 0.5, -0.95],
];
// Carbon: flat, its outer edge rounded over.
const ROUNDED_EDGE = [
  [0, 0.2, 1.1, 0.35],
  [0.2, 0.82, 0.22, 0.12],
  [0.82, 1, -0.5, -0.6],
];
function leanAt(profile, t) {
  for (const [t0, t1, a0, a1] of profile) if (t <= t1) return a0 + (a1 - a0) * ((t - t0) / Math.max(1e-6, t1 - t0));
  return profile[profile.length - 1][3];
}
// Where to sample a cross-section: evenly, and either side of each crease
// so it stays crisp.
function stopsOf(profile, n) {
  const ts = new Set();
  for (let i = 0; i <= n; i++) ts.add(i / n);
  for (const [t0] of profile) if (t0 > 0) {
    ts.add(Math.max(0, t0 - 0.002));
    ts.add(t0 + 0.002);
  }
  return [...ts].sort((a, b) => a - b);
}

// The four faces of the band between insets a and b: each a mitred
// trapezoid, with its outward direction and the line across it (outer
// edge to inner).
function facesOf(x, y, w, h, a, b) {
  const x0 = x + a;
  const y0 = y + a;
  const x1 = x + w - a;
  const y1 = y + h - a;
  const X0 = x + b;
  const Y0 = y + b;
  const X1 = x + w - b;
  const Y1 = y + h - b;
  return [
    { side: "top", d: [0, -1], pts: [[x0, y0], [x1, y0], [X1, Y0], [X0, Y0]], from: [0, y0], to: [0, Y0], len: w, along: [x0, y0], vertical: false },
    { side: "left", d: [-1, 0], pts: [[x0, y0], [X0, Y0], [X0, Y1], [x0, y1]], from: [x0, 0], to: [X0, 0], len: h, along: [x0, y0], vertical: true },
    { side: "right", d: [1, 0], pts: [[x1, y0], [x1, y1], [X1, Y1], [X1, Y0]], from: [x1, 0], to: [X1, 0], len: h, along: [x1, y0], vertical: true },
    { side: "bottom", d: [0, 1], pts: [[x0, y1], [X0, Y1], [X1, Y1], [x1, y1]], from: [0, y1], to: [0, Y1], len: w, along: [x0, y1], vertical: false },
  ];
}
function facePath(c, f) {
  c.beginPath();
  c.moveTo(f.pts[0][0], f.pts[0][1]);
  for (const p of f.pts.slice(1)) c.lineTo(p[0], p[1]);
  c.closePath();
}
// Clip to one face of the band (and the band's own rounded corners).
function clipFace(c, x, y, w, h, a, b, rad, f) {
  band(c, x, y, w, h, a, b, rad);
  c.clip("evenodd");
  facePath(c, f);
  c.clip();
}

// The faces shaded by a cross-section: in a ramp of colours (metal), or as
// light and shade laid over what's there (wood, carbon), plus the glint.
function shadeFaces(c, x, y, w, h, a, b, rad, profile, f, { ramp = null, over = 0, blend = "alpha" } = {}) {
  const thick = b - a;
  const n = clamp(Math.ceil(thick * 2.5), 12, 80);
  const ts = stopsOf(profile, n);
  const flat = lit(0, [0, -1], f).v;
  for (const face of facesOf(x, y, w, h, a, b)) {
    c.save();
    clipFace(c, x, y, w, h, a, b, rad, face);
    const gr = c.createLinearGradient(face.from[0], face.from[1], face.to[0], face.to[1]);
    const gs = ramp ? null : c.createLinearGradient(face.from[0], face.from[1], face.to[0], face.to[1]);
    for (const t of ts) {
      const { v, spec } = lit(leanAt(profile, t), face.d, f);
      if (ramp) {
        const col = mixRgb(rampAt(ramp, v), WHITE, clamp(spec, 0, 1));
        gr.addColorStop(t, css(col));
      } else {
        const dv = (v - flat) * over;
        if (blend === "overlay") {
          // Grey about the middle laid on with "overlay": lighter or darker
          // without washing out the wood's colour.
          const q = 128 + clamp(dv, -0.5, 0.5) * 255;
          gr.addColorStop(t, css([q, q, q]));
        } else gr.addColorStop(t, dv >= 0 ? css(WHITE, clamp(dv, 0, 0.85)) : css(BLACK, clamp(-dv, 0, 0.85)));
        gs.addColorStop(t, css([255, 244, 226], clamp(spec, 0, 0.9)));
      }
    }
    if (blend === "overlay") c.globalCompositeOperation = "overlay";
    c.fillStyle = gr;
    c.fillRect(x, y, w, h);
    c.globalCompositeOperation = "source-over";
    if (gs) {
      c.fillStyle = gs;
      c.fillRect(x, y, w, h);
    }
    c.restore();
  }
}

// A texture laid along each face (rotated down the sides), from its own
// place in the texture so the four sides differ.
function textureFaces(c, x, y, w, h, a, b, rad, tex, { op = "source-over", alpha = 1, seed = 0 } = {}) {
  const tw = tex.width;
  const th = tex.height;
  const across = b - a;
  const pat = c.createPattern(tex, "repeat");
  for (const [i, face] of facesOf(x, y, w, h, a, b).entries()) {
    c.save();
    clipFace(c, x, y, w, h, a, b, rad, face);
    c.globalCompositeOperation = op;
    c.globalAlpha = alpha;
    // The face's own rows of the texture (across its thickness, all inside
    // it - wood's rings don't wrap) and its own start along it.
    const row = Math.floor(hash2(i, seed, 51) * Math.max(1, th - across));
    const start = Math.floor(hash2(i, seed, 52) * tw);
    if (face.side === "top") c.translate(x - start, y + a - row);
    else if (face.side === "bottom") c.translate(x - start, y + h - b - row);
    else {
      // Down the side: the texture turned a quarter, (u, v) to (tx - v,
      // ty + u), its rows across the side.
      c.translate(face.side === "left" ? x + b + row : x + w - a + row, y - start);
      c.rotate(Math.PI / 2);
    }
    c.fillStyle = pat;
    c.fillRect(-tw, -th, Math.max(w, h) + 3 * tw, th * 3 + across);
    c.restore();
  }
}

// The hairline where two mitred pieces meet, at each corner.
function mitres(c, x, y, w, h, a, b, rad, dark, light) {
  const lw = 1;
  c.save();
  band(c, x, y, w, h, a, b, rad);
  c.clip("evenodd");
  const corners = [
    [x + a, y + a, x + b, y + b],
    [x + w - a, y + a, x + w - b, y + b],
    [x + a, y + h - a, x + b, y + h - b],
    [x + w - a, y + h - a, x + w - b, y + h - b],
  ];
  c.lineWidth = lw;
  for (const [ox, oy, ix, iy] of corners) {
    c.strokeStyle = dark;
    c.beginPath();
    c.moveTo(ox, oy);
    c.lineTo(ix, iy);
    c.stroke();
    c.strokeStyle = light;
    c.beginPath();
    c.moveTo(ox + 0.8, oy + 0.8);
    c.lineTo(ix + 0.8, iy + 0.8);
    c.stroke();
  }
  c.restore();
}

// A shadow the frame casts onto what's in it, falling down and to the
// right (the light's from the top left).
function innerShadow(c, x, y, w, h, b, rad, k, alpha) {
  const ri = Math.max(0, rad - b);
  c.save();
  c.beginPath();
  rr(c, x + b, y + b, w - 2 * b, h - 2 * b, ri);
  c.clip();
  c.shadowColor = `rgba(0, 0, 0, ${alpha})`;
  c.shadowBlur = 7 * k;
  c.shadowOffsetX = 1.5 * k;
  c.shadowOffsetY = 2.5 * k;
  c.beginPath();
  c.rect(x - 60, y - 60, w + 120, h + 120);
  rr(c, x + b, y + b, w - 2 * b, h - 2 * b, ri);
  c.fillStyle = "#000";
  c.fill("evenodd");
  c.restore();
}

// The dark line round the frame's outer edge, so it reads against a bright
// picture (or a light one, rgb, so a dark frame reads against black).
function outerLine(c, x, y, w, h, rad, alpha, rgb = "0, 0, 0") {
  c.save();
  c.beginPath();
  rr(c, x + 0.5, y + 0.5, w - 1, h - 1, Math.max(0, rad - 0.5));
  c.strokeStyle = `rgba(${rgb}, ${alpha})`;
  c.lineWidth = 1;
  c.stroke();
  c.restore();
}

// A soft drop shadow round the box, outside it only.
function dropShadow(c, x, y, w, h, rad, sh, k) {
  if (!sh) return;
  c.save();
  c.shadowColor = `rgba(0, 0, 0, ${sh.alpha})`;
  c.shadowBlur = sh.blur * k;
  c.shadowOffsetY = (sh.y ?? 0) * k;
  c.beginPath();
  rr(c, x, y, w, h, rad);
  c.fillStyle = "#000";
  c.fill();
  c.restore();
  c.save();
  c.globalCompositeOperation = "destination-out";
  c.beginPath();
  rr(c, x, y, w, h, rad);
  c.fill();
  c.restore();
}

// ---- The frames ------------------------------------------------------------------------

// Broadcast glass, as TV sport graphics use their colour - sparingly: a
// solid bar of the accent along the top of every box, the light catching
// its near end (one direction for the whole scene: the art direction,
// round 2 - a bar down the left of the tall boxes beside one along the top
// of the wide ones read as two styles, not one); a fine light hairline
// round the rest of the box, a dark one outside it, and a faint light line
// along the glass's top just inside.
function lineFrame(c, x, y, w, h, bw, rad, f, k) {
  const col = rgbOf(f.colour);
  band(c, x, y, w, h, 0, bw, rad);
  c.fillStyle = `rgba(255, 255, 255, ${f.hair ?? 0.28})`;
  c.fill("evenodd");
  const cap = Math.min(Math.max(bw, Math.round((f.cap ?? 5) * k)), Math.floor(h / 4));
  const lw = Math.max(1, Math.round(k));
  c.save();
  c.beginPath();
  rr(c, x, y, w, h, rad);
  c.clip();
  // The bar, lit at its near end (the top left).
  const len = w;
  const gr = c.createLinearGradient(x, 0, x + len, 0);
  gr.addColorStop(0, css(mixRgb(col, WHITE, 0.55)));
  gr.addColorStop(Math.min(0.3, (40 * k) / len), css(mixRgb(col, WHITE, 0.12)));
  gr.addColorStop(Math.min(0.6, (160 * k) / len), css(col));
  gr.addColorStop(1, css(mixRgb(col, BLACK, 0.12)));
  c.fillStyle = gr;
  c.fillRect(x, y, w, cap);
  // The glass's top edge catching the light, just inside.
  const hl = f.highlight ?? 0.5;
  const top = y + cap;
  const x0 = x + bw;
  const hg = c.createLinearGradient(x0, 0, x + w - bw, 0);
  hg.addColorStop(0, `rgba(255, 255, 255, ${hl})`);
  hg.addColorStop(0.5, `rgba(255, 255, 255, ${hl * 0.45})`);
  hg.addColorStop(1, `rgba(255, 255, 255, ${hl * 0.15})`);
  c.fillStyle = hg;
  c.fillRect(x0, top, x + w - bw - x0, lw);
  c.restore();
  outerLine(c, x, y, w, h, rad, 0.4);
}

// Steel and gold: a bevelled bezel in the metal's ramp, brushed along each
// side, mitred, with an inner groove and the shadow it casts, and screws
// at the corners of a big one.
function bevelFrame(c, x, y, w, h, bw, rad, f, k) {
  band(c, x, y, w, h, 0, bw, rad);
  c.fillStyle = css(rampAt(f.ramp, 0.45));
  c.fill("evenodd");
  shadeFaces(c, x, y, w, h, 0, bw, rad, BEZEL, f, { ramp: f.ramp });
  if (f.grain > 0) textureFaces(c, x, y, w, h, 0, bw, rad, brushed(), { op: "overlay", alpha: f.grain, seed: w * 7 + h });
  mitres(c, x, y, w, h, 0, bw, rad, "rgba(0, 0, 0, 0.32)", "rgba(255, 255, 255, 0.12)");
  outerLine(c, x, y, w, h, rad, 0.55);
  if (f.rim) rimLines(c, x, y, w, h, bw, rad, k);
  innerShadow(c, x, y, w, h, bw, rad, k, 0.6);
  if (f.screws && bw >= 10 * k && Math.min(w, h) >= 240 * k) screws(c, x, y, w, h, bw, rad, f);
}

// Polished metal's snap: a near-white line along the lit outer edges (the
// top and the left, fading toward their far ends) and a crisp dark one at
// the groove into the picture.
function rimLines(c, x, y, w, h, bw, rad, k) {
  const lw = Math.max(1, Math.round(k));
  c.save();
  c.beginPath();
  rr(c, x, y, w, h, rad);
  c.clip();
  const along = (x0, y0, x1, y1) => {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "rgba(255, 250, 228, 0.9)");
    g.addColorStop(0.45, "rgba(255, 246, 215, 0.55)");
    g.addColorStop(1, "rgba(255, 240, 200, 0.12)");
    return g;
  };
  c.fillStyle = along(x, 0, x + w, 0);
  c.fillRect(x + 1, y + 1, w - 2, lw);
  c.fillStyle = along(0, y, 0, y + h);
  c.fillRect(x + 1, y + 1, lw, h - 2);
  band(c, x, y, w, h, bw - lw, bw, rad);
  c.fillStyle = "rgba(24, 12, 0, 0.75)";
  c.fill("evenodd");
  c.restore();
}

// A screw head at each corner of the bezel, its slot turned its own way -
// in from a rounded corner, and left off where the corner's too round for
// one to sit on the metal.
function screws(c, x, y, w, h, bw, rad, f) {
  const r = bw * 0.26;
  const s = Math.max(bw / 2, rad * 0.3 + r * 1.5);
  if (s + r * 1.4 > bw) return;
  const spots = [
    [x + s, y + s],
    [x + w - s, y + s],
    [x + s, y + h - s],
    [x + w - s, y + h - s],
  ];
  for (const [i, [cx, cy]] of spots.entries()) {
    c.save();
    // Its countersunk hole.
    c.beginPath();
    c.arc(cx, cy, r * 1.32, 0, Math.PI * 2);
    const hole = c.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    hole.addColorStop(0, "rgba(0, 0, 0, 0.55)");
    hole.addColorStop(1, "rgba(255, 255, 255, 0.28)");
    c.fillStyle = hole;
    c.fill();
    // The head, domed and lit from the top left.
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    const head = c.createRadialGradient(cx - r * 0.4, cy - r * 0.45, r * 0.1, cx, cy, r * 1.05);
    head.addColorStop(0, css(rampAt(f.ramp, 1)));
    head.addColorStop(0.5, css(rampAt(f.ramp, 0.62)));
    head.addColorStop(1, css(rampAt(f.ramp, 0.22)));
    c.fillStyle = head;
    c.fill();
    // Its slot.
    const ang = (0.35 + hash2(i, Math.round(w + h), 61) * 2.4) % Math.PI;
    const dx = Math.cos(ang) * r * 0.8;
    const dy = Math.sin(ang) * r * 0.8;
    c.lineCap = "round";
    c.lineWidth = Math.max(1, r * 0.3);
    c.strokeStyle = "rgba(255, 255, 255, 0.35)";
    c.beginPath();
    c.moveTo(cx - dx + 0.5, cy - dy + 0.7);
    c.lineTo(cx + dx + 0.5, cy + dy + 0.7);
    c.stroke();
    c.strokeStyle = "rgba(10, 12, 14, 0.85)";
    c.beginPath();
    c.moveTo(cx - dx, cy - dy);
    c.lineTo(cx + dx, cy + dy);
    c.stroke();
    c.restore();
  }
}

// Walnut and brass: the wood's grain along each side, mitred, a moulded
// profile lit from the top left under a soft lacquer, a brass lip inside.
function woodFrame(c, x, y, w, h, bw, rad, f, k) {
  const lip = bw >= 6 ? Math.max(2, Math.round(bw * 0.2)) : 0;
  const wb = bw - lip;
  const tex = woodTexture(f.wood, f.seed ?? 7, k);
  band(c, x, y, w, h, 0, wb, rad);
  c.fillStyle = f.wood[1];
  c.fill("evenodd");
  textureFaces(c, x, y, w, h, 0, wb, rad, tex, { seed: (f.seed ?? 7) + w * 3 + h });
  shadeFaces(c, x, y, w, h, 0, wb, rad, MOULDING, { diffuse: 0.75, ambient: 0.15, shine: 26, spec: 0.3 }, { over: 1.5, blend: "overlay" });
  mitres(c, x, y, w, h, 0, wb, rad, "rgba(10, 4, 0, 0.55)", "rgba(255, 220, 170, 0.1)");
  if (lip) {
    shadeFaces(c, x, y, w, h, wb, bw, rad, HALF_ROUND, { diffuse: 0.45, env: 0.55, ambient: 0.06, shine: 50, spec: 0.8 }, { ramp: f.lip });
    // A dark line where the wood meets the brass.
    c.save();
    c.beginPath();
    rr(c, x + wb, y + wb, w - 2 * wb, h - 2 * wb, Math.max(0, rad - wb));
    c.strokeStyle = "rgba(15, 6, 0, 0.6)";
    c.lineWidth = 1;
    c.stroke();
    c.restore();
  }
  outerLine(c, x, y, w, h, rad, 0.6);
  innerShadow(c, x, y, w, h, bw, rad, k, 0.62);
}

// Carbon fibre: the weave under a glossy clear coat, rounded at its outer
// edge, a thin pinstripe in the accent on its inner edge.
function carbonFrame(c, x, y, w, h, bw, rad, f, k) {
  band(c, x, y, w, h, 0, bw, rad);
  c.fillStyle = c.createPattern(weave(frameTow(k, bw), f.base, f.light), "repeat");
  c.fill("evenodd");
  // The pinstripe on every box at every size - the look's signature: a
  // thin frame (a caption plate's at 720p is 4 pixels) gives up weave for
  // it, never the stripe (the art direction, round 2).
  const pin = bw >= 3 ? Math.max(1, Math.round(1.8 * k * Math.min(1, bw / (8 * k)))) : 0;
  const inner = bw - pin - (pin ? 1 : 0);
  carbonSheen(c, x, y, w, h, 0, inner, rad, f.sheen ?? 0.5);
  shadeFaces(c, x, y, w, h, 0, inner, rad, ROUNDED_EDGE, { diffuse: 0.7, ambient: 0.12, shine: 50, spec: 0.75 }, { over: 0.55 });
  // The clear coat: a streak of light the whole length of the top, over
  // the outer two fifths of its thickness and fading down, and a thinner
  // one down the left - on every box, however wide.
  c.save();
  band(c, x, y, w, h, 0, bw, rad);
  c.clip("evenodd");
  const top = c.createLinearGradient(0, y, 0, y + bw * 0.42);
  top.addColorStop(0, `rgba(255, 255, 255, ${f.gloss * 0.7})`);
  top.addColorStop(0.25, `rgba(255, 255, 255, ${f.gloss})`);
  top.addColorStop(1, "rgba(255, 255, 255, 0)");
  c.fillStyle = top;
  c.fillRect(x, y, w, bw * 0.42);
  const left = c.createLinearGradient(x, 0, x + bw * 0.28, 0);
  left.addColorStop(0, `rgba(255, 255, 255, ${f.gloss * 0.55})`);
  left.addColorStop(1, "rgba(255, 255, 255, 0)");
  c.fillStyle = left;
  c.fillRect(x, y + bw * 0.42, bw * 0.28, h - bw * 0.42);
  c.restore();
  if (pin) {
    band(c, x, y, w, h, inner, inner + 1, rad);
    c.fillStyle = "rgba(0, 0, 0, 0.75)";
    c.fill("evenodd");
    const col = rgbOf(f.pin);
    band(c, x, y, w, h, bw - pin, bw, rad);
    const pg = c.createLinearGradient(0, y, 0, y + h);
    pg.addColorStop(0, css(mixRgb(col, WHITE, 0.3)));
    pg.addColorStop(0.5, css(col));
    pg.addColorStop(1, css(mixRgb(col, BLACK, 0.25)));
    c.fillStyle = pg;
    c.fill("evenodd");
  }
  // (A light edge, not a dark one: it's a dark frame, often on black.)
  outerLine(c, x, y, w, h, rad, 0.18, "255, 255, 255");
  innerShadow(c, x, y, w, h, bw, rad, k, 0.5);
}

// How far a neon tube's wide glow reaches (a shadow's blur fades out by
// about its own length): the look's, but no further than f.reach (drawFrame:
// a little more than the gap between boxes) - with Tidy's 12 pixel gaps
// the boxes' halos had met and filled the gutters solid pink, the scene one
// pink lattice with no black between its boxes (the art direction, round
// 2).
const NEON_WIDE = 1.6;
const neonBlur = (f, k) => Math.max(2 * k, Math.min((f.glow ?? 30) * k * NEON_WIDE, f.reach ?? Infinity));
const neonReach = (f, k) => neonBlur(f, k) * 1.1 + 3 * k;
// How strongly the glow is laid over what's under it (screen): two halos
// meeting in a gutter brighten it a little rather than saturating it.
const NEON_HALO = 0.8;

// Neon: the tube along the middle of the frame. Its glow (drawn into
// `halo`, laid over the picture as light is - "screen") soft round it
// outside, and cut back inside it to a little bloom on the picture's edge
// (a wash of the tube's colour over the picture muddied it - khaki over
// the green game); the tube itself its colour round a near-white hot core.
function neonFrame(halo, tube, x, y, w, h, bw, rad, f, k) {
  const col = rgbOf(f.colour);
  const tw = Math.max(2, bw * 0.62);
  const inset = bw / 2;
  const rc = Math.max(0, rad - inset);
  const path = (c) => {
    c.beginPath();
    rr(c, x + inset, y + inset, w - 2 * inset, h - 2 * inset, rc);
  };
  // Only the glow: the stroke drawn well off the canvas and its shadow
  // brought back where the tube is.
  const OFF = 40000;
  const glow = (blur, alpha, lw) => {
    halo.save();
    halo.shadowColor = css(col, alpha);
    halo.shadowBlur = blur;
    halo.shadowOffsetX = OFF;
    halo.translate(-OFF, 0);
    path(halo);
    halo.lineWidth = lw;
    halo.strokeStyle = "#000";
    halo.stroke();
    halo.restore();
  };
  const g = (f.glow ?? 30) * k;
  const wide = neonBlur(f, k);
  glow(wide, 0.4, tw * 2.2);
  glow(Math.min(g * 0.75, wide * 0.55), 0.8, tw * 1.4);
  glow(Math.min(g * 0.25, wide * 0.3), 1, tw);
  // Inside the frame's inner edge: down to a third at once, and gone a
  // soft few pixels further in.
  halo.save();
  halo.globalCompositeOperation = "destination-out";
  halo.globalAlpha = 0.65;
  halo.beginPath();
  rr(halo, x + bw, y + bw, w - 2 * bw, h - 2 * bw, Math.max(0, rad - bw));
  halo.fill();
  halo.globalAlpha = 1;
  const d = bw + 4 * k;
  halo.shadowColor = "#000";
  halo.shadowBlur = 6 * k;
  halo.shadowOffsetX = OFF;
  halo.beginPath();
  rr(halo, x - OFF + d, y + d, w - 2 * d, h - 2 * d, Math.max(0, rad - d));
  halo.fillStyle = "#000";
  halo.fill();
  halo.restore();
  // The tube: its colour, a little lighter in the middle, round the core.
  tube.save();
  path(tube);
  tube.lineWidth = tw;
  tube.strokeStyle = css(mixRgb(col, WHITE, 0.18));
  tube.stroke();
  path(tube);
  tube.lineWidth = Math.max(1, tw * 0.62);
  tube.strokeStyle = css(mixRgb(col, WHITE, 0.5));
  tube.stroke();
  tube.shadowColor = css(mixRgb(col, WHITE, 0.7), 0.9);
  tube.shadowBlur = 2 * k;
  path(tube);
  tube.lineWidth = Math.max(0.8, tw * 0.32);
  tube.strokeStyle = css(mixRgb(col, WHITE, f.core ?? 0.85));
  tube.stroke();
  tube.restore();
}

// ---- The cache -----------------------------------------------------------------------

// The most frames and plates kept drawn, and the most pixels they may hold.
export const LOOK_CACHE = 64;
const CACHE_PIXELS = 24e6;
const cache = new Map();
let cachedPixels = 0;
function cached(key, make) {
  let e = cache.get(key);
  if (e) {
    cache.delete(key);
    cache.set(key, e);
    return e;
  }
  e = make();
  cache.set(key, e);
  cachedPixels += e.px;
  while (cache.size > LOOK_CACHE || (cachedPixels > CACHE_PIXELS && cache.size > 1)) {
    const [k, old] = cache.entries().next().value;
    cache.delete(k);
    cachedPixels -= old.px;
  }
  return e;
}
// How many are kept, and forgetting them (a test, the panel).
export const lookCacheSize = () => cache.size;
export function clearLookCache() {
  cache.clear();
  cachedPixels = 0;
}

// A drawn frame cut into the four strips along its sides that hold
// anything: [{ c, dx, dy }]. Everything drawn lies between `from` and
// `to` in from the padded canvas's edge.
function stripsOf(full, from, to) {
  const W = full.width;
  const H = full.height;
  from = Math.max(0, Math.floor(from));
  to = Math.ceil(to);
  const cut = (sx, sy, sw, sh) => {
    const s = canvasOf(sw, sh);
    s.getContext("2d").drawImage(full, sx, sy, sw, sh, 0, 0, sw, sh);
    return { c: s, dx: sx, dy: sy };
  };
  if (to * 2 >= Math.min(W, H) - 8) return from > 0 ? [cut(from, from, W - 2 * from, H - 2 * from)] : [{ c: full, dx: 0, dy: 0 }];
  const t = to - from;
  return [cut(from, from, W - 2 * from, t), cut(from, H - to, W - 2 * from, t), cut(from, to, t, H - 2 * to), cut(W - to, to, t, H - 2 * to)];
}
const partsPixels = (parts) => parts.reduce((n, p) => n + p.c.width * p.c.height, 0);

// ---- Drawing them ----------------------------------------------------------------------

// The box on whole pixels.
function boxOf(r) {
  const x = Math.round(r.x);
  const y = Math.round(r.y);
  return { x, y, w: Math.round(r.x + r.w) - x, h: Math.round(r.y + r.h) - y };
}
const PICTURES = ["game", "camera"];

// A box's frame: drawn INSIDE r (r is the frame's outer edge; what's in
// the box goes in insetRect(r, width), its corners innerRadius(radius,
// width) round), with the look's drop shadow outside it. width and radius
// in the picture's pixels (sim/scenelook.mjs frameWidth, frameRadius), H
// the picture's height. Drawn at the canvas's globalAlpha (the box's).
export function drawFrame(g, r, spec, { width = 0, radius = 0, H = 1080, kind = "" } = {}) {
  if (!spec) return;
  const { x, y, w, h } = boxOf(r);
  if (w < 2 || h < 2) return;
  const bw = Math.max(0, Math.min(Math.round(width), Math.floor(Math.min(w, h) / 2) - 1));
  const rad = Math.max(0, Math.min(radius, w / 2, h / 2));
  const k = H / 1080;
  const sh = spec.shadow;
  if (bw <= 0 && !sh) return;
  // (A neon tube's glow reaches a little past the gap between boxes, no
  // further: neonBlur.)
  const neon = spec.frame.style === "neon";
  const f = neon && spec.gap > 0 ? { ...spec.frame, reach: spec.gap * 1.2 * k } : spec.frame;
  const key = `f|${spec.key}|${w}x${h}|${bw}|${rad}|${Math.round(k * 1000)}${neon ? `|${spec.gap}` : ""}`;
  const e = cached(key, () => {
    const glowReach = neon && bw > 0 ? Math.ceil(neonReach(f, k)) : 0;
    const shadowReach = sh ? Math.ceil(sh.blur * k * 1.5 + (sh.y ?? 0) * k) : 0;
    const pad = Math.max(glowReach, shadowReach) + 2;
    // How far in from the frame's inner edge anything is drawn: its inner
    // corners, the shadow it casts, a neon tube's little bloom.
    const inward = Math.ceil(Math.max(innerRadius(rad, bw), 12 * k)) + 2;
    const to = pad + bw + inward;
    const layers = [];
    const c = canvasOf(w + 2 * pad, h + 2 * pad);
    const cg = c.getContext("2d");
    if (sh) dropShadow(cg, pad, pad, w, h, rad, sh, k);
    if (bw > 0 && neon) {
      // The glow laid over what's under it as light is ("screen", at
      // NEON_HALO), the tube drawn on top - cut close round it.
      const tube = canvasOf(w + 2 * pad, h + 2 * pad);
      neonFrame(cg, tube.getContext("2d"), pad, pad, w, h, bw, rad, f, k);
      // (The tube's rounded corners come in from the edge as far as
      // 0.3 of their radius past its middle line.)
      const tubeTo = pad + Math.max(bw, bw / 2 + Math.max(0, rad - bw / 2) * 0.3 + bw * 0.4) + 4;
      layers.push({ op: "screen", alpha: NEON_HALO, parts: stripsOf(c, 0, to) }, { op: "source-over", parts: stripsOf(tube, pad - 4, tubeTo) });
    } else {
      if (bw > 0) ({ line: lineFrame, bevel: bevelFrame, wood: woodFrame, carbon: carbonFrame }[f.style] ?? lineFrame)(cg, pad, pad, w, h, bw, rad, f, k);
      layers.push({ op: "source-over", parts: stripsOf(c, 0, to) });
    }
    return { pad, layers, px: layers.reduce((n, l) => n + partsPixels(l.parts), 0) };
  });
  const op = g.globalCompositeOperation;
  const alpha = g.globalAlpha;
  for (const l of e.layers) {
    g.globalCompositeOperation = l.op === "source-over" ? op : l.op;
    g.globalAlpha = alpha * (l.alpha ?? 1);
    for (const p of l.parts) g.drawImage(p.c, x - e.pad + p.dx, y - e.pad + p.dy);
  }
  g.globalCompositeOperation = op;
  g.globalAlpha = alpha;
}

// A box's backing inside its frame (the plate), in the look's material,
// filling r with its corners `radius` round: frosted glass, gunmetal,
// baize, see-through black, carbon. Behind a picture (kind "game" or
// "camera") a plain dark fill, as the picture covers it. Drawn at the
// canvas's globalAlpha (the box's) times the plate's own.
export function drawPlate(g, r, spec, { width = 0, radius = 0, H = 1080, kind = "" } = {}) {
  if (!spec) return;
  const { x, y, w, h } = boxOf(r);
  if (w < 1 || h < 1) return;
  const p = spec.plate;
  const rad = Math.max(0, Math.min(radius, w / 2, h / 2));
  if (PICTURES.includes(kind)) {
    g.beginPath();
    rr(g, x, y, w, h, rad);
    g.fillStyle = p.picture;
    g.fill();
    return;
  }
  const k = H / 1080;
  const key = `p|${spec.key}|${w}x${h}|${rad}|${Math.round(k * 1000)}`;
  const e = cached(key, () => {
    const c = canvasOf(w, h);
    plate(c.getContext("2d"), w, h, rad, p, spec.frame, k);
    return { c, px: w * h };
  });
  const a = g.globalAlpha;
  g.globalAlpha = a * p.alpha;
  g.drawImage(e.c, x, y);
  g.globalAlpha = a;
}

function plate(c, w, h, rad, p, f, k) {
  c.save();
  c.beginPath();
  rr(c, 0, 0, w, h, rad);
  c.clip();
  const gr = c.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, p.top);
  gr.addColorStop(1, p.bottom);
  if (p.style === "carbon") {
    c.fillStyle = c.createPattern(weave(towOf(k), f.base ?? "#0b0c0e", f.light ?? "#3b3f45"), "repeat");
    c.fillRect(0, 0, w, h);
    // The clear coat's broad light at about 30 degrees across it, as the
    // frame's has (carbonSheen), under the panel's own darkening.
    const L = w * Math.cos(Math.PI / 6) + h * Math.sin(Math.PI / 6);
    const sg = c.createLinearGradient(0, 0, L * Math.cos(Math.PI / 6), L * Math.sin(Math.PI / 6));
    sheenStops(sg, p.weaveSheen ?? 0.22, false);
    c.fillStyle = sg;
    c.fillRect(0, 0, w, h);
    c.globalAlpha = 0.72;
    c.fillStyle = gr;
    c.fillRect(0, 0, w, h);
    c.globalAlpha = 1;
  } else {
    c.fillStyle = gr;
    c.fillRect(0, 0, w, h);
  }
  if (p.style === "metal") {
    c.globalCompositeOperation = "overlay";
    c.globalAlpha = 0.32;
    c.fillStyle = c.createPattern(brushed(), "repeat");
    c.fillRect(0, 0, w, h);
  } else if (p.style === "felt") {
    c.globalCompositeOperation = "overlay";
    c.globalAlpha = 0.38;
    c.fillStyle = c.createPattern(felt(), "repeat");
    c.fillRect(0, 0, w, h);
  } else if (p.style === "leather") {
    c.globalCompositeOperation = "overlay";
    c.globalAlpha = 0.42;
    c.fillStyle = c.createPattern(leather(), "repeat");
    c.fillRect(0, 0, w, h);
  }
  c.globalCompositeOperation = "source-over";
  c.globalAlpha = 1;
  // Its edges a little darker, as light falls off across a panel.
  const vg = c.createRadialGradient(w / 2, h * 0.38, Math.min(w, h) * 0.2, w / 2, h / 2, Math.hypot(w, h) * 0.62);
  vg.addColorStop(0, "rgba(0, 0, 0, 0)");
  vg.addColorStop(1, `rgba(0, 0, 0, ${p.style === "tint" ? 0.1 : 0.28})`);
  c.fillStyle = vg;
  c.fillRect(0, 0, w, h);
  if (p.style === "glass") {
    // A broad soft reflection across the glass from the top left.
    const dg = c.createLinearGradient(0, 0, Math.min(w, h * 2.5), h * 1.2);
    dg.addColorStop(0, "rgba(255, 255, 255, 0.07)");
    dg.addColorStop(0.45, "rgba(255, 255, 255, 0.025)");
    dg.addColorStop(0.46, "rgba(255, 255, 255, 0)");
    c.fillStyle = dg;
    c.fillRect(0, 0, w, h);
    // Lit from above: the glass's top a touch lighter down to a soft line,
    // as a pane of frosted glass catches a studio's lights.
    const band = Math.min(h * 0.42, 90 * k);
    const tb = c.createLinearGradient(0, 0, 0, band);
    tb.addColorStop(0, "rgba(255, 255, 255, 0.05)");
    tb.addColorStop(0.85, "rgba(255, 255, 255, 0.035)");
    tb.addColorStop(1, "rgba(255, 255, 255, 0)");
    c.fillStyle = tb;
    c.fillRect(0, 0, w, band);
  }
  if (p.style === "tint") {
    // A faint wash of the tube's colour from the top.
    const tg = c.createLinearGradient(0, 0, 0, h);
    tg.addColorStop(0, rgbaOf(p.accent, 0.1));
    tg.addColorStop(1, rgbaOf(p.accent, 0.02));
    c.fillStyle = tg;
    c.fillRect(0, 0, w, h);
  }
  // A sheen over its top, and a fine bright line along its top edge.
  if (p.sheen > 0) {
    const sg = c.createLinearGradient(0, 0, 0, h * 0.55);
    sg.addColorStop(0, `rgba(255, 255, 255, ${p.sheen})`);
    sg.addColorStop(1, "rgba(255, 255, 255, 0)");
    c.fillStyle = sg;
    c.fillRect(0, 0, w, h * 0.55);
  }
  if (p.line > 0) {
    const lw = Math.max(1, Math.round(k));
    const lg = c.createLinearGradient(0, 0, w, 0);
    lg.addColorStop(0, `rgba(255, 255, 255, ${p.line * 0.4})`);
    lg.addColorStop(0.3, `rgba(255, 255, 255, ${p.line})`);
    lg.addColorStop(1, `rgba(255, 255, 255, ${p.line * 0.3})`);
    c.fillStyle = lg;
    c.fillRect(0, 0, w, lw);
  }
  c.restore();
}

// A fine line dividing a box (the shot data tiles under one frame), in the
// look's way: engraved in metal, a brass hairline in wood, a faint line of
// the tube's light in neon.
export function drawDivider(g, x0, y0, x1, y1, spec, H = 1080) {
  if (!spec) return;
  const k = H / 1080;
  const lw = Math.max(1, Math.round(k));
  const vertical = Math.abs(x1 - x0) < Math.abs(y1 - y0);
  const off = vertical ? [lw, 0] : [0, lw];
  const line = (col, dx = 0, dy = 0) => {
    g.strokeStyle = col;
    g.beginPath();
    g.moveTo(Math.round(x0) + dx + (vertical ? 0.5 : 0), Math.round(y0) + dy + (vertical ? 0 : 0.5));
    g.lineTo(Math.round(x1) + dx + (vertical ? 0.5 : 0), Math.round(y1) + dy + (vertical ? 0 : 0.5));
    g.stroke();
  };
  g.save();
  g.lineWidth = lw;
  const style = spec.frame.style;
  if (style === "bevel" || style === "carbon") {
    line("rgba(0, 0, 0, 0.55)");
    line("rgba(255, 255, 255, 0.12)", off[0], off[1]);
  } else if (style === "wood") {
    line("rgba(0, 0, 0, 0.45)");
    line(rgbaOf(spec.accent, 0.55), off[0], off[1]);
  } else if (style === "neon") {
    g.shadowColor = rgbaOf(spec.accent, 0.8);
    g.shadowBlur = 6 * k;
    line(rgbaOf(spec.accent, 0.45));
  } else {
    line("rgba(255, 255, 255, 0.16)");
  }
  g.restore();
}

// ---- The Look page's card ----------------------------------------------------------------

// A little made-up course: sky, trees on the hills, a fairway and a flag -
// busy enough to show a frame against.
function scenery(g, x, y, w, h, seed, { near = false } = {}) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  const sky = g.createLinearGradient(0, y, 0, y + h * 0.6);
  sky.addColorStop(0, near ? "#5d9fe0" : "#4a8ad6");
  sky.addColorStop(1, "#cfe6f5");
  g.fillStyle = sky;
  g.fillRect(x, y, w, h);
  const hill = (top, col, amp, s) => {
    g.beginPath();
    g.moveTo(x, y + h);
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      g.lineTo(x + t * w, y + h * top + Math.sin(t * 5 + s) * h * amp + (hash2(i, s, seed) - 0.5) * h * amp * 0.8);
    }
    g.lineTo(x + w, y + h);
    g.closePath();
    g.fillStyle = col;
    g.fill();
  };
  hill(0.5, "#5f8a6a", 0.04, 1);
  hill(0.58, "#2f6b3a", 0.05, 2);
  const grass = g.createLinearGradient(0, y + h * 0.62, 0, y + h);
  grass.addColorStop(0, "#4f9a3c");
  grass.addColorStop(1, "#2c6e25");
  g.fillStyle = grass;
  g.fillRect(x, y + h * 0.64, w, h * 0.36);
  for (let i = 0; i < 6; i++) {
    g.fillStyle = i % 2 ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)";
    g.beginPath();
    g.moveTo(x + w * (0.3 + i * 0.07), y + h * 0.64);
    g.lineTo(x + w * (0.37 + i * 0.07), y + h * 0.64);
    g.lineTo(x + w * (i * 0.2 + 0.2), y + h);
    g.lineTo(x + w * (i * 0.2), y + h);
    g.fill();
  }
  // A flag on the green.
  const fx = x + w * (near ? 0.62 : 0.7);
  const fy = y + h * 0.66;
  g.strokeStyle = "#f5f5f5";
  g.lineWidth = Math.max(1, h * 0.012);
  g.beginPath();
  g.moveTo(fx, fy);
  g.lineTo(fx, fy - h * 0.2);
  g.stroke();
  g.fillStyle = "#e8152b";
  g.beginPath();
  g.moveTo(fx, fy - h * 0.2);
  g.lineTo(fx + h * 0.08, fy - h * 0.17);
  g.lineTo(fx, fy - h * 0.14);
  g.fill();
  g.restore();
}

// The Look page's card for a look: a framed picture and a plate with a
// number in the look's type, drawn into `canvas` at its own size.
// settings: as the setting is kept (sim/scenelook.mjs cleanSceneLook).
export function drawLookCard(canvas, settings) {
  const g = canvas.getContext("2d");
  const W = canvas.width;
  const Hc = canvas.height;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, W, Hc);
  scenery(g, 0, 0, W, Hc, 3);
  g.fillStyle = "rgba(0, 0, 0, 0.18)";
  g.fillRect(0, 0, W, Hc);
  const spec = lookSpec(settings);
  // The card as a part of a 1080p picture seen this small.
  const H = Math.max(240, Math.round((1080 * Hc) / 330));
  const k = H / 1080;
  const pic = { x: Math.round(W * 0.06), y: Math.round(Hc * 0.12), w: Math.round(W * 0.5), h: Math.round(Hc * 0.76) };
  const pl = { x: Math.round(W * 0.62), y: Math.round(Hc * 0.27), w: Math.round(W * 0.32), h: Math.round(Hc * 0.46) };
  if (!spec) {
    // Each box as made: the recording's own white border and dark panel.
    scenery(g, pic.x, pic.y, pic.w, pic.h, 9, { near: true });
    g.strokeStyle = "#ffffff";
    g.lineWidth = Math.max(1.5, 4 * k);
    g.strokeRect(pic.x, pic.y, pic.w, pic.h);
    g.beginPath();
    rr(g, pl.x, pl.y, pl.w, pl.h, pl.h * 0.14);
    g.fillStyle = "rgba(8, 14, 10, 0.72)";
    g.fill();
    cardWords(g, pl, null, k);
    g.restore();
    return;
  }
  const fullW = spec.frame.width > 0 ? Math.max(1, Math.round(spec.frame.width * k)) : 0;
  // (The plate's a stat box: the thin frame, as the small boxes have it -
  // sim/scenelook.mjs frameWidth.)
  const plateW = spec.frame.thin > 0 ? Math.max(1, Math.round(spec.frame.thin * k)) : 0;
  const rad = Math.round(spec.frame.radius * k);
  const opt = (width, kind) => ({ width, radius: Math.min(rad, Math.floor(Math.min(pic.w, pic.h) / 4)), H, kind });
  drawPlate(g, pic, spec, opt(fullW, "camera"));
  g.save();
  const inPic = insetRect(pic, spec.frame.width > 0 ? fullW : 0);
  g.beginPath();
  rr(g, inPic.x, inPic.y, inPic.w, inPic.h, innerRadius(rad, fullW));
  g.clip();
  scenery(g, inPic.x, inPic.y, inPic.w, inPic.h, 9, { near: true });
  g.restore();
  drawFrame(g, pic, spec, opt(fullW, "camera"));
  const po = { ...opt(plateW, "stat"), radius: Math.min(rad, Math.floor(Math.min(pl.w, pl.h) / 4)) };
  drawPlate(g, pl, spec, po);
  cardWords(g, insetRect(pl, po.width), spec, k);
  drawFrame(g, pl, spec, po);
  g.restore();
}

// "CARRY / 187 yds" in the look's type.
function cardWords(g, r, spec, k) {
  const t = spec?.type ?? { font: `"Segoe UI", Arial, sans-serif`, text: "#ffffff", muted: "rgba(255, 255, 255, 0.7)", accent: "#ffd23f", glow: null, numberWeight: 800, labelWeight: 700, labelSpacing: 0 };
  const font = (weight, size) => (spec ? lookFont(spec, weight, size) : `${weight} ${Math.round(size)}px ${t.font}`);
  const pad = Math.max(3, r.h * 0.14);
  g.save();
  g.textBaseline = "alphabetic";
  g.textAlign = "left";
  const ls = Math.max(5, r.h * 0.2);
  g.font = font(t.labelWeight, ls);
  if ("letterSpacing" in g) g.letterSpacing = `${(t.labelSpacing * ls).toFixed(1)}px`;
  g.fillStyle = t.muted;
  g.fillText("CARRY", r.x + pad, r.y + pad + ls * 0.8);
  if ("letterSpacing" in g) g.letterSpacing = "0px";
  // As big as fits, the unit beside it.
  let ns = Math.max(8, r.h * 0.46);
  g.font = font(t.numberWeight, ns);
  const room = r.w - pad * 2;
  const wide = g.measureText("187").width * 1.42;
  if (wide > room) ns = Math.max(6, (ns * room) / wide);
  g.font = font(t.numberWeight, ns);
  if (t.glow) {
    g.shadowColor = t.glow.colour;
    g.shadowBlur = t.glow.blur * k;
  }
  g.fillStyle = t.text;
  const base = r.y + r.h - pad;
  g.fillText("187", r.x + pad, base);
  const nw = g.measureText("187").width;
  g.shadowBlur = 0;
  g.font = font(t.labelWeight, ns * 0.42);
  g.fillStyle = t.accent;
  g.fillText(" yds", r.x + pad + nw, base);
  g.restore();
}
