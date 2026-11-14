// A range board fading as the chase camera comes near (Range.fadeBoards):
// `a` from 1 (solid) to 0 (gone). Only how it looks changes - its shadow
// stays on the ground throughout, as the owner asked: a board that stopped
// casting, and started again, had the sun's whole shadow map drawn twice a
// shot (look/shadowwatch.js redraws when the casters change), about 610k
// triangles each time, for a shadow nobody watches while the camera is
// looking at where the ball came down.
//
// So the board is never hidden and never stops casting: gone, it's drawn
// with nothing written (no colour, no depth), which the shadow pass
// ignores - it draws casters with a depth material of its own.

export function fadeBoard(board, a) {
  if (board.userData.fade === a) return;
  board.userData.fade = a;
  board.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      m.transparent = a < 1;
      m.opacity = a;
      m.colorWrite = a > 0;
      m.depthWrite = a === 1;
    }
  });
}
