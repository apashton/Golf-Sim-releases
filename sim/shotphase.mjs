// Where a shot is up to, for the recording: before it (address), in the
// air (flight), or just after it (after) - so a layer can be shown only
// at one of those times (the flight path while the ball flies, the numbers
// once it's down, a camera big at address), and a scene can change for
// the flight and back (sim/videoscenes.mjs).
//
//   address  no shot yet, or long enough after the last one
//   flight   from the shot arriving until the ball has landed and run out
//            (its hang time, plus ROLL seconds, at least MIN_FLIGHT)
//   after    AFTER seconds once it's down, then address again
//
// A putt (no flight) is "after" for AFTER seconds straight away. Pure, for
// the compositor (compositor.js) and the tests.

export const PHASES = ["address", "flight", "after"];
export const MIN_FLIGHT = 1.5; // seconds
export const ROLL = 1.5; // seconds after landing still counted as the flight
export const AFTER = 8; // seconds the after-shot phase lasts
export const FADE = 0.35; // seconds a layer takes to fade in or out

// When a layer is shown: always, or only at one time of the shot.
export const WHEN = ["always", "address", "flight", "after", "shot"];
export const WHEN_NAMES = {
  always: "Always",
  address: "Before the shot",
  flight: "While it flies",
  after: "After it lands",
  shot: "From the hit until after",
};

// The flight's length (s) for a shot: its hang time and roll, or none.
export function flightSeconds(shot) {
  const hang = shot?.flight?.hangTime;
  if (!(typeof hang === "number" && hang > 0)) return 0;
  return Math.max(MIN_FLIGHT, hang + ROLL);
}

// shot: { at (ms, when it arrived), flight: { hangTime } | null }; now (ms).
//   -> { phase, since (s into the phase), t (0 - 1 through the flight) }
export function shotPhase(shot, now) {
  // (Before it arrived: still at address.)
  if (!shot || !(typeof shot.at === "number") || now < shot.at) return { phase: "address", since: Infinity, t: 0 };
  const s = (now - shot.at) / 1000;
  const fly = flightSeconds(shot);
  if (s < fly) return { phase: "flight", since: s, t: Math.min(1, s / Math.max(0.001, shot.flight.hangTime)) };
  if (s < fly + AFTER) return { phase: "after", since: s - fly, t: 1 };
  return { phase: "address", since: s - fly - AFTER, t: 0 };
}

export const shownIn = (when, phase) => when === "always" || when === phase || (when === "shot" && phase !== "address");

// How visible (0 - 1) a layer shown `when` is at this moment: fading in
// over FADE as its time starts and out over FADE as it ends (worked out
// from a moment FADE earlier, so a change of phase fades rather than
// jumps).
export function layerAlpha(when, shot, now) {
  if (!when || when === "always") return 1;
  const cur = shotPhase(shot, now);
  const was = shotPhase(shot, now - FADE * 1000);
  const on = shownIn(when, cur.phase);
  const wasOn = shownIn(when, was.phase);
  if (on === wasOn) return on ? 1 : 0;
  // Changed within the last FADE: how far into the change.
  const into = Math.min(1, Math.max(0, cur.since / FADE));
  return on ? into : 1 - into;
}
