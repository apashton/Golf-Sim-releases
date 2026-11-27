// A far tree's leaves by share (sim/leafshare.mjs), the mesh's side: a
// shape's leaf cards put in their order and each corner told where its own
// card's middle is and how far down the list its card comes (orderLeaves,
// the leafPart attribute); the leaf cards' vertex shader shrinking away the
// cards past a tree's share and growing the rest, from the eye and where
// the tree stands (leafShare, a scenery hook: look/glsl/hooks.js); and how
// many of each tree's cards are sent to be drawn at all (watchLeaves: the
// batch's own count for each tree, set after three.js has filled its list).
//
// The switch is Fewer leaves on far trees (sim/effects.mjs leafshare): off,
// every card of every tree is sent and none is shrunk or grown - the trees
// as they always were. Shadows are drawn with every card either way (three
// .js's own depth material knows nothing of the share, so there the count
// is left whole). On WebGPURenderer nothing is counted off (its leaf
// material is the node version, look/glsl/treenode.js, without the
// shader's side of this).

import * as THREE from "three";
import { LEAF_SHARE, leafCards, leafOrder, leafUnits } from "../sim/leafshare.mjs";

// Changing what the shader does must change this (every program using it
// is built again: look/glsl/hooks.js HOOKS_KEY).
export const LEAFSHARE_KEY = "ls1";

const f = (v) => (Number.isInteger(v) ? `${v}.0` : `${v}`);

// leafEye: the eye, in the world; leafShareK: every card within x metres,
// the fewest from y, that fewest's share z - and w, the switch (1 on).
export const leafShareUniforms = {
  leafEye: { value: new THREE.Vector3() },
  leafShareK: { value: new THREE.Vector4(LEAF_SHARE.full, LEAF_SHARE.least, LEAF_SHARE.share, 1) },
};

// leafPart: xyz from the card's middle to this corner, as a share of
// LEAF_SHARE.reach; w how far down its shape's list the card comes (0 - 1).
// (A shape with no cards in order has noughts: nothing moves.)
export const LEAFSHARE_PARS = /* glsl */ `
attribute vec4 leafPart;
uniform vec3 leafEye;
uniform vec4 leafShareK;
`;
// (After the bend, which tells one corner from the next by where it is:
// moved first, a card's flutter would jump as it grew.)
export const LEAFSHARE_VERTEX = /* glsl */ `
#if defined( USE_BATCHING )
if ( leafShareK.w > 0.5 ) {
  vec3 lsFoot = ( modelMatrix * batchingMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ) ).xyz;
  float lsT = clamp( ( distance( lsFoot.xz, leafEye.xz ) - leafShareK.x ) / max( leafShareK.y - leafShareK.x, 1.0 ), 0.0, 1.0 );
  float lsShare = 1.0 - ( 1.0 - leafShareK.z ) * lsT * lsT * ( 3.0 - 2.0 * lsT );
  float lsRank = clamp( ( leafPart.w - lsShare ) / ${f(LEAF_SHARE.fade)}, 0.0, 1.0 );
  float lsKeep = 1.0 - lsRank * lsRank * ( 3.0 - 2.0 * lsRank );
  float lsGrow = inversesqrt( min( 1.0, lsShare + ${f(LEAF_SHARE.fade / 2)} ) );
  transformed += leafPart.xyz * ( ${f(LEAF_SHARE.reach)} * ( lsGrow * lsKeep - 1.0 ) );
}
#endif
`;

// Adds the hook to a leaf-card material's shader (in onBeforeCompile); any
// other kind's is left as it is.
export function leafShare(shader, kind) {
  if (kind !== "cards") return shader;
  Object.assign(shader.uniforms, leafShareUniforms);
  shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>\n${LEAFSHARE_PARS}`).replace("#include <begin_vertex>", `#include <begin_vertex>\n${LEAFSHARE_VERTEX}`);
  return shader;
}

