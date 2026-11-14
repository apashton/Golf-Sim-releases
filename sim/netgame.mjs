// Online play: one bay hosts, up to three more join, and everyone plays the
// same course at the same time - each bay its own launch monitor, its own
// players and its own ball flights, sharing only where each ball finished
// and each hole's score. This is the game they share: who's in it, the
// round's course, game and weather, and each player's progress hole by
// hole. The host keeps it, checks every change a bay sends, and sends the
// whole of it back out after each one (it's small); every bay shows it.
// Pure, so the rules are the same on every bay and can be tested.
//
// A change ("event") is one of:
//   { type: "bay", bay, name, version, players: [{ name, index, level }], carry }  a bay joins (before the start);
//     level: a player's own with the mouse, a finger or a controller (sim/swinglevels.mjs), shown in the lobby - null on a launch monitor
//                                         (carry: its carry adjustment, a percent - sim/carryadjust.mjs)
//   { type: "carry", bay, carry }         a bay's carry adjustment changes (any time: everyone sees it)
//   { type: "online", bay, online }       a bay's connection comes and goes
//   { type: "leave", bay }                a bay leaves (before the start: its players go)
//   { type: "start", course, format, handicaps, weather, id, teams, tees, reads, madeUp, pinDay, carry, skills, ladder, season }
//                                         the host starts the round
//                                         (teams: each player's team, A = 0, in the players' order;
//                                         tees: white, yellow or red, sim/tees.mjs; reads,
//                                         madeUp and carry: the round's own rules, sim/netrules.mjs -
//                                         carry in every game, the others a course's)
//   { type: "flying", player, hole, k, flight, putt }
//                                         a shot as it's struck: its flight, for the
//                                         other bays to fly at once rather than once it
//                                         has landed here (the owner: "a little bit
//                                         laggy ... maybe 3-4 seconds"); k counts the
//                                         player's swings in the round, so the shot or
//                                         holed that follows (with the same k) is known
//                                         as the same one
//   { type: "shot", player, hole, strokes, ball, lie, text, flight, putt, k }
//                                         where a ball finished, and how it
//                                         got there (sim/netpath.mjs)
//   { type: "holed", player, hole, score, text, k }              a hole finished
//   { type: "ready", bay, hole }          a bay's ready to go on from the hole (Next
//                                         hole, or its card's time up): every bay goes
//                                         on together, once all are (readyToGo)
//   { type: "pick", hole, player, strokes }  a scramble: the captain picks that player's ball
//
// A scramble (sim/teams.mjs) keeps each hole's shots and picks in order
// (scramble[hole]: { p, s, b, l, h } a shot, { pick } a pick), so every
// bay works out the same team balls from them; a ball holed finishes the
// hole for the whole team.
//   { type: "score", player, n, points, text }  putting, chipping or a challenge:
//                                         a player's n-th attempt (or hole) scored
//   { type: "drop", player }              the host carries on without a player who's gone
//
// The round is a course's (mode "course"), or a game every bay plays the
// same way from the host's setup - the putting or chipping challenge's ten
// attempts, or one of the Challenges (mode "putting", "chipping",
// "challenge"; holes is then the attempts or holes each player plays) -
// sharing only each attempt's points (tally).
//   { type: "pong", player, aim, speed, hla, rack, cup, off }
//                                         golf pong (mode "pong", two, three
//                                         or four players): a putt, on its player's
//                                         turn - the aim and the strike, so
//                                         the other bay rolls it the same,
//                                         and the cup it holed (sim/golfpong.mjs);
//                                         everyone at once (setup together, race),
//                                         whenever its player may: once a round,
//                                         or racing, any time
//   { type: "end" }                       the host ends the game
//   { type: "lobby" }                     the host stops the game: everyone back to
//                                         the lobby, still in it with the same code,
//                                         for the host to start the next (the owner:
//                                         "stop games, start games, and it pull
//                                         everyone along")
//   { type: "readyup", bay, ready }       in the lobby, a bay says it's ready (or isn't)
//                                         for the next game (sim/netlobby.mjs)
//   { type: "countdown", secs }           the host's Start counting down on every bay
//                                         (secs 0: called off), before the start
//   { type: "react", bay, what, at }      a quick reaction - "Nice shot!" - for every
//                                         bay to see, one every 30 seconds a bay
//                                         (sim/netreact.mjs; at: the host's clock)
//   { type: "pause", on }                 the host pauses the game for everyone (or
//                                         carries on): no shots played, nobody goes on
//   { type: "match", match }              the host's match over several games, its
//                                         table so far (sim/netmatch.mjs), or none
//   { type: "season", season }            the host's online season, its events and
//                                         what each's been (sim/netseason.mjs), or none
//   { type: "rules", rules }              the host's rules for the next game, in the
//                                         lobby before the start for everyone to see -
//                                         the easiest level anyone plays at among them
//                                         (sim/netrules.mjs cleanLobbyRules), or none
//   { type: "host", bay }                 a bay has taken over as host, the host gone
//                                         (sim/nethost.mjs) - never sent: the new host
//                                         makes it itself
//
// Each bay keeps its pass (its token's hash, sim/nethost.mjs) and how good
// its connection is (rtt, ms: sim/netsignal.mjs) with it, in bays.

