// The golfer's view at address (the owner, 20 October 2026: "The general
// view is like you are very tall looking down. It is a bit odd. Can we
// adjust the player height and viewpoint"; of four views tried, "D"): the
// camera `up` metres above the ball and `back` behind it, looking along
// the aim at a spot `drop` metres below the ball's height out ahead,
// through a lens `lens` degrees high - on the course (off the green:
// course.js placeCamera) and on the range (range.js) alike, so the two
// look the same. Was 1.7 m up and 4.5 m back on the course, looking 3 m
// below the ball, with a 60° lens; 2.4 m up and 6 m back on the range,
// with a 50° one. Pure.
export const EYE = { up: 1.35, back: 3.5, drop: 0.6, lens: 55 };

// The view for a putt `distance` metres long (course.js placeCamera): low
// behind the ball - 1.3 m up, 2.6 m back, looking at the line 10 m ahead
// (or the hole, if nearer), `drop` below the ball's height - until the
// putt is a long one (PUTT_EYE.from: over 60 ft); then `rise` metres higher (to
// `most`) and `away` further back for each metre more, looking down more
// steeply with it, so the ball stays where it was in the picture (`below`
// degrees under its middle) and the hole climbs towards the top of it.
// From 1.3 m the far end of a long putt lies in a few rows of the picture
// - a 250 ft one down a double green of the real links had its last 200 ft
// in sixty rows of 1080 - and no grid can be read there (the owner: "it
// wasn't giving you the full grid all the way to the hole"); from higher it
// has the rows. The practice green's own view rises a little for a long
// putt too (putting.js placeCamera).
export const PUTT_EYE = { up: 1.3, back: 2.6, ahead: 10, drop: 0.6, from: 18.288, rise: 0.1, away: 0.1, most: 6.5 };
export function puttEye(distance) {
  const d = Math.max(0, distance || 0);
  const more = d - PUTT_EYE.from;
  if (!(more > 1e-9)) return { up: PUTT_EYE.up, back: PUTT_EYE.back, ahead: Math.min(d, PUTT_EYE.ahead), drop: PUTT_EYE.drop };
  const up = Math.min(PUTT_EYE.most, PUTT_EYE.up + PUTT_EYE.rise * more);
  const back = PUTT_EYE.back + PUTT_EYE.away * more;
  // How far under the picture's middle the ball is in the low view.
  const below = Math.atan2(PUTT_EYE.up, PUTT_EYE.back) - Math.atan2(PUTT_EYE.up + PUTT_EYE.drop, PUTT_EYE.back + PUTT_EYE.ahead);
  const pitch = Math.atan2(up, back) - below;
  return { up, back, ahead: (up + PUTT_EYE.drop) / Math.tan(pitch) - back, drop: PUTT_EYE.drop };
}
