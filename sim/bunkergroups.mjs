// Shapes lying near each other, in groups: on a hole from a map, its walled
// bunkers (course.js buildMappedGround) - those whose ground overlaps
// sharing one patch of fine ground round them and one sand (one field
// round them all: sim/edgefield.mjs patchField, whose every spot is
// measured to every outline - grouped wider, bunkers metres apart, the
// fields took longer than everything else the hole's ground did).
//
// Pure: plain boxes in, groups of their indices out.

// Boxes ({ x0, z0, x1, z1 }) that overlap - or come within `gap` metres of
// each other - in one group, so long as its box stays no more than `most`
// metres a side (one sand's field keeps its fine grid that way: sim/
// edgefield.mjs maxCells). Every box in exactly one group; the groups in
// the order of their first box, each { members: [indices, in order], box }.
export function nearGroups(boxes, { gap = 0, most = 40 } = {}) {
  const meets = (a, b) => a.x0 - gap <= b.x1 && a.x1 + gap >= b.x0 && a.z0 - gap <= b.z1 && a.z1 + gap >= b.z0;
  const union = (a, b) => ({ x0: Math.min(a.x0, b.x0), z0: Math.min(a.z0, b.z0), x1: Math.max(a.x1, b.x1), z1: Math.max(a.z1, b.z1) });
  const fits = (u) => u.x1 - u.x0 <= most + 1e-9 && u.z1 - u.z0 <= most + 1e-9;
  let groups = [];
  boxes.forEach((b, i) => {
    const into = groups.find((g) => meets(g.box, b) && fits(union(g.box, b)));
    if (into) {
      into.members.push(i);
      into.box = union(into.box, b);
    } else groups.push({ members: [i], box: { x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1 } });
  });
  // Groups grown to meet each other, joined while they still fit.
  for (let joined = true; joined; ) {
    joined = false;
    for (let i = 0; i < groups.length && !joined; i++) {
      for (let j = i + 1; j < groups.length && !joined; j++) {
        const u = union(groups[i].box, groups[j].box);
        if (!meets(groups[i].box, groups[j].box) || !fits(u)) continue;
        groups[i] = { members: [...groups[i].members, ...groups[j].members].sort((a, b) => a - b), box: u };
        groups = groups.filter((_, k) => k !== j);
        joined = true;
      }
    }
  }
  return groups;
}
