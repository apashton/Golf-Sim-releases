// Talks to a Square Golf Omni over Web Bluetooth, the way GSPro's connector
// does: find it, connect (two tries, eight seconds each), listen, disarm, tell
// it the club in hand, arm, and ask its status every four seconds, arming it
// again if it should be ready and isn't. Each shot is handed on at once; the
// club data asked for after it follows, and then the Omni is armed for the
// next shot. A change of club is told to it as GSPconnect does: disarmed, the
// club, armed again. If the link drops, it connects again.
//
// The Bluetooth object is passed in (navigator.bluetooth in the page, a fake
// in the tests), so everything here can be exercised without an Omni.

import {
  SERVICE_UUID,
  OMNI_SEARCH,
  WRITE_UUID,
  READ_UUID,
  SERIAL_UUID,
  armCommand,
  clubCommand,
  omniClub,
  statusCommand,
  clubDataCommand,
  parseMessage,
  shotToBall,
  clubToData,
  hex,
  typeName,
} from "./omni.js";
import { repeatOmniMessage } from "./sim/shotrepeat.mjs";

const CONNECT_TRIES = 2;
// After the link drops, one try straight back to the Omni, then a fresh
// search: when the first try failed (the drops of 18, 26 and 27 October,
// reports #475 and #491), a second on the same dropped connection never
// worked either - up to 16 s more without the Omni - while a search found
// it as soon as it showed again.
export const AFTER_DROP_TRIES = 1;
const CONNECT_TIMEOUT_MS = 8000;
const RETRY_WAIT_MS = 3000;
const STATUS_EVERY_MS = 4000;
// Connected, and nothing at all from the Omni for this long - not its
// heartbeat (every three seconds), not an answer to the status check
// (every four): it's gone quiet though the link says it's still there.
// The link is let go of and made afresh (wentQuiet).
export const SILENT_MS = 8000;
// Made afresh for going quiet this many times in SILENT_WINDOW_MS, and the
// Omni's left be (asleep, or out of reach) - said, not tried again and
// again; a word from it carries on as before.
export const SILENT_TRIES = 3;
export const SILENT_WINDOW_MS = 10 * 60 * 1000;
// Commands are sent one at a time with a gap, as GSPconnect does.
const COMMAND_GAP_MS = 200;
// If the club data never comes, arm for the next shot anyway - but only
// after a long wait. GSPconnect never arms early: it waits for the club
// data, and only its status check (two unarmed answers, about eight
// seconds) arms it otherwise. Arming again while the Omni is still working
// out the club data loses it; at 2.5 seconds, strike and face readings came
// far less often than through GSPro's connector.
const CLUB_DATA_WAIT_MS = 10000;
// GSPconnect's extra pause either side of telling the Omni the club.
const CLUB_CHANGE_GAP_MS = 100;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function withTimeout(promise, ms, what) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${what} took longer than ${ms / 1000} s`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

export class OmniLink {
  // bluetooth: navigator.bluetooth or a stand-in
  // onShot({ ball, measuredSpin, raw, bytes }), onClub({ club, raw, bytes })
  // - raw is the message decoded, bytes the message itself -
  // onState(state), onLog(direction, text) where direction is in, out or info,
  // onUnknown({ bytes, reason }) for a message it doesn't understand.
  constructor({
    bluetooth,
    onShot = () => {},
    onClub = () => {},
    onState = () => {},
    onLog = () => {},
    onUnknown = () => {},
    sleep = wait,
    now = () => Date.now(),
    // Wrapped: a browser refuses its own timer functions called as methods of
    // another object ("Illegal invocation").
    timers = {
      setInterval: (f, ms) => setInterval(f, ms),
      clearInterval: (id) => clearInterval(id),
      setTimeout: (f, ms) => setTimeout(f, ms),
      clearTimeout: (id) => clearTimeout(id),
    },
  }) {
    this.bluetooth = bluetooth;
    this.onShot = onShot;
    this.onClub = onClub;
    this.onStateChange = onState;
    this.onLog = onLog;
    this.onUnknown = onUnknown;
    this.sleep = sleep;
    this.now = now;
    this.timers = timers;
    this.device = null;
    this.write = null;
    this.read = null;
    this.seq = 0;
    this.queue = Promise.resolve();
    this.lastMessage = null;
    // The last shot message and when it came (a repeat of it is dropped).
    this.lastShotMessage = null;
    this.shouldBeArmed = false;
    this.unarmedCount = 0;
    this.poll = null;
    this.clubWait = null;
    this.busy = false;
    this.stopped = false;
    // The last device this page connected to or was given, kept after it's
    // forgotten for searching: the app's recovery tries it directly
    // (reconnectKnown) when searches have found nothing for a long time.
    this.lastDevice = null;
    this.listening = new WeakSet();
    this.recovering = false;
    this.scanning = false;
    // The club in hand, as the Omni knows it ({ code, clubType, clubNumber }),
    // and the one it was last told on this connection.
    this.club = null;
    this.clubCode = null;
    this.toldClub = null;
    // The club change being told, if one is under way.
    this.changingClub = null;
    this.state = { state: "idle", message: "Not started", battery: null, serial: null, armed: false, ready: null, name: null, reconnecting: false };
  }

  setState(patch) {
    this.state = { ...this.state, ...patch };
    this.onStateChange(this.state);
  }

  log(direction, text) {
    this.onLog(direction, text);
  }

  // True when there's no Omni to talk to and nothing under way, so a search
  // is due. A search needs a click in a browser; the app supplies one.
  get wantsScan() {
    return !this.stopped && !this.busy && !this.recovering && !this.device;
  }

  // Looks for the Omni. The browser (or the app) shows or picks from the
  // devices found; only an Omni is accepted.
  async scan() {
    if (this.busy || this.stopped) return false;
    this.busy = true;
    this.scanning = true;
    // (reconnecting: an Omni was had and lost, rather than none found yet.)
    this.setState({ state: "searching", message: "Looking for the Omni...", reconnecting: !!this.lastDevice });
    try {
      const device = await this.bluetooth.requestDevice(OMNI_SEARCH);
      this.adopt(device);
    } catch (err) {
      this.busy = false;
      this.scanning = false;
      // Searches repeat every few seconds while the Omni is off; the same
      // result is logged once a minute, not every time.
      const text = `search: no Omni found (${err?.message ?? err})`;
      const now = Date.now();
      if (text !== this.lastSearchLog?.text || now - this.lastSearchLog.at > 60000) {
        this.log("info", text);
        this.lastSearchLog = { text, at: now };
      }
      this.setState({ state: "searching", message: `No Omni found yet (${err?.message ?? err})` });
      return false;
    }
    this.busy = false;
    this.scanning = false;
    return this.connect();
  }

  // Takes a device found some other way (a reconnect, or the tests).
  adopt(device) {
    this.device = device;
    this.lastDevice = device;
    this.log("info", `found ${device.name ?? "a device"}`);
    this.setState({ name: device.name ?? null });
    // Only this device's disconnects count, not one from before a new search.
    // Listened to once, however often it's adopted again.
    if (!this.listening.has(device)) {
      this.listening.add(device);
      device.addEventListener?.("gattserverdisconnected", () => this.device === device && this.lost());
    }
  }

  // After a long time with searches finding no Omni (the app decides when:
  // electron/omnirecovery.mjs), connect straight to an Omni this page has
  // had before, without waiting for a search to see it: the one it last
  // talked to, and any the browser remembers for this page
  // (bluetooth.getDevices, where there is one - in the app, Electron may
  // not list any). A search only sees an Omni that is advertising; if
  // Windows still holds a connection to it from before, it may never
  // advertise again until that's let go, but a direct connect can still
  // reach it. Resolves to a line for the log saying what happened.
  async reconnectKnown() {
    if (this.stopped) return "not tried: the Bluetooth connection is off";
    if (this.recovering) return "not tried: already trying";
    this.recovering = true;
    try {
      // A search under way (the app answers it first, so it ends at once):
      // waited for, briefly, and no new one starts meanwhile.
      for (let i = 0; this.scanning && i < 50; i++) await this.sleep(100);
      if (this.device || this.busy) return "not tried: already connecting or connected";
      const candidates = [];
      if (this.lastDevice) candidates.push(this.lastDevice);
      let remembered = "this browser can't list remembered devices";
      if (typeof this.bluetooth?.getDevices === "function") {
        try {
          const list = (await this.bluetooth.getDevices()) ?? [];
          remembered = `the browser remembers ${list.length} device${list.length === 1 ? "" : "s"}`;
          // Only an Omni is ever given to this page, so whatever it
          // remembers is one; at most a few are tried.
          for (const d of list) if (d && !candidates.some((c) => c === d || (c.id && c.id === d.id))) candidates.push(d);
        } catch (err) {
          remembered = `couldn't list remembered devices (${err?.message ?? err})`;
        }
      }
      const tries = candidates.slice(0, 3);
      if (!tries.length) return `nothing to connect to directly (no Omni since this page opened; ${remembered})`;
      for (const device of tries) {
        if (this.stopped || this.device) break;
        this.log("info", `recovery: connecting straight to ${device.name ?? "the Omni seen before"} (${remembered})`);
        this.adopt(device);
        if (await this.connect()) return `connected straight to ${device.name ?? "the Omni seen before"}`;
      }
      return `couldn't connect straight to the Omni seen before (${tries.length} tried; ${remembered})`;
    } finally {
      this.recovering = false;
    }
  }

  // tries: CONNECT_TRIES, or AFTER_DROP_TRIES straight after a drop (lost).
  async connect({ tries = CONNECT_TRIES } = {}) {
    if (!this.device || this.busy || this.stopped) return false;
    this.busy = true;
    try {
      for (let attempt = 1; attempt <= tries; attempt++) {
        this.setState({ state: "connecting", message: tries > 1 ? `Connecting to ${this.device.name ?? "the Omni"} (try ${attempt} of ${tries})...` : `Connecting to ${this.device.name ?? "the Omni"} again...` });
        await this.sleep(RETRY_WAIT_MS);
        if (this.stopped) return false;
        try {
          const server = await withTimeout(this.device.gatt.connect(), CONNECT_TIMEOUT_MS, "Connecting");
          await this.setup(server);
          this.log("info", "connected");
          this.setState({ state: "connected", message: "Connected", reconnecting: false });
          await this.sleep(100);
          await this.disarm();
          await this.sleep(100);
          if (this.club) {
            await this.sendClub(this.club);
            await this.sleep(CLUB_CHANGE_GAP_MS);
          }
          await this.arm();
          // Lost again while getting it ready: try again, as for a failed try.
          if (!this.write) throw new Error("lost the Omni while getting it ready");
          return true;
        } catch (err) {
          this.log("info", `connect try ${attempt} failed: ${err?.message ?? err}`);
          this.teardown();
        }
      }
      // Not this time: forget it, so the next search finds it afresh.
      if (tries < CONNECT_TRIES) {
        this.log("info", "not back on the first try: searching for it afresh");
        this.setState({ state: "searching", message: "Lost the Omni - looking for it again..." });
      } else this.setState({ state: "searching", message: "Couldn't connect - is another program using the Omni?" });
      this.device = null;
      return false;
    } finally {
      this.busy = false;
      // The club changed while it was connecting: tell it now.
      if (this.write && this.clubToTell()) this.changeClub();
    }
  }

  async setup(server) {
    const service = await server.getPrimaryService(SERVICE_UUID);
    this.write = await service.getCharacteristic(WRITE_UUID);
    this.read = await service.getCharacteristic(READ_UUID);
    this.onValue = (e) => this.receive(new Uint8Array(e.target.value.buffer, e.target.value.byteOffset, e.target.value.byteLength));
    this.read.addEventListener("characteristicvaluechanged", this.onValue);
    await this.read.startNotifications();
    try {
      const serial = await (await service.getCharacteristic(SERIAL_UUID)).readValue();
      const bytes = new Uint8Array(serial.buffer, serial.byteOffset, serial.byteLength);
      this.log("info", `serial ${hex(bytes)}`);
      this.setState({ serial: hex(bytes) });
    } catch {
      // Not every model has it; GSPconnect doesn't need it either.
    }
    this.startPolling();
  }

  startPolling() {
    this.stopPolling();
    this.heard = this.now();
    this.poll = this.timers.setInterval(() => {
      // It can stay "connected" and stop answering (SILENT_MS).
      if (this.write && this.now() - this.heard > SILENT_MS) this.wentQuiet();
      this.send(statusCommand());
    }, STATUS_EVERY_MS);
  }

  // Connected, but nothing heard for SILENT_MS: said, the link let go of
  // (the stuck one isn't taken back) and made again - unless that's been
  // done SILENT_TRIES times lately, when the Omni is left be and the
  // message says so (a word from it puts that right: receive).
  wentQuiet() {
    const now = this.now();
    this.quietAt = (this.quietAt ?? []).filter((t) => now - t < SILENT_WINDOW_MS);
    if (this.quietAt.length >= SILENT_TRIES) {
      if (!this.toldQuiet) {
        this.leftBeAt = now;
        this.log("info", `nothing heard for ${Math.round((now - this.heard) / 1000)} s, again: left be`);
        this.setState({ message: "The Omni isn't answering - is it asleep? Wake it, or connect again" });
      }
      this.toldQuiet = true;
      return;
    }
    this.quietAt.push(now);
    this.log("info", `nothing heard for ${Math.round((now - this.heard) / 1000)} s while connected: connecting again`);
    this.lost({ message: "The Omni stopped answering - connecting again...", letGo: true });
  }

  // Another go (the phone's app back in front, or a while after it was left
  // be: pocket/pocket.mjs): an Omni left be for going quiet - asleep, say,
  // and woken since - is let go of and connected again, its count of quiet
  // spells started afresh. True if it was. How long it's been left be:
  // quietFor().
  wake() {
    if (this.stopped || !this.toldQuiet || !this.device) return false;
    this.quietAt = [];
    this.toldQuiet = false;
    this.log("info", "trying the Omni again after leaving it be");
    this.lost({ message: "Connecting to the Omni again...", letGo: true });
    return true;
  }
  quietFor() {
    return this.toldQuiet ? this.now() - (this.leftBeAt ?? this.now()) : 0;
  }
  stopPolling() {
    if (this.poll) this.timers.clearInterval(this.poll);
    this.poll = null;
  }

  // Drops everything about the current connection.
  teardown() {
    this.stopPolling();
    if (this.clubWait) this.timers.clearTimeout(this.clubWait);
    this.clubWait = null;
    if (this.read && this.onValue) this.read.removeEventListener?.("characteristicvaluechanged", this.onValue);
    this.read = null;
    this.write = null;
    this.lastMessage = null;
    // A new connection is told the club afresh.
    this.toldClub = null;
    this.setState({ armed: false, ready: null });
  }

  // The Omni went away (switched off, out of range, taken by another
  // program) - or went quiet (wentQuiet: letGo, the link still up, let go
  // of first so connecting makes a new one).
  lost({ message = "Lost the Omni - reconnecting...", letGo = false } = {}) {
    if (!this.write && this.state.state !== "connected") return;
    this.log("info", letGo ? "letting go of the Bluetooth connection" : "lost the Bluetooth connection");
    // When, and the Omni's message count then (noteBack, once it's back).
    this.dropped ??= { at: this.now(), heard: this.heard ?? null, count: this.lastCount ?? null };
    this.teardown();
    this.setState({ state: "searching", message, reconnecting: true });
    if (letGo) {
      try {
        this.device?.gatt?.disconnect();
      } catch {
        // Gone already.
      }
    }
    if (!this.stopped) this.connect({ tries: AFTER_DROP_TRIES });
  }

  // Back after a drop: how long it took, and whether the Omni went on
  // sending while nothing came through. Its ready and status messages are
  // numbered (the third byte, a count that carries on over a reconnect), so
  // a gap in the numbers is messages it sent that never arrived - the PC's
  // Bluetooth not hearing it - and none missing, that it had stopped.
  noteBack(count) {
    const d = this.dropped;
    this.dropped = null;
    const gone = Math.round((this.now() - d.at) / 1000);
    if (d.count == null) return this.log("info", `back after ${gone} s`);
    const missed = (count - d.count - 1 + 256) % 256;
    const silent = d.heard == null ? "" : `, ${Math.round((d.at - d.heard) / 1000)} s after it was last heard`;
    this.log("info", `back after ${gone} s${silent}: ${missed ? `${missed} of the Omni's messages never arrived - it went on sending while nothing came through` : "none of the Omni's messages missing - it had stopped sending"}`);
  }

  // Sends a command in turn, stamping its sequence number. Resolves true once
  // it's written, false if there was no link or the write failed.
  send(bytes) {
    const run = async () => {
      if (!this.write) return false;
      bytes[2] = this.seq;
      this.seq = (this.seq + 1) & 0xff;
      this.log("out", `${typeName(bytes[1])} (${hex(bytes)})`);
      let written = true;
      try {
        if (this.write.writeValueWithoutResponse) await this.write.writeValueWithoutResponse(bytes);
        else await this.write.writeValue(bytes);
      } catch (err) {
        written = false;
        this.log("info", `couldn't send: ${err?.message ?? err}`);
      }
      await this.sleep(COMMAND_GAP_MS);
      return written;
    };
    this.queue = this.queue.then(run, run);
    return this.queue;
  }

  arm() {
    this.shouldBeArmed = true;
    return this.send(armCommand(true));
  }
  disarm() {
    this.shouldBeArmed = false;
    return this.send(armCommand(false));
  }

  // The club in hand (A-Squared Golf's code: DR, 7I, PT...), told to the Omni when
  // it changes. Just after a shot, while its club data is still to come, the
  // change waits and goes with the arming for the next shot; while connecting,
  // it goes with the connecting.
  setClub(code) {
    if (code === this.clubCode) return;
    this.clubCode = code;
    const club = omniClub(code);
    if (!club) {
      this.log("info", `club ${code}: the Omni has no number for it - left as it was`);
      return;
    }
    this.club = club;
    if (!this.write || this.busy || this.clubWait) return;
    return this.changeClub();
  }

  // The club it should have, if it hasn't been told it yet.
  clubToTell() {
    const c = this.club;
    return c && this.toldClub !== `${c.clubType}/${c.clubNumber}` ? c : null;
  }

  // Disarmed, told the club, armed again - GSPconnect's way - one change at a
  // time. A club picked while one is being told (scrolling through the bag,
  // or into putting and straight back out) is told in the same go, before
  // arming: the Omni is never told a club while armed, and is always left
  // with the latest. A club command that fails is tried once more; if that
  // fails too, it's told again with the arming after the next shot.
  changeClub() {
    if (this.changingClub) return this.changingClub.then(() => this.changeClub());
    if (!this.clubToTell()) return Promise.resolve();
    const run = async () => {
      await this.disarm();
      let failures = 0;
      let club;
      while (this.write && failures < 2 && (club = this.clubToTell())) {
        await this.sleep(CLUB_CHANGE_GAP_MS);
        if (!(await this.sendClub(club))) failures++;
        await this.sleep(CLUB_CHANGE_GAP_MS);
      }
      await this.arm();
    };
    this.changingClub = run().finally(() => (this.changingClub = null));
    return this.changingClub;
  }

  // Resolves true once the Omni has the club (the command was written).
  async sendClub(club) {
    this.log("info", `club ${club.code}${club.clubType === 7 ? " (putting)" : ""}`);
    // A-Squared Golf is right-handed.
    const written = await this.send(clubCommand(club.clubType, club.clubNumber, true));
    if (written) this.toldClub = `${club.clubType}/${club.clubNumber}`;
    return written;
  }

  // Ready for the next shot, telling it first of a club changed since.
  armForNextShot() {
    return this.clubToTell() ? this.changeClub() : this.arm();
  }

  receive(bytes) {
    // Anything at all, a repeat too, says it's there (wentQuiet).
    this.heard = this.now();
    if (this.toldQuiet) {
      this.toldQuiet = false;
      this.setState({ message: "Connected" });
    }
    // The Omni can repeat itself; GSPconnect ignores an exact repeat.
    if (this.lastMessage && this.lastMessage.length === bytes.length && this.lastMessage.every((b, i) => b === bytes[i])) return;
    this.lastMessage = Uint8Array.from(bytes);
    const msg = parseMessage(bytes);
    // The Omni's message count (noteBack).
    if ((msg.type === "ready" || msg.type === "status") && bytes.length > 2) {
      if (this.dropped) this.noteBack(bytes[2]);
      this.lastCount = bytes[2];
    }
    // Every three seconds, and nothing to act on: not worth a log line.
    if (msg.type === "heartbeat") return;
    this.log("in", `${msg.type === "battery" ? "battery" : typeName(bytes[1] ?? 0)} (${hex(bytes)})`);
    switch (msg.type) {
      case "battery":
        this.setState({ battery: msg.level });
        break;
      case "ready":
        this.setState({ ready: msg.ready });
        break;
      case "status":
        this.setState({ armed: msg.armed, status: msg.status });
        // Should be armed and twice in a row isn't: arm again.
        if (this.shouldBeArmed && msg.status < 3) {
          if (++this.unarmedCount > 1) {
            this.unarmedCount = 0;
            this.log("info", "not armed when it should be - arming again");
            this.arm();
          }
        } else this.unarmedCount = 0;
        break;
      case "shot": {
        // The same shot message again (the Omni sends one twice now and
        // then, report #362): dropped, so the swing flies once and its club
        // data is asked for once (sim/shotrepeat.mjs).
        const again = { hex: hex(bytes), at: this.now() };
        if (repeatOmniMessage(this.lastShotMessage, again)) {
          this.log("info", `the same shot message again ${((again.at - this.lastShotMessage.at) / 1000).toFixed(2)} s after it - not played twice`);
          break;
        }
        this.lastShotMessage = again;
        // The club it was hit with, for its club data's high/low offset
        // (and the kind of head, for the owner's face corrections).
        this.shotOffset = this.club?.offset ?? 0;
        this.shotClub = this.clubCode ?? this.club?.code ?? null;
        const ball = shotToBall(msg);
        if (ball) this.onShot({ ball, measuredSpin: msg.measuredSpin, raw: msg, bytes: this.lastMessage });
        else this.log("info", "shot without a ball speed - ignored");
        this.send(clubDataCommand());
        // Armed again when the club data comes, or after a short wait.
        if (this.clubWait) this.timers.clearTimeout(this.clubWait);
        this.clubWait = this.timers.setTimeout(() => {
          this.clubWait = null;
          this.log("info", "no club data - arming for the next shot");
          this.armForNextShot();
        }, CLUB_DATA_WAIT_MS);
        break;
      }
      case "club": {
        // Measured against the club the shot was hit with, even if the club
        // in hand has changed since.
        const offset = this.shotOffset ?? this.club?.offset ?? 0;
        const clubCode = this.shotClub ?? this.clubCode ?? null;
        this.onClub({ club: clubToData(msg, undefined, offset), raw: msg, bytes: this.lastMessage, offset, clubCode });
        if (this.clubWait) {
          this.timers.clearTimeout(this.clubWait);
          this.clubWait = null;
        }
        this.armForNextShot();
        break;
      }
      default:
        this.log("info", `not understood: ${msg.reason}`);
        this.onUnknown({ bytes: this.lastMessage, reason: msg.reason });
    }
  }

  // Lets go of the Omni, e.g. so GSPro's connector can have it.
  stop() {
    this.stopped = true;
    this.teardown();
    try {
      this.device?.gatt?.disconnect();
    } catch {
      // Already gone.
    }
    this.device = null;
    this.setState({ state: "off", message: "Bluetooth connection off" });
  }
}
