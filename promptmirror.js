// The game window's prompts on the controls window too. With the screens
// separate (screens.js), the cards show on the game window, where the mat
// can see them - and the laptop, where the mouse is, would otherwise show
// none of them. So each one is copied onto the controls window as it
// changes: the range's "Odd shot?" card, a celebration's banner, a game's
// results and its ladder, the course's cards, the keys list. A click on a
// copy is passed to the original, where it lands at the same place, so a
// card answered on the laptop is the same card answered on the projector.
// The cards go at the top of the command centre's Messages box (the owner,
// 16 October 2026: pinned there while they want an answer); the keys list
// over the whole window, as on the game window.
//
// The copies are only ever drawn from the originals: nothing on the
// controls window has a say of its own.

export class PromptMirror {
  // sources(): the elements to copy, in the order they're shown, top
  // first. Asked again now and then, so one made later (a mode's first
  // celebration) joins in.
  // shown(any): after each change, whether any copy is showing.
  constructor({ sources, shown = () => {} }) {
    this.sources = sources;
    this.shown = shown;
    this.doc = null;
    this.box = null;
    this.copies = new Map();
    this.dirty = new Set();
    this.onInput = (e) => this.markDirty(e.currentTarget);
  }

  get attached() {
    return !!this.box;
  }

  // Starts copying onto a document (the controls window's): into `into`,
  // an element of it (the Messages box's cards, at its top), or its body.
  attach(doc, { into = null } = {}) {
    this.detach();
    if (!doc?.body) return;
    this.doc = doc;
    this.box = doc.createElement("div");
    this.box.className = "prompt-mirror";
    (into?.ownerDocument === doc ? into : doc.body).appendChild(this.box);
    this.box.addEventListener("click", (e) => this.click(e));
    this.observer = new MutationObserver((records) => {
      for (const r of records) {
        for (const src of this.copies.keys()) if (src === r.target || src.contains(r.target)) this.markDirty(src);
      }
    });
    this.watch();
    this.timer = setInterval(() => this.watch(), 1000);
  }

  // Stops, and takes the copies away.
  detach() {
    clearInterval(this.timer);
    this.observer?.disconnect();
    this.observer = null;
    for (const src of this.copies.keys()) src.removeEventListener("input", this.onInput);
    this.copies.clear();
    this.dirty.clear();
    if (this.box) this.shown(false);
    this.box?.remove();
    this.box = null;
    this.doc = null;
  }

  // Picks up any source not being copied yet.
  watch() {
    if (!this.box) return;
    const now = this.sources();
    // And lets go of one that's gone (a card closed and taken off the
    // page): its copy went on showing, as it was when it went.
    let gone = false;
    for (const [src, rec] of this.copies) {
      if (src.isConnected && now.includes(src)) continue;
      src.removeEventListener("input", this.onInput);
      rec.copy.remove();
      this.copies.delete(src);
      gone = true;
    }
    if (gone) this.shown([...this.copies.values()].some(({ copy }) => !copy.hidden));
    for (const src of now) {
      if (!src || this.copies.has(src)) continue;
      const copy = this.doc.createElement("div");
      this.copies.set(src, { copy });
      this.box.appendChild(copy);
      this.observer.observe(src, { attributes: true, childList: true, subtree: true, characterData: true });
      // Typing in a box (the Omni's carry) isn't a change to the page.
      src.addEventListener("input", this.onInput);
      this.markDirty(src);
    }
  }

