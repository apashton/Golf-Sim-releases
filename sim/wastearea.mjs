// Waste areas (the owner, 5 November 2026, from the graphics list: "waste
// areas"): big stretches of sandy, scrubby ground beside the fairway - a
// heathland hole's (sim/course.mjs wasteAreas: Pine Valley's, Walton
// Heath's) and now a links hole's out in its rough (linksWaste: the blown-
// out sandy ground of the dunes). A waste area is kept with the hole's
// bunkers (`waste: 1`), drawn from the same outline, but it isn't one:
//   played     as its own lie, "waste" (sim/course.mjs surfaceAt; Waste
//              area to the player): firm sand the ball sits up on, the
//              club grounded, none of a bunker's rules - picked off it a
//              touch shorter and with less spin than off the fairway (sim/
//              lie.mjs), a ball landing kicking up off it lower than off
//              grass and running on a little (sim/flight.mjs SURFACES.waste,
//              sim/course.mjs LIES); a bunker lying in one is a bunker
//   drawn      at grade with no collar of grass, as sandy ground rather
//              than a bunker's sand - browner drifts, bigger stones,
//              heather and wiry grass growing through it (look/
//              sandwater.js) - and dressed with sparse clumps of heather,
//              the odd gorse bush, stones and, on High, tufts of fescue
//              (wasteDressing, drawn with the rough's: look/dressing.js)
//
// Hole frame (sim/course.mjs), metres. Pure.

import { seeded, pointAt, insideBlob, blobOutline } from "./course.mjs";
import { YARD } from "./flight.mjs";

// A links hole's waste area: its chance, its size (half its length along
// the hole and half its width, metres), where along the hole (yards) and
// how far its inner edge lies off the fairway's (metres).
export const LINKS_WASTE = { chance: 0.35, size: [[16, 28], [6, 10]], at: [140, 240], off: [4, 8] };

// A links hole's waste area, now and then (LINKS_WASTE), from a randomness
// of its own: in the rough beside the fairway, where the long hitters'
// drives finish - clear of the green, the tee, water and every bunker.
// Laid into hole.bunkers; returns it, or null.
export function linksWaste(hole, spec, { path, halfWidthBase, greenShape }) {
  const W = LINKS_WASTE;
  const rand = seeded(((spec.seed ?? 1) ^ 0x7a57e) >>> 0 || 1);
  const L = hole.length;
  if (spec.par < 4 || rand() > W.chance) return null;
  const s = Math.min(L - 80, (W.at[0] + rand() * (W.at[1] - W.at[0])) * YARD);
  const at = pointAt(path, s);
  const sign = rand() < 0.5 ? -1 : 1;
  const rx = W.size[0][0] + rand() * (W.size[0][1] - W.size[0][0]);
  const rz = W.size[1][0] + rand() * (W.size[1][1] - W.size[1][0]);
  const off = halfWidthBase + W.off[0] + rand() * (W.off[1] - W.off[0]) + rz;
  // (Kept inside the hole's long grass's edge, where the rough is.)
  if (Number.isFinite(hole.treeLine) && off + rz > hole.treeLine + 12) return null;
  const x = at.p[0] - at.dir[1] * sign * off;
  const z = at.p[1] + at.dir[0] * sign * off;
  const area = {
    x: r2(x),
    z: r2(z),
    rot: r2(Math.atan2(at.dir[1], at.dir[0]) + (rand() - 0.5) * 0.3),
    rx: r2(rx),
    rz: r2(rz),
    lobes: 4,
    phase: r2(rand() * 6.28),
    depth: 0.16,
    fingers: r2(0.14 + rand() * 0.06),
    fk: 7 + Math.floor(rand() * 3),
    fphase: r2(rand() * 6.28),
    waste: 1,
  };
  const edge = blobOutline(area, 64);
  const clear = edge.every(([ex, ez]) => !insideBlob(greenShape, ex, ez, 8) && Math.hypot(ex, ez) > 30 && !(hole.water ?? []).some((w) => insideBlob(w, ex, ez, 3)) && !(hole.bunkers ?? []).some((b) => insideBlob(b, ex, ez, 2)));
  if (!clear) return null;
  hole.bunkers.push(area);
  return area;
}

// What a waste area's dressed with (look/dressing.js draws it with the
// rough's): heather in loose patches and alone, a gorse bush or two,
// stones, and tufts of fescue (on High) - each `per` square metres of it
// one, at most `most` on a hole - none within `edge` metres of its edge.
export const WASTE_DRESS = {
  heather: { patchPer: 70, clump: 0.8, single: 45, most: 420 },
  gorse: { per: 500, most: 6 },
  rocks: { per: 55, most: 40 },
  fescue: { per: 20, most: 320 },
  edge: 0.4,
};

