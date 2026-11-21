// The outline a soft-edged band is laid along (look/grass.js edgeBand):
// which way is out at each of its points, and its sharp outside corners
// turned on a tiny arc so the band fans round them. Pure: no Three.js.
// Points are [a, b] pairs, either frame (the turn from the hole's frame to
// the world's keeps which way round an outline runs).

// Which way round a closed outline runs: -1 or 1, the side its outside is
// on.
export function outSide(points) {
  const n = points.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [x0, z0] = points[i];
    const [x1, z1] = points[(i + 1) % n];
    area += x0 * z1 - x1 * z0;
  }
  return area > 0 ? -1 : 1;
}

// Which way is out at each point of a closed outline, as a band's columns
// are laid: [ux, uz] each, the average of the two sides' normals.
export function outwardNormals(points, out = outSide(points)) {
  const n = points.length;
  return points.map((_, i) => {
    const [px, pz] = points[(i - 1 + n) % n];
    const [nx, nz] = points[(i + 1) % n];
    const len = Math.hypot(nx - px, nz - pz) || 1;
    return [(-(nz - pz) / len) * out, ((nx - px) / len) * out];
  });
}

// A closed outline with each sharp outside corner (turning more than
// `sharp` radians) turned on a tiny arc, `r` metres round, a point every
// `every` radians: a band along it then fans round the corner, as a mower
// goes round it, where laid out along the corner's one way out it left a
// notch. Returns [points, from]: from[i], the outline's point each came
// from.
export function roundCorners(points, { r = 0.01, every = Math.PI / 12, sharp = Math.PI / 6 } = {}) {
  const n = points.length;
  const out = outSide(points);
  const way = (a, b) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  };
  const normal = ([dx, dz]) => [-dz * out, dx * out];
  const res = [];
  const from = [];
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const a = way(points[(i - 1 + n) % n], p);
    const b = way(p, points[(i + 1) % n]);
    const na = normal(a);
    const nb = normal(b);
    const turn = Math.acos(Math.max(-1, Math.min(1, na[0] * nb[0] + na[1] * nb[1])));
    // (Outside: the way out before it turns away from the way on.)
    if (turn < sharp || na[0] * b[0] + na[1] * b[1] >= 0) {
      res.push(p);
      from.push(i);
      continue;
    }
    const start = Math.atan2(na[1], na[0]);
    const spin = Math.sign(na[0] * nb[1] - na[1] * nb[0]);
    const steps = Math.ceil(turn / every);
    for (let k = 0; k <= steps; k++) {
      const t = start + (spin * turn * k) / steps;
      res.push([p[0] + Math.cos(t) * r, p[1] + Math.sin(t) * r]);
      from.push(i);
    }
  }
  return [res, from];
}
