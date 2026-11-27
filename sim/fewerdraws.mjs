// Which pieces of a built hole the phone merges into fewer draw calls
// (look/fewerdraws.js): the rules, pure, for the tests.
//
// Measured on the phone's page (Sea Links 1 from the tee, High, the
// phone's own switches): 180 draws a frame - 73 of them pieces of ground
// (over half small or middle-sized: the other holes' shapes in the crop,
// the next tee's), 11 bunkers' sand, 11 of their walls, 23 signs.

// The most corners a piece may have to be merged: bigger ones (the hole's
// own ground sheets) are drawn only when they're in view, which merging
// would lose. On a PC (pc) fewer: there the triangles drawn count as the
// draws do, and merged at the phone's size a pair of bunkers' sand, the
// cart paths and the far ground's sheets - 50,000 triangles on Golf Sim
// Links' 1st - were drawn from wherever any of each was in view, to save
// five draws.
export const PIECES = { most: 8000, pc: 2500 };

// info: { mesh, instanced, corners, materials (how many), seeThrough,
// ownData, ownDrawing, shown, morphs } - whether that piece is merged.
export function mergeable(info, most = PIECES.most) {
  return !!info.mesh && !info.instanced && info.materials === 1 && !info.seeThrough && !info.ownData && !info.ownDrawing && !!info.shown && !info.morphs && info.corners > 0 && info.corners <= most;
}
