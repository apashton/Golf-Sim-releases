// The shot tracer: a line along the whole shot, in the colour of whoever
// hit it, drawn a few pixels wide however near or far it is - like the
// tracers on television - and fading out close to the camera. A tube with a
// fixed thickness in metres filled the screen with a band when the chase
// camera passed near it, and thinned to nothing two hundred yards away.
//
// It has two parts (sim/tracer.mjs has their widths): thin through the air,
// thicker along the bounces and the roll, laid just on top of the ground.
// A putt is all ground, drawn in a style of its own.
//
// makeTracer builds one tube from a list of points and reveals it as far as
// the ball has got, by distance along it (not by time: a drive covers most
// of its distance early, so revealing by time left the tip of the line tens
// of metres behind the ball). makeShotTracer puts a shot's two together, and
// a TracerSet keeps a mode's tracers up, the last one bright and the rest
// faint.

import * as THREE from "three";
import { disposeTree, shared } from "./dispose.js";
import { markReadable } from "./weatherlook.js";
import { TRACER_STYLES, LOOKS, tracerColour, faintColour, splitPath, partsAt, tracerLooks } from "../sim/tracer.mjs";

const f = (v, n = 5) => Number(v).toFixed(n);

// A tracer's material: `style` is one of TRACER_STYLES (or the numbers
// themselves), `colour` a "#rrggbb".
// `depth`: its depth alone, nothing seen (a tracer's own: see makeTracer).
export function tracerMaterial(opacity = LOOKS.last.opacity, { style = "air", colour = tracerColour(0), depth = false } = {}) {
  const s = typeof style === "string" ? TRACER_STYLES[style] : style;
  // Not writing depth: its faded, see-through part near the camera would
  // otherwise still hide anything see-through drawn after it.
  const material = new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity, depthWrite: depth, colorWrite: !depth });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float tDepth;")
      .replace(
        "#include <begin_vertex>",
        // The tube is built hair-thin; each point is pushed out from the
        // line by an amount that grows with its distance from the camera.
        // Along the ground the whole of it is raised by as much again, so
        // however wide it's drawn from far away it lies on the grass rather
        // than half under it.
        `#include <begin_vertex>
        {
          float along = -(modelViewMatrix * vec4(transformed, 1.0)).z;
          float r = max(${f(s.min, 4)}, along * ${f(s.width)});
          transformed += normal * r;
          transformed.y += r * ${f(s.lift, 3)} + ${f(s.above, 4)};
        }`,
      )
      .replace("#include <project_vertex>", "#include <project_vertex>\ntDepth = -mvPosition.z;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float tDepth;")
      .replace(
        "#include <opaque_fragment>",
        // Clear close to the camera; thinning into the haze far off.
        `diffuseColor.a *= smoothstep(${f(s.near, 2)}, ${f(s.far, 2)}, tDepth) * (1.0 - ${f(1 - (s.least ?? 1), 3)} * smoothstep(${f(s.fadeFrom ?? 1e4, 1)}, ${f(s.fadeTo ?? 2e4, 1)}, tDepth));\n${depth ? `if (diffuseColor.a < ${f(DEPTH_FROM, 2)}) discard;\n` : ""}#include <opaque_fragment>`,
      );
  };
  // One drawing program per style, whatever the colour or opacity.
  const key = `tracer-v4-${depth ? "depth-" : ""}${s.width}-${s.min}-${s.near}-${s.far}-${s.lift}-${s.above}-${s.fadeFrom}-${s.fadeTo}-${s.least}`;
  material.customProgramCacheKey = () => key;
  return material;
}

// How strong a tracer has to be where it writes its depth.
const DEPTH_FROM = 0.25;

// One material per style, colour and look, made the first time it's asked
// for and kept: every shot making and freeing its own made the graphics card
// rebuild the tracer's drawing program at the moment a ball was launched.
// There are only a few - three styles, four players' colours, two looks.
const materials = new Map();
export function sharedTracerMaterial(style = "air", colour = tracerColour(0), look = "last") {
  const key = `${style}|${colour}|${look}`;
  if (!materials.has(key)) {
    const shown = look === "faint" ? faintColour(colour) : colour;
    materials.set(key, shared(tracerMaterial(LOOKS[look].opacity, { style, colour: shown })));
  }
  return materials.get(key);
}

