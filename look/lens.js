// What the air and the lens show on Ultra, beyond the scene itself, set
// once a frame by look/rain.js animateRain (its own module, so the
// drawing needn't import the weather): raindrops on the camera's lens in
// heavy rain and the shimmer of hot air over the far ground
// (look/effects.js, over the finished picture), and the motes of pollen
// and dust drifting in the sunlight (look/motes.js). time: the scenery's
// clock, which stops while the picture rests.

export const lens = { rain: 0, heat: 0, sun: 1, time: 0 };

// How many drops for the rain (0 - 1): none in a shower's light rain, more
// the harder it pours.
export const lensDrops = (rain) => Math.min(1, Math.max(0, ((Number(rain) || 0) - 0.45) / 0.55));

// How much the far ground shimmers (0 - 1): on a hot, dry, bright day
// (sim/weather.mjs dryFor), none otherwise.
export const heatShimmer = (dry) => Math.min(1, Math.max(0, Number(dry) || 0));
