// Web Bluetooth's calls (navigator.bluetooth), made through the Android
// app's Bluetooth plugin (@capacitor-community/bluetooth-le, its BleClient):
// an app's web view has no Web Bluetooth of its own, so the Omni's link
// (omnilink.js) is handed this instead (docs/ANDROID-PLAN.md, "The Omni over
// Bluetooth") and talks to the Omni just as it does on the PC.
//
// Only what omnilink.js uses: requestDevice and getDevices; a device's
// name, id, gatt (connect, disconnect, connected, getPrimaryService) and its
// "gattserverdisconnected"; a service's getCharacteristic; a
// characteristic's startNotifications, "characteristicvaluechanged",
// readValue, writeValue and writeValueWithoutResponse.
//
// requestDevice doesn't show a list to pick from, as Chrome does: it looks
// for SCAN_MS and takes the first Omni it hears (by its name, or the Omni's
// service in what it says) - as the Windows app picks it from Chrome's
// list by itself (electron/omnipicker.mjs).
//
// Pure: the plugin is handed in (a fake in test/blebridge.test.mjs).

import { isOmniName, SERVICE_UUID } from "../omni.js";

export const SCAN_MS = 10_000;
const CONNECT_MS = 8_000;

const lower = (u) => String(u ?? "").toLowerCase();

// Bytes as the plugin takes them (a DataView).
function view(bytes) {
  if (bytes instanceof DataView) return bytes;
  if (ArrayBuffer.isView(bytes)) return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes instanceof ArrayBuffer) return new DataView(bytes);
  return new DataView(Uint8Array.from(bytes ?? []).buffer);
}

// A scan result the Omni's: its name (as it advertises it, or as the phone
// knows it), or the Omni's service among those it says it has.
export function isOmniResult(r) {
  if (!r) return false;
  if (isOmniName(r.localName) || isOmniName(r.device?.name)) return true;
  return [...(r.uuids ?? []), ...(r.device?.uuids ?? [])].some((u) => lower(u) === SERVICE_UUID);
}

class Listeners {
  constructor() {
    this.map = new Map();
  }
  add(type, f) {
    if (typeof f !== "function") return;
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type).add(f);
  }
  remove(type, f) {
    this.map.get(type)?.delete(f);
  }
  fire(type, event) {
    for (const f of [...(this.map.get(type) ?? [])]) {
      try {
        f(event);
      } catch {
        // One listener's trouble isn't the others'.
      }
    }
  }
}

class Characteristic {
  constructor(ble, device, service, uuid) {
    this.ble = ble;
    this.device = device;
    this.service = service;
    this.uuid = uuid;
    this.listeners = new Listeners();
    this.value = null;
  }
  addEventListener(type, f) {
    this.listeners.add(type, f);
  }
  removeEventListener(type, f) {
    this.listeners.remove(type, f);
  }
  async startNotifications() {
    await this.ble.startNotifications(this.device.id, this.service.uuid, this.uuid, (value) => {
      this.value = view(value);
      this.listeners.fire("characteristicvaluechanged", { type: "characteristicvaluechanged", target: this });
    });
    return this;
  }
  async stopNotifications() {
    await this.ble.stopNotifications(this.device.id, this.service.uuid, this.uuid);
    return this;
  }
  async readValue() {
    this.value = view(await this.ble.read(this.device.id, this.service.uuid, this.uuid));
    return this.value;
  }
  async writeValue(bytes) {
    await this.ble.write(this.device.id, this.service.uuid, this.uuid, view(bytes));
  }
  async writeValueWithoutResponse(bytes) {
    await this.ble.writeWithoutResponse(this.device.id, this.service.uuid, this.uuid, view(bytes));
  }
}

class Service {
  constructor(ble, device, uuid) {
    this.ble = ble;
    this.device = device;
    this.uuid = uuid;
  }
  async getCharacteristic(uuid) {
    const u = lower(uuid);
    const known = (await this.device.gatt.services())?.find((s) => lower(s.uuid) === this.uuid);
    if (known?.characteristics && !known.characteristics.some((c) => lower(c.uuid) === u)) throw new Error(`no characteristic ${u}`);
    return new Characteristic(this.ble, this.device, this, u);
  }
}