import { PLAYER_COLOURS, MAX_PLAYERS } from "./players.mjs";
import { MAX_TEAMS, teamsOf } from "./teams.mjs";
import { okPath } from "./netpath.mjs";
import { cleanReads, cleanMadeUp, cleanCarryRule, cleanSkillsRule, cleanLobbyRules } from "./netrules.mjs";
import { cleanCarryPercent } from "./carryadjust.mjs";
import { newMatch, refusePutt, playPutt, leaveMatch } from "./golfpong.mjs";
import { reactRefusal, reactorName } from "./netreact.mjs";
import { cleanMatch } from "./netmatch.mjs";
import { cleanNetSeason, seasonRef } from "./netseason.mjs";
import { LEVELS } from "./swinglevels.mjs";

// (2: shots sent as they're struck, the next hole together and the lobby;
// 3: ready check, reactions, pause, matches and another bay taking over as
// host - a bay on an older one is told to update.)
export const PROTOCOL = 3;
// The host's port for other bays (TCP), and the one it announces itself on
// across a home network (UDP).
export const PLAY_PORT = 47821;
export const BEACON_PORT = 47822;
// The relay other houses meet through (relay/README.md): where A2 Games
// has put it up. RELAY_URL overrides it (RELAY_URL= with nothing: no
// relay - home network and Tailscale only).
export const DEFAULT_RELAY = "wss://a2golf-relay.rougelinks.workers.dev";
export const MAX_STROKES = 12;
const NAME = 20;
const TEXT = 80;

const clip = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const finite = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;

// A new game, hosted by `host` (the bay's name) with its players.
export function newGame({ hostBay = "host", hostName = "Host", version = null, players = [], carry = 0, pass = null } = {}) {
  const g = { protocol: PROTOCOL, seq: 0, host: hostBay, bays: {}, players: [], started: false, ended: false, round: null, progress: {} };
  return applyEvent(g, { type: "bay", bay: hostBay, name: hostName, version, players, carry, pass });
}

const copy = (g) => JSON.parse(JSON.stringify(g));

