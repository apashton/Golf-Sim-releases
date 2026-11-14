// The ball and the cup, in three dimensions.
//
// Everywhere else on the green a ball is a point rolling in x and z
// (putting.mjs rollBall). Near the hole that is not enough: whether a putt
// drops, lips out or pops out of the back of the cup is decided by the ball
// rolling over the rim's edge, falling while it crosses, and what it meets
// on the far side. So once the ball comes within reach of the hole it is
// handed to this model - a rigid ball with position, velocity and spin in
// 3D - and handed back once it is clear and rolling on the green again.
//
// The hole, in a frame centred on the cup with y square to the green:
//   - the green, a plane at y = 0 (tilted by the green's slope at the cup,
//     which here tilts gravity instead);
//   - the rim, where the green turns down into the hole: a circular edge
//     rounded over RIM_ROUND, the way a cut edge wears;
//   - the wall, a vertical cylinder of the cup's radius: the top LINER_TOP
//     of it soil, then the plastic liner;
//   - the floor, flat, CUP_DEPTH down;
//   - the flagstick when it's in, a pole up the middle.
// The ball touches whichever of them it reaches. Each touch pushes back
// along the line from the touching point to the ball's centre, so a ball
// whose centre has gone past the rim is held up only by the edge and
// pivots over it while gravity pulls it in - the way Holmes and Penner
// model a ball meeting the hole:
//   B. W. Holmes, "Putting: How a golf ball and hole interact",
//     Am. J. Phys. 59, 129 (1991): the ball rolling over the lip, falling
//     as it crosses and meeting the far wall or rim; a centred ball held up
//     to about 1.3 m/s.
//   A. R. Penner, "The physics of putting", Can. J. Phys. 80, 83 (2002):
//     the same with the capture speed falling away for a ball off-centre,
//     about 1.6 m/s dead centre.
// Nothing here is scripted: lip-outs, horseshoes, a ball caught by the back
// wall and a ball that hops off the back edge and out all come out of the
// same contacts. It is deterministic - no randomness - so the variety comes
// only from the pace and line the ball arrives with.
//
// Pure functions, shared by the browser and the tests.

const G = 9.81;

export const BALL_RADIUS = 0.02135; // 1.68 in, the Rules' smallest ball
export const HOLE_RADIUS = 0.054; // regulation 4.25 in hole
// The Rules of Golf (Definitions, "Hole"): at least 4 in deep, and a liner,
// if used, sunk at least 1 in below the surface. So the top inch of the
// wall is soil and the rest plastic.
export const CUP_DEPTH = 0.1016;
export const LINER_TOP = 0.0254;
// A freshly cut edge is crisp; feet, the hole cutter and balls taken out
// round it over a few millimetres. A judgement: sharp enough that the ball
// pivots over a definite edge, rounded enough that it doesn't catch on a
// knife. (How fast a ball can drop hardly depends on it: within a few
// hundredths of a metre a second for anything from 3 to 6 mm.)
export const RIM_ROUND = 0.005;
// The flagstick: about half an inch across, and 7 ft tall (the Rules'
// recommended height is at least 7 ft).
export const PIN_RADIUS = 0.0065;
export const PIN_HEIGHT = 2.13;

