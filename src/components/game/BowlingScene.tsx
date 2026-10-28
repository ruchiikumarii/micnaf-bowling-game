"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { CONVENTIONAL_BALLS } from "@/data/gameData";
import { BRAND } from "@/lib/brand";
import { CAMERA, FRONT_ROW_Z, introBallX, verticalFovFor } from "@/lib/laneLayout";
import { BALL_COLORS } from "@/lib/drugVisuals";
import { followShot, HOME_SHOT } from "@/lib/cameraFollow";
import { ballLineFor, ballPose, STRAIGHT_LINE } from "@/lib/rollAnimation";
import type { DrugId, GamePhase, LanePins, Pin } from "@/types/game";
import { BowlingArena } from "./BowlingArena";
import { BowlingBall } from "./BowlingBall";
import { BowlingLane } from "./BowlingLane";
import { PinDeck } from "./PinDeck";
import { PinSetter } from "./PinSetter";
import { elapsedMs, SceneTimelineContext, useSceneTimeline, type SceneTimeline } from "./sceneClock";

export interface BowlingSceneProps {
  phase: GamePhase;
  /** Selected drug: sets the ball colour. */
  ballDrug: DrugId | null;
  /** Every pin's state for this throw (up, down or wobble). */
  lane: LanePins;
  rollStartedAt: number | null;
  /** Fixes the ball's curved line (shared by both throws of a session). */
  lineSeed: number | null;
  /** The swipe's direction for this throw (null: none). */
  lineAim?: number | null;
  /** The first throw's ball: fixes the line through the rack (shared by both throws). */
  lineDrug: DrugId | null;
  /** When the transition's rack reset started, if it has. */
  rackResetAt?: number | null;
  interactive: boolean;
  onPinSelect: (pin: Pin) => void;
  onContextLost?: () => void;
  /** Called once the WebGL renderer is up. */
  onReady?: () => void;
  /** Swipe progress 0..1, written by the swipe overlay. */
  aimRef: MutableRefObject<number>;
  /** True while the player is dragging the ball (renders every frame). */
  aiming: boolean;
  /** The camera follows the ball during a roll (off with reduced motion). */
  followCam?: boolean;
}

/**
 * The camera: framed from the bowler's end between rolls (where the pin tags
 * and the swipe line up with it), and following the ball during a roll.
 */
