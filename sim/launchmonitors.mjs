// The launch monitors A-Squared Golf knows: how each one's shots get here,
// what it measures, and the steps to set it up - for the menu's Launch
// monitor page, the welcome screen and the guide (docs/LAUNCH-MONITORS.md,
// which says where each fact came from). The Square Omni connects by
// itself over Bluetooth; every other launch monitor sends its shots through
// a program that speaks GSPro's Open Connect (server/openconnect.mjs) - its
// maker's, or one the golf simulator community wrote - or, for the Garmin
// R10, the Garmin Golf app's E6 Connect (server/e6connect.mjs). Pure, for
// the pages, the server and the tests.
//
//   id, name
//   short      the name the top bar uses when it's long ("Uneekor connected")
//   route      "bluetooth" (A-Squared Golf connects to it itself), "e6" (the
//              Garmin Golf app), "openconnect" (a program on this PC or the
//              network sends Open Connect), "screen" (a community program
//              reads the maker's app off the screen and sends Open Connect),
//              "none" (nothing yet: its software talks to GSPro alone)
//   via        the program that sends its shots, in a few words
//   fixed      that program only sends to this PC's port 921: A-Squared Golf
//              must run on the same PC, with GSPro closed
//   spin       "measured", "estimated" (a radar's, worked out from the
//              flight - kept out of the spin tips) or "varies" (measured
//              with marked balls only, say)
//   club       what club data it sends, in words ("" for none)
//   impact     whether its strike positions can be used (false where their
//              units aren't known)
//   ids        the names its program sends with each shot (Open Connect's
//              DeviceID), to know it when it connects
//   steps      the setup, step by step: {address} is this PC's address on
//              the network, {port} the Open Connect port, {e6port} the
//              Garmin Golf app's
//   note       anything else worth knowing