  markDirty(src) {
    if (!this.box) return;
    this.dirty.add(src);
    // Straight after whatever changed it (the changes come in batches
    // already): not the next frame or a timer, which a browser slows right
    // down in a window it thinks nobody is looking at.
    if (this.queued) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      this.sync();
    });
  }

  // Brings each changed copy up to date: shown or not, its look, what's in
  // it, and what's typed in its boxes.
  sync() {
    for (const src of this.dirty) {
      const rec = this.copies.get(src);
      if (!rec) continue;
      const { copy } = rec;
      const shown = isShown(src);
      copy.hidden = !shown;
      if (!shown) continue;
      // Changed in place, never rebuilt: a card's timer bar changes every
      // frame, and a button replaced between press and release would lose
      // the click.
      morph(copy, src, { root: true });
      const from = src.querySelectorAll("input, select, textarea");
      const to = copy.querySelectorAll("input, select, textarea");
      from.forEach((el, i) => {
        if (to[i] && to[i].value !== el.value) to[i].value = el.value;
      });
    }
    this.dirty.clear();
    this.shown([...this.copies.values()].some(({ copy }) => !copy.hidden));
  }

  // A click on a copy: the same click on the original, at the same place
  // in it (a mark on the face picture lands where it was clicked).
  click(e) {
    const top = e.target.closest?.(".prompt-mirror > *");
    if (!top) return;
    const src = [...this.copies].find(([, rec]) => rec.copy === top)?.[0];
    if (!src) return;
    e.preventDefault();
    const at = counterpart(top, src, e.target);
    const from = e.target.getBoundingClientRect();
    const to = at.getBoundingClientRect();
    const share = (v, lo, size) => (size > 0 ? Math.min(1, Math.max(0, (v - lo) / size)) : 0.5);
    const clientX = to.left + share(e.clientX, from.left, from.width) * to.width;
    const clientY = to.top + share(e.clientY, from.top, from.height) * to.height;
    const win = at.ownerDocument.defaultView;
    at.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, clientX, clientY, view: win }));
  }
}

// Attributes a copy keeps its own way: no ids (one page mustn't have two of
// one), its own shown-or-not, and boxes and buttons that don't take the
// keyboard (the keys still reach the original).
const OWN = new Set(["id", "hidden", "tabindex", "readonly"]);

// Makes `copy` match `src` - its attributes, text and children, all the way
// down - changing only what differs.
function morph(copy, src, { root = false } = {}) {
  for (const a of [...copy.attributes]) {
    if (!OWN.has(a.name) && !src.hasAttribute(a.name)) copy.removeAttribute(a.name);
  }
  for (const a of src.attributes) {
    if (OWN.has(a.name) && (a.name !== "hidden" || root)) continue;
    if (copy.getAttribute(a.name) !== a.value) copy.setAttribute(a.name, a.value);
  }
  if (copy.hasAttribute("id")) copy.removeAttribute("id");
  // Hidden inside it (the card's list of clubs) is as the original has it.
  if (!root && copy.hasAttribute("hidden") !== src.hasAttribute("hidden")) copy.toggleAttribute("hidden", src.hasAttribute("hidden"));
  if (/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/i.test(copy.tagName) && copy.getAttribute("tabindex") !== "-1") copy.setAttribute("tabindex", "-1");
  if (/^(INPUT|TEXTAREA)$/i.test(copy.tagName) && !copy.hasAttribute("readonly")) copy.setAttribute("readonly", "");
  const from = src.childNodes;
  const to = copy.childNodes;
  for (let i = 0; i < from.length; i++) {
    const s = from[i];
    const d = to[i];
    if (!d || d.nodeType !== s.nodeType || d.nodeName !== s.nodeName) {
      const fresh = copy.ownerDocument.importNode(s, false);
      if (d) copy.replaceChild(fresh, d);
      else copy.appendChild(fresh);
      if (s.nodeType === 1) morph(fresh, s);
      continue;
    }
    if (s.nodeType === 1) morph(d, s);
    else if (d.nodeValue !== s.nodeValue) d.nodeValue = s.nodeValue;
  }
  while (to.length > from.length) copy.removeChild(copy.lastChild);
}

// Whether the original is showing: not hidden (nor anything round it), and
// a toast only while it's up.
function isShown(el) {
  if (el.hidden || el.closest("[hidden]")) return false;
  if (el.classList.contains("bay-toast")) return el.classList.contains("show");
  return true;
}

// The element in the original at the same place as `node` is in the copy
// (by its position among its parent's children, all the way down); the
// original itself if the two have drifted apart.
function counterpart(copyTop, srcTop, node) {
  const path = [];
  for (let n = node; n && n !== copyTop; n = n.parentElement) {
    const parent = n.parentElement;
    if (!parent) return srcTop;
    path.unshift([...parent.children].indexOf(n));
  }
  let at = srcTop;
  for (const i of path) {
    const next = at.children[i];
    if (!next) return at;
    at = next;
  }
  return at;
}
