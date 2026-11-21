// Powers ("mod swings") in the stats: a power said after the shot, read as
// the file is read; each club's carry at each power for My stats; and the
// card that asks when a shot looks like another power ("That felt like a
// 50% swing?"). The rule for what a power makes of a swing is power.mjs's.
//
// Pure, so the server (which keeps the shots) and the tests share one copy.

import { median, robustSpread, quantile, live, removed, waiting, saidSwing, STRIKES, SPECIALS, CLUB_ORDER } from "./shotstats.mjs";
import { powerSwing, powerOf, cleanPower } from "./power.mjs";

// ---- A power said after the shot ------------------------------------------------------

// What the player says about a shot's swing: a strike (a normal full swing
// after all) or a special shot - as against "misread" or "keep", which
// don't say what the swing was.
const aboutSwing = (q) => q === "good" || STRIKES.includes(q) || SPECIALS.includes(q);

// The swing a shot is read as from the one it was recorded with (rsw),
// what the player last said about it (my, applySay) and its power (pw),
// whichever of those two was said last deciding (by). A power works on the
// swing the shot would have been without one (bsw, kept when a power said
// before the shot changed it).
function reread(s) {
  if (!("rsw" in s)) {
    s.rsw = s.sw;
    s.rsp = s.sp;
  }
  s.sw = s.by === "my" && aboutSwing(s.my) ? saidSwing(s.rsw, s.my) : powerSwing(s.bsw ?? s.rsw, s.pw);
  const sp = s.sw !== "special" ? undefined : s.my === "punch" || s.my === "other" ? s.my : (s.rsp ?? "other");
  if (sp) s.sp = sp;
  else delete s.sp;
  return s;
}

// A power said about a shot after it was hit (server/stats.mjs's power
// lines, as the file is read): 10 - 100, "auto" to go back to the power it
// was recorded with (none, usually), or "none" for no power at all (the
// swing it would have been without one). The latest thing said about the
// swing wins: a power after "punch" makes it a part swing at that power,
// "thin" after a power a full swing again. Changes the shot.
export function applyPower(s, pw) {
  if (!("rpw" in s)) s.rpw = Number.isFinite(s.pw) ? s.pw : null;
  const clean = cleanPower(pw);
  if (pw === "none") {
    delete s.pw;
    s.by = "pw";
  } else if (clean == null) {
    if (s.rpw == null) delete s.pw;
    else s.pw = s.rpw;
    s.by = "my";
  } else {
    s.pw = clean;
    s.by = "pw";
  }
  return reread(s);
}

// After a say (shotstats.mjs's applySay, which reads the swing without a
// power): a say about the swing is now the latest word on it, and a power
// said since still counts otherwise. Changes the shot.
export function afterSay(s, q) {
  if (aboutSwing(q) || q === "auto") s.by = "my";
  return reread(s);
}

// ---- Each club's carry at each power ------------------------------------------------

const r1 = (v) => (Number.isFinite(v) ? Math.round(v * 10) / 10 : null);
const usable = (s) => !removed(s) && !waiting(s) && s.m !== "calibration" && s.r && Number.isFinite(s.r.carry);

// For My stats: each club's part swings, chips and pitches at each power
// said - how many, how far they carry (typical, and the middle 80%), and
// how many were chips or pitches. Kept apart from the club's full swings,
// as every part swing is. [{ club, pw, n, chips, carry, low, high }]
export function powerSwings(shots) {
  const list = live(shots).filter((s) => usable(s) && powerOf(s) != null);
  const out = [];
  for (const club of CLUB_ORDER) {
    const mine = list.filter((s) => s.c === club);
    for (const pw of [...new Set(mine.map(powerOf))].sort((a, b) => a - b)) {
      const at = mine.filter((s) => powerOf(s) === pw);
      const carries = at.map((s) => s.r.carry);
      out.push({ club, pw, n: at.length, chips: at.filter((s) => s.sw !== "partial").length, carry: r1(median(carries)), low: r1(quantile(carries, 0.1)), high: r1(quantile(carries, 0.9)) });
    }
  }
  return out;
}

// ---- "That felt like a 50% swing?" ------------------------------------------------