export const LAUNCH_MONITORS = [
  {
    id: "omni",
    name: "Square Golf Omni",
    route: "bluetooth",
    via: "A² Golf itself, over Bluetooth",
    spin: "measured",
    club: "club speed, path, face, attack angle, strike",
    impact: true,
    ids: [/^square omni/i],
    steps: [
      "Close any other program using the Omni (check the system tray too): it talks to one program at a time.",
      "Switch the Omni on. A² Golf finds it and connects by itself - the top bar turns green.",
      "In a browser instead of the Windows app: open the Omni page (Connection, below) and press Connect.",
    ],
    note: "Spin is measured on any ball - no marked balls needed.",
  },
  {
    id: "r10",
    name: "Garmin Approach R10",
    route: "e6",
    via: "the Garmin Golf app (E6 Connect)",
    spin: "estimated",
    club: "club speed, face and path",
    impact: false,
    ids: [/\br10\b/i, /garmin golf app/i],
    steps: [
      "Put your phone or tablet on the same Wi-Fi as this PC, with any other golf software closed.",
      "In the Garmin Golf app, pair the R10 as usual and start a simulator session for E6 Connect on a PC (the app asks for the PC's address).",
      "Type this PC's address, {address}, and port {e6port}, and connect. The top bar says Garmin Approach R10 connected.",
      "The first time, Windows may ask whether A² Golf can use the network: allow it on private networks.",
      "Hit a shot: A² Golf plays it and the app arms the R10 for the next one.",
    ],
    note: "A radar: the R10 works out its spin from the flight, so its spin is kept out of the spin tips. The Garmin Golf app's E6 Connect is the way in.",
  },
  {
    id: "mlm2pro",
    name: "Rapsodo MLM2PRO",
    route: "openconnect",
    via: "a community connector: MLM2PRO-BT-APP (over Bluetooth) or the MLM2PRO Connector (reads the Rapsodo app's screen)",
    spin: "varies",
    club: "club speed (more from the screen-reading connector)",
    impact: false,
    ids: [/mlm2pro/i],
    steps: [
      "Close any other golf software connected to it. Install one of the community connectors: MLM2PRO-BT-APP connects to the MLM2PRO over Bluetooth (sign in with your Rapsodo account); the MLM2PRO Connector reads the Rapsodo app's screen.",
      "In the connector's settings, send to 127.0.0.1, port {port} - or this PC's address, {address}, from another computer.",
      "The screen-reading connector only sends to 127.0.0.1 when a window of the name in its \"API window name\" setting is open: set it to A² Golf, or use {address} instead.",
      "Start the connector: the top bar says Rapsodo MLM2PRO connected.",
    ],
    note: "Spin is measured with Rapsodo's marked (RPT) balls and estimated without them.",
  },
  {
    id: "uneekor",
    name: "Uneekor (EYE XO, EYE MINI, QED)",
    short: "Uneekor",
    route: "openconnect",
    via: "Uneekor's own third-party connection (VIEW with the third-party add-on or Pro package)",
    fixed: true,
    spin: "measured",
    club: "club speed, path, face, attack angle, loft, lie",
    impact: false,
    ids: [/uneekor/i],
    steps: [
      "Close any other golf software: Uneekor's third-party connection sends to this PC's port 921, so A² Golf must run on the same PC and have the port.",
      "In Uneekor VIEW, choose the third-party simulator connection and connect. A² Golf answers it.",
      "The top bar says Uneekor connected.",
    ],
    note: "Its strike positions aren't used: the units they come in aren't known.",
  },
  {
    id: "skytrak",
    name: "SkyTrak / SkyTrak+",
    short: "SkyTrak",
    route: "openconnect",
    via: "the community OpenSkyPlus with its connector",
    spin: "measured",
    club: "club speed",
    impact: false,
    ids: [/gspro4osp/i, /skytrak/i],
    steps: [
      "Close any other golf software. Install OpenSkyPlus and its connector (community software for the SkyTrak app).",
      "Leave it sending to 127.0.0.1, port {port} - or set this PC's address, {address}, from another computer.",
      "Start the SkyTrak app: the top bar says SkyTrak connected, and A² Golf tells it when to arm for the next shot.",
    ],
  },
  {
    id: "gc2",
    name: "Foresight GC2",
    route: "openconnect",
    via: "a community GC2 connector (over its serial or Bluetooth link)",
    spin: "measured",
    club: "",
    impact: false,
    ids: [/\bgc2\b/i],
    steps: [
      "Close any other golf software. Run a community GC2 connector (GC2-to-OpenApi, say).",
      "Give it this PC's address and port: 127.0.0.1 and {port} on this PC, {address} from another.",
      "The top bar says Foresight GC2 connected.",
    ],
  },
  {
    id: "es16",
    name: "Ernest Sports ES16 / ES Tour Plus",
    short: "ES16",
    route: "openconnect",
    via: "the community ES16 connector (over its Bluetooth serial link)",
    spin: "measured",
    club: "club speed, path, face, attack angle",
    impact: false,
    ids: [/\bes16\b/i, /es tour/i],
    steps: [
      "Close any other golf software. Run the community ES16 connector.",
      "Set its HOST to 127.0.0.1 (or {address} from another computer) and its PORT to {port}.",
      "The top bar says ES16 connected.",
    ],
  },
  {
    id: "pitrac",
    name: "PiTrac",
    route: "openconnect",
    via: "PiTrac itself (its Open Connect simulator setting)",
    spin: "measured",
    club: "",
    impact: false,
    ids: [/pitrac/i],
    steps: ["In PiTrac's settings, choose its Open Connect simulator, with this PC's address, {address}, and port {port}.", "The top bar says PiTrac connected."],
  },
  {
    id: "openflight",
    name: "OpenFlight",
    route: "openconnect",
    via: "OpenFlight itself (its Open Connect output)",
    spin: "estimated",
    club: "club speed and path, when it measures them",
    impact: false,
    ids: [/openflight/i],
    steps: ["Point OpenFlight's Open Connect output at this PC's address, {address}, port {port}.", "The top bar says OpenFlight connected."],
    note: "A radar: its spin is estimated, so it's kept out of the spin tips.",
  },
  {
    id: "slx",
    name: "SLX MicroSim",
    route: "openconnect",
    via: "SLX Connect",
    fixed: true,
    spin: "varies",
    club: "",
    impact: false,
    ids: [/\bslx\b/i],
    steps: ["Close any other golf software: SLX Connect sends to this PC's port 921, so A² Golf must run on the same PC.", "Start SLX Connect as usual."],
  },
  {
    id: "vtrack",
    name: "VTrack",
    route: "openconnect",
    via: "the VTrack toolkit",
    fixed: true,
    spin: "varies",
    club: "",
    impact: false,
    ids: [/vtrack/i],
    steps: ["Close any other golf software: the VTrack toolkit sends to this PC's port 921, so A² Golf must run on the same PC.", "Start the toolkit as usual."],
  },
  {
    id: "screen",
    name: "FlightScope Mevo+, Garmin R50, TrackMan, Full Swing KIT, Swing Caddie SC4, TruGolf Apogee",
    route: "screen",
    via: "the community MLM2PRO Connector, reading your launch monitor's app off the screen",
    spin: "varies",
    club: "what the app shows (club speed, path, face, attack angle)",
    impact: false,
    ids: [/mevo/i, /\br50\b/i, /trackman/i, /full ?swing/i, /\bsc4\b/i, /voice caddie/i, /apogee/i, /xswing/i],
    steps: [
      "Their software can't send shots to A² Golf, so these work through a community program that reads the numbers off your launch monitor's app on the screen.",
      "Install the MLM2PRO Connector, choose your launch monitor in its settings, and mark where the numbers are on the app's screen.",
      "Send to this PC's address, {address}, port {port} (or set its \"API window name\" to A² Golf and use 127.0.0.1).",
      "The top bar names your launch monitor once the first shot comes in.",
    ],
    note: "Reading the screen can misread a number now and then. A radar's spin (Mevo+, SC4, TrackMan's indoors) is estimated.",
  },
  {
    id: "foresight",
    name: "Bushnell Launch Pro, Foresight GC3, GCQuad, GCHawk",
    route: "none",
    via: "",
    spin: "measured",
    club: "",
    impact: false,
    ids: [/bushnell/i, /\bgc3\b/i, /gcquad/i, /gchawk/i],
    steps: [
      "Not yet: their software (FSX) doesn't send shots in a form A² Golf can read.",
      "FSX does write each shot to a file on the PC: reading it is on the list - a shot file from someone with one would help.",
    ],
  },
  {
    id: "other",
    name: "Another launch monitor",
    route: "openconnect",
    via: "any program that speaks Open Connect",
    spin: "varies",
    club: "",
    impact: false,
    ids: [],
    steps: [
      "Close any other golf software: A² Golf listens on port 921 (and 922 and 49152).",
      "In your launch monitor's software or connector, choose its Open Connect (or \"OpenAPI\") simulator output.",
      "Give it this PC's address: 127.0.0.1 on this PC, {address} from another, and port {port}.",
      "The top bar names your launch monitor once it connects. If nothing arrives, connection diagnostics (below) shows every message.",
    ],
  },
];

