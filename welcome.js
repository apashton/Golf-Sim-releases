// The welcome screen: shown the first time A-Squared Golf opens (and on W after).
// Checks the launch monitor is connecting (in the app, the Omni over
// Bluetooth; with Bluetooth turned off, it helps set a connector to start
// with the app), and gets you hitting balls in one press.

import { SHORTCUTS } from "./bay.js";
import { loadSetting, saveSetting, esc } from "./util.js";
import { omniStatusLine } from "./omni.js";
import { LAUNCH_MONITORS, monitorById, monitorName, setupSteps, waitingName } from "./sim/launchmonitors.mjs";
import { PLAY_MODES } from "./sim/playmode.mjs";

// The "1. Launch monitor" line, from the server's status: HTML, with a
// coloured dot. GSPro's own connector running comes first: it has the Omni
// and A-Squared Golf can't read it. Then the Omni's Bluetooth state, as in the top
// bar: with Bluetooth on, port 921 being taken doesn't matter, and
// restarting A-Squared Golf wouldn't help the Omni connect.
//   app        running as the Windows app
//   bluetooth  the app's Bluetooth connection to the Omni is turned on
//   monitor    the launch monitor the player has (sim/launchmonitors.mjs):
//              for any but the Omni, what it waits for is that one's
//   phone      the Android app, which looks for the Omni itself
export function welcomeConnection(s, { app = false, bluetooth = false, monitor = "omni", phone = false } = {}) {
  if (!s) return `<span class="dot off"></span> Checking...`;
  const m = monitorById(monitor);
  if (m.id !== "omni" && !(s.connectors > 0) && s.omni?.state !== "connected") return waitingFor(m, s);
  const on921 = (s.ports ?? []).some((p) => p.port === 921 && p.state === "listening");
  const omni = omniStatusLine(s.omni, s.gspconnect);
  if (omni?.cls === "ok") return `<span class="dot ok"></span> <b>${esc(omni.text)}</b>. You're good to go.`;
  // GSPro's own connector has the Omni. (Once A-Squared Golf has the Omni itself,
  // the lines below say how that link is.) What to do after closing it
  // depends on how A-Squared Golf reaches the Omni.
  if (s.gspconnect && s.omni?.state !== "connected") {
    const then = !app
      ? "Once it's closed, press Connect on the Bluetooth page (omni.html) in Chrome or Edge."
      : s.omni || bluetooth
        ? "A² Golf connects to your launch monitor itself once it's closed."
        : "Once it's closed, turn Bluetooth on in the menu (M, Launch monitor) and A² Golf connects to your launch monitor itself.";
    return `<span class="dot warn"></span> <b>${esc(omni.text)}.</b> ${then}`;
  }
  if (s.connectors > 0) {
    const name = esc(monitorName(s.deviceId));
    // Connected isn't enough: the launch monitor has to say it's ready (or a
    // shot has come through) before it's worth hitting.
    if (!s.ready && !(s.shotCount > 0)) return `<span class="dot warn"></span> <b>${name} connected</b> - not ready yet. Check the launch monitor is on and sees a ball.`;
    return `<span class="dot ok"></span> <b>${name} connected</b>${s.ready ? " and ready" : ""}. You're good to go.`;
  }
  if (omni) {
    // Connected but not yet ready happens for a moment after every shot.
    const next = s.omni?.state === "connected" ? "Give it a moment to get ready for the next shot." : "Switch your launch monitor on; A² Golf connects to it by itself.";
    return `<span class="dot ${omni.cls}"></span> <b>${esc(omni.text)}.</b> ${next}`;
  }
  if (phone) return `<span class="dot off"></span> <b>Looking for your launch monitor...</b> Switch it on; A² Golf connects to it by itself.`;
  if (app && bluetooth && s.omni?.state === "unavailable") {
    return `<span class="dot warn"></span> <b>Bluetooth isn't working</b>${s.omni.message ? ` (${esc(s.omni.message)})` : ""}. Check Bluetooth is switched on in Windows.`;
  }
  if (app && bluetooth) return `<span class="dot off"></span> <b>Starting Bluetooth...</b> Switch your launch monitor on; A² Golf connects to it by itself.`;
  if (s.ports?.length && !on921) {
    return `<span class="dot warn"></span> <b>Port 921 is taken</b> by another program. Close it, then restart A² Golf.`;
  }
  if (app) {
    return `<span class="dot off"></span> <b>Waiting for a connector on port 921.</b> Bluetooth is turned off, so shots come from a connector that speaks Open Connect - or turn Bluetooth back on (<kbd>M</kbd>, Square Omni).`;
  }
  return `<span class="dot off"></span> <b>Waiting for the launch monitor.</b> In Chrome or Edge, connect it by hand: Connection check, then the Bluetooth page (omni.html), then Connect - or start a connector that speaks Open Connect.`;
}

