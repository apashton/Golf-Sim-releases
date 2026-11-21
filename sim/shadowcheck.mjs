// Whether the sun's shadow map needs drawing again. It's one fixed map over
// the whole scene (look/environment.js fitShadows), and almost nothing in it
// moves, so it's drawn when a scene or hole is built and again only on a
// frame where something that casts a shadow has appeared, disappeared,
// started or stopped casting, moved, or had its instances changed - one
// general check over every caster (look/shadowwatch.js gathers them), not a
// list of events kept by hand. Pure: a snapshot is plain numbers.
//
// A caster: { id, matrix: [16 numbers], version, count, loose }
//   id       unique to the object (three.js's id)
//   matrix   where it is: its world matrix
//   version  its instance data's version (an instanced or batched mesh:
//            bumped whenever an instance moves, appears or changes shape)
//   count    how many instances it draws
//   loose    only where it stands counts, not its turn or size (a player's
//            marker, kept about the same size on screen as the camera moves:
//            its shadow is left at the size it was drawn)
// The light: { matrix, target, projection } - where the sun's shadow camera
// is, what it looks at, and how much it covers (fitting the map again
// moves these).

const LOOSE = [12, 13, 14];

// A snapshot of the casters (visible ones, that cast) and the light, as one
// flat list of numbers. Two snapshots are the same only if nothing about
// the shadow has changed.
export function snapshot(casters, light = null, out = []) {
  out.length = 0;
  if (light) {
    for (const k of ["matrix", "target", "projection"]) for (const v of light[k] ?? []) out.push(v);
  }
  out.push(-1, casters.length);
  for (const c of casters) {
    out.push(c.id, c.version ?? 0, c.count ?? 1, c.loose ? 1 : 0);
    const m = c.matrix;
    if (c.loose) for (const i of LOOSE) out.push(m[i]);
    else for (let i = 0; i < 16; i++) out.push(m[i]);
  }
  return out;
}

// Whether two snapshots differ: the map must be drawn again. (null: none
// yet - a new scene.)
export function shadowChanged(before, now) {
  if (!before || before.length !== now.length) return true;
  for (let i = 0; i < now.length; i++) if (before[i] !== now[i]) return true;
  return false;
}

// Which maps to draw this frame, with a near map (High and Ultra): the
// small casters (`userData.shadowNear`: rocks, gorse, the players' markers)
// are kept out of the wide map while there's a near one, so a change in
// them redraws the near map only - and on Ultra no more than every
// `every` frames (a marker moving with the camera, say), the change kept
// till then. Without a near map (Standard, or shed by the safety valve)
// they're in the wide one, as everything is.
//   wide:    something in the wide map changed (or the scene did)
//   small:   a small caster changed
//   moved:   the near map moved on with the camera
//   near:    the near map is live (placed, not shed)
//   waited:  frames since the near map was last drawn
// -> { wide, near, pending }: whether to draw the wide map (and the near
// one with it), or only the near one, and whether a small change is still
// waiting.
export function shadowPlan({ wide = false, small = false, moved = false, near = false, waited = Infinity, every = 1 }) {
  if (wide || (small && !near)) return { wide: true, near: false, pending: false };
  if (moved) return { wide: false, near: true, pending: false };
  if (!small) return { wide: false, near: false, pending: false };
  if (waited < every) return { wide: false, near: false, pending: true };
  return { wide: false, near: true, pending: false };
}

// What made the map need drawing again, from the two snapshots (light: they
// start with the light's numbers): "light" (the sun's shadow camera
// moved), "scene" (none before: a new scene), or the first caster that
// changed - { id, how } with how "moved", "changed" (its instances), "more"
// or "fewer" (instances drawn), "appeared" or "gone". Null when they're the
// same. For a report (look/shadowwatch.js): which object keeps the map
// being drawn again.
export function shadowCause(before, now, light = true) {
  if (!before) return "scene";
  const head = light ? 48 : 0;
  if (light) for (let i = 0; i < head && i < now.length; i++) if (before[i] !== now[i]) return "light";
  const read = (s) => {
    const out = new Map();
    for (let i = head + 2; i < s.length; ) {
      const loose = s[i + 3] === 1;
      out.set(s[i], { at: i, version: s[i + 1], count: s[i + 2], n: loose ? LOOSE.length : 16 });
      i += 4 + (loose ? LOOSE.length : 16);
    }
    return out;
  };
  const A = read(before);
  const B = read(now);
  for (const [id, b] of B) {
    const a = A.get(id);
    if (!a) return { id, how: "appeared" };
    if (a.version !== b.version) return { id, how: "changed" };
    if (a.count !== b.count) return { id, how: b.count > a.count ? "more" : "fewer" };
    for (let k = 0; k < b.n; k++) if (before[a.at + 4 + k] !== now[b.at + 4 + k]) return { id, how: "moved" };
  }
  for (const id of A.keys()) if (!B.has(id)) return { id, how: "gone" };
  return null;
}
