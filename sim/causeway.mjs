// A way to land for an island green (the owner, 21 October 2026: "For
// island greens we need a way to connect to land if not done naturally. So
// to build fairway connected green that follows the same rules as a green
// and can't be removed."). Water reaching onto a green gives way to it and
// its fringe (sim/greenfirst.mjs) - so a pond can lie all round a green.
// Where that leaves a green with water on every side, a causeway of
// fairway runs from the green to dry land: CAUSEWAY.width metres wide, onto
// a fairway if one's within CAUSEWAY.toFairway metres more water of the
// shortest way across (the owner, 22 October 2026: "a fairway at the back
// that the causeway runs onto... So the full front is water") - on over
// the land to it if it's within CAUSEWAY.overLand of the water - else the
// shortest way across - and of ways about as short (CAUSEWAY.near), the
// one furthest from facing the tee, so the water's in front of the green.
//
// Its shape is the designer's to set (layout.causeway, holeedits "cw"; the
// owner, 22 October 2026: "shaping the fairway is important to get the look
// right, can we shape the causeway and make it bigger"): how wide it is,
// its ends flared out wider where they meet the green and the land, and a
// spot it's aimed at - it runs the way out from the green nearest that,
// and on over the land up to it.
//
// It's worked out from the hole whenever it's asked for, never kept with
// it - so it can't be taken away, moved or planted over, and it goes by
// itself once the green meets land again - and it's kept to as the green
// is: the water gives way to it (play has it as fairway: course.mjs
// surfaceAt, lieRaster), the ground under it isn't dug, the water and its
// muddy shore are drawn cut round it, and no penalty stake or line stands
// on it (greenfirst.mjs greenZone). Nor does any tree, bush or decor -
// made, real or put there by hand (clearOfCauseways): the hole editor won't
// plant one there, and one that was there before the green became an
// island is taken away while it is one (courseplay.mjs grownTrees,
// holeedits/apply.mjs).
import { FRINGE, insideBlob, reachesGreen, makePath, nearest, fairwayHalfWidth } from "./course.mjs";
import { polygonCentroid, insideOutline } from "./terrain.mjs";
import { smoothstep01 } from "./mathutil.mjs";

// width: metres across; onto: how far it runs on over the land it reaches;
// land: how much dry ground in a row counts as land (not a sliver between
// two ponds); most: the furthest it looks for land; directions: how many
// ways round the green it looks; near: of the ways within this many metres
// of the shortest, the one furthest from the tee; toFairway: how much
// further across the water it goes to land on a fairway; overLand: how far
// over the land beyond it carries on to reach one; clear: how far
// off its edge a tree or decor keeps (a crown's reach over it, as off
// another hole's fairway: treeclear.mjs CLEAR.fairway). widths: how wide
// the designer can make it, metres; ends: how much wider its ends can
// flare; aimOn: how far over the land it runs on to the spot it's aimed at.
export const CAUSEWAY = { width: 5, onto: 1.5, land: 3, most: 400, directions: 144, near: 2, toFairway: 40, overLand: 20, clear: 2, widths: [4, 30], ends: [1, 3], aimOn: 60 };

// The designer's shape for a hole's causeway (layout.causeway): { w, e, to }
// - its width, how much its ends flare, the spot it's aimed at (or null).
export function causewayLook(L) {
  const c = L?.causeway;
  const w = Number.isFinite(c?.w) ? Math.min(CAUSEWAY.widths[1], Math.max(CAUSEWAY.widths[0], c.w)) : CAUSEWAY.width;
  const e = Number.isFinite(c?.e) ? Math.min(CAUSEWAY.ends[1], Math.max(CAUSEWAY.ends[0], c.e)) : 1;
  const to = Array.isArray(c?.to) && c.to.length === 2 && c.to.every(Number.isFinite) ? c.to : null;
  return { w, e, to };
}
const STEP = 0.5;

// A hole's greens as shapes: its green, and on a hole from a map any others.
const greensOf = (L) => (L?.green ? [L.green, ...(L.greens ?? []).map((poly) => ({ poly }))] : []);

// Is (x, z) fairway on hole L, as play has it (not counting a causeway):
// a map's fairway outlines; a designed hole's fairway along its line, or
// one added by hand.
function fairwayTest(L) {
  if (L.source === "map") return (x, z) => (L.fairways ?? []).some((f) => insideOutline(f, x, z));
  const path = L.path?.length >= 2 ? makePath(L.path) : null;
  return (x, z) => {
    if ((L.extraFairways ?? []).some((f) => insideBlob(f, x, z))) return true;
    if (!path || !L.fairway) return false;
    const n = nearest(path, x, z);
    return Math.abs(n.d) <= fairwayHalfWidth(L.fairway, n.s, n.d < 0 ? -1 : 1);
  };
}

