// Changing a hole by hand, on its map in the designer: pick a tool, then
// tap and drag. Trees, bunkers (and a wall along one's edge), the green,
// water (and a wall along a pond's bank), the fairway and cart paths, with
// undo, redo and putting the hole back as it was.
//
// Every change is one small edit added to the hole's list (see
// sim/holeedits.mjs), so undo is just the list as it was, and the map
// redraws from the list as a drag goes on. A drag is one change, however
// long it goes on. Each hole's undo history is named step by step and
// kept in the browser (sim/edithistory.mjs), so it outlasts leaving the
// hole or the page. Works with a mouse and with
// touch (pointer events throughout, nothing needs hovering); two fingers,
// the mouse wheel or the zoom buttons look closer.

import { drawHole, fitHole } from "./coursemap.js";
import { MAP_COLORS, MAP_TREE_KINDS } from "./look/palette.js";
import { KINDS, KIND_NAMES, shapeCount } from "./sim/treeshapes.mjs";
import { kindAdvice, holeKindList, KIND_GUIDE } from "./sim/kindguide.mjs";
import { grownKinds } from "./sim/courseplay.mjs";
import { validLock, liveLock } from "./sim/treelock.mjs";
import {
  withEdits,
  addEdit,
  editState,
  TILTS,
  BUMP,
  greenHandles,
  handleSize,
  clumpAt,
  treesNear,
  treeSpotOk,
  shapeUnder,
  shapeAt,
  crownOf,
  reshapeGreen,
  gapTo,
  JOIN_REACH,
  pathChange,
  fairwayAnchor,
  fairwayAt,
  fairwayWidth,
  brookFits,
  edgeOf,
  edgeMarks,
  edgeMarkSize,
  reshapeShape,
  shapeTrouble,
  moveShape,
  scaleShape,
} from "./sim/holeedits.mjs";
import { causeways, causewayLook, causewayOutline, CAUSEWAY } from "./sim/causeway.mjs";
import { BROOK_KINDS, BROOK_WIDTH, brookShape, brookLine, nearestOnLine, alongLine, brookAt, brookHalf, joinBanks, burnBrook } from "./sim/brooks.mjs";
import { pathLine, pathAt, pathTrouble, nearestOnPath, gapToPaths, fewerPoints, PATH_KINDS, MAX_POINTS } from "./sim/paths.mjs";
import { WALLS, wallOf, wallLine, wallViews, defaultWall, wallFacing, wallFromDrag, lineDistance } from "./sim/walls.mjs";
import * as sculpt from "./sim/greensculpt.mjs";
import { greenGradient, greenHeight } from "./sim/putting.mjs";
import { insidePolygon, polygonArea, polygonCentroid } from "./sim/terrain.mjs";
import * as steps from "./sim/edithistory.mjs";
import { blobOutline, makePath, nearest, fairwayHalfWidth, firstCutWidth, deepRoughFrom, isPot, insideBlob, edgeReach as shapeReach, EDGE_MARKS } from "./sim/course.mjs";
import { TREE_KINDS } from "./sim/lidartrees.mjs";
import { BRUSH_SIZES, BRUSH_STEPS, TILT_LIMIT, riseToGreen } from "./sim/groundedit.mjs";
import { unpackGrid, gridHeight } from "./sim/terrain.mjs";
import { ask } from "./askbox.js";
import { LINKS_PLANTS, DEFAULT_LINKS_PLANT, linksPlant, linksPlanting, plantSize, linksPlantNote } from "./sim/linksplanting.mjs";

import { DECOR, DECOR_WORDS } from "./sim/decor.mjs";
import { TOOLS, MODES, edgeBrush, HELP, BROOK_DRAWING_HELP, BANK_HELP, NO_BROOK, FAIRWAYS_HELP, DRAWING_HELP, PICKED_HELP, WALL_HELP, WALL_NOTE, FACE_BUTTON, FACE_STEP, metres, NO_WALL, LADDER, depthStep, NO_TREES, NO_DECOR, NO_SHAPE, NO_GREEN, NO_SHAPING, NO_PATH, PATH_WHY, LINKS_HELP, LINK_HELP, NO_LINK, TREES_GONE, NO_SHAPE_ON_PATH, NO_RESHAPE, NO_FAIRWAY, SHAPE_TROUBLE, NO_CAUSEWAY, STAMP_NAMES } from "./holeeditor/tools.js";

// The shapes a tool works on by hand (shapeTool, below).
const SHAPE_TOOLS = { bunkers: { list: "bunkers", k: "b", kind: "bunker" }, water: { list: "water", k: "w", kind: "water" }, more: { list: "extraFairways", k: "a", kind: "fairway" } };
// Kept between holes and redraws: the tool in hand, how close the map is.
// Placed decor's colours on the map: heather, gorse, rock, wildflowers, bush.
const DECOR_COLOURS = ["#8a5a9a", "#d8c25a", "#9a958c", "#e07ab8", "#3f7d3a"];
const ui = {
  tool: "look",
  decorKind: 0,
  mode: { decor: "place", trees: "move", green: "shape", ground: "raise", fairway: "width", rough: "cut-wider" },
  // The ground brush: its size and how much each rub does (places in
  // groundedit.mjs BRUSH_SIZES and BRUSH_STEPS).
  ground: { size: 1, step: 1 },
  brush: "small",
  view: { zoom: 1, at: null },
  before: null, // the view before choosing Green or Bunkers zoomed in, to go back to
  selected: null, // { list: "bunkers" | "water" | "extraFairways" | "fairways", at: [x, z] }
  // Cart paths: the one picked (a spot on its line), which of its dots
  // (bends) was tapped, and the dots of one being drawn.
  path: null, // { at: [x, z], dot: -1 }
  drawing: null, // [[x, z], ...]
  // Brooks: the one picked (a spot on its line) and which of its dots was
  // tapped, the dots of one being drawn and its kind, and a stretch of
  // bank being walled (its first tap) and what walls are built of.
  brook: null, // { at: [x, z], dot: -1 }
  brookDraw: null, // [[x, z], ...]
  brookKind: 0,
  bank: null, // { first: { u, side, at } | null }
  bankM: 0,
  picked: [], // tree spots
  // The kind of tree planted (sim/treeshapes.mjs KINDS' index), or null:
  // as they'd grow on the hole, mixed.
  plantKind: null,
  // On a links hole, what's planted instead (sim/linksplanting.mjs).
  linksPlant: DEFAULT_LINKS_PLANT,
  key: null,
  historyOpen: false, // the list of steps showing
  // Shaping the green in detail: what the brush does and its ring's size,
  // the stamp to put down next and which way, the stamp picked (its place
  // in the list), and the last style tapped (tapped again: another take).
  shaping: { action: "raise", ring: "medium", stamp: 2, sign: 1, picked: -1, style: null, area: [], slopeMax: 0.03 },
};
// Undo and redo, per course and hole: { steps, at } (see edithistory.mjs),
// kept in the browser as well so they outlast the page.
const histories = new Map();
let active = null;
// localStorage, or somewhere that forgets if the browser won't allow it.
const FORGETS = { getItem: () => null, setItem: () => {} };
const store = (() => {
  try {
    const s = window.localStorage;
    s.getItem(steps.STORE_KEY);
    return s;
  } catch {
    return FORGETS;
  }
})();
// The tools that look closer when chosen, and back out when left.
const ZOOMING = new Set(["green", "bunkers"]);

const r2 = (v) => Math.round(v * 100) / 100;

// A hole's green surface for the map's shading and the steepness warnings:
// the same heights play uses, the real ground under it and all.
const surfaces = new WeakMap();
function surfaceOf(L, S) {
  let g = surfaces.get(L);
  if (!g) {
    g = { contours: L.contours ?? [], terrain: sculpt.terrainOf(S) };
    surfaces.set(L, g);
  }
  return g;
}

// Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z) anywhere on the page but a text box.
document.addEventListener("keydown", (e) => {
  if (!active?.el.isConnected || !(e.ctrlKey || e.metaKey) || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "")) return;
  const k = e.key.toLowerCase();
  if (k === "z" && !e.shiftKey) active.undo();
  else if (k === "y" || (k === "z" && e.shiftKey)) active.redo();
  else return;
  e.preventDefault();
});

