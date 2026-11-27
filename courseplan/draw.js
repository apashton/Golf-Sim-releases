// The course plan's map (courseplan.js): the ground shaded from its
// heights - LiDAR's metre shows each green's banks, each tee's platform,
// each bunker's hollow, which is what the player picks them out by - and
// aerial photos of it where there are some (sim/aerial.mjs), then over
// them the map's own woods, water, buildings, paths and the course's
// outline, then the plan: fairways, out of bounds, tees, greens, bunkers,
// walls and fences, burns and their bridges, and the holes with their
// numbers and flags (the picked hole's tee boxes in their colours). North
// up.
//
// Drawing: it's handed the state and draws it (loading photo tiles as it
// needs them); courseplan.js does the rest.

import { MAP_COLORS } from "../look/palette.js";
import { holeFacts, teesOfHole } from "../sim/courseplan.mjs";
import { boxColour, bridgesOf, BRIDGE } from "../sim/planextras.mjs";
import { project, unproject } from "../sim/terrain.mjs";
import { tileEdges, zoomFor, tilesOver } from "../sim/aerial.mjs";

const C = {
  ground: [79, 127, 58],
  wood: "rgba(37, 72, 47, 0.75)",
  water: "#3f7fa8",
  building: "#8a8478",
  path: "rgba(230, 226, 214, 0.55)",
  outline: "rgba(255, 255, 255, 0.75)",
  // (See-through: the ground's shading shows under them.)
  fairway: "rgba(125, 181, 85, 0.5)",
  green: "rgba(149, 201, 107, 0.8)",
  tee: "rgba(154, 208, 110, 0.8)",
  bunker: "rgba(227, 211, 163, 0.85)",
  out: "rgba(255, 255, 255, 0.16)",
  wall: "#d9d2bf",
  burn: "#2f6f9e",
  stone: "#cfc6b0",
  sets: { white: "#ffffff", yellow: "#ffd23f", red: "#e5484d" },
  fence: "#ffffff",
  hole: "rgba(255, 255, 255, 0.85)",
  picked: "#ffd23f",
  warn: "#ff7a5a",
  flag: MAP_COLORS.flag,
};

