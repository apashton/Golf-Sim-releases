// Work over a list a few at a time: at most `most` of fn's promises waiting
// at once, the answers in the list's order. (The PC's sounds decoded at the
// first click - over a hundred at once held the page.)
export async function inTurn(list, most, fn) {
  const out = new Array(list.length);
  let next = 0;
  const worker = async () => {
    while (next < list.length) {
      const i = next++;
      out[i] = await fn(list[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(most, list.length)) }, worker));
  return out;
}
