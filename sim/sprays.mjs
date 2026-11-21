// What a ball throws up (look/sprays.js draws it, on Medium and up; the
// owner, 21 October 2026: "Yes to all 1-5" - a puff of sand where a ball
// lands in a bunker, sand blasted out by a bunker shot, a splash where it
// goes into water and the bank splashed dark if it's close):
//   - each spray a burst of bits flying off a spot and falling back:
//     grains of sand or drops of water, and a soft cloud of dust or a
//     burst of white water over them;
//   - each bit { at: [x, y, z] its start off the spot, v: [x, y, z] m/s,
//     size (metres across), grow (a cloud's: how much bigger a second),
//     fall (how much gravity takes it: 1 a grain, none a cloud), drag (a
//     second), life (seconds), alpha, kind:
//     "grain" | "dust" | "drop" | "foam" }, in the world's directions (y
//     up); `heading` [x, z] is the way the ball was going (or the shot
//     played), a unit vector in the world.
// The same spot and shot always throw the same (a seed from where it is).
// Pure.

export const SPRAY = {
  gravity: 9.81,
  // How hard it lands, m/s (audio/cues.mjs impactSpeed), for the least
  // and the biggest puff or splash.
  impact: [3, 20],
  // A landing in sand: grains, and a cloud of dust.
  sand: { grains: [30, 120], up: [1.6, 4.6], out: [0.6, 2.2], ahead: 1.2, size: [0.015, 0.035], dust: [5, 10], dustSize: [0.2, 0.45] },
  // A bunker shot: the sand blasted out ahead of the club, by how fast
  // the swing was (mph, the ball's speed: a splash out of a greenside
  // bunker to a full shot from a fairway one).
  blast: { mph: [25, 110], grains: [120, 260], up: [2.2, 6], ahead: [1.8, 6], side: 1.8, size: [0.015, 0.04], dust: [10, 18], dustSize: [0.3, 0.7] },
  // Into water: a crown of drops, a few straight up from a steep landing,
  // and a burst of white on the surface.
  water: { drops: [30, 110], up: [1.5, 5.5], spout: [4, 8], out: [0.5, 2], size: [0.02, 0.055], foam: [2, 5], foamSize: [0.45, 1] },
  // The bank splashed dark (wetEdge): a ball going in this close to the
  // edge (metres), the patch this big at most, drying in this long.
  wet: { near: 2.4, most: 1.2, dry: 90 },
};

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp = ([a, b], t) => a + (b - a) * t;

// A seed from a spot, so a replay throws the same.
export function spraySeed(x, z, k = 0) {
  let h = Math.imul(Math.round(x * 100), 73856093) ^ Math.imul(Math.round(z * 100), 19349663) ^ Math.imul(k + 1, 83492791);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0 || 1;
}
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// How hard a landing cue came down, 0 - 1 between SPRAY.impact's ends.
export function impactShare(cue) {
  const impact = Number.isFinite(cue?.impact) ? cue.impact : (cue?.speed ?? 0) * (cue?.steep ?? 0.5);
  return clamp01((impact - SPRAY.impact[0]) / (SPRAY.impact[1] - SPRAY.impact[0]));
}

// A bit's time to fall back to where it started, with its drag: none
// for a cloud (it fades), else when its height comes back to 0.
function landed(p) {
  if (p.kind === "dust" || p.kind === "foam") return p.life;
  for (let t = 0.05; t < p.life; t += 0.05) if (sprayPoint(p, t).y < p.at[1] - 0.005) return t;
  return p.life;
}

// Grains thrown off in a crown, more of them ahead.
function crown(rand, n, { up, out, ahead = 0, heading = [1, 0], size, kind, fall = 1, drag = 1.2, life = 2, k = 1 }) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2;
    const o = lerp(out, rand()) * (0.5 + 0.5 * k);
    const vx = Math.cos(a) * o + heading[0] * ahead * rand() * k;
    const vz = Math.sin(a) * o + heading[1] * ahead * rand() * k;
    const vy = lerp(up, rand()) * (0.55 + 0.45 * k);
    const p = { kind, at: [(rand() - 0.5) * 0.05, 0.01, (rand() - 0.5) * 0.05], v: [vx, vy, vz], size: lerp(size, rand()), fall, drag, life, alpha: 1 };
    p.life = landed(p);
    parts.push(p);
  }
  return parts;
}

// A soft cloud rising a little and drifting, swelling as it fades.
function cloud(rand, n, { size, heading = [0, 0], push = 0.3, life = [1.4, 2.6], alpha = 0.2, grow = 1.2, kind = "dust" }) {
  return Array.from({ length: n }, () => {
    const a = rand() * Math.PI * 2;
    const o = 0.25 + rand() * 0.7;
    return { kind, at: [(rand() - 0.5) * 0.2, 0.05 + rand() * 0.1, (rand() - 0.5) * 0.2], v: [Math.cos(a) * o + heading[0] * push, 0.25 + rand() * 0.35, Math.sin(a) * o + heading[1] * push], size: lerp(size, rand()), grow, fall: 0, drag: 1.5, life: lerp(life, rand()), alpha };
  });
}

