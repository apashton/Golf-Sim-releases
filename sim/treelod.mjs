// Which trees are drawn in their light far version (look/trees.js): those
// beyond FAR_FROM metres of wherever the camera will be. Decided only at a
// camera cut or at the start of a planned move - at address, at the strike
// for the whole flight (the chase camera's path is known before the ball
// leaves), at the start of a flyover for its whole path - so no tree changes
// while it's watched, and the shadow map is drawn again only then. At
// address it's decided for where the ball is likely to go, so the strike
// changes nothing (sim/preflight.mjs). With HYSTERESIS metres of give, so
// a tree near the line doesn't flip back and forth. Pure: trees are plain
// [x, z] pairs.

export const FAR_FROM = { ultra: 300, high: 300, medium: 220, standard: 150, least: 100 };
export const HYSTERESIS = 20;

// On the phone (the app) every distance a tree's drawn finer to - far,
// close up, the front row's - is PHONE_REACH of the PC's, and the front
// row's number with it: the phone's picture is a thousand-odd pixels
// across (sim/phonepicture.mjs) where the PC's Medium is two thousand and
// more, so a tree on it is as many pixels as on the PC at well under twice
// the distance. Nor are the hole's own trees drawn at their best wherever
// they are (HOLE_TOP), nor every tree on its ground near (NEAR_IN_CROP):
// the distances rule (look/trees.js).
export const PHONE_REACH = 0.6;
export function phoneTable(table, k = PHONE_REACH) {
  return Object.fromEntries(Object.entries(table).map(([key, v]) => [key, typeof v === "number" ? Math.round(v * k) : v]));
}

// Close-up trees (the owner, 9 October 2026: "Maybe we need even better
// versions for less than 50m?"): on High and Ultra, a tree within
// CLOSE_FROM of where the camera stands - at address, on the green - is
// drawn finer: a broadleaf's branches running up into its crown, about two
// and a half times the leaf cards at a smaller size, and its solid crown
// tucked in further, so the branches and the sky show through; every
// other kind its own (15 October: "yes build them all" - look/trees.js
// CONIFER_CLOSE, snagLimbs). On Ultra that
// reach is 120 m (the owner, 15 October 2026: "keep the highest level
// trees to 120m"), the front row's (FRONT_FROM) no further. On High as
// well as Ultra the bark and the leaves pick up the close-up light inside
// that distance. Decided only at a
// cut or as a planned move starts, from where the player stands (the ball
// at address, the same all through its shot, however the camera got
// there) or else the camera's own place - not the shot's fan of flights,
// which passes near nearly every tree - so only the trees really near get
// it, and none changes while it's watched.
export const CLOSE_FROM = { ultra: 120, high: 45 };
export const CLOSE_GIVE = 10;

// The front row (the owner, 13 October 2026: "look again at trees and
// improvements to them on the front row"): the trees lining the hole -
// nearest its line of play, with nothing between them and the fairway -
// are the ones a player looks at down the hole from the tee, mostly well
// past CLOSE_FROM. On High they're drawn close up from further off
// (FRONT_FROM; on Ultra no further than its close-up trees, 120 m), at
// most FRONT_MAX of them at once (the nearest), so the budget holds
// however long the hole.
// (High's 140 m, 110 before: what's saved behind the player - below,
// CLOSE_BEHIND - spent on the row ahead. Counted down three holes every
// 50 m: about as many trees close up as before, a few more from the tee.)
export const FRONT_FROM = { ultra: 120, high: 140 };
export const FRONT_MAX = { ultra: 40, high: 36 };
// The hole in play's own trees (the owner, 15 October 2026: "we need
// highest level trees always around the hole in play. When hitting up the
// fairway the ones along the fairway are poorly drawn and don't load into a
// better version"): on Ultra every one of them is drawn at its best -
// close up, and never far - wherever the camera
// is, so nothing along the hole changes as it's played. About 130,000
// triangles more than by distance on a parkland hole (Nine Oaks 1: 538k
// for its trees against 404k), a tenth of Ultra's picture. The backdrop past
// the green and the other holes' trees keep the distances above; the
// safety valve's close-up steps put the hole's own back to them too
// (look/trees.js).
export const HOLE_TOP = { ultra: true };

