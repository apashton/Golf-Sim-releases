// Fingered bunkers (the owner, 5 November 2026, from the graphics list:
// "fingered and cross bunkers"): sand reaching out into the turf in long
// fingers, with tongues of grass - capes - pushing in between them, as a
// heathland course's are (Sunningdale, Walton Heath, Pine Valley) and now
// and then a parkland course's (MacKenzie's, Augusta's first ones). Most
// of the fingers reach up its face - the side play comes towards, where
// its sand is flashed up (sim/hazardshapes.mjs) - the rest round the back
// short ones.
//
// A fingered bunker is a blob (sim/course.mjs blobRadius) with
// `fingered: { s, n, len, face, k, w? }`: its own seed s, n fingers, how
// long the longest are (len, a share of its half width rz - so sized with
// it), which way its face is (face: an angle round its own outline - the
// ellipse's own angle, so the fingers spread evenly along a long one's
// sides), how many of them are on it (k, a share) and, if not the usual,
// how far round either side of it they spread (w). Its edge is the
// blob's, pushed out by each finger and in by each cape (fingerOffset) -
// one radius in each direction from its middle, as every blob's is, so
// the lie (sim/course.mjs insideBlob), its sand, its collar and its dug
// ground all follow the same outline. How far a spot is inside it (sim/
// holeedits/shapes.mjs insideDepth) is measured to the nearest edge, not
// along the line from its middle (fingeredDepth): a finger's sides are
// its edge too, so it's dug with a face down each side, not a cliff.
//
// Hole frame (sim/course.mjs), metres. Pure.

import { seeded, blobRadius, outlineAngle } from "./course.mjs";
import { smoothstep01 } from "./mathutil.mjs";

export const FINGERED = {
  // The chance a plain bunker of each style (sim/course.mjs BUNKER_STYLES)
  // is fingered: most on a heathland course, now and then one by a
  // parkland course's green (a MacKenzie bunker), none of a modern
  // course's big sweeping ones (nor a links hole's pots).
  chance: { rugged: 0.8, classic: 0.12, modern: 0 },
  // The styles whose fairway bunkers are fingered too (a parkland course's
  // only by its greens).
  fairway: { rugged: true },
  // None smaller than this (its half length, metres).
  least: 5,
  // How many fingers, by style: [least, most] (a heathland row of cross
  // bunkers' each: "row", sim/crossbunkers.mjs).
  count: { rugged: [6, 9], classic: [4, 6], row: [3, 5] },
  // How long the longest reach (a share of its half width), by style.
  len: { rugged: [0.75, 1.15], classic: [0.6, 0.85], row: [0.55, 0.85] },
  // The share of them up its face, by style.
  face: { rugged: [0.65, 0.8], classic: [0.65, 0.8], row: [0.85, 1] },
  // How far either side of its face they spread (radians round it), by
  // style (a cross bunker's along its long face).
  spread: { rugged: 1.35, classic: 1.35, row: 1.05 },
  // Each finger's half width where it leaves the bunker, as a share of
  // its half width - and never under `narrowest` (metres).
  width: [0.26, 0.4],
  narrowest: 0.7,
  // A cape between two fingers up the face: how far it pushes in (a share
  // of the fingers' length either side) and how wide (of the gap).
  cape: [0.2, 0.45],
  // Its flashed face (sim/hazardshapes.mjs flashLift): its lip's height
  // over the grass (metres) and how far its back eases down - lower and
  // longer than a plain bunker's (HAZARDS.flash), its slope bending round
  // each finger.
  flash: { h: [0.15, 0.25], back: [2.4, 3] },
  capeWidth: 0.32,
};

// A finger's or cape's profile across it (t: -1 - 1 from one side of its
// base to the other): a rounded tip, its sides tapering a little, and
// easing into the bunker's edge at its foot rather than meeting it in a
// corner.
const bump = (t) => {
  const a = Math.abs(t);
  if (a >= 1) return 0;
  const foot = 1 - smoothstep01((a - 0.7) / 0.3);
  return (1 - t * t) ** 0.65 * foot;
};
const wrap = (a) => a - Math.PI * 2 * Math.floor((a + Math.PI) / (Math.PI * 2));
const r3 = (v) => Math.round(v * 1000) / 1000;

