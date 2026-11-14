// The update log (public/changelog.json): what changed in each version, in
// words a player reads, newest first, from version 3. Changes merged since
// the last release wait under "unreleased"; the Windows app build
// (tools/changelog.mjs release, run by windows-app.yml) turns them into the
// new version's entry. CHANGELOG.md is written from the same file.
//
// A log: { unreleased: [note], versions: [{ version, date, notes, prs?,
// stable?, versions?, archived? }] } - an entry with versions[] is a group
// of older betas ("3.0.427 - 3.0.440"), each still findable by number.

export const NO_NOTES = "Small fixes and improvements behind the scenes.";

const parts = (v) => String(v).replace(/^v/, "").split(/[.-]/).map((n) => parseInt(n, 10) || 0);

// Is version a newer than b (3.0.10 > 3.0.9)?
export function newer(a, b) {
  const x = parts(a);
  const y = parts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  return false;
}

// The entry that covers a version (its own, or its group's), or null.
export function entryFor(log, version) {
  const v = String(version ?? "").replace(/^v/, "");
  return log.versions.find((e) => e.version === v || e.versions?.includes(v)) ?? null;
}

// Every version the log names, one each, newest first.
export function allVersions(log) {
  return log.versions.flatMap((e) => e.versions ?? [e.version]).sort((a, b) => (newer(a, b) ? -1 : newer(b, a) ? 1 : 0));
}

// The log with its unreleased notes made into version's entry (at the top),
// and unreleased emptied. A build with no notes says so plainly, rather
// than inventing any. Building a version again leaves the log as it is, and
// a note an earlier version already has is left out (in case main's file
// wasn't given back its moved notes after the last build).
export function release(log, version, date = new Date().toISOString().slice(0, 10)) {
  const v = String(version).replace(/^v/, "");
  if (!/^\d+\.\d+\.\d+$/.test(v)) throw new Error(`Not a release version: ${version}`);
  if (entryFor(log, v)) return log;
  const had = new Set(log.versions.flatMap((e) => e.notes));
  const notes = (log.unreleased ?? []).map((n) => String(n).trim()).filter((n) => n && !had.has(n));
  return { ...log, unreleased: [], versions: [{ version: v, date, notes: notes.length ? notes : [NO_NOTES] }, ...log.versions] };
}

// What the What's new screen shows: unreleased (a build from source, not a
// release) only when asked, then every entry; the current version's entry
// marked and open (the newest is open when the version isn't in the log).
export function history(log, current = "", { unreleased = false } = {}) {
  const here = entryFor(log, current);
  const first = here ?? log.versions[0];
  const out = log.versions.map((e) => ({
    title: e.versions ? `Versions ${e.version}` : `Version ${e.version}`,
    date: e.date,
    notes: e.notes,
    stable: !!e.stable,
    archived: !!e.archived,
    versions: e.versions ?? null,
    current: e === here,
    open: e === first,
  }));
  if (unreleased && log.unreleased?.length) out.unshift({ title: "Coming in the next version", date: "", notes: log.unreleased, stable: false, archived: false, versions: null, current: false, open: true });
  return out;
}

// Should the What's new prompt show? Only after an update: a version this
// PC hasn't seen, when it has seen one before (not on a first install), and
// the log has its notes.
export function whatsNewDue(seen, version, log) {
  if (!version || !seen || seen === version) return false;
  return newer(version, seen) && !!entryFor(log, version);
}

// A version's notes as a release's text (GitHub release notes).
export function releaseText(log, version) {
  const e = entryFor(log, version);
  return e ? e.notes.map((n) => `- ${n}`).join("\n") + "\n" : "";
}

// CHANGELOG.md's text, written from the log.
export function toMarkdown(log) {
  const lines = [
    "# Update log",
    "",
    "What changed in each version of A-Squared Golf, newest first, from version 3.",
    "Written from `public/changelog.json` (`node tools/changelog.mjs md`) - edit that, not this.",
    "The game shows the same notes under Menu -> What's new.",
    "",
    "## Unreleased",
    "",
    ...(log.unreleased?.length ? log.unreleased.map((n) => `- ${n}`) : ["- (nothing yet)"]),
  ];
  for (const e of log.versions) {
    const tag = [e.date, e.stable ? "stable" : "beta", e.archived ? "no longer downloadable" : ""].filter(Boolean).join(", ");
    lines.push("", `## ${e.version} (${tag})`, "");
    if (e.versions) lines.push(`Versions: ${e.versions.join(", ")}.`, "");
    lines.push(...e.notes.map((n) => `- ${n}`));
  }
  return lines.join("\n") + "\n";
}
