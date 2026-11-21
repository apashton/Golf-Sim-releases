// Stats from the phone to the PC (the owner, 25 October 2026: "stats need to
// save, and if range mode is used on the phone the stats need to transfer
// back to the users pc. Handicapp for a user on mobile launcher play should
// be known by the mobile app. Mobile/controller play etc is its own thing").
//
// The phone keeps what it would have sent the PC's stats (the pocket
// server's outbox: each /api/stats write - a shot, a club's data, an answer,
// a game - in order, with when it was made). Linked to the PC
// (sim/devicelink.mjs), it hands them to the relay's link mailbox a batch
// at a time; the PC collects them and files them as its own stats would
// have, at the times they were made (server/phonestats.mjs file: a shot's
// id on the phone becomes its new one for the writes that name it),
// skipping what it's filed before (each write's number on the phone), and
// leaves each player's handicaps - their real one (launch monitor play)
// and their mouse and controller ones (made-up play is its own:
// sim/madeuphcp.mjs) - which the phone keeps and plays off (the pocket
// server's /api/stats/player).
//
// Pure: the pocket server keeps the outbox, net/devicelink.mjs does the
// talking.

import { token } from "./netgame.mjs";
import { DEVICE_NAMES } from "./madeuphcp.mjs";
import { LEVELS } from "./swinglevels.mjs";
import { cleanRanks } from "./skills.mjs";

// The stats writes the phone keeps for the PC (POST /api/stats/<path>).
export const SYNC_PATHS = ["shot", "answer", "mark", "marks", "club", "power", "unplayable", "note", "game", "skills"];
// The writes that name one shot (its id: the phone's made the PC's).
const NAMES_A_SHOT = ["answer", "mark", "club", "power", "unplayable", "note"];
// The most it keeps (the oldest go first): thirty range sessions or so,
// well inside what the phone's page storage holds (about 5 MB, a write
// under 1 KB).
export const OUTBOX_MOST = 3000;
// Kept in pages of this many writes, so a shot rewrites one page, not all.
export const PAGE = 100;
// A batch's text at most (by default).
export const BATCH_CHARS = 180 * 1024;

// ---- The outbox ---------------------------------------------------------------

// The outbox in a store ({ get, set }): its head { first, next } - the
// writes it holds are numbered first to next - 1 - each kept on page
// floor(n / PAGE) as "outbox.<page>": [{ n, path, body, t }].
const pageKey = (p) => `outbox.${p}`;
export function outboxHead(store) {
  const h = store.get("outbox");
  return Number.isInteger(h?.first) && Number.isInteger(h?.next) && h.next >= h.first ? h : { first: 0, next: 0 };
}

// A write kept: { n, id } - id the shot's own on the phone ("phone-<n>")
// for a shot, which the writes that follow it name.
export function outboxAdd(store, path, body, t) {
  const head = outboxHead(store);
  const n = head.next;
  const page = Math.floor(n / PAGE);
  const list = store.get(pageKey(page)) ?? [];
  const id = path === "shot" ? `phone-${n}` : null;
  list.push({ n, path, body: id ? { ...body, phoneId: id } : body, t });
  store.set(pageKey(page), list);
  let first = head.first;
  // Too many: the oldest page goes.
  while (n + 1 - first > OUTBOX_MOST) {
    store.set(pageKey(Math.floor(first / PAGE)), null);
    first = (Math.floor(first / PAGE) + 1) * PAGE;
  }
  store.set("outbox", { first, next: n + 1 });
  return { n, id };
}

// Every write the outbox holds, oldest first.
export function outboxAll(store) {
  const head = outboxHead(store);
  const out = [];
  for (let p = Math.floor(head.first / PAGE); p * PAGE < head.next; p++) for (const e of store.get(pageKey(p)) ?? []) if (e.n >= head.first) out.push(e);
  return out;
}

// The writes up to and with n filed by the PC: gone from the outbox.
export function outboxTaken(store, n) {
  const head = outboxHead(store);
  if (!(n >= head.first)) return head;
  const first = Math.min(head.next, n + 1);
  for (let p = Math.floor(head.first / PAGE); (p + 1) * PAGE <= first; p++) store.set(pageKey(p), null);
  const keep = Math.floor(first / PAGE);
  const list = store.get(pageKey(keep));
  if (list) store.set(pageKey(keep), list.filter((e) => e.n >= first));
  const now = { first, next: head.next };
  store.set("outbox", now);
  return now;
}

// What's waiting, a player at a time: { players: [{ name, shots, games }],
// writes }.
export function outboxSummary(entries) {
  const by = new Map();
  for (const e of entries) {
    const name = typeof e.body?.player === "string" ? e.body.player : null;
    if (!name) continue;
    const row = by.get(name) ?? { name, shots: 0, games: 0 };
    if (e.path === "shot") row.shots++;
    if (e.path === "game") row.games++;
    by.set(name, row);
  }
  return { players: [...by.values()], writes: entries.length };
}

