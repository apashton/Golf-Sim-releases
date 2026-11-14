// The command centre's side drawers (arrange.js, sidedrawer.js): which
// boxes are in each, and in which of its tabs (the owner, 16 October 2026:
// "Need to be able to put any box into the sidebar option and even have
// multiple sidebar tabs"). There are two: down the right, the cards, the
// keys, the shot history and whatever the player puts there; down the
// left, the mode's own options (the owner, the same day: "left-hand side
// tabs for mode-specific options ... you've got your keys, your general
// options on the right-hand side"). Each is kept as this says, the right
// as the ccDrawer setting and the left as ccDrawerLeft.
// Any box but the top bar's halves can go in: dropped on the drawer or one
// of its tabs, or sent there from its frame or the Arrange menu. The cards
// from the game window are the drawer's own, at the top of whichever tab
// is open. Pure, for the page and the tests.
//
// What's kept (for each drawer, the same in every mode):
//   { open, tab, tabs: [{ id, name, boxes: [key...], w }], out: [key...], sized: { key: { h, z } } }
//   open   true / false as the player left it, or null: closed (it opens
//          over the boxes, so it starts out of their way)
//   tab    the tab showing
//   tabs   each tab's boxes in order, top to bottom; name null: named
//          by what's in it (tabWords); w the drawer's width on that tab, a
//          share of the window's (null: as wide as the window says)
//   out    boxes that start in the drawer (the keys, the shot history, a
//          mode's options: their "home") taken out of it by the player
//   sized  a box's height in the drawer (h, a share of the drawer's; none:
//          as tall as what's in it) and text size (z) where the player has
//          set them (the owner, 16 October 2026: "can't seem to maximize the
//          length of it or change the shape of it ... the options one, I'd
//          just like to be full screen")
// A box is known by its key: the top bar's and the controls window's own
// boxes by their id, a mode's section by its mode and name ("course:Options").

export const DRAWER_TABS = { most: 6, name: 24, sized: 120, wMin: 0.12, wMax: 0.95, hMin: 0.05, zMin: 0.6, zMax: 3 };

let made = 0;
const newId = (tabs) => {
  for (;;) {
    const id = `t${Date.now().toString(36)}${(made++).toString(36)}`;
    if (!tabs.some((t) => t.id === id)) return id;
  }
};

// A tab's name as typed: trimmed, no longer than DRAWER_TABS.name; empty is
// none (named by what's in it).
export function tabName(name) {
  const s = typeof name === "string" ? name.replace(/\s+/g, " ").trim().slice(0, DRAWER_TABS.name) : "";
  return s || null;
}

// The drawer as it starts: one tab, nothing taken out, open or closed as
// the window's width says.
export function defaultDrawer() {
  return { open: null, tab: "t1", tabs: [{ id: "t1", name: null, boxes: [], w: null }], out: [], sized: {} };
}

const num = (v) => typeof v === "number" && Number.isFinite(v);
const round = (v) => Math.round(v * 1000) / 1000;
// A tab's width as kept: a share of the window's, or null.
const cleanWidth = (w) => (num(w) ? round(Math.min(DRAWER_TABS.wMax, Math.max(DRAWER_TABS.wMin, w))) : null);
// A box's size in the drawer as kept: { h, z }, either left out for as it
// comes (as tall as what's in it; text as it is), null for neither.
function cleanSize(s) {
  if (!s || typeof s !== "object") return null;
  const out = {};
  if (num(s.h) && s.h > 0) out.h = round(Math.min(1, Math.max(DRAWER_TABS.hMin, s.h)));
  if (num(s.z) && Math.abs(s.z - 1) > 1e-6) out.z = round(Math.min(DRAWER_TABS.zMax, Math.max(DRAWER_TABS.zMin, s.z)));
  return Object.keys(out).length ? out : null;
}

