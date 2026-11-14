// Online play by code, through the relay (relay/): hosting a game other bays
// join with its code ("K7Q-2MX"), or joining someone else's - the game, who's
// in it, each bay's shots, and the round's course sent to the bays that
// join. The game itself (who's in it, each player's progress) is
// sim/netgame.mjs; this is the talking, over a WebSocket each way.
//
// It needs nothing but a WebSocket, timers and the browser's own gzip, so
// the same code plays online from the PC's server (server/netplay.mjs, which
// adds the home network and Tailscale on top) and from the phone app's game
// page (sim/pocketserver.mjs, docs/ANDROID-PLAN.md step 3) - and a phone
// and a PC bay play each other, as the messages are the same.
//
// Outgoing connections work on every network, so nothing is set up on
// anyone's router and nobody needs an account. Nothing here is secret or
// valuable - a game's scores - but a bay can only change its own players
// (netgame.mjs refuse()), needs the token it was given to say anything, and
// the host holds four players at most.

import { newGame, applyEvent, refuse, cleanGame, token, newCode, readCode, PROTOCOL, DEFAULT_RELAY } from "../sim/netgame.mjs";
import { passOf, bayByPass, takesOver, takeoverWait, gamePasses, TAKEOVER_MS } from "../sim/nethost.mjs";
import { smoothRtt } from "../sim/netsignal.mjs";

// Trying the relay again after a drop: soon, then less often (every try is
// a request against the relay's allowance).
export const RETRY_MS = 3000;
const RETRY_MAX = 60000;
// Trying again after the relay's said no games are left today.
const RETRY_OUT_MS = 10 * 60000;
const PING_MS = 60000;
const backoff = (ms) => Math.min(RETRY_MAX, ms * 2);
// The host gone: trying for the game again this often at most, so a bay
// taking over is found soon (sim/nethost.mjs).
const HOST_GONE_RETRY_MS = 10000;
// A game this bay was in, kept to rejoin after the app starts again: for
// this long (the owner's "rejoin mid-round after an app restart").
export const KEEP_MS = 6 * 3600 * 1000;
const KEEP_EVERY_MS = 1500;
// A bay the host has forgotten joining again, at most this often.
const REJOIN_MS = 3000;
// The course sent to one connection at most this often (a bay asks every
// five seconds while it's missing: askCourse).
const COURSE_EVERY_MS = 4000;

// ---- The round's course on its way ----------------------------------------------

// The round's course on its way to the bays playing it from other houses.
// One message if it fits; else squeezed (gzip) and sent in parts each well
// inside the most a relay message may be (relay/rooms.mjs MAX_MESSAGE, 256
// KB) - a course on hills, its ground's heights and all, is two to four
// times that, and in one message the relay turned it away, so a bay joining
// from another house never got the course. The parts cost next to nothing
// of the relay's allowance (a handful of messages, at 20 to a request).

// The most of a course's squeezed text in one message.
export const COURSE_PART = 180 * 1024;

