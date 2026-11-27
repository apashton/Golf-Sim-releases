// Long frames, and what happened in them: a frame that takes far longer
// than the rest shows as a freeze, however good the average. Each is kept
// with what the game did in the frame before it (the work a long gap is
// waiting on): shaders built, pictures and shapes sent to the graphics
// card, the shadow map drawn again, trees switched near and far, a camera
// cut or a new scene, the picture resized by the safety valve, and how long
// the game's own update and drawing took.
// A long frame with none of those, and little time in the game's own work,
// was outside the game: the browser, Windows or the graphics card catching
// up. For a report (electron/report.mjs), so the cause of a stutter on a
// real PC can be found rather than guessed. Pure: given numbers, it keeps
// and words them.

import { ownWorkWords } from "./frameparts.mjs";

// Longer than this is a long frame: six frames at 60 a second, a visible
// stutter.
export const LONG_MS = 100;
// How many are kept (the latest), and how many causes are counted for.
export const KEEP = 60;
// Longer than this, while the window was hidden or minimised, isn't a long
// frame but a stop (sim/framerate.mjs GAP_MS). With the window showing it's
// a freeze, and kept as one: those are what the owner sees ("freezes where
// the webcams would pause"), and they were left out.
export const STOP_MS = 1000;
// The game's own work (update and drawing) under this much of a long frame
// leaves the rest outside it.
export const OWN_SHARE = 0.5;
// The quiet moments' work is named when it took this much of a frame (ms).
export const IDLE_MS = 50;

// The facts of one frame, as the main loop gathers them:
//   shaders     shader programs built in it, as names (shaderName)
//   textures    pictures sent to the graphics card in it
//   geometries  shapes sent to it
//   shadows     the sun's shadow map drawn again
//   trees       trees switched between near and far
//   cut         a camera cut; scene: a new scene (a mode or a hole)
//   resized     the 3D picture resized by the safety valve, to this share
//               of its pixels (look/renderscale.js); 0 when it wasn't
//   firstDraws  shaders drawn for the first time by the quiet moments' work
//               (look/gpuprep.js): the card finishes building one as it's
//               first drawn, a hold
//   idle        ms in the quiet moments' work (sim/idlework.mjs): part of
//               the update, said on its own when it's much - with its
//               slowest step (idleStep: { id, what, ms }) named
//   update      ms in the game's own update; draw: ms in drawing it
//   notes       what else the game said the frame did (sim/framenotes.mjs):
//               "setup" - a shot set up (course.js newPosition)
//   parts       ms in each part of the update (sim/frameparts.mjs: the
//               mode's own step, the sound, the recording's picture ...);
//               steps: the course's own steps; layout: ms of page layout
//               forced mid-script - named when they took the time
// What happened, in words, from those facts.
export const NOTE_WORDS = { setup: "a shot set up (the grass grown round the ball, the camera placed)" };
export function frameCauses(f = {}) {
  const out = [];
  const shaders = Array.isArray(f.shaders) ? f.shaders : [];
  if (shaders.length) {
    const names = [...new Set(shaders.map((s) => String(s || "unnamed")))];
    out.push(`${shaders.length} new ${shaders.length === 1 ? "shader" : "shaders"} (${names.slice(0, 4).join(", ")}${names.length > 4 ? ", ..." : ""})`);
  }
  if (f.textures > 0) out.push(`${f.textures} ${f.textures === 1 ? "picture" : "pictures"} sent to the card`);
  if (f.geometries > 0) out.push(`${f.geometries} new ${f.geometries === 1 ? "shape" : "shapes"} sent to the card`);
  if (f.shadows) out.push("shadow map drawn again");
  if (f.trees > 0) out.push(`${f.trees} trees switched near/far`);
  if (f.resized > 0) out.push(`picture resized to ${Math.round(f.resized * 100)}%`);
  if (f.firstDraws > 0) out.push(`${f.firstDraws} ${f.firstDraws === 1 ? "shader" : "shaders"} drawn for the first time`);
  if (f.idle >= IDLE_MS) out.push(`${Math.round(f.idle)} ms in the quiet moments' work${idleStepWords(f.idleStep)}`);
  out.push(...ownWorkWords({ parts: f.parts, steps: f.steps, layout: f.layout }));
  for (const n of Array.isArray(f.notes) ? f.notes : []) out.push(NOTE_WORDS[n] ?? String(n));
  if (f.scene) out.push("new scene");
  else if (f.cut) out.push("camera cut");
  return out;
}

