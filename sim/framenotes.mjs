// Notes on the frame being drawn, from anywhere in the game, for the long
// frames' causes (sim/longframes.mjs): what it did that could make the
// frame a long one and the main loop can't see for itself - a shot set up
// (course.js newPosition: the grass grown round the ball, the camera
// placed). Taken once a frame as its facts are gathered (app.js noteFrame),
// so each note names the frame it was made in. Pure.

const notes = new Set();

// Says the frame did `what` ("setup": a shot set up).
export function noteFrame(what) {
  notes.add(String(what));
}

// The notes made since they were last taken, and a clean slate.
export function takeFrameNotes() {
  const out = [...notes];
  notes.clear();
  return out;
}