// The switch (sim/effects.mjs leafshare), and the eye each frame.
let on = true;
let stamp = 1;
export function setLeafShare(value) {
  if (on === !!value) return;
  on = !!value;
  leafShareUniforms.leafShareK.value.w = on ? 1 : 0;
  // (Every batch counts again.)
  stamp++;
}
export const leafShareOn = () => on;
export function setLeafEye(camera) {
  if (camera?.position) leafShareUniforms.leafEye.value.copy(camera.position);
}

// A shape's leaf cards in their order (sim/leafshare.mjs leafOrder): its
// triangles listed card by card in it, each corner's leafPart, and where in
// the list each card ends (userData.leafEnds: so many corners' numbers to
// its first card's end, its second's...). The corners themselves stay
// where they are in the shape. Done once; a shape with no triangles' list
// (or done already) is left.
export function orderLeaves(geo) {
  const index = geo?.index;
  const pos = geo?.attributes?.position;
  if (!index || !pos || !index.count || geo.userData.leafEnds) return geo;
  const n = pos.count;
  const ix = index.array;
  const { units, unitOf, triangles } = leafCards(ix, n);
  // Each card's middle: its corners', evenly.
  const sum = new Float64Array(units * 3);
  const many = new Uint32Array(units);
  for (let i = 0; i < n; i++) {
    const u = unitOf[i];
    if (u < 0) continue;
    sum[u * 3] += pos.getX(i);
    sum[u * 3 + 1] += pos.getY(i);
    sum[u * 3 + 2] += pos.getZ(i);
    many[u]++;
  }
  const centres = Array.from({ length: units }, (_, u) => [sum[u * 3] / many[u], sum[u * 3 + 1] / many[u], sum[u * 3 + 2] / many[u]]);
  const order = leafOrder(centres);
  const listed = new ix.constructor(ix.length);
  const ends = new Uint32Array(units + 1);
  const rank = new Float32Array(units);
  let at = 0;
  order.forEach((u, place) => {
    rank[u] = place / units;
    for (const k of triangles[u]) {
      listed[at++] = ix[k];
      listed[at++] = ix[k + 1];
      listed[at++] = ix[k + 2];
    }
    ends[place + 1] = at;
  });
  ix.set(listed);
  index.needsUpdate = true;
  const part = new Int16Array(n * 4);
  const pack = (v) => Math.round(Math.max(-1, Math.min(1, v)) * 32767);
  for (let i = 0; i < n; i++) {
    const u = unitOf[i];
    if (u < 0) continue;
    part[i * 4] = pack((pos.getX(i) - centres[u][0]) / LEAF_SHARE.reach);
    part[i * 4 + 1] = pack((pos.getY(i) - centres[u][1]) / LEAF_SHARE.reach);
    part[i * 4 + 2] = pack((pos.getZ(i) - centres[u][2]) / LEAF_SHARE.reach);
    part[i * 4 + 3] = pack(rank[u]);
  }
  geo.setAttribute("leafPart", new THREE.BufferAttribute(part, 4, true));
  geo.userData.leafEnds = ends;
  return geo;
}

// A shape ready for a batch of leaf cards: with a leafPart for each of its
// corners - noughts, if it has no cards in order (a batch's shapes must all
// carry the same things).
export function leafReady(geo) {
  const n = geo?.attributes?.position?.count ?? 0;
  if (geo && geo.attributes.leafPart?.count !== n) geo.setAttribute("leafPart", new THREE.BufferAttribute(new Int16Array(n * 4), 4, true));
  return geo;
}

