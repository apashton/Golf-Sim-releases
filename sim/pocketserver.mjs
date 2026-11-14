// The pocket server: what the PC's local server (server/server.mjs) answers
// the game page, answered in the page itself - for the Android app, where
// there's no PC (docs/ANDROID-PLAN.md, "What has to change"). The page's
// requests to /api/... and its event streams (/events, /api/play/events)
// come here instead of over the network (public/pocket/start.js), so the
// game's own code stays as it is.
//
// The test app (step 0 of the plan) answers what the range, the greens, a
// course round and the challenges need:
//   - shots: test shots and the swing pad (/api/test-shot), read as the PC
//     reads them (sim/openconnect.mjs interpret), and the Omni's straight
//     from Bluetooth (omniShot, omniClub), each to every page as "shot";
//   - the status (/api/status, and "status" on /events), the club in hand
//     (/api/club) and the carry adjustment (/api/carry);
//   - the courses that come with the app (never changed; rounds kept),
//     and the courses kept on this device (sim/coursekeep.mjs KeptCourses):
//     friends' fetched by code, and - in the web version - the ones made in
//     its course designer: saved, changed, deleted and shared as the PC's
//     own are (PUT, DELETE /api/courses/<id>, its trees and paths kept);
//   - the game's own sound clips (/api/sounds);
//   - online play by code through the relay (/api/play/..., and "play" on
//     /api/play/events): net/relayplay.mjs, the PC server's own relay half,
//     so a phone hosts a game or joins one - a PC bay's or another phone's
//     - with its code. (Not the PC's home network or Tailscale: by code
//     only.)
//   - the stats: each write the game makes (/api/stats/shot, a club's
//     data, an answer, a round...) kept in order for the PC
//     (sim/phonesync.mjs; linked to the PC, net/devicelink.mjs takes them
//     to its stats), and a player's handicaps as the PC sent them back
//     (/api/stats/player). The phone works none out itself: no club
//     checks or tips on it.
// Everything else says 404 - "not in the test app" - and the game carries
// on without it, as it does when the PC's server is gone. (Holes kept once
// built, /api/bakes, are the app's page's own: sim/pocketbakes.mjs.)
//
// Pure: the store (kept settings and rounds), the courses and the clock are
// handed in. test/pocketserver.test.mjs covers it.

import { interpret } from "./openconnect.mjs";
import { trustedClub, measuredSpinOf } from "./launchmonitors.mjs";
import { repeatShot, repeatWords, REPEAT_MS } from "./shotrepeat.mjs";
import { cleanCarry, carryPercentOf, scaleForCarryPercent } from "./carryadjust.mjs";
import { FLIGHT_MODEL } from "./flight.mjs";
import { RelayPlay } from "../net/relayplay.mjs";
import { SYNC_PATHS, outboxAdd, outboxAll } from "./phonesync.mjs";
import { skillsOf, checkSpend } from "./skills.mjs";
import { KeptCourses, COURSE_ID, courseSummary } from "./coursekeep.mjs";
import { AccountStore } from "./accountstore.mjs";
import { googlePageLink } from "./phonegoogle.mjs";
import { codeOfShared, CourseSharing } from "./sharedcourse.mjs";
import { GOOGLE, tokenFresh } from "./google.mjs";
import { DriveFiles } from "./drivefiles.mjs";
import { CourseDrive } from "./coursedrive.mjs";

// (A course's line in a list: tools/androidweb.mjs writes the app's.)
export { courseSummary };
// The Omni's log kept for the phone check page: the last lines only.
export const LOG_LINES = 300;
// And the game's last errors (what it sends /api/client-error).
export const ERRORS_KEPT = 20;

// What the page asked for that the test app doesn't do.
const NOT_HERE = { error: "Not in the Android test app yet" };

// A store in memory (the tests; a page without storage).
export function memoryStore() {
  const m = new Map();
  return { get: (k) => (m.has(k) ? structuredClone(m.get(k)) : null), set: (k, v) => (v == null ? m.delete(k) : m.set(k, structuredClone(v))) };
}

