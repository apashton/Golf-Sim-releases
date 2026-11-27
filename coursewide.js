// The whole course on one map in the designer (sim/coursewide.mjs has the
// sums): every hole where it is on the ground, north up, the one picked
// marked out. A tap on a hole picks it (the designer's Course layout
// screen, closed, shows it to change). On a designed course,
// or one on made-up hills, the holes can be laid out by hand: drag a hole
// to move it, drag its yellow dot (by the green) to turn it about its tee.
// Holes don't cross unless asked to (the owner: "so that the holes don't
// cross over each other unless you want them to"): one let go where it
// would cross another stops short of it - held Alt, it crosses, and that
// pair is let cross from then on. Holes that cross are drawn red and
// listed under the map, to move apart or to let cross. The mouse wheel (or
// the + and − buttons) looks closer; dragging empty ground looks around.
// A course by the sea has its sea and beach drawn round it (sim/coast.mjs).

import { courseShapes, holeAt, canMoveHoles, isHills, moveHole, crossings, clearSpot, allowCrossing, untangle, clashesOf } from "./sim/coursewide.mjs";
import { coursePlaces } from "./sim/imaginary.mjs";
import { linkPaths, bendLink } from "./sim/linkpaths.mjs";
import { MAP_COLORS, mapGround } from "./look/palette.js";
import { coastOf, COAST } from "./sim/coast.mjs";

const C = {
  ground: MAP_COLORS.rough,
  woods: MAP_COLORS.wood,
  fairway: MAP_COLORS.fairway,
  green: MAP_COLORS.green,
  tee: MAP_COLORS.tee,
  sand: MAP_COLORS.bunker,
  water: "#3f7fa8",
  sea: [63, 112, 138],
  beach: [214, 198, 156],
};

