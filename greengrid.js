// The green-reading grid: lines draped over the surface, and markers that run
// along those lines, never off them. The grid is squared to the putt: on the
// lines running towards the hole the markers show uphill and downhill, on the
// lines across it they show which way it falls left to right. Each marker's
// speed and colour come from the slope along its own line and the green speed,
// so you read the break and the pace one line at a time.
//
// It's drawn to be read on a projector from 60 ft away (the sums are in
// sim/greenread.mjs):
//   - Each line is a thin ribbon turned to face the camera and widened in
//     the vertex shader to the same few pixels however far off it is (as the
//     tracer is), standing up off the green rather than sinking into it, so
//     nothing is lost behind the ground. Where the grid packs together in
//     the distance, the 2 ft lines fade out, then every other 4 ft line,
//     leaving every 8 ft - so the far end reads as a grid, not a haze.
//   - The markers are outlined arrows that grow with distance, and are drawn
//     longer towards the camera where the view is low - as words on a road
//     are painted long for a driver - so they keep their shape rather than
//     squashing to a sliver. They thin out with the lines.
//   - With `marks`, a tick across the line from the ball to the hole every
//     5 ft (every 10 ft beyond 30) and a label beside each, facing the
//     camera: big far off, small and faint near the ball.
// The lines are one draw, the markers one, the labels one.

import * as THREE from "three";
import { GRID, SLOPE_STOPS, LABEL, MARKER, MARK_FEET, lineLevel, pieceLevel, lodWeight, visibleStep, markerLook, spanPx, shadeColor, markRank, channelWeight, CHANNEL, pickMarkers, smoothGradient, slopeAlong, SLOPE_SAMPLES, markerFade } from "./sim/greenread.mjs";
import { FOOT } from "./sim/putting.mjs";
import { shared } from "./look/dispose.js";

// Slope (percent) to colour: flat blue, through green and yellow, to red.
const STOPS = SLOPE_STOPS.map(([p, hex]) => [p, new THREE.Color(hex)]);
export function slopeColor(percent, out = new THREE.Color()) {
  if (percent <= STOPS[0][0]) return out.copy(STOPS[0][1]);
  for (let i = 1; i < STOPS.length; i++) {
    if (percent <= STOPS[i][0]) {
      const [p0, c0] = STOPS[i - 1];
      const [p1, c1] = STOPS[i];
      return out.copy(c0).lerp(c1, (percent - p0) / (p1 - p0));
    }
  }
  return out.copy(STOPS[STOPS.length - 1][1]);
}
export const SLOPE_LEGEND = [
  ["< 1%", "#8fd3ff"],
  ["1-2%", "#5ee38a"],
  ["2-3%", "#f5d547"],
  ["3-4%", "#ff9a3c"],
  ["4%+", "#ff4d4d"],
];

// A marker without the colouring (GreenGrid colours off): white, as the lines.
const PLAIN_MARKER = new THREE.Color(0xffffff);

// Metres a marker travels per second per 1% of slope on a stimp-10 green.
const PACE = 0.13;
// Below this slope along a line (percent) a marker sits still: flat.
const FLAT = 0.25;
// The most a marker grows as it runs along (sin(pi t) * 0.8 + 0.3).
const GROW_MAX = 1.1;
// A marker seen from no camera in particular: all there, its own size.
const PLAIN_VIEW = { alpha: 1, scale: 1, stretch: 1, vx: 0, vz: 1, lift: 0.008 };
// How far (metres, summed over x, y and z) the camera moves before the
// markers' view of it is worked out again.
const SEE_AGAIN = 0.04;

// ---- Lines a few pixels wide -----------------------------------------------------

// A ribbon's level (aLevel): 0 - 2 a grid line's (sim/greenread.mjs
// lineLevel: 0 stays, 2 fades first), TICK a distance mark's tick, PLAIN a
// line that's always all there (the section views' line).
export const TICK = 3;
export const PLAIN = -1;

