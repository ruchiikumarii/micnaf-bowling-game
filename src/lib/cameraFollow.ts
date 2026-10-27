import { CAMERA, FRONT_ROW_Z } from "@/lib/laneLayout";
import { BALL_TRAVEL_MS, PIN_SETTLE_MS } from "@/lib/timing";

type V3 = readonly [number, number, number];

export interface CameraShot {
  position: V3;
  target: V3;
}

export const HOME_SHOT: CameraShot = { position: CAMERA.position, target: CAMERA.target };

/** How long the camera takes to pick up the ball after release. */
const PICK_UP_MS = 650;
/** How long it takes to fly home before the result shows. */
const RETURN_MS = 900;
/** Close-up of the rack: the camera stops this far in front of the head pin. */
const CLOSEST_Z = FRONT_ROW_Z + 1.9;
/** Rumble on impact. */
const SHAKE_MS = 450;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/**
 * The follow camera during a roll: it picks up the ball, chases it down the
 * lane from behind and above, holds a close-up of the rack while the pins
 * fall, then flies home before the result. A pure function of the roll time
 * and the ball's position, so every roll is filmed the same way.
 */
export function followShot(elapsedMs: number, ball: { x: number; z: number }, strike = false): CameraShot {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return HOME_SHOT;
  const chaseZ = Math.max(CLOSEST_Z, ball.z + 2.3);
  const chase: CameraShot = {
    position: [ball.x * 0.45, 0.95 + (chaseZ - CLOSEST_Z) * 0.12, chaseZ],
    target: [ball.x * 0.25, 0.12, FRONT_ROW_Z - 1.1],
  };
  const settleEnd = BALL_TRAVEL_MS + PIN_SETTLE_MS;
  const w = smooth(clamp01(elapsedMs / PICK_UP_MS)) * (1 - smooth(clamp01((elapsedMs - (settleEnd - RETURN_MS)) / RETURN_MS)));
  let position = mix(HOME_SHOT.position, chase.position, w);
  const target = mix(HOME_SHOT.target, chase.target, w);

  const hit = elapsedMs - BALL_TRAVEL_MS;
  if (hit > 0 && hit < SHAKE_MS) {
    const fade = 1 - hit / SHAKE_MS;
    const amp = (strike ? 0.035 : 0.018) * fade * fade;
    position = [position[0] + Math.sin(hit * 0.11) * amp, position[1] + Math.cos(hit * 0.13) * amp, position[2]];
  }
  return { position, target };
}
