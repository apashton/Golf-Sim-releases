// Signs: the range's distance boards, and round each hole of a course a tee
// sign, yardage posts and plates, an arrow on to the next tee, and tee
// markers. One family - painted timber and a little metal, in the palette's
// dark green, cream and timber (look/palette.js) - so everything built by
// hand on the course looks as if the same greenkeeper made it.
//
// The painted faces are drawn on a canvas when the page runs (no image
// files). A sign facing away from the sun would be in shade and a projector
// washes dark boards out, so their faces glow faintly with their own
// colours, enough to read in shade without looking lit up.
//
// Where the signs go on a hole is worked out in sim/signs.mjs; this only
// makes and places them. They take no part in play.

import * as THREE from "three";
import { mergeStatic } from "./merge.js";
import { PALETTE } from "./palette.js";
import { LAYER, onLayer } from "./grass.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { markReadable } from "./weatherlook.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const P = PALETTE;
const FONT = "system-ui, 'Segoe UI', sans-serif";

// Materials every sign shares, made once for the page. (Each a colour and
// nothing more - plainPaint: round a hole they're all drawn as one, coloured
// by vertex, makeSignage.)
let shared = null;
let plainPaint = null;
let plainSet = null;
function common() {
  const sign = (m) => withSceneryHooks(m, "sign");
  shared ??= {
    timber: sign(new THREE.MeshLambertMaterial({ color: P.timber })),
    cap: sign(new THREE.MeshLambertMaterial({ color: P.timberGrain })),
    board: sign(new THREE.MeshLambertMaterial({ color: P.signBoard })),
    paint: sign(new THREE.MeshLambertMaterial({ color: P.paint })),
    metal: sign(new THREE.MeshLambertMaterial({ color: P.metal })),
    colours: Object.fromEntries(Object.entries(P.teeMarkers).map(([k, c]) => [k, sign(new THREE.MeshLambertMaterial({ color: c }))])),
  };
  plainSet ??= new Set([shared.timber, shared.cap, shared.board, shared.paint, shared.metal, ...Object.values(shared.colours)]);
  plainPaint ??= sign(new THREE.MeshLambertMaterial({ vertexColors: true }));
  return shared;
}

// A canvas texture, sharp at an angle.
function texture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// The painted face of a board: its own colours, glowing faintly so it
// still reads in shade. `own`: made for one hole, so freed with it
// (look/sandwater.js disposeSurface).
function faceMaterial(tex, own = false) {
  const m = withSceneryHooks(new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25 }), "sign");
  if (own)
    m.userData.dispose = () => {
      tex.dispose();
      // (Its program stays on the card for the next hole: every program
      // built does, sim/keepprograms.mjs.)
      m.dispose();
    };
  return m;
}

// A board's paint: the dark green field with a cream border, rounded at
// the corners, on a w x h canvas.
function paintBoard(ctx, w, h, border = Math.round(h * 0.07)) {
  ctx.fillStyle = P.signBoard;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = P.signInk;
  ctx.lineWidth = border * 0.55;
  ctx.beginPath();
  ctx.roundRect(border, border, w - border * 2, h - border * 2, border * 1.4);
  ctx.stroke();
}