// Whether a bay may make this change. Returns null if so, else why not.
export function refuse(g, ev, fromBay) {
  if (!ev || typeof ev !== "object") return "Not a change";
  const host = fromBay === g.host;
  const mine = (pid) => g.players.find((p) => p.id === pid && p.bay === fromBay);
  switch (ev.type) {
    case "bay": {
      if (ev.bay !== fromBay) return "Not your bay";
      if (g.started && !g.bays[ev.bay]) return "The round has started";
      const others = g.players.filter((p) => p.bay !== ev.bay).length;
      const want = Array.isArray(ev.players) ? ev.players.length : 0;
      if (!want) return "No players";
      if (others + want > MAX_PLAYERS) return `Room for ${MAX_PLAYERS - others} more player${MAX_PLAYERS - others === 1 ? "" : "s"}`;
      return null;
    }
    case "online":
    case "leave":
      return ev.bay === fromBay || host ? null : "Not your bay";
    case "carry":
      if (ev.bay !== fromBay) return "Not your bay";
      return g.bays[ev.bay] ? null : "Not in the game";
    case "start":
      if (!host) return "Only the host starts the round";
      if (g.started) return "Already started";
      if (ev.mode === "pong") return [2, 3, 4].includes(g.players.length) ? null : "Golf pong is for two, three or four players";
      if (SIDE_GAMES.includes(ev.mode)) return finite(ev.attempts, 1, 30) ? null : "No game";
      if (!ev.course?.id || !finite(ev.course?.holes, 1, 18)) return "No course";
      return null;
    case "score":
      if (!g.started || g.ended || (g.round.mode ?? "course") === "course") return "No game going";
      if (!mine(ev.player)) return "Not your player";
      if (!Number.isInteger(ev.n) || ev.n < 0 || ev.n >= g.round.holes) return "No such attempt";
      return finite(ev.points, -1000, 1000) ? null : "Bad score";
    case "shot":
    case "holed": {
      if (!g.started || g.ended || (g.round.mode ?? "course") !== "course") return "No round going";
      if (!mine(ev.player)) return "Not your player";
      if (!Number.isInteger(ev.hole) || ev.hole < 0 || ev.hole >= g.round.holes) return "No such hole";
      if (ev.type === "shot" && (!finite(ev.strokes, 0, MAX_STROKES) || !Array.isArray(ev.ball) || !ev.ball.every((v) => finite(v, -5000, 5000)))) return "Bad shot";
      if (ev.flight != null && !okPath(ev.flight)) return "Bad flight";
      if (ev.type === "holed" && !finite(ev.score, 1, MAX_STROKES)) return "Bad score";
      if (ev.k != null && !Number.isInteger(ev.k)) return "Bad shot";
      return null;
    }
    case "flying": {
      if (!g.started || g.ended || (g.round.mode ?? "course") !== "course") return "No round going";
      if (!mine(ev.player)) return "Not your player";
      if (!Number.isInteger(ev.hole) || ev.hole < 0 || ev.hole >= g.round.holes) return "No such hole";
      if (!Number.isInteger(ev.k) || ev.k < 1) return "Bad shot";
      return okPath(ev.flight) ? null : "Bad flight";
    }
    case "ready":
      if (ev.bay !== fromBay) return "Not your bay";
      if (!g.started || g.ended || (g.round.mode ?? "course") !== "course") return "No round going";
      return Number.isInteger(ev.hole) && ev.hole >= 0 && ev.hole < g.round.holes ? null : "No such hole";
    case "lobby":
      return host ? null : "Only the host stops the game";
    case "readyup":
      if (ev.bay !== fromBay) return "Not your bay";
      if (!g.bays[ev.bay]) return "Not in the game";
      return g.started ? "The game has started" : null;
    case "countdown":
      if (!host) return "Only the host starts the game";
      if (g.started) return "Already started";
      return ev.secs === 0 || finite(ev.secs, 3, 10) ? null : "Bad countdown";
    case "react":
      return reactRefusal(g, ev, fromBay);
    case "pause":
      if (!host) return "Only the host pauses the game";
      return g.started && !g.ended ? null : "No game going";
    case "match":
      return host ? null : "Only the host keeps the match";
    case "season":
      return host ? null : "Only the host runs the season";
    case "rules":
      if (!host) return "Only the host sets the rules";
      return g.started ? "The game has started" : null;
    case "host":
      // (Made by the bay taking over, never sent: one sent is turned away.)
      return "Only a bay taking over as host makes that";
    case "pong": {
      if (!g.started || g.ended || g.round?.mode !== "pong" || !g.pong) return "No golf pong going";
      if (!mine(ev.player)) return "Not your player";
      // (Any way round: four-way, a cup at the near end of the rack beside
      // you is 105 degrees off straight ahead - sim/golfpong.mjs aimAt.)
      if (!finite(ev.aim, -180, 180) || !finite(ev.speed, 0, 40) || !finite(ev.hla, -180, 180)) return "Bad putt";
      const why = refusePutt(g.pong, { player: g.players.findIndex((p) => p.id === ev.player), rack: Number.isInteger(ev.rack) ? ev.rack : undefined, cup: ev.cup ?? null });
      return why;
    }
    case "pick": {
      if (!g.started || g.ended || g.round.format !== "scramble") return "No scramble going";
      if (!Number.isInteger(ev.hole) || ev.hole < 0 || ev.hole >= g.round.holes) return "No such hole";
      const team = teamPlayers(g, ev.player);
      if (!team) return "No such player";
      // Only the captain picks: the team's first player still in the game.
      const captain = team.find((p) => !p.dropped);
      return captain?.bay === fromBay ? null : "Only the team's captain picks";
    }
    case "drop":
      return host ? null : "Only the host";
    case "end":
      return host ? null : "Only the host ends the game";
    default:
      return "Unknown change";
  }
}