function CameraRig({ follow }: { follow: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const timeline = useSceneTimeline();
  useEffect(() => {
    camera.position.set(...CAMERA.position);
    camera.fov = verticalFovFor(size.width / Math.max(size.height, 1));
    camera.near = 0.1;
    camera.far = 40;
    camera.lookAt(...CAMERA.target);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  useFrame(() => {
    const t = timeline.current;
    let shot = HOME_SHOT;
    if (follow && t.phase === "rolling") {
      const elapsed = elapsedMs(t, performance.now());
      const line = t.lineSeed === null ? STRAIGHT_LINE : ballLineFor(t.lineSeed, t.lineDrug, t.lineAim);
      shot = followShot(elapsed, ballPose(elapsed, line), t.strike);
    }
    camera.position.set(...shot.position);
    camera.lookAt(...shot.target);
  });
  return null;
}

/** Renders a fresh frame whenever the game state changes in demand mode. */
function Invalidator({ deps }: { deps: unknown[] }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return null;
}

function ContextLossWatcher({ onLost }: { onLost?: () => void }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    if (!onLost) return;
    const el = gl.domElement;
    const handler = (e: Event) => {
      e.preventDefault();
      onLost();
    };
    el.addEventListener("webglcontextlost", handler);
    return () => el.removeEventListener("webglcontextlost", handler);
  }, [gl, onLost]);
  return null;
}

function Lights() {
  const key = useRef<THREE.DirectionalLight>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const targets: THREE.Object3D[] = [];
    if (key.current) {
      key.current.target.position.set(0, 0, -1.6);
      targets.push(key.current.target);
    }
    if (spot.current) {
      spot.current.target.position.set(0, 0, FRONT_ROW_Z - 0.2);
      targets.push(spot.current.target);
    }
    targets.forEach((t) => scene.add(t));
    return () => targets.forEach((t) => scene.remove(t));
  }, [scene]);

  return (
    <>
      <hemisphereLight args={["#c9d2ff", "#2a1d2c", 0.4]} />
      {/* Gold glow from the kickback trims onto the rack. */}
      {[-1, 1].map((side) => (
        <pointLight key={side} position={[side * 1.05, 0.55, FRONT_ROW_Z - 1]} color={BRAND.gold} intensity={1.4} distance={2.4} decay={1.5} />
      ))}
      {/* Soft fill from behind the camera so ball colours read true. */}
      <pointLight position={[0.5, 1.1, 2.3]} intensity={2.2} decay={1.2} />
      <directionalLight
        ref={key}
        position={[1.2, 5, 1.8]}
        intensity={1.05}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-1.8}
        shadow-camera-right={1.8}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={1}
        shadow-camera-far={12}
      />
      <spotLight
        ref={spot}
        position={[0, 2.3, FRONT_ROW_Z + 0.9]}
        angle={0.72}
        penumbra={0.9}
        intensity={7}
        decay={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0003}
      />
      <Environment resolution={256} frames={1} environmentIntensity={0.45}>
        <Lightformer form="rect" intensity={2.4} position={[0, 5, -4]} rotation-x={Math.PI / 2} scale={[3, 12, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[-4, 2, -3]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[4, 2, -3]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="ring" intensity={1.2} position={[0, 2, 4]} scale={2} />
      </Environment>
    </>
  );
}

export default function BowlingScene(props: BowlingSceneProps) {
  const { phase, ballDrug, lane, rollStartedAt, lineSeed, lineAim = null, lineDrug, rackResetAt = null, interactive, onPinSelect, onContextLost, onReady, aimRef, aiming, followCam = false } =
    props;

  // The second throw is at the rack exactly as the first left it: no sweep (client request).
  const sweeping = false;
  const strike = Object.values(lane).every((s) => s === "down");
  const timeline = useRef<SceneTimeline>({ phase, rollStartedAt, lineSeed, lineAim, lineDrug, rackResetAt, sweeping, strike, aim: aimRef });
  timeline.current = { phase, rollStartedAt, lineSeed, lineAim, lineDrug, rackResetAt, sweeping, strike, aim: aimRef };

  return (
    <SceneTimelineContext.Provider value={timeline}>
      <Canvas
        shadows="soft"
        dpr={[1, 2]}
        frameloop={phase === "rolling" || phase === "transition" || aiming ? "always" : "demand"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [...CAMERA.position], fov: 30 }}
        className="!absolute inset-0"
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
          onReady?.();
        }}
      >
        <CameraRig follow={followCam} />
        <Invalidator deps={[phase, ballDrug, lane, rollStartedAt, aiming]} />
        <ContextLossWatcher onLost={onContextLost} />
        <Lights />
        <fog attach="fog" args={["#060a22", 19, 44]} />
        <BowlingArena title="CABP CHALLENGE" />
        <BowlingLane />
        <PinDeck
          lane={lane}
          interactive={interactive}
          onPinSelect={onPinSelect}
        />
        <PinSetter />
        {/* Intro: Player 1's two balls line up. In play, only the ball being rolled is on the lane. */}
        {phase === "intro"
          ? CONVENTIONAL_BALLS.map((id, i) => <BowlingBall key={id} color={BALL_COLORS[id]} offsetX={introBallX(i, CONVENTIONAL_BALLS.length)} still />)
          : ballDrug && <BowlingBall color={BALL_COLORS[ballDrug]} />}
      </Canvas>
    </SceneTimelineContext.Provider>
  );
}
