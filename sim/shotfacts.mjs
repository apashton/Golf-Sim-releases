// Each shot's own facts - its number, when it came, the launch monitor's
// club data, whether it was a made-up swing - kept with that shot, so the
// one a mode records is the one it played. (A chip still rolling when the
// next shot comes is recorded inside that next shot's handling: it must be
// kept as the chip it was - a mouse swing, its own number - not take on the
// new shot's facts.)
//
// arrive(facts) as a shot comes in -> its key, carried on the shot
// (entry.factsKey); played(key) as it's handed to the mode; playing() the
// facts of the shot being played (a mode that records at once - the range);
// of(key) a shot's own (a mode recording a ball that was still rolling when
// the next came); clubData(shotNumber, data) the club data that follows a
// shot by a moment.
export class ShotFacts {
  constructor(keep = 20) {
    this.keep = keep;
    this.list = []; // [{ key, facts }], oldest first
    this.seq = 0;
    this.current = null;
  }

  arrive(facts) {
    const key = ++this.seq;
    this.list.push({ key, facts: { ...facts } });
    while (this.list.length > this.keep) this.list.shift();
    return key;
  }

  played(key) {
    this.current = key;
  }

  playing() {
    return this.of(this.current);
  }

  // A shot's facts by its key (a mode that records a ball after the next
  // shot has come gives its own shot's key: chipping, putting, the course).
  of(key) {
    return this.list.find((x) => x.key === key)?.facts ?? null;
  }

  clubData(shotNumber, data) {
    for (const x of this.list) if (x.facts.shotNumber === shotNumber) x.facts.clubData = data;
  }
}