// No low trees inside the hole's ground (the owner, 15 October 2026: "The
// lower drawn models of trees should be outside our floor map radius"): on
// High and Ultra every 3D tree there - the hole's own, its backdrop, and
// the neighbouring holes' in its crop (course/holescenery.js), real trees
// now rather than the low version - is drawn near, however far, until the
// safety valve sheds the trees' distance (look/trees.js). Past the crop
// the trees are pictures (the country's, the far woods'). FAR_FROM still
// rules Medium and Standard.
export const NEAR_IN_CROP = { ultra: true, high: true };

// A tree is in the front row when it's no more than `band` metres further
// from the line than the nearest tree on its side of it within `bin`
// metres along.
export const FRONT_ROW = { bin: 25, band: 12 };

// Which of a hole's trees are its front row: trees [[x, z], ...] and the
// hole's line of play path [[x, z], ...], in the hole's frame (any frame
// will do, so long as both are in it). Returns one flag a tree (1 front).
export function frontRow(trees, path, { bin = FRONT_ROW.bin, band = FRONT_ROW.band } = {}) {
  const flags = new Uint8Array(trees.length);
  if (!path?.length || !trees.length) return flags;
  // Each tree's way along the line (s), how far off it (d) and on which side.
  const spots = trees.map(([x, z]) => {
    let best = { d: Infinity, s: 0, side: 1 };
    let run = 0;
    for (let i = 0; i < Math.max(1, path.length - 1); i++) {
      const [ax, az] = path[i];
      const [bx, bz] = path[i + 1] ?? path[i];
      const dx = bx - ax;
      const dz = bz - az;
      const len = Math.hypot(dx, dz);
      const t = len > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (len * len))) : 0;
      const px = ax + dx * t;
      const pz = az + dz * t;
      const d = Math.hypot(x - px, z - pz);
      if (d < best.d) best = { d, s: run + len * t, side: dx * (z - az) - dz * (x - ax) >= 0 ? 1 : -1 };
      run += len;
    }
    return best;
  });
  // The nearest on each side in each stretch, and those within band of it
  // (the stretches either side too, so a row's ends aren't left out).
  const nearest = new Map();
  const key = (side, k) => `${side}:${k}`;
  for (const p of spots) {
    const k = key(p.side, Math.floor(p.s / bin));
    nearest.set(k, Math.min(nearest.get(k) ?? Infinity, p.d));
  }
  spots.forEach((p, i) => {
    const k = Math.floor(p.s / bin);
    let near = Infinity;
    for (const j of [k - 1, k, k + 1]) near = Math.min(near, nearest.get(key(p.side, j)) ?? Infinity);
    if (p.d <= near + band) flags[i] = 1;
  });
  return flags;
}

// Which trees are close-up for a camera at [x, z]: trees [x0, z0, ...],
// close one flag a tree (1 close), changed in place - close inside
// distance less half the give, not close again until past distance and
// half of it. front: the front row's flags (frontRow) or null - those are
// close up out to frontDistance instead, the nearest `max` of them beyond
// distance at most. always: flags of those close up however far
// (HOLE_TOP), or null. Returns the indices of those that changed.
// And only those the player can see from there (the owner, 12 November
// 2026: "the user is only ever coming from 1 direction on a ball flight
// path ... save and improve trees based on fixed standing points and then
// a fairly restricted flight path"): the camera stands behind the ball
// looking down the shot, and the ball flies on that way, so a tree more
// than about CLOSE_BEHIND metres behind where the player stands is never in the
// picture close to. It keeps its usual version - no finer one drawn where
// nobody's looking - and the front row's places (max) go to trees ahead
// instead: more of the hole's lining at its best from the tee for no
// more than before. `ahead`: { dir: [dx, dz] } the way the camera looks,
// level (any length), or null for all round (a camera looking straight
// down). Trees close up however far (always) stay so.
// (CLOSE_BEHIND, less half the give for a tree not yet close up - 14 m: a
// big crown reaches ten metres, and one that far behind could still hang
// over the picture's top.)
export const CLOSE_BEHIND = 19;
export function chooseClose(trees, [x, z], close, { distance = CLOSE_FROM.high, give = CLOSE_GIVE, front = null, frontDistance = 0, max = Infinity, always = null, ahead = null, behind = CLOSE_BEHIND } = {}) {
  const len = ahead?.dir ? Math.hypot(ahead.dir[0], ahead.dir[1]) : 0;
  const [ax, az] = len > 1e-6 ? [ahead.dir[0] / len, ahead.dir[1] / len] : [0, 0];
  const changed = [];
  const n = trees.length / 2;
  const want = new Uint8Array(n);
  const extra = [];
  for (let i = 0; i < n; i++) {
    // (always: the hole in play's own trees, close up wherever they are -
    // HOLE_TOP - and not counted against the front row's max.)
    if (always?.[i]) {
      want[i] = 1;
      continue;
    }
    const d = Math.hypot(trees[i * 2] - x, trees[i * 2 + 1] - z);
    const was = close[i] === 1;
    // (Behind the player: with the same give, so one on the line doesn't
    // flip as the aim's turned.)
    if (len > 1e-6) {
      const along = (trees[i * 2] - x) * ax + (trees[i * 2 + 1] - z) * az;
      if (was ? along < -behind - give / 2 : along < -behind + give / 2) continue;
    }
    const reach = front?.[i] ? Math.max(distance, frontDistance) : distance;
    const now = reach > 0 && (was ? d <= reach + give / 2 : d < reach - give / 2);
    if (!now) continue;
    want[i] = 1;
    // (Those only close for being in the front row: counted, nearest first.)
    if (reach > distance && !(was ? d <= distance + give / 2 : d < distance - give / 2)) extra.push([d, i]);
  }
  if (extra.length > max) {
    extra.sort((a, b) => a[0] - b[0]);
    for (const [, i] of extra.slice(Math.max(0, max))) want[i] = 0;
  }
  for (let i = 0; i < n; i++) {
    if ((close[i] === 1) !== (want[i] === 1)) {
      close[i] = want[i];
      changed.push(i);
    }
  }
  return changed;
}