// The game after a change (checked first with refuse()).
export function applyEvent(game, ev) {
  const g = copy(game);
  g.seq = (g.seq ?? 0) + 1;
  switch (ev.type) {
    case "bay": {
      const was = g.players.filter((p) => p.bay === ev.bay);
      // (Its pass as the host made it, kept through a change of players.)
      const pass = typeof ev.pass === "string" && /^[0-9a-f]{16,64}$/.test(ev.pass) ? ev.pass : (g.bays[ev.bay]?.pass ?? null);
      g.bays[ev.bay] = { name: clip(ev.name, NAME) || "Bay", version: clip(ev.version ?? "", 20) || null, online: true, carry: cleanCarryPercent(ev.carry), pass, rtt: g.bays[ev.bay]?.rtt ?? null };
      if (!g.started) {
        // Joining again before the start: its players as it says now.
        g.players = g.players.filter((p) => p.bay !== ev.bay);
        (ev.players ?? []).slice(0, MAX_PLAYERS).forEach((q, k) => {
          const used = new Set(g.players.map((p) => p.id));
          let n = k;
          while (used.has(`${ev.bay}-${n}`)) n++;
          g.players.push({ id: `${ev.bay}-${n}`, bay: ev.bay, name: clip(q.name, NAME) || `Player ${g.players.length + 1}`, index: Number.isFinite(q.index) ? Math.round(q.index * 10) / 10 : null, level: typeof q.level === "string" && Object.hasOwn(LEVELS, q.level) ? q.level : null, colour: null, dropped: false });
        });
      } else if (!was.length) {
        delete g.bays[ev.bay];
      }
      recolour(g);
      break;
    }
    case "online":
      if (g.bays[ev.bay]) g.bays[ev.bay].online = !!ev.online;
      break;
    case "carry":
      g.bays[ev.bay].carry = cleanCarryPercent(ev.carry);
      break;
    case "leave":
      if (!g.started) {
        delete g.bays[ev.bay];
        g.players = g.players.filter((p) => p.bay !== ev.bay);
        recolour(g);
      } else if (g.bays[ev.bay]) g.bays[ev.bay].online = false;
      break;
    case "start":
      g.started = true;
      // (The lobby's ready check and countdown done with; nothing paused.)
      delete g.lobbyReady;
      delete g.countdown;
      delete g.paused;
      if (ev.mode === "pong") {
        // Each player at an end (a side with four, a lane with three) in the
        // players' order; who putts first as the host said - or everyone at
        // once, in rounds or racing (together, race).
        const setup = { ...cleanSetup(ev.setup), players: g.players.length };
        g.round = { id: clip(ev.id ?? "", 40) || `net-${g.seq}`, mode: "pong", holes: 1, name: clip(ev.name ?? "", 60) || "Golf pong", setup, course: null, format: "match", carry: cleanCarryRule(ev.carry) };
        g.pong = newMatch({ players: g.players.length, first: setup.first, together: setup.together === true, race: setup.together === true && setup.race === true });
        g.pongPutts = [];
        g.progress = {};
        break;
      }
      if (SIDE_GAMES.includes(ev.mode)) {
        g.round = { id: clip(ev.id ?? "", 40) || `net-${g.seq}`, mode: ev.mode, holes: ev.attempts, name: clip(ev.name ?? "", 60) || ev.mode, setup: cleanSetup(ev.setup), course: null, format: "stroke", carry: cleanCarryRule(ev.carry) };
        g.tally = Object.fromEntries(g.players.map((p) => [p.id, []]));
        g.progress = {};
        break;
      }
      g.round = {
        id: clip(ev.id ?? "", 40) || `net-${g.seq}`,
        mode: "course",
        course: { id: clip(ev.course.id, 60), name: clip(ev.course.name, 60) || "Course" },
        holes: ev.course.holes,
        format: clip(ev.format, 12) || "stroke",
        handicaps: ev.handicaps !== false,
        weather: ev.weather ?? null,
        // The tees everyone plays from (sim/tees.mjs): the host's.
        tees: ["white", "yellow", "red"].includes(ev.tees) ? ev.tees : "yellow",
        // The day whose cups everyone putts at (sim/pinday.mjs), the
        // host's; or none - each hole's own pin.
        pinDay: /^\d{4}-\d{2}-\d{2}$/.test(ev.pinDay ?? "") ? ev.pinDay : null,
        // Line reads each, and how much harder made-up swings are
        // (sim/netrules.mjs): the host's.
        reads: cleanReads(ev.reads),
        madeUp: cleanMadeUp(ev.madeUp),
        // Each bay's carry adjustment, or everyone on A-Squared Golf's own
        // carries: the host's (every game).
        carry: cleanCarryRule(ev.carry),
        // Each player's skill points, or none (sim/skills.mjs): the host's.
        skills: cleanSkillsRule(ev.skills),
        teams: Array.isArray(ev.teams) ? g.players.map((_, i) => (Number.isInteger(ev.teams[i]) && ev.teams[i] >= 0 && ev.teams[i] < MAX_TEAMS ? ev.teams[i] : 0)) : null,
        // An online match ladder's match it's played as (docs/LADDERS.md):
        // { code, match }, or none - each bay finds it on its own ladder.
        ladder: ladderRef(ev.ladder),
        // The host's online season's event it's played as (sim/netseason.mjs):
        // { k, of, name }, or none.
        season: seasonRef(ev.season),
      };
      g.progress = Object.fromEntries(g.players.map((p) => [p.id, []]));
      if (g.round.format === "scramble") g.scramble = {};
      break;
    case "shot":
    case "holed": {
      const list = (g.progress[ev.player] ??= []);
      const was = list[ev.hole] ?? { strokes: 0, ball: [0, 0], lie: "tee", done: false, score: null };
      const at = { ...was, text: clip(ev.text ?? "", TEXT), seq: g.seq };
      // The last shot's flight, for the other bays to draw (only the last:
      // they've drawn the ones before as they came).
      at.flight = ev.flight ?? null;
      at.putt = !!ev.putt;
      // Which swing it was (its flight already sent as it was struck:
      // flying) - and that one's done with.
      at.k = Number.isInteger(ev.k) ? ev.k : null;
      if (at.air && at.k != null && at.air.k <= at.k) delete at.air;
      if (ev.type === "shot") Object.assign(at, { strokes: ev.strokes, ball: ev.ball.map((v) => Math.round(v * 100) / 100), lie: clip(ev.lie ?? "", 20) || was.lie });
      else Object.assign(at, { done: true, score: ev.score, strokes: ev.score });
      list[ev.hole] = at;
      dropOldFlights(list, ev.hole);
      if (g.scramble) {
        (g.scramble[ev.hole] ??= []).push(ev.type === "shot" ? { p: ev.player, s: ev.strokes, b: at.ball, l: at.lie } : { p: ev.player, s: ev.score, h: true });
        // Holed: the hole's over for the whole team, at that score.
        if (ev.type === "holed") {
          for (const q of teamPlayers(g, ev.player) ?? []) {
            if (q.id === ev.player) continue;
            const ql = (g.progress[q.id] ??= []);
            ql[ev.hole] = { ...(ql[ev.hole] ?? { ball: [0, 0], lie: "tee" }), done: true, score: ev.score, strokes: ev.score, seq: g.seq, flight: null, text: "" };
          }
        }
      }
      break;
    }
    case "flying": {
      // The shot in the air: its flight, for the other bays to fly now. Its
      // place, strokes and words come with the shot or holed after it.
      const list = (g.progress[ev.player] ??= []);
      const was = list[ev.hole] ?? { strokes: 0, ball: [0, 0], lie: "tee", done: false, score: null, seq: 0 };
      list[ev.hole] = { ...was, air: { k: ev.k, flight: ev.flight, putt: !!ev.putt, seq: g.seq } };
      dropOldFlights(list, ev.hole);
      break;
    }
    case "ready":
      // (The furthest hole it's ready to go on from.)
      g.ready = { ...(g.ready ?? {}), [ev.bay]: Math.max(ev.hole, g.ready?.[ev.bay] ?? -1) };
      break;
    case "lobby":
      // Back to before a start, everyone still in: the next game's the
      // host's to pick. Players the host carried on without are gone.
      g.started = false;
      g.ended = false;
      g.round = null;
      g.progress = {};
      for (const k of ["pong", "pongPutts", "tally", "lastScore", "scramble", "ready", "lobbyReady", "countdown", "paused"]) delete g[k];
      g.players = g.players.filter((p) => !p.dropped);
      for (const b of Object.keys(g.bays)) if (b !== g.host && !g.players.some((p) => p.bay === b)) delete g.bays[b];
      g.games = (g.games ?? 0) + 1;
      recolour(g);
      break;
    case "readyup":
      g.lobbyReady = { ...(g.lobbyReady ?? {}) };
      if (ev.ready) g.lobbyReady[ev.bay] = true;
      else delete g.lobbyReady[ev.bay];
      break;
    case "countdown":
      g.countdown = ev.secs ? { secs: ev.secs, seq: g.seq } : null;
      break;
    case "react":
      g.reacted = { ...(g.reacted ?? {}), [ev.bay]: ev.at };
      g.react = { bay: ev.bay, name: reactorName(g, ev.bay), what: ev.what, seq: g.seq };
      break;
    case "pause":
      g.paused = ev.on ? { by: g.bays[g.host]?.name ?? "The host", seq: g.seq } : null;
      break;
    case "match":
      g.match = cleanMatch(ev.match);
      break;
    case "season":
      g.season = cleanNetSeason(ev.season);
      break;
    case "rules":
      g.lobbyRules = cleanLobbyRules(ev.rules);
      break;
    case "host": {
      // The old host gone: offline, its players carried on without till it's
      // back (as any bay that's lost its connection).
      const old = g.host;
      if (g.bays[old]) g.bays[old].online = false;
      g.host = ev.bay;
      g.hosts = (g.hosts ?? 0) + 1;
      delete g.paused;
      delete g.countdown;
      break;
    }
    case "score": {
      const list = (g.tally[ev.player] ??= []);
      list[ev.n] = Math.round(ev.points * 10) / 10;
      g.lastScore = { player: ev.player, n: ev.n, points: list[ev.n], text: clip(ev.text ?? "", TEXT), seq: g.seq };
      break;
    }
    case "pong": {
      const at = g.players.findIndex((p) => p.id === ev.player);
      // (Unsaid: two players, the other's rack; three, in lanes, their own.)
      const rack = ev.cup != null ? (Number.isInteger(ev.rack) ? ev.rack : g.pong.n === 3 ? at : 1 - at) : null;
      g.pong = playPutt(g.pong, { player: at, rack, cup: ev.cup ?? null, off: !!ev.off });
      // Each putt as struck, so every bay rolls it (the last few) - as it
      // counted: all at once, a cup another's putt took first is a miss.
      const taken = !!g.pong.putts.at(-1)?.taken;
      g.pongPutts = [...(g.pongPutts ?? []), { p: at, aim: ev.aim, speed: ev.speed, hla: ev.hla, rack: taken ? null : rack, cup: taken ? null : (ev.cup ?? null), ...(taken ? { taken: true } : {}), seq: g.seq }].slice(-20);
      break;
    }
    case "pick":
      if (g.scramble) (g.scramble[ev.hole] ??= []).push({ pick: ev.player, s: finite(ev.strokes, 0, MAX_STROKES) ? ev.strokes : null });
      break;
    case "drop": {
      const p = g.players.find((q) => q.id === ev.player);
      if (p) p.dropped = true;
      // Golf pong all at once: the rounds don't wait for them.
      if (p && g.pong) g.pong = leaveMatch(g.pong, g.players.indexOf(p));
      break;
    }
    case "end":
      g.ended = true;
      break;
  }
  return g;
}

