// A ladder match's result that couldn't be sent (the relay out of reach, the
// connection down): kept with the ladders, by the ladder's code, and sent
// again the next time the ladder's asked about (opening the panel, Refresh).
// unsent: { [code]: [{ match, scores }] } - kept as plain data, saved with
// the ladders.

// The list with this result kept (one per match: a later one replaces it).
export function keepUnsent(unsent, code, match, scores) {
  const out = { ...(unsent ?? {}) };
  out[code] = [...(out[code] ?? []).filter((r) => r.match !== match), { match, scores }];
  return out;
}

// The results still to send for a ladder.
export function unsentFor(unsent, code) {
  return [...(unsent?.[code] ?? [])];
}

// The list with a result sent (gone from it); a ladder left with none drops out.
export function sentNow(unsent, code, match) {
  const out = { ...(unsent ?? {}) };
  const left = (out[code] ?? []).filter((r) => r.match !== match);
  if (left.length) out[code] = left;
  else delete out[code];
  return out;
}

// As read back from the saved ladders: anything that isn't a kept result
// dropped.
export function cleanUnsent(kept) {
  const out = {};
  if (!kept || typeof kept !== "object" || Array.isArray(kept)) return out;
  for (const [code, list] of Object.entries(kept)) {
    if (!/^L[A-Z0-9]{5}$/.test(code) || !Array.isArray(list)) continue;
    const ok = list.filter((r) => r && typeof r.match === "string" && r.match && r.scores && typeof r.scores === "object");
    if (ok.length) out[code] = ok.map(({ match, scores }) => ({ match, scores }));
  }
  return out;
}
