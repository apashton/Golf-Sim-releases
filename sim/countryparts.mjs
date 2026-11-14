// The country round a hole, worked out: the picture painted over the far
// ground (fields, hedgerows, woods patches, the course's other holes, the
// dunes, the beach, every tree's shade) and the far woods standing in it.
// The dearest part of building a hole - a third of it - and nothing but
// arithmetic on plain data, so it runs on another of the computer's cores
// (buildworker.js, look/offload.js) while the hole's other parts are built,
// or here as it always did where that can't be. Either way the same
// picture: the page turns the pixels into the texture and the list into
// the woods mesh (course.js addCountry).
//
// Everything in comes as plain data - the closures the painting uses (how
// far past play a spot is, the woods floor, the coast) are made again from
// it here - and everything out is plain data too.

import { makeCountry, paintCountry, paintCanopy, farWoods, COUNTRY, playReach, lineDistance, smoothstep, valueNoise } from "./country.mjs";
import { courseNeighbours, ownArea, paintNeighbours, neighbourTrees, neighbourGround, farTree, mappedWoods, courseDeepWoods } from "./neighbours.mjs";
import { holeCrop } from "./holecrop.mjs";
import { treeClearance, treeReach } from "./treeclear.mjs";
import { heldTreeKeys, withoutHeldTrees } from "./cropsurfaces.mjs";
import { deepWoods } from "./deepwoods.mjs";
import { treeForm } from "./treehits.mjs";
import { coastOf, coastHere, paintShore, COAST } from "./coast.mjs";
import { coursePlaces } from "./imaginary.mjs";
import { patchCover } from "./dunes.mjs";
import { paintHay } from "./hay.mjs";

// What a patch of each kind of dune ground is painted with (colours.patch
// has the colour of each), and how strongly: painted into a picture metres
// a pixel, a patch at full strength read from above as a smear (the owner:
// "far too blocky"), so each lies lighter over the grass's own texture.
const PATCH_STRENGTH = { sand: 0.7, heather: 0.5, green: 0.55, stone: 0.65 };

// The dunes' patches (sim/dunes.mjs, in the world: { x, z, r, kind, a })
// laid over the ground's own colour, ragged at their edges.
export function paintPatches(pixels, { box, n, patches, colours }) {
  const cell = box.size / n;
  for (const p of patches) {
    const c = colours[p.kind] ?? colours.sand;
    const reach = p.r * 1.3;
    const c0 = Math.max(0, Math.floor((p.x - reach - box.x0) / cell));
    const c1 = Math.min(n - 1, Math.ceil((p.x + reach - box.x0) / cell));
    const r0 = Math.max(0, Math.floor((p.z - reach - box.z0) / cell));
    const r1 = Math.min(n - 1, Math.ceil((p.z + reach - box.z0) / cell));
    for (let row = r0; row <= r1; row++) {
      const z = box.z0 + (row + 0.5) * cell;
      for (let col = c0; col <= c1; col++) {
        const x = box.x0 + (col + 0.5) * cell;
        const w = patchCover(p, Math.hypot(x - p.x, z - p.z), valueNoise(x, z, 4, 0x5a7d)) * (PATCH_STRENGTH[p.kind] ?? 0.7);
        if (w <= 0) continue;
        const k = (row * n + col) * 4;
        const keep = 1 - w;
        pixels[k] = Math.round(c[0] * 255 * w + pixels[k] * keep);
        pixels[k + 1] = Math.round(c[1] * 255 * w + pixels[k + 1] * keep);
        pixels[k + 2] = Math.round(c[2] * 255 * w + pixels[k + 2] * keep);
        pixels[k + 3] = Math.round(255 * w + pixels[k + 3] * keep);
      }
    }
  }
}