export class PocketServer {
  // store: { get(key), set(key, value) } (JSON values; the page's own
  // storage in the app). courses: { list: [summary], get: async (id) =>
  // course | null } - the courses the app comes with (tools/androidweb.mjs
  // writes them). sounds: the /api/sounds answer. onClub(club): the club in
  // hand changed (the Omni is told). onOmniSearch(on): look for the Omni,
  // or stop (setOmniSearch). relay: the online play relay's address
  // (wss://...; pocket.mjs gives the game's own), or "" for no online play.
  // now: ms clock.
  // googleWay / firebase / fetchImpl: signing in (sim/accountstore.mjs) -
  // "idToken" in the web version (Google's own button), "browser" in the
  // phone app (Google won't sign in inside an app's page: the phone's
  // browser and back - sim/phonegoogle.mjs), null anywhere else.
  // kept: the courses kept on this device (sim/coursekeep.mjs KeptCourses;
  // in memory if none's given).
  // driveCourses: the courses made here can be kept in the player's Google
  // Drive (the web version: the page asks Google for the permission and
  // hands its token over - sim/coursedrive.mjs); google: Google's addresses.
  constructor({ driveCourses = false, google = GOOGLE, kept = null, store = memoryStore(), courses = { list: [], get: async () => null }, sounds = null, appVersion = null, onClub = null, onOmniSearch = null, relay = "", now = () => Date.now(), googleWay = null, firebase = undefined, fetchImpl = undefined } = {}) {
    this.store = store;
    // The relay's address: a friend's shared course is fetched from it.
    this.relayUrl = relay;
    this.fetchImpl = fetchImpl ?? ((...a) => fetch(...a));
    // The accounts signed in on this phone or browser, kept in its storage.
    // (The phone app's Google sign-in goes by the relay's page and back:
    // sim/phonegoogle.mjs - what it started kept in the phone's storage.)
    this.accounts = new AccountStore({
      read: () => store.get("accounts"),
      write: (v) => store.set("accounts", v),
      googleWay,
      googlePage: (nonce) => googlePageLink(relay, nonce),
      started: { get: () => store.get("googleStarted"), set: (v) => store.set("googleStarted", v) },
      now,
      ...(firebase ? { firebase } : {}),
      ...(fetchImpl ? { fetchImpl } : {}),
    });
    this.courses = courses;
    // The courses kept here: friends', and the ones made here. (Friends'
    // courses kept before in the page's small storage are moved across.)
    this.kept = kept ?? new KeptCourses({ now });
    this.keptReady = this.kept.ready.then(() => this.moveShared());
    // Sharing them and fetching friends' (sim/sharedcourse.mjs): this
    // device's secret and each course's code kept in the store.
    this.sharing = new CourseSharing({
      kept: { load: () => store.get("courseSharing"), save: (v) => store.set("courseSharing", v) },
      courses: { get: (id) => this.courseById(id), save: (id, course) => this.kept.save(id, course), game: (id) => this.fromApp(id) },
      relay,
      fetchImpl: this.fetchImpl,
      now,
      onChange: () => this.broadcast("courses", {}),
    });
    // The courses made here kept in the player's Google Drive, if it's
    // turned on (off unless it is): the page's token from Google's pop-up,
    // good for an hour - asked for again when it's run out.
    this.driveCourses = !!driveCourses;
    this.driveToken = null;
    this.driveFiles = new DriveFiles({
      token: async () => (tokenFresh(this.driveToken, now()) ? this.driveToken.access : null),
      stale: () => (this.driveToken = null),
      fetchImpl: this.fetchImpl,
      endpoints: google,
    });
    this.courseDrive = new CourseDrive({
      // (The app's own listed too, so a file named as one is left alone.)
      courses: {
        list: async () => (await this.keptReady, [...this.courses.list.filter((c) => !this.kept.has(c.id)).map((c) => ({ ...c, origin: "game" })), ...this.kept.list()]),
        get: (id) => this.kept.get(id),
        save: (id, course) => this.kept.save(id, course),
        remove: async (id) => {
          await this.kept.remove(id);
          this.store.set(`rounds.${id}`, null);
          this.sharing.forget(id);
        },
      },
      drive: this.driveFiles,
      kept: { load: () => store.get("courseDrive"), save: (v) => store.set("courseDrive", v) },
      now,
      onCourses: () => this.broadcast("courses", {}),
    });
    this.sounds = sounds;
    this.appVersion = appVersion;
    this.onClub = onClub;
    // The search for the Omni: off until the page says (the app's play
    // mode, sim/playmode.mjs - touch screen or launch monitor).
    this.omniSearch = false;
    this.onOmniSearch = onOmniSearch;
    this.now = now;
    this.listeners = new Set();
    this.state = {
      club: "DR",
      clubChosen: false,
      distance: 0,
      handed: "RH",
      shotCount: 0,
      lastShot: null,
      lastDelivered: null,
      lastHeartbeat: null,
      deviceId: null,
      // The Omni's link, as the page's own link last said (omniState), or
      // null with no Bluetooth to look for it.
      omni: null,
    };
    this.log = [];
    // Lines added to the log so far (it keeps only the last LOG_LINES).
    this.logged = 0;
    // Online play: each change to the pages listening for it.
    // (The game it's in kept in the app's storage, to rejoin if the app
    // starts again part way through; a course to host again from its own.)
    this.play = new RelayPlay({
      version: appVersion,
      relay,
      onChange: (view) => this.broadcast("play", view, "/api/play/events"),
      loadCourse: (id) => this.courseById(id),
      keep: { load: () => this.store.get("onlinePlay") ?? null, save: (v) => this.store.set("onlinePlay", v) },
    });
  }

