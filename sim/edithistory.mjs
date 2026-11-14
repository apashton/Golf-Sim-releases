// Undo and redo for changing a hole by hand (holeeditor.js), kept per hole.
//
// A history is the hole's list of hand changes as it was after each step,
// oldest first, each named for what that step did ("move bunker"), and
// where along them the hole is now, and which hole they were made on:
//   { steps: [{ name, edits }], at, base }
// `base` stands for the hole as designed, before any hand changes (the
// designer passes the course's creation time and the layout's seed): a
// course made again under the same name, or a hole given a new layout,
// is a different hole, and its history starts afresh rather than offering
// to redo changes made to the old one.
// steps[0] is how the hole was when the history began (no name). Undo is
// one step back, redo one forward, and any step can be gone back to at
// once; a new change after going back drops the steps that were undone,
// as undo does everywhere.
//
// Whole lists rather than differences, so going back is always exact and a
// history can't get out of step with the hole; they are short (see
// holeedits.mjs). Kept in the browser (localStorage) so undo still works
// after saving and coming back to the page, bounded so it never grows
// without end. Pure functions but for the storage handed in.

// Steps kept per hole (the oldest go first), and how many holes' worth.
export const MAX_STEPS = 40;
export const MAX_HOLES = 24;
// Roughly how many characters all the histories may take in storage (well
// inside the 5 million or so a browser allows a site). A green shaped by
// hand takes a few thousand a step, so this keeps ten or so holes' worth
// of shaping as well as the rest.
export const MAX_CHARS = 2_500_000;
export const STORE_KEY = "golfsim.handHistory";

export function newHistory(edits = [], base = "") {
  return { steps: [{ name: "", edits }], at: 0, base };
}

const same = (a, b) => JSON.stringify(a ?? []) === JSON.stringify(b ?? []);

// A new step: the hole's changes are now `edits`, by doing `name`.
export function record(h, name, edits) {
  const steps = [...h.steps.slice(0, h.at + 1), { name, edits }];
  while (steps.length > MAX_STEPS) steps.shift();
  return { ...h, steps, at: steps.length - 1 };
}

export const canUndo = (h) => h.at > 0;
export const canRedo = (h) => h.at < h.steps.length - 1;
// What undo would take back, and what redo would do again.
export const undoName = (h) => (canUndo(h) ? h.steps[h.at].name : null);
export const redoName = (h) => (canRedo(h) ? h.steps[h.at + 1].name : null);

// Straight to step i: its changes are the hole's now.
export function goTo(h, i) {
  const at = Math.max(0, Math.min(h.steps.length - 1, i));
  return { h: { ...h, at }, edits: h.steps[at].edits };
}
export const undo = (h) => goTo(h, h.at - 1);
export const redo = (h) => goTo(h, h.at + 1);

// The steps for a list, newest first: { i, name, now, undone } - `now` the
// step the hole is at, `undone` the ones after it that redo would bring
// back. Where the history began is "Before these changes"; once older
// steps have been let go, the oldest kept goes by its own name.
export function listSteps(h, most = 20) {
  const out = [];
  for (let i = h.steps.length - 1; i >= 0 && out.length < most; i--) {
    const name = h.steps[i].name || "Before these changes";
    out.push({ i, name, now: i === h.at, undone: i > h.at });
  }
  return out;
}

// A history picked up again for a hole whose changes are `edits` now. If
// they're one of its steps (as saved, or an older one if the last changes
// weren't saved), it carries on from there - the unsaved ones can be
// brought back with redo. If not (changed some other way), or it was kept
// for a different hole under the same name (`base`), a fresh one.
export function resume(saved, edits = [], base = "") {
  if (!valid(saved) || (saved.base ?? "") !== base) return newHistory(edits, base);
  if (same(saved.steps[saved.at].edits, edits)) return { steps: saved.steps, at: saved.at, base };
  for (let i = saved.steps.length - 1; i >= 0; i--) if (same(saved.steps[i].edits, edits)) return { steps: saved.steps, at: i, base };
  return newHistory(edits, base);
}

function valid(h) {
  return (
    h &&
    Array.isArray(h.steps) &&
    h.steps.length > 0 &&
    h.steps.every((s) => s && typeof s.name === "string" && Array.isArray(s.edits)) &&
    Number.isInteger(h.at) &&
    h.at >= 0 &&
    h.at < h.steps.length
  );
}

// ---- Keeping them ------------------------------------------------------------------

// All the histories kept in `storage` (localStorage, or anything with
// getItem and setItem): { [course#hole]: { steps, at, base, t } }. Nothing if
// storage can't be read.
export function loadAll(storage) {
  try {
    const all = JSON.parse(storage.getItem(STORE_KEY) ?? "{}");
    return all && typeof all === "object" && !Array.isArray(all) ? all : {};
  } catch {
    return {};
  }
}

export function loadHistory(storage, key, edits = [], base = "") {
  return resume(unpack(loadAll(storage)[key]), edits, base);
}

// A green's shape (holeedits.mjs "gh") is the one big edit, and most steps
// leave it as it was (moving a stamp, digging a bunker): kept, a step's
// shape heights that are the same as the step before's are written "=".
function pack(h) {
  let last = null;
  const steps = h.steps.map((st) => ({
    ...st,
    edits: st.edits.map((e) => {
      if (e?.k !== "gh" || typeof e.d !== "string") return e;
      const same = e.d === last;
      last = e.d;
      return same ? { ...e, d: "=" } : e;
    }),
  }));
  return { ...h, steps };
}
function unpack(h) {
  if (!valid(h)) return h;
  let last = null;
  const steps = h.steps.map((st) => ({
    ...st,
    edits: st.edits.map((e) => {
      if (e?.k !== "gh") return e;
      if (e.d === "=") return last ? { ...e, d: last } : e;
      last = e.d;
      return e;
    }),
  }));
  return { ...h, steps };
}