// What's kept, made sound: the old { open } setting (before tabs) taken
// as it was, every box in one tab at most, at least one tab, the tab
// showing one of them.
export function cleanDrawer(d) {
  const out = defaultDrawer();
  if (!d || typeof d !== "object") return out;
  if (typeof d.open === "boolean") out.open = d.open;
  const seen = new Set();
  const keyOk = (k) => typeof k === "string" && k.length > 0 && k.length < 200;
  if (Array.isArray(d.tabs)) {
    const tabs = [];
    for (const t of d.tabs.slice(0, DRAWER_TABS.most)) {
      if (!t || typeof t !== "object") continue;
      const id = typeof t.id === "string" && t.id && !tabs.some((x) => x.id === t.id) ? t.id : newId(tabs);
      const boxes = (Array.isArray(t.boxes) ? t.boxes : []).filter((k) => keyOk(k) && !seen.has(k));
      for (const k of boxes) seen.add(k);
      tabs.push({ id, name: tabName(t.name), boxes, w: cleanWidth(t.w) });
    }
    if (tabs.length) out.tabs = tabs;
  }
  out.tab = out.tabs.some((t) => t.id === d.tab) ? d.tab : out.tabs[0].id;
  out.out = [...new Set((Array.isArray(d.out) ? d.out : []).filter((k) => keyOk(k) && !seen.has(k)))];
  if (d.sized && typeof d.sized === "object") {
    for (const [k, v] of Object.entries(d.sized).slice(0, DRAWER_TABS.sized)) {
      const c = keyOk(k) ? cleanSize(v) : null;
      if (c) out.sized[k] = c;
    }
  }
  return out;
}

// The tab a box is in, or null. home: it starts in the drawer (the keys,
// the shot history, a mode's options); placed: the player has put it
// somewhere else in the window (before tabs, taking it out of the drawer
// was only that). A box at home is in the first tab until it's taken out.
export function tabOf(d, key, { home = false, placed = false } = {}) {
  for (const t of d.tabs) if (t.boxes.includes(key)) return t.id;
  if (home && !placed && !d.out.includes(key)) return d.tabs[0].id;
  return null;
}

// A box into a tab (the one showing, if none is said), at `index` among
// its boxes (the end, if none is said) - out of any other tab first.
export function putIn(d, key, tab = d.tab, index = Infinity) {
  const to = d.tabs.some((t) => t.id === tab) ? tab : d.tab;
  const tabs = d.tabs.map((t) => ({ ...t, boxes: t.boxes.filter((k) => k !== key) }));
  const t = tabs.find((x) => x.id === to);
  t.boxes.splice(Math.max(0, Math.min(index, t.boxes.length)), 0, key);
  return { ...d, tabs, out: d.out.filter((k) => k !== key) };
}

// A box taken out of the drawer, to be placed in the window.
export function takeOut(d, key) {
  return { ...d, tabs: d.tabs.map((t) => ({ ...t, boxes: t.boxes.filter((k) => k !== key) })), out: d.out.includes(key) ? d.out : [...d.out, key] };
}

// A new tab, shown: { drawer, id } - id null if there are as many as can be.
export function addTab(d, name = null) {
  if (d.tabs.length >= DRAWER_TABS.most) return { drawer: d, id: null };
  const id = newId(d.tabs);
  return { drawer: { ...d, tabs: [...d.tabs, { id, name: tabName(name), boxes: [], w: null }], tab: id }, id };
}

export function renameTab(d, id, name) {
  return { ...d, tabs: d.tabs.map((t) => (t.id === id ? { ...t, name: tabName(name) } : t)) };
}

// A tab taken away: its boxes go to the first of the others (nothing's
// lost). The last tab stays.
export function removeTab(d, id) {
  if (d.tabs.length < 2 || !d.tabs.some((t) => t.id === id)) return d;
  const gone = d.tabs.find((t) => t.id === id);
  const tabs = d.tabs.filter((t) => t.id !== id).map((t, i) => (i === 0 ? { ...t, boxes: [...t.boxes, ...gone.boxes] } : t));
  return { ...d, tabs, tab: d.tab === id ? tabs[0].id : d.tab };
}