// A batch of trees' leaf cards, counted: `trees` those of its instances
// drawn from a shape with its cards in order - [{ id, x, y, z, ends }], id
// the instance's, (x, y, z) where it stands in the batch's frame, ends its
// shape's leafEnds. From then on, each time the batch is drawn, each of those is
// sent only as many of its cards as its distance from the eye asks
// (leafUnits) - worked out again when the eye has moved LEAF_SHARE.step,
// or the switch has changed. Its shadow is drawn whole.
// (three.js fills the batch's list of what to draw - where each instance's
// shape starts and how much of it - in onBeforeRender, and says which
// instance each is in its indirect texture: the counts are put in after.
// It fills it again only when it must - something shown or hidden, or its
// instances culled or sorted for each camera, as the trees' are - so what
// the list was left holding is kept track of, and put back whole for a
// shadow, or with the switch off, if three.js hasn't.)
export function watchLeaves(mesh, trees) {
  if (!trees.length || mesh.userData.leaves) return;
  const n = trees.length;
  const most = trees.reduce((m, t) => Math.max(m, t.id), 0) + 1;
  // By instance: all of its shape's list (0: not one of these), and how much
  // of it is sent now.
  const whole = new Uint32Array(most);
  const sent = new Uint32Array(most);
  // (Each one's place, instance and shape in lists of numbers: counted
  // again as the eye moves, thousands at a time.)
  const place = new Float32Array(n * 3);
  const ids = new Uint32Array(n);
  const ends = trees.map((t) => t.ends);
  trees.forEach((t, i) => {
    place.set([t.x, t.y, t.z], i * 3);
    ids[i] = t.id;
    whole[t.id] = sent[t.id] = t.ends[t.ends.length - 1];
  });
  const leaves = { trees, whole, sent, at: new THREE.Vector3(Infinity, 0, 0), stamp: 0, shadow: false, listed: false, counted: 0 };
  mesh.userData.leaves = leaves;
  const recount = (m, eye) => {
    // (Where each stands in the world: the batch's own frame may be moved.)
    const [m0, m2, m4, m6, m8, m10] = [m[0], m[2], m[4], m[6], m[8], m[10]];
    const ox = m[12] - eye.x;
    const oz = m[14] - eye.z;
    for (let i = 0, j = 0; i < n; i++, j += 3) {
      const x = place[j];
      const y = place[j + 1];
      const z = place[j + 2];
      const dx = m0 * x + m4 * y + m8 * z + ox;
      const dz = m2 * x + m6 * y + m10 * z + oz;
      const e = ends[i];
      sent[ids[i]] = e[leafUnits(Math.sqrt(dx * dx + dz * dz), e.length - 1)];
    }
    leaves.counted++;
  };
  const drawn = mesh.onBeforeRender;
  mesh.onBeforeRender = function (renderer, scene, camera, geometry, material, ...rest) {
    const filled = this._visibilityChanged || this.perObjectFrustumCulled || this.sortObjects;
    drawn.call(this, renderer, scene, camera, geometry, material, ...rest);
    // (Drawn in lines, three.js doubles its counts: left alone.)
    if (renderer?.isWebGPURenderer || material?.wireframe) return;
    if (filled) leaves.listed = false;
    const counts = this._multiDrawCounts;
    const which = this._indirectTexture?.image?.data;
    if (!counts || !which) return;
    const part = on && !leaves.shadow;
    let fresh = false;
    if (part) {
      const eye = leafShareUniforms.leafEye.value;
      if (leaves.stamp !== stamp || eye.distanceToSquared(leaves.at) > LEAF_SHARE.step * LEAF_SHARE.step) {
        leaves.stamp = stamp;
        leaves.at.copy(eye);
        recount(this.matrixWorld.elements, eye);
        fresh = true;
      }
      // (The list as this left it, and nothing counted since: as it is.)
      if (leaves.listed && !fresh) return;
    } else if (!leaves.listed) return;
    const from = part ? sent : whole;
    for (let k = 0, l = this._multiDrawCount; k < l; k++) {
      const id = which[k];
      if (id < most && whole[id]) counts[k] = from[id];
    }
    leaves.listed = part;
  };
  const shadowed = mesh.onBeforeShadow;
  mesh.onBeforeShadow = function (...args) {
    leaves.shadow = true;
    try {
      shadowed.apply(this, args);
    } finally {
      leaves.shadow = false;
    }
  };
}
