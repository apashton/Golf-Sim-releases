// The phone app's flyover films (the owner, 25 October 2026: "on mobile
// the flyover map does eventually load. But we need a custom flyover of
// each built in map already baked in. If it's a user defined map, we
// should have a generic fly over video until the real one loads"): which
// film plays behind the card before a round (course/films.js), and how
// they're made (tools/flyfilms.mjs). Pure.
//
// A course the app comes with has a film of its own, of its first hole
// looked down from the crane as the game shows it: played at once and kept
// until the round starts - the hole is built behind it for the round, and
// nothing's drawn under it. Any other course - one of the player's own -
// has the generic film, of a hole that's none of theirs, until its own
// first hole is ready to be seen; then the game's flyover of it, as on the
// PC. With no films (the PC; an app without them) the course's still, as
// ever.

// Where the app keeps them (tools/androidweb.mjs puts android/flyovers/
// there): index.json says which is whose.
export const FILMS_DIR = "/pocket/flyovers/";
// The generic film's name (and, while it's made, its course's id).
export const GENERIC_FILM = "generic";

// How a film is made: its size (the phone's picture is about 1170 x 480;
// it's stretched to cover it), the crane's way down the hole at twice its
// pace (`seconds` long), `keys` frames a second drawn and the rest made up
// to `fps` by motion interpolation, faded in and out over `fade` seconds
// so it loops softly, and how hard it's squeezed (x264's CRF).
export const FILM = { width: 1024, height: 440, seconds: 18, keys: 8, fps: 24, fade: 0.5, crf: 27 };

const FILE = /^[a-z0-9-]+\.mp4$/;

// The index as read (index.json): { films: { courseId: file }, generic:
// file or null } - only plain file names, nothing else.
export function cleanFilms(index) {
  const films = {};
  for (const [id, file] of Object.entries(index?.films ?? {})) if (typeof file === "string" && FILE.test(file)) films[id] = file;
  const generic = typeof index?.generic === "string" && FILE.test(index.generic) ? index.generic : null;
  return { films, generic };
}

// The film for the course `id` before a round: { src, own } - own, the
// course's own (kept until the round starts: the game draws nothing under
// it) - or null for none: no films at all, or the generic one once the
// course's own hole is on the screen (shown).
export function filmFor(films, id, { shown = false } = {}) {
  if (!films || !id) return null;
  const own = films.films?.[id];
  if (own) return { src: FILMS_DIR + own, own: true };
  if (films.generic && !shown) return { src: FILMS_DIR + films.generic, own: false };
  return null;
}
