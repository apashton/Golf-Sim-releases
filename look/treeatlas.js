// A picture of every tree we have, for the far woods (look/farwoods.js):
// each kind and shape of the course's trees (look/trees.js) drawn once,
// from the side, into one texture as the page loads - so a far wood is the
// same oaks, birches, Scots pines and willows as the trees near play,
// rather than half a dozen pictures painted by hand.
//
// Drawn as they look near: trunk in its bark, the solid crown under its
// leaf cards, the cards in their texture, a willow's strands, a shrub's
// blossom (treePictureParts). Each picture keeps the tree's own colour,
// shaded a little lighter on top and darker underneath; the far woods
// light it again as the scene's sun and sky light everything else, so it
// isn't lit from any one side. Transparent where there's no tree, with the
// gaps filled with a green (not black) so a shrunk picture's edges don't
// darken.
//
// On Medium and up a second picture of each tree keeps which way every
// pixel faces (its normals: x across the picture, y up, z out of it) -
// the trunk's own, and a crown's as a rounded mass about its middle, not
// each leaf card's - so the far woods can light each tree by the sun from
// the side it's on as the camera stands, rather than every tree alike
// (docs/GRAPHICS-NEXT.md section 1, "each tree lit from the right side":
// the far tree line read as one flat band).
//
// All of it in one go - every picture in its own cell, one camera over the
// whole atlas, a single drawing - once, the first time it's asked for
// (app.js asks as the page loads, just before the shaders are built: it's
// under two hundred small draws and one simple program). Where it's laid
// out: sim/faratlas.mjs.

import * as THREE from "three";
import { HIGH, PHONE } from "./quality.js";
import { treePictureParts, treeBatching, LEAF_CUT, farPicturesDrawn, shapesBack } from "./trees.js";
import { atlasGrid, fitInCell, CELL, PAD } from "../sim/faratlas.mjs";
import { renderTarget, nodeKit } from "./gpu.js";

// The cells and each tree's box (model units), worked out once from the
// trees' own geometry: [kind][shape] -> { box, fit }.
let atlas = null;
export function treeAtlas() {
  if (atlas) return atlas;
  const parts = treePictureParts();
  const grid = atlasGrid(parts.map((k) => k.length));
  // (The phone's as Standard's: a far tree on its picture is a few dozen
  // pixels tall - quality.js PHONE.)
  const fine = HIGH && !PHONE;
  const cell = fine ? CELL.high : CELL.standard;
  const pad = fine ? PAD.high : PAD.standard;
  const size = [cell[0] * grid.cols, cell[1] * grid.rows];
  const p = new THREE.Vector3();
  const cells = parts.map((shapes, k) =>
    shapes.map((list, s) => {
      // How far the tree reaches either side of its trunk, seen from the
      // side (+z), and how tall it stands.
      const box = { x0: 0, x1: 0, h: 0 };
      for (const { geometry, matrix } of list) {
        const pos = geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          p.fromBufferAttribute(pos, i).applyMatrix4(matrix);
          if (p.x < box.x0) box.x0 = p.x;
          if (p.x > box.x1) box.x1 = p.x;
          if (p.y > box.h) box.h = p.y;
        }
      }
      return { box, fit: fitInCell(box, grid.cells[k][s], cell, pad, size), parts: list, centre: crownCentre(list) };
    }),
  );
  // (No depth buffer of their own: drawnInto.)
  const target = renderTarget(size[0], size[1], {
    colorSpace: THREE.SRGBColorSpace,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: true,
    depthBuffer: false,
  });
  target.texture.anisotropy = 4;
  // The normals (Medium and up): the same cells, not a colour.
  const normals = HIGH ? renderTarget(size[0], size[1], { minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: true, depthBuffer: false }) : null;
  atlas = { target, texture: target.texture, normals, cells, size, baked: false, ms: 0 };
  return atlas;
}