// The writes in batches, each under `chars` as text: [[entry...]].
export function outboxBatches(entries, chars = BATCH_CHARS) {
  const out = [];
  let batch = [];
  let size = 0;
  for (const e of entries) {
    const n = JSON.stringify(e).length + 1;
    if (batch.length && size + n > chars) {
      out.push(batch);
      batch = [];
      size = 0;
    }
    batch.push(e);
    size += n;
  }
  if (batch.length) out.push(batch);
  return out;
}

// This phone, as the PC knows it: an id made once and kept with the
// outbox (a phone's writes are counted by it: the PC skips what it's
// filed from it before).
export function phoneDevice(store, make = () => token(10)) {
  let d = store.get("device");
  if (typeof d !== "string" || !/^[a-z0-9]{8,40}$/.test(d)) {
    d = make();
    store.set("device", d);
  }
  return d;
}

// The outbox as the link takes it (net/devicelink.mjs PhoneLink).
export const phoneOutbox = (store) => ({ entries: () => outboxAll(store), taken: (n) => outboxTaken(store, n), device: phoneDevice(store) });

// The handicaps the PC sent back, kept with those from before (a player it
// didn't send keeps theirs).
export function keepHandicaps(store, handicaps) {
  const now = { ...(store.get("handicaps") ?? {}), ...cleanHandicaps(handicaps) };
  store.set("handicaps", now);
  return now;
}

// A handicap as it's written ("12.4", "+1.2"), or null.
export const handicapWords = (i) => (Number.isFinite(i) ? (i < 0 ? `+${Math.abs(i).toFixed(1)}` : i.toFixed(1)) : null);

// The handicaps kept, a line each: "Sam - launch monitor 12.4; Mouse,
// Amateur 18.0".
export function handicapLines(kept) {
  const lines = [];
  for (const [name, d] of Object.entries(kept ?? {})) {
    const parts = [];
    const real = handicapWords(d?.handicap?.index);
    if (real) parts.push(`launch monitor ${real}`);
    for (const [device, levels] of Object.entries(d?.madeUp ?? {})) {
      for (const [level, x] of Object.entries(levels)) {
        const w = handicapWords(x?.index);
        if (w) parts.push(`${device === "mouse" ? "Touch / mouse" : (DEVICE_NAMES[device] ?? device)}, ${LEVELS[level]?.label ?? level} ${w}`);
      }
    }
    lines.push(`${name} - ${parts.length ? parts.join("; ") : "no handicap yet (too few rounds)"}`);
  }
  return lines;
}

// ---- Filing on the PC ---------------------------------------------------------

// A write as the PC files it: the phone's shot ids in it made the PC's
// (ids: Map phone id -> PC id, from the shots filed before it), its player
// the one picked on the PC for that phone name (names: { phone: pc }).
// null if it names a shot the PC never got.
export function forPc(entry, ids, names = {}) {
  if (!SYNC_PATHS.includes(entry?.path) || !entry.body || typeof entry.body !== "object") return null;
  const body = { ...entry.body };
  delete body.phoneId;
  const player = typeof body.player === "string" ? (names[body.player] ?? body.player) : null;
  if (!player) return null;
  body.player = player;
  if (entry.path === "marks") {
    body.ids = (Array.isArray(body.ids) ? body.ids : []).map((id) => ids.get(id)).filter(Boolean);
    return body.ids.length ? body : null;
  }
  if (NAMES_A_SHOT.includes(entry.path)) {
    const id = ids.get(body.id);
    if (!id) return null;
    body.id = id;
  }
  return body;
}

// The handicaps the PC sends back, kept on the phone as the stats it would
// have answered (/api/stats/player): { handicap: { index }, madeUp } - only
// what's sound.
// (A number, or null: none yet - never 0 for none.)
const indexOf = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
export function cleanHandicaps(h) {
  const out = {};
  for (const [name, d] of Object.entries(h && typeof h === "object" ? h : {})) {
    if (typeof name !== "string" || !name || name.length > 40) continue;
    const index = indexOf(d?.handicap?.index);
    const madeUp = {};
    for (const [device, levels] of Object.entries(d?.madeUp ?? {})) {
      if (!["controller", "mouse"].includes(device) || !levels || typeof levels !== "object") continue;
      for (const [level, x] of Object.entries(levels)) {
        if (!/^[a-z]{1,12}$/.test(level)) continue;
        madeUp[device] ??= {};
        madeUp[device][level] = { index: indexOf(x?.index), rounds: Number.isInteger(x?.rounds) ? x.rounds : 0 };
      }
    }
    // And the skill points (sim/skills.mjs): what's earned and spent.
    const sk = d?.skills;
    const skills = sk && typeof sk === "object" ? { xp: Math.max(0, Number(sk.xp) || 0), ranks: cleanRanks(sk.ranks), lastRespec: Number.isFinite(sk.lastRespec) ? sk.lastRespec : null } : null;
    out[name] = { handicap: { index, rounds: Number.isInteger(d?.handicap?.rounds) ? d.handicap.rounds : 0 }, madeUp, ...(skills ? { skills } : {}) };
  }
  return out;
}
