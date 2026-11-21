// Works out what to tell someone standing at the sim from the server status
// and the connection log. Pure, so the advice can be tested.

const HEARTBEAT_FRESH_MS = 30000;

// The Omni's status poll over Bluetooth, every four seconds, is its heartbeat.
const isHeartbeat = (text) => /"isheartbeat"\s*:\s*"?true/i.test(text) || /^status\??\s\(/.test(text);
// A heartbeat and nothing more: a chunk that also carries a shot isn't one.
const onlyHeartbeat = (text) => isHeartbeat(text) && !/"containsballdata"\s*:\s*"?true/i.test(text);
const looksLikeJson = (text) => /^\s*[{[]/.test(text);

// Returns { checks: [{ title, state: ok|warn|bad|off, value, detail }], advice: [string] }.
export function diagnose(status, entries, now = Date.now()) {
  const checks = [];
  const advice = [];
  const ports = status.ports ?? [];
  const listening = ports.filter((p) => p.state === "listening");
  const failed = ports.filter((p) => p.state === "failed");
  // The Omni's own Bluetooth messages are bytes, not JSON, and aren't the
  // connector's; they're judged separately.
  const tcp = entries.filter((e) => e.port !== "BLE");
  const incoming = tcp.filter((e) => e.kind === "in");
  const rejected = tcp.filter((e) => e.kind === "info" && e.text.startsWith("rejected"));
  const notJson = incoming.filter((e) => !looksLikeJson(e.text));
  const hasShot = status.shotCount > 0 || incoming.some((e) => /"containsballdata"\s*:\s*"?true/i.test(e.text) && !isHeartbeat(e.text));
  const beatAge = status.lastHeartbeat ? now - status.lastHeartbeat : null;

  checks.push({
    title: "1. Listening",
    state: listening.some((p) => p.port === 921) ? "ok" : listening.length ? "warn" : "bad",
    value: listening.length ? `Port ${listening.map((p) => p.port).join(" and ")}` : "Not listening",
    detail: failed.map((p) => `${p.port}: ${p.error}`).join("; ") || "Open Connect ports, for a connector",
  });

  const peers = status.connectorList ?? [];
  checks.push({
    title: "2. Connector",
    state: peers.length ? "ok" : "off",
    value: peers.length ? `${peers.length} connected` : "Not connected",
    detail: peers.map((c) => `${c.peer} on port ${c.port}`).join(", ") || "Waiting for a connector that speaks Open Connect",
  });

  let beatState = "off";
  let beatValue = "None yet";
  if (beatAge !== null) {
    const fresh = beatAge < HEARTBEAT_FRESH_MS;
    beatState = fresh ? (status.ready ? "ok" : "warn") : "warn";
    beatValue = fresh ? (status.ready ? "Ready" : "Not ready") : `Last ${Math.round(beatAge / 1000)} s ago`;
  }
  checks.push({
    title: "3. Launch monitor",
    state: beatState,
    value: beatValue,
    detail: status.deviceId
      ? `Device: ${status.deviceId}${status.ballDetected ? " - ball detected" : ""}`
      : "Reported by the connector's heartbeats",
  });

  checks.push({
    title: "4. Shots",
    state: hasShot ? "ok" : "off",
    value: `${status.shotCount ?? 0} received`,
    detail: rejected.length ? `${rejected.length} rejected - see the log` : "Includes mouse and controller swings",
  });

  // GSPro's own connector running: it has the Omni, and what it sends is
  // encrypted for GSPro. Nothing else will work until it's closed, so it's
  // the first card and the first thing to do.
  if (status.gspconnect) {
    checks.unshift({
      title: "Another program",
      state: "bad",
      value: "Has the Omni - close it",
      detail: "Another golf program's connector is connected to the Omni",
    });
    if (status.omni?.state !== "connected") {
      advice.push(
        "Another golf program's connector is running and has the Omni, so A² Golf can't talk to it. Close it and its program (check the system tray too).",
      );
    }
  }

  // A-Squared Golf talking to the Omni itself, over Bluetooth (the Windows app).
  const omni = status.omni;
  if (omni) {
    const connected = omni.state === "connected";
    checks.splice(status.gspconnect ? 1 : 0, 0, {
      title: "Omni (Bluetooth)",
      state: connected ? (omni.armed ? "ok" : "warn") : omni.state === "connecting" ? "warn" : "off",
      value: connected ? (omni.armed ? "Connected, ready" : "Connected, not armed yet") : omni.state === "connecting" ? "Connecting" : "Looking for it",
      detail: [omni.name, Number.isFinite(omni.battery) && `battery ${omni.battery}%`, omni.message].filter(Boolean).join(" - "),
    });
    // Without a connector on the network ports, its cards are just noise.
    if (!peers.length) {
      const drop = new Set(["2. Connector", "3. Launch monitor"]);
      for (let i = checks.length - 1; i >= 0; i--) if (drop.has(checks[i].title)) checks.splice(i, 1);
      if (!connected) {
        advice.push(
          "A² Golf connects to the Omni itself over Bluetooth - nothing else to start.",
          // Closing GSPro's connector is already the first thing said when
          // it's been seen running.
          status.gspconnect
            ? "Switch the Omni on."
            : "Switch the Omni on. Close any other program connected to it (check the system tray too): the Omni talks to one program at a time.",
          "Check Bluetooth is on in Windows settings. The Omni doesn't need pairing in Windows first.",
        );
      } else if (!hasShot) {
        advice.push("Connected to the Omni. Hit a shot; every Bluetooth message shows in the log below.");
      } else {
        advice.push("Shots are coming through from the Omni. If a number looks wrong, press Copy all and send the log.");
      }
      return { checks, advice };
    }
  }

  // Advice for the first thing that's wrong, in the order you'd fix it.
  if (!listening.length) {
    advice.push("Nothing can connect: no launch monitor port is open.");
    if (failed.some((p) => /in use/.test(p.error))) {
      advice.push("Close the other program using the port (check the system tray too), then close and restart A² Golf.");
    }
  } else if (!peers.length && !incoming.length) {
    // No Bluetooth link to the Omni: in the Windows app it's been turned
    // off; in a browser, the Omni page connects it by hand.
    advice.push(
      status.appVersion
        ? "A² Golf's own Bluetooth connection to the Omni is turned off. Turn it on in the menu (M, then Launch monitor) - no connector needed."
        : "In Chrome or Edge, open the Omni Bluetooth page (below) and press Connect - no connector needed.",
    );
    if (!listening.some((p) => p.port === 921)) {
      advice.push(
        "Port 921, the one connectors send to, isn't available - another program is using it. Close it and restart A² Golf.",
      );
    }
    advice.push(
      "Or start a connector that speaks Open Connect.",
      "If the connector asks for an address, use 127.0.0.1 and port 921 (or this PC's address below if the connector runs on another machine).",
      "If Windows asks whether to allow A² Golf (or Node.js, when started from start.bat) through the firewall, allow it on private networks.",
      "If the connector refuses to start, that's worth knowing: note what it says.",
    );
  } else if (notJson.length) {
    advice.push(
      "The connector is sending something that isn't the expected JSON. Press Copy all and send the log - that's exactly what's needed to add support for it.",
    );
  } else if (rejected.length) {
    advice.push("Some messages were understood as JSON but rejected. Press Copy all and send the log.");
  } else if (peers.length && beatAge === null && !hasShot) {
    advice.push("Connected, but no heartbeat or shot yet. Hit a shot; if nothing appears here, Copy all and send the log.");
  } else if (peers.length && !status.ready && beatAge !== null && !hasShot) {
    advice.push("Connected, but the connector says the launch monitor isn't ready. Check the Omni is on, paired and has a ball in view.");
  } else if (hasShot) {
    advice.push(
      "Shots are coming through. Try the Putter button above and check the Omni switches to putting mode, then go back to the sim.",
    );
  }
  return { checks, advice };
}

export { onlyHeartbeat };

// The connection log kept in memory (the server's, and the diagnostics
// page's copy): the newest `size` entries, but only the newest `beats` of the
// routine heartbeats among them. The Omni's status check every four seconds
// (and a connector's heartbeat every second or two) would otherwise push a
// dropped link or a shot out of the list within minutes. Entries marked
// `beat` are those heartbeats and their answers. The log file keeps them all.
export function trimLog(entries, size = 300, beats = 40) {
  let over = -beats;
  for (const e of entries) if (e.beat) over++;
  if (over > 0) entries = entries.filter((e) => !(e.beat && over-- > 0));
  return entries.length > size ? entries.slice(-size) : entries;
}
