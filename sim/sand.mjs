// Sand that plays like sand (docs/PHYSICS-PLAN.md phase 3; the owner, on
// plugged lies: "Rarer and setting"):
//   - a ball coming down steep and fast in a bunker can plug - half buried
//     (a fried egg) or right in - and stays where it went in; the next
//     shot from it comes out with less speed and most of its spin gone, so
//     it runs once it lands;
//   - after rain the sand is wet and firm: a ball skids on a little more,
//     plugs much less, and a splash comes out a touch hotter with less spin.
// Pure: courseplay.mjs lands and plays it, lie.mjs applies the plugged lie.

import { skyLook, cleanSky } from "./weather.mjs";

// How often balls plug: the course panel's setting (Rare the first - rarer
// than real life, the owner's choice).
export const PLUGS = {
  off: { name: "Off", most: 0 },
  rare: { name: "Rare", most: 0.15 },
  real: { name: "As often as real", most: 0.45 },
};
export const PLUG_ORDER = ["off", "rare", "real"];
export const DEFAULT_PLUGS = "rare";
export const cleanPlugs = (v) => (Object.hasOwn(PLUGS, v) ? v : DEFAULT_PLUGS);

const smooth = (t) => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

// How wet the sand is (0 - 1): the day's sky's wet (rain, showers).
export function sandWet(weather) {
  if (!weather) return 0;
  return skyLook(cleanSky(weather.sky)).wet ?? 0;
}

// The chance a ball plugs, coming down at `steep` degrees and `speed` m/s
// into sand: none from a shallow or gentle landing, most from a steep, fast
// one, much less in wet sand.
export function plugChance(steep, speed, { plugs = DEFAULT_PLUGS, wet = 0 } = {}) {
  const most = PLUGS[cleanPlugs(plugs)].most;
  if (!(most > 0)) return 0;
  return most * smooth((steep - 30) / 30) * smooth((speed - 10) / 14) * (1 - 0.6 * Math.min(1, Math.max(0, wet)));
}

// Which kind of plug, for a landing that has: right in (buried) from the
// steepest, fastest; otherwise half in (a fried egg).
export function plugKind(steep, speed) {
  return steep > 55 && speed > 22 ? "buried" : "egg";
}

// What a plugged lie does to the next strike, on top of the bunker's own:
// multipliers on speed and spin, degrees on the launch.
export const PLUG_EFFECT = {
  egg: { speed: 0.88, spin: 0.45, launch: -1 },
  buried: { speed: 0.75, spin: 0.25, launch: -2 },
};

// Wet sand under a splash or a picked bunker shot: a touch hotter, less
// spin (at its wettest).
export const WET_SAND = { speed: 1.06, spin: 0.82 };

// The bunker's ground when it's wet: firmer - more of the drop given back,
// more pace kept along it, a shorter roll's slowing.
export function wetSandSurface(dry, wet) {
  const k = Math.min(1, Math.max(0, wet));
  if (!(k > 0)) return dry;
  return { ...dry, restitution: dry.restitution + 0.05 * k, tangentialKeep: dry.tangentialKeep + 0.15 * k, steepLoss: dry.steepLoss - 0.15 * k, rollDecel: dry.rollDecel * (1 - 0.3 * k) };
}

// The lie guide's words for a plugged ball.
export const PLUG_WORDS = {
  egg: "Plugged - a fried egg: it'll come out low with little spin, and run",
  buried: "Plugged right in: well short, almost no spin, and it'll run",
};