const toBase64 = (bytes) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromBase64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
async function squeeze(text) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function unsqueeze(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

// The messages that carry `course` to a bay: [{ op: "course", course }]
// if it fits in one, else [{ op: "course-part", id, i, n, data }...]
// (id: the round's, so parts of two rounds' courses never mix).
export async function courseMessages(course, id, part = COURSE_PART) {
  const text = JSON.stringify(course);
  if (text.length <= part) return [{ op: "course", course }];
  const packed = toBase64(await squeeze(text));
  const n = Math.ceil(packed.length / part);
  return Array.from({ length: n }, (_, i) => ({ op: "course-part", id, i, n, data: packed.slice(i * part, (i + 1) * part) }));
}

// A course from its parts' data, in order.
export async function joinCourse(parts) {
  return JSON.parse(await unsqueeze(fromBase64(parts.join(""))));
}

// ---- Playing by code ------------------------------------------------------------

export class RelayPlay {
  // version: this app's version. relay: the relay's address (wss://...),
  // or "" for none. getCourse(id): a course by its id, for the round the
  // host starts (the host sends it to the others) - or start() is handed
  // the course itself. onChange(view): the game, or how this bay's in it,
  // changed.
  // keep: { load(), save(state | null) } - where the game this bay is in is
  // kept, to rejoin after the app starts again (the PC's server: a file;
  // the phone: its own storage); none, nothing kept. loadCourse(id): the
  // course by its id, perhaps a promise, for hosting again after that
  // (getCourse's, if not given).
  constructor({ version = null, relay = DEFAULT_RELAY, getCourse = () => null, loadCourse = null, onChange = () => {}, keep = null } = {}) {
    this.relayUrl = typeof WebSocket === "function" ? String(relay ?? "").replace(/\/+$/, "") : "";
    this.relay = null; // hosting through it: { code, key, ws, peers: Map(peer -> bay) }
    this.version = version;
    this.getCourse = getCourse;
    this.loadCourse = loadCourse ?? getCourse;
    this.onChange = onChange;
    this.mode = "off"; // "off" | "host" | "guest"
    this.game = null;
    this.bay = null;
    this.error = null;
    this.tokens = new Map(); // token -> bay
    this.course = null; // the course being played (JSON)
    this.remote = null; // joined: { code, token, connected, stopped, ws }
    // This bay's own token as host (its pass is in the game), for joining
    // its game as a bay if another took over hosting meanwhile.
    this.ownToken = null;
    // The time a message takes to the relay and back (ms, kept steady:
    // sim/netsignal.mjs), said with this bay's changes.
    this.rtt = null;
    // How long the first bay in line waits for a host that's gone, and how
    // often the bays try for the game meanwhile (shorter in the tests).
    this.takeoverMs = TAKEOVER_MS;
    this.hostGoneRetryMs = HOST_GONE_RETRY_MS;
    this.keep = keep;
    this.saved = null;
    try {
      const k = keep?.load?.();
      if (k && typeof k === "object" && Date.now() - (k.at ?? 0) < KEEP_MS) this.saved = k;
    } catch {
      // Nothing kept.
    }
  }

  // ---- What this bay's page sees ---------------------------------------------

  view() {
    return {
      mode: this.mode,
      bay: this.bay,
      game: this.game,
      error: this.error,
      // What the host last refused of this bay's, through the relay, and
      // how many it has: { n, error }, or null.
      refused: this.refused ?? null,
      connected: this.mode === "guest" ? !!this.remote?.connected : this.mode === "host",
      // The relay: there to use, and this game's code on it (hosting) and
      // whether it's reached.
      relay: !!this.relayUrl,
      // (Its address: the game's join link, for its QR code - sim/netinvite.mjs.)
      relayUrl: this.relayUrl || null,
      code: this.relay?.code ?? this.remote?.code ?? null,
      relayConnected: this.mode === "host" ? !!this.relay?.open : null,
      // The relay's daily allowance, when it has one (relay/usage.mjs):
      // { level: "ok" | "low" | "out", roundsLeft, resetsAt }.
      usage: (this.mode === "host" ? this.relay?.usage : this.remote?.usage) ?? null,
      // The round's course is here to play (a guest fetches it from the host);
      // putting, chipping and the challenges need none.
      courseReady: !!this.course || (!!this.game?.started && (this.game.round?.mode ?? "course") !== "course"),
      // Playing across the home network or over Tailscale too (the PC's
      // server: server/netplay.mjs) - by code only, here.
      lan: false,
      host: null,
      // A game this bay was in before the app started again, to rejoin:
      // { kind, hostName, code, at, started } - or null.
      rejoin: this.mode === "off" ? rejoinOf(this.saved) : null,
      // This bay's own connection (ms), and when it took over as host.
      rtt: this.rtt,
      tookOver: this.tookOver ?? null,
    };
  }

  changed() {
    // The host's own connection, with the game it sends anyway.
    if (this.mode === "host" && this.relay && this.game?.bays?.[this.bay]) this.game.bays[this.bay].rtt = this.rtt;
    try {
      this.onChange(this.view());
    } catch {
      // The page's business.
    }
    if (this.mode === "host" && this.relay?.open && this.relay.peers.size) this.relay.ws.send(JSON.stringify({ to: "*", data: JSON.stringify({ op: "game", game: this.game }) }));
    // The game's passes to the relay when they change: it keeps the code
    // for this host - or the bay of this game that takes over - for a while
    // if this one drops (relay/rooms.mjs HOST_GRACE_MS).
    if (this.mode === "host" && this.relay?.open && this.game) {
      const passes = JSON.stringify(gamePasses(this.game));
      if (passes !== this.relay.keptPasses) {
        this.relay.keptPasses = passes;
        this.relay.ws.send(JSON.stringify({ keep: JSON.parse(passes) }));
      }
    }
    this.keepSoon();
  }

  // ---- Kept, to rejoin after the app starts again --------------------------

  // What's kept of the game this bay is in (or null: none).
  keepState() {
    if (this.mode === "host" && this.game) {
      return { kind: "host", at: Date.now(), code: this.relay?.code ?? null, key: this.relay?.key ?? null, bay: this.bay, game: this.game, tokens: [...this.tokens], ownToken: this.ownToken, courseId: this.course?.id ?? this.game.round?.course?.id ?? null };
    }
    if (this.mode === "guest" && this.remote?.relay && this.remote.token) {
      const r = this.remote;
      return { kind: "code", at: Date.now(), code: r.code, token: r.token, bay: this.bay, name: r.name, players: r.players, carry: r.carry, hostName: this.game?.bays?.[this.game.host]?.name ?? null, started: !!this.game?.started };
    }
    return null;
  }

  keepSoon() {
    if (!this.keep || this.keepTimer) return;
    this.keepTimer = setTimeout(() => {
      this.keepTimer = null;
      this.keepNow();
    }, KEEP_EVERY_MS);
    this.keepTimer.unref?.();
  }

  keepNow(state = this.keepState()) {
    if (!this.keep) return;
    // (Nothing going: what was kept stays, to rejoin, till it's used or
    // forgotten - leave() forgets it.)
    if (!state) return;
    try {
      this.keep.save(state);
    } catch {
      // Not kept this time.
    }
  }

  // The game kept forgotten: left on purpose, or Forget it.
  forget() {
    this.saved = null;
    clearTimeout(this.keepTimer);
    this.keepTimer = null;
    try {
      this.keep?.save(null);
    } catch {
      // Already gone.
    }
    this.changed();
    return this.view();
  }

  // Back into the game kept: as host again with the same code, or as the
  // same bay in someone else's.
  async rejoin() {
    const k = this.saved;
    if (!k) throw new Error("No game to rejoin");
    if (k.kind === "host") return this.restoreHosting(k);
    if (k.kind === "code") return this.joinCode({ code: k.code, name: k.name, players: k.players, carry: k.carry, token: k.token, bay: k.bay });
    throw new Error("Can't rejoin that game from here");
  }

  // Hosting again, as before the app started again: the same game, code
  // and bays' tokens - the bays find it as they try again. Every other bay
  // offline till it's back.
  async restoreHosting(k) {
    await this.leave({ forget: false });
    this.mode = "host";
    this.bay = k.bay;
    this.game = structuredClone(k.game);
    for (const [b, bay] of Object.entries(this.game.bays ?? {})) if (b !== this.bay) bay.online = false;
    this.tokens = new Map(k.tokens ?? []);
    this.ownToken = k.ownToken ?? null;
    this.course = k.courseId ? ((await this.loadCourse(k.courseId)) ?? null) : null;
    this.error = null;
    this.saved = null;
    if (this.relayUrl && k.code) this.hostRelay({ code: k.code, key: k.key, back: true });
    this.changed();
    return this.view();
  }

  // ---- Hosting ----------------------------------------------------------------

  // This bay the host of a new game (nothing sent anywhere yet).
  newHosting({ name = "Host", players = [], carry = 0 } = {}) {
    this.bay = "h";
    this.ownToken = token();
    this.game = newGame({ hostBay: this.bay, hostName: name, version: this.version, players, carry, pass: passOf(this.ownToken) });
    this.error = null;
    this.saved = null;
    this.tookOver = null;
  }

  // Hosting, by code only.
  async host(who = {}) {
    await this.leave();
    if (!this.relayUrl) throw new Error("Hosting needs the relay, and there isn't one set up");
    this.newHosting(who);
    this.mode = "host";
    this.hostRelay({ code: newCode(), key: token(16) });
    this.changed();
    return this.view();
  }

  // The host's connection to the relay, kept open: back with the same code
  // after a drop.
  // proof: a bay taking over, its own token - the relay knows it by its
  // pass (relay/rooms.mjs).
  hostRelay({ code, key, back = false, proof = null }) {
    // (back: this game hosted before, the app started again - as if it had
    // been open: if another bay took over meanwhile, this one joins it.)
    const relay = { code, key, ws: null, open: false, everOpen: back, peers: new Map(), stopped: false, usage: null, wait: RETRY_MS, keptPasses: null };
    this.relay = relay;
    const again = (ms = relay.wait) => {
      relay.wait = backoff(ms);
      relay.timer = setTimeout(go, ms);
    };
    const go = () => {
      if (relay.stopped || this.relay !== relay) return;
      let ws;
      try {
        ws = new WebSocket(`${this.relayUrl}/ws?room=${code}&role=host&key=${key}${proof ? `&token=${encodeURIComponent(proof)}` : ""}`);
      } catch (err) {
        this.error = `Couldn't reach the relay: ${err.message}`;
        return again();
      }
      relay.ws = ws;
      let ping = null;
      ws.addEventListener("open", () => {
        relay.open = true;
        relay.everOpen = true;
        // (The passes said again on each connection: changed() sends them.)
        relay.keptPasses = null;
        relay.wait = RETRY_MS;
        if (/relay|allowance/i.test(this.error ?? "")) this.error = null;
        // (Each keep-alive timed: this bay's connection - sim/netsignal.mjs.)
        const beat = () => {
          if (ws.readyState !== 1) return;
          relay.pingAt = Date.now();
          ws.send("ping");
        };
        beat();
        ping = setInterval(beat, PING_MS);
        this.changed();
      });
      ws.addEventListener("message", (e) => this.fromRelay(relay, String(e.data)));
      ws.addEventListener("close", (e) => {
        clearInterval(ping);
        const was = relay.open;
        relay.open = false;
        if (relay.stopped || this.relay !== relay) return;
        // Everyone through the relay is offline until they're back.
        for (const bay of new Set(relay.peers.values())) this.offlineIfGone(bay, relay);
        relay.peers.clear();
        // Refused (the day's allowance used up): the relay said why.
        if (e.code === 4003) {
          this.changed();
          return again(relay.usage?.level === "out" ? RETRY_OUT_MS : relay.wait);
        }
        if (was) this.error = "Lost the relay - trying again...";
        this.changed();
        again();
      });
      ws.addEventListener("error", () => {});
    };
    go();
  }

  // A message from the relay to the host.
  fromRelay(relay, text) {
    if (text === "pong") {
      if (relay.pingAt) this.rtt = smoothRtt(this.rtt, Date.now() - relay.pingAt);
      relay.pingAt = null;
      return;
    }
    let m;
    try {
      m = JSON.parse(text);
    } catch {
      return;
    }
    if (m.type === "hello") {
      relay.usage = m.usage ?? null;
      return this.changed();
    }
    if (m.type === "refused") {
      relay.open = false;
      // Back, and the code's another bay's now: it took over hosting while
      // this one was away (sim/nethost.mjs) - this one joins it as a bay.
      if (m.status === 409 && relay.everOpen && this.game) return this.joinAsBay(relay);
      if (m.status === 503) relay.usage = m.usage ?? { level: "out" };
      this.error = m.error;
      return this.changed();
    }
    const reply = (peer, data) => relay.ws?.readyState === 1 && relay.ws.send(JSON.stringify({ to: peer, data: JSON.stringify(data) }));
    if (m.type === "close") {
      const bay = relay.peers.get(m.peer);
      relay.peers.delete(m.peer);
      if (bay) this.offlineIfGone(bay, relay);
      return;
    }
    if (m.type !== "msg") return;
    let d;
    try {
      d = JSON.parse(m.data);
    } catch {
      return;
    }
    if (d.op === "join") {
      // One bay a connection: one that's in already is welcomed back to its
      // own place, never given another.
      const had = relay.peers.get(m.from);
      if (had && this.game?.bays?.[had]) return reply(m.from, { op: "welcome", bay: had, token: [...this.tokens].find(([, b]) => b === had)?.[0] ?? d.token, game: this.game });
      const r = this.admit(d);
      if (r.error) return reply(m.from, { op: "refused", error: r.error });
      relay.peers.set(m.from, r.bay);
      if (this.game.bays[r.bay] && !this.game.bays[r.bay].online) this.apply({ type: "online", bay: r.bay, online: true }, this.bay);
      return reply(m.from, { op: "welcome", bay: r.bay, token: r.token, game: this.game });
    }
    const bay = relay.peers.get(m.from);
    if (!bay) return reply(m.from, { op: "refused", error: "Not in this game - join again" });
    if (d.op === "event") {
      // (Its connection, said with it: kept with its bay - sim/netsignal.mjs.)
      this.noteRtt(bay, d.rtt);
      const r = this.apply(d.event, bay);
      if (!r.ok) reply(m.from, { op: "error", error: r.error });
    } else if (d.op === "course") {
      // (In parts if it's too big for one relay message. Worked out once a
      // round. Each connection's asking held to once every few seconds: a
      // course can be hundreds of kilobytes to send.)
      if (!this.course) return;
      relay.courseAt ??= new Map();
      if (Date.now() - (relay.courseAt.get(m.from) ?? 0) < COURSE_EVERY_MS) return;
      relay.courseAt.set(m.from, Date.now());
      const id = this.game?.round?.id ?? "";
      if (this.courseOut?.course !== this.course || this.courseOut.id !== id) this.courseOut = { course: this.course, id, messages: courseMessages(this.course, id) };
      this.courseOut.messages.then((list) => list.forEach((msg) => reply(m.from, msg))).catch(() => {});
    }
  }

  // Whether a bay's still connected another way (the PC's home network:
  // server/netplay.mjs).
  connectedElsewhere() {
    return false;
  }

  // A bay with no connection left: offline.
  offlineIfGone(bay, relay = this.relay) {
    const viaRelay = relay && [...relay.peers.values()].includes(bay);
    if (!viaRelay && !this.connectedElsewhere(bay) && this.game?.bays[bay]?.online) this.apply({ type: "online", bay, online: false }, this.bay);
  }

  // A bay asking to join: its place in the game, or why not. Back again with
  // its token: the same place - known by its pass if this host was never
  // told the token (it took over hosting: sim/nethost.mjs).
  admit(body) {
    if (body.protocol !== PROTOCOL) return { error: "A different version of A² Golf - update both to the same version" };
    let bay = body.token ? (this.tokens.get(body.token) ?? null) : null;
    if (!bay && body.token && typeof body.bay === "string") bay = bayByPass(this.game, body.bay, body.token);
    const again = !!bay;
    bay ??= `b${token(3)}`;
    const t = again ? body.token : token();
    const r = this.apply({ type: "bay", bay, name: body.name, version: body.version, players: body.players, carry: body.carry, pass: passOf(t) }, bay);
    if (!r.ok) return { error: r.error };
    this.tokens.set(t, bay);
    return { bay, token: t };
  }

  // A bay's connection as it said, kept with it in the game (it goes out
  // with the change it came with).
  noteRtt(bay, rtt) {
    const b = this.game?.bays?.[bay];
    if (b && Number.isFinite(rtt) && rtt >= 0 && rtt < 60000) b.rtt = Math.round(rtt);
  }

  // A change from a bay (the host's own, or another's by its token).
  apply(ev, fromBay) {
    // A reaction's time is the host's own (sim/netreact.mjs: one every 30
    // seconds a bay).
    if (ev?.type === "react") ev = { ...ev, at: Date.now() };
    const why = refuse(this.game, ev, fromBay);
    if (why) return { ok: false, error: why };
    this.game = applyEvent(this.game, ev);
    // Back in the lobby: the last round's course is done with.
    if (ev.type === "lobby") this.course = null;
    this.changed();
    return { ok: true };
  }

  // The game as the host has it now, taken in here (a guest). Another
  // round - started after the lobby, or back to it - and the last round's
  // course is done with: the new one's fetched from the host (needsCourse).
  takeGame(game) {
    game = cleanGame(game);
    if (!game) return;
    if ((game?.round?.id ?? null) !== (this.game?.round?.id ?? null)) this.course = null;
    this.game = game;
  }

  // A guest still to get the round's course from the host.
  get needsCourse() {
    return !!this.game?.started && !this.course && (this.game.round?.mode ?? "course") === "course";
  }

  // The host starts the round: the course it's played on (courseId, from
  // getCourse; or the course itself), and how - or putting, chipping or a
  // challenge (mode), from its setup, no course.
  start({ courseId, course: given = null, format = "stroke", handicaps = true, weather = null, id = null, teams = null, tees = null, reads = null, madeUp = null, pinDay = null, carry = null, skills = null, mode = "course", setup = null, attempts = null, name = null, ladder = null, season = null } = {}) {
    if (this.mode !== "host") throw new Error("Only the host starts the round");
    if (mode !== "course") {
      this.course = null;
      const r = this.apply({ type: "start", id: id ?? `net-${Date.now().toString(36)}`, mode, setup, attempts, name, carry }, this.bay);
      if (!r.ok) throw new Error(r.error);
      return this.view();
    }
    const course = given ?? this.getCourse(courseId);
    if (!course) throw new Error("No such course");
    this.course = course;
    const r = this.apply({ type: "start", id: id ?? `net-${Date.now().toString(36)}`, course: { id: course.id, name: course.name, holes: course.holes.length }, format, handicaps, weather, teams, tees, reads, madeUp, pinDay, carry, skills, ladder, season }, this.bay);
    if (!r.ok) throw new Error(r.error);
    return this.view();
  }

  // ---- Joining with the host's code ---------------------------------------------

  // token, bay: this bay's place before, to come back to it (rejoin).
  async joinCode({ code, name = "Bay", players = [], carry = 0, token: was = null, bay: wasBay = null } = {}) {
    await this.leave({ forget: !was });
    const c = readCode(code);
    if (!c) throw new Error("A code is six letters and numbers, like K7Q-2MX");
    if (!this.relayUrl) throw new Error("Joining with a code needs the relay, and there isn't one set up");
    this.error = null;
    const remote = { code: c, relay: true, name, players, carry, token: was, bay: wasBay, connected: false, stopped: false, ws: null, usage: null, wait: RETRY_MS };
    this.remote = remote;
    this.mode = "guest";
    this.course = null;
    const welcomed = new Promise((resolve, reject) => {
      remote.welcomed = resolve;
      remote.refused = reject;
      setTimeout(() => reject(new Error("No game with that code - check it, and that the host is still hosting")), 10000);
    });
    this.followRelay(remote);
    try {
      await welcomed;
    } catch (err) {
      await this.leave();
      throw err;
    }
    return this.view();
  }

  // The guest's connection to the relay, kept open: back by itself after a
  // drop (joining again with its token: the same place in the game).
  followRelay(remote) {
    if (remote.stopped) return;
    // The host long gone: this bay takes over, if it's next in line.
    if (this.maybeTakeOver(remote)) return;
    let ws;
    try {
      ws = new WebSocket(`${this.relayUrl}/ws?room=${remote.code}&role=guest`);
    } catch (err) {
      remote.refused?.(err);
      return;
    }
    remote.ws = ws;
    // The round's course, if it's still to come - not again while its parts
    // are arriving (each asking sends them all).
    const askCourse = () => {
      const now = Date.now();
      if (!this.needsCourse || (remote.parts && now - remote.parts.at < 15000) || now - (remote.askedAt ?? 0) < 5000) return;
      remote.askedAt = now;
      ws.send(JSON.stringify({ op: "course" }));
    };
    let ping = null;
    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ op: "join", protocol: PROTOCOL, version: this.version, name: remote.name, players: remote.players, carry: remote.carry, token: remote.token, bay: remote.bay ?? this.bay }));
      // (Each keep-alive timed: this bay's connection - sim/netsignal.mjs.)
      const beat = () => {
        if (ws.readyState !== 1) return;
        remote.pingAt = Date.now();
        ws.send("ping");
      };
      beat();
      ping = setInterval(beat, PING_MS);
    });
    ws.addEventListener("message", (e) => {
      const text = String(e.data);
      if (text === "pong") {
        if (remote.pingAt) this.rtt = smoothRtt(this.rtt, Date.now() - remote.pingAt);
        remote.pingAt = null;
        return;
      }
      let d;
      try {
        d = JSON.parse(text);
      } catch {
        return;
      }
      if (d.type === "hello") {
        remote.usage = d.usage ?? null;
      } else if (d.type === "refused") {
        remote.refusal = d.status ?? null;
        // (Coming back and the host's gone: said as the connection closes.)
        if (!(remote.token && d.status === 404)) this.error = d.error;
        remote.refused?.(new Error(d.error));
        this.changed();
      } else if (d.op === "welcome") {
        remote.wait = RETRY_MS;
        remote.token = d.token;
        remote.connected = true;
        remote.hostGoneAt = null;
        remote.refusal = null;
        this.bay = d.bay;
        remote.bay = d.bay;
        this.saved = null;
        this.takeGame(d.game);
        this.error = null;
        remote.welcomed?.();
        askCourse();
        this.changed();
      } else if (d.op === "game") {
        this.takeGame(d.game);
        askCourse();
        this.changed();
      } else if (d.op === "course") {
        this.course = d.course;
        remote.parts = null;
        this.changed();
      } else if (d.op === "course-part") {
        // A course too big for one message, in parts: put back together
        // once they're all here.
        const n = Number(d.n);
        if (!(n > 0 && n <= 64) || !(d.i >= 0 && d.i < n) || typeof d.data !== "string") return;
        // (Filled with nulls: every() skips an empty slot, so with holes it
        // said "all here" at the first part, and a course in parts never
        // came together.)
        if (remote.parts?.id !== d.id || remote.parts.n !== n) remote.parts = { id: d.id, n, got: new Array(n).fill(null), at: 0 };
        remote.parts.got[d.i] = d.data;
        remote.parts.at = Date.now();
        if (remote.parts.got.every((x) => typeof x === "string")) {
          const got = remote.parts.got;
          remote.parts = null;
          joinCourse(got)
            .then((course) => {
              if (this.remote !== remote) return;
              this.course = course;
              this.changed();
            })
            .catch(() => {
              // Asked for again on the next change.
            });
        }
      } else if (d.op === "refused") {
        // In the game already, and the host doesn't know this connection
        // (its own to the relay dropped and came back, its list of bays with
        // it): joined again with the token - the same place - rather than
        // stuck on "join again". (Once every few seconds at most.)
        if (remote.token && ws.readyState === 1 && Date.now() - (remote.rejoinAt ?? 0) > REJOIN_MS) {
          remote.rejoinAt = Date.now();
          ws.send(JSON.stringify({ op: "join", protocol: PROTOCOL, version: this.version, name: remote.name, players: remote.players, carry: remote.carry, token: remote.token, bay: remote.bay ?? this.bay }));
          return;
        }
        this.error = d.error;
        remote.refused?.(new Error(d.error));
        this.changed();
      } else if (d.op === "error") {
        // Something this bay sent the host refused (a putt, a shot): said
        // on the page (app.js), as a refusal from across the house is.
        this.error = d.error;
        this.refused = { n: (this.refused?.n ?? 0) + 1, error: d.error };
        this.changed();
      }
    });
    ws.addEventListener("close", (e) => {
      clearInterval(ping);
      remote.connected = false;
      if (remote.stopped || this.remote !== remote) return;
      // Not in yet: nothing to come back to.
      if (!remote.token) return remote.refused?.(new Error("No game with that code - check it, and that the host is still hosting"));
      // The host gone: it left (4000), or there's no game with the code any
      // more (refused) - it may be back, or another bay takes over
      // (sim/nethost.mjs).
      const hostGone = e.code === 4000 || (e.code === 4003 && remote.refusal === 404);
      if (hostGone) remote.hostGoneAt ??= Date.now();
      if (this.maybeTakeOver(remote)) return;
      if (hostGone) this.error = this.hostGoneWords(remote);
      else if (e.code !== 4003) this.error = "Lost the game - trying again...";
      this.changed();
      const ms = hostGone ? Math.min(remote.wait, this.hostGoneRetryMs) : remote.wait;
      remote.wait = backoff(remote.wait);
      remote.timer = setTimeout(() => this.followRelay(remote), ms);
    });
    ws.addEventListener("error", () => {});
  }

  // A change from this bay's page: straight to the game hosting it here, or
  // on to the host.
  async send(ev) {
    // (A rejoin says this bay's carry adjustment as it is now.)
    if (ev?.type === "carry" && this.remote) this.remote.carry = ev.carry;
    if (this.mode === "host") return this.apply(ev, this.bay);
    if (this.mode === "guest" && this.remote?.relay) {
      if (this.remote.ws?.readyState !== 1) return { ok: false, error: "Not connected to the game just now - it'll send again when back" };
      // (This bay's connection said with it: sim/netsignal.mjs.)
      this.remote.ws.send(JSON.stringify({ op: "event", event: ev, rtt: this.rtt }));
      return { ok: true };
    }
    return { ok: false, error: "Not in a game" };
  }

  // ---- Another bay hosting when the host's gone (sim/nethost.mjs) -------------

  // Said while the host's gone: who takes over, and when.
  hostGoneWords(remote) {
    const wait = takeoverWait(this.game, this.bay, this.takeoverMs);
    if (wait == null) return "The host's gone - waiting in case they're back...";
    const left = Math.max(0, Math.ceil((wait - (Date.now() - remote.hostGoneAt)) / 1000));
    return `The host's gone - waiting in case they're back. If they're not back ${left ? `in ${left} s` : "soon"}, this bay takes over as host and the game carries on.`;
  }

  // This bay takes over as host, if it's next in line and has waited its
  // turn: the game as it last had it, the same code; the others come back
  // to it by their passes.
  maybeTakeOver(remote) {
    if (!remote?.relay || !remote.token || !this.game || !Number.isFinite(remote.hostGoneAt)) return false;
    if (!takesOver(this.game, this.bay, remote.hostGoneAt, Date.now(), this.takeoverMs)) return false;
    remote.stopped = true;
    clearTimeout(remote.timer);
    try {
      remote.ws?.close(1000, "Taking over as host");
    } catch {
      // Already closed.
    }
    this.remote = null;
    this.mode = "host";
    this.ownToken = remote.token;
    this.tokens = new Map([[remote.token, this.bay]]);
    this.game = applyEvent(this.game, { type: "host", bay: this.bay });
    this.error = null;
    this.tookOver = Date.now();
    // (Its token its proof to the relay; back, so a code another bay took
    // first has this one join that bay's game instead.)
    this.hostRelay({ code: remote.code, key: token(16), back: true, proof: remote.token });
    this.changed();
    return true;
  }

  // Back after another bay took over hosting this one's game: this one
  // joins it as a bay, in its own place (its pass).
  joinAsBay(relay) {
    relay.stopped = true;
    clearTimeout(relay.timer);
    try {
      relay.ws?.close(1000, "Joining as a bay");
    } catch {
      // Already closed.
    }
    this.relay = null;
    const me = this.game.bays?.[this.bay];
    const players = this.game.players.filter((p) => p.bay === this.bay).map((p) => ({ name: p.name, index: p.index }));
    this.tokens.clear();
    Promise.resolve(this.stopHosting()).catch(() => {});
    this.mode = "guest";
    this.remote = { code: relay.code, relay: true, name: me?.name ?? "Bay", players, carry: me?.carry ?? 0, token: this.ownToken, bay: this.bay, connected: false, stopped: false, ws: null, usage: null, wait: RETRY_MS };
    this.error = "Another bay took over hosting while you were away - joining their game...";
    this.followRelay(this.remote);
    this.changed();
  }

  // The rest of hosting put away (the PC's home network: server/netplay.mjs).
  async stopHosting() {}

  // forget: what's kept to rejoin goes too (leaving on purpose).
  async leave({ forget = true } = {}) {
    if (forget) {
      this.saved = null;
      clearTimeout(this.keepTimer);
      this.keepTimer = null;
      try {
        this.keep?.save(null);
      } catch {
        // Already gone.
      }
    }
    if (this.mode === "guest" && this.remote) {
      await Promise.resolve(this.send({ type: "leave", bay: this.bay })).catch(() => {});
      this.remote.stopped = true;
      clearTimeout(this.remote.timer);
      this.remote.abort?.();
      try {
        this.remote.ws?.close(1000, "Left");
      } catch {
        // Already closed.
      }
      this.remote = null;
    }
    if (this.relay) {
      this.relay.stopped = true;
      clearTimeout(this.relay.timer);
      try {
        this.relay.ws?.close(1000, "Stopped hosting");
      } catch {
        // Already closed.
      }
      this.relay = null;
    }
    if (this.mode === "host") {
      this.tokens.clear();
      await this.stopHosting();
    }
    this.mode = "off";
    this.game = null;
    this.bay = null;
    this.course = null;
    this.tookOver = null;
    this.changed();
  }
}

// What a page is told of a game kept to rejoin (nothing secret): { kind,
// words ("Sam's game", "The game you were hosting"), code, at, started }.
export function rejoinOf(k) {
  if (!k || typeof k !== "object" || !["host", "code", "address"].includes(k.kind)) return null;
  const words = k.kind === "host" ? "The game you were hosting" : k.hostName ? `${k.hostName}'s game` : "The game you were in";
  return { kind: k.kind, words, code: k.code ?? null, at: k.at ?? null, started: k.kind === "host" ? !!k.game?.started : !!k.started };
}
