// A flat shape filled with a grid (the owner, 20 November 2026: "improving
// triangle and draw counts"). A fairway laid over rolling ground has to
// follow it between its edges too, so its shape was cut into triangles from
// its outline alone - long thin ones from edge to edge - and those split
// until no side was over a metre and a half (look/dugground.js refine).
// Splitting a long thin triangle's sides halves its width too: a links
// hole's fairway came out as 44,000 slivers, most a hand's width across,
// where a grid of metre-and-a-half squares over the same ground is 9,000.
//
// So the grid first: every square of a `step`-metre grid that lies wholly
// inside the outline, two triangles each - and the strip left between the
// squares and the outline joined across (zipStrip), its triangles no
// longer than the strip is wide. What's cut out of a fairway - a dug
// bunker, a pond - isn't cut here: the mesh is trimmed to their edges
// after, as it always was (look/dugground.js trimOut).
//
// Pure: the squares, the line round them, the strip. Points are [x, y] in
// the shape's own flat frame. look/gridfill.js makes the mesh.

// Whether point (px, py) is within `d` of the segment a - b.
function nearSegment(px, py, ax, ay, bx, by, d) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  const ex = ax + dx * t - px;
  const ey = ay + dy * t - py;
  return ex * ex + ey * ey < d * d;
}

