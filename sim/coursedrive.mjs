// The device's own courses kept in step with a folder in the player's
// Google Drive (sim/coursesync.mjs has the rules and why; sim/drivefiles.mjs
// the requests). An option, off unless it's turned on on this device. The
// same on the PC (server/coursedrive.mjs: the Google sign-in a player has
// there, done by itself as courses change) and in the web version (the
// pocket server: the page's own permission from Google's pop-up, done when
// asked).
//
//   courses  { list() -> [{ id, updated, origin, builtIn }], get(id) ->
//            course | null, save(id, course) -> { id, updated }, remove(id) }
//            (each may give a promise): the device's courses
//   drive    a DriveFiles
//   kept     { load() -> data | null, save(data) }: whether it's on, whose
//            Drive, the folder there, what was last in step, how the last
//            sync went
// One sync at a time.

import { FOLDER } from "./drivesync.mjs";
import { COURSES_FOLDER, COURSE_MIME, courseFile, readCourseFile, ownCourse, planSync, newerCopy, syncWords, syncTrouble } from "./coursesync.mjs";

// What stops the whole sync, not just one course.
const stops = (err) => err?.error === "offline" || err?.error === "signin" || err?.error === "invalid_grant" || err?.status === 401 || err?.status === 403;

export class CourseDrive {
  constructor({ courses, drive, kept, now = () => Date.now(), onChange = () => {}, onCourses = () => {} }) {
    Object.assign(this, { courses, drive, kept, now, onChange, onCourses });
    this.data = null;
    this.busy = false;
    this.chain = Promise.resolve();
  }

  load() {
    if (this.data) return this.data;
    const d = this.kept.load();
    this.data = d && typeof d === "object" ? d : {};
    this.data.on = !!this.data.on;
    this.data.byId = this.data.byId && typeof this.data.byId === "object" ? this.data.byId : {};
    this.data.bad = this.data.bad && typeof this.data.bad === "object" ? this.data.bad : {};
    return this.data;
  }
  keep() {
    this.kept.save(this.load());
  }

  get on() {
    return this.load().on;
  }

  // How it is: for the Google Drive box.
  view() {
    const d = this.load();
    return { on: d.on, who: d.who ?? null, busy: this.busy, count: Object.keys(d.byId).length, last: d.last ?? null };
  }

  // On, for `who` (in words: the Google account, or the player whose it is).
  turnOn(who = null) {
    const d = this.load();
    // (Another account's Drive than last time: nothing's known of it.)
    if (d.who !== who) this.forgetDrive();
    d.on = true;
    d.who = who;
    this.keep();
    this.onChange();
  }
  // Off: the courses stay here and in the Drive as they are. What was in
  // step is let go of, so turning it on again later only ever adds - a
  // course deleted on one side meanwhile comes back, never the other way.
  turnOff() {
    const d = this.load();
    d.on = false;
    this.forgetDrive();
    delete d.last;
    this.keep();
    this.onChange();
  }
  forgetDrive() {
    const d = this.load();
    d.folder = null;
    d.byId = {};
    d.bad = {};
  }

  // In step now: -> view(). Never throws: how it went is in view().last.
  sync() {
    const run = this.chain.then(() => this.run());
    this.chain = run.catch(() => {});
    return run;
  }

  async run() {
    const d = this.load();
    if (!d.on) return this.view();
    this.busy = true;
    this.onChange();
    const done = { up: 0, down: 0, dropped: 0, binned: 0 };
    let failed = 0;
    let coursesChanged = false;
    try {
      // The folder: gone (deleted in the Drive, or another account's) means
      // start afresh there - everything here sent again, nothing deleted.
      if (d.folder) {
        const f = await this.drive.info(d.folder);
        if (!f || f.trashed) this.forgetDrive();
      }
      if (!d.folder) {
        d.folder = await this.drive.folder(COURSES_FOLDER, await this.drive.folder(FOLDER, "root"));
        this.keep();
      }
      const all = await this.courses.list();
      const local = all.filter(ownCourse).map((c) => ({ id: c.id, updated: c.updated ?? null }));
      // A file named as a course here that isn't the device's own to change
      // (one of the game's, a friend's): left alone. One that couldn't be
      // read last time: left until it changes.
      const notMine = new Set(all.filter((c) => !ownCourse(c)).map((c) => c.id));
      const files = (await this.drive.list(d.folder))
        .map((f) => ({ id: readCourseFile(f.name), fileId: f.id, md5: f.md5 }))
        .filter((f) => f.id && !notMine.has(f.id) && !(d.bad[f.id] && d.bad[f.id] === f.md5));
      const here = new Map(local.map((c) => [c.id, c]));
      const there = new Map(files.map((f) => [f.id, f]));
      for (const a of planSync(local, files, d.byId)) {
        try {
          if (await this.act(a, { here: here.get(a.id) ?? null, there: there.get(a.id) ?? null, done })) coursesChanged = true;
        } catch (err) {
          if (stops(err)) throw err;
          failed++;
        }
        this.keep();
      }
      d.last = { at: this.now(), words: syncWords(done), ...(failed ? { failed } : {}) };
    } catch (err) {
      d.last = { at: this.now(), error: syncTrouble(err), ...(err?.error === "signin" || err?.error === "invalid_grant" || err?.status === 401 ? { signin: true } : {}) };
    }
    this.busy = false;
    this.keep();
    this.onChange();
    if (coursesChanged) this.onCourses();
    return this.view();
  }

  // One course's part of it: true when the courses here changed.
  async act({ id, what, fileId }, { here, there, done }) {
    const d = this.load();
    const up = async () => {
      const course = await this.courses.get(id);
      if (!course) return false;
      const text = JSON.stringify(course);
      const r = (fileId ? await this.drive.update(fileId, text, COURSE_MIME) : null) ?? (await this.drive.create(d.folder, courseFile(id), text, COURSE_MIME));
      d.byId[id] = { fileId: r.id, local: here?.updated ?? course.updated ?? null, remote: r.md5 };
      done.up++;
      return false;
    };
    // Theirs read: the course, or null when it's gone or isn't one.
    const theirs = async () => {
      const text = await this.drive.read(fileId);
      if (text == null) return null;
      try {
        const c = JSON.parse(text);
        if (c && Array.isArray(c.holes)) return c;
      } catch {
        // Not a course: below.
      }
      d.bad[id] = there?.md5 ?? "?";
      throw { error: "not a course" };
    };
    const take = async (course) => {
      const { builtIn, shared, ...rest } = course;
      const saved = await this.courses.save(id, { ...rest, id });
      d.byId[id] = { fileId, local: saved.updated ?? null, remote: there?.md5 ?? null };
      delete d.bad[id];
      done.down++;
      return true;
    };
    if (what === "up") return up();
    if (what === "down") {
      const c = await theirs();
      return c ? take(c) : false;
    }
    if (what === "meet" || what === "both") {
      const c = await theirs();
      if (!c) return false;
      const which = newerCopy(here?.updated, c.updated);
      if (which === "here") return up();
      if (which === "there") return take(c);
      d.byId[id] = { fileId, local: here?.updated ?? null, remote: there?.md5 ?? null };
      return false;
    }
    if (what === "dropHere") {
      // Only once the Drive itself says its file's gone - binned, or
      // deleted for good.
      const f = await this.drive.info(fileId);
      if (f && !f.trashed) return false;
      await this.courses.remove(id);
      delete d.byId[id];
      done.dropped++;
      return true;
    }
    if (what === "dropThere") {
      await this.drive.trash(fileId);
      delete d.byId[id];
      done.binned++;
      return false;
    }
    delete d.byId[id];
    return false;
  }
}