// The games other than a course that can be played online.
export const SIDE_GAMES = ["putting", "chipping", "challenge"];

// The host's setup for one: the few plain values every bay needs to play
// the same thing (a challenge's game, option and seed; a distance...).
function cleanSetup(s) {
  const out = {};
  if (!s || typeof s !== "object") return out;
  for (const [k, v] of Object.entries(s).slice(0, 12)) {
    if (!/^[a-zA-Z]{1,20}$/.test(k)) continue;
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "string") out[k] = v.slice(0, 40);
    else if (typeof v === "boolean") out[k] = v;
  }
  return out;
}

// The standings of a putting, chipping or challenge game: each player's
// total (most first), attempts played, and whether they've finished - and
// once everyone still in the game has, who won.
export function tallyRows(g) {
  const holes = g.round?.holes ?? 0;
  const rows = g.players.map((p, index) => {
    const list = g.tally?.[p.id] ?? [];
    const played = list.filter((v) => v != null).length;
    return { id: p.id, index, name: p.name, colour: p.colour, bay: p.bay, dropped: !!p.dropped, scores: Array.from({ length: holes }, (_, i) => list[i] ?? null), total: list.reduce((a, v) => a + (v ?? 0), 0), played, done: played >= holes };
  });
  const order = [...rows].sort((a, b) => b.total - a.total || a.index - b.index);
  order.forEach((r, k) => (r.place = k > 0 && order[k - 1].total === r.total ? order[k - 1].place : k + 1));
  const finished = rows.length > 0 && rows.every((r) => r.done || r.dropped);
  const top = finished ? order.filter((r) => r.place === 1 && r.played > 0).map((r) => r.name) : [];
  const title = !top.length ? "" : top.length === 1 ? `${top[0]} wins!` : `${top.slice(0, -1).join(", ")} and ${top.at(-1)} tie!`;
  return { rows: order, finished, title };
}

