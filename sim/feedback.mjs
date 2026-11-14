// Feedback from anyone who plays (the owner: a public way to report a
// problem - "Reports to Claude" needs the owner's own GitHub token). Menu
// -> System -> Feedback saves a report on the PC - the same report the
// owner's would send (electron/report.mjs), the token never in it - and
// opens the support page with the player's note filled in, where they
// post it and attach the file. Nothing is sent by the game itself.
//
// Pure: the page's address and the file's name; electron/main.mjs saves
// and opens them, public/system.js draws the part.

// Where players post: the public releases repository's issues (the code's
// own repository is private).
export const SUPPORT_REPO = "apashton/Golf-Sim-releases";
export const SUPPORT_PAGE = `https://github.com/${SUPPORT_REPO}/issues`;
// A browser's address is kept well under the length servers turn away.
export const URL_MAX = 6000;
const TITLE_MAX = 80;

// The title an issue starts with: the note's first line, cut short.
export function feedbackTitle(note) {
  const first = String(note ?? "").trim().split(/\r?\n/)[0].trim();
  if (!first) return "Feedback";
  return first.length > TITLE_MAX ? `${first.slice(0, TITLE_MAX - 3).trimEnd()}...` : first;
}

// The new-issue page, with the title and the note filled in, and where the
// saved report is to be attached from. version: "3.0.646"; file: the
// report's name, when one was saved.
export function feedbackUrl({ note = "", version = "", file = "" } = {}) {
  const text = String(note ?? "").trim();
  const tail = [
    "",
    "---",
    version ? `A-Squared Golf ${version}` : "",
    file ? `Report: drag ${file} here (it was saved on the PC and its folder opened).` : "",
  ]
    .filter((l, i) => i < 2 || l)
    .join("\n");
  const make = (body) => `https://github.com/${SUPPORT_REPO}/issues/new?${new URLSearchParams({ title: feedbackTitle(text), body }).toString()}`;
  let body = `${text}\n${tail}`;
  let url = make(body);
  // A long note is cut (the whole of it is in the saved report).
  let keep = text.length;
  while (url.length > URL_MAX && keep > 0) {
    keep = Math.max(0, keep - Math.max(50, Math.ceil((url.length - URL_MAX) / 3)));
    body = `${text.slice(0, keep).trimEnd()}...\n(the rest is in the report)\n${tail}`;
    url = make(body);
  }
  return url;
}

// The saved report's name: when it was made, so each is kept.
export function feedbackFileName(at = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `a2golf-feedback-${at.getFullYear()}-${p(at.getMonth() + 1)}-${p(at.getDate())}-${p(at.getHours())}${p(at.getMinutes())}${p(at.getSeconds())}.md`;
}

// The legal pages a player can read (public/legal/*.txt), in the order
// their buttons go.
export const LEGAL = [
  { id: "licence", file: "legal/licence.txt", name: "Licence agreement" },
  { id: "privacy", file: "legal/privacy.txt", name: "Privacy" },
  { id: "notices", file: "legal/notices.txt", name: "Third-party notices" },
  { id: "sounds", file: "soundpack/CREDITS.md", name: "Sound credits" },
];

// Keeping it from being used to spam the support page (the owner: "prevent
// spamming by a user"): a note has to say something, the same note isn't
// saved twice in a day, there's a short wait between reports, and a few a
// day at most. The game itself only opens the page - GitHub's own limits
// and the repository's moderation (interaction limits, blocking) cover
// anyone posting there by hand.
export const FEEDBACK_LIMITS = { minChars: 10, gapMs: 2 * 60 * 1000, perDay: 5, dayMs: 24 * 60 * 60 * 1000 };

// Whether a report may be saved now. state: { times: [ms...], notes: [text...] }
// from earlier ones. -> { ok } or { ok: false, why }.
export function feedbackCheck(state, note, now = Date.now(), limits = FEEDBACK_LIMITS) {
  const text = String(note ?? "").trim();
  if (text.replace(/\s+/g, " ").length < limits.minChars) return { ok: false, why: "Say a little about what happened first - a sentence is plenty." };
  const recent = (state?.times ?? []).filter((t) => now - t < limits.dayMs);
  const last = recent.length ? Math.max(...recent) : -Infinity;
  if (now - last < limits.gapMs) {
    const s = Math.ceil((limits.gapMs - (now - last)) / 1000);
    return { ok: false, why: `A report was saved a moment ago - you can save another in ${s >= 60 ? `${Math.ceil(s / 60)} min` : `${s} s`}.` };
  }
  if (recent.length >= limits.perDay) return { ok: false, why: `That's ${limits.perDay} reports today - thank you! You can send more tomorrow.` };
  const same = (state?.notes ?? []).some((n, i) => n === text && now - (state.times?.[i] ?? 0) < limits.dayMs);
  if (same) return { ok: false, why: "That note was saved already today - it's in the feedback folder." };
  return { ok: true };
}

// The state after a report is saved: only the last day's kept.
export function feedbackNoted(state, note, now = Date.now(), limits = FEEDBACK_LIMITS) {
  const keep = (state?.times ?? []).map((t, i) => [t, state?.notes?.[i] ?? ""]).filter(([t]) => now - t < limits.dayMs);
  keep.push([now, String(note ?? "").trim()]);
  return { times: keep.map(([t]) => t), notes: keep.map(([, n]) => n) };
}