export function showTab(d, id) {
  return d.tabs.some((t) => t.id === id) ? { ...d, tab: id } : d;
}

// The drawer's width on a tab (dragged by its edge while arranging): a
// share of the window's width; null, as wide as the window says.
export function tabWidth(d, id, w) {
  return { ...d, tabs: d.tabs.map((t) => (t.id === id ? { ...t, w: cleanWidth(w) } : t)) };
}

// A box's size in the drawer: { h, z } as kept, or {} as it comes.
export function sizeOf(d, key) {
  return d.sized?.[key] ?? {};
}
// A box's height in the drawer (h: a share of its height; null, as tall as
// what's in it) or text size (z; 1, as it is) set - whichever is given.
export function sizeBox(d, key, { h, z } = {}) {
  const was = sizeOf(d, key);
  const next = cleanSize({ h: h === undefined ? was.h : h, z: z === undefined ? was.z : z });
  const sized = { ...(d.sized ?? {}) };
  if (next) sized[key] = next;
  else delete sized[key];
  return { ...d, sized };
}

// A tab's name: its own, else what's in it ("Keys · Shot history"), else
// "Empty tab". names: the names of the boxes in it showing now.
export function tabWords(tab, names = []) {
  if (tab?.name) return tab.name;
  const list = [...new Set(names.filter(Boolean))];
  if (!list.length) return "Empty tab";
  const s = list.join(" · ");
  return s.length > 40 ? `${list[0]} +${list.length - 1}` : s;
}

// The order of a tab's boxes showing now, top to bottom: those it lists, in
// its order, then those there by home (the keys, then a mode's options,
// then the shot history, as the drawer always had them). showing: [{ key,
// home }] (arrange.js's boxes call their home "drawer").
export function tabOrder(tab, showing) {
  const listed = tab.boxes.filter((k) => showing.some((b) => b.key === k));
  const homeOf = (b) => b.home ?? b.drawer;
  const homed = showing
    .filter((b) => !tab.boxes.includes(b.key))
    .sort((a, b) => homeRank(homeOf(a)) - homeRank(homeOf(b)));
  return [...listed.map((k) => showing.find((b) => b.key === k)), ...homed];
}
const homeRank = (home) => (home === "keys" ? 0 : home === "options" ? 1 : home === "history" ? 2 : 3);

// ---- The two drawers -------------------------------------------------------------------------

export const SIDES = ["right", "left"];

// Which drawer a box starts in (its home): the cards, the keys and the shot
// history the right; a mode's options the left; anything else neither.
// b: { kind, drawer } as arrange.js's boxes have them.
export function homeSide(b) {
  if (!b) return null;
  if (b.kind === "messages" || b.drawer === "cards" || b.drawer === "keys" || b.drawer === "history") return "right";
  if (b.drawer === "options") return "left";
  return null;
}

// Which drawer and tab a box is in, or null: { side, tab }. drawers: {
// right, left }. Put in one by the player, that one; else its home's first
// tab, until it's taken out of it or placed somewhere by hand.
export function whereIn(drawers, key, { home = null, placed = false } = {}) {
  for (const side of SIDES) {
    const t = drawers[side]?.tabs.find((x) => x.boxes.includes(key));
    if (t) return { side, tab: t.id };
  }
  if (!SIDES.includes(home) || !drawers[home]) return null;
  const tab = tabOf(drawers[home], key, { home: true, placed });
  return tab ? { side: home, tab } : null;
}

// A box into one drawer's tab (putIn): out of the other - and no longer at
// home there, if that's where it starts - so it's in the one it was put in.
export function moveInto(drawers, key, side, tab, index = Infinity, home = null) {
  const other = side === "left" ? "right" : "left";
  const there = drawers[other];
  const left = home === other ? takeOut(there, key) : { ...there, tabs: there.tabs.map((t) => ({ ...t, boxes: t.boxes.filter((k) => k !== key) })) };
  return { ...drawers, [side]: putIn(drawers[side], key, tab, index), [other]: left };
}
