// What stands on the ground round a hole that the cart between holes can't
// drive through (course/buggy.js, sim/cartway.mjs): the signs (the tee sign,
// yardage posts, the arrow on to the next tee - right where the cart path
// ends past the green - aiming posts and tee markers), the windsock, the
// club's furniture (ball washer, bin, divot box, bench, the rakes by the
// bunkers) and the solid dressing in the rough (gorse, rocks, boulders,
// stumps and logs) - this hole's, and the next tee's as it's drawn on
// arrival (sim/nexttee.mjs nextTeeView). The owner, 9 November 2026: "the
// odd signpost or object that the golf buggy drives through". Each is
// [x, z, r, kind]: a circle it keeps clear of (CART_BERTH.thing, from the
// cart's middle to its edge) and what it is, in the frame its places are
// given in.
//
// Pure, for the tests.

import { FURNITURE_SIZE } from "./furniture.mjs";

// How far each reaches from where it stands (metres): roughly half its
// widest, a little over for the signs' boards and feet.
export const THING_REACH = Object.freeze({ teeSign: 0.9, post: 0.25, arrow: 0.7, aim: 0.25, marker: 0.2, sock: 0.3 });

// A dressing piece's reach by its size s (look/dressing.js draws gorse a
// dome of about s across its lumps, rocks a lump about 0.8 - 1.3 s across,
// a stump s, a fallen log about twice that along it).
const DRESS_REACH = Object.freeze({ gorse: 0.95, rocks: 0.75, boulders: 0.75, stump: 0.5, log: 1.2 });

const at = (p, r, kind) => (Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]) ? [p[0], p[1], r, kind] : null);

// The signs' (sim/signs.mjs signsFor) - the plates set in the fairway are
// flat, driven over - and the windsock's (sim/windsock.mjs windsockSpot).
export function signThings(signs, sock = null) {
  const out = [];
  if (!signs) return out;
  out.push(at(signs.tee?.at, THING_REACH.teeSign, "tee sign"));
  for (const p of signs.posts ?? []) out.push(at(p.at, THING_REACH.post, "yardage post"));
  out.push(at(signs.arrow?.at, THING_REACH.arrow, "next tee arrow"));
  for (const p of signs.aim ?? []) out.push(at(p.at, THING_REACH.aim, "aiming post"));
  for (const m of signs.markers ?? []) out.push(at(m, THING_REACH.marker, "tee marker"));
  for (const t of signs.otherTees ?? []) for (const m of t.markers ?? []) out.push(at(m, THING_REACH.marker, "tee marker"));
  out.push(at(sock, THING_REACH.sock, "windsock"));
  return out.filter(Boolean);
}

// The club's furniture (sim/furniture.mjs holeFurniture / teeFurniture):
// half its size across.
export function furnitureThings(furniture) {
  const out = [];
  for (const f of furniture?.tee ?? []) out.push(at(f.at, (FURNITURE_SIZE[f.kind] ?? 1) / 2, f.kind));
  for (const r of furniture?.rakes ?? []) out.push(at(r.at, FURNITURE_SIZE.rake / 2, "rake"));
  return out.filter(Boolean);
}

// The rough's solid dressing (sim/dressing.mjs, and what's added to it:
// decor, waste areas, dunes): heather, flowers, fescue and the rest are
// low and driven through, as through long grass.
export function dressingThings(dressing) {
  const out = [];
  if (!dressing) return out;
  for (const kind of ["gorse", "rocks", "boulders"]) for (const [x, z, s = 1] of dressing[kind] ?? []) out.push(at([x, z], DRESS_REACH[kind] * s, kind));
  for (const [x, z, s = 1, , log] of dressing.stumps ?? []) out.push(at([x, z], (log ? DRESS_REACH.log : DRESS_REACH.stump) * s, log ? "log" : "stump"));
  return out.filter(Boolean);
}

// Things given in a hole's frame into another (to: [x, z] -> [x, z]), their
// reach and what they are kept.
export const movedThings = (things, to) =>
  things.map(([x, z, ...rest]) => {
    const [a, b] = to([x, z]);
    return [a, b, ...rest];
  });
