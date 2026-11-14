// The Postal ladder (docs/LADDERS.md, "The Postal ladder"; sim/postal.mjs):
// each player plays the match's round on their own, when they like within
// the ladder's days, in one go - on the course, tees, cups and weather
// fixed when the one challenged accepted, with the same luck shot for shot.
// The scores go to the relay's store, hidden from the other until both
// are in; then the reveal, hole by hole, on both players' screens.
//   - Accept (course/ladderonline.js): the course, plus this bay's tees and
//     its weather rolled now (postalAccept).
//   - Play your round: said to the store once (begin), then played as a
//     course round of one - no restarts, no match line while it's played
//     (blind). Each hole's score is kept on this PC as it's finished, so a
//     round broken off (the page closed) carries on from the next hole - a
//     hole left part way, after a shot, lost (no second go at it).
//   - The round's end: its scores sent (a hole not played is lost); kept
//     until they're in.
//   - The reveal: once both are in, on each player's panel - Show both
//     rounds lays them out a hole at a time (the moment's theirs, not
//     missed behind the round's card), Done puts it away.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import { ladderState, resultWords, RULES, DAY } from "../sim/matchladder.mjs";
import { postalLuck, roundState, roundKey, carryOn, revealRows, upWords, postalShots, mergeShots, shotWords } from "../sim/postal.mjs";
import { rollConditions, cleanConditions } from "../sim/weather.mjs";
import { changeWords } from "../sim/elo.mjs";
import { esc } from "../util.js";

const dateWords = (t) => new Date(t).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
// How long each hole's row of the reveal waits after the last (seconds).
const REVEAL_STEP = 0.7;

export class CourseLadderPostal {
  // What a Postal accept fixes from this bay: its tees, and the weather
  // rolled now from its weather settings (as a round of its own would be).
  postalAccept(L) {
    if (L.play !== "postal") return {};
    const s = this.settings;
    const weather = cleanConditions(rollConditions({ wind: s.wind, temp: s.temp, sky: s.sky, time: s.time, altitudeM: s.altitudeM, humidity: s.humidity }, Date.now()));
    return { tees: s.tees ?? null, weather };
  }

  // The rounds kept on this PC as they're played: { "<code>:<match>":
  // { scores, at, done } }.
  postalKept(L, match) {
    this.ladders.rounds ??= {};
    return this.ladders.rounds[roundKey(L.online.code, match)] ?? null;
  }
  putPostalKept(L, match, kept) {
    this.ladders.rounds ??= {};
    const key = roundKey(L.online.code, match);
    if (kept) this.ladders.rounds[key] = kept;
    else delete this.ladders.rounds[key];
    this.saveLadders();
  }

  // An accepted Postal match's card: where each of you is with your round,
  // and what to do.
  postalCardHtml(L, s, m, me) {
    const other = m.by === me ? m.of : m.by;
    const them = esc(s.players[other]?.name ?? "?");
    const course = esc(this.list.find((c) => c.id === m.course)?.name ?? m.course ?? "the course");
    const by = dateWords(m.acceptedAt + RULES.play * DAY);
    const mine = roundState(m, me);
    const theirs = roundState(m, other);
    const kept = this.postalKept(L, m.match);
    const theirWords = theirs === "played" ? `${them} has played theirs - hidden till yours is in.` : theirs === "begun" ? `${them} is playing theirs.` : `${them} hasn't played theirs yet.`;
    let act;
    const now = this.round?.ladder?.postal && this.round.ladder.match === m.match && !this.round.ladder.recorded && !this.round.finished;
    if (now) act = `You're playing your round now. ${theirWords}`;
    else if (mine === "played") act = `Your round's in. ${theirs === "played" ? "" : `The scores stay hidden until ${them} has played (by ${by}).`}`;
    else if (kept?.done) act = `Your round's played but not sent yet. <button class="primary" data-ladder-postal="send" data-match="${esc(m.match)}">Send your round</button>`;
    else if (mine === "begun" && kept) {
      const go = carryOn(kept, L.holes);
      act = `<button class="primary" data-ladder-postal="play" data-match="${esc(m.match)}" title="Pick your round up where it stopped">Carry on your round</button> (from hole ${go.from}) ${theirWords}`;
    } else if (mine === "begun") act = `You began your round on another PC - finish it there. ${theirWords}`;
    else act = `<button class="primary" data-ladder-postal="play" data-match="${esc(m.match)}" title="One go: no restarts - the course, tees, cups and weather the same for you both">Play your round</button> ${theirWords}`;
    return `<b>Postal match v ${them}</b> on ${course}, by ${by}. ${act}`;
  }