// The players on a player's team, in the players' order (null: no such
// player, or no teams).
export function teamPlayers(g, pid) {
  const at = g.players.findIndex((p) => p.id === pid);
  if (at < 0 || !Array.isArray(g.round?.teams)) return null;
  const team = teamsOf(g.round.teams).find((t) => t.members.includes(at));
  return team ? team.members.map((i) => g.players[i]) : null;
}

// Colours by the order players are in, as the course gives them.
function recolour(g) {
  g.players.forEach((p, i) => (p.colour = PLAYER_COLOURS[i % PLAYER_COLOURS.length]));
}

// Each player's scores so far, per hole (null: not finished).
export function scoresOf(g, pid) {
  const list = g.progress?.[pid] ?? [];
  return Array.from({ length: g.round?.holes ?? 0 }, (_, h) => (list[h]?.done ? list[h].score : null));
}

// Whether everyone still playing has finished hole h.
export function holeDone(g, h) {
  return g.players.every((p) => p.dropped || g.progress?.[p.id]?.[h]?.done);
}

// Who hasn't finished hole h yet (names), for "Waiting for Sam".
export function waitingFor(g, h, exceptBay = null) {
  return g.players.filter((p) => !p.dropped && p.bay !== exceptBay && !g.progress?.[p.id]?.[h]?.done).map((p) => p.name);
}

// On to the next hole together (the owner: "people move on to the next
// hole at the same time and can't skip on to the next hole when the other
// one's not finished ... it needs to be a joint thing"): the bays not yet
// ready to go on from hole h (a ready event, sent by Next hole or as its
// scorecard's time runs out) - names, as waitingFor. A bay that's lost its
// connection, or whose players have all left, holds nobody up; exceptBay
// (this one) neither.
export function notReady(g, h, exceptBay = null) {
  const bays = Object.keys(g.bays ?? {}).filter((b) => b !== exceptBay && g.bays[b].online !== false && g.players.some((p) => p.bay === b && !p.dropped) && !((g.ready?.[b] ?? -1) >= h));
  return bays.map((b) => g.players.find((p) => p.bay === b && !p.dropped).name);
}

