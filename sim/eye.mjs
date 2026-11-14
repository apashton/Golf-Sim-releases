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
