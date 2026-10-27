import { describe, expect, it } from "vitest";
import { followShot, HOME_SHOT } from "./cameraFollow";
import { FRONT_ROW_Z } from "./laneLayout";
import { ballPose } from "./rollAnimation";
import { BALL_TRAVEL_MS, ROLL_TOTAL_MS } from "./timing";

const at = (ms: number) => followShot(ms, ballPose(ms));

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
});