// Whether every bay can go on from hole h now: all finished it, and all
// ready (this bay, exceptBay, counted as ready - it's asking).
export function readyToGo(g, h, exceptBay = null) {
  // (Paused: nobody goes on till the host carries on.)
  return !g.paused && holeDone(g, h) && !notReady(g, h, exceptBay).length;
}

// Who's come and gone since the game was last seen, for every bay to be
// told (the owner: "it took a little while for it to show up on the other
// screen ... to show that the other person had logged in"): "Sam's bay
// joined - Sam, Jo", "Sam's bay lost its connection", "Sam's bay is back",
// "Sam's bay left". Not this bay's own (exceptBay); nothing the first time.
export function comingsAndGoings(before, after, exceptBay = null) {
  if (!before || !after) return [];
  const out = [];
  const names = (g, b) => g.players.filter((p) => p.bay === b && !p.dropped).map((p) => p.name);
  for (const [b, bay] of Object.entries(after.bays ?? {})) {
    if (b === exceptBay) continue;
    const was = before.bays?.[b];
    if (!was) out.push(`${bay.name} joined - ${names(after, b).join(", ")}`);
    else if (was.online !== false && bay.online === false) out.push(`${bay.name} lost its connection`);
    else if (was.online === false && bay.online !== false) out.push(`${bay.name} is back`);
  }
  for (const [b, bay] of Object.entries(before.bays ?? {})) if (b !== exceptBay && !after.bays?.[b]) out.push(`${bay.name} left`);
  // Another bay taking over as host (sim/nethost.mjs).
  if (before.host !== after.host && after.bays?.[after.host] && after.host !== exceptBay) out.push(`${after.bays[after.host].name} is hosting now`);
  return out;
}

// Only the hole being played keeps its flights (the bays have flown the
// ones before): the game stays small however long the round.
function dropOldFlights(list, hole) {
  for (let i = 0; i < hole; i++) {
    const at = list[i];
    if (at && (at.flight || at.air)) {
      list[i] = { ...at, flight: null };
      delete list[i].air;
    }
  }
}

