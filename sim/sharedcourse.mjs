// A course shared through the relay (relay/courses.mjs keeps it; the
// owner, 10 November 2026: "is if designed courses ... work with web/apk
// access" - "yes start on shared courses"): put up once from the PC that
// made it, by a code ("C7Q2MX"), and fetched by any phone, browser or PC -
// to play on their own, or in a season by post on it.
//
// The course's text squeezed (gzip, the browser's and Node's own) and sent
// in parts the relay keeps; its hash (SHA-256 of the text) says it's the
// same course, so sharing it again unchanged gives the same code back
// (kept by the PC), and a copy fetched is checked against it.
//
// The same here for the PC's server (server/sharedcourses.mjs) and the
// phone's and web version's pocket server: share() and fetchShared() take
// a fetch and the relay's address.

// Each part's most, as the relay takes it (relay/courses.mjs PART_CHARS -
// the relay can't import from here: a test keeps the two the same).
export const PART_CHARS = 100 * 1024;
// The relay's own address for plain requests (its wss:// as https://).
const relayHttp = (relay) => String(relay ?? "").replace(/^ws(s?):\/\//, "http$1://").replace(/\/+$/, "");
// A course fetched from a friend: its id here ("shared-c7q2mx": a course
// id's lower case), so it's never mixed up with one of this device's own.
export const sharedId = (code) => `shared-${String(code).toLowerCase()}`;
export const SHARED_ID = /^shared-(c[a-z0-9]{5})$/;
export const codeOfShared = (id) => SHARED_ID.exec(String(id ?? ""))?.[1]?.toUpperCase() ?? null;
// A course's code from a link or as typed ("c7q2mx", ".../c/C7Q2MX").
export function readCourseCode(text) {
  const m = /(?:^|[/=\s])(C[A-Z0-9]{5})(?:$|[/?#\s])/i.exec(` ${String(text ?? "").trim()} `);
  return m ? m[1].toUpperCase() : null;
}
// The link to give friends: the relay's own page for it.
export const courseLink = (code, relay) => `${relayHttp(relay)}/c/${code}`;

const toBase64 = (bytes) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromBase64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
async function squeeze(text) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function unsqueeze(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}
export async function courseHash(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// What's shared of a course: the course as it's played, without what's
// only this PC's (its id, its rounds and bests, when it was last saved,
// where it came from). The name and holes stay.
export function forSharing(course) {
  const { id, rounds, best, bests, shared, updated, ...rest } = course ?? {};
  return rest;
}

// A course ready to send: { text, hash, parts, info }.
export async function packCourse(course, part = PART_CHARS) {
  const body = forSharing(course);
  const text = JSON.stringify(body);
  const hash = await courseHash(text);
  const packed = toBase64(await squeeze(text));
  const n = Math.max(1, Math.ceil(packed.length / part));
  const parts = Array.from({ length: n }, (_, i) => packed.slice(i * part, (i + 1) * part));
  const holes = Array.isArray(body.holes) ? body.holes.length : null;
  const par = Array.isArray(body.holes) ? body.holes.reduce((a, h) => a + (Number(h?.par) || 0), 0) || null : null;
  return { text, hash, parts, info: { name: String(body.name ?? "A course").slice(0, 60), holes, par, hash, n } };
}
// The course from its parts, checked against its hash.
export async function unpackCourse(parts, hash) {
  const text = await unsqueeze(fromBase64(parts.join("")));
  if (hash && (await courseHash(text)) !== hash) throw new Error("That course didn't arrive whole - try again");
  return JSON.parse(text);
}

const post = async (fetchImpl, url, body) => {
  let res;
  try {
    res = await fetchImpl(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new Error("Couldn't reach the online server - check the internet and try again");
  }
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.ok === false) throw new Error(j.error ?? `The online server said no (${res.status})`);
  return j;
};
const get = async (fetchImpl, url) => {
  let res;
  try {
    res = await fetchImpl(url);
  } catch {
    throw new Error("Couldn't reach the online server - check the internet and try again");
  }
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.ok === false) throw new Error(j.error ?? `The online server said no (${res.status})`);
  return j;
};

// Shares a course: { code, hash, name }. key: this device's secret for it
// (kept to take it down later). said(words): how it's going.
export async function shareCourse(course, { relay, key, fetchImpl = (...a) => fetch(...a), said = () => {} }) {
  const base = relayHttp(relay);
  const { parts, info } = await packCourse(course);
  said("Sharing the course...");
  const made = await post(fetchImpl, `${base}/shelf`, { op: "create", key, ...info });
  for (let i = 0; i < parts.length; i++) {
    if (parts.length > 1) said(`Sharing the course... ${i + 1} of ${parts.length}`);
    await post(fetchImpl, `${base}/shelf/${made.code}`, { op: "part", key, i, data: parts[i] });
  }
  return { code: made.code, hash: info.hash, name: info.name };
}

// Fetches a shared course by its code: { course, info } - the course with
// its id here and where it came from.
export async function fetchShared(code, { relay, fetchImpl = (...a) => fetch(...a), said = () => {} }) {
  const base = relayHttp(relay);
  const info = await get(fetchImpl, `${base}/shelf/${code}`);
  if (!info.ready) throw new Error("That course is still being shared - try again in a moment");
  const parts = [];
  for (let i = 0; i < info.n; i++) {
    if (info.n > 1) said(`Fetching the course... ${i + 1} of ${info.n}`);
    parts.push((await get(fetchImpl, `${base}/shelf/${code}/${i}`)).data);
  }
  const course = await unpackCourse(parts, info.hash);
  return { course: { ...course, id: sharedId(code), shared: { code, hash: info.hash, at: info.at ?? null } }, info };
}

// A device's secret for the courses it shares (only its hash is kept by
// the relay): 24 random bytes, in letters a link takes.
export function newShareKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Sharing its own courses and fetching friends', for a device that keeps
// courses: the PC's server (server/sharedcourses.mjs: kept in a file beside
// its courses) and the web version's and phone's pocket server (kept in the
// page's storage).
//   kept:    { load() -> { key, byCourse } | null, save(data) } - this
//            device's secret, and each course's code and the version shared
//            (a friend's: when it came, to know if it's been changed here)
//   courses: { get(id) -> course | null, save(id, course) -> { id, name,
//            updated }, game(id) -> true for one that comes with the game }
//            (get and save may each give a promise)
//   here:    the place in words ("on this PC")
export class CourseSharing {
  constructor({ kept, courses, relay = "", fetchImpl = (...a) => fetch(...a), here = "here", now = () => Date.now(), onChange = () => {} }) {
    Object.assign(this, { kept, courses, relay, fetchImpl, here, now, onChange });
    this.data = null;
  }

  load() {
    if (this.data) return this.data;
    const d = this.kept.load();
    this.data = d && typeof d === "object" ? d : {};
    this.data.key ??= newShareKey();
    this.data.byCourse ??= {};
    return this.data;
  }

  // The code a course was last shared under, if it's the same course now:
  // a friend's as it came, its own code (changed in the designer since, it's
  // shared afresh, under a new one).
  async codeOf(id) {
    const kept = this.load().byCourse[id];
    const course = await this.courses.get(id);
    if (!course) return null;
    const fromFriend = codeOfShared(id);
    if (fromFriend && (!kept || (kept.friend && kept.updated === course.updated))) return fromFriend;
    if (!kept?.hash) return null;
    return (await packCourse(course)).info.hash === kept.hash ? kept.code : null;
  }

  // -> { code, link, name } (again: true when it's the code it had).
  async share(id, { said = () => {} } = {}) {
    if (!this.relay) throw new Error(`Online play is off ${this.here}, so it can't share`);
    if (this.courses.game(id)) throw new Error("That course comes with the game - everyone has it already");
    const course = await this.courses.get(id);
    if (!course) throw new Error("No such course");
    const known = await this.codeOf(id);
    if (known) return { code: known, link: courseLink(known, this.relay), name: course.name, again: true };
    const r = await shareCourse(course, { relay: this.relay, key: this.load().key, fetchImpl: this.fetchImpl, said });
    this.load().byCourse[id] = { code: r.code, hash: r.hash, at: this.now() };
    this.kept.save(this.load());
    return { code: r.code, link: courseLink(r.code, this.relay), name: r.name };
  }

  // A friend's course by its code or link, kept here: -> { id, name, code }.
  async fetch(text, { said = () => {} } = {}) {
    const code = readCourseCode(text);
    if (!code) throw new Error("That isn't a course's code - it's a C and five letters or numbers");
    if (!this.relay) throw new Error(`Online play is off ${this.here}, so it can't fetch a course`);
    const { course } = await fetchShared(code, { relay: this.relay, fetchImpl: this.fetchImpl, said });
    const saved = await this.courses.save(course.id, course);
    this.load().byCourse[saved.id] = { code, friend: true, updated: saved.updated, at: this.now() };
    this.kept.save(this.load());
    this.onChange();
    return { id: saved.id, name: saved.name, code };
  }

  // A course deleted: what was kept about sharing it, forgotten.
  forget(id) {
    if (!this.load().byCourse[id]) return;
    delete this.load().byCourse[id];
    this.kept.save(this.load());
  }
}

