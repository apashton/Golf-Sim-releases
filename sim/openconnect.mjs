// GSPro Open Connect v1: the protocol launch monitor connectors (Square's
// included) use to hand shots to a simulator. The connector opens a TCP
// connection to the simulator and writes JSON objects, one per shot plus
// periodic heartbeats; the simulator answers each with a JSON status.
//
// Nothing here assumes one object per TCP packet: objects can arrive split
// across packets or several to a packet, with or without newlines between.

import { gsproClub } from "../omni.js";
import { BAG } from "./clubs.mjs";

// Splits a byte stream into complete top-level JSON objects.
export class JsonStream {
  constructor() {
    this.buffer = "";
  }

  // Feeds a chunk; returns the complete JSON texts it finished.
  push(chunk) {
    this.buffer += chunk;
    const out = [];
    let depth = 0;
    let inString = false;
    let escaped = false;
    let start = -1;
    let consumed = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      const c = this.buffer[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (c === "\\") escaped = true;
        else if (c === '"') inString = false;
        continue;
      }
      // (Strings only inside an object: a stray quote between objects is
      // junk, not the start of a string that would swallow every shot after.)
      if (c === '"' && depth > 0) inString = true;
      else if (c === "{") {
        if (depth === 0) start = i;
        depth++;
      } else if (c === "}" && depth > 0) {
        depth--;
        if (depth === 0) {
          out.push(this.buffer.slice(start, i + 1));
          consumed = i + 1;
        }
      } else if (depth === 0) {
        consumed = i + 1; // whitespace or junk between objects
      }
    }
    this.buffer = this.buffer.slice(consumed);
    // Refuse to buffer forever if something that is not JSON is being sent.
    if (this.buffer.length > 1_000_000) this.buffer = "";
    return out;
  }
}

// Connectors send numbers either as numbers or as strings, and booleans the
// same way. These read either.
function num(v) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number.parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
}
function bool(v) {
  return v === true || v === "true" || v === "True" || v === 1 || v === "1";
}

// Field names are matched case-insensitively ("APIversion" and "Apiversion"
// both occur in the wild).
function pick(obj, name) {
  if (!obj || typeof obj !== "object") return undefined;
  const key = Object.keys(obj).find((k) => k.toLowerCase() === name.toLowerCase());
  return key === undefined ? undefined : obj[key];
}

// Turns a raw Open Connect message into what the app uses:
//   { kind: "shot", ball: {...}, club: {...}|null, shotNumber, deviceId }
//   { kind: "club", club: {...}, shotNumber, deviceId } - club data on its
//     own, after its shot
//   { kind: "heartbeat", ready, ballDetected, deviceId }
//   { kind: "invalid", reason }
// Read to suit every connector seen (docs/LAUNCH-MONITORS.md has where each
// rule came from): a shot is ball data with a speed, whatever IsHeartBeat
// says (VTrack's toolkit and an MLM2PRO app pretending to be a Square send
// real shots marked as heartbeats); a total spin of 0 beside real back and
// side spin is a placeholder (Uneekor's own connector, older PiTrac) - and
// so is any club value or carry of exactly 0 (the R10 bridges, the
// MLM2PRO, GC2 and SkyTrak connectors send 0 for what they don't measure).
const carryIn = (carry, units) => (!(carry > 0) ? undefined : /^met/i.test(String(units ?? "")) ? Math.round((carry / 0.9144) * 10) / 10 : carry);
const measured = (v) => (v === 0 ? undefined : v);

export function interpret(message) {
  if (!message || typeof message !== "object") return { kind: "invalid", reason: "not an object" };
  const opts = pick(message, "ShotDataOptions") ?? {};
  const deviceId = pick(message, "DeviceID") ?? "unknown";
  const ready = bool(pick(opts, "LaunchMonitorIsReady"));
  const ballDetected = bool(pick(opts, "LaunchMonitorBallDetected"));
  const hasBall = bool(pick(opts, "ContainsBallData"));
  const shotNumber = num(pick(message, "ShotNumber"));
  const club = bool(pick(opts, "ContainsClubData")) ? clubData(pick(message, "ClubData")) : null;
  if (!hasBall) {
    // Club data in a message of its own, after the ball's (the community
    // Square connector): for the shot just played.
    if (club) return { kind: "club", club, shotNumber, deviceId };
    return { kind: "heartbeat", ready, ballDetected, deviceId };
  }
  const b = pick(message, "BallData") ?? {};
  const speedMph = num(pick(b, "Speed"));
  if (speedMph === undefined || speedMph <= 0) {
    if (bool(pick(opts, "IsHeartBeat"))) return { kind: "heartbeat", ready, ballDetected, deviceId };
    return { kind: "invalid", reason: "no ball speed" };
  }
  let totalSpin = num(pick(b, "TotalSpin"));
  let spinAxis = num(pick(b, "SpinAxis"));
  const backSpin = num(pick(b, "BackSpin"));
  const sideSpin = num(pick(b, "SideSpin"));
  // Either total spin + axis or back + side spin may be sent: the total and
  // axis when there's a total, else worked out from back and side spin.
  if (backSpin !== undefined || sideSpin !== undefined) {
    const back = backSpin ?? 0;
    const side = sideSpin ?? 0;
    if (!(totalSpin > 0) && (back || side)) {
      totalSpin = Math.hypot(back, side);
      spinAxis = (Math.atan2(side, back) * 180) / Math.PI;
    } else if (spinAxis === undefined && back) {
      spinAxis = (Math.atan2(side, back) * 180) / Math.PI;
    }
  }
  const ball = {
    speedMph,
    vla: num(pick(b, "VLA")) ?? 0,
    hla: num(pick(b, "HLA")) ?? 0,
    totalSpin: totalSpin ?? 0,
    spinAxis: spinAxis ?? 0,
    // The launch monitor's own carry, in yards (Open Connect's Units says
    // when it's metres).
    carryYards: carryIn(num(pick(b, "CarryDistance")), pick(message, "Units")),
  };
  // Numbers no golf shot has: refused, said why (the connection log).
  const wrong = outOfRange(ball);
  if (wrong) return { kind: "invalid", reason: wrong };
  return { kind: "shot", ball: inRange(ball), club, shotNumber, deviceId, ready };
}