const RIBBON_VERT = /* glsl */ `
attribute vec3 aTangent;
attribute float aSide;
attribute float aLevel;
attribute float aDim;
uniform float uSpacing;
uniform vec4 uWidths;
uniform vec2 uLod;
uniform vec4 uFade;
uniform vec4 uTick;
varying float vAlpha;

uniform vec3 uPacked;

float lodWeight(float level, float px) {
  if (level < 0.5) return mix(uPacked.z, 1.0, smoothstep(uPacked.x, uPacked.y, 4.0 * px));
  return smoothstep(uLod.x, uLod.y, level < 1.5 ? 2.0 * px : px);
}

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vec3 toCam = cameraPosition - world.xyz;
  float dist = max(length(toCam), 1e-3);
  vec3 ray = toCam / dist;
  // Radians per pixel of a 1080-line picture.
  float rad = 2.0 / (projectionMatrix[1][1] * 1080.0);
  vec3 t = normalize(mat3(modelMatrix) * aTangent);
  // How far apart this line and the next 2 ft one look, in pixels.
  vec3 w = normalize(vec3(-t.z, 0.0, t.x) + vec3(1e-6)) * uSpacing;
  float px = length(w - dot(w, ray) * ray) / (dist * rad);
  float widthPx;
  float alpha;
  if (aLevel > 2.5) {
    widthPx = uWidths.z;
    alpha = mix(uTick.x, uTick.y, smoothstep(uTick.z, uTick.w, dist));
  } else if (aLevel < -0.5) {
    widthPx = uWidths.w;
    alpha = 1.0;
  } else {
    widthPx = aLevel < 0.5 ? uWidths.y : uWidths.x;
    alpha = lodWeight(aLevel, px) * mix(uFade.x, uFade.y, smoothstep(uFade.z, uFade.w, dist));
  }
  // Across the line and square to the camera: the ribbon faces it. Lifted
  // by however much it stands up, so its lower edge is on the line and
  // none of it is under the ground.
  vec3 n = cross(t, ray);
  float nl = length(n);
  n = nl > 1e-5 ? n / nl : vec3(0.0, 1.0, 0.0);
  // Faint outside the putt's channel (sim/greenread.mjs channelWeight).
  alpha *= aDim;
  // Faded right out: no width at all, so nothing is drawn for it.
  float wide = alpha < 0.004 ? 0.0 : widthPx * rad * dist;
  world.xyz += n * ((aSide - 0.5) * wide) + vec3(0.0, 0.5 * wide * abs(n.y), 0.0);
  vAlpha = alpha;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;
const RIBBON_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vAlpha;
void main() {
  if (vAlpha < 0.004) discard;
  gl_FragColor = vec4(uColor, uOpacity * vAlpha);
  #include <colorspace_fragment>
}
`;

// One material per colour and spacing, made once and kept (look/dispose.js
// shared): every green uses the same.
const ribbonMaterials = new Map();
export function ribbonMaterial(color = 0xffffff, { spacing = GRID.spacing, opacity = 1, widthPx = 2.4 } = {}) {
  const key = `${color}|${spacing}|${opacity}|${widthPx}`;
  if (!ribbonMaterials.has(key)) {
    ribbonMaterials.set(
      key,
      shared(
        new THREE.ShaderMaterial({
          vertexShader: RIBBON_VERT,
          fragmentShader: RIBBON_FRAG,
          uniforms: {
            uColor: { value: new THREE.Color(color) },
            uOpacity: { value: opacity },
            uSpacing: { value: spacing },
            uWidths: { value: new THREE.Vector4(GRID.widthPx, GRID.majorPx, GRID.tickPx, widthPx) },
            uLod: { value: new THREE.Vector2(GRID.lodFrom, GRID.lodTo) },
            uPacked: { value: new THREE.Vector3(GRID.packedFrom, GRID.packedTo, GRID.packedAlpha) },
            uFade: { value: new THREE.Vector4(GRID.lineAlpha, GRID.farAlpha, 4, 16) },
            uTick: { value: new THREE.Vector4(LABEL.nearAlpha, LABEL.farAlpha, LABEL.near, LABEL.far) },
          },
          transparent: true,
          depthWrite: false,
          // Seen from either side; drawn in one go (a see-through two-sided
          // material is otherwise drawn twice, back then front).
          side: THREE.DoubleSide,
          forceSinglePass: true,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -2,
        }),
      ),
    );
  }
  return ribbonMaterials.get(key);
}

// Ribbons built from lines of points (world [x, y, z]): two vertices at each
// point, one either side, with the way the line runs there and its level.
export class Ribbons {
  constructor() {
    this.pos = [];
    this.tan = [];
    this.side = [];
    this.level = [];
    this.dim = [];
    this.index = [];
    this.count = 0;
  }
  // dims: how much of each point shows (1 all of it; see channelWeight).
  add(points, level, dims = null) {
    if (points.length < 2) return;
    const base = this.count;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const a = points[Math.max(0, i - 1)];
      const b = points[Math.min(n - 1, i + 1)];
      const tx = b[0] - a[0];
      const ty = b[1] - a[1];
      const tz = b[2] - a[2];
      const len = Math.hypot(tx, ty, tz) || 1;
      for (const s of [0, 1]) {
        this.pos.push(points[i][0], points[i][1], points[i][2]);
        this.tan.push(tx / len, ty / len, tz / len);
        this.side.push(s);
        this.level.push(level);
        this.dim.push(dims ? dims[i] : 1);
      }
      if (i > 0) {
        const k = base + (i - 1) * 2;
        this.index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    this.count += n * 2;
  }
  geometry() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    geo.setAttribute("aTangent", new THREE.Float32BufferAttribute(this.tan, 3));
    geo.setAttribute("aSide", new THREE.Float32BufferAttribute(this.side, 1));
    geo.setAttribute("aLevel", new THREE.Float32BufferAttribute(this.level, 1));
    geo.setAttribute("aDim", new THREE.Float32BufferAttribute(this.dim, 1));
    geo.setIndex(this.index);
    return geo;
  }
  mesh(material) {
    const mesh = new THREE.Mesh(this.geometry(), material);
    // Widened in the shader, so its bounds as built are too small.
    mesh.frustumCulled = false;
    return mesh;
  }
}

