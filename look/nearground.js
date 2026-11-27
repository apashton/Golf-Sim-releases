// A hole's ground drawn finely only near something - a brook's banks
// along it - as look/mappedground.js terrainMesh draws a patch of it: a
// grid `spacing` apart over `box`, laid on heightAt(x, z) + lift (hole
// frame in, world out: (x, z) -> (z, -x)), its triangles wound to face up.
// But only the squares whose middles near(x, z) says are near, and only
// their corners' heights asked: a links burn running corner to corner of
// its hole had a patch over the whole box round it - a hundred thousand
// points at half a metre, nearly all of them nowhere near it, each its
// height asked - and most of it cut away after.

import * as THREE from "three";

export function terrainMeshNear(box, spacing, near, heightAt, material, lift = 0) {
  const nx = Math.max(2, Math.ceil((box.x1 - box.x0) / spacing) + 1);
  const nz = Math.max(2, Math.ceil((box.z1 - box.z0) / spacing) + 1);
  const at = new Int32Array(nx * nz).fill(-1);
  const pos = [];
  const index = [];
  const corner = (ix, iz) => {
    const k = iz * nx + ix;
    if (at[k] < 0) {
      at[k] = pos.length / 3;
      const x = Math.min(box.x1, box.x0 + ix * spacing);
      const z = Math.min(box.z1, box.z0 + iz * spacing);
      pos.push(z, heightAt(x, z) + lift, -x);
    }
    return at[k];
  };
  for (let iz = 0; iz < nz - 1; iz++) {
    for (let ix = 0; ix < nx - 1; ix++) {
      if (!near(box.x0 + (ix + 0.5) * spacing, box.z0 + (iz + 0.5) * spacing)) continue;
      const a = corner(ix, iz);
      const b = corner(ix + 1, iz);
      const c = corner(ix, iz + 1);
      const d = corner(ix + 1, iz + 1);
      index.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  // Facing up, whichever way the frame turned the triangles.
  const nrm = geo.attributes.normal;
  let up = 0;
  for (let i = 0; i < nrm.count; i += 97) up += nrm.getY(i);
  if (up < 0) {
    for (let i = 0; i < index.length; i += 3) [index[i + 1], index[i + 2]] = [index[i + 2], index[i + 1]];
    geo.setIndex(index);
    geo.computeVertexNormals();
  }
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}