// What a golf shot can be: ball speed up to 250 mph, launched from 10°
// down to 90° up, within 90° either side of straight.
export const SHOT_RANGE = { speedMph: 250, vla: [-10, 90], hla: 90, spin: 20000 };
function outOfRange(b) {
  if (b.speedMph > SHOT_RANGE.speedMph) return `ball speed ${b.speedMph} mph is more than any shot`;
  if (b.vla < SHOT_RANGE.vla[0] || b.vla > SHOT_RANGE.vla[1]) return `launch angle ${b.vla}° can't be a shot`;
  if (Math.abs(b.hla) > SHOT_RANGE.hla) return `direction ${b.hla}° can't be a shot`;
  return null;
}
// The spin as its size (up to 20,000 rpm) and its axis within 90° either
// way (an axis past 90° is the same tilt the other way round).
function inRange(b) {
  let axis = b.spinAxis;
  if (Math.abs(axis) > 180) axis = ((((axis + 180) % 360) + 360) % 360) - 180;
  if (axis > 90) axis -= 180;
  else if (axis < -90) axis += 180;
  return { ...b, totalSpin: Math.min(SHOT_RANGE.spin, Math.abs(b.totalSpin)), spinAxis: axis };
}

// A message's ClubData, or null when nothing in it was measured.
function clubData(c) {
  if (!c || typeof c !== "object") return null;
  const v = (name) => measured(num(pick(c, name)));
  const club = {
    speedMph: v("Speed"),
    angleOfAttack: v("AngleOfAttack"),
    faceToTarget: num(pick(c, "FaceToTarget")),
    path: num(pick(c, "Path")),
    loft: v("Loft"),
    lie: v("Lie"),
    // Where on the face it was struck, in mm from the centre: the Omni's
    // link and A-Squared Golf's test shots send ImpactHorizontal and
    // ImpactVertical; Open Connect's own names (another launch monitor's
    // connector) are HorizontalFaceImpact and VerticalFaceImpact - taken
    // only as a pair, as one connector sends its face-to-path in
    // HorizontalFaceImpact with VerticalFaceImpact 0.
    impactHorizontal: num(pick(c, "ImpactHorizontal")),
    impactVertical: num(pick(c, "ImpactVertical")),
    // Open Connect's club speed at impact and how fast the face was
    // closing (degrees a second), when a launch monitor measures them.
    speedAtImpact: v("SpeedAtImpact"),
    closureRate: v("ClosureRate"),
  };
  const h = v("HorizontalFaceImpact");
  const vert = v("VerticalFaceImpact");
  if (club.impactHorizontal === undefined && club.impactVertical === undefined && h !== undefined && vert !== undefined) {
    club.impactHorizontal = h;
    club.impactVertical = vert;
  }
  // The face and path can truly be 0, but not with nothing else measured.
  const others = Object.entries(club).some(([k, x]) => k !== "faceToTarget" && k !== "path" && x !== undefined);
  if (!others && !club.faceToTarget && !club.path) return null;
  return club;
}

// The replies, as GSPro sends them (each its own write, never two run
// together: some connectors read two objects back to back as one, others
// split only on newlines - docs/LAUNCH-MONITORS.md). Every one has a Code:
// one connector stops altogether on a reply without one.
export function ack({ club = false } = {}) {
  return { Code: 200, Message: club ? "Club & Ball Data received" : "Ball Data received", Player: null };
}
export function failure(reason) {
  return { Code: 501, Message: `Failure occurred: ${reason}` };
}
// Ready for the next shot: connectors that wait for it before arming the
// launch monitor again (the community Square connector, the SkyTrak's).
export function ready() {
  return { Code: 202, Message: "GSPro ready", Player: null };
}
export function roundEnded() {
  return { Code: 203, Message: "GSPro round ended", Player: null };
}

// GSPro tells the connector which club the player has; connectors use a
// putter ("PT") to switch the launch monitor into putting mode.
// The club goes in GSPro's own code (I7, W3, H4 rather than A-Squared Golf's 7I,
// 3W, 4H): it's what a connector looks the club up by - GSPro's Square
// connector would otherwise fall back to its default club for anything but
// the driver, the wedges and the putter.
// distanceToTarget: yards to the target or pin. Never 0: an MLM2PRO app
// ignores a player message with no distance (no club change, no putting)
// and the SkyTrak's connector won't arm the launch monitor again - so
// without one, the club's usual carry.
export function playerInfo({ club = "DR", handed = "RH", distanceToTarget = 0 } = {}) {
  const d = Number(distanceToTarget);
  const yards = d > 0 ? Math.round(d * 10) / 10 : (BAG[club]?.carry ?? (club === "PT" ? 10 : 150));
  return {
    Code: 201,
    Message: "GSPro Player Information",
    Player: { Handed: handed === "LH" ? "LH" : "RH", Club: gsproClub(club), DistanceToTarget: yards, Surface: null },
  };
}
