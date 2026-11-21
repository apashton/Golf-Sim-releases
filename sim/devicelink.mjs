// A phone linked to the PC once, then kept in step by itself (the owner, 1
// November 2026: "We still don't seem to be able to share logins and stats
// between phone and PC?" - agreed: "Link once, go ahead"). The relay keeps
// a mailbox between them (relay/links.mjs), so neither has to be on when
// the other is:
//   - up: the phone's stats writes (the pocket server's outbox,
//     sim/phonesync.mjs) wait there till the PC files them in its stats
//     (server/phonelinks.mjs), as a send by code did before;
//   - down: the PC leaves its saved players, their handicaps and skill
//     points and their stats summed up (club distances, recent rounds) for
//     its phones, which take the players into their own saved players
//     (the same names: Anna on the phone is Anna on the PC) and show the
//     rest on My stats (pocket/link.js).
// Pure: the codes and links, what goes down and how it's read, merging the
// players, the words. net/devicelink.mjs does the asking.

import { readProfiles, addProfile, setProfile, isGuest, MAX_PROFILES } from "./profiles.mjs";
import { cleanHandicaps } from "./phonesync.mjs";

// ---- The code and its links ---------------------------------------------------

// A link's code: a P and five letters and numbers ("PK7-Q2M" shown).
export const readLinkCode = (code) => {
  const c = String(code ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return /^P[A-Z0-9]{5}$/.test(c) ? c : null;
};
export const showLinkCode = (code) => {
  const c = readLinkCode(code);
  return c ? `${c.slice(0, 3)}-${c.slice(3)}` : "";
};

// The relay's page the PC's QR code opens (relay/joinpage.mjs linkPage),
// and the app's own link it opens the phone app with.
export const LINK_APP_LINK = "a2golf://link/";
export function linkPageUrl(relayUrl, code) {
  const c = readLinkCode(code);
  if (!c || !relayUrl) return null;
  const base = String(relayUrl).replace(/^ws(s?):\/\//, "http$1://").replace(/\/+$/, "");
  return /^https?:\/\//.test(base) ? `${base}/p/${c}` : null;
}
export const linkAppLink = (code) => (readLinkCode(code) ? `${LINK_APP_LINK}${readLinkCode(code)}` : null);
// The page that signs a web browser in to this PC (relay/webpages.mjs
// /me): the link's code after the #, so it never goes to the server in
// the address - the page joins the link with it, as a phone does.
export function webPageUrl(relayUrl, code) {
  const c = readLinkCode(code);
  if (!c || !relayUrl) return null;
  const base = String(relayUrl).replace(/^ws(s?):\/\//, "http$1://").replace(/\/+$/, "");
  return /^https?:\/\//.test(base) ? `${base}/me#${c}` : null;
}
export function linkCodeFromLink(url) {
  const m = /^(?:a2golf:\/\/link\/|https?:\/\/[^/]+\/p\/)([A-Za-z0-9-]{6,8})\/?$/.exec(String(url ?? "").trim());
  return m ? readLinkCode(m[1]) : null;
}

// ---- What goes down to the phones ---------------------------------------------

// Well inside the relay's most for it (links.mjs DOWN_BYTES).
export const DOWN_MOST = 100 * 1024;
export const DOWN_VERSION = 1;
const ROUNDS_KEPT = 10;
const NAME = 40;
const num = (v, d = 1) => (Number.isFinite(v) ? Math.round(v * 10 ** d) / 10 ** d : null);
const clip = (s, n) => (typeof s === "string" ? s.trim().slice(0, n) : "");

// A player's stats summed up for the phone, from their My stats report
// (server/stats.mjs report): each club's carry and total, and the last few
// rounds.
export function summaryFromReport(report) {
  const clubs = (Array.isArray(report?.clubs) ? report.clubs : [])
    .filter((c) => typeof c?.club === "string" && c.n > 0)
    .map((c) => ({ club: c.club.slice(0, 12), n: c.n, carry: num(c.carry), total: num(c.total), low: num(c.low), high: num(c.high) }));
  const rounds = (Array.isArray(report?.rounds?.list) ? report.rounds.list : [])
    .slice(0, ROUNDS_KEPT)
    .map((r) => ({ t: Number.isFinite(r?.t) ? r.t : null, course: clip(r?.course, 60) || null, played: Number.isInteger(r?.played) ? r.played : null, score: Number.isFinite(r?.score) ? r.score : null, toPar: Number.isFinite(r?.toPar) ? r.toPar : null }));
  return { shots: Number.isInteger(report?.shots) ? report.shots : clubs.reduce((n, c) => n + c.n, 0), clubs, rounds };
}

// What the PC leaves for its phones: { v, pc, at, players: [{ name, hand,
// colour }], handicaps: { name: ... } (as a send by code had them:
// sim/phonesync.mjs cleanHandicaps), stats: { name: summary } } - cut
// down (the oldest rounds, then the clubs) to stay inside DOWN_MOST.
export function downFor({ pc = "PC", players = [], handicaps = {}, stats = {}, ladders = [], seasons = [], courses = [], at = Date.now() } = {}) {
  const list = readProfiles({ list: players }).list.map((p) => ({ name: p.name, hand: p.hand, colour: p.colour }));
  const names = new Set([...list.map((p) => p.name), ...Object.keys(handicaps ?? {}), ...Object.keys(stats ?? {})]);
  const down = { v: DOWN_VERSION, pc: clip(pc, NAME) || "PC", at, players: list, handicaps: cleanHandicaps(handicaps), stats: {} };
  // (For a browser signed in to this PC - its web pages: this PC's online
  // ladders, each with the key it's on them by, and its courses' holes to
  // accept a challenge on. Only the PC's own linked devices read it.)
  const l = cleanWebLadders(ladders);
  if (l.length) down.ladders = l;
  const se = cleanWebSeasons(seasons);
  if (se.length) down.seasons = se;
  const c = cleanWebCourses(courses);
  if (c.length) down.courses = c;
  for (const name of names) {
    const s = stats?.[name];
    if (s && typeof s === "object") down.stats[name] = { shots: s.shots ?? 0, clubs: s.clubs ?? [], rounds: s.rounds ?? [] };
  }
  const size = () => new TextEncoder().encode(JSON.stringify(down)).length;
  for (let keep = ROUNDS_KEPT; size() > DOWN_MOST && keep >= 0; keep--) for (const s of Object.values(down.stats)) s.rounds = s.rounds.slice(0, keep);
  if (size() > DOWN_MOST) for (const s of Object.values(down.stats)) s.clubs = [];
  return down;
}

// This PC's online ladders as its web pages need them: [{ code, key,
// name, player }] - at most 20.
export function cleanWebLadders(list) {
  return (Array.isArray(list) ? list : [])
    .filter((x) => /^L[A-Z0-9]{5}$/.test(String(x?.code ?? "")) && /^[A-Za-z0-9_-]{16,64}$/.test(String(x?.key ?? "")))
    .slice(0, 20)
    .map((x) => ({ code: x.code, key: x.key, name: clip(x.name, NAME) || "Match ladder", player: clip(x.player, NAME) }));
}
// Its seasons by post: [{ code, name, player }] - at most 20 (no keys: a
// browser only shows and links to them).
export function cleanWebSeasons(list) {
  return (Array.isArray(list) ? list : [])
    .filter((x) => /^S[A-Z0-9]{5}$/.test(String(x?.code ?? "")))
    .slice(0, 20)
    .map((x) => ({ code: x.code, name: clip(x.name, NAME) || "Season by post", player: clip(x.player, NAME) }));
}
// And its courses, to accept a challenge on: [{ id, name, holes: [[par,
// yards, si], ...] }] - the first 18 holes of at most 40.
export function cleanWebCourses(list) {
  const n = (v, lo, hi) => (Number.isFinite(v) && v >= lo && v <= hi ? Math.round(v) : null);
  return (Array.isArray(list) ? list : [])
    .filter((c) => typeof c?.id === "string" && c.id.length <= 80 && Array.isArray(c.holes) && c.holes.length >= 9)
    .slice(0, 40)
    .map((c) => ({ id: c.id, name: clip(c.name, 60) || c.id, holes: c.holes.slice(0, 18).map((h) => [n(h?.[0], 3, 6) ?? 4, n(h?.[1], 50, 800), n(h?.[2], 1, 18)]) }));
}

// What came down, made sound on the phone (null if it isn't one).
export function readDown(d) {
  if (!d || typeof d !== "object" || d.v !== DOWN_VERSION) return null;
  const players = readProfiles({ list: Array.isArray(d.players) ? d.players : [] }).list;
  const stats = {};
  for (const [name, s] of Object.entries(d.stats && typeof d.stats === "object" ? d.stats : {})) {
    if (typeof name !== "string" || !name || name.length > NAME || !s || typeof s !== "object") continue;
    stats[name] = summaryFromReport({ clubs: s.clubs, rounds: { list: s.rounds }, shots: s.shots });
  }
  return { pc: clip(d.pc, NAME) || "PC", at: Number.isFinite(d.at) ? d.at : null, players, handicaps: cleanHandicaps(d.handicaps), stats };
}

// ---- The same players on both -------------------------------------------------

// The phone's saved players with the PC's taken in: a PC player the phone
// hasn't got is added (their hand with them); one it has keeps its colour
// and takes the PC's hand. The phone's own stay. (Unchanged: the same
// object, so nothing's saved for nothing.)
export function mergeProfiles(phone, pcPlayers) {
  let p = phone;
  for (const q of pcPlayers ?? []) {
    const name = clip(q?.name, NAME);
    if (!name || isGuest(name)) continue;
    const had = p.list.find((x) => x.name === name);
    const hand = q.hand === "left" ? "left" : "right";
    if (!had) {
      if (p.list.length >= MAX_PROFILES) continue;
      p = addProfile(p, name, { hand });
    } else if (had.hand !== hand) p = setProfile(p, name, { hand });
  }
  return p;
}

// The names on the phone's writes the PC doesn't have as saved players
// (new ones made on the phone): the PC adds them.
export function newPlayers(pcPlayers, names) {
  const have = new Set((pcPlayers ?? []).map((p) => String(p?.name ?? "").toLowerCase()));
  const out = [];
  for (const n of names ?? []) {
    const name = clip(n, NAME);
    if (!name || isGuest(name) || have.has(name.toLowerCase()) || out.includes(name)) continue;
    out.push(name);
  }
  return out;
}

// ---- The words ----------------------------------------------------------------

// What a device is called on the other: its first saved player's ("Anna's
// phone", "Anna's PC"), passing over a name the game made up ("Player 1"),
// else `fallback`.
export function deviceName(players, what, fallback) {
  const first = (players ?? []).map((p) => clip(p?.name, NAME)).find((n) => n && !isGuest(n) && !/^Player \d+$/.test(n));
  return first ? `${first}'s ${what}` : fallback;
}

// "just now", "5 minutes ago", "3 hours ago", "2 days ago" (null: "not yet").
export function agoWords(t, now = Date.now()) {
  if (!Number.isFinite(t)) return "not yet";
  const s = Math.max(0, (now - t) / 1000);
  if (s < 90) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 36) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

// The phone's line about its link: { linked, pc, synced, pcSeen, waiting
// (shots not yet with the relay), state, error } -> words.
export function phoneLinkWords(v, now = Date.now()) {
  if (!v?.linked) return "Not linked to a PC yet.";
  if (v.state === "syncing") return `Linked to ${v.pc ?? "your PC"} - sending...`;
  const left = v.waiting ? ` ${v.waiting} shot${v.waiting === 1 ? "" : "s"} still to go to the PC.` : "";
  if (v.state === "failed") return `Linked to ${v.pc ?? "your PC"}, but the last try didn't get through: ${v.error ?? "no internet?"}.${left}`;
  const pcSaw = Number.isFinite(v.pcSeen) ? ` The PC last collected ${agoWords(v.pcSeen, now)}.` : "";
  return `Linked to ${v.pc ?? "your PC"} - in step ${agoWords(v.synced, now)}.${left}${pcSaw}`;
}