// The country's part of a hole. `a`:
//   L          the hole's layout (its own frame)
//   mapped     a hole from a map (its region's box, its course's woods)
//   seed, character   the hole's country (sim/country.mjs)
//   box        { x0, z0, size } the picture covers (world metres)
//   reach      how far play goes: { line, reach, box, boxReach }
//              (playReach); floor: { line, from } for a designed hole's
//              woods floor past its tree lines, or null
//   trees      [[x, z, r]] the hole's own crowns (their shade)
//   extra      far trees of its own course to stand first (a mapped
//              course's: course.js courseWoods)
//   near       the kinds of the hole's own trees ({ kind: count })
//   backdrop   the hole's backdrop trees, kept clear by its deep woods
//   deepOn     whether a designed hole has woods out from its back rows
//   patches    the dunes' patches, in the world
//   course, index   its course and which hole it is - for the other holes
//              painted round it, a mapped course's woods and the coast -
//              or null (the Challenges)
//   shore      whether it's by the sea (the coast made from the course)
//   colours    the country's colours (look/country.js countryColours:
//              hay, the ground under a parkland hole's hay),
//              holes: the other holes' (courseColours), patch: each dune
//              patch kind's
//   n          the picture's size, pixels a side; lines: hedgerows and
//              tracks drawn; high, extra: High's and its extra far woods
//   shadow     which way, per metre of crown, a tree's shade lies
// Returns { pixels (n x n RGBA), mown (n x n: the other holes' mown
// ground, sim/neighbours.mjs paintNeighbours; or null), n, box, woods: the far woods to draw,
// medium: how many of them Medium draws, neighbours: the other holes (as
// sim/neighbours.mjs courseNeighbours has them) or null }.
export function countryParts(a) {
  const { L, box, n } = a;
  const band = L.bandScale ?? 1;
  const holes = a.course?.holes ?? [];
  // The other holes, seen from the air: painted where they are, their
  // trees among the far woods - none on this hole's own ground.
  const hs = a.high && a.course && holes.length >= 2 ? courseNeighbours(a.course, a.index) : null;
  // The crop's tier 1 trees are drawn in 3D, so their cards are left out
  // of the far woods. The crop itself goes back for those meshes.
  const crop = a.course && holes.length >= 2 ? holeCrop(a.course, a.index, { preset: a.preset || (a.high ? "high" : "standard"), woods: false, shed: !!a.shedNear }) : null;
  let course = null;
  if (hs?.length) {
    const own = ownArea(L, { band });
    const play = ownArea(L, { band, play: true });
    // The crop's 3D trees are left out of the painted cards. The same
    // choice as cropSurfaces, so a card is never dropped with no tree.
    const cardHoles = withoutHeldTrees(hs, a.shedNear ? new Set() : heldTreeKeys(crop, own));
    course = {
      paint: (pixels, { box: b, n: m, mown }) => paintNeighbours(pixels, { box: b, n: m, holes: hs, colours: a.colours.holes, own, play, mown }),
      trees: neighbourTrees(cardHoles, { own }),
      avoid: neighbourGround(hs, { box }),
    };
  }
  // The woods out from a designed hole's back rows, clear of the other
  // holes - every other one below High; a mapped course's past every box.
  let deep = [];
  if (a.deepOn) {
    const others = (hs ?? []).map((h) => ({ path: h.path, open: h.open }));
    const ok = a.course ? treeClearance(a.course, a.index) : () => true;
    // (On a course: grown against every other hole, once - the same woods
    // its neighbours show of it, below High too: neighbours.mjs
    // courseDeepWoods.)
    deep = (a.course ? courseDeepWoods(a.course, a.index, { character: a.character, keepOff: a.backdrop ?? [] }) : deepWoods(L, { character: a.character, others, keepOff: a.backdrop ?? [], stands: null }))
      .filter((t) => ok(t[0], t[1], treeReach(t)))
      .filter((_, k) => a.high || k % 2 === 0)
      .map((t) => farTree(t, treeForm(t)));
  }
  if (a.mapped) {
    if (a.high && a.course && holes.length) {
      const mw = mappedWoods(a.course, a.index);
      deep = mw.trees.map((t, k) => farTree(t, mw.forms[k]));
    } else deep = [];
  }
  // How far past play a spot is, and the woods floor.
  const past = playReach(a.reach);
  const floor = a.floor ? (x, z) => 0.85 * smoothstep(a.floor.from, a.floor.from + 22, lineDistance(a.floor.line, x, z)) : null;
  // By the sea, its coast (as course.js shoreOf has it).
  let shore = null;
  if (a.shore && a.course) {
    const coast = coastOf(a.course);
    const place = coursePlaces(a.course)[Math.min(a.index, holes.length - 1)];
    shore = coast ? coastHere(coast, place) : null;
  }
  // The far woods: as look/country.js countryScene stood them.
  const character = a.character;
  const country = makeCountry({ seed: a.seed, character });
  const count = Math.round(COUNTRY.woodsCount * (a.high ? 1 : 0.5) * (character === "woodland" ? 1.25 : character === "heath" ? 0.7 : 1));
  const room = { x0: box.x0, x1: box.x0 + box.size, z0: box.z0, z1: box.z0 + box.size };
  const ashore = shore ? (x, z) => shore.at(x, z) >= COAST.beach + COAST.dunes + 30 : () => true;
  const own = [...deep, ...(course?.trees ?? [])].filter((t) => ashore(t.x, t.z));
  const extra = (course ? [] : (a.extra ?? [])).filter((t) => ashore(t.x, t.z));
  const avoid = shore || course?.avoid ? (x, z) => !ashore(x, z) || !!course?.avoid?.(x, z) : null;
  const woodsOf = (k) => [...own, ...extra.slice(0, k), ...farWoods({ country, past, box: room, count: Math.max(0, k - extra.length), seed: a.seed, near: a.near ?? {}, avoid })];
  const list = woodsOf(count);
  const shades = list.map((t) => [t.x, t.z, t.w * 0.5]);
  // The picture: the country, the other holes over it, the dunes'
  // patches, the beach, then every tree's shade.
  const colours = { ...a.colours.country };
  // Past a links hole's rough, its long grass rather than a woods floor.
  if (character === "links") colours.floor = colours.fescue;
  if (character === "linksgreen") colours.floor = colours.longGreen;
  const pixels = paintCountry({ box, n, country, past, colours, lines: a.lines, floor });
  // (Where the other holes' mown ground, sand and water are: drawn plain,
  // not as rough - look/glsl/ground.js gCountry.)
  const mown = course ? new Uint8Array(n * n) : null;
  course?.paint(pixels, { box, n, mown });
  // A parkland hole's hay: the ground under it straw (sim/hay.mjs).
  if (!a.mapped && colours.hay) paintHay(pixels, { box, n, L, colour: colours.hay });
  paintPatches(pixels, { box, n, patches: a.patches ?? [], colours: a.colours.patch });
  if (shore) paintShore(pixels, { box, n, at: shore.at, colours, seed: a.seed });
  paintCanopy(pixels, { box, n, trees: [...(a.trees ?? []), ...shades], litter: colours.litter, shadow: a.shadow ?? [0, 0] });
  const woods = a.extraWoods ? woodsOf(Math.round(count * COUNTRY.woodsHigh)) : list;
  return { pixels, mown, n, box, woods, medium: list.length, neighbours: hs, crop };
}