// Waiting for a launch monitor other than the Omni: what it's waiting for,
// and where the steps are.
function waitingFor(m, s) {
  const name = esc(waitingName(m.id));
  const steps = "the steps are below (and in the menu: <kbd>M</kbd>, Launch monitor)";
  if (m.route === "none") return `<span class="dot warn"></span> <b>${name} can't send shots to A² Golf yet</b> - its software doesn't send them in a form A² Golf can read.`;
  if (m.route === "e6") {
    if (s.e6 && s.e6.state === "failed") return `<span class="dot warn"></span> <b>A² Golf can't listen for the Garmin Golf app</b> (${esc(s.e6.error ?? "port taken")}). Close anything else using port ${esc(s.e6.port)}, then restart A² Golf.`;
    return `<span class="dot off"></span> <b>Waiting for your ${name}.</b> Connect the Garmin Golf app's E6 Connect to this PC - ${steps}.`;
  }
  const on921 = (s.ports ?? []).some((p) => p.port === 921 && p.state === "listening");
  if (s.ports?.length && !on921) return `<span class="dot warn"></span> <b>Port 921 is taken</b> by another program. Close it, then restart A² Golf.`;
  return `<span class="dot off"></span> <b>Waiting for your ${name}.</b> Start the program that sends its shots - ${steps}.`;
}

export class Welcome {
  // actions: { range(), putting(), chipping(), challenges(), course(id) }
  // monitor(): the launch monitor the player has; onMonitor(id): they chose
  // another (app.js setLaunchMonitor). playMode: the Android app's touch
  // screen or launch monitor (app/playmode.js) - in the app, the first
  // choice here.
  constructor({ bridge = null, actions, toast = () => {}, monitor = () => "omni", onMonitor = () => {}, playMode = null }) {
    this.bridge = bridge;
    this.playMode = playMode?.inApp ? playMode : null;
    this.actions = actions;
    this.toast = toast;
    this.monitor = monitor;
    this.onMonitor = onMonitor;
    this.status = null;
    this.courses = [];
    this.el = document.createElement("div");
    this.el.className = "bay-help welcome";
    this.el.hidden = true;
    document.body.appendChild(this.el);
  }

  get open() {
    return !this.el.hidden;
  }

  // First run: nothing recorded yet - and in the Android app, until how
  // the phone plays has been kept (a phone that saw the welcome before it
  // asked is asked once now).
  get firstRun() {
    if (!loadSetting("welcome", { seen: false }).seen) return true;
    return !!this.playMode && !this.playMode.kept;
  }

  async show(on = true) {
    if (on) {
      saveSetting("welcome", { seen: true });
      // (Whatever's chosen as it's left is kept: the touch screen unless
      // changed.)
      this.playMode?.keep();
      try {
        this.courses = await fetch("/api/courses").then((r) => r.json());
      } catch {
        this.courses = [];
      }
      this.appInfo = this.bridge ? await this.bridge.getInfo() : null;
      this.render();
    }
    this.el.hidden = !on;
    // Enter starts the driving range; Tab moves on to the other choices.
    if (on) this.el.querySelector("button.primary")?.focus({ preventScroll: true });
    else if (this.el.contains(this.el.ownerDocument.activeElement)) this.el.ownerDocument.activeElement.blur();
  }