// The quiet moments' jobs, in words (sim/idlework.mjs ids).
export const JOB_WORDS = {
  "next-hole": "building the next hole",
  "idle-hole": "building the course's first hole",
  "idle-warm": "drawing the first hole's shaders",
  "challenges-preview": "building the Challenges' scenery",
  "send-new": "sending new shapes to the card",
  "hole-grass": "the grass across the hole",
};
// The frame's slowest step of that work ({ id, what, ms }: IdleQueue
// takeSlowest), as " (building the next hole - building the trees, 900
// ms)", or "" for none.
export function idleStepWords(step) {
  if (!step || !step.id) return "";
  const job = JOB_WORDS[step.id] ?? String(step.id);
  const what = step.what ? ` - ${String(step.what).slice(0, 80)}` : "";
  return ` (${job}${what}, a step of ${Math.round(Number(step.ms) || 0)} ms)`;
}

// A shader's name for the log: its own key's leading words where it has
// one ("tracer-v3-0.0045-..." is "tracer"), else the kind of material.
export function shaderName(program = {}) {
  const key = String(program.cacheKey ?? "");
  const own = /(?:^|[,|])([a-z][a-z-]*?)-v\d+/.exec(key);
  if (own) return own[1];
  return String(program.type || program.name || "unnamed");
}

export class LongFrames {
  constructor({ longMs = LONG_MS, keep = KEEP, stopMs = STOP_MS } = {}) {
    Object.assign(this, { longMs, keep, stopMs });
    this.list = [];
    this.counts = new Map();
    this.total = 0;
    this.last = null;
  }

  // Each frame, as it starts (time: the animation loop's ms), with the
  // facts of the frame before it (the work this gap was waiting on) and
  // where it was: view (sim/framerate.mjs VIEWS), at (the wall clock, ms).
  // Returns the entry when the gap was long, else null.
  // hidden: the window was hidden since the frame before (a long gap is
  // then a stop, not a freeze).
  frame(time, facts = {}, { view = null, at = null, hidden = false } = {}) {
    const last = this.last;
    this.last = time;
    if (last === null || !Number.isFinite(time)) return null;
    const ms = time - last;
    if (!(ms > this.longMs) || (ms > this.stopMs && hidden)) return null;
    const causes = frameCauses(facts);
    const own = (Number(facts.update) || 0) + (Number(facts.draw) || 0);
    if (!causes.length && own < ms * OWN_SHARE) causes.push("outside the game's own code (the graphics card catching up, the browser or Windows)");
    const entry = { at, view, ms: Math.round(ms), ...(ms > this.stopMs ? { freeze: true } : {}), update: Math.round(Number(facts.update) || 0), draw: Math.round(Number(facts.draw) || 0), causes };
    this.total++;
    this.list.push(entry);
    if (this.list.length > this.keep) this.list.shift();
    for (const c of causes) {
      const kind = causeKind(c);
      this.counts.set(kind, (this.counts.get(kind) ?? 0) + 1);
    }
    return entry;
  }

  // Drawing starts again after a pause (the picture resting while nothing
  // moved): the gap before the next frame isn't a long frame.
  restart() {
    this.last = null;
  }

  // For a report: { total, counts: [[kind, n], ...] most first, latest:
  // [entries] oldest first }.
  report() {
    return {
      total: this.total,
      counts: [...this.counts].sort((a, b) => b[1] - a[1]),
      latest: this.list.slice(),
    };
  }
}

// A cause without its numbers, for counting: "3 new shaders (tracer)" is
// "new shaders".
export function causeKind(cause) {
  const c = String(cause);
  if (/new shader/.test(c)) return "new shaders";
  if (/sent to the card/.test(c)) return /picture/.test(c) ? "pictures sent to the card" : "shapes sent to the card";
  if (/trees switched/.test(c)) return "trees switched near/far";
  if (/drawn for the first time/.test(c)) return "shaders drawn for the first time";
  if (/quiet moments' work/.test(c)) return "quiet moments' work";
  if (/in the game's own work/.test(c)) return "the game's own work";
  if (/page's layout/.test(c)) return "page layout";
  if (/^a shot set up/.test(c)) return "shot set up";
  if (/^picture resized/.test(c)) return "picture resized";
  if (/^outside/.test(c)) return "outside the game";
  return c;
}
