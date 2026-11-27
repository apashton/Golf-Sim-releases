// The ideal line of a putt, drawn on the green: from the ball into the hole
// along `points` (world: THREE.Vector3s or [x, y, z], a little above the
// ground) - dashes a few pixels wide wherever they are, as the grid's
// lines are (greengrid.js Ribbons; sim/greenread.mjs READ_LINE, lineDashes),
// so the line reads all the way down a long putt. The course's greens and
// the practice green draw the same.
import { Ribbons, ribbonMaterial, PLAIN } from "../greengrid.js";
import { READ_LINE, lineDashes } from "../sim/greenread.mjs";

export function readLine(points) {
  const ribbons = new Ribbons();
  for (const run of lineDashes(points.map((p) => (Array.isArray(p) ? p : [p.x, p.y, p.z])))) ribbons.add(run, PLAIN);
  const mesh = ribbons.mesh(ribbonMaterial(0xffffff, { widthPx: READ_LINE.px }));
  // With the tracers and after them: over the putts' lines left on the
  // green, not under.
  mesh.renderOrder = 3;
  return mesh;
}
