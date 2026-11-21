// How the marks round the cup are sized (look/cupmark.js draws them): a
// soft yellow glow round its edge - brightest at the edge, fading outwards,
// so the hole itself doesn't look any bigger - at least ringPx pixels deep
// on screen however low it's seen from, gently breathing in and out
// (glowLow to glowHigh over breathe seconds); and a faint yellow
// circle closing in on the hole from 2 ft (or from further out when
// seen from far away, so it starts PULSE_START_PX pixels out) over
// PULSE_IN seconds, fading in as it starts and out as it reaches the cup,
// then a pause before the next. Pure, for the tests.

const FOOT = 0.3048;

// Radians a pixel spans, on a 1080-line picture, vertical field of view
// fovDeg.
export const radPerPixel = (fovDeg) => (2 * Math.tan(((fovDeg * Math.PI) / 180) / 2)) / 1080;

export const CUP_MARK = {
  ringColor: 0xffd84a,
  glowLow: 0.18,
  glowHigh: 0.62,
  breathe: 2.4, // seconds, dim to bright and back (the pulse's period, so the two keep time)
  ringMin: 0.06, // metres, close to
  ringPx: 10,
  ringMax: 1.2,
  pulseColor: 0xffe680,
  pulseAlpha: 0.5,
  pulseFrom: 2 * FOOT,
  pulseStartPx: 36,
  pulseMin: 0.012,
  pulsePx: 2.5,
  pulseIn: 1.6, // seconds from its start to the cup
  pulseRest: 0.8, // seconds before the next
  // Seen low along the green, a ring on it is squashed by the sine of the
  // angle it's seen at: widened by as much, down to this angle's.
  flattest: 0.12,
  // dist: camera to cup (metres); t: seconds so far; cup: its radius;
  // sinUp: the sine of the angle the camera looks down at the cup.
  look(dist, fovDeg, t, cup, sinUp = 1) {
    const squash = Math.max(this.flattest, Math.min(1, sinUp));
    const across = Math.max(0, dist) * radPerPixel(fovDeg || 45);
    const px = across / squash;
    const ringW = Math.min(this.ringMax, Math.max(this.ringMin, px * this.ringPx));
    const pulseW = Math.max(this.pulseMin, px * this.pulsePx);
    // (Its size is seen across the view, where it isn't squashed.)
    const pulseFrom = Math.max(this.pulseFrom, across * this.pulseStartPx);
    const period = this.pulseIn + this.pulseRest;
    const k = ((t % period) + period) % period;
    const glowA = this.glowLow + (this.glowHigh - this.glowLow) * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / this.breathe));
    if (k >= this.pulseIn) return { ringW, glowA, pulseW, pulseFrom, pulseR: cup, pulseA: 0 };
    const f = k / this.pulseIn;
    // Easing in: quicker far out, slowing as it closes on the cup.
    const e = 1 - (1 - f) * (1 - f);
    const pulseR = pulseFrom + (cup - pulseFrom) * e;
    const pulseA = Math.min(1, f / 0.15) * Math.min(1, (1 - f) / 0.2) * this.pulseAlpha;
    return { ringW, glowA, pulseW, pulseFrom, pulseR, pulseA };
  },
};