// Puts the editor in `el`.
//   key       course id and hole, for undo
//   base      stands for the hole as designed, so undo kept for another
//             hole under the same key isn't picked up (edithistory.mjs)
//   layout()  the hole's stored layout (with its edits)
//   save(layout)  keeps a changed one (the designer marks the course unsaved)
//   play()    plays this hole
//   others()  what of other holes is on this hole's map: { shapes: [{ list,
//             k, index, number, poly }], lines: [{ index, number, line }] }
//             in this hole's frame (k: the shape's place in this hole's own
//             list, for a hole from the map whose box has it; none for a
//             designed course's neighbour), and trees: [{ list: "trees",
//             index, number, at, size }] (other holes' trees, drawn locked)
//   pick(i)   go to hole i
//   own(list, k, number)  the owner's word: that shape is hole `number`'s
//   stands    the hole's seed for its stands of trees (courseplay.mjs
//             grownTrees), for the tree key: what each tree grows as
//   links()   the paths between holes to and from this one, in its frame
//             (sim/linkpaths.mjs holeLinks), and drawLink(number, line) to
//             change the one on from hole `number`: its line, [] for none
//             or null to have it worked out again - false where a path
//             can't go there (a designed course; none elsewhere)
//   forget    nothing of its undo kept in the browser (the game's video:
//             showreel.js)
export function mountHandEditor(el, { key, base = "", layout, save, play, number, others = null, pick = null, own = null, stands = null, signature = null, links = null, drawLink = null, forget = false }) {
  if (ui.key !== key) {
    ui.key = key;
    ui.selected = null;
    ui.picked = [];
    ui.view = { zoom: 1, at: null };
    ui.before = null;
    ui.path = null;
    ui.link = null;
    ui.drawing = null;
    ui.foreign = null;
  }
  // Carries on from where this hole's history left off - in this visit or
  // an earlier one - if the hole's changes are one of its steps.
  const now = layout().edits ?? [];
  const kept = forget ? FORGETS : store;
  histories.set(key, histories.has(key) ? steps.resume(histories.get(key), now, base) : steps.loadHistory(kept, key, now, base));
  const history = () => histories.get(key);
  const keep = (h) => {
    histories.set(key, h);
    steps.saveHistory(kept, key, h);
  };
  // A hole with no ground of its own has no Ground tool, and one from a
  // map no Rough tool (its rough is the map's).
  const hasTool = (id) => (id !== "ground" || !!layout().terrain) && (id !== "rough" || layout().source !== "map");
  if (!hasTool(ui.tool)) ui.tool = "look";
  el.className = "hand";
  el.innerHTML = `
    <div class="hand-tools" role="toolbar">${TOOLS.filter((t) => hasTool(t.id)).map(
      (t) => `<button class="tool ${ui.tool === t.id ? "on" : ""}" data-tool="${t.id}" title="${t.word}">${t.icon}<span>${t.word}</span></button>`,
    ).join("")}</div>
    <div class="hand-modes" id="hand-modes"></div>
    <p class="hand-help" id="hand-help"></p>
    <div class="hand-context" id="hand-context"></div>
    <div class="hand-bar">
      <button id="hand-undo" class="step" title="Ctrl+Z">Undo<small></small></button>
      <button id="hand-redo" class="step" title="Ctrl+Y">Redo<small></small></button>
      <button id="hand-history" title="Go back to any step" aria-expanded="false">History</button>
      <span class="gap"></span>
      <button id="zoom-in" title="Look closer" aria-label="Zoom in">+</button>
      <button id="zoom-out" title="Look further" aria-label="Zoom out">&minus;</button>
      <button id="zoom-all" title="See the whole hole">Whole hole</button>
    </div>
    <div class="hand-map"><ol class="hand-steps" id="hand-steps" hidden></ol><canvas id="big" width="520" height="760"></canvas><p class="hand-note" id="hand-note" hidden></p></div>
    <div class="row hand-actions">
      <button id="hand-play" class="primary">Play this hole</button>
      <button id="hand-reset" class="danger">Put this hole back as it was</button>
    </div>`;
  const $ = (s) => el.querySelector(s);
  const canvas = $("#big");
  canvas.style.touchAction = "none";
  let fit = null; // the last drawing's fit
  let pending = null; // the edit a drag is making
  let gesture = null;
  let hover = null;
  let noteTimer = 0;
  let frame = 0;

  // Where a spot on the hole is on the page, and the hole as shown: for
  // finding things on the map from outside (the browser checks).
  canvas.pointFor = (p) => {
    const r = canvas.getBoundingClientRect();
    const [x, y] = fit.toCanvas(p);
    return [r.left + (x * r.width) / canvas.width, r.top + (y * r.height) / canvas.height];
  };
  canvas.shownLayout = () => withEdits(shown());
  canvas.shownEdits = () => shown().edits ?? [];
  canvas.otherShapes = () => foreign().shapes;

  const stored = () => layout();
  const edited = () => withEdits(stored());
  // What the tool in hand picks, drags and sizes by hand: bunkers, ponds,
  // or (the Fairway tool's Add and move, on a designed hole) fairways added
  // by hand - their list in the layout, their edit's letter (holeedits.mjs)
  // and their kind. null for any other tool.
  const shapeTool = () => SHAPE_TOOLS[ui.tool === "fairway" ? (ui.mode.fairway === "more" && stored().source !== "map" ? "more" : "") : ui.tool] ?? null;
  const shown = () => (pending ? addEdit(stored(), pending) : stored());

  const note = (text) => {
    const n = $("#hand-note");
    n.textContent = text;
    n.hidden = !text;
    clearTimeout(noteTimer);
    if (text) noteTimer = setTimeout(() => (n.hidden = true), 3500);
  };

  // ---- Changing the list -------------------------------------------------------------

  const setEdits = (edits) => {
    const L = { ...stored() };
    if (edits.length) L.edits = edits;
    else delete L.edits;
    save(L);
  };
  // Adds an edit if it does something; says why not if it doesn't. `name`
  // is what Undo and the list of steps call it.
  const commit = (edit, refused = NO_SHAPE, name = steps.stepName(edit)) => {
    const before = stored();
    const next = addEdit(before, edit);
    if (next === before) {
      note("This hole has had as many changes as it can keep. Put it back as it was to start again.");
      return false;
    }
    const out = withEdits(next);
    if (out.applied[out.applied.length - 1] === false) {
      note(refused);
      return false;
    }
    // Nor one that would undo something done earlier (a pond put in by
    // hand, say, that a bigger green would cover).
    const was = withEdits(before);
    const worked = new Map((before.edits ?? []).map((e, i) => [e, was.applied?.[i]]));
    if (next.edits.some((e, i) => worked.get(e) === true && out.applied[i] === false)) {
      note(refused);
      return false;
    }
    save(next);
    remember(name, next.edits);
    return true;
  };
  // A step done: the hole's changes are now `edits`.
  const remember = (name, edits) => keep(steps.record(history(), name, edits));
  // Back or forward to step i of the history.
  const goTo = (i) => {
    const was = history();
    const r = steps.goTo(was, i);
    if (r.h.at === was.at) return;
    const before = edited();
    keep(r.h);
    setEdits(r.edits);
    // What was picked may have moved or gone.
    ui.picked = [];
    if (ui.selected && (ui.selected.list === "fairways" ? !pickedFairway(edited()) : shapeAt(edited()[ui.selected.list], ui.selected.at, 0.2) < 0)) ui.selected = null;
    if (ui.path && pathAt(edited().paths ?? [], ui.path.at, 0.6) < 0) ui.path = null;
    // A bunker or pond that moved, grew or changed depth: pick it if its
    // tool's in hand, and keep it on the map, so undo is seen to do
    // something - and say what was done.
    const after = edited();
    for (const list of ["bunkers", "water", "extraFairways"]) {
      const old = new Set((before[list] ?? []).map((b) => JSON.stringify(b)));
      const changed = (after[list] ?? []).find((b) => !old.has(JSON.stringify(b)));
      if (!changed) continue;
      if (shapeTool()?.list === list) ui.selected = { list, at: [r2(changed.x), r2(changed.z)] };
      if (ui.tool === "bunkers" && list === "bunkers") lookAtBunker(changed);
      else keepOnMap(changed);
      break;
    }
    const name = (k) => was.steps[k].name || "before these changes";
    note(i === was.at - 1 ? `Undone: ${name(was.at)}` : i === was.at + 1 ? `Done again: ${name(i)}` : `Back to: ${name(i)}`);
    refresh();
  };
  const undo = () => steps.canUndo(history()) && goTo(history().at - 1);
  const redo = () => steps.canRedo(history()) && goTo(history().at + 1);
  active = { undo, redo, el };

  // ---- Other holes' ground ---------------------------------------------------------
  //
  // Other holes' shapes on this hole's map are drawn red and left alone (the
  // owner: "hole nine shows but is not amendable until you click hole
  // nine"): a tap on one says whose it is, with the way to that hole - and,
  // on a hole from the map, a way to say it's this hole's after all.

  const foreign = () => others?.() ?? { shapes: [], lines: [], trees: [] };
  const KIND_WORD = { trees: "tree", decor: "decor",  greens: "green", tees: "tee", fairways: "fairway", bunkers: "bunker", water: "water" };
  const shapeKey = (poly) => {
    const [x, z] = polygonCentroid(poly);
    return `${Math.round(x * 10)},${Math.round(z * 10)},${poly.length}`;
  };
  // The other hole's shape under a spot: the smallest one there.
  // Another hole's tree under a spot (within its crown, or a few pixels).
  const foreignTreeAt = (p) => {
    let best = null;
    let bd = Infinity;
    for (const t of foreign().trees ?? []) {
      const d = Math.hypot(t.at[0] - p[0], t.at[1] - p[1]);
      const reach = Math.max(3 * (t.size ?? 1), 8 / (fit?.scale || 1));
      if (d <= reach && d < bd) {
        bd = d;
        best = t;
      }
    }
    return best;
  };
  // The other hole whose fairway, green or tee is under a spot: no tree of
  // this hole may stand there (sim/treeclear.mjs; a gap between holes is
  // fine, so a thin row or none is the designer's choice).
  const neighbourGroundAt = (p) =>
    foreign().shapes.find((f) => (f.list === "fairways" || f.list === "greens" || f.list === "tees") && f.poly?.length > 2 && insidePolygon(f.poly, p[0], p[1])) ?? null;
  const noTreeThere = (f, what = "Trees") => `${what} can't go on hole ${f.number}'s ${KIND_WORD[f.list]}: put ${what === "Trees" ? "them" : "it"} in the gap between the holes, or on this hole's own ground.`;
  // This hole's placed decor nearest a spot, within reach.
  const decorNear = (L, p, reach) => {
    let best = null;
    let bd = reach;
    for (const d of L.decor ?? []) {
      const dd = Math.hypot(d[0] - p[0], d[1] - p[1]);
      if (dd <= bd) {
        bd = dd;
        best = d;
      }
    }
    return best;
  };
  const foreignAt = (p) => {
    const tree = foreignTreeAt(p);
    if (tree) return tree;
    let best = null;
    let area = Infinity;
    for (const f of foreign().shapes) {
      if (!insidePolygon(f.poly, p[0], p[1])) continue;
      const a = Math.abs(polygonArea(f.poly));
      if (a < area) {
        area = a;
        best = f;
      }
    }
    return best;
  };
  // The other hole's entry for one of this hole's own list's shapes, if it's
  // another hole's (a mapped hole's box has its neighbours' too).
  const foreignOf = (list, s) => {
    const poly = s?.poly ?? (Array.isArray(s) ? s : null);
    if (!poly || poly.length < 3) return null;
    const key = shapeKey(poly);
    return foreign().shapes.find((f) => f.list === list && f.k != null && shapeKey(f.poly) === key) ?? null;
  };
  const sameForeign = (a, b) => !!a && !!b && a.list === b.list && a.index === b.index && !!a.poly && !!b.poly && shapeKey(a.poly) === shapeKey(b.poly);
  // The other hole nearest a shape of this one: { index, number }.
  const nearestOther = (poly) => {
    const [x, z] = polygonCentroid(poly);
    let best = null;
    let bd = Infinity;
    for (const h of foreign().lines ?? []) {
      for (let i = 1; i < h.line.length; i++) {
        const d = lineDistance([h.line[i - 1], h.line[i]], x, z);
        if (d < bd) {
          bd = d;
          best = h;
        }
      }
    }
    return best;
  };
  function othersOverlay(ctx) {
    const { shapes, trees = [] } = foreign();
    if (!shapes.length && !trees.length) return;
    ctx.save();
    // Other holes' trees: a red ring, locked (a tap says whose).
    for (const t of trees) {
      const [x, y] = px(t.at);
      if (x < -20 || y < -20 || x > canvas.width + 20 || y > canvas.height + 20) continue;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(3, 2.5 * (t.size ?? 1) * fit.scale), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(229, 72, 77, 0.25)";
      ctx.fill();
      ctx.lineWidth = ui.foreign === t ? 3 : 1.25;
      ctx.strokeStyle = "#ff5a4f";
      ctx.stroke();
    }
    for (const f of shapes) {
      ctx.beginPath();
      f.poly.forEach((q, i) => (i ? ctx.lineTo(...px(q)) : ctx.moveTo(...px(q))));
      ctx.closePath();
      ctx.fillStyle = f.list === "fairways" ? "rgba(229, 72, 77, 0.3)" : "rgba(229, 72, 77, 0.5)";
      ctx.fill();
      ctx.lineWidth = sameForeign(ui.foreign, f) ? 3.5 : 1.5;
      ctx.strokeStyle = "#ff5a4f";
      ctx.setLineDash(f.list === "fairways" ? [7, 5] : []);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // Each other hole's number once: on its green, else its biggest shape
    // on the map.
    const spots = new Map();
    for (const f of shapes) {
      if (f.number == null) continue;
      const [cx, cy] = px(polygonCentroid(f.poly));
      if (cx < 12 || cy < 12 || cx > canvas.width - 12 || cy > canvas.height - 12) continue;
      const rank = (f.list === "greens" ? 1e9 : 0) + Math.abs(polygonArea(f.poly));
      if (!spots.has(f.number) || spots.get(f.number).rank < rank) spots.set(f.number, { rank, at: [cx, cy] });
    }
    for (const [n, { at }] of spots) {
      ctx.beginPath();
      ctx.arc(at[0], at[1], 12, 0, Math.PI * 2);
      ctx.fillStyle = "#c92a2a";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n), at[0], at[1] + 0.5);
    }
    ctx.restore();
  }

  // ---- Drawing ----------------------------------------------------------------------

  const draw = () => {
    frame = 0;
    const view = ui.view.zoom > 1 ? ui.view : null;
    const S = shown();
    // With the Paths tool, the map takes in the whole of the paths between
    // holes to and from this one.
    const box = linksBox();
    fit = drawHole(canvas, S, box ? { view, wide: true, box } : { view });
    // With the Ground tool: the ground's heights shaded over the map.
    if (ui.tool === "ground") groundRelief(canvas.getContext("2d"), withEdits(S));
    overlay(canvas.getContext("2d"), withEdits(S), S);
    othersOverlay(canvas.getContext("2d"));
  };
  const redraw = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };
  const px = (p) => fit.toCanvas(p);
  const dot = (ctx, [x, y], r, fill = "#ffffff", ring = "#1b1b1b") => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = ring;
    ctx.stroke();
  };
  const outline = (ctx, pts, color, dash = []) => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(...px(p)) : ctx.moveTo(...px(p))));
    ctx.closePath();
    ctx.setLineDash(dash);
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.setLineDash([]);
  };
  const brushRadius = () => (ui.tool === "green" ? sculpt.RINGS[ui.shaping.ring] : ui.tool === "ground" ? BRUSH_SIZES[ui.ground.size] : edgeBrush(ui.tool, ui.mode[ui.tool]) ? edgeReach() / 2 : ui.brush === "big" ? 14 : 6);
  // How far along the line one rub of the edge brushes reaches.
  const edgeReach = () => (ui.brush === "big" ? 28 : 14);

  // The ground's heights as shaded relief: low ground green, high ground
  // brown, a band of light and dark every metre (every 2 m, or 5 m, where
  // the ground rises a lot) to read the slopes by, lit from the top left.
  function groundRelief(ctx, L) {
    if (!L.terrain) return;
    const g = unpackGrid(L.terrain);
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of g.h) {
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    const span = Math.max(0.5, hi - lo);
    const band = span > 40 ? 5 : span > 15 ? 2 : 1;
    const size = Math.max(1, g.cell * fit.scale + 0.6);
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let j = 0; j < g.nz; j++) {
      for (let i = 0; i < g.nx; i++) {
        const x = g.x0 + i * g.cell;
        const z = g.z0 + j * g.cell;
        const [cx, cy] = px([x, z]);
        if (cx < -size || cy < -size || cx > canvas.width + size || cy > canvas.height + size) continue;
        const h = g.h[j * g.nx + i];
        const t = (h - lo) / span;
        const shade = gridHeight(g, x - g.cell, z) - gridHeight(g, x + g.cell, z) + gridHeight(g, x, z - g.cell) - gridHeight(g, x, z + g.cell);
        const light = Math.max(0.55, Math.min(1.35, 1 + shade * 0.35)) * (Math.floor(h / band) % 2 ? 0.92 : 1.05);
        const r = Math.round((70 + t * 110) * light);
        const gr = Math.round((120 + t * 30 - t * t * 40) * light);
        const b = Math.round((60 + t * 10) * light);
        ctx.fillStyle = `rgb(${r},${gr},${b})`;
        ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
      }
    }
    ctx.restore();
  }

  function overlay(ctx, L, S) {
    const tool = ui.tool;
    const mode = ui.mode[tool];
    const refused = pending && S !== stored() && L.applied?.[L.applied.length - 1] === false;
    // Placed decor (sim/decor.mjs): a small dot in its colour, with the
    // Decor tool or not.
    for (const d of L.decor ?? []) {
      const [x, y] = px([d[0], d[1]]);
      ctx.beginPath();
      ctx.arc(x, y, tool === "decor" ? 6 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = DECOR_COLOURS[d[2]] ?? "#888";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
    }
    if (tool === "trees") {
      // Each tree in its kind's colour (the key under the map).
      const kinds = treeKinds(L);
      L.trees.forEach((t, i) => {
        ctx.beginPath();
        ctx.arc(...px(t), Math.max(3, crownOf(t) * 0.55 * fit.scale), 0, Math.PI * 2);
        ctx.fillStyle = MAP_TREE_KINDS[kinds[i]] ?? MAP_COLORS.tree;
        ctx.fill();
      });
      // Its signature tree (sim/signaturetree.mjs), standing: in its kind's
      // colour, ringed in gold.
      const sig = signatureNow();
      if (sig?.standing && !keptNow()) {
        const r = Math.max(5, crownOf(sig.tree) * 0.55 * fit.scale);
        ctx.beginPath();
        ctx.arc(...px(sig.tree), r, 0, Math.PI * 2);
        ctx.fillStyle = MAP_TREE_KINDS[sig.tree[3]] ?? MAP_COLORS.tree;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = "#f0c419";
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // Picked trees ringed in yellow (where they're being dragged to).
      const picked = pickedTrees(L);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffd23f";
      for (const t of picked) {
        ctx.beginPath();
        ctx.arc(...px(t), Math.max(5, crownOf(t) * 0.8 * fit.scale) + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Trees that can't go where they're being dragged: red rings there.
      if (pending?.k === "tm") {
        ctx.strokeStyle = "#ff6b5e";
        for (const [x, z] of pending.p) {
          const to = [x + pending.d[0], z + pending.d[1]];
          if (L.trees.some((t) => Math.abs(t[0] - to[0]) + Math.abs(t[1] - to[1]) < 0.1)) continue;
          ctx.beginPath();
          ctx.arc(...px(to), 7, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      if (gesture?.type === "lasso" && gesture.ring.length > 1) {
        ctx.beginPath();
        gesture.ring.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = "#ffd23f";
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    if (tool === "green") relief(ctx, L, S);
    if ((tool === "trees" && (mode === "plant" || mode === "remove")) || (tool === "green" && mode === "brush") || (tool === "ground" && mode !== "tilt") || edgeBrush(tool, mode)) {
      const at = gesture?.last ?? hover;
      if (at) {
        // The ring the brush works inside: dashed at its edge, where it
        // fades to nothing, with its middle marked.
        const shaping = tool === "green";
        ctx.beginPath();
        ctx.arc(...at, brushRadius() * fit.scale, 0, Math.PI * 2);
        ctx.lineWidth = shaping ? 3 : 2;
        ctx.strokeStyle = mode === "remove" || (shaping && ui.shaping.action === "lower") ? "#ff8a80" : shaping && ui.shaping.action === "smooth" ? "#8fd3ff" : "#ffffff";
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (shaping) dot(ctx, at, 3, ctx.strokeStyle);
      }
    }
    const shapes = shapeTool();
    if (shapes) {
      const list = L[shapes.list] ?? [];
      for (const s of list) outline(ctx, shapeLine(s), "rgba(255,255,255,0.35)", [3, 3]);
      const sel = selectedShape(L);
      if (sel) {
        outline(ctx, shapeLine(sel), "#ffffff");
        // Its wall drawn over the white outline, thick, in what it's built
        // of with a dark edge, and labelled just outside - so it's plain
        // which way round between the yellow dots it runs.
        const wall = wallOf(sel);
        if (wall) {
          const pts = wallLine(sel).pts.map(px);
          ctx.save();
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.beginPath();
          pts.forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q)));
          ctx.lineWidth = 9;
          ctx.strokeStyle = "rgba(0,0,0,0.7)";
          ctx.stroke();
          ctx.lineWidth = 5;
          const W = MAP_COLORS.walls;
          ctx.strokeStyle = tool === "water" ? ([W.timber, W.brick, W.rock][wall.m ?? 0] ?? W.timber) : wall.m === 1 ? W.timber : W.turf;
          ctx.stroke();
          ctx.restore();
          const mid = pts[Math.floor(pts.length / 2)];
          const c = px([sel.x, sel.z]);
          const away = Math.hypot(mid[0] - c[0], mid[1] - c[1]) || 1;
          label(ctx, "wall", [mid[0] + ((mid[0] - c[0]) / away) * 18, mid[1] + ((mid[1] - c[1]) / away) * 18 + 5], "#ffd23f");
        }
        dot(ctx, sizeHandle(sel), 9);
        // A pond's marks round its edge, blue, to pull it in or push it
        // out there (course.mjs EDGE_MARKS) - and an added fairway's.
        if (shapes.k !== "b" && !sel.brook) for (const q of edgeMarks(sel)) dot(ctx, px(q), 6, "#8fd3ff");
        // Its wall's ends: yellow dots to drag round the edge.
        for (const q of wallEnds(sel)) dot(ctx, px(q), 8, "#ffd23f");
      }
      // A wall being dragged too short or too long.
      if (gesture?.wallBad) label(ctx, "Can't go here", [gesture.last[0], gesture.last[1] - 16], "#ff6b5e");
      // Being dragged somewhere it can't go: its outline there, in red.
      if (refused && pending.k === shapes.k) {
        const was = edited()[shapes.list] ?? [];
        const i = shapeAt(was, pending.at, 0.2);
        if (i >= 0) {
          const s = was[i];
          const [dx, dz] = pending.d ?? [0, 0];
          const f = pending.f ?? 1;
          const line = (pending.h ? shapeLine(reshapeShape(s, pending.h)) : shapeLine(s)).map(([x, z]) => [s.x + (x - s.x) * f + dx, s.z + (z - s.z) * f + dz]);
          outline(ctx, line, "#ff6b5e", [6, 4]);
          // (Saying why: the tee, the cup, off the hole's ground...)
          label(ctx, SHAPE_TROUBLE[troubleOf(pending)] ?? "Can't go here", px([s.x + dx, s.z + dz]), "#ff6b5e");
        }
      }
    }
    // An island green's causeway (sim/causeway.mjs), with the Fairway
    // tool's Causeway: outlined, and a yellow dot at its land end to aim it.
    if (tool === "fairway" && mode === "causeway" && L.source !== "map") {
      for (const c of causeways(L)) {
        outline(ctx, causewayOutline(c), "#ffffff");
        dot(ctx, px(c.b), 9, "#ffd23f");
      }
    }
    if (tool === "fairway") {
      // Each fairway of a hole from a map or on hills outlined, the picked
      // one in white.
      const list = fairwaysOf(L);
      const pick = pickedFairway(L);
      for (const f of list) if (!pick || !sameSpot(f.at, pick.at)) outline(ctx, f.poly, "rgba(255,255,255,0.45)", [4, 4]);
      if (pick) outline(ctx, pick.poly, "#ffffff");
    }
    if (tool === "paths") pathOverlay(ctx, L, refused);
    if (tool === "brooks") brookOverlay(ctx, L);
    if (tool === "green") {
      const g0 = S.green; // as generated or mapped: the handles are sizes against it
      const st = editState(S.edits);
      // Bumps (light) and hollows (dark) rubbed in, so they can be seen.
      for (const e of S.edits ?? []) {
        if (e.k !== "bump") continue;
        ctx.fillStyle = e.a > 0 ? "rgba(255,255,255,0.28)" : "rgba(10,40,10,0.35)";
        for (const q of e.p) {
          ctx.beginPath();
          ctx.arc(...px(q), Math.max(3, BUMP.s * 0.8 * fit.scale), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (refused && pending.k === "g") outline(ctx, reshapeGreen(g0, { h: pending.h, f: pending.f }).poly, "#ff6b5e", [6, 4]);
      // Shapes stamped on: outlined, light for raised and dark for lowered,
      // with their height; the picked one with its handles.
      const stamps = st.sculpt?.s ?? [];
      stamps.forEach((sp, i) => {
        const picked = mode === "stamps" && i === ui.shaping.picked;
        if (mode !== "stamps" && mode !== "brush") return;
        outline(ctx, sculpt.stampOutline(sp), sp[6] > 0 ? "#ffffff" : "#1b3a1b", picked ? [] : [5, 4]);
        if (mode !== "stamps") return;
        label(ctx, `${sp[6] > 0 ? "+" : ""}${Math.round(sp[6] * 100)} cm`, px([sp[1], sp[2]]), sp[6] > 0 ? "#ffffff" : "#d8ffd8");
        if (picked) {
          const hd = sculpt.stampHandles(sp);
          dot(ctx, px(hd.end), 9);
          dot(ctx, px(hd.side), 8, "#ffd23f");
        }
      });
      // The area being outlined: its dots, and the shape they make.
      if (mode === "area" && ui.shaping.area.length) {
        const a = ui.shaping.area;
        if (a.length > 1) {
          ctx.beginPath();
          a.forEach((q, k) => (k ? ctx.lineTo(...px(q)) : ctx.moveTo(...px(q))));
          if (a.length > 2) ctx.closePath();
          ctx.setLineDash([6, 4]);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = "#ffd23f";
          ctx.stroke();
          ctx.setLineDash([]);
          if (a.length > 2) {
            ctx.fillStyle = "rgba(255,210,63,0.14)";
            ctx.fill();
          }
        }
        a.forEach((q) => dot(ctx, px(q), 6, "#ffd23f"));
      }
      if (mode === "shape") {
        for (const h of greenHandles(g0, st.green)) dot(ctx, px(h), 8);
        const [x, y] = px(L.pin);
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#ffd23f";
        ctx.stroke();
      }
      // Which way it slopes, whatever the mode (faintly unless tilting).
      const { a, n } = st.tilt;
      const g = L.green;
      if (n > 0 || mode === "tilt") {
        ctx.globalAlpha = mode === "tilt" ? 1 : 0.6;
        if (n > 0) {
          const len = Math.max(g.rx, g.rz) * (0.35 + n * 0.2);
          arrow(ctx, [g.x - Math.cos(a) * len * 0.5, g.z - Math.sin(a) * len * 0.5], [g.x + Math.cos(a) * len * 0.5, g.z + Math.sin(a) * len * 0.5]);
        }
        const [x, y] = px([g.x, g.z]);
        label(ctx, n > 0 ? `Slopes down: ${TILTS[n].name.toLowerCase()}` : "Level", [x, y - Math.max(g.rx, g.rz) * fit.scale - 12]);
        ctx.globalAlpha = 1;
      }
    }
  }
  // ---- Cart paths ----------------------------------------------------------------

  // The picked path, where it is now (following a drag): its place in the
  // hole's list of paths, or -1.
  function pickedPath(L) {
    if (!ui.path) return -1;
    let at = ui.path.at;
    if (pending?.k === "p" && pending.d && gesture && (gesture.type === "pathDot" || gesture.type === "pathMove")) at = [at[0] + pending.d[0], at[1] + pending.d[1]];
    return pathAt(L.paths ?? [], at, 0.6);
  }
  // The paths between holes to and from this one (worked out once for the
  // course as it is: the designer's links()), shown and changed with the
  // Paths tool.
  const holeLinks = () => (links && ui.tool === "paths" ? links() ?? [] : []);
  // Where they run, with a little round them: a box in the hole's frame,
  // or null.
  const linksBox = () => {
    const pts = holeLinks().flatMap((l) => l.line ?? []);
    if (!pts.length) return null;
    const xs = pts.map((q) => q[0]);
    const zs = pts.map((q) => q[1]);
    return { x0: Math.min(...xs) - 8, x1: Math.max(...xs) + 8, z0: Math.min(...zs) - 8, z1: Math.max(...zs) + 8 };
  };
  // The picked one, or null.
  const pickedLink = () => (ui.link ? holeLinks().find((l) => !l.removed && l.number === ui.link.number) ?? null : null);
  // Its dots to drag: as drawn, or a worked-out line's bends (few enough
  // to take hold of).
  const linkDots = (l) => {
    if (l.hand) return l.line;
    let tol = 1;
    let pts = fewerPoints(l.line, tol);
    while (pts.length > MAX_POINTS) pts = fewerPoints(l.line, (tol *= 1.5));
    return pts.map(([x, z]) => [r2(x), r2(z)]);
  };
  // How far a spot is from a line, and where a new dot on it would go
  // (after the dot before the nearest stretch).
  const lineGap = (pts, [x, z]) => {
    let best = Infinity;
    let seg = 1;
    for (let j = 1; j < pts.length; j++) {
      const [ax, az] = pts[j - 1];
      const [bx, bz] = pts[j];
      const dx = bx - ax;
      const dz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      const d = Math.hypot(x - ax - t * dx, z - az - t * dz);
      if (d < best) {
        best = d;
        seg = j;
      }
    }
    return { d: best, seg };
  };
  // The owner's line for one: changed by the designer (false where a path
  // can't go there - said so).
  const putLink = (n, line) => {
    if (!drawLink) return false;
    const ok = drawLink(n, line);
    if (!ok) note(NO_LINK);
    return ok;
  };
  // A line through points on the map.
  const trace = (ctx, pts, color, width = 2, dash = []) => {
    ctx.beginPath();
    pts.forEach((q, i) => (i ? ctx.lineTo(...px(q)) : ctx.moveTo(...px(q))));
    ctx.setLineDash(dash);
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.setLineDash([]);
  };
  // The picked path's line and its bends (white dots; the one tapped in
  // yellow); a path being dragged where it can't go, in red; the dots of a
  // path being drawn, red where it can't go.
  function pathOverlay(ctx, L, refused) {
    // The paths between holes: dashed as worked out, solid as drawn; the
    // picked one with its dots (following a drag).
    for (const l of holeLinks()) {
      if (l.removed) continue;
      const picked = ui.link?.number === l.number;
      const dragged = (gesture?.type === "linkDot" || gesture?.type === "linkLine") && gesture.number === l.number && gesture.line ? gesture.line : null;
      const dots = dragged ?? (picked ? linkDots(l) : null);
      trace(ctx, dots ? pathLine({ p: dots }).pts : l.line, picked || dragged ? "#ffd23f" : "rgba(255,210,63,0.75)", picked || dragged ? 3 : 2, l.hand || dots ? [] : [6, 4]);
      if (dots) dots.forEach((q, k) => dot(ctx, px(q), 7, k === ui.link?.dot ? "#ffd23f" : "#ffffff"));
    }
    const i = pickedPath(L);
    if (i >= 0) {
      const path = L.paths[i];
      trace(ctx, pathLine(path).pts, "rgba(255,255,255,0.85)", 1.5);
      path.p.forEach((q, k) => dot(ctx, px(q), 8, k === ui.path.dot ? "#ffd23f" : "#ffffff"));
    }
    if (refused && pending.k === "p" && pending.d) {
      const change = pathChange(edited(), pending);
      if (change?.next) {
        trace(ctx, pathLine(change.next).pts, "#ff6b5e", 3, [6, 4]);
        label(ctx, "Can't go here", px(pending.at.map((v, k) => v + pending.d[k])), "#ff6b5e");
      }
    }
    const pts = ui.drawing;
    if (pts?.length) {
      const trouble = pts.length > 1 ? pathTrouble({ ...L, paths: [] }, { p: pts }) : null;
      const bad = trouble && trouble !== "too short";
      const colour = bad ? "#ff6b5e" : "#ffffff";
      if (pts.length > 1) trace(ctx, pathLine({ p: pts }).pts, colour, 3, [6, 4]);
      pts.forEach((q) => dot(ctx, px(q), 6, colour));
      if (bad) label(ctx, "Can't go here", [px(pts[pts.length - 1])[0], px(pts[pts.length - 1])[1] - 14], "#ff6b5e");
    }
  }
  // The spot on a path's line nearest p, to two decimals.
  const nearestOn = (path, [x, z]) => nearestOnPath(path, x, z).at.map(r2);
  // Why a path edit can't be done, in a word to the owner.
  const pathWhy = (edit) => {
    const L = edited();
    const change = pathChange(L, edit);
    const why = change?.next ? pathTrouble({ ...L, paths: [] }, change.next) : null;
    return PATH_WHY[why] ?? NO_PATH;
  };
  // A path edit made, saying so if trees in its way went with it.
  const commitPath = (edit, name) => {
    const trees = edited().trees.length;
    const ok = commit(edit, pathWhy(edit), name);
    if (ok && edited().trees.length < trees) note(TREES_GONE);
    return ok;
  };

  // ---- Brooks (sim/brooks.mjs) --------------------------------------------------------

  // The picked brook, where it is now (following a drag): its place in the
  // hole's water, or -1.
  function pickedBrook(L) {
    if (!ui.brook) return -1;
    let at = ui.brook.at;
    if (pending?.k === "r" && pending.p && gesture?.d && (gesture.type === "brookDot" || gesture.type === "brookMove")) at = [at[0] + gesture.d[0], at[1] + gesture.d[1]];
    return brookAt(L.water, at[0], at[1], 3);
  }
  // A brook's two banks named as they lie on the hole: a brook across it
  // has a tee side and a green side; one running along it, a left and a
  // right (looking down the hole).
  const bankNames = (L, b) => {
    const line = brookLine(b);
    const mid = alongLine(line, 0.5);
    const half = brookHalf(b) + 1;
    const at = (side) => [mid.p[0] - mid.dir[1] * half * (side ? -1 : 1), mid.p[1] + mid.dir[0] * half * (side ? -1 : 1)];
    const path = makePath(L.path);
    const [n0, n1] = [nearest(path, ...at(0)), nearest(path, ...at(1))];
    if (Math.abs(n0.s - n1.s) > half) return n0.s < n1.s ? ["tee side", "green side"] : ["green side", "tee side"];
    return n0.d < n1.d ? ["left bank", "right bank"] : ["right bank", "left bank"];
  };
  // Every brook's line (the picked one's solid, with its dots), each walled
  // stretch of bank in what it's built of, the first tap of a stretch being
  // walled, a burn that can be made a brook, and a brook being drawn - red
  // where it can't go.
  function brookOverlay(ctx, L) {
    const i = pickedBrook(L);
    const W = MAP_COLORS.walls;
    L.water.forEach((w, j) => {
      if (!w.brook) {
        if (w.burn && !ui.brookDraw) trace(ctx, blobOutline(w, 96).concat([blobOutline(w, 96)[0]]), "rgba(255,255,255,0.4)", 1.5, [4, 4]);
        return;
      }
      const picked = j === i;
      trace(ctx, brookLine(w.brook).pts, picked ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)", picked ? 2 : 1.5, picked ? [] : [5, 4]);
      for (const v of wallViews(w)) trace(ctx, wallLine(v).pts, [W.timber, W.brick, W.rock][v.wall.m ?? 0] ?? W.timber, 5);
      if (picked) w.brook.p.forEach((q, k) => dot(ctx, px(q), 8, k === ui.brook.dot ? "#ffd23f" : "#ffffff"));
    });
    if (ui.bank?.first && i >= 0) dot(ctx, px(ui.bank.first.at), 7, "#ffd23f");
    const pts = ui.brookDraw;
    if (pts?.length) {
      let colour = "#ffffff";
      if (pts.length > 1) {
        const shape = brookShape({ p: pts, kind: ui.brookKind });
        const tooShort = brookLine(shape.brook).length < 8;
        if (!tooShort && !brookFits(L, shape)) colour = "#ff6b5e";
        trace(ctx, shape.poly.concat([shape.poly[0]]), colour === "#ffffff" ? "rgba(140,200,255,0.9)" : colour, 2, [6, 4]);
      }
      pts.forEach((q) => dot(ctx, px(q), 6, colour));
      if (colour !== "#ffffff") label(ctx, "Can't go here", [px(pts[pts.length - 1])[0], px(pts[pts.length - 1])[1] - 14], colour);
    }
  }
  // A tap while a stretch of bank is being walled: the first says where it
  // starts and which bank (in the water: both), the second where it ends.
  function bankTap(at) {
    const L = edited();
    const i = pickedBrook(L);
    if (i < 0) return;
    const w = L.water[i];
    const line = brookLine(w.brook);
    const q = nearestOnLine(line, at[0], at[1]);
    const a = alongLine(line, q.u);
    const left = (at[0] - a.p[0]) * -a.dir[1] + (at[1] - a.p[1]) * a.dir[0];
    const side = q.d < brookHalf(w.brook) * 0.5 ? 2 : left > 0 ? 0 : 1;
    if (!ui.bank.first) {
      ui.bank.first = { u: q.u, side, at };
      return;
    }
    const f = ui.bank.first;
    let s = [Math.min(f.u, q.u), Math.max(f.u, q.u)];
    // (At least 2 m of wall.)
    const least = Math.min(1, 2 / line.length);
    if (s[1] - s[0] < least) {
      const m = (s[0] + s[1]) / 2;
      s = [Math.max(0, m - least / 2), Math.min(1, m + least / 2)];
    }
    s = s.map((v) => Math.round(v * 1000) / 1000);
    ui.bank = null;
    walls(w, f.side === 2 ? [0, 1] : [f.side], s, "wall a stretch of the brook's bank");
  }
  // Walls put on the brook's banks (sides 0 and/or 1) from s[0] to s[1] of
  // the way along, joined to any already there.
  function walls(w, sides, s, name) {
    const banks = joinBanks([...(w.brook.banks ?? []), ...sides.map((side) => ({ side, s, m: ui.bankM }))]);
    if (commit({ k: "r", at: ui.brook.at, banks }, NO_BROOK, name)) note("Walled: the grass runs level to the edge there, and drops straight down to the water.");
  }
  // A burn the hole was made with (sim/course.mjs burnFor) made a brook,
  // to change as any brook: drawn through dots along its middle.
  // (A burn saved before burns were brooks is made one as it's read -
  // sim/brooks.mjs burnsAsBrooks - but one could still come in another
  // way.)
  function burnToBrook(w) {
    const { p: dots, w: width } = burnBrook(w);
    const L = edited();
    if (!brookFits({ ...L, water: L.water.filter((x) => x !== w) }, brookShape({ p: dots, kind: 0, w: width }))) return note(NO_BROOK);
    if (!commit({ k: "w-", at: [w.x, w.z] }, NO_SHAPE, "take the burn away")) return;
    if (commit({ k: "r+", p: dots, kind: 0, w: width }, NO_BROOK, "make the burn a brook")) {
      ui.brook = { at: dots[Math.floor(dots.length / 2)], dot: -1 };
      note("The burn's a brook now: drag its dots, wall its banks, or make it a ditch or a stream.");
    }
  }

  // The green's shape, shaded as if lit from the top left, so its humps and
  // hollows show; faint lines every 5 cm of height; red where it's too
  // steep for a ball to stop.
  function relief(ctx, L, S) {
    const surf = surfaceOf(L, S);
    const edge = blobOutline(L.green, 64, 1.6);
    const green = blobOutline(L.green, 64);
    const b = edge.reduce((a, [x, z]) => ({ x0: Math.min(a.x0, x), x1: Math.max(a.x1, x), z0: Math.min(a.z0, z), z1: Math.max(a.z1, z) }), { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity });
    const step = Math.max(0.5, 3 / fit.scale);
    const c0 = fit.fromCanvas([0, 0]);
    const c1 = fit.fromCanvas([-1, -1]);
    const ll = Math.hypot(c1[0] - c0[0], c1[1] - c0[1]) || 1;
    const lx = (c1[0] - c0[0]) / ll;
    const lz = (c1[1] - c0[1]) / ll;
    ctx.save();
    ctx.beginPath();
    edge.forEach((q, i) => (i ? ctx.lineTo(...px(q)) : ctx.moveTo(...px(q))));
    ctx.closePath();
    ctx.clip();
    const nx = Math.ceil((b.x1 - b.x0) / step) + 1;
    const nz = Math.ceil((b.z1 - b.z0) / step) + 1;
    const band = new Int32Array(nx * nz);
    for (let iz = 0; iz < nz; iz++) {
      for (let ix = 0; ix < nx; ix++) {
        const x = b.x0 + ix * step;
        const z = b.z0 + iz * step;
        const [gx, gz] = greenGradient(surf, x, z);
        band[iz * nx + ix] = Math.floor(greenHeight(surf, x, z) / 0.05);
        const lit = -(gx * lx + gz * lz) * 14;
        const steep = Math.hypot(gx, gz) > sculpt.PUTTABLE.steep && insidePolygon(green, x, z);
        ctx.fillStyle = steep ? "rgba(255,70,60,0.55)" : lit > 0 ? `rgba(255,255,235,${Math.min(0.55, lit)})` : `rgba(0,30,0,${Math.min(0.55, -lit)})`;
        const [cx, cy] = px([x - step / 2, z - step / 2]);
        const [dx, dy] = px([x + step / 2, z + step / 2]);
        ctx.fillRect(Math.min(cx, dx), Math.min(cy, dy), Math.abs(dx - cx) + 0.6, Math.abs(dy - cy) + 0.6);
      }
    }
    ctx.fillStyle = "rgba(20,50,20,0.55)";
    for (let iz = 0; iz < nz - 1; iz++) {
      for (let ix = 0; ix < nx - 1; ix++) {
        const i = iz * nx + ix;
        if (band[i] !== band[i + 1] || band[i] !== band[i + nx]) {
          const [cx, cy] = px([b.x0 + (ix + 0.5) * step, b.z0 + (iz + 0.5) * step]);
          ctx.fillRect(cx - 1, cy - 1, 2, 2);
        }
      }
    }
    ctx.restore();
  }
  const label = (ctx, text, [x, y], color = "#ffffff") => {
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  };
  const arrow = (ctx, from, to) => {
    const a = px(from);
    const b = px(to);
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(b[0] + Math.cos(ang) * 6, b[1] + Math.sin(ang) * 6);
    ctx.lineTo(b[0] + Math.cos(ang + 2.5) * 16, b[1] + Math.sin(ang + 2.5) * 16);
    ctx.lineTo(b[0] + Math.cos(ang - 2.5) * 16, b[1] + Math.sin(ang - 2.5) * 16);
    ctx.fill();
  };
  const shapeLine = (s) => blobOutline(s, 40);
  // The resize dot: down and to the right on the screen, always clear of
  // the shape however small it's drawn, so a press on the shape moves it.
  const sizeHandle = (s) => {
    const c = px([s.x, s.z]);
    const R = Math.max(s.rx, s.rz) * shapeReach(s) * fit.scale + 18;
    return [c[0] + R * 0.8, c[1] + R * 0.6];
  };
  // A shape's wall's two ends, [] without one.
  const wallEnds = (s) => {
    const line = wallLine(s);
    return line ? [line.pts[0], line.pts[line.pts.length - 1]] : [];
  };
  // Why a shape being dragged, sized or reshaped (edit e) won't go: a
  // SHAPE_TROUBLE key ("size" if it's only too big or too small).
  const troubleOf = (e) => {
    const st = shapeTool();
    const was = edited()[st?.list] ?? [];
    const i = st ? shapeAt(was, e.at, 0.2) : -1;
    if (i < 0) return null;
    let s = was[i];
    if (e.d) s = moveShape(s, e.d[0], e.d[1]);
    if (e.f) s = scaleShape(s, e.f);
    if (e.h) s = reshapeShape(s, e.h);
    return shapeTrouble(edited(), s, st.kind) ?? (e.f ? "size" : null);
  };
  // The causeway's shape changed (holeedits "cw"): the rest as it is.
  const causewayEdit = (change) => {
    const e = { k: "cw", ...causewayLook(edited()), ...change };
    if (!e.to) delete e.to;
    return e;
  };
  // What's picked, where it is now - following a drag as it goes.
  const selectedShape = (L) => {
    const st = shapeTool();
    if (!ui.selected || ui.selected.list !== st?.list) return null;
    let at = ui.selected.at;
    if (pending?.d && pending.k === st.k && pending.at[0] === at[0] && pending.at[1] === at[1]) at = [at[0] + pending.d[0], at[1] + pending.d[1]];
    const list = L[st.list] ?? [];
    const i = shapeAt(list, at, 0.2);
    return i < 0 ? null : list[i];
  };
  // The fairways of a hole from a map or on hills, as they are now, each
  // with its spot (holeedits.mjs fairwayAnchor); none on a designed hole,
  // which has just the one, sized with the slider as it is.
  // (Another hole's, drawn red, isn't one of them.)
  const fairwaysOf = (L) => (L.source === "map" ? (L.fairways ?? []).map((poly, i) => ({ poly, at: L.fairwayAt?.[i] ?? fairwayAnchor(poly) })).filter((f) => !foreignOf("fairways", f.poly)) : []);
  const sameSpot = (a, b) => Math.abs(a[0] - b[0]) < 0.05 && Math.abs(a[1] - b[1]) < 0.05;
  // The picked one, where it is now (following a slide of its width).
  const pickedFairway = (L) => (ui.selected?.list === "fairways" ? (fairwaysOf(L).find((f) => sameSpot(f.at, ui.selected.at)) ?? null) : null);
  const pickedTrees = (L) => {
    if (!ui.picked.length) return [];
    const moving = pending?.k === "tm" ? new Set(pending.p.map((q) => q.join())) : null;
    const spots = ui.picked.map((q) => (moving?.has(q.join()) ? [q[0] + pending.d[0], q[1] + pending.d[1]] : q));
    return L.trees.filter((t) => spots.some((p) => Math.abs(p[0] - t[0]) + Math.abs(p[1] - t[1]) < 0.1));
  };

  // ---- Buttons ----------------------------------------------------------------------

  function refresh() {
    el.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === ui.tool));
    // (A hole from a map's fairways are each picked and sized: no brush.)
    const modes = ui.tool === "fairway" && edited().source === "map" ? null : MODES[ui.tool];
    const mode = modes?.find((m) => m.id === ui.mode[ui.tool]);
    $("#hand-modes").innerHTML = modes
      ? modes.map((m) => `<button data-mode="${m.id}" class="${m.id === mode.id ? "on" : ""}">${m.word}</button>`).join("") +
        (ui.tool === "trees" && (mode.id === "plant" || mode.id === "remove")
          ? `<span class="gap"></span><span>Brush</span><button data-brush="small" class="${ui.brush === "small" ? "on" : ""}">Small</button><button data-brush="big" class="${ui.brush === "big" ? "on" : ""}">Big</button>`
          : "") +
        (edgeBrush(ui.tool, mode.id)
          ? `<span class="gap"></span><span>Brush</span><button data-brush="small" class="${ui.brush === "small" ? "on" : ""}">Short</button><button data-brush="big" class="${ui.brush === "big" ? "on" : ""}">Long</button>`
          : "") +
        (ui.tool === "trees" && (mode.id === "plant" || mode.id === "move")
          ? edited().links
            ? `<span class="gap"></span><label title="What grows on a links hole: gorse, a wind-bent hawthorn, sea buckthorn or a stunted pine - a links hole is mostly open">Plant <select id="plant-kind">${LINKS_PLANTS.map((q) => `<option value="${q.id}" ${q.id === ui.linksPlant ? "selected" : ""}>${q.name}</option>`).join("")}</select></label>`
            : `<span class="gap"></span><label title="What new trees are: all one kind (each still its own shape and size), or mixed as they'd grow on this hole">Plant ${kindSelect("plant-kind", ui.plantKind)}</label>`
          : "")
      : "";
    $("#hand-modes").hidden = !modes;
    const pathHelp = ui.drawing ? DRAWING_HELP : pickedPath(edited()) >= 0 ? PICKED_HELP.paths : pickedLink() ? LINK_HELP : holeLinks().some((l) => !l.removed) ? `${HELP.paths} ${LINKS_HELP}` : HELP.paths;
    const picked = ui.selected && selectedShape(edited());
    const fairwayHelp = edited().source !== "map" ? HELP.fairway : pickedFairway(edited()) ? PICKED_HELP.fairway : FAIRWAYS_HELP;
    const brookHelp = ui.brookDraw ? BROOK_DRAWING_HELP : ui.bank ? BANK_HELP[ui.bank.first ? 1 : 0] : pickedBrook(edited()) >= 0 ? PICKED_HELP.brooks : HELP.brooks;
    $("#hand-help").textContent = (picked && shapeTool()?.list === "extraFairways" ? PICKED_HELP.added : null) ?? mode?.help ?? (ui.tool === "brooks" ? brookHelp : ui.tool === "paths" ? pathHelp : ui.tool === "fairway" ? fairwayHelp : picked ? (wallOf(picked) ? WALL_HELP[ui.tool] : PICKED_HELP[ui.tool]) : HELP[ui.tool]);
    el.querySelectorAll("[data-mode]").forEach((b) =>
      b.addEventListener("click", () => {
        ui.mode[ui.tool] = b.dataset.mode;
        ui.shaping.picked = -1;
        refresh();
      }),
    );
    $("#plant-kind")?.addEventListener("change", (e) => {
      if (edited().links) ui.linksPlant = e.target.value;
      else ui.plantKind = e.target.value === "" ? null : Number(e.target.value);
    });
    el.querySelectorAll("[data-brush]").forEach((b) =>
      b.addEventListener("click", () => {
        ui.brush = b.dataset.brush;
        refresh();
      }),
    );
    context();
    historyButtons();
    $("#hand-reset").disabled = !stored().edits?.length;
    redraw();
  }

  // Undo and Redo say what they'd undo or do again; the list shows the
  // last steps, newest first, and a tap on one goes straight back to it.
  const cap = (t) => t[0].toUpperCase() + t.slice(1);
  function historyButtons() {
    const h = history();
    for (const [id, word, name, keys] of [
      ["#hand-undo", "Undo", steps.undoName(h), "Ctrl+Z"],
      ["#hand-redo", "Redo", steps.redoName(h), "Ctrl+Y"],
    ]) {
      const b = $(id);
      b.disabled = name == null;
      b.querySelector("small").textContent = name ?? "";
      b.title = name ? `${word}: ${name} (${keys})` : `Nothing to ${word.toLowerCase()}`;
    }
    const list = steps.listSteps(h, 20);
    const btn = $("#hand-history");
    btn.disabled = list.length < 2;
    if (list.length < 2) ui.historyOpen = false;
    btn.classList.toggle("on", ui.historyOpen);
    btn.setAttribute("aria-expanded", String(ui.historyOpen));
    const ol = $("#hand-steps");
    ol.hidden = !ui.historyOpen;
    ol.innerHTML = ui.historyOpen
      ? list
          .map(
            (st) =>
              `<li><button data-step="${st.i}" class="${st.now ? "now" : ""} ${st.undone ? "undone" : ""}" ${st.now ? 'aria-current="step"' : ""}>${cap(st.name)}${
                st.now ? " <small>now</small>" : st.undone ? " <small>undone</small>" : ""
              }</button></li>`,
          )
          .join("")
      : "";
    ol.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => goTo(Number(b.dataset.step))));
  }

  // A picked bunker's or pond's wall (sim/walls.mjs): Add a wall - or, with
  // one, its height a step at a time (shown as a row of steps, like a
  // bunker's depth), what it's built of, facing it back to the green, and
  // taking it away.
  function wallButtons(s, kind) {
    const spec = WALLS[kind];
    const wall = wallOf(s);
    const facing = wallFacing(edited(), s, kind);
    if (!wall) {
      return `<span class="break"></span><button data-act="wall-add">${kind === "water" ? "Add a wall edge" : "Add a wall"}</button><span class="muted">${WALL_NOTE[kind === "water" ? "water" : "bunkers"](facing)}</span>`;
    }
    const step = heightStep(kind, wall.h);
    const last = spec.heights.length - 1;
    return `<span class="break"></span><button data-act="wall-lower" ${step === 0 ? "disabled" : ""}>Lower</button>
      <span class="depth" role="img" aria-label="Wall: ${spec.heights[step].name}">${spec.heights
        .map((d, i) => `<span class="${i === step ? "on" : ""} ${i < step ? "past" : ""}">${d.name}</span>`)
        .join("")}</span>
      <button data-act="wall-higher" ${step === last ? "disabled" : ""}>${kind === "water" ? "Higher" : "Taller"}</button>
      <span class="break"></span>${spec.kinds.map((k, m) => `<button data-wall-kind="${m}" class="${(wall.m ?? 0) === m ? "on" : ""}">${k.word}</button>`).join("")}
      <button data-act="wall-face">${FACE_BUTTON[facing]}</button><button data-act="wall-remove">Take the wall away</button>`;
  }
  const heightStep = (kind, h) => WALLS[kind].heights.reduce((best, d, i, all) => (Math.abs(d.h - h) < Math.abs(all[best].h - h) ? i : best), 0);
  // A change to the picked shape's wall, as one step. Once it's made, an
  // earlier note about the wall is out of date, so it goes (the caller
  // may put up a new one).
  function commitWall(sel, wall, name) {
    const list = ui.tool === "bunkers" ? "bunkers" : "water";
    const ok = commit({ k: list === "bunkers" ? "b" : "w", at: [sel.x, sel.z], wall }, NO_WALL[list], name);
    if (ok) note("");
    return ok;
  }

  // A list of the kinds of tree: "As they grow" (mixed, as the hole has
  // them) and each kind - those growing on the hole first, then the others
  // (sim/kindguide.mjs: a hole grows a few kinds); with mixed, a line
  // saying they're mixed now.
  function kindSelect(id, value, mixed = false) {
    const here = holeKindList(treeKinds(edited()));
    const option = (i) => `<option value="${i}" ${value === i ? "selected" : ""}>${KIND_NAMES[KINDS[i]]}</option>`;
    const rest = KINDS.map((_, i) => i).filter((i) => !here.includes(i));
    const full = here.length >= KIND_GUIDE.most;
    return `<select id="${id}">${mixed ? `<option value="mixed" selected>Mixed kinds</option>` : ""}<option value="" ${value == null && !mixed ? "selected" : ""}>As they grow</option>${
      here.length ? `<optgroup label="Growing here">${here.map(option).join("")}</optgroup><optgroup label="${full ? `Others (it has ${here.length} kinds: as many as a hole takes)` : "Others"}">${rest.map(option).join("")}</optgroup>` : rest.map(option).join("")
    }</select>`;
  }
  // Whether trees of `kind` may go at `spots` (sim/kindguide.mjs), not
  // counting the trees at `skip` ([x, z] each: those being moved or
  // changed): { keep, why, note }.
  function kindsOk(spots, kind, skip = []) {
    const L = edited();
    const at = new Set(skip.map(([x, z]) => `${x},${z}`));
    const not = new Set();
    L.trees.forEach((t, i) => at.has(`${t[0]},${t[1]}`) && not.add(i));
    return kindAdvice(L.trees, treeKinds(L), spots, kind, not);
  }
  // What kind each tree on the map grows as (courseplay.mjs grownKinds):
  // worked out again only when the hole changes.
  let kindsFor = null;
  let kindsKept = [];
  const treeKinds = (L) => {
    if (kindsFor !== L.trees) {
      kindsFor = L.trees;
      kindsKept = grownKinds(L, stands);
    }
    return kindsKept;
  };
  // The key to the tree colours on the map: each kind on this hole, its
  // colour and how many.
  function treeKey(L) {
    const count = new Map();
    for (const k of treeKinds(L)) count.set(k, (count.get(k) ?? 0) + 1);
    if (!count.size) return `<span class="break"></span><span class="muted">No trees on this hole.</span>`;
    const items = [...count.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `<span class="tree-key-item"><i style="background:${MAP_TREE_KINDS[k]}"></i>${KIND_NAMES[KINDS[k]]} <small>${n}</small></span>`)
      .join("");
    return `<span class="break"></span><div class="tree-key" aria-label="Tree key">${items}</div>`;
  }

  // The buttons for what's picked, or for the tool.
  function context() {
    const box = $("#hand-context");
    const L = edited();
    let html = "";
    if (ui.foreign) {
      const f = ui.foreign;
      const kind = KIND_WORD[f.list] ?? "shape";
      box.innerHTML = `<span class="other-hole">${(ui.tool === "trees" || ui.tool === "decor") && f.list !== "trees" && f.list !== "decor" && KIND_WORD[f.list] && ["fairways", "greens", "tees"].includes(f.list) ? noTreeThere(f) + " " : ""}${f.list === "trees" || f.list === "decor" ? `Belongs to hole ${f.number}: drawn red here, it's changed from hole ${f.number}.` : `${f.number != null ? `Hole ${f.number}'s ${kind}` : `A ${kind} of no hole's`}: drawn red, it's ${f.number != null ? `hole ${f.number}'s` : "not this hole's"} to change.`}</span>
        ${f.index >= 0 && pick ? `<button data-act="other-open" class="primary">Change hole ${f.number}</button>` : ""}
        ${f.k != null && own ? `<button data-act="other-claim">It's this hole's</button>` : ""}
        <button data-act="other-close">OK</button>`;
      box.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => act(b.dataset.act)));
      return;
    }
    // A shape of this hole from the map that's really another's: say so.
    const giveAway = (poly) => {
      const n = own && L.source === "map" && poly ? nearestOther(poly) : null;
      return n ? `<button data-act="give-away" title="It's on hole ${n.number}'s line: drawn red here from then on, and changed with hole ${n.number}">It's hole ${n.number}'s</button>` : "";
    };
    if (ui.tool === "decor") {
      box.innerHTML = `<span>Place:</span> ${DECOR_WORDS.map((w, i) => `<button data-act="decor-${i}"${i === ui.decorKind ? ' class="primary"' : ""}>${w}</button>`).join(" ")}`;
      box.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => act(b.dataset.act)));
      return;
    }
    if (ui.tool === "trees" && pickedTrees(L).length) {
      const picked = pickedTrees(L);
      const n = picked.length;
      // Roughly how tall: a tree's size against its kind's usual height.
      const tall = Math.round(picked.reduce((a, t) => a + (t[2] ?? 1) * (TREE_KINDS[t[3]]?.height ?? 9.5), 0) / n);
      const kinds = new Set(picked.map((t) => t[3] ?? null));
      const kind = kinds.size === 1 ? [...kinds][0] : undefined;
      // Its variants: the shapes its kind comes in (the fewest, for a bunch
      // of several kinds), each tree its own to begin with.
      const grown = treeKinds(L);
      const index = new Map(L.trees.map((t, i) => [t, i]));
      const shapes = Math.min(...picked.map((t) => shapeCount(grown[index.get(t)] ?? 1)));
      const set = new Set(picked.map((t) => t[6] ?? null));
      const shape = set.size === 1 ? [...set][0] : undefined;
      const name = n === 1 ? KIND_NAMES[KINDS[grown[index.get(picked[0])] ?? 1]] : null;
      html = `<span>${n === 1 ? `${name}, about ${tall} m tall` : `${n} trees, about ${tall} m tall`}</span>
        <button data-act="taller">Taller</button><button data-act="shorter">Shorter</button>
        <label title="Make ${n === 1 ? "it" : "them all"} one kind - each still its own shape and size - or let ${n === 1 ? "it" : "them"} grow as on this hole">${n === 1 ? "Kind" : "Make them"} ${kindSelect("set-kind", kind, kind === undefined)}</label>
        <button data-act="drop-trees">Take away</button><button data-act="unpick">Let go</button>
        <span class="break"></span><span title="Which of its kind's shapes ${n === 1 ? "it takes" : "they all take"}: Own leaves each its own">Shape</span>
        <button data-shape="" class="${shape === null ? "on" : ""}">Own</button>${Array.from({ length: shapes }, (_, i) => `<button data-shape="${i}" class="${shape === i ? "on" : ""}">${i + 1}</button>`).join("")}`;
    }
    if (ui.tool === "trees") html += treeKey(L);
    // Its trees as kept since it was first played (sim/treelock.mjs): grown
    // afresh, as this version of the game grows them, and kept again the
    // next time it's played - back with Undo until then.
    if (ui.tool === "trees" && !pickedTrees(L).length) {
      const S = stored();
      html += signatureButtons();
      if (liveLock(validLock(S.treeLock), S.edits)) html += `<span class="break"></span><button data-act="regrow" title="Its trees, bushes and the trees behind its green grow afresh as this version of the game grows them - where each stands, its kind, shape and size - and are kept as they grow the next time it's played. Undo puts them back until then.">Grow its trees afresh</button>`;
      else if (validLock(S.treeLock)) html += `<span class="break"></span><span class="muted">Its trees grow afresh the next time it's played. Undo keeps them as they were.</span>`;
    }
    if (ui.tool === "bunkers" || ui.tool === "water") {
      const s = selectedShape(L);
      // A waste area (sim/wastearea.mjs) isn't a bunker: no depth, wall or
      // join to the green - only taken away (or moved and sized, by hand).
      if (s && ui.tool === "bunkers" && s.waste) html = `<button data-act="remove-shape">Remove this waste area</button>${giveAway(s.poly)}`;
      else if (s && ui.tool === "bunkers") {
        const step = depthStep(s.dig);
        html = `<button data-act="shallower" ${step === 0 ? "disabled" : ""}>Shallower</button>
          <span class="depth" role="img" aria-label="Depth: ${LADDER[step].name}">${LADDER.map(
            (d, i) => `<span class="${i === step ? "on" : ""} ${i < step ? "past" : ""}">${d.name}</span>`,
          ).join("")}</span>
          <button data-act="deeper" ${step === LADDER.length - 1 ? "disabled" : ""}>Deeper</button>
          <button data-act="remove-shape">Remove this bunker</button>`;
        // Beside the green: sand right up to it, or a strip of grass between.
        if (s.join != null || gapTo(L.green, s) <= JOIN_REACH) {
          html += `<span class="break"></span><button data-act="join" class="${s.join === 1 ? "on" : ""}">Joined to the green</button><button data-act="beside" class="${s.join === 0 ? "on" : ""}">Next to the green</button>`;
        }
        html += wallButtons(s, "bunker");
        html += giveAway(s.poly);
      } else if (s) html = `<button data-act="remove-shape">Remove this water</button>${s.edge ? `<button data-act="unshape" title="Its marks all back where they were: the shore as it was made">Its own shape again</button>` : ""}${wallButtons(s, "water")}${giveAway(s.poly)}`;
      // A links hole made before pot bunkers: all of its bunkers made pots
      // at once (sim/holeedits.mjs "pots"), and back with Undo.
      if (!s && ui.tool === "bunkers" && L.links && L.bunkers.some((b) => !b.poly && !isPot(b) && !b.waste)) {
        html += `<button data-act="pots" title="Every bunker on this hole made a links pot bunker: small, round and deep, faced with stacked turf on its far side">Make them pot bunkers</button>`;
      }
      // Any other hole's bunkers given a style's shape at once (sim/
      // holeedits.mjs "bstyle"), and back with Undo.
      if (!s && ui.tool === "bunkers" && !L.links && L.bunkers.some((b) => !b.poly && !b.waste)) {
        html += `<span class="break"></span><button data-act="bstyle-classic" title="Every bunker on this hole a classic parkland shape: kidneys and ovals, clean edges">Classic shapes</button><button data-act="bstyle-rugged" title="Every bunker on this hole given ragged heathland edges: fingers of sand between bays of grass">Rugged edges</button><button data-act="bstyle-modern" title="Every bunker on this hole given big, sweeping, scalloped edges">Sweeping shapes</button>`;
      }
    }
    if (ui.tool === "green") {
      const m = ui.mode.green;
      const sh = ui.shaping;
      const on = (v) => (v ? "on" : "");
      const whole = `<button class="big" data-act="smooth-all">Smooth the whole green</button>`;
      if (m === "shape") html = `<button data-act="smaller">Smaller green</button><button data-act="bigger">Bigger green</button>`;
      if (m === "tilt") html = `<button data-act="flat">Make it level</button>`;
      if (m === "styles") {
        html = `${sculpt.STYLES.map((st) => `<button class="big ${on(sh.style?.id === st.id)}" data-style="${st.id}">${st.word}</button>`).join("")}
          <span class="break"></span>${whole}<button class="big" data-act="level-all">Level it all</button>`;
      }
      if (m === "brush") {
        html = `<button data-shaping="raise" class="big ${on(sh.action === "raise")}">Raise</button><button data-shaping="lower" class="big ${on(sh.action === "lower")}">Lower</button><button data-shaping="smooth" class="big ${on(sh.action === "smooth")}">Smooth</button>
          <span class="gap"></span><span>Ring</span>${["small", "medium", "big"].map((r) => `<button data-ring="${r}" class="big ${on(sh.ring === r)}">${r[0].toUpperCase() + r.slice(1)}</button>`).join("")}
          <span class="break"></span>${whole}${(stored().edits ?? []).some((e) => e.k === "bump") ? `<button data-act="smooth">Take out the old bumps</button>` : ""}`;
      }
      if (m === "stamps") {
        const sp = pickedStamp();
        html = sp
          ? `<button class="big" data-act="stamp-lower" ${sp[6] <= sculpt.STAMP_LIMITS.height[0] ? "disabled" : ""}>Lower</button><span class="depth-now">${sp[6] > 0 ? "Raised" : "Lowered"} ${Math.abs(Math.round(sp[6] * 100))} cm</span><button class="big" data-act="stamp-higher" ${sp[6] >= sculpt.STAMP_LIMITS.height[1] ? "disabled" : ""}>Higher</button>
            <button class="big" data-act="stamp-remove">Remove this shape</button><button class="big" data-act="stamp-done">Done</button>`
          : `${[2, 1, 0].map((k) => `<button class="big ${on(sh.stamp === k)}" data-stamp="${k}">${sculpt.STAMP_KINDS[k].word}</button>`).join("")}
            <span class="gap"></span><button data-sign="1" class="big ${on(sh.sign > 0)}">Raise</button><button data-sign="-1" class="big ${on(sh.sign < 0)}">Lower</button>`;
        // Pressing the shapes in is part of finishing with them.
        if (!sp && (editState(stored().edits).sculpt?.s ?? []).length) html += `<span class="break"></span>${whole}`;
      }
      if (m === "area") {
        const a = sh.area;
        const pct = (v) => `${Math.round(v * 1000) / 10}%`;
        if (a.length < 3) {
          html = `<span>${a.length ? `${a.length} dot${a.length === 1 ? "" : "s"} so far - ` : ""}Tap round the part of the green to work on (three dots or more).</span>
            ${a.length ? `<span class="break"></span><button data-act="area-undot">Take the last dot back</button><button data-act="area-clear">Start again</button>` : ""}`;
        } else {
          const now = sculpt.areaSlope(sculptGrid(), a, groundNow());
          html = `<button class="big" data-act="area-level">Level it</button><button class="big" data-act="area-smooth">Smooth it</button><button class="big" data-act="area-raise">Raise</button><button class="big" data-act="area-lower">Lower</button>
            <span class="break"></span><span>Slope at most</span>${sculpt.AREA_SLOPES.map((v) => `<button data-areaslope="${v}" class="${on(Math.abs(sh.slopeMax - v) < 1e-9)}">${pct(v)}</button>`).join("")}<button class="big" data-act="area-limit">Hold it to ${pct(sh.slopeMax)}</button>
            <span class="break"></span><span class="muted">This area: ${pct(now.mean)} on average, ${pct(now.max)} at its steepest.</span><button data-act="area-undot">Take the last dot back</button><button data-act="area-clear">New area</button>`;
        }
      }
      // Always a line for the warning, empty or not, so the map below
      // never jumps when it comes or goes - the next rub lands where aimed.
      const warn = m === "shape" || m === "tilt" || m === "styles" || m === "brush" || m === "stamps" || m === "area" ? steepWarning(L) : "";
      html += `<p class="hand-warn" aria-live="polite" title="${warn}">${warn || "&nbsp;"}</p>`;
    }
    if (ui.tool === "paths") {
      // Always two rows of buttons, whatever's picked, so the map never
      // jumps under a finger that's just pressed on a path.
      const hint = (text) => `<span class="break"></span><span class="muted">${text}</span>`;
      if (ui.drawing) {
        const n = ui.drawing.length;
        html = `<button data-act="path-done" ${n < 2 ? "disabled" : ""}>Done</button>
          <button data-act="path-undot">Take the last dot back</button><button data-act="path-cancel">Cancel</button>${hint(`${n} dot${n === 1 ? "" : "s"} so far.`)}`;
      } else {
        const i = pickedPath(L);
        const lk = i >= 0 ? null : pickedLink();
        if (ui.link && !lk) ui.link = null;
        const to = (l) => (l.leaves ? l.other : number);
        if (lk) {
          const dots = linkDots(lk);
          const bend = ui.link.dot > 0 && ui.link.dot < dots.length - 1;
          html = `<button data-act="link-unbend" ${bend ? "" : 'disabled title="Tap one of its white dots first (not an end)"'}>Take this bend out</button><button data-act="link-auto" ${lk.hand ? "" : 'disabled title="It is as worked out"'}>Put it back as worked out</button><button data-act="link-none">No path between these holes</button>${hint(`The path from hole ${lk.number} to hole ${to(lk)}, ${lk.hand ? "as you drew it" : "as worked out"}.`)}`;
        } else if (i >= 0) {
          const path = L.paths[i];
          const bend = ui.path.dot >= 0 && path.p.length > 2;
          html = `<button data-act="path-remove">Remove this path</button><button data-act="path-unbend" ${bend ? "" : 'disabled title="Tap one of its white dots first"'}>Take this bend out</button>
            <span class="break"></span>${PATH_KINDS.map((k, m) => `<button data-path-kind="${m}" class="${(path.m ?? 0) === m ? "on" : ""}">${k.word}</button>`).join("")}`;
        } else {
          const gone = holeLinks().filter((l) => l.removed);
          html = `<button data-act="path-left">Path on the left</button><button data-act="path-right">Path on the right</button>${
            (L.paths ?? []).length ? `<button data-act="path-none">No cart path</button>` : ""
          }${gone.map((l) => `<button data-act="link-back:${l.number}" title="There's no path between these holes: work one out again">Path from hole ${l.number} to hole ${to(l)} back</button>`).join("")}${hint("Or tap empty ground to start drawing one.")}`;
        }
      }
    }
    if (ui.tool === "brooks") {
      const hint = (text) => `<span class="break"></span><span class="muted">${text}</span>`;
      const kinds = (cur) => BROOK_KINDS.map((k, i) => `<button data-brook-kind="${i}" class="${cur === i ? "on" : ""}">${k.word}</button>`).join("");
      if (ui.brookDraw) {
        const n = ui.brookDraw.length;
        html = `<button data-act="brook-done" ${n < 2 ? "disabled" : ""}>Done</button>
          <button data-act="brook-undot">Take the last dot back</button><button data-act="brook-cancel">Cancel</button><span class="break"></span>${kinds(ui.brookKind)}${hint(`${n} dot${n === 1 ? "" : "s"} so far.`)}`;
      } else {
        const i = pickedBrook(L);
        if (i >= 0) {
          const b = L.water[i].brook;
          const bend = ui.brook.dot >= 0 && b.p.length > 2;
          const [s0, s1] = bankNames(L, b);
          const on = (v) => (v ? "on" : "");
          html = `<button data-act="brook-remove">Remove this brook</button><button data-act="brook-unbend" ${bend ? "" : 'disabled title="Tap one of its white dots first"'}>Take this bend out</button>
            <button data-act="brook-narrower">Narrower</button><button data-act="brook-wider">Wider</button>
            <span class="break"></span>${kinds(b.kind ?? 0)}
            <span class="break"></span><span title="Walled, the grass runs level to the edge and drops straight down to the water; elsewhere the bank slopes down to it">Walls</span>
            <button data-act="bank-0">The ${s0}</button><button data-act="bank-1">The ${s1}</button><button data-act="bank-both">Both banks</button>
            <button data-act="bank-stretch" class="${on(ui.bank)}">${ui.bank ? "Tap the bank..." : "Just a stretch..."}</button>${b.banks?.length ? `<button data-act="bank-none">No walls</button>` : ""}
            <span class="break"></span><span>Built of</span>${WALLS.water.kinds.map((k, m) => `<button data-bank-m="${m}" class="${on(ui.bankM === m)}">${k.word}</button>`).join("")}`;
        } else html = hint("Tap empty ground to start drawing a brook, a ditch or a stream. A burn the hole came with (dashed) can be tapped to make it one.");
      }
    }
    if (ui.tool === "ground") {
      const m = ui.mode.ground;
      const on = (v) => (v ? "on" : "");
      const gt = [...(stored().edits ?? [])].reverse().find((e) => e.k === "gt") ?? { up: 0, side: 0 };
      const rise = riseToGreen(L.terrain, L.pin);
      const said = Math.abs(rise) < 0.5 ? "The green is level with the tee." : `The green is ${Math.abs(rise).toFixed(1)} m ${rise > 0 ? "above" : "below"} the tee.`;
      if (m === "tilt") {
        html = `<label class="ground-slider">Green above or below the tee <input type="range" data-gt="up" min="${-TILT_LIMIT.up}" max="${TILT_LIMIT.up}" step="0.5" value="${gt.up}"><b>${gt.up > 0 ? "+" : ""}${gt.up} m</b></label>
          <label class="ground-slider">Right side up or down <input type="range" data-gt="side" min="${-TILT_LIMIT.side}" max="${TILT_LIMIT.side}" step="0.5" value="${gt.side}"><b>${gt.side > 0 ? "+" : ""}${gt.side} m</b></label>
          <button data-act="ground-level">No tilt</button>`;
      } else {
        html = `<span>Brush</span>${BRUSH_SIZES.map((r, i) => `<button data-gsize="${i}" class="${on(ui.ground.size === i)}">${r} m</button>`).join("")}`;
        if (m !== "smooth") html += `<span class="gap"></span><span>Each rub</span>${BRUSH_STEPS.map((a, i) => `<button data-gstep="${i}" class="${on(ui.ground.step === i)}">${a < 1 ? `${a * 100} cm` : `${a} m`}</button>`).join("")}`;
      }
      // A hole from a map: whether it's a links hole, and which look.
      if (L.source === "map") {
        const look = L.links || "";
        html += `<span class="break"></span><span title="A links hole: marram on the crests, rabbit scrapes, pebbles, blown sand and rock over its real ground, and links long grass">Ground</span>${[["", "Parkland"], ["dunes", "Links: dunes"], ["green", "Links: green"]].map(([v, w]) => `<button data-links="${v}" class="${on(look === v)}">${w}</button>`).join("")}`;
      }
      html += `<span class="break"></span><span class="muted">${said} The map is shaded by height while this tool is picked.</span>`;
    }
    if (ui.tool === "fairway") {
      const slider = (w, name) => `<button data-act="narrower">Narrower</button>
          <input type="range" id="fw" min="50" max="180" step="5" value="${Math.round(w * 100)}" aria-label="${name}">
          <button data-act="wider">Wider</button>`;
      if (L.source === "map") {
        // Each of its fairways on its own: the one picked.
        const list = fairwaysOf(L);
        const f = pickedFairway(L);
        if (!list.length) html = `<span class="muted">This hole has no fairway to change.</span>`;
        else if (f) html = `${slider(fairwayWidth(stored(), f.at), "This fairway's width")}<button data-act="remove-fairway">Remove this fairway</button>${giveAway(f.poly)}`;
        else html = `<span class="muted">${list.length === 1 ? "One fairway" : `${list.length} fairways`} on this hole: tap one on the map to pick it.</span>`;
      } else {
        // Its width all along (the slider), and whether its edges wander
        // on their own: a natural line, or even.
        const natural = `<button data-act="fw-natural" class="${L.fairway.natural ? "on" : ""}" title="Each edge wandering in and out on its own, or the two even">Natural edges</button>`;
        // An island green's causeway: how wide, its ends, its own way again.
        const look = causewayLook(L);
        const way = `<span title="How wide the causeway is">Width</span><button data-act="cw-narrower">Narrower</button>
          <input type="range" id="cw-w" min="${CAUSEWAY.widths[0]}" max="${CAUSEWAY.widths[1]}" step="1" value="${look.w}" aria-label="Causeway width"><button data-act="cw-wider">Wider</button><span class="muted">${look.w} m</span>
          <span class="break"></span><span title="How much wider its ends are, where they meet the green and the land">Ends</span>
          <input type="range" id="cw-e" min="${CAUSEWAY.ends[0]}" max="${CAUSEWAY.ends[1]}" step="0.25" value="${look.e}" aria-label="How much its ends flare out"><span class="muted">${look.e === 1 ? "straight" : `flared, ${look.e} times as wide`}</span>
          ${L.causeway ? `<button data-act="cw-reset" title="As it was made: 5 m wide, straight, the way it finds by itself">Its own way again</button>` : ""}`;
        // Fairways added by hand (Add and move): the one picked.
        const more = L.extraFairways ?? [];
        const s = ui.mode.fairway === "more" ? selectedShape(L) : null;
        if (ui.mode.fairway === "causeway") html = causeways(L).length ? way : `<span class="muted">This green isn't an island: a causeway is made by itself once water goes right round it.</span>`;
        else if (s) html = `<button data-act="remove-shape">Remove this fairway</button>${s.edge ? `<button data-act="unshape" title="Its marks all back where they were: its edge as it was made">Its own shape again</button>` : ""}`;
        else if (ui.mode.fairway === "more") html = `<span class="muted">${more.length ? `${more.length === 1 ? "One fairway" : `${more.length} fairways`} added to this hole: tap one to pick it.` : "None added yet: tap the ground where one should go."}</span>`;
        else html = L.fairway.to > L.fairway.from ? `${ui.mode.fairway === "width" ? slider(editState(stored().edits).fw, "Fairway width") : ""}${natural}` : `<span class="muted">This hole has no fairway of its own to change - add one with Add and move.</span>`;
      }
    }
    box.innerHTML = html;
    box.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => act(b.dataset.act)));
    box.querySelectorAll("[data-shape]").forEach((b) =>
      b.addEventListener("click", () => {
        const picked = pickedTrees(edited()).map((t) => [t[0], t[1]]);
        const shape = b.dataset.shape === "" ? null : Number(b.dataset.shape);
        if (commit({ k: "tv", p: picked, shape }, "They're that shape already.")) note(shape === null ? "Each its own shape again." : `Shape ${shape + 1} of its kind${picked.length > 1 ? ", all of them" : ""}.`);
        refresh();
      }),
    );
    $("#set-kind")?.addEventListener("change", (e) => {
      if (e.target.value === "mixed") return;
      const picked = pickedTrees(edited()).map((t) => [t[0], t[1]]);
      const kind = e.target.value === "" ? null : Number(e.target.value);
      // (Not a kind too many for the hole, nor one in among two others.)
      const ok = kindsOk(picked, kind, picked);
      const some = picked.filter((_, i) => ok.keep[i]);
      if (!some.length) note(ok.why);
      else if (commit({ k: "tk", p: some, kind }, "They're that kind already.")) {
        const done = kind === null ? "They grow as they would on this hole now." : `${some.length === 1 ? `A ${KIND_NAMES[KINDS[kind]].toLowerCase()}` : `All ${KIND_NAMES[KINDS[kind]].toLowerCase()}s`} now, each its own shape and size.`;
        note(some.length < picked.length ? `${done} Not all of them: ${ok.why}` : ok.note ? `${done} ${ok.note}` : done);
      }
      refresh();
    });
    box.querySelectorAll("[data-gsize]").forEach((b) => b.addEventListener("click", () => ((ui.ground.size = Number(b.dataset.gsize)), context(), redraw())));
    box.querySelectorAll("[data-links]").forEach((b) =>
      b.addEventListener("click", () => {
        const look = b.dataset.links;
        if (commit({ k: "lk", look }, look ? "It's that kind of links hole already." : "It's a parkland hole already."))
          note(look ? "A links hole now: marram, rabbit scrapes, pebbles, blown sand and rock over its own ground, and links long grass." : "A parkland hole now.");
        refresh();
      }),
    );
    box.querySelectorAll("[data-gstep]").forEach((b) => b.addEventListener("click", () => ((ui.ground.step = Number(b.dataset.gstep)), context())));
    // The tilt: shown as it's slid, kept when let go.
    box.querySelectorAll("[data-gt]").forEach((input) => {
      const now = () => {
        const v = Object.fromEntries([...box.querySelectorAll("[data-gt]")].map((i) => [i.dataset.gt, Number(i.value)]));
        return { k: "gt", up: v.up ?? 0, side: v.side ?? 0 };
      };
      input.addEventListener("input", () => {
        input.nextElementSibling.textContent = `${Number(input.value) > 0 ? "+" : ""}${input.value} m`;
        pending = now();
        redraw();
      });
      input.addEventListener("change", () => {
        pending = null;
        const e = now();
        commit(e, "This hole has no ground to tilt.", e.up || e.side ? "tilt the hole" : "take the tilt off");
        refresh();
      });
    });
    box.querySelectorAll("[data-style]").forEach((b) => b.addEventListener("click", () => applyStyle(b.dataset.style)));
    box.querySelectorAll("[data-wall-kind]").forEach((b) =>
      b.addEventListener("click", () => {
        const sel = selectedShape(edited());
        const wall = sel && wallOf(sel);
        const m = Number(b.dataset.wallKind);
        const kind = ui.tool === "water" ? "water" : "bunker";
        if (wall && (wall.m ?? 0) !== m && commitWall(sel, { ...wall, m }, `${WALLS[kind].kinds[m].word.toLowerCase()} wall`)) {
          note(`A ${WALLS[kind].kinds[m].word.toLowerCase()} wall now.`);
        }
        refresh();
      }),
    );
    box.querySelectorAll("[data-brook-kind]").forEach((b) =>
      b.addEventListener("click", () => {
        const kind = Number(b.dataset.brookKind);
        if (ui.brookDraw) ui.brookKind = kind;
        else if (ui.brook) commit({ k: "r", at: ui.brook.at, kind }, NO_BROOK, `make it a ${BROOK_KINDS[kind].word.toLowerCase()}`);
        refresh();
      }),
    );
    box.querySelectorAll("[data-bank-m]").forEach((b) =>
      b.addEventListener("click", () => {
        ui.bankM = Number(b.dataset.bankM);
        // (Any walls it has, rebuilt in it.)
        const L = edited();
        const i = pickedBrook(L);
        const banks = i >= 0 ? L.water[i].brook.banks : null;
        if (banks?.length && banks.some((k) => (k.m ?? 0) !== ui.bankM)) commit({ k: "r", at: ui.brook.at, banks: banks.map((k) => ({ ...k, m: ui.bankM })) }, NO_BROOK, `${WALLS.water.kinds[ui.bankM].word.toLowerCase()} walls`);
        refresh();
      }),
    );
    box.querySelectorAll("[data-path-kind]").forEach((b) =>
      b.addEventListener("click", () => {
        if (ui.path) commitPath({ k: "p", at: ui.path.at, m: Number(b.dataset.pathKind) });
        refresh();
      }),
    );
    const choose = (attr, key, f = (v) => v) =>
      box.querySelectorAll(`[data-${attr}]`).forEach((b) =>
        b.addEventListener("click", () => {
          ui.shaping[key] = f(b.dataset[attr]);
          refresh();
        }),
      );
    choose("shaping", "action");
    choose("ring", "ring");
    choose("stamp", "stamp", Number);
    choose("sign", "sign", Number);
    choose("areaslope", "slopeMax", Number);
    // The causeway's width and ends: each a slider.
    for (const [id, key, name] of [["#cw-w", "w", "causeway width"], ["#cw-e", "e", "causeway ends"]]) {
      const input = box.querySelector(id);
      if (!input) continue;
      input.addEventListener("input", () => {
        pending = causewayEdit({ [key]: Number(input.value) });
        redraw();
      });
      input.addEventListener("change", () => {
        const e = causewayEdit({ [key]: Number(input.value) });
        pending = null;
        commit(e, NO_CAUSEWAY, name);
        refresh();
      });
    }
    const fw = box.querySelector("#fw");
    if (fw) {
      // The picked fairway of a hole from a map or on hills, or a designed
      // hole's one fairway.
      const edit = () => {
        const f = Number(fw.value) / 100;
        const pick = pickedFairway(edited());
        return pick ? { k: "f", at: pick.at, f } : { k: "fw", f };
      };
      fw.addEventListener("input", () => {
        pending = edit();
        redraw();
      });
      fw.addEventListener("change", () => {
        const e = edit();
        pending = null;
        commit(e);
        refresh();
      });
    }
  }

  // ---- Shaping the green in detail ----------------------------------------------------

  // The green's grid of heights to work on (see sim/greensculpt.mjs).
  const sculptGrid = () => sculpt.startGrid(stored(), edited(), editState(stored().edits).sculpt);
  // A change to it as one step. `fresh`: it starts the green again (a
  // style, or levelling it), so the older tilt and bumps go with it.
  // Returns false if it couldn't be done, or what went with it ("the
  // tilt", "the old bumps") - "" if nothing did.
  function commitShape(grid, name, fresh = false) {
    const e = sculpt.editFromGrid(grid);
    if (!fresh) return commit(e, NO_SHAPING, name) && "";
    const was = stored().edits ?? [];
    const edits = [...was.filter((x) => !["gh", "tilt", "bump"].includes(x.k)), e];
    const out = withEdits({ ...stored(), edits });
    if (out.applied?.[out.applied.length - 1] === false) {
      note(NO_SHAPING);
      return false;
    }
    setEdits(edits);
    remember(name, edits);
    const gone = [was.some((x) => x.k === "tilt" && x.n > 0) && "the tilt", was.some((x) => x.k === "bump") && "the old bumps"].filter(Boolean);
    return gone.join(" and ");
  }
  // "(This took away the tilt.)", if it did.
  const tookAway = (gone) => (gone ? ` (This took away ${gone}: Undo brings it back.)` : "");
  // The ground under the green as the hole was made: what shaping is
  // measured from, and what smoothing smooths along with it.
  const groundNow = () => sculpt.groundOf(stored());
  // A style tapped: a new take on it each tap.
  function applyStyle(id) {
    const sh = ui.shaping;
    const n = sh.style?.id === id ? sh.style.n + 1 : 0;
    sh.style = { id, n };
    sh.picked = -1;
    const word = sculpt.STYLES.find((st) => st.id === id).word;
    const done = commitShape(sculpt.styleGrid(stored(), edited(), id, n), `green style: ${word.toLowerCase()}`, true);
    if (done !== false) note((n ? `${word}: take ${n + 1}.` : `${word}. Tap it again for another take on it.`) + tookAway(done));
    refresh();
  }
  // The stamp picked, as it is now (following a drag).
  function pickedStamp() {
    return editState(shown().edits).sculpt?.s?.[ui.shaping.picked] ?? null;
  }
  // Too steep anywhere? Said plainly, the cup first.
  function steepWarning(L) {
    const surf = surfaceOf(L, stored());
    const r = sculpt.slopeReport(L.green, L.pin, (x, z) => greenGradient(surf, x, z));
    if (r.cup > 0.04) return `Steep round the cup (${Math.round(r.cup * 100)}%): smooth it there or move the flag.`;
    if (r.steep.length) return "The red parts are too steep for a ball to stop on.";
    return "";
  }
  // On the green or its fringe: where shaping works.
  const onGreen = (p) => insidePolygon(blobOutline(edited().green, 64, sculpt.FRINGE), p[0], p[1]);
  // A dab of the ring brush, spaced along the stroke.
  function sculptDab(p) {
    const g = gesture;
    const r = sculpt.RINGS[ui.shaping.ring];
    if (g.lastDab && Math.hypot(p[0] - g.lastDab[0], p[1] - g.lastDab[1]) < Math.max(0.3, r * 0.25)) return;
    g.lastDab = p;
    const a = ui.shaping.action;
    g.grid = a === "smooth" ? sculpt.smoothRub(g.grid, p[0], p[1], r, 0.5, g.ground) : sculpt.rub(g.grid, p[0], p[1], r, (a === "lower" ? -1 : 1) * sculpt.DAB * Math.sqrt(r / 1.5));
    pending = sculpt.editFromGrid(g.grid);
  }
  // A stamp dragged, stretched or turned: the edit it makes.
  function stampPending(g, p) {
    const grid = g.grid ?? (g.grid = sculptGrid());
    const sp = grid.stamps[g.i];
    if (!sp) return;
    const next = sp.slice();
    const [lenLo, lenHi] = sculpt.STAMP_LIMITS.length;
    const [widLo, widHi] = sculpt.STAMP_LIMITS.width;
    if (g.type === "stampMove") {
      next[1] = r2(sp[1] + p[0] - g.startHole[0]);
      next[2] = r2(sp[2] + p[1] - g.startHole[1]);
    } else if (g.type === "stampEnd") {
      // The handle follows the finger: its angle turns the stamp, its
      // distance sets the length.
      const hd = sculpt.stampHandles(sp).end;
      const lu = (hd[0] - sp[1]) * Math.cos(sp[5]) + (hd[1] - sp[2]) * Math.sin(sp[5]);
      const lv = -(hd[0] - sp[1]) * Math.sin(sp[5]) + (hd[1] - sp[2]) * Math.cos(sp[5]);
      const off = Math.atan2(lv, lu);
      const d = Math.hypot(p[0] - sp[1], p[1] - sp[2]);
      next[5] = r2(Math.atan2(p[1] - sp[2], p[0] - sp[1]) - off);
      next[3] = r2(Math.min(lenHi, Math.max(lenLo, (sp[3] * Math.max(0, d - 0.6)) / Math.max(0.1, Math.hypot(lu, lv) - 0.6))));
    } else {
      const across = -(p[0] - sp[1]) * Math.sin(sp[5]) + (p[1] - sp[2]) * Math.cos(sp[5]);
      next[4] = r2(Math.min(widHi, Math.max(widLo, (Math.abs(across) - 0.6) * 2)));
    }
    const stamps = grid.stamps.slice();
    stamps[g.i] = next;
    pending = sculpt.editFromGrid({ ...grid, stamps });
  }

  function act(what) {
    if (/^decor-\d$/.test(what)) {
      ui.decorKind = Number(what.slice(6));
      return refresh();
    }
    if (what.startsWith("bstyle-")) {
      const st = what.slice(7);
      const name = { classic: "classic", rugged: "rugged", modern: "sweeping" }[st];
      if (commit({ k: "bstyle", s: st }, `They're ${name} already.`, `give the bunkers ${name} shapes`)) note(`The bunkers are ${name} now. Undo puts them back.`);
      return refresh();
    }
    if (what === "sig-off" || what === "sig-on") {
      const on = what === "sig-on" ? 1 : 0;
      if (commit({ k: "sig", on }, on ? "Its signature tree is there already." : "It has no signature tree.", on ? "put the signature tree back" : "take the signature tree away")) note(on ? "Its signature tree is back. Undo takes it away again." : "Its signature tree is gone, and the ground under it is open. Undo puts it back.");
      return refresh();
    }
    if (what === "regrow") {
      if (commit({ k: "tg", on: 1 }, "Its trees grow afresh already.", "grow the trees afresh")) note("Its trees grow afresh the next time it's played, as this version of the game grows them, and are kept as they grow then. Undo puts them back until then.");
      return refresh();
    }
    if (what === "pots") {
      if (commit({ k: "pots", on: 1 }, "They're pot bunkers already.", "make the bunkers pots")) note("Pot bunkers now: small, deep and turf-faced. Undo puts them back.");
      return refresh();
    }
    if (what === "other-open" || what === "other-claim" || what === "other-close") {
      const f = ui.foreign;
      ui.foreign = null;
      if (what === "other-open" && f?.index >= 0) return pick?.(f.index);
      if (what === "other-claim" && f?.k != null) {
        own?.(f.list, f.k, number);
        note(`That ${KIND_WORD[f.list]} is this hole's now.`);
      }
      return refresh();
    }
    if (what === "give-away") {
      // Which of the hole's own shapes it is, as the map gave it.
      const L = edited();
      const list = ui.tool === "fairway" ? "fairways" : ui.tool === "bunkers" ? "bunkers" : "water";
      const poly = list === "fairways" ? pickedFairway(L)?.poly : selectedShape(L)?.poly;
      const n = poly && nearestOther(poly);
      const k = poly ? (stored()[list] ?? []).findIndex((s) => shapeKey(s.poly ?? s) === shapeKey(poly)) : -1;
      if (!n || k < 0) {
        note("Put it back as the map had it first (Undo), then say whose it is.");
        return refresh();
      }
      own?.(list, k, n.number);
      ui.selected = null;
      note(`It's hole ${n.number}'s now: drawn red here, and changed with hole ${n.number}.`);
      return refresh();
    }
    if (what === "fw-natural") {
      const on = edited().fairway?.natural ? 0 : 1;
      if (commit({ k: "fwn", on }, "This hole has no fairway to change.")) note(on ? "Each edge of the fairway wanders on its own now." : "The fairway's edges are even now.");
      return refresh();
    }
    if (what === "ground-level") {
      commit({ k: "gt", up: 0, side: 0 }, "This hole has no ground to tilt.", "take the tilt off");
      return refresh();
    }
    const L = edited();
    const st = editState(stored().edits);
    const picked = pickedTrees(L).map((t) => [t[0], t[1]]);
    const sel = selectedShape(L);
    if (what === "taller" || what === "shorter") {
      if (!commit({ k: "ts", p: picked, f: what === "taller" ? 1.2 : 1 / 1.2 }, "They're as tall (or short) as trees go.")) return;
      // The new spots of the picked trees are the same; say how tall now.
      const now = pickedTrees(edited());
      if (now.length) note(`${what === "taller" ? "Taller" : "Shorter"}: about ${Math.round(now.reduce((a, t) => a + (t[2] ?? 1) * (TREE_KINDS[t[3]]?.height ?? 9.5), 0) / now.length)} m tall now.`);
    } else if (what === "drop-trees") {
      commit({ k: "t-", p: picked });
      ui.picked = [];
    } else if (what === "unpick") ui.picked = [];
    else if ((what === "deeper" || what === "shallower") && sel) {
      const step = depthStep(sel.dig);
      const next = Math.min(LADDER.length - 1, Math.max(0, step + (what === "deeper" ? 1 : -1)));
      if (next !== step) commit({ k: "b", at: [sel.x, sel.z], dig: LADDER[next].dig }, NO_SHAPE, what === "deeper" ? "dig bunker deeper" : "make bunker shallower");
    } else if (what.startsWith("wall-") && sel) {
      const kind = ui.tool === "water" ? "water" : "bunker";
      const wall = wallOf(sel);
      const water = kind === "water";
      if (what === "wall-add" || what === "wall-face") {
        const fresh = defaultWall(L, sel, kind);
        if (!fresh) note(water ? "This pond's too small for a wall." : "This bunker's too small for a wall.");
        else if (commitWall(sel, what === "wall-face" && wall ? { ...fresh, h: wall.h, m: wall.m } : fresh, what === "wall-add" ? (water ? "add a wall edge" : "add a wall") : FACE_STEP[wallFacing(L, sel, kind)])) {
          if (what === "wall-add") note(water ? `A wall edge, ${metres(fresh.h)} above the water. Drag its yellow dots to move it.` : "A wall. Drag its yellow dots round the edge to move it.");
        }
      } else if (what === "wall-remove" && wall) commitWall(sel, 0, "take the wall away");
      else if ((what === "wall-higher" || what === "wall-lower") && wall) {
        const heights = WALLS[kind].heights;
        const step = heightStep(kind, wall.h);
        const next = Math.min(heights.length - 1, Math.max(0, step + (what === "wall-higher" ? 1 : -1)));
        const up = what === "wall-higher";
        const h = heights[next].h;
        // Says the new height, so an earlier note about the wall isn't
        // left up saying the old one.
        if (next !== step && commitWall(sel, { ...wall, h }, water ? `${up ? "raise" : "lower"} the wall` : `make the wall ${up ? "taller" : "lower"}`)) {
          note(water ? `The wall edge now stands ${metres(h)} above the water.` : `The wall now drops ${metres(h)} to the sand.`);
        }
      }
    } else if (what === "remove-shape" && sel) {
      commit({ k: `${shapeTool().k}-`, at: [sel.x, sel.z] });
      ui.selected = null;
    } else if (what === "unshape" && sel) {
      commit({ k: shapeTool().k, at: [sel.x, sel.z], h: Array(EDGE_MARKS).fill(1) }, NO_RESHAPE);
    } else if (what === "smaller" || what === "bigger") {
      const f = r2(Math.min(1.6, Math.max(0.6, st.green.f * (what === "bigger" ? 1.1 : 1 / 1.1))));
      if (f === st.green.f) note(`That's as ${what === "bigger" ? "big" : "small"} as a green goes.`);
      else commit({ k: "g", h: st.green.h, f }, NO_GREEN, `make green ${what}`);
    } else if (what === "flat") {
      if (st.tilt.n > 0) commit({ k: "tilt", a: 0, n: 0 });
    }
    else if (what.startsWith("area-")) {
      const a = ui.shaping.area;
      if (what === "area-undot") a.pop();
      else if (what === "area-clear") ui.shaping.area = [];
      else if (sculpt.validArea(a)) {
        const grid = sculptGrid();
        const ground = groundNow();
        const pct = (v) => `${Math.round(v * 1000) / 10}%`;
        const [next, name, said] =
          what === "area-level"
            ? [sculpt.levelArea(grid, a, ground), "level an area of the green", "Level - a tier at that area's own height."]
            : what === "area-smooth"
              ? [sculpt.smoothArea(grid, a, ground), "smooth an area of the green", "Smoothed. Tap again to smooth it more."]
              : what === "area-limit"
                ? [sculpt.limitSlope(grid, a, ui.shaping.slopeMax, ground), `hold an area to ${pct(ui.shaping.slopeMax)}`, `Nowhere in it steeper than ${pct(ui.shaping.slopeMax)} now.`]
                : [sculpt.raiseArea(grid, a, (what === "area-raise" ? 1 : -1) * sculpt.AREA_STEP, ground), `${what === "area-raise" ? "raise" : "lower"} an area of the green`, `${what === "area-raise" ? "Raised" : "Lowered"} ${Math.round(sculpt.AREA_STEP * 100)} cm.`];
        if (commitShape(next, name) !== false) note(said);
      }
    } else if (what === "smooth-all") {
      const grid = sculptGrid();
      if (commitShape(sculpt.smoothAll(grid, groundNow()), "smooth the whole green") !== false) {
        note(grid.stamps.length ? "Smoothed. The shapes are part of the green now (Undo to move them again)." : "Smoothed. Tap again to smooth it more.");
      }
      ui.shaping.picked = -1;
    } else if (what === "level-all") {
      const done = commitShape(sculpt.levelAll(stored(), edited(), sculptGrid()), "level the green", true);
      if (done !== false) note("Level. Start shaping it again." + tookAway(done));
      ui.shaping.picked = -1;
      ui.shaping.style = null;
    } else if (what.startsWith("stamp-")) {
      const i = ui.shaping.picked;
      const sp = pickedStamp();
      if (!sp) ui.shaping.picked = -1;
      else if (what === "stamp-done") ui.shaping.picked = -1;
      else {
        const grid = sculptGrid();
        const word = STAMP_NAMES[sp[0]];
        if (what === "stamp-remove") {
          grid.stamps.splice(i, 1);
          if (commitShape(grid, `remove the ${word}`) !== false) ui.shaping.picked = -1;
        } else {
          const [lo, hi] = sculpt.STAMP_LIMITS.height;
          let h = r2(sp[6] + (what === "stamp-higher" ? 0.05 : -0.05));
          // Never flat: past level to the first step the other side.
          if (Math.abs(h) < 0.01) h = what === "stamp-higher" ? 0.05 : -0.05;
          grid.stamps[i] = [...sp.slice(0, 6), Math.min(hi, Math.max(lo, h))];
          commitShape(grid, `make the ${word} ${what === "stamp-higher" ? "higher" : "lower"}`);
        }
      }
    } else if ((what === "join" || what === "beside") && sel) {
      const join = what === "join" ? 1 : 0;
      if (commit({ k: "b", at: [sel.x, sel.z], join }, "It can't go there: the cup has to stay two metres clear of the sand, and the green mostly clear of it.", join ? "join bunker to the green" : "set bunker next to the green")) {
        note(join ? "Joined: the sand now runs right up to the green." : "Next to the green: a strip of grass between the sand and the green.");
        // It's moved to suit: keep it picked where it is now.
        const bs = edited().bunkers.filter((b) => b.join === join);
        const b = bs.sort((a, c) => Math.hypot(a.x - sel.x, a.z - sel.z) - Math.hypot(c.x - sel.x, c.z - sel.z))[0];
        if (b) ui.selected = { list: "bunkers", at: [r2(b.x), r2(b.z)] };
      }
    } else if (what === "smooth") {
      const edits = (stored().edits ?? []).filter((e) => e.k !== "bump");
      if (edits.length !== (stored().edits ?? []).length) {
        setEdits(edits);
        remember("smooth out bumps", edits);
      }
    } else if (what === "path-done" && ui.drawing) {
      const pts = ui.drawing;
      const trees = edited().trees.length;
      if (commitPath({ k: "p+", p: pts, m: 0 })) {
        ui.drawing = null;
        ui.path = { at: pts[0], dot: -1 };
        // Replaces whatever the note said before (a refused Done, say),
        // unless trees had to make way for the path: that's worth saying.
        if (edited().trees.length === trees) note("A new path. Tap it to change it.");
      }
    } else if (what === "brook-done" && ui.brookDraw) {
      const pts = ui.brookDraw;
      const sand = edited().bunkers.length;
      if (commit({ k: "r+", p: pts, kind: ui.brookKind }, NO_BROOK)) {
        ui.brookDraw = null;
        ui.brook = { at: pts[Math.floor(pts.length / 2)], dot: -1 };
        const gone = edited().bunkers.length < sand ? " Bunkers in its way have gone (Undo brings them back)." : "";
        note(`A new ${BROOK_KINDS[ui.brookKind].word.toLowerCase()}, its banks sloping down to it. Wall a bank, change it, or tap empty ground to let go.${gone}`);
      }
    } else if (what === "brook-undot" && ui.brookDraw) {
      ui.brookDraw.pop();
      if (!ui.brookDraw.length) ui.brookDraw = null;
    } else if (what === "brook-cancel") ui.brookDraw = null;
    else if (what === "brook-remove" && ui.brook) {
      if (commit({ k: "r-", at: ui.brook.at }, NO_BROOK)) {
        ui.brook = null;
        ui.bank = null;
      }
    } else if (what === "brook-unbend" && ui.brook) {
      const i = pickedBrook(L);
      const b = i >= 0 ? L.water[i].brook : null;
      if (b && ui.brook.dot >= 0 && b.p.length > 2) {
        const p = b.p.filter((_, k) => k !== ui.brook.dot);
        if (commit({ k: "r", at: ui.brook.at, p }, NO_BROOK, "straighten the brook")) ui.brook = { at: p[Math.max(0, ui.brook.dot - 1)], dot: -1 };
      }
    } else if ((what === "brook-narrower" || what === "brook-wider") && ui.brook) {
      const i = pickedBrook(L);
      const b = i >= 0 ? L.water[i].brook : null;
      if (b) {
        const now = b.w ?? 1;
        const w = r2(Math.min(BROOK_WIDTH[1], Math.max(BROOK_WIDTH[0], now * (what === "brook-wider" ? 1.2 : 1 / 1.2))));
        if (w === r2(now)) note(`That's as ${what === "brook-wider" ? "wide" : "narrow"} as a ${BROOK_KINDS[b.kind ?? 0].word.toLowerCase()} goes.`);
        else commit({ k: "r", at: ui.brook.at, w }, NO_BROOK, `brook ${what === "brook-wider" ? "wider" : "narrower"}`);
      }
    } else if ((what === "bank-0" || what === "bank-1" || what === "bank-both") && ui.brook) {
      const i = pickedBrook(L);
      if (i >= 0) {
        ui.bank = null;
        walls(L.water[i], what === "bank-both" ? [0, 1] : [Number(what.slice(5))], [0, 1], what === "bank-both" ? "wall both banks" : "wall a bank");
      }
    } else if (what === "bank-stretch" && ui.brook) ui.bank = ui.bank ? null : { first: null };
    else if (what === "bank-none" && ui.brook) {
      ui.bank = null;
      if (commit({ k: "r", at: ui.brook.at, banks: [] }, NO_BROOK)) note("No walls: its banks slope down to the water all along.");
    } else if (what === "path-undot" && ui.drawing) {
      ui.drawing.pop();
      if (!ui.drawing.length) ui.drawing = null;
    } else if (what === "path-cancel") ui.drawing = null;
    else if (what === "link-unbend" && pickedLink()) {
      const lk = pickedLink();
      const k = ui.link.dot;
      if (putLink(lk.number, linkDots(lk).filter((_, j) => j !== k))) ui.link = { number: lk.number, dot: -1 };
    } else if (what === "link-auto" && ui.link) {
      putLink(ui.link.number, null);
      ui.link = { number: ui.link.number, dot: -1 };
    } else if (what === "link-none" && ui.link) {
      if (putLink(ui.link.number, [])) {
        note("No path between those holes now. A button here puts it back.");
        ui.link = null;
      }
    } else if (what.startsWith("link-back:")) putLink(Number(what.slice(10)), null);
    else if (what === "path-remove" && ui.path) {
      if (commitPath({ k: "p-", at: ui.path.at })) ui.path = null;
    } else if (what === "path-unbend" && ui.path) {
      const i = pickedPath(L);
      const q = i >= 0 ? L.paths[i].p[ui.path.dot] : null;
      if (q && commitPath({ k: "p", at: [q[0], q[1]], drop: 1 })) ui.path = { at: L.paths[i].p[ui.path.dot === 0 ? 1 : 0], dot: -1 };
    } else if (what === "path-left" || what === "path-right" || what === "path-none") {
      const side = what === "path-left" ? -1 : what === "path-right" ? 1 : 0;
      ui.path = null;
      if (commitPath({ k: "pa", s: side }, side ? undefined : "no cart path")) {
        if (side) note(`A cart path down the ${side < 0 ? "left" : "right"}. Tap it to change it.`);
      } else if (side) note(`There's no way down the ${side < 0 ? "left" : "right"} of this hole clear of its water, sand, green and tee - try the ${side < 0 ? "right" : "left"}, or tap empty ground to draw one where you want it.`);
    } else if (what === "narrower" || what === "wider") {
      // The picked fairway (a hole from a map or on hills), or a designed
      // hole's one fairway.
      const pick = pickedFairway(L);
      const now = pick ? fairwayWidth(stored(), pick.at) : st.fw;
      const f = r2(Math.min(1.8, Math.max(0.5, now + (what === "wider" ? 0.1 : -0.1))));
      if (f === r2(now)) note(`That's as ${what === "wider" ? "wide" : "narrow"} as a fairway goes.`);
      else commit(pick ? { k: "f", at: pick.at, f } : { k: "fw", f }, NO_SHAPE, `fairway ${what}`);
    } else if (what === "cw-narrower" || what === "cw-wider") {
      const look = causewayLook(L);
      const w = Math.min(CAUSEWAY.widths[1], Math.max(CAUSEWAY.widths[0], look.w + (what === "cw-wider" ? 1 : -1)));
      if (w === look.w) note(`That's as ${what === "cw-wider" ? "wide" : "narrow"} as a causeway goes.`);
      else commit(causewayEdit({ w }), NO_CAUSEWAY, `causeway ${what === "cw-wider" ? "wider" : "narrower"}`);
    } else if (what === "cw-reset") {
      if (commit({ k: "cw", w: CAUSEWAY.width, e: 1 }, NO_CAUSEWAY, "causeway its own way again")) note("The causeway's as it was made: 5 m wide, the way it finds by itself.");
    } else if (what === "remove-fairway") {
      const pick = pickedFairway(L);
      if (pick && commit({ k: "f-", at: pick.at }, NO_SHAPE, "remove fairway")) {
        ui.selected = null;
        note("That fairway's gone - rough there now. Undo brings it back.");
      }
    }
    refresh();
  }

  el.querySelectorAll("[data-tool]").forEach((b) =>
    b.addEventListener("click", () => {
      const from = ui.tool;
      ui.tool = b.dataset.tool;
      ui.foreign = null;
      ui.selected = null;
      ui.path = null;
      ui.drawing = null;
      ui.brook = null;
      ui.brookDraw = null;
      ui.bank = null;
      note("");
      // The green and the bunkers are small on the whole hole: look
      // closer - and back out again on leaving them for another tool.
      if (from === ui.tool) return refresh();
      if (ZOOMING.has(ui.tool) && !ZOOMING.has(from)) ui.before = ui.view;
      if (ui.tool === "green" && (from === "bunkers" || ui.view.zoom <= 1)) {
        // Close enough to shape it in detail, with its bank and bunkers.
        const g = edited().green;
        lookAt(g, Math.max(36, Math.max(g.rx, g.rz) * 2 + 16));
      }
      else if (ui.tool === "bunkers") lookAtBunkers();
      else if (!ZOOMING.has(ui.tool) && ZOOMING.has(from) && ui.before) {
        ui.view = ui.before;
        ui.before = null;
      }
      refresh();
    }),
  );
  $("#hand-undo").addEventListener("click", undo);
  $("#hand-redo").addEventListener("click", redo);
  $("#hand-history").addEventListener("click", () => {
    ui.historyOpen = !ui.historyOpen;
    historyButtons();
  });
  $("#hand-reset").addEventListener("click", async () => {
    if (!stored().edits?.length) return;
    if (!(await ask(`Put hole ${number} back as it was? Everything changed on it by hand goes (Undo brings it back).`, { yes: "Put it back", danger: true }))) return;
    ui.picked = [];
    ui.selected = null;
    setEdits([]);
    remember("put hole back", []);
    refresh();
  });
  $("#hand-play").addEventListener("click", play);
  $("#zoom-in").addEventListener("click", () => zoomAt([canvas.width / 2, canvas.height / 2], 1.6));
  $("#zoom-out").addEventListener("click", () => zoomAt([canvas.width / 2, canvas.height / 2], 1 / 1.6));
  $("#zoom-all").addEventListener("click", () => {
    ui.view = { zoom: 1, at: null };
    ui.before = null;
    redraw();
  });

  // ---- Looking closer ---------------------------------------------------------------

  // The view that puts hole point p under canvas point c at zoom z.
  const viewFor = (p, c, z) => {
    if (z <= 1.01) return { zoom: 1, at: null };
    const whole = fitHole(edited(), canvas.width, canvas.height);
    const w = whole.toCanvas(p);
    return { zoom: z, at: whole.fromCanvas([w[0] - (c[0] - canvas.width / 2) / z, w[1] - (c[1] - canvas.height / 2) / z]) };
  };
  const zoomAt = (c, factor) => {
    const p = fit.fromCanvas(c);
    ui.view = viewFor(p, c, Math.min(16, Math.max(1, ui.view.zoom * factor)));
    redraw();
  };
  // Frames a shape, `span` metres across.
  const lookAt = (s, span) => {
    const whole = fitHole(edited(), canvas.width, canvas.height);
    const z = Math.min(16, Math.max(1, canvas.width / (whole.scale * span)));
    ui.view = viewFor([s.x, s.z], [canvas.width / 2, canvas.height / 2], z);
  };
  // Choosing Bunkers: all the hole's bunkers, as close as they fit.
  const lookAtBunkers = () => {
    const bs = edited().bunkers;
    if (!bs.length) return;
    const x0 = Math.min(...bs.map((b) => b.x - Math.max(b.rx, b.rz)));
    const x1 = Math.max(...bs.map((b) => b.x + Math.max(b.rx, b.rz)));
    const z0 = Math.min(...bs.map((b) => b.z - Math.max(b.rx, b.rz)));
    const z1 = Math.max(...bs.map((b) => b.z + Math.max(b.rx, b.rz)));
    // The map is taller than it is wide, and turned to run up the hole:
    // the longer side of the box fits its height.
    const span = Math.max(50, Math.max(x1 - x0, z1 - z0) * (canvas.width / canvas.height) + 20, Math.min(x1 - x0, z1 - z0) + 20);
    lookAt({ x: (x0 + x1) / 2, z: (z0 + z1) / 2 }, span);
  };
  // A bunker picked: close enough that its handle moves it a little at a
  // time (a whole-hole view made a small drag a big change), unless
  // already closer.
  const lookAtBunker = (b) => {
    const span = Math.max(30, Math.max(b.rx, b.rz) * 5);
    if (fit && canvas.width / fit.scale <= span * 1.05) {
      // Close enough already; just keep it on the map.
      return keepOnMap(b);
    }
    lookAt(b, span);
  };
  // Something just changed off the edge of the map: move the map to it,
  // as close as it is now.
  // (All of it, as far as it fits: its middle at least its size in from
  // the edges.)
  const keepOnMap = (b) => {
    if (!fit || ui.view.zoom <= 1) return;
    const [x, y] = fit.toCanvas([b.x, b.z]);
    const m = Math.min(canvas.width / 3, 30 + Math.max(b.rx ?? 0, b.rz ?? 0) * fit.scale);
    if (x < m || y < m || x > canvas.width - m || y > canvas.height - m) ui.view = viewFor([b.x, b.z], [canvas.width / 2, canvas.height / 2], ui.view.zoom);
  };
  // Dragging a bunker or pond up to the map's edge while looking closely:
  // the map moves along under it, so it can be taken as far as it needs
  // to go (or zoom out and drag it there).
  const EDGE = 40;
  const edgePush = ([x, y]) => [
    x < EDGE ? x - EDGE : x > canvas.width - EDGE ? x - (canvas.width - EDGE) : 0,
    y < EDGE ? y - EDGE : y > canvas.height - EDGE ? y - (canvas.height - EDGE) : 0,
  ];
  function edgePan() {
    const g = gesture;
    if (!g || g.type !== "shape" || !pending || ui.view.zoom <= 1 || !fit) {
      if (g) g.panning = false;
      return;
    }
    const [vx, vy] = edgePush(g.last);
    if (!vx && !vy) {
      g.panning = false;
      g.panAt = null;
      return;
    }
    // Faster the nearer the edge: at most about a third of the map a
    // second, however quickly the screen redraws.
    const t = performance.now();
    const k = Math.min(0.2, 0.08 * ((t - (g.panAt ?? t - 16)) / 16));
    g.panAt = t;
    const mid = [canvas.width / 2, canvas.height / 2];
    const centre = fit.fromCanvas(mid);
    const to = fit.fromCanvas([mid[0] + vx * k, mid[1] + vy * k]);
    ui.view = viewFor(to, mid, ui.view.zoom);
    // The spot under the finger moves on by as much, and the shape with it.
    const p = fit.fromCanvas(g.last);
    pending = { ...pending, d: [r2(p[0] + to[0] - centre[0] - g.startHole[0]), r2(p[1] + to[1] - centre[1] - g.startHole[1])] };
    draw();
    requestAnimationFrame(edgePan);
  }
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoomAt(toPx(e), Math.exp(-e.deltaY * 0.0015));
    },
    { passive: false },
  );

  // ---- Pointer --------------------------------------------------------------------------

  // While a finger (or the mouse button) is down on the map, the buttons
  // above it can change - pressing on a bunker brings up its buttons -
  // which would push the map down the page under the finger, and a drag
  // would then land somewhere else. So while it's pressed the page is
  // scrolled by however far the map was pushed, keeping it still on the
  // screen, and the map's place when pressed is what the finger is
  // measured against. When the finger lifts, the page scrolls back so the
  // new buttons are in view.
  let pressed = null; // { rect, box, shifted }: the map when pressed
  const scroller = () => {
    for (let n = canvas.parentElement; n; n = n.parentElement) {
      const o = getComputedStyle(n).overflowY;
      if ((o === "auto" || o === "scroll") && n.scrollHeight > n.clientHeight) return n;
    }
    return document.scrollingElement ?? document.documentElement;
  };
  const steady = (handler) => (e) => {
    const top = canvas.getBoundingClientRect().top;
    handler(e);
    if (!pressed) return;
    const dy = canvas.getBoundingClientRect().top - top;
    if (Math.abs(dy) > 0.5) {
      const was = pressed.box.scrollTop;
      pressed.box.scrollTop = was + dy;
      pressed.shifted += pressed.box.scrollTop - was;
    }
  };
  const press = () => {
    if (pressed) return;
    const box = scroller();
    pressed = { rect: canvas.getBoundingClientRect(), box, shifted: 0 };
  };
  const lift = () => {
    if (!pressed || pointers.size) return;
    const { box, shifted } = pressed;
    pressed = null;
    if (shifted) box.scrollTop -= shifted;
  };

  const toPx = (e) => {
    const r = pressed?.rect ?? canvas.getBoundingClientRect();
    return [((e.clientX - r.left) * canvas.width) / r.width, ((e.clientY - r.top) * canvas.height) / r.height];
  };
  const pointers = new Map();
  const slop = (e) => (e.pointerType === "touch" ? 14 : 6);

  const treeUnder = (L, c, e) => {
    let best = null;
    let bd = Infinity;
    for (const t of L.trees) {
      const [x, y] = px(t);
      const d = Math.hypot(x - c[0], y - c[1]);
      const reach = Math.max(7, crownOf(t) * 0.8 * fit.scale) + (e.pointerType === "touch" ? 8 : 3);
      if (d <= reach && d < bd) {
        bd = d;
        best = t;
      }
    }
    return best;
  };

  canvas.addEventListener("pointerdown", steady((e) => {
    if (!fit) return;
    press();
    canvas.setPointerCapture(e.pointerId);
    const c = toPx(e);
    pointers.set(e.pointerId, c);
    if (pointers.size === 2) {
      // Two fingers: look closer or further, whatever the tool.
      pending = null;
      const [a, b] = [...pointers.values()];
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      gesture = { type: "pinch", d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, z0: ui.view.zoom, p: fit.fromCanvas(mid) };
      redraw();
      return;
    }
    if (pointers.size > 2) return;
    const p = fit.fromCanvas(c);
    const L = edited();
    const base = { start: c, startHole: p, last: c, moved: false, touch: e.pointerType === "touch" };
    // Middle or right button: always look around. (A tap with Look on
    // another hole's shape says whose it is: finish, below.)
    if (e.button === 1 || e.button === 2 || ui.tool === "look") {
      gesture = { ...base, type: "pan", other: e.button === 0 ? foreignAt(p) : null };
      return;
    }
    // Decor: tap to place or take away, drag to move (finish, below).
    if (ui.tool === "decor") {
      const reach = Math.max(DECOR.near, (base.touch ? 14 : 8) / fit.scale);
      gesture = { ...base, type: "decor", item: decorNear(L, p, reach), other: foreignAt(p) };
      return;
    }
    const mode = ui.mode[ui.tool];
    // Another hole's shape: not this hole's to change. Sand, water and
    // fairways aren't picked or put on it, nor trees planted; a drag still
    // looks round, and a tap says whose it is.
    const other = foreignAt(p);
    if (other) {
      const list = shapeTool()?.list ?? null;
      const tol = (base.touch ? 12 : 6) / fit.scale;
      const ownHit =
        list != null
          ? (() => {
              const i = shapeUnder(L[list] ?? [], p[0], p[1], tol);
              return i >= 0 && !foreignOf(list, L[list][i]);
            })()
          : ui.tool === "fairway"
            ? fairwayAt(fairwaysOf(L).map((f) => f.poly), p, tol) >= 0
            : true;
      const blocked = list != null || ui.tool === "fairway" ? !ownHit : ui.tool === "trees" && mode === "plant";
      if (blocked) {
        gesture = { ...base, type: "pan", other };
        return;
      }
    }
    const brush = L.source !== "map" && edgeBrush(ui.tool, mode);
    if (brush) {
      // A rub of an edge brush (the fairway's, the rough's): one edit
      // however long it goes on. Smoothing the rough smooths whichever of
      // its edges the rub starts nearer.
      let band = brush.band;
      if (!band) {
        const path = makePath(L.path);
        const n = nearest(path, p[0], p[1]);
        const side = n.d < 0 ? -1 : 1;
        const half = fairwayHalfWidth(L.fairway, n.s, side);
        const cutEdge = half + firstCutWidth(L, n.s, side);
        band = Math.abs(Math.abs(n.d) - cutEdge) < Math.abs(Math.abs(n.d) - deepRoughFrom(L, n.s, side, half)) ? "cut" : "deep";
      }
      gesture = { ...base, type: "edge" };
      pending = brush.smooth ? { k: "edge", band, p: [], r: edgeReach(), smooth: 1 } : { k: "edge", band, p: [], r: edgeReach(), a: brush.a };
      edgeDab(p);
      return redraw();
    }
    if (ui.tool === "ground" && mode !== "tilt") {
      // A rub of the ground brush: one edit however long it goes on.
      const r = BRUSH_SIZES[ui.ground.size];
      const a = BRUSH_STEPS[ui.ground.step] * (mode === "lower" ? -1 : 1);
      gesture = { ...base, type: "ground" };
      pending = mode === "smooth" ? { k: "gs", p: [], r } : { k: "gr", p: [], r, a };
      groundDab(p);
      return redraw();
    }
    if (ui.tool === "trees") {
      const hit = treeUnder(L, c, e);
      const picked = pickedTrees(L);
      if (hit && (mode === "move" || (mode === "pick" && picked.includes(hit)))) {
        const group = picked.includes(hit) ? picked : [hit];
        gesture = { ...base, type: "trees", group: group.map((t) => [t[0], t[1]]) };
      } else if (mode === "pick") gesture = { ...base, type: "lasso", ring: [c] };
      else if (mode === "plant") {
        gesture = { ...base, type: "plant" };
        pending = edited().links ? { ...linksPlanting(linksPlant(ui.linksPlant), []), links: true } : { k: "t+", p: [], ...(ui.plantKind != null ? { kind: ui.plantKind } : {}) };
        dab(p);
      } else if (mode === "remove") {
        gesture = { ...base, type: "erase" };
        pending = { k: "t-", p: [] };
        rub(p);
      } else gesture = { ...base, type: "empty" };
    } else if (shapeTool()) {
      const list = shapeTool().list;
      const sel = selectedShape(L);
      const h = sel && sizeHandle(sel);
      const onSel = sel && shapeUnder([sel], p[0], p[1]) === 0;
      // The picked shape's wall: an end dot slides that end round the edge;
      // the wall's line itself slides the whole wall.
      const ends = sel ? wallEnds(sel).map(px) : [];
      const end = ends.findIndex((q) => Math.hypot(q[0] - c[0], q[1] - c[1]) < (base.touch ? 22 : 14));
      const onWall = sel && wallOf(sel) && lineDistance(wallLine(sel).pts.map(px), c[0], c[1]) < (base.touch ? 14 : 8);
      // A pond's (or an added fairway's) blue marks: one dragged pulls its
      // edge in or out there.
      const marks = sel && list !== "bunkers" && !sel.brook ? edgeMarks(sel).map(px) : [];
      const mark = marks.findIndex((q) => Math.hypot(q[0] - c[0], q[1] - c[1]) < (base.touch ? 20 : 12));
      if (end >= 0 || onWall) {
        gesture = { ...base, type: "wall", shape: sel, wall: wallOf(sel), which: end >= 0 ? end : "move" };
      } else if (mark >= 0) {
        gesture = { ...base, type: "mark", shape: sel, k: mark };
      } else if (h && !onSel && Math.hypot(h[0] - c[0], h[1] - c[1]) < (base.touch ? 22 : 14)) {
        // Sized by how far the dot is taken from the middle, against how
        // far it started.
        const from = fit.fromCanvas(h);
        gesture = { ...base, type: "size", shape: sel, d0: Math.max(0.5, Math.hypot(from[0] - sel.x, from[1] - sel.z)), grab: [from[0] - p[0], from[1] - p[1]] };
      } else {
        const hit = shapeUnder(L[list] ?? [], p[0], p[1], (base.touch ? 12 : 6) / fit.scale);
        const theirs = hit >= 0 ? foreignOf(list, L[list][hit]) : null;
        const i = theirs ? -1 : hit;
        if (theirs) {
          gesture = { ...base, type: "pan", other: theirs };
          return;
        }
        if (i >= 0 && L[list][i].brook) {
          // (A brook's changed by its line, with its own tool.)
          note("That's a brook: change it with the Brook tool.");
          gesture = { ...base, type: "pan" };
        } else if (i >= 0) {
          const s = L[list][i];
          ui.selected = { list, at: [s.x, s.z] };
          gesture = { ...base, type: "shape", shape: s };
          refresh();
        } else gesture = { ...base, type: "empty" };
      }
    } else if (ui.tool === "fairway" && mode === "causeway" && L.source !== "map") {
      // The yellow dot at a causeway's land end: dragged, it aims it.
      const way = causeways(L).find((w) => Math.hypot(px(w.b)[0] - c[0], px(w.b)[1] - c[1]) < (base.touch ? 22 : 14));
      gesture = way ? { ...base, type: "cwAim" } : { ...base, type: "empty" };
    } else if (ui.tool === "fairway" && L.source === "map") {
      // A fairway tapped: picked. (A drag looks around, as on empty ground.)
      const list = fairwaysOf(L);
      const i = list.length ? fairwayAt(list.map((f) => f.poly), p, (base.touch ? 12 : 6) / fit.scale) : -1;
      if (i >= 0) {
        ui.selected = { list: "fairways", at: list[i].at };
        refresh();
      }
      gesture = { ...base, type: "empty", fairway: i >= 0 };
    } else if (ui.tool === "paths") {
      const tol = base.touch ? 22 : 12;
      const paths = L.paths ?? [];
      const i = ui.drawing ? -1 : pickedPath(L);
      // The picked path between holes: a dot on it (nearest first), or its
      // line - dragged, a new bend there.
      const lk = ui.drawing ? null : pickedLink();
      const lkDots = lk ? linkDots(lk) : null;
      let lkDot = -1;
      if (lk) {
        let bd = tol;
        lkDots.forEach((q, j) => {
          const d = Math.hypot(px(q)[0] - c[0], px(q)[1] - c[1]);
          if (d < bd) {
            bd = d;
            lkDot = j;
          }
        });
      }
      const near = Math.max(1.5, tol / fit.scale);
      const onLink = (l, dots) => {
        const g = lineGap(pathLine({ p: dots }).pts, p);
        return g.d < near ? lineGap(dots, p).seg : -1;
      };
      // A dot (bend) on the picked path, nearest first.
      let k = -1;
      if (i >= 0) {
        let bd = tol;
        paths[i].p.forEach((q, j) => {
          const d = Math.hypot(px(q)[0] - c[0], px(q)[1] - c[1]);
          if (d < bd) {
            bd = d;
            k = j;
          }
        });
      }
      const lkSeg = lk && lkDot < 0 && k < 0 ? onLink(lk, lkDots) : -1;
      if (ui.drawing) gesture = { ...base, type: "empty" };
      else if (lkDot >= 0) {
        ui.link = { number: lk.number, dot: lkDot };
        gesture = { ...base, type: "linkDot", number: lk.number, dots: lkDots, k: lkDot };
        context();
      } else if (lkSeg >= 0) gesture = { ...base, type: "linkLine", number: lk.number, dots: lkDots, seg: lkSeg, at: [r2(p[0]), r2(p[1])], wasPicked: true };
      else if (k >= 0) {
        const q = paths[i].p[k];
        ui.path = { at: [q[0], q[1]], dot: k };
        ui.link = null;
        gesture = { ...base, type: "pathDot", at: [q[0], q[1]] };
        context();
      } else {
        const j = pathAt(paths, p, near);
        // Or a path between holes, not picked: picked (and, dragged, bent).
        const other = j >= 0 ? null : holeLinks().find((l) => !l.removed && l.number !== lk?.number && onLink(l, l.line) >= 0);
        if (j >= 0) {
          // The spot on its line under the finger: where a bend would go.
          const on = nearestOn(paths[j], p);
          const wasPicked = j === i;
          ui.path = { at: on, dot: -1 };
          ui.link = null;
          gesture = { ...base, type: "pathMove", at: on, wasPicked };
          context();
        } else if (other) {
          const dots = linkDots(other);
          ui.path = null;
          ui.link = { number: other.number, dot: -1 };
          gesture = { ...base, type: "linkLine", number: other.number, dots, seg: lineGap(dots, p).seg, at: [r2(p[0]), r2(p[1])], wasPicked: false };
          refresh();
        } else gesture = { ...base, type: "empty" };
      }
    } else if (ui.tool === "brooks") {
      const tol = base.touch ? 22 : 12;
      const i = ui.brookDraw ? -1 : pickedBrook(L);
      // A dot (bend) on the picked brook, nearest first.
      let k = -1;
      if (i >= 0) {
        let bd = tol;
        L.water[i].brook.p.forEach((q, j) => {
          const d = Math.hypot(px(q)[0] - c[0], px(q)[1] - c[1]);
          if (d < bd) {
            bd = d;
            k = j;
          }
        });
      }
      if (ui.brookDraw || ui.bank) gesture = { ...base, type: "empty" };
      else if (k >= 0) {
        const q = L.water[i].brook.p[k];
        ui.brook = { at: [q[0], q[1]], dot: k };
        gesture = { ...base, type: "brookDot", at: [q[0], q[1]], k, dots: L.water[i].brook.p };
        context();
      } else {
        const j = brookAt(L.water, p[0], p[1], Math.max(1.5, tol / fit.scale));
        if (j >= 0) {
          const line = brookLine(L.water[j].brook);
          const on = alongLine(line, nearestOnLine(line, p[0], p[1]).u).p.map(r2);
          const wasPicked = j === i;
          ui.brook = { at: on, dot: -1 };
          gesture = { ...base, type: "brookMove", at: on, wasPicked, dots: L.water[j].brook.p };
          context();
        } else {
          const b = L.water.find((w) => w.burn && !w.brook && insideBlob(w, p[0], p[1], 2));
          gesture = b ? { ...base, type: "burn", w: b } : { ...base, type: "empty" };
        }
      }
    } else if (ui.tool === "green") {
      const g0 = stored().green;
      const st = editState(stored().edits);
      if (mode === "shape") {
        const pin = px(L.pin);
        const handles = greenHandles(g0, st.green).map(px);
        const k = handles.findIndex((q) => Math.hypot(q[0] - c[0], q[1] - c[1]) < (base.touch ? 20 : 12));
        if (k >= 0) gesture = { ...base, type: "handle", k, g0, st };
        else if (Math.hypot(pin[0] - c[0], pin[1] - c[1]) < (base.touch ? 26 : 16) || (Math.abs(pin[0] - c[0]) < 14 && c[1] < pin[1] && pin[1] - c[1] < 30)) gesture = { ...base, type: "pin" };
        else gesture = { ...base, type: "empty" };
      } else if (mode === "tilt") gesture = { ...base, type: "tilt" };
      else if (mode === "area") gesture = { ...base, type: "empty" };
      else if (mode === "brush" && onGreen(p)) {
        gesture = { ...base, type: "sculpt", grid: sculptGrid(), ground: groundNow() };
        sculptDab(p);
      } else if (mode === "stamps") {
        const tol = base.touch ? 22 : 14;
        const sp = pickedStamp();
        // A handle, if the press is nearer it than the stamp's middle (on
        // a small stamp far out on the map they all but touch).
        const far = (q) => Math.hypot(px(q)[0] - c[0], px(q)[1] - c[1]);
        const hd = sp && sculpt.stampHandles(sp);
        const mid = sp ? far([sp[1], sp[2]]) : Infinity;
        const which = hd && ["end", "side"].filter((k) => far(hd[k]) < tol && far(hd[k]) < mid).sort((a, b) => far(hd[a]) - far(hd[b]))[0];
        if (which) gesture = { ...base, type: which === "end" ? "stampEnd" : "stampSide", i: ui.shaping.picked };
        else {
          // On a stamp (or nearly): pick it and drag it.
          const stamps = editState(stored().edits).sculpt?.s ?? [];
          let best = -1;
          let bd = -Math.max(0.3, tol / 2 / fit.scale);
          stamps.forEach((q, i) => {
            const d = sculpt.stampDepth(q, p[0], p[1]);
            if (d > bd) {
              bd = d;
              best = i;
            }
          });
          if (best >= 0) {
            ui.shaping.picked = best;
            gesture = { ...base, type: "stampMove", i: best };
            context();
          } else gesture = { ...base, type: "stampNew" };
        }
      } else gesture = { ...base, type: "empty" };
    } else gesture = { ...base, type: "empty" };
    redraw();
  }));

  canvas.addEventListener("pointermove", steady((e) => {
    const c = toPx(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, c);
    if (!gesture) {
      hover = e.pointerType === "mouse" ? c : null;
      if (hover) redraw();
      return;
    }
    if (gesture.type === "pinch") {
      if (pointers.size < 2) return;
      const [a, b] = [...pointers.values()];
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const z = Math.min(16, Math.max(1, (gesture.z0 * Math.hypot(a[0] - b[0], a[1] - b[1])) / gesture.d0));
      ui.view = viewFor(gesture.p, mid, z);
      redraw();
      return;
    }
    if (!pointers.has(e.pointerId)) return;
    if (!gesture.moved && Math.hypot(c[0] - gesture.start[0], c[1] - gesture.start[1]) < slop(e)) return;
    gesture.moved = true;
    gesture.last = c;
    const p = fit.fromCanvas(c);
    const d = [r2(p[0] - gesture.startHole[0]), r2(p[1] - gesture.startHole[1])];
    switch (gesture.type) {
      case "empty":
        gesture.type = "pan";
      // falls through
      case "pan":
        if (ui.view.zoom > 1) ui.view = viewFor(gesture.startHole, c, ui.view.zoom);
        break;
      case "trees":
        pending = { k: "tm", p: gesture.group, d };
        break;
      case "lasso":
        gesture.ring.push(c);
        break;
      case "plant":
        dab(p);
        break;
      case "ground":
        groundDab(p);
        break;
      case "edge":
        edgeDab(p);
        break;
      case "erase":
        rub(p);
        break;
      case "shape": {
        pending = { k: shapeTool().k, at: [gesture.shape.x, gesture.shape.z], d };
        const [vx, vy] = edgePush(c);
        if (!gesture.panning && ui.view.zoom > 1 && (vx || vy)) {
          gesture.panning = true;
          requestAnimationFrame(edgePan);
        }
        break;
      }
      case "wall": {
        const g = gesture;
        const kind = ui.tool === "water" ? "water" : "bunker";
        const next = wallFromDrag(g.shape, g.wall, g.which, p[0], p[1], kind, g.startHole);
        g.wallBad = !next;
        if (next) pending = { k: ui.tool === "water" ? "w" : "b", at: [g.shape.x, g.shape.z], wall: next };
        break;
      }
      case "pathDot":
        pending = { k: "p", at: gesture.at, d };
        break;
      case "brookDot":
      case "brookMove":
        gesture.d = d;
        pending = { k: "r", at: gesture.at, p: gesture.dots.map((q, j) => (gesture.type === "brookMove" || j === gesture.k ? [r2(q[0] + d[0]), r2(q[1] + d[1])] : q)) };
        break;
      case "pathMove":
        pending = { k: "p", at: gesture.at, d, all: 1 };
        break;
      // A path between holes: a dot moved, or its line bent at a new one.
      case "linkDot":
        gesture.line = gesture.dots.map((q, j) => (j === gesture.k ? [r2(q[0] + d[0]), r2(q[1] + d[1])] : q));
        break;
      case "linkLine":
        if (gesture.dots.length < MAX_POINTS) gesture.line = [...gesture.dots.slice(0, gesture.seg), [r2(gesture.at[0] + d[0]), r2(gesture.at[1] + d[1])], ...gesture.dots.slice(gesture.seg)];
        break;
      case "cwAim":
        pending = causewayEdit({ to: [r2(p[0]), r2(p[1])] });
        break;
      case "mark": {
        const s = gesture.shape;
        const h = edgeOf(s).slice();
        h[gesture.k] = r2(edgeMarkSize(s, gesture.k, p[0], p[1]));
        pending = { k: shapeTool().k, at: [s.x, s.z], h };
        break;
      }
      case "size": {
        const s = gesture.shape;
        const f = Math.min(3, Math.max(0.3, Math.hypot(p[0] + gesture.grab[0] - s.x, p[1] + gesture.grab[1] - s.z) / gesture.d0));
        pending = { k: shapeTool().k, at: [s.x, s.z], f: r2(f) };
        break;
      }
      case "handle": {
        const h = gesture.st.green.h.slice();
        h[gesture.k] = r2(handleSize(gesture.g0, gesture.k, gesture.st.green.f, p[0], p[1]));
        pending = { k: "g", h, f: gesture.st.green.f };
        break;
      }
      case "pin":
        pending = { k: "pin", p: [r2(p[0]), r2(p[1])] };
        break;
      case "tilt": {
        const g = edited().green;
        const len = Math.hypot(d[0], d[1]);
        const R = Math.max(g.rx, g.rz);
        const n = len < R * 0.45 ? 1 : len < R * 0.9 ? 2 : 3;
        pending = { k: "tilt", a: Math.round(Math.atan2(d[1], d[0]) * 1000) / 1000, n };
        break;
      }
      case "sculpt":
        sculptDab(p);
        break;
      case "stampMove":
      case "stampEnd":
      case "stampSide":
        stampPending(gesture, p);
        break;
      case "stampNew":
        gesture.type = "pan";
        if (ui.view.zoom > 1) ui.view = viewFor(gesture.startHole, c, ui.view.zoom);
        break;
    }
    redraw();
  }));

  const finish = (e, cancelled = false) => {
    pointers.delete(e.pointerId);
    if (!gesture) return;
    if (gesture.type === "pinch") {
      if (pointers.size === 0) gesture = null;
      return;
    }
    const g = gesture;
    gesture = null;
    const edit = pending;
    pending = null;
    if (cancelled) return refresh();
    const p = g.startHole;
    const L = edited();
    if (g.type === "decor") {
      const to = fit.fromCanvas(g.last ?? g.start);
      const mode = ui.mode.decor;
      ui.foreign = null;
      if (mode === "place" && !g.moved) {
        const off = neighbourGroundAt(to);
        if (off) note(noTreeThere(off, "Decor"));
        else if (g.other?.list === "trees" || g.other?.list === "decor") ui.foreign = g.other;
        else if (commit({ k: "d+", p: [[r2(to[0]), r2(to[1]), 1]], kind: ui.decorKind }, NO_DECOR)) note(`${DECOR_WORDS[ui.decorKind]} placed. Undo takes it away.`);
      } else if (mode === "remove" && !g.moved) {
        if (g.item) commit({ k: "d-", p: [[g.item[0], g.item[1]]] }, NO_DECOR);
        else if (g.other) ui.foreign = g.other;
      } else if (mode === "move" && g.item && g.moved) {
        const d = [r2(to[0] - g.item[0]), r2(to[1] - g.item[1])];
        const off = neighbourGroundAt(to);
        if (off) note(noTreeThere(off, "Decor"));
        else commit({ k: "dm", p: [[g.item[0], g.item[1]]], d }, NO_DECOR);
      } else if (!g.moved && g.other) ui.foreign = g.other;
      return refresh();
    }
    // A tap that only looked: on another hole's shape, whose it is.
    if (!g.moved && g.type === "pan") {
      ui.foreign = g.other ?? null;
      return refresh();
    }
    if (!g.moved) ui.foreign = null;
    // A bunker picked with a tap: look closer at it.
    if (!g.moved && g.type === "shape" && ui.tool === "bunkers") lookAtBunker(g.shape);
    if (g.type === "cwAim") {
      if (edit && commit(edit, NO_CAUSEWAY, "turn the causeway")) note("The causeway runs the way out from the green nearest where you let go, and on over the land up to it.");
      return refresh();
    }
    if (g.type === "edge") {
      if (edit?.p?.length) commit(edit, edit.band === "fw" ? "The fairway's as wide (or narrow) there as it goes." : "That edge is as far as it goes there.");
      return refresh();
    }
    if (g.type === "ground") {
      const m = ui.mode.ground;
      if (edit?.p?.length) commit(edit, "This hole has no ground to change.", m === "smooth" ? "smooth the ground" : `${m} the ground`);
      return refresh();
    }
    if (g.type === "sculpt") {
      const a = ui.shaping.action;
      if (edit) commit(edit, NO_SHAPING, a === "smooth" ? "smooth the green" : `${a} the green`);
      return refresh();
    }
    if (g.type.startsWith("stamp")) {
      const sp = g.grid?.stamps[g.i];
      const word = sp ? STAMP_NAMES[sp[0]] : "";
      if (edit) commit(edit, NO_SHAPING, g.type === "stampMove" ? `move the ${word}` : g.type === "stampEnd" ? `stretch or turn the ${word}` : `make the ${word} wider or narrower`);
      else if (g.type === "stampNew") {
        // A tap on bare green puts the next shape down there (letting go of
        // the one picked); a tap off it just lets go.
        if (!onGreen(p)) {
          if (ui.shaping.picked >= 0) ui.shaping.picked = -1;
          else note("Stamp shapes on the green itself.");
        } else {
          const grid = sculptGrid();
          if (grid.stamps.length >= sculpt.MAX_STAMPS) note("That's as many shapes as a green can take. Smooth the whole green to press them in.");
          else {
            const k = ui.shaping.stamp;
            // Lying across the line of play; a crescent bowed towards it.
            const turn = sculpt.approachOf(edited()) + Math.PI / 2;
            grid.stamps.push(sculpt.newStamp(k, p[0], p[1], ui.shaping.sign * 0.15, turn));
            if (commitShape(grid, `add a ${STAMP_NAMES[k]}`) !== false) {
              ui.shaping.picked = grid.stamps.length - 1;
              note(`Tap the green again for another ${STAMP_NAMES[k]}, or Done to choose a different shape.`);
            }
          }
        }
      }
      return refresh();
    }
    if (g.type === "wall") {
      if (edit && commit(edit, NO_WALL[ui.tool === "water" ? "water" : "bunkers"], "move the wall")) note("");
      else if (g.wallBad) note(NO_WALL[ui.tool === "water" ? "water" : "bunkers"]);
      return refresh();
    }
    if (g.type === "brookDot" || g.type === "brookMove") {
      if (!g.moved) {
        // A tap on the picked brook between its dots: a bend there.
        if (g.type === "brookMove" && g.wasPicked) {
          const line = brookLine({ p: g.dots });
          const u = nearestOnLine(line, ...g.at).u;
          const at = g.dots.findIndex((q, j) => j > 0 && nearestOnLine(line, q[0], q[1]).u > u);
          const j = at < 0 ? g.dots.length - 1 : at;
          if (g.dots.length >= 40) note("That brook has as many bends as it can take.");
          else if (commit({ k: "r", at: g.at, p: [...g.dots.slice(0, j), g.at, ...g.dots.slice(j)] }, NO_BROOK, "bend the brook")) {
            ui.brook = { at: g.at, dot: j };
            note("A new bend: drag its dot to move that bit of the brook.");
          }
        }
        return refresh();
      }
      if (edit && commit(edit, NO_BROOK, g.type === "brookMove" ? "move the brook" : "move part of the brook")) ui.brook = { at: [r2(g.at[0] + g.d[0]), r2(g.at[1] + g.d[1])], dot: g.type === "brookDot" ? g.k : -1 };
      return refresh();
    }
    if (g.type === "burn") {
      if (!g.moved) burnToBrook(g.w);
      return refresh();
    }
    if (g.type === "linkDot" || g.type === "linkLine") {
      const full = g.type === "linkLine" && g.dots.length >= MAX_POINTS;
      if (!g.moved) {
        // A tap on the picked one between its dots: a bend there.
        if (g.type === "linkLine" && g.wasPicked) {
          if (full) note("That path has as many bends as it can take.");
          else if (putLink(g.number, [...g.dots.slice(0, g.seg), g.at, ...g.dots.slice(g.seg)])) {
            ui.link = { number: g.number, dot: g.seg };
            note("A new bend: drag its dot to move that bit of the path.");
          }
        }
        return refresh();
      }
      if (full) note("That path has as many bends as it can take.");
      else if (g.line && putLink(g.number, g.line)) ui.link = { number: g.number, dot: g.type === "linkDot" ? g.k : g.seg };
      return refresh();
    }
    if (g.type === "pathDot" || g.type === "pathMove") {
      if (!g.moved) {
        // A tap on the picked path between its dots: a bend there.
        if (g.type === "pathMove" && g.wasPicked) {
          const was = edited().paths ?? [];
          const j = pathAt(was, g.at, 0.6);
          if (j >= 0 && was[j].p.length >= MAX_POINTS) note("That path has as many bends as it can take.");
          else if (commitPath({ k: "p", at: g.at, add: 1 })) {
            const now = edited().paths ?? [];
            const n = pathAt(now, g.at, 0.6);
            const dotAt = n >= 0 ? now[n].p.findIndex((q) => Math.hypot(q[0] - g.at[0], q[1] - g.at[1]) < 0.05) : -1;
            ui.path = { at: g.at, dot: dotAt };
            note("A new bend: drag its dot to move that bit of the path.");
          }
        }
        return refresh();
      }
      if (edit && commitPath(edit)) ui.path = { at: [r2(g.at[0] + edit.d[0]), r2(g.at[1] + edit.d[1])], dot: g.type === "pathDot" ? ui.path?.dot ?? -1 : -1 };
      return refresh();
    }
    if (!g.moved && g.type === "trees") {
      // A tap on a tree: it's picked (or, one of a picked bunch, the bunch
      // stays picked), to change its kind, its shape or its height.
      if (!ui.picked.some((q) => g.group.some((t) => Math.abs(q[0] - t[0]) + Math.abs(q[1] - t[1]) < 0.1))) ui.picked = g.group.map((t) => [t[0], t[1]]);
      return refresh();
    }
    if (!g.moved && g.type === "empty") {
      // A tap on empty ground.
      if (ui.tool === "trees" && ui.mode.trees === "move") {
        if (ui.picked.length) ui.picked = [];
        else if (treeSpotOk(L, p[0], p[1])) {
          if (L.links) {
            if (commit(linksPlanting(linksPlant(ui.linksPlant), [p]), NO_TREES)) note(linksPlantNote(withEdits(stored()).trees.length));
          } else {
            // (A kind of its own only where it grows that way: kindsOk.)
            const ok = kindsOk([p], ui.plantKind);
            if (!ok.keep[0]) note(ok.why);
            else if (commit({ k: "t+", p: [[r2(p[0]), r2(p[1]), r2(0.85 + Math.random() * 0.4)]], ...(ui.plantKind != null ? { kind: ui.plantKind } : {}) }, NO_TREES) && ok.note) note(ok.note);
          }
        }
        else note(NO_TREES);
      } else if (ui.tool === "green" && ui.mode.green === "area") {
        // A dot of the area's outline, on the green or its fringe.
        const a = ui.shaping.area;
        if (!onGreen(p)) note("Put the dots on the green itself.");
        else if (a.length >= sculpt.MAX_AREA_DOTS) note("That's as many dots as an area takes.");
        else {
          a.push([r2(p[0]), r2(p[1])]);
          note(a.length < 3 ? "" : "Tap more dots to change its shape, or work on it with the buttons.");
        }
      } else if (ui.tool === "paths") {
        const at = [r2(p[0]), r2(p[1])];
        if (ui.drawing) {
          if (ui.drawing.length >= MAX_POINTS) note("That's as many dots as a path can take. Tap Done.");
          else ui.drawing.push(at);
        } else if (ui.path) ui.path = null;
        else if (ui.link) ui.link = null;
        else {
          ui.drawing = [at];
          note("");
        }
      } else if (ui.tool === "brooks") {
        const at = [r2(p[0]), r2(p[1])];
        if (ui.brookDraw) {
          if (ui.brookDraw.length >= 40) note("That's as many dots as a brook can take. Tap Done.");
          else ui.brookDraw.push(at);
        } else if (ui.bank && ui.brook) bankTap(at);
        else if (ui.brook) ui.brook = null;
        else {
          ui.brookDraw = [at];
          note("");
        }
      } else if (shapeTool()) {
        const st = shapeTool();
        if (ui.selected) ui.selected = null;
        else {
          const at = [r2(p[0]), r2(p[1])];
          // (Water can go over a path, bridged, and a fairway: only sand
          // can't.)
          const byPath = ui.tool === "bunkers" && gapToPaths(L.paths, at[0], at[1], 25) < 20;
          if (commit({ k: `${st.k}+`, at }, st.k === "a" ? NO_FAIRWAY : byPath ? `${NO_SHAPE} ${NO_SHAPE_ON_PATH}` : NO_SHAPE)) {
            ui.selected = { list: st.list, at };
            if (ui.tool === "bunkers") {
              const i = shapeAt(edited().bunkers, at, 0.2);
              if (i >= 0) lookAtBunker(edited().bunkers[i]);
            }
          }
        }
      } else if (ui.tool === "fairway") {
        // Empty ground tapped: the picked fairway let go.
        if (!g.fairway && ui.selected) ui.selected = null;
      }
    } else if (g.type === "lasso") {
      const ring = g.ring.map((c) => fit.fromCanvas(c));
      ui.picked = ring.length > 2 ? L.trees.filter((t) => insidePolygon(ring, t[0], t[1])).map((t) => [t[0], t[1]]) : [];
      if (!ui.picked.length) note("No trees inside that ring. Draw round the trees you want.");
    } else if (edit) {
      const blockedBy = edit.k === "tm" ? g.group.map((q) => neighbourGroundAt([q[0] + edit.d[0], q[1] + edit.d[1]])).find(Boolean) : null;
      // (A tree of a kind of its own not moved in among two others:
      // kindsOk.)
      const mixedIn = edit.k === "tm" && !blockedBy ? movedAmongOthers(g.group, edit.d) : null;
      if (blockedBy) {
        note(noTreeThere(blockedBy));
      } else if (mixedIn) {
        note(mixedIn);
      } else if (edit.k === "tm") {
        if (commit(edit, NO_TREES)) {
          const moved = new Set(g.group.map((q) => q.join()));
          ui.picked = ui.picked.map((q) => (moved.has(q.join()) ? [r2(q[0] + edit.d[0]), r2(q[1] + edit.d[1])] : q));
          const out = withEdits(stored());
          if (g.group.some((q) => !out.trees.some((t) => Math.abs(t[0] - r2(q[0] + edit.d[0])) + Math.abs(t[1] - r2(q[1] + edit.d[1])) < 0.08))) {
            note("Some trees stayed put: they can't stand on a green, a tee, sand, water, right on the line of play or on another hole's ground.");
          }
        }
      } else if (edit.k === "t+") {
        const { links, ...rest } = edit;
        const off = edit.p.map((q) => neighbourGroundAt(q)).find(Boolean);
        const free = edit.p.filter((q) => !neighbourGroundAt(q));
        // (A kind of its own only where it grows that way: kindsOk.)
        const ok = links ? null : kindsOk(free, edit.kind ?? null);
        const plant = { ...rest, p: ok ? free.filter((_, i) => ok.keep[i]) : free };
        if (off && !free.length) note(noTreeThere(off));
        else if (!edit.p.length) note(NO_TREES);
        else if (!plant.p.length) note(ok.why);
        else if (commit(plant, NO_TREES)) {
          if (off) note(`${noTreeThere(off)} The rest are planted.`);
          else if (ok?.why) note(`${ok.why} The rest are planted.`);
          else if (ok?.note) note(ok.note);
          else if (links) note(linksPlantNote(withEdits(stored()).trees.length));
        }
      } else if (edit.k === "t-") {
        if (edit.p.length) commit(edit);
      } else if (edit.k === "b" || edit.k === "w" || edit.k === "a") {
        const to = edit.d ? [edit.at[0] + edit.d[0], edit.at[1] + edit.d[1]] : edit.at;
        const byPath = edit.k === "b" && gapToPaths(L.paths, to[0], to[1], 25) < 20;
        const fairway = edit.k === "a";
        // (Saying why, if it's plain: the tee, off the hole's ground...)
        const trouble = SHAPE_TROUBLE[troubleOf(edit)];
        const why = trouble ? `${trouble}.` : edit.h ? (fairway ? NO_FAIRWAY : NO_RESHAPE) : edit.f ? (fairway ? "That's as big (or small) as a fairway goes." : "That's as big (or small) as it goes, or it would cover the tee, the cup or the green.") : fairway ? NO_FAIRWAY : NO_SHAPE;
        if (commit(edit, byPath ? `${why} ${NO_SHAPE_ON_PATH}` : why) && edit.d) {
          const list = { b: "bunkers", w: "water", a: "extraFairways" }[edit.k];
          ui.selected = { list, at: [r2(edit.at[0] + edit.d[0]), r2(edit.at[1] + edit.d[1])] };
          // One set to meet the green keeps to it, so it may have settled
          // a little way from where it was dropped.
          const now = edited()[list] ?? [];
          if (shapeAt(now, ui.selected.at, 0.2) < 0) {
            const i = shapeAt(now, ui.selected.at, 5);
            if (i >= 0) ui.selected.at = [r2(now[i].x), r2(now[i].z)];
          }
        }
        // A bunker dragged: look closer at it where it is now.
        if (edit.k === "b") {
          const i = ui.selected ? shapeAt(edited().bunkers, ui.selected.at, 0.2) : -1;
          if (i >= 0) lookAtBunker(edited().bunkers[i]);
        }
      } else if (edit.k === "g") commit(edit, NO_GREEN);
      else commit(edit);
    }
    refresh();
  };
  const release = (e, cancelled) => {
    steady((ev) => finish(ev, cancelled))(e);
    lift();
  };
  canvas.addEventListener("pointerup", (e) => release(e, false));
  canvas.addEventListener("pointercancel", (e) => release(e, true));
  canvas.addEventListener("pointerleave", () => {
    if (hover) {
      hover = null;
      redraw();
    }
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  // A dab of an edge brush: points a quarter of its reach apart along the
  // stroke.
  function edgeDab(p) {
    if (pending?.k !== "edge") return;
    const last = pending.p[pending.p.length - 1];
    if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < pending.r / 4) return;
    if (pending.p.length >= 300) return;
    pending = { ...pending, p: [...pending.p, [r2(p[0]), r2(p[1])]] };
    redraw();
  }

  // A dab of the ground brush: points a third of its size apart along the
  // stroke (more would pile up where it's held still).
  function groundDab(p) {
    if (!pending || !["gr", "gs"].includes(pending.k)) return;
    const last = pending.p[pending.p.length - 1];
    if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < pending.r / 3) return;
    if (pending.p.length >= 400) return;
    pending = { ...pending, p: [...pending.p, [r2(p[0]), r2(p[1])]] };
    redraw();
  }

  // A dab of the planting brush, spaced along the stroke.
  function dab(p) {
    const R = brushRadius();
    if (gesture.lastDab && Math.hypot(p[0] - gesture.lastDab[0], p[1] - gesture.lastDab[1]) < R * 0.7) return;
    gesture.lastDab = p;
    const clump = clumpAt(edited(), p[0], p[1], R, Math.random, pending.p);
    // (A links planting each its own size: sim/linksplanting.mjs.)
    if (pending.links) for (const q of clump) q[2] = plantSize(linksPlant(ui.linksPlant), Math.random());
    pending.p.push(...clump);
  }
  // The hole's signature tree (designer.js: sim/treeclear.mjs
  // holeSignature), worked out again only when the hole changes; and
  // whether its trees are kept as they first grew (sim/treelock.mjs), when
  // a signature tree comes only once they're grown afresh.
  let sigFor = null;
  let sigKept = null;
  function signatureNow() {
    const S = stored();
    if (sigFor !== S) {
      sigFor = S;
      sigKept = signature?.() ?? null;
    }
    return sigKept;
  }
  const keptNow = () => !!liveLock(validLock(stored().treeLock), stored().edits);
  // Its button: take the signature tree away, or put it back.
  function signatureButtons() {
    const sig = signatureNow();
    if (!sig) return "";
    const name = KIND_NAMES[KINDS[sig.tree[3]]].toLowerCase();
    if (sig.off) return `<span class="break"></span><button data-act="sig-on" title="A lone ${name} stands where this hole has its signature tree: put it back">Put its signature tree back</button>`;
    if (!sig.standing) return "";
    if (keptNow()) return `<span class="break"></span><span class="muted">A signature tree - a lone ${name} - comes with its trees grown afresh.</span>`;
    return `<span class="break"></span><span title="A big lone tree that makes the hole: drawn ringed in gold on the map">Its signature tree: a lone ${name}</span> <button data-act="sig-off" title="The signature tree goes, and the ground under it is open">Take it away</button>`;
  }
  // Why trees at `group` ([x, z] each) moved by `d` can't go there - a tree
  // of a kind of its own put in among two other kinds (kindsOk) - or null.
  function movedAmongOthers(group, d) {
    const L = edited();
    const at = new Map(L.trees.map((t) => [`${t[0]},${t[1]}`, t]));
    const byKind = new Map();
    for (const q of group) {
      const t = at.get(`${q[0]},${q[1]}`);
      if (t?.[3] == null) continue;
      byKind.set(t[3], [...(byKind.get(t[3]) ?? []), [q[0] + d[0], q[1] + d[1]]]);
    }
    for (const [kind, spots] of byKind) {
      const ok = kindsOk(spots, kind, group);
      if (!ok.keep.every(Boolean)) return ok.why;
    }
    return null;
  }
  // The rubbing-out brush: every tree under it.
  function rub(p) {
    for (const t of treesNear(edited(), p[0], p[1], brushRadius())) {
      if (!pending.p.some((q) => q[0] === t[0] && q[1] === t[1])) pending.p.push(t);
    }
  }

  refresh();
  return { redraw, refresh };
}