  // A line inside the welcome box for what a button did: a message in the
  // picture would be hidden behind the box.
  say(text, bad = false) {
    const el = this.el.querySelector(".menu-status");
    if (!el) return this.toast(text);
    el.textContent = text;
    el.classList.toggle("bad", bad);
  }

  // The server's status, as it changes, for the connection line.
  setStatus(status) {
    this.status = status;
    if (this.open) this.renderConnection();
  }

  connectionHtml() {
    return welcomeConnection(this.status, { app: !!this.bridge, bluetooth: !!this.appInfo?.config.omni?.enabled, monitor: this.monitor(), phone: !!this.playMode });
  }

  renderConnection() {
    const el = this.el.querySelector("#welcome-connection");
    if (el) el.innerHTML = this.connectionHtml();
  }

  render() {
    if (this.playMode) return this.renderPhone();
    const course = this.courses.find((c) => c.id === "golf-sim-links") ?? this.courses[0];
    const nine = this.courses.find((c) => c.holes <= 9 && c !== course);
    const m = monitorById(this.monitor());
    // Only without Bluetooth: GSPro's connector would take the Omni from it.
    // (And not for the Garmin Golf app, on a phone, or a launch monitor that
    // can't connect at all.)
    const needsConnector = this.appInfo && !this.appInfo.config.programs.length && !this.appInfo.config.omni?.enabled && m.route !== "e6" && m.route !== "none";
    const s = this.status ?? {};
    const steps =
      m.id === "omni"
        ? ""
        : `<ol class="monitor-steps small">${setupSteps(m.id, { addresses: s.addresses ?? [], port: (s.ports ?? []).find((p) => p.state === "listening")?.port ?? 921, e6Port: s.e6?.port ?? 2483 })
            .map((t) => `<li>${esc(t)}</li>`)
            .join("")}</ol>`;
    // M, the menu: everywhere now, the app or a browser.
    const keys = SHORTCUTS.filter(([k]) => /^(B|R|↑|←|N|V|M|H)/.test(k));
    this.el.innerHTML = `<div class="bay-help-box welcome-box">
      <h2>Welcome to A² Golf</h2>
      <p class="muted">A driving range, putting and chipping practice, and courses to play - with your launch monitor, or swinging with the mouse, a finger or a game controller.</p>

      <section>
        <h3>1. Launch monitor</h3>
        <label class="small">Your launch monitor <select data-act="monitor">${LAUNCH_MONITORS.map((x) => `<option value="${esc(x.id)}"${x.id === m.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
        <p id="welcome-connection">${this.connectionHtml()}</p>
        ${steps}
        ${
          needsConnector
            ? `<p class="muted small">Bluetooth is turned off, so shots come from a connector (one that speaks Open Connect): A² Golf can start it for you each time it opens.</p>
               <button data-act="connector">Choose a connector...</button>`
            : ""
        }
        <button data-act="diagnostics">Connection check</button>
        <p class="menu-status small" role="status" aria-live="polite"></p>
      </section>

      <section>
        <h3>2. Play</h3>
        <div class="welcome-choices">
          <button data-act="range" class="primary">Driving range</button>
          <button data-act="putting">Putting green</button>
          <button data-act="chipping">Chipping</button>
          <button data-act="challenges">Challenges</button>
          ${course ? `<button data-act="course" data-id="${esc(course.id)}">Play ${esc(course.name)}</button>` : ""}
          ${nine ? `<button data-act="course" data-id="${esc(nine.id)}">Play ${esc(nine.name)} (9 holes)</button>` : ""}
        </div>
        <p class="muted small">No launch monitor handy? Swing with the mouse (Menu, Swing pad &amp; controller, <b>Mouse swing</b>) or a game controller's right stick.
          Your own courses: <b>Course</b> tab, then <b>Course designer</b>, and type in a scorecard.</p>
      </section>

      <section>
        <h3>Keys worth knowing</h3>
        <table>${keys.map(([k, v]) => `<tr><td><kbd>${esc(k)}</kbd></td><td>${esc(v)}</td></tr>`).join("")}</table>
      </section>
      <p class="muted small">Or press a key: <kbd>R</kbd> range, <kbd>P</kbd> putting, <kbd>C</kbd> chipping, <kbd>O</kbd> course, <kbd>X</kbd> challenges.
        <kbd>W</kbd> shows this again, <kbd>Esc</kbd> closes it.</p>
    </div>`;
    this.el.querySelector(".welcome-box").addEventListener("click", (e) => this.click(e));
    this.el.querySelector('select[data-act="monitor"]')?.addEventListener("change", (e) => {
      this.onMonitor(e.target.value);
      this.render();
    });
  }

  // The Android app's welcome: how this phone plays first (the touch
  // screen or a launch monitor - kept, and in the menu), then where to
  // play. No keys: a phone has none.
  renderPhone() {
    const course = this.courses.find((c) => c.id === "golf-sim-links") ?? this.courses[0];
    const nine = this.courses.find((c) => c.holes <= 9 && c !== course);
    const mode = this.playMode.mode;
    this.el.innerHTML = `<div class="bay-help-box welcome-box">
      <h2>Welcome to A² Golf</h2>
      <section>
        <h3>1. How you'll play</h3>
        <div class="welcome-choices play-modes">
          ${PLAY_MODES.map((m) => `<button data-act="play-mode" data-mode="${esc(m.id)}" class="${m.id === mode ? "chosen" : ""}" aria-pressed="${m.id === mode}"><b>${esc(m.name)}</b><span>${esc(m.help)}</span></button>`).join("")}
        </div>
        ${mode === "monitor" ? `<p id="welcome-connection">${this.connectionHtml()}</p>` : ""}
        <p class="muted small">Kept for next time - to change it: Menu, Launch monitor, <b>Play on this phone with</b>.</p>
      </section>
      <section>
        <h3>2. Play</h3>
        <div class="welcome-choices">
          <button data-act="range" class="primary">Driving range</button>
          <button data-act="putting">Putting green</button>
          <button data-act="chipping">Chipping</button>
          <button data-act="challenges">Challenges</button>
          ${course ? `<button data-act="course" data-id="${esc(course.id)}">Play ${esc(course.name)}</button>` : ""}
          ${nine ? `<button data-act="course" data-id="${esc(nine.id)}">Play ${esc(nine.name)} (9 holes)</button>` : ""}
        </div>
        <p class="muted small">${
          mode === "touch"
            ? "Swing on the pad at the side: press the ball, pull down (the gold line is a full swing), then push back up through it."
            : "No launch monitor to hand? Choose Touch screen above, and swing on the pad."
        }</p>
      </section>
    </div>`;
    this.el.querySelector(".welcome-box").addEventListener("click", (e) => this.click(e));
  }

  async click(e) {
    const t = e.target.closest("button");
    if (t?.dataset.act === "monitor") return;
    if (!t) return;
    const act = t.dataset.act;
    if (act === "play-mode") {
      this.playMode.set(t.dataset.mode);
      this.render();
      return;
    }
    if (act === "connector") {
      const file = await this.bridge.browseForProgram();
      if (!file) return;
      const config = this.appInfo.config;
      // Only the programs are sent: the app keeps the rest as it has it.
      this.appInfo.config = await this.bridge.patchConfig({ programs: [...config.programs, { path: file, startWithSim: true }] });
      const r = await this.bridge.launchProgram(this.appInfo.config.programs.length - 1);
      this.render();
      this.say(r.ok ? "Starting the connector - it will start with A² Golf from now on" : `Couldn't start it: ${r.error}`, !r.ok);
      return;
    }
    if (act === "diagnostics") {
      // From the window it's in (the controls window, with separate screens).
      (this.el.ownerDocument.defaultView ?? window).open("diagnostics.html", "_blank");
      return;
    }
    this.show(false);
    if (act === "course") this.actions.course(t.dataset.id);
    else this.actions[act]?.();
  }
}
