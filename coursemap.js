// A hole drawn from above on a canvas: for the designer, and for the map
// shown while playing (with the ball, the shots so far and the aim).
// The hole is turned so the tee is at the bottom and the green at the top.

import { makePath, pointAt, fairwayHalfWidth, firstCutWidth, deepRoughFrom, blobOutline, insideBlob, teeBoxes, teeBridges, greenMownReach, surfaceAt, reachesGreen, SURROUND, FRINGE, FIRST_CUT } from "./sim/course.mjs";
import { YARD } from "./sim/flight.mjs";
import { TREE_KINDS } from "./sim/lidartrees.mjs";
import { withEdits } from "./sim/holeedits.mjs";
import { pathLine, validPath, otherTeeBoxes } from "./sim/paths.mjs";
import { TEE_REACH } from "./sim/course.mjs";
import { wallOf, wallLine, wallViews } from "./sim/walls.mjs";
import { mapMarks, signsFor } from "./sim/signs.mjs";
import { MAP_COLORS, PALETTE, mapGround } from "./look/palette.js";
import { dunesDressing } from "./sim/dunes.mjs";
import { penaltyOf } from "./sim/penalty.mjs";
import { causeways, causewayOutline } from "./sim/causeway.mjs";

// The map's colours are the 3D course's (look/palette.js), so a pond on the
// map is the same dark green-blue as the pond in the picture - and a brown
// links hole's ground its khaki and straw (mapGround), not green.
const COLORS = MAP_COLORS;

// Works out the turn and scale that fit a hole into a w x h canvas.
// `view` { zoom, at: [x, z] } looks closer, with `at` in the middle.
// fromCanvas turns a point on the canvas back into the hole's frame.
export function fitHole(layout, w, h, pad = 12, view = null) {
  const path = makePath(layout.path);
  const end = layout.path[layout.path.length - 1];
  // Turn so tee -> green points up the canvas.
  const angle = Math.atan2(end[1], end[0]);
  const c = Math.cos(-angle);
  const s = Math.sin(-angle);
  const rot = ([x, z]) => [x * c - z * s, x * s + z * c];
  // Bounds of the playing area (to the tree line), after turning.
  const pts = [];
  for (let d = 0; d <= path.length; d += 10) {
    const at = pointAt(path, d);
    for (const off of [-layout.treeLine, layout.treeLine]) pts.push(rot([at.p[0] - at.dir[1] * off, at.p[1] + at.dir[0] * off]));
  }
  pts.push(rot([layout.green.x + 30, layout.green.z]), rot([-10, 0]));
  // A wider view (the bay map, clicked): the crop's corners as well, so the
  // holes around this one fit. The usual map is unchanged.
  if (view?.box) {
    const b = view.box;
    for (const p of [
      [b.x0, b.z0],
      [b.x1, b.z0],
      [b.x0, b.z1],
      [b.x1, b.z1],
    ])
      pts.push(rot(p));
  }
  const fx = pts.map((p) => p[0]);
  const fz = pts.map((p) => p[1]);
  const [minF, maxF, minS, maxS] = [Math.min(...fx), Math.max(...fx), Math.min(...fz), Math.max(...fz)];
  const scale = Math.min((h - pad * 2) / (maxF - minF), (w - pad * 2) / (maxS - minS));
  const midS = (minS + maxS) / 2;
  // Forward is up (canvas -y), right is right (canvas +x).
  const whole = ([x, z]) => {
    const [f, r] = rot([x, z]);
    return [w / 2 + (r - midS) * scale, h - pad - (f - minF) * scale];
  };
  const wholeBack = ([cx, cy]) => {
    const r = (cx - w / 2) / scale + midS;
    const f = (h - pad - cy) / scale + minF;
    return [f * c + r * s, -f * s + r * c];
  };
  if (!view?.at || !(view.zoom > 1)) return { toCanvas: whole, fromCanvas: wholeBack, scale, angle };
  const z = view.zoom;
  const [ax, ay] = whole(view.at);
  return {
    toCanvas: (p) => {
      const [x, y] = whole(p);
      return [w / 2 + (x - ax) * z, h / 2 + (y - ay) * z];
    },
    fromCanvas: ([x, y]) => wholeBack([(x - w / 2) / z + ax, (y - h / 2) / z + ay]),
    scale: scale * z,
    angle,
  };
}

