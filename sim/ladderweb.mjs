// What a browser signed in to this PC needs of its ladders and courses
// (course/ladderweb.js, relay/webpages.mjs): this PC's online ladders, each
// with the key it's on them by, and each course's first holes to accept a
// challenge on. And the words when ladders joined in a browser come in.
// Pure.

// This PC's online ladders: [{ code, key, name, player }].
export function webLadders(list) {
  return (list ?? [])
    .filter((L) => L?.online?.code && L.online.key)
    .map((L) => ({ code: L.online.code, key: L.online.key, name: L.name, player: L.online.me?.name ?? "" }));
}

// A course as the server keeps it, for a browser: { id, name, holes: [[par,
// yards, si], ...] } - its first 18 holes; null with fewer than nine.
export function webCourse(course) {
  const holes = Array.isArray(course?.holes) ? course.holes : [];
  if (typeof course?.id !== "string" || holes.length < 9) return null;
  return {
    id: course.id,
    name: String(course.name ?? course.id).slice(0, 60),
    holes: holes.slice(0, 18).map((h) => {
      const s = h?.spec ?? h ?? {};
      return [s.par ?? 4, Number.isFinite(s.yards) ? Math.round(s.yards) : null, Number.isFinite(s.si) ? s.si : null];
    }),
  };
}

// Ladders joined in a browser, now on this PC.
// (tab: where they are - "Ladders", or "Seasons" for seasons by post.)
export function inboxWords(names, tab = "Ladders") {
  const list = names.length > 2 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names.join(" and ");
  return `Joined on the web: ${list} - ${names.length === 1 ? "it's" : "they're"} on the Online tab's ${tab}`;
}
