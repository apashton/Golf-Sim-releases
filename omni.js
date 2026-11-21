// The Square Golf Omni's own Bluetooth language, so A-Squared Golf can talk to the
// Omni directly instead of through GSPro's connector. Worked out from how
// GSPro's connector (GSPconnect, VGPconnect.Helpers.SquareGolf) talks to it.
// Nothing in it is secret: no pairing code, key or handshake.
//
// One service, three characteristics:
//   write   commands to the Omni, 9 bytes, written without response
//   read    notifications from the Omni: ready, shots, status, club data
//   serial  the serial number, read once
//
// Commands start 0x21, then the command, then a sequence number that goes up
// by one each time. Messages from the Omni start 0x11, then the message type.
// Numbers are 16-bit little-endian and signed; -1 means "not measured".
//
// Pure: no Bluetooth here, so it can be tested. omnilink.js does the talking.

export const SERVICE_UUID = "86601001-6b7e-439a-bdd1-489a3213e9bb";
export const WRITE_UUID = "86602101-6b7e-439a-bdd1-489a3213e9bb";
export const READ_UUID = "86602102-6b7e-439a-bdd1-489a3213e9bb";
export const SERIAL_UUID = "86602001-6b7e-439a-bdd1-489a3213e9bb";

// The Omni advertises as "SquareGolf(152A)" and the like (GSPconnect
// searches for "SquareGolf").
export const isOmniName = (name) => typeof name === "string" && /square/i.test(name);
// What the search asks Bluetooth for: every device, with the Omni's service
// allowed. Asking only for devices named Square... found nothing at home,
// in the app or in Edge, though Edge's list of every device showed
// "SquareGolf(152A)": the Omni's broadcast evidently doesn't carry the name
// the filter needs. So everything is listed and the Omni is picked from it
// (electron/omnipicker.mjs), by name or as the player chose it.
export const OMNI_SEARCH = { acceptAllDevices: true, optionalServices: [SERVICE_UUID] };

export const COMMAND = { armDisarm: 0x81, clubHandedness: 0x82, requestStatus: 0x83, requestClubData: 0x87 };
export const MESSAGE = { ready: 0x01, shot: 0x02, status: 0x03, club: 0x07 };
// A message starting 0x91 carries the battery level. GSPconnect reads its
// second byte as the level, but the owner's Omni sends 91-00-05 while its
// own display says 100%: in that three-byte form the second byte is 0 and
// the third counts fifths (5 = full). So a third byte of 0-5 is the level in
// fifths; otherwise the second byte is taken as the percent, as GSPconnect
// takes it. (From the one Omni seen so far - worth checking as it drains.)
const BATTERY = 0x91;
export function batteryLevel(bytes) {
  const third = bytes.length >= 3 ? bytes[2] : null;
  if (third !== null && bytes[1] === 0 && third <= 5) return third * 20;
  return bytes[1];
}
// A message starting 0x71, every three seconds whatever else is happening:
// 71-00-00-00-00-00-00-A4-47, its last two bytes a counter going up by three
// (seconds, it seems). The owner's first calibration session logged it
// hundreds of times as "not understood"; it carries nothing about a shot.
const HEARTBEAT = 0x71;

// The Omni reports speeds in metres per second x 100. GSPconnect's log shows
// the converted figure: 92.92249 mph for a shot sent as 4154 (41.54 m/s).
export const MPS_TO_MPH = 2.23694;

function command(code, a = 0, b = 0, c = 0) {
  // The sequence number (byte 3) is filled in as it's sent.
  return new Uint8Array([0x21, code, 0, a, b, c, 0, 0, 0]);
}

// Arm (ready for a shot) or disarm. Its last byte is what GSPro's connector
// calls measurement mode (0x11; 0x10 without it), for the marking ball of
// Square's Home Edition, which shares the Omni's Bluetooth language. The
// Omni measures spin on any ball: every shot the owner's has sent (51 in the
// calibration reports, on ordinary balls) came flagged measured, always
// armed this way - so it's always armed this way, with no switch for it
// (the owner, 20 October 2026: "The omni doesn't need marked balls").
const ARM_MODE = 0x11;
export function armCommand(arm) {
  return command(COMMAND.armDisarm, arm ? 1 : 0, ARM_MODE);
}
export function clubCommand(clubType, clubNumber, rightHanded = true) {
  return command(COMMAND.clubHandedness, clubNumber, clubType, rightHanded ? 0 : 1);
}

