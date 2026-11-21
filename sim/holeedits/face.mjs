// Hand edits to a hole (sim/holeedits.mjs): a deep bunker's face - the
// edge ahead of a ball and whether a flight clears it.

import { wallOf, wallAt, faceRun } from "../walls.mjs";
import { inBox, insideDepth, shapeBounds } from "./shapes.mjs";
import { faceWidth } from "./ground.mjs";

// ---- A deep bunker's face -------------------------------------------------------

// A shot from a dug bunker - or one with a wall - has to clear its face.
// Where the ball is in one, how far it is along the aim to the bunker's
// edge (metres) and the bunker, and whether the edge there is its wall;
// null if it isn't in one.
//
// Bunkers can overlap (two kidneys laid over each other make one bigger
// patch of sand), so the ball isn't simply "in" one of them: the walk
// along the aim goes on until it's out of every bunker it has been in,
// and the edge found there belongs to whichever of them is dug or walled.
// (Picking only the one the ball was deepest in let a ball beside a wall
// fly straight through it when a plain bunker overlapped the walled one.)
export function bunkerEdgeAhead(layout, [x, z], aim) {
  const list = layout.bunkers ?? [];
  const inside = (s, px, pz) => inBox(shapeBounds(s, 0), px, pz) && insideDepth(s, px, pz) >= 0;
  const been = new Set();
  list.forEach((s, i) => {
    if (inside(s, x, z)) been.add(i);
  });
  if (!been.size) return null;
  const dx = Math.cos(aim);
  const dz = Math.sin(aim);
  for (let d = 0; d < 80; d += 0.1) {
    const at = [x + dx * d, z + dz * d];
    let still = false;
    let walled = null;
    list.forEach((s, i) => {
      if (inside(s, at[0], at[1])) {
        still = true;
        been.add(i);
      } else if (been.has(i) && wallOf(s)) {
        // Just left a walled one: its wall stands here even where another
        // bunker's sand carries on beyond it.
        const w = wallAt(s, at[0], at[1]);
        if (w && w.wn > 0.5 && w.dw < 0.5) walled = s;
      }
    });
    if (walled) return { bunker: walled, edge: d, at, wall: true };
    if (still) continue;
    // Out of the sand: the bunkers passed through that have a face to clear.
    const deep = [...been].map((i) => list[i]).filter((s) => s.dig || wallOf(s));
    if (!deep.length) return null;
    // Is the edge here a wall? Any walled one's wall counts.
    const wall = deep.some((s) => {
      const w = wallOf(s) ? wallAt(s, at[0], at[1]) : null;
      return !!w && w.wn > 0.5 && w.dw < 0.5;
    });
    // The bunker whose edge this is: the deep one the spot is nearest.
    let bunker = deep[0];
    let bd = -Infinity;
    for (const s of deep) {
      const e = insideDepth(s, at[0], at[1]);
      if (e > bd) {
        bd = e;
        bunker = s;
      }
    }
    return { bunker, edge: d, at, wall };
  }
  return null;
}

// How wide a bunker's face is where a shot meets it (`ahead`, from
// bunkerEdgeAhead): a wall's, or its ordinary face's.
export function faceWidthAt(ahead) {
  if (ahead.wall) return faceRun(ahead.bunker);
  return ahead.bunker.dig ? faceWidth(ahead.bunker) : 0.8;
}

// The rule: a shot launched too low to clear the face at its distance to
// the edge hits it and drops back into the bunker - like real golf, loft
// and speed decide. `flight`: the flight's path in the shot's own frame
// ([forward, up, right, t], up measured from where it was struck), `edge`
// the distance to the edge along the aim, `need` how high the ball must be
// there (the face plus its lip). Returns null if it clears, or where it hit:
// { index, t, forward, height } (the path up to `index` is before the hit).
export function hitsFace(flight, edge, need) {
  for (let i = 1; i < flight.length; i++) {
    const [x1, y1] = flight[i];
    if (x1 < edge) continue;
    const [x0, y0] = flight[i - 1];
    const f = (edge - x0) / (x1 - x0 || 1);
    const y = y0 + (y1 - y0) * f;
    if (y >= need) return null;
    return { index: i - 1, t: flight[i - 1][3] + (flight[i][3] - flight[i - 1][3]) * f, forward: edge, height: y };
  }
  // Came down before it got there: still in the bunker, as normal.
  return null;
}