function poly(ctx, pts, fit) {
  ctx.beginPath();
  pts.forEach((p, i) => {
    const [x, y] = fit.toCanvas(p);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

// A waste area's scrub on the map: dots of heather over it, a few metres
// apart, the same each time (from where each falls).
function wasteScrub(ctx, b, fit) {
  const r = Math.max(b.rx ?? 0, b.rz ?? 0) * 1.2;
  if (!(r > 0)) return;
  const dot = Math.max(1, fit.scale * 0.5);
  ctx.fillStyle = COLORS.wasteScrub;
  for (let x = b.x - r; x <= b.x + r; x += 3) {
    for (let z = b.z - r; z <= b.z + r; z += 3) {
      const h = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
      const px = x + (h - 0.5) * 2.4;
      const pz = z + ((h * 7.13) % 1 - 0.5) * 2.4;
      if (h > 0.55 || !insideBlob(b, px, pz)) continue;
      const [cx, cy] = fit.toCanvas([px, pz]);
      ctx.fillRect(cx - dot / 2, cy - dot / 2, dot, dot);
    }
  }
}

// Draws a hole, with any changes made to it by hand. Extras for play:
// { ball, shots: [[x, z]...], aim: { from, to }, pin, others: [{ ball, colour }]
// (other players' balls) }; for the designer, view (see fitHole); marks:
// false, no yardage marks.
export function drawHole(canvas, stored, extras = {}) {
  const layout = withEdits(stored);
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const fit = fitHole(layout, w, h, 12, extras.wide && extras.box ? { ...(extras.view ?? {}), box: extras.box } : extras.view);
  const path = makePath(layout.path);
  const ground = mapGround(layout);
  ctx.fillStyle = ground.background;
  ctx.fillRect(0, 0, w, h);
  // The other holes, muted, under this one. Only when the map is widened.
  if (extras.wide && extras.neighbours?.length) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    const wash = (polys, colour) => {
      if (!polys?.length) return;
      ctx.fillStyle = colour;
      for (const pts of polys) {
        if (!pts || pts.length < 3) continue;
        poly(ctx, pts, fit);
        ctx.fill();
      }
    };
    for (const h of extras.neighbours) {
      wash(h.fairways, h.links === "dunes" ? COLORS.links.fairway : COLORS.fairway);
      wash(h.tees, COLORS.tee);
      wash(h.greens, COLORS.green);
      wash(h.bunkers, COLORS.bunker);
      wash(h.water, COLORS.water);
    }
    ctx.restore();
  }

  if (layout.source === "map") drawMappedGround(ctx, layout, fit, ground, stored);
  else drawGeneratedGround(ctx, layout, fit, path, ground, stored);
  // Cart paths, on the ground under everything else: they never cross a
  // green, sand or water, and trees overhang them.
  drawPaths(ctx, layout, fit, w);

  // In the order play reads them (sim/course.mjs surfaceAt) and 3D draws
  // them: fringe, sand, water over them - where a bunker runs into a pond,
  // the ball is in the water - and the green over all, with its fringe
  // over water that reaches onto the green (sim/greenfirst.mjs).
  ctx.fillStyle = COLORS.fringe;
  poly(ctx, blobOutline(layout.green, 48, FRINGE), fit);
  ctx.fill();
  // (Waste areas first, as play reads them - a bunker in one is a bunker -
  // browner, dotted with scrub: sim/wastearea.mjs.)
  for (const b of [...layout.bunkers.filter((q) => q.waste), ...layout.bunkers.filter((q) => !q.waste)]) {
    ctx.fillStyle = b.waste ? COLORS.waste : COLORS.bunker;
    poly(ctx, blobOutline(b), fit);
    ctx.fill();
    if (b.waste) wasteScrub(ctx, b, fit);
    // A bunker dug deeper by hand: shaded in the middle, more for deeper.
    if (b.dig) {
      ctx.fillStyle = COLORS.bunkerDeep;
      ctx.globalAlpha = Math.min(1, 0.35 + b.dig * 0.35);
      poly(ctx, blobOutline(b, 48, -Math.min(b.rx, b.rz) * 0.35), fit);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  for (const wtr of layout.water) {
    ctx.fillStyle = COLORS.water;
    poly(ctx, blobOutline(wtr), fit);
    ctx.fill();
    // Its penalty area's line: red beside play, yellow across it
    // (sim/penalty.mjs).
    ctx.strokeStyle = penaltyOf(wtr, layout) === "yellow" ? PALETTE.penaltyYellow : PALETTE.penaltyRed;
    ctx.lineWidth = Math.max(1, w / 220);
    poly(ctx, blobOutline(wtr, 96, 0.6), fit);
    ctx.stroke();
  }
  // An island green's causeway to land, as fairway over the water and its
  // penalty line (sim/causeway.mjs) - and under the fringe.
  ctx.fillStyle = ground.fairway;
  for (const c of causeways(layout)) {
    poly(ctx, causewayOutline(c), fit);
    ctx.fill();
  }
  for (const wtr of layout.water) {
    if (!reachesGreen(layout, wtr)) continue;
    ctx.save();
    poly(ctx, blobOutline(wtr, 96, 0.6), fit);
    ctx.clip();
    ctx.fillStyle = COLORS.fringe;
    poly(ctx, blobOutline(layout.green, 48, FRINGE), fit);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = COLORS.green;
  poly(ctx, blobOutline(layout.green), fit);
  ctx.fill();
  // Walls along a bunker's or pond's edge, on top.
  drawWalls(ctx, layout, fit, w);

  // Trees: real ones (from LiDAR) as wide as their crowns.
  ctx.fillStyle = COLORS.tree;
  const tr = Math.max(1.5, 2.8 * fit.scale);
  for (const [x, z, s = 1, kind, width] of layout.trees) {
    const [cx, cy] = fit.toCanvas([x, z]);
    // Bigger trees drawn bigger, so making them taller shows.
    const crown = kind != null ? s * (width ?? 1) * TREE_KINDS[kind].radius * 0.8 : 0;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(tr * Math.min(1.6, Math.max(0.7, s)), crown * fit.scale), 0, Math.PI * 2);
    ctx.fill();
  }

  // Centreline, faintly, and distance marks: 100, 150 and 200 yards
  // straight to the middle of the green, where the yardage posts stand
  // (sim/signs.mjs), and 250 as a plain mark.
  ctx.strokeStyle = COLORS.path;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  path.points.forEach((p, i) => {
    const [x, y] = fit.toCanvas(p);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
  // (marks: false - none: the designer video's map, drawn turned on its
  // side, where their numbers would read sideways.)
  if (w >= 200 && extras.marks !== false) {
    ctx.font = `${Math.round(Math.max(9, w / 28) * (extras.labelScale ?? 1))}px system-ui, sans-serif`;
    ctx.textAlign = "left";
    // With a dark halo, so they read over sand and water too.
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    for (const mark of mapMarks(layout, path)) {
      const [x, y] = fit.toCanvas(mark.p);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeText(String(mark.n), x + 5, y + 3);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText(String(mark.n), x + 5, y + 3);
    }
    ctx.lineWidth = 1;
    // Looking closely (the designer's map zoomed in): the yardage posts
    // themselves, small dots in their colours at the fairway's edges.
    if (fit.scale > 2) {
      for (const post of signsFor(layout).posts) {
        const [x, y] = fit.toCanvas(post.at);
        ctx.fillStyle = COLORS.yardage[post.colour];
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  // Pin.
  const [px, py] = fit.toCanvas(layout.pin);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px, py - Math.max(8, h / 30));
  ctx.stroke();
  ctx.fillStyle = COLORS.flag;
  ctx.beginPath();
  ctx.moveTo(px, py - Math.max(8, h / 30));
  ctx.lineTo(px + Math.max(6, h / 45), py - Math.max(6, h / 38));
  ctx.lineTo(px, py - Math.max(4, h / 55));
  ctx.fill();
  ctx.lineWidth = 1;

  // Play extras: shots so far, the aim line, the ball.
  if (extras.shots?.length) {
    ctx.strokeStyle = "rgba(255,210,63,0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    extras.shots.forEach((p, i) => {
      const [x, y] = fit.toCanvas(p);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.lineWidth = 1;
  }
  if (extras.aim) {
    const [ax, ay] = fit.toCanvas(extras.aim.from);
    const [bx, by] = fit.toCanvas(extras.aim.to);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(bx, by, 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const o of extras.others ?? []) {
    const [x, y] = fit.toCanvas(o.ball);
    ctx.fillStyle = o.colour;
    ctx.strokeStyle = "#111";
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // A drop's spot being chosen: its relief area - the line back, or the two
  // club-lengths round - in the flag's yellow (course/dropspot.js).
  const area = extras.dropArea;
  if (area) {
    ctx.strokeStyle = "#ffd23f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (area.line) {
      const [ax, ay] = fit.toCanvas(area.line[0]);
      const [bx, by] = fit.toCanvas(area.line[1]);
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
    } else if (area.at) {
      const [cx, cy] = fit.toCanvas(area.at);
      const [ex, ey] = fit.toCanvas([area.at[0] + area.radius, area.at[1]]);
      ctx.arc(cx, cy, Math.max(3, Math.hypot(ex - cx, ey - cy)), 0, Math.PI * 2);
    }
    ctx.stroke();
  }
  // An unplayable ball's places to drop (course.js), numbered as its card
  // numbers them, in the flag's yellow.
  for (const d of extras.drops ?? []) {
    const [x, y] = fit.toCanvas(d.at);
    const r = 5.5 * Math.sqrt(extras.labelScale ?? 1);
    ctx.fillStyle = "#ffd23f";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.font = `bold ${Math.round(r * 1.5)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(d.label, x, y + r * 0.08);
  }
  if (extras.ball) {
    const [x, y] = fit.toCanvas(extras.ball);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#111";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  return fit;
}

// Cart paths (sim/paths.mjs): the same line play and the 3D path follow,
// as wide as they are once the map is big enough to show it, in what
// they're made of, with a dark edge that sets them off the rough.
// Walls (sim/walls.mjs): a thick line along the edge in what it's built of
// - a turf wall dark brown with a green top, timber brown, brick red - a
// bunker's with a darker band of sand beside it, where it's deepest, and a
// pond's with a pale line on the land side for its cap.
function drawWalls(ctx, layout, fit, w) {
  const C = COLORS.walls;
  const line = (pts) => {
    ctx.beginPath();
    pts.forEach((q, i) => {
      const [x, y] = fit.toCanvas(q);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
  };
  const thick = w < 200 ? 1.5 : Math.max(2, Math.min(5, 0.35 * fit.scale + 1.5));
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const [kind, list] of [["bunker", layout.bunkers], ["water", layout.water]]) {
    // (Each of a brook's walled stretches of bank: sim/walls.mjs wallViews.)
    for (const s of list.flatMap((q) => (Array.isArray(q.walls) ? wallViews(q) : [q]))) {
      const wall = wallOf(s);
      if (!wall) continue;
      const pts = wallLine(s).pts;
      if (w >= 200) {
        // Inside the shape (a bunker's deep band) or outside it (a pond's
        // cap): the same line, wider, clipped to one side of the edge.
        ctx.save();
        ctx.beginPath();
        if (kind === "water") ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
        blobOutline(s).forEach((q, i) => {
          const [x, y] = fit.toCanvas(q);
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        });
        ctx.closePath();
        ctx.clip("evenodd");
        line(pts);
        if (kind === "bunker") {
          ctx.strokeStyle = COLORS.bunkerDeep;
          ctx.lineWidth = Math.max(thick * 2, 2.4 * fit.scale);
        } else {
          ctx.strokeStyle = C.cap;
          ctx.lineWidth = thick + Math.max(2, 0.6 * fit.scale);
        }
        ctx.stroke();
        ctx.restore();
      }
      line(pts);
      ctx.strokeStyle = kind === "water" ? ([C.timber, C.brick, C.rock][wall.m ?? 0] ?? C.timber) : wall.m === 1 ? C.timber : C.turf;
      ctx.lineWidth = thick;
      ctx.stroke();
      if (kind === "bunker" && wall.m !== 1 && w >= 200) {
        // A turf wall's grassy top.
        ctx.strokeStyle = C.turfTop;
        ctx.lineWidth = Math.max(1, thick / 3);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawPaths(ctx, layout, fit, w) {
  const paths = (layout.paths ?? []).filter(validPath);
  if (!paths.length) return;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const p of paths) {
    const pts = pathLine(p).pts.map((q) => fit.toCanvas(q));
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    const width = w < 200 ? 1.5 : Math.max(2, ((p.w ?? 2.4) + 0.3) * fit.scale);
    ctx.strokeStyle = COLORS.cartPathEdge;
    ctx.lineWidth = width + 2;
    ctx.stroke();
    ctx.strokeStyle = COLORS.cartPaths[p.m ?? 0] ?? COLORS.cartPaths[0];
    ctx.lineWidth = width;
    ctx.stroke();
  }
  ctx.restore();
}

// A brown links hole's dunes' patches (sim/dunes.mjs), as the 3D paints
// them over its rough - pale sandy blowouts, dark heather and gorse,
// greener hollows - each a soft patch, faint, inside the hole's own ground
// (`within`: its outline; out past it they were a field of dots), under
// the fairway and greens drawn after. (The stony ground round the
// outcrops left out: grey spots on a small map.) Worked out once a hole
// (stored: the hole as kept), with the hole's own lie and the seed the 3D
// uses.
const DUNE_MAP = { alpha: 0.5 };
const dunePatches = new WeakMap();
function drawDunes(ctx, layout, fit, ground, stored, path, within) {
  if (!ground.patches) return;
  let patches = dunePatches.get(stored);
  if (!patches) {
    const seed = (layout.number ?? 1) * 104729 + (layout.yards ?? 0);
    patches = layout.path?.length > 1 ? dunesDressing(layout, (x, z) => surfaceAt(layout, x, z, path), seed).patches : [];
    dunePatches.set(stored, patches);
  }
  ctx.save();
  poly(ctx, within, fit);
  ctx.clip();
  for (const p of patches) {
    const colour = p.kind === "stone" ? null : ground.patches[p.kind];
    if (!colour) continue;
    const [cx, cy] = fit.toCanvas([p.x, p.z]);
    const r = Math.max(1, p.r * fit.scale);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, colour);
    g.addColorStop(0.6, colour);
    g.addColorStop(1, `${colour}00`);
    ctx.globalAlpha = Math.min(1, p.a ?? 0.7) * DUNE_MAP.alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// A generated hole: rough out to the tree line, the fairway down the middle,
// a square tee.
function drawGeneratedGround(ctx, layout, fit, path, ground = COLORS, stored = layout) {
  // Rough: a band out to the tree line.
  const band = (half) => {
    const left = [];
    const right = [];
    for (let d = -12; d <= path.length + 25; d += 4) {
      const at = pointAt(path, Math.max(0, Math.min(path.length, d)));
      const ext = d < 0 ? d : d > path.length ? d - path.length : 0;
      const px = at.p[0] + at.dir[0] * ext;
      const pz = at.p[1] + at.dir[1] * ext;
      const hw = half(d);
      left.push([px + at.dir[1] * hw, pz - at.dir[0] * hw]);
      right.push([px - at.dir[1] * hw, pz + at.dir[0] * hw]);
    }
    return [...left, ...right.reverse()];
  };
  const ownGround = band(() => layout.treeLine);
  ctx.fillStyle = ground.rough;
  poly(ctx, ownGround, fit);
  ctx.fill();

  // Deep rough, from where it starts on each side out to the tree line, as
  // it plays (sim/course.mjs deepRoughFrom: wandering, here and there right
  // past the first cut, here and there none).
  const strip = (side, inner, outer, from, to, step = 3) => {
    const a = [];
    const b = [];
    for (let d = from; d <= to; d += step) {
      const at = pointAt(path, Math.max(0, Math.min(path.length, d)));
      const i = inner(d);
      const o = Math.max(i, outer(d));
      a.push([at.p[0] - at.dir[1] * side * i, at.p[1] + at.dir[0] * side * i]);
      b.push([at.p[0] - at.dir[1] * side * o, at.p[1] + at.dir[0] * side * o]);
    }
    return [...a, ...b.reverse()];
  };
  ctx.fillStyle = ground.deep;
  for (const side of [-1, 1]) {
    poly(ctx, strip(side, (d) => Math.min(layout.treeLine, deepRoughFrom(layout, Math.max(0, Math.min(path.length, d)), side)), () => layout.treeLine, 0, path.length), fit);
    ctx.fill();
  }
  drawDunes(ctx, layout, fit, ground, stored, path, ownGround);

  // The first cut mown round each tee box and round the green, over the
  // rough and under the fairway, as it plays (sim/course.mjs SURROUND).
  ctx.fillStyle = ground.firstCut;
  const t = SURROUND.tee;
  for (const [x0, x1, z0, z1] of teeBoxes(layout.teeSpots)) {
    poly(ctx, [[x0 - t, z0 - t], [x1 + t, z0 - t], [x1 + t, z1 + t], [x0 - t, z1 + t]], fit);
    ctx.fill();
  }
  for (const [x0, x1, z0, z1] of teeBridges(layout.teeSpots)) {
    poly(ctx, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], fit);
    ctx.fill();
  }
  // (Out over the rough mown with it where it nears the fairway's first
  // cut: sim/course.mjs greenMown.)
  const g = layout.green;
  const around = blobOutline(g, 48, FRINGE).map(([x, z]) => {
    const dx = x - g.x;
    const dz = z - g.z;
    const d = Math.hypot(dx, dz) || 1;
    const r = layout.source === "map" ? SURROUND.green : greenMownReach(layout, x, z, dx / d, dz / d, SURROUND.green, 14, path);
    return [x + (dx / d) * r, z + (dz / d) * r];
  });
  poly(ctx, around, fit);
  ctx.fill();

  // Fairway, each edge its own, and the first cut along it - and round
  // each fairway added by hand (holeedits "a+").
  const added = layout.extraFairways ?? [];
  ctx.fillStyle = ground.firstCut;
  for (const a of added) {
    poly(ctx, blobOutline(a, 48, FIRST_CUT), fit);
    ctx.fill();
  }
  const f = layout.fairway;
  if (f.to > f.from) {
    ctx.fillStyle = ground.firstCut;
    for (const side of [-1, 1]) {
      poly(ctx, strip(side, (d) => fairwayHalfWidth(f, d, side), (d) => fairwayHalfWidth(f, d, side) + (fairwayHalfWidth(f, d, side) > 0 ? firstCutWidth(layout, d, side) : 0), f.from, f.to), fit);
      ctx.fill();
    }
  }
  const left = [];
  const right = [];
  for (let d = f.from; d <= f.to; d += 3) {
    const at = pointAt(path, d);
    const hl = fairwayHalfWidth(f, d, -1);
    const hr = fairwayHalfWidth(f, d, 1);
    left.push([at.p[0] + at.dir[1] * hl, at.p[1] - at.dir[0] * hl]);
    right.push([at.p[0] - at.dir[1] * hr, at.p[1] + at.dir[0] * hr]);
  }
  if (left.length > 1) {
    ctx.fillStyle = ground.fairway;
    poly(ctx, [...left, ...right.reverse()], fit);
    ctx.fill();
  }
  ctx.fillStyle = ground.fairway;
  for (const a of added) {
    poly(ctx, blobOutline(a, 48), fit);
    ctx.fill();
  }

  // Tee box, and the white and red behind and in front (sim/tees.mjs).
  ctx.fillStyle = COLORS.tee;
  poly(ctx, [[-6, -7], [6, -7], [6, 7], [-6, 7]], fit);
  ctx.fill();
  otherTees(ctx, layout, fit);
}

// The hole's white and red tee boxes: the square round each spot that
// plays as tee - where no cart path may go.
function otherTees(ctx, layout, fit) {
  const R = TEE_REACH;
  ctx.fillStyle = COLORS.tee;
  for (const [x, z] of otherTeeBoxes(layout)) {
    poly(ctx, [[x - R, z - R], [x + R, z - R], [x + R, z + R], [x - R, z + R]], fit);
    ctx.fill();
  }
}

// A hole rebuilt from a map: its real shapes, over deep rough.
function drawMappedGround(ctx, layout, fit, ground = COLORS, stored = layout) {
  const r = layout.region;
  ctx.fillStyle = ground.deep;
  poly(ctx, [[r.x0, r.z0], [r.x1, r.z0], [r.x1, r.z1], [r.x0, r.z1]], fit);
  ctx.fill();
  drawDunes(ctx, layout, fit, ground, stored, makePath(layout.path), [[r.x0, r.z0], [r.x1, r.z0], [r.x1, r.z1], [r.x0, r.z1]]);
  const fill = (list, color) => {
    ctx.fillStyle = color;
    for (const p of list ?? []) {
      poly(ctx, p, fit);
      ctx.fill();
    }
  };
  fill(layout.woods, COLORS.wood);
  fill(layout.buildings, COLORS.building);
  fill(layout.fairways, ground.fairway);
  fill(layout.tees, COLORS.tee);
  otherTees(ctx, layout, fit);
  fill(layout.greens, COLORS.green);
}
