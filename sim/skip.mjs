// Water that's more than a penalty (docs/PHYSICS-PLAN.md phase 4; the
// owner: "rare bonus"): a ball coming in low and fast can skip off the
// water once - or now and then twice - before it sinks, losing most of its
// pace each time. Skipping across a pond onto the green should be a rare
// miracle, never a plan. Pure: courseplay.mjs bounces it.

const smooth = (t) => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

// most: the chance at its best (a flat, fast skimmer); none coming in
// steeper than `steep` degrees or slower than `speed` m/s.
export const SKIP = { most: 0.3, steep: 10, speed: 20 };

// The chance a ball skips, coming down at `steep` degrees and `speed` m/s
// onto water, on its `nth` touch of water (0 the first): each skip after
// the first a third as likely.
export function skipChance(steep, speed, nth = 0) {
  return SKIP.most * smooth((SKIP.steep - steep) / 6) * smooth((speed - SKIP.speed) / 15) * (1 / 3) ** nth;
}

// The water's "ground" for a skip: it gives back a little of the drop and
// keeps a little over half of the pace along it; spin can't grip.
export const WATER_SKIP = { restitution: 0.35, tangentialKeep: 0.6, steepLoss: 1.2, spinBite: 0, rollDecel: 30 };