class Server {
  constructor(ble, device) {
    this.ble = ble;
    this.device = device;
    this.connected = false;
    this.found = null;
  }
  // Each connection's number: its loss is said once, however it's heard
  // (the plugin's word, or let go here).
  async connect() {
    const n = ++this.device.connection;
    await this.ble.connect(this.device.id, () => this.device.lost(n), { timeout: CONNECT_MS });
    if (n !== this.device.connection) throw new Error("let go while connecting");
    this.connected = true;
    this.found = null;
    return this;
  }
  disconnect() {
    const n = this.device.connection;
    Promise.resolve()
      .then(() => this.ble.disconnect(this.device.id))
      .catch(() => {});
    // As Web Bluetooth does: letting go says so too.
    if (this.connected) this.device.lost(n);
    this.connected = false;
  }
  // The services the Omni says it has (asked once a connection).
  async services() {
    this.found ??= Promise.resolve(this.ble.getServices(this.device.id)).catch(() => null);
    return this.found;
  }
  async getPrimaryService(uuid) {
    const u = lower(uuid);
    const list = await this.services();
    if (list && !list.some((s) => lower(s.uuid) === u)) throw new Error(`no service ${u}`);
    return new Service(this.ble, this.device, u);
  }
}

class Device {
  constructor(ble, { deviceId, name }) {
    this.id = deviceId;
    this.name = name ?? null;
    this.listeners = new Listeners();
    this.gatt = new Server(ble, this);
    this.connection = 0;
    this.saidLost = 0;
  }
  addEventListener(type, f) {
    this.listeners.add(type, f);
  }
  removeEventListener(type, f) {
    this.listeners.remove(type, f);
  }
  // Connection n gone (the plugin's word, or let go): said once.
  lost(n) {
    if (n !== this.connection || this.saidLost === n) return;
    this.saidLost = n;
    this.gatt.connected = false;
    this.listeners.fire("gattserverdisconnected", { type: "gattserverdisconnected", target: this });
  }
}

// navigator.bluetooth's stand-in over the plugin. timers: setTimeout and
// clearTimeout (wrapped, as the page's must be).
export function bluetoothFrom(ble, { scanMs = SCAN_MS, timers = { setTimeout: (f, ms) => setTimeout(f, ms), clearTimeout: (t) => clearTimeout(t) }, onLog = () => {} } = {}) {
  let ready = null;
  const known = new Map();
  const init = () => {
    ready ??= Promise.resolve(ble.initialize({ androidNeverForLocation: true })).catch((err) => {
      ready = null;
      throw err;
    });
    return ready;
  };
  const deviceFor = (d) => {
    const name = d.name ?? null;
    if (!known.has(d.deviceId)) known.set(d.deviceId, new Device(ble, { deviceId: d.deviceId, name }));
    const dev = known.get(d.deviceId);
    if (name && !dev.name) dev.name = name;
    return dev;
  };
  return {
    async requestDevice() {
      await init();
      if (typeof ble.isEnabled === "function" && !(await ble.isEnabled())) {
        try {
          await ble.requestEnable?.();
        } catch {
          // Said below.
        }
        if (!(await ble.isEnabled())) throw new Error("Bluetooth is off");
      }
      const seen = new Set();
      const found = await new Promise((resolve, reject) => {
        let done = false;
        let timer = null;
        const finish = (r, err) => {
          if (done) return;
          done = true;
          timers.clearTimeout(timer);
          Promise.resolve()
            .then(() => ble.stopLEScan())
            .catch(() => {});
          if (err) reject(err);
          else resolve(r);
        };
        timer = timers.setTimeout(() => finish(null, new Error(seen.size ? `no Omni among ${seen.size} device${seen.size === 1 ? "" : "s"} heard` : "nothing heard")), scanMs);
        Promise.resolve()
          .then(() =>
            ble.requestLEScan({ allowDuplicates: false }, (r) => {
              const id = r?.device?.deviceId;
              if (id && !seen.has(id)) {
                seen.add(id);
                onLog(`heard ${r.localName ?? r.device.name ?? "a device"} (${id})`);
              }
              if (id && isOmniResult(r)) finish(r);
            }),
          )
          .catch((err) => finish(null, err));
      });
      return deviceFor({ deviceId: found.device.deviceId, name: found.localName ?? found.device.name });
    },
    // The Omnis found since the app started (for a straight reconnect).
    async getDevices() {
      return [...known.values()];
    },
  };
}
