import { describe, expect, it } from "vitest";
import { followShot, HOME_SHOT } from "./cameraFollow";
import { BALL_RADIUS, FRONT_ROW_Z, verticalFovFor } from "./laneLayout";
import { ballPose } from "./rollAnimation";
import { BALL_TRAVEL_MS, ROLL_TOTAL_MS } from "./timing";

const at = (ms: number) => followShot(ms, ballPose(ms));

/** Where the ball's lowest point is on screen: 0 top, 1 bottom edge. */
function ballBottomOnScreen(ms: number, aspect: number): number {
  const ball = ballPose(ms);
  const { position: p, target: t } = at(ms);
  const pitch = Math.atan2(t[1] - p[1], Math.hypot(t[0] - p[0], t[2] - p[2]));
  const down = Math.atan2(ball.y - BALL_RADIUS - p[1], Math.hypot(ball.x - p[0], ball.z - p[2]));
  const half = (verticalFovFor(aspect) * Math.PI) / 360;
  return 0.5 - Math.tan(down - pitch) / Math.tan(half) / 2;
}

describe("follow camera", () => {
  it("is at the bowler's end before and after a roll", () => {
    expect(at(0)).toEqual(HOME_SHOT);
    expect(at(Number.POSITIVE_INFINITY)).toEqual(HOME_SHOT);
    const end = at(ROLL_TOTAL_MS);
    end.position.forEach((v, i) => expect(v).toBeCloseTo(HOME_SHOT.position[i]!, 5));
  });

  it("chases the ball down the lane and never flies into the rack", () => {
    const early = at(500).position[2];
    const hit = at(BALL_TRAVEL_MS).position[2];
    expect(hit).toBeLessThan(early);
    for (let ms = 0; ms <= ROLL_TOTAL_MS; ms += 50) expect(at(ms).position[2]).toBeGreaterThan(FRONT_ROW_Z + 1.5);
  });

  it("keeps the ball in the picture all the way to the pins, on any screen shape", () => {
    for (const aspect of [1.4, 1.8, 2.1, 2.4, 3]) {
      for (let ms = 0; ms <= BALL_TRAVEL_MS; ms += 50) {
        const y = ballBottomOnScreen(ms, aspect);
        expect(y, `${ms} ms at ${aspect}:1`).toBeLessThan(0.97);
        expect(y, `${ms} ms at ${aspect}:1`).toBeGreaterThan(0.1);
      }
    }
  });
});