// The angle round an ellipse rx by rz (its own parameter) of the point
// at local angle phi from its middle - and back.
export const ellipseAngle = (rx, rz, phi) => Math.atan2(rx * Math.sin(phi), rz * Math.cos(phi));
export const localAngle = (rx, rz, theta) => Math.atan2(rz * Math.sin(theta), rx * Math.cos(theta));

// A fingered bunker's fingers and capes: [{ at, w, len }] each - at round
// its outline (the ellipse's angle), w its half width there (the same),
// len how far it reaches (metres; a cape's how far in). Worked out once
// for each shape as it is.
const PLANS = new WeakMap();
export function fingerPlan(shape) {
  const f = shape.fingered;
  const kept = PLANS.get(f);
  if (kept && kept.rx === shape.rx && kept.rz === shape.rz) return kept.plan;
  const rand = seeded((f.s >>> 0) || 1);
  const { rx, rz } = shape;
  const n = Math.max(1, Math.round(f.n));
  const long = Math.max(0.2, f.len) * rz;
  // A width in metres at angle theta, as the ellipse's angle there (the
  // outline runs fastest along a long bunker's sides).
  const speed = (theta) => Math.hypot(rx * Math.sin(theta), rz * Math.cos(theta)) || 1;
  const across = (metres, theta) => metres / speed(theta);
  const halfWidth = () => Math.max(FINGERED.narrowest, rz * (FINGERED.width[0] + rand() * (FINGERED.width[1] - FINGERED.width[0])));
  const fingers = [];
  const onFace = Math.max(1, Math.min(n, Math.round(n * (f.k ?? 0.7))));
  const spread = f.w ?? FINGERED.spread.rugged;
  for (let i = 0; i < onFace; i++) {
    const t = onFace === 1 ? 0 : (i / (onFace - 1)) * 2 - 1;
    const at = f.face + t * spread + (rand() - 0.5) * (spread / onFace) * 0.9;
    // Longest up the middle of the face, shorter towards its ends.
    const len = long * (0.55 + rand() * 0.45) * (1 - 0.4 * Math.abs(t));
    fingers.push({ at, w: across(halfWidth(), at), len });
  }
  // The rest round its back: short.
  const back = n - onFace;
  for (let i = 0; i < back && spread < Math.PI - 0.45; i++) {
    const t = (i + 0.5) / back;
    const at = f.face + spread + 0.45 + t * (Math.PI * 2 - 2 * spread - 0.9) + (rand() - 0.5) * 0.3;
    fingers.push({ at, w: across(halfWidth() * 1.2, at), len: long * (0.15 + rand() * 0.25) });
  }
  fingers.sort((a, b) => wrap(a.at - f.face) - wrap(b.at - f.face));
  // Capes: a tongue of grass between each two fingers up the face, where
  // there's room.
  const capes = [];
  for (let i = 0; i + 1 < fingers.length; i++) {
    const a = fingers[i];
    const b = fingers[i + 1];
    const gap = wrap(b.at - a.at);
    if (gap <= 0 || gap < (a.w + b.w) * 0.9 || Math.abs(wrap(a.at + gap / 2 - f.face)) > spread + 0.3) continue;
    const at = a.at + gap * (0.4 + rand() * 0.2);
    const len = Math.min(a.len, b.len) * (FINGERED.cape[0] + rand() * (FINGERED.cape[1] - FINGERED.cape[0]));
    capes.push({ at, w: gap * FINGERED.capeWidth, len });
  }
  const plan = { fingers, capes, most: Math.max(0, ...fingers.map((g) => g.len)) };
  PLANS.set(f, { rx, rz, plan });
  return plan;
}

// How far (metres) a fingered bunker's fingers push its edge out (its
// capes in) at local angle phi.
export function fingerOffset(shape, phi) {
  if (!shape?.fingered) return 0;
  const p = fingerPlan(shape);
  const theta = ellipseAngle(shape.rx, shape.rz, phi);
  let off = 0;
  for (const g of p.fingers) off += g.len * bump(wrap(theta - g.at) / g.w);
  for (const c of p.capes) off -= c.len * bump(wrap(theta - c.at) / c.w);
  return off;
}

// The furthest its fingers reach past its blob (metres).
export const fingerReach = (shape) => (shape?.fingered ? fingerPlan(shape).most + 0.05 : 0);

// ---- A bunker made fingered ---------------------------------------------------------