// The sea round a course on the map, as a picture under everything else:
// worked out on a coarser grid than the map's pixels and drawn smoothed.
// Kept while the course's coast and the map's view stay the same (a hole
// being dragged draws again often; its coast follows when it's let go).
let seaPicture = null;
function seaUnder(g, coast, fit, W, H) {
  const key = `${fit.scale}|${fit.cx}|${fit.cz}|${W}|${H}`;
  if (seaPicture?.coast !== coast || seaPicture.key !== key) {
    const step = 2;
    const w = Math.ceil(W / step);
    const h = Math.ceil(H / step);
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const ctx = off.getContext("2d");
    const img = ctx.createImageData(w, h);
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const [e, n] = fit.from([(i + 0.5) * step, (j + 0.5) * step]);
        const d = coast.at(e, n);
        const c = d < 0 ? C.sea : d < COAST.beach ? C.beach : null;
        if (!c) continue;
        const k = (j * w + i) * 4;
        img.data[k] = c[0];
        img.data[k + 1] = c[1];
        img.data[k + 2] = c[2];
        img.data[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    seaPicture = { coast, key, off };
  }
  g.imageSmoothingEnabled = true;
  g.drawImage(seaPicture.off, 0, 0, W, H);
}

// el: where it goes. course(): the course now. selected(): the hole picked.
// pick(i): hole i tapped. moved(course): the course with a hole moved or
// turned (a designed course's routing). size: the map's pixels.
export function mountCourseMap(el, { course, selected, pick, moved, size = [1200, 620] }) {
  el.innerHTML = `
    <div class="cmap-bar">
      <h3>The course</h3>
      <span class="muted small cmap-hint"></span>
      <span class="gap"></span>
      <button data-z="1" title="Look closer" aria-label="Zoom in">+</button>
      <button data-z="-1" title="Look further" aria-label="Zoom out">&minus;</button>
      <button data-z="0">Whole course</button>
    </div>
    <canvas class="cmap" width="${size[0]}" height="${size[1]}"></canvas>
    <p class="cmap-note small" hidden></p>
    <div class="cmap-cross"></div>`;
  const canvas = el.querySelector("canvas");
  canvas.style.touchAction = "none";
  const view = { zoom: 1, cx: null, cz: null };
  let drag = null;
  let places = null; // while a hole is being dragged
  let links = []; // the cart paths between holes, as drawn
  let bending = null; // { from, at } while a path's dot is dragged

  const hint = () => {
    const c = course();
    el.querySelector(".cmap-hint").textContent =
      (canMoveHoles(c)
        ? "Tap a hole to pick it. Drag a hole to move it, its yellow dot to turn it - hold Alt as you let go to let it cross another."
        : "Each hole where it is on the ground (a real course). Tap one to pick it.") + (c?.linkPaths ? " Drag a cart path's dot to bend it; tap the dot to put it back." : "");
  };
  let noteTimer = 0;
  const note = (text) => {
    const n = el.querySelector(".cmap-note");
    n.textContent = text;
    n.hidden = !text;
    clearTimeout(noteTimer);
    if (text) noteTimer = setTimeout(() => (n.hidden = true), 6000);
  };

  // The holes that cross, under the map: each to move apart or let cross
  // (or, let cross on purpose, to keep apart again).
  function listCrossings(list) {
    const box = el.querySelector(".cmap-cross");
    const c = course();
    const movable = canMoveHoles(c);
    const bad = list.filter((x) => !x.ok);
    const ok = list.filter((x) => x.ok);
    const name = (x) => `Holes ${x.a + 1} and ${x.b + 1}`;
    box.innerHTML = [
      bad.length
        ? `<div class="cmap-bad"><b>${bad.length === 1 ? "Two holes cross" : `${bad.length} pairs of holes cross`}</b>${
            movable ? ` <button data-cross="untangle">Move them apart</button>` : ""
          }${bad.map((x) => `<span class="cmap-pair">${name(x)} ${x.d ? `come within ${x.d} m` : "cross"} <button data-allow="${x.key}">Let them cross</button></span>`).join("")}</div>`
        : "",
      ok.length ? `<div class="cmap-ok"><span class="muted">Crossing on purpose:</span> ${ok.map((x) => `<span class="cmap-pair">${name(x)} <button data-keep="${x.key}">Keep them apart</button></span>`).join("")}</div>` : "",
    ].join("");
    box.querySelector('[data-cross="untangle"]')?.addEventListener("click", () => {
      const { course: next, left } = untangle(course());
      moved(next);
      note(left ? `Moved what could be moved; ${left} still cross - drag them apart, or let them cross.` : "Moved apart - no holes cross now.");
    });
    box.querySelectorAll("[data-allow]").forEach((b) => b.addEventListener("click", () => moved(allowCrossing(course(), b.dataset.allow, true))));
    box.querySelectorAll("[data-keep]").forEach((b) => b.addEventListener("click", () => moved(allowCrossing(course(), b.dataset.keep, false))));
  }

  // The map's fit: metres to canvas pixels, north up.
  let fit = null;
  function fitTo(shapes) {
    const { x0, z0, x1, z1 } = shapes.bounds;
    const W = canvas.width;
    const H = canvas.height;
    const pad = 30;
    const base = Math.min((W - pad * 2) / Math.max(1, x1 - x0), (H - pad * 2) / Math.max(1, z1 - z0));
    const scale = base * view.zoom;
    const cx = view.cx ?? (x0 + x1) / 2;
    const cz = view.cz ?? (z0 + z1) / 2;
    return {
      scale,
      cx,
      cz,
      to: ([x, z]) => [W / 2 + (x - cx) * scale, H / 2 - (z - cz) * scale],
      from: ([px, py]) => [cx + (px - W / 2) / scale, cz - (py - H / 2) / scale],
    };
  }

  function draw() {
    const c = course();
    const shapes = courseShapes(c, places ?? coursePlaces(c));
    // Held still while a hole is dragged (the map would follow it off).
    fit = drag?.fit ?? fitTo(shapes);
    const g = canvas.getContext("2d");
    // A course of brown links holes on its dunes' khaki, their fairways
    // yellower (look/palette.js mapGround), as the 3D draws them.
    const grounds = (c?.holes ?? []).map((h) => mapGround(h.layout));
    const brown = grounds.filter((q) => q.patches).length * 2 > grounds.length;
    g.fillStyle = brown ? MAP_COLORS.links.rough : C.ground;
    g.fillRect(0, 0, canvas.width, canvas.height);
    const coast = coastOf(c);
    if (coast) seaUnder(g, coast, fit, canvas.width, canvas.height);
    const poly = (pts) => {
      g.beginPath();
      pts.forEach((p, i) => (i ? g.lineTo(...fit.to(p)) : g.moveTo(...fit.to(p))));
      g.closePath();
    };
    const fill = (list, colour) => {
      g.fillStyle = colour;
      for (const pts of list) {
        poly(pts);
        g.fill();
      }
    };
    for (const h of shapes.holes) fill(h.shapes.woods, C.woods);
    shapes.holes.forEach((h, i) => fill(h.shapes.fairways, grounds[i]?.fairway ?? C.fairway));
    for (const h of shapes.holes) {
      fill(h.shapes.tees, C.tee);
      fill(h.shapes.greens, C.green);
      fill(h.shapes.bunkers, C.sand);
      fill(h.shapes.water, C.water);
    }
    // An island green's way to land, over its water (sim/causeway.mjs).
    shapes.holes.forEach((h, i) => fill(h.shapes.causeways ?? [], grounds[i]?.fairway ?? C.fairway));
    // The cart paths between holes (sim/linkpaths.mjs), each with its dot
    // to bend it by - straight from end to end while a hole's dragged
    // (quick), and through the dot while it's dragged.
    // (As kept, where the course is as it was when they were: sim/pathlock.mjs.)
    links = linkPaths(c, places ? { places, quick: true } : {}).map((l) => (bending && l.from === bending.from ? { ...l, line: [l.line[0], bending.at, l.line[l.line.length - 1]], bend: bending.at, dragged: true } : l));
    for (const l of links) {
      g.beginPath();
      const pts = l.line.map((q) => fit.to(q));
      g.moveTo(...pts[0]);
      if (l.dragged) g.quadraticCurveTo(2 * pts[1][0] - (pts[0][0] + pts[2][0]) / 2, 2 * pts[1][1] - (pts[0][1] + pts[2][1]) / 2, ...pts[2]);
      else for (const q of pts.slice(1)) g.lineTo(...q);
      g.lineWidth = 3;
      g.strokeStyle = "#d9cfb2";
      g.stroke();
      const [bx, by] = fit.to(l.bend);
      g.beginPath();
      g.arc(bx, by, 5, 0, Math.PI * 2);
      g.fillStyle = "#f4efe0";
      g.fill();
      g.lineWidth = 1.5;
      g.strokeStyle = "#5c533a";
      g.stroke();
    }
    const sel = selected();
    const movable = canMoveHoles(c);
    // Holes that cross: red (orange when on purpose), with a ring where.
    const cross = crossings(c, shapes);
    const clashing = new Set(cross.filter((x) => !x.ok).flatMap((x) => [x.a, x.b]));
    for (const x of cross) {
      const [cx, cy] = fit.to(x.at);
      g.beginPath();
      g.arc(cx, cy, 14, 0, Math.PI * 2);
      g.lineWidth = 3;
      g.strokeStyle = x.ok ? "#ffa94d" : "#ff5a4f";
      g.stroke();
    }
    if (!drag) listCrossings(cross);
    for (const [i, h] of shapes.holes.entries()) {
      // The line of play, and its number at the tee.
      g.setLineDash([6, 5]);
      g.lineWidth = i === sel || clashing.has(i) ? 3 : 1.5;
      g.strokeStyle = clashing.has(i) ? "#ff5a4f" : i === sel ? "#ffd23f" : "rgba(255,255,255,0.7)";
      g.beginPath();
      h.shapes.path.forEach((p, k) => (k ? g.lineTo(...fit.to(p)) : g.moveTo(...fit.to(p))));
      g.stroke();
      g.setLineDash([]);
      const [tx, ty] = fit.to(h.shapes.path[0]);
      g.beginPath();
      g.arc(tx, ty, 11, 0, Math.PI * 2);
      g.fillStyle = i === sel ? "#ffd23f" : "rgba(10,20,12,0.85)";
      g.fill();
      g.fillStyle = i === sel ? "#13200f" : "#fff";
      g.font = "700 12px sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(String(h.number), tx, ty + 0.5);
      // The flag.
      const [fx, fy] = fit.to(h.shapes.pin);
      g.fillStyle = "#e5484d";
      g.beginPath();
      g.arc(fx, fy, 3, 0, Math.PI * 2);
      g.fill();
      if (movable && i === sel) {
        // The turning dot, just past the green.
        const [rx, ry] = turnDot(h);
        g.beginPath();
        g.arc(rx, ry, 8, 0, Math.PI * 2);
        g.fillStyle = "#ffd23f";
        g.fill();
        g.lineWidth = 2;
        g.strokeStyle = "#13200f";
        g.stroke();
      }
    }
    // A designed course's clubhouse, where each nine starts and comes home
    // (sim/routing.mjs).
    if (canMoveHoles(c) && !isHills(c)) {
      const [hx, hy] = fit.to([0, 0]);
      g.beginPath();
      g.moveTo(hx - 9, hy + 7);
      g.lineTo(hx - 9, hy - 2);
      g.lineTo(hx, hy - 10);
      g.lineTo(hx + 9, hy - 2);
      g.lineTo(hx + 9, hy + 7);
      g.closePath();
      g.fillStyle = "#f4efe0";
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = "#7a2c2e";
      g.stroke();
    }
    canvas.shapes = shapes;
    canvas.linkPaths = links;
    // A course point's place on the page (for the browser checks).
    canvas.pointFor = (q) => {
      const r = canvas.getBoundingClientRect();
      const [px, py] = fit.to(q);
      return [r.left + (px * r.width) / canvas.width, r.top + (py * r.height) / canvas.height];
    };
    hint();
  }

  // Where a picked hole's turning dot is: 25 m past its pin, along it.
  function turnDot(h) {
    const [ax, az] = h.shapes.path[0];
    const [bx, bz] = h.shapes.pin;
    const d = Math.hypot(bx - ax, bz - az) || 1;
    return fit.to([bx + ((bx - ax) / d) * 25, bz + ((bz - az) / d) * 25]);
  }

  const toPx = (e) => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) * canvas.width) / r.width, ((e.clientY - r.top) * canvas.height) / r.height];
  };

  canvas.addEventListener("pointerdown", (e) => {
    const c = course();
    const at = toPx(e);
    const p = fit.from(at);
    canvas.setPointerCapture(e.pointerId);
    const shapes = canvas.shapes;
    const sel = selected();
    const movable = canMoveHoles(c);
    // A cart path's dot: bent where it's dragged, put back with a tap.
    const dot = links.find((l) => {
      const [bx, by] = fit.to(l.bend);
      return Math.hypot(bx - at[0], by - at[1]) < (e.pointerType === "touch" ? 16 : 9);
    });
    if (dot) {
      drag = { type: "bend", from: dot.from, start: p, moved: false, fit };
      return;
    }
    if (movable && sel >= 0 && shapes.holes[sel]) {
      const [rx, ry] = turnDot(shapes.holes[sel]);
      if (Math.hypot(rx - at[0], ry - at[1]) < 14) {
        drag = { type: "turn", i: sel, start: p, base: coursePlaces(c), fit };
        return;
      }
    }
    const i = holeAt(shapes, p[0], p[1], 14 / fit.scale + 20);
    if (i >= 0) {
      // A hole that can move is picked when it's let go of without a drag
      // (a drag moves it instead).
      if (!movable) {
        if (i !== sel) pick(i);
        drag = null;
      } else drag = { type: "move", i, start: p, base: coursePlaces(c), moved: false, fit, open: i !== sel };
      return;
    }
    drag = { type: "pan", start: at, cx: fit.cx, cz: fit.cz };
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const at = toPx(e);
    if (drag.type === "pan") {
      view.cx = drag.cx - (at[0] - drag.start[0]) / fit.scale;
      view.cz = drag.cz + (at[1] - drag.start[1]) / fit.scale;
      return draw();
    }
    const p = fit.from(at);
    if (drag.type === "bend") {
      if (!drag.moved && Math.hypot(p[0] - drag.start[0], p[1] - drag.start[1]) * fit.scale < 4) return;
      drag.moved = true;
      bending = { from: drag.from, at: p };
      return draw();
    }
    const base = drag.base[drag.i];
    if (drag.type === "move") {
      if (!drag.moved && Math.hypot(p[0] - drag.start[0], p[1] - drag.start[1]) * fit.scale < 4) return;
      drag.moved = true;
      places = drag.base.map((q, k) => (k === drag.i ? { ...q, x: q.x + p[0] - drag.start[0], z: q.z + p[1] - drag.start[1] } : q));
    } else {
      const a0 = Math.atan2(drag.start[1] - base.z, drag.start[0] - base.x);
      const a1 = Math.atan2(p[1] - base.z, p[0] - base.x);
      places = drag.base.map((q, k) => (k === drag.i ? { ...q, heading: q.heading + (a1 - a0) } : q));
    }
    draw();
  });
  const up = (e) => {
    const d = drag;
    drag = null;
    if (d?.type === "bend") {
      const c = course();
      const number = c.holes[d.from]?.spec?.number ?? d.from + 1;
      const at = d.moved ? bending?.at : null;
      bending = null;
      if (!d.moved && !c.linkBends?.[String(number)]) return draw();
      // Not over a tee box, a green, sand or water (sim/linkpaths.mjs):
      // left where it was.
      const next = bendLink(c, number, at);
      if (next.refused) {
        note("A cart path can't go there - that bend would take it over a tee, a green, sand or water.");
        return draw();
      }
      return moved(next);
    }
    if (d?.open && !d.moved) {
      places = null;
      return pick(d.i);
    }
    if (!d || d.type === "pan" || !places) return draw();
    const was = d.base[d.i];
    const want = places[d.i];
    places = null;
    let c = course();
    let to = want;
    if (e?.altKey) {
      // Let it cross whatever it now crosses.
      const placesNow = d.base.map((q, k) => (k === d.i ? want : q));
      for (const x of clashesOf(c, d.i, courseShapes(c, placesNow))) c = allowCrossing(c, x.key, true);
    } else {
      const spot = clearSpot(c, d.i, was, want);
      to = spot.place;
      if (spot.slid) {
        const placesNow = d.base.map((q, k) => (k === d.i ? want : q));
        const hit = clashesOf(c, d.i, courseShapes(c, placesNow)).map((x) => (x.a === d.i ? x.b : x.a) + 1);
        note(`Hole ${d.i + 1} would cross hole ${hit.join(" and ")} there, so it's stopped short. Hold Alt as you let go to let them cross.`);
      }
    }
    moved(moveHole(c, d.i, { dx: to.x - was.x, dz: to.z - was.z, turn: to.heading - was.heading }));
  };
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoom(e.deltaY < 0 ? 1.25 : 1 / 1.25);
    },
    { passive: false },
  );
  function zoom(f) {
    view.cx = fit.cx;
    view.cz = fit.cz;
    view.zoom = Math.min(12, Math.max(1, view.zoom * f));
    if (view.zoom === 1) view.cx = view.cz = null;
    draw();
  }
  el.querySelectorAll("[data-z]").forEach((b) =>
    b.addEventListener("click", () => {
      const z = Number(b.dataset.z);
      if (z === 0) {
        view.zoom = 1;
        view.cx = view.cz = null;
        draw();
      } else zoom(z > 0 ? 1.5 : 1 / 1.5);
    }),
  );
  draw();
  return { draw };
}