// Whether a tree's part is drawn: its far version when it's far; else its
// near parts - and when it's close-up (and has close-up parts), its
// branches and finer leaf cards (roles "limbs", "cardsClose") in place of
// its usual cards. (Its solid crown is the same near or close - but a
// tree wearing boughs, sim/offshoots.mjs, has a smaller one close up, its
// "core", in place of its usual one: that part `nearOnly`.) A tree buried
// in a wood (buriedTrees) has two of its near parts: `plain`, its usual
// crown and cards, while it wears no boughs further off (`boughs` false);
// `worn`, its heart, its boughs and their cards while it does - its
// heart's crown and a dead tree's bare boughs close up too.
export function partShown(role, { far = false, close = false, boughs = true } = {}, { nearOnly = false, plain = false, worn = false } = {}) {
  if (role === "far") return far;
  if (far) return false;
  if (role === "limbs" || role === "cardsClose" || role === "core") return close;
  if (plain) return !close && !boughs;
  if (worn) return role === "cards" ? !close && boughs : close || boughs;
  if (role === "cards" || nearOnly) return !close;
  return true;
}

// Trees buried in a wood (the owner, 28 October 2026, to drawing only the
// trees whose outline can be seen with their own boughs further off - "Trees
// buried inside a wood, hidden behind the front row, keep their plain shape
// further off" - "2 is good. We never walk anywhere. If the shot is
// calculated to go near the lower drawn versions it can load the higher one
// before the ball even arrives?"): on High (`on`), seen from the hole's line
// of play (`facing`), a tree behind the front row (frontRow) with another
// nearly as tall (`cover` of its height) in front of it - within `reach` of
// its crown's radius (at least `least` metres), in a cone `spread` degrees
// either side of the way to the line (on each of `toward` sides of it) -
// hidden by the trees in front of it, its top no higher than theirs; or,
// with no line to be seen from, one with such trees on every one of
// `sides` sides round it. (About half the trees of a parkland course: its
// trees stand in lines and clumps a few deep, a quarter of them in the
// front row.) Its outline can't be seen, so further off it's drawn in its shape
// (its plain crown and cards), not wearing its boughs - unless the
// camera's going near it: the shot's likely flights at address
// (sim/preflight.mjs), the flight once struck, a flyover's path - within
// `near` metres (chooseBoughs), decided as those are, before the ball's
// even on its way. The trees lining a hole, standing alone, at a wood's
// edge or above its top wear them as ever; Ultra's every tree too.
export const BURIED = { on: { high: true }, sides: 6, toward: 1, spread: 60, reach: 3, least: 14, cover: 0.8, near: 40, give: 10 };

