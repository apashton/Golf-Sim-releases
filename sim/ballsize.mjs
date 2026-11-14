// How big the ball is drawn. On the ground (tee, fairway, rough, green,
// at rest or rolling) it is a real ball: 42.67 mm across. In the air it
// eases up to the larger size the flight can be followed at, and back
// down as it lands. height: metres above the ground.

export const REAL_BALL_R = 0.021335;
export const FLIGHT_BALL_R = 0.045;
const FULL_BY = 10;

// flight: the size it eases up to (a mode can follow it bigger: the range).
export function ballDrawRadius({ air = false, height = 0, flight = FLIGHT_BALL_R } = {}) {
  if (!air || !(height > 0)) return REAL_BALL_R;
  const k = Math.min(1, height / FULL_BY);
  return REAL_BALL_R + (flight - REAL_BALL_R) * k;
}