// What each surface does to the ball: e the restitution (the share of its
// speed into the surface it comes back off with), mu its sliding friction,
// and roll whether it drags on a ball rolling over it as the green does.
//   green  e as a landing on the green (flight.mjs SURFACES.green); mu for a
//          ball on cut grass, the usual 0.4 (Penner 2002 uses about that)
//   rim    the cut edge of turf and roots over soil: all but dead, and
//          firm. Holmes and Penner both treat the ball meeting it as
//          pivoting on it without bouncing; a livelier edge (0.2-0.3)
//          keeps firm putts in - they rebound off the back edge and fall
//          back - taking the fastest centred drop past 2 m/s, well beyond
//          what either found
//          rough  how many times the green's drag the cut edge takes
//          off a ball moving round it: the edge is torn turf and roots,
//          not a mown surface. The owner: "too many hit the cup and never
//          drop. There needs to be a little more room for error on drops."
//          A ball riding the rim is held up by its own speed round it, so
//          losing pace there lets more of them fall in: at a pace that
//          would run 17 in past, a putt drops up to about 54 mm off the
//          middle (42 before), at 3 ft past about 42 (34); one through the
//          middle drops no faster than before. Only above ROUGH_FROM - a
//          ball barely moving on the edge falls, it isn't held there
//   soil   the inch of soil wall above the liner: dead, grippy (judgement)
//   liner  the plastic cup: livelier and more slippery - the "clack" of a
//          ball off the back of the liner. 0.4 is a judgement for hard
//          plastic backed by soil (a free plastic sheet would ring more);
//          mu for smooth plastic, often damp
//   floor  the liner's bottom, sitting on soil (and often holed to drain):
//          a dull clunk, 0.2 (judgement). Livelier, a pitch dunked into
//          the cup bounces off the floor and out far more often than
//          chip-ins are seen to
//   pin    a fibreglass pole in its ferrule, which flexes: a dead knock
//          and little grip (smooth, painted). 0.25 is a judgement, set so
//          a ball through the middle with the flag in drops up to about
//          2.2 m/s and a firmer one knocks back out - the flag-in trials
//          (Pelz; Mackenzie) have it helping a ball in up to around 2 m/s
export const SURFACES = {
  green: { e: 0.25, mu: 0.4, roll: true },
  rim: { e: 0.02, mu: 0.45, roll: true, w: 4000, rough: 8 },
  soil: { e: 0.25, mu: 0.45, roll: false },
  liner: { e: 0.4, mu: 0.15, roll: false },
  floor: { e: 0.2, mu: 0.2, roll: false },
  pin: { e: 0.25, mu: 0.1, roll: false },
};

// The touches are stiff springs with damping set by each surface's
// restitution: a ball meets anything for about a millisecond (w, the
// spring's natural frequency, 2500 rad/s unless a surface says otherwise;
// the rim's firmer), sinking no more than a few millimetres into it, and
// each touch spans ten or more steps of CUP_STEP - small enough to follow
// a ball bouncing about the cup, and cheap because only a ball near the
// hole is followed this way.
const STIFF = 2500; // rad/s
export const CUP_STEP = 1e-4; // s
// Path points while in the cup model: every 2 ms, fine enough to draw a
// rattle.
const PATH_EVERY = 20;
// The longest the model follows the ball near the hole (s), and how long
// a holed ball is watched settling before it's left at the bottom.
const MAX_TIME = 4;
const SETTLE_TIME = 0.8;

// The turf's drag grows with how hard the ball presses on it, up to this
// many times its weight: riding round the rim it presses harder, but the
// knock of a bounce is the restitution's to take, not the drag's.
const DRAG_LOAD = 2;

// Coming down on the green this fast (m/s into it) is a bounce - as in
// flight.mjs bounce, where anything softer just touches down.
const LANDING = 1.2;

// The pace (m/s) round the rim above which its roughness drags (SURFACES).
const ROUGH_FROM = 0.1;

// The ball's moment of inertia over m r², a solid ball's 2/5 (a two-piece
// ball is close to it).
const INERTIA = 0.4;

// Where the model takes over from the flat roll, and hands back: within
// the cup's radius plus the ball's plus a few millimetres (the edge is
// rounded over RIM_ROUND beyond the hole's radius), and once clear by a
// little more, so it can't hand back and forth.
export const engageRadius = (R) => R + RIM_ROUND + BALL_RADIUS + 0.005;
const releaseRadius = (R) => engageRadius(R) + 0.008;

