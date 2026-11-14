// A QR code for a short text - the host's join link (sim/netinvite.mjs), so
// a friend points a phone at the screen instead of typing the code (the
// owner's "invite links/QR codes for codes"). Byte mode, error correction
// level M (a quarter of it can be lost or dirty), versions 1 to 6 (up to
// 106 characters): what's needed here and nothing more. Pure: the
// modules as rows of true (dark) / false, for the page to draw.

// Per version (1-6), level M: [error correction codewords per block,
// blocks, data codewords per block] and the alignment pattern's centres.
const BLOCKS = [null, [10, 1, 16], [16, 1, 28], [26, 1, 44], [18, 2, 32], [24, 2, 43], [16, 4, 27]];
const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34]];
const REMAINDER = [null, 0, 7, 7, 7, 7, 7];

// ---- Reed-Solomon over GF(256) ------------------------------------------------

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

// The error correction codewords for `data` (n of them).
export function rsCodewords(data, n) {
  // The generator polynomial: (x - 1)(x - a)...(x - a^(n-1)).
  let gen = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= mul(gen[j], EXP[i]);
    }
    gen = next;
  }
  const rem = new Array(n).fill(0);
  for (const d of data) {
    const f = d ^ rem.shift();
    rem.push(0);
    for (let j = 0; j < n; j++) rem[j] ^= mul(gen[j + 1], f);
  }
  return rem;
}

// ---- The codewords ------------------------------------------------------------

const capacity = (v) => BLOCKS[v][1] * BLOCKS[v][2];

function codewords(bytes, v) {
  const [ec, blocks, per] = BLOCKS[v];
  const total = blocks * per;
  // Mode (byte: 0100), the count, the bytes, a terminator, then padding.
  const bits = [];
  const put = (value, n) => {
    for (let i = n - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };
  put(4, 4);
  put(bytes.length, 8);
  for (const b of bytes) put(b, 8);
  put(0, Math.min(4, total * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  for (let pad = 0; data.length < total; pad++) data.push(pad % 2 ? 0x11 : 0xec);
  // Each block's own error correction; then both interleaved.
  const dataBlocks = Array.from({ length: blocks }, (_, k) => data.slice(k * per, (k + 1) * per));
  const ecBlocks = dataBlocks.map((d) => rsCodewords(d, ec));
  const out = [];
  for (let i = 0; i < per; i++) for (const d of dataBlocks) out.push(d[i]);
  for (let i = 0; i < ec; i++) for (const e of ecBlocks) out.push(e[i]);
  return out;
}

// ---- The symbol -----------------------------------------------------------------

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

// The 15 format bits: level M (00) and the mask, BCH-coded and masked.
export function formatBits(mask) {
  const d = (0b00 << 3) | mask;
  let r = d << 10;
  for (let i = 14; i >= 10; i--) if ((r >> i) & 1) r ^= 0x537 << (i - 10);
  return ((d << 10) | r) ^ 0x5412;
}

function build(v, words, mask) {
  const n = 17 + 4 * v;
  const m = Array.from({ length: n }, () => new Array(n).fill(false));
  const fixed = Array.from({ length: n }, () => new Array(n).fill(false));
  const set = (r, c, dark) => {
    m[r][c] = dark;
    fixed[r][c] = true;
  };
  // Finder patterns, with their white separators.
  for (const [fr, fc] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = fr + r;
        const cc = fc + c;
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
        const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3));
        set(rr, cc, r >= 0 && r <= 6 && c >= 0 && c <= 6 && ring !== 2);
      }
    }
  }
  // Alignment patterns (not over a finder).
  for (const ar of ALIGN[v]) {
    for (const ac of ALIGN[v]) {
      if (fixed[ar][ac]) continue;
      for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) set(ar + r, ac + c, Math.max(Math.abs(r), Math.abs(c)) !== 1);
    }
  }
  // Timing patterns.
  for (let i = 8; i < n - 8; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  // The dark module, and room kept for the format bits.
  set(4 * v + 9, 8, true);
  const fmt = formatBits(mask);
  const bit = (i) => ((fmt >> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) set(8, i, bit(14 - i));
  set(8, 7, bit(8));
  set(8, 8, bit(7));
  set(7, 8, bit(6));
  for (let i = 9; i <= 14; i++) set(14 - i, 8, bit(14 - i));
  // (The copy: down the left under the bottom finder, bits 14-8 - the dark
  // module above them - then along the top under the right one, 7-0.)
  for (let i = 0; i <= 6; i++) set(n - 1 - i, 8, bit(14 - i));
  for (let i = 0; i <= 7; i++) set(8, n - 8 + i, bit(7 - i));
  // The data, in two-module columns from the bottom right, up and down in
  // turn, round the fixed parts; masked.
  const bits = [];
  for (const w of words) for (let i = 7; i >= 0; i--) bits.push((w >> i) & 1);
  for (let i = 0; i < REMAINDER[v]; i++) bits.push(0);
  let k = 0;
  let up = true;
  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col = 5;
    for (let i = 0; i < n; i++) {
      const r = up ? n - 1 - i : i;
      for (const c of [col, col - 1]) {
        if (fixed[r][c]) continue;
        const dark = k < bits.length ? bits[k] === 1 : false;
        k++;
        m[r][c] = dark !== MASKS[mask](r, c);
      }
    }
    up = !up;
  }
  return m;
}

// How badly a symbol reads (the standard's four penalty rules): the mask
// with the least is used.
function penalty(m) {
  const n = m.length;
  let p = 0;
  const lines = [...m, ...m[0].map((_, c) => m.map((row) => row[c]))];
  for (const line of lines) {
    let run = 1;
    for (let i = 1; i <= n; i++) {
      if (i < n && line[i] === line[i - 1]) run++;
      else {
        if (run >= 5) p += run - 2;
        run = 1;
      }
    }
    const s = line.map((x) => (x ? 1 : 0)).join("");
    for (const pat of ["10111010000", "00001011101"]) for (let i = s.indexOf(pat); i >= 0; i = s.indexOf(pat, i + 1)) p += 40;
  }
  for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) if (m[r][c] === m[r + 1][c] && m[r][c] === m[r][c + 1] && m[r][c] === m[r + 1][c + 1]) p += 3;
  const dark = m.flat().filter(Boolean).length;
  p += Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
  return p;
}

// The QR code for `text`: rows of modules (true: dark), the smallest
// version it fits; null if it's too long.
export function qrMatrix(text) {
  const bytes = new TextEncoder().encode(String(text));
  const v = [1, 2, 3, 4, 5, 6].find((x) => bytes.length + 2 <= capacity(x));
  if (!v) return null;
  const words = codewords(bytes, v);
  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const m = build(v, words, mask);
    const p = penalty(m);
    if (!best || p < best.p) best = { m, p };
  }
  return best.m;
}

// The code as an SVG path's d (one unit a module, a quiet zone of 4 round
// it), and the whole width - for the page to draw at any size.
export function qrPath(text) {
  const m = qrMatrix(text);
  if (!m) return null;
  const q = 4;
  let d = "";
  m.forEach((row, r) =>
    row.forEach((dark, c) => {
      if (dark) d += `M${c + q} ${r + q}h1v1h-1z`;
    }),
  );
  return { d, size: m.length + 2 * q };
}
