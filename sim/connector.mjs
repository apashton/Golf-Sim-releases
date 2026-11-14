// Is a program in the System menu's list Square's GSPro connector (or
// something like it)? The Omni talks to one program at a time, so while Golf
// Sim's own Bluetooth connection is on, a connector started beside it takes
// the Omni away. Pure, and shared by the page (to warn) and the app (so it
// doesn't start one by itself while Bluetooth is on).

// GSPconnect.exe, "GSPro Connect", "GSPro Connector", "Square Golf Connector",
// SquareGolf.exe - by its name in the list or its file name.
const CONNECTOR = /gsp\w*\s*connect|square|connector/i;

// program: { name, path } as kept in config.json.
export function looksLikeConnector(program) {
  if (!program) return false;
  const file = String(program.path ?? "").split(/[\\/]/).pop();
  return CONNECTOR.test(String(program.name ?? "")) || CONNECTOR.test(file);
}

// The programs ticked to start with A-Squared Golf that would take the Omni from
// its Bluetooth connection: none when Bluetooth is off.
export function connectorClashes(config) {
  if (!config?.omni?.enabled) return [];
  return (config.programs ?? []).filter((p) => p.startWithSim && looksLikeConnector(p));
}

// Whether A-Squared Golf starts this program by itself when it opens: those ticked
// At start, except a connector while Bluetooth is on.
export function startsWithSim(program, config) {
  return !!program?.startWithSim && !(config?.omni?.enabled && looksLikeConnector(program));
}
