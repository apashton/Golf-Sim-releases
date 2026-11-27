// The course plan in the designer: a real course's holes laid out on its
// map and its ground before it's built (sim/courseplan.mjs). The holes are
// there to start with - the map's, or suggested from its greens, tees and
// fairways (sim/holefinder.mjs) - and put right with a tap: a hole dragged
// by its tee, its flag or a bend, renumbered, taken away or drawn from a
// tee to a green; a green, tee or bunker tapped on the ground and its edge
// found there (sim/groundpick.mjs); fairways, out of bounds, walls and
// fences, and burns (with their bridges) drawn by tapping along them; a
// hole's tee boxes made its White, Red or Yellow with a tap; the club's
// card pasted in beside the holes (courseplan/cardbox.js, sim/
// planextras.mjs). Then Build the course, and each hole opens in the
// designer for the finer changes.
//
// mountCoursePlan(el, { survey, ground, origin, plan, name, osm, replace,
// trees, onBuilt, onCancel }): survey - the map (sim/osm.mjs), ground -
// its heights packed (terrain.mjs packGrid) in the metres of `origin`;
// plan - one kept from before (course.source.plan), or none for a new one;
// osm - { type, id } of the map's course; replace - the id of the course
// it builds again, or null for a new course.

import { esc } from "./util.js";
import { ask, tell } from "./askbox.js";
import { unpackGrid, project, unproject, polygonCentroid, polygonArea, insidePolygon } from "./sim/terrain.mjs";
import {
  planFromSurvey,
  localShapes,
  cleanPlan,
  suggestRest,
  addHole,
  removeHole,
  moveHoleTo,
  startAt,
  setHoleLine,
  setHolePar,
  bendAt,
  holeAt,
  holeFacts,
  planChecks,
  holeEnds,
  addShape,
  removeShape,
  moveShape,
  scaleShape,
  shapeAt,
  fairwaysForHoles,
  fairwayAlong,
  alongOutline,
  addOut,
  removeOut,
  outAt,
  addWall,
  removeWall,
  wallAt,
  teesOfHole,
  FAIRWAY_HALF,
  NEAR,
} from "./sim/courseplan.mjs";
import { setCard, cycleTee, boxColour, addBurn, removeBurn, setBurnWidth, addBridge, removeBridges, burnAt, bridgesOf, BURN_WIDTHS, BURN_WIDTH, CARD_OFF } from "./sim/planextras.mjs";
import { cardBox } from "./courseplan/cardbox.js";
import { pickShape, PICK } from "./sim/groundpick.mjs";
import { shadePicture, drawPlan, viewOf } from "./courseplan/draw.js";
import { TOOLS as HOLE_TOOLS, svg } from "./holeeditor/tools.js";
import { boxOf } from "./sim/cellmask.mjs";
import { ownPhotos } from "./courseplan/ownphotos.js";

const icon = (id) => HOLE_TOOLS.find((t) => t.id === id)?.icon ?? "";
// The plan's tools: what each picks out, and what it says to do.
export const PLAN_TOOLS = [
  {
    id: "holes",
    word: "Holes",
    icon: svg(`<path d="M5 27L16 15l11-9" stroke="#e7efe8" stroke-width="2.5" stroke-dasharray="4 3" fill="none"/><circle cx="5" cy="27" r="4" fill="#13200f" stroke="#e7efe8" stroke-width="1.5"/><path d="M27 6V-1" stroke="#fff" stroke-width="2"/><path d="M27 2l-6 2 6 2z" fill="#e5484d"/>`),
    help: "Tap a hole to pick it: drag its tee, its flag or a bend to move them, and tap its line for another bend. With it picked, tap one of its tee boxes to make it the White, Red or Yellow. New hole: tap its tee, then its green.",
  },
  { id: "greens", word: "Green", icon: icon("green"), help: "Tap where a green is: its edge is found from the ground (with LiDAR), or it's the usual size. Tap one to pick it - drag it to move it." },
  {
    id: "tees",
    word: "Tee",
    icon: svg(`<rect x="7" y="9" width="18" height="14" rx="2" fill="#9ad06e"/><circle cx="12" cy="16" r="2.5" fill="#fff"/><circle cx="20" cy="16" r="2.5" fill="#fff"/>`),
    help: "Tap where a tee box is: its platform is found from the ground (with LiDAR), or it's the usual size. Tap one to pick it - drag it to move it.",
  },
  { id: "fairways", word: "Fairway", icon: icon("fairway"), help: "Tap along the middle of the fairway, from the drive's landing to the green, then Done. Tap one to pick it." },
  { id: "bunkers", word: "Bunker", icon: icon("bunkers"), help: "Tap in a bunker: its hollow is found from the ground (with LiDAR), or it's the usual size. Tap one to pick it - drag it to move it." },
  {
    id: "burns",
    word: "Burn",
    icon: svg(`<path d="M2 12c6-4 10 4 16 0s10-4 12-2" stroke="#cfc6b0" stroke-width="9" fill="none"/><path d="M2 12c6-4 10 4 16 0s10-4 12-2" stroke="#2f6f9e" stroke-width="5" fill="none"/><path d="M14 5v14" stroke="#cfc6b0" stroke-width="4"/>`),
    help: "Tap along the middle of the burn, then Done: it's built as a channel walled in stone through the turf, as wide all along. Tap one to pick it - a bridge goes wherever a path crosses it, and wherever you put one.",
  },
  {
    id: "out",
    word: "Out of bounds",
    icon: svg(`<rect x="2" y="2" width="28" height="28" fill="#4f7f3a"/><path d="M2 2h12v28H2z" fill="#dfe7d8" opacity="0.5"/><path d="M14 4v24" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/>`),
    help: "Tap along the boundary, then Done: what's beyond it, away from the course, is out of bounds. Tap twice on the course's own edge (the dashed line) to follow it between them.",
  },
  {
    id: "walls",
    word: "Wall, fence",
    icon: svg(`<path d="M3 24h26" stroke="#d9d2bf" stroke-width="5"/><path d="M6 21V9M14 21V9M22 21V9M3 13h26" stroke="#fff" stroke-width="2"/>`),
    help: "Pick Wall (a ball stops against it) or Fence, tap along it, then Done. Tap one to pick it.",
  },
];
const LIST_OF = { greens: "greens", tees: "tees", fairways: "fairways", bunkers: "bunkers" };
const KIND_OF = { greens: "green", tees: "tee", bunkers: "bunker" };
const WORD_OF = { greens: "green", tees: "tee box", fairways: "fairway", bunkers: "bunker" };
const FAIRWAY_WIDTHS = { 11: "Narrow", [FAIRWAY_HALF]: "Usual", 22: "Wide" };
// A tap within this many pixels of a dot grabs it.
const GRAB = 14;
// A press that moves this many pixels is a drag, not a tap.
const SLOP = 6;