// GSPro's code for one of A-Squared Golf's clubs: GSPro puts the letter first (W3,
// H4, I7), A-Squared Golf the number (3W, 4H, 7I). The rest are the same (DR, PW,
// GW, SW, LW, PT), except the 48° wedge (AW): GSPro has no club between the
// pitching and gap wedges, so it goes as the gap wedge, the nearest.
export function gsproClub(code) {
  if (code === "AW") return "GW";
  const m = /^(\d)([WHI])$/.exec(String(code ?? ""));
  return m ? `${m[2]}${m[1]}` : String(code ?? "");
}

// The Omni's club type, club number and high/low offset for each of GSPro's
// clubs, as GSPro's connector has them (GSPconnect's SquareForm
// SquareGolfClubMapper - not the GolfJoy copy beside it, whose numbers
// differ): type 4 the driver, 5 a wood or hybrid, 6 an iron or wedge, 7 the
// putter - which is what switches the Omni into putting mode. The offset is
// added to the Omni's strike height (vImpact) in its club data: it measures
// from one point on every face, and the offset moves that to this club's
// middle - without it a wedge struck off the top of the face still read low.
// (GSPconnect has a second type for each, for its swing stick, which A-Squared Golf
// doesn't use.)
const OMNI_CLUB_TABLE = {
  DR: [4, 2, 20],
  W2: [5, 3, 10],
  W3: [5, 3, 10],
  W4: [5, 3, 10],
  W5: [5, 3, 10],
  W6: [5, 3, 10],
  W7: [5, 3, 10],
  H2: [5, 3, 10],
  H3: [5, 3, 10],
  H4: [5, 3, 10],
  H5: [5, 3, 10],
  H6: [5, 5, 10],
  H7: [5, 4, 10],
  I2: [6, 5, 13.375],
  I3: [6, 5, 13.6875],
  I4: [6, 5, 14],
  I5: [6, 5, 14.3125],
  I6: [6, 6, 14.625],
  I7: [6, 7, 14.9375],
  I8: [6, 8, 15.25],
  I9: [6, 9, 15.5625],
  PW: [6, 10, 15.875],
  GW: [6, 11, 16.1875],
  SW: [6, 12, 16.5],
  LW: [6, 12, 16.8125],
  PT: [7, 1, 0],
};

// One of A-Squared Golf's clubs (or GSPro's code for it) as the Omni knows it:
// { code, clubType, clubNumber, offset } with GSPro's code, or null for a
// club the Omni has no number for.
export function omniClub(code) {
  const gspro = gsproClub(code);
  const entry = OMNI_CLUB_TABLE[gspro];
  return entry ? { code: gspro, clubType: entry[0], clubNumber: entry[1], offset: entry[2] } : null;
}
export const statusCommand = () => command(COMMAND.requestStatus);
export const clubDataCommand = () => command(COMMAND.requestClubData);

export function hex(bytes) {
  return [...bytes].map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join("-");
}

// hex's text back to bytes: "11-02-0E", "11 02 0e" or "11020E". Null for
// anything else, or for more than 64 bytes (no Omni message is that long).
export function unhex(text) {
  if (typeof text !== "string") return null;
  const t = text.trim();
  if (!/^[0-9a-f]{2}([-\s]?[0-9a-f]{2})*$/i.test(t)) return null;
  const pairs = t.replace(/[-\s]/g, "").match(/../g);
  if (pairs.length > 64) return null;
  return Uint8Array.from(pairs, (p) => parseInt(p, 16));
}

// Which way round each of the Omni's readings is taken. A-Squared Golf counts in
// GSPro's directions, for a right-handed player: a ball starting right, a
// fade's spin axis (and side spin), an open face, an in-to-out path, an
// attack angle upwards, and a strike towards the toe or high on the face
// are all positive. Each reading the Omni sends is multiplied by its number
// here, so -1 turns it round.
//   spinAxis  the axis and side spin together (one direction): GSPconnect
//             turns both round before GSPro sees them, and so does A-Squared Golf.
//   hImpact   across the face: the owner's deliberate toe and heel strikes
//             came up the wrong way round (GSPconnect passes it on as sent).
//   the rest  as GSPconnect passes them on - assumed, and not yet checked
//             at the mat.
// The owner's own choices, from the old calibration page, are kept apart from this table
// and override it reading by reading. They say which way round to take the
// reading ("multiply the Omni's number by -1"), never "the other way from the
// default", so a later version that corrects a default can't turn back
// what the owner put right.
export const OMNI_SIGNS = Object.freeze({ hla: 1, spinAxis: -1, path: 1, face: 1, attack: 1, hImpact: -1, vImpact: 1 });
export const SIGN_KEYS = Object.keys(OMNI_SIGNS);