// A closed line's area, signed: over 0 running anticlockwise (x right, y up).
export function signedArea(loop) {
  let a = 0;
  for (let i = 0; i < loop.length; i++) {
    const [x0, y0] = loop[i];
    const [x1, y1] = loop[(i + 1) % loop.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
}

// Whether (x, y) is inside a closed line (even-odd).
export function insideLoop(loop, x, y) {
  let inside = false;
  for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
    const [xi, yi] = loop[i];
    const [xj, yj] = loop[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// The grid inside `outline` (a closed line, either way round), clear of
// `holes` (closed lines cut out of it): squares `step` across on a grid
// through the origin, each wholly inside the outline and outside every
// hole, none nearer either's edge than a little (margin less the reach
// of a square's corner to its middle).
//   { step, cells: [[i, j], ...]        each square's low corner, in steps
//     outer: [loop, ...]                the lines round the squares, each
//     inner: [loop, ...] }              [[x, y], ...]: outer - round a patch
//                                       of them (anticlockwise); inner -
//                                       round a gap inside one (clockwise)
// or null where no square fits.
export function gridFill(outline, holes, step, { margin = 0.75 * step } = {}) {
  if (!(step > 0) || !outline || outline.length < 3) return null;
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const [x, y] of outline) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  const i0 = Math.ceil(x0 / step);
  const i1 = Math.floor(x1 / step);
  const j0 = Math.ceil(y0 / step);
  const j1 = Math.floor(y1 / step);
  const nx = i1 - i0 + 1;
  const ny = j1 - j0 + 1;
  if (nx < 2 || ny < 2) return null;
  // The edges, kept by where they are (squares `bin` across), each as far
  // out as it could matter to a point.
  const loops = [outline, ...(holes ?? []).filter((h) => h?.length >= 3)];
  const bin = Math.max(step * 4, margin * 2);
  const bins = new Map();
  const key = (bx, by) => bx * 73856093 + by * 19349663;
  for (const loop of loops) {
    for (let k = 0; k < loop.length; k++) {
      const a = loop[k];
      const b = loop[(k + 1) % loop.length];
      const bx0 = Math.floor((Math.min(a[0], b[0]) - margin) / bin);
      const bx1 = Math.floor((Math.max(a[0], b[0]) + margin) / bin);
      const by0 = Math.floor((Math.min(a[1], b[1]) - margin) / bin);
      const by1 = Math.floor((Math.max(a[1], b[1]) + margin) / bin);
      for (let bx = bx0; bx <= bx1; bx++) {
        for (let by = by0; by <= by1; by++) {
          const kk = key(bx, by);
          let list = bins.get(kk);
          if (!list) bins.set(kk, (list = []));
          list.push(a[0], a[1], b[0], b[1]);
        }
      }
    }
  }
  // Each point of the grid: safe if inside the outline, outside every
  // hole, and `margin` clear of every edge. (Inside or out a row at a
  // time: where each line crosses the row, in order - a point's inside the
  // outline with an odd number of its crossings to its left, in a hole
  // likewise - rather than every edge asked of every point.)
  const safe = new Uint8Array(nx * ny);
  const crossings = (loop, y) => {
    const xs = [];
    for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
      const [xi, yi] = loop[i];
      const [xj, yj] = loop[j];
      if (yi > y !== yj > y) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi);
    }
    return xs.sort((a, b) => a - b);
  };
  const leftOf = (xs, x) => {
    let n = 0;
    while (n < xs.length && xs[n] <= x) n++;
    return n;
  };
  for (let j = 0; j < ny; j++) {
    const y = (j0 + j) * step;
    const rows = loops.map((loop) => crossings(loop, y));
    for (let i = 0; i < nx; i++) {
      const x = (i0 + i) * step;
      if (leftOf(rows[0], x) % 2 === 0) continue;
      let ok = true;
      for (let h = 1; h < rows.length && ok; h++) if (leftOf(rows[h], x) % 2 === 1) ok = false;
      if (!ok) continue;
      const list = bins.get(key(Math.floor(x / bin), Math.floor(y / bin)));
      if (list) for (let k = 0; k < list.length && ok; k += 4) if (nearSegment(x, y, list[k], list[k + 1], list[k + 2], list[k + 3], margin)) ok = false;
      if (ok) safe[j * nx + i] = 1;
    }
  }
  // A square: all four of its corners safe. (No edge can pass through one
  // then: any spot in it is within 0.71 of a step of a corner.)
  const cx = nx - 1;
  const cy = ny - 1;
  const cell = new Uint8Array(cx * cy);
  let count = 0;
  for (let j = 0; j < cy; j++) {
    for (let i = 0; i < cx; i++) {
      if (safe[j * nx + i] && safe[j * nx + i + 1] && safe[(j + 1) * nx + i] && safe[(j + 1) * nx + i + 1]) {
        cell[j * cx + i] = 1;
        count++;
      }
    }
  }
  const has = (i, j) => i >= 0 && j >= 0 && i < cx && j < cy && cell[j * cx + i] === 1;
  // Two squares touching only at a corner: one of them goes, so the line
  // round the squares never crosses itself there.
  for (let changed = true; changed; ) {
    changed = false;
    for (let j = 0; j < cy - 1; j++) {
      for (let i = 0; i < cx - 1; i++) {
        const a = has(i, j);
        const b = has(i + 1, j);
        const c = has(i, j + 1);
        const d = has(i + 1, j + 1);
        if (a && d && !b && !c) {
          cell[(j + 1) * cx + i + 1] = 0;
          count--;
          changed = true;
        } else if (b && c && !a && !d) {
          cell[(j + 1) * cx + i] = 0;
          count--;
          changed = true;
        }
      }
    }
  }
  if (count <= 0) return null;
  // The lines round them: each square's side with no square beyond it, the
  // squares on its left - so round a patch of them anticlockwise, round a
  // gap inside one clockwise - joined end to end.
  const node = (i, j) => j * nx + i;
  const next = new Map();
  const side = (ai, aj, bi, bj) => next.set(node(ai, aj), node(bi, bj));
  const cells = [];
  for (let j = 0; j < cy; j++) {
    for (let i = 0; i < cx; i++) {
      if (!has(i, j)) continue;
      cells.push([i0 + i, j0 + j]);
      if (!has(i, j - 1)) side(i, j, i + 1, j);
      if (!has(i + 1, j)) side(i + 1, j, i + 1, j + 1);
      if (!has(i, j + 1)) side(i + 1, j + 1, i, j + 1);
      if (!has(i - 1, j)) side(i, j + 1, i, j);
    }
  }
  const outer = [];
  const inner = [];
  const done = new Set();
  for (const start of next.keys()) {
    if (done.has(start)) continue;
    const loop = [];
    let at = start;
    while (!done.has(at)) {
      done.add(at);
      loop.push([(i0 + (at % nx)) * step, (j0 + Math.floor(at / nx)) * step]);
      at = next.get(at);
      if (at === undefined) return null;
    }
    if (at !== start) return null;
    (signedArea(loop) > 0 ? outer : inner).push(loop);
  }
  return { step, cells, outer, inner };
}

// A closed line with a point added wherever two of its points are more
// than `most` apart, so none are: [[x, y], ...].
export function closeSpaced(loop, most) {
  const out = [];
  for (let k = 0; k < loop.length; k++) {
    const a = loop[k];
    const b = loop[(k + 1) % loop.length];
    out.push(a);
    const parts = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / most - 1e-9);
    for (let p = 1; p < parts; p++) out.push([a[0] + ((b[0] - a[0]) * p) / parts, a[1] + ((b[1] - a[1]) * p) / parts]);
  }
  return out;
}

