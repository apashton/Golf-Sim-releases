// The kinds of sound there are recordings for, one folder each: the game's
// own (public/soundpack, licensed clips that come with it - their sources
// and licences in public/soundpack/CREDITS.md) and the owner's, added in
// the sounds folder (the Windows app's is %APPDATA%\Golf Sim\sounds).
// Shared by the server, which lists and serves the files, and the page,
// which plays them in place of (or mixed with) the synthesized sounds of the
// same kind.

export const SOUND_FAMILIES = {
  "strike-driver": "Driver and woods hitting the ball",
  "strike-iron": "Irons hitting the ball",
  "strike-wedge": "Wedges and chips",
  "strike-putter": "Putts",
  "land-grass": "The ball landing on the fairway or rough",
  "land-green": "The ball landing on a green",
  "land-sand": "The ball landing in a bunker",
  splash: "The ball going into water",
  "tree-wood": "The ball hitting a tree's trunk or a branch",
  "tree-leaves": "The ball going through a tree's leaves",
  cup: "The ball dropping into the cup",
  tee: "The ball being teed up or put down for the next shot",
  birds: "Bird calls (each file one call; they can overlap)",
  water: "Water lapping, at a pond or lake (played on a loop near it)",
  stream: "A stream babbling (played on a loop near a stream)",
  wind: "Wind (played on a loop)",
  outdoor: "A quiet, distant outdoor background (played on a loop, under the wind)",
  rain: "Rain falling (played on a loop while it rains)",
  ducks: "Ducks on a pond quacking (each file a call or two)",
  swans: "Swans on a pond: grunts and soft honks (each file a call)",
  applause: "Applause round the green (a birdie)",
  crowd: "A crowd cheering (an eagle, a new record in practice)",
  roar: "A big crowd roaring (a hole in one or an albatross)",
  cart: "A golf cart rolling along (played on a loop on the ride between holes, quietly - a touch higher and louder the faster it goes)",
  "cart-motor": "An electric golf cart's low motor hum (played on a loop under the cart's rolling, louder pulling away)",
  "cart-rattle": "Clubs rattling in a golf bag on the back of the cart (each file one rattle, played now and then on the ride)",
};
export const FAMILY_NAMES = Object.keys(SOUND_FAMILIES);

// Audio files a browser (and the Windows app) can play: .m4a is what
// Windows' Sound Recorder and most phones save. A file the browser turns
// out not to manage is listed in the Sound panel as one it couldn't play.
export const SOUND_TYPES = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
};
export const SOUND_TYPE_LIST = Object.keys(SOUND_TYPES).join(", ");

// Recordings are decoded whole to play, so a long one takes a lot of
// memory: the server leaves out files bigger than this (bytes), the page
// any that play for longer than this (seconds). A loop of 30 seconds to two
// minutes is plenty for wind or water.
export const MAX_SOUND_BYTES = 60 * 1024 * 1024;
export const MAX_SOUND_SECONDS = 180;

// Whether a file name is one of ours to serve: a plain name (no folders,
// nothing hidden) ending in a known audio type.
export function isSoundFileName(name) {
  if (typeof name !== "string" || name.length > 120) return false;
  if (/[\\/:*?"<>|\x00-\x1f]/.test(name) || name.startsWith(".")) return false;
  const dot = name.lastIndexOf(".");
  return dot > 0 && name.slice(dot).toLowerCase() in SOUND_TYPES;
}