// ---- The markers ---------------------------------------------------------------------

// How big a dot is against the arrows the markers used to be.
export const DOT_SHARE = 0.65;

// A round dot lying flat, DOT_SHARE of MARKER.width across, with a dark outline round
// it: the outline's triangles first, so the colour is drawn over them. It
// shows which way the slope runs by rolling that way along its line (and
// how steep by its colour and pace), not by pointing.
function dotGeometry() {
  const n = 20;
  // Two thirds the width the arrows had: big enough to pick out on a
  // projector from the mat (the owner: "bigger and brighter").
  const r = MARKER.width * DOT_SHARE / 2;
  const pos = [];
  const col = [];
  const index = [];
  const add = (radius, shade) => {
    const base = pos.length / 3;
    pos.push(0, 0, 0);
    col.push(shade, shade, shade);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pos.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      col.push(shade, shade, shade);
      index.push(base, base + 1 + i, base + 1 + ((i + 1) % n));
    }
  };
  add(r + 0.01, 0.08);
  add(r, 1.4);
  add(r * 0.6, 2.5);
  add(r * 0.25, 5.0);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(index);
  return geo;
}

let markerMat = null;
function markerMaterial() {
  if (markerMat) return markerMat;
  // Not tone mapped, so the colours stay bright against the grass; each
  // marker fades out (aFade) as the lines round it thin out.
  markerMat = shared(
    new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: true, opacity: 1, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, forceSinglePass: true }),
  );
  markerMat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aFade;\nvarying float vFade;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvFade = aFade;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vFade;")
      .replace("#include <opaque_fragment>", "diffuseColor.a *= vFade;\nif (diffuseColor.a < 0.004) discard;\n#include <opaque_fragment>");
  };
  markerMat.customProgramCacheKey = () => "green-markers-v2";
  return markerMat;
}

// ---- Distance labels -----------------------------------------------------------------