// Keeps one hole's history with the rest. The holes worked on longest ago
// go first when there are too many or they take too much room, then the
// oldest steps of this one; if storage still refuses it, it's left
// unsaved (undo still works until the page is left).
export function saveHistory(storage, key, h, now = Date.now()) {
  const all = loadAll(storage);
  all[key] = { ...pack({ steps: h.steps }), at: h.at, base: h.base ?? "", t: now };
  const keys = Object.keys(all).sort((a, b) => (all[b].t ?? 0) - (all[a].t ?? 0));
  for (const k of keys.slice(MAX_HOLES)) delete all[k];
  let text = JSON.stringify(all);
  for (const k of keys.slice(1, MAX_HOLES).reverse()) {
    if (text.length <= MAX_CHARS) break;
    delete all[k];
    text = JSON.stringify(all);
  }
  const mine = all[key];
  // (Dropping steps from the front: the new first one says its shape in
  // full again.)
  const drop = (n) => {
    mine.steps = pack({ steps: unpack({ steps: mine.steps, at: 0 }).steps.slice(n) }).steps;
    mine.at -= n;
    text = JSON.stringify(all);
  };
  while (text.length > MAX_CHARS && mine.at > 0) drop(1);
  for (;;) {
    try {
      storage.setItem(STORE_KEY, text);
      return true;
    } catch {
      // Full: let the older half of this hole's steps go and try again,
      // down to just where it is now.
      const n = Math.min(mine.at, Math.ceil(mine.steps.length / 2));
      if (!n) break;
      drop(n);
    }
  }
  return false;
}

// ---- What a step is called -------------------------------------------------------

// A short name for a hand change, for "Undo: move bunker". The editor
// names the ones it knows more about (deeper or shallower, a bigger green).
export function stepName(e) {
  const n = e.p?.length ?? 0;
  switch (e.k) {
    case "t+":
      return n === 1 ? "plant a tree" : "plant trees";
    case "t-":
      return n === 1 ? "take a tree away" : "take trees away";
    case "d+":
      return "place decor";
    case "d-":
      return "take decor away";
    case "dm":
      return "move decor";
    case "tm":
      return n === 1 ? "move a tree" : "move trees";
    case "ts":
      return e.f > 1 ? "make trees taller" : "make trees shorter";
    case "edge": {
      const what = { fw: "the fairway", cut: "the first cut", deep: "the deep rough" }[e.band] ?? "an edge";
      if (e.smooth) return `smooth ${what}`;
      if (e.band === "deep") return e.a > 0 ? "move the deep rough out" : "bring the deep rough in";
      return e.a > 0 ? `widen ${what}` : `narrow ${what}`;
    }
    case "fwn":
      return e.on ? "give the fairway a natural line" : "give the fairway even edges";
    case "pots":
      return "make the bunkers pots";
    case "tg":
      return "grow the trees afresh";
    case "sig":
      return e.on ? "put back the signature tree" : "take away the signature tree";
    case "bstyle":
      return { classic: "give the bunkers classic shapes", rugged: "give the bunkers rugged edges", modern: "give the bunkers sweeping shapes" }[e.s] ?? "restyle the bunkers";
    case "lk":
      return e.look ? "make it a links hole" : "make it a parkland hole";
    case "tv":
      return e.shape === null ? "give trees their own shapes" : n === 1 ? "change a tree's shape" : "give trees one shape";
    case "tk":
      return e.kind === null ? "let trees grow as they would" : n === 1 ? "change a tree's kind" : "change trees' kind";
    case "b":
      if (e.wall != null) return e.wall === 0 ? "take the wall away" : "change the wall";
      if (e.join != null) return e.join ? "join bunker to the green" : "set bunker next to the green";
      return e.dig != null ? "change bunker depth" : e.f ? "resize bunker" : "move bunker";
    case "b+":
      return "add bunker";
    case "b-":
      return "remove bunker";
    case "w":
      if (e.wall != null) return e.wall === 0 ? "take the wall away" : "change the wall edge";
      if (e.h) return "reshape water";
      return e.f ? "resize water" : "move water";
    case "w+":
      return "add pond";
    case "w-":
      return "remove water";
    case "a":
      if (e.h) return "reshape a fairway";
      return e.f ? "resize a fairway" : "move a fairway";
    case "a+":
      return "add a fairway";
    case "cw":
      return "shape the causeway";
    case "a-":
      return "remove a fairway";
    case "g":
      return "reshape green";
    case "pin":
      return "move pin";
    case "tilt":
      return e.n > 0 ? "tilt green" : "level green";
    case "bump":
      return e.a > 0 ? "raise bumps" : "dip hollows";
    case "fw":
    case "f":
      return "fairway width";
    case "f-":
      return "remove fairway";
    case "gh":
      return "shape the green";
    case "p+":
      return "add a cart path";
    case "p-":
      return "remove the cart path";
    case "p":
      if (e.add) return "bend the cart path";
      if (e.drop) return "straighten the cart path";
      if (e.m != null) return "change the cart path's surface";
      return e.all ? "move the cart path" : "move part of the cart path";
    case "pa":
      return e.s < 0 ? "cart path on the left" : e.s > 0 ? "cart path on the right" : "no cart path";
    case "r+":
      return "add a brook";
    case "r-":
      return "remove the brook";
    case "r":
      if (e.banks) return e.banks.length ? "wall the brook's banks" : "take the brook's walls off";
      if (e.kind != null) return "change the brook's kind";
      if (e.w != null) return "brook width";
      return "move the brook";
    default:
      return "change";
  }
}
