// The order shapes are sent to the graphics card in (look/gpuprep.js): a
// few objects a step - but one whose shader hasn't been drawn before goes
// on its own, as a heavy step (sim/idlework.mjs HEAVY). A shader's first
// drawing holds the page while the card finishes building it: on a
// Windows card a tenth of a second for a small one, most of a second for a
// big one (grass, sand, water, a tree's crown) - so a dozen shapes with
// three or four such shaders among them held it for a second or two (a
// report, putting: seven steps of 374 - 2112 ms, one a frame). One at a
// time, in a frame that can take it (the picture resting, or behind a
// card), each is a hitch at most - and only once a session, the program
// kept (sim/keepprograms.mjs). Pure: given the objects and whether each
// one's shader is fresh, the batches in order.

// fresh(o): whether o's shader hasn't been drawn yet. Asked as each batch
// is made, not before: an object whose shader the batch before it drew
// goes with the others. Yields { objects, heavy }: heavy for a fresh
// shader's object, alone.
export function* planBatches(list, fresh, per = 12) {
  let batch = [];
  for (const o of list) {
    if (fresh(o)) {
      if (batch.length) {
        yield { objects: batch, heavy: false };
        batch = [];
      }
      yield { objects: [o], heavy: true };
      continue;
    }
    batch.push(o);
    if (batch.length >= per) {
      yield { objects: batch, heavy: false };
      batch = [];
    }
  }
  if (batch.length) yield { objects: batch, heavy: false };
}
