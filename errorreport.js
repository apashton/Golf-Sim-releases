// Catches JavaScript errors on this page and tells the local server
// (POST /api/client-error). In the Windows app they're kept for a report to
// Claude, and sent by themselves if automatic reports are on (see "Reports
// to Claude" in the README); in a browser the server just keeps the last few.
//
// Loaded first on every page, as a plain script rather than a module, so it
// is already listening when the page's own code starts - and still works if
// that code fails to load at all.

(() => {
  const page = location.pathname.replace(/^\/+/, "") || "index.html";
  // Enough to see what went wrong; a page stuck in a loop of errors stops
  // there rather than flooding anything.
  const MAX_PER_PAGE = 10;
  let sent = 0;
  const seen = new Set();

  function send(problem) {
    const key = `${problem.message}|${problem.source}|${problem.line}`;
    if (sent >= MAX_PER_PAGE || seen.has(key)) return;
    seen.add(key);
    sent++;
    try {
      fetch("/api/client-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, ...problem }),
        // Still delivered if the error is followed by the page going away.
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Nothing to be done; never let reporting cause an error of its own.
    }
  }

  window.addEventListener("error", (e) => {
    // A picture, sound or stylesheet that didn't load (a missing favicon,
    // say) isn't a JavaScript error: it arrives as a plain Event with no
    // message, and is ignored.
    if (!(e instanceof ErrorEvent) || (!e.error && !e.message)) return;
    // "Script error." with nothing else is a script from another site that
    // won't say what went wrong; there's nothing useful to report.
    if (!e.error && /^Script error\.?$/.test(e.message)) return;
    const err = e.error;
    send({
      kind: "error",
      message: String(e.message || (err && `${err.name}: ${err.message}`) || "Error"),
      stack: err && err.stack ? String(err.stack) : "",
      source: e.filename || "",
      line: e.lineno || null,
      column: e.colno || null,
    });
  });

  // A script that didn't load - or a file one of its modules imports, which
  // fails the whole of it - stops the page's code before it runs, and comes
  // only as a plain error on its <script>: said, with its name (a beta once
  // wouldn't start for a file the installer left out, and said nothing).
  window.addEventListener(
    "error",
    (e) => {
      const el = e.target;
      if (!el || el.tagName !== "SCRIPT") return;
      const src = String(el.src || "an inline script").replace(location.origin, "");
      send({ kind: "error", message: `A script didn't load: ${src}${el.type === "module" ? " (or a file it imports)" : ""}`, stack: "", source: src, line: null, column: null });
    },
    true,
  );

  // Once the page is on its way out (going to another page, the window
  // closing), a request it still had going is cut off by the browser and
  // comes back as "Failed to fetch": not a problem, just the page leaving.
  let leaving = false;
  window.addEventListener("pagehide", () => (leaving = true));

  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason;
    // A request cancelled on purpose isn't a problem.
    if (r && r.name === "AbortError") return;
    if (leaving && r && r.name === "TypeError" && /Failed to fetch|NetworkError|Load failed/.test(r.message)) return;
    let message;
    if (r instanceof Error) message = `${r.name}: ${r.message}`;
    else {
      try {
        message = typeof r === "string" ? r : JSON.stringify(r);
      } catch {
        message = String(r);
      }
    }
    send({
      kind: "rejection",
      message: `Unhandled promise rejection: ${message || "(no reason given)"}`,
      stack: r && r.stack ? String(r.stack) : "",
      source: "",
      line: null,
      column: null,
    });
  });
})();