// A hole's waste areas' dressing: { heather, gorse, rocks, fescue } as
// sim/dressing.mjs has them ([x, z, size, turn], rocks with their shape),
// on what plays as a waste area (lieAt) of this hole's own (L.bunkers),
// from a randomness of its own (seed).
export function wasteDressing(L, lieAt, seed = 1) {
  const out = { heather: [], gorse: [], rocks: [], fescue: [] };
  const areas = (L.bunkers ?? []).filter((b) => b.waste);
  if (!areas.length) return out;
  const rand = seeded((seed ^ 0x3a57d) >>> 0 || 1);
  const D = WASTE_DRESS;
  for (const a of areas) {
    const edge = a.poly ?? blobOutline(a, 96);
    let x0 = Infinity;
    let x1 = -Infinity;
    let z0 = Infinity;
    let z1 = -Infinity;
    for (const [x, z] of edge) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      z0 = Math.min(z0, z);
      z1 = Math.max(z1, z);
    }
    // Its own ground, not its edge (nor a bunker in it, nor a path).
    const inside = (x, z) => lieAt(x, z) === "waste" && insideBlob(a, x, z, -D.edge);
    const spot = () => [x0 + rand() * (x1 - x0), z0 + rand() * (z1 - z0)];
    const area = Math.PI * (a.rx ?? (x1 - x0) / 2) * (a.rz ?? (z1 - z0) / 2);
    // Heather: loose patches of clumps, and clumps on their own.
    const patches = Math.round(area / D.heather.patchPer);
    for (let p = 0, tries = 0; p < patches && tries < patches * 8; tries++) {
      const [cx, cz] = spot();
      if (!inside(cx, cz)) continue;
      p++;
      const r = 1 + rand() * 1.8;
      for (let gx = -r; gx <= r; gx += D.heather.clump) {
        for (let gz = -r; gz <= r; gz += D.heather.clump) {
          const d = Math.hypot(gx, gz) / r;
          if (d > 1 || rand() > 0.85 - 0.5 * d || out.heather.length >= D.heather.most) continue;
          const px = cx + gx + (rand() - 0.5) * 0.5;
          const pz = cz + gz + (rand() - 0.5) * 0.5;
          if (inside(px, pz)) out.heather.push([r2(px), r2(pz), r2(0.3 + rand() * 0.3), r2(rand() * Math.PI * 2)]);
        }
      }
    }
    const scatter = (list, n, most, make) => {
      for (let i = 0, tries = 0; i < n && tries < n * 6 && list.length < most; tries++) {
        const [px, pz] = spot();
        if (!inside(px, pz)) continue;
        i++;
        list.push(make(px, pz));
      }
    };
    scatter(out.heather, Math.round(area / D.heather.single), D.heather.most, (px, pz) => [r2(px), r2(pz), r2(0.25 + rand() * 0.3), r2(rand() * Math.PI * 2)]);
    scatter(out.gorse, Math.max(rand() < 0.6 ? 1 : 0, Math.round(area / D.gorse.per)), D.gorse.most, (px, pz) => [r2(px), r2(pz), r2(0.55 + rand() * 0.5), r2(rand() * Math.PI * 2)]);
    // Stones: small, a few a little bigger, in the hole's own stone.
    scatter(out.rocks, Math.round(area / D.rocks.per), D.rocks.most, (px, pz) => [r2(px), r2(pz), r2(0.08 + rand() * rand() * 0.25), r2(rand() * Math.PI * 2), Math.floor(rand() * 5)]);
    scatter(out.fescue, Math.round(area / D.fescue.per), D.fescue.most, (px, pz) => [r2(px), r2(pz), r2(0.45 + rand() * 0.4), r2(rand() * Math.PI)]);
  }
  return out;
}

// The rough's dressing (sim/dressing.mjs roughDressing) with a hole's
// waste areas' added to it.
export function withWasteDressing(dressing, waste) {
  if (!waste || !dressing) return dressing;
  const out = { ...dressing };
  for (const k of ["heather", "gorse", "rocks", "fescue"]) if (waste[k]?.length) out[k] = [...(dressing[k] ?? []), ...waste[k]];
  return out;
}

function r2(v) {
  return Math.round(v * 100) / 100;
}