  wirePostal(el, L) {
    for (const b of el.querySelectorAll("[data-ladder-postal]")) {
      b.addEventListener("click", () => {
        const what = b.dataset.ladderPostal;
        const match = b.dataset.match;
        if (what === "seen") return this.seenReveal(L, match);
        if (what === "open") return this.openReveal(L, match);
        if (what === "watch") {
          const key = roundKey(L.online.code, match);
          this.watchOpen = this.watchOpen === key ? null : key;
          return this.renderLadder();
        }
        const m = ladderState(L).open.find((x) => x.match === match);
        if (!m) return;
        if (what === "play") return this.playPostal(L, m);
        if (what === "send") return this.sendPostal(L, match);
      });
    }
  }

  // Play your round: said to the store (once), then played - or picked up
  // where it stopped on this PC.
  async playPostal(L, m) {
    const me = L.online?.me?.id;
    if (!me) return;
    let kept = this.postalKept(L, m.match);
    if (!kept && m.begun?.[me] != null) return this.onToast("You began your round on another PC - a Postal match is one go, so finish it there", 5000);
    if (!m.course || !m.weather) return this.onToast("That match isn't set up yet - press Refresh", 3500);
    // Your copy of the course must be the one it was accepted on (its first
    // holes' pars and lengths), or it isn't the same round.
    const holes = await this.courseHoles(m.course, L.holes);
    const same = holes && m.holes && holes.every((h, i) => h.par === m.holes[i].par && h.yards === m.holes[i].yards);
    if (!same) return this.onToast(holes ? `Your ${m.course} isn't the same course as theirs (its holes differ) - ask the ladder's admin to call the match off` : `This PC hasn't the course ${m.course} - ask the ladder's admin to call the match off`, 6000);
    if (!(await this.leaveRound(`Play your round of ${L.name}'s match now? It's one go - no restarts.`))) return;
    if (!kept) {
      const reply = await this.onlineAsk(L, "begin", { match: m.match });
      if (!reply) return this.onToast(this.ladderNote ?? "Couldn't begin it - try again", 4000);
      kept = { scores: [], at: Date.now(), done: false };
      this.putPostalKept(L, m.match, kept);
    }
    const go = carryOn(kept, L.holes);
    if (go.lost) this.onToast(`Hole ${go.lost} was left part way, so it counts as lost`, 5000);
    // (Broken off on its last hole: nothing left to play - sent.)
    if (go.done) {
      this.putPostalKept(L, m.match, { ...kept, scores: Array.from({ length: L.holes }, (_, i) => (Number.isFinite(go.scores[i]) ? go.scores[i] : null)), done: true });
      return this.sendPostal(L, m.match);
    }
    this.pendingLadder = { id: L.id, match: m.match, players: [L.online.me.name ?? this.seasonName()], tees: m.tees ?? null, pin: m.pin ?? null };
    this.postalCarry = go.scores;
    this.startRound(m.course, go.from, null, { weather: m.weather });
  }

  // A Postal round just started (course.js startRound): the holes already
  // played on this PC put back on its card.
  resumePostal() {
    const r = this.round;
    const carried = this.postalCarry;
    this.postalCarry = null;
    if (!r?.ladder?.postal || !carried?.length) return;
    carried.forEach((x, i) => {
      if (Number.isFinite(x)) r.players[0].scores[i] = x;
    });
  }

