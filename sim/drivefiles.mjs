// Files in a player's Google Drive, by plain requests (fetch): what keeping
// courses there needs (sim/coursedrive.mjs) - a folder found or made, its
// files listed, one read, made, replaced, looked at, binned. The same on
// the PC's server (the player's sign-in: server/googleauth.mjs) and in the
// web version's page (Google's own pop-up gives the page a token), so the
// token's handed in. A² Golf only ever sees the files it made itself
// (drive.file: sim/google.mjs).
//
// Throws { error } - "offline" (no internet), "signin" (no token, or Google
// won't take it), "http 403"... - and { status } with it.

import { GOOGLE } from "./google.mjs";
import { FOLDER_MIME, quoted } from "./drivesync.mjs";

export class DriveFiles {
  // token(): the access token (a promise), or null when there's none.
  // stale(): the token was refused - have another ready for the next ask.
  constructor({ token, stale = () => {}, fetchImpl = (...a) => fetch(...a), endpoints = GOOGLE } = {}) {
    Object.assign(this, { token, stale, fetchImpl, endpoints });
  }

  // One request, the token got again once if Google says it's run out.
  async ask(method, url, { json = null, body = null, type = null } = {}) {
    for (let attempt = 0; ; attempt++) {
      const token = await this.token();
      if (!token) throw { error: "signin" };
      const headers = { Authorization: `Bearer ${token}` };
      if (json) headers["Content-Type"] = "application/json; charset=UTF-8";
      else if (type) headers["Content-Type"] = type;
      let res;
      try {
        res = await this.fetchImpl(url, { method, headers, body: json ? JSON.stringify(json) : body });
      } catch {
        throw { error: "offline" };
      }
      if (res.status === 401) {
        this.stale();
        if (attempt === 0) continue;
        throw { error: "signin", status: 401 };
      }
      return res;
    }
  }
  async askJson(method, url, opts) {
    const res = await this.ask(method, url, opts);
    if (!res.ok) throw { error: `http ${res.status}`, status: res.status };
    return res.json();
  }

  // Whose Drive it is: the account's email, or null.
  async whose() {
    const r = await this.askJson("GET", `${this.endpoints.driveUrl}/about?fields=user(emailAddress)`);
    return typeof r.user?.emailAddress === "string" ? r.user.emailAddress : null;
  }

  // A folder by its name in another ("root": the Drive itself), or null.
  async findFolder(title, parent = "root") {
    const q = `name = ${quoted(title)} and mimeType = '${FOLDER_MIME}' and ${quoted(parent)} in parents and trashed = false`;
    const r = await this.askJson("GET", `${this.endpoints.driveUrl}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive&pageSize=10`);
    return r.files?.[0]?.id ?? null;
  }
  async makeFolder(title, parent = "root") {
    return (await this.askJson("POST", `${this.endpoints.driveUrl}/files?fields=id`, { json: { name: title, mimeType: FOLDER_MIME, parents: [parent] } })).id;
  }
  // Found, or made.
  async folder(title, parent = "root") {
    return (await this.findFolder(title, parent)) ?? (await this.makeFolder(title, parent));
  }

  // Every file in a folder: [{ id, name, md5 }] (md5: the file's version -
  // it changes when the file does).
  async list(folder) {
    const files = [];
    let page = null;
    do {
      const q = `${quoted(folder)} in parents and trashed = false`;
      const r = await this.askJson("GET", `${this.endpoints.driveUrl}/files?q=${encodeURIComponent(q)}&fields=nextPageToken,files(id,name,mimeType,md5Checksum,modifiedTime)&spaces=drive&pageSize=1000${page ? `&pageToken=${encodeURIComponent(page)}` : ""}`);
      for (const f of r.files ?? []) if (f.mimeType !== FOLDER_MIME) files.push({ id: f.id, name: f.name, md5: f.md5Checksum ?? f.modifiedTime ?? null });
      page = r.nextPageToken ?? null;
    } while (page);
    return files;
  }

  // What a file is now: { id, name, md5, trashed }, or null when it's gone
  // for good.
  async info(id) {
    const res = await this.ask("GET", `${this.endpoints.driveUrl}/files/${encodeURIComponent(id)}?fields=id,name,trashed,md5Checksum,modifiedTime`);
    if (res.status === 404) return null;
    if (!res.ok) throw { error: `http ${res.status}`, status: res.status };
    const f = await res.json();
    return { id: f.id, name: f.name, md5: f.md5Checksum ?? f.modifiedTime ?? null, trashed: !!f.trashed };
  }

  // A file's text, or null when it's gone.
  async read(id) {
    const res = await this.ask("GET", `${this.endpoints.driveUrl}/files/${encodeURIComponent(id)}?alt=media`);
    if (res.status === 404) return null;
    if (!res.ok) throw { error: `http ${res.status}`, status: res.status };
    return res.text();
  }

  // A new file: { id, md5 }.
  async create(folder, name, text, type = "text/plain") {
    const boundary = `a2golf${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
    const meta = { name, parents: [folder], mimeType: type };
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${type}; charset=UTF-8\r\n\r\n${text}\r\n--${boundary}--`;
    const r = await this.askJson("POST", `${this.endpoints.uploadUrl}/files?uploadType=multipart&fields=id,md5Checksum`, { body, type: `multipart/related; boundary=${boundary}` });
    return { id: r.id, md5: r.md5Checksum ?? (await this.info(r.id))?.md5 ?? null };
  }

  // A file's text replaced: { id, md5 }, or null when the file's gone.
  async update(id, text, type = "text/plain") {
    const res = await this.ask("PATCH", `${this.endpoints.uploadUrl}/files/${encodeURIComponent(id)}?uploadType=media&fields=id,md5Checksum`, { body: text, type: `${type}; charset=UTF-8` });
    if (res.status === 404) return null;
    if (!res.ok) throw { error: `http ${res.status}`, status: res.status };
    const r = await res.json();
    return { id, md5: r.md5Checksum ?? (await this.info(id))?.md5 ?? null };
  }

  // Into Drive's bin (there 30 days, to be put back by hand). Gone already
  // is fine.
  async trash(id) {
    const res = await this.ask("PATCH", `${this.endpoints.driveUrl}/files/${encodeURIComponent(id)}?fields=id`, { json: { trashed: true } });
    if (!res.ok && res.status !== 404) throw { error: `http ${res.status}`, status: res.status };
  }
}