  // ---- Events ------------------------------------------------------------------

  // A page listening to one of the event streams: send(type, data) for each
  // event. Told the status (or online play's view) at once, as the PC's
  // server does. Returns the way to stop.
  subscribe(stream, send) {
    const l = { stream, send };
    this.listeners.add(l);
    if (stream === "/events") send("status", this.status());
    if (stream === "/api/play/events") send("play", this.play.view());
    return () => this.listeners.delete(l);
  }

  broadcast(type, data, stream = "/events") {
    for (const l of [...this.listeners]) {
      if (l.stream !== stream) continue;
      try {
        l.send(type, data);
      } catch {
        // A page gone; it's dropped when it says so.
      }
    }
  }

  // ---- State -------------------------------------------------------------------

  carry() {
    return cleanCarry(this.store.get("carry"));
  }

  status() {
    const c = this.carry();
    return {
      connectors: 0,
      connectorList: [],
      e6: null,
      ports: [],
      addresses: [],
      lastHeartbeat: this.state.lastHeartbeat,
      ready: null,
      ballDetected: null,
      deviceId: this.state.deviceId,
      club: this.state.club,
      clubChosen: this.state.clubChosen,
      shotCount: this.state.shotCount,
      omni: this.state.omni,
      gspconnect: false,
      appVersion: this.appVersion,
      carryMatch: c?.scale ?? 1,
      carrySpin: c?.spin ?? 1,
      // Where the page is: the phone, with no PC (its own server).
      pocket: true,
    };
  }

  addLog(direction, text) {
    this.logged++;
    this.log.push({ at: new Date(this.now()).toISOString(), direction, text: String(text).slice(0, 400) });
    if (this.log.length > LOG_LINES) this.log.splice(0, this.log.length - LOG_LINES);
  }

  // ---- Shots -------------------------------------------------------------------

  // A shot read (an Open Connect message's, interpret), played: to every
  // page, as server.mjs deliverShot does - a launch monitor's sent twice
  // played once.
  deliverShot(msg, source) {
    const now = this.now();
    const why = repeatShot(this.state.lastDelivered, { source, at: now, ball: msg.ball }, REPEAT_MS);
    if (why) {
      this.addLog("info", repeatWords(why, (now - this.state.lastDelivered.at) / 1000));
      return null;
    }
    this.state.lastDelivered = { source, at: now, ball: msg.ball };
    this.state.shotCount++;
    const entry = {
      source,
      at: new Date(now).toISOString(),
      club: this.state.club,
      ball: msg.ball,
      clubData: trustedClub(msg.deviceId, msg.club ?? null) ?? null,
      deviceId: msg.deviceId ?? source,
    };
    const measured = msg.measuredSpin !== undefined ? msg.measuredSpin : measuredSpinOf(msg.deviceId);
    if (measured !== undefined) entry.measuredSpin = measured;
    entry.shotNumber = this.state.shotCount;
    if (msg.omni) entry.omni = msg.omni;
    this.state.lastShot = entry;
    this.state.deviceId = entry.deviceId;
    this.broadcast("shot", entry);
    this.broadcast("status", this.status());
    return entry;
  }