// A ball landing in sand (a "land" cue in a bunker): { kind: "sand",
// parts } - or null if it came down too gently to throw any.
export function sandPuff(cue, heading = [1, 0], seed = 1) {
  const k = impactShare(cue);
  if (k <= 0 && !(cue?.bounce === 0)) return null;
  const rand = rng(seed);
  const S = SPRAY.sand;
  // (A hop on after the first touchdown throws less.)
  const hop = cue?.bounce > 0 ? 0.4 : 1;
  const n = Math.round(lerp(S.grains, k) * hop);
  if (n < 4) return null;
  return {
    kind: "sand",
    parts: [...crown(rand, n, { up: S.up, out: S.out, ahead: S.ahead, heading, size: S.size, kind: "grain", k: Math.max(0.3, k) * hop }), ...cloud(rand, Math.round(lerp(S.dust, k) * hop), { size: S.dustSize, heading })],
  };
}

// A shot played out of sand (not a putt): the sand blasted out ahead of
// it - more from a plugged ball, dug out. speedMph: the ball's.
export function sandBlast({ speedMph = 0, heading = [1, 0], plug = null } = {}, seed = 1) {
  const B = SPRAY.blast;
  const k = clamp01((speedMph - B.mph[0]) / (B.mph[1] - B.mph[0]));
  const dig = plug === "buried" ? 1.5 : plug === "egg" ? 1.25 : 1;
  const rand = rng(seed);
  const n = Math.round(lerp(B.grains, 1 - k * 0.6) * dig);
  const parts = [];
  for (let i = 0; i < n; i++) {
    // Out ahead and up, spreading as a fan: a splash shot's (slow) the
    // most sand, high; a full one's a thinner, flatter spray.
    const ahead = lerp(B.ahead, rand()) * (0.6 + 0.4 * k);
    const side = (rand() - 0.5) * 2 * B.side;
    const vx = heading[0] * ahead - heading[1] * side;
    const vz = heading[1] * ahead + heading[0] * side;
    const vy = lerp(B.up, rand()) * (1.1 - 0.4 * k);
    const p = { kind: "grain", at: [(rand() - 0.5) * 0.12, 0.01, (rand() - 0.5) * 0.12], v: [vx, vy, vz], size: lerp(B.size, rand()), fall: 1, drag: 1.1, life: 2.5, alpha: 1 };
    p.life = landed(p);
    parts.push(p);
  }
  parts.push(...cloud(rand, Math.round(lerp(B.dust, 1 - k * 0.5) * dig), { size: B.dustSize, heading, push: 0.8, life: [1.8, 3.2], alpha: 0.22, grow: 1.1 }));
  return { kind: "sand", parts };
}

// A ball going into water (a "splash" cue, or landing in it): { kind:
// "water", parts }.
export function waterSplash(cue, seed = 1) {
  const k = Math.max(0.15, impactShare(cue));
  const W = SPRAY.water;
  const rand = rng(seed);
  const steep = clamp01(cue?.steep ?? 0.5);
  const parts = crown(rand, Math.round(lerp(W.drops, k)), { up: W.up, out: W.out, size: W.size, kind: "drop", drag: 0.7, life: 2.5, k });
  // Straight up from a steep landing: a few drops thrown higher.
  const spout = Math.round(steep * k * 8);
  for (let i = 0; i < spout; i++) {
    const p = { kind: "drop", at: [0, 0.01, 0], v: [(rand() - 0.5) * 0.4, lerp(W.spout, rand()) * k, (rand() - 0.5) * 0.4], size: lerp(W.size, rand()) * 1.2, fall: 1, drag: 0.6, life: 2.5, alpha: 1 };
    p.life = landed(p);
    parts.push(p);
  }
  parts.push(...cloud(rand, Math.round(lerp(W.foam, k)), { size: W.foamSize, life: [0.7, 1.3], alpha: 0.7, grow: 0.7, kind: "foam" }));
  return { kind: "water", parts };
}

// Where bit `p` is `t` seconds on, off the spot it was thrown from: { x,
// y, z, size, alpha } - its drag slowing it, gravity taking it (as much as
// its `fall`), a cloud swelling, fading over the last third of its life;
// alpha 0 once it's done (or, a grain or drop, fallen back).
export function sprayPoint(p, t) {
  const k = Math.max(1e-3, p.drag);
  const e = 1 - Math.exp(-k * t);
  const g = SPRAY.gravity * p.fall;
  const x = p.at[0] + (p.v[0] / k) * e;
  const z = p.at[2] + (p.v[2] / k) * e;
  const y = p.at[1] + ((p.v[1] + g / k) / k) * e - (g * t) / k;
  const left = p.life - t;
  const alpha = left <= 0 ? 0 : p.alpha * Math.min(1, left / (p.life / 3));
  return { x, y, z, size: p.size * (1 + (p.grow ?? 0) * t), alpha };
}

// How long a spray lasts: its longest-lived bit.
export const sprayLife = (spray) => Math.max(0, ...(spray?.parts ?? []).map((p) => p.life));

// The bank splashed where a ball goes into water close to it: the nearest
// ground that isn't water within SPRAY.wet.near of where it went in (dry:
// (x, z) -> whether it's dry ground there, the hole's frame), and how big
// a patch (more from a harder splash) - { at: [x, z], r } or null.
export function wetEdge(dry, [x, z], cue = null) {
  const W = SPRAY.wet;
  for (let d = 0.3; d <= W.near; d += 0.3) {
    let best = null;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const px = x + Math.cos(a) * d;
      const pz = z + Math.sin(a) * d;
      if (dry(px, pz)) {
        best = [px, pz];
        break;
      }
    }
    if (best) {
      const k = Math.max(0.2, impactShare(cue));
      return { at: best, r: W.most * k * (1 - (d / W.near) * 0.6) };
    }
  }
  return null;
}