// The plan on another origin's metres (the map's course measured from a new
// middle, since the plan was kept).
export function planOn(plan, origin) {
  if (Math.abs(plan.origin.lat - origin.lat) < 1e-9 && Math.abs(plan.origin.lon - origin.lon) < 1e-9) return plan;
  const move = (p) => {
    const g = unproject(plan.origin, p[0], p[1]);
    return project(origin, g.lat, g.lon).map((v) => Math.round(v * 100) / 100);
  };
  const polys = (list) => list.map((r) => r.map(move));
  return {
    ...plan,
    origin,
    greens: polys(plan.greens),
    tees: polys(plan.tees),
    fairways: polys(plan.fairways),
    bunkers: polys(plan.bunkers),
    out: polys(plan.out),
    holes: plan.holes.map((h) => ({ ...h, line: h.line.map(move), ...(h.sets ? { sets: Object.fromEntries(Object.entries(h.sets).map(([c, p]) => [c, move(p)])) } : {}) })),
    walls: plan.walls.map((w) => ({ ...w, line: w.line.map(move) })),
    burns: (plan.burns ?? []).map((b) => ({ ...b, line: b.line.map(move), bridges: b.bridges.map((x) => ({ from: move(x.from), to: move(x.to) })) })),
  };
}

// (aerial: the photo sources for the course, best first - the open one for
// where it is, then the player's own: server/aerial.mjs sourcesAt.)
export function mountCoursePlan(el, { survey, ground: packed, origin, plan: kept = null, name = "", osm, replace = null, trees = "normal", aerial = [], onBuilt, onCancel }) {
  const start = kept ? { plan: planOn(cleanPlan(kept), origin), map: localShapes(survey, origin) } : planFromSurvey(survey);
  const ground = packed ? unpackGrid(packed) : null;
  const fine = !!ground && ground.cell <= PICK.fine;
  const st = {
    plan: start.plan,
    map: start.map,
    ground,
    shade: ground ? shadePicture(ground) : null,
    tool: "holes",
    sel: null,
    drawing: null,
    newHole: null,
    view: null,
    // Photos where there are some (the shading then off, to be turned on
    // over them); else the ground's shading.
    show: { ground: !aerial.length, photo: aerial.length > 0 },
    photos: aerial.slice(),
    photo: aerial[0] ?? null,
    tiles: new Map(),
    redraw: null,
    fairwayHalf: FAIRWAY_HALF,
    wallKind: "wall",
    burnWidth: BURN_WIDTH,
    // A burn waiting for its bridge's tap (its index).
    bridging: null,
    note: "",
    checks: null,
    building: false,
  };
  const undo = [];
  const redo = [];
  const suggested = !kept && !survey.holes.length;

  el.innerHTML = `
    <div class="cplan">
      <div class="row cplan-head">
        <h2>Lay out the holes</h2>
        <label>Course name <input id="cplan-name" value="${esc(name)}" size="28"></label>
        <span class="gap"></span>
        <button id="cplan-cancel">${replace ? "Back to the course" : "Back"}</button>
        <button id="cplan-build" class="primary">${replace ? "Build it again" : "Build the course"}</button>
      </div>
      <p class="muted small cplan-intro">${
        suggested
          ? "The map has this course's greens and tees but not its holes, so they're suggested: each green given the tee that plays to it, the line down its fairway, numbered by the walk from green to tee. Put right whatever isn't, then build it."
          : kept
            ? "The holes as you laid them out. Change what you like, then build it again: holes whose tee and green haven't moved keep the changes made to them since."
            : "The holes as the map has them. Change what you like, then build it."
      } ${fine ? "The ground is LiDAR's, a metre at a time: tap a green, tee or bunker and its edge is found from it." : "The ground here is the map's (a height every few metres): greens, tees and bunkers tapped on are the usual size, to be sized by hand."} ${
        aerial.length
          ? `Under it, aerial photos (${esc(aerial[0].name)}).`
          : "There are no open aerial photos for here: <b>Photos...</b> adds a photo service of your own."
      }</p>
      <div class="cplan-body">
        <div class="cplan-mapcol hand">
          <div class="hand-tools cplan-tools">${PLAN_TOOLS.map((t) => `<button class="tool" data-tool="${t.id}" title="${esc(t.help)}">${t.icon}<span>${esc(t.word)}</span></button>`).join("")}</div>
          <p class="hand-help cplan-help"></p>
          <div class="hand-context cplan-context"></div>
          <div class="cplan-map"><canvas></canvas></div>
          <div class="hand-bar">
            <button id="cplan-undo" title="Undo the last change">Undo</button>
            <button id="cplan-redo" title="Do it again">Redo</button>
            <span class="gap"></span>
            <label class="small" title="Aerial photos under the map, where there are some"><input type="checkbox" id="cplan-photo" ${st.show.photo ? "checked" : ""} ${st.photo ? "" : "disabled"}> Photos</label>
            <select id="cplan-source" class="small" title="Whose photos" ${st.photos.length > 1 ? "" : "hidden"}></select>
            <label class="small" title="The ground shaded from its heights: with LiDAR, every green's banks, tee and bunker"><input type="checkbox" id="cplan-shade" ${st.show.ground ? "checked" : ""}> Ground shading</label>
            <button id="cplan-own" class="small" title="A photo service of your own, for where there are no open photos">Photos...</button>
            <button id="cplan-in" title="Look closer" aria-label="Zoom in">+</button>
            <button id="cplan-out" title="Look further" aria-label="Zoom out">&minus;</button>
            <button id="cplan-all">Whole course</button>
          </div>
        </div>
        <aside class="cplan-side">
          <div class="row">
            <button id="cplan-suggest" title="The holes you haven't made or changed suggested again, round the ones you have (led by the club's card, where it's in)">Suggest the other holes again</button>
          </div>
          <div class="cplan-card"></div>
          <div class="cplan-totals small"></div>
          <ol class="cplan-holes"></ol>
          <div class="cplan-checks small"></div>
          <div class="cplan-status small"></div>
        </aside>
      </div>
    </div>`;
  const $ = (s) => el.querySelector(s);
  const canvas = $(".cplan-map canvas");
  canvas.style.touchAction = "none";

  // ---- Changing the plan ------------------------------------------------------------

  const change = (next, { keepSel = false } = {}) => {
    if (!next || next === st.plan) return false;
    undo.push(st.plan);
    if (undo.length > 80) undo.shift();
    redo.length = 0;
    st.plan = next;
    if (!keepSel) st.sel = null;
    refresh();
    return true;
  };
  const note = (text) => {
    st.note = text;
    $(".cplan-help").textContent = text || PLAN_TOOLS.find((t) => t.id === st.tool).help;
  };

  // ---- The map ------------------------------------------------------------------------

  let W = 0;
  let H = 0;
  function size() {
    const box = $(".cplan-map");
    const w = Math.max(320, Math.floor(box.clientWidth));
    const h = Math.max(360, Math.min(Math.floor(window.innerHeight * 0.72), Math.round(w * 0.8)));
    const dpr = window.devicePixelRatio || 1;
    if (w === W && h === H && canvas.width === Math.round(w * dpr)) return;
    W = w;
    H = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    // The whole course in view, until the player looks round it.
    if (!st.view || !st.looked) fitAll();
    draw();
  }
  function fitAll() {
    const b = boxOf([...st.plan.greens, ...st.plan.tees, ...st.plan.holes.map((h) => h.line), ...st.map.outline], 40) ?? (ground ? { x0: ground.x0, z0: ground.z0, x1: ground.x0 + ground.nx * ground.cell, z1: ground.z0 + ground.nz * ground.cell } : { x0: -500, z0: -500, x1: 500, z1: 500 });
    st.view = { cx: (b.x0 + b.x1) / 2, cz: (b.z0 + b.z1) / 2, scale: Math.min(W / Math.max(1, b.x1 - b.x0), H / Math.max(1, b.z1 - b.z0)) };
  }
  function draw() {
    if (!W) return;
    const g = canvas.getContext("2d");
    const dpr = canvas.width / W;
    st.dpr = dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawPlan(g, st, W, H);
  }
  // A photo tile come in: drawn again, once a frame at most (by a timer
  // while the page is hidden, where frames don't come).
  let queued = false;
  st.redraw = () => {
    if (queued) return;
    queued = true;
    const go = () => {
      queued = false;
      draw();
    };
    if (document.visibilityState === "visible") requestAnimationFrame(go);
    else setTimeout(go, 100);
  };
  const view = () => viewOf(st.view, W, H);
  const metresAt = (e) => {
    const r = canvas.getBoundingClientRect();
    return view().from([e.clientX - r.left, e.clientY - r.top]);
  };
  const pxAway = (a, b) => {
    const v = view();
    const [ax, ay] = v.to(a);
    const [bx, by] = v.to(b);
    return Math.hypot(ax - bx, ay - by);
  };
  const zoom = (k, at = null) => {
    const v = st.view;
    const p = at ?? [v.cx, v.cz];
    const scale = Math.min(40, Math.max(0.05, v.scale * k));
    st.view = { cx: p[0] + (v.cx - p[0]) * (v.scale / scale), cz: p[1] + (v.cz - p[1]) * (v.scale / scale), scale };
    st.looked = true;
    draw();
  };

  // ---- Pressing, dragging and tapping on the map ----------------------------------

  const pointers = new Map();
  let press = null;
  canvas.addEventListener("pointerdown", (e) => {
    // (Captured, so a drag off the map still lets go - where the pointer can
    // be: a made-up one can't.)
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Not a pointer that can be captured.
    }
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 2) {
      // Two fingers: pinch to zoom.
      const [a, b] = [...pointers.values()];
      press = { pinch: Math.hypot(a[0] - b[0], a[1] - b[1]), scale: st.view.scale };
      return;
    }
    const at = metresAt(e);
    press = { x: e.clientX, y: e.clientY, at, moved: false, view: { ...st.view }, grab: grabAt(at) };
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (!press) return;
    if (press.pinch) {
      if (pointers.size < 2) return;
      const [a, b] = [...pointers.values()];
      st.view = { ...st.view, scale: Math.min(40, Math.max(0.05, (press.scale * Math.hypot(a[0] - b[0], a[1] - b[1])) / (press.pinch || 1))) };
      st.looked = true;
      draw();
      return;
    }
    if (!press.moved && Math.hypot(e.clientX - press.x, e.clientY - press.y) < SLOP) return;
    press.moved = true;
    const at = metresAt(e);
    if (press.grab?.dot != null) {
      // A hole's tee, flag or bend, dragged.
      const h = st.plan.holes[press.grab.hole];
      const line = h.line.slice();
      line[press.grab.dot] = at;
      press.live = line;
      st.plan = { ...st.plan, holes: st.plan.holes.map((x, i) => (i === press.grab.hole ? { ...x, line } : x)) };
      draw();
    } else if (press.grab?.shape) {
      // A picked shape, dragged.
      const d = [at[0] - press.at[0], at[1] - press.at[1]];
      press.d = d;
      const { list, i, poly } = press.grab.shape;
      st.plan = { ...st.plan, [list]: st.plan[list].map((p, k) => (k === i ? poly.map(([x, z]) => [x + d[0], z + d[1]]) : p)) };
      draw();
    } else {
      // Empty ground, dragged: looking round.
      const v = press.view;
      st.view = { ...v, cx: v.cx - (e.clientX - press.x) / v.scale, cz: v.cz + (e.clientY - press.y) / v.scale };
      st.looked = true;
      draw();
    }
  });
  const release = (e) => {
    pointers.delete(e.pointerId);
    if (!press) return;
    const p = press;
    if (p.pinch) {
      if (pointers.size === 0) press = null;
      return;
    }
    press = null;
    if (p.grab?.dot != null && p.moved) {
      // Let go: a tee onto the middle of the tee box it's on or by; a flag
      // let go just off a green onto it (on one, it stays where it's put -
      // a double green's own half).
      const before = p.grab.plan;
      const line = (p.live ?? before.holes[p.grab.hole].line).slice();
      const k = p.grab.dot;
      if (k === 0 || k === line.length - 1) {
        const ends = holeEnds(before, st.map, line[0], line[line.length - 1]);
        if (k === 0) line[0] = ends.tee;
        const end = line[line.length - 1];
        if (k === line.length - 1 && ends.green >= 0 && !insidePolygon(before.greens[ends.green], end[0], end[1])) line[k] = ends.end;
      }
      st.plan = before;
      change(setHoleLine(before, p.grab.hole, line), { keepSel: true });
      return;
    }
    if (p.grab?.shape && p.moved) {
      const before = p.grab.plan;
      st.plan = before;
      change(moveShape(before, p.grab.shape.list, p.grab.shape.i, p.d ?? [0, 0]), { keepSel: true });
      return;
    }
    if (!p.moved) tap(p.at);
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoom(e.deltaY < 0 ? 1.2 : 1 / 1.2, metresAt(e));
    },
    { passive: false },
  );

  // What a press on the map takes hold of: a dot of the picked hole, or the
  // picked shape.
  function grabAt(at) {
    if (st.drawing || st.newHole) return null;
    const sel = st.sel;
    if (sel?.kind === "hole" && st.tool === "holes") {
      const h = st.plan.holes[sel.i];
      const dot = h?.line.findIndex((p) => pxAway(p, at) <= GRAB) ?? -1;
      if (dot >= 0) return { hole: sel.i, dot, plan: st.plan };
    }
    if (sel?.kind === "shape" && sel.list === LIST_OF[st.tool]) {
      const poly = st.plan[sel.list][sel.i];
      if (poly && shapeAt(st.plan, sel.list, at, 1) === sel.i) return { shape: { list: sel.list, i: sel.i, poly }, plan: st.plan };
    }
    return null;
  }

  // A tap on the map, for the tool in hand.
  function tap(at) {
    const tool = st.tool;
    const tapNear = 12 / st.view.scale;
    if (tool === "holes") {
      if (st.newHole) {
        if (!st.newHole.tee) {
          st.newHole = { ...st.newHole, tee: at };
          note("Now tap its green.");
          draw();
          return;
        }
        const at0 = st.newHole.at;
        const next = addHole(st.plan, st.map, st.newHole.tee, at, at0);
        st.newHole = null;
        if (next === st.plan) note("That's too short to be a hole - tap its tee, then its green, at least 40 m apart.");
        else {
          change(next);
          st.sel = { kind: "hole", i: Math.min(at0, st.plan.holes.length - 1) };
          note("");
        }
        refresh();
        return;
      }
      // One of the picked hole's tee boxes: its next colour.
      if (st.sel?.kind === "hole") {
        const h = st.plan.holes[st.sel.i];
        const box = shapeAt(st.plan, "tees", at, Math.min(3, tapNear));
        if (h && box >= 0 && teesOfHole(st.plan, h).includes(box)) {
          if (boxColour(h, st.plan.tees[box]) === "yellow") {
            note("That's its Yellow, where its line starts. Tap another of its tee boxes to make it the White, the Red or the Yellow.");
            return refresh();
          }
          const r = cycleTee(st.plan, st.sel.i, st.plan.tees[box]);
          change(r.plan, { keepSel: true });
          note(r.colour === "yellow" ? "That box is its Yellow now: its line starts there." : r.colour ? `That box is its ${COLOUR_WORD[r.colour]} now.` : "That box is none of its tees now.");
          return refresh();
        }
      }
      const i = holeAt(st.plan, at, tapNear);
      if (i >= 0 && st.sel?.kind === "hole" && st.sel.i === i) change(bendAt(st.plan, i, at), { keepSel: true });
      else st.sel = i >= 0 ? { kind: "hole", i } : null;
      refresh();
      return;
    }
    if (tool === "greens" || tool === "tees" || tool === "bunkers") {
      const list = LIST_OF[tool];
      const i = shapeAt(st.plan, list, at, Math.min(3, tapNear));
      if (i >= 0) {
        st.sel = { kind: "shape", list, i };
        refresh();
        return;
      }
      const got = pickShape(ground, KIND_OF[tool], at, { toward: holeWayNear(at) });
      if (change(addShape(st.plan, list, got.poly))) {
        st.sel = { kind: "shape", list, i: st.plan[list].length - 1 };
        note(
          got.found
            ? `Its edge found from the ground: ${Math.round(Math.abs(polygonArea(got.poly)))} square metres. Drag it to move it, or size it below.`
            : got.why === "coarse"
              ? "The usual size: the ground here isn't fine enough to show its edge. Drag it into place and size it below."
              : `No ${WORD_OF[list]} found in the ground there, so it's the usual size. Drag it into place and size it below.`,
        );
        refresh();
      }
      return;
    }
    if (st.bridging != null) {
      const b = st.bridging;
      if (burnAt(st.plan, at, Math.max(8, tapNear)) !== b) return note("Tap on the burn, where the bridge goes.");
      st.bridging = null;
      change(addBridge(st.plan, b, at), { keepSel: true });
      note("A bridge straight across it there.");
      return refresh();
    }
    if (st.drawing) {
      st.drawing = [...st.drawing, at];
      refresh();
      return;
    }
    if (tool === "fairways") {
      const i = shapeAt(st.plan, "fairways", at, 0);
      if (i >= 0) st.sel = { kind: "shape", list: "fairways", i };
      else {
        st.sel = null;
        st.drawing = [at];
      }
    } else if (tool === "burns") {
      const i = burnAt(st.plan, at, Math.max(6, tapNear));
      if (i >= 0) st.sel = { kind: "burn", i };
      else {
        st.sel = null;
        st.drawing = [at];
      }
    } else if (tool === "out") {
      const i = outAt(st.plan, at);
      if (i >= 0) st.sel = { kind: "out", i };
      else {
        st.sel = null;
        st.drawing = [at];
      }
    } else if (tool === "walls") {
      const i = wallAt(st.plan, at, tapNear);
      if (i >= 0) st.sel = { kind: "wall", i };
      else {
        st.sel = null;
        st.drawing = [at];
      }
    }
    refresh();
  }

  // The way the nearest hole goes at a spot (for a shape of the usual size,
  // its long way along it).
  function holeWayNear(at) {
    let best = null;
    let bd = Infinity;
    for (const h of st.plan.holes) {
      for (let k = 1; k < h.line.length; k++) {
        const a = h.line[k - 1];
        const b = h.line[k];
        const d = Math.min(Math.hypot(at[0] - a[0], at[1] - a[1]), Math.hypot(at[0] - b[0], at[1] - b[1]));
        if (d < bd) {
          bd = d;
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
          best = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
        }
      }
    }
    return best ?? [1, 0];
  }

  // What's being drawn, finished.
  function finishDrawing() {
    const line = st.drawing;
    st.drawing = null;
    if (!line || line.length < 2) {
      note(line?.length ? "Tap at least twice along it." : "");
      refresh();
      return;
    }
    if (st.tool === "fairways") {
      const poly = fairwayAlong(line, st.fairwayHalf);
      if (!poly) note("That's too short for a fairway.");
      else if (change(addShape(st.plan, "fairways", poly))) st.sel = { kind: "shape", list: "fairways", i: st.plan.fairways.length - 1 };
    } else if (st.tool === "out") {
      // Two taps (or three) on the course's own edge: along it between them.
      const along = alongOutline(st.map.outline, line[0], line[line.length - 1], line.length > 2 ? line[1] : null, Math.max(NEAR.outline, 14 / st.view.scale));
      const next = addOut(st.plan, st.map, along ?? line);
      if (next === st.plan) note("That's too short to be a boundary.");
      else {
        change(next);
        st.sel = { kind: "out", i: st.plan.out.length - 1 };
        note(along ? "Out of bounds beyond the course's edge between your taps." : "Out of bounds beyond the line, on the side away from the course.");
      }
    } else if (st.tool === "walls") {
      if (change(addWall(st.plan, line, st.wallKind))) st.sel = { kind: "wall", i: st.plan.walls.length - 1 };
    } else if (st.tool === "burns") {
      if (change(addBurn(st.plan, line, st.burnWidth))) {
        st.sel = { kind: "burn", i: st.plan.burns.length - 1 };
        const n = bridgesOf(st.plan.burns[st.sel.i], st.map.paths).length;
        note(n ? `A bridge where each path crosses it (${n}). Put a bridge on it adds another.` : "No path crosses it: Put a bridge on it, and tap where.");
      } else note("That's too short for a burn.");
    }
    refresh();
  }

  // ---- What's under the tools: the picked thing's buttons -----------------------

  function context() {
    const box = $(".cplan-context");
    const b = (id, word, title = "", cls = "") => `<button data-do="${id}" ${title ? `title="${esc(title)}"` : ""} class="${cls}">${esc(word)}</button>`;
    let html = "";
    const sel = st.sel;
    if (st.drawing) {
      if (st.tool === "fairways") html += `<label>Width <select data-set="fairway">${Object.entries(FAIRWAY_WIDTHS).map(([k, v]) => `<option value="${k}" ${Number(k) === st.fairwayHalf ? "selected" : ""}>${v}</option>`).join("")}</select></label>`;
      if (st.tool === "burns") html += burnWidths(st.burnWidth);
      if (st.tool === "walls") html += `<label>It's a <select data-set="wall"><option value="wall" ${st.wallKind === "wall" ? "selected" : ""}>Wall</option><option value="fence" ${st.wallKind === "fence" ? "selected" : ""}>Fence</option></select></label>`;
      html += b("done", "Done", "Finish it", "primary") + b("back", "Take back the last tap") + b("cancel", "Cancel");
    } else if (st.newHole) {
      html += `<span>${st.newHole.tee ? "Now tap its green." : "Tap its tee."}</span>` + b("cancel", "Cancel");
    } else if (sel?.kind === "hole") {
      const f = holeFacts(st.plan)[sel.i];
      const h = st.plan.holes[sel.i];
      const sets = ["white", "red"].filter((c) => h.sets?.[c]).map((c) => COLOUR_WORD[c]);
      html += `<b>Hole ${sel.i + 1}</b> <span class="muted">${f.yards} yds, par ${f.par}${f.card ? ` (card: ${f.card.yards ?? "?"} yds, par ${f.card.par ?? "?"})` : ""}${f.shared ? `, its green shared with the ${ordinal(f.shared)}` : ""} - tees: Yellow${sets.length ? `, ${sets.join(", ")}` : ""} (tap a box)</span><span class="gap"></span>`;
      html += (sel.i ? b("first", "Make it the 1st", "This hole the 1st, and the others numbered on round from it in the same order") : "") + b("straight", "Straighten", "Take its bends out") + b("after", "New hole after it") + b("drop-hole", "Take it away", "", "danger");
    } else if (sel?.kind === "shape") {
      html += `<b>A ${WORD_OF[sel.list]}</b><span class="gap"></span>` + b("bigger", "Bigger") + b("smaller", "Smaller");
      if (KIND_OF[sel.list] && fine) html += b("again", "Find its edge again", "Its edge found again from the ground, round its middle");
      html += b("drop-shape", "Take it away", "", "danger");
    } else if (st.bridging != null) {
      html += `<span>Tap on the burn where the bridge goes.</span>` + b("cancel", "Cancel");
    } else if (sel?.kind === "burn") {
      const burn = st.plan.burns[sel.i];
      const all = bridgesOf(burn, st.map.paths);
      const paths = all.filter((x) => x.path).length;
      html += `<b>A burn</b> <span class="muted">${all.length ? `${all.length} bridge${all.length > 1 ? "s" : ""}${paths ? ` (${paths} where a path crosses)` : ""}` : "no bridges"}</span><span class="gap"></span>`;
      html += burnWidths(burn.width) + b("bridge", "Put a bridge on it", "Then tap on the burn where it goes: straight across") + (burn.bridges.length ? b("no-bridges", "Take your bridges off", "The bridges you put on it (those where paths cross stay)") : "") + b("drop-burn", "Take it away", "", "danger");
    } else if (sel?.kind === "out") {
      html += `<b>Out of bounds</b><span class="gap"></span>` + b("drop-out", "Take it away", "", "danger");
    } else if (sel?.kind === "wall") {
      html += `<b>A ${st.plan.walls[sel.i]?.kind === "fence" ? "fence" : "wall"}</b><span class="gap"></span>` + b("drop-wall", "Take it away", "", "danger");
    } else if (st.tool === "holes") {
      html += b("new", "New hole", "Tap its tee, then its green") + b("fairways", "Fairways along the holes", "A fairway down each par 4 and 5 that hasn't one, to change as you like (the build gives them one anyway)");
    } else if (st.tool === "walls") {
      html += `<label>Draw a <select data-set="wall"><option value="wall" ${st.wallKind === "wall" ? "selected" : ""}>Wall</option><option value="fence" ${st.wallKind === "fence" ? "selected" : ""}>Fence</option></select></label>`;
    } else if (st.tool === "fairways") {
      html += `<label>Width <select data-set="fairway">${Object.entries(FAIRWAY_WIDTHS).map(([k, v]) => `<option value="${k}" ${Number(k) === st.fairwayHalf ? "selected" : ""}>${v}</option>`).join("")}</select></label>`;
    }
    box.innerHTML = html;
    box.querySelectorAll("[data-do]").forEach((btn) => btn.addEventListener("click", () => act(btn.dataset.do)));
    box.querySelector('[data-set="fairway"]')?.addEventListener("change", (e) => (st.fairwayHalf = Number(e.target.value)));
    box.querySelector('[data-set="wall"]')?.addEventListener("change", (e) => (st.wallKind = e.target.value));
    box.querySelector('[data-set="burn"]')?.addEventListener("change", (e) => {
      st.burnWidth = Number(e.target.value);
      if (st.sel?.kind === "burn") change(setBurnWidth(st.plan, st.sel.i, st.burnWidth), { keepSel: true });
    });
  }

  function act(what) {
    const sel = st.sel;
    switch (what) {
      case "done":
        return finishDrawing();
      case "back":
        st.drawing = st.drawing?.slice(0, -1) ?? null;
        if (!st.drawing?.length) st.drawing = null;
        return refresh();
      case "cancel":
        st.drawing = null;
        st.newHole = null;
        st.bridging = null;
        note("");
        return refresh();
      case "new":
        st.sel = null;
        st.newHole = { at: st.plan.holes.length };
        note("Tap its tee.");
        return refresh();
      case "after":
        st.newHole = { at: sel.i + 1 };
        st.sel = null;
        note("Tap its tee.");
        return refresh();
      case "first":
        change(startAt(st.plan, sel.i));
        st.sel = { kind: "hole", i: 0 };
        return refresh();
      case "straight": {
        const h = st.plan.holes[sel.i];
        return change(setHoleLine(st.plan, sel.i, [h.line[0], h.line[h.line.length - 1]]), { keepSel: true });
      }
      case "drop-hole":
        return change(removeHole(st.plan, sel.i));
      case "bigger":
        return change(scaleShape(st.plan, sel.list, sel.i, 1.1), { keepSel: true });
      case "smaller":
        return change(scaleShape(st.plan, sel.list, sel.i, 1 / 1.1), { keepSel: true });
      case "again": {
        const got = pickShape(ground, KIND_OF[sel.list], polygonCentroid(st.plan[sel.list][sel.i]), { toward: holeWayNear(polygonCentroid(st.plan[sel.list][sel.i])) });
        if (!got.found) return note(`No ${WORD_OF[sel.list]} found in the ground there - it's left as it is.`);
        const next = addShape(removeShape(st.plan, sel.list, sel.i), sel.list, got.poly);
        change(next);
        st.sel = { kind: "shape", list: sel.list, i: next[sel.list].length - 1 };
        return refresh();
      }
      case "drop-shape":
        return change(removeShape(st.plan, sel.list, sel.i));
      case "drop-out":
        return change(removeOut(st.plan, sel.i));
      case "drop-wall":
        return change(removeWall(st.plan, sel.i));
      case "bridge":
        st.bridging = sel.i;
        note("Tap on the burn where the bridge goes.");
        return refresh();
      case "no-bridges":
        return change(removeBridges(st.plan, sel.i), { keepSel: true });
      case "drop-burn":
        return change(removeBurn(st.plan, sel.i));
      case "fairways": {
        const { plan, added } = fairwaysForHoles(st.plan);
        if (added) change(plan);
        return note(added ? `A fairway down ${added} hole${added > 1 ? "s" : ""} that had none - tap one with the Fairway tool to change it.` : "Every par 4 and 5 has a fairway on its line already.");
      }
    }
  }

  // ---- The list of holes beside the map ---------------------------------------------

  function side() {
    const facts = holeFacts(st.plan);
    const par = facts.reduce((s, f) => s + f.par, 0);
    const yards = facts.reduce((s, f) => s + f.yards, 0);
    const card = st.plan.card;
    const cardSum = card ? ` (the card: par ${card.reduce((t, c) => t + (c.par ?? 0), 0)}, ${card.reduce((t, c) => t + (c.yards ?? 0), 0).toLocaleString()} yards)` : "";
    $(".cplan-totals").innerHTML = `<b>${facts.length} hole${facts.length === 1 ? "" : "s"}</b> - par ${par} - ${yards.toLocaleString()} yards from the tees the lines start on${cardSum}${facts.length > 18 ? " - only the first 18 are built" : ""}`;
    $(".cplan-holes").innerHTML = facts
      .map(
        (f, i) => {
          const notes = [f.green < 0 ? `<span class="warn">no green at its end</span>` : f.shared ? `its green shared with the ${ordinal(f.shared)}` : "", f.tees > 1 ? `${f.tees} tee boxes` : "", f.set ? "yours" : ""].filter(Boolean);
          return `<li class="${st.sel?.kind === "hole" && st.sel.i === i ? "on" : ""}" data-hole="${i}">
        <button class="cplan-n" data-pick="${i}" title="Pick it on the map">${f.number}</button>
        <select data-par="${i}" title="Par: the card's, or from its length, unless you say">${["auto", 3, 4, 5].map((p) => `<option value="${p}" ${(p === "auto" && f.parAuto) || (!f.parAuto && p === f.par) ? "selected" : ""}>${p === "auto" ? (f.card?.par ? `Par ${f.card.par} (the card)` : `Par ${parFrom(f)} (by length)`) : `Par ${p}`}</option>`).join("")}</select>
        <span class="cplan-yds">${f.yards} yds</span>
        <button data-up="${i}" title="Number it one earlier" ${i ? "" : "disabled"} aria-label="Earlier">&#9650;</button>
        <button data-down="${i}" title="Number it one later" ${i < facts.length - 1 ? "" : "disabled"} aria-label="Later">&#9660;</button>
        ${f.card ? `<span class="cplan-vs small ${f.card.long || f.card.wrongPar ? "warn" : "muted"}" title="The card's yards and par${f.card.long ? `: more than ${Math.round(CARD_OFF * 100)}% off` : ""}${f.card.wrongPar ? ": you've set another par" : ""}">card ${f.card.yards ?? "?"}${f.card.par ? `, par ${f.card.par}` : ""}</span>` : ""}
        ${notes.length ? `<span class="cplan-note muted small">${notes.join(" - ")}</span>` : ""}
      </li>`;
        },
      )
      .join("");
    $(".cplan-holes").querySelectorAll("[data-pick]").forEach((b) =>
      b.addEventListener("click", () => {
        const i = Number(b.dataset.pick);
        st.tool = "holes";
        st.sel = { kind: "hole", i };
        lookAt(st.plan.holes[i].line);
        refresh();
      }),
    );
    $(".cplan-holes").querySelectorAll("[data-par]").forEach((s) => s.addEventListener("change", () => change(setHolePar(st.plan, Number(s.dataset.par), s.value === "auto" ? null : Number(s.value)), { keepSel: true })));
    $(".cplan-holes").querySelectorAll("[data-up]").forEach((b) => b.addEventListener("click", () => change(moveHoleTo(st.plan, Number(b.dataset.up), Number(b.dataset.up) - 1))));
    $(".cplan-holes").querySelectorAll("[data-down]").forEach((b) => b.addEventListener("click", () => change(moveHoleTo(st.plan, Number(b.dataset.down), Number(b.dataset.down) + 1))));
    const c = (st.checks = planChecks(st.plan));
    const lines = [];
    if (c.noGreen.length) lines.push(`<span class="warn">Hole${c.noGreen.length > 1 ? "s" : ""} ${c.noGreen.join(", ")} ${c.noGreen.length > 1 ? "end" : "ends"} off any green: drag its flag onto one, or add the green with the Green tool (one is made where it ends if not).</span>`);
    if (c.spareGreens.length) lines.push(`${c.spareGreens.length} green${c.spareGreens.length > 1 ? "s" : ""} no hole plays to (marked ? on the map) - practice greens, or holes still to make.`);
    if (c.offCard.length) lines.push(`<span class="warn">Hole${c.offCard.length > 1 ? "s" : ""} ${c.offCard.join(", ")} ${c.offCard.length > 1 ? "are" : "is"} off the card (more than ${Math.round(CARD_OFF * 100)}% in yards, or a par you set): check ${c.offCard.length > 1 ? "their" : "its"} tee and green, and the numbering.</span>`);
    if (c.tooShort.length) lines.push(`<span class="warn">Hole${c.tooShort.length > 1 ? "s" : ""} ${c.tooShort.join(", ")} too short to play.</span>`);
    if (!st.plan.holes.length) lines.push(`<span class="warn">No holes yet: with the Holes tool, New hole - tap a tee, then a green.</span>`);
    $(".cplan-checks").innerHTML = lines.map((l) => `<p>${l}</p>`).join("");
  }
  const parFrom = (f) => (f.yards <= 250 ? 3 : f.yards <= 480 ? 4 : 5);

  // The map centred on a hole.
  function lookAt(line) {
    const b = boxOf([line], 60);
    st.view = { cx: (b.x0 + b.x1) / 2, cz: (b.z0 + b.z1) / 2, scale: Math.min(W / (b.x1 - b.x0), H / (b.z1 - b.z0)) };
    st.looked = true;
  }

  function refresh() {
    el.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === st.tool));
    $("#cplan-undo").disabled = !undo.length;
    $("#cplan-redo").disabled = !redo.length;
    if (!st.note) note("");
    context();
    side();
    draw();
    // The picked hole in view in the list.
    if (st.sel?.kind === "hole") el.querySelector(`.cplan-holes li[data-hole="${st.sel.i}"]`)?.scrollIntoView({ block: "nearest" });
  }

  // ---- The buttons ----------------------------------------------------------------

  el.querySelectorAll("[data-tool]").forEach((b) =>
    b.addEventListener("click", () => {
      if (st.drawing?.length > 1) finishDrawing();
      st.tool = b.dataset.tool;
      st.sel = null;
      st.drawing = null;
      st.newHole = null;
      st.bridging = null;
      note("");
      refresh();
    }),
  );
  $("#cplan-undo").addEventListener("click", () => {
    if (!undo.length) return;
    redo.push(st.plan);
    st.plan = undo.pop();
    st.sel = null;
    refresh();
  });
  $("#cplan-redo").addEventListener("click", () => {
    if (!redo.length) return;
    undo.push(st.plan);
    st.plan = redo.pop();
    st.sel = null;
    refresh();
  });
  $("#cplan-in").addEventListener("click", () => zoom(1.4));
  $("#cplan-out").addEventListener("click", () => zoom(1 / 1.4));
  $("#cplan-all").addEventListener("click", () => {
    st.looked = false;
    fitAll();
    draw();
  });
  $("#cplan-shade").addEventListener("change", (e) => {
    st.show.ground = e.target.checked;
    draw();
  });
  $("#cplan-photo").addEventListener("change", (e) => {
    st.show.photo = e.target.checked;
    draw();
  });
  const sources = () => {
    const sel = $("#cplan-source");
    sel.innerHTML = st.photos.map((p) => `<option value="${esc(p.id)}" ${p === st.photo ? "selected" : ""}>${esc(p.name)}</option>`).join("");
    sel.hidden = st.photos.length < 2;
    $("#cplan-photo").disabled = !st.photo;
  };
  sources();
  $("#cplan-source").addEventListener("change", (e) => {
    st.photo = st.photos.find((p) => p.id === e.target.value) ?? st.photo;
    draw();
  });
  $("#cplan-own").addEventListener("click", () =>
    ownPhotos({
      changed: (own) => {
        st.photos = st.photos.filter((p) => p.id !== "own");
        for (const k of [...st.tiles.keys()]) if (k.startsWith("own/")) st.tiles.delete(k);
        if (own) {
          st.photos.push(own);
          st.photo = own;
          st.show.photo = true;
          $("#cplan-photo").checked = true;
        } else if (st.photo?.id === "own") st.photo = st.photos[0] ?? null;
        sources();
        draw();
      },
    }),
  );
  const showCard = (said = "") =>
    cardBox($(".cplan-card"), {
      card: st.plan.card,
      said,
      use: async (card, read) => {
        change(setCard(st.plan, card));
        showCard(read);
        const off = planChecks(st.plan).offCard.length;
        const suggested = st.plan.holes.filter((h) => !h.set && !h.mapped).length;
        note(`The card beside the holes: ${off ? `${off} off it, marked in the list` : "every hole within it"}.`);
        if (suggested && (await ask(`Suggest the ${suggested} holes you haven't made or changed again, led by the card (each played from the tee its yards are from, numbered as it)?`, { yes: "Suggest them" }))) {
          change(suggestRest(st.plan, st.map));
          note(`Suggested again by the card: ${planChecks(st.plan).offCard.length || "none"} off it now.`);
        }
      },
      clear: () => {
        change(setCard(st.plan, null));
        showCard();
      },
    });
  showCard();
  $("#cplan-suggest").addEventListener("click", async () => {
    const mine = st.plan.holes.filter((h) => h.set || h.mapped).length;
    if (mine >= 18) return note("All 18 holes are the map's or yours: take one away first, and the rest of its greens and tees are suggested.");
    if (!(await ask(mine ? `Suggest the other holes again, keeping the ${mine} the map has or you've made or changed where they are?` : "Suggest every hole again from the greens and tees?", { yes: "Suggest them" }))) return;
    change(suggestRest(st.plan, st.map));
    note(`${st.plan.holes.length} holes. Check each against the ground - a tee by a green is the next hole's.`);
    refresh();
  });
  $("#cplan-cancel").addEventListener("click", async () => {
    if (undo.length && !(await ask("Leave the plan without building it? Its changes go.", { yes: "Leave it", no: "Stay", danger: true }))) return;
    destroy();
    onCancel?.();
  });
  $("#cplan-build").addEventListener("click", build);
  const keys = (e) => {
    if (e.target.closest?.("input, select, textarea")) return;
    if (e.key === "Escape") {
      if (st.drawing || st.newHole || st.bridging != null) act("cancel");
      else {
        st.sel = null;
        refresh();
      }
    } else if (e.key === "Enter" && st.drawing) finishDrawing();
    else if ((e.key === "Delete" || e.key === "Backspace") && st.sel) {
      e.preventDefault();
      act({ hole: "drop-hole", shape: "drop-shape", out: "drop-out", wall: "drop-wall", burn: "drop-burn" }[st.sel.kind]);
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") $(e.shiftKey ? "#cplan-redo" : "#cplan-undo").click();
  };
  document.addEventListener("keydown", keys);

  async function build() {
    if (st.building) return;
    if (st.drawing?.length > 1) finishDrawing();
    const c = planChecks(st.plan);
    if (!st.plan.holes.length) return tell("Lay out at least one hole first: with the Holes tool, New hole - tap a tee, then a green.");
    if (c.tooShort.length) return tell(`Hole${c.tooShort.length > 1 ? "s" : ""} ${c.tooShort.join(", ")} ${c.tooShort.length > 1 ? "are" : "is"} too short to play: make ${c.tooShort.length > 1 ? "them" : "it"} longer or take ${c.tooShort.length > 1 ? "them" : "it"} away.`);
    if (replace && !(await ask("Build the course again from this plan? Holes whose tee and green haven't moved keep the changes made to them since; the others start afresh from the plan.", { yes: "Build it again" }))) return;
    st.building = true;
    const status = $(".cplan-status");
    status.innerHTML = `<p><b>Building ${esc($("#cplan-name").value || name)}...</b> <span class="muted">Each hole's ground, trees, buildings and flags - this can take a minute.</span></p>`;
    $("#cplan-build").disabled = true;
    try {
      const res = await fetch("/api/map/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: osm.type, id: osm.id, name: $("#cplan-name").value.trim() || name, trees, plan: st.plan, ...(replace ? { replace } : {}) }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error);
      destroy();
      onBuilt?.(out);
    } catch (err) {
      status.innerHTML = `<p class="warn">Couldn't build it: ${esc(err.message)}</p>`;
      $("#cplan-build").disabled = false;
      st.building = false;
    }
  }

  const resize = new ResizeObserver(() => size());
  resize.observe($(".cplan-map"));
  function destroy() {
    resize.disconnect();
    document.removeEventListener("keydown", keys);
  }
  size();
  refresh();
  if (suggested) note(`${st.plan.holes.length} holes suggested from the map's greens and tees. Tap a hole to put it right; Make it the 1st if the numbering starts in the wrong place.`);
  return { destroy, plan: () => st.plan };
}

const COLOUR_WORD = { white: "White", yellow: "Yellow", red: "Red" };
const burnWidths = (now) => `<label>Width <select data-set="burn">${Object.entries(BURN_WIDTHS).map(([k, v]) => `<option value="${k}" ${Number(k) === now ? "selected" : ""}>${v}</option>`).join("")}</select></label>`;

const ordinal = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