// Damping for a restitution: the damper that sends a ball meeting a
// surface at 2 m/s back off it at e of that speed. The textbook ratio
// (-ln e / sqrt(pi^2 + ln^2 e)) is for a spring that can pull as well as
// push; one that only pushes lets go early and returns more, so the
// damping is found by trying it, with the same steps the model takes.
function damping(e, w) {
  const bounce = (c) => {
    let y = 0;
    let v = -2;
    for (let i = 0; i < 100000; i++) {
      const f = Math.max(0, w * w * -y - c * v);
      v += f * CUP_STEP;
      y += v * CUP_STEP;
      if (y > 0) return v / 2;
    }
    return 0;
  };
  let lo = 0;
  // (Beyond 1 / CUP_STEP the damper would overshoot within a step.)
  let hi = 1 / CUP_STEP;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (bounce(mid) > e) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
for (const s of Object.values(SURFACES)) {
  s.w ??= STIFF;
  s.k = s.w * s.w;
  s.c = damping(s.e, s.w);
}

// What the ball is touching, at centre p (cup frame): a list of
// { kind, n: unit normal from the surface to the centre, depth, surface }.
// kind is what it counts as for the sound: "green", "rim", "wall",
// "bottom" or "pin".
function touches(p, R, pin, out) {
  out.length = 0;
  const r = BALL_RADIUS;
  const e = RIM_ROUND;
  const [x, y, z] = p;
  const rho = Math.hypot(x, z);
  const ux = rho > 1e-12 ? x / rho : 1;
  const uz = rho > 1e-12 ? z / rho : 0;
  const Rc = R + e;
  if (rho >= Rc) {
    const depth = r - y;
    if (depth > 0) out.push({ kind: "green", nx: 0, ny: 1, nz: 0, depth, s: SURFACES.green });
  } else if (y >= -e) {
    // The rounded edge: a ring of radius Rc, e below the green, and the
    // ball within e of it. Its normal swings from straight up (on the
    // green's side) to straight in (down the wall).
    const dr = rho - Rc;
    const dy = y + e;
    const dist = Math.hypot(dr, dy);
    const depth = r + e - dist;
    if (depth > 0 && dist > 1e-12) out.push({ kind: "rim", nx: (dr / dist) * ux, ny: dy / dist, nz: (dr / dist) * uz, depth, s: SURFACES.rim });
  } else if (y > -CUP_DEPTH) {
    const depth = rho + r - R;
    if (depth > 0) out.push({ kind: "wall", nx: -ux, ny: 0, nz: -uz, depth, s: y > -LINER_TOP ? SURFACES.soil : SURFACES.liner });
  }
  if (rho < R) {
    const depth = r - (y + CUP_DEPTH);
    if (depth > 0) out.push({ kind: "bottom", nx: 0, ny: 1, nz: 0, depth, s: SURFACES.floor });
  }
  if (pin && y > -CUP_DEPTH && y < PIN_HEIGHT) {
    const depth = PIN_RADIUS + r - rho;
    if (depth > 0) out.push({ kind: "pin", nx: ux, ny: 0, nz: uz, depth, s: SURFACES.pin });
  }
  return out;
}

// The ball's energy per unit mass: moving, spinning and its height against
// the (tilted) gravity. For the tests: it must never go up.
export function ballEnergy(s, grad = [0, 0]) {
  const { p, v, w } = s;
  const g = gravity(grad);
  const k = 0.5 * (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  const spin = 0.5 * INERTIA * BALL_RADIUS * BALL_RADIUS * (w[0] * w[0] + w[1] * w[1] + w[2] * w[2]);
  return k + spin - (g[0] * p[0] + g[1] * p[1] + g[2] * p[2]);
}

// Gravity in the cup's frame: the green's slope [dh/dx, dh/dz] tips it.
function gravity([gx, gz]) {
  const n = Math.hypot(gx, 1, gz);
  return [(-G * gx) / n, -G / n, (-G * gz) / n];
}

// Spin for a ball rolling at velocity v (on a surface with normal +y).
export const rollingSpin = (v) => [v[2] / BALL_RADIUS, 0, -v[0] / BALL_RADIUS];

// Follows a ball near the hole until it's holed, rolling clear again, or
// stopped on the green by it.
//   start   { p: [x, y, z], v: [vx, vy, vz], w: [wx, wy, wz], t } in the
//           cup's frame: x and z across the green from the cup's middle,
//           y the ball's centre above the green (BALL_RADIUS when it sits
//           on it), w its spin (rad/s)
//   hole    { r } the cup's radius
//   grad    the green's slope at the cup [dh/dx, dh/dz]
//   drag    (x, z, speed) => the green's rolling deceleration at (x, z)
//           in the cup's frame (its stimp, or the fringe's)
//   pin     the flagstick is in
//   landing hand back a ball coming down on the green clear of the hole
//           hard enough to bounce (end "landed"), as it touches down
//   watch   optional (t, s, stored) => ..., called every step with the
//           ball's state and the energy stored in the touches it's
//           pressing into (per unit mass), for the tests
// Returns { end: "holed" | "roll" | "rest" | "landed", s: final state, t, path:
// [[x, z, t, y]] with y the ball's bottom above the green (negative in the
// cup), events: [{ kind: "rim" | "wall" | "bottom" | "pin", t, speed }]
// each a new touch and how fast it came into it, touched (the rim or the
// wall at all), dropSpeed (its speed as its centre first came in over the
// hole), firstTouch (what it touched first), grounded (when it first
// touched anything but the flagstick) }.
export function playCup(start, hole, { grad = [0, 0], drag = () => 0, pin = false, maxTime = MAX_TIME, watch = null, landing = false } = {}) {
  const R = hole.r;
  const r = BALL_RADIUS;
  const g = gravity(grad);
  const slopeAccel = (5 / 7) * Math.hypot(g[0], g[2]);
  const p = [...start.p];
  const v = [...start.v];
  const w = [...(start.w ?? rollingSpin(start.v))];
  let t = start.t ?? 0;
  const t0 = t;
  const dt = CUP_STEP;
  // Heights for the path: the ball's bottom above the green, down in the
  // cup where it's over the hole - never the fraction of a millimetre it
  // sinks into the green's spring.
  const RC = R + RIM_ROUND;
  const height = () => (p[1] - r < 0 && Math.hypot(p[0], p[2]) >= RC ? 0 : p[1] - r);
  const path = [[p[0], p[2], t, height()]];
  const events = [];
  const list = [];
  // Per kind, when the ball was last touching it, so one touch that
  // flickers on and off for a step or two is heard once.
  const lastOn = { green: -1, rim: -1, wall: -1, bottom: -1, pin: -1 };
  let touched = false;
  let firstTouch = null;
  // When it first touched anything but the flagstick: a ball coming down
  // from the air lands then.
  let grounded = null;
  let dropSpeed = null;
  let capturedAt = null;
  let step = 0;
  const release = releaseRadius(R);

  const finish = (end) => {
    const last = path[path.length - 1];
    if (last[2] !== t) path.push([p[0], p[2], t, height()]);
    return { end, s: { p, v, w }, t, path, events, touched, dropSpeed, firstTouch, grounded };
  };

  while (t - t0 < maxTime) {
    touches(p, R, pin, list);
    if (watch) watch(t, { p, v, w }, list.reduce((sum, c) => sum + 0.5 * c.s.k * c.depth * c.depth, 0));
    // Gravity, and each touch's push.
    let ax = g[0];
    let ay = g[1];
    let az = g[2];
    for (const c of list) {
      const into = -(v[0] * c.nx + v[1] * c.ny + v[2] * c.nz);
      c.f = Math.max(0, c.s.k * c.depth + c.s.c * into);
      ax += c.f * c.nx;
      ay += c.f * c.ny;
      az += c.f * c.nz;
      if (lastOn[c.kind] < t - 0.005 && c.kind !== "green") {
        events.push({ kind: c.kind, t, speed: Math.max(0, into) });
        if (c.kind === "rim" || c.kind === "wall") touched = true;
      }
      if (!firstTouch) firstTouch = c.kind;
      if (grounded == null && c.kind !== "pin") grounded = t;
      // Coming down on the green clear of the hole, hard enough to bounce:
      // a landing like any other, for the caller's bounce (flight.mjs) to
      // take - so a pitch lands the same by the hole as anywhere else.
      if (landing && c.kind === "green" && lastOn.green < t - 0.005 && into >= LANDING) return finish("landed");
      lastOn[c.kind] = t;
    }
    v[0] += ax * dt;
    v[1] += ay * dt;
    v[2] += az * dt;
    // Friction at each touch: whatever it takes to stop the ball's surface
    // slipping over it, up to mu times the push. The ball's surface moves
    // at v + w x (-r n); a push J along the surface changes that by 7/2 J
    // for a solid ball (J itself, and 5/2 J through the spin it gives).
    for (const c of list) {
      if (c.f <= 0) continue;
      const { nx, ny, nz } = c;
      // Contact point's velocity: v + w x (-r n).
      let sx = v[0] - r * (w[1] * nz - w[2] * ny);
      let sy = v[1] - r * (w[2] * nx - w[0] * nz);
      let sz = v[2] - r * (w[0] * ny - w[1] * nx);
      const sn = sx * nx + sy * ny + sz * nz;
      sx -= sn * nx;
      sy -= sn * ny;
      sz -= sn * nz;
      const slip = Math.hypot(sx, sy, sz);
      if (slip > 1e-12) {
        const want = (2 / 7) * slip;
        const J = Math.min(want, c.s.mu * c.f * dt) / slip;
        const jx = -sx * J;
        const jy = -sy * J;
        const jz = -sz * J;
        v[0] += jx;
        v[1] += jy;
        v[2] += jz;
        // Spin: -(1/(INERTIA r)) n x J.
        const k = -1 / (INERTIA * r);
        w[0] += k * (ny * jz - nz * jy);
        w[1] += k * (nz * jx - nx * jz);
        w[2] += k * (nx * jy - ny * jx);
      }
      // The turf's drag on a ball rolling over it (the green's speed),
      // in proportion to how hard the ball presses on it: taken off the
      // ball's pace and its roll together, so a rolling ball keeps
      // rolling - on the green this is exactly the flat roll's slowing.
      if (c.s.roll) {
        let tx = v[0];
        let ty = v[1];
        let tz = v[2];
        const vn = tx * nx + ty * ny + tz * nz;
        tx -= vn * nx;
        ty -= vn * ny;
        tz -= vn * nz;
        const along = Math.hypot(tx, ty, tz);
        if (along > 1e-9) {
          const rough = c.s.rough && along > ROUGH_FROM ? c.s.rough : 1;
          const cut = Math.min(along, drag(p[0], p[2], along) * rough * Math.min(c.f / G, DRAG_LOAD) * dt) / along;
          const dx = -tx * cut;
          const dy = -ty * cut;
          const dz = -tz * cut;
          v[0] += dx;
          v[1] += dy;
          v[2] += dz;
          w[0] += (ny * dz - nz * dy) / r;
          w[1] += (nz * dx - nx * dz) / r;
          w[2] += (nx * dy - ny * dx) / r;
        }
      }
    }
    p[0] += v[0] * dt;
    p[1] += v[1] * dt;
    p[2] += v[2] * dt;
    t += dt;
    step++;
    if (step % PATH_EVERY === 0) path.push([p[0], p[2], t, height()]);

    const rho = Math.hypot(p[0], p[2]);
    // Coming in over the rim: how fast, for the sound of it dropping.
    if (dropSpeed == null && rho < R) dropSpeed = Math.hypot(v[0], v[1], v[2]);

    if (capturedAt == null && rho < R && p[1] < -r) {
      // Down in the cup, and without the energy to lift its centre back
      // to the level of the green - which it would need, and more, to get
      // out: it's holed, whatever it does now.
      const moving = 0.5 * (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) + 0.5 * INERTIA * r * r * (w[0] * w[0] + w[1] * w[1] + w[2] * w[2]);
      if (p[1] + moving / G < 0) capturedAt = t;
    }
    if (capturedAt != null) {
      const settled = p[1] < -CUP_DEPTH + r + 0.002 && Math.hypot(v[0], v[1], v[2]) < 0.03;
      if (settled || t - capturedAt > SETTLE_TIME) return { ...finish("holed"), capturedAt };
      continue;
    }

    // Out on the green, rolling, and clear of the hole: back to the flat
    // roll. Or stopped there.
    if (rho >= RC && list.length === 1 && list[0].kind === "green" && Math.abs(v[1]) < 0.02 && p[1] > r - 0.0005) {
      const speed = Math.hypot(v[0], v[2]);
      if (speed < 0.01 && slopeAccel <= drag(p[0], p[2], speed)) return finish("rest");
      if (rho > release) {
        const sx = v[0] - r * (w[1] * 0 - w[2] * 1);
        const sz = v[2] - r * (w[0] * 1 - w[1] * 0);
        if (Math.hypot(sx, sz) < 0.02) return finish("roll");
      }
    }
  }
  // Out of time (it shouldn't be): in the cup is in, anywhere else it
  // stops where it is.
  return Math.hypot(p[0], p[2]) < R && p[1] < 0 ? { ...finish("holed"), capturedAt: t } : finish("rest");
}