// Every mark's label ("20 ft", light on a dark plate), drawn once into one
// picture; each label is a square of it.
const ATLAS = { cols: 4, w: 192, h: 64 };
let atlas = null;
function labelAtlas() {
  if (atlas) return atlas;
  const rows = Math.ceil(MARK_FEET.length / ATLAS.cols);
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS.cols * ATLAS.w;
  canvas.height = rows * ATLAS.h;
  const ctx = canvas.getContext("2d");
  ctx.font = "bold 42px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cells = new Map();
  MARK_FEET.forEach((ft, i) => {
    const x = (i % ATLAS.cols) * ATLAS.w;
    const y = Math.floor(i / ATLAS.cols) * ATLAS.h;
    const text = `${ft} ft`;
    const w = Math.min(ATLAS.w - 8, ctx.measureText(text).width + 24);
    const h = ATLAS.h - 6;
    ctx.fillStyle = "rgba(10, 20, 12, 0.66)";
    ctx.beginPath();
    ctx.roundRect(x + (ATLAS.w - w) / 2, y + 3, w, h, 12);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, x + ATLAS.w / 2, y + ATLAS.h / 2 + 1);
    // In texture terms, v from the bottom.
    cells.set(ft, [x / canvas.width, 1 - (y + ATLAS.h) / canvas.height, (x + ATLAS.w) / canvas.width, 1 - y / canvas.height]);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  atlas = { tex, cells };
  return atlas;
}

// sim/greenread.mjs labelFit: sized for its distance, the in-between ones
// making way where the marks crowd together. Beside the line on screen, off
// the end of its tick, on the same side for every mark - left where the line
// runs up the picture, above where it runs across it (side-on).
const LABEL_VERT = /* glsl */ `
attribute vec3 aMark;
attribute vec3 aAcross;
attribute vec3 aAlong;
attribute float aRank;
attribute vec4 aCell;
uniform vec4 uLook;
uniform vec2 uAlpha;
uniform vec2 uFit;
uniform float uAspect;
uniform float uTickHalf;
varying vec2 vUv;
varying float vAlpha;

vec2 onScreen(vec3 p) {
  vec4 v = modelViewMatrix * vec4(p, 1.0);
  return v.xy / max(-v.z, 0.05);
}

void main() {
  vec4 mark = modelViewMatrix * vec4(aMark, 1.0);
  vUv = vec2(0.0);
  vAlpha = 0.0;
  if (-mark.z < 0.1) {
    // Behind the camera: nothing.
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  float depth = -mark.z;
  float rad = 2.0 / (projectionMatrix[1][1] * 1080.0);
  vec2 sm = mark.xy / depth;
  // 5 ft of the line either way from here, on screen: the nearer is the
  // room the marks have.
  vec2 sa = onScreen(aMark + aAlong * 1.524);
  vec2 sb = onScreen(aMark - aAlong * 1.524);
  float px5 = min(length(sa - sm), length(sb - sm)) / rad;
  // Which way the line runs on screen, and the side of it the labels go.
  vec2 d = sa - sb;
  float dl = length(d);
  d = dl > 1e-6 ? d / dl : vec2(0.0, 1.0);
  vec2 side = vec2(-d.y, d.x);
  if (dot(side, vec2(-1.0, 1.0)) < 0.0) side = -side;
  // How far a label reaches along the line, in label heights.
  float reach = max(1.0, abs(d.x) * uAspect + abs(d.y));
  float room = px5 / reach;
  float s5 = smoothstep(1.0, 1.3, room / uFit.x);
  float s10 = smoothstep(1.0, 1.3, 2.0 * room / uFit.x);
  float s20 = smoothstep(1.0, 1.3, 4.0 * room / uFit.x);
  float k = smoothstep(uLook.z, uLook.w, depth);
  float hPx = min(mix(uLook.x, uLook.y, k), max(uFit.x, uFit.y * room));
  float shows = aRank < 0.5 ? 1.0 : aRank < 1.5 ? s20 : aRank < 2.5 ? s10 : s5;
  vAlpha = mix(uAlpha.x, uAlpha.y, k) * shows;
  // Clear of the tick's end on that side, and a little gap.
  float tick = max(abs(dot(onScreen(aMark + aAcross * uTickHalf) - sm, side)), abs(dot(onScreen(aMark - aAcross * uTickHalf) - sm, side))) / rad;
  float wPx = hPx * uAspect;
  float off = tick + 0.5 * (abs(side.x) * wPx + abs(side.y) * hPx) + 6.0;
  vec3 p = mark.xyz;
  p.xy += (side * off + position.xy * vec2(wPx, hPx)) * rad * depth;
  vUv = mix(aCell.xy, aCell.zw, position.xy + 0.5);
  gl_Position = projectionMatrix * vec4(p, 1.0);
}
`;
const LABEL_FRAG = /* glsl */ `
uniform sampler2D uMap;
varying vec2 vUv;
varying float vAlpha;
void main() {
  vec4 c = texture2D(uMap, vUv);
  gl_FragColor = vec4(c.rgb, c.a * vAlpha);
  if (gl_FragColor.a < 0.004) discard;
  #include <colorspace_fragment>
}
`;

let labelMat = null;
function labelMaterial() {
  if (labelMat) return labelMat;
  labelMat = shared(
    new THREE.ShaderMaterial({
      vertexShader: LABEL_VERT,
      fragmentShader: LABEL_FRAG,
      uniforms: {
        uMap: { value: labelAtlas().tex },
        uLook: { value: new THREE.Vector4(LABEL.nearPx, LABEL.farPx, LABEL.near, LABEL.far) },
        uAlpha: { value: new THREE.Vector2(LABEL.nearAlpha, LABEL.farAlpha) },
        uFit: { value: new THREE.Vector2(LABEL.minPx, LABEL.fill) },
        uAspect: { value: ATLAS.w / ATLAS.h },
        uTickHalf: { value: GRID.tickHalf },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  return labelMat;
}

// ---- The grid --------------------------------------------------------------------------

export class GreenGrid {
  // heightAt(wx, wz); gradientAt(wx, wz) -> [dh/dwx, dh/dwz];
  // inside(wx, wz) -> on the green?
  // bounds { x0, x1, z0, z1 }: the area to cover, in grid coordinates (see
  // below), metres.
  // origin [wx, wz] and toward [wx, wz]: squares the grid to a putt. Grid
  // coordinates are then u across the putt (+u to the right looking at the
  // hole) and v along it (+v back towards the player, the hole at -v), with a
  // line through the ball each way. Left out, grid coordinates are world x, z.
  // marks: distances along the putt (feet) for a tick and a label each
  // (sim/greenread.mjs distanceMarks); needs `toward`.
  // smooth: metres over which the markers read the slope (sim/greenread.mjs
  // smoothGradient) - for real ground, whose slope is rough close to; 0 for
  // the slope right where each marker is.
  // keep: { minWeight, cap } to keep only the markers along the putt
  // (sim/greenread.mjs pickMarkers) - for a grid over a whole course green;
  // left out, every piece of line has one.
  // colours: whether the markers are coloured by how steep it is
  // (slopeColor) or plain white - true, false or a function asked as they're
  // drawn (the players' setting: puttline.js gridColours).
  constructor({ heightAt, gradientAt, inside, bounds, spacing = GRID.spacing, stimp = 10, origin = [0, 0], toward = null, marks = [], smooth = 0, keep = null, colours = true }) {
    this.heightAt = heightAt;
    this.gradientAt = gradientAt;
    this.spacing = spacing;
    this.stimp = stimp;
    this.colours = colours;
    this.group = new THREE.Group();
    // Drawn after the tracers (renderOrder 2, look/tracer.js), so a putt's
    // line left on the green never covers the grid's lines and marks.
    this.group.renderOrder = 3;

    // Unit vectors (world x, z) for grid u and v.
    let ev = [0, 1];
    if (toward) {
      const dx = origin[0] - toward[0];
      const dz = origin[1] - toward[1];
      const len = Math.hypot(dx, dz) || 1;
      ev = [dx / len, dz / len];
    }
    const eu = [ev[1], -ev[0]];
    this.axes = { origin, eu, ev };
    const world = (u, v) => [origin[0] + eu[0] * u + ev[0] * v, origin[1] + eu[1] * u + ev[1] * v];
    // How much shows at (wx, wz): all of it in the putt's channel, very
    // little beyond (channelWeight); all of it with no putt to square to.
    const distance = toward ? Math.hypot(origin[0] - toward[0], origin[1] - toward[1]) : 0;
    this.channelAt = (x, z) => {
      const dx = x - origin[0];
      const dz = z - origin[1];
      return channelWeight(dx * eu[0] + dz * eu[1], dx * ev[0] + dz * ev[1], distance);
    };

    // Lines, sampled finely so they follow the humps, kept to the green: a
    // run of points for each stretch of a line on it.
    const ribbons = new Ribbons();
    this.runs = [];
    const step = 0.1;
    const addLine = (u0, v0, u1, v1, level, lift = 0.005) => {
      const n = Math.max(1, Math.ceil(Math.hypot(u1 - u0, v1 - v0) / step));
      let run = [];
      let dims = [];
      const flush = () => {
        if (run.length >= 2) {
          ribbons.add(run, level, dims);
          this.runs.push({ level, from: [u0, v0], to: [u1, v1], points: run.length });
        }
        run = [];
        dims = [];
      };
      for (let i = 0; i <= n; i++) {
        const [x, z] = world(u0 + ((u1 - u0) * i) / n, v0 + ((v1 - v0) * i) / n);
        if (!inside(x, z)) {
          flush();
          continue;
        }
        run.push([x, heightAt(x, z) + lift, z]);
        dims.push(this.channelAt(x, z));
      }
      flush();
    };
    const { x0, x1, z0, z1 } = bounds;
    const us = [];
    const vs = [];
    for (let u = Math.ceil(x0 / spacing) * spacing; u <= x1 + 1e-9; u += spacing) us.push(u);
    for (let v = Math.ceil(z0 / spacing) * spacing; v <= z1 + 1e-9; v += spacing) vs.push(v);
    for (const u of us) addLine(u, z0, u, z1, lineLevel(u / spacing));
    for (const v of vs) addLine(x0, v, x1, v, lineLevel(v / spacing));
    // The distance marks: a tick across the line at each.
    this.marks = toward ? marks.filter((ft) => MARK_FEET.includes(ft) && inside(...world(0, -ft * FOOT))) : [];
    for (const ft of this.marks) addLine(-GRID.tickHalf, -ft * FOOT, GRID.tickHalf, -ft * FOOT, TICK, 0.007);
    this.lines = ribbons.mesh(ribbonMaterial(0xffffff, { spacing }));
    this.group.add(this.lines);

    // One marker on each piece of line between two crossings, running along
    // it. axis: which way the line runs (eu across, ev along the putt). Each
    // knows how soon it thins out: its line's level, and its piece's.
    this.markers = [];
    const onGreen = (u, v) => inside(...world(u, v));
    const addMarker = (u, v, axis, du, dv, lineAt, pieceAt) => {
      if (!onGreen(u, v) || !onGreen(u + du, v + dv) || !onGreen(u + du / 2, v + dv / 2)) return;
      const [sx, sz] = world(u, v);
      // The middle of its piece, where it's seen from (see).
      const [mx, mz] = world(u + du / 2, v + dv / 2);
      this.markers.push({
        sx,
        sz,
        dir: axis,
        t: Math.random(),
        x: sx,
        z: sz,
        percent: 0,
        line: lineLevel(lineAt),
        piece: pieceLevel(pieceAt),
        mx,
        mz,
        my: heightAt(mx, mz),
        chan: this.channelAt(mx, mz),
        ...PLAIN_VIEW,
      });
    };
    for (const u of us) for (const v of vs) {
      addMarker(u, v, eu, spacing, 0, v / spacing, u / spacing); // across the putt: left to right
      addMarker(u, v, ev, 0, spacing, u / spacing, v / spacing); // along the putt: up and down
    }
    if (keep) this.markers = pickMarkers(this.markers.map((m) => m.chan), keep).map((i) => this.markers[i]);
    // On rough ground, each marker's slope smoothed, read along its piece
    // once now (sim/greenread.mjs slopeAlong); otherwise read where it is
    // as it runs.
    if (smooth > 0) {
      for (const m of this.markers) {
        m.slopes = [];
        for (let k = 0; k <= SLOPE_SAMPLES; k++) {
          const f = (k / SLOPE_SAMPLES) * spacing;
          m.slopes.push(smoothGradient(gradientAt, m.sx + m.dir[0] * f, m.sz + m.dir[1] * f, smooth, inside));
        }
      }
    }
    this.dots = new THREE.InstancedMesh(dotGeometry(), markerMaterial(), Math.max(1, this.markers.length));
    this.dots.count = this.markers.length;
    this.dots.frustumCulled = false;
    this.dots.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.fade = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, this.markers.length)).fill(1), 1);
    this.fade.setUsage(THREE.DynamicDrawUsage);
    this.dots.geometry.setAttribute("aFade", this.fade);
    this.group.add(this.dots);

    // The labels by the ticks: a square of the labels' picture each, all in
    // one draw.
    this.labels = null;
    if (this.marks.length && typeof document !== "undefined") {
      const { cells } = labelAtlas();
      const geo = new THREE.InstancedBufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
      geo.setIndex([0, 1, 2, 0, 2, 3]);
      const mark = [];
      const across = [];
      const along = [];
      const rank = [];
      const cell = [];
      for (const ft of this.marks) {
        const [x, z] = world(0, -ft * FOOT);
        mark.push(x, heightAt(x, z) + 0.01, z);
        across.push(eu[0], 0, eu[1]);
        along.push(-ev[0], 0, -ev[1]);
        rank.push(markRank(ft));
        cell.push(...cells.get(ft));
      }
      geo.setAttribute("aMark", new THREE.InstancedBufferAttribute(new Float32Array(mark), 3));
      geo.setAttribute("aAcross", new THREE.InstancedBufferAttribute(new Float32Array(across), 3));
      geo.setAttribute("aAlong", new THREE.InstancedBufferAttribute(new Float32Array(along), 3));
      geo.setAttribute("aRank", new THREE.InstancedBufferAttribute(new Float32Array(rank), 1));
      geo.setAttribute("aCell", new THREE.InstancedBufferAttribute(new Float32Array(cell), 4));
      geo.instanceCount = this.marks.length;
      this.labels = new THREE.Mesh(geo, labelMaterial());
      this.labels.frustumCulled = false;
      this.labels.renderOrder = 4;
      this.group.add(this.labels);
    }
    this.update(0);
  }

  // Slope along a marker's line where it is, in percent: positive when the
  // line runs downhill in its own direction (dir), negative when uphill.
  fallAlong(m) {
    const [gx, gz] = this.slopeOf(m);
    return -(gx * m.dir[0] + gz * m.dir[1]) * 100;
  }

  // The slope a marker reads where it is: smoothed on rough ground.
  slopeOf(m) {
    return m.slopes ? slopeAlong(m.slopes, m.t) : this.gradientAt(m.x, m.z);
  }

  // How each marker is seen from the camera, worked out again only once the
  // camera has moved a few centimetres (the markers move along their lines
  // every frame, but this goes by the middle of each one's piece, so it
  // doesn't flicker as it runs): how much of it shows as the lines round it
  // thin out, how much bigger it's drawn, how much longer towards the
  // camera, and which way the view runs over the ground (sim/greenread.mjs
  // markerLook). Changing as smoothly as it does, a few centimetres behind
  // is never seen - and following a putt or moving between stops, the camera
  // moves most frames.
  see(camera) {
    const cam = camera?.position ?? null;
    if (!cam) {
      if (this.seenFrom) for (const m of this.markers) Object.assign(m, PLAIN_VIEW);
      this.seenFrom = null;
      return;
    }
    const was = this.seenFrom;
    if (was && was.fov === camera.fov && Math.abs(was.x - cam.x) + Math.abs(was.y - cam.y) + Math.abs(was.z - cam.z) < SEE_AGAIN) return;
    this.seenFrom = { x: cam.x, y: cam.y, z: cam.z, fov: camera.fov };
    const fov = camera.fov;
    const s = this.spacing;
    const { eu, ev } = this.axes;
    const U = [eu[0] * s, 0, eu[1] * s];
    const V = [ev[0] * s, 0, ev[1] * s];
    const ray = [0, 0, 0];
    for (const m of this.markers) {
      const dx = cam.x - m.mx;
      const dy = cam.y - m.my;
      const dz = cam.z - m.mz;
      const dist = Math.hypot(dx, dy, dz) || 1e-6;
      ray[0] = dx / dist;
      ray[1] = dy / dist;
      ray[2] = dz / dist;
      const pxU = spanPx(U, ray, dist, fov);
      const pxV = spanPx(V, ray, dist, fov);
      // Its line thins with the lines alongside it, its piece with the
      // lines crossing it.
      const across = m.dir === eu;
      m.alpha = lodWeight(m.line, across ? pxV : pxU) * lodWeight(m.piece, across ? pxU : pxV) * markerFade(dist);
      if (m.alpha <= 0) continue;
      // The way the view runs over the ground, and square to it.
      const flat = Math.hypot(dx, dz) || 1e-6;
      const vx = -dx / flat;
      const vz = -dz / flat;
      const fv = Math.abs(m.dir[0] * vx + m.dir[1] * vz);
      const fp = Math.abs(m.dir[0] * vz - m.dir[1] * vx);
      // The room the lines still showing leave it, across the view and
      // along it - allowing for its growing in and out along its run.
      const cu = (s * visibleStep(pxU)) / GROW_MAX;
      const cv = (s * visibleStep(pxV)) / GROW_MAX;
      const { scale, stretch } = markerLook({
        dist,
        up: dy,
        fovDeg: fov,
        across: fp * MARKER.length + fv * MARKER.width,
        deep: fv * MARKER.length + fp * MARKER.width,
        room: Math.abs(eu[0] * vz - eu[1] * vx) * cu + Math.abs(ev[0] * vz - ev[1] * vx) * cv,
        roomDeep: Math.abs(eu[0] * vx + eu[1] * vz) * cu + Math.abs(ev[0] * vx + ev[1] * vz) * cv,
      });
      m.scale = scale;
      m.stretch = stretch;
      m.vx = vx;
      m.vz = vz;
      m.lift = 0.008 + 0.012 * MARKER.length * scale * stretch;
    }
  }

  // Moves the markers on by `dt` seconds, each drawn as it's seen from the
  // camera if there is one (see); those whose lines have thinned out fade
  // away and rest where they are meanwhile.
  update(dt, camera = null) {
    this.see(camera);
    const color = new THREE.Color();
    const coloured = typeof this.colours === "function" ? this.colours() !== false : this.colours !== false;
    const mat = this.dots.instanceMatrix.array;
    const fade = this.fade.array;
    const s = this.spacing;
    for (let i = 0; i < this.markers.length; i++) {
      const m = this.markers[i];
      fade[i] = m.alpha * m.chan;
      if (m.alpha <= 0) {
        // Faded right out: shrunk to nothing, so nothing is drawn for it.
        if (mat[i * 16 + 15] !== 0) mat.fill(0, i * 16, i * 16 + 16);
        continue;
      }
      // The slope where it is: along its line for its pace, and to lay it on.
      const [gx, gz] = this.slopeOf(m);
      const fall = -(gx * m.dir[0] + gz * m.dir[1]) * 100;
      const percent = Math.abs(fall);
      m.percent = percent;
      // Downhill along the line, at a pace set by the slope and the green
      // speed; off the end of its piece of line, it starts again at the other.
      if (percent >= FLAT) {
        m.t += (Math.sign(fall) * PACE * percent * (this.stimp / 10) * dt) / s;
        m.t -= Math.floor(m.t);
      }
      m.x = m.sx + m.dir[0] * m.t * s;
      m.z = m.sz + m.dir[1] * m.t * s;
      // Grow in and shrink out along each run; a flat line keeps a small,
      // still marker at its middle.
      let size = (Math.sin(Math.PI * m.t) * 0.8 + 0.3) * m.scale;
      if (percent < FLAT) {
        size = 0.5 * m.scale;
        m.x = m.mx;
        m.z = m.mz;
      }
      // Turned the way it's going (along dir, or back) - round, but stretched
      // along the view like the rest of the green: its footprint
      // forward (length) and to its right (width), world x and z - drawn
      // longer along the view by its stretch: w + (stretch - 1)(w . v) v.
      const sg = fall < 0 ? -1 : 1;
      let fx = sg * m.dir[0];
      let fz = sg * m.dir[1];
      let rx = fz;
      let rz = -fx;
      if (m.stretch > 1) {
        const k = m.stretch - 1;
        const df = (fx * m.vx + fz * m.vz) * k;
        const dr = (rx * m.vx + rz * m.vz) * k;
        fx += df * m.vx;
        fz += df * m.vz;
        rx += dr * m.vx;
        rz += dr * m.vz;
      }
      // Laid on the slope where it is.
      const o = i * 16;
      mat[o] = rx * size;
      mat[o + 1] = (gx * rx + gz * rz) * size;
      mat[o + 2] = rz * size;
      mat[o + 3] = 0;
      mat[o + 4] = 0;
      mat[o + 5] = 1;
      mat[o + 6] = 0;
      mat[o + 7] = 0;
      mat[o + 8] = fx * size;
      mat[o + 9] = (gx * fx + gz * fz) * size;
      mat[o + 10] = fz * size;
      mat[o + 11] = 0;
      mat[o + 12] = m.x;
      mat[o + 13] = this.heightAt(m.x, m.z) + m.lift;
      mat[o + 14] = m.z;
      mat[o + 15] = 1;
      this.dots.setColorAt(i, coloured ? slopeColor(percent, color) : color.copy(PLAIN_MARKER));
    }
    this.dots.instanceMatrix.needsUpdate = true;
    this.fade.needsUpdate = true;
    if (this.dots.instanceColor) this.dots.instanceColor.needsUpdate = true;
  }

  // Lets go of what it holds on the graphics card (the materials and the
  // labels' picture are shared by every green, and stay).
  dispose() {
    this.lines.geometry.dispose();
    this.dots.geometry.dispose();
    this.dots.dispose();
    this.labels?.geometry.dispose();
  }
}

// ---- Slope shading --------------------------------------------------------------------

// The green's shaders - the grid's lines, markers and labels, and the slope
// shading - for warming up (look/warmup.js, look/gpuprep.js drawAllSteps)
// before the first green of a session: a report had them built as the ball
// reached the first green, 547 ms, and the card then finishing them, 1.8 s
// stood still. A tiny grid and shading on a flat green, never shown. Made
// once.
let warmers = null;
export function greenWarmers() {
  if (warmers) return warmers;
  warmers = new THREE.Group();
  warmers.name = "green warm-up";
  const flat = { heightAt: () => 0, gradientAt: () => [0.01, 0.005], inside: (x, z) => Math.hypot(x, z) < 2, bounds: { x0: -2, x1: 2, z0: -2, z1: 2 } };
  const grid = new GreenGrid({ ...flat, origin: [0, 1.5], toward: [0, -1.5], stimp: 10, marks: [5] });
  warmers.add(grid.group);
  warmers.add(slopeShade({ ...flat, cell: 0.5 }));
  return warmers;
}

// The green tinted by how steep it is (sim/greenread.mjs shadeColor): clear
// where it's under 1%, then the markers' colours, deeper as it steepens. A
// mesh draped over `bounds` (world { x0, x1, z0, z1 }) in cells of about
// `cell` metres, clear off the green. One draw.
export function slopeShade({ heightAt, gradientAt, inside, bounds, cell = 0.3 }) {
  const { x0, x1, z0, z1 } = bounds;
  const nx = Math.max(1, Math.ceil((x1 - x0) / cell));
  const nz = Math.max(1, Math.ceil((z1 - z0) / cell));
  const pos = new Float32Array((nx + 1) * (nz + 1) * 3);
  const col = new Float32Array((nx + 1) * (nz + 1) * 4);
  const on = new Uint8Array((nx + 1) * (nz + 1));
  const c = new THREE.Color();
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      const k = j * (nx + 1) + i;
      const x = x0 + ((x1 - x0) * i) / nx;
      const z = z0 + ((z1 - z0) * j) / nz;
      pos[k * 3] = x;
      pos[k * 3 + 1] = heightAt(x, z) + 0.004;
      pos[k * 3 + 2] = z;
      on[k] = inside(x, z) ? 1 : 0;
      const [gx, gz] = gradientAt(x, z);
      const [r, g, b, a] = shadeColor(Math.hypot(gx, gz) * 100);
      c.setRGB(r, g, b, THREE.SRGBColorSpace);
      col.set([c.r, c.g, c.b, on[k] ? a : 0], k * 4);
    }
  }
  const index = [];
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = a + 1;
      const d = a + nx + 1;
      const e = d + 1;
      if (!(on[a] || on[b] || on[d] || on[e])) continue;
      index.push(a, d, b, b, d, e);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 4));
  geo.setIndex(index);
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  // Faint outside the putt's channel (sim/greenread.mjs channelWeight, the
  // same in the shader): the putt set by setChannel, none until then.
  const uniforms = {
    uChanFrom: { value: new THREE.Vector2() },
    uChanV: { value: new THREE.Vector2(0, 1) },
    uChanDist: { value: 0 },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vChanAt;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvChanAt = (modelMatrix * vec4(position, 1.0)).xz;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec2 vChanAt;
        uniform vec2 uChanFrom;
        uniform vec2 uChanV;
        uniform float uChanDist;
        float chanWeight() {
          if (uChanDist <= 0.0) return 1.0;
          vec2 d = vChanAt - uChanFrom;
          float v = dot(d, uChanV);
          float u = dot(d, vec2(uChanV.y, -uChanV.x));
          float halfW = min(${CHANNEL.maxHalf.toFixed(3)}, ${CHANNEL.half.toFixed(3)} + ${CHANNEL.perMetre.toFixed(3)} * uChanDist);
          float toHole = length(vec2(u, v + uChanDist));
          if (toHole < ${(CHANNEL.clear + CHANNEL.clearSoft).toFixed(3)}) return smoothstep(0.0, 1.0, max(0.0, (toHole - ${CHANNEL.clear.toFixed(3)}) / ${CHANNEL.clearSoft.toFixed(3)}));
          float beyond = max(max(0.0, abs(u) - halfW), max(v - ${CHANNEL.behind.toFixed(3)}, -(uChanDist + ${CHANNEL.past.toFixed(3)}) - v));
          return mix(1.0, ${CHANNEL.outside.toFixed(3)}, smoothstep(0.0, 1.0, min(1.0, beyond / ${CHANNEL.soft.toFixed(3)})));
        }`,
      )
      .replace("#include <opaque_fragment>", "diffuseColor.a *= chanWeight();\n#include <opaque_fragment>");
  };
  material.customProgramCacheKey = () => "slope-shade-channel-v2";
  const mesh = new THREE.Mesh(geo, material);
  mesh.renderOrder = 1;
  // The putt it's squared to: from `origin` towards `toward` (world x, z),
  // or null for none.
  mesh.userData.setChannel = (origin, toward) => {
    const dist = origin && toward ? Math.hypot(origin[0] - toward[0], origin[1] - toward[1]) : 0;
    uniforms.uChanDist.value = dist;
    if (!dist) return;
    uniforms.uChanFrom.value.set(origin[0], origin[1]);
    uniforms.uChanV.value.set((origin[0] - toward[0]) / dist, (origin[1] - toward[1]) / dist);
  };
  return mesh;
}