  // The Omni's shot, from the page's own Bluetooth link (omnilink.js onShot).
  omniShot({ ball, measuredSpin, hex } = {}) {
    const msg = interpret({
      DeviceID: "Square Omni (Bluetooth)",
      ShotDataOptions: { ContainsBallData: true },
      BallData: { Speed: ball?.speedMph, VLA: ball?.vla, HLA: ball?.hla, TotalSpin: ball?.totalSpin, SpinAxis: ball?.spinAxis },
    });
    if (msg.kind !== "shot") return null;
    this.state.lastHeartbeat = this.now();
    return this.deliverShot({ ...msg, measuredSpin: !!measuredSpin, omni: typeof hex === "string" ? { shot: hex } : undefined }, "omni");
  }

  // The club data that follows the Omni's shot (omnilink.js onClub).
  omniClub({ club } = {}) {
    if (!club || typeof club !== "object") return false;
    const last = this.state.lastShot;
    const shotNumber = this.state.shotCount;
    if (last?.shotNumber === shotNumber && !last.clubData) last.clubData = club;
    this.broadcast("club", { shotNumber, clubData: club });
    this.addLog("info", `club data ${JSON.stringify(club)}`);
    return true;
  }

  // The Omni link's state (omnilink.js onState), for the top bar.
  omniState(s) {
    const before = JSON.stringify(this.state.omni);
    this.state.omni = s
      ? {
          state: String(s.state ?? "unknown").slice(0, 40),
          message: String(s.message ?? "").slice(0, 200),
          name: s.name ? String(s.name).slice(0, 60) : null,
          battery: Number.isFinite(s.battery) ? s.battery : null,
          armed: !!s.armed,
          ready: s.ready ? String(s.ready).slice(0, 20) : null,
          // (An Omni had and lost, looked for again: omni.js omniStatusLine.)
          reconnecting: !!s.reconnecting,
        }
      : null;
    if (this.state.omni?.state === "connected") this.state.lastHeartbeat = this.now();
    if (JSON.stringify(this.state.omni) !== before) this.broadcast("status", this.status());
  }

  // The search for the Omni on or off (POST /api/omni-search): the page's
  // own Bluetooth link starts or stops looking (pocket.mjs onOmniSearch).
  setOmniSearch(on) {
    if (on === this.omniSearch) return;
    this.omniSearch = on;
    try {
      this.onOmniSearch?.(on);
    } catch {
      // The link's business; the switch still holds.
    }
  }

  // ---- Requests ----------------------------------------------------------------

