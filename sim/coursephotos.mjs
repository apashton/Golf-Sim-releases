// A still of each course, shown behind the card before a round while its
// first hole is being drawn (the owner: "when picking a course ... a
// default photo that loads until any flyovers start playing. It can be a
// static saved photo until flyovers loaded"). Taken from the picture once
// the course's first hole has been flown over before (course.js), kept in
// the browser's storage, a few courses' worth - and taken again when the
// course is changed, or the game's look is (sim/lookstamp.mjs: a still from
// before a graphics change is of the old picture). Pure: which are kept,
// and which to show.

// How many are kept, how wide each is (px) and its JPEG quality: small
// enough that a handful sit in the browser's storage beside the settings.
export const PHOTOS = { max: 8, width: 640, quality: 0.7, after: 1500 };

// The list as kept, made sensible: [{ id, updated, look, at, data }],
// newest first.
export function cleanPhotos(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list
    .filter((p) => p && typeof p.id === "string" && typeof p.data === "string" && p.data.startsWith("data:image/") && !seen.has(p.id) && seen.add(p.id))
    .map((p) => ({ id: p.id, updated: p.updated ?? null, look: typeof p.look === "string" ? p.look : null, at: Number.isFinite(p.at) ? p.at : 0, data: p.data }))
    .sort((a, b) => b.at - a.at)
    .slice(0, PHOTOS.max);
}

// The list with a course's new still in it (in place of its old one), the
// oldest dropped past the most kept.
export function keepPhoto(list, photo) {
  return cleanPhotos([photo, ...cleanPhotos(list).filter((p) => p.id !== photo.id)]);
}

// What to show for a course: its own still ({ data, own: true, current }
// - current when it's of the course as it is now, not before an edit), or
// else the newest of another's (own: false), or null - the plain picture
// the card has drawn over it then. Only stills in the game's look now
// (look: sim/lookstamp.mjs LOOK): one from before a graphics change shows
// the old picture.
export function photoFor(list, id, updated = null, look = null) {
  const all = cleanPhotos(list).filter((p) => p.look === look);
  const own = all.find((p) => p.id === id);
  if (own) return { data: own.data, own: true, current: own.updated === updated };
  return all[0] ? { data: all[0].data, own: false, current: false } : null;
}

// Whether to take a new still of a course: none of it yet, or one of it
// from before it was changed, or from before the game's look did.
export function wantPhoto(list, id, updated = null, look = null) {
  const p = photoFor(list, id, updated, look);
  return !p?.own || !p.current;
}