  // The round as it stands, kept on this PC: each hole as it's finished
  // (course.js nextHole), and each shot as it lands (course.js, so a hole
  // left part way is known: carryOn).
  keepPostal(r = this.round) {
    const lad = r?.ladder;
    if (!lad?.postal || lad.recorded || r.index < 0) return;
    const L = this.ladders.list.find((l) => l.id === lad.id);
    if (!L?.online) return;
    const p = r.players[0];
    const scores = Array.from({ length: lad.holes }, (_, i) => (Number.isFinite(p?.scores?.[i]) ? p.scores[i] : null));
    const finished = scores[r.index] != null;
    const next = finished ? r.index + 1 : r.index;
    const playing = !finished && (p?.strokes ?? 0) > 0 ? r.index : null;
    const kept = this.postalKept(L, lad.match) ?? {};
    // (And its shots, to watch after the reveal: sim/postal.mjs postalShots.)
    const shots = mergeShots(kept.shots, postalShots(p?.log, lad.holes, r.id));
    this.putPostalKept(L, lad.match, { ...kept, scores, next, playing, shots, at: Date.now() });
  }

  // The round over (course/matchladder.js ladderMatchPlayed): kept as
  // played, then sent.
  postalPlayed(lad) {
    const L = this.ladders.list.find((l) => l.id === lad.id);
    if (!L?.online) return;
    const scores = Array.from({ length: lad.holes }, (_, i) => this.round.players[0]?.scores?.[i] ?? null);
    const shots = mergeShots(this.postalKept(L, lad.match)?.shots, postalShots(this.round.players[0]?.log, lad.holes, this.round.id));
    this.putPostalKept(L, lad.match, { scores, shots, at: Date.now(), done: true });
    if (scores.some((x) => x == null)) this.onToast(`${lad.name}: holes not played count as lost`, 4000);
    this.sendPostal(L, lad.match);
  }

  // A played round's scores to the store (once; kept here until they're in).
  async sendPostal(L, match) {
    const kept = this.postalKept(L, match);
    const me = L.online?.me?.id;
    if (!kept?.done || !me) return;
    const reply = await this.onlineAsk(L, "report", { match, scores: { [me]: kept.scores }, ...(Array.isArray(kept.shots) ? { shots: kept.shots } : {}) });
    if (!reply) return this.onToast(`${L.name}: your round couldn't be sent (${this.ladderNote ?? "no answer"}) - it's kept: Send your round from the ladder`, 6000);
    this.putPostalKept(L, match, null);
    this.renderLadder();
    if (!reply.revealed) this.onToast(`${L.name}: your round's in - the scores show when the other's is too`, 6000);
  }

  // A round's luck in a Postal match: the same draw for the same shot in
  // both players' rounds (sim/postal.mjs) - or undefined, any other time
  // (course.js the lie's severity; app.js a made-up swing's spread).
  ladderLuck(what) {
    const r = this.round;
    // (A season by post's event: its seed, the same for everyone in it.)
    const lad = r?.ladder?.postal ? r.ladder : r?.postSeason ? { postal: true, seed: r.postSeason.seed } : null;
    if (!lad?.postal || !Number.isFinite(lad.seed) || r.index < 0) return undefined;
    const p = r.players[r.turn ?? 0] ?? r.players[0];
    return postalLuck(lad.seed, r.index, p?.strokes ?? 0, what);
  }

  // The match in a line while it's played: blind.
  postalLiveWords(lad) {
    const other = lad.me === lad.by ? lad.ofName : lad.byName;
    return `${lad.name}: your round v ${other} - played blind, the scores shown when both are in`;
  }

  // ---- The reveal ---------------------------------------------------------------

  // This bay's Postal results not yet shown here.
  newReveals(L, s) {
    const me = L.online?.me?.id;
    if (!me || L.play !== "postal") return [];
    this.ladders.seen ??= {};
    return s.results.filter((x) => !x.walkover && x.scores && (x.by === me || x.of === me) && !this.ladders.seen[roundKey(L.online.code, x.match)]);
  }

  // Show both rounds: laid out a hole at a time, this once.
  openReveal(L, match) {
    this.revealOpen ??= new Set();
    this.revealOpen.add(roundKey(L.online.code, match));
    this.renderLadder();
  }

  seenReveal(L, match) {
    this.ladders.seen ??= {};
    this.ladders.seen[roundKey(L.online.code, match)] = Date.now();
    this.saveLadders();
    this.renderLadder();
  }