// Bunker b given fingers in a style (FINGERED), its face towards the world
// angle `towards` (the way play comes past it); rand: where its own
// numbers come from. Its old ragged edge (course.mjs styleBunker's
// fingers) goes: the fingers are its edge now.
export function fingerBunker(b, style, towards, rand) {
  const [n0, n1] = FINGERED.count[style] ?? FINGERED.count.rugged;
  const [l0, l1] = FINGERED.len[style] ?? FINGERED.len.rugged;
  const [k0, k1] = FINGERED.face[style] ?? FINGERED.face.rugged;
  const n = n0 + Math.floor(rand() * (n1 - n0 + 1));
  const len = l0 + rand() * (l1 - l0);
  const k = k0 + rand() * (k1 - k0);
  const s = Math.floor(rand() * 2 ** 31);
  // Its face as an angle round its own outline.
  const face = ellipseAngle(b.rx, b.rz, towards - (b.rot ?? 0));
  const { fingers, fk, fphase, ...rest } = b;
  void fingers, fk, fphase;
  const spread = FINGERED.spread[style] ?? FINGERED.spread.rugged;
  return { ...rest, lobes: Math.min(rest.lobes ?? 2, 3), depth: Math.min(rest.depth ?? 0.08, 0.12), fingered: { s, n, len: r3(len), face: r3(face), k: r3(k), ...(spread !== FINGERED.spread.rugged ? { w: spread } : {}) } };
}

// ---- How far inside one -------------------------------------------------------------

// How far a spot is inside a fingered bunker (metres; negative outside),
// to its nearest edge: worked out on a grid in its own frame (FIELD.cell)
// within FIELD.band of its edge - beyond that, as far as the line from its
// middle says (never less than the band). Which side of its edge it's on
// is always its outline's own (blobRadius), so the lie and this agree to
// the millimetre.
// smooth: box blurs [cells either side, passes] over it (blurField),
// exact: how near the edge it stays as it was.
export const FIELD = { cell: 0.15, band: 2.8, points: 512, smooth: [2, 3], exact: 0.5 };

// An n by n grid blurred in place: `passes` box blurs `r` cells either
// side, each way (a Gaussian, near enough), its edges held.
function blurField(d, n, [r, passes]) {
  const row = new Float32Array(n);
  for (let p = 0; p < passes; p++) {
    for (const along of [1, n]) {
      const across = along === 1 ? n : 1;
      for (let line = 0; line < n; line++) {
        const base = line * across;
        for (let i = 0; i < n; i++) row[i] = d[base + i * along];
        let sum = 0;
        for (let i = -r; i <= r; i++) sum += row[Math.min(n - 1, Math.max(0, i))];
        for (let i = 0; i < n; i++) {
          d[base + i * along] = sum / (2 * r + 1);
          sum += row[Math.min(n - 1, i + r + 1)] - row[Math.max(0, i - r)];
        }
      }
    }
  }
}
const FIELDS = new WeakMap();
const FIELD_KEYS = ["rx", "rz", "lobes", "phase", "depth", "fingers", "fk", "fphase", "bend", "edge", "fingered"];