  // One request: { method, path, query (URLSearchParams), body (parsed
  // JSON, or null) } -> { status, json } (json undefined: no body).
  async handle({ method = "GET", path, query = new URLSearchParams(), body = null }) {
    const ok = (json, status = 200) => ({ status, json });
    const none = (status = 204) => ({ status });
    const b = body && typeof body === "object" ? body : {};
    if (path === "/api/status") return ok(this.status());
    if (path === "/api/club" && method === "POST") {
      const { club, distance, handed } = b;
      if (typeof club === "string" && /^[A-Z0-9]{1,3}$/.test(club)) {
        this.state.club = club;
        this.state.clubChosen = true;
        this.state.distance = Number.isFinite(distance) && distance > 0 && distance < 1000 ? distance : 0;
        if (handed === "LH" || handed === "RH") this.state.handed = handed;
        try {
          this.onClub?.(club);
        } catch {
          // The Omni's business; the club still goes to the pages.
        }
        this.broadcast("status", this.status());
      }
      return ok(this.status());
    }
    if (path === "/api/test-shot" && method === "POST") {
      const msg = interpret(b);
      if (msg.kind === "shot") this.deliverShot(msg, "test");
      return none(msg.kind === "shot" ? 200 : 400);
    }
    if (path === "/api/round-ended" && method === "POST") return none();
    if (path === "/api/last-shot") return ok(this.state.lastShot ?? null);
    if (path === "/api/carry") return this.handleCarry(method, b);
    if (path === "/api/omni-search") {
      if (method === "POST") this.setOmniSearch(!!b.on);
      return ok({ on: this.omniSearch });
    }
    if (path === "/api/sounds" && method === "GET") return this.sounds ? ok(this.sounds) : ok({ dir: null, families: {}, skipped: [], pack: {} });
    if (path === "/api/wire") return ok(this.log.map((l) => ({ at: l.at, kind: l.direction, port: "BLE", peer: "Omni", text: l.text })));
    if (path.startsWith("/api/play")) return this.handlePlay(method, path, b);
    // Nothing kept or sent anywhere: said done.
    if (path === "/api/graphics" && method === "POST") return none();
    // The game's errors: the last few kept, for the Phone check page.
    if (path === "/api/client-error" && method === "POST") {
      this.store.set("errors", [...(this.store.get("errors") ?? []), { at: new Date(this.now()).toISOString(), ...b }].slice(-ERRORS_KEPT));
      return none();
    }
    if (path.startsWith("/api/courses")) return this.handleCourses(method, path, b);
    if (path === "/api/drive/courses" || path === "/api/drive/courses/sync") return this.handleCourseDrive(method, path, b);
    // A real course's ground files, and a course from the map: the PC's
    // (server/lidar.mjs, server/mapimport.mjs). None here, said as such.
    if (path === "/api/lidar" && method === "GET") return ok([]);
    if (path.startsWith("/api/lidar") || path.startsWith("/api/map/")) return ok({ error: "Real courses from the map are made in A² Golf on a PC - share one from there to play it here" }, 404);
    if (path.startsWith("/api/stats/")) return this.handleStats(method, path, b, query);
    if (path === "/api/accounts" || path.startsWith("/api/accounts/")) {
      const r = await this.accounts.request(method, path, b);
      return ok(r.json, r.status);
    }
    return ok(NOT_HERE, 404);
  }

  // The stats (the PC's server/stats.mjs handle): each write kept for the
  // PC, answered as the PC would with nothing worked out (no strike, no
  // club check - the phone hasn't the history), its shot an id the writes
  // after it name; a player's handicaps as the PC last sent them.
  handleStats(method, path, b, query) {
    const ok = (json, status = 200) => ({ status, json });
    const what = path.slice("/api/stats/".length);
    if (method === "GET" && what === "player") {
      const name = query.get("name");
      const h = (this.store.get("handicaps") ?? {})[name];
      const mine = this.outboxOf(name);
      if (!h && !mine.length) return ok(NOT_HERE, 404);
      return ok({ name, phone: true, handicap: { index: h?.handicap?.index ?? null, rounds: h?.handicap?.rounds ?? 0 }, madeUp: h?.madeUp ?? {}, skills: this.skillsOf(name, h, mine), insights: [], clubs: [] });
    }
    if (method !== "POST" || !SYNC_PATHS.includes(what)) return ok(NOT_HERE, 404);
    if (typeof b.player !== "string" || !b.player.trim()) return ok({ error: "Whose?" }, 400);
    // Skill points spent: checked as the PC checks them (sim/skills.mjs),
    // against what's earned - the PC's last word and the rounds since.
    if (what === "skills") {
      const now = this.skillsOf(b.player);
      const r = checkSpend(now, b.ranks, { seasonStart: Number.isFinite(b.seasonStart) ? b.seasonStart : null, at: this.now() });
      if (!r.ok) return ok({ error: r.why }, 400);
      // (re: a re-spend, counted on the phone until the PC has it - the PC
      // works its own out.)
      outboxAdd(this.store, what, { player: b.player, ranks: r.ranks, ...(r.re ? { re: 1 } : {}), ...(Number.isFinite(b.seasonStart) ? { seasonStart: b.seasonStart } : {}) }, this.now());
      return ok(this.skillsOf(b.player));
    }
    const { id } = outboxAdd(this.store, what, b, this.now());
    if (what === "shot") return ok({ id, swing: null, special: null, check: null, strike: null, why: null, odd: null, unusual: null, power: null, modswing: null });
    if (what === "club") return ok({ id: b.id, strike: null, why: null, odd: null });
    if (what === "marks") return ok({ say: b.say, ids: Array.isArray(b.ids) ? b.ids : [] });
    if (what === "game") return ok({ kind: b.kind });
    return ok({ id: b.id });
  }