// The ground, shaded as if lit from the north-west, its heights stood up a
// little more than they are (a green's bank shows): a picture of the grid's
// own cells, one pixel each, north up.
export function shadePicture(g) {
  const { nx, nz, cell, h } = g;
  const canvas = document.createElement("canvas");
  canvas.width = nx;
  canvas.height = nz;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(nx, nz);
  const up = 2.4;
  const L = [-0.55, 0.55, 0.63];
  const at = (i, j) => h[Math.min(nz - 1, Math.max(0, j)) * nx + Math.min(nx - 1, Math.max(0, i))];
  for (let j = 0; j < nz; j++) {
    const row = nz - 1 - j;
    for (let i = 0; i < nx; i++) {
      const dx = ((at(i + 1, j) - at(i - 1, j)) / (2 * cell)) * up;
      const dz = ((at(i, j + 1) - at(i, j - 1)) / (2 * cell)) * up;
      const shade = Math.max(0, (-dx * L[0] - dz * L[1] + L[2]) / Math.sqrt(dx * dx + dz * dz + 1));
      const k = 0.42 + 0.85 * shade;
      const o = (row * nx + i) * 4;
      img.data[o] = Math.min(255, C.ground[0] * k);
      img.data[o + 1] = Math.min(255, C.ground[1] * k);
      img.data[o + 2] = Math.min(255, C.ground[2] * k);
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// The view: metres to the canvas's pixels and back.
export function viewOf(view, W, H) {
  const { cx, cz, scale } = view;
  return {
    scale,
    to: ([x, z]) => [W / 2 + (x - cx) * scale, H / 2 - (z - cz) * scale],
    from: ([px, py]) => [cx + (px - W / 2) / scale, cz - (py - H / 2) / scale],
  };
}

// ---- Aerial photos (sim/aerial.mjs) ------------------------------------------------

// The tiles kept loaded at once, at most.
const TILES_KEPT = 900;

// A photo tile's picture: loaded once (st.tiles), the map drawn again when
// it comes; null until then (or if it never does).
function photoTile(st, id, z, x, y) {
  const key = `${id}/${z}/${x}/${y}`;
  let t = st.tiles.get(key);
  if (!t) {
    const img = new Image();
    t = { img, ok: false };
    img.onload = () => {
      t.ok = img.naturalWidth > 0;
      st.redraw?.();
    };
    img.onerror = () => (t.failed = true);
    img.src = `/api/map/aerial/tile/${id}/${z}/${x}/${y}`;
    st.tiles.set(key, t);
    if (st.tiles.size > TILES_KEPT) st.tiles.delete(st.tiles.keys().next().value);
  }
  return t.ok ? t.img : null;
}

// The photos under the map: each tile where its edges lie on the course
// (the plan's metres, north up), the zoom as fine as the screen's pixels
// (no finer than the source has); while one loads, the coarser tile it's
// part of stands in. Returns whether any was drawn.
function drawPhotos(g, st, v, W, H) {
  const src = st.photo;
  const o = st.plan.origin;
  const [x0, z1] = v.from([0, 0]);
  const [x1, z0] = v.from([W, H]);
  const a = unproject(o, x0, z0);
  const b = unproject(o, x1, z1);
  const box = { south: a.lat, west: a.lon, north: b.lat, east: b.lon };
  let z = zoomFor(1 / (v.scale * (st.dpr || 1)), (a.lat + b.lat) / 2, { min: 10, max: src.maxZoom });
  let tiles = tilesOver(box, z, 240);
  while (!tiles.length && z > 10) tiles = tilesOver(box, --z, 240);
  let drawn = false;
  g.imageSmoothingEnabled = true;
  for (const t of tiles) {
    const e = tileEdges(t.z, t.x, t.y);
    const [l, tp] = v.to(project(o, e.north, e.west));
    const [r, bt] = v.to(project(o, e.south, e.east));
    const img = photoTile(st, src.id, t.z, t.x, t.y);
    if (img) {
      g.drawImage(img, l, tp, r - l + 0.5, bt - tp + 0.5);
      drawn = true;
      continue;
    }
    // A coarser one, already here, cut to this tile's part.
    for (let k = 1; k <= 4 && t.z - k >= 0; k++) {
      const up = st.tiles.get(`${src.id}/${t.z - k}/${t.x >> k}/${t.y >> k}`);
      if (!up?.ok) continue;
      const part = 256 >> k;
      g.drawImage(up.img, (t.x - ((t.x >> k) << k)) * part, (t.y - ((t.y >> k) << k)) * part, part, part, l, tp, r - l + 0.5, bt - tp + 0.5);
      drawn = true;
      break;
    }
  }
  return drawn;
}

// Whose photos they are, in the corner.
function credit(g, text, W, H) {
  g.font = "11px sans-serif";
  const w = g.measureText(text).width;
  g.fillStyle = "rgba(0,0,0,0.6)";
  g.fillRect(W - w - 14, H - 20, w + 10, 16);
  g.fillStyle = "#fff";
  g.textAlign = "right";
  g.textBaseline = "middle";
  g.fillText(text, W - 9, H - 12);
}

// Everything, onto a 2D context W x H pixels. st: { plan, map, ground,
// shade, view, sel, drawing, tool, newHole, show: { ground, photo },
// photo (the photo source), tiles, redraw, dpr }.
export function drawPlan(g, st, W, H) {
  const v = viewOf(st.view, W, H);
  g.fillStyle = `rgb(${C.ground.join(",")})`;
  g.fillRect(0, 0, W, H);
  // The ground.
  if (st.shade && st.ground && st.show?.ground !== false) {
    const gr = st.ground;
    const [left, top] = v.to([gr.x0 - gr.cell / 2, gr.z0 + (gr.nz - 0.5) * gr.cell]);
    g.imageSmoothingEnabled = v.scale < 3;
    g.drawImage(st.shade, left, top, gr.nx * gr.cell * v.scale, gr.nz * gr.cell * v.scale);
  }
  // The photos: over the shading, a little see-through, when both are on.
  const photos = !!(st.photo && st.show?.photo && st.tiles);
  if (photos) {
    g.globalAlpha = st.show.ground ? 0.75 : 1;
    drawPhotos(g, st, v, W, H);
    g.globalAlpha = 1;
  }
  // Over a photo, the map's shapes and the plan's are see-through, outlined.
  const see = photos ? 0.4 : 1;
  const path = (pts, close = true) => {
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(...v.to(p)) : g.moveTo(...v.to(p))));
    if (close) g.closePath();
  };
  const fill = (list, colour) => {
    g.fillStyle = colour;
    g.globalAlpha = see;
    for (const p of list) {
      path(p);
      g.fill();
    }
    g.globalAlpha = 1;
  };
  const stroke = (list, colour, width, dash = [], close = true) => {
    g.strokeStyle = colour;
    g.lineWidth = width;
    g.setLineDash(dash);
    for (const p of list) {
      path(p, close);
      g.stroke();
    }
    g.setLineDash([]);
  };
  const { plan, map } = st;
  // The map's own, under the plan.
  fill(map.woods, C.wood);
  fill(map.water, C.water);
  stroke(map.paths, C.path, Math.max(1, 1.6 * v.scale), [], false);
  fill(map.buildings, C.building);
  stroke(map.outline, C.outline, 1.5, [8, 6]);
  // The plan's ground: fairways, out of bounds.
  fill(plan.fairways, C.fairway);
  if (photos) stroke(plan.fairways, "rgba(220,255,200,0.7)", 1);
  fill([...map.out, ...plan.out], C.out);
  stroke([...map.out, ...plan.out], "rgba(255,255,255,0.6)", 1, [3, 4]);
  fill(plan.tees, C.tee);
  stroke(plan.tees, "rgba(20,40,16,0.55)", 1);
  fill(plan.greens, C.green);
  stroke(plan.greens, "rgba(20,40,16,0.55)", 1);
  fill(plan.bunkers, C.bunker);
  // Walls and fences: the map's, then the plan's.
  for (const w of [...map.walls, ...plan.walls]) stroke([w.line], w.kind === "fence" ? C.fence : C.wall, w.kind === "fence" ? 1.5 : 2.5, w.kind === "fence" ? [5, 3] : [], false);
  // Burns: water between stone walls; their bridges over them.
  (plan.burns ?? []).forEach((b, i) => {
    const picked = st.sel?.kind === "burn" && st.sel.i === i;
    const w = Math.max(2, b.width * v.scale);
    stroke([b.line], picked ? C.picked : C.stone, w + Math.max(2, 1.2 * v.scale), [], false);
    stroke([b.line], C.burn, w, [], false);
    for (const x of bridgesOf(b, map.paths)) stroke([[x.from, x.to]], C.stone, Math.max(3, BRIDGE.width * v.scale), [], false);
  });
  // Greens and tees in no hole: marked, so they're seen.
  if (st.checks) {
    g.font = "700 13px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (const i of st.checks.spareGreens) {
      const p = plan.greens[i];
      if (!p) continue;
      const [x, y] = v.to(centre(p));
      g.fillStyle = "rgba(20,20,20,0.6)";
      g.beginPath();
      g.arc(x, y, 9, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#fff";
      g.fillText("?", x, y + 0.5);
    }
  }
  // The holes.
  const facts = holeFacts(plan);
  const sel = st.sel;
  plan.holes.forEach((h, i) => {
    const picked = sel?.kind === "hole" && sel.i === i;
    const noGreen = facts[i].green < 0;
    g.setLineDash(picked ? [] : [7, 5]);
    g.lineWidth = picked ? 3 : 2;
    g.strokeStyle = picked ? C.picked : noGreen ? C.warn : C.hole;
    path(h.line, false);
    g.stroke();
    g.setLineDash([]);
    // Its flag.
    const [fx, fy] = v.to(h.line[h.line.length - 1]);
    g.strokeStyle = "#fff";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(fx, fy);
    g.lineTo(fx, fy - 14);
    g.stroke();
    g.fillStyle = C.flag;
    g.beginPath();
    g.moveTo(fx, fy - 14);
    g.lineTo(fx + 9, fy - 11);
    g.lineTo(fx, fy - 8);
    g.fill();
    // Its number at the tee.
    const [tx, ty] = v.to(h.line[0]);
    g.beginPath();
    g.arc(tx, ty, 11, 0, Math.PI * 2);
    g.fillStyle = picked ? C.picked : "rgba(10,20,12,0.85)";
    g.fill();
    g.fillStyle = picked ? "#13200f" : "#fff";
    g.font = "700 12px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(String(i + 1), tx, ty + 0.5);
    // Its White and Red, where they're set.
    for (const c of ["white", "red"]) {
      const p = h.sets?.[c];
      if (!p) continue;
      const [x, y] = v.to(p);
      g.beginPath();
      g.arc(x, y, 4.5, 0, Math.PI * 2);
      g.fillStyle = C.sets[c];
      g.fill();
      g.lineWidth = 1;
      g.strokeStyle = "#13200f";
      g.stroke();
    }
    // The picked hole's dots: drag them; its bends too.
    if (picked) {
      // Its tee boxes in their colours (none: dashed).
      for (const ti of teesOfHole(plan, h)) {
        const c = boxColour(h, plan.tees[ti]);
        stroke([plan.tees[ti]], c ? C.sets[c] : "rgba(255,255,255,0.8)", c ? 3 : 1.5, c ? [] : [3, 3]);
      }
      h.line.forEach((p, k) => {
        if (k === 0) return;
        const [x, y] = v.to(p);
        g.beginPath();
        g.arc(x, y, k === h.line.length - 1 ? 7 : 6, 0, Math.PI * 2);
        g.fillStyle = k === h.line.length - 1 ? "#fff" : C.picked;
        g.fill();
        g.lineWidth = 2;
        g.strokeStyle = "#13200f";
        g.stroke();
      });
    }
  });
  // What's picked.
  if (sel?.kind === "shape" && plan[sel.list]?.[sel.i]) stroke([plan[sel.list][sel.i]], C.picked, 3);
  if (sel?.kind === "out" && plan.out[sel.i]) stroke([plan.out[sel.i]], C.picked, 3);
  if (sel?.kind === "wall" && plan.walls[sel.i]) stroke([plan.walls[sel.i].line], C.picked, 4, [], false);
  // What's being drawn: its taps and the line through them.
  if (st.drawing?.length) {
    stroke([st.drawing], C.picked, 2.5, [6, 4], false);
    for (const p of st.drawing) {
      const [x, y] = v.to(p);
      g.beginPath();
      g.arc(x, y, 5, 0, Math.PI * 2);
      g.fillStyle = C.picked;
      g.fill();
    }
  }
  // A new hole's tee, waiting for its green.
  if (st.newHole?.tee) {
    const [x, y] = v.to(st.newHole.tee);
    g.beginPath();
    g.arc(x, y, 10, 0, Math.PI * 2);
    g.lineWidth = 3;
    g.strokeStyle = C.picked;
    g.stroke();
  }
  if (photos) credit(g, st.photo.credit, W, H);
  // The scale: a bar of a round number of metres.
  const metres = [10, 20, 50, 100, 200, 500].find((m) => m * v.scale >= 70) ?? 1000;
  g.fillStyle = "rgba(0,0,0,0.55)";
  g.fillRect(10, H - 28, metres * v.scale + 16, 20);
  g.fillStyle = "#fff";
  g.fillRect(18, H - 16, metres * v.scale, 3);
  g.font = "12px sans-serif";
  g.textAlign = "left";
  g.textBaseline = "bottom";
  g.fillText(`${metres} m`, 18, H - 18);
}

function centre(poly) {
  let x = 0;
  let z = 0;
  for (const p of poly) {
    x += p[0];
    z += p[1];
  }
  return [x / poly.length, z / poly.length];
}