// trees: [x0, z0, height0, radius0, x1, ...] (metres: the foot of its trunk,
// how tall, how far its crown reaches); facing: the line it's seen from,
// [[x, z], ...] in the same frame, or null. One flag a tree (1 buried).
export function buriedTrees(trees, { facing = null, sides = BURIED.sides, toward = BURIED.toward, spread = BURIED.spread, reach = BURIED.reach, least = BURIED.least, cover = BURIED.cover } = {}) {
  const n = trees.length / 4;
  const out = new Uint8Array(n);
  let far = least;
  for (let i = 0; i < n; i++) far = Math.max(far, trees[i * 4 + 3] * reach);
  const cell = far;
  const grid = new Map();
  const key = (a, b) => a * 73856093 + b * 19349663;
  for (let i = 0; i < n; i++) {
    const k = key(Math.floor(trees[i * 4] / cell), Math.floor(trees[i * 4 + 1] / cell));
    if (grid.has(k)) grid.get(k).push(i);
    else grid.set(k, [i]);
  }
  const line = facing?.length ? facing : null;
  const cone = (spread * Math.PI) / 180;
  const count = line ? toward : sides;
  // (Its front row: seen, whatever's behind it.)
  const front = line ? frontRow(Array.from({ length: n }, (_, i) => [trees[i * 4], trees[i * 4 + 1]]), line) : null;
  for (let i = 0; i < n; i++) {
    if (front?.[i]) continue;
    const [x, z, h, r] = [trees[i * 4], trees[i * 4 + 1], trees[i * 4 + 2], trees[i * 4 + 3]];
    const within = Math.max(least, r * reach);
    // (Seen from the line: the way to its nearest point.)
    const at = line ? nearestOn(x, z, line) : null;
    const facingAngle = at ? Math.atan2(at[1] - z, at[0] - x) : 0;
    if (at && Math.hypot(at[0] - x, at[1] - z) < 1e-6) continue;
    const hidden = new Uint8Array(count);
    let got = 0;
    const a0 = Math.floor(x / cell);
    const b0 = Math.floor(z / cell);
    for (let a = a0 - 1; a <= a0 + 1 && got < count; a++) {
      for (let b = b0 - 1; b <= b0 + 1 && got < count; b++) {
        for (const j of grid.get(key(a, b)) ?? []) {
          if (j === i || trees[j * 4 + 2] < h * cover) continue;
          const dx = trees[j * 4] - x;
          const dz = trees[j * 4 + 1] - z;
          const d = Math.hypot(dx, dz);
          if (d > within || d === 0) continue;
          let side;
          if (line) {
            const off = Math.atan2(Math.sin(Math.atan2(dz, dx) - facingAngle), Math.cos(Math.atan2(dz, dx) - facingAngle));
            if (Math.abs(off) > cone) continue;
            side = Math.min(count - 1, Math.floor(((off + cone) / (2 * cone)) * count));
          } else side = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2)) * sides) % sides;
          if (!hidden[side]) {
            hidden[side] = 1;
            got++;
          }
        }
      }
    }
    if (got === count) out[i] = 1;
  }
  return out;
}

// The nearest point to (x, z) on a line of points [[x, z], ...].
function nearestOn(x, z, path) {
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < path.length; i++) {
    const [ax, az] = path[i];
    const [bx, bz] = path[i + 1] ?? path[i];
    const dx = bx - ax;
    const dz = bz - az;
    const len = dx * dx + dz * dz;
    const t = len > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len)) : 0;
    const px = ax + dx * t;
    const pz = az + dz * t;
    const d = (x - px) ** 2 + (z - pz) ** 2;
    if (d < bestD) [best, bestD] = [[px, pz], d];
  }
  return best;
}

// Which buried trees wear their boughs further off: those within `near`
// metres of any of the paths the camera will be on (pathsFor: the camera,
// the shot's plan), changed in place - on inside near less half the give,
// off again only past near and half of it. trees: [x0, z0, ...]; buried,
// boughs: one flag a tree. Returns the indices that changed.
export function chooseBoughs(trees, paths, buried, boughs, { near = BURIED.near, give = BURIED.give } = {}) {
  const changed = [];
  paths = (paths ?? []).filter((p) => p?.length);
  const n = trees.length / 2;
  for (let i = 0; i < n; i++) {
    if (!buried[i]) continue;
    let d = Infinity;
    for (const path of paths) d = Math.min(d, distanceToPath(trees[i * 2], trees[i * 2 + 1], path));
    const was = boughs[i] === 1;
    const now = was ? d <= near + give / 2 : d < near - give / 2;
    if (now !== was) {
      boughs[i] = now ? 1 : 0;
      changed.push(i);
    }
  }
  return changed;
}