  // A player's writes waiting for the PC.
  outboxOf(name) {
    return outboxAll(this.store).filter((e) => e.body?.player === name);
  }

  // A player's skill points on the phone: the PC's as last sent, and the
  // games and spending since (sim/skills.mjs skillsOf).
  skillsOf(name, h = (this.store.get("handicaps") ?? {})[name], mine = this.outboxOf(name)) {
    const games = mine.filter((e) => e.path === "game").map((e) => ({ ...e.body, t: e.t }));
    const lines = mine.filter((e) => e.path === "skills").map((e) => ({ ranks: e.body.ranks, t: e.t, re: e.body.re === 1 }));
    return skillsOf(games, lines, h?.skills ?? null);
  }

  // Online play (the PC's server/netplay.mjs handle, by code only): the
  // game as this phone has it, hosting, joining with a code, the round
  // started, this phone's shots and changes, leaving.
  async handlePlay(method, path, b) {
    const play = this.play;
    const ok = (json, status = 200) => ({ status, json });
    try {
      if (path === "/api/play" && method === "GET") return ok(play.view());
      if (path === "/api/play/course" && method === "GET") return play.course ? ok(play.course) : ok({ error: "No course yet" }, 404);
      // No home network to look on, nor Tailscale: by code only.
      if (path === "/api/play/find" && method === "GET") return ok([]);
      if (method !== "POST") return ok(NOT_HERE, 404);
      if (path === "/api/play/host") return ok(await play.host(b));
      if (path === "/api/play/join") {
        if (!b.code) throw new Error("On the phone a game's joined with its code - the one on the host's screen");
        return ok(await play.joinCode(b));
      }
      if (path === "/api/play/start") {
        // The course from the ones here - the app's, or one kept on this
        // device (the host sends it to the others).
        const id = String(b.courseId ?? "");
        const course = (b.mode ?? "course") === "course" ? await this.courseById(id) : null;
        return ok(play.start({ ...b, course }));
      }
      if (path === "/api/play/event") {
        const r = await play.send(b.event);
        return ok(r, r.ok === false ? 409 : 200);
      }
      if (path === "/api/play/leave") {
        await play.leave();
        return ok(play.view());
      }
      // The game kept from before the app started again: back into it, or
      // forgotten.
      if (path === "/api/play/rejoin") return ok(await play.rejoin());
      if (path === "/api/play/forget") return ok(play.forget());
      return ok(NOT_HERE, 404);
    } catch (err) {
      return ok({ error: err.message }, 400);
    }
  }

  handleCarry(method, b) {
    if (method === "POST") {
      const p = Number(b.percent);
      if (!Number.isFinite(p)) return { status: 400, json: { error: "A percent, please" } };
      const scale = scaleForCarryPercent(p);
      this.store.set("carry", scale == null ? null : { scale, fm: FLIGHT_MODEL, at: new Date(this.now()).toISOString(), n: null });
      this.broadcast("status", this.status());
    }
    const c = this.carry();
    return { status: 200, json: { percent: c ? carryPercentOf(c.scale, c.spin ?? 1) : 0, carryMatch: c?.scale ?? 1, carrySpin: c?.spin ?? 1 } };
  }

  // ---- Courses ------------------------------------------------------------------

  // The courses the app comes with: listed (with each one's rounds), read,
  // and a round kept - never saved over or deleted. The courses kept on
  // this device (sim/coursekeep.mjs): friends', fetched by code from the
  // relay, and the ones made here in the web version's designer.

