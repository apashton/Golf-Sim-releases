// A recording's loop length (seconds), once its end's blended into its start
// (sim/loopjoin.mjs) - done once for each recording, the first time it's
// played on a loop: the cart's rolling and motor (audio/cart.js), and the
// beds - the outdoor bed, the wind, the rain, water (audio/layers.js) - so
// none clicks where it goes round.
import { joinLoop } from "../sim/loopjoin.mjs";

const joined = new WeakMap();
export function loopLength(buf) {
  if (!joined.has(buf)) {
    const channels = Array.from({ length: buf.numberOfChannels }, (_, i) => buf.getChannelData(i));
    joined.set(buf, joinLoop(channels, buf.sampleRate) / buf.sampleRate);
  }
  return joined.get(buf);
}