// The strip between two closed lines, one inside the other and both running
// anticlockwise, as triangles that each span it: stepping along both lines
// at once, a triangle a step - along the outer (its next point joined to
// the inner's here) or along the inner (its next joined to the outer's
// here). (Triangulated from its edges alone, as any shape is - ear by ear -
// a thin strip comes out as triangles tens of metres long down its length,
// and splitting those made the slivers this is here to be rid of.)
//
// Of all the ways of stepping round, the one whose joins across are
// shortest in all, among those with every triangle the right way up and no
// join over `span` long - found a step at a time over every pair of places
// on the two lines (the least it costs to have got there). Just taking the
// shorter join each time went wrong at a notch in the squares' line - one
// square in from its neighbours, as their line is wherever the outline
// runs nearly along the grid: the outer line had stepped past a side of
// the notch that faces back at it, and no sound triangle was left for it.
//   outer, inner: [[x, y], ...]; span: the longest join across allowed
// Returns the triangles as corners' numbers, three a triangle - 0 to
// outer.length - 1 the outer line's points, then the inner's - every one
// anticlockwise; or null if they can't be joined so (the lines too unlike:
// the caller lays the shape the old way).
export function zipStrip(outer, inner, span = Infinity) {
  const n = outer.length;
  const m = inner.length;
  if (n < 3 || m < 3) return null;
  // (Both anticlockwise, the inner the smaller: else what comes out, each
  // triangle sound by itself, wouldn't be the strip between them.)
  if (!(signedArea(inner) > 0) || !(signedArea(outer) > signedArea(inner))) return null;
  // The inner line taken up from its point nearest the outer's first.
  let j0 = 0;
  let best = Infinity;
  for (let j = 0; j < m; j++) {
    const d = (inner[j][0] - outer[0][0]) ** 2 + (inner[j][1] - outer[0][1]) ** 2;
    if (d < best) {
      best = d;
      j0 = j;
    }
  }
  if (best > span * span) return null;
  const ax = Float64Array.from({ length: n + 1 }, (_, i) => outer[i % n][0]);
  const ay = Float64Array.from({ length: n + 1 }, (_, i) => outer[i % n][1]);
  const bx = Float64Array.from({ length: m + 1 }, (_, j) => inner[(j0 + j) % m][0]);
  const by = Float64Array.from({ length: m + 1 }, (_, j) => inner[(j0 + j) % m][1]);
  const W = m + 1;
  const cost = new Float64Array((n + 1) * W).fill(Infinity);
  // How each place was reached: 1 along the outer line, 2 along the inner.
  const came = new Uint8Array((n + 1) * W);
  const span2 = span * span;
  cost[0] = 0;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      const c = cost[i * W + j];
      if (c === Infinity) continue;
      if (i < n) {
        // (A(i), A(i + 1), B(j)): the right way up, its new join A(i + 1) - B(j).
        const t = (ax[i + 1] - ax[i]) * (by[j] - ay[i]) - (ay[i + 1] - ay[i]) * (bx[j] - ax[i]);
        const d = (ax[i + 1] - bx[j]) ** 2 + (ay[i + 1] - by[j]) ** 2;
        if (t > 1e-9 && d <= span2 && c + Math.sqrt(d) < cost[(i + 1) * W + j]) {
          cost[(i + 1) * W + j] = c + Math.sqrt(d);
          came[(i + 1) * W + j] = 1;
        }
      }
      if (j < m) {
        // (A(i), B(j + 1), B(j)): its new join A(i) - B(j + 1).
        const t = (bx[j + 1] - ax[i]) * (by[j] - ay[i]) - (by[j + 1] - ay[i]) * (bx[j] - ax[i]);
        const d = (ax[i] - bx[j + 1]) ** 2 + (ay[i] - by[j + 1]) ** 2;
        if (t > 1e-9 && d <= span2 && c + Math.sqrt(d) < cost[i * W + j + 1]) {
          cost[i * W + j + 1] = c + Math.sqrt(d);
          came[i * W + j + 1] = 2;
        }
      }
    }
  }
  if (cost[n * W + m] === Infinity) return null;
  // Back from the end, the way each place was reached.
  const out = [];
  for (let i = n, j = m; i > 0 || j > 0; ) {
    if (came[i * W + j] === 1) {
      i--;
      out.push(i % n, (i + 1) % n, n + ((j0 + j) % m));
    } else {
      j--;
      out.push(i % n, n + ((j0 + j + 1) % m), n + ((j0 + j) % m));
    }
  }
  return out;
}

// The shape's area: its outline's, less its holes'.
export function shapeArea(outline, holes) {
  return Math.abs(signedArea(outline)) - (holes ?? []).filter((h) => h?.length >= 3).reduce((a, h) => a + Math.abs(signedArea(h)), 0);
}