// Cumulative distance along a list of points (THREE.Vector3s).
export function arcLengths(points) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + points[i].distanceTo(points[i - 1]));
  return cum;
}

// How much of the tube to draw with the ball `k` of the way from point
// `index` to the next: whole segments, out of `segments`.
export function revealedSegments(cum, index, k, segments) {
  const total = cum[cum.length - 1] || 1;
  if (index >= cum.length - 1) return segments;
  const along = cum[index] + Math.min(1, Math.max(0, k)) * (cum[index + 1] - cum[index]);
  return Math.min(segments, Math.floor((along / total) * segments));
}

// The points a curve can be drawn through: a ball sitting still (at rest,
// or the same spot twice) makes the tube's frames come out as nonsense, so
// points closer than `gap` to the last one kept are dropped.
function spaced(points, gap = 0.02) {
  const out = [points[0]];
  for (const p of points.slice(1)) if (p.distanceTo(out.at(-1)) >= gap) out.push(p);
  return out;
}

// One tube along `points` (world THREE.Vector3s), hidden to start with.
// Returns the mesh - or null when the points hardly go anywhere (a ball
// that stopped where it landed) - with
//   userData.reveal(index, k)  drawn as far as the ball, k of the way from
//                              point `index` to the next
//   userData.revealAll()       the whole of it
//   userData.hide()            none of it
// Its material is one shared by every tracer of the same look, unless `own`
// is set, when it has one of its own, freed with it.
export function makeTracer(points, { segments, radial = 6, opacity = LOOKS.last.opacity, style = "air", colour = tracerColour(0), own = false } = {}) {
  if (points.length < 2) return null;
  const curvePoints = spaced(points);
  const cum = arcLengths(points);
  if (curvePoints.length < 2 || cum.at(-1) < 0.05) return null;
  segments ??= Math.min(600, Math.max(8, points.length * 2));
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curvePoints), segments, 0.001, radial, false);
  const material = own ? tracerMaterial(opacity, { style, colour }) : sharedTracerMaterial(style, colour, "last");
  const mesh = new THREE.Mesh(geo, material);
  // Over the ground's see-through edges, under labels and rings.
  mesh.renderOrder = 2;
  // Its depth, written after everything else is drawn: Ultra's 3D clouds
  // are laid into the sky afterwards wherever nothing's in front
  // (look/effects.js), and the tracer - see-through, so writing none -
  // went under them. Where it's faded out, none.
  const depth = new THREE.Mesh(geo, tracerMaterial(opacity, { style, depth: true }));
  depth.name = "tracer depth";
  depth.renderOrder = 50;
  depth.userData.keepGeometry = true;
  depth.onBeforeRender = () => {
    depth.material.opacity = mesh.material.opacity;
  };
  mesh.add(depth);
  const perSegment = radial * 6;
  geo.setDrawRange(0, 0);
  mesh.userData.reveal = (index, k = 0) => geo.setDrawRange(0, revealedSegments(cum, index, k, segments) * perSegment);
  mesh.userData.revealAll = () => geo.setDrawRange(0, Infinity);
  mesh.userData.hide = () => geo.setDrawRange(0, 0);
  mesh.userData.style = style;
  return mesh;
}

