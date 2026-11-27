// The ground round a green, laid on a grid (course/holescenery.js
// groundSheets): finely - half a metre apart on every setting but the lowest - where
// a chip, a bunker shot or a putt is looked at closely, and no further.
// It was the whole of a 100 m square at half a metre: 80,000 triangles a
// hole, in every picture with the green in it, most of them 25 - 50 m from
// the green's middle - ground a shot's watched over from a way off, drawn
// as finely as the grass under a putt (the owner, 20 November 2026:
// "improving triangle and draw counts"). Now the fine patch is `fine`
// metres square and, round it out to the full `size`, a sheet `step` metres
// apart - still finer than the rolling ground's own sheet (1.5 - 2 m) it
// takes the place of. On the lowest setting nothing changes: its whole
// square was a metre apart already.
//
// Pure: the sizes, and where each sheet leaves off for the next.

export const GREEN_PATCH = { size: 100, fine: 50, step: 1 };

// The sheets round a green at (cx, cz), by the fine grid's spacing (`cell`:
// 0.5, or 1 on the lowest setting): the fine patch, and - where
// that's smaller than the whole square - the sheet round it.
//   [{ key, size, step }]
export function greenPatches(cell, patch = GREEN_PATCH) {
  if (!(cell < patch.step)) return [{ key: "green", size: patch.size, step: cell }];
  return [
    { key: "green", size: patch.fine, step: cell },
    { key: "greenRound", size: patch.size, step: patch.step },
  ];
}

// Whether (wx, wz) is under a square sheet `size` metres across round
// (cx, cz), a `margin` in from its edge: a coarser sheet laid under it is
// left out there (every triangle wholly inside), so the two overlap by
// that margin and no gap shows between them.
export function underPatch(cx, cz, size, margin = 1) {
  const reach = size / 2 - margin;
  return (wx, wz) => Math.abs(wx - cx) < reach && Math.abs(wz - cz) < reach;
}

// How many triangles the sheets round a green are laid as (before any is
// cut away round a bunker): the fine patch whole, the sheet round it less
// what lies wholly under the fine one.
export function greenPatchTriangles(cell, patch = GREEN_PATCH) {
  const sheets = greenPatches(cell, patch);
  const cells = (size, step) => Math.round(size / step) ** 2;
  if (sheets.length === 1) return cells(sheets[0].size, sheets[0].step) * 2;
  const [fine, round] = sheets;
  // (The round sheet's cells wholly inside the fine one's reach, a metre in.)
  const inside = Math.max(0, 2 * Math.ceil((fine.size / 2 - 1) / round.step - 1e-9) - 1) - 1;
  return (cells(fine.size, fine.step) + cells(round.size, round.step) - Math.max(0, inside) ** 2) * 2;
}
