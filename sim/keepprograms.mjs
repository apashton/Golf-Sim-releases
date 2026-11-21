// Every shader program built stays on the graphics card for the life of
// the page (the owner: "some shaders could stay loaded"). three.js frees a
// program once no material uses it, so a hole's own materials, freed with
// the hole, let their programs go - and the next hole, or the next green
// (its slope shading has a material of its own), built the same program
// again: a freeze of up to a few seconds on a Windows card as the card
// compiled it and drew it for the first time (a report: the green's
// shading shader built again two minutes after it was first built, 2.9 s
// stood still). Now each program, once built, is counted as used once more
// than it is, so the count never reaches nought and three.js never frees
// it: a program's cost is paid once a session, whichever hole or green
// asks for it next. A few hundred programs at most, small beside a hole.
// Pure: given the renderer's own list, it marks what's new.

// programs: renderer.info.programs (three.js's list, as it stands - it
// only grows now); kept: the programs counted already (a WeakSet). Returns
// how many were new.
export function keepPrograms(programs, kept) {
  if (!Array.isArray(programs) || !kept) return 0;
  let n = 0;
  for (const p of programs) {
    if (!p || kept.has(p)) continue;
    // (three.js: releaseProgram frees a program when --usedTimes reaches 0.)
    if (typeof p.usedTimes === "number") p.usedTimes++;
    kept.add(p);
    n++;
  }
  return n;
}