// A tracer for a whole shot: `path` as the modes play it, its first
// `flightPoints` points in the air and the rest along the ground.
// `place(point)` gives a point's world position (a THREE.Vector3): where
// the ball's centre is there. `putt` draws the ground in the putt's style.
// Returns a THREE.Group, hidden to start with, with
//   userData.reveal(index, k)  drawn as far as the ball has got along the
//                              whole path, flight then ground
//   userData.revealAll()       the whole shot
//   userData.hideAll()         none of it (a flyover draws it again)
//   userData.setLook(look)     "last" (bright) or "faint"
//   userData.fade(amount)      fades it by that much, on materials of its
//                              own (the course's celebration); setLook puts
//                              the shared ones back
//   userData.path, flightPoints, colour, points { air, ground }
export function makeShotTracer(path, flightPoints, place, { colour = tracerColour(0), putt = false } = {}) {
  const group = new THREE.Group();
  const { air, ground } = splitPath(path.length, flightPoints);
  const pts = (range) => (range ? path.slice(range[0], range[1]).map(place) : null);
  const airPts = pts(air);
  const groundPts = pts(ground);
  const tube = (p, style) => (p ? makeTracer(p, { style, colour, radial: style === "air" ? 5 : 6, segments: Math.min(400, Math.max(8, p.length * 2)) }) : null);
  const airMesh = tube(airPts, "air");
  const groundMesh = tube(groundPts, putt ? "putt" : "ground");
  const meshes = [airMesh, groundMesh].filter(Boolean);
  for (const m of meshes) group.add(m);
  let look = "last";
  Object.assign(group.userData, {
    path,
    flightPoints,
    colour,
    points: { air: airPts, ground: groundPts },
    reveal(index, k = 0) {
      const at = partsAt(index, k, path.length, flightPoints);
      for (const [mesh, part] of [
        [airMesh, at.air],
        [groundMesh, at.ground],
      ]) {
        if (!mesh) continue;
        if (part === "all") mesh.userData.revealAll();
        else if (part) mesh.userData.reveal(part[0], part[1]);
        else mesh.userData.hide();
      }
    },
    revealAll() {
      for (const m of meshes) m.userData.revealAll();
    },
    hideAll() {
      for (const m of meshes) m.userData.hide();
    },
    setLook(next = look) {
      look = next;
      group.visible = true;
      for (const m of meshes) {
        const was = m.material;
        m.material = sharedTracerMaterial(m.userData.style, colour, look);
        if (was !== m.material && !was.userData.shared) was.dispose();
      }
    },
    look: () => look,
    fade(amount) {
      for (const m of meshes) {
        if (m.material.userData.shared) {
          const shown = look === "faint" ? faintColour(colour) : colour;
          m.material = tracerMaterial(m.material.opacity, { style: m.userData.style, colour: shown });
        }
        m.material.opacity = Math.max(0, m.material.opacity - amount);
      }
      group.visible = meshes.some((m) => m.material.opacity > 0);
    },
  });
  // Never lost in a thicker haze than a fair day's (look/weatherlook.js).
  return markReadable(group);
}

// A mode's tracers: each shot's stays up, the last one bright and every
// earlier one faint, up to `keep` of them (the oldest going first).
export class TracerSet {
  constructor(parent, { keep = Infinity } = {}) {
    this.parent = parent;
    this.keep = keep;
    this.list = [];
  }
  get last() {
    return this.list.at(-1) ?? null;
  }
  // Adds a shot's tracer as the last one - before the oldest is retired, so
  // the graphics card keeps the tracer's drawing program.
  add(tracer) {
    this.parent.add(tracer);
    this.list.push(tracer);
    retireTracers(this.list, this.keep, this.parent);
    this.restyle();
    return tracer;
  }
  // Each one's look by its place in the list.
  restyle() {
    const looks = tracerLooks(this.list.length);
    this.list.forEach((t, i) => t.userData.setLook(looks[i]));
  }
  // All of them gone (a new hole, a cleared session).
  clear() {
    retireTracers(this.list, 0, this.parent);
  }
}

// Takes the oldest tracers in `list` off `parent` until only `keep` are left,
// freeing each one's tubes (and their materials, unless they're shared ones
// from above, which stay for the next shot), so a long session doesn't fill
// the graphics card with tracers nobody can see.
export function retireTracers(list, keep, parent) {
  while (list.length > keep) {
    const t = list.shift();
    (t.parent ?? parent)?.remove(t);
    disposeTree(t);
  }
  return list;
}