  // The reveal: both rounds hole by hole, with the match as it went - a
  // row at a time the first time it's shown, once Show both rounds is
  // pressed.
  revealHtml(L, s) {
    const res = this.newReveals(L, s)[0];
    if (!res) return "";
    const key = roundKey(L.online.code, res.match);
    const a = s.players[res.by]?.name ?? "?";
    const b = s.players[res.of]?.name ?? "?";
    this.revealNoted ??= new Set();
    if (!this.revealNoted.has(key)) {
      this.revealNoted.add(key);
      const other = res.by === L.online.me.id ? res.of : res.by;
      this.onToast(`${L.name}: ${s.players[other]?.name ?? "The other"}'s round is in - the reveal's on the Match ladder panel`, 6000);
    }
    if (!this.revealOpen?.has(key)) return `<div class="ladder-card ladder-reveal"><p><b>The reveal: ${esc(a)} v ${esc(b)}</b></p><p class="small">Both rounds are in. <button class="primary" data-ladder-postal="open" data-match="${esc(res.match)}">Show both rounds</button></p></div>`;
    this.revealing ??= new Set();
    const first = !this.revealing.has(key);
    this.revealing.add(key);
    const rv = revealRows(res.holes ?? [], res.scores[res.by], res.scores[res.of], res.strokes?.[res.by], res.strokes?.[res.of]);
    const dots = (n) => (n ? `<sup title="${n} stroke${n === 1 ? "" : "s"} given">${"•".repeat(n)}</sup>` : "");
    const cell = (v, got, won) => `<td class="${won ? "won" : ""}">${v == null ? "-" : v}${dots(got)}</td>`;
    const delay = (i) => (first ? ` style="animation-delay:${(i * REVEAL_STEP).toFixed(1)}s"` : "");
    const rows = rv.rows
      .map((row, i) => `<tr class="reveal-row${first ? " reveal-in" : ""}${row.after ? " muted" : ""}"${delay(i)}><td>${row.hole}</td><td>${row.par}</td>${cell(row.a, row.gotA, row.won === "a")}${cell(row.b, row.gotB, row.won === "b")}<td>${row.after ? "(after)" : esc(upWords(row.up, a, b))}</td></tr>`)
      .join("");
    const me = L.online.me.id;
    const change = res.changes?.[me];
    const end = `${esc(resultWords(s, res))}${change ? ` (you ${esc(changeWords(change))})` : ""}`;
    return `<div class="ladder-card ladder-reveal"><p><b>The reveal: ${esc(a)} v ${esc(b)}</b></p>
      <table class="season-table ladder-reveal-table"><tr><th>Hole</th><th>Par</th><th>${esc(a)}</th><th>${esc(b)}</th><th>Match</th></tr>${rows}</table>
      <p class="reveal-row${first ? " reveal-in" : ""}"${delay(rv.rows.length)}><b>${end}</b></p>
      ${this.postalWatchHtml(L, s, res)}
      <div class="row-buttons"><button data-ladder-postal="seen" data-match="${esc(res.match)}">Done</button></div></div>`;
  }

  // Watch their round, after the reveal: both players' shots hole by hole,
  // as the store kept them (relay/ladders.mjs watch) - a button, then the
  // list. "" if the store has none for the match.
  postalWatchHtml(L, s, res) {
    const w = L.online?.watch?.[res.match];
    const me = L.online?.me?.id;
    if (!w || !me) return "";
    const other = res.by === me ? res.of : res.by;
    const them = s.players[other]?.name ?? "them";
    const open = this.watchOpen === roundKey(L.online.code, res.match);
    const button = `<button data-ladder-postal="watch" data-match="${esc(res.match)}" title="Their shots, hole by hole - and yours beside them">${open ? "Hide the shots" : `Watch ${esc(them)}'s round`}</button>`;
    if (!open) return `<p class="small">${button}</p>`;
    const theirs = w[other] ?? [];
    const mine = w[me] ?? [];
    const holes = res.holes ?? [];
    const rows = holes
      .map((h, i) => `<tr><td>${i + 1}</td><td>${(theirs[i] ?? []).map((x) => esc(shotWords(x))).join("<br>") || "-"}</td><td>${(mine[i] ?? []).map((x) => esc(shotWords(x))).join("<br>") || "-"}</td></tr>`)
      .join("");
    return `<p class="small">${button}</p><table class="season-table ladder-watch"><tr><th>Hole</th><th>${esc(them)}</th><th>You</th></tr>${rows}</table>`;
  }
}