// "Waiting for Sam", "Waiting for Sam and Jo", "Waiting for Sam, Jo and Al".
export function waitingWords(names) {
  if (!names.length) return "";
  return `Waiting for ${names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`}`;
}

// An online round over on this bay (view: the online play view - mode
// host, guest or off, and the game): the host takes everyone back to the
// lobby for the next game, from the round card, the course panel or the
// Online play panel; the others are told who they're waiting for. Null
// when there's no game on to go back from.
export function afterRound(view) {
  const g = view?.game;
  if (!g?.started || g.ended || (view.mode !== "host" && view.mode !== "guest")) return null;
  if (view.mode === "host") return { host: true, words: "Everyone comes back to the lobby with you for the next game" };
  return { host: false, words: `${waitingWords([g.bays?.[g.host]?.name ?? "the host"])} to pick the next game` };
}

// A short random token, for a bay's place in the game.
export function token(bytes = 12) {
  const a = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// What a host says about itself: on the home network (the beacon) and when
// asked (GET /play/hello).
export function hello(g, { version = null } = {}) {
  const host = g.bays[g.host];
  return {
    app: "a2golf",
    protocol: PROTOCOL,
    version,
    host: host?.name ?? "Host",
    players: g.players.map((p) => p.name),
    room: MAX_PLAYERS - g.players.length,
    started: g.started,
    course: g.round?.course?.name ?? g.round?.name ?? null,
  };
}

// A game found on the home network or over Tailscale, built only from the
// checked fields of what the other PC said (any packet can claim to be a
// beacon): { address, port, via, host, players, room, started, course,
// version, peerName }, or null if it isn't one of ours.
export function foundGame(address, h, via, defaultPort = PLAY_PORT) {
  if (!h || typeof h !== "object" || h.app !== "a2golf") return null;
  const port = h.port === undefined ? defaultPort : h.port;
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  return {
    app: "a2golf",
    address: String(address ?? ""),
    port,
    via: via === "tailscale" ? "tailscale" : "home",
    protocol: Number.isInteger(h.protocol) ? h.protocol : null,
    version: clip(h.version, 20) || null,
    host: clip(h.host, NAME) || "Host",
    players: (Array.isArray(h.players) ? h.players : []).slice(0, MAX_PLAYERS).map((n) => clip(n, NAME)).filter(Boolean),
    room: finite(h.room, -MAX_PLAYERS, MAX_PLAYERS) ? Math.round(h.room) : 0,
    started: h.started === true,
    course: clip(h.course, 60) || null,
    peerName: clip(h.peerName, 60) || null,
  };
}

// The game as a host sent it, taken in by a guest: the names clipped, the
// colours from the palette (or a plain #rrggbb), the numbers numbers - what
// another PC sent never reaches the page as anything but text. null if it
// isn't a game at all.
const ID = /^[A-Za-z0-9_.:-]{1,60}$/;
const COLOUR = /^#[0-9a-fA-F]{6}$/;
const textOr = (v, n, or) => clip(v, n) || or;
const numOr = (v, or) => (Number.isFinite(v) ? v : or);
export function cleanGame(game) {
  if (!game || typeof game !== "object" || Array.isArray(game)) return null;
  const g = { ...game };
  g.seq = numOr(g.seq, 0);
  g.host = typeof g.host === "string" && ID.test(g.host) ? g.host : "host";
  g.started = g.started === true;
  g.ended = g.ended === true;
  const bays = g.bays && typeof g.bays === "object" ? g.bays : {};
  g.bays = Object.fromEntries(
    Object.entries(bays)
      .filter(([id, b]) => ID.test(id) && id !== "__proto__" && b && typeof b === "object")
      .map(([id, b]) => [id, { ...b, name: textOr(b.name, NAME, "Bay"), version: clip(b.version, 20) || null, online: b.online === true, carry: cleanCarryPercent(b.carry), rtt: Number.isFinite(b.rtt) ? b.rtt : null }]),
  );
  g.players = (Array.isArray(g.players) ? g.players : [])
    .filter((p) => p && typeof p === "object")
    .slice(0, MAX_PLAYERS)
    .map((p, i) => ({
      ...p,
      id: typeof p.id === "string" && ID.test(p.id) ? p.id : `p-${i}`,
      bay: typeof p.bay === "string" && ID.test(p.bay) ? p.bay : "",
      name: textOr(p.name, NAME, `Player ${i + 1}`),
      index: Number.isFinite(p.index) ? p.index : null,
      level: typeof p.level === "string" && Object.hasOwn(LEVELS, p.level) ? p.level : null,
      colour: typeof p.colour === "string" && COLOUR.test(p.colour) ? p.colour : PLAYER_COLOURS[i % PLAYER_COLOURS.length],
      dropped: p.dropped === true,
    }));
  if (g.round && typeof g.round === "object") {
    const r = (g.round = { ...g.round });
    r.id = clip(r.id, 40) || null;
    r.name = clip(r.name, 60);
    r.format = clip(r.format, 12) || "stroke";
    if (r.mode !== undefined) r.mode = clip(r.mode, 20) || "course";
    if (r.holes !== undefined) r.holes = numOr(r.holes, 0);
    r.course = r.course && typeof r.course === "object" ? { ...r.course, id: clip(r.course.id, 60), name: textOr(r.course.name, 60, "Course") } : null;
  } else g.round = null;
  return g;
}

// A course's holes as the page uses them: each one's number, par, yards and
// stroke index numbers (a course from another PC could say anything).
export function cleanHoleSpecs(course) {
  for (const [i, h] of (Array.isArray(course?.holes) ? course.holes : []).entries()) {
    if (!h || typeof h !== "object") continue;
    const s = (h.spec = h.spec && typeof h.spec === "object" ? h.spec : {});
    const num = (k, or) => {
      const n = typeof s[k] === "string" && s[k].trim() !== "" ? Number(s[k]) : s[k];
      if (Number.isFinite(n)) s[k] = n;
      else if (or === undefined) delete s[k];
      else s[k] = or;
    };
    num("number", i + 1);
    num("par", 4);
    if ("yards" in s) num("yards");
    if ("si" in s) num("si");
  }
  return course;
}

// A ladder match an online round is played as: { code: "LK7Q2M", match },
// or null.
export function ladderRef(x) {
  const code = String(x?.code ?? "").toUpperCase();
  const match = String(x?.match ?? "");
  return /^L[A-Z0-9]{5}$/.test(code) && /^[A-Za-z0-9_-]{4,40}$/.test(match) ? { code, match } : null;
}

// A game's code, for joining through the relay: six letters and digits
// that can't be mistaken for each other, shown "K7Q-2MX".
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newCode() {
  const a = new Uint8Array(6);
  globalThis.crypto.getRandomValues(a);
  return [...a].map((b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}
export const showCode = (c) => (c && c.length === 6 ? `${c.slice(0, 3)}-${c.slice(3)}` : (c ?? ""));
// What was typed, as a code: "k7q 2mx" -> "K7Q2MX" (null if it can't be one).
export function readCode(typed) {
  const c = String(typed ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return /^[A-Z0-9]{6}$/.test(c) ? c : null;
}