const BY_ID = new Map(LAUNCH_MONITORS.map((m) => [m.id, m]));

export const monitorById = (id) => BY_ID.get(id) ?? BY_ID.get("omni");

// The choices for the menu: [{ value, label }].
export const monitorChoices = () => LAUNCH_MONITORS.map((m) => ({ value: m.id, label: m.name }));

// The launch monitor a shot's DeviceID belongs to, or null (a test shot, a
// mouse swing, a name not known).
export function recogniseMonitor(deviceId) {
  const id = String(deviceId ?? "");
  if (!id) return null;
  return LAUNCH_MONITORS.find((m) => m.ids.some((re) => re.test(id))) ?? null;
}

// What to call a connected launch monitor: the known name, or what it says
// it is.
export function monitorName(deviceId) {
  const m = recogniseMonitor(deviceId);
  if (m && m.id !== "screen") return m.short ?? m.name;
  const s = String(deviceId ?? "").trim();
  return s && s !== "unknown" ? s : "Launch monitor";
}

// What "waiting for your ..." calls a launch monitor the player chose
// ("launch monitor" when the choice names several, or none).
export function waitingName(id) {
  const m = monitorById(id);
  return m.id === "other" || m.id === "screen" ? "launch monitor" : m.short ?? m.name;
}

// Whether a shot's spin was measured: true, false (a radar's estimate) or
// undefined (it depends - marked balls - or the launch monitor isn't known).
export function measuredSpinOf(deviceId) {
  const m = recogniseMonitor(deviceId);
  if (!m) return undefined;
  return m.spin === "measured" ? true : m.spin === "estimated" ? false : undefined;
}

// A shot's club data as A-Squared Golf can trust it: without strike positions
// from a launch monitor whose units aren't known.
export function trustedClub(deviceId, club) {
  if (!club) return club;
  const m = recogniseMonitor(deviceId);
  if (!m || m.impact) return club;
  if (club.impactHorizontal === undefined && club.impactVertical === undefined) return club;
  const { impactHorizontal, impactVertical, ...rest } = club;
  return rest;
}

// The setup steps for a launch monitor, with this PC's address and the
// ports filled in. addresses: this PC's network addresses ([{ address }]);
// port: the Open Connect port listening (921 unless it couldn't);
// e6Port: the Garmin Golf app's.
export function setupSteps(id, { addresses = [], port = 921, e6Port = 2483 } = {}) {
  const m = monitorById(id);
  const address = addresses.map((a) => a.address).find(Boolean) ?? "this PC's address (connection diagnostics shows it)";
  return m.steps.map((s) => s.replaceAll("{address}", address).replaceAll("{port}", String(port)).replaceAll("{e6port}", String(e6Port)));
}

// What it measures, in a line.
export function measuresLine(id) {
  const m = monitorById(id);
  const spin = { measured: "spin measured", estimated: "spin estimated (kept out of the spin tips)", varies: "spin measured or estimated, by ball" }[m.spin];
  return [spin, m.club ? `club data: ${m.club}` : "no club data"].join("; ");
}