  // One of the app's own.
  fromApp(id) {
    return this.courses.list.some((c) => c.id === id);
  }

  // A course here by its id: one kept on this device, or one of the app's.
  async courseById(id) {
    await this.keptReady;
    if (this.kept.has(id)) return this.kept.get(id);
    return this.fromApp(id) ? this.courses.get(id) : null;
  }

  // Friends' courses kept before in the page's small storage
  // ("sharedCourses"), which a course on hills soon fills: across to where
  // courses are kept now, once.
  async moveShared() {
    const old = this.store.get("sharedCourses");
    if (!old || typeof old !== "object") return;
    for (const [id, course] of Object.entries(old)) {
      try {
        if (!this.kept.has(id)) await this.kept.save(id, course);
      } catch {
        // Not a course any more: let go of.
      }
    }
    this.store.set("sharedCourses", null);
  }

  async handleCourses(method, path, b) {
    await this.keptReady;
    const fail = (err, status = 400) => ({ status, json: { error: err.message ?? String(err) } });
    if (path === "/api/courses/shared" && method === "POST") return this.sharing.fetch(String(b.code ?? "")).then((json) => ({ status: 200, json }), fail);
    // One made here, or a friend's (its own code again): the app's own
    // aren't shared - everyone has them.
    if (path === "/api/courses/share" && method === "POST") return this.sharing.share(String(b.id ?? "")).then((json) => ({ status: 200, json }), fail);
    // A hole's trees kept as the game first grew them, and the course's
    // cart paths (the PC's PUT .../trees/<n> and .../paths): for a course
    // kept here; the app's own are made the same every time.
    const t = /^\/api\/courses\/([^/]+)\/(?:trees\/(\d+)|paths)$/.exec(path);
    if (t) {
      if (!COURSE_ID.test(t[1])) return { status: 400, json: { error: "Bad course id" } };
      if (method !== "PUT") return { status: 405, json: { error: "Not allowed" } };
      if (!this.kept.has(t[1])) return { status: 404, json: NOT_HERE };
      return (t[2] == null ? this.kept.keepPaths(t[1], b) : this.kept.keepTrees(t[1], Number(t[2]), b)).then(() => ({ status: 200, json: { ok: true } }), fail);
    }
    const m = /^\/api\/courses(?:\/([^/]+))?(\/rounds)?$/.exec(path);
    if (!m) return { status: 404, json: NOT_HERE };
    const [, rawId, rounds] = m;
    let id = null;
    try {
      id = rawId == null ? null : decodeURIComponent(rawId);
    } catch {
      return { status: 400, json: { error: "Bad course id" } };
    }
    if (!id && method === "GET") return { status: 200, json: this.courseList() };
    if (!id || !COURSE_ID.test(id)) return { status: 400, json: { error: "Bad course id" } };
    const here = this.kept.has(id) || this.fromApp(id);
    if (rounds && method === "GET") return { status: 200, json: this.rounds(id) };
    if (rounds && method === "POST") {
      if (!here) return { status: 400, json: { error: "No such course" } };
      const entry = this.addRound(id, b);
      this.broadcast("courses", {});
      return { status: 200, json: entry };
    }
    if (method === "GET") {
      const c = await this.courseById(id);
      if (!c) return { status: 404, json: { error: "No such course" } };
      // (One of the app's: the designer saves its changes as a copy, as
      // the PC's does for the course that comes with the game.)
      return { status: 200, json: this.kept.has(id) ? c : { ...c, builtIn: true } };
    }
    if (method === "PUT") {
      if (this.fromApp(id) && !this.kept.has(id)) return { status: 400, json: { error: `${this.courses.list.find((c) => c.id === id).name} comes with the game and can't be changed - save it as a copy` } };
      if (!this.kept.lasting) return { status: 400, json: { error: "This browser isn't keeping anything for A² Golf (a private window?), so a course can't be saved here - open it in an ordinary window" } };
      try {
        const saved = await this.kept.save(id, b);
        this.broadcast("courses", {});
        return { status: 200, json: { id: saved.id, updated: saved.updated } };
      } catch (err) {
        return fail(err);
      }
    }
    if (method === "DELETE") {
      if (!this.kept.has(id)) return { status: 400, json: { error: this.fromApp(id) ? `${this.courses.list.find((c) => c.id === id).name} comes with the game and can't be deleted` : "No such course" } };
      await this.kept.remove(id);
      this.store.set(`rounds.${id}`, null);
      this.sharing.forget(id);
      this.broadcast("courses", {});
      return { status: 200, json: { ok: true } };
    }
    return { status: 405, json: { error: "Not allowed" } };
  }