// The middle of a tree's crown (model units): the middle of its leaf cards'
// box, or its solid crown's - what its picture's normals point out from.
// A snag (a trunk and bare branches) has none: its own faces.
function crownCentre(parts) {
  const box = new THREE.Box3();
  const part = new THREE.Box3();
  for (const { role, geometry, matrix } of parts) {
    if (role !== "cards" && role !== "crown") continue;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    box.union(part.copy(geometry.boundingBox).applyMatrix4(matrix));
  }
  if (box.isEmpty()) return null;
  const c = box.getCenter(new THREE.Vector3());
  return [c.x, c.y, c.z];
}

// The one program the pictures are drawn with: the part's colour, its
// vertex shading, its texture where it has one (cut out where the leaves
// are), lighter where it faces up and towards the viewer. Not lit by the
// scene: the far woods do that.
const WHITE = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
WHITE.needsUpdate = true;
function pictureMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    vertexColors: true,
    uniforms: { tint: { value: new THREE.Color() }, map: { value: WHITE }, cut: { value: -1 } },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vShade;
      void main() {
        vUv = uv;
        vec3 n = normalize(mat3(modelMatrix) * normal);
        vShade = color * (0.8 + 0.32 * max(dot(n, normalize(vec3(0.0, 0.8, 0.6))), 0.0));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 tint;
      uniform sampler2D map;
      uniform float cut;
      varying vec2 vUv;
      varying vec3 vShade;
      void main() {
        vec4 t = texture2D(map, vUv);
        if (t.a < cut) discard;
        gl_FragColor = vec4(tint * vShade * t.rgb, 1.0);
      }`,
  });
}

// The program the normals are drawn with: each pixel's facing in the
// picture's frame (x across, y up, z out towards the viewer - the camera
// looks along -z), as a colour (0.5 is 0). A part's own facing, turned to
// the viewer's side (every part is seen from both sides), mixed by
// `radial` with the direction out from the crown's middle: all of it for
// leaf cards, which face every which way and would sparkle; some for the
// solid crown, whose lumps are their own shape; none for the trunk.
function normalMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { map: { value: WHITE }, cut: { value: -1 }, centre: { value: new THREE.Vector3() }, radial: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      void main() {
        vUv = uv;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D map;
      uniform float cut;
      uniform vec3 centre;
      uniform float radial;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      void main() {
        if (texture2D(map, vUv).a < cut) discard;
        vec3 own = normalize(vNormalW);
        if (own.z < 0.0) own = -own;
        vec3 out_ = normalize(vWorld - centre + vec3(0.0, 0.0, 0.0001));
        vec3 n = normalize(mix(own, out_, radial));
        gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);
      }`,
  });
}
// How much of each part's normals point out from the crown's middle.
const RADIAL = { trunk: 0, crown: 0.5, cards: 1, strands: 1, blossom: 1 };

