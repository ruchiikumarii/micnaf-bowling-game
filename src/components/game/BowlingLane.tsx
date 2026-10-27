"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { BRAND, SCENE } from "@/lib/brand";
import {
  ARROWS_Z,
  DECK_END_Z,
  FRONT_ROW_Z,
  FOUL_LINE_Z,
  GUTTER_WIDTH,
  LANE_HALF_WIDTH,
  LANE_NEAR_Z,
  PIT_BACK_Z,
} from "@/lib/laneLayout";
import { createWoodTexture } from "./sceneAssets";

const LANE_THICKNESS = 0.05;
const LANE_LENGTH = LANE_NEAR_Z - DECK_END_Z;
const LANE_CENTER_Z = (LANE_NEAR_Z + DECK_END_Z) / 2;
const LANE_WIDTH = LANE_HALF_WIDTH * 2;
const KICKBACK_LENGTH = FRONT_ROW_Z + 0.5 - PIT_BACK_Z;
const KICKBACK_CENTER_Z = PIT_BACK_Z + KICKBACK_LENGTH / 2;
/** World length one repeat of the wood texture covers. */
const WOOD_REPEAT_LENGTH = 2.6;

function makeArrowShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.07);
  s.lineTo(-0.028, -0.05);
  s.lineTo(0.028, -0.05);
  s.closePath();
  return s;
}

export function BowlingLane() {
  const wood = useMemo(() => {
    const tex = createWoodTexture();
    tex.repeat.set(1, LANE_LENGTH / WOOD_REPEAT_LENGTH);
    return tex;
  }, []);

  // The lane's body; its top is a separate mirror-polished plane (below).
  const laneMaterials = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7a4f27", roughness: 0.6 }), []);

  const arrowGeometry = useMemo(() => new THREE.ShapeGeometry(makeArrowShape()), []);

  useEffect(
    () => () => {
      wood.dispose();
      laneMaterials.dispose();
      arrowGeometry.dispose();
    },
    [wood, laneMaterials, arrowGeometry],
  );

  const gutterX = LANE_HALF_WIDTH + GUTTER_WIDTH / 2;
  const arrows = [-3, -2, -1, 0, 1, 2, 3];

  return (
    <group>
      {/* Lane bed */}
      <mesh
        position={[0, -LANE_THICKNESS / 2 - 0.001, LANE_CENTER_Z]}
        material={laneMaterials}
      >
        <boxGeometry args={[LANE_WIDTH, LANE_THICKNESS, LANE_LENGTH]} />
      </mesh>
      {/* Freshly oiled boards: the ball, the pins and the neon reflect in them. */}
      <mesh position={[0, 0, LANE_CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[LANE_WIDTH, LANE_LENGTH]} />
        <MeshReflectorMaterial
          map={wood}
          resolution={1024}
          blur={[500, 160]}
          mixBlur={1}
          mixStrength={1.1}
          mixContrast={1}
          mirror={0.4}
          depthScale={0.4}
          minDepthThreshold={0.6}
          maxDepthThreshold={1.2}
          roughness={0.35}
          metalness={0}
        />
      </mesh>

      {/* Foul line: a red neon bar */}
      <mesh position={[0, 0.0015, FOUL_LINE_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[LANE_WIDTH, 0.02]} />
        <meshBasicMaterial color="#ff3b47" toneMapped={false} />
      </mesh>

      {/* Targeting arrows, in the classic shallow V */}
      {arrows.map((i) => (
        <mesh
          key={i}
          geometry={arrowGeometry}
          position={[i * 0.205, 0.0015, ARROWS_Z - Math.abs(i) * 0.16]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial color={BRAND.gold} toneMapped={false} />
        </mesh>
      ))}

      {/* Gutters */}
      {[-1, 1].map((side) => (
        <mesh key={`g${side}`} position={[side * gutterX, -0.06, LANE_CENTER_Z]} receiveShadow>
          <boxGeometry args={[GUTTER_WIDTH, 0.02, LANE_LENGTH]} />
          <meshStandardMaterial color={SCENE.gutter} roughness={0.35} metalness={0.5} />
        </mesh>
      ))}

      {/* Kickback walls either side of the pin deck */}
      {[-1, 1].map((side) => (
        <mesh key={`k${side}`} position={[side * (LANE_HALF_WIDTH + GUTTER_WIDTH + 0.02), 0.28, KICKBACK_CENTER_Z]}>
          <boxGeometry args={[0.04, 0.66, KICKBACK_LENGTH]} />
          <meshStandardMaterial color={SCENE.gutter} roughness={0.9} />
        </mesh>
      ))}

      {/* Pit and back curtain */}
      <mesh position={[0, -0.35, (DECK_END_Z + PIT_BACK_Z) / 2]}>
        <boxGeometry args={[LANE_WIDTH + GUTTER_WIDTH * 2, 0.1, PIT_BACK_Z - DECK_END_Z]} />
        <meshStandardMaterial color="#0b1030" roughness={1} />
      </mesh>
      <mesh position={[0, 0.2, PIT_BACK_Z]}>
        <planeGeometry args={[3.2, 1.2]} />
        <meshStandardMaterial color="#0d143a" roughness={1} />
      </mesh>
    </group>
  );
}
