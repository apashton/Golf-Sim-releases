// The leaf pictures of the kinds that got their own after the first eight
// (the owner, 11 November 2026: the trees "more distinctive from each
// other ... without dramatically increasing triangle or draw amounts",
// then "work through the rest of the tree types"): a holly's, a hawthorn's
// and a beech's leaves, and a spruce's, a Scots pine's and a cedar's
// needles - each a cell of the leaf atlas (look/trees.js ATLAS), so a kind
// that wore another's picture is told from it close to, in its boughs and
// in the far woods' pictures, for no triangle and no draw more.
//
// Each painter: (ctx, size, rand, tools) - the canvas's 2D context scaled
// so the card is `size` (256) across, a seeded random source, and
// look/trees.js's own tools ({ paintLeaf, dilate }). Painted darkest
// first, the lighter over them, with clear sky between; in the same greens
// as the first pictures (a leaf's shade v -> rgb(0.42v, 0.7v, 0.3v), a
// needle's 0.38v), so each picture's average is its family's and a tree's
// own colour comes out as it's meant (look/trees.js LEAF_AVERAGE,
// cardColor).

const leafRgb = (v, k = 1) => `rgb(${(v * 0.42 * k) | 0},${(v * 0.7 * k) | 0},${(v * 0.3 * k) | 0})`;
const lightRgb = (v) => `rgb(${(v * 0.6) | 0},${Math.min(255, v * 0.95) | 0},${(v * 0.42) | 0})`;
const needleRgb = (v, blue = 0) => `rgb(${(v * (0.38 - blue * 0.08)) | 0},${(v * 0.7) | 0},${(v * (0.3 + blue * 0.22)) | 0})`;

// How each is painted, on the 256 grid.
export const HOLLY_LEAF = { leaves: 26, len: [34, 50], wide: 0.44, spines: 4, spine: 0.3, berries: 4, berry: 4.4 };
export const HAWTHORN_LEAF = { leaves: 46, len: [17, 27], lobes: 3 };
export const BEECH_LEAF = { sprays: 7, leaves: 7, len: [24, 34], wide: 0.3 };
export const SPRUCE_NEEDLES = { twigs: 9, needles: 30, len: [7, 11] };
export const SCOTS_NEEDLES = { tufts: 11, needles: 22, len: [26, 40] };
export const CEDAR_NEEDLES = { sprays: 6, rosettes: 9, needles: 9, len: [7, 10], cones: 3 };

// Places for `n` things scattered about the middle of the card, the
// darkest first: [x, y, turn, shade].
function scattered(n, size, rand, spread, v0, v1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2;
    const d = size * spread * Math.sqrt(rand());
    out.push([size / 2 + Math.cos(a) * d, size / 2 + Math.sin(a) * d, rand() * Math.PI * 2, v0 + rand() * (v1 - v0)]);
  }
  return out.sort((p, q) => p[3] - q[3]);
}

