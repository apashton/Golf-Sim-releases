// The round card: one finished course round on one card - the scorecard
// hole by hole (out, in, total), the score against par and net of the
// course handicap, the round's handicap differential, fairways, greens and
// putts, strokes gained by part of the game, and its best shot. The same
// card at the end of a round (to save or copy as a picture), on My stats
// for any round, and in the recording's Finish scene. Pure: roundcard.js
// draws it.

import { roundDifferential, handicapHoles, STANDARD_SLOPE } from "./handicap.mjs";
import { clubName } from "./clubs.mjs";

const ORDINAL = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
const NAMES = { "-3": "albatross", "-2": "eagle", "-1": "birdie", 0: "par", 1: "bogey", 2: "double bogey" };
export const scoreName = (toPar) => NAMES[toPar] ?? (toPar < 0 ? `${-toPar} under` : `${toPar} over`);
export const signed = (v) => (!Number.isFinite(v) ? "-" : v === 0 ? "E" : v > 0 ? `+${v}` : `${v}`);
const feet = (yards) => Math.max(1, Math.round(yards * 3));

// The best shot in words: "Holed a 24 ft putt for birdie on the 7th",
// "Chipped in from 18 yds on the 12th", "7 iron from 162 yds to 4 ft on the
// 3rd", "Drive leaving 128 yds on the 14th".
export function bestShotWords(best) {
  if (!best) return "";
  const on = `on the ${ORDINAL(best.hole)}`;
  const toPar = Number.isFinite(best.score) && Number.isFinite(best.par) ? best.score - best.par : null;
  const forWhat = best.made && toPar != null ? ` for ${scoreName(toPar)}` : "";
  if (best.cat === "putting") return best.made ? `Holed a ${feet(best.d)} ft putt${forWhat} ${on}` : `A ${feet(best.d)} ft putt to ${feet(best.f)} ft ${on}`;
  const club = best.club && best.club !== "PT" ? clubName(best.club) : null;
  const from = `from ${Math.round(best.d)} yds`;
  if (best.made) return `${best.cat === "around" ? "Chipped in" : "Holed out"} ${from}${forWhat} ${on}`;
  if (best.cat === "tee") return `${club ? `${club} ` : "Drive "}leaving ${Math.round(best.f)} yds ${on}`.replace(/^Driver /, "Drive ");
  const left = best.f * 3 < 30 ? `${feet(best.f)} ft` : `${Math.round(best.f)} yds`;
  return `${club ?? (best.cat === "around" ? "Chip" : "Approach")} ${from} to ${left} ${on}`;
}

// A card from a round (roundstats.mjs roundStats, with its holes' par,
// score and length) and who played it.
//   index    the player's handicap index before the round (null: none)
//   against  who strokes gained is against, in words
//   date     when (ms); course, player: names; weather: its words
//   times    the round's clock, first tee to last hole ("11:49am - 4:19pm":
//            sim/daylight.mjs roundTimes), or null
//   swing    swung with the mouse or a controller: which, the level and
//            the handicap for it ("Controller, Pro: 2.1"; madeuphcp.mjs)
// hcp: the round's handicap numbers when they're already known ({ diff,
// net, courseHandicap }: the stats have them), instead of working them out.
export function roundCard(round, { player = null, index = null, against = "your handicap", date = round?.t ?? null, course = round?.course ?? null, weather = null, times = null, swing = null, slope = STANDARD_SLOPE, hcp: known = null } = {}) {
  const holes = (round?.holes ?? []).map((h) => ({ n: h.hole, par: h.par, score: h.score }));
  const played = holes.filter((h) => Number.isFinite(h.score));
  const sum = (list, k) => list.reduce((a, h) => a + (h[k] ?? 0), 0);
  const nine = (from, to) => {
    const list = holes.filter((h) => h.n >= from && h.n <= to);
    const done = list.filter((h) => Number.isFinite(h.score));
    return list.length ? { par: sum(list, "par"), score: done.length ? sum(done, "score") : null, played: done.length, of: list.length } : null;
  };
  const gross = played.length ? sum(played, "score") : null;
  const par = played.length ? sum(played, "par") : null;
  const hh = handicapHoles(round ?? {});
  const hcp = known ?? (hh ? roundDifferential(hh, index, { slope }) : null);
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : null);
  return {
    player,
    course,
    date,
    weather,
    times,
    swing,
    holes,
    out: nine(1, 9),
    in: holes.length > 9 ? nine(10, 18) : null,
    gross,
    par,
    toPar: gross != null && par != null ? gross - par : null,
    played: played.length,
    of: holes.length,
    courseHandicap: hcp?.courseHandicap ?? null,
    net: hcp?.net ?? null,
    diff: hcp?.diff ?? null,
    index,
    stats: round
      ? {
          fairways: round.fairways?.of ? `${round.fairways.hit}/${round.fairways.of}` : null,
          fairwayPct: pct(round.fairways?.hit, round.fairways?.of),
          greens: round.greens?.of ? `${round.greens.hit}/${round.greens.of}` : null,
          greenPct: pct(round.greens?.hit, round.greens?.of),
          putts: round.putts?.holes ? round.putts.total : null,
          upDowns: round.upDowns?.of ? `${round.upDowns.made}/${round.upDowns.of}` : null,
          penalties: round.penalties?.holes ? round.penalties.total : null,
        }
      : null,
    sg: round?.sg ? { ...round.sg, against } : null,
    best: round?.best ? { words: bestShotWords(round.best), sg: round.best.sg } : null,
    birdies: played.filter((h) => h.score - h.par <= -1).length,
    pars: played.filter((h) => h.score === h.par).length,
  };
}

// A hole's score against its par as a scorecard shows it: a circle for a
// birdie (two for an eagle), a square for a bogey (two for a double).
export function scoreMark(score, par) {
  if (!Number.isFinite(score) || !Number.isFinite(par)) return "none";
  const d = score - par;
  return d <= -2 ? "eagle" : d === -1 ? "birdie" : d === 0 ? "par" : d === 1 ? "bogey" : "double";
}

// The file name for a card's picture: "round-oak-park-2026-09-30.png".
export function cardFileName(card) {
  const slug = String(card.course ?? "round")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const d = card.date ? new Date(card.date) : new Date();
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `round-${slug || "course"}-${day}.png`;
}