// Metres from (x, z) to the nearest point of a path: [[x, z], ...] - one
// point (a camera), or a line of them (a flight), taken as straight
// between.
export function distanceToPath(x, z, path) {
  let best = Infinity;
  for (let i = 0; i < path.length; i++) {
    const [ax, az] = path[i];
    const b = path[i + 1];
    let d;
    if (!b) d = (x - ax) ** 2 + (z - az) ** 2;
    else {
      const [bx, bz] = b;
      const dx = bx - ax;
      const dz = bz - az;
      const len = dx * dx + dz * dz;
      const t = len > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len)) : 0;
      d = (x - ax - dx * t) ** 2 + (z - az - dz * t) ** 2;
    }
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

// Near or far for every tree. trees: [x0, z0, x1, z1, ...]; paths: the
// paths the camera will be on (pathsFor); far: one flag a tree (1 far),
// changed in place. A tree goes far only past distance + half
// the hysteresis from every point of the path, and comes near again inside
// distance - half of it; in between it stays as it is. never: flags of
// trees never far (HOLE_TOP), or null. Returns the indices of the trees
// that changed.
export function chooseFar(trees, paths, far, { distance = FAR_FROM.medium, hysteresis = HYSTERESIS, never = null } = {}) {
  const changed = [];
  paths = (paths ?? []).filter((p) => p?.length);
  if (!paths.length) return changed;
  const out = distance + hysteresis / 2;
  const back = distance - hysteresis / 2;
  const n = trees.length / 2;
  for (let i = 0; i < n; i++) {
    const was = far[i] === 1;
    // (never: the hole in play's own trees on Ultra - HOLE_TOP.)
    let now = false;
    if (!never?.[i]) {
      let d = Infinity;
      for (const path of paths) d = Math.min(d, distanceToPath(trees[i * 2], trees[i * 2 + 1], path));
      now = was ? d >= back : d > out;
    }
    if (now !== was) {
      far[i] = now ? 1 : 0;
      changed.push(i);
    }
  }
  return changed;
}

// Whether a far tree is nearer the camera (x, z) than it should ever be
// seen - a camera that has wandered off its plan: then it's decided again
// at once, rather than a far tree being looked at close to.
export function farTooClose(trees, far, x, z, { distance = FAR_FROM.medium, hysteresis = HYSTERESIS } = {}) {
  const r = distance - hysteresis;
  const r2 = r * r;
  const n = trees.length / 2;
  for (let i = 0; i < n; i++) {
    if (far[i] !== 1) continue;
    const dx = trees[i * 2] - x;
    const dz = trees[i * 2 + 1] - z;
    if (dx * dx + dz * dz < r2) return true;
  }
  return false;
}

// When to decide: at a cut, when a planned move starts (a new plan), or
// when a far tree has come too close. Never otherwise.
export function shouldDecide({ cut = false, newPlan = false, tooClose = false } = {}) {
  return cut || newPlan || tooClose;
}

// Where the camera will be: the camera now ([x, z]), and the plan when
// there is one - a path (world [x, z] points), or several (a list of them:
// a shot's fan at address with its flight, sim/preflight.mjs).
export function pathsFor(camera, plan) {
  if (!plan?.length) return [[camera]];
  return Array.isArray(plan[0]?.[0]) ? [[camera], ...plan] : [[camera], plan];
}

// Ultra's and High's closest trees, finer still (look/trees.js): their bark in relief
// - its furrows sunk in as the view moves, darker in the cracks - and their
// leaves letting more of the sun through, lit through the crown's shaded
// side, with a waxy glint and each leaf its own shade. Fading in from
// `fade` metres to all of it by `full` (bark, leaves), well inside the
// close-up trees' CLOSE_FROM, so only the nearest few pay for it. The
// leaves' out to the close-up trees lining a hole, 45 m off (the owner, 15
// October 2026, of an oak drawn 24 m off beside the same oak 45 m off:
// "This oak looks better than the one on the last photo?" - within 15 - 36 m
// it had it, at 45 m its crown was one flat, dark green).
// The light through the leaves and behind them (through, behind - of the
// leaf's colour, by the sun's light left after its shadow; glint the waxy
// shine's) a fraction of what it was: added as a glow before the lights, it
// counted about three times over and lit shaded leaves too, and the
// closest crowns shone pale and haloed (the owner, 16 October 2026: "Trees
// are bleeding light and flickering", then "any bleeding light on trees
// needs to be subtle not strong" - look/trees.js TRANSLUCENT).
export const CLOSE_LOOK = {
  bark: { full: 14, fade: 28, depth: 0.05, cracks: 0.55, lean: 1.3 },
  leaves: { full: 45, fade: 72, through: 0.08, behind: 0.05, glint: 0.04, shade: 0.4 },
};
