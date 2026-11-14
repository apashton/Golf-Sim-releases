// The Windows app's own settings and actions, drawn as parts of the
// Clubhouse's pages (menu.js, sim/menu.mjs): the Omni over Bluetooth, the
// app's window, updates, reports to Claude, other programs, troubleshooting
// and the PC's power. With A-Squared Golf as the Windows shell there's no Start
// menu or taskbar, so this is where other programs are started, and where
// the PC is restarted or shut down. Only in the Windows app (a browser has
// no bridge, so none of these parts are shown). What a button did is said
// on the Clubhouse's status line.

import { omniStatusLine } from "./omni.js";
import { looksLikeConnector, connectorClashes, startsWithSim } from "./sim/connector.mjs";
import { esc } from "./util.js";

// Where to make the reports token: GitHub's page for a new fine-grained
// token, with the name, a year's expiry, the owner and Issues: Read and
// write already filled in. Only the repository has to be picked by hand.
const TOKEN_LINK =
  "https://github.com/settings/personal-access-tokens/new?name=Golf+Sim+reports&description=Golf+Sim+problem+reports&target_name=apashton&expires_in=366&issues=write";

// "just now", "5 minutes ago", "3 hours ago", "2 days ago".
function ago(at) {
  const mins = Math.round((Date.now() - Date.parse(at)) / 60000);
  if (!Number.isFinite(mins) || mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export class SystemMenu {
  // toast(text, ms): a message in the picture, for when the menu is closed.
  // busy(): what closing A-Squared Golf now would lose ("the round in progress"),
  // or nothing. onUpdate(status): the update's state, for the reminder in
  // bay view and on the System button. sound: opens the Sound panel.
  // screens: separate windows ({ separate, toggle() }), or null.
  // recording: the recording format ({ format, set(format) }), or null.
  // frameRate: the frame rate on the picture ({ on, set(on) }), or null.
  // video: the video recorder ({ show(), toggle(), recording }), or null.
  constructor(bridge, { toast = () => {}, busy = () => null, onUpdate = () => {}, sound = null, screens = null, recording = null, frameRate = null, cameras = null, saveReplay = null, video = null } = {}) {
    this.bridge = bridge;
    this.toast = toast;
    this.busy = busy;
    this.onUpdate = onUpdate;
    this.sound = sound;
    // Opens the Cameras panel (camerapanel.js).
    this.cameras = cameras;
    // Keeps the last shot's replay (app.js's saveReplay).
    this.saveReplay = saveReplay;
    // The video recorder (videorec.js, videopanel.js).
    this.video = video;
    this.screens = screens;
    this.recording = recording;
    this.frameRate = frameRate;
    this.info = null;
    this.status = null;
    // Drawn on the Clubhouse's pages (menu.js), not a menu of its own: el
    // is the Clubhouse while a part of it is shown there (mount), and the
    // Clubhouse opens and closes it.
    this.menu = null;
    this.el = document.createElement("div");
    // Updates arrive in the background (electron/updater.mjs); the menu shows
    // where they're up to, and a finished download is mentioned.
    this.update = null;
    bridge.updateStatus?.().then((s) => {
      this.update = s;
      this.onUpdate(s);
    });
    bridge.onUpdate?.((s) => {
      const newlyReady = s.state === "ready" && this.update?.state !== "ready";
      this.update = s;
      this.onUpdate(s);
      if (newlyReady && this.open) this.say(`A² Golf ${s.next} is ready - Restart and update, under System, switches to it`);
      else if (newlyReady) this.toast(`A² Golf ${s.next} is ready - press M and choose Restart and update`, 6000);
      if (this.open) this.renderUpdate();
    });
  }

  // The page it's on: the sim's, or the controls window's when the screens
  // are separate (app.js moves it there); pages it opens open from there.
  get doc() {
    return this.el.ownerDocument;
  }
  openPage(url) {
    (this.doc.defaultView ?? window).open(url, "_blank");
  }

  get box() {
    return this.el.querySelector(".ch-page");
  }

  // The line at the top of the menu, under its buttons: what a button did
  // is said here, as a message in the picture would be hidden behind the
  // menu. bad: in amber.
  say(text, bad = false) {
    const el = this.el.querySelector(".ch-status");
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("bad", bad);
  }

  // The Updates section, redrawn as the download goes: its Restart and
  // update button when one is ready.
  renderUpdate() {
    const s = this.update ?? { state: "idle" };
    const ready = s.state === "ready";
    // The version before this one, to go back to (electron/rollback.mjs).
    const v = this.info?.config?.versions;
    const back = v?.previous && v.previous !== this.info?.version ? v.previous : null;
    const el = this.el.querySelector(".updates");
    if (!el) return;
    this.keepFocus(() => {
      el.innerHTML = `<p class="small">You have A² Golf <b>${esc(this.info?.version ?? s.version ?? "")}</b>.</p>
      <p class="${ready ? "ready " : "muted "}small">${esc(s.message ?? "Checks for updates when A² Golf starts and every half hour.")}</p>
      <div class="buttons">
        ${ready ? `<button data-act="install" class="primary">Restart and update to ${esc(s.next)}</button>` : ""}
        <button data-act="check" ${s.state === "off" || s.state === "checking" || s.state === "downloading" ? "disabled" : ""}>Check for updates</button>
        ${back && s.state !== "off" ? `<button data-act="rollback" title="Installs ${esc(back)} again and skips ${esc(this.info?.version ?? "this version")} - a newer version still installs as usual">Go back to ${esc(back)}</button>` : ""}
      </div>
      ${this.info?.config ? `<label class="check"><input type="checkbox" data-update-beta ${this.info.config.updates?.beta ? "checked" : ""}> Beta versions: every new version as soon as it's built, before it's made the stable release (newer, and may have bugs)</label>` : ""}`;
    });
  }

  // Redraws part of the menu without losing the keyboard's place: the
  // control that had it gets it back if it's drawn again.
  keepFocus(draw) {
    const had = this.doc.activeElement;
    const attr = had && this.el.contains(had) ? [...had.attributes].find((a) => a.name.startsWith("data-")) : null;
    const result = draw();
    if (attr && !had.isConnected) {
      const again = this.el.querySelector(`[${attr.name}="${CSS.escape(attr.value)}"]`);
      (again ?? this.box)?.focus({ preventScroll: true });
    }
    return result;
  }

  // Reports to Claude: set up (paste a GitHub token), send one with a note,
  // automatic reports on or off. The token is only ever handed to the app,
  // never shown or read back. message: { text, bad, plain } to show under it
  // (bad in red, plain in the normal colour, otherwise green).
  async renderReports(message = null) {
    const el = this.el.querySelector(".reports");
    if (!el || !this.bridge.reportStatus) return;
    let s;
    try {
      s = await this.bridge.reportStatus();
    } catch {
      el.innerHTML = `<p class="muted small">Reports aren't available in this version.</p>`;
      return;
    }
    const setup = !s.configured || this.reportSetup;
    const msg = message ? `<p class="small report-msg ${message.bad ? "bad" : message.plain ? "" : "good"}">${esc(message.text)}</p>` : "";
    // Greyed out until there's a token: nothing is sent without one.
    const auto = `<label class="check${s.configured ? "" : " muted"}"><input type="checkbox" data-report-auto ${s.auto ? "checked" : ""} ${s.configured ? "" : "disabled"}> Send reports automatically when something goes wrong (errors, the Omni not connecting, updates failing)${s.configured ? "" : " - once set up"}</label>`;
    if (setup) {
      el.innerHTML = `
        <p class="small">${s.configured ? "Paste a new token to replace the one saved." : "<b>Not set up</b> - nothing is sent. Set it up once, and problems go straight to the developer instead of photos of the screen."}</p>
        <details class="report-howto"${s.configured ? "" : " open"}>
          <summary class="small">How to make the token</summary>
          <ol class="small">
            <li>Signed in to github.com as the owner, open <a href="${esc(TOKEN_LINK)}" target="_blank" rel="noopener">GitHub's new token page</a> (it opens in the browser, with the name, expiry and permission filled in).</li>
            <li>Repository access: <b>Only select repositories</b> → <b>${esc(s.repo)}</b>.</li>
            <li>Under Permissions, check <b>Issues</b> says <b>Read and write</b> (and add nothing else). Expiration: a year ahead is filled in; <i>No expiration</i> is fine too.</li>
            <li><b>Generate token</b>, copy it, and paste it here with Ctrl+V. (The same steps are in the README, under Reports to Claude.)</li>
          </ol>
        </details>
        <div class="buttons report-token-row">
          <input type="password" data-report-token placeholder="Paste the token here (github_pat_...)" autocomplete="off" spellcheck="false">
          <button data-act="report-save" class="primary">Save and test</button>
          ${s.configured ? `<button data-act="report-cancel">Cancel</button>` : ""}
        </div>
        ${msg}
        ${auto}`;
      return;
    }
    const facts = [
      `<b>Set up</b> - reports go to ${esc(s.repo)} as GitHub issues${s.encrypted ? "" : " (the token is saved, but Windows' encryption wasn't available to protect it)"}.`,
      s.queued ? `${s.queued} waiting to be sent - it tries again every 10 minutes.` : "",
      s.lastSent?.number ? `Last sent: report #${esc(s.lastSent.number)}.` : "",
    ].filter(Boolean);
    el.innerHTML = `
      <p class="small">${facts.join(" ")}</p>
      ${s.lastError && !message ? `<p class="small report-msg bad">${esc(ago(s.lastError.at))}: ${esc(s.lastError.message)}</p>` : ""}
      <label class="report-note small">What happened?
        <textarea data-report-note rows="3" maxlength="5000" placeholder="e.g. The launch monitor didn't connect after lunch, or every putt went left"></textarea>
      </label>
      <div class="buttons">
        <button data-act="report-send" class="primary">Send report</button>
        <button data-act="report-test">Test the token</button>
        <button data-act="report-change">Change token</button>
        <button data-act="report-remove">Remove token</button>
      </div>
      ${msg}
      ${auto}
      <p class="muted small">A report has your note, the connection and Bluetooth log, settings, screens and recent errors - never the token.</p>`;
    const note = el.querySelector("[data-report-note]");
    note.value = this.reportNote ?? "";
    note.addEventListener("input", () => (this.reportNote = note.value));
  }

  // Asks the app, turning a failure into an answer the menu can show.
  async reportCall(fn) {
    try {
      return (await fn()) ?? {};
    } catch (err) {
      return { ok: false, message: `Something went wrong: ${err?.message ?? err}`, error: `Something went wrong: ${err?.message ?? err}` };
    }
  }

  // Shows a line under the reports section while something is under way.
  reportBusy(button, text) {
    if (button) button.disabled = true;
    const el = this.el.querySelector(".reports");
    el?.querySelector(".report-msg")?.remove();
    el?.querySelector(".buttons")?.insertAdjacentHTML("afterend", `<p class="small report-msg">${esc(text)}</p>`);
  }

  // The Omni's state, and a warning when a connector is set to start with
  // A-Squared Golf while Bluetooth is on: redrawn as the connection changes.
  renderOmniState() {
    const el = this.el.querySelector(".omni-state");
    if (!el || !this.info) return;
    const config = this.info.config;
    let line;
    const omni = this.status?.omni;
    if (!config.omni?.enabled) line = { cls: "off", text: "Bluetooth is off - shots come from a connector on port 921" };
    else if (omni?.state === "unavailable") line = { cls: "warn", text: `Bluetooth isn't working: ${omni.message || "check it's switched on in Windows"}` };
    else line = omniStatusLine(omni) ?? { cls: "off", text: "Starting Bluetooth..." };
    el.innerHTML = `<span class="dot ${line.cls}"></span> <b>${esc(line.text)}</b>`;
    const clash = this.el.querySelector(".omni-clash");
    if (!clash) return;
    const names = connectorClashes(config).map((p) => p.name);
    this.keepFocus(() => {
      clash.innerHTML = names.length
        ? `<p class="small warn-line">${esc(names.join(" and "))} ${names.length > 1 ? "are" : "is"} ticked to start with A² Golf, but a connector would take the Omni from Bluetooth - so A² Golf doesn't start it while Bluetooth is on.
          <button data-act="untick-connectors">Untick At start</button></p>`
        : "";
    });
  }

  // The Bluetooth devices recent searches found, so the Omni can be chosen
  // by hand if it isn't recognised by its name. Asked for again every few
  // seconds while the menu is open, and only redrawn when it changes.
  async renderOmniDevices() {
    const el = this.el.querySelector(".omni-devices");
    if (!el || !this.info) return;
    if (!this.bridge.omniDevices || !this.info.config.omni?.enabled) {
      el.innerHTML = "";
      this.devicesSeen = null;
      return;
    }
    let found;
    try {
      found = await this.bridge.omniDevices();
    } catch {
      return;
    }
    const { devices, chosen, chosenName } = found;
    const connected = this.status?.omni?.state === "connected";
    const key = JSON.stringify([devices, chosen, chosenName, connected]);
    if (key === this.devicesSeen && el.innerHTML) return;
    this.devicesSeen = key;
    const label = (d) => (d.deviceName ? esc(d.deviceName) : `<span class="muted">(no name) ${esc(d.deviceId)}</span>`);
    const rows = devices
      .map(
        (d, i) => `<tr><td>${label(d)}</td><td class="actions">${
          d.deviceId === chosen ? `<b>Your Omni</b>` : `<button data-omni-choose="${i}">This is my Omni</button>`
        }</td></tr>`,
      )
      .join("");
    const empty = connected ? "Connected - nothing to choose." : "none yet (it searches every few seconds).";
    this.keepFocus(() => {
      el.innerHTML = `
        ${chosen ? `<p class="small">Using the device chosen as your Omni: <b>${esc(chosenName || chosen)}</b> <button data-omni-forget>Forget it</button></p>` : ""}
        <p class="muted small">Bluetooth devices seen in the last few minutes${devices.length ? " - if the Omni doesn't connect by itself, choose it:" : `: ${empty}`}</p>
        ${rows ? `<table class="programs">${rows}</table>` : ""}`;
    });
    el.onclick = async (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.omniChoose !== undefined) {
        const d = devices[Number(t.dataset.omniChoose)];
        this.info.config = await this.bridge.omniChoose(d.deviceId, d.deviceName);
        this.say(`${d.deviceName || "That device"} will be used as your Omni`);
      } else if (t.dataset.omniForget !== undefined) {
        this.info.config = await this.bridge.omniChoose(null, null);
        this.say("Forgotten - A² Golf looks for the Omni by its name again");
      }
      this.devicesSeen = null;
      this.renderOmniDevices();
    };
  }

  // The programs list, with a note on a connector that isn't started while
  // Bluetooth is on.
  renderPrograms() {
    const el = this.el.querySelector(".programs-list");
    if (!el) return;
    const config = this.info.config;
    const rows = config.programs
      .map((p, i) => {
        const held = p.startWithSim && !startsWithSim(p, config);
        return `<tr>
          <td><b>${esc(p.name)}</b><br><span class="muted small">${esc(p.path)}${p.args ? ` ${esc(p.args)}` : ""}</span>${
            held ? `<br><span class="small warn-line">Not started while Bluetooth is on - it would take the Omni.</span>` : ""
          }<span class="row-msg small"></span></td>
          <td><label class="check"><input type="checkbox" data-start="${i}" ${p.startWithSim ? "checked" : ""}> At start</label></td>
          <td class="actions"><button data-launch="${i}">Start now</button> <button data-remove="${i}" title="Remove ${esc(p.name)} from the list" aria-label="Remove ${esc(p.name)}">✕</button></td>
        </tr>`;
      })
      .join("");
    this.keepFocus(() => {
      el.innerHTML = rows || `<tr><td class="muted">None yet</td></tr>`;
    });
  }

  get open() {
    return !!this.menu?.open;
  }

  // Opens the Clubhouse at the System page, or closes it.
  async show(on = !this.open) {
    if (on) return this.menu?.show(true, "system");
    this.unmount();
    if (this.menu?.open) this.menu.show(false);
  }

  // ---- Its parts on the Clubhouse's pages ---------------------------------------------

  // One part drawn into host on a Clubhouse page: "omni", "updates",
  // "power", "reports", "programs", "troubleshooting", "app-window". Its
  // buttons work as they did in the System menu.
  async mount(host, part) {
    this.el = host.closest(".clubhouse") ?? host;
    try {
      this.info = await this.bridge.getInfo();
    } catch {
      host.innerHTML = `<p class="muted small">Not available just now.</p>`;
      return;
    }
    host.innerHTML = this.partHtml(part);
    host.onclick = (e) => this.click(e);
    host.onchange = (e) => this.change(e);
    if (part === "omni") {
      this.renderOmniState();
      this.devicesSeen = null;
      this.renderOmniDevices();
      clearInterval(this.devicesTimer);
      this.devicesTimer = setInterval(() => (this.open ? this.renderOmniDevices() : this.unmount()), 3000);
    }
    if (part === "updates") this.renderUpdate();
    if (part === "reports") this.renderReports();
    if (part === "feedback") {
      const note = host.querySelector("[data-feedback-note]");
      note.value = this.feedbackNote ?? "";
      note.addEventListener("input", () => (this.feedbackNote = note.value));
    }
    if (part === "programs") this.renderPrograms();
  }
  unmount() {
    clearInterval(this.devicesTimer);
    this.devicesTimer = null;
  }

  partHtml(part) {
    const { config, version, dataDir, bringBack, platform } = this.info;
    const onWindows = platform === "win32";
    switch (part) {
      case "omni":
        return `<div class="sys-part">
          <p class="omni-state"></p>
          <label class="check"><input type="checkbox" data-omni="enabled" ${config.omni?.enabled ? "checked" : ""}> Connect to the Omni over Bluetooth</label>
          <div class="omni-clash"></div>
          <div class="omni-devices"></div>
        </div>`;
      case "updates":
        return `<div class="sys-part"><div class="updates"></div></div>`;
      case "power":
        return `<div class="buttons sys-part">
          <button data-act="restart" ${onWindows ? "" : "disabled"}>Restart PC</button>
          <button data-act="shutdown" ${onWindows ? "" : "disabled"}>Shut down PC</button>
          <button data-act="quit">Quit A² Golf</button>
        </div>`;
      case "reports":
        return `<div class="sys-part"><div class="reports"></div></div>`;
      case "feedback":
        return `<div class="sys-part feedback">
          <label class="report-note small">What happened, or what would you like?
            <textarea data-feedback-note rows="3" maxlength="5000" placeholder="e.g. The launch monitor didn't connect after lunch, or every putt went left"></textarea>
          </label>
          <div class="buttons"><button data-act="feedback-send" class="primary">Save a report and open the support page</button></div>
          <p class="small feedback-msg"></p>
          <p class="muted small">The report - your note, the version, settings, screens, the graphics card, the launch monitor's connection log and recent errors - is saved in Documents, A-Squared Golf feedback, and its folder opened. The support page opens with your note: drag the report onto it and post. Nothing is sent until you post it, and posts there are public. Up to 5 reports a day.</p>
        </div>`;
      case "programs":
        return `<div class="sys-part"><table class="programs programs-list"></table><div class="buttons"><button data-act="add">Add a program...</button></div></div>`;
      case "troubleshooting":
        return `<div class="sys-part">
          <div class="buttons">
            <button data-act="reload">Reload (if the picture freezes)</button>
            <button data-act="others">Show other windows</button>
            <button data-act="desktop" ${onWindows ? "" : "disabled"}>Open Windows desktop</button>
            <button data-act="shots">Open shot logs</button>
          </div>
          <p class="muted small">Show other windows and Open Windows desktop tuck A² Golf out of the way; <kbd>${esc(bringBack)}</kbd> brings it back from anywhere. Settings and logs are in ${esc(dataDir)}. A² Golf ${esc(version)}.</p>
        </div>`;
      case "app-window":
        return `<div class="sys-part">
          <label class="check"><input type="checkbox" data-opt="fullscreen" ${config.fullscreen ? "checked" : ""}> Full screen with no window frame</label>
          <label class="check"><input type="checkbox" data-opt="startInBayView" ${config.startInBayView ? "checked" : ""}> Start in bay view</label>
          <label class="check"><input type="checkbox" data-shotscreen ${config.shotScreen?.enabled ? "checked" : ""}> Open the shot data window by itself on the second monitor</label>
        </div>`;
      default:
        return "";
    }
  }

  // Sends only what changed; the app keeps the rest as it has it (the shot
  // data window's place, say, which it saves as the window is moved).
  async save(patch) {
    this.info.config = await this.bridge.patchConfig(patch);
    return this.info.config;
  }

  // The server's status, as it changes: the Omni's line in its section.
  setStatus(status) {
    const was = this.status?.omni?.state;
    this.status = status;
    if (!this.open) return;
    this.renderOmniState();
    if (status?.omni?.state !== was) this.renderOmniDevices();
  }

  // The question before something that closes A-Squared Golf, with what it would
  // lose (a round in progress) when there's something to lose. Asked in the
  // window it was asked from (at: the button), or the one the menu is in:
  // the controls window when the screens are separate, not the projector.
  ask(question, at = null) {
    const lose = this.busy();
    const win = at?.ownerDocument?.defaultView ?? this.doc?.defaultView ?? window;
    return win.confirm(lose ? `${question}\n\n${lose[0].toUpperCase()}${lose.slice(1)} will end.` : question);
  }

  // Quits A-Squared Golf, asked first: the System page's Quit, Quit under
  // the menu's pages and the top bar's power button (full screen has no
  // window frame, so no X). As the PC's only program there's no desktop
  // behind A-Squared Golf: it offers to start it, rather than leaving a black
  // screen. Whether it quit.
  async quit(at = null) {
    let desktop = null;
    try {
      desktop = await this.bridge.desktopRunning?.();
    } catch {
      // Not known: asked the plain way.
    }
    if (desktop === false) {
      if (!this.ask("No Windows desktop is running, so quitting A² Golf would leave a black screen.\n\nStart the Windows desktop, then quit A² Golf?", at)) return false;
      this.bridge.quit({ startDesktop: true });
      return true;
    }
    if (!this.ask("Quit A² Golf?", at)) return false;
    this.bridge.quit();
    return true;
  }

  async click(e) {
    const t = e.target.closest("button");
    if (!t) return;
    const config = this.info.config;
    if (t.dataset.launch !== undefined) {
      const i = Number(t.dataset.launch);
      const p = config.programs[i];
      if (config.omni?.enabled && looksLikeConnector(p) && !confirm(`Bluetooth is on: ${p.name} would take the Omni from A² Golf. Start it anyway?`)) return;
      const r = await this.bridge.launchProgram(i);
      const text = r.ok ? `Starting ${p.name} - ${this.info.bringBack} brings A² Golf back in front` : `Couldn't start ${p.name}: ${r.error}`;
      this.say(text, !r.ok);
      // Said on its row too, where it was asked for.
      const msg = t.closest("tr")?.querySelector(".row-msg");
      if (msg) {
        msg.textContent = r.ok ? "" : `Couldn't start it: ${r.error}`;
        msg.classList.toggle("warn-line", !r.ok);
      }
      return;
    }
    if (t.dataset.remove !== undefined) {
      const i = Number(t.dataset.remove);
      if (confirm(`Remove ${config.programs[i].name} from the list?`)) {
        await this.save({ programs: config.programs.filter((_, j) => j !== i) });
        this.renderPrograms();
        this.renderOmniState();
        this.box?.focus({ preventScroll: true });
      }
      return;
    }
    switch (t.dataset.act) {
      case "report-save": {
        const input = this.el.querySelector("[data-report-token]");
        const token = input?.value.trim() ?? "";
        if (!token) {
          this.renderReports({ text: "Paste the token into the box first (Ctrl+V).", bad: true });
          break;
        }
        this.reportBusy(t, "Checking the token with GitHub...");
        const r = await this.reportCall(() => this.bridge.reportSetToken(token));
        if (input) input.value = "";
        if (r.saved) this.reportSetup = false;
        this.renderReports({ text: r.message, bad: !r.ok });
        break;
      }
      case "report-test": {
        this.reportBusy(t, "Checking the token with GitHub...");
        const r = await this.reportCall(() => this.bridge.reportTestToken());
        this.renderReports({ text: r.message, bad: !r.ok });
        break;
      }
      case "report-change":
        this.reportSetup = true;
        this.renderReports();
        break;
      case "report-cancel":
        this.reportSetup = false;
        this.renderReports();
        break;
      case "report-remove":
        if (confirm("Remove the report token? Nothing will be sent until it's set up again.")) {
          await this.reportCall(() => this.bridge.reportRemoveToken());
          this.reportSetup = false;
          this.renderReports({ text: "Token removed - nothing will be sent." });
        }
        break;
      case "report-send": {
        this.reportBusy(t, "Sending...");
        const r = await this.reportCall(() => this.bridge.reportSend(this.reportNote ?? ""));
        if (r.ok) {
          this.reportNote = "";
          this.renderReports({ text: `Sent as report #${r.number}. Thank you!` });
        } else if (r.queued) {
          // Kept, and sent by itself once GitHub can be reached: done as far
          // as the owner is concerned, so the box is cleared (pressing Send
          // again would only make a second copy).
          this.reportNote = "";
          this.renderReports({ text: r.error ?? "Saved - it will be sent by itself when GitHub can be reached.", plain: true });
        } else this.renderReports({ text: r.error ?? "Couldn't send it.", bad: true });
        break;
      }
      case "feedback-send": {
        const line = this.el.querySelector(".feedback-msg");
        const say = (text, bad = false) => line && ((line.textContent = text), line.classList.toggle("bad", bad));
        if (!this.bridge.feedbackSave) {
          say("Feedback needs a newer version of the app.", true);
          break;
        }
        t.disabled = true;
        say("Saving the report...");
        const r = await this.reportCall(() => this.bridge.feedbackSave(this.feedbackNote ?? ""));
        t.disabled = false;
        if (r.ok) {
          this.feedbackNote = "";
          const box = this.el.querySelector("[data-feedback-note]");
          if (box) box.value = "";
          say("Saved, and the support page is open in your browser - drag the report onto it and post. Thank you!");
        } else say(r.error ?? "Couldn't save the report.", true);
        break;
      }
      case "close":
        this.show(false);
        break;
      case "untick-connectors": {
        await this.save({ programs: config.programs.map((p) => (looksLikeConnector(p) ? { ...p, startWithSim: false } : p)) });
        this.renderPrograms();
        this.renderOmniState();
        this.box?.focus({ preventScroll: true });
        this.say("Unticked - the connector won't be started with A² Golf");
        break;
      }
      case "check":
        this.update = { ...this.update, state: "checking", message: "Checking for updates..." };
        this.renderUpdate();
        this.update = (await this.bridge.checkForUpdates?.()) ?? this.update;
        this.renderUpdate();
        break;
      case "install":
        if (this.ask(`Restart A² Golf now with version ${this.update?.next}? It takes a few seconds.`)) this.bridge.installUpdate?.();
        break;
      case "rollback": {
        const to = this.info?.config?.versions?.previous;
        if (!to || !this.ask(`Go back to version ${to}? It downloads and installs it, then restarts A² Golf - this version won't be installed again, a newer one will.`)) break;
        const ok = await this.bridge.rollback?.();
        this.say(ok ? `Going back to ${to} - A² Golf restarts when it's downloaded` : `Couldn't go back to ${to} here (only the installed app can)`, !ok);
        break;
      }
      case "add": {
        const file = await this.bridge.browseForProgram();
        if (!file) break;
        // With Bluetooth on, a connector isn't ticked to start: it would take
        // the Omni from A-Squared Golf.
        const connector = config.omni?.enabled && looksLikeConnector({ path: file });
        await this.save({ programs: [...config.programs, { path: file, startWithSim: !connector }] });
        this.renderPrograms();
        this.renderOmniState();
        this.say(
          connector
            ? "Added, but not ticked to start: with Bluetooth on, a connector would take the Omni. Turn Bluetooth off (Square Omni) to use it."
            : "Added - it starts with A² Golf from now on",
        );
        break;
      }
      case "stats":
        // Opens as a second window, as diagnostics does.
        this.show(false);
        this.openPage("/stats.html");
        break;
      case "stats-restart-all": {
        if (
          !confirm(
            "Start every player's stats again?\n\nEvery player's shots, games and the bests on My stats move into the archive, and everyone starts again from nothing. Nothing is deleted - My stats, Archived stats, brings anyone's back.\n\nThe challenge panels' personal bests and the course list's best rounds aren't part of the stats, and stay.",
          )
        )
          break;
        try {
          const res = await fetch("/api/stats/restart-all", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
          const r = await res.json();
          if (!res.ok) throw new Error(r.error ?? res.statusText);
          const n = r.archived?.length ?? 0;
          this.say(n ? `Everyone's stats start again: ${n} player${n === 1 ? "'s" : "s'"} moved into the archive (My stats, Archived stats, brings them back)` : "No stats to start again yet");
        } catch (err) {
          this.say(`Couldn't start the stats again: ${err?.message ?? err}`, true);
        }
        break;
      }
      case "cameras":
        this.show(false);
        this.cameras?.();
        break;
      case "clips":
        this.bridge.openClipsFolder?.();
        break;
      case "save-replay":
        this.show(false);
        this.saveReplay?.();
        break;
      case "video":
        this.show(false);
        this.video?.show();
        break;
      case "video-rec":
        this.show(false);
        this.video?.toggle();
        break;
      case "recordings":
        this.bridge.openRecordingsFolder?.();
        break;
      case "screens":
        this.show(false);
        this.screens?.toggle();
        break;
      case "blank":
        // The window the menu is in: the controls window when the screens
        // are separate.
        this.show(false);
        this.screens?.blank?.(this.doc);
        break;
      case "shotscreen":
        this.show(false);
        this.openPage("/shotscreen.html");
        break;
      case "diagnostics":
        this.show(false);
        this.openPage("/diagnostics.html");
        break;
      case "others":
        this.show(false);
        this.bridge.showOtherWindows();
        break;
      case "shots":
        this.bridge.openShotsFolder();
        this.say("The shot logs folder opens behind A² Golf: Show other windows to see it");
        break;
      case "sound":
        this.show(false);
        this.sound?.();
        break;
      case "sounds":
        this.bridge.openSoundsFolder?.();
        break;
      case "reload": {
        // Only asked when there's something to lose.
        const lose = this.busy();
        if (!lose || confirm(`Reload A² Golf? ${lose[0].toUpperCase()}${lose.slice(1)} will end.`)) this.bridge.reload();
        break;
      }
      case "quit":
        await this.quit(t);
        break;
      case "desktop":
        this.show(false);
        this.bridge.openDesktop();
        break;
      case "restart":
      case "shutdown": {
        const what = t.dataset.act === "restart" ? "Restart the PC" : "Shut down the PC";
        // A downloaded update is installed first (electron/main.mjs), or it
        // would wait until A-Squared Golf next quits - which as the PC's only
        // program it never does.
        const ready = this.update?.state === "ready";
        if (this.ask(ready ? `${what} now? A² Golf ${this.update.next} is installed first, which takes about a minute.` : `${what} now?`)) {
          this.bridge.power(t.dataset.act);
          if (ready) this.say(`Installing A² Golf ${this.update.next} first...`);
        }
        break;
      }
    }
  }

  async change(e) {
    const t = e.target;
    const config = this.info.config;
    // Only the part that shows the change is drawn again, so the menu keeps
    // its place and the keyboard stays where it was.
    if (t.dataset.start !== undefined) {
      const programs = config.programs.map((p, i) => (i === Number(t.dataset.start) ? { ...p, startWithSim: t.checked } : p));
      await this.save({ programs });
      this.renderPrograms();
      this.renderOmniState();
    } else if (t.dataset.reportAuto !== undefined) {
      await this.reportCall(() => this.bridge.reportSetAuto(t.checked));
      this.info.config = { ...config, reports: { ...config.reports, auto: t.checked } };
      this.say(t.checked ? "Automatic reports on" : "Automatic reports off - only reports you send");
    } else if (t.dataset.updateBeta !== undefined) {
      await this.save({ updates: { beta: t.checked } });
      this.say(t.checked ? "Beta versions on - each new version comes as soon as it's built" : "Beta versions off - only stable releases from now on");
    } else if (t.dataset.shotscreen !== undefined) {
      await this.save({ shotScreen: { enabled: t.checked } });
    } else if (t.dataset.omni) {
      await this.save({ omni: { [t.dataset.omni]: t.checked } });
      if (t.dataset.omni === "enabled") {
        this.renderOmniState();
        this.renderPrograms();
        this.devicesSeen = null;
        this.renderOmniDevices();
        const held = connectorClashes(this.info.config).map((p) => p.name);
        this.say(
          t.checked
            ? `Bluetooth on - A² Golf looks for the Omni.${held.length ? ` ${held.join(" and ")} won't be started with A² Golf while it's on.` : ""}`
            : "Bluetooth off - start a connector for the Omni (Programs, below).",
        );
      }
    } else if (t.dataset.fps !== undefined) {
      this.frameRate?.set(t.checked);
      this.say(t.checked ? "Frame rate on - top right of the picture" : "Frame rate off");
    } else if (t.dataset.opt) {
      await this.save({ [t.dataset.opt]: t.checked });
      if (t.dataset.opt === "startInBayView") this.say(t.checked ? "A² Golf will open in bay view" : "A² Golf will open in the normal view, with the side panel");
    }
  }
}