  // The courses made here kept in the player's Google Drive (the PC's
  // server/coursedrive.mjs, here): GET how it is; POST { on, token, expires }
  // on or off; POST .../sync { token, expires } in step now. The token is
  // the page's own, from Google's pop-up (coursedrivebox.js) - none or run
  // out: needsToken, and the page asks Google again.
  courseDriveView() {
    const v = this.courseDrive.view();
    return { ...v, available: this.driveCourses, web: true, players: [], email: v.who, needsToken: !tokenFresh(this.driveToken, this.now()), signin: !!v.last?.signin };
  }
  async handleCourseDrive(method, path, b) {
    const ok = (json, status = 200) => ({ status, json });
    if (!this.driveCourses) return ok(NOT_HERE, 404);
    if (path === "/api/drive/courses" && method === "GET") return ok(this.courseDriveView());
    if (method !== "POST") return ok({ error: "Not allowed" }, 405);
    if (typeof b.token === "string" && b.token) this.driveToken = { access: b.token, until: this.now() + (Number(b.expires) > 0 ? Number(b.expires) : 3600) * 1000 };
    if (path === "/api/drive/courses" && !b.on) {
      this.courseDrive.turnOff();
      return ok(this.courseDriveView());
    }
    if (!tokenFresh(this.driveToken, this.now())) return ok({ ...this.courseDriveView(), error: "Google's permission is needed - allow A² Golf to keep its own files in your Drive" }, 400);
    if (path === "/api/drive/courses") {
      // Whose Drive, in words: the account Google's pop-up was answered with.
      this.courseDrive.turnOn((await this.driveFiles.whose().catch(() => null)) ?? "your Google account");
    } else if (!this.courseDrive.on) return ok({ ...this.courseDriveView(), error: "Keeping courses in Google Drive is off here" }, 400);
    await this.courseDrive.sync();
    return ok(this.courseDriveView());
  }

  rounds(id) {
    const r = this.store.get(`rounds.${id}`);
    return Array.isArray(r) ? r : [];
  }

  // As server/courses.mjs addRound keeps one.
  addRound(id, round) {
    const scores = Array.isArray(round?.scores) ? round.scores.map((s) => (Number.isInteger(s) && s > 0 && s < 30 ? s : null)) : [];
    const played = scores.filter((s) => s != null);
    const entry = {
      date: new Date(this.now()).toISOString(),
      scores,
      total: played.reduce((a, s) => a + s, 0),
      complete: played.length === scores.length && scores.length > 0,
    };
    const name = typeof round?.name === "string" ? round.name.trim().slice(0, 80) : "";
    if (name) entry.name = name;
    this.store.set(`rounds.${id}`, [...this.rounds(id), entry]);
    return entry;
  }

  // The list as server/courses.mjs gives it: each course's best round,
  // rounds played and when, from this phone's rounds.
  courseList() {
    // (A friend's says its code.)
    const kept = this.kept.list().map((c) => (codeOfShared(c.id) ? { ...c, shared: codeOfShared(c.id) } : c));
    return [...this.courses.list.filter((c) => !this.kept.has(c.id)), ...kept]
      .map((c) => {
        const rounds = this.rounds(c.id);
        const full = rounds.filter((r) => r.complete);
        const best = full.length ? Math.min(...full.map((r) => r.total)) : null;
        const bestBy = best == null ? null : (full.find((r) => r.total === best).name ?? null);
        return { ...c, best, ...(bestBy ? { bestBy } : {}), rounds: rounds.length, played: rounds.at(-1)?.date ?? null };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