function fieldOf(shape) {
  const kept = FIELDS.get(shape);
  if (kept && FIELD_KEYS.every((k, i) => kept.key[i] === shape[k])) return kept.field;
  const key = FIELD_KEYS.map((k) => shape[k]);
  const N = FIELD.points;
  // Its outline in its own frame (u along rx, v across).
  const pts = new Float64Array(N * 2);
  let reach = 0;
  for (let i = 0; i < N; i++) {
    const phi = outlineAngle(shape, i, N);
    const r = blobRadius(shape, phi);
    pts[i * 2] = Math.cos(phi) * r;
    pts[i * 2 + 1] = Math.sin(phi) * r;
    reach = Math.max(reach, r);
  }
  const B = FIELD.band;
  const cell = FIELD.cell;
  const half = reach + B + cell;
  const n = Math.ceil((half * 2) / cell) + 1;
  const x0 = -half;
  const d = new Float32Array(n * n).fill(Infinity);
  // Each side of the outline: the cells within the band of it.
  for (let i = 0; i < N; i++) {
    const ax = pts[i * 2];
    const az = pts[i * 2 + 1];
    const j = (i + 1) % N;
    const bx = pts[j * 2];
    const bz = pts[j * 2 + 1];
    const ex = bx - ax;
    const ez = bz - az;
    const len2 = ex * ex + ez * ez || 1e-12;
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - B - x0) / cell));
    const i1 = Math.min(n - 1, Math.ceil((Math.max(ax, bx) + B - x0) / cell));
    const k0 = Math.max(0, Math.floor((Math.min(az, bz) - B - x0) / cell));
    const k1 = Math.min(n - 1, Math.ceil((Math.max(az, bz) + B - x0) / cell));
    for (let k = k0; k <= k1; k++) {
      const z = x0 + k * cell;
      for (let c = i0; c <= i1; c++) {
        const x = x0 + c * cell;
        const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / len2));
        const dx = ax + ex * t - x;
        const dz = az + ez * t - z;
        const dd = dx * dx + dz * dz;
        const at = k * n + c;
        if (dd < d[at]) d[at] = dd;
      }
    }
  }
  for (let i = 0; i < d.length; i++) d[i] = Math.min(B, Math.sqrt(d[i]));
  // Signed (outside negative), so it runs straight through the edge and
  // blurring it leaves the edge where it is: inside by its outline, row by
  // row (even-odd).
  const xs = [];
  for (let k = 0; k < n; k++) {
    const z = x0 + k * cell;
    xs.length = 0;
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      const az = pts[i * 2 + 1];
      const bz = pts[j * 2 + 1];
      if (az > z === bz > z) continue;
      xs.push(pts[i * 2] + ((z - az) / (bz - az)) * (pts[j * 2] - pts[i * 2]));
    }
    xs.sort((a, b) => a - b);
    for (let c = 0, q = 0; c < n; c++) {
      const x = x0 + c * cell;
      while (q < xs.length && xs[q] <= x) q++;
      if (q % 2 === 0) d[k * n + c] = -d[k * n + c];
    }
  }
  // Smoothed (FIELD.smooth): the distance to the nearest edge has a sharp
  // crease along the middle of each finger and of each tongue of grass
  // between - and the dug face (a smoothstep of it) and a flashed face's
  // back slope with it: a crease of light down every finger's sand, and
  // outside, a valley the ground under the fairway couldn't follow, its
  // triangles showing through as dark shards. Rounded over a few tenths
  // of a metre, the ground's smooth; along a straight edge it's as it was.
  // (Exact within FIELD.exact of the edge, easing to the smoothed further
  // in or out: blurred, its zero drifts off a curved edge, and with the
  // outline's own side there it would fold.)
  const raw = Float32Array.from(d);
  blurField(d, n, FIELD.smooth);
  for (let i = 0; i < d.length; i++) {
    const k = Math.min(1, Math.abs(raw[i]) / FIELD.exact);
    const w = k * k * (3 - 2 * k);
    d[i] = raw[i] + (d[i] - raw[i]) * w;
  }
  const field = { d, n, x0, cell, half };
  FIELDS.set(shape, { key, field });
  return field;
}

// How far (u, v) - in the shape's own frame - is from its edge (metres,
// signed, smoothed: FIELD.band at most either way), or null outside its
// grid.
function fieldDistance(shape, u, v) {
  const f = fieldOf(shape);
  const gx = (u - f.x0) / f.cell;
  const gz = (v - f.x0) / f.cell;
  if (!(gx >= 0 && gz >= 0 && gx < f.n - 1 && gz < f.n - 1)) return null;
  const c = Math.floor(gx);
  const k = Math.floor(gz);
  const fx = gx - c;
  const fz = gz - k;
  const i = k * f.n + c;
  const a = f.d[i] + (f.d[i + 1] - f.d[i]) * fx;
  const b = f.d[i + f.n] + (f.d[i + f.n + 1] - f.d[i + f.n]) * fx;
  return a + (b - a) * fz;
}

// insideDepth for a fingered bunker, at (u, v) in its own frame, d =
// hypot(u, v): its outline says which side (blobRadius), its field how far.
export function fingeredDepth(shape, u, v, d = Math.hypot(u, v)) {
  const radial = blobRadius(shape, Math.atan2(v, u)) - d;
  const signed = fieldDistance(shape, u, v);
  if (signed == null) return radial;
  const near = Math.abs(signed);
  const far = Math.abs(radial);
  // (Within the band, the field's; beyond it, the line from its middle's,
  // which is never nearer than the true distance.)
  const m = near < FIELD.band - 0.05 ? near : Math.max(FIELD.band, far);
  return radial >= 0 ? m : -m;
}