// The causeway from one green, or null: the green meets dry land as it is
// (any way out of it reaches land without crossing water), or no way
// finds land, or every way crosses water that doesn't reach onto the
// green (which wouldn't give way to it).
function wayFrom(L, g) {
  const crossing = L.water.filter((w) => reachesGreen(L, w));
  if (!crossing.length) return null;
  const [cx, cz] = g.poly ? polygonCentroid(g.poly) : [g.x, g.z];
  const wet = (x, z) => crossing.some((w) => insideBlob(w, x, z));
  const blocked = (x, z) => L.water.some((w) => !crossing.includes(w) && insideBlob(w, x, z));
  // Towards the tee (the hole's start, its frame's origin).
  const back = Math.atan2(-cz, -cx);
  const fairwayAt = fairwayTest(L);
  const look = causewayLook(L);
  const aim = look.to ? Math.atan2(look.to[1] - cz, look.to[0] - cx) : null;
  const ways = [];
  let shortest = Infinity;
  // (One onto a fairway may cross further; one aimed by the designer, as
  // far as it has to.)
  const reach = aim != null ? Infinity : Math.max(CAUSEWAY.near, CAUSEWAY.toFairway);
  for (let i = 0; i < CAUSEWAY.directions; i++) {
    const a = (i / CAUSEWAY.directions) * Math.PI * 2;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    const at = (t) => [cx + dx * t, cz + dz * t];
    // Out to the green's edge, then on past its fringe (which the water
    // gives way to anyway).
    let edge = 0;
    while (edge < CAUSEWAY.most && insideBlob(g, ...at(edge))) edge += STEP / 2;
    let t = edge;
    while (t < edge + CAUSEWAY.most && insideBlob(g, ...at(t), FRINGE)) t += STEP;
    // Then over the water to land: dry ground CAUSEWAY.land metres in a
    // row.
    let crossed = 0;
    let dryFrom = null;
    let ok = true;
    for (; t < edge + CAUSEWAY.most; t += STEP) {
      const [x, z] = at(t);
      if (blocked(x, z)) {
        ok = false;
        break;
      }
      if (wet(x, z)) {
        crossed += STEP;
        dryFrom = null;
        // (Too much further than one already found: no need to go on.)
        if (crossed > shortest + reach) {
          ok = false;
          break;
        }
        continue;
      }
      dryFrom ??= t;
      if (t - dryFrom >= CAUSEWAY.land) break;
    }
    if (!ok || dryFrom == null || t - dryFrom < CAUSEWAY.land) continue;
    // Land without crossing any water: the green isn't cut off.
    if (!crossed) return null;
    shortest = Math.min(shortest, crossed);
    // Short of a fairway: on over the land to it, if it's near.
    let end = dryFrom + CAUSEWAY.onto;
    let fairway = fairwayAt(...at(dryFrom + CAUSEWAY.land));
    for (let u = dryFrom; !fairway && u <= dryFrom + CAUSEWAY.overLand; u += STEP) {
      const [x, z] = at(u);
      if (wet(x, z) || blocked(x, z)) break;
      if (fairwayAt(x, z)) {
        fairway = true;
        end = Math.max(end, u + CAUSEWAY.onto);
      }
    }
    const off = (from) => Math.abs(Math.atan2(Math.sin(a - from), Math.cos(a - from)));
    ways.push({ crossed, a: at(edge), b: at(end), turn: off(back), fairway, aimed: aim != null ? off(aim) : 0, at, end });
  }
  // Aimed by the designer: the way nearest that, on over the land up to
  // the spot (dry all the way, and not too far).
  if (aim != null && ways.length) {
    const w = ways.reduce((p, q) => (q.aimed < p.aimed - 1e-9 || (Math.abs(q.aimed - p.aimed) < 1e-9 && q.crossed < p.crossed) ? q : p));
    const [ox, oz] = w.at(0);
    const [ux, uz] = w.at(1);
    const want = (look.to[0] - ox) * (ux - ox) + (look.to[1] - oz) * (uz - oz);
    let end = w.end;
    for (let t = w.end + STEP; t <= Math.min(want, w.end + CAUSEWAY.aimOn); t += STEP) {
      const [x, z] = w.at(t);
      if (wet(x, z) || blocked(x, z)) break;
      end = t;
    }
    return shaped(w.a, w.at(end), look);
  }
  // Onto a fairway if one's in reach, else onto any land; then of those
  // about as short as the shortest of them, the one turned furthest from
  // the tee.
  const onFairway = ways.filter((w) => w.fairway && w.crossed <= shortest + CAUSEWAY.toFairway);
  const pool = onFairway.length ? onFairway : ways;
  const least = Math.min(...pool.map((w) => w.crossed));
  const best = pool.filter((w) => w.crossed <= least + CAUSEWAY.near).sort((p, q) => q.turn - p.turn || p.crossed - q.crossed)[0];
  if (!best) return null;
  return shaped(best.a, best.b, look);
}

// A causeway from a to b, with the designer's width and ends.
function shaped(a, b, look) {
  const round = ([x, z]) => [Math.round(x * 100) / 100, Math.round(z * 100) / 100];
  const c = { a: round(a), b: round(b), half: look.w / 2 };
  if (look.e > 1) c.ends = look.e;
  return c;
}

