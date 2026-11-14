// The country laid over the far ground (sim/country.mjs says what lies
// where): fields, hedgerows, farm tracks, wood patches and the odd pond out
// past where a ball can finish, the woods floor beyond a designed hole's
// tree lines, the soft shade under every tree's crown, and the far woods'
// painted shadows - all in one picture over the ground, read once a pixel
// by the ground's own shader (look/glsl/ground.js gCountry) on the ground
// materials it's laid on (withCountry). Near play it is clear, but for the
// shade under the trees.

import * as THREE from "three";
import { PALETTE } from "./palette.js";
import { HIGH, EXTRA } from "./quality.js";
import { registerStep } from "./safety.js";
import { COUNTRY_GLSL, COUNTRY_KEY } from "./glsl/ground.js";
import { makeCountry, paintCountry, paintCanopy, holeCharacter, farWoods, COUNTRY } from "../sim/country.mjs";
import { paintPatches } from "../sim/countryparts.mjs";
import { paintShore, COAST } from "../sim/coast.mjs";
import { sunDirection } from "./environment.js";
import { makeFarWoods } from "./farwoods.js";

const lin = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return [f((n >> 16) / 255), f(((n >> 8) & 255) / 255), f((n & 255) / 255)];
};

// The country's colours (palette.js COUNTRY), in linear light.
export function countryColours() {
  return {
    pasture: lin(PALETTE.fieldPasture),
    meadow: lin(PALETTE.fieldMeadow),
    straw: lin(PALETTE.fieldStraw),
    stubble: lin(PALETTE.fieldStubble),
    heath: lin(PALETTE.fieldHeath),
    dunes: lin(PALETTE.fieldDunes),
    fescue: lin(PALETTE.fescue),
    longGreen: lin(PALETTE.longGreen),
    wood: lin(PALETTE.woodPatch),
    conifer: lin(PALETTE.coniferPatch),
    pond: lin(PALETTE.farPond),
    hedge: lin(PALETTE.hedgerow),
    belt: lin(PALETTE.hedgerow),
    track: lin(PALETTE.farmTrack),
    floor: lin(PALETTE.woodsFloor),
    litter: lin(PALETTE.leafLitter),
    beachSand: lin(PALETTE.beachSand),
    beachWet: lin(PALETTE.beachWet),
    wrack: lin(PALETTE.wrack),
    marram: lin(PALETTE.marram),
    // (The ground under a parkland hole's hay: sim/hay.mjs paintHay.)
    hay: lin(PALETTE.hay),
  };
}

// Which way, and how far per metre of a crown's radius, a tree's painted
// shade lies from its trunk: away from the sun, a little - to the nearest
// eighth of the compass, so it's the same for hours at a time: the country
// it's painted into is kept with the hole (look/bake.js) by everything it's
// made from, and with the sun moving through the day the shade followed it
// minute by minute - never the same twice, so the country was never taken
// from what was kept, and was waited for every time.
export function shadeOffset() {
  const s = sunDirection();
  const a = Math.round(Math.atan2(-s.z, -s.x) / (Math.PI / 4)) * (Math.PI / 4);
  return [Math.round(Math.cos(a) * 0.45 * 1e6) / 1e6, Math.round(Math.sin(a) * 0.45 * 1e6) / 1e6];
}

// The colours the course's other holes are painted in (sim/neighbours.mjs
// paintNeighbours), in linear light: the ground's own (palette.js GROUND).
export function courseColours() {
  return {
    fairway: PALETTE.fairway.map(lin),
    // (A links hole's fairway on the dunes: paler and yellower, as it's
    // drawn when it's played - course/holebuild.js linksLook.)
    linksFairway: PALETTE.linksFairway.map(lin),
    green: PALETTE.green.map(lin),
    fringe: lin(PALETTE.fringe),
    tee: lin(PALETTE.tee[0]),
    sand: lin(PALETTE.sand),
    collar: lin(PALETTE.collar),
    water: lin(PALETTE.farPond),
    mud: lin(PALETTE.waterMud),
    fescue: lin(PALETTE.fescue),
    longGreen: lin(PALETTE.longGreen),
  };
}