// Text as big as fits a width, up to `size` pixels.
function fitFont(ctx, text, size, width, weight = "bold") {
  let s = size;
  ctx.font = `${weight} ${s}px ${FONT}`;
  while (s > 10 && ctx.measureText(text).width > width) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${FONT}`;
  }
  return s;
}

// A board on two timber posts with a timber rail along its top. The face
// (+z) carries `front`; `width` x `height` metres, its bottom `clear`
// metres off the ground.
function boardOnPosts(front, { width, height, clear, thick = 0.07, post = 0.1 }) {
  const c = common();
  const group = new THREE.Group();
  const face = new THREE.Mesh(new THREE.BoxGeometry(width, height, thick), [c.board, c.board, c.board, c.board, front, c.board]);
  face.position.y = clear + height / 2;
  face.castShadow = true;
  face.receiveShadow = true;
  group.add(face);
  // The posts, sunk well into the ground (so neither stands clear of it on
  // a slope), reaching the rail.
  const sunk = 0.4;
  const tall = clear + height + sunk;
  for (const x of [-width * 0.36, width * 0.36]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(post, tall, post), c.timber);
    p.position.set(x, tall / 2 - sunk, -(thick / 2 + post / 2));
    p.castShadow = true;
    p.receiveShadow = true;
    group.add(p);
  }
  // The rail: a little wider and deeper than the board, so it sheds rain.
  const rail = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, 0.05, thick + post + 0.05), c.cap);
  rail.position.set(0, clear + height + 0.025, -post / 2);
  rail.castShadow = true;
  // (Shaded as the board and posts are - and so drawn with them, makeSignage.)
  rail.receiveShadow = true;
  group.add(rail);
  return group;
}

// ---- The range's distance boards ------------------------------------------------------

// A yardage board on two posts, facing the tee (+z): the one look for every
// sign - a dark green painted board, cream lettering and border, timber
// posts and rail. `width` in metres; the board is half as tall.
const rangeFaces = new Map();
export function makeSign(text, { width = 3 } = {}) {
  let front = rangeFaces.get(text);
  if (!front) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    paintBoard(ctx, 256, 128);
    ctx.fillStyle = P.signInk;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    fitFont(ctx, text, 84, 200);
    ctx.fillText(text, 128, 70);
    front = faceMaterial(texture(canvas));
    rangeFaces.set(text, front);
  }
  // Readable: never lost in a thicker haze than a fair day's (look/weatherlook.js).
  return markReadable(boardOnPosts(front, { width, height: width / 2, clear: 0.7, thick: 0.08, post: 0.12 }));
}

// A board's painted face alone, as a plane facing +z, `width` x `height`
// metres (for a board whose posts and frame are drawn with other things,
// look/club.js): the same dark green, cream border and lettering. One per
// text, shared.
const plainFaces = new Map();
export function boardFace(text, width, height) {
  let m = plainFaces.get(text);
  if (!m) {
    const W = 512;
    const H = Math.round((W * height) / width);
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    paintBoard(ctx, W, H);
    ctx.fillStyle = P.signInk;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    fitFont(ctx, text, Math.round(H * 0.5), W - 80);
    ctx.fillText(text, W / 2, H * 0.54);
    m = faceMaterial(texture(canvas));
    plainFaces.set(text, m);
  }
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), m);
  face.receiveShadow = true;
  return markReadable(face);
}

// ---- Round a hole ---------------------------------------------------------------------

// The tee sign: the hole's number big on the left, its par and yards on
// the right - and on the higher graphics setting a little map of the hole
// (`map`: a canvas with it drawn, or null). 1.8 m x 1 m, readable from the
// golfer's camera on the tee.
export function teeSign({ number, par, yards }, map = null) {
  const W = 576;
  const H = 320;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  paintBoard(ctx, W, H, 20);
  ctx.fillStyle = P.signInk;
  ctx.textBaseline = "alphabetic";
  // The number, as big as it goes.
  const num = String(number ?? "");
  const left = 40;
  const numW = 170;
  ctx.textAlign = "center";
  fitFont(ctx, num, 210, numW - 8);
  ctx.fillText(num, left + numW / 2, H / 2 + 72);
  // A thin cream rule between it and the rest.
  ctx.fillRect(left + numW + 4, 62, 5, H - 124);
  // Par, and the yards (the word smaller), stacked, as big as they fit.
  const x0 = left + numW + 22;
  const x1 = map ? W - 24 - 112 : W - 40;
  const mid = (x0 + x1) / 2;
  const room = x1 - x0;
  fitFont(ctx, `Par ${par}`, 88, room);
  ctx.fillText(`Par ${par}`, mid, H * 0.46);
  const big = fitFont(ctx, `${yards}`, 88, room * 0.66);
  const figure = ctx.measureText(`${yards}`).width;
  ctx.font = `bold ${Math.round(big * 0.5)}px ${FONT}`;
  const word = ctx.measureText(" yds").width;
  const start = mid - (figure + word) / 2;
  ctx.textAlign = "left";
  ctx.fillText(" yds", start + figure, H * 0.8);
  ctx.font = `bold ${big}px ${FONT}`;
  ctx.fillText(`${yards}`, start, H * 0.8);
  if (map) {
    // The hole's own map, in a cream frame.
    const mx = W - 24 - 96 - 8;
    const my = (H - 160) / 2;
    ctx.fillRect(mx - 4, my - 4, 104, 168);
    ctx.drawImage(map, mx, my, 96, 160);
  }
  return boardOnPosts(faceMaterial(texture(canvas), true), { width: 1.8, height: 1.0, clear: 0.75 });
}

// A number on a coloured ground, for the yardage posts and plates: one per
// distance and colour, shared by every hole - all of them on two sheets
// (the posts' squares on one, the plates' rounds on the other: SHEET), so
// every post's face round a hole is one draw and every plate another,
// where each number was a draw of its own. Each number has a cell of its
// own on its sheet, painted when it's first asked for; a face is given the
// corners of its cell (numberCell, onCell). (Sixteen cells a sheet: a
// course's posts are three numbers - sim/signs.mjs.)
export const SHEET = { cell: 128, across: 4 };
const sheets = new Map();
function numberSheet(round) {
  let sheet = sheets.get(round);
  if (!sheet) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = SHEET.cell * SHEET.across;
    sheet = { canvas, ctx: canvas.getContext("2d"), texture: texture(canvas), cells: new Map() };
    sheets.set(round, sheet);
  }
  return sheet;
}
// Where cell `index` is on a sheet, as a picture's corners (u, v: v up):
// [u0, v0, u1, v1], a pixel in from the cell's own edge, so the sheet's
// smoothing never reads the next number's.
export function cellCorners(index, { cell = SHEET.cell, across = SHEET.across } = {}) {
  const size = cell * across;
  const col = index % across;
  const row = Math.floor(index / across);
  return [(col * cell + 1) / size, 1 - ((row + 1) * cell - 1) / size, ((col + 1) * cell - 1) / size, 1 - (row * cell + 1) / size];
}
function numberCell(n, colour, round = false) {
  const sheet = numberSheet(round);
  const key = `${n}:${colour}`;
  let index = sheet.cells.get(key);
  if (index === undefined) {
    // (A sheet's full: its last cell painted again - sixteen numbers and
    // colours is far more than a course's posts.)
    index = Math.min(sheet.cells.size, SHEET.across * SHEET.across - 1);
    sheet.cells.set(key, index);
    const { ctx } = sheet;
    const S = SHEET.cell;
    ctx.save();
    ctx.translate((index % SHEET.across) * S, Math.floor(index / SHEET.across) * S);
    ctx.clearRect(0, 0, S, S);
    const ground = P.teeMarkers[colour] ?? P.paint;
    // Dark figures on white, cream on the rest.
    const ink = colour === "white" ? P.signBoard : P.signInk;
    if (round) {
      // A plate: a cream middle in a ring of its colour.
      ctx.fillStyle = ground;
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colour === "white" ? P.signBoard : P.paint;
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, S * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colour === "white" ? P.paint : ground;
    } else {
      ctx.fillStyle = ground;
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = ink;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    fitFont(ctx, String(n), S / 2, round ? S * 0.61 : S * 0.906);
    ctx.fillText(String(n), S / 2, S * 0.53);
    ctx.restore();
    sheet.texture.needsUpdate = true;
  }
  return { texture: sheet.texture, corners: cellCorners(index) };
}
// A shape's picture corners (0 - 1 across the whole picture, as three.js
// makes them) moved onto a cell: those of its corners `from` to `to`
// (all of them if not said).
export function onCell(geo, [u0, v0, u1, v1], from = 0, to = geo.attributes.uv.count) {
  const uv = geo.attributes.uv;
  for (let i = from; i < to; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  uv.needsUpdate = true;
  return geo;
}

// A yardage post: a square timber post painted cream, its top in the
// distance's colour with the number on the side facing the tee (+z), and
// a little pyramid cap.
let postFace = null;
export function yardagePost(n, colour) {
  const c = common();
  const group = new THREE.Group();
  const s = 0.15;
  // Sunk a little into the ground.
  const body = new THREE.Mesh(new THREE.BoxGeometry(s, 0.95, s), c.paint);
  body.position.y = 0.475 - 0.25;
  const topMat = c.colours[colour] ?? c.paint;
  // (Every post's number on the one sheet: one face material for them all.)
  const cell = numberCell(n, colour);
  postFace ??= withSceneryHooks(new THREE.MeshLambertMaterial({ map: cell.texture, emissive: 0xffffff, emissiveMap: cell.texture, emissiveIntensity: 0.2 }), "sign");
  // (A box's sides in turn, four corners each: +x, -x, +y, -y, +z, -z -
  // the face is its +z side's, corners 16 - 19.)
  const top = new THREE.Mesh(onCell(new THREE.BoxGeometry(s, 0.25, s), cell.corners, 16, 20), [topMat, topMat, topMat, topMat, postFace, topMat]);
  top.position.y = 0.7 + 0.125 - 0.1;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(s * 0.72, 0.08, 4), topMat);
  cap.rotation.y = Math.PI / 4;
  cap.position.y = 0.95 + 0.04 - 0.1;
  for (const m of [body, top, cap]) {
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }
  return group;
}

// A plate set in the fairway: a disc in the distance's colour, the number
// in the middle reading from the tee (+z towards the tee). It lies a
// centimetre proud, drawn over the grass (never flickering into it).
const plateGeos = new Map();
let plateMat = null;
export function yardagePlate(n, colour) {
  const key = `${n}:${colour}`;
  const cell = numberCell(n, colour, true);
  // (One shape a number - its picture's corners on its cell of the sheet -
  // and one material for every plate.)
  let geo = plateGeos.get(key);
  if (!geo) {
    geo = onCell(new THREE.CircleGeometry(0.17, 20).rotateX(-Math.PI / 2), cell.corners);
    plateGeos.set(key, geo);
  }
  plateMat ??= withSceneryHooks(onLayer(new THREE.MeshLambertMaterial({ map: cell.texture }), LAYER.lip), "sign");
  const plate = new THREE.Mesh(geo, plateMat);
  plate.position.y = 0.012;
  plate.receiveShadow = true;
  // Its geometry is shared: not freed with the hole.
  plate.userData.keepGeometry = true;
  return plate;
}

// A direction sign where the cart path ends: a cream plate on a six-sided
// metal pole, facing +z, with an arrow pointing `angle` radians from
// straight ahead (0, away from whoever reads it; positive to their right)
// and the words beside it.
export function arrowSign(text, angle) {
  const c = common();
  const W = 384;
  const H = 120;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = P.paint;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = P.signBoard;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, W - 12, H - 12);
  // The arrow, on whichever side it points to (ahead: on the left).
  const toRight = Math.sin(angle) > 0.3;
  const ax = toRight ? W - 70 : 70;
  ctx.save();
  ctx.translate(ax, H / 2);
  ctx.rotate(angle);
  ctx.fillStyle = P.signBoard;
  ctx.beginPath();
  ctx.moveTo(0, -42);
  ctx.lineTo(30, -8);
  ctx.lineTo(11, -8);
  ctx.lineTo(11, 40);
  ctx.lineTo(-11, 40);
  ctx.lineTo(-11, -8);
  ctx.lineTo(-30, -8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = P.signBoard;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  const tx = toRight ? (W - 140) / 2 + 10 : 140 + (W - 140) / 2 - 10;
  fitFont(ctx, text, 60, W - 170);
  ctx.fillText(text, tx, H / 2 + 3);
  const group = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.03), [c.paint, c.paint, c.paint, c.paint, faceMaterial(texture(canvas), true), c.paint]);
  plate.position.set(0, 1.05, 0.045);
  plate.castShadow = true;
  plate.receiveShadow = true;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6), c.metal);
  pole.position.y = 1.3 / 2 - 0.1;
  pole.castShadow = true;
  pole.receiveShadow = true;
  group.add(plate, pole);
  return group;
}

// Tee markers: squat painted blocks, cream with a top in their tee's
// colour - every pair round a hole in one mesh (one draw), coloured by
// vertex. pairs: [{ colour, at: [[x, y, z], ...] }] in the world.
const markerBlock = new THREE.CylinderGeometry(0.075, 0.09, 0.1, 10).translate(0, 0.05, 0);
const markerTop = new THREE.SphereGeometry(0.075, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.1, 0);
let markerMat = null;
function painted(geo, hex, x, y, z) {
  const g = geo.clone().translate(x, y, z);
  g.deleteAttribute("uv");
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3).map((_, i) => [c.r, c.g, c.b][i % 3]), 3));
  return g.index ? g.toNonIndexed() : g;
}
export function teeMarkers(pairs) {
  const parts = [];
  for (const { colour, at } of pairs) {
    for (const [x, y, z] of at) {
      parts.push(painted(markerBlock, P.paint, x, y, z), painted(markerTop, P.teeMarkers[colour] ?? P.paint, x, y, z));
    }
  }
  if (!parts.length) return null;
  markerMat ??= withSceneryHooks(new THREE.MeshLambertMaterial({ vertexColors: true }), "sign");
  const mesh = new THREE.Mesh(mergeGeometries(parts), markerMat);
  mesh.castShadow = true;
  return markReadable(mesh);
}

// An aiming post on a blind shot (sim/aimpost.mjs): a tall round pole
// painted in cream and red bands, a red ball on top - one mesh, coloured by
// vertex like the tee markers, standing at (x, y, z) in the world. Thick
// enough to see from the tee over the rise it stands on.
const AIM_BAND = 0.5;
export function aimPost([x, y, z], h = 3.5) {
  const parts = [];
  const bands = Math.round(h / AIM_BAND);
  for (let i = 0; i < bands; i++) {
    const band = new THREE.CylinderGeometry(0.075, 0.085, AIM_BAND, 10, 1, true).translate(0, AIM_BAND * (i + 0.5) - 0.15, 0);
    parts.push(painted(band, i % 2 ? P.teeMarkers.red : P.paint, x, y, z));
  }
  parts.push(painted(new THREE.SphereGeometry(0.11, 12, 8).translate(0, bands * AIM_BAND - 0.15 + 0.08, 0), P.teeMarkers.red, x, y, z));
  markerMat ??= withSceneryHooks(new THREE.MeshLambertMaterial({ vertexColors: true }), "sign");
  const mesh = new THREE.Mesh(mergeGeometries(parts), markerMat);
  mesh.castShadow = true;
  return markReadable(mesh);
}

// Every sign round a hole (sim/signs.mjs signsFor), placed on the ground:
// groundAt(x, z) is its height (hole frame). info: the card's number, par
// and yards; map: a canvas of the hole for the tee sign, or null.
export function makeSignage(signs, info, groundAt, map = null) {
  const group = new THREE.Group();
  // Hole frame -> world: (x, y, z) -> (z, y, -x); a direction (fx, fz)
  // faced -> a turn about the upright.
  const place = (obj, [x, z], face = null) => {
    obj.position.set(z, groundAt(x, z), -x);
    if (face) obj.rotation.y = Math.atan2(face[1], -face[0]);
    group.add(obj);
    return obj;
  };
  if (signs.tee) place(teeSign({ number: info.number, par: info.par, yards: info.yards }, map), signs.tee.at, signs.tee.face);
  for (const post of signs.posts) place(yardagePost(post.n, post.colour), post.at, post.face);
  for (const plate of signs.plates) {
    const p = place(yardagePlate(plate.n, plate.colour), plate.at, plate.face);
    p.position.y += 0.012;
  }
  if (signs.arrow) {
    const a = signs.arrow;
    // The plate faces whoever comes along the path to it; the arrow turns
    // to the way on, as they see it.
    const fx = -a.along[0];
    const fz = -a.along[1];
    const ahead = Math.atan2(a.dir[1], a.dir[0]) - Math.atan2(a.along[1], a.along[0]);
    place(arrowSign(a.text, Math.atan2(Math.sin(ahead), Math.cos(ahead))), a.at, [fx, fz]);
  }
  // The tee markers in the played tee's colour, and (a course from a map)
  // its other tee boxes' pairs in theirs.
  const onGround = ([x, z]) => [z, groundAt(x, z), -x];
  const markers = teeMarkers([
    { colour: signs.markerColour ?? "yellow", at: signs.markers.map(onGround) },
    ...(signs.otherTees ?? []).map((t) => ({ colour: t.colour, at: t.markers.map(onGround) })),
  ]);
  if (markers) group.add(markers);
  // An aiming post over the rise on each blind shot.
  for (const post of signs.aim ?? []) group.add(aimPost(onGround(post.at)));
  // One draw call per material over them all (look/merge.js) - and every
  // plain colour (the posts' paint, the tee sign's timber and board, the
  // pole's metal) one draw between them, coloured by vertex; each number
  // its own.
  common();
  const merged = mergeStatic(group, { name: "signs", plain: { material: plainPaint, of: (m) => plainSet.has(m) } });
  merged.traverse((o) => {
    if (o.isMesh && o.castShadow) o.userData.shadowNear = true;
  });
  return merged;
}