// The owner's signs, tidied: only known readings, only 1 or -1. Anything
// else (a damaged file, an old version's leftovers) is dropped.
export function cleanSigns(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const k of SIGN_KEYS) if (raw[k] === 1 || raw[k] === -1) out[k] = raw[k];
  return out;
}

// The signs in use: the defaults, with the owner's own on top.
export function signsFor(own, defaults = OMNI_SIGNS) {
  return { ...defaults, ...cleanSigns(own) };
}

// ---- Where on the face: the owner's corrections from marked strikes ----------
//
// The old calibration page fitted, from strikes the player marked on the
// real face (impact tape, foot powder), how the Omni's strike readings line
// up with where the ball really hit. What the owner kept with its "Use
// this" still applies (nothing makes new ones now), per kind of head - the
// driver, woods and hybrids ("wood") or the irons and wedges ("iron") - and
// per reading: across the face ("h") and up the face ("v"), as
// { sign, scale, offset }:
//
//   reading = sign x scale x (the Omni's own number, in mm) + offset
//
// with the club's high/low offset (omniClub) added to the Omni's number
// first, for up the face, as always. It's kept in the signs as .strike (not
// .face: that's the face angle's sign). Like the signs it's kept as how to take
// the Omni's own number, never as a change from the default, and for that
// head and reading it replaces the sign (hImpact or vImpact) in use.
export const FACE_HEADS = ["wood", "iron"];
export const FACE_AXES = ["h", "v"];
// Bounds for a correction: anything outside is a damaged file, not a fit.
export const FACE_LIMITS = { scale: [0.4, 2.5], offset: [-30, 30] };

// The kind of head a club has, from A-Squared Golf's code (DR, 3W, 4H, 7I, PW) or
// GSPro's (W3, H4, I7): "wood" (driver, woods and hybrids), "iron" (irons
// and wedges), or null (the putter, or a club not known).
export function headType(code) {
  const c = String(code ?? "").toUpperCase();
  if (/^(DR|\d[WH]|[WH]\d)$/.test(c)) return "wood";
  if (/^(\dI|I\d|PW|AW|GW|SW|LW)$/.test(c)) return "iron";
  return null;
}

// The owner's face corrections, tidied: only known heads and readings, a
// sign of 1 or -1, a scale and offset within bounds. Anything else is
// dropped, so an old signs file (which has none) loads as before.
export function cleanFace(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const within = (v, [lo, hi]) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
  for (const head of FACE_HEADS) {
    const h = raw[head];
    if (!h || typeof h !== "object") continue;
    for (const axis of FACE_AXES) {
      const c = h[axis];
      if (!c || typeof c !== "object" || (c.sign !== 1 && c.sign !== -1)) continue;
      if (!within(c.scale, FACE_LIMITS.scale) || !within(c.offset, FACE_LIMITS.offset)) continue;
      (out[head] ??= {})[axis] = { sign: c.sign, scale: Math.round(c.scale * 1000) / 1000, offset: Math.round(c.offset * 10) / 10 };
    }
  }
  return out;
}

// The correction for one head and reading, or null to use the sign.
export function faceCorrection(signs, head, axis) {
  const c = head ? signs?.strike?.[head]?.[axis] : null;
  return c && (c.sign === 1 || c.sign === -1) && Number.isFinite(c.scale) && Number.isFinite(c.offset) ? c : null;
}

// A reading taken the way round its sign says; missing stays missing. The
// + 0 keeps a reading of 0 from coming out as -0.
function turned(v, key, signs) {
  if (v === null || v === undefined) return v;
  const sign = signs?.[key] === 1 || signs?.[key] === -1 ? signs[key] : OMNI_SIGNS[key];
  return v * sign + 0;
}

const NAMES = {
  0x01: "ready",
  0x02: "shot",
  0x03: "status",
  0x07: "club data",
  0x81: "arm/disarm",
  0x82: "club",
  0x83: "status?",
  0x87: "club data?",
};
export const typeName = (code) => NAMES[code] ?? `0x${code.toString(16).toUpperCase().padStart(2, "0")}`;

// The i-th signed 16-bit number after the 3-byte header, or null for -1.
function field(bytes, i) {
  const at = 3 + i * 2;
  if (at + 1 >= bytes.length) return null;
  let v = bytes[at] | (bytes[at + 1] << 8);
  if (v >= 0x8000) v -= 0x10000;
  return v === -1 ? null : v;
}
const scaled = (v, by = 100) => (v === null ? null : v / by);