// A holly's: stiff, dark, glossy leaves with a spine at each wave of their
// edge and one at the tip, a pale gloss down one side of the midrib - and
// clusters of red berries at some of their feet.
function holly(ctx, size, rand, { dilate }) {
  const H = HOLLY_LEAF;
  const leaf = (x, y, ang, len, v) => {
    const wid = len * H.wide;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    const edge = (side) => {
      // Out to each spine's point and back in between them.
      const pts = [];
      for (let i = 0; i <= H.spines; i++) {
        const t = (i + 0.5) / (H.spines + 0.5);
        const bulge = Math.sin(Math.min(1, t * 0.98) * Math.PI) * 0.9 + 0.1;
        pts.push([len * (t - 0.5 / (H.spines + 0.5)) * 0.94, side * wid * bulge * (1 - H.spine)]);
        pts.push([len * t * 0.94, side * wid * bulge * (1 + H.spine)]);
      }
      return pts;
    };
    const outline = () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (const [px, py] of edge(1)) ctx.lineTo(px, py);
      ctx.lineTo(len, 0);
      for (const [px, py] of edge(-1).reverse()) ctx.lineTo(px, py);
      ctx.closePath();
    };
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.translate(len * 0.05, len * 0.06);
    outline();
    ctx.fillStyle = "rgba(10,22,10,0.3)";
    ctx.fill();
    ctx.restore();
    outline();
    ctx.fillStyle = leafRgb(v, 0.9);
    ctx.fill();
    // Its gloss: a pale streak along one side of the midrib, only on the leaf.
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = `rgba(${Math.min(255, v * 1.25) | 0},${Math.min(255, v * 1.5) | 0},${Math.min(255, v * 1.05) | 0},0.4)`;
    ctx.beginPath();
    ctx.ellipse(len * 0.5, -wid * 0.3, len * 0.3, wid * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(${(v * 0.9) | 0},${Math.min(255, v * 1.15) | 0},${(v * 0.5) | 0},0.9)`;
    ctx.lineWidth = Math.max(0.6, len * 0.028);
    ctx.beginPath();
    ctx.moveTo(len * 0.04, 0);
    ctx.lineTo(len * 0.95, 0);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  };
  const leaves = scattered(H.leaves, size, rand, 0.36, 92, 168);
  for (const [x, y, a, v] of leaves) leaf(x, y, a, H.len[0] + rand() * (H.len[1] - H.len[0]), v);
  // Berries: a tight bunch of three to five, bright red with a glint - over
  // the leaves, near the middle of the card where they'll show.
  for (let b = 0; b < H.berries; b++) {
    const a = rand() * Math.PI * 2;
    const d = size * 0.3 * Math.sqrt(rand());
    const bx = size / 2 + Math.cos(a) * d;
    const by = size / 2 + Math.sin(a) * d;
    const n = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const px = bx + (rand() - 0.5) * H.berry * 2.4;
      const py = by + (rand() - 0.5) * H.berry * 2.4;
      const r = H.berry * (0.8 + rand() * 0.35);
      ctx.fillStyle = "rgb(150,14,18)";
      ctx.beginPath();
      ctx.arc(px + r * 0.12, py + r * 0.14, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgb(255,52,40)";
      ctx.beginPath();
      ctx.arc(px, py, r * 0.88, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,225,215,0.85)";
      ctx.beginPath();
      ctx.arc(px - r * 0.3, py - r * 0.32, r * 0.26, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  dilate(ctx, 2);
}

// A hawthorn's: many small leaves, each cut deep into three to five blunt
// lobes about a short midrib - a fine, busy texture beside a broadleaf's
// plain ovals or an oak's long lobed ones.
function hawthorn(ctx, size, rand, { dilate }) {
  const H = HAWTHORN_LEAF;
  const leaf = (x, y, ang, len, v) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    const lobes = H.lobes + Math.floor(rand() * 2);
    const outline = () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const n = 44;
      for (let i = 0; i <= n; i++) {
        // Round from one side of the stalk to the other: a wedge at the
        // stalk, the lobes fanned ahead of it.
        const t = -1 + (2 * i) / n;
        const a = t * 1.95;
        const lobe = Math.pow(Math.abs(Math.cos(t * lobes * Math.PI * 0.5)), 0.55);
        const r = len * (0.34 + 0.66 * lobe) * (0.62 + 0.38 * Math.cos(a * 0.5));
        ctx.lineTo(len * 0.18 + Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82);
      }
      ctx.closePath();
    };
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.translate(len * 0.06, len * 0.07);
    outline();
    ctx.fillStyle = "rgba(18,30,12,0.24)";
    ctx.fill();
    ctx.restore();
    outline();
    ctx.fillStyle = leafRgb(v);
    ctx.fill();
    ctx.save();
    ctx.translate(len * 0.3, 0);
    ctx.scale(0.55, 0.5);
    ctx.translate(-len * 0.18, 0);
    outline();
    ctx.fillStyle = lightRgb(v);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = `rgba(${(v * 0.75) | 0},${Math.min(255, v) | 0},${(v * 0.35) | 0},0.8)`;
    ctx.lineWidth = Math.max(0.5, len * 0.035);
    ctx.beginPath();
    ctx.moveTo(-len * 0.12, 0);
    ctx.lineTo(len * 0.78, 0);
    ctx.stroke();
    ctx.restore();
  };
  for (const [x, y, a, v] of scattered(H.leaves, size, rand, 0.39, 100, 178)) leaf(x, y, a, H.len[0] + rand() * (H.len[1] - H.len[0]), v);
  dilate(ctx, 1);
}

// A beech's: flat sprays - a fine zigzag twig with a pointed oval leaf at
// each bend, all in one plane, their close straight side veins showing -
// where a broadleaf's picture is a round clump.
function beech(ctx, size, rand, { dilate }) {
  const B = BEECH_LEAF;
  const leaf = (x, y, ang, len, v) => {
    const wid = len * B.wide;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    const outline = () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const n = 16;
      for (let i = 1; i <= n; i++) ctx.lineTo((i / n) * len, wid * Math.pow(Math.sin((i / n) * Math.PI), 0.8) * (1 - 0.25 * (i / n)));
      for (let i = n; i >= 0; i--) ctx.lineTo((i / n) * len, -wid * Math.pow(Math.sin((i / n) * Math.PI), 0.8) * (1 - 0.25 * (i / n)));
      ctx.closePath();
    };
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.translate(len * 0.05, len * 0.06);
    outline();
    ctx.fillStyle = "rgba(18,30,12,0.22)";
    ctx.fill();
    ctx.restore();
    outline();
    ctx.fillStyle = leafRgb(v);
    ctx.fill();
    ctx.save();
    ctx.translate(len * 0.15, 0);
    ctx.scale(0.7, 0.55);
    outline();
    ctx.fillStyle = lightRgb(v);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.strokeStyle = `rgba(${(v * 0.34) | 0},${(v * 0.56) | 0},${(v * 0.24) | 0},0.5)`;
    ctx.lineWidth = Math.max(0.35, len * 0.014);
    ctx.beginPath();
    for (let k = 1; k <= 7; k++) {
      const t = k / 8.5;
      for (const side of [-1, 1]) {
        ctx.moveTo(len * t, 0);
        ctx.lineTo(len * (t + 0.1), side * wid * 0.9 * Math.sin((t + 0.1) * Math.PI));
      }
    }
    ctx.stroke();
    ctx.strokeStyle = `rgba(${(v * 0.78) | 0},${Math.min(255, v * 1.02) | 0},${(v * 0.36) | 0},0.85)`;
    ctx.lineWidth = Math.max(0.5, len * 0.024);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len * 0.95, 0);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  };
  const sprays = scattered(B.sprays, size, rand, 0.2, 100, 172);
  for (const [x0, y0, ang, v] of sprays) {
    // The twig, out from near the middle; a leaf to each side in turn.
    const reach = size * (0.26 + rand() * 0.1);
    ctx.strokeStyle = "rgb(92,74,52)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + Math.cos(ang) * reach, y0 + Math.sin(ang) * reach);
    ctx.stroke();
    for (let i = B.leaves - 1; i >= 0; i--) {
      const f = (i + 0.6) / B.leaves;
      const side = i % 2 ? 1 : -1;
      const len = (B.len[0] + rand() * (B.len[1] - B.len[0])) * (1 - 0.3 * f);
      leaf(x0 + Math.cos(ang) * reach * f, y0 + Math.sin(ang) * reach * f, ang + side * (0.75 + rand() * 0.2) * (i === B.leaves - 1 ? 0.15 : 1), len, v * (0.92 + rand() * 0.16));
    }
  }
  dilate(ctx, 2);
}

// A spruce's: short needles standing all round each twig like a bottle
// brush, the twigs hanging side by side - not a pine's long feathers.
function spruce(ctx, size, rand, { dilate }) {
  const S = SPRUCE_NEEDLES;
  const twigs = [];
  for (let t = 0; t < S.twigs; t++) twigs.push([size * (0.16 + 0.68 * ((t + rand() * 0.6) / S.twigs)), size * (0.14 + rand() * 0.2), Math.PI / 2 + (rand() - 0.5) * 0.5, size * (0.42 + rand() * 0.22), 78 + rand() * 62]);
  twigs.sort((p, q) => p[4] - q[4]);
  for (const [x0, y0, ang, reach, v0] of twigs) {
    ctx.strokeStyle = "rgb(84,62,40)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + Math.cos(ang) * reach, y0 + Math.sin(ang) * reach);
    ctx.stroke();
    for (let i = 0; i <= S.needles; i++) {
      const f = i / S.needles;
      const x = x0 + Math.cos(ang) * reach * f;
      const y = y0 + Math.sin(ang) * reach * f;
      const len = (S.len[0] + rand() * (S.len[1] - S.len[0])) * (1 - 0.35 * f);
      for (const side of [-1, 1]) {
        const a = ang + side * (1.0 + rand() * 0.45);
        const v = v0 + (rand() - 0.5) * 34;
        ctx.strokeStyle = needleRgb(v, 0.5);
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
        ctx.stroke();
      }
    }
    // (Its paler new growth at the tip.)
    ctx.strokeStyle = needleRgb(v0 + 70, 0.2);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0 + Math.cos(ang) * reach * 0.94, y0 + Math.sin(ang) * reach * 0.94);
    ctx.lineTo(x0 + Math.cos(ang) * reach * 1.04, y0 + Math.sin(ang) * reach * 1.04);
    ctx.stroke();
  }
  dilate(ctx, 1);
}

// A Scots pine's: long needles in round tufts at the ends of bare twigs,
// blue-green - each tuft a burst, the bursts apart so the sky's between.
function scots(ctx, size, rand, { dilate }) {
  const S = SCOTS_NEEDLES;
  for (const [x, y, turn, v0] of scattered(S.tufts, size, rand, 0.33, 86, 150)) {
    ctx.strokeStyle = "rgb(120,84,52)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - Math.cos(turn) * 16, y - Math.sin(turn) * 16);
    ctx.stroke();
    for (let i = 0; i < S.needles; i++) {
      // Fanned forward of the twig more than back along it.
      const a = turn + (rand() - 0.5) * 3.6;
      const len = S.len[0] + rand() * (S.len[1] - S.len[0]);
      const v = v0 + (rand() - 0.5) * 40;
      ctx.strokeStyle = needleRgb(v, 1);
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + (rand() - 0.5) * 4, y + Math.sin(a) * len * 0.5 + (rand() - 0.5) * 4, x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
  }
  dilate(ctx, 1);
}

// A cedar's: level sprays, their side twigs set with small rosettes of
// short needles like stars along them, blue-green - and here and there an
// upright barrel of a cone standing on the spray.
function cedar(ctx, size, rand, { dilate }) {
  const C = CEDAR_NEEDLES;
  const cones = [];
  for (const [x0, y0, ang, v0] of scattered(C.sprays, size, rand, 0.12, 84, 140)) {
    const reach = size * (0.3 + rand() * 0.1);
    ctx.strokeStyle = "rgb(96,72,50)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + Math.cos(ang) * reach, y0 + Math.sin(ang) * reach);
    ctx.stroke();
    for (let i = 0; i < C.rosettes; i++) {
      const f = (i + 0.7) / C.rosettes;
      const side = i % 2 ? 1 : -1;
      const off = (6 + rand() * 9) * (1 - 0.4 * f);
      const rx = x0 + Math.cos(ang) * reach * f + Math.cos(ang + side * 1.25) * off;
      const ry = y0 + Math.sin(ang) * reach * f + Math.sin(ang + side * 1.25) * off;
      ctx.strokeStyle = "rgb(96,72,50)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x0 + Math.cos(ang) * reach * f, y0 + Math.sin(ang) * reach * f);
      ctx.lineTo(rx, ry);
      ctx.stroke();
      const v = v0 + (rand() - 0.5) * 36;
      for (let k = 0; k < C.needles; k++) {
        const a = (k / C.needles) * Math.PI * 2 + rand() * 0.5;
        const len = C.len[0] + rand() * (C.len[1] - C.len[0]);
        ctx.strokeStyle = needleRgb(v + (rand() - 0.5) * 24, 0.85);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + Math.cos(a) * len, ry + Math.sin(a) * len);
        ctx.stroke();
      }
      if (cones.length < C.cones && rand() < 0.1) cones.push([rx, ry]);
    }
  }
  // Its cones: pale green-grey barrels, banded.
  for (const [x, y] of cones) {
    ctx.fillStyle = "rgb(150,160,120)";
    ctx.beginPath();
    ctx.ellipse(x, y - 9, 6.5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(96,104,72,0.9)";
    ctx.lineWidth = 0.9;
    for (let b = -2; b <= 2; b++) {
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 9 + b * 3.4);
      ctx.lineTo(x + 6, y - 9 + b * 3.4);
      ctx.stroke();
    }
  }
  dilate(ctx, 1);
}

// Each picture's painter, the seed its randomness starts from, and whether
// its leaves are needles (the colour its card takes where there are none:
// look/trees.js leafFill).
export const LEAF_PICTURES = {
  holly: { paint: holly, seed: 53, needles: false },
  hawthorn: { paint: hawthorn, seed: 59, needles: false },
  beech: { paint: beech, seed: 61, needles: false },
  spruce: { paint: spruce, seed: 71, needles: true },
  scots: { paint: scots, seed: 73, needles: true },
  cedar: { paint: cedar, seed: 79, needles: true },
};