// The picture for one scene. box: { x0, z0, size } (world metres) it
// covers; past: (x, z) -> metres beyond play (sim/country.mjs playReach);
// seed and character for the country; floor: the woods floor beyond a
// designed hole's tree lines ((x, z) -> 0 - 1) or null; trees: [[x, z, r],
// ...] whose shade is painted under them (the hole's own crowns and the
// far woods); country: the patchwork, if it's been made already (for the
// far woods, which stand in it); paintOver(pixels, { box, n }): what goes
// over the country before the shade (the course's other holes:
// sim/neighbours.mjs); shore: by the sea, the coast ({ at(x, z) }: sim/
// coast.mjs coastHere) - its beach and dunes painted over the rest, before
// the shade. Returns { texture, box, country }.
export function countryMap({ box, past, seed = 1, character = holeCharacter(seed), country = makeCountry({ seed, character }), floor = null, trees = [], n = HIGH ? 1024 : 768, paintOver = null, patches = [], shore = null }) {
  const colours = countryColours();
  // Past a links hole's rough, its long grass rather than a woods floor.
  if (character === "links") colours.floor = colours.fescue;
  if (character === "linksgreen") colours.floor = colours.longGreen;
  const pixels = paintCountry({ box, n, country, past, colours, lines: HIGH, floor });
  const mown = paintOver ? new Uint8Array(n * n) : null;
  paintOver?.(pixels, { box, n, mown });
  paintPatches(pixels, { box, n, patches, colours: patchColours() });
  if (shore) paintShore(pixels, { box, n, at: shore.at, colours, seed });
  paintCanopy(pixels, { box, n, trees, litter: colours.litter, shadow: shadeOffset() });
  const { texture, mown: mownMap } = countryTexture({ pixels, n, box, mown });
  return { texture, box, country, mown: mownMap };
}

// What each kind of dune patch is painted with (sim/countryparts.mjs
// paintPatches), in linear light.
export function patchColours() {
  return { sand: lin(PALETTE.duneSand), heather: lin(PALETTE.duneHeather), green: lin(PALETTE.duneGreen), stone: lin(PALETTE.duneStone) };
}

