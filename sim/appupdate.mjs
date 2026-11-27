// The phone app telling its player a newer version is out (the owner, 4
// November 2026: "make the android app recognise and notify the user there
// is a newer update available"). The app is installed by hand from the
// stable release of the public releases repository, where the build puts
// it (android-app.yml, "share") as A-Squared-Golf-Android.apk with its
// version in the file's label ("A² Golf for Android 0.1.30-test"). As the
// app opens, and as it's brought back to the front - at most once an hour -
// it reads that release from GitHub's
// public API and, if the version there is newer than its own
// (/pocket/app.json), says so, with Download (the APK, opened in the
// phone's browser) and Later (not again for that version for a few days).
// And when it's asked (the owner, 14 November 2026: "I'm not seeing the new
// apk notice in game ... can we insert a new check for updates?"): Menu,
// Check for updates asks now, whenever it last did, shows a version put off
// with Later again, and says what it found.
//
// Pure: public/appupdate.js asks and shows it; test/appupdate.test.mjs.

export const RELEASES_API = "https://api.github.com/repos/apashton/Golf-Sim-releases/releases/latest";
export const APK_NAME = "A-Squared-Golf-Android.apk";
export const APK_URL = `https://github.com/apashton/Golf-Sim-releases/releases/latest/download/${APK_NAME}`;
// How often it asks by itself (GitHub lets each phone's address ask 60
// times an hour: once an hour, however often the app's opened, is well
// inside that), and how long Later keeps a version quiet.
export const CHECK_EVERY_MS = 60 * 60 * 1000;
export const LATER_MS = 3 * 24 * 60 * 60 * 1000;

// "0.1.29-test" -> [0, 1, 29]; null if there's no version in it.
export function versionParts(text) {
  const m = /(\d+)\.(\d+)\.(\d+)/.exec(String(text ?? ""));
  return m ? m.slice(1, 4).map(Number) : null;
}

// Whether `latest` is a newer version than `current` (their numbers; any
// "-test" after them doesn't count).
export function isNewer(latest, current) {
  const a = versionParts(latest);
  const b = versionParts(current);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

// The Android app's version on a release (GitHub's API's answer): from its
// file's label - or null when there's no app on it, or no version said.
export function apkVersion(release) {
  const asset = (release?.assets ?? []).find((a) => a?.name === APK_NAME);
  if (!asset) return null;
  const m = /(\d+\.\d+\.\d+(?:-[\w.]+)?)/.exec(String(asset.label ?? ""));
  return m ? m[1] : null;
}

// Whether to ask GitHub now: not more than once every CHECK_EVERY_MS.
export const dueToCheck = (lastChecked, now = Date.now()) => !Number.isFinite(lastChecked) || now - lastChecked >= CHECK_EVERY_MS;

// What to tell the player: { version, url } for a newer version they
// haven't put off (Later) in the last few days - else null.
// later: { version, at } - the version Later was pressed for, and when.
export function updateNotice({ current, release, later = null, now = Date.now() } = {}) {
  const version = apkVersion(release);
  if (!version || !isNewer(version, current)) return null;
  if (later?.version === version && now - (later.at ?? 0) < LATER_MS) return null;
  return { version, url: APK_URL };
}

// What a check that was asked for found, in words - null for a newer
// version (its card says it).
//   state: "newer" | "current" (this is the newest) | "none" (no app on
//   the downloads page) | "offline" (GitHub not reached, or not answering)
export function checkedWords({ state, current = null } = {}) {
  if (state === "newer") return null;
  if (state === "current") return `You have the newest A² Golf${current ? ` (${current})` : ""}.`;
  if (state === "none") return "There's no A² Golf for Android on the downloads page yet.";
  return "Couldn't reach the downloads page - check the internet and try again.";
}

// The words on the card.
export const noticeWords = ({ version, current }) => ({
  title: "A newer A² Golf is ready",
  line: `Version ${version} - you have ${current}. Download it and open the file: it installs over this one, keeping your rounds.`,
});
