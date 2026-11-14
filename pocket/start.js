// The Android app's game page starts with this, before any of the game's
// own code (tools/androidweb.mjs puts it first in the page): there's no PC
// server on a phone, so the page's requests to /api/... and its event
// streams (/events, /api/play/events) are answered by the pocket server in
// the page (sim/pocketserver.mjs, set up by pocket.mjs) instead of going
// over the network. Everything else - the game's own files - loads as
// usual. Nothing in the game changes for it.
(function () {
  if (window.pocket) return;
  // The page is the app's (style.css: the swing pad sized for a thumb).
  document.documentElement.classList.add("pocket");
  // (No start screen: the app opens straight into the game, its loading
  // screen first - phonehome.js.)
  const realFetch = window.fetch.bind(window);
  const RealEventSource = window.EventSource;

  // A request for the server: same place, /api/... or /events.
  function forPocket(url) {
    try {
      const u = new URL(url, location.href);
      return u.origin === location.origin && (u.pathname.startsWith("/api/") || u.pathname === "/events") ? u : null;
    } catch {
      return null;
    }
  }

  // (In the app's bundled page the bundle hands it over - pocket/bundled.js,
  // tools/androidweb.mjs - rather than its files loading one by one.)
  const ready = (window.pocketBundled ? new Promise((resolve) => (window.pocketModule = resolve)) : import("/pocket/pocket.mjs")).then((m) => m.start());
  window.pocket = { ready };
  ready.catch((err) => console.error("The pocket server didn't start:", err));

  window.fetch = function (input, init) {
    const raw = typeof input === "string" || input instanceof URL ? String(input) : input?.url;
    const url = forPocket(raw);
    if (!url) return realFetch(input, init);
    return ready.then((p) => p.fetch(url, input, init));
  };

  // An event stream from the pocket server, as an EventSource behaves:
  // "open", then each event as it comes; close() stops it.
  class PocketEventSource extends EventTarget {
    constructor(url) {
      super();
      this.url = url.href;
      this.readyState = 0;
      this.withCredentials = false;
      this.onopen = null;
      this.onmessage = null;
      this.onerror = null;
      this.stop = null;
      ready.then(
        (p) => {
          if (this.readyState === 2) return;
          this.readyState = 1;
          this.emit("open", new Event("open"));
          this.stop = p.subscribe(url.pathname, (type, data) => this.emit(type, new MessageEvent(type, { data: JSON.stringify(data) })));
        },
        () => {
          this.readyState = 2;
          this.emit("error", new Event("error"));
        },
      );
    }
    emit(type, event) {
      this.dispatchEvent(event);
      const own = this[`on${type}`];
      if (typeof own === "function") own.call(this, event);
    }
    close() {
      this.readyState = 2;
      this.stop?.();
      this.stop = null;
    }
  }
  PocketEventSource.CONNECTING = 0;
  PocketEventSource.OPEN = 1;
  PocketEventSource.CLOSED = 2;

  function EventSourceForPage(url, options) {
    const u = forPocket(url);
    return u ? new PocketEventSource(u) : new RealEventSource(url, options);
  }
  EventSourceForPage.CONNECTING = 0;
  EventSourceForPage.OPEN = 1;
  EventSourceForPage.CLOSED = 2;
  window.EventSource = EventSourceForPage;

  // A beacon to the server (a recording's last word) goes nowhere here.
  if (navigator.sendBeacon) {
    const realBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, data) => (forPocket(url) ? true : realBeacon(url, data));
  }
})();
