// A strip laid along a line on the ground - a cart path, and the worn
// grass beside it - drawn in world terms from a line in the hole's frame.
//
// The strip's cross-section is a list of columns, each some way across the
// line (metres, positive to the right going along it) and some height over
// the ground there (`lift`), so one call makes a flat strip, a crowned path
// with kerbs, or a verge. Every point is put on the ground where it is
// (heightAt), so the strip follows humps and hollows across it as well as
// along it.
//
// Two numbers ride along with each point for the shaders: how far across
// the line it is (rAcross, metres) and how far along (rAlong, metres from
// the start) - for a path's tyre marks, a concrete path's joints and the
// ragged edge of a gravel one.

import * as THREE from "three";

// line: [[x, z], ...] in the hole's frame (x down the hole, z to the
// right), a point every metre or so; columns: [{ off, lift, edge? }] from
// left to right; heightAt(wx, wz): the ground's height in world terms.
// `edge` (0 to 1, optional) is kept as the gEdgeIn attribute a grass edge
// material fades by (look/grass.js). `narrow` (optional): for each point,
// how much of the full width the strip has there (1 all of it) - for
// rounding off its ends.
export function ribbon(line, columns, heightAt, narrow = null) {
  const n = line.length;
  const cols = columns.length;
  const pos = new Float32Array(n * cols * 3);
  const across = new Float32Array(n * cols);
  const along = new Float32Array(n * cols);
  const edge = columns.some((c) => c.edge != null) ? new Float32Array(n * cols) : null;
  let run = 0;
  for (let i = 0; i < n; i++) {
    const [x, z] = line[i];
    if (i > 0) run += Math.hypot(x - line[i - 1][0], z - line[i - 1][1]);
    // Which way the line runs here: from the point before to the point
    // after, so a bend is shared evenly between the two sides.
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0];
    let dz = b[1] - a[1];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    const f = narrow ? narrow[i] : 1;
    for (let k = 0; k < cols; k++) {
      const c = columns[k];
      // To the right of the way it runs, in the hole's frame.
      const hx = x - dz * c.off * f;
      const hz = z + dx * c.off * f;
      // Hole frame -> world: (x, z) -> (z, -x).
      const wx = hz;
      const wz = -hx;
      const j = i * cols + k;
      pos[j * 3] = wx;
      pos[j * 3 + 1] = heightAt(wx, wz) + c.lift;
      pos[j * 3 + 2] = wz;
      // (Unnarrowed: a kerb stays a kerb as it curls round an end.)
      across[j] = c.off;
      along[j] = run;
      if (edge) edge[j] = c.edge ?? 1;
    }
  }
  const index = [];
  for (let i = 0; i < n - 1; i++) {
    for (let k = 0; k < cols - 1; k++) {
      const a = i * cols + k;
      const b = (i + 1) * cols + k;
      index.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("rAcross", new THREE.BufferAttribute(across, 1));
  geo.setAttribute("rAlong", new THREE.BufferAttribute(along, 1));
  if (edge) geo.setAttribute("gEdgeIn", new THREE.BufferAttribute(edge, 1));
  geo.setIndex(index);
  geo.computeVertexNormals();
  // Facing up, lit like the ground it lies on: turn every triangle over if
  // they came out facing down.
  const nrm = geo.attributes.normal;
  let up = 0;
  for (let i = 0; i < nrm.count; i++) up += nrm.getY(i);
  if (up < 0) {
    for (let i = 0; i < index.length; i += 3) [index[i + 1], index[i + 2]] = [index[i + 2], index[i + 1]];
    geo.setIndex(index);
    geo.computeVertexNormals();
  }
  return geo;
}
