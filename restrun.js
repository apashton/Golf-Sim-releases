// The phone's quiet-moments work run between the frames while the picture
// rests (sim/idlework.mjs RestRunner has the why): each slice its own task,
// posted through a message channel - as soon as the page is free, without
// the few milliseconds a chain of timers is held back - or a timer when it
// should wait a moment.

import { RestRunner } from "./sim/idlework.mjs";

// fn run as its own task: after ms, or (0) as soon as the page is free.
export function makeSoon() {
  const channel = new MessageChannel();
  const waiting = [];
  channel.port1.onmessage = () => waiting.shift()?.();
  return (fn, ms = 0) => {
    if (ms > 0) return void setTimeout(fn, ms);
    waiting.push(fn);
    channel.port2.postMessage(0);
  };
}

// queue: the IdleQueue; canRun(): whether the picture's resting with
// nothing moving and the page shown (app.js).
export function makeRestRunner({ queue, canRun }) {
  return new RestRunner({ queue, canRun, schedule: makeSoon() });
}
