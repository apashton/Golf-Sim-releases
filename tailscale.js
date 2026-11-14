// The Online play panel's Tailscale part: playing with friends in other
// houses. What it is and why, where this PC is with it, and the one-off
// steps - install, sign in, share this PC with friends, let the game
// through Windows Firewall - each a button in the Windows app
// (electron/tailscale.mjs), each ticked once done. After that it's used by
// itself: Find games looks on the friends' PCs Tailscale can reach.

import { esc } from "./util.js";

export class TailscalePart {
  // bridge: window.golfsimApp (the Windows app), or null in a browser.
  constructor({ bridge = null } = {}) {
    this.bridge = bridge?.tailscale ?? null;
    this.state = null;
    this.listeners = new Set();
    this.timer = null;
  }

  onChange(f) {
    this.listeners.add(f);
  }

  changed() {
    for (const f of this.listeners) f(this.state);
  }

  async refresh() {
    try {
      this.state = this.bridge ? await this.bridge.status() : await fetch("/api/play/tailscale").then((r) => r.json());
    } catch {
      this.state = { installed: false, running: false, words: "Tailscale's status couldn't be read." };
    }
    this.changed();
    return this.state;
  }

  // While a step is under way (installing, signing in), look again every
  // few seconds, so the tick comes by itself.
  watch(ms = 90000) {
    clearInterval(this.timer);
    const until = Date.now() + ms;
    this.timer = setInterval(async () => {
      const s = await this.refresh();
      if (Date.now() > until || (s.installed && s.running && s.firewall !== false)) clearInterval(this.timer);
    }, 3000);
  }

  async act(what) {
    if (!this.bridge) return "These steps need the A² Golf Windows app.";
    const steps = { install: "install", signin: "signIn", share: "share", firewall: "firewall", refresh: null };
    if (!(what in steps)) return "";
    if (what === "refresh") {
      await this.refresh();
      return this.state?.words ?? "";
    }
    const r = await this.bridge[steps[what]]();
    if (what === "install" || what === "signin") this.watch();
    await this.refresh();
    return r?.words ?? "";
  }

  html() {
    const s = this.state;
    const tick = (on) => (on ? `<span class="better">✓</span>` : `<span class="muted">○</span>`);
    const app = !!this.bridge;
    const btn = (act, label, primary = false) => (app ? ` <button data-act="ts-${act}"${primary ? ` class="primary"` : ""}>${label}</button>` : "");
    const installed = !!s?.installed;
    const running = !!s?.running;
    const steps = [
      `<li>${tick(installed)} <b>Install Tailscale</b> (free).${installed ? "" : btn("install", "Install Tailscale", true)}</li>`,
      `<li>${tick(running)} <b>Sign in</b> - each player with their own Google, Microsoft or GitHub account.${installed && !running ? btn("signin", "Sign in", true) : ""}${running && s.self ? ` <span class="muted small">This PC: ${esc(s.self.name ?? "")} ${esc(s.self.address ?? "")}</span>` : ""}</li>`,
      `<li>${tick(running && s.peers?.some((p) => p.online))} <b>Let friends in</b> - the host shares this one PC with each friend by email, once (they see this PC, nothing else of yours); a friend accepts the invite.${running ? btn("share", "Open Tailscale's sharing page") : ""}${running ? ` <span class="muted small">${s.peers?.filter((p) => p.online).length ?? 0} friend's PC${s.peers?.filter((p) => p.online).length === 1 ? "" : "s"} online now.</span>` : ""}</li>`,
      app ? `<li>${tick(s?.firewall)} <b>Let the game through Windows Firewall</b> - only from your home network and Tailscale.${s?.firewall ? "" : btn("firewall", "Allow")}</li>` : "",
    ].join("");
    return `<h3>Playing from other houses: Tailscale</h3>
      <p class="small">${esc(s?.words ?? "Checking Tailscale...")}${btn("refresh", "Check again")}</p>
      <ol class="small">${steps}</ol>
      <p class="small">Once it's set up there's nothing more to do: Tailscale starts with Windows, and <b>Find games</b> finds your friends' games whenever they're hosting.</p>
      <details class="small"><summary>How and why it works</summary>
        <p>Home routers don't let anything in from outside - that's what keeps a home network safe - so one PC can't normally host a game for another house. Tailscale joins your PCs into a small private network of their own over the internet: encrypted, only the people you've allowed in, each PC with a fixed address on it. The game then works between houses just as it does across a room, and nothing is opened on anyone's router.</p>
        <p>The PCs talk to each other directly; Tailscale only helps them find each other (and passes the traffic on only when a direct link isn't possible). A game sends very little - where each ball finished and each hole's score - so any home connection is plenty. Tailscale's personal plan is free.</p>
      </details>`;
  }
}
