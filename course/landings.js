// What a shot leaves in the sand and the water (the owner, 21 October 2026:
// "a puff of sand when a ball lands in a bunker, the mark it leaves in the
// sand, ripples and a wet edge where a ball goes into water"): as it's
// struck out of a bunker, the sand it blasts out and the scoop it takes;
// each time it comes down in sand, a puff and a dent; going into water, the
// rings (Ultra: look/sandwater.js), a splash, and the bank splashed dark if
// it went in close; and a plugged ball's crater round it. The sprays on
// Medium and up (look/sprays.js), the marks on Ultra (look/marks.js).

import * as THREE from "three";
import { splashWater } from "../look/sandwater.js";
import { pitchMarkFor, craterFor, scoopFor, eggFor, SAND_LIES } from "../sim/marks.mjs";
import { sandPuff, sandBlast, waterSplash, wetEdge, spraySeed } from "../sim/sprays.mjs";
import { toWorld } from "../scenery.js";

const spot = new THREE.Vector3();

export class CourseLandings {
  // Where on the drawn ground (x, z: the hole's frame), in the world.
  groundSpot([x, z]) {
    return toWorld(x, this.surfaceHeight(x, z), z, spot.clone());
  }

  // The way a shot's aim heads, in the world (x, z).
  aimHeading(aim) {
    return [Math.sin(aim), -Math.cos(aim)];
  }

  // A shot just struck by player p (shot: its { from, lie, putt, aim },
  // speedMph: the ball's): out of sand, the sand it blasts out and the
  // scoop it takes - more from a plugged ball, dug out.
  shotStruck(p, shot, speedMph) {
    if (shot.putt || !SAND_LIES.has(shot.lie)) return;
    const plug = p.plug ?? null;
    this.marks?.scoop(shot.from, shot.aim, scoopFor({ lie: shot.lie, speedMph, plug }));
    this.sprays?.throw(this.groundSpot(shot.from), sandBlast({ speedMph, heading: this.aimHeading(shot.aim), plug }, spraySeed(...shot.from, 1)));
  }

  // One of a flying shot's cues come due (audio/cues.mjs): where it comes
  // down in sand, on the green or into water.
  shotCue(c, shot) {
    const at = [c.at[0], c.at[2]];
    if (c.kind === "splash" || (c.kind === "land" && c.lie === "water")) {
      // Rings spreading where it goes in (Ultra), a splash, and the bank
      // splashed dark if it's close.
      splashWater(this.ball.position.x, this.ball.position.z, c.speed);
      const surface = this.groundSpot(at);
      this.sprays?.throw(surface, waterSplash(c, spraySeed(...at, 2)));
      const wet = wetEdge((x, z) => this.hole.lieAt(x, z) !== "water", at, c);
      if (wet) this.sprays?.wet(this.groundSpot(wet.at), wet.r);
      return;
    }
    if (c.kind === "land" && SAND_LIES.has(c.lie)) {
      this.sprays?.throw(this.groundSpot(at), sandPuff(c, this.aimHeading(shot.aim), spraySeed(...at, 3 + (c.bounce ?? 0))));
      this.marks?.crater(at, craterFor(c));
      return;
    }
    // A pitch mark where it comes down on the green.
    this.marks?.pitch(at, pitchMarkFor(c));
  }

  // A shot come to rest plugged in the sand (sim/sand.mjs): its crater.
  shotPlugged(ball, plug) {
    this.marks?.egg(ball, eggFor(plug));
  }
}