// Draws every picture into the atlas, once. Returns how long it took
// (milliseconds, as the processor saw it - which includes waiting for the
// graphics card to finish whatever the page had already given it). Safe to
// call again: it's drawn only the first time.
export function bakeTreeAtlas(renderer) {
  const a = treeAtlas();
  if (a.baked || !renderer) return a.ms;
  const start = performance.now();
  // (The trees' shapes, let go of once these were drawn, read back to draw
  // them again: redrawTreeAtlas.)
  shapesBack();
  const scene = new THREE.Scene();
  // One material for every part, its colour and texture set as each is
  // drawn - and one for its normals (drawn over everything in its turn).
  const material = pictureMaterial();
  const u = material.uniforms;
  const facing = a.normals ? normalMaterial() : null;
  const f = facing?.uniforms;
  // On WebGPURenderer, which has no ShaderMaterial: node versions of the
  // two, one for each texture, each part's own values on it
  // (look/glsl/farwoodsnode.js).
  const kit = nodeKit();
  const meshes = [];
  for (const shapes of a.cells) {
    for (const { fit, parts, centre } of shapes) {
      const tree = new THREE.Group();
      tree.position.set(fit.px, fit.py, 0);
      tree.scale.setScalar(fit.scale);
      // The crown's middle, where the picture is drawn.
      const mid = centre ? new THREE.Vector3(fit.px + centre[0] * fit.scale, fit.py + centre[1] * fit.scale, centre[2] * fit.scale) : null;
      for (const { role, geometry, matrix, color, map } of parts) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.matrixAutoUpdate = false;
        mesh.matrix.copy(matrix);
        mesh.frustumCulled = false;
        if (kit) {
          mesh.material = kit.atlasPicture(map ?? WHITE);
          mesh.userData.atlas = { tint: color, cut: map ? LEAF_CUT : -1, radial: mid ? (RADIAL[role] ?? 0) : 0, centre: mid ?? new THREE.Vector3(), facing: facing ? kit.atlasFacing(map ?? WHITE) : null };
          meshes.push(mesh);
          tree.add(mesh);
          continue;
        }
        mesh.onBeforeRender = (_r, _s, _c, _g, drawn) => {
          if (drawn === facing) {
            f.map.value = map ?? WHITE;
            f.cut.value = map ? LEAF_CUT : -1;
            f.radial.value = mid ? (RADIAL[role] ?? 0) : 0;
            if (mid) f.centre.value.copy(mid);
            facing.uniformsNeedUpdate = true;
            return;
          }
          u.tint.value.copy(color);
          u.map.value = map ?? WHITE;
          u.cut.value = map ? LEAF_CUT : -1;
          material.uniformsNeedUpdate = true;
        };
        tree.add(mesh);
      }
      scene.add(tree);
    }
  }
  const [W, H] = a.size;
  const camera = new THREE.OrthographicCamera(0, W, H, 0, 0.1, 4000);
  camera.position.set(0, 0, 2000);
  const before = { target: renderer.getRenderTarget(), alpha: renderer.getClearAlpha(), color: renderer.getClearColor(new THREE.Color()), autoClear: renderer.autoClear };
  // The gaps: a leafy green, transparent.
  renderer.setClearColor(0x4d6b3a, 0);
  renderer.autoClear = true;
  drawnInto(renderer, a.target, scene, camera);
  if (facing) {
    // The normals: the gaps face the viewer.
    if (kit) for (const m of meshes) m.material = m.userData.atlas.facing;
    else scene.overrideMaterial = facing;
    renderer.setClearColor(0x8080ff, 0);
    drawnInto(renderer, a.normals, scene, camera);
    scene.overrideMaterial = null;
    facing.dispose();
  }
  renderer.setRenderTarget(before.target);
  renderer.setClearColor(before.color, before.alpha);
  renderer.autoClear = before.autoClear;
  material.dispose();
  // The trees' own shapes, sent to the graphics card for this alone, let go
  // of there (kept here: a batch of trees copies them, and they're sent
  // again if they're ever drawn). Drawn the old way, they're in use.
  if (treeBatching()) for (const shapes of a.cells) for (const { parts } of shapes) for (const { geometry } of parts) geometry.dispose();
  a.baked = true;
  a.ms = performance.now() - start;
  farPicturesDrawn();
  return a.ms;
}

// After the graphics card reset the picture (app.js): what was drawn into
// the far woods' pictures is gone with it, so they're drawn again - before,
// the far tree line stayed empty for the rest of the game.
export function redrawTreeAtlas(renderer) {
  if (!atlas?.baked) return;
  atlas.baked = false;
  bakeTreeAtlas(renderer);
}

// A picture of the atlas drawn with a depth buffer only while it's drawn,
// then copied into the atlas's own, which has none (its mipmaps made as it
// is): the depth's needed only for the drawing - each of the two was a
// further 10 MB of graphics memory on High and up, kept for nothing.
function drawnInto(renderer, into, scene, camera) {
  const drawing = renderTarget(into.width, into.height, { colorSpace: into.texture.colorSpace, depthBuffer: true });
  renderer.setRenderTarget(drawing);
  renderer.render(scene, camera);
  renderer.initRenderTarget(into);
  renderer.copyTextureToTexture(drawing.texture, into.texture);
  drawing.dispose();
}