// Turns a notification into { type, ... }:
//   { type: "battery", level }
//   { type: "ready", ready: "not ready" | "ready" | "shot" }
//   { type: "status", status, armed }  (2-8 normal; 3 or more means armed)
//   { type: "shot", speedMps, vla, hla, totalSpin, spinAxis, backSpin, sideSpin, measuredSpin }
//   { type: "club", path, face, attack, loft, hImpact, vImpact, speedMps, tail, smash }
//   { type: "heartbeat" }  (the 0x71 message every three seconds)
//   { type: "unknown", reason }
// Shot and club angles are degrees; spins are rpm. These are the Omni's own
// numbers, the way round it sends them: shotToBall and clubToData turn them
// to A-Squared Golf's directions (OMNI_SIGNS).
export function parseMessage(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.length < 2) return { type: "unknown", reason: "too short" };
  if (bytes[0] === BATTERY) return { type: "battery", level: batteryLevel(bytes) };
  if (bytes[0] === HEARTBEAT) return { type: "heartbeat" };
  switch (bytes[1]) {
    case MESSAGE.ready:
      if (bytes.length !== 17) return { type: "unknown", reason: "ready message of the wrong length" };
      return { type: "ready", ready: ["not ready", "ready", "shot"][bytes[3]] ?? `state ${bytes[3]}` };
    case MESSAGE.status: {
      if (bytes.length < 4) return { type: "unknown", reason: "status message too short" };
      const status = bytes[3];
      return { type: "status", status, armed: status >= 3 && status <= 8, error: status > 8 };
    }
    case MESSAGE.shot: {
      if (bytes.length !== 17) return { type: "unknown", reason: "shot message of the wrong length" };
      // The third byte flags what the Omni measured, rather than estimated.
      const flags = bytes[2];
      return {
        type: "shot",
        speedMps: scaled(field(bytes, 0)),
        vla: scaled(field(bytes, 1)),
        hla: scaled(field(bytes, 2)),
        totalSpin: field(bytes, 3),
        spinAxis: scaled(field(bytes, 4)),
        backSpin: field(bytes, 5),
        sideSpin: field(bytes, 6),
        measuredSpin: (flags & 0x02) !== 0 && (flags & 0x0c) !== 0,
      };
    }
    case MESSAGE.club: {
      // 11 bytes: path, face, attack, loft. 19 bytes adds where on the face it
      // was struck and the club speed, and a last two bytes (17 and 18) that
      // GSPconnect doesn't read: kept as they came (tail), signed and not,
      // so the calibration report can see what they follow (clubTail). They
      // are the Omni's smash factor times 100 (sim/omnifield.mjs), FF-FF
      // when it has none: smash is that, or null. Open Connect's club data
      // has no name for a smash factor, so clubToData leaves it out.
      if (bytes.length !== 11 && bytes.length !== 19) return { type: "unknown", reason: "club message of the wrong length" };
      const long = bytes.length === 19;
      const u16 = long ? bytes[17] | (bytes[18] << 8) : null;
      return {
        type: "club",
        path: scaled(field(bytes, 0)),
        face: scaled(field(bytes, 1)),
        attack: scaled(field(bytes, 2)),
        loft: scaled(field(bytes, 3)),
        hImpact: long ? scaled(field(bytes, 4)) : null,
        vImpact: long ? scaled(field(bytes, 5)) : null,
        speedMps: long ? scaled(field(bytes, 6)) : null,
        tail: long ? { u16, s16: u16 >= 0x8000 ? u16 - 0x10000 : u16 } : null,
        smash: long && u16 !== 0xffff ? u16 / 100 : null,
      };
    }
    default:
      return { type: "unknown", reason: `message type ${typeName(bytes[1])}` };
  }
}

const round = (v, dp) => (v === null || v === undefined ? undefined : Math.round(v * 10 ** dp) / 10 ** dp);