// The picture from its pixels (sim/countryparts.mjs countryParts, or
// countryMap's own painting): { texture, box }.
export function countryTexture({ pixels, n, box, mown = null }) {
  const texture = new THREE.DataTexture(pixels, n, n, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return { texture, box, mown: mown ? mownTexture(mown, n) : null };
}

// Where the other holes' mown ground, sand and water lie (sim/neighbours.mjs
// paintNeighbours's mown), one channel: the ground's shader draws them plain
// there (look/glsl/ground.js gCountry), the low-detail version of a hole.
function mownTexture(mown, n) {
  const t = new THREE.DataTexture(mown, n, n, THREE.RedFormat, THREE.UnsignedByteType);
  t.colorSpace = THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.unpackAlignment = 1;
  t.needsUpdate = true;
  return t;
}

// The far woods' mesh from their list (countryScene's, or sim/
// countryparts.mjs countryParts's): medium, how many of them are Medium's.
export function countryWoods(list, { groundY = () => 0, medium = list.length } = {}) {
  return withExtraWoods(makeFarWoods(list, { groundY }), medium);
}

// An empty picture, for a ground material before its scene's is made.
let blank = null;
function blankTexture() {
  if (blank) return blank;
  blank = new THREE.DataTexture(new Uint8Array(4), 1, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  blank.needsUpdate = true;
  return blank;
}

// Lays the country picture over a ground material (look/grass.js's or
// look/mappedground.js's): after its own shader, with its program's key
// extended. The material keeps the uniforms, so a new hole's picture is
// set with setCountry rather than a new program.
export function withCountry(material, map = null) {
  if (material.userData.country) {
    setCountry(material, map);
    return material;
  }
  const uniforms = {
    gCountryMap: { value: map?.texture ?? blankTexture() },
    gCountryBox: { value: new THREE.Vector3(map?.box.x0 ?? 0, map?.box.z0 ?? 0, 1 / (map?.box.size ?? 1)) },
    gCourseMap: { value: map?.mown ?? blankTexture() },
  };
  material.userData.country = uniforms;
  const own = material.onBeforeCompile;
  const ownKey = material.customProgramCacheKey;
  material.onBeforeCompile = (shader, renderer) => {
    own.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${COUNTRY_GLSL}`)
      // Before the weather's darkening after rain and the dulling with
      // distance, which go over it as over the grass.
      .replace(/(\w+) = gWetGround\((\w+)\);/, (all, a, b) => `${a} = gCountry(${b}, gWorld);\n${all}`);
  };
  material.customProgramCacheKey = () => `${ownKey.call(material)}|${COUNTRY_KEY}`;
  return material;
}

// A new picture for a material withCountry has laid one on.
export function setCountry(material, map) {
  const u = material.userData.country;
  if (!u) return;
  u.gCountryMap.value = map?.texture ?? blankTexture();
  u.gCountryBox.value.set(map?.box.x0 ?? 0, map?.box.z0 ?? 0, 1 / (map?.box.size ?? 1));
  u.gCourseMap.value = map?.mown ?? blankTexture();
}

// The country for a scene and its far woods together: the woods stand in
// the country's woods and along its hedgerows and belts, and each has a
// soft shadow painted under it in the picture. extra: more far trees
// ({ x, z, h, w, kind, tint }: a mapped course's own woods past the hole).
// groundY: the far ground's height. Returns { map, woods } - woods the
// mesh to add (null if there are none). near: the kinds of the trees near
// play ({ kind: count }: look/trees.js makeTrees's group.userData.kinds),
// which the woods take after (sim/country.mjs farMix). course: the
// course's other holes seen from the air (sim/neighbours.mjs) - { paint
// (the picture's paintOver), trees (far woods of their own, all of them,
// first), avoid (where the made-up woods mayn't stand) } - or null. own:
// the hole's own woods past its trees (sim/deepwoods.mjs), first of all.
// On High, half as many again (COUNTRY.woodsHigh): Medium's woods first,
// then High's extra trees after them, so the safety valve sheds the extras
// by drawing fewer (look/safety.js) and what's left is Medium's woods
// exactly - each with its soft shadow, which only Medium's trees have.
// shore: by the sea, the coast (countryMap) - no far tree on its dunes or
// beach, or out at sea.
export function countryScene({ box, past, seed = 1, character = holeCharacter(seed), floor = null, trees = [], extra = [], groundY = () => 0, near = {}, course = null, own: ownWoods = [], patches = [], shore = null }) {
  const country = makeCountry({ seed, character });
  const count = Math.round(COUNTRY.woodsCount * (HIGH ? 1 : 0.5) * (character === "woodland" ? 1.25 : character === "heath" ? 0.7 : 1));
  const room = { x0: box.x0, x1: box.x0 + box.size, z0: box.z0, z1: box.z0 + box.size };
  const ashore = shore ? (x, z) => shore.at(x, z) >= COAST.beach + COAST.dunes + 30 : () => true;
  const own = [...ownWoods, ...(course?.trees ?? [])].filter((t) => ashore(t.x, t.z));
  const keptExtra = extra.filter((t) => ashore(t.x, t.z));
  const avoid = shore || course?.avoid ? (x, z) => !ashore(x, z) || !!course?.avoid?.(x, z) : null;
  const woodsOf = (n) => [...own, ...keptExtra.slice(0, n), ...farWoods({ country, past, box: room, count: Math.max(0, n - keptExtra.length), seed, near, avoid })];
  const list = woodsOf(count);
  const shades = list.map((t) => [t.x, t.z, t.w * 0.5]);
  const map = countryMap({ box, past, seed, character, country, floor, trees: [...trees, ...shades], paintOver: course?.paint ?? null, patches, shore });
  // (Each list starts with the shorter one: the same trees, drawn in turn.)
  const all = EXTRA ? woodsOf(Math.round(count * COUNTRY.woodsHigh)) : list;
  return { map, woods: countryWoods(all, { groundY, medium: list.length }) };
}

// High's extra far woods: drawn while the safety valve leaves them, hidden
// by drawing only Medium's count once it sheds them - nothing rebuilt.
const extraWoods = new Set();
let woodsShed = false;
function shedExtraWoods(on) {
  woodsShed = on;
  for (const ref of extraWoods) {
    const mesh = ref.deref();
    if (mesh) mesh.count = on ? mesh.userData.mediumCount : mesh.userData.fullCount;
    else extraWoods.delete(ref);
  }
}
registerStep(1, "fewer far woods", shedExtraWoods, { of: "high" });

// The woods mesh (or null), told how many of its trees are Medium's.
function withExtraWoods(mesh, medium) {
  if (!mesh || mesh.count <= medium) return mesh;
  mesh.userData.mediumCount = medium;
  mesh.userData.fullCount = mesh.count;
  if (woodsShed) mesh.count = medium;
  extraWoods.add(new WeakRef(mesh));
  return mesh;
}