// When a chip or part swing is asked about, all in yards against a power's
// own carries with the club (its latest `recent`, the player's current
// touch):
//   minShots     a power is only known from 5 shots of it with the club - a
//                median of five is steady to about half a spread, and with
//                fewer one mishit would decide it. Never asked without them.
//   spread       a power's spread is its robust spread (one wild shot can't
//                blow it up), but at least spreadFloor (1.5 yds) and
//                spreadShare (8%) of its carry: good players' chips with one
//                club and one length of swing scatter 5 - 10%, and five
//                lucky shots in a row mustn't make every later one look
//                wrong.
//   fitSpreads   a carry within 1.5 spreads of a power's middle fits it -
//                about 87% of that power's own shots do.
//   missSpreads  a carry 3 spreads or more from the power said doesn't fit
//                it: a real 50% swing lands that far from its middle about
//                one time in 400, so a shot really hit at the power said is
//                next to never questioned.
// Said at a power (anywhere: range, course, chipping, challenges): asked
// when another known power fits (fitSpreads) and the one said, known too,
// clearly doesn't (missSpreads).
// Not said, on the chipping green only: a chip or pitch is asked about when
// it fits one part power, and only one (two that fit can't be told apart),
// and is well outside the club's usual chip - its chips there with no power
// said, at least minShots of them: usualSpreads (3) of their spread away,
// and fitting the power at least twice as well. The usual chips go to
// every distance on the green, so their spread is wide: this only asks
// when a chip is plainly longer (or shorter) than anything the player
// normally hits with that club.
export const MODSWING = Object.freeze({
  minShots: 5,
  recent: 40,
  spreadFloor: 1.5,
  spreadShare: 0.08,
  fitSpreads: 1.5,
  missSpreads: 3,
  usualSpreads: 3,
});

function norm(carries) {
  const m = median(carries);
  const s = Math.max(MODSWING.spreadFloor, MODSWING.spreadShare * m, robustSpread(carries) || 0);
  return { n: carries.length, m, s, lo: quantile(carries, 0.1), hi: quantile(carries, 0.9) };
}

// A club's latest carries at each power said: Map pw -> carries, newest
// first.
function carriesByPower(history, club) {
  const by = new Map();
  for (let i = history.length - 1; i >= 0; i--) {
    const s = history[i];
    if (s.c !== club || !usable(s)) continue;
    const pw = powerOf(s);
    if (pw == null) continue;
    const list = by.get(pw) ?? [];
    if (list.length < MODSWING.recent) list.push(s.r.carry);
    by.set(pw, list);
  }
  return by;
}

// Each power the player has enough of with the club: Map pw -> { pw, n, m,
// s, lo, hi }.
export function powerNorms(history, club) {
  const out = new Map();
  for (const [pw, carries] of carriesByPower(history, club)) if (carries.length >= MODSWING.minShots) out.set(pw, { pw, ...norm(carries) });
  return out;
}

// The club's usual chip on the chipping green: its chips and pitches there
// with no power said. null with fewer than minShots.
export function usualChip(history, club) {
  const carries = [];
  for (let i = history.length - 1; i >= 0 && carries.length < MODSWING.recent; i--) {
    const s = history[i];
    if (s.c === club && s.m === "chipping" && (s.sw === "chip" || s.sw === "pitch") && !Number.isFinite(s.pw) && usable(s)) carries.push(s.r.carry);
  }
  return carries.length >= MODSWING.minShots ? norm(carries) : null;
}

// After a chip or part swing: ask whether it was another power? (See
// MODSWING.) Returns { ask, said, club, carry, norms, usual } - ask the
// power it fits (lit on the card), said the power recorded (null: none),
// norms each known power's { pw, n, m, lo, hi }, usual the usual chip's
// { n, m } when that's what it was compared with - or null.
//   shot: { club, carry, sw, pw, mode }   history: the player's shots before it
export function modSwingPrompt(shot, history) {
  const { club, carry, sw, mode } = shot;
  if (!Number.isFinite(carry) || mode === "calibration" || !["partial", "chip", "pitch"].includes(sw)) return null;
  const said = cleanPower(shot.pw);
  const norms = powerNorms(history, club);
  if (!norms.size) return null;
  const U = MODSWING;
  const z = (n) => Math.abs(carry - n.m) / n.s;
  const ranked = [...norms.values()].map((n) => ({ ...n, z: z(n) })).sort((a, b) => a.z - b.z);
  let fit;
  let usual = null;
  if (said != null) {
    const mine = norms.get(said);
    fit = ranked.find((n) => n.pw !== said);
    if (!mine || !fit || fit.z > U.fitSpreads || z(mine) < U.missSpreads) return null;
  } else {
    if (mode !== "chipping" || (sw !== "chip" && sw !== "pitch")) return null;
    const part = ranked.filter((n) => n.pw < 100);
    fit = part[0];
    if (!fit || fit.z > U.fitSpreads || (part[1] && part[1].z <= U.fitSpreads)) return null;
    usual = usualChip(history, club);
    if (!usual) return null;
    const zu = Math.abs(carry - usual.m) / usual.s;
    if (zu < U.usualSpreads || fit.z * 2 > zu) return null;
  }
  return {
    ask: fit.pw,
    said,
    club,
    carry: r1(carry),
    norms: [...norms.values()].sort((a, b) => a.pw - b.pw).map((n) => ({ pw: n.pw, n: n.n, m: r1(n.m), lo: r1(n.lo), hi: r1(n.hi) })),
    usual: usual ? { n: usual.n, m: r1(usual.m) } : null,
  };
}