// How wide (half) a causeway is t of the way along it (0 at the green, 1
// at the land): its ends flared out by `ends`, easing into the middle
// over a few times its width (or 40% of its length, if shorter).
function halfAt(c, t, len) {
  const e = c.ends ?? 1;
  if (e === 1) return c.half;
  const reach = Math.min(0.4, (c.half * e * 3) / Math.max(len, 1e-6));
  const flare = Math.max(1 - smoothstep01(Math.min(1, t / reach)), 1 - smoothstep01(Math.min(1, (1 - t) / reach)));
  return c.half * (1 + (e - 1) * flare);
}

// A hole's causeways: [{ a: [x, z], b: [x, z], half }] in its frame, from
// a green's edge (a) to past the edge of the land (b), `half` metres either
// side of that line and rounded at its ends. Worked out once for a hole's
// greens and water as they are - kept by its green, so the copies of a
// layout made as a hole's made ready (courseplay.mjs prepareHole) share it.
const made = new WeakMap();
export function causeways(L) {
  if (!L?.green || !L.water?.length) return [];
  // (And by its fairways, which it runs onto if it can.)
  const extra = L.extraFairways ?? [];
  const had = made.get(L.green);
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  if (had && had.greens === L.greens && had.fairway === L.fairway && had.fairways === L.fairways && had.look === L.causeway && same(had.extra, extra) && same(had.water, L.water)) return had.value;
  const value = greensOf(L)
    .map((g) => wayFrom(L, g))
    .filter(Boolean);
  made.set(L.green, { greens: L.greens, fairway: L.fairway, fairways: L.fairways, look: L.causeway, extra: [...extra], water: [...L.water], value });
  return value;
}

// May a tree or decor stand at (x, z) - more than `clear` metres off every
// causeway's edge?
export function clearOfCauseways(L, x, z, clear = CAUSEWAY.clear) {
  for (const c of causeways(L)) if (causewayPast(c, x, z) <= clear) return false;
  return true;
}

// A list of things standing on a hole ([x, z, ...] each: trees, decor),
// without those on or by its causeways (the same list if there are none).
export function offCauseways(L, list, clear = CAUSEWAY.clear) {
  if (!list?.length || !causeways(L).length) return list;
  const kept = list.filter(([x, z]) => clearOfCauseways(L, x, z, clear));
  return kept.length === list.length ? list : kept;
}

// How far (x, z) is outside a causeway's edge (negative on it).
export function causewayPast(c, x, z) {
  const [ax, az] = c.a;
  const dx = c.b[0] - ax;
  const dz = c.b[1] - az;
  const len2 = dx * dx + dz * dz;
  const t = len2 ? Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / len2)) : 0;
  return Math.hypot(x - ax - dx * t, z - az - dz * t) - halfAt(c, t, Math.sqrt(len2));
}

// A box round a causeway, `grow` metres wider all round.
export function causewayBounds(c, grow = 0) {
  const r = c.half * (c.ends ?? 1) + grow;
  return { x0: Math.min(c.a[0], c.b[0]) - r, x1: Math.max(c.a[0], c.b[0]) + r, z0: Math.min(c.a[1], c.b[1]) - r, z1: Math.max(c.a[1], c.b[1]) + r };
}

// Is (x, z) on one of a hole's causeways?
export function onCauseway(L, x, z) {
  for (const c of causeways(L)) if (causewayPast(c, x, z) <= 0) return true;
  return false;
}

// A causeway's outline, for drawing: its two sides and its rounded ends
// (`n` points round each end), `grow` metres out.
export function causewayOutline(c, n = 12, grow = 0) {
  const [ax, az] = c.a;
  const [bx, bz] = c.b;
  const along = Math.atan2(bz - az, bx - ax);
  const len = Math.hypot(bx - ax, bz - az);
  const r = (t) => halfAt(c, t, len) + grow;
  // (Flared, its sides followed along it; straight, just its ends.)
  const m = (c.ends ?? 1) > 1 ? Math.max(8, Math.min(48, Math.round(len / 2))) : 0;
  const side = (k) => [ax + (bx - ax) * k, az + (bz - az) * k];
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = along - Math.PI / 2 + (i / n) * Math.PI;
    pts.push([bx + Math.cos(a) * r(1), bz + Math.sin(a) * r(1)]);
  }
  for (let i = m - 1; i >= 1; i--) {
    const [x, z] = side(i / m);
    pts.push([x + Math.cos(along + Math.PI / 2) * r(i / m), z + Math.sin(along + Math.PI / 2) * r(i / m)]);
  }
  for (let i = 0; i <= n; i++) {
    const a = along + Math.PI / 2 + (i / n) * Math.PI;
    pts.push([ax + Math.cos(a) * r(0), az + Math.sin(a) * r(0)]);
  }
  for (let i = 1; i < m; i++) {
    const [x, z] = side(i / m);
    pts.push([x + Math.cos(along - Math.PI / 2) * r(i / m), z + Math.sin(along - Math.PI / 2) * r(i / m)]);
  }
  return pts;
}