// A shot message as the ball A-Squared Golf flies (the same shape Open Connect
// shots take), or null if the Omni didn't get a ball speed. signs: which way
// round to take its readings (OMNI_SIGNS, or the owner's on top of them).
export function shotToBall(shot, signs = OMNI_SIGNS) {
  if (!shot || shot.speedMps === null || !(shot.speedMps > 0)) return null;
  let totalSpin = shot.totalSpin;
  let spinAxis = turned(shot.spinAxis, "spinAxis", signs);
  // Total spin and axis are what's flown. A measured axis is always kept;
  // whichever is missing is worked out from back and side spin (side spin
  // turned as the axis is), but only from what was measured: a side spin of
  // -1 is not a straight shot, and an axis missing with it stays missing
  // (and flies straight - readingFor's curve check leaves such a shot out).
  const back = shot.backSpin;
  const side = turned(shot.sideSpin, "spinAxis", signs);
  if (spinAxis === null && side !== null && back !== null) spinAxis = (Math.atan2(side, back) * 180) / Math.PI;
  if (totalSpin === null && back !== null) {
    const cos = spinAxis === null ? 1 : Math.cos((spinAxis * Math.PI) / 180);
    totalSpin = side !== null ? Math.hypot(back, side) : cos > 0.2 ? back / cos : back;
  }
  return {
    speedMph: round(shot.speedMps * MPS_TO_MPH, 2),
    vla: shot.vla ?? 0,
    hla: turned(shot.hla, "hla", signs) ?? 0,
    totalSpin: round(totalSpin ?? 0, 0),
    spinAxis: round(spinAxis ?? 0, 2),
  };
}

// Club data in the names Open Connect uses; missing readings are left out.
// Path, face, attack angle and where on the face it was struck are taken the
// way round their signs say (OMNI_SIGNS): across the face is turned round by
// default, as A-Squared Golf counts towards the toe as positive (shotdata.mjs) and
// the Omni counts the other way - deliberate toe strikes at home came up as
// heel and heel as toe. Loft and club speed have no direction to turn.
// vOffset: the club's high/low offset (omniClub), added to the strike height
// first, as GSPro's connector does. head: the kind of head it was hit with
// (headType): where the owner has a face correction for it (signs.strike),
// the strike is taken that way instead of by its sign alone.
export function clubToData(club, signs = OMNI_SIGNS, vOffset = 0, head = null) {
  if (!club) return null;
  const vImpact = club.vImpact === null || club.vImpact === undefined ? club.vImpact : club.vImpact + (Number(vOffset) || 0);
  const strike = (v, key, axis) => {
    const c = faceCorrection(signs, head, axis);
    if (!c || v === null || v === undefined) return turned(v, key, signs);
    return round(c.sign * c.scale * v + c.offset, 2) + 0;
  };
  const out = {
    speedMph: club.speedMps === null ? undefined : round(club.speedMps * MPS_TO_MPH, 2),
    path: turned(club.path, "path", signs) ?? undefined,
    faceToTarget: turned(club.face, "face", signs) ?? undefined,
    angleOfAttack: turned(club.attack, "attack", signs) ?? undefined,
    loft: club.loft ?? undefined,
    impactHorizontal: strike(club.hImpact, "hImpact", "h") ?? undefined,
    impactVertical: strike(vImpact, "vImpact", "v") ?? undefined,
  };
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}

// What the status bar says when GSPro's own connector is running.
export const GSPCONNECT_TEXT = "Another program has the Omni - close it (check the system tray)";

// What the status bar says about the Omni's Bluetooth link, from the state
// the server passes on: { cls: ok | warn | off, text, short }, or null when
// A-Squared Golf isn't using Bluetooth (a browser, or turned off in the app).
// `short` is for the top bar on a narrower screen (a 1366 px projector, say)
// where all of `text` doesn't fit: still the state, and the battery once
// it's ready (while it gets ready there's only room for that).
// gspconnect: the server has noticed GSPro's own connector running. Unless
// the Omni is already A-Squared Golf's, that's what to fix, so it's said instead -
// with Bluetooth turned off too, as A-Squared Golf can't read what it sends.
export function omniStatusLine(omni, gspconnect = false) {
  if (gspconnect && omni?.state !== "connected") return { cls: "warn", text: GSPCONNECT_TEXT, short: "Another program has the Omni" };
  if (!omni || omni.state === "off" || omni.state === "unavailable") return null;
  const known = Number.isFinite(omni.battery);
  const battery = known ? ` - battery ${omni.battery}%` : "";
  const percent = known ? ` · ${omni.battery}%` : "";
  if (omni.state === "connected") {
    return omni.armed
      ? { cls: "ok", text: `Omni connected - ready${battery}`, short: `Omni ready${percent}` }
      : { cls: "warn", text: `Omni connected - getting ready${battery}`, short: "Omni getting ready" };
  }
  if (omni.state === "connecting") return { cls: "warn", text: "Connecting to the Omni...", short: "Connecting to the Omni..." };
  // (Had and lost - switched off, out of reach, asleep: it's found again by itself.)
  if (omni.reconnecting) return { cls: "warn", text: "Lost the Omni - reconnecting by itself (is it switched on and in reach?)", short: "Reconnecting to the Omni" };
  return { cls: "off", text: "Looking for the Omni over Bluetooth - is it switched on?", short: "Looking for the Omni" };
}
